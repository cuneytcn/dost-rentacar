import { WEEKDAYS } from '@rent/shared'

/**
 * The client's business details (Dost Rent a Car, Menemen/İzmir), used by the seed and by
 * `pnpm company-profile` to update an existing database. Values not known yet stay empty and are
 * filled in the panel (legal name, tax details, authorisation no., email, bank accounts).
 */
export const COMPANY = {
  settings: {
    companyName: 'Dost Rent a Car',
    phone: '+90 555 018 10 26',
    // Assumed to be the same mobile number; change in Settings if WhatsApp uses another one.
    whatsapp: '905550181026',
    address: 'Uğur Mumcu Mah. Gaffar Okan Cad. No:149/A\n35660 Menemen/İzmir',
    socialLinks: { instagram: 'https://www.instagram.com/dost_rent_a_car/' },
  },
  office: {
    slug: 'menemen',
    city: 'İzmir',
    country: 'TR',
    phone: '+90 555 018 10 26',
    whatsapp: '905550181026',
    timeZone: 'Europe/Istanbul',
    // Monday–Saturday 08:00–20:00, closed on Sunday.
    openingHours: WEEKDAYS.filter((day) => day !== 'sun').map((day) => ({ day, opensAt: '08:00', closesAt: '20:00' })),
    name: { tr: 'Menemen Ofisi', en: 'Menemen Office', de: 'Büro Menemen', ru: 'Офис в Менемене' },
    address: {
      tr: 'Uğur Mumcu Mah. Gaffar Okan Cad. No:149/A, 35660 Menemen',
      en: 'Uğur Mumcu Mah., Gaffar Okan Cad. No:149/A, 35660 Menemen',
      de: 'Uğur Mumcu Mah., Gaffar Okan Cad. Nr. 149/A, 35660 Menemen',
      ru: 'Uğur Mumcu Mah., Gaffar Okan Cad. № 149/A, 35660 Menemen',
    },
  },
} as const
