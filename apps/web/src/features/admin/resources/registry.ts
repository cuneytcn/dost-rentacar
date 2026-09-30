import {
  CORPORATE_REQUEST_STATUSES,
  CURRENCIES,
  EXTRA_PRICING_TYPES,
  FAQ_CATEGORIES,
  FUEL_TYPES,
  HANDOVER_TYPES,
  PENALTY_STATUSES,
  PENALTY_TYPES,
  TRANSMISSIONS,
  USER_ROLES,
  VEHICLE_BLOCK_REASONS,
  VEHICLE_FEATURES,
  VEHICLE_STATUSES,
} from '@rent/shared'

import { optionLabels, text, type AdminText } from '@/i18n/admin'

import type { CollectionResource, GlobalResource, Option, ResourceDef } from './types'

const opts = <T extends string>(values: readonly T[], labels: Record<T, AdminText>): Option[] =>
  values.map((value) => ({ value, label: labels[value] }))

const common = {
  name: text('Name', 'Ad'),
  slug: text('URL slug', 'URL kısaltması'),
  slugHint: text('Generated from the name when left empty.', 'Boş bırakılırsa addan oluşturulur.'),
  active: text('Active', 'Aktif'),
  activeHint: text('Inactive records are hidden from the website.', 'Pasif kayıtlar web sitesinde görünmez.'),
  sortOrder: text('Sort order', 'Sıralama'),
  description: text('Description', 'Açıklama'),
  notes: text('Notes', 'Notlar'),
  status: text('Status', 'Durum'),
  visibility: text('Visibility', 'Görünürlük'),
}

const visibilitySection = (extra: CollectionResource['form']['sections'][number]['fields'] = []) => ({
  title: common.visibility,
  aside: true,
  fields: [
    { kind: 'switch' as const, name: 'isActive', label: common.active, description: common.activeHint },
    ...extra,
    { kind: 'number' as const, name: 'sortOrder', label: common.sortOrder, width: 'full' as const },
  ],
})

const vehicleModels: CollectionResource = {
  type: 'collection',
  slug: 'vehicle-models',
  path: 'vehicle-models',
  labels: { singular: text('Vehicle model', 'Araç modeli'), plural: text('Vehicle models', 'Araç modelleri') },
  description: text('What customers book: specs, rental terms and prices.', 'Müşterinin rezerve ettiği model: özellikler, koşullar ve fiyatlar.'),
  titleField: 'name',
  canCreate: true,
  canDelete: true,
  list: {
    columns: [
      { path: 'images', label: text('Photo', 'Görsel'), kind: 'image' },
      { path: 'name', label: common.name, kind: 'text', secondary: { path: 'category', kind: 'relation' } },
      { path: 'transmission', label: text('Transmission', 'Vites'), kind: 'badge', options: optionLabels.transmission, secondary: { path: 'fuelType', kind: 'badge', options: optionLabels.fuelType } },
      { path: 'seats', label: text('Seats', 'Koltuk'), kind: 'number' },
      { path: 'rateTiers', label: text('From / day', 'Günlük (en düşük)'), kind: 'money', aggregate: { min: 'dailyRate' } },
      { path: 'deposit', label: text('Deposit', 'Depozito'), kind: 'money' },
      { path: 'isActive', label: common.status, kind: 'boolean' },
    ],
    searchFields: ['name', 'brand', 'model'],
    defaultSort: 'sortOrder',
    activeTabs: true,
  },
  form: {
    sections: [
      {
        title: text('General', 'Genel'),
        fields: [
          { kind: 'text', name: 'brand', label: text('Brand', 'Marka'), required: true, width: 'third' },
          { kind: 'text', name: 'model', label: text('Model', 'Model'), required: true, width: 'third' },
          { kind: 'relation', name: 'category', label: text('Category', 'Sınıf'), relationTo: 'vehicle-categories', required: true, width: 'third' },
          { kind: 'textarea', name: 'description', label: common.description, localized: true, rows: 3 },
          { kind: 'images', name: 'images', label: text('Photos', 'Görseller'), relationTo: 'media', description: text('The first photo is the cover. Drag to reorder.', 'İlk görsel kapaktır. Sıralamak için sürükleyin.') },
        ],
      },
      {
        title: text('Specifications', 'Özellikler'),
        fields: [
          { kind: 'select', name: 'transmission', label: text('Transmission', 'Vites'), options: opts(TRANSMISSIONS, optionLabels.transmission), required: true, width: 'half' },
          { kind: 'select', name: 'fuelType', label: text('Fuel', 'Yakıt'), options: opts(FUEL_TYPES, optionLabels.fuelType), required: true, width: 'half' },
          { kind: 'number', name: 'seats', label: text('Seats', 'Koltuk'), min: 1, required: true, width: 'quarter' },
          { kind: 'number', name: 'doors', label: text('Doors', 'Kapı'), min: 2, required: true, width: 'quarter' },
          { kind: 'number', name: 'largeBags', label: text('Large bags', 'Büyük bavul'), min: 0, required: true, width: 'quarter' },
          { kind: 'number', name: 'smallBags', label: text('Small bags', 'Küçük bavul'), min: 0, required: true, width: 'quarter' },
          { kind: 'multiSelect', name: 'features', label: text('Features', 'Donanım'), options: opts(VEHICLE_FEATURES, optionLabels.vehicleFeature) },
        ],
      },
      {
        title: text('Rental terms', 'Kiralama koşulları'),
        fields: [
          { kind: 'number', name: 'minDriverAge', label: text('Min. driver age', 'Min. sürücü yaşı'), min: 18, required: true, width: 'half' },
          { kind: 'number', name: 'minLicenseYears', label: text('Min. license years', 'Min. ehliyet yılı'), min: 0, required: true, width: 'half' },
          { kind: 'number', name: 'dailyKmLimit', label: text('Daily km limit', 'Günlük km limiti'), min: 0, suffix: 'km', width: 'third', description: text('Empty = unlimited', 'Boş = sınırsız') },
          { kind: 'money', name: 'extraKmFee', label: text('Extra km fee', 'Fazla km ücreti'), width: 'third' },
          { kind: 'money', name: 'deposit', label: text('Deposit', 'Depozito'), required: true, width: 'third' },
        ],
      },
      {
        title: text('Daily rates', 'Günlük fiyatlar'),
        description: text(
          'The tier with the highest "from days" not exceeding the rental length applies to every day. Seasons adjust these rates.',
          'Kiralama süresini geçmeyen en yüksek "gün başlangıcı" kademesi tüm günlere uygulanır. Sezonlar bu fiyatları yüzdeyle değiştirir.',
        ),
        fields: [
          {
            kind: 'array',
            name: 'rateTiers',
            label: text('Rate tiers', 'Fiyat kademeleri'),
            addLabel: text('Add tier', 'Kademe ekle'),
            minRows: 1,
            fields: [
              { kind: 'number', name: 'minDays', label: text('From days', 'Gün başlangıcı'), min: 1, required: true, suffix: text('days', 'gün').tr, width: 'half' },
              { kind: 'money', name: 'dailyRate', label: text('Daily rate', 'Günlük fiyat'), required: true, width: 'half' },
            ],
          },
        ],
      },
      visibilitySection([
        { kind: 'switch', name: 'isFeatured', label: text('Featured on home page', 'Ana sayfada öne çıkar') },
        { kind: 'text', name: 'slug', label: common.slug, description: common.slugHint, mono: true },
      ]),
    ],
  },
}

const vehicles: CollectionResource = {
  type: 'collection',
  slug: 'vehicles',
  path: 'vehicles',
  labels: { singular: text('Vehicle', 'Araç'), plural: text('Vehicles', 'Araçlar') },
  description: text('Physical cars identified by their plate.', 'Plakasıyla takip edilen fiziksel araçlar.'),
  titleField: 'plate',
  canCreate: true,
  canDelete: true,
  list: {
    columns: [
      { path: 'plate', label: text('Plate', 'Plaka'), kind: 'mono', secondary: { path: 'vehicleModel', kind: 'relation' } },
      { path: 'location', label: text('Location', 'Şube'), kind: 'relation' },
      { path: 'mileageKm', label: text('Mileage', 'Kilometre'), kind: 'number' },
      { path: 'inspectionExpiresAt', label: text('Inspection', 'Muayene'), kind: 'date' },
      { path: 'insuranceExpiresAt', label: text('Insurance', 'Sigorta'), kind: 'date' },
      { path: 'status', label: common.status, kind: 'badge', options: optionLabels.vehicleStatus },
    ],
    searchFields: ['plate', 'vin'],
    defaultSort: 'plate',
    filters: [{ name: 'status', label: common.status, options: opts(VEHICLE_STATUSES, optionLabels.vehicleStatus) }],
  },
  form: {
    sections: [
      {
        title: text('Vehicle', 'Araç'),
        fields: [
          { kind: 'text', name: 'plate', label: text('Plate', 'Plaka'), required: true, mono: true, uppercase: true, width: 'third', placeholder: '07 ABC 123' },
          { kind: 'relation', name: 'vehicleModel', label: text('Model', 'Model'), relationTo: 'vehicle-models', required: true, width: 'third' },
          { kind: 'relation', name: 'location', label: text('Current location', 'Bulunduğu şube'), relationTo: 'locations', required: true, width: 'third' },
          { kind: 'number', name: 'year', label: text('Year', 'Model yılı'), min: 1990, width: 'quarter' },
          { kind: 'text', name: 'color', label: text('Color', 'Renk'), width: 'quarter' },
          { kind: 'number', name: 'mileageKm', label: text('Mileage', 'Kilometre'), min: 0, suffix: 'km', width: 'quarter' },
          { kind: 'text', name: 'vin', label: text('VIN', 'Şasi no'), mono: true, uppercase: true, width: 'quarter' },
        ],
      },
      {
        title: text('Documents & expiry dates', 'Belgeler ve bitiş tarihleri'),
        description: text('Staff get reminders 30, 14, 7, 3 and 1 days before expiry.', 'Bitişe 30, 14, 7, 3 ve 1 gün kala personele hatırlatma gider.'),
        fields: [
          { kind: 'date', storage: 'timestamp', name: 'insuranceExpiresAt', label: text('Traffic insurance', 'Trafik sigortası'), width: 'third' },
          { kind: 'date', storage: 'timestamp', name: 'cascoExpiresAt', label: text('Casco', 'Kasko'), width: 'third' },
          { kind: 'date', storage: 'timestamp', name: 'inspectionExpiresAt', label: text('Inspection', 'Muayene'), width: 'third' },
        ],
      },
      { title: common.notes, fields: [{ kind: 'textarea', name: 'notes', label: common.notes, rows: 4 }] },
      {
        title: common.status,
        aside: true,
        fields: [
          {
            kind: 'select',
            name: 'status',
            label: common.status,
            options: opts(VEHICLE_STATUSES, optionLabels.vehicleStatus),
            required: true,
            description: text('Only active cars can be rented.', 'Sadece aktif araçlar kiralanabilir.'),
          },
        ],
      },
    ],
  },
}

const vehicleBlocks: CollectionResource = {
  type: 'collection',
  slug: 'vehicle-blocks',
  path: 'vehicle-blocks',
  labels: { singular: text('Vehicle block', 'Araç kapatma'), plural: text('Vehicle blocks', 'Araç kapatmaları') },
  description: text('Take a car out of service for maintenance or repair.', 'Bakım veya onarım için aracı kiralamaya kapatın.'),
  titleField: 'reason',
  canCreate: true,
  canDelete: true,
  list: {
    columns: [
      { path: 'vehicle', label: text('Vehicle', 'Araç'), kind: 'relation' },
      { path: 'startsAt', label: text('Starts', 'Başlangıç'), kind: 'datetime' },
      { path: 'endsAt', label: text('Ends', 'Bitiş'), kind: 'datetime' },
      { path: 'reason', label: text('Reason', 'Sebep'), kind: 'badge', options: optionLabels.vehicleBlockReason },
    ],
    searchFields: ['notes'],
    defaultSort: '-startsAt',
    filters: [{ name: 'reason', label: text('Reason', 'Sebep'), options: opts(VEHICLE_BLOCK_REASONS, optionLabels.vehicleBlockReason) }],
  },
  form: {
    sections: [
      {
        title: text('Block', 'Kapatma'),
        fields: [
          { kind: 'relation', name: 'vehicle', label: text('Vehicle', 'Araç'), relationTo: 'vehicles', required: true, width: 'half' },
          { kind: 'select', name: 'reason', label: text('Reason', 'Sebep'), options: opts(VEHICLE_BLOCK_REASONS, optionLabels.vehicleBlockReason), required: true, width: 'half' },
          { kind: 'datetime', name: 'startsAt', label: text('Starts', 'Başlangıç'), required: true, width: 'half' },
          { kind: 'datetime', name: 'endsAt', label: text('Ends', 'Bitiş'), required: true, width: 'half' },
          { kind: 'textarea', name: 'notes', label: common.notes, rows: 3 },
        ],
      },
    ],
  },
}

const vehicleCategories: CollectionResource = {
  type: 'collection',
  slug: 'vehicle-categories',
  path: 'vehicle-categories',
  labels: { singular: text('Category', 'Araç sınıfı'), plural: text('Categories', 'Araç sınıfları') },
  titleField: 'name',
  canCreate: true,
  canDelete: true,
  list: {
    columns: [
      { path: 'name', label: common.name, kind: 'text', secondary: { path: 'slug', kind: 'mono' } },
      { path: 'sortOrder', label: common.sortOrder, kind: 'number' },
      { path: 'isActive', label: common.status, kind: 'boolean' },
    ],
    searchFields: ['name'],
    defaultSort: 'sortOrder',
    activeTabs: true,
  },
  form: {
    sections: [
      {
        title: text('Category', 'Sınıf'),
        fields: [
          { kind: 'text', name: 'name', label: common.name, localized: true, required: true },
          { kind: 'textarea', name: 'description', label: common.description, localized: true, rows: 3 },
        ],
      },
      visibilitySection([{ kind: 'text', name: 'slug', label: common.slug, description: common.slugHint, mono: true }]),
    ],
  },
}

const locations: CollectionResource = {
  type: 'collection',
  slug: 'locations',
  path: 'locations',
  labels: { singular: text('Location', 'Şube'), plural: text('Locations', 'Şubeler') },
  titleField: 'name',
  canCreate: true,
  canDelete: true,
  list: {
    columns: [
      { path: 'name', label: common.name, kind: 'text', secondary: { path: 'city', kind: 'text' } },
      { path: 'phone', label: text('Phone', 'Telefon'), kind: 'text', secondary: { path: 'email', kind: 'text' } },
      { path: 'allowsPickup', label: text('Pickup', 'Teslim'), kind: 'boolean' },
      { path: 'allowsReturn', label: text('Return', 'İade'), kind: 'boolean' },
      { path: 'isActive', label: common.status, kind: 'boolean' },
    ],
    searchFields: ['name', 'city'],
    defaultSort: 'sortOrder',
    activeTabs: true,
  },
  form: {
    sections: [
      {
        title: text('Location', 'Şube'),
        fields: [
          { kind: 'text', name: 'name', label: common.name, localized: true, required: true },
          { kind: 'textarea', name: 'address', label: text('Address', 'Adres'), localized: true, required: true, rows: 2 },
          { kind: 'text', name: 'city', label: text('City', 'Şehir'), required: true, width: 'half' },
          { kind: 'text', name: 'country', label: text('Country code', 'Ülke kodu'), uppercase: true, maxLength: 2, width: 'quarter' },
          { kind: 'text', name: 'timeZone', label: text('Time zone', 'Saat dilimi'), required: true, width: 'quarter' },
        ],
      },
      {
        title: text('Contact', 'İletişim'),
        fields: [
          { kind: 'text', name: 'phone', label: text('Phone', 'Telefon'), required: true, width: 'third' },
          { kind: 'text', name: 'whatsapp', label: 'WhatsApp' as unknown as AdminText, width: 'third' },
          { kind: 'email', name: 'email', label: text('Email', 'E-posta'), width: 'third' },
          { kind: 'number', name: 'latitude', label: text('Latitude', 'Enlem'), step: 0.000001, width: 'half' },
          { kind: 'number', name: 'longitude', label: text('Longitude', 'Boylam'), step: 0.000001, width: 'half' },
        ],
      },
      {
        title: text('Opening hours', 'Çalışma saatleri'),
        description: text('Website bookings are only possible within these hours.', 'Web sitesinden sadece bu saatler içinde teslim/iade seçilebilir.'),
        fields: [{ kind: 'openingHours', name: 'openingHours', label: text('Opening hours', 'Çalışma saatleri') }],
      },
      visibilitySection([
        { kind: 'switch', name: 'allowsPickup', label: text('Pickup allowed', 'Teslim alınabilir') },
        { kind: 'switch', name: 'allowsReturn', label: text('Return allowed', 'İade edilebilir') },
        { kind: 'text', name: 'slug', label: common.slug, description: common.slugHint, mono: true },
      ]),
    ],
  },
}

const seasons: CollectionResource = {
  type: 'collection',
  slug: 'seasons',
  path: 'seasons',
  labels: { singular: text('Season', 'Sezon'), plural: text('Seasons', 'Sezonlar') },
  description: text('Date ranges that raise or lower daily rates by a percentage.', 'Günlük fiyatları yüzde olarak artıran veya azaltan tarih aralıkları.'),
  titleField: 'name',
  canCreate: true,
  canDelete: true,
  list: {
    columns: [
      { path: 'name', label: common.name, kind: 'text' },
      { path: 'startDate', label: text('Start', 'Başlangıç'), kind: 'date' },
      { path: 'endDate', label: text('End', 'Bitiş'), kind: 'date' },
      { path: 'adjustmentPercent', label: text('Adjustment', 'Değişim'), kind: 'percent' },
      { path: 'minRentalDays', label: text('Min. days', 'Min. gün'), kind: 'number' },
      { path: 'isActive', label: common.status, kind: 'boolean' },
    ],
    searchFields: ['name'],
    defaultSort: '-startDate',
    activeTabs: true,
  },
  form: {
    sections: [
      {
        title: text('Season', 'Sezon'),
        fields: [
          { kind: 'text', name: 'name', label: common.name, required: true },
          { kind: 'date', storage: 'text', name: 'startDate', label: text('Start date', 'Başlangıç'), required: true, width: 'half' },
          { kind: 'date', storage: 'text', name: 'endDate', label: text('End date (inclusive)', 'Bitiş (dahil)'), required: true, width: 'half' },
          {
            kind: 'number',
            name: 'adjustmentPercent',
            label: text('Rate adjustment', 'Fiyat değişimi'),
            suffix: '%',
            min: -90,
            max: 500,
            required: true,
            width: 'third',
            description: text('30 = +30%, −15 = 15% off', '30 = %30 zam, −15 = %15 indirim'),
          },
          { kind: 'number', name: 'minRentalDays', label: text('Min. rental days', 'Min. kiralama günü'), min: 1, width: 'third' },
          {
            kind: 'number',
            name: 'priority',
            label: text('Priority', 'Öncelik'),
            required: true,
            width: 'third',
            description: text('Higher wins when seasons overlap', 'Çakışmada yüksek olan geçerli'),
          },
          {
            kind: 'relation',
            name: 'vehicleCategories',
            label: text('Applies to categories', 'Geçerli sınıflar'),
            relationTo: 'vehicle-categories',
            hasMany: true,
            description: text('Empty = all categories', 'Boş = tüm sınıflar'),
          },
        ],
      },
      { title: common.visibility, aside: true, fields: [{ kind: 'switch', name: 'isActive', label: common.active }] },
    ],
  },
}

const extras: CollectionResource = {
  type: 'collection',
  slug: 'extras',
  path: 'extras',
  labels: { singular: text('Extra', 'Ek hizmet'), plural: text('Extras', 'Ek hizmetler') },
  titleField: 'name',
  canCreate: true,
  canDelete: true,
  list: {
    columns: [
      { path: 'name', label: common.name, kind: 'text' },
      { path: 'pricingType', label: text('Pricing', 'Ücretlendirme'), kind: 'badge', options: optionLabels.extraPricingType },
      { path: 'price', label: text('Price', 'Fiyat'), kind: 'money' },
      { path: 'maxQuantity', label: text('Max. qty', 'Maks. adet'), kind: 'number' },
      { path: 'isActive', label: common.status, kind: 'boolean' },
    ],
    searchFields: ['name'],
    defaultSort: 'sortOrder',
    activeTabs: true,
  },
  form: {
    sections: [
      {
        title: text('Extra', 'Ek hizmet'),
        fields: [
          { kind: 'text', name: 'name', label: common.name, localized: true, required: true },
          { kind: 'textarea', name: 'description', label: common.description, localized: true, rows: 2 },
          { kind: 'select', name: 'pricingType', label: text('Pricing', 'Ücretlendirme'), options: opts(EXTRA_PRICING_TYPES, optionLabels.extraPricingType), required: true, width: 'half' },
          { kind: 'money', name: 'price', label: text('Price', 'Fiyat'), required: true, width: 'half' },
          { kind: 'number', name: 'maxQuantity', label: text('Max. quantity', 'Maks. adet'), min: 1, required: true, width: 'half' },
          {
            kind: 'number',
            name: 'maxChargeDays',
            label: text('Charge at most', 'En fazla ücretlenen'),
            min: 1,
            suffix: text('days', 'gün').tr,
            width: 'half',
            condition: { field: 'pricingType', in: ['per_day'] },
            description: text('Empty = every day is charged', 'Boş = her gün ücretlenir'),
          },
        ],
      },
      visibilitySection([{ kind: 'text', name: 'slug', label: common.slug, description: common.slugHint, mono: true }]),
    ],
  },
}

const transferFees: CollectionResource = {
  type: 'collection',
  slug: 'transfer-fees',
  path: 'transfer-fees',
  labels: { singular: text('One-way fee', 'Farklı şube ücreti'), plural: text('One-way fees', 'Farklı şube ücretleri') },
  description: text('Charged when the car is returned to another location.', 'Araç başka bir şubeye iade edildiğinde alınır.'),
  titleField: 'id',
  canCreate: true,
  canDelete: true,
  list: {
    columns: [
      { path: 'fromLocation', label: text('From', 'Alış şubesi'), kind: 'relation' },
      { path: 'toLocation', label: text('To', 'İade şubesi'), kind: 'relation' },
      { path: 'fee', label: text('Fee', 'Ücret'), kind: 'money' },
      { path: 'bidirectional', label: text('Both directions', 'Çift yön'), kind: 'boolean' },
    ],
    searchFields: [],
    defaultSort: 'id',
  },
  form: {
    sections: [
      {
        title: text('One-way fee', 'Farklı şube ücreti'),
        fields: [
          { kind: 'relation', name: 'fromLocation', label: text('From', 'Alış şubesi'), relationTo: 'locations', required: true, width: 'half' },
          { kind: 'relation', name: 'toLocation', label: text('To', 'İade şubesi'), relationTo: 'locations', required: true, width: 'half' },
          { kind: 'money', name: 'fee', label: text('Fee', 'Ücret'), required: true, width: 'half' },
          { kind: 'switch', name: 'bidirectional', label: text('Applies in both directions', 'Her iki yönde geçerli'), width: 'half' },
        ],
      },
    ],
  },
}

const penalties: CollectionResource = {
  type: 'collection',
  slug: 'penalties',
  path: 'penalties',
  labels: { singular: text('Charge', 'Ceza / ek ücret'), plural: text('Penalties & charges', 'Cezalar ve ek ücretler') },
  description: text('Tolls, traffic fines, damage and other charges after a rental.', 'Kiralama sonrası gelen HGS, trafik cezası, hasar ve diğer ücretler.'),
  titleField: 'type',
  canCreate: true,
  canDelete: true,
  list: {
    columns: [
      { path: 'type', label: text('Type', 'Tür'), kind: 'badge', options: optionLabels.penaltyType },
      { path: 'vehicle', label: text('Vehicle', 'Araç'), kind: 'relation', secondary: { path: 'reservation', kind: 'relation' } },
      { path: 'occurredAt', label: text('Occurred', 'Tarih'), kind: 'datetime' },
      { path: 'amount', label: text('Amount', 'Tutar'), kind: 'money' },
      { path: 'status', label: common.status, kind: 'badge', options: optionLabels.penaltyStatus },
    ],
    searchFields: ['notes'],
    defaultSort: '-occurredAt',
    filters: [
      { name: 'status', label: common.status, options: opts(PENALTY_STATUSES, optionLabels.penaltyStatus) },
      { name: 'type', label: text('Type', 'Tür'), options: opts(PENALTY_TYPES, optionLabels.penaltyType) },
    ],
  },
  form: {
    sections: [
      {
        title: text('Charge', 'Ücret'),
        fields: [
          { kind: 'select', name: 'type', label: text('Type', 'Tür'), options: opts(PENALTY_TYPES, optionLabels.penaltyType), required: true, width: 'half' },
          { kind: 'money', name: 'amount', label: text('Amount', 'Tutar'), required: true, width: 'half' },
          { kind: 'relation', name: 'vehicle', label: text('Vehicle', 'Araç'), relationTo: 'vehicles', required: true, width: 'half' },
          {
            kind: 'relation',
            name: 'reservation',
            label: text('Reservation', 'Rezervasyon'),
            relationTo: 'reservations',
            allowEmpty: true,
            width: 'half',
            description: text('The rental during which it happened', 'Olayın gerçekleştiği kiralama'),
          },
          { kind: 'datetime', name: 'occurredAt', label: text('Occurred at', 'Olay zamanı'), required: true, width: 'half' },
          { kind: 'file', name: 'document', label: text('Notice / receipt', 'Tebligat / makbuz'), relationTo: 'documents', width: 'half' },
          { kind: 'textarea', name: 'notes', label: common.notes, rows: 3 },
        ],
      },
      {
        title: common.status,
        aside: true,
        fields: [{ kind: 'select', name: 'status', label: common.status, options: opts(PENALTY_STATUSES, optionLabels.penaltyStatus), required: true }],
      },
    ],
  },
}

const corporateRequests: CollectionResource = {
  type: 'collection',
  slug: 'corporate-requests',
  path: 'corporate-requests',
  labels: { singular: text('Corporate request', 'Kurumsal talep'), plural: text('Corporate requests', 'Kurumsal talepler') },
  description: text('Long-term and corporate rental leads from the website.', 'Web sitesinden gelen uzun dönem ve kurumsal kiralama talepleri.'),
  titleField: 'companyName',
  canCreate: false,
  canDelete: true,
  list: {
    columns: [
      { path: 'companyName', label: text('Company', 'Firma'), kind: 'text', secondary: { path: 'contactName', kind: 'text' } },
      { path: 'phone', label: text('Contact', 'İletişim'), kind: 'text', secondary: { path: 'email', kind: 'text' } },
      { path: 'vehicleCount', label: text('Vehicles', 'Araç'), kind: 'number' },
      { path: 'durationMonths', label: text('Months', 'Ay'), kind: 'number' },
      { path: 'createdAt', label: text('Received', 'Geliş'), kind: 'date' },
      { path: 'status', label: common.status, kind: 'badge', options: optionLabels.corporateRequestStatus },
    ],
    searchFields: ['companyName', 'contactName', 'email', 'phone'],
    defaultSort: '-createdAt',
    filters: [{ name: 'status', label: common.status, options: opts(CORPORATE_REQUEST_STATUSES, optionLabels.corporateRequestStatus) }],
  },
  form: {
    sections: [
      {
        title: text('Company', 'Firma'),
        fields: [
          { kind: 'text', name: 'companyName', label: text('Company', 'Firma'), required: true, width: 'half' },
          { kind: 'text', name: 'taxNumber', label: text('Tax number', 'Vergi no'), width: 'half' },
          { kind: 'text', name: 'contactName', label: text('Contact person', 'Yetkili'), required: true, width: 'half' },
          { kind: 'text', name: 'phone', label: text('Phone', 'Telefon'), required: true, width: 'quarter' },
          { kind: 'text', name: 'country', label: text('Country', 'Ülke'), uppercase: true, maxLength: 2, width: 'quarter' },
          { kind: 'email', name: 'email', label: text('Email', 'E-posta'), required: true },
        ],
      },
      {
        title: text('Request', 'Talep'),
        fields: [
          { kind: 'number', name: 'vehicleCount', label: text('Vehicles', 'Araç adedi'), min: 1, required: true, width: 'third' },
          { kind: 'date', storage: 'text', name: 'startDate', label: text('Start date', 'Başlangıç'), required: true, width: 'third' },
          { kind: 'number', name: 'durationMonths', label: text('Duration', 'Süre'), min: 1, suffix: text('months', 'ay').tr, required: true, width: 'third' },
          { kind: 'relation', name: 'vehicleCategories', label: text('Preferred categories', 'Tercih edilen sınıflar'), relationTo: 'vehicle-categories', hasMany: true },
          { kind: 'textarea', name: 'notes', label: text('Customer note', 'Müşteri notu'), readOnly: true, rows: 3 },
        ],
      },
      {
        title: text('Follow-up', 'Takip'),
        aside: true,
        fields: [
          { kind: 'select', name: 'status', label: common.status, options: opts(CORPORATE_REQUEST_STATUSES, optionLabels.corporateRequestStatus), required: true },
          { kind: 'textarea', name: 'internalNotes', label: text('Internal notes', 'İç notlar'), rows: 6 },
          { kind: 'text', name: 'locale', label: text('Customer language', 'Müşteri dili'), readOnly: true, uppercase: true },
          { kind: 'datetime', name: 'privacyAcceptedAt', label: text('Privacy notice accepted', 'KVKK aydınlatma onayı'), readOnly: true },
        ],
      },
    ],
  },
}

const handovers: CollectionResource = {
  type: 'collection',
  slug: 'handovers',
  path: 'handovers',
  labels: { singular: text('Handover', 'Teslim / iade'), plural: text('Pickups & returns', 'Teslim ve iadeler') },
  description: text('Every pickup and return check. Open one to see its reservation.', 'Tüm teslim ve iade kontrolleri. Açmak için rezervasyona gidin.'),
  titleField: 'type',
  canCreate: false,
  canDelete: false,
  list: {
    columns: [
      { path: 'performedAt', label: text('Date', 'Tarih'), kind: 'datetime', secondary: { path: 'performedBy', kind: 'relation' } },
      { path: 'reservation', label: text('Reservation', 'Rezervasyon'), kind: 'relation' },
      { path: 'mileageKm', label: text('Mileage', 'Kilometre'), kind: 'number' },
      { path: 'fuelLevel', label: text('Fuel', 'Yakıt'), kind: 'badge', options: optionLabels.fuelLevel },
      { path: 'type', label: text('Type', 'Tür'), kind: 'badge', options: optionLabels.handoverType },
    ],
    searchFields: [],
    defaultSort: '-performedAt',
    filters: [{ name: 'type', label: text('Type', 'Tür'), options: opts(HANDOVER_TYPES, optionLabels.handoverType) }],
    rowLink: { field: 'reservation', base: '/admin/reservations' },
  },
  form: { sections: [] },
}

const faqs: CollectionResource = {
  type: 'collection',
  slug: 'faqs',
  path: 'faqs',
  labels: { singular: text('FAQ', 'Soru'), plural: text('FAQs', 'Sıkça sorulan sorular') },
  titleField: 'question',
  canCreate: true,
  canDelete: true,
  list: {
    columns: [
      { path: 'question', label: text('Question', 'Soru'), kind: 'text' },
      { path: 'category', label: text('Category', 'Kategori'), kind: 'badge', options: optionLabels.faqCategory },
      { path: 'sortOrder', label: common.sortOrder, kind: 'number' },
      { path: 'isActive', label: common.status, kind: 'boolean' },
    ],
    searchFields: ['question'],
    defaultSort: 'sortOrder',
    activeTabs: true,
    filters: [{ name: 'category', label: text('Category', 'Kategori'), options: opts(FAQ_CATEGORIES, optionLabels.faqCategory) }],
  },
  form: {
    sections: [
      {
        title: text('Question', 'Soru'),
        fields: [
          { kind: 'text', name: 'question', label: text('Question', 'Soru'), localized: true, required: true },
          { kind: 'richText', name: 'answer', label: text('Answer', 'Cevap'), localized: true, required: true, description: text('Placeholders filled from Settings: {{legalName}}, {{company}}, {{address}}, {{email}}, {{phone}}, {{authorizationNumber}}, {{mersisNumber}}, {{taxOffice}}, {{taxNumber}}, {{cancelHours}}, {{graceMinutes}}, {{minLeadHours}}', 'Ayarlardan otomatik dolan alanlar: {{legalName}}, {{company}}, {{address}}, {{email}}, {{phone}}, {{authorizationNumber}}, {{mersisNumber}}, {{taxOffice}}, {{taxNumber}}, {{cancelHours}}, {{graceMinutes}}, {{minLeadHours}}') },
        ],
      },
      visibilitySection([
        { kind: 'select', name: 'category', label: text('Category', 'Kategori'), options: opts(FAQ_CATEGORIES, optionLabels.faqCategory), required: true },
      ]),
    ],
  },
}

const pages: CollectionResource = {
  type: 'collection',
  slug: 'pages',
  path: 'pages',
  labels: { singular: text('Page', 'Sayfa'), plural: text('Pages', 'Sayfalar') },
  description: text('About us, privacy notice (KVKK), cookie policy, rental terms…', 'Hakkımızda, KVKK aydınlatma metni, çerez politikası, kiralama koşulları…'),
  titleField: 'title',
  canCreate: true,
  canDelete: true,
  list: {
    columns: [
      { path: 'title', label: text('Title', 'Başlık'), kind: 'text', secondary: { path: 'slug', kind: 'mono' } },
      { path: 'updatedAt', label: text('Updated', 'Güncellendi'), kind: 'datetime' },
      { path: '_status', label: common.status, kind: 'badge', options: { published: text('Published', 'Yayında'), draft: text('Draft', 'Taslak') } },
    ],
    searchFields: ['title', 'slug'],
    defaultSort: 'title',
  },
  form: {
    sections: [
      {
        title: text('Content', 'İçerik'),
        fields: [
          { kind: 'text', name: 'title', label: text('Title', 'Başlık'), localized: true, required: true },
          { kind: 'richText', name: 'content', label: text('Content', 'İçerik'), localized: true, description: text('Placeholders filled from Settings: {{legalName}}, {{company}}, {{address}}, {{email}}, {{phone}}, {{authorizationNumber}}, {{mersisNumber}}, {{taxOffice}}, {{taxNumber}}, {{cancelHours}}, {{graceMinutes}}, {{minLeadHours}}', 'Ayarlardan otomatik dolan alanlar: {{legalName}}, {{company}}, {{address}}, {{email}}, {{phone}}, {{authorizationNumber}}, {{mersisNumber}}, {{taxOffice}}, {{taxNumber}}, {{cancelHours}}, {{graceMinutes}}, {{minLeadHours}}') },
        ],
      },
      {
        title: text('Search engines', 'Arama motorları'),
        fields: [
          { kind: 'text', name: 'seo.title', label: text('Meta title', 'Meta başlık'), localized: true },
          { kind: 'textarea', name: 'seo.description', label: text('Meta description', 'Meta açıklama'), localized: true, rows: 2, maxLength: 160 },
        ],
      },
      {
        title: text('Publishing', 'Yayın'),
        aside: true,
        fields: [
          {
            kind: 'select',
            name: '_status',
            label: common.status,
            required: true,
            defaultValue: 'published',
            options: [
              { value: 'published', label: text('Published', 'Yayında') },
              { value: 'draft', label: text('Draft (hidden on the website)', 'Taslak (sitede görünmez)') },
            ],
          },
          { kind: 'text', name: 'slug', label: common.slug, required: true, mono: true, description: text('e.g. privacy-notice', 'ör. kvkk-aydinlatma-metni') },
        ],
      },
    ],
  },
}

const users: CollectionResource = {
  type: 'collection',
  slug: 'users',
  path: 'users',
  labels: { singular: text('User', 'Kullanıcı'), plural: text('Users', 'Kullanıcılar') },
  description: text('Staff accounts. Branch staff only see their locations.', 'Personel hesapları. Şube personeli sadece kendi şubelerini görür.'),
  adminOnly: true,
  titleField: 'name',
  canCreate: true,
  canDelete: true,
  list: {
    columns: [
      { path: 'name', label: common.name, kind: 'text', secondary: { path: 'email', kind: 'text' } },
      { path: 'locations', label: text('Locations', 'Şubeler'), kind: 'relation' },
      { path: 'role', label: text('Role', 'Rol'), kind: 'badge', options: optionLabels.userRole },
    ],
    searchFields: ['name', 'email'],
    defaultSort: 'name',
    filters: [{ name: 'role', label: text('Role', 'Rol'), options: opts(USER_ROLES, optionLabels.userRole) }],
  },
  form: {
    sections: [
      {
        title: text('Account', 'Hesap'),
        fields: [
          { kind: 'text', name: 'name', label: text('Full name', 'Ad soyad'), required: true, width: 'half' },
          { kind: 'email', name: 'email', label: text('Email', 'E-posta'), required: true, width: 'half' },
          {
            kind: 'password',
            name: 'password',
            label: text('Password', 'Şifre'),
            width: 'half',
            description: text('Leave empty to keep the current password.', 'Mevcut şifreyi korumak için boş bırakın.'),
          },
        ],
      },
      {
        title: text('Permissions', 'Yetkiler'),
        aside: true,
        fields: [
          { kind: 'select', name: 'role', label: text('Role', 'Rol'), options: opts(USER_ROLES, optionLabels.userRole), required: true },
          {
            kind: 'relation',
            name: 'locations',
            label: text('Locations', 'Şubeler'),
            relationTo: 'locations',
            hasMany: true,
            condition: { field: 'role', in: ['staff'] },
            description: text('Required for branch staff.', 'Şube personeli için zorunlu.'),
          },
        ],
      },
    ],
  },
}

const settings: GlobalResource = {
  type: 'global',
  slug: 'settings',
  path: 'settings',
  adminOnly: true,
  labels: { singular: text('Settings', 'Ayarlar'), plural: text('Settings', 'Ayarlar') },
  form: {
    sections: [
      {
        title: text('Company', 'Firma'),
        fields: [
          { kind: 'text', name: 'companyName', label: text('Brand name', 'Marka adı'), required: true, width: 'half' },
          { kind: 'text', name: 'legalName', label: text('Legal name', 'Ticari unvan'), width: 'half' },
          {
            kind: 'text',
            name: 'authorizationNumber',
            label: text('Rental authorisation no.', 'Kiralama yetki belgesi no'),
            description: text('Shown on the website as the rental regulation requires.', 'Kiralama yönetmeliği gereği sitede gösterilir.'),
            width: 'half',
          },
          { kind: 'text', name: 'mersisNumber', label: text('MERSIS number', 'MERSİS no'), width: 'half' },
          { kind: 'text', name: 'taxOffice', label: text('Tax office', 'Vergi dairesi'), width: 'half' },
          { kind: 'text', name: 'taxNumber', label: text('Tax number', 'Vergi no'), width: 'half' },
          { kind: 'text', name: 'phone', label: text('Phone', 'Telefon'), width: 'third' },
          { kind: 'text', name: 'whatsapp', label: text('WhatsApp (e.g. 905551112233)', 'WhatsApp (ör. 905551112233)'), width: 'third' },
          { kind: 'email', name: 'email', label: text('Email', 'E-posta'), width: 'third' },
          { kind: 'textarea', name: 'address', label: text('Head office address', 'Merkez adres'), rows: 2 },
        ],
      },
      {
        title: text('Social media', 'Sosyal medya'),
        fields: [
          { kind: 'text', name: 'socialLinks.instagram', label: 'Instagram' as unknown as AdminText, width: 'half' },
          { kind: 'text', name: 'socialLinks.facebook', label: 'Facebook' as unknown as AdminText, width: 'half' },
          { kind: 'text', name: 'socialLinks.x', label: 'X' as unknown as AdminText, width: 'half' },
          { kind: 'text', name: 'socialLinks.youtube', label: 'YouTube' as unknown as AdminText, width: 'half' },
        ],
      },
      {
        title: text('Reservation rules', 'Rezervasyon kuralları'),
        description: text('Apply to website bookings. Staff can override them.', 'Web sitesi rezervasyonlarına uygulanır. Personel bunları aşabilir.'),
        fields: [
          { kind: 'number', name: 'reservationRules.minLeadTimeHours', label: text('Min. notice', 'Min. ön süre'), min: 0, suffix: text('hours', 'saat').tr, required: true, width: 'third' },
          { kind: 'number', name: 'reservationRules.minRentalDays', label: text('Min. rental', 'Min. kiralama'), min: 1, suffix: text('days', 'gün').tr, required: true, width: 'third' },
          { kind: 'number', name: 'reservationRules.maxRentalDays', label: text('Max. online rental', 'Online maks. kiralama'), min: 1, suffix: text('days', 'gün').tr, required: true, width: 'third' },
          { kind: 'number', name: 'reservationRules.maxAdvanceDays', label: text('Bookable ahead', 'En ileri rezervasyon'), min: 1, suffix: text('days', 'gün').tr, required: true, width: 'third' },
          { kind: 'number', name: 'reservationRules.graceMinutes', label: text('Late return grace', 'Geç iade toleransı'), min: 0, suffix: text('min', 'dk').tr, required: true, width: 'third' },
          { kind: 'number', name: 'reservationRules.bufferMinutes', label: text('Buffer between rentals', 'Kiralamalar arası hazırlık'), min: 0, suffix: text('min', 'dk').tr, required: true, width: 'third' },
          { kind: 'number', name: 'reservationRules.selfCancelCutoffHours', label: text('Online cancellation until', 'Online iptal süresi'), min: 0, suffix: text('hours before', 'saat önce').tr, required: true, width: 'half' },
          { kind: 'textarea', name: 'cancellationPolicy', label: text('Cancellation policy (short)', 'İptal koşulları (kısa)'), localized: true, rows: 3 },
        ],
      },
      {
        title: text('Currency & bank accounts', 'Para birimi ve banka hesapları'),
        fields: [
          {
            kind: 'select',
            name: 'baseCurrency',
            label: text('Base currency', 'Ana para birimi'),
            options: opts(CURRENCIES, optionLabels.currency),
            required: true,
            width: 'half',
            description: text('Changing it does not convert existing prices.', 'Değiştirmek mevcut fiyatları dönüştürmez.'),
          },
          { kind: 'multiSelect', name: 'displayCurrencies', label: text('Shown on the website', 'Sitede gösterilenler'), options: opts(CURRENCIES, optionLabels.currency), width: 'half' },
          {
            kind: 'array',
            name: 'bankAccounts',
            label: text('Bank accounts (shown for transfers)', 'Banka hesapları (havale için gösterilir)'),
            addLabel: text('Add account', 'Hesap ekle'),
            fields: [
              { kind: 'text', name: 'bankName', label: text('Bank', 'Banka'), required: true, width: 'quarter' },
              { kind: 'text', name: 'accountHolder', label: text('Account holder', 'Hesap sahibi'), required: true, width: 'quarter' },
              { kind: 'text', name: 'iban', label: 'IBAN' as unknown as AdminText, required: true, mono: true, uppercase: true, width: 'third' },
              { kind: 'select', name: 'currency', label: text('Currency', 'Para birimi'), options: opts(CURRENCIES, optionLabels.currency), required: true, width: 'quarter' },
            ],
          },
        ],
      },
      {
        title: text('Notifications', 'Bildirimler'),
        aside: true,
        description: text('New reservations, corporate requests and document reminders go to these addresses.', 'Yeni rezervasyon, kurumsal talep ve belge hatırlatmaları bu adreslere gider.'),
        fields: [
          {
            kind: 'array',
            name: 'notificationEmails',
            label: text('Staff emails', 'Personel e-postaları'),
            addLabel: text('Add email', 'E-posta ekle'),
            fields: [{ kind: 'email', name: 'email', label: text('Email', 'E-posta'), required: true }],
          },
        ],
      },
    ],
  },
}

const exchangeRates: GlobalResource = {
  type: 'global',
  slug: 'exchange-rates',
  path: 'exchange-rates',
  labels: { singular: text('Exchange rates', 'Döviz kurları'), plural: text('Exchange rates', 'Döviz kurları') },
  description: text('Display-only conversion from the base currency. Refreshed every 5 minutes when the XE API is configured.', 'Ana para biriminden gösterim amaçlı çeviri. XE API tanımlıysa 5 dakikada bir güncellenir.'),
  form: {
    sections: [
      {
        title: text('Rates', 'Kurlar'),
        description: text('1 unit of the base currency = rate × currency', '1 birim ana para birimi = kur × para birimi'),
        fields: [
          {
            kind: 'array',
            name: 'rates',
            label: text('Rates', 'Kurlar'),
            addLabel: text('Add rate', 'Kur ekle'),
            fields: [
              { kind: 'select', name: 'currency', label: text('Currency', 'Para birimi'), options: opts(CURRENCIES, optionLabels.currency), required: true, width: 'half' },
              { kind: 'number', name: 'rate', label: text('Rate', 'Kur'), min: 0, step: 0.0001, required: true, width: 'half' },
            ],
          },
        ],
      },
      {
        title: text('Source', 'Kaynak'),
        aside: true,
        fields: [
          { kind: 'select', name: 'baseCurrency', label: text('Base currency', 'Ana para birimi'), options: opts(CURRENCIES, optionLabels.currency), readOnly: true },
          { kind: 'text', name: 'source', label: text('Source', 'Kaynak'), readOnly: true },
          { kind: 'datetime', name: 'fetchedAt', label: text('Last update', 'Son güncelleme'), readOnly: true },
        ],
      },
    ],
  },
}

export const RESOURCES: ResourceDef[] = [
  vehicleModels,
  vehicles,
  vehicleBlocks,
  vehicleCategories,
  locations,
  seasons,
  extras,
  transferFees,
  penalties,
  corporateRequests,
  handovers,
  faqs,
  pages,
  users,
  settings,
  exchangeRates,
]

export function getResource(path: string): ResourceDef | null {
  return RESOURCES.find((resource) => resource.path === path) ?? null
}
