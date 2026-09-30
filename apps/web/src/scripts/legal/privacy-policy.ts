import type { LegalPage } from './types'

/**
 * Privacy notice under Law No. 6698 (KVKK) art. 10 and the Communiqué on the Disclosure
 * Obligation: controller identity, purposes, recipients, collection method and legal bases, rights.
 */
export const privacyPolicy: LegalPage = {
  slug: 'privacy-policy',
  tr: {
    title: 'KVKK Aydınlatma Metni',
    description: '6698 sayılı KVKK kapsamında kişisel verilerinizin nasıl işlendiğine dair aydınlatma metni.',
    body: `
Bu aydınlatma metni, 6698 sayılı Kişisel Verilerin Korunması Kanunu ("KVKK") ve Aydınlatma Yükümlülüğünün Yerine Getirilmesinde Uyulacak Usul ve Esaslar Hakkında Tebliğ uyarınca, veri sorumlusu sıfatıyla {{legalName}} ("Şirket") tarafından hazırlanmıştır.

## 1. Veri sorumlusu

{{legalName}} · MERSİS no: {{mersisNumber}} · Adres: {{address}} · Telefon: {{phone}} · E-posta: {{email}}

## 2. İşlenen kişisel veriler

- **Kimlik:** ad, soyad, doğum tarihi, T.C. kimlik veya pasaport numarası, uyruk.
- **İletişim:** telefon numarası, e-posta adresi, adres.
- **Sürücü belgesi:** ehliyet numarası, sınıfı, veriliş tarihi ve ülkesi.
- **Müşteri işlem:** rezervasyon bilgileri, kiralama tarihleri ve ofisleri, uçuş numarası, talep ve notlarınız.
- **Finans:** ödeme ve iade kayıtları, fatura bilgileri, havale bilgileri, depozito provizyon kayıtları.
- **Araç kullanım:** teslim/iade tutanakları, kilometre ve yakıt bilgileri, hasar kayıtları, köprü/otoyol geçişleri ve trafik cezaları.
- **Hukuki işlem:** uyuşmazlık, şikâyet ve resmi makam yazışmaları.
- **İşlem güvenliği:** IP adresi, tarayıcı bilgileri ve site kullanım kayıtları.
- **Pazarlama:** yalnızca izin vermeniz halinde, kampanya ve duyuru tercihleri.

## 3. İşleme amaçları

- Rezervasyonun alınması, onaylanması ve yönetilmesi; kira sözleşmesinin kurulması ve ifası,
- Sürücü şartlarının (yaş, ehliyet süresi) kontrol edilmesi ve aracın teslimi,
- Ödeme, depozito, fatura ve iade süreçlerinin yürütülmesi,
- Kiralık araç bildirim sistemi (KABİS) dahil yasal bildirimlerin yapılması ve kayıtların saklanması,
- Trafik cezaları, köprü ve otoyol geçiş ücretleri ile hasarların takibi ve ilgili kişilere yansıtılması,
- Sigorta ve ekspertiz süreçlerinin yürütülmesi,
- Talep ve şikâyetlerin yanıtlanması, müşteri hizmetlerinin sunulması,
- Bilgi güvenliğinin sağlanması ve hukuki uyuşmazlıklarda hakların korunması,
- İzin vermeniz halinde kampanya ve duyuruların iletilmesi.

## 4. Toplama yöntemi ve hukuki sebepler

Kişisel verileriniz; internet sitemizdeki rezervasyon ve talep formları, e-posta, telefon, WhatsApp ve ofislerimizde düzenlenen sözleşme ve tutanaklar aracılığıyla, kısmen veya tamamen otomatik yollarla toplanır. Veriler KVKK md. 5/2 kapsamında şu hukuki sebeplere dayanılarak işlenir:

- Bir sözleşmenin kurulması veya ifasıyla doğrudan ilgili olması (md. 5/2-c),
- Veri sorumlusunun hukuki yükümlülüğünü yerine getirebilmesi için zorunlu olması (md. 5/2-ç), örneğin kiralık araç bildirimi, vergi ve ticaret mevzuatı,
- Bir hakkın tesisi, kullanılması veya korunması için zorunlu olması (md. 5/2-e),
- İlgili kişinin temel hak ve özgürlüklerine zarar vermemek kaydıyla, veri sorumlusunun meşru menfaatleri için zorunlu olması (md. 5/2-f),
- Ticari elektronik ileti gönderimi için açık rızanız (md. 5/1). Açık rızanızı dilediğiniz zaman geri alabilirsiniz.

## 5. Aktarım

Kişisel verileriniz, yukarıdaki amaçlarla sınırlı olarak:

- Emniyet Genel Müdürlüğü (KABİS), mahkemeler, icra daireleri ve diğer yetkili kamu kurum ve kuruluşlarına,
- Sigorta şirketleri ve bağımsız eksperlere,
- Bankalar ve ödeme kuruluşlarına,
- Hukuk, mali müşavirlik ve denetim hizmeti aldığımız kişilere,
- Barındırma, e-posta, SMS ve bilgi teknolojileri hizmeti aldığımız tedarikçilere

aktarılabilir. Hizmet sağlayıcılarımızın sunucularının yurt dışında bulunması halinde aktarım, KVKK md. 9'da öngörülen şartlara ve güvencelere uygun olarak yapılır.

## 6. Saklama süresi

Kişisel verileriniz, işleme amacının gerektirdiği süre ve ilgili mevzuatta öngörülen zamanaşımı ve saklama süreleri boyunca saklanır; bu sürelerin sonunda silinir, yok edilir veya anonim hale getirilir.

## 7. Haklarınız

KVKK md. 11 uyarınca Şirkete başvurarak; kişisel verilerinizin işlenip işlenmediğini öğrenme, işlenmişse bilgi talep etme, işlenme amacını ve amacına uygun kullanılıp kullanılmadığını öğrenme, yurt içinde veya yurt dışında aktarıldığı üçüncü kişileri bilme, eksik veya yanlış işlenmişse düzeltilmesini, KVKK md. 7 şartları çerçevesinde silinmesini veya yok edilmesini ve bu işlemlerin aktarıldığı üçüncü kişilere bildirilmesini isteme, münhasıran otomatik sistemlerle analiz edilmesi sonucunda aleyhinize bir sonuç çıkmasına itiraz etme ve kanuna aykırı işleme nedeniyle zarara uğramanız halinde zararın giderilmesini talep etme haklarına sahipsiniz.

## 8. Başvuru

Taleplerinizi, Veri Sorumlusuna Başvuru Usul ve Esasları Hakkında Tebliğ'e uygun olarak kimliğinizi doğrulayan bilgilerle birlikte yazılı olarak {{address}} adresine veya sistemimizde kayıtlı e-posta adresinizden {{email}} adresine iletebilirsiniz. Başvurular en geç 30 gün içinde ücretsiz olarak sonuçlandırılır.
`,
  },
  en: {
    title: 'Privacy Notice',
    description: 'How we process your personal data under the Turkish Personal Data Protection Law No. 6698 (KVKK).',
    body: `
This notice is provided by {{legalName}} (the "Company") as data controller under the Turkish Personal Data Protection Law No. 6698 ("KVKK") and the Communiqué on the Disclosure Obligation.

## 1. Data controller

{{legalName}} · MERSIS no.: {{mersisNumber}} · Address: {{address}} · Phone: {{phone}} · Email: {{email}}

## 2. Personal data we process

- **Identity:** name, surname, date of birth, national ID or passport number, nationality.
- **Contact:** phone number, email address, address.
- **Driving licence:** licence number, class, date and country of issue.
- **Customer transactions:** booking details, rental dates and offices, flight number, your requests and notes.
- **Financial:** payment and refund records, invoice details, bank transfer details, deposit authorisation records.
- **Vehicle use:** handover reports, mileage and fuel, damage records, tolls and traffic fines.
- **Legal:** disputes, complaints and correspondence with authorities.
- **Security:** IP address, browser details and website usage logs.
- **Marketing:** offer and news preferences, only if you opt in.

## 3. Purposes

- Taking, confirming and managing bookings; concluding and performing the rental agreement,
- Checking driver requirements (age, licence) and handing over the car,
- Handling payments, deposits, invoices and refunds,
- Making legal notifications, including the rental vehicle notification system (KABİS), and keeping records,
- Handling traffic fines, tolls and damage and passing them on to the persons concerned,
- Handling insurance and expert assessment processes,
- Answering requests and complaints and providing customer service,
- Ensuring information security and protecting our rights in legal disputes,
- Sending offers and news if you consent.

## 4. Collection method and legal bases

We collect personal data through booking and request forms on our website, email, phone, WhatsApp and the agreements and reports issued at our offices, by fully or partly automated means. We process data on the following legal bases under KVKK art. 5(2):

- It is directly related to concluding or performing a contract (art. 5(2)(c)),
- It is necessary to comply with our legal obligations (art. 5(2)(ç)), e.g. rental vehicle notification, tax and commercial law,
- It is necessary to establish, exercise or defend a right (art. 5(2)(e)),
- It is necessary for our legitimate interests, provided your fundamental rights are not harmed (art. 5(2)(f)),
- Your explicit consent for commercial electronic messages (art. 5(1)), which you may withdraw at any time.

## 5. Transfers

Limited to the purposes above, personal data may be transferred to:

- the General Directorate of Security (KABİS), courts, enforcement offices and other competent public authorities,
- insurance companies and independent experts,
- banks and payment institutions,
- our legal, accounting and audit advisers,
- providers of hosting, email, SMS and IT services.

Where our service providers' servers are located abroad, transfers are made in line with the conditions and safeguards of KVKK art. 9.

## 6. Retention

We keep personal data for as long as the purpose requires and for the limitation and retention periods set by law; afterwards it is deleted, destroyed or anonymised.

## 7. Your rights

Under KVKK art. 11 you may ask us whether your personal data is processed and request information about it; learn the purpose of processing and whether it is used accordingly; know the third parties in Turkey or abroad to whom it is transferred; request correction of incomplete or inaccurate data; request erasure or destruction under art. 7 and notification of these actions to recipients; object to a result against you arising solely from automated analysis; and claim compensation for damage caused by unlawful processing.

## 8. How to apply

Send your request in writing with information verifying your identity to {{address}}, or from the email address registered with us to {{email}}, in line with the Communiqué on Applications to the Data Controller. Requests are answered free of charge within 30 days at the latest.
`,
  },
  de: {
    title: 'Datenschutzhinweise',
    description: 'Wie wir Ihre personenbezogenen Daten nach dem türkischen Datenschutzgesetz Nr. 6698 (KVKK) verarbeiten.',
    body: `
Diese Hinweise erteilt {{legalName}} (das „Unternehmen“) als Verantwortlicher nach dem türkischen Datenschutzgesetz Nr. 6698 („KVKK“) und dem Kommuniqué über die Informationspflicht.

## 1. Verantwortlicher

{{legalName}} · MERSIS-Nr.: {{mersisNumber}} · Adresse: {{address}} · Telefon: {{phone}} · E-Mail: {{email}}

## 2. Verarbeitete Daten

- **Identität:** Vor- und Nachname, Geburtsdatum, Ausweis- oder Reisepassnummer, Staatsangehörigkeit.
- **Kontakt:** Telefonnummer, E-Mail-Adresse, Anschrift.
- **Führerschein:** Nummer, Klasse, Ausstellungsdatum und -land.
- **Kundenvorgänge:** Buchungsdaten, Mietzeitraum und Filialen, Flugnummer, Ihre Anfragen und Hinweise.
- **Finanzen:** Zahlungs- und Erstattungsbelege, Rechnungsdaten, Überweisungsdaten, Kautionsreservierungen.
- **Fahrzeugnutzung:** Übergabeprotokolle, Kilometerstand und Tankfüllung, Schadensaufnahmen, Maut und Verkehrsstrafen.
- **Rechtliches:** Streitfälle, Beschwerden und Behördenkorrespondenz.
- **Sicherheit:** IP-Adresse, Browserdaten und Nutzungsprotokolle der Website.
- **Marketing:** Präferenzen für Angebote und Neuigkeiten, nur mit Ihrer Einwilligung.

## 3. Zwecke

- Annahme, Bestätigung und Verwaltung von Buchungen; Abschluss und Erfüllung des Mietvertrags,
- Prüfung der Fahrervoraussetzungen (Alter, Führerschein) und Fahrzeugübergabe,
- Abwicklung von Zahlungen, Kautionen, Rechnungen und Erstattungen,
- gesetzliche Meldungen einschließlich des Mietwagen-Meldesystems (KABİS) und Aufbewahrung von Unterlagen,
- Bearbeitung von Verkehrsstrafen, Maut und Schäden und deren Weitergabe an die Betroffenen,
- Abwicklung von Versicherungs- und Gutachterverfahren,
- Beantwortung von Anfragen und Beschwerden, Kundenservice,
- Gewährleistung der Informationssicherheit und Wahrung unserer Rechte in Rechtsstreitigkeiten,
- Versand von Angeboten und Neuigkeiten mit Ihrer Einwilligung.

## 4. Erhebung und Rechtsgrundlagen

Wir erheben Daten über Buchungs- und Anfrageformulare auf unserer Website, E-Mail, Telefon, WhatsApp sowie Verträge und Protokolle in unseren Filialen, ganz oder teilweise automatisiert. Rechtsgrundlagen nach Art. 5 Abs. 2 KVKK:

- Abschluss oder Erfüllung eines Vertrags (Art. 5 Abs. 2 lit. c),
- Erfüllung gesetzlicher Pflichten (Art. 5 Abs. 2 lit. ç), z. B. Mietwagenmeldung, Steuer- und Handelsrecht,
- Begründung, Ausübung oder Verteidigung von Rechten (Art. 5 Abs. 2 lit. e),
- berechtigte Interessen, sofern Ihre Grundrechte nicht beeinträchtigt werden (Art. 5 Abs. 2 lit. f),
- Ihre ausdrückliche Einwilligung für kommerzielle elektronische Nachrichten (Art. 5 Abs. 1), die Sie jederzeit widerrufen können.

## 5. Übermittlung

Begrenzt auf die genannten Zwecke können Daten übermittelt werden an:

- die Generaldirektion für Sicherheit (KABİS), Gerichte, Vollstreckungsbehörden und andere zuständige Behörden,
- Versicherungen und unabhängige Sachverständige,
- Banken und Zahlungsinstitute,
- unsere Rechts-, Steuer- und Prüfungsberater,
- Anbieter von Hosting-, E-Mail-, SMS- und IT-Diensten.

Befinden sich Server unserer Dienstleister im Ausland, erfolgt die Übermittlung gemäß den Voraussetzungen und Garantien des Art. 9 KVKK.

## 6. Speicherdauer

Wir speichern Daten, solange der Zweck es erfordert, und für die gesetzlichen Verjährungs- und Aufbewahrungsfristen; danach werden sie gelöscht, vernichtet oder anonymisiert.

## 7. Ihre Rechte

Nach Art. 11 KVKK können Sie erfahren, ob Ihre Daten verarbeitet werden, und Auskunft verlangen; den Zweck der Verarbeitung und dessen Einhaltung erfahren; die Empfänger im In- und Ausland kennen; die Berichtigung unvollständiger oder unrichtiger Daten sowie die Löschung oder Vernichtung nach Art. 7 und die Mitteilung an Empfänger verlangen; einem ausschließlich auf automatisierter Auswertung beruhenden nachteiligen Ergebnis widersprechen und Ersatz für Schäden durch rechtswidrige Verarbeitung verlangen.

## 8. Antragstellung

Senden Sie Ihren Antrag schriftlich mit Angaben zur Identitätsprüfung an {{address}} oder von Ihrer bei uns registrierten E-Mail-Adresse an {{email}}. Anträge werden spätestens innerhalb von 30 Tagen kostenlos beantwortet.
`,
  },
  ru: {
    title: 'Политика конфиденциальности',
    description: 'Как мы обрабатываем персональные данные согласно Закону Турции № 6698 о защите персональных данных (KVKK).',
    body: `
Настоящее уведомление предоставляется компанией {{legalName}} («Компания») как оператором персональных данных в соответствии с Законом Турции № 6698 о защите персональных данных («KVKK») и Коммюнике об обязанности информирования.

## 1. Оператор данных

{{legalName}} · № MERSIS: {{mersisNumber}} · Адрес: {{address}} · Телефон: {{phone}} · Email: {{email}}

## 2. Какие данные мы обрабатываем

- **Личные данные:** имя, фамилия, дата рождения, номер удостоверения личности или паспорта, гражданство.
- **Контакты:** телефон, email, адрес.
- **Водительское удостоверение:** номер, категория, дата и страна выдачи.
- **Операции клиента:** данные бронирования, даты и офисы аренды, номер рейса, ваши запросы и комментарии.
- **Финансы:** записи об оплатах и возвратах, данные счетов, данные переводов, записи о блокировке залога.
- **Использование автомобиля:** акты приёма-передачи, пробег и топливо, записи о повреждениях, платные дороги и штрафы.
- **Юридические данные:** споры, жалобы и переписка с органами власти.
- **Безопасность:** IP-адрес, данные браузера и журналы использования сайта.
- **Маркетинг:** предпочтения по рассылкам — только с вашего согласия.

## 3. Цели обработки

- приём, подтверждение и ведение бронирований; заключение и исполнение договора аренды,
- проверка требований к водителю (возраст, стаж) и выдача автомобиля,
- проведение оплат, залогов, счетов и возвратов,
- обязательные уведомления, включая систему уведомлений об арендованных автомобилях (KABİS), и хранение записей,
- обработка штрафов, платы за проезд и ущерба и их передача ответственным лицам,
- проведение страховых процедур и экспертиз,
- ответы на запросы и жалобы, обслуживание клиентов,
- обеспечение информационной безопасности и защита наших прав в спорах,
- отправка предложений и новостей с вашего согласия.

## 4. Способ сбора и правовые основания

Мы собираем данные через формы бронирования и запросов на сайте, email, телефон, WhatsApp, а также договоры и акты в наших офисах, полностью или частично автоматизированными способами. Правовые основания по ст. 5(2) KVKK:

- заключение или исполнение договора (ст. 5(2)(c)),
- исполнение наших юридических обязанностей (ст. 5(2)(ç)), например уведомление об аренде, налоговое и торговое законодательство,
- установление, осуществление или защита права (ст. 5(2)(e)),
- наши законные интересы при условии, что ваши основные права не нарушаются (ст. 5(2)(f)),
- ваше явное согласие на коммерческие электронные сообщения (ст. 5(1)), которое можно отозвать в любое время.

## 5. Передача данных

В пределах указанных целей данные могут передаваться:

- Главному управлению безопасности (KABİS), судам, органам исполнительного производства и другим компетентным органам,
- страховым компаниям и независимым экспертам,
- банкам и платёжным организациям,
- нашим юридическим, бухгалтерским и аудиторским консультантам,
- поставщикам хостинга, email, SMS и ИТ-услуг.

Если серверы наших поставщиков находятся за рубежом, передача осуществляется с соблюдением условий и гарантий ст. 9 KVKK.

## 6. Срок хранения

Мы храним данные столько, сколько требует цель обработки, и в течение сроков давности и хранения, установленных законом; затем они удаляются, уничтожаются или обезличиваются.

## 7. Ваши права

Согласно ст. 11 KVKK вы вправе узнать, обрабатываются ли ваши данные, и запросить сведения о них; узнать цель обработки и соответствие ей; знать третьих лиц в Турции и за рубежом, которым данные передаются; требовать исправления неполных или неточных данных, удаления или уничтожения по ст. 7 и уведомления об этом получателей; возражать против неблагоприятного результата, основанного исключительно на автоматизированном анализе; требовать возмещения ущерба от незаконной обработки.

## 8. Как подать запрос

Направьте запрос письменно с данными для подтверждения личности по адресу {{address}} или с зарегистрированного у нас email на адрес {{email}}. Запросы рассматриваются бесплатно в течение 30 дней.
`,
  },
}
