import type { Locale } from '@rent/shared/constants'

/**
 * Where the business works: the office district and the districts it delivers cars to. Each area
 * gets its own landing page (/arac-kiralama/foca …) with content written for that place, so the
 * pages are useful to visitors rather than keyword copies. Distances are approximate driving figures
 * from the office.
 */
export type ServiceArea = {
  slug: string
  /** The district of the office itself (no delivery note). */
  base?: boolean
  km: number
  minutes: number
  name: Record<Locale, string>
  intro: Record<Locale, string[]>
}

export const SERVICE_AREAS: ServiceArea[] = [
  {
    slug: 'menemen',
    base: true,
    km: 0,
    minutes: 0,
    name: { tr: 'Menemen', en: 'Menemen', de: 'Menemen', ru: 'Менемен' },
    intro: {
      tr: [
        'Dost Rent a Car’ın ofisi Menemen’de, Gaffar Okan Caddesi üzerinde. Aracınızı ofisimizden teslim alıp iş, tatil ya da günlük işleriniz için hemen yola çıkabilirsiniz.',
        'Menemen, İzmir’in kuzeyinde; Foça, Aliağa, Çiğli ve Manisa yönüne kısa sürede ulaşabileceğiniz bir konumda. Günlük, haftalık ve aylık kiralamalarda net fiyat veriyor, ön ödeme istemiyoruz.',
      ],
      en: [
        'Dost Rent a Car’s office is in Menemen, on Gaffar Okan Avenue. Collect your car at our office and set off for work, a holiday or everyday errands.',
        'Menemen lies north of İzmir, a short drive from Foça, Aliağa, Çiğli and Manisa. We give clear prices for daily, weekly and monthly rentals and take no prepayment.',
      ],
      de: [
        'Das Büro von Dost Rent a Car liegt in Menemen an der Gaffar-Okan-Straße. Holen Sie Ihr Auto bei uns ab und starten Sie direkt zur Arbeit, in den Urlaub oder zu Erledigungen.',
        'Menemen liegt nördlich von İzmir, nur eine kurze Fahrt von Foça, Aliağa, Çiğli und Manisa entfernt. Wir nennen klare Preise für Tages-, Wochen- und Monatsmieten – ohne Vorauszahlung.',
      ],
      ru: [
        'Офис Dost Rent a Car находится в Менемене, на улице Гаффар Окан. Получите автомобиль в офисе и отправляйтесь по делам, в отпуск или на работу.',
        'Менемен расположен к северу от Измира, недалеко от Фочи, Алиаги, Чигли и Манисы. Мы называем понятные цены на посуточную, недельную и месячную аренду и не берём предоплату.',
      ],
    },
  },
  {
    slug: 'foca',
    km: 35,
    minutes: 35,
    name: { tr: 'Foça', en: 'Foça', de: 'Foça', ru: 'Фоча' },
    intro: {
      tr: [
        'Foça’da tatil yapıyorsanız aracınızı konakladığınız adrese getiriyoruz. Eski Foça’nın koyları, Yeni Foça yolu ve çevredeki plajlar araçla çok daha rahat keşfedilir.',
        'Tatil süresince haftalık kiralamada günlük fiyat düşer; çocuk koltuğu ve ek sürücü gibi hizmetleri rezervasyon sırasında ekleyebilirsiniz.',
      ],
      en: [
        'Staying in Foça? We bring the car to your address. The coves of Eski Foça, the road to Yeni Foça and the nearby beaches are much easier to explore by car.',
        'Weekly rentals come with a lower daily rate, and extras like a child seat or an additional driver can be added when you book.',
      ],
      de: [
        'Urlaub in Foça? Wir bringen das Auto zu Ihrer Unterkunft. Die Buchten von Eski Foça, die Straße nach Yeni Foça und die Strände der Umgebung erkunden Sie mit dem Auto viel bequemer.',
        'Bei Wochenmieten sinkt der Tagespreis; Kindersitz oder Zusatzfahrer können Sie bei der Buchung hinzufügen.',
      ],
      ru: [
        'Отдыхаете в Фоче? Мы привезём автомобиль по вашему адресу. Бухты Старой Фочи, дорогу в Новую Фочу и ближайшие пляжи гораздо удобнее посещать на машине.',
        'При аренде на неделю цена за сутки ниже; детское кресло и дополнительного водителя можно добавить при бронировании.',
      ],
    },
  },
  {
    slug: 'aliaga',
    km: 30,
    minutes: 30,
    name: { tr: 'Aliağa', en: 'Aliağa', de: 'Aliağa', ru: 'Алиага' },
    intro: {
      tr: [
        'Aliağa’da iş seyahati, proje ya da uzun dönem ihtiyaçlarınız için aracınızı adresinize teslim ediyoruz.',
        'Bölgedeki işletmeler için tek sözleşme ve aylık faturayla kurumsal kiralama seçeneklerimiz de var; teklif için Kurumsal sayfamızdan bize yazabilirsiniz.',
      ],
      en: [
        'In Aliağa for business, a project or a longer stay? We deliver the car to your address.',
        'For companies in the area we offer corporate rental with one contract and a monthly invoice – request an offer on our Corporate page.',
      ],
      de: [
        'Geschäftlich, für ein Projekt oder länger in Aliağa? Wir liefern das Auto an Ihre Adresse.',
        'Für Unternehmen in der Region bieten wir Firmenmiete mit einem Vertrag und monatlicher Rechnung – fordern Sie auf der Seite „Firmenkunden“ ein Angebot an.',
      ],
      ru: [
        'В Алиаге по работе, на проекте или надолго? Мы доставим автомобиль по вашему адресу.',
        'Для компаний региона есть корпоративная аренда с одним договором и ежемесячным счётом — запросите предложение на странице «Компаниям».',
      ],
    },
  },
  {
    slug: 'cigli',
    km: 15,
    minutes: 20,
    name: { tr: 'Çiğli', en: 'Çiğli', de: 'Çiğli', ru: 'Чигли' },
    intro: {
      tr: [
        'Çiğli’de ev, iş yeri veya Atatürk Organize Sanayi Bölgesi’ndeki adresinize araç teslim ediyoruz.',
        'Kısa süreli ihtiyaçlarınızın yanı sıra aylık kiralamada da uygun fiyatlar sunuyoruz; ekonomik araçlardan SUV’lere kadar filomuzu aşağıda inceleyebilirsiniz.',
      ],
      en: [
        'We deliver cars to your home, workplace or address in the Atatürk Organised Industrial Zone in Çiğli.',
        'Alongside short rentals we offer good monthly rates; browse our fleet from economy cars to SUVs below.',
      ],
      de: [
        'Wir liefern Autos zu Ihnen nach Hause, an Ihren Arbeitsplatz oder in die Organisierte Industriezone Atatürk in Çiğli.',
        'Neben Kurzzeitmieten bieten wir günstige Monatspreise; unsere Flotte vom Kleinwagen bis zum SUV finden Sie unten.',
      ],
      ru: [
        'Доставляем автомобили к дому, на работу или в Организованную промышленную зону Ататюрк в Чигли.',
        'Помимо краткосрочной аренды предлагаем выгодные месячные тарифы; автопарк от эконом-класса до SUV — ниже.',
      ],
    },
  },
  {
    slug: 'karsiyaka',
    km: 25,
    minutes: 30,
    name: { tr: 'Karşıyaka', en: 'Karşıyaka', de: 'Karşıyaka', ru: 'Каршияка' },
    intro: {
      tr: [
        'Karşıyaka’da yaşıyor ya da misafir ağırlıyorsanız aracınızı adresinize getiriyoruz.',
        'Şehir içi kullanım için ekonomik araçlardan kalabalık aileler için geniş bagajlı SUV’lere kadar seçenek sunuyoruz; fiyatı tarihlerinizi seçerek hemen görebilirsiniz.',
      ],
      en: [
        'Live in Karşıyaka or hosting guests? We bring the car to your address.',
        'From economy cars for the city to roomy SUVs for larger families – choose your dates to see the price straight away.',
      ],
      de: [
        'Sie wohnen in Karşıyaka oder haben Besuch? Wir bringen das Auto zu Ihrer Adresse.',
        'Vom sparsamen Stadtauto bis zum geräumigen SUV für größere Familien – wählen Sie Ihre Daten und sehen Sie sofort den Preis.',
      ],
      ru: [
        'Живёте в Каршияке или принимаете гостей? Мы привезём автомобиль по вашему адресу.',
        'От экономичных машин для города до вместительных SUV для больших семей — выберите даты и сразу узнайте цену.',
      ],
    },
  },
]

export const BASE_AREA = SERVICE_AREAS.find((area) => area.base)!
export const DELIVERY_AREAS = SERVICE_AREAS.filter((area) => !area.base)

export function getServiceArea(slug: string): ServiceArea | undefined {
  return SERVICE_AREAS.find((area) => area.slug === slug)
}

/** "Foça, Aliağa, Çiğli ve Karşıyaka" in the page language. */
export function listAreas(areas: ServiceArea[], locale: Locale, intlLocale: string): string {
  return new Intl.ListFormat(intlLocale, { style: 'long', type: 'conjunction' }).format(areas.map((area) => area.name[locale]))
}
