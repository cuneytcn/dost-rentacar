import { describe, expect, it } from 'vitest'

import { getPath, setPath } from './object-path'

describe('object-path', () => {
  it('reads and writes nested paths', () => {
    const target: Record<string, unknown> = {}
    setPath(target, 'seo.title', 'Hi')
    setPath(target, 'name', 'X')
    expect(target).toEqual({ seo: { title: 'Hi' }, name: 'X' })
    expect(getPath(target, 'seo.title')).toBe('Hi')
    expect(getPath(target, 'seo.missing.deep')).toBeUndefined()
  })
})
