/** ISO 3166-1 alpha-2 codes; display names come from Intl in the visitor's language. */
const ALL = (
  'AD AE AF AG AI AL AM AO AR AT AU AW AX AZ BA BB BD BE BF BG BH BI BJ BM BN BO BR BS BT BW BY BZ CA CD CF CG CH CI CL CM CN CO CR CU CV CW CY CZ ' +
  'DE DJ DK DM DO DZ EC EE EG ER ES ET FI FJ FK FO FR GA GB GD GE GG GH GI GL GM GN GQ GR GT GU GW GY HK HN HR HT HU ID IE IL IM IN IQ IR IS IT ' +
  'JE JM JO JP KE KG KH KI KM KN KP KR KW KY KZ LA LB LC LI LK LR LS LT LU LV LY MA MC MD ME MG MK ML MM MN MO MR MT MU MV MW MX MY MZ NA NE NG NI ' +
  'NL NO NP NZ OM PA PE PG PH PK PL PR PS PT PY QA RO RS RU RW SA SB SC SD SE SG SI SK SL SM SN SO SR SS ST SV SY SZ TD TG TH TJ TL TM TN TO TR TT ' +
  'TW TZ UA UG US UY UZ VA VC VE VN VU WS XK YE ZA ZM ZW'
).split(' ')

/** Where most renters come from; listed first. */
const COMMON = ['TR', 'DE', 'GB', 'RU', 'NL', 'UA', 'FR', 'PL', 'KZ', 'AZ']

export type CountryOption = { code: string; name: string; common: boolean }

export function countryOptions(intlLocale: string): CountryOption[] {
  const names = new Intl.DisplayNames([intlLocale], { type: 'region' })
  const collator = new Intl.Collator(intlLocale)
  const all = ALL.map((code) => ({ code, name: names.of(code) ?? code, common: COMMON.includes(code) }))
  return [
    ...COMMON.map((code) => all.find((option) => option.code === code)!),
    ...all.filter((option) => !option.common).sort((a, b) => collator.compare(a.name, b.name)),
  ]
}

/** First guess for the country field from the site language. */
export const COUNTRY_BY_LOCALE: Record<string, string> = { tr: 'TR', de: 'DE', ru: 'RU', en: 'GB' }
