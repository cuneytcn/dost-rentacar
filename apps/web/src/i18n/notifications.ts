import type { Locale } from '@rent/shared'

/** Customer-facing notification copy. Placeholders: {code}, {name}, {company}, {location}, {date}. */
export type CustomerMessages = {
  greeting: string
  details: {
    code: string
    vehicle: string
    pickup: string
    return: string
    days: string
    extras: string
    total: string
    deposit: string
  }
  created: { subject: string; intro: string }
  confirmed: { subject: string; intro: string }
  cancelled: { subject: string; intro: string }
  reminder: { subject: string; intro: string; bring: string; bringItems: string[] }
  payment: {
    title: string
    office: string
    bankTransfer: string
    bankReference: string
    iban: string
    accountHolder: string
  }
  locationTitle: string
  manage: string
  footer: string
  sms: { confirmed: string; reminder: string }
}

export const customerMessages: Record<Locale, CustomerMessages> = {
  tr: {
    greeting: 'Merhaba {name},',
    details: {
      code: 'Rezervasyon no',
      vehicle: 'Araç',
      pickup: 'Alış',
      return: 'İade',
      days: 'Gün',
      extras: 'Ek hizmetler',
      total: 'Toplam',
      deposit: 'Depozito',
    },
    created: {
      subject: 'Rezervasyon talebiniz alındı – {code}',
      intro: 'Rezervasyon talebiniz bize ulaştı. Müsaitliği kontrol edip en kısa sürede onaylayacağız.',
    },
    confirmed: {
      subject: 'Rezervasyonunuz onaylandı – {code}',
      intro: 'Rezervasyonunuz onaylandı. Aracınız belirtilen tarih ve şubede sizi bekliyor olacak.',
    },
    cancelled: {
      subject: 'Rezervasyonunuz iptal edildi – {code}',
      intro: 'Rezervasyonunuz iptal edildi. Bir hata olduğunu düşünüyorsanız lütfen bizimle iletişime geçin.',
    },
    reminder: {
      subject: 'Aracınızı yarın teslim alacaksınız – {code}',
      intro: 'Aracınızı teslim almanıza az kaldı. Detayları aşağıda bulabilirsiniz.',
      bring: 'Yanınızda bulundurmanız gerekenler:',
      bringItems: ['Sürücü belgesi', 'Kimlik kartı veya pasaport', 'Depozito için sürücü adına kredi kartı'],
    },
    payment: {
      title: 'Ödeme',
      office: 'Ödemeyi aracı teslim alırken ofisimizde yapabilirsiniz.',
      bankTransfer: 'Ödemeyi aşağıdaki hesaplardan birine havale/EFT ile yapabilirsiniz.',
      bankReference: 'Lütfen açıklama kısmına rezervasyon numaranızı ({code}) yazın.',
      iban: 'IBAN',
      accountHolder: 'Hesap sahibi',
    },
    locationTitle: 'Teslim alacağınız şube',
    manage: 'Rezervasyonumu görüntüle',
    footer: 'Bu e-posta rezervasyonunuzla ilgili bilgilendirme amacıyla gönderilmiştir.',
    sms: {
      confirmed: '{company}: {code} numarali rezervasyonunuz onaylandi. Alis: {date}, {location}.',
      reminder: '{company}: Aracinizi {date} tarihinde {location} subesinden teslim alacaksiniz. Rezervasyon no: {code}.',
    },
  },
  en: {
    greeting: 'Hello {name},',
    details: {
      code: 'Reservation no.',
      vehicle: 'Vehicle',
      pickup: 'Pickup',
      return: 'Return',
      days: 'Days',
      extras: 'Extras',
      total: 'Total',
      deposit: 'Deposit',
    },
    created: {
      subject: 'We received your reservation request – {code}',
      intro: 'Thank you for your reservation request. We will check availability and confirm it shortly.',
    },
    confirmed: {
      subject: 'Your reservation is confirmed – {code}',
      intro: 'Your reservation is confirmed. Your car will be ready at the selected location and time.',
    },
    cancelled: {
      subject: 'Your reservation has been cancelled – {code}',
      intro: 'Your reservation has been cancelled. If you think this is a mistake, please contact us.',
    },
    reminder: {
      subject: 'Your car pickup is tomorrow – {code}',
      intro: 'Your pickup is coming up soon. Here are the details.',
      bring: 'Please bring:',
      bringItems: ["Driver's license", 'ID card or passport', "Credit card in the driver's name for the deposit"],
    },
    payment: {
      title: 'Payment',
      office: 'You can pay at our office when you pick up the car.',
      bankTransfer: 'You can pay by bank transfer to one of the accounts below.',
      bankReference: 'Please enter your reservation number ({code}) as the payment reference.',
      iban: 'IBAN',
      accountHolder: 'Account holder',
    },
    locationTitle: 'Pickup location',
    manage: 'View my reservation',
    footer: 'This email was sent to inform you about your reservation.',
    sms: {
      confirmed: '{company}: Your reservation {code} is confirmed. Pickup: {date}, {location}.',
      reminder: '{company}: Reminder - pickup on {date} at {location}. Reservation {code}.',
    },
  },
  de: {
    greeting: 'Hallo {name},',
    details: {
      code: 'Reservierungsnr.',
      vehicle: 'Fahrzeug',
      pickup: 'Abholung',
      return: 'Rückgabe',
      days: 'Tage',
      extras: 'Extras',
      total: 'Gesamt',
      deposit: 'Kaution',
    },
    created: {
      subject: 'Ihre Reservierungsanfrage ist eingegangen – {code}',
      intro: 'Vielen Dank für Ihre Reservierungsanfrage. Wir prüfen die Verfügbarkeit und bestätigen sie in Kürze.',
    },
    confirmed: {
      subject: 'Ihre Reservierung ist bestätigt – {code}',
      intro: 'Ihre Reservierung ist bestätigt. Ihr Fahrzeug steht zur gewählten Zeit an der gewählten Station bereit.',
    },
    cancelled: {
      subject: 'Ihre Reservierung wurde storniert – {code}',
      intro: 'Ihre Reservierung wurde storniert. Falls es sich um einen Fehler handelt, kontaktieren Sie uns bitte.',
    },
    reminder: {
      subject: 'Morgen holen Sie Ihr Fahrzeug ab – {code}',
      intro: 'Ihre Abholung steht bevor. Hier sind die Details.',
      bring: 'Bitte mitbringen:',
      bringItems: ['Führerschein', 'Personalausweis oder Reisepass', 'Kreditkarte auf den Namen des Fahrers für die Kaution'],
    },
    payment: {
      title: 'Zahlung',
      office: 'Sie können bei der Abholung in unserem Büro bezahlen.',
      bankTransfer: 'Sie können per Banküberweisung auf eines der folgenden Konten bezahlen.',
      bankReference: 'Bitte geben Sie Ihre Reservierungsnummer ({code}) als Verwendungszweck an.',
      iban: 'IBAN',
      accountHolder: 'Kontoinhaber',
    },
    locationTitle: 'Abholstation',
    manage: 'Meine Reservierung ansehen',
    footer: 'Diese E-Mail informiert Sie über Ihre Reservierung.',
    sms: {
      confirmed: '{company}: Ihre Reservierung {code} ist bestaetigt. Abholung: {date}, {location}.',
      reminder: '{company}: Erinnerung - Abholung am {date} in {location}. Reservierung {code}.',
    },
  },
  ru: {
    greeting: 'Здравствуйте, {name}!',
    details: {
      code: 'Номер брони',
      vehicle: 'Автомобиль',
      pickup: 'Получение',
      return: 'Возврат',
      days: 'Дней',
      extras: 'Дополнительные услуги',
      total: 'Итого',
      deposit: 'Депозит',
    },
    created: {
      subject: 'Ваша заявка на бронирование получена – {code}',
      intro: 'Спасибо за заявку. Мы проверим наличие и подтвердим бронирование в ближайшее время.',
    },
    confirmed: {
      subject: 'Ваше бронирование подтверждено – {code}',
      intro: 'Ваше бронирование подтверждено. Автомобиль будет ждать вас в выбранном офисе в указанное время.',
    },
    cancelled: {
      subject: 'Ваше бронирование отменено – {code}',
      intro: 'Ваше бронирование отменено. Если это ошибка, пожалуйста, свяжитесь с нами.',
    },
    reminder: {
      subject: 'Завтра вы получаете автомобиль – {code}',
      intro: 'Скоро получение автомобиля. Подробности ниже.',
      bring: 'Пожалуйста, возьмите с собой:',
      bringItems: ['Водительское удостоверение', 'Удостоверение личности или паспорт', 'Кредитную карту на имя водителя для депозита'],
    },
    payment: {
      title: 'Оплата',
      office: 'Оплатить можно в нашем офисе при получении автомобиля.',
      bankTransfer: 'Оплатить можно банковским переводом на один из счетов ниже.',
      bankReference: 'Пожалуйста, укажите номер брони ({code}) в назначении платежа.',
      iban: 'IBAN',
      accountHolder: 'Владелец счета',
    },
    locationTitle: 'Офис получения',
    manage: 'Посмотреть бронирование',
    footer: 'Это письмо отправлено для информирования о вашем бронировании.',
    sms: {
      confirmed: '{company}: Бронирование {code} подтверждено. Получение: {date}, {location}.',
      reminder: '{company}: Напоминание - получение {date}, {location}. Бронь {code}.',
    },
  },
}

/** Internal staff notifications are in the admin panel's primary language. */
export const staffMessages = {
  newReservation: {
    subject: 'Yeni rezervasyon talebi: {code}',
    intro: 'Web sitesinden yeni bir rezervasyon talebi geldi. Onaylamak ve araç atamak için admin paneline gidin.',
    customer: 'Müşteri',
    phone: 'Telefon',
    email: 'E-posta',
    payment: 'Ödeme tercihi',
    note: 'Müşteri notu',
    open: 'Admin panelinde aç',
    paymentMethods: { office: 'Ofiste', bank_transfer: 'Havale / EFT' },
  },
  newCorporateRequest: {
    subject: 'Yeni kurumsal talep: {company}',
    intro: 'Web sitesinden yeni bir kurumsal / uzun dönem kiralama talebi geldi.',
    contact: 'Yetkili',
    vehicles: 'Araç adedi',
    start: 'Başlangıç',
    duration: 'Süre (ay)',
    notes: 'Not',
    open: 'Admin panelinde aç',
  },
}

export const staffDocumentMessages = {
  subject: 'Araç belgesi hatırlatması: {count} kayıt',
  intro: 'Aşağıdaki araçların belgelerinin süresi dolmak üzere veya dolmuş. Yenilendiğinde araç kaydındaki tarihi güncelleyin.',
  plate: 'Plaka',
  document: 'Belge',
  expiresOn: 'Bitiş',
  status: 'Durum',
  expired: 'Süresi doldu',
  daysLeft: '{days} gün kaldı',
  today: 'Bugün bitiyor',
  documents: { insuranceExpiresAt: 'Trafik sigortası', cascoExpiresAt: 'Kasko', inspectionExpiresAt: 'Muayene' },
}

export function fill(template: string, values: Record<string, string>): string {
  return template.replace(/\{(\w+)\}/g, (match, key: string) => values[key] ?? match)
}
