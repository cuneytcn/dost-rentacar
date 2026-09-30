'use client'

import { Copy, ExternalLink, FileText, ImageIcon, Loader2, Trash2, Upload } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useRef, useState, useTransition } from 'react'
import { toast } from 'sonner'

import { DEFAULT_LOCALE, LOCALES, type Locale } from '@rent/shared'

import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { text } from '@/i18n/admin'
import { resizeImage } from '@/lib/resize-image'
import { cn } from '@/lib/utils'

import { formatDate } from '../format'
import { intlLocale } from '../lang'
import { useAdminLang, useT } from '../lang-context'
import { uploadFileAction } from '../resources/actions'
import { EmptyState } from '../shared/empty-state'
import { SearchInput } from '../shared/search-input'
import { TablePagination } from '../shared/table-pagination'
import { useQueryParams } from '../shared/use-query-params'
import { deleteLibraryItemAction, updateLibraryTextAction } from './actions'
import type { LibraryData, LibraryItem } from './data'

type Collection = 'media' | 'documents'

const copy = {
  search: text('Search file name or text…', 'Dosya adı veya metin ara…'),
  upload: text('Upload', 'Yükle'),
  uploading: text('Uploading…', 'Yükleniyor…'),
  uploaded: text('Uploaded', 'Yüklendi'),
  emptyMedia: text('No images yet', 'Henüz görsel yok'),
  emptyDocuments: text('No documents yet', 'Henüz belge yok'),
  emptyHint: text('Upload files or add them from vehicle, handover and payment screens.', 'Dosya yükleyin veya araç, teslim ve ödeme ekranlarından ekleyin.'),
  alt: text('Alternative text', 'Alternatif metin'),
  credit: text('Credit / licence', 'Kaynak / lisans'),
  creditHint: text('Required for licensed photos, e.g. “Jane Doe / Wikimedia Commons, CC BY-SA 4.0”.', 'Lisanslı fotoğraflarda zorunlu, ör. “Ad Soyad / Wikimedia Commons, CC BY-SA 4.0”.'),
  creditUrl: text('Credit link', 'Kaynak bağlantısı'),
  altHint: text('Describes the image for search engines and screen readers.', 'Görseli arama motorları ve ekran okuyucular için tanımlar.'),
  description: text('Description', 'Açıklama'),
  file: text('File', 'Dosya'),
  size: text('Size', 'Boyut'),
  dimensions: text('Dimensions', 'Ölçüler'),
  uploadedAt: text('Uploaded', 'Yükleme'),
  save: text('Save', 'Kaydet'),
  saved: text('Saved', 'Kaydedildi'),
  delete: text('Delete', 'Sil'),
  confirmDelete: text('Click again to delete', 'Silmek için tekrar tıklayın'),
  deleted: text('Deleted', 'Silindi'),
  copyUrl: text('Copy link', 'Bağlantıyı kopyala'),
  copied: text('Link copied', 'Bağlantı kopyalandı'),
  open: text('Open', 'Aç'),
}

function formatSize(bytes: number, lang: 'tr' | 'en'): string {
  const units = ['B', 'KB', 'MB']
  let value = bytes
  let unit = 0
  while (value >= 1024 && unit < units.length - 1) {
    value /= 1024
    unit++
  }
  return `${value.toLocaleString(intlLocale(lang), { maximumFractionDigits: unit === 0 ? 0 : 1 })} ${units[unit]}`
}

function DetailSheet({ collection, item, onClose }: { collection: Collection; item: LibraryItem; onClose: () => void }) {
  const t = useT()
  const lang = useAdminLang()
  const router = useRouter()
  const [values, setValues] = useState<Record<Locale, string>>(item.text)
  const [credit, setCredit] = useState(item.credit)
  const [creditUrl, setCreditUrl] = useState(item.creditUrl)
  const [armed, setArmed] = useState(false)
  const [pending, startTransition] = useTransition()
  const isImage = item.mimeType.startsWith('image/')
  const locales = collection === 'media' ? LOCALES : [DEFAULT_LOCALE]

  const save = () =>
    startTransition(async () => {
      const result = await updateLibraryTextAction({ collection, id: item.id, text: values, credit, creditUrl })
      if (!result.ok) return void toast.error(result.message)
      toast.success(t(copy.saved))
      router.refresh()
    })

  const remove = () => {
    if (!armed) return setArmed(true)
    startTransition(async () => {
      const result = await deleteLibraryItemAction({ collection, id: item.id })
      if (!result.ok) {
        setArmed(false)
        return void toast.error(result.message)
      }
      toast.success(t(copy.deleted))
      onClose()
      router.refresh()
    })
  }

  return (
    <Sheet open onOpenChange={(open) => !open && onClose()}>
      <SheetContent className="flex w-full flex-col gap-0 sm:max-w-md">
        <SheetHeader className="border-b">
          <SheetTitle className="truncate pr-6">{item.filename}</SheetTitle>
          <SheetDescription>{formatDate(item.createdAt, lang)}</SheetDescription>
        </SheetHeader>
        <div className="flex-1 space-y-5 overflow-y-auto p-4">
          <div className="bg-muted flex aspect-[4/3] items-center justify-center overflow-hidden rounded-lg border">
            {isImage ? (
              // eslint-disable-next-line @next/next/no-img-element -- admin preview
              <img src={item.url} alt="" className="size-full object-contain" />
            ) : (
              <FileText className="text-muted-foreground size-12" />
            )}
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" asChild>
              <a href={item.url} target="_blank" rel="noreferrer">
                <ExternalLink />
                {t(copy.open)}
              </a>
            </Button>
            {collection === 'media' && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  void navigator.clipboard.writeText(new URL(item.url, window.location.origin).toString())
                  toast.success(t(copy.copied))
                }}
              >
                <Copy />
                {t(copy.copyUrl)}
              </Button>
            )}
          </div>
          <div className="divide-y rounded-lg border text-sm">
            <div className="flex justify-between gap-4 px-3 py-2">
              <span className="text-muted-foreground">{t(copy.size)}</span>
              <span className="tabular-nums">{formatSize(item.filesize, lang)}</span>
            </div>
            {item.width && item.height && (
              <div className="flex justify-between gap-4 px-3 py-2">
                <span className="text-muted-foreground">{t(copy.dimensions)}</span>
                <span className="tabular-nums">
                  {item.width} × {item.height}
                </span>
              </div>
            )}
          </div>
          <Separator />
          <div className="space-y-3">
            <div>
              <Label>{t(collection === 'media' ? copy.alt : copy.description)}</Label>
              {collection === 'media' && <p className="text-muted-foreground mt-1 text-xs">{t(copy.altHint)}</p>}
            </div>
            {locales.map((locale) => (
              <div key={locale} className="flex items-center gap-2">
                {collection === 'media' && <span className="text-muted-foreground w-7 font-mono text-xs uppercase">{locale}</span>}
                <Input value={values[locale]} onChange={(event) => setValues({ ...values, [locale]: event.target.value })} />
              </div>
            ))}
          </div>
          {collection === 'media' && (
            <>
              <Separator />
              <div className="space-y-2">
                <div>
                  <Label htmlFor="media-credit">{t(copy.credit)}</Label>
                  <p className="text-muted-foreground mt-1 text-xs">{t(copy.creditHint)}</p>
                </div>
                <Input id="media-credit" value={credit} onChange={(event) => setCredit(event.target.value)} />
                <Label htmlFor="media-credit-url" className="pt-1">
                  {t(copy.creditUrl)}
                </Label>
                <Input id="media-credit-url" type="url" value={creditUrl} onChange={(event) => setCreditUrl(event.target.value)} placeholder="https://" />
              </div>
            </>
          )}
        </div>
        <SheetFooter className="flex-row justify-between border-t">
          <Button variant={armed ? 'destructive' : 'ghost'} onClick={remove} disabled={pending}>
            <Trash2 />
            {t(armed ? copy.confirmDelete : copy.delete)}
          </Button>
          <Button onClick={save} disabled={pending}>
            {pending && <Loader2 className="animate-spin" />}
            {t(copy.save)}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}

export function LibraryView({ collection, data }: { collection: Collection; data: LibraryData }) {
  const t = useT()
  const lang = useAdminLang()
  const router = useRouter()
  const { pending } = useQueryParams()
  const input = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(0)
  const [selected, setSelected] = useState<LibraryItem | null>(null)

  const upload = async (files: FileList | null) => {
    if (!files?.length) return
    const list = [...files]
    setUploading(list.length)
    let done = 0
    for (const file of list) {
      const formData = new FormData()
      formData.set('collection', collection)
      formData.set('file', file.type.startsWith('image/') ? await resizeImage(file, 2000, 0.85) : file)
      formData.set('label', file.name.replace(/\.\w+$/, ''))
      const result = await uploadFileAction(formData)
      if (result.ok) done++
      else toast.error(`${file.name}: ${result.message}`)
      setUploading((count) => count - 1)
    }
    if (done) toast.success(`${t(copy.uploaded)}: ${done}`)
    router.refresh()
  }

  return (
    <div className="flex flex-col gap-4 p-4 md:p-6">
      <div className="flex flex-wrap items-center gap-2">
        <SearchInput placeholder={t(copy.search)} className="w-full sm:w-80" />
        <Button className="ml-auto" onClick={() => input.current?.click()} disabled={uploading > 0}>
          {uploading > 0 ? <Loader2 className="animate-spin" /> : <Upload />}
          {t(uploading > 0 ? copy.uploading : copy.upload)}
        </Button>
        <input
          ref={input}
          type="file"
          multiple
          hidden
          accept={collection === 'media' ? 'image/*' : 'image/*,application/pdf'}
          onChange={(event) => {
            void upload(event.target.files)
            event.target.value = ''
          }}
        />
      </div>

      {data.items.length === 0 ? (
        <Card className="py-0">
          <EmptyState icon={collection === 'media' ? ImageIcon : FileText} title={t(collection === 'media' ? copy.emptyMedia : copy.emptyDocuments)} description={t(copy.emptyHint)} />
        </Card>
      ) : collection === 'media' ? (
        <div className={cn('grid grid-cols-2 gap-4 transition-opacity sm:grid-cols-3 lg:grid-cols-4 2xl:grid-cols-6', pending && 'opacity-60')}>
          {data.items.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setSelected(item)}
              className="group bg-card hover:border-primary/40 overflow-hidden rounded-xl border text-left transition-colors"
            >
              <div className="bg-muted aspect-[4/3] overflow-hidden">
                {/* eslint-disable-next-line @next/next/no-img-element -- admin thumbnail */}
                <img src={item.thumbnailUrl} alt="" className="size-full object-cover transition-transform group-hover:scale-[1.03]" />
              </div>
              <div className="space-y-0.5 p-3">
                <p className="truncate text-sm font-medium">{item.text[DEFAULT_LOCALE] || item.filename}</p>
                <p className="text-muted-foreground truncate text-xs tabular-nums">
                  {item.width && item.height ? `${item.width} × ${item.height} · ` : ''}
                  {formatSize(item.filesize, lang)}
                </p>
              </div>
            </button>
          ))}
        </div>
      ) : (
        <Card className={cn('overflow-hidden py-0 transition-opacity', pending && 'opacity-60')}>
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/40 hover:bg-muted/40">
                <TableHead className="w-16 pl-4">{t(copy.file)}</TableHead>
                <TableHead>{t(copy.description)}</TableHead>
                <TableHead className="text-right">{t(copy.size)}</TableHead>
                <TableHead className="pr-4 pl-8">{t(copy.uploadedAt)}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.items.map((item) => (
                <TableRow key={item.id} className="cursor-pointer" onClick={() => setSelected(item)}>
                  <TableCell className="pl-4">
                    {item.mimeType.startsWith('image/') ? (
                      // eslint-disable-next-line @next/next/no-img-element -- admin thumbnail
                      <img src={item.thumbnailUrl} alt="" className="h-9 w-12 rounded-md border object-cover" />
                    ) : (
                      <div className="bg-muted flex h-9 w-12 items-center justify-center rounded-md border">
                        <FileText className="text-muted-foreground size-4" />
                      </div>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="font-medium">{item.text[DEFAULT_LOCALE] || '—'}</div>
                    <div className="text-muted-foreground text-xs">{item.filename}</div>
                  </TableCell>
                  <TableCell className="text-right tabular-nums">{formatSize(item.filesize, lang)}</TableCell>
                  <TableCell className="pr-4 pl-8 tabular-nums">{formatDate(item.createdAt, lang)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}
      <TablePagination page={data.page} totalPages={data.totalPages} totalDocs={data.totalDocs} />
      {selected && <DetailSheet key={selected.id} collection={collection} item={selected} onClose={() => setSelected(null)} />}
    </div>
  )
}
