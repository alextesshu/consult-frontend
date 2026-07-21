import { toLocalDate } from './dates'

export type PublicBookingRecoveryProfile = {
  public_booking_mode?: 'request_only' | 'direct_booking' | string | null
  show_public_availability?: boolean | null
  public_direct_booking_enabled?: boolean | null
  public_booking_horizon_days?: number | null
}

export type PublicBookingRecoveryProfileStatus = 'loading' | 'available' | 'unavailable'
export type PublicBookingRecoverySlotsStatus = 'not_required' | 'loading' | 'success' | 'error'
export type PublicBookingRecoveryState =
  | 'loading'
  | 'booking'
  | 'request'
  | 'request_after_availability_error'
  | 'unavailable'

export function resolvePublicBookingRecovery(input: {
  profileStatus: PublicBookingRecoveryProfileStatus
  profile: PublicBookingRecoveryProfile | null
  slotsStatus: PublicBookingRecoverySlotsStatus
  slotsCount?: number
}): PublicBookingRecoveryState {
  if (input.profileStatus === 'loading') return 'loading'
  if (input.profileStatus === 'unavailable' || !input.profile) return 'unavailable'

  const requiresSlots =
    input.profile.public_booking_mode === 'direct_booking' &&
    input.profile.show_public_availability === true &&
    input.profile.public_direct_booking_enabled !== false

  if (!requiresSlots) return 'request'
  if (input.slotsStatus === 'loading') return 'loading'
  if (input.slotsStatus === 'error') return 'request_after_availability_error'
  if (input.slotsStatus === 'success' && (input.slotsCount || 0) > 0) return 'booking'
  return 'request'
}

export function getPublicBookingHorizonRange(
  profile: PublicBookingRecoveryProfile,
  now = new Date()
): { date_from: string; date_to: string } {
  const rawHorizonDays = Number(profile.public_booking_horizon_days)
  const horizonDays = Number.isFinite(rawHorizonDays) && rawHorizonDays > 0 ? rawHorizonDays : 14
  const horizonEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate() + horizonDays)

  return {
    date_from: toLocalDate(now),
    date_to: toLocalDate(horizonEnd),
  }
}
