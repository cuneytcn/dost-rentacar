/** ID of a Payload relationship value that may or may not be populated. */
export function relationId(value: number | { id: number } | null | undefined): number | null {
  if (value == null) return null
  return typeof value === 'object' ? value.id : value
}

export function populated<T extends { id: number }>(value: number | T | null | undefined): T | null {
  return value && typeof value === 'object' ? value : null
}
