import { describe, expect, it } from 'vitest'
import { createSpecialistDiscoveryShuffleSeed } from './specialistDiscoveryRotation'

describe('createSpecialistDiscoveryShuffleSeed', () => {
  it('creates a bounded opaque lowercase-hex seed from random bytes', () => {
    const seed = createSpecialistDiscoveryShuffleSeed((bytes) => {
      bytes.forEach((_, index) => {
        bytes[index] = index
      })
      return bytes
    })

    expect(seed).toBe('000102030405060708090a0b0c0d0e0f')
    expect(seed).toMatch(/^[a-f0-9]{32}$/)
  })
})
