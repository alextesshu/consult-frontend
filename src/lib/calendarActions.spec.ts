import { describe, expect, it } from 'vitest'
import type { GuestBookingRequestRecord } from './api'
import { buildCalendarActions, pickNextAction, relativeLabel, splitActionsByWeek, type UpcomingSessionRow } from './calendarActions'

const KYIV = 'Europe/Kyiv'
// Monday 26 Oct 2026, 11:20 Kyiv (EET).
const NOW = Date.parse('2026-10-26T09:20:00Z')
const WEEK = { start: Date.parse('2026-10-25T22:00:00Z'), end: Date.parse('2026-11-01T22:00:00Z') }

const session = (id: number, status: string, start: string, extra: Partial<UpcomingSessionRow> = {}): UpcomingSessionRow => ({
  id,
  status,
  slot_start_at: start,
  slot_end_at: new Date(Date.parse(start) + 50 * 60000).toISOString(),
  client_display_name: `Клієнт ${id}`,
  session_format: 'online',
  meeting_link_ready: true,
  ...extra,
})
const guest = (id: number, start: string | null, status = 'PENDING') =>
  ({ id, status, requested_slot_start: start, guest_name: `Гість ${id}`, client_name: null }) as unknown as GuestBookingRequestRecord

describe('buildCalendarActions', () => {
  const actions = buildCalendarActions(
    {
      upcomingSessions: [
        session(1, 'SCHEDULED', '2026-10-28T10:00:00Z'),
        session(2, 'CONFIRMED', '2026-10-28T14:00:00Z', { meeting_link_ready: false }),
        session(3, 'CONFIRMED', '2026-10-30T09:00:00Z'),
        session(4, 'CONFIRMED', '2026-10-30T12:00:00Z', { session_format: 'offline', meeting_link_ready: false }),
        session(5, 'SCHEDULED', '2026-11-03T08:00:00Z'),
      ],
      rescheduleRequests: [
        { id: 70, session_id: 3, status: 'PENDING', requested_slot_start_at: '2026-11-02T08:00:00Z' },
        { id: 71, session_id: 3, status: 'DECLINED' },
      ],
      guestRequests: [guest(81, '2026-10-30T10:00:00Z'), guest(82, null), guest(83, '2026-10-29T10:00:00Z', 'DECLINED')],
    },
    KYIV
  )

  it('derives one action per reason from complete sources only', () => {
    expect(actions.map((action) => action.key)).toEqual([
      'confirm:1',
      'missing_link:2',
      'reschedule:70',
      'request:81',
      'confirm:5',
      'request:82',
    ])
    expect(actions.find((action) => action.key === 'reschedule:70')).toMatchObject({
      who: 'Клієнт 3',
      reason: 'просить перенести на Пн, 2 листопада · 10:00',
      href: '/cabinet/sessions/3',
      marker: '⇄ Перенесення',
    })
    expect(actions.find((action) => action.key === 'request:82')).toMatchObject({ when: null, reason: 'запит без обраного часу (гість)', href: '/cabinet/external-sessions#guest-requests' })
    expect(actions.every((action) => action.href.startsWith('/cabinet/'))).toBe(true)
  })

  it('splits the global set by the selected week so the parts add up to the total', () => {
    const { thisWeek, elsewhere } = splitActionsByWeek(actions, WEEK)
    expect(thisWeek.map((action) => action.key)).toEqual(['confirm:1', 'missing_link:2', 'reschedule:70', 'request:81'])
    expect(elsewhere.map((action) => action.key)).toEqual(['confirm:5', 'request:82'])
    expect(thisWeek.length + elsewhere.length).toBe(actions.length)

    const nextWeek = splitActionsByWeek(actions, { start: WEEK.end, end: WEEK.end + 7 * 86400000 })
    expect(nextWeek.thisWeek.map((action) => action.key)).toEqual(['confirm:5'])
    expect(nextWeek.thisWeek.length + nextWeek.elsewhere.length).toBe(actions.length)
  })

  it('picks the nearest future action first, then the nearest session, then a quiet card', () => {
    expect(pickNextAction({ actions, upcomingSessions: [], now: NOW, timeZone: KYIV })).toMatchObject({ kind: 'action', action: { key: 'confirm:1' } })

    const sessions = [session(9, 'CONFIRMED', '2026-10-26T12:00:00Z'), session(10, 'CONFIRMED', '2026-10-27T08:00:00Z')]
    expect(pickNextAction({ actions: [], upcomingSessions: sessions, now: NOW, timeZone: KYIV })).toMatchObject({ kind: 'session', today: true, session: { id: 9 } })
    expect(pickNextAction({ actions: [], upcomingSessions: [sessions[1]!], now: NOW, timeZone: KYIV })).toMatchObject({ kind: 'session', today: false })
    expect(pickNextAction({ actions: null, upcomingSessions: null, now: NOW, timeZone: KYIV })).toEqual({ kind: 'none' })
  })

  it('ignores actions without a time or in the past for the card', () => {
    const undated = buildCalendarActions({ upcomingSessions: [], rescheduleRequests: [], guestRequests: [guest(1, null), guest(2, '2026-10-20T10:00:00Z')] }, KYIV)
    expect(pickNextAction({ actions: undated, upcomingSessions: [], now: NOW, timeZone: KYIV })).toEqual({ kind: 'none' })
  })

  it('labels relative time («скоро» under 15 minutes)', () => {
    expect(relativeLabel(NOW + 10 * 60000, NOW)).toBe('скоро')
    expect(relativeLabel(NOW + 40 * 60000, NOW)).toBe('через 40 хв')
    expect(relativeLabel(NOW + 125 * 60000, NOW)).toBe('через 2 год 5 хв')
    expect(relativeLabel(NOW + 2 * 86400000, NOW)).toBe('')
  })
})
