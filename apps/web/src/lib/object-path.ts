/** Read a dotted path (`seo.title`) from a plain object. */
export function getPath(source: unknown, path: string): unknown {
  return path.split('.').reduce<unknown>((value, key) => (value && typeof value === 'object' ? (value as Record<string, unknown>)[key] : undefined), source)
}

/** Write a dotted path into a plain object, creating intermediate objects. */
export function setPath(target: Record<string, unknown>, path: string, value: unknown): void {
  const keys = path.split('.')
  let current = target
  for (const key of keys.slice(0, -1)) {
    if (!current[key] || typeof current[key] !== 'object') current[key] = {}
    current = current[key] as Record<string, unknown>
  }
  current[keys.at(-1)!] = value
}
