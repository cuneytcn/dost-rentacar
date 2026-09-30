/**
 * Fills empty vehicle model descriptions (all site languages) with short texts written for the
 * current fleet. Descriptions staff already wrote are never overwritten. Run with `pnpm seed:vehicle-texts`.
 */
import config from '@payload-config'
import { getPayload } from 'payload'

import { LOCALES, type Locale } from '@rent/shared'

const DESCRIPTIONS: Record<string, Record<Locale, string>> = {
  'fiat-egea': {
    tr: 'Fiat Egea, geniş bagajı ve düşük yakıt tüketimiyle en çok tercih edilen ekonomik sedanlardan biri. Dizel motor ve manuel vitesle şehir içinde de uzun yolda da masrafsız bir yolculuk sunar; klima, Bluetooth ve USB standarttır.',
    en: 'The Fiat Egea is one of the most popular economy saloons, with a large boot and low fuel consumption. Its diesel engine and manual gearbox keep costs down in town and on longer trips; air conditioning, Bluetooth and USB come as standard.',
    de: 'Der Fiat Egea gehört zu den beliebtesten sparsamen Limousinen – mit großem Kofferraum und niedrigem Verbrauch. Dieselmotor und Schaltgetriebe halten die Kosten in der Stadt und auf langen Strecken niedrig; Klimaanlage, Bluetooth und USB sind Standard.',
    ru: 'Fiat Egea — один из самых популярных экономичных седанов с большим багажником и низким расходом топлива. Дизельный двигатель и механическая коробка экономичны и в городе, и в дальних поездках; кондиционер, Bluetooth и USB — в стандартной комплектации.',
  },
  'renault-clio': {
    tr: 'Renault Clio, kompakt ölçüleri sayesinde şehir içinde kolay park edilen, otomatik vitesiyle trafikte konforlu bir hatchback. Benzinli motoru sessiz ve çeviktir; kısa tatiller ve günlük işler için idealdir.',
    en: 'The Renault Clio is a compact hatchback that is easy to park in town and comfortable in traffic thanks to its automatic gearbox. Its petrol engine is quiet and nimble – ideal for short breaks and everyday errands.',
    de: 'Der Renault Clio ist ein kompakter Kleinwagen, der sich in der Stadt leicht parken lässt und mit Automatik im Verkehr bequem fährt. Sein Benzinmotor ist leise und agil – ideal für Kurzurlaube und Alltagsfahrten.',
    ru: 'Renault Clio — компактный хэтчбек, который легко припарковать в городе и удобно вести в пробках благодаря автоматической коробке. Бензиновый двигатель тихий и манёвренный — идеален для коротких поездок и повседневных дел.',
  },
  'toyota-corolla': {
    tr: 'Toyota Corolla Hybrid, benzinli motoru elektrik motoruyla birleştirerek özellikle şehir içinde çok düşük yakıt tüketimi sağlar. Otomatik vitesi, sessiz sürüşü ve geniş iç hacmiyle iş seyahatleri ve aile yolculukları için konforlu bir sedandır.',
    en: 'The Toyota Corolla Hybrid combines a petrol engine with an electric motor for very low fuel consumption, especially in town. With its automatic gearbox, quiet ride and roomy cabin it is a comfortable saloon for business trips and family travel.',
    de: 'Der Toyota Corolla Hybrid kombiniert Benzin- und Elektromotor und verbraucht besonders in der Stadt sehr wenig. Mit Automatik, leisem Fahrgefühl und viel Platz ist er eine komfortable Limousine für Geschäftsreisen und Familienausflüge.',
    ru: 'Toyota Corolla Hybrid сочетает бензиновый двигатель с электромотором и особенно экономична в городе. Автоматическая коробка, тихий ход и просторный салон делают этот седан удобным для деловых поездок и семейных путешествий.',
  },
  'peugeot-3008': {
    tr: 'Peugeot 3008, yüksek sürüş pozisyonu ve geniş bagajıyla kalabalık aileler ve bol eşyalı tatiller için ideal bir SUV. Dizel motoru ve otomatik vitesiyle uzun yolda hem ekonomik hem konforludur.',
    en: 'The Peugeot 3008 is an SUV with a high driving position and a large boot – ideal for bigger families and holidays with plenty of luggage. Its diesel engine and automatic gearbox make long drives both economical and comfortable.',
    de: 'Der Peugeot 3008 ist ein SUV mit hoher Sitzposition und großem Kofferraum – ideal für größere Familien und Urlaub mit viel Gepäck. Dieselmotor und Automatik machen lange Fahrten sparsam und komfortabel.',
    ru: 'Peugeot 3008 — кроссовер с высокой посадкой и большим багажником, идеальный для больших семей и отпуска с багажом. Дизельный двигатель и автоматическая коробка делают дальние поездки экономичными и комфортными.',
  },
}

const payload = await getPayload({ config })
let filled = 0

for (const [slug, texts] of Object.entries(DESCRIPTIONS)) {
  const { docs } = await payload.find({ collection: 'vehicle-models', where: { slug: { equals: slug } }, locale: 'all', depth: 0, limit: 1 })
  const model = docs[0]
  if (!model) continue
  const current = (model.description ?? {}) as unknown as Partial<Record<Locale, string | null>>
  for (const locale of LOCALES) {
    if (current[locale]?.trim()) continue
    await payload.update({ collection: 'vehicle-models', id: model.id, locale, data: { description: texts[locale] } })
    filled++
  }
}

payload.logger.info(`Vehicle descriptions: ${filled} filled`)
process.exit(0)
