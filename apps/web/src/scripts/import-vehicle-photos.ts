/**
 * Imports openly licensed photos from Wikimedia Commons for the vehicle models listed below and
 * stores the author and licence as the photo credit (shown under the photo on the website).
 * Only licences that allow commercial use are accepted. Run with `pnpm vehicle-photos`;
 * models that already have a non-Commons photo are left alone.
 */
import config from '@payload-config'
import { getPayload } from 'payload'

/** Vehicle model slug → Wikimedia Commons files, in gallery order (the first one is the cover photo). */
const PHOTOS: Record<string, string[]> = {
  // Sold outside Turkey as the Fiat Tipo sedan.
  'fiat-egea': ['Fiat Tipo Sedan Facelift Leonberg 2022 1X7A0412.jpg', 'Fiat Tipo Sedan Facelift Leonberg 2022 1X7A0513.jpg'],
  'renault-clio': ['Renault Clio V 1X7A1978.jpg', 'Renault Clio V 1X7A1979.jpg', 'Renault Clio V 1X7A1980.jpg'],
  'toyota-corolla': ['Toyota Corolla Hybrid Sedan, GIMS 2019, Le Grand-Saconnex (GIMS1338).jpg', 'Toyota Corolla Limousine Hybrid Genf 2019 1Y7A5582.jpg'],
  'peugeot-3008': [
    'Peugeot 3008 BlueHDi 180 EAT8 GT (II) – Frontansicht, 25. November 2018, Düsseldorf.jpg',
    'Peugeot 3008 BlueHDi 180 EAT8 GT (II) – Heckansicht, 25. November 2018, Düsseldorf.jpg',
    'Peugeot 3008 BlueHDi 180 EAT8 GT (II) – Seitenansicht, 25. November 2018, Düsseldorf.jpg',
    'Peugeot 3008 BlueHDi 180 EAT8 GT (II) – Innenraum, 25. November 2018, Düsseldorf.jpg',
  ],
}

const ALLOWED_LICENCES = /^(CC0|Public domain|CC BY(-SA)? \d\.\d)/i
const SOURCE_PREFIX = 'commons-'
const USER_AGENT = 'rent-a-car-site/1.0 (vehicle photo import)'

type CommonsInfo = { url: string; page: string; artist: string; licence: string }

/** Commons rate-limits bursts with a plain-text 429; wait and retry. */
async function politeFetch(url: string): Promise<Response> {
  for (let attempt = 0; ; attempt++) {
    const response = await fetch(url, { headers: { 'User-Agent': USER_AGENT } })
    if (response.ok) return response
    if (attempt >= 5) throw new Error(`Commons request failed (${response.status}): ${url}`)
    await new Promise((resolve) => setTimeout(resolve, 5000 * (attempt + 1)))
  }
}

async function commonsInfo(title: string): Promise<CommonsInfo> {
  const params = new URLSearchParams({
    action: 'query',
    format: 'json',
    titles: `File:${title}`,
    prop: 'imageinfo',
    iiprop: 'url|extmetadata',
    iiurlwidth: '1920',
    iiextmetadatafilter: 'LicenseShortName|Artist',
  })
  const response = await politeFetch(`https://commons.wikimedia.org/w/api.php?${params}`)
  const page = Object.values((await response.json()).query.pages as Record<string, { imageinfo?: Record<string, unknown>[] }>)[0]
  const info = page?.imageinfo?.[0] as { thumburl: string; descriptionurl: string; extmetadata: Record<string, { value: string }> } | undefined
  if (!info) throw new Error(`Commons file not found: ${title}`)
  const artist = info.extmetadata.Artist?.value.replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim() || 'Unknown author'
  return { url: info.thumburl, page: info.descriptionurl, artist, licence: info.extmetadata.LicenseShortName?.value ?? '' }
}

const payload = await getPayload({ config })

async function importPhoto(title: string, alt: string, name: string): Promise<number | null> {
  const info = await commonsInfo(title)
  if (!ALLOWED_LICENCES.test(info.licence) || /NC|ND/.test(info.licence)) {
    payload.logger.warn(`Skipped "${title}": licence "${info.licence}" does not allow commercial use`)
    return null
  }
  const file = await politeFetch(info.url)
  const data = Buffer.from(await file.arrayBuffer())
  const extension = new URL(info.url).pathname.split('.').pop()?.toLowerCase() || 'jpg'
  const media = await payload.create({
    collection: 'media',
    data: { alt, credit: `${info.artist} / Wikimedia Commons, ${info.licence}`, creditUrl: info.page },
    file: { data, mimetype: file.headers.get('content-type') ?? 'image/jpeg', name: `${name}.${extension}`, size: data.length },
  })
  // Be gentle with the Commons API.
  await new Promise((resolve) => setTimeout(resolve, 1500))
  return media.id
}

for (const [slug, titles] of Object.entries(PHOTOS)) {
  const { docs } = await payload.find({ collection: 'vehicle-models', where: { slug: { equals: slug } }, depth: 1, limit: 1, locale: 'tr' })
  const model = docs[0]
  if (!model) {
    payload.logger.warn(`Skipped ${slug}: model not found`)
    continue
  }
  const current = (model.images ?? []).flatMap((image) => (typeof image === 'object' && image ? [image] : []))
  const ours = (filename: string | null | undefined) => Boolean(filename?.startsWith(SOURCE_PREFIX) || filename?.startsWith('illustration-'))
  if (!current.every((image) => ours(image.filename) || image.filename?.startsWith('car-front'))) {
    payload.logger.info(`Skipped ${slug}: has its own photos`)
    continue
  }

  const ids: number[] = []
  for (const [index, title] of titles.entries()) {
    const id = await importPhoto(title, `${model.brand} ${model.model}`, `${SOURCE_PREFIX}${slug}-${index + 1}`)
    if (id) ids.push(id)
  }
  if (ids.length === 0) continue
  await payload.update({ collection: 'vehicle-models', id: model.id, data: { images: ids } })
  // Generated illustrations and earlier Commons imports are ours to remove; other uploads stay in the library.
  for (const old of current) if (ours(old.filename)) await payload.delete({ collection: 'media', id: old.id })
  payload.logger.info(`${slug}: ${ids.length} photos`)
}

// Imports interrupted halfway leave unattached files behind.
const { docs: orphans } = await payload.find({ collection: 'media', where: { filename: { like: SOURCE_PREFIX } }, depth: 0, pagination: false })
for (const media of orphans) {
  const { totalDocs } = await payload.count({ collection: 'vehicle-models', where: { images: { contains: media.id } } })
  if (totalDocs === 0 && media.filename?.startsWith(SOURCE_PREFIX)) await payload.delete({ collection: 'media', id: media.id })
}

process.exit(0)
