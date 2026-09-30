import type { FaqCategory, Locale } from '@rent/shared'

type Entry = { category: FaqCategory } & Record<Locale, { q: string; a: string }>

/**
 * Frequently asked questions in every site language. Answers are Markdown and may use content
 * placeholders ({{cancelHours}}, {{graceMinutes}}, {{minLeadHours}}, {{phone}} …) filled from Settings.
 */
export const FAQS: Entry[] = [
  // Booking
  {
    category: 'booking',
    tr: { q: 'Nasıl rezervasyon yapabilirim?', a: 'Ana sayfada alış ofisini ve tarihleri seçip "Araç bul"a tıklayın, aracınızı seçin ve sürücü bilgilerini girin. Rezervasyon kodunuz hemen ekranda gösterilir ve e-postayla gönderilir. Dilerseniz {{phone}} numarasından telefonla veya WhatsApp üzerinden de rezervasyon yapabilirsiniz.' },
    en: { q: 'How do I book a car?', a: 'Choose the pick-up office and dates on the home page, click "Find a car", pick your car and enter the driver details. Your booking code is shown straight away and sent by email. You can also book by phone or WhatsApp on {{phone}}.' },
    de: { q: 'Wie buche ich ein Fahrzeug?', a: 'Wählen Sie auf der Startseite Filiale und Daten, klicken Sie auf „Fahrzeug finden“, wählen Sie Ihr Auto und geben Sie die Fahrerdaten ein. Ihr Buchungscode wird sofort angezeigt und per E-Mail gesendet. Sie können auch telefonisch oder per WhatsApp unter {{phone}} buchen.' },
    ru: { q: 'Как забронировать автомобиль?', a: 'Выберите на главной странице офис и даты, нажмите «Найти автомобиль», выберите машину и введите данные водителя. Код бронирования сразу появится на экране и придёт на email. Также можно забронировать по телефону или WhatsApp: {{phone}}.' },
  },
  {
    category: 'booking',
    tr: { q: 'Aracı adresime teslim ediyor musunuz?', a: 'Evet. Aracınızı Menemen ofisimizden teslim alabileceğiniz gibi Foça, Aliağa, Çiğli ve Karşıyaka’daki adresinize de getirebiliyoruz. Teslimat ücreti ve saati için rezervasyondan sonra {{phone}} numarasından bize ulaşın veya "Ofise not" alanına adresinizi yazın.' },
    en: { q: 'Can you deliver the car to my address?', a: 'Yes. Besides collecting the car at our Menemen office, we can bring it to your address in Foça, Aliağa, Çiğli or Karşıyaka. For the delivery fee and time, contact us on {{phone}} after booking or write your address in the "Note for the office" field.' },
    de: { q: 'Liefern Sie das Auto an meine Adresse?', a: 'Ja. Neben der Abholung in unserem Büro in Menemen bringen wir das Auto auch zu Ihrer Adresse in Foça, Aliağa, Çiğli oder Karşıyaka. Lieferpreis und -zeit erfahren Sie nach der Buchung unter {{phone}}, oder geben Sie Ihre Adresse im Feld „Nachricht an die Filiale“ an.' },
    ru: { q: 'Можете ли вы доставить автомобиль по моему адресу?', a: 'Да. Помимо получения в нашем офисе в Менемене, мы можем привезти автомобиль по вашему адресу в Фоче, Алиаге, Чигли или Каршияке. О стоимости и времени доставки узнайте после бронирования по телефону {{phone}} или укажите адрес в поле «Комментарий для офиса».' },
  },
  {
    category: 'booking',
    tr: { q: 'Rezervasyonum ne zaman onaylanır?', a: 'Rezervasyonunuz ekibimiz tarafından kısa süre içinde kontrol edilir ve onay e-postayla bildirilir. Durumunu istediğiniz zaman "Rezervasyonum" sayfasından rezervasyon kodunuz ve e-postanızla görebilirsiniz.' },
    en: { q: 'When is my booking confirmed?', a: 'Our team checks your booking shortly and confirms it by email. You can see its status at any time on the "My booking" page with your booking code and email.' },
    de: { q: 'Wann wird meine Buchung bestätigt?', a: 'Unser Team prüft Ihre Buchung in Kürze und bestätigt sie per E-Mail. Den Status sehen Sie jederzeit auf der Seite „Meine Buchung“ mit Buchungscode und E-Mail.' },
    ru: { q: 'Когда подтверждается бронирование?', a: 'Наша команда вскоре проверит бронирование и подтвердит его по email. Статус всегда можно посмотреть на странице «Моё бронирование» по коду и email.' },
  },
  {
    category: 'booking',
    tr: { q: 'Rezervasyonumu nasıl iptal eder veya değiştiririm?', a: 'Alış saatinden {{cancelHours}} saat öncesine kadar "Rezervasyonum" sayfasından ücretsiz iptal edebilirsiniz. Tarih veya araç değişikliği ve son saatlerdeki iptaller için {{phone}} numarasından bize ulaşın.' },
    en: { q: 'How do I cancel or change my booking?', a: 'You can cancel free of charge on the "My booking" page up to {{cancelHours}} hours before pick-up. For changes of dates or car, or last-minute cancellations, contact us on {{phone}}.' },
    de: { q: 'Wie storniere oder ändere ich meine Buchung?', a: 'Bis {{cancelHours}} Stunden vor der Abholung können Sie auf der Seite „Meine Buchung“ kostenlos stornieren. Für Änderungen von Daten oder Fahrzeug sowie kurzfristige Stornierungen erreichen Sie uns unter {{phone}}.' },
    ru: { q: 'Как отменить или изменить бронирование?', a: 'Бесплатная отмена доступна на странице «Моё бронирование» не позднее чем за {{cancelHours}} ч до получения. Для изменения дат или автомобиля и поздней отмены свяжитесь с нами: {{phone}}.' },
  },
  {
    category: 'booking',
    tr: { q: 'Seçtiğim aracın aynısını mı alacağım?', a: 'Rezervasyonda bir araç grubu seçilir ("veya benzeri"). Seçtiğiniz model müsait değilse aynı veya daha üst gruptan bir araç ek ücret alınmadan verilir. Daha alt gruptan bir araç ancak onayınızla ve fiyat farkı iade edilerek verilebilir.' },
    en: { q: 'Will I get exactly the car I chose?', a: 'You book a vehicle group ("or similar"). If the model you chose is not available, you get a car of the same or a higher group at no extra cost. A lower group is only offered with your consent and the price difference is refunded.' },
    de: { q: 'Bekomme ich genau das gewählte Fahrzeug?', a: 'Gebucht wird eine Fahrzeuggruppe („oder ähnlich“). Ist das gewählte Modell nicht verfügbar, erhalten Sie ohne Aufpreis ein Fahrzeug derselben oder einer höheren Gruppe. Eine niedrigere Gruppe gibt es nur mit Ihrer Zustimmung und Erstattung der Differenz.' },
    ru: { q: 'Получу ли я именно выбранный автомобиль?', a: 'Бронируется группа автомобилей («или аналог»). Если выбранной модели нет, вы бесплатно получите автомобиль той же или более высокой группы. Более низкая группа — только с вашего согласия и с возвратом разницы.' },
  },
  {
    category: 'booking',
    tr: { q: 'En az ne kadar önceden rezervasyon yapmalıyım?', a: 'Online rezervasyonlar alış saatinden en az {{minLeadHours}} saat önce yapılabilir. Araçlar ofisimizin çalışma saatleri içinde teslim edilir ve iade alınır; güncel saatleri İletişim sayfasında bulabilirsiniz. Daha acil durumlar için bizi arayın.' },
    en: { q: 'How far in advance do I need to book?', a: 'Online bookings can be made at least {{minLeadHours}} hours before pick-up. Cars are handed over and returned during our office opening hours, listed on the Contact page. For urgent requests, please call us.' },
    de: { q: 'Wie früh muss ich buchen?', a: 'Online-Buchungen sind bis mindestens {{minLeadHours}} Stunden vor der Abholung möglich. Übergabe und Rückgabe erfolgen während der Öffnungszeiten (siehe Kontaktseite). Bei dringenden Anfragen rufen Sie uns bitte an.' },
    ru: { q: 'За сколько нужно бронировать?', a: 'Онлайн-бронирование возможно не позднее чем за {{minLeadHours}} ч до получения. Выдача и возврат — в часы работы офиса (см. страницу «Контакты»). В срочных случаях позвоните нам.' },
  },
  // Payment
  {
    category: 'payment',
    tr: { q: 'Ödemeyi nasıl yapabilirim?', a: 'İnternet sitemizde ödeme alınmaz ve kart bilgisi istenmez. Kira bedelini aracı teslim alırken ofisimizde nakit veya kartla ödeyebilirsiniz. Havale seçeneği sunulduğunda banka bilgileri rezervasyondan sonra gösterilir; açıklamaya rezervasyon kodunuzu yazmanız yeterlidir.' },
    en: { q: 'How can I pay?', a: 'No payment is taken and no card details are requested on our website. You pay at our office in cash or by card when you collect the car. Where bank transfer is offered, our bank details are shown after booking; just quote your booking code as the reference.' },
    de: { q: 'Wie kann ich bezahlen?', a: 'Auf unserer Website wird nichts abgebucht und keine Kartendaten abgefragt. Sie zahlen bei der Abholung im Büro bar oder mit Karte. Wird Überweisung angeboten, erhalten Sie die Bankdaten nach der Buchung; geben Sie den Buchungscode als Verwendungszweck an.' },
    ru: { q: 'Как оплатить аренду?', a: 'На сайте оплата не взимается и данные карты не запрашиваются. Оплата производится в офисе наличными или картой при получении автомобиля. Если доступен банковский перевод, реквизиты показываются после бронирования; укажите код бронирования в назначении платежа.' },
  },
  {
    category: 'payment',
    tr: { q: 'Depozito alınıyor mu?', a: 'Evet. Aracı teslim alırken kartınızdan depozito tutarı kadar provizyon alınır; tutar her aracın sayfasında belirtilir ve yasal olarak 1–6 günlük kiralamalarda 3 günlük, 7 gün ve üzerinde 7 günlük kira bedelini aşamaz. Provizyon, aracın iadesinden sonra 7 gün içinde kaldırılır.' },
    en: { q: 'Is a deposit required?', a: 'Yes. When you collect the car, the deposit is authorised on your card; the amount is shown on each car’s page and by law cannot exceed 3 days’ rent for rentals of 1–6 days, or 7 days’ rent for 7 days or more. The authorisation is released within 7 days after return.' },
    de: { q: 'Wird eine Kaution verlangt?', a: 'Ja. Bei der Abholung wird die Kaution auf Ihrer Karte reserviert; der Betrag steht auf jeder Fahrzeugseite und darf gesetzlich bei 1–6 Tagen höchstens 3 Tagesmieten, ab 7 Tagen höchstens 7 Tagesmieten betragen. Die Reservierung wird innerhalb von 7 Tagen nach der Rückgabe freigegeben.' },
    ru: { q: 'Нужен ли залог?', a: 'Да. При получении автомобиля сумма залога блокируется на вашей карте; она указана на странице автомобиля и по закону не превышает стоимость 3 суток аренды при сроке 1–6 суток и 7 суток — при сроке от 7 суток. Блокировка снимается в течение 7 дней после возврата.' },
  },
  {
    category: 'payment',
    tr: { q: 'Fiyatlara neler dahil?', a: 'Gösterilen toplam fiyata kiralama bedeli, zorunlu trafik sigortası, kasko ve vergiler dahildir. Seçtiğiniz ek hizmetler ve farklı ofise iade ücreti varsa toplam fiyata eklenmiş olarak gösterilir. Yakıt fiyata dahil değildir.' },
    en: { q: 'What is included in the price?', a: 'The total price includes the rental, compulsory third-party insurance, comprehensive insurance and taxes. Extras you choose and any one-way fee are already added to the total shown. Fuel is not included.' },
    de: { q: 'Was ist im Preis enthalten?', a: 'Der Gesamtpreis enthält Miete, Haftpflicht- und Kaskoversicherung sowie Steuern. Gewählte Extras und eine eventuelle Einweggebühr sind im angezeigten Gesamtpreis bereits enthalten. Kraftstoff ist nicht inklusive.' },
    ru: { q: 'Что входит в стоимость?', a: 'Итоговая цена включает аренду, ОСАГО, КАСКО и налоги. Выбранные опции и сбор за возврат в другом офисе уже включены в показанную сумму. Топливо не входит в стоимость.' },
  },
  {
    category: 'payment',
    tr: { q: 'Fiyatlar hangi para biriminde?', a: 'Fiyatlarımız Türk lirası üzerinden belirlenir. Sağ üstteki menüden fiyatları Euro, Dolar veya Sterlin olarak görebilirsiniz; bu tutarlar günün kuruna göre bilgi amaçlıdır.' },
    en: { q: 'Which currency are prices in?', a: 'Our prices are set in Turkish lira. You can view them in euros, dollars or pounds using the menu at the top right; these amounts are for information at today’s rate.' },
    de: { q: 'In welcher Währung sind die Preise?', a: 'Unsere Preise werden in türkischen Lira festgelegt. Über das Menü oben rechts können Sie sie in Euro, Dollar oder Pfund anzeigen; diese Beträge dienen zur Information zum Tageskurs.' },
    ru: { q: 'В какой валюте цены?', a: 'Цены устанавливаются в турецких лирах. В меню справа вверху их можно посмотреть в евро, долларах или фунтах — эти суммы приведены для информации по текущему курсу.' },
  },
  // Requirements
  {
    category: 'requirements',
    tr: { q: 'Araç teslim alırken hangi belgeler gerekli?', a: 'Geçerli sürücü belgeniz, kimlik kartınız veya pasaportunuz ve depozito provizyonu için adınıza kayıtlı bir kredi ya da banka kartı gereklidir. Ek sürücülerin de belgelerini getirmesi gerekir.' },
    en: { q: 'Which documents do I need at pick-up?', a: 'Your valid driving licence, your ID card or passport, and a credit or debit card in your name for the deposit authorisation. Additional drivers must bring their documents too.' },
    de: { q: 'Welche Unterlagen brauche ich bei der Abholung?', a: 'Ihren gültigen Führerschein, Personalausweis oder Reisepass sowie eine Kredit- oder Debitkarte auf Ihren Namen für die Kaution. Zusatzfahrer müssen ihre Unterlagen ebenfalls mitbringen.' },
    ru: { q: 'Какие документы нужны при получении?', a: 'Действующее водительское удостоверение, удостоверение личности или паспорт и кредитная или дебетовая карта на ваше имя для блокировки залога. Дополнительные водители также должны взять свои документы.' },
  },
  {
    category: 'requirements',
    tr: { q: 'Yaş ve ehliyet şartı nedir?', a: 'Minimum sürücü yaşı ve ehliyet süresi araç sınıfına göre değişir ve her aracın sayfasındaki "Kiralama şartları" bölümünde yazar. Rezervasyon sırasında doğum tarihinize ve ehliyet tarihinize göre kontrol edilir.' },
    en: { q: 'What are the age and licence requirements?', a: 'The minimum driver age and years of driving experience depend on the vehicle class and are listed under "Rental conditions" on each car’s page. They are checked against your date of birth and licence date when you book.' },
    de: { q: 'Welche Alters- und Führerscheinvoraussetzungen gelten?', a: 'Mindestalter und Führerscheinbesitz hängen von der Fahrzeugklasse ab und stehen unter „Mietbedingungen“ auf jeder Fahrzeugseite. Bei der Buchung werden sie anhand Ihres Geburts- und Führerscheindatums geprüft.' },
    ru: { q: 'Какие требования к возрасту и стажу?', a: 'Минимальный возраст и стаж зависят от класса автомобиля и указаны в разделе «Условия аренды» на странице каждого автомобиля. При бронировании они проверяются по дате рождения и дате выдачи прав.' },
  },
  {
    category: 'requirements',
    tr: { q: 'Yabancı ehliyetle araç kiralayabilir miyim?', a: 'Evet. Latin alfabesiyle düzenlenmiş geçerli yabancı ehliyetler kabul edilir. Ehliyetiniz Latin alfabesi dışında düzenlenmişse uluslararası sürücü belgesi de getirmeniz gerekir.' },
    en: { q: 'Can I rent with a foreign driving licence?', a: 'Yes. Valid foreign licences issued in the Latin alphabet are accepted. If your licence uses another alphabet, please also bring an international driving permit.' },
    de: { q: 'Kann ich mit einem ausländischen Führerschein mieten?', a: 'Ja. Gültige ausländische Führerscheine in lateinischer Schrift werden akzeptiert. Ist Ihr Führerschein in einer anderen Schrift ausgestellt, bringen Sie bitte zusätzlich einen internationalen Führerschein mit.' },
    ru: { q: 'Можно ли арендовать с иностранными правами?', a: 'Да. Принимаются действующие иностранные удостоверения, выданные латиницей. Если права выданы на другом алфавите, возьмите также международное водительское удостоверение.' },
  },
  {
    category: 'requirements',
    tr: { q: 'Ek sürücü ekleyebilir miyim?', a: 'Evet, rezervasyon sırasında "Ek sürücü" hizmetini ekleyebilirsiniz. Ek sürücülerin de aynı yaş ve ehliyet şartlarını taşıması ve teslimde belgeleriyle hazır bulunması gerekir; sigorta kapsamı ek sürücüler için de geçerlidir.' },
    en: { q: 'Can I add an additional driver?', a: 'Yes, add the "Additional driver" extra when you book. Additional drivers must meet the same age and licence requirements and be present with their documents at pick-up; the insurance covers them too.' },
    de: { q: 'Kann ich einen Zusatzfahrer eintragen?', a: 'Ja, fügen Sie bei der Buchung das Extra „Zusatzfahrer“ hinzu. Zusatzfahrer müssen dieselben Voraussetzungen erfüllen und bei der Abholung mit ihren Unterlagen anwesend sein; der Versicherungsschutz gilt auch für sie.' },
    ru: { q: 'Можно ли добавить дополнительного водителя?', a: 'Да, добавьте опцию «Дополнительный водитель» при бронировании. Дополнительный водитель должен соответствовать тем же требованиям и присутствовать с документами при получении; страховка распространяется и на него.' },
  },
  // Insurance
  {
    category: 'insurance',
    tr: { q: 'Araçlar sigortalı mı?', a: 'Evet. Tüm araçlarda zorunlu trafik sigortası ve kasko bulunur ve fiyata dahildir. Hasar durumunda muafiyet (sizin ödeyeceğiniz tutar) uygulanabilir; muafiyeti kaldırmak isterseniz rezervasyon sırasında isteğe bağlı "Tam kasko" hizmetini ekleyebilirsiniz.' },
    en: { q: 'Are the cars insured?', a: 'Yes. All cars have compulsory third-party and comprehensive (kasko) insurance, included in the price. An excess (the amount you pay in case of damage) may apply; to remove it, add the optional "Full coverage" extra when booking.' },
    de: { q: 'Sind die Fahrzeuge versichert?', a: 'Ja. Alle Fahrzeuge sind haftpflicht- und kaskoversichert, im Preis enthalten. Im Schadensfall kann eine Selbstbeteiligung gelten; mit dem optionalen Extra „Vollkasko“ entfällt sie.' },
    ru: { q: 'Застрахованы ли автомобили?', a: 'Да. Все автомобили застрахованы по ОСАГО и КАСКО, страховка входит в стоимость. При повреждении может действовать франшиза; чтобы её исключить, добавьте при бронировании опцию «Полное КАСКО».' },
  },
  {
    category: 'insurance',
    tr: { q: 'Kaza yaparsam ne yapmalıyım?', a: 'Önce kendinizin ve diğerlerinin güvenliğini sağlayın. Ardından polis veya jandarmayı arayın ya da karşı tarafla kaza tespit tutanağı düzenleyin ve hemen {{phone}} numarasından bizi bilgilendirin. Tutanak veya rapor olmadan oluşan hasarlar sigorta kapsamı dışında kalabilir.' },
    en: { q: 'What should I do after an accident?', a: 'First make sure everyone is safe. Then call the police or fill in an accident report with the other party, and inform us immediately on {{phone}}. Damage without an accident report may not be covered by insurance.' },
    de: { q: 'Was tun nach einem Unfall?', a: 'Sorgen Sie zuerst für die Sicherheit aller Beteiligten. Rufen Sie dann die Polizei oder füllen Sie mit der Gegenseite einen Unfallbericht aus und informieren Sie uns sofort unter {{phone}}. Schäden ohne Unfallbericht sind möglicherweise nicht versichert.' },
    ru: { q: 'Что делать при ДТП?', a: 'Сначала позаботьтесь о безопасности всех участников. Затем вызовите полицию или оформите протокол с другой стороной и сразу сообщите нам: {{phone}}. Ущерб без протокола может не покрываться страховкой.' },
  },
  // Other
  {
    category: 'other',
    tr: { q: 'Yakıt politikası nedir?', a: 'Araç, teslim aldığınız yakıt seviyesiyle iade edilmelidir. Eksik yakıt, piyasa fiyatı ve kira sözleşmesinde belirtilen hizmet bedeli üzerinden tahsil edilir.' },
    en: { q: 'What is the fuel policy?', a: 'Return the car with the same fuel level as when you collected it. Missing fuel is charged at the market price plus the service fee stated in the rental agreement.' },
    de: { q: 'Welche Tankregelung gilt?', a: 'Geben Sie das Fahrzeug mit derselben Tankfüllung zurück, mit der Sie es übernommen haben. Fehlender Kraftstoff wird zum Marktpreis zuzüglich der im Mietvertrag genannten Servicegebühr berechnet.' },
    ru: { q: 'Какая политика по топливу?', a: 'Верните автомобиль с тем же уровнем топлива, что и при получении. Недостающее топливо оплачивается по рыночной цене плюс сервисный сбор по договору аренды.' },
  },
  {
    category: 'other',
    tr: { q: 'Kilometre sınırı var mı?', a: 'Bazı araçlarda günlük kilometre sınırı bulunur; sınır ve aşım ücreti aracın sayfasında belirtilir. Sınırsız kilometreli araçlarda bu bilgi "Sınırsız" olarak görünür.' },
    en: { q: 'Is there a mileage limit?', a: 'Some cars have a daily mileage limit; the limit and the excess rate are shown on the car’s page. Cars with unlimited mileage are marked "Unlimited".' },
    de: { q: 'Gibt es ein Kilometerlimit?', a: 'Für manche Fahrzeuge gilt ein tägliches Kilometerlimit; Limit und Mehrkilometerpreis stehen auf der Fahrzeugseite. Fahrzeuge ohne Limit sind mit „Unbegrenzt“ gekennzeichnet.' },
    ru: { q: 'Есть ли ограничение пробега?', a: 'Для некоторых автомобилей действует суточный лимит пробега; лимит и стоимость перепробега указаны на странице автомобиля. Автомобили без ограничения отмечены как «Без ограничений».' },
  },
  {
    category: 'other',
    tr: { q: 'Aracı geç iade edersem ne olur?', a: 'İadede {{graceMinutes}} dakikaya kadar gecikmeler için ücret alınmaz. Daha uzun gecikmelerde ek gün ücreti uygulanır. Gecikeceğinizi düşünüyorsanız lütfen bize önceden haber verin.' },
    en: { q: 'What happens if I return the car late?', a: 'Returns up to {{graceMinutes}} minutes late are free of charge. Longer delays are charged as an extra day. If you expect to be late, please let us know in advance.' },
    de: { q: 'Was passiert bei verspäteter Rückgabe?', a: 'Verspätungen bis {{graceMinutes}} Minuten sind kostenlos. Längere Verspätungen werden als zusätzlicher Tag berechnet. Bitte informieren Sie uns vorab, wenn Sie sich verspäten.' },
    ru: { q: 'Что будет при опоздании с возвратом?', a: 'Опоздание до {{graceMinutes}} минут бесплатно. При большем опоздании взимается плата за дополнительные сутки. Если задерживаетесь, пожалуйста, предупредите нас заранее.' },
  },
  {
    category: 'other',
    tr: { q: 'Köprü, otoyol geçişleri ve trafik cezaları nasıl ödenir?', a: 'Araçlarımızda HGS bulunur; kiralama süresindeki geçiş ücretleri ek hizmet bedeli eklenmeden size yansıtılır. Kiralama süresinde oluşan trafik cezaları kiracıya aittir ve belgesiyle birlikte bildirilir.' },
    en: { q: 'How are tolls and traffic fines handled?', a: 'Our cars have an HGS toll tag; tolls during your rental are passed on at cost without any service fee. Traffic fines incurred during the rental are the renter’s responsibility and are passed on with the official notice.' },
    de: { q: 'Wie werden Maut und Verkehrsstrafen abgerechnet?', a: 'Unsere Fahrzeuge haben einen HGS-Mautaufkleber; Mautgebühren während der Miete werden ohne Servicegebühr zum Selbstkostenpreis weitergegeben. Verkehrsstrafen während der Miete trägt der Mieter; sie werden mit dem amtlichen Bescheid mitgeteilt.' },
    ru: { q: 'Как оплачиваются платные дороги и штрафы?', a: 'В наших автомобилях установлена метка HGS; плата за проезд в период аренды передаётся по фактической стоимости без сервисного сбора. Штрафы за нарушения ПДД в период аренды оплачивает арендатор; они передаются вместе с официальным уведомлением.' },
  },
  {
    category: 'other',
    tr: { q: 'Çocuk koltuğu alabilir miyim?', a: 'Evet, rezervasyon sırasında "Çocuk koltuğu" hizmetini ekleyebilirsiniz. Sayısı sınırlı olduğu için önceden eklemenizi öneririz; özel bir ihtiyacınız varsa rezervasyondaki "Ofise not" alanına yazabilirsiniz.' },
    en: { q: 'Can I get a child seat?', a: 'Yes, add the "Child seat" extra when you book. As numbers are limited, we recommend adding it in advance; for special needs, use the "Note for the office" field.' },
    de: { q: 'Kann ich einen Kindersitz bekommen?', a: 'Ja, fügen Sie bei der Buchung das Extra „Kindersitz“ hinzu. Da die Anzahl begrenzt ist, empfehlen wir eine frühzeitige Buchung; besondere Wünsche können Sie im Feld „Nachricht an die Filiale“ angeben.' },
    ru: { q: 'Можно ли взять детское кресло?', a: 'Да, добавьте опцию «Детское кресло» при бронировании. Количество ограничено, поэтому рекомендуем добавить заранее; особые пожелания укажите в поле «Комментарий для офиса».' },
  },
]
