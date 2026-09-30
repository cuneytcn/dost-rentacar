/**
 * Switches the base (pricing) currency and converts catalog prices at the stored exchange rate.
 * Usage: `pnpm payload run src/scripts/rebase-currency.ts TRY`
 *
 * Converts vehicle model rates/deposits/extra km fees, extras, one-way fees and open penalties,
 * rounds them to prices a rental desk would quote, rebases the exchange-rate table and updates the
 * setting. Reservations keep the currency they were priced in, so history stays correct.
 */
import config from '@payload-config'
import { getPayload } from 'payload'

import { CURRENCIES, type Currency } from '@rent/shared'

const target = process.argv[2]?.toUpperCase() as Currency | undefined
if (!target || !CURRENCIES.includes(target)) {
  console.error(`Usage: rebase-currency <${CURRENCIES.join('|')}>`)
  process.exit(1)
}

const payload = await getPayload({ config })
const settings = await payload.findGlobal({ slug: 'settings', depth: 0 })
const rates = await payload.findGlobal({ slug: 'exchange-rates', depth: 0 })
const from = settings.baseCurrency as Currency

if (from === target) {
  payload.logger.info(`Base currency is already ${target}`)
  process.exit(0)
}
if (rates.baseCurrency !== from) throw new Error(`Exchange rates are based on ${rates.baseCurrency}, settings on ${from}`)
const rate = rates.rates?.find((entry) => entry.currency === target)?.rate
if (!rate) throw new Error(`No ${from} → ${target} rate stored`)

/** Converts minor units and rounds to `step` whole units of the target currency. */
const convert = (minor: number | null | undefined, step: number): number | null | undefined => {
  if (minor == null) return minor
  const units = (minor / 100) * rate
  return Math.max(step, Math.round(units / step) * step) * 100
}
const priceStep = (minor: number) => ((minor / 100) * rate >= 100 ? 50 : 10)

const models = await payload.find({ collection: 'vehicle-models', depth: 0, pagination: false })
for (const model of models.docs) {
  await payload.update({
    collection: 'vehicle-models',
    id: model.id,
    data: {
      deposit: convert(model.deposit, 500) ?? model.deposit,
      extraKmFee: convert(model.extraKmFee, 1),
      rateTiers: (model.rateTiers ?? []).map((tier) => ({ ...tier, dailyRate: convert(tier.dailyRate, 50)! })),
    },
  })
}

const extras = await payload.find({ collection: 'extras', depth: 0, pagination: false })
for (const extra of extras.docs) {
  await payload.update({ collection: 'extras', id: extra.id, data: { price: convert(extra.price, priceStep(extra.price))! } })
}

const fees = await payload.find({ collection: 'transfer-fees', depth: 0, pagination: false })
for (const fee of fees.docs) {
  await payload.update({ collection: 'transfer-fees', id: fee.id, data: { fee: convert(fee.fee, priceStep(fee.fee))! } })
}

const penalties = await payload.find({ collection: 'penalties', where: { status: { equals: 'open' } }, depth: 0, pagination: false })
for (const penalty of penalties.docs) {
  await payload.update({ collection: 'penalties', id: penalty.id, data: { amount: convert(penalty.amount, 10)! } })
}

// 1 target = 1/rate base; other currencies go through the old base.
const rebased = [
  { currency: from, rate: 1 / rate },
  ...(rates.rates ?? []).filter((entry) => entry.currency !== target).map((entry) => ({ currency: entry.currency, rate: entry.rate / rate })),
].map((entry) => ({ ...entry, rate: Number(entry.rate.toPrecision(6)) }))

await payload.updateGlobal({ slug: 'exchange-rates', data: { baseCurrency: target, rates: rebased, source: `${rates.source ?? 'manual'} (rebased)` } })
await payload.updateGlobal({ slug: 'settings', data: { baseCurrency: target } })

payload.logger.info(
  `Base currency ${from} → ${target} at ${rate}: ${models.docs.length} models, ${extras.docs.length} extras, ${fees.docs.length} one-way fees, ${penalties.docs.length} open penalties converted`,
)
process.exit(0)
