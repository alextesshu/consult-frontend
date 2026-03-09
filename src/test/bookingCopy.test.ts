import { describe, expect, it } from 'vitest'
import {
  BOOKING_RESCHEDULE_SUGGESTION_REASON_LABELS,
  getSuggestionReasonLabel,
} from '../lib/bookingCopy'

describe('booking copy helpers', () => {
  it('returns humanized labels for known suggestion reason tags', () => {
    for (const [reasonTag, label] of Object.entries(
      BOOKING_RESCHEDULE_SUGGESTION_REASON_LABELS
    )) {
      expect(getSuggestionReasonLabel(reasonTag)).toBe(label)
    }
  })

  it('returns empty string for empty reason tags', () => {
    expect(getSuggestionReasonLabel(undefined)).toBe('')
    expect(getSuggestionReasonLabel(null)).toBe('')
    expect(getSuggestionReasonLabel('')).toBe('')
  })

  it('falls back to raw reason tag for unknown values', () => {
    expect(getSuggestionReasonLabel('custom_unknown_tag')).toBe(
      'custom_unknown_tag'
    )
  })
})
