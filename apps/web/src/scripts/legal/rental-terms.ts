import type { LegalPage } from './types'

/**
 * Rental terms. Placeholders ({{…}}) are filled from Settings when the page is shown.
 * Written for this business (no online payment, deposit by card authorisation) and the
 * Motorlu Kara Taşıtlarının Kiralanması Hakkında Yönetmelik (RG 15.08.2026, in force 01.01.2027).
 */
export const rentalTerms: LegalPage = {
  slug: 'rental-terms',
  tr: {
    title: 'Kiralama Koşulları',
    description: 'Sürücü şartları, ödeme, depozito, yakıt, kilometre, sigorta, trafik cezaları ve iptal koşulları.',
    body: `
Bu koşullar, {{legalName}} ("Şirket") tarafından bu internet sitesi, telefon veya ofis üzerinden yapılan araç kiralama rezervasyonlarına uygulanır. Aracın teslimi sırasında düzenlenen kira sözleşmesi bu koşulların ayrılmaz parçasıdır; iki metin arasında fark olması halinde imzalanan kira sözleşmesi esas alınır.

Kiralama yetki belgesi no: {{authorizationNumber}} · MERSİS no: {{mersisNumber}}

## 1. Sürücü şartları

- Aracı teslim alacak sürücünün, kiralanan aracın sınıfına uygun, geçerli bir sürücü belgesi ve kimlik kartı ya da pasaport ibraz etmesi zorunludur.
- Minimum sürücü yaşı ve ehliyet süresi araç sınıfına göre değişir ve her aracın sayfasında belirtilir. Bu şartları karşılamayan kişilere araç teslim edilemez.
- Latin alfabesi dışında düzenlenmiş sürücü belgeleri için uluslararası sürücü belgesi de istenir.
- Aracı yalnızca kira sözleşmesinde adı yazılı sürücüler kullanabilir. Ek sürücüler de aynı şartları taşımalı ve teslimde sözleşmeye eklenmelidir.

## 2. Rezervasyon ve onay

- Rezervasyon sırasında belirli bir plaka değil, bir araç grubu kiralanır ("veya benzeri"). Rezerve edilen grupta araç bulunamazsa aynı veya daha üst gruptan bir araç ek ücret alınmadan verilir.
- Daha alt gruptan bir araç ancak kiracının onayıyla verilebilir; bu durumda fiyat farkı iade edilir. Kiracı alt grubu kabul etmezse rezervasyonu ücretsiz iptal edebilir.
- Rezervasyonunuzun durumu e-posta ile bildirilir. Rezervasyon kodunuz ve e-posta adresinizle "Rezervasyonum" sayfasından rezervasyonunuzu görüntüleyebilirsiniz.

## 3. Fiyatlar ve ödeme

- Sitede gösterilen fiyatlar, seçilen tarihler ve ek hizmetler için vergiler dahil toplam kiralama bedelidir. Farklı ofiste iade ücreti varsa toplam fiyata dahil edilir.
- Fiyatlar Türk lirası üzerinden belirlenir. Başka para birimlerinde gösterilen tutarlar günün kuruna göre bilgi amaçlıdır.
- İnternet sitesi üzerinden ödeme alınmaz. Kira bedeli, aracın teslimi sırasında ofiste nakit veya kartla ya da teslimden önce banka havalesi/EFT ile ödenir. Havalede açıklama kısmına rezervasyon kodunuzu yazmanız gerekir.
- Kiralama süresi 24 saatlik dilimler halinde hesaplanır. Günlük fiyat, kiralama süresine ve sezona göre değişebilir.

## 4. Depozito

- Aracın teslimi sırasında kiracının banka veya kredi kartından depozito tutarı kadar provizyon alınır. Senet, çek veya teminat mektubu gibi araçlarla depozito alınmaz.
- Depozito tutarı, 1–6 günlük kiralamalarda 3 günlük, 7–29 günlük kiralamalarda 7 günlük kira bedelini aşamaz. Aracın sayfasında belirtilen tutar üst sınırdır.
- Depozito yalnızca ödenmemiş kira ve ek hizmet bedelleri, geç iade, kilometre aşımı, eksik yakıt, köprü ve otoyol geçişleri, trafik cezaları ve sigorta kapsamı dışındaki hasarlar için kullanılabilir.
- Depozito, aracın iadesini izleyen 7 gün içinde serbest bırakılır. Olağan kullanıma bağlı yıpranmalar için kesinti yapılmaz.

## 5. Aracın teslimi ve iadesi

- Araç, rezervasyonda seçilen ofiste ve çalışma saatleri içinde teslim edilir ve iade alınır.
- Teslim ve iadede aracın kilometresi, yakıt seviyesi ve mevcut hasarları bir tutanakla kayıt altına alınır ve fotoğraflanır. Kiracının tutanağı kontrol etmesi önerilir.
- İadede {{graceMinutes}} dakikaya kadar gecikmeler için ücret alınmaz. Bu süreyi aşan gecikmelerde kira sözleşmesinde belirtilen ek gün ücreti uygulanır.
- Araç sözleşmede belirtilen tarihten önce iade edilirse, kullanılan süre için geçerli günlük fiyat üzerinden hesap yapılır ve fark iade edilir.

## 6. Yakıt ve kilometre

- Araç, teslim alındığı yakıt seviyesiyle iade edilmelidir. Eksik yakıt, piyasa fiyatı ve sözleşmede belirtilen hizmet bedeli üzerinden tahsil edilir.
- Bazı araçlarda günlük kilometre sınırı vardır ve aracın sayfasında belirtilir. Sınırın aşılması halinde, aşılan her kilometre için sayfada belirtilen ücret uygulanır.

## 7. Sigorta ve hasar

- Tüm araçlarda zorunlu trafik sigortası ve kasko bulunur; temel sigorta için kira bedeli dışında ayrıca ücret alınmaz. Kaskoda muafiyet (kiracıya kalan tutar) uygulanabilir.
- Muafiyeti ortadan kaldıran "tam kasko" gibi ek güvenceler isteğe bağlıdır ve kiralamanın şartı değildir.
- Alkol veya uyuşturucu etkisinde araç kullanımı, sözleşmede adı olmayan kişinin aracı kullanması, arazi ve yarış kullanımı, kasıt veya ağır ihmal ile kaza sonrası tutanak tutulmaması halinde oluşan hasarlar sigorta kapsamı dışında kalabilir.
- Kaza veya hasar durumunda kolluk kuvvetlerine ve Şirkete hemen haber verilmeli, kaza tespit tutanağı veya polis/jandarma raporu alınmalıdır.
- Hasar bedeli, yetkili ve bağımsız bir ekspertiz raporuna göre belirlenir. Teslim ve iade tutanağında yer almayan hasarlar için sonradan talepte bulunulmaz.

## 8. Köprü, otoyol geçişleri ve trafik cezaları

- Araçlarda HGS etiketi bulunur. Kiralama süresi içindeki geçiş ücretleri belgelenerek, fazladan hizmet bedeli eklenmeden kiracıdan tahsil edilir.
- Kiralama süresi içinde oluşan trafik cezaları ve idari para cezaları kiracıya aittir. Ceza, belgesiyle birlikte kiracıya bildirilir.
- Mevzuat gereği kiracı ve sürücü bilgileri, talep halinde yetkili kamu kurumlarıyla paylaşılır.

## 9. Kullanım kuralları

- Araç, sözleşmede adı yazılı olmayan kişilere kullandırılamaz, kiraya verilemez veya ticari yolcu/yük taşımacılığında kullanılamaz.
- Araç; yarış, sürüş eğitimi, römork çekme ve arazi koşullarında kullanılamaz. Araç içinde sigara içilmesi yasaktır.
- Araç, Şirketin yazılı izni olmadan yurt dışına çıkarılamaz.
- Arıza durumunda Şirketin onayı olmadan araç tamir ettirilmemeli; Şirket aranarak yönlendirme beklenmelidir.

## 10. İptal, değişiklik ve gelinmemesi

- Rezervasyonunuzu alış saatinden {{cancelHours}} saat öncesine kadar "Rezervasyonum" sayfasından veya bize ulaşarak ücretsiz iptal edebilirsiniz.
- Son 24 saat içinde yapılan iptallerde en fazla 1 günlük kira bedeli talep edilebilir. Ön ödeme alınmadığı durumlarda iptal bedeli talep edilmez.
- Tarih veya araç değişikliği talepleri, müsaitliğe göre güncel fiyat üzerinden karşılanır.
- Kiracı alış saatinde gelmezse araç, 1–6 günlük kiralamalarda 12 saat, 7 gün ve üzeri kiralamalarda 1 gün boyunca bekletilir; bu süre sonunda rezervasyon iptal edilebilir.

## 11. Kişisel veriler

Kişisel verileriniz, Aydınlatma Metni'nde açıklandığı şekilde işlenir.

## 12. Uyuşmazlıklar

Bu koşullardan doğan uyuşmazlıklarda, yürürlükteki parasal sınırlar dahilinde tüketici hakem heyetleri, bu sınırların üzerindeki uyuşmazlıklarda tüketici mahkemeleri yetkilidir.

## 13. İletişim

{{legalName}} · {{address}} · Telefon: {{phone}} · E-posta: {{email}}
`,
  },
  en: {
    title: 'Rental Terms',
    description: 'Driver requirements, payment, deposit, fuel, mileage, insurance, traffic fines and cancellation.',
    body: `
These terms apply to car rental bookings made with {{legalName}} (the "Company") through this website, by phone or at our offices. The rental agreement issued when the car is handed over forms part of these terms; if the two differ, the signed rental agreement prevails.

Rental authorisation no.: {{authorizationNumber}} · MERSIS no.: {{mersisNumber}}

## 1. Driver requirements

- The driver collecting the car must present a valid driving licence for the vehicle class and an ID card or passport.
- The minimum driver age and years of driving experience depend on the vehicle class and are shown on each car's page. Cars cannot be handed over to drivers who do not meet them.
- Licences not issued in the Latin alphabet must be accompanied by an international driving permit.
- Only the drivers named in the rental agreement may drive the car. Additional drivers must meet the same requirements and be added at pick-up.

## 2. Booking and confirmation

- You book a vehicle group, not a specific car ("or similar"). If no car of the booked group is available, you receive a car of the same or a higher group at no extra cost.
- A car of a lower group is only provided with your consent, and the price difference is refunded. If you do not accept, you may cancel free of charge.
- Your booking status is sent by email. You can view your booking on the "My booking" page with your booking code and email address.

## 3. Prices and payment

- Prices shown on the website are the total rental price for the selected dates and extras, including taxes. A one-way fee, if any, is included in the total.
- Prices are set in Turkish lira. Amounts shown in other currencies are for information at today's rate.
- No payment is taken on the website. You pay at the office in cash or by card when you collect the car, or by bank transfer before pick-up, quoting your booking code as the reference.
- Rental time is charged in 24-hour periods. The daily rate may vary with rental length and season.

## 4. Deposit

- At pick-up, the deposit is authorised (blocked) on the renter's debit or credit card. No promissory notes, cheques or guarantee letters are accepted as deposit.
- The deposit may not exceed 3 days' rent for rentals of 1–6 days, or 7 days' rent for rentals of 7–29 days. The amount on the car's page is the maximum.
- The deposit may only be used for unpaid rent and extras, late return, excess mileage, missing fuel, bridge and motorway tolls, traffic fines and damage not covered by insurance.
- The deposit is released within 7 days after the car is returned. Normal wear and tear is not charged.

## 5. Pick-up and return

- Cars are handed over and returned at the office chosen in the booking, during opening hours.
- Mileage, fuel level and existing damage are recorded and photographed in a handover report at pick-up and return. Please check the report.
- Returns up to {{graceMinutes}} minutes late are free of charge. Longer delays are charged as an extra day as set out in the rental agreement.
- If the car is returned early, the rent is recalculated at the daily rate applicable to the period used and the difference is refunded.

## 6. Fuel and mileage

- Return the car with the same fuel level as at pick-up. Missing fuel is charged at the market price plus the service fee stated in the rental agreement.
- Some cars have a daily mileage limit, shown on the car's page. Each kilometre above the limit is charged at the rate shown there.

## 7. Insurance and damage

- All cars have compulsory third-party insurance and comprehensive (kasko) insurance; basic insurance is included in the rent. An excess (the amount you pay in case of damage) may apply.
- Additional cover such as full coverage without excess is optional and never a condition of the rental.
- Damage caused while driving under the influence of alcohol or drugs, by a driver not named in the agreement, during off-road or racing use, intentionally or through gross negligence, or without an accident report may not be covered by insurance.
- In case of an accident or damage, inform the police and the Company immediately and obtain an accident report.
- Damage costs are determined by an authorised, independent expert report. Damage not recorded in the handover reports cannot be claimed later.

## 8. Tolls and traffic fines

- Cars are fitted with an HGS toll tag. Tolls during the rental are charged to the renter at cost, with supporting records.
- Traffic fines and administrative penalties incurred during the rental are the renter's responsibility and are passed on with the official notice.
- As required by law, renter and driver details are shared with the competent authorities on request.

## 9. Use of the car

- The car may not be driven by persons not named in the agreement, sublet, or used to carry passengers or goods for hire.
- The car may not be used for racing, driving lessons, towing or off-road driving. Smoking in the car is not allowed.
- The car may not be taken abroad without the Company's written permission.
- In case of a breakdown, do not have the car repaired without the Company's approval; call us for instructions.

## 10. Cancellation, changes and no-show

- You can cancel free of charge up to {{cancelHours}} hours before pick-up on the "My booking" page or by contacting us.
- For cancellations within the last 24 hours, at most one day's rent may be charged. No cancellation fee is charged when no prepayment was made.
- Changes of dates or car are subject to availability and current prices.
- If you do not arrive, the car is held for 12 hours for rentals of 1–6 days, or 1 day for rentals of 7 days or more; after that the booking may be cancelled.

## 11. Personal data

Your personal data is processed as described in our Privacy Notice.

## 12. Disputes

Consumer arbitration committees are competent for disputes within the applicable monetary limits, and consumer courts above those limits.

## 13. Contact

{{legalName}} · {{address}} · Phone: {{phone}} · Email: {{email}}
`,
  },
  de: {
    title: 'Mietbedingungen',
    description: 'Fahrervoraussetzungen, Zahlung, Kaution, Kraftstoff, Kilometer, Versicherung, Verkehrsstrafen und Stornierung.',
    body: `
Diese Bedingungen gelten für Mietwagenbuchungen bei {{legalName}} (das „Unternehmen“) über diese Website, telefonisch oder in unseren Filialen. Der bei der Übergabe ausgestellte Mietvertrag ist Bestandteil dieser Bedingungen; bei Abweichungen gilt der unterzeichnete Mietvertrag.

Vermietungsgenehmigung Nr.: {{authorizationNumber}} · MERSIS-Nr.: {{mersisNumber}}

## 1. Voraussetzungen für Fahrer

- Der abholende Fahrer muss einen für die Fahrzeugklasse gültigen Führerschein sowie Personalausweis oder Reisepass vorlegen.
- Mindestalter und Führerscheinbesitz richten sich nach der Fahrzeugklasse und sind auf der Seite jedes Fahrzeugs angegeben. Fahrer, die diese nicht erfüllen, erhalten kein Fahrzeug.
- Nicht in lateinischer Schrift ausgestellte Führerscheine erfordern zusätzlich einen internationalen Führerschein.
- Nur im Mietvertrag eingetragene Fahrer dürfen das Fahrzeug fahren. Zusatzfahrer müssen dieselben Voraussetzungen erfüllen und bei der Abholung eingetragen werden.

## 2. Buchung und Bestätigung

- Gebucht wird eine Fahrzeuggruppe, kein bestimmtes Fahrzeug („oder ähnlich“). Ist kein Fahrzeug der gebuchten Gruppe verfügbar, erhalten Sie ohne Aufpreis ein Fahrzeug derselben oder einer höheren Gruppe.
- Ein Fahrzeug einer niedrigeren Gruppe wird nur mit Ihrer Zustimmung übergeben; die Preisdifferenz wird erstattet. Andernfalls können Sie kostenlos stornieren.
- Der Status Ihrer Buchung wird per E-Mail mitgeteilt. Auf der Seite „Meine Buchung“ können Sie Ihre Buchung mit Buchungscode und E-Mail-Adresse abrufen.

## 3. Preise und Zahlung

- Die angezeigten Preise sind Gesamtpreise inklusive Steuern für die gewählten Daten und Extras. Eine Einweggebühr ist im Gesamtpreis enthalten.
- Die Preise werden in türkischen Lira festgelegt. Beträge in anderen Währungen dienen zur Information zum Tageskurs.
- Auf der Website wird keine Zahlung abgewickelt. Sie zahlen bei der Abholung im Büro bar oder mit Karte oder vorab per Banküberweisung mit Ihrem Buchungscode als Verwendungszweck.
- Die Mietdauer wird in 24-Stunden-Abschnitten berechnet. Der Tagespreis kann je nach Mietdauer und Saison variieren.

## 4. Kaution

- Bei der Abholung wird die Kaution auf der Debit- oder Kreditkarte des Mieters reserviert. Wechsel, Schecks oder Garantiebriefe werden nicht angenommen.
- Die Kaution darf bei 1–6 Miettagen höchstens 3 Tagesmieten und bei 7–29 Miettagen höchstens 7 Tagesmieten betragen. Der auf der Fahrzeugseite genannte Betrag ist der Höchstbetrag.
- Die Kaution darf nur für offene Miet- und Extrakosten, verspätete Rückgabe, Mehrkilometer, fehlenden Kraftstoff, Maut, Verkehrsstrafen und nicht versicherte Schäden verwendet werden.
- Die Kaution wird innerhalb von 7 Tagen nach der Rückgabe freigegeben. Normale Abnutzung wird nicht berechnet.

## 5. Abholung und Rückgabe

- Übergabe und Rückgabe erfolgen in der gebuchten Filiale während der Öffnungszeiten.
- Kilometerstand, Tankfüllung und vorhandene Schäden werden bei Abholung und Rückgabe protokolliert und fotografiert. Bitte prüfen Sie das Protokoll.
- Verspätungen bis zu {{graceMinutes}} Minuten sind kostenlos. Längere Verspätungen werden gemäß Mietvertrag als zusätzlicher Tag berechnet.
- Bei vorzeitiger Rückgabe wird die Miete zum für die genutzte Dauer geltenden Tagespreis neu berechnet und die Differenz erstattet.

## 6. Kraftstoff und Kilometer

- Das Fahrzeug ist mit derselben Tankfüllung wie bei der Abholung zurückzugeben. Fehlender Kraftstoff wird zum Marktpreis zuzüglich der im Mietvertrag genannten Servicegebühr berechnet.
- Für manche Fahrzeuge gilt ein tägliches Kilometerlimit (siehe Fahrzeugseite). Jeder Mehrkilometer wird zum dort genannten Satz berechnet.

## 7. Versicherung und Schäden

- Alle Fahrzeuge sind haftpflicht- und kaskoversichert; die Grundversicherung ist im Mietpreis enthalten. Eine Selbstbeteiligung kann gelten.
- Zusätzlicher Schutz wie Vollkasko ohne Selbstbeteiligung ist freiwillig und keine Voraussetzung für die Anmietung.
- Schäden unter Alkohol- oder Drogeneinfluss, durch nicht eingetragene Fahrer, bei Gelände- oder Rennnutzung, vorsätzlich oder grob fahrlässig verursacht oder ohne Unfallbericht können vom Versicherungsschutz ausgeschlossen sein.
- Bei Unfall oder Schaden informieren Sie sofort Polizei und Unternehmen und lassen einen Unfallbericht erstellen.
- Schadenskosten werden durch ein unabhängiges Sachverständigengutachten ermittelt. Nicht in den Protokollen erfasste Schäden können später nicht geltend gemacht werden.

## 8. Maut und Verkehrsstrafen

- Die Fahrzeuge sind mit einem HGS-Mautaufkleber ausgestattet. Mautgebühren während der Miete werden zum Selbstkostenpreis mit Nachweis berechnet.
- Während der Miete entstandene Verkehrs- und Verwaltungsstrafen trägt der Mieter; sie werden mit dem amtlichen Bescheid weitergegeben.
- Mieter- und Fahrerdaten werden auf Anfrage gesetzeskonform an zuständige Behörden übermittelt.

## 9. Nutzung des Fahrzeugs

- Das Fahrzeug darf nicht von nicht eingetragenen Personen gefahren, untervermietet oder zur gewerblichen Personen- oder Güterbeförderung genutzt werden.
- Rennen, Fahrschulnutzung, Anhängerbetrieb und Geländefahrten sind nicht erlaubt. Rauchen im Fahrzeug ist verboten.
- Ohne schriftliche Genehmigung des Unternehmens darf das Fahrzeug nicht ins Ausland gebracht werden.
- Bei einer Panne das Fahrzeug nicht ohne Zustimmung des Unternehmens reparieren lassen; rufen Sie uns an.

## 10. Stornierung, Änderungen und Nichterscheinen

- Bis {{cancelHours}} Stunden vor der Abholung können Sie auf der Seite „Meine Buchung“ oder über unseren Kundenservice kostenlos stornieren.
- Bei Stornierungen innerhalb der letzten 24 Stunden kann höchstens eine Tagesmiete berechnet werden. Ohne Vorauszahlung fällt keine Stornogebühr an.
- Änderungen von Daten oder Fahrzeug erfolgen nach Verfügbarkeit zu aktuellen Preisen.
- Erscheinen Sie nicht, wird das Fahrzeug bei 1–6 Miettagen 12 Stunden, bei 7 oder mehr Miettagen 1 Tag bereitgehalten; danach kann die Buchung storniert werden.

## 11. Personenbezogene Daten

Ihre personenbezogenen Daten werden gemäß unseren Datenschutzhinweisen verarbeitet.

## 12. Streitigkeiten

Für Streitigkeiten sind innerhalb der geltenden Wertgrenzen die Verbraucherschiedsstellen und darüber die Verbrauchergerichte in der Türkei zuständig.

## 13. Kontakt

{{legalName}} · {{address}} · Telefon: {{phone}} · E-Mail: {{email}}
`,
  },
  ru: {
    title: 'Условия аренды',
    description: 'Требования к водителю, оплата, залог, топливо, пробег, страхование, штрафы и отмена.',
    body: `
Настоящие условия применяются к бронированиям автомобилей в компании {{legalName}} («Компания»), сделанным через этот сайт, по телефону или в наших офисах. Договор аренды, оформляемый при выдаче автомобиля, является частью этих условий; при расхождениях действует подписанный договор аренды.

№ разрешения на прокат: {{authorizationNumber}} · № MERSIS: {{mersisNumber}}

## 1. Требования к водителю

- Водитель, получающий автомобиль, должен предъявить действующее водительское удостоверение соответствующей категории и удостоверение личности или паспорт.
- Минимальный возраст и водительский стаж зависят от класса автомобиля и указаны на странице каждого автомобиля. Водителям, не соответствующим требованиям, автомобиль не выдаётся.
- Если удостоверение выдано не латиницей, требуется международное водительское удостоверение.
- Управлять автомобилем могут только водители, указанные в договоре. Дополнительные водители должны соответствовать тем же требованиям и вносятся в договор при получении.

## 2. Бронирование и подтверждение

- Бронируется группа автомобилей, а не конкретная машина («или аналог»). Если автомобиля забронированной группы нет, вы бесплатно получите автомобиль той же или более высокой группы.
- Автомобиль более низкой группы выдаётся только с вашего согласия с возвратом разницы в цене. Если вы не согласны, бронирование можно отменить бесплатно.
- Статус бронирования сообщается по email. Бронирование можно посмотреть на странице «Моё бронирование» по коду и email.

## 3. Цены и оплата

- Цены на сайте — итоговая стоимость аренды на выбранные даты и опции с учётом налогов. Сбор за возврат в другом офисе включён в итог.
- Цены устанавливаются в турецких лирах. Суммы в других валютах приведены для информации по текущему курсу.
- Оплата на сайте не принимается. Вы платите в офисе наличными или картой при получении автомобиля либо банковским переводом до получения, указав код бронирования в назначении платежа.
- Срок аренды рассчитывается периодами по 24 часа. Цена за сутки зависит от срока аренды и сезона.

## 4. Залог

- При получении автомобиля сумма залога блокируется на дебетовой или кредитной карте арендатора. Векселя, чеки и гарантийные письма в качестве залога не принимаются.
- Залог не может превышать стоимость 3 суток аренды при сроке 1–6 суток и 7 суток аренды при сроке 7–29 суток. Сумма на странице автомобиля — это максимум.
- Залог используется только для неоплаченной аренды и опций, опоздания с возвратом, перепробега, недостающего топлива, платных дорог, штрафов и ущерба, не покрытого страховкой.
- Залог разблокируется в течение 7 дней после возврата автомобиля. За обычный износ ничего не удерживается.

## 5. Получение и возврат

- Автомобиль выдаётся и принимается в выбранном при бронировании офисе в часы работы.
- Пробег, уровень топлива и имеющиеся повреждения фиксируются в акте и фотографируются при получении и возврате. Пожалуйста, проверьте акт.
- Опоздание с возвратом до {{graceMinutes}} минут бесплатно. При большем опоздании взимается плата за дополнительные сутки по договору.
- При досрочном возврате стоимость пересчитывается по цене за сутки для фактического срока, разница возвращается.

## 6. Топливо и пробег

- Верните автомобиль с тем же уровнем топлива, что и при получении. Недостающее топливо оплачивается по рыночной цене плюс сервисный сбор по договору.
- Для некоторых автомобилей действует суточный лимит пробега (указан на странице автомобиля). Каждый километр сверх лимита оплачивается по указанной там ставке.

## 7. Страхование и ущерб

- Все автомобили застрахованы по ОСАГО и КАСКО; базовая страховка входит в стоимость аренды. Может действовать франшиза.
- Дополнительная защита, например полное КАСКО без франшизы, добровольна и не является условием аренды.
- Ущерб, причинённый в состоянии алкогольного или наркотического опьянения, водителем, не указанным в договоре, при езде по бездорожью или гонках, умышленно или по грубой неосторожности, а также без протокола ДТП может не покрываться страховкой.
- При ДТП или повреждении немедленно сообщите в полицию и Компании и оформите протокол.
- Стоимость ущерба определяется заключением уполномоченного независимого эксперта. Повреждения, не отражённые в актах, впоследствии не предъявляются.

## 8. Платные дороги и штрафы

- Автомобили оснащены меткой HGS. Плата за проезд в период аренды взимается с арендатора по фактической стоимости с подтверждением.
- Штрафы за нарушения ПДД и административные штрафы за период аренды оплачивает арендатор; они передаются вместе с официальным уведомлением.
- Данные арендатора и водителя по закону передаются компетентным органам по запросу.

## 9. Правила использования

- Автомобилем не могут управлять лица, не указанные в договоре; его нельзя сдавать в субаренду или использовать для коммерческих перевозок.
- Запрещены гонки, учебная езда, буксировка прицепа и езда по бездорожью. Курение в автомобиле запрещено.
- Выезд за границу без письменного разрешения Компании запрещён.
- При поломке не ремонтируйте автомобиль без согласия Компании — позвоните нам.

## 10. Отмена, изменения и неявка

- Бесплатная отмена возможна не позднее чем за {{cancelHours}} ч до получения на странице «Моё бронирование» или по нашим контактам.
- При отмене в последние 24 часа может быть удержана плата не более чем за одни сутки. Если предоплата не вносилась, плата за отмену не взимается.
- Изменение дат или автомобиля возможно при наличии и по актуальным ценам.
- При неявке автомобиль ожидает 12 часов при аренде на 1–6 суток и 1 сутки при аренде от 7 суток; после этого бронирование может быть отменено.

## 11. Персональные данные

Ваши персональные данные обрабатываются в соответствии с нашей политикой конфиденциальности.

## 12. Споры

Споры в пределах установленных денежных лимитов рассматривают комиссии по защите прав потребителей, свыше лимитов — потребительские суды Турции.

## 13. Контакты

{{legalName}} · {{address}} · Телефон: {{phone}} · Email: {{email}}
`,
  },
}
