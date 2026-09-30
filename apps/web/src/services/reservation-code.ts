import { randomInt } from 'crypto'

// No 0/O, 1/I/L to avoid confusion when read over the phone.
const ALPHABET = '23456789ABCDEFGHJKMNPQRSTUVWXYZ'
const LENGTH = 7

export function generateReservationCode(): string {
  let code = 'R'
  for (let index = 0; index < LENGTH; index++) {
    code += ALPHABET[randomInt(ALPHABET.length)]
  }
  return code
}
