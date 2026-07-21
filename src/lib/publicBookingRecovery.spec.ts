import { describe, expect, it } from 'vitest'
import { resolvePublicBookingRecovery } from './publicBookingRecovery'

const requestOnly = {
  public_booking_mode: 'request_only' as const,
  show_public_availability: false,
  public_direct_booking_enabled: false,
}

const directBooking = {
  public_booking_mode: 'direct_booking' as const,
  show_public_availability: true,
  public_direct_booking_enabled: true,
}

describe('resolvePublicBookingRecovery', () => {
  it.each([
    ['request-only does not require slots', { profileStatus: 'available', profile: requestOnly, slotsStatus: 'not_required' }, 'request'],
    ['direct booking with slots', { profileStatus: 'available', profile: directBooking, slotsStatus: 'success', slotsCount: 1 }, 'booking'],
    ['direct booking with an empty successful response', { profileStatus: 'available', profile: directBooking, slotsStatus: 'success', slotsCount: 0 }, 'request'],
    ['direct booking with hidden availability', { profileStatus: 'available', profile: { ...directBooking, show_public_availability: false }, slotsStatus: 'not_required' }, 'request'],
    ['slots request failure', { profileStatus: 'available', profile: directBooking, slotsStatus: 'error' }, 'request_after_availability_error'],
    ['unavailable public profile', { profileStatus: 'unavailable', profile: null, slotsStatus: 'not_required' }, 'unavailable'],
    ['loading profile', { profileStatus: 'loading', profile: null, slotsStatus: 'not_required' }, 'loading'],
    ['loading slots', { profileStatus: 'available', profile: directBooking, slotsStatus: 'loading' }, 'loading'],
  ] as const)('%s resolves to %s', (_name, input, expected) => {
    expect(resolvePublicBookingRecovery(input)).toBe(expected)
  })
})
