/** Plural message: `one`/`other` for every language, `few`/`many` where the language needs them (Russian). */
export type Plural = { one: string; other: string; few?: string; many?: string; zero?: string }

export const plural = (forms: Plural): Plural => forms

type Widen<T> = T extends string ? string : T extends Plural ? Plural : { [K in keyof T]: Widen<T[K]> }

/** Shape of a site dictionary, derived from the English source so every language must define every key. */
export type MessagesOf<T> = Widen<T>

/** Replaces `{name}` placeholders. */
export function format(message: string, values: Record<string, string | number> = {}): string {
  return message.replace(/\{(\w+)\}/g, (match, key: string) => (key in values ? String(values[key]) : match))
}

/** Picks the plural form for `count` and fills `{count}` and other placeholders. */
export function formatPlural(intlLocale: string, message: Plural, count: number, values: Record<string, string | number> = {}): string {
  const category = new Intl.PluralRules(intlLocale).select(count) as keyof Plural
  const template = message[category] ?? message.other
  return format(template, { count: new Intl.NumberFormat(intlLocale).format(count), ...values })
}
