import type { Locale, LocationDto, PublicSettings, VehicleModelDetail, VehicleModelSummary } from '@rent/shared'

import { siteUrl } from '@/lib/urls'

import { mediaSrc } from './cars/car-image'
import { sitePath } from './routes'
import type { ServiceArea } from './service-areas'

/** schema.org structured data (JSON-LD) so search engines understand the business, cars and pages. */

type Json = Record<string, unknown>

export function JsonLd({ data }: { data: Json | Json[] }) {
  // `<` is escaped so CMS text can never close the script tag.
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/</g, '\\u003c') }} />
}

const DAY_NAMES: Record<string, string> = { mon: 'Monday', tue: 'Tuesday', wed: 'Wednesday', thu: 'Thursday', fri: 'Friday', sat: 'Saturday', sun: 'Sunday' }

const absolute = (url: string) => (url.startsWith('http') ? url : siteUrl(url))

/** The rental business with its office, opening hours and delivery area. */
export function businessJsonLd(input: {
  settings: PublicSettings
  office: LocationDto | undefined
  areas: ServiceArea[]
  locale: Locale
  image?: string
}): Json {
  const { settings, office, areas, locale } = input
  const postalCode = office?.address.match(/\b\d{5}\b/)?.[0]
  const locality = areas.find((area) => area.base)?.name[locale] ?? office?.city
  return {
    '@context': 'https://schema.org',
    '@type': 'AutoRental',
    '@id': siteUrl('/#business'),
    name: settings.companyName,
    ...(settings.legalName ? { legalName: settings.legalName } : {}),
    url: siteUrl(sitePath(locale)),
    telephone: settings.phone ?? office?.phone,
    ...(settings.email ? { email: settings.email } : {}),
    ...(input.image ? { image: absolute(input.image) } : {}),
    priceRange: '₺₺',
    currenciesAccepted: 'TRY',
    paymentAccepted: 'Cash, Credit Card, Bank Transfer',
    ...(office
      ? {
          address: {
            '@type': 'PostalAddress',
            streetAddress: office.address.replace(/,?\s*\b\d{5}\b.*$/, ''),
            addressLocality: locality,
            addressRegion: office.city,
            ...(postalCode ? { postalCode } : {}),
            addressCountry: office.country ?? 'TR',
          },
          ...(office.latitude != null && office.longitude != null ? { geo: { '@type': 'GeoCoordinates', latitude: office.latitude, longitude: office.longitude } } : {}),
          openingHoursSpecification: office.openingHours.map((slot) => ({
            '@type': 'OpeningHoursSpecification',
            dayOfWeek: `https://schema.org/${DAY_NAMES[slot.day]}`,
            opens: slot.opensAt,
            closes: slot.closesAt,
          })),
        }
      : {}),
    areaServed: areas.map((area) => ({ '@type': 'City', name: area.name[locale] })),
    sameAs: Object.values(settings.socialLinks),
  }
}

export function breadcrumbJsonLd(items: { name: string; path: string }[]): Json {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({ '@type': 'ListItem', position: index + 1, name: item.name, item: siteUrl(item.path) })),
  }
}

/** A rental car offered from its lowest daily rate, linked to the business as the seller. */
export function carJsonLd(model: VehicleModelDetail | VehicleModelSummary, path: string, dailyRate: number): Json {
  return {
    '@context': 'https://schema.org',
    '@type': ['Product', 'Car'],
    name: model.name,
    brand: { '@type': 'Brand', name: model.brand },
    ...(model.imageUrls.length ? { image: model.imageUrls.map((url) => absolute(mediaSrc(url))) } : {}),
    ...('description' in model && model.description ? { description: model.description } : {}),
    ...(model.category ? { category: model.category.name } : {}),
    vehicleTransmission: model.transmission === 'automatic' ? 'Automatic' : 'Manual',
    fuelType: model.fuelType,
    seatingCapacity: model.seats,
    numberOfDoors: model.doors,
    offers: {
      '@type': 'Offer',
      url: siteUrl(path),
      price: (dailyRate / 100).toFixed(2),
      priceCurrency: model.fromDailyRate.currency,
      availability: 'https://schema.org/InStock',
      seller: { '@id': siteUrl('/#business') },
      priceSpecification: {
        '@type': 'UnitPriceSpecification',
        price: (dailyRate / 100).toFixed(2),
        priceCurrency: model.fromDailyRate.currency,
        unitCode: 'DAY',
      },
    },
  }
}
