import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { BOOKING_UI_MESSAGES } from './bookingCopy'
import {
  approveSpecialistRescheduleRequest,
  canShowRecurringAction,
  cancelSpecialistSession,
  completeSpecialistSession,
  confirmSpecialistSession,
  createRecurringSpecialistSessions,
  declineSpecialistRescheduleRequest,
  findNextUpcomingSession,
  fetchSpecialistAvailableSlots,
  fetchSpecialistRescheduleRequests,
  fetchSpecialistRescheduleSuggestions,
  fetchSpecialistSessionNoteContent,
  formatSessionDuration,
  parseActualDurationInput,
  parseRecurringOccurrences,
  rescheduleSpecialistSession,
  saveSpecialistSessionNote,
  sessionDurationMinutes,
  sessionEndAt,
  sessionStartAt,
  statusClass,
  statusLabel,
  suggestedActualDurationInput,
  timeUntilLabel,
} from './specialistSessions'
import { apiGet, apiPatch, apiPost, apiPut } from './api'

vi.mock('./api', () => ({
  apiGet: vi.fn(),
  apiPatch: vi.fn(),
  apiPost: vi.fn(),
  apiPut: vi.fn(),
}))

const mockedApiGet = vi.mocked(apiGet)
const mockedApiPatch = vi.mocked(apiPatch)
const mockedApiPost = vi.mocked(apiPost)
const mockedApiPut = vi.mocked(apiPut)

describe('specialistSessions helpers', () => {
  beforeEach(() => {
    mockedApiGet.mockReset()
    mockedApiPatch.mockReset()
    mockedApiPost.mockReset()
    mockedApiPut.mockReset()
  })

  describe('sessionStartAt and sessionEndAt', () => {
    it('prefers nested slot values and falls back to flat fields', () => {
      expect(
        sessionStartAt({
          slot: {
            start_at: '2099-06-15T10:00:00Z',
          },
          slot_start_at: '2099-06-15T09:00:00Z',
        })
      ).toBe('2099-06-15T10:00:00Z')

      expect(
        sessionEndAt({
          slot: {
            end_at: null,
          },
          slot_end_at: '2099-06-15T10:50:00Z',
        })
      ).toBe('2099-06-15T10:50:00Z')
    })
  })

  describe('formatSessionDuration', () => {
    it('formats minute-only, mixed hour/minute, and empty durations', () => {
      expect(formatSessionDuration('2099-06-15T10:00:00Z', '2099-06-15T10:50:00Z')).toBe('50 хв')
      expect(formatSessionDuration('2099-06-15T10:00:00Z', '2099-06-15T11:15:00Z')).toBe('1 год 15 хв')
      expect(
        formatSessionDuration('2099-06-15T10:00:00Z', '2099-06-15T10:00:00Z', {
          prefix: '~',
        })
      ).toBe('~0 хв')
      expect(formatSessionDuration(undefined, '2099-06-15T10:00:00Z')).toBe('—')
    })
  })

  describe('parseActualDurationInput', () => {
    it('returns empty payload for blank input, rounds valid minutes, and rejects out-of-range values', () => {
      expect(parseActualDurationInput('   ')).toEqual({
        payload: undefined,
        error: '',
      })

      expect(parseActualDurationInput('50.6')).toEqual({
        payload: {
          actual_duration_minutes: 51,
        },
        error: '',
      })

      expect(parseActualDurationInput('0')).toEqual({
        payload: undefined,
        error: BOOKING_UI_MESSAGES.invalidDuration,
      })
    })
  })

  describe('completion continuity helpers', () => {
    it('suggests duration from session window and finds the next upcoming session', () => {
      expect(
        sessionDurationMinutes({
          slot_start_at: '2099-06-15T10:00:00Z',
          slot_end_at: '2099-06-15T10:50:00Z',
        })
      ).toBe(50)

      expect(
        suggestedActualDurationInput({
          slot_start_at: '2099-06-15T10:00:00Z',
          slot_end_at: '2099-06-15T10:50:00Z',
        })
      ).toBe('50')

      expect(
        findNextUpcomingSession(
          [
            {
              id: 40,
              status: 'CONFIRMED',
              slot_start_at: '2099-06-15T10:00:00Z',
            },
            {
              id: 41,
              status: 'SCHEDULED',
              slot_start_at: '2099-06-16T10:00:00Z',
            },
            {
              id: 42,
              status: 'COMPLETED',
              slot_start_at: '2099-06-14T10:00:00Z',
            },
          ],
          {
            excludeSessionId: 40,
            nowTs: new Date('2099-06-15T10:00:00Z').getTime(),
          }
        )
      ).toEqual({
        id: 41,
        status: 'SCHEDULED',
        slot_start_at: '2099-06-16T10:00:00Z',
      })
    })
  })

  describe('parseRecurringOccurrences', () => {
    it('accepts preset values and validates custom occurrences', () => {
      expect(parseRecurringOccurrences(4, '')).toBe(4)
      expect(parseRecurringOccurrences('custom', 7)).toBe(7)
      expect(parseRecurringOccurrences('custom', 0)).toBeNull()
      expect(parseRecurringOccurrences('custom', 53)).toBeNull()
    })
  })

  describe('time-sensitive helpers', () => {
    beforeEach(() => {
      vi.useFakeTimers()
      vi.setSystemTime(new Date('2099-06-15T10:00:00Z'))
    })

    afterEach(() => {
      vi.useRealTimers()
    })

    it('returns countdown labels only inside the two-hour window', () => {
      expect(
        timeUntilLabel({
          slot_start_at: '2099-06-15T10:45:00Z',
        })
      ).toBe('45 хв')

      expect(
        timeUntilLabel({
          slot_start_at: '2099-06-15T11:30:00Z',
        })
      ).toBe('1 год 30 хв')

      expect(
        timeUntilLabel({
          slot_start_at: '2099-06-15T12:05:00Z',
        })
      ).toBe('')
    })

    it('maps in-progress status and recurring visibility from shared rules', () => {
      const activeConfirmedSession = {
        status: 'CONFIRMED',
        slot_start_at: '2099-06-15T09:30:00Z',
        slot_end_at: '2099-06-15T10:30:00Z',
      }

      expect(statusLabel(activeConfirmedSession)).toBe('В процесі')
      expect(statusClass(activeConfirmedSession)).toBe('status-pill--ok')

      expect(
        canShowRecurringAction({
          status: 'CONFIRMED',
          slot_start_at: '2099-06-16T10:00:00Z',
        })
      ).toBe(true)

      expect(
        canShowRecurringAction(
          {
            status: 'CONFIRMED',
            slot_start_at: '2099-06-16T09:59:59Z',
          },
          false
        )
      ).toBe(false)

      expect(
        canShowRecurringAction(
          {
            status: 'CONFIRMED',
            slot_start_at: '2099-06-17T10:00:00Z',
          },
          true
        )
      ).toBe(false)
    })
  })

  describe('API wrappers', () => {
    it('filters available slots to future unbooked items', async () => {
      vi.useFakeTimers()
      vi.setSystemTime(new Date('2099-06-15T10:00:00Z'))
      mockedApiGet.mockResolvedValue([
        {
          id: 1,
          start_at: '2099-06-15T11:00:00Z',
          end_at: '2099-06-15T11:50:00Z',
          is_booked: false,
        },
        {
          id: 2,
          start_at: '2099-06-15T12:00:00Z',
          end_at: '2099-06-15T12:50:00Z',
          is_booked: true,
        },
        {
          id: 3,
          start_at: '2099-06-15T09:00:00Z',
          end_at: '2099-06-15T09:50:00Z',
          is_booked: false,
        },
        {
          id: 4,
          start_at: 'invalid',
          end_at: '2099-06-15T13:50:00Z',
          is_booked: false,
        },
      ])

      try {
        await expect(fetchSpecialistAvailableSlots()).resolves.toEqual([
          {
            id: 1,
            start_at: '2099-06-15T11:00:00Z',
            end_at: '2099-06-15T11:50:00Z',
            is_booked: false,
          },
        ])
        expect(mockedApiGet).toHaveBeenCalledWith('/cabinet/slots/')
      } finally {
        vi.useRealTimers()
      }
    })

    it('returns empty collections for missing suggestion/request payloads', async () => {
      mockedApiGet
        .mockResolvedValueOnce({})
        .mockResolvedValueOnce(undefined)

      await expect(fetchSpecialistRescheduleSuggestions(42)).resolves.toEqual([])
      await expect(fetchSpecialistRescheduleRequests()).resolves.toEqual([])

      expect(mockedApiGet).toHaveBeenNthCalledWith(1, '/booking/sessions/42/reschedule-suggestions/')
      expect(mockedApiGet).toHaveBeenNthCalledWith(2, '/cabinet/sessions/reschedule-requests/')
    })

    it('returns empty note content for 404 and rethrows other note errors', async () => {
      mockedApiGet
        .mockRejectedValueOnce({
          response: {
            status: 404,
          },
        })
        .mockRejectedValueOnce(new Error('boom'))

      await expect(fetchSpecialistSessionNoteContent(77)).resolves.toBe('')
      await expect(fetchSpecialistSessionNoteContent(78)).rejects.toThrow('boom')

      expect(mockedApiGet).toHaveBeenNthCalledWith(1, '/cabinet/sessions/77/note/')
      expect(mockedApiGet).toHaveBeenNthCalledWith(2, '/cabinet/sessions/78/note/')
    })

    it('sends expected endpoints and payloads for note and session mutations', async () => {
      mockedApiPut.mockResolvedValue({ ok: true })
      mockedApiPatch.mockResolvedValue({ ok: true })
      mockedApiPost.mockResolvedValue({
        created_count: 2,
        skipped_count: 0,
        created_dates: [],
        skipped_reasons: [],
        skipped: [],
      })

      await saveSpecialistSessionNote(15, 'Updated note')
      await confirmSpecialistSession(15)
      await completeSpecialistSession(15, { actual_duration_minutes: 55 })
      await cancelSpecialistSession(15)
      await rescheduleSpecialistSession(15, 501)
      await createRecurringSpecialistSessions(15, 4)
      await approveSpecialistRescheduleRequest(71)
      await declineSpecialistRescheduleRequest(72)

      expect(mockedApiPut).toHaveBeenCalledWith('/cabinet/sessions/15/note/', {
        content: 'Updated note',
      })
      expect(mockedApiPatch).toHaveBeenNthCalledWith(1, '/booking/sessions/15/confirm/')
      expect(mockedApiPatch).toHaveBeenNthCalledWith(2, '/booking/sessions/15/complete/', {
        actual_duration_minutes: 55,
      })
      expect(mockedApiPatch).toHaveBeenNthCalledWith(3, '/booking/sessions/15/cancel/')
      expect(mockedApiPatch).toHaveBeenNthCalledWith(4, '/booking/sessions/15/reschedule/', {
        slot_id: 501,
      })
      expect(mockedApiPatch).toHaveBeenNthCalledWith(
        5,
        '/cabinet/sessions/reschedule-requests/71/approve/'
      )
      expect(mockedApiPatch).toHaveBeenNthCalledWith(
        6,
        '/cabinet/sessions/reschedule-requests/72/decline/'
      )
      expect(mockedApiPost).toHaveBeenCalledWith('/booking/sessions/15/create-recurring/', {
        frequency: 'weekly',
        occurrences: 4,
      })
    })
  })
})
