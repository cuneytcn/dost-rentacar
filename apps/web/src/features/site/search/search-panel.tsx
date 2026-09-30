import { DEFAULT_TIME_ZONE, snapToOpen, type Locale } from '@rent/shared'

import { addDays } from '@/lib/time-grid'
import { toDateTimeLocal } from '@/lib/local-datetime'

import { getLocations, getSiteSettings } from '../data'
import { defaultSearchDates, type CarSearch } from '../search'
import { SearchForm } from './search-form'

type Props = { locale: Locale; initial?: CarSearch | null; target?: string; variant?: 'hero' | 'bar' | 'stack' }

/** Search form with offices, suggested dates and the bookable date range from the booking rules. */
export async function SearchPanel({ locale, initial = null, target, variant }: Props) {
  const [locations, settings] = await Promise.all([getLocations(locale), getSiteSettings(locale)])
  const timeZone = locations[0]?.timeZone ?? DEFAULT_TIME_ZONE
  const now = new Date()
  const { minLeadTimeHours, maxAdvanceDays } = settings.reservationRules
  const today = toDateTimeLocal(now, timeZone).slice(0, 10)
  const earliest = toDateTimeLocal(new Date(now.getTime() + minLeadTimeHours * 3_600_000), timeZone)

  // Suggested dates land on open hours of the first pick-up office (Sunday closed → Monday …).
  const suggested = defaultSearchDates(now, timeZone, minLeadTimeHours)
  const office = locations.find((location) => location.allowsPickup)
  const hours = office?.openingHours ?? []
  const from = snapToOpen(suggested.from, hours, { earliest }) ?? suggested.from
  const to = snapToOpen(suggested.to > from ? suggested.to : `${addDays(from.slice(0, 10), 3)}T${from.slice(11)}`, hours, { earliest: from }) ?? suggested.to

  return (
    <SearchForm
      locations={locations.map(({ id, name, city, allowsPickup, allowsReturn, openingHours }) => ({ id, name, city, allowsPickup, allowsReturn, openingHours }))}
      initial={initial}
      defaults={{ from, to }}
      earliest={earliest}
      maxDay={addDays(today, maxAdvanceDays)}
      target={target}
      variant={variant}
    />
  )
}
