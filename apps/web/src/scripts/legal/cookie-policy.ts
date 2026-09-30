import type { LegalPage } from './types'

/**
 * Cookie policy matching the cookies the site actually sets: the currency preference, staff panel
 * session/language cookies and Cloudflare Turnstile (security). No analytics or advertising cookies;
 * if any are added, this page and a consent banner must be updated (KVKK cookie guide, 2022).
 */
export const cookiePolicy: LegalPage = {
  slug: 'cookie-policy',
  tr: {
    title: 'Çerez Politikası',
    description: 'İnternet sitemizde kullanılan çerezler ve tercihlerinizi nasıl yönetebileceğiniz.',
    body: `
Bu politika, {{legalName}} tarafından işletilen bu internet sitesinde kullanılan çerezleri açıklar.

## Çerez nedir?

Çerezler, bir internet sitesini ziyaret ettiğinizde tarayıcınıza kaydedilen küçük metin dosyalarıdır. Sitenin çalışması, güvenliği ve tercihlerinizin hatırlanması için kullanılır.

## Kullandığımız çerezler

Sitemizde yalnızca sitenin çalışması için gerekli ve tercihlerinizi hatırlayan çerezler kullanılır. Reklam, profil çıkarma veya üçüncü taraf analiz çerezi kullanılmaz.

- **site-currency (tercih):** Fiyatların gösterileceği para birimi seçiminizi 1 yıl boyunca hatırlar.
- **Güvenlik çerezleri (zorunlu):** Formlarda otomatik (bot) kullanımı önlemek için güvenlik doğrulama hizmeti (Cloudflare Turnstile) tarafından kullanılabilir.
- **payload-token ve admin-lang (zorunlu):** Yalnızca personel yönetim paneline giriş yapan çalışanlarımız için oturum ve arayüz dili bilgisini tutar; site ziyaretçilerine yerleştirilmez.

Bu çerezler sitenin talep ettiğiniz şekilde çalışması için zorunlu olduğundan, KVKK md. 5/2 kapsamında açık rıza aranmadan kullanılır.

## Çerezleri nasıl yönetebilirsiniz?

Tarayıcınızın ayarlarından çerezleri silebilir veya engelleyebilirsiniz. Zorunlu çerezleri engellemeniz halinde sitenin bazı bölümleri (örneğin rezervasyon formu) düzgün çalışmayabilir.

## Değişiklikler

Sitemize analiz veya pazarlama amaçlı çerezler eklenmesi halinde bu politika güncellenecek ve bu çerezler yalnızca onayınızla kullanılacaktır. Kişisel verilerinizin işlenmesine ilişkin ayrıntılar için Aydınlatma Metni'ni inceleyebilirsiniz.
`,
  },
  en: {
    title: 'Cookie Policy',
    description: 'The cookies used on our website and how you can manage them.',
    body: `
This policy explains the cookies used on this website operated by {{legalName}}.

## What are cookies?

Cookies are small text files stored in your browser when you visit a website. They are used to make the site work, keep it secure and remember your preferences.

## Cookies we use

We only use cookies that are necessary for the site to work and that remember your preferences. We do not use advertising, profiling or third-party analytics cookies.

- **site-currency (preference):** remembers the currency you chose for prices for 1 year.
- **Security cookies (necessary):** may be set by our security check service (Cloudflare Turnstile) to prevent automated (bot) use of forms.
- **payload-token and admin-lang (necessary):** only for our staff signing in to the management panel, to keep the session and interface language; never set for website visitors.

As these cookies are necessary to provide the site you request, they are used without explicit consent under KVKK art. 5(2).

## Managing cookies

You can delete or block cookies in your browser settings. If you block necessary cookies, parts of the site (such as the booking form) may not work properly.

## Changes

If we add analytics or marketing cookies, we will update this policy and use them only with your consent. For details on how we process personal data, see our Privacy Notice.
`,
  },
  de: {
    title: 'Cookie-Richtlinie',
    description: 'Welche Cookies unsere Website verwendet und wie Sie sie verwalten können.',
    body: `
Diese Richtlinie erläutert die Cookies auf dieser von {{legalName}} betriebenen Website.

## Was sind Cookies?

Cookies sind kleine Textdateien, die beim Besuch einer Website in Ihrem Browser gespeichert werden. Sie sorgen dafür, dass die Website funktioniert, sicher ist und sich Ihre Einstellungen merkt.

## Welche Cookies wir verwenden

Wir verwenden nur Cookies, die für den Betrieb der Website erforderlich sind oder Ihre Einstellungen speichern. Werbe-, Profiling- oder Analyse-Cookies Dritter setzen wir nicht ein.

- **site-currency (Einstellung):** speichert die gewählte Währung für Preise für 1 Jahr.
- **Sicherheits-Cookies (erforderlich):** können von unserem Sicherheitsdienst (Cloudflare Turnstile) gesetzt werden, um automatisierte Nutzung (Bots) von Formularen zu verhindern.
- **payload-token und admin-lang (erforderlich):** nur für Mitarbeitende, die sich im Verwaltungsbereich anmelden (Sitzung und Sprache); werden bei Website-Besuchern nicht gesetzt.

Da diese Cookies für die von Ihnen gewünschte Nutzung erforderlich sind, werden sie gemäß Art. 5 Abs. 2 KVKK ohne ausdrückliche Einwilligung verwendet.

## Cookies verwalten

Sie können Cookies in den Browsereinstellungen löschen oder blockieren. Werden erforderliche Cookies blockiert, funktionieren Teile der Website (z. B. das Buchungsformular) möglicherweise nicht.

## Änderungen

Sollten wir Analyse- oder Marketing-Cookies einführen, aktualisieren wir diese Richtlinie und setzen sie nur mit Ihrer Einwilligung ein. Einzelheiten zur Datenverarbeitung finden Sie in unseren Datenschutzhinweisen.
`,
  },
  ru: {
    title: 'Политика использования cookie',
    description: 'Какие файлы cookie используются на нашем сайте и как ими управлять.',
    body: `
Настоящая политика описывает файлы cookie, используемые на сайте, которым управляет {{legalName}}.

## Что такое cookie?

Cookie — это небольшие текстовые файлы, которые сохраняются в браузере при посещении сайта. Они нужны для работы сайта, его безопасности и запоминания ваших настроек.

## Какие cookie мы используем

Мы используем только cookie, необходимые для работы сайта и запоминания ваших настроек. Рекламные, профилирующие и сторонние аналитические cookie не используются.

- **site-currency (настройка):** запоминает выбранную валюту цен на 1 год.
- **Cookie безопасности (необходимые):** могут устанавливаться сервисом проверки безопасности (Cloudflare Turnstile) для защиты форм от автоматического (бот) использования.
- **payload-token и admin-lang (необходимые):** только для сотрудников, входящих в панель управления (сессия и язык интерфейса); посетителям сайта не устанавливаются.

Поскольку эти cookie необходимы для работы сайта по вашему запросу, они используются без явного согласия согласно ст. 5(2) KVKK.

## Управление cookie

Вы можете удалить или заблокировать cookie в настройках браузера. При блокировке необходимых cookie некоторые разделы сайта (например, форма бронирования) могут работать неправильно.

## Изменения

Если мы начнём использовать аналитические или маркетинговые cookie, мы обновим эту политику и будем использовать их только с вашего согласия. Подробности обработки персональных данных — в политике конфиденциальности.
`,
  },
}
