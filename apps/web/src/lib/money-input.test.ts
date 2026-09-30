import { describe, expect, it } from 'vitest'

import { formatMoneyInput, parseMoneyInput } from './money-input'

describe('parseMoneyInput', () => {
  it.each([
    ['45', 4500],
    ['45,5', 4550],
    ['45.50', 4550],
    ['45,05', 4505],
    ['1.234,56', 123456],
    ['1,234.56', 123456],
    ['1.234', 123400],
    ['1 234,5', 123450],
    ['€ 35', 3500],
    ['0', 0],
  ])('parses %s', (input, expected) => {
    expect(parseMoneyInput(input)).toBe(expected)
  })

  it('returns null for empty and invalid for garbage or negatives', () => {
    expect(parseMoneyInput('  ')).toBeNull()
    expect(parseMoneyInput('abc')).toBe('invalid')
    expect(parseMoneyInput('-5')).toBe('invalid')
    expect(parseMoneyInput('1,2,3.4.5')).toBe(123450)
  })
})

describe('formatMoneyInput', () => {
  it('formats minor units for the admin locale', () => {
    expect(formatMoneyInput(123456, 'tr-TR')).toBe('1.234,56')
    expect(formatMoneyInput(4500, 'en-GB')).toBe('45.00')
    expect(formatMoneyInput(null, 'tr-TR')).toBe('')
  })
})
