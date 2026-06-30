import { describe, expect, it } from 'vitest'
import {
  BOOKING_RESCHEDULE_SUGGESTION_REASON_LABELS,
  getBookingErrorMessage,
  getSuggestionReasonLabel,
} from '../lib/bookingCopy'

describe('booking copy helpers', () => {
  it('returns humanized labels for known suggestion reason tags', () => {
    for (const [reasonTag, label] of Object.entries(BOOKING_RESCHEDULE_SUGGESTION_REASON_LABELS)) {
      expect(getSuggestionReasonLabel(reasonTag)).toBe(label)
    }
  })

  it('returns empty string for empty reason tags', () => {
    expect(getSuggestionReasonLabel(undefined)).toBe('')
    expect(getSuggestionReasonLabel(null)).toBe('')
    expect(getSuggestionReasonLabel('')).toBe('')
  })

  it('falls back to raw reason tag for unknown values', () => {
    expect(getSuggestionReasonLabel('custom_unknown_tag')).toBe('custom_unknown_tag')
  })

  it('prefers stable booking reason_code mapping over detail text', () => {
    expect(
      getBookingErrorMessage(
        {
          response: {
            data: {
              code: 'STATE_TRANSITION_INVALID',
              reason_code: 'SESSION_STATUS_INVALID',
              detail: 'Invalid status transition.',
            },
          },
        },
        'fallback'
      )
    ).toBe('Цю дію неможливо виконати для поточного статусу сесії.')
  })

  it('maps stable booking code values before falling back to detail parsing', () => {
    expect(
      getBookingErrorMessage(
        {
          response: {
            data: {
              code: 'OVER_LIMIT',
              detail: 'Action unavailable due to plan limits. Please review your plan in Billing.',
            },
          },
        },
        'fallback'
      )
    ).toBe('Дія недоступна через обмеження плану. Перевірте доступ у Billing.')
  })

  it('maps session format booking validation codes', () => {
    expect(
      getBookingErrorMessage(
        {
          response: {
            data: {
              code: 'SESSION_FORMAT_REQUIRED',
            },
          },
        },
        'fallback'
      )
    ).toBe('Оберіть формат сесії перед надсиланням запиту.')

    expect(
      getBookingErrorMessage(
        {
          response: {
            data: {
              code: 'SESSION_FORMAT_INVALID',
            },
          },
        },
        'fallback'
      )
    ).toBe('Обраний формат сесії недоступний для цього спеціаліста.')

    expect(
      getBookingErrorMessage(
        {
          response: {
            data: {
              code: 'SPECIALIST_PROFILE_INVALID',
            },
          },
        },
        'fallback'
      )
    ).toBe('Профіль спеціаліста налаштовано некоректно. Спробуйте інший слот або запишіться пізніше.')
  })

  it('keeps detail fallback for uncoded payloads', () => {
    expect(
      getBookingErrorMessage(
        {
          response: {
            data: {
              detail: 'Slot not found.',
            },
          },
        },
        'fallback'
      )
    ).toBe('Вільне вікно не знайдено.')
  })
})
