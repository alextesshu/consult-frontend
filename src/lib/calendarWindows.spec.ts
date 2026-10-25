import { describe, expect, it } from 'vitest'
import type { CabinetScheduleEvent } from './api'
import { buildCalendarItems, type CalendarSessionRow } from './calendarItems'
import { emptyDayLabel, groupFreeWindows, plural, slotsLabel } from './calendarWindows'

const KYIV = 'Europe/Kyiv'
const NOW = Date.parse('2026-10-26T06:00:00Z')
const RANGE = { start: Date.parse('2026-10-25T22:00:00Z'), end: Date.parse('2026-11-01T22:00:00Z') }
// Thursday 29 Oct 2026 is EET (UTC+2): local 09:00 = 07:00Z.
const local = (hour: number, minute = 0) => new Date(Date.UTC(2026, 9, 29, hour - 2, minute)).toISOString()

function slot(id: number, startHour: number, startMinute: number, minutes = 30): CabinetScheduleEvent {
  const start = local(startHour, startMinute)
  return {
    type: 'available_slot',
    id: `slot-${id}`,
    slot_id: id,
    session_id: null,
    start_at: start,
    end_at: new Date(Date.parse(start) + minutes * 60000).toISOString(),
    status: 'available',
    title: 'Вільний час',
    client_display_name: null,
    client_kind: null,
  }
}

const session = (id: number, hour: number): CalendarSessionRow => ({
  id,
  status: 'CONFIRMED',
  slot_start_at: local(hour),
  slot_end_at: new Date(Date.parse(local(hour)) + 60 * 60000).toISOString(),
  client_display_name: 'Ірина',
})

describe('groupFreeWindows', () => {
  it('turns 15 slots with a session in the middle and a gap into 3 windows, not one', () => {
    // 09:00–13:00: 8 × 30 min; session 13:00–14:00; 14:00–16:00: 4 slots; gap; 17:00–18:30: 3 slots.
    const slots = [
      ...Array.from({ length: 8 }, (_, i) => slot(100 + i, 9 + Math.floor(i / 2), (i % 2) * 30)),
      ...Array.from({ length: 4 }, (_, i) => slot(200 + i, 14 + Math.floor(i / 2), (i % 2) * 30)),
      ...Array.from({ length: 3 }, (_, i) => slot(300 + i, 17 + Math.floor(i / 2), (i % 2) * 30)),
    ]
    const items = buildCalendarItems({ schedule: slots, sessions: [session(1, 13)] }, RANGE, NOW)
    const windows = groupFreeWindows(items, KYIV)

    expect(windows.map((window) => window.slots.length)).toEqual([8, 4, 3])
    expect(windows.reduce((sum, window) => sum + window.slots.length, 0)).toBe(15)
    expect(windows.map((window) => [new Date(window.start).toISOString(), new Date(window.end).toISOString()])).toEqual([
      [local(9), local(13)],
      [local(14), local(16)],
      [local(17), local(18, 30)],
    ])
    expect(windows.every((window) => window.day === '2026-10-29')).toBe(true)
  })

  it('joins slots separated by the standard 10-minute buffer but not by longer gaps', () => {
    const items = buildCalendarItems(
      { schedule: [slot(1, 9, 0, 50), slot(2, 10, 0, 50), slot(3, 11, 0, 50), slot(4, 12, 20, 50)] },
      RANGE,
      NOW
    )
    expect(groupFreeWindows(items, KYIV).map((window) => window.slots.map((s) => s.sourceId))).toEqual([[1, 2, 3], [4]])
  })

  it('breaks a window on anything busy inside the gap, including a guest request', () => {
    const request: CabinetScheduleEvent = {
      ...slot(50, 10, 0, 50),
      type: 'booked_slot',
      id: 'pending-requests-slot-50',
      status: 'pending',
      requests_count: 1,
      request_ids: [7],
    }
    const items = buildCalendarItems({ schedule: [slot(1, 9, 0, 50), request, slot(2, 11, 0, 50)] }, RANGE, NOW)
    expect(groupFreeWindows(items, KYIV)).toHaveLength(2)
  })

  it('never joins slots across local midnight', () => {
    const late = slot(1, 23, 30)
    const next: CabinetScheduleEvent = { ...slot(2, 0, 0), start_at: '2026-10-29T22:00:00Z', end_at: '2026-10-29T22:30:00Z' }
    const items = buildCalendarItems({ schedule: [late, next] }, RANGE, NOW)
    expect(groupFreeWindows(items, KYIV).map((window) => window.day)).toEqual(['2026-10-29', '2026-10-30'])
  })

  it('pluralizes in Ukrainian', () => {
    expect(slotsLabel(1)).toBe('1 слот')
    expect(slotsLabel(3)).toBe('3 слоти')
    expect(slotsLabel(15)).toBe('15 слотів')
    expect(plural(21, 'вікно', 'вікна', 'вікон')).toBe('вікно')
    expect(plural(12, 'вікно', 'вікна', 'вікон')).toBe('вікон')
  })
})

describe('emptyDayLabel', () => {
  const busy = buildCalendarItems({ sessions: [session(1, 10)] }, RANGE, NOW)
  const cancelled = buildCalendarItems({ sessions: [{ ...session(2, 10), status: 'CANCELLED' }] }, RANGE, NOW)

  it('tells «no free slots», «busy but hidden» and «fully empty» apart', () => {
    expect(emptyDayLabel(busy, 0, 'availability')).toBe('Немає вільних слотів · є зайняті події')
    expect(emptyDayLabel(busy, 2, 'availability')).toBe('Є зайняті події — приховані у «Вигляді»')
    expect(emptyDayLabel(busy, 0, 'workday')).toBe('Є зайняті події — приховані у «Вигляді»')
    expect(emptyDayLabel([], 2, 'workday')).toBe('Сесій немає · є вільний час')
    expect(emptyDayLabel(cancelled, 0, 'availability')).toBe('Порожній день')
    expect(emptyDayLabel([], 0, 'workday')).toBe('Порожній день')
  })
})
