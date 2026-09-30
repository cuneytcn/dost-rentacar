import type { Option } from 'payload'

/** Admin panel UI languages. Content locales are configured separately (see @rent/shared LOCALES). */
export type AdminText = { en: string; tr: string }

export const text = (en: string, tr: string): AdminText => ({ en, tr })

/** Builds Payload select options from a list of values and their admin translations. */
export function options<T extends string>(values: readonly T[], labels: Record<T, AdminText>): Option[] {
  return values.map((value) => ({ value, label: labels[value] }))
}

export const optionLabels = {
  userRole: {
    admin: text('Administrator', 'Yönetici'),
    staff: text('Branch staff', 'Şube personeli'),
  },
  transmission: {
    manual: text('Manual', 'Manuel'),
    automatic: text('Automatic', 'Otomatik'),
  },
  fuelType: {
    petrol: text('Petrol', 'Benzin'),
    diesel: text('Diesel', 'Dizel'),
    hybrid: text('Hybrid', 'Hibrit'),
    electric: text('Electric', 'Elektrik'),
    lpg: text('LPG', 'LPG'),
  },
  vehicleFeature: {
    air_conditioning: text('Air conditioning', 'Klima'),
    bluetooth: text('Bluetooth', 'Bluetooth'),
    navigation: text('Navigation', 'Navigasyon'),
    cruise_control: text('Cruise control', 'Hız sabitleyici'),
    parking_sensors: text('Parking sensors', 'Park sensörü'),
    rear_camera: text('Rear camera', 'Geri görüş kamerası'),
    apple_carplay: text('Apple CarPlay', 'Apple CarPlay'),
    android_auto: text('Android Auto', 'Android Auto'),
    sunroof: text('Sunroof', 'Sunroof'),
    heated_seats: text('Heated seats', 'Isıtmalı koltuk'),
    usb: text('USB', 'USB'),
    isofix: text('ISOFIX', 'ISOFIX'),
  },
  vehicleStatus: {
    active: text('Active', 'Aktif'),
    maintenance: text('In maintenance', 'Bakımda'),
    inactive: text('Inactive', 'Pasif'),
    sold: text('Sold', 'Satıldı'),
  },
  vehicleBlockReason: {
    maintenance: text('Maintenance', 'Bakım'),
    repair: text('Repair', 'Onarım'),
    inspection: text('Inspection', 'Muayene'),
    other: text('Other', 'Diğer'),
  },
  extraPricingType: {
    per_day: text('Per day', 'Günlük'),
    per_rental: text('Per rental', 'Kiralama başına'),
  },
  reservationStatus: {
    pending: text('Awaiting confirmation', 'Onay bekliyor'),
    confirmed: text('Awaiting pickup', 'Teslim bekliyor'),
    active: text('With customer', 'Müşteride'),
    completed: text('Returned', 'İade alındı'),
    cancelled: text('Cancelled', 'İptal edildi'),
    no_show: text('No-show', 'Gelmedi'),
  },
  paymentStatus: {
    unpaid: text('Nothing paid', 'Hiç ödenmedi'),
    partial: text('Partly paid', 'Kısmen ödendi'),
    paid: text('Fully paid', 'Tamamı ödendi'),
    refunded: text('Refunded', 'İade edildi'),
  },
  paymentMethod: {
    office_cash: text('Cash at office', 'Ofiste nakit'),
    office_card: text('Card at office', 'Ofiste kart'),
    bank_transfer: text('Bank transfer', 'Havale / EFT'),
  },
  preferredPaymentMethod: {
    office: text('At the office', 'Ofiste'),
    bank_transfer: text('Bank transfer', 'Havale / EFT'),
  },
  reservationSource: {
    web: text('Website', 'Web sitesi'),
    mobile: text('Mobile app', 'Mobil uygulama'),
    phone: text('Phone', 'Telefon'),
    walk_in: text('Walk-in', 'Ofise gelen'),
    corporate: text('Corporate', 'Kurumsal'),
  },
  idDocumentType: {
    national_id: text('National ID', 'T.C. Kimlik'),
    passport: text('Passport', 'Pasaport'),
  },
  handoverType: {
    pickup: text('Pickup (vehicle given)', 'Teslim (araç verildi)'),
    return: text('Return (vehicle received)', 'İade (araç alındı)'),
  },
  fuelLevel: {
    empty: text('Empty', 'Boş'),
    quarter: text('1/4', '1/4'),
    half: text('1/2', '1/2'),
    three_quarters: text('3/4', '3/4'),
    full: text('Full', 'Dolu'),
  },
  damageArea: {
    front: text('Front', 'Ön'),
    rear: text('Rear', 'Arka'),
    left: text('Left side', 'Sol yan'),
    right: text('Right side', 'Sağ yan'),
    roof: text('Roof', 'Tavan'),
    interior: text('Interior', 'İç'),
    windshield: text('Windshield', 'Ön cam'),
    wheels: text('Wheels', 'Jant / lastik'),
    other: text('Other', 'Diğer'),
  },
  penaltyType: {
    toll: text('Toll (HGS/OGS)', 'Geçiş ücreti (HGS/OGS)'),
    traffic_fine: text('Traffic fine', 'Trafik cezası'),
    damage: text('Damage', 'Hasar'),
    fuel: text('Missing fuel', 'Eksik yakıt'),
    extra_km: text('Extra km', 'Fazla km'),
    late_return: text('Late return', 'Geç iade'),
    other: text('Other', 'Diğer'),
  },
  penaltyStatus: {
    open: text('Open', 'Açık'),
    charged: text('Charged to customer', 'Müşteriye yansıtıldı'),
    paid: text('Paid', 'Ödendi'),
    waived: text('Waived', 'Vazgeçildi'),
  },
  corporateRequestStatus: {
    new: text('New', 'Yeni'),
    contacted: text('Contacted', 'İletişime geçildi'),
    quoted: text('Quoted', 'Teklif verildi'),
    won: text('Won', 'Kazanıldı'),
    lost: text('Lost', 'Kaybedildi'),
  },
  faqCategory: {
    booking: text('Booking', 'Rezervasyon'),
    payment: text('Payment', 'Ödeme'),
    requirements: text('Requirements', 'Kiralama şartları'),
    insurance: text('Insurance', 'Sigorta'),
    other: text('Other', 'Diğer'),
  },
  weekday: {
    mon: text('Monday', 'Pazartesi'),
    tue: text('Tuesday', 'Salı'),
    wed: text('Wednesday', 'Çarşamba'),
    thu: text('Thursday', 'Perşembe'),
    fri: text('Friday', 'Cuma'),
    sat: text('Saturday', 'Cumartesi'),
    sun: text('Sunday', 'Pazar'),
  },
  currency: {
    EUR: text('Euro (EUR)', 'Euro (EUR)'),
    TRY: text('Turkish lira (TRY)', 'Türk lirası (TRY)'),
    USD: text('US dollar (USD)', 'ABD doları (USD)'),
    GBP: text('British pound (GBP)', 'İngiliz sterlini (GBP)'),
  },
} as const

export const adminGroups = {
  operations: text('Operations', 'Operasyon'),
  fleet: text('Fleet', 'Filo'),
  pricing: text('Pricing', 'Fiyatlandırma'),
  content: text('Content', 'İçerik'),
  system: text('System', 'Sistem'),
}
