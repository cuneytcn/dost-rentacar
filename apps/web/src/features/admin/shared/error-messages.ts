import type { AdminLang } from '../lang'

/**
 * Business and validation errors are raised in English (the public API speaks English).
 * The panel translates the known ones; unknown messages are shown as they are.
 */
const PATTERNS: [RegExp, (match: RegExpMatchArray) => string][] = [
  [/^This record is used by other records \(vehicle models\)/, () => 'Bu görsel araç modellerinde kullanılıyor. Önce oradan kaldırın.'],
  [/^This record is used by other records/, () => 'Bu kayıt başka kayıtlarda (ör. rezervasyonlarda) kullanılıyor. Silmek yerine pasif yapın.'],
  [/^A record with the same unique value already exists/, () => 'Aynı benzersiz değere sahip bir kayıt zaten var (ör. plaka, e-posta veya URL kısaltması).'],
  [/^Vehicle (.+) is already assigned to reservation (\S+) in this period/, (m) => `${m[1]} plakalı araç bu tarihlerde ${m[2]} rezervasyonuna atanmış.`],
  [/^Vehicle (.+) is blocked \(maintenance\/repair\) during this period/, (m) => `${m[1]} plakalı araç bu tarihlerde bakım/onarım nedeniyle kapalı.`],
  [/^Vehicle (.+) is not active \(status: (\w+)\)/, (m) => `${m[1]} plakalı araç aktif değil.`],
  [/^The vehicle is already booked for this period/, () => 'Araç bu tarihlerde zaten kiralanmış.'],
  [/^No free car of this model for these dates/, () => 'Bu tarihlerde bu modelden boş araç yok.'],
  [/^This vehicle is no longer available/, () => 'Bu araç seçilen tarihlerde artık müsait değil.'],
  [/^Status cannot change from "(\w+)" to "(\w+)"/, () => 'Rezervasyon bu duruma geçirilemez.'],
  [/^Assign a vehicle before starting the rental/, () => 'Kiralamayı başlatmadan önce araç atayın.'],
  [/^Assign a vehicle to the reservation before pickup/, () => 'Teslimden önce rezervasyona araç atayın.'],
  [/^Only confirmed reservations can be picked up/, () => 'Sadece onaylı rezervasyonlar teslim edilebilir.'],
  [/^Record the pickup before the return/, () => 'İadeden önce teslim kaydı girilmeli.'],
  [/^A (\w+) record already exists for this reservation/, (m) => `Bu rezervasyon için ${m[1] === 'pickup' ? 'teslim' : 'iade'} kaydı zaten var.`],
  [/^Return mileage must be at least (\d+) km/, (m) => `İade kilometresi en az ${m[1]} km olmalı.`],
  [/^A tier starting at 1 day is required/, () => '1 günden başlayan bir fiyat kademesi zorunlu.'],
  [/^Tiers must have distinct/, () => 'Fiyat kademelerinin gün başlangıçları farklı olmalı.'],
  [/^Staff users need at least one location/, () => 'Şube personeline en az bir şube atanmalı.'],
  [/^End must be after start/, () => 'Bitiş, başlangıçtan sonra olmalı.'],
  [/^Return must be after pickup/, () => 'İade, alıştan sonra olmalı.'],
  [/^End date must not be before start date/, () => 'Bitiş tarihi başlangıçtan önce olamaz.'],
  [/^Use YYYY-MM-DD/, () => 'Tarih YYYY-AA-GG biçiminde olmalı.'],
  [/^Use HH:mm format/, () => 'Saat SS:dd biçiminde olmalı.'],
  [/^Must be an integer amount/, () => 'Geçerli bir tutar girin.'],
  [/^Choose or add a customer/, () => 'Müşteri seçin veya ekleyin.'],
  [/^Choose a file/, () => 'Dosya seçin.'],
  [/^File is larger than 10 MB/, () => 'Dosya 10 MB’tan büyük.'],
  [/^Only images are allowed/, () => 'Sadece görsel yüklenebilir.'],
  [/^Only images and PDFs are allowed/, () => 'Sadece görsel veya PDF yüklenebilir.'],
  [/^Records of this type cannot be (created|deleted)/, (m) => `Bu tür kayıtlar ${m[1] === 'created' ? 'oluşturulamaz' : 'silinemez'}.`],
  [/^Only open reservations can be changed/, () => 'Sadece açık (onay bekleyen, onaylı veya kiradaki) rezervasyonlar değiştirilebilir.'],
  [/^Invalid input$/, () => 'Girilen bilgiler geçersiz.'],
  [/^Something went wrong/, () => 'Bir şeyler ters gitti. Lütfen tekrar deneyin.'],
]

export function localizeError(message: string, lang: AdminLang): string {
  if (lang !== 'tr') return message
  for (const [pattern, translate] of PATTERNS) {
    const match = message.match(pattern)
    if (match) return translate(match)
  }
  return message
}
