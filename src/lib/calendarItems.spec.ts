import { describe, expect, it } from 'vitest'
import type { AvailabilityException, CabinetScheduleEvent, ExternalSessionRecord } from './api'
import {
  PRESET_LAYERS,
  buildCalendarItems,
  hiddenSummary,
  visibleItems,
  type CalendarSessionRow,
} from './calendarItems'

const NOW = Date.parse('2026-10-22T13:50:00Z')
const RANGE = { start: Date.parse('2026-10-18T21:00:00Z'), end: Date.parse('2026-10-25T22:00:00Z') }

function scheduleEvent(partial: Partial<CabinetScheduleEvent>): CabinetScheduleEvent {
  return {
    type: 'session',
    id: 'x',
    slot_id: null,
    session_id: null,
    start_at: '2026-10-23T07:00:00Z',
    end_at: '2026-10-23T07:50:00Z',
    title: 'Сесія',
    client_display_name: null,
    client_kind: null,
    ...partial,
  }
}

function session(partial: Partial<CalendarSessionRow> & { id: number }): CalendarSessionRow {
  return {
    status: 'CONFIRMED',
    slot_start_at: '2026-10-23T07:00:00Z',
    slot_end_at: '2026-10-23T07:50:00Z',
    client_display_name: 'Ірина Ткаченко',
    client_has_account: true,
    has_note: null,
    ...partial,
  }
}

function absence(partial: Partial<AvailabilityException> & { id: number }): AvailabilityException {
  return {
    specialist_id: 1,
    starts_at: '2026-10-24T21:00:00Z',
    ends_at: '2026-10-25T22:00:00Z',
    is_all_day: true,
    note: '',
    is_active: true,
    created_at: '',
    updated_at: '',
    ...partial,
  }
}

function external(partial: Partial<ExternalSessionRecord> & { id: number }): ExternalSessionRecord {
  return {
    starts_at: '2026-10-23T07:30:00Z',
    ends_at: null,
    duration_minutes: 50,
    session_format: 'online',
    meeting_url: null,
    offline_location_snapshot: null,
    guest_name: 'Гість Г.',
    guest_email: null,
    status: 'SCHEDULED',
    cancelled_at: null,
    created_at: null,
    updated_at: null,
    ...partial,
  } as ExternalSessionRecord
}

const byKey = (items: ReturnType<typeof buildCalendarItems>) => new Map(items.map((item) => [item.key, item]))

describe('buildCalendarItems', () => {
  it('deduplicates a session present in both APIs and keeps the richer list row', () => {
    const items = buildCalendarItems(
      {
        schedule: [scheduleEvent({ type: 'booked_slot', session_id: 11, slot_id: 5, client_display_name: 'Old name', client_kind: 'registered' })],
        sessions: [session({ id: 11, client_has_account: false })],
      },
      RANGE,
      NOW
    )
    expect(items).toHaveLength(1)
    expect(items[0]).toMatchObject({
      key: 'session:11',
      kind: 'session',
      sourceId: 11,
      title: 'Ірина Ткаченко',
      guest: true,
      layer: 'sessions',
      statusLabel: 'Підтверджено',
      href: '/cabinet/sessions/11',
    })
  })

  it('keeps a session only known to the schedule and marks guests by client_kind', () => {
    const items = buildCalendarItems(
      { schedule: [scheduleEvent({ session_id: 12, client_display_name: 'Ганна С.', client_kind: 'guest', status: 'SCHEDULED' })], sessions: [] },
      RANGE,
      NOW
    )
    expect(items[0]).toMatchObject({ key: 'session:12', guest: true, status: 'SCHEDULED', needsAction: true })
    expect(items[0]?.actionReasons).toContain('Потрібне ваше підтвердження')
  })

  it('maps terminal and past sessions to the past layer with honest labels', () => {
    const items = byKey(
      buildCalendarItems(
        {
          sessions: [
            session({ id: 1, status: 'CANCELLED' }),
            session({ id: 2, status: 'NO_SHOW', slot_start_at: '2026-10-20T07:00:00Z', slot_end_at: '2026-10-20T07:50:00Z' }),
            session({ id: 3, status: 'COMPLETED', has_note: false, slot_start_at: '2026-10-21T07:00:00Z', slot_end_at: '2026-10-21T07:50:00Z' }),
            session({ id: 4, status: 'COMPLETED', has_note: null, slot_start_at: '2026-10-21T09:00:00Z', slot_end_at: '2026-10-21T09:50:00Z' }),
            session({ id: 5, status: 'CONFIRMED', slot_start_at: '2026-10-21T11:00:00Z', slot_end_at: '2026-10-21T11:50:00Z' }),
          ],
        },
        RANGE,
        NOW
      )
    )
    expect(items.get('session:1')).toMatchObject({ layer: 'past', statusLabel: 'Скасовано', needsAction: false })
    expect(items.get('session:2')).toMatchObject({ layer: 'past', statusLabel: 'Не підтверджено вчасно' })
    expect(items.get('session:3')).toMatchObject({ layer: 'past', needsAction: true, actionReasons: ['Без нотатки'] })
    expect(items.get('session:4')).toMatchObject({ needsAction: false })
    expect(items.get('session:5')).toMatchObject({ layer: 'past', statusLabel: 'Підтверджено' })
  })

  it('keeps free slots and pending guest requests as their own kinds, never as sessions', () => {
    const items = byKey(
      buildCalendarItems(
        {
          schedule: [
            scheduleEvent({ type: 'available_slot', slot_id: 21, status: 'available' }),
            scheduleEvent({ type: 'booked_slot', slot_id: 22, status: 'pending', requests_count: 2, request_ids: [301, 302] }),
          ],
        },
        RANGE,
        NOW
      )
    )
    expect(items.get('free_slot:21')).toMatchObject({ kind: 'free_slot', sourceId: 21, layer: 'free_slots', href: '/cabinet/slots?tab=availability' })
    expect(items.get('guest_request:slot-22')).toMatchObject({
      kind: 'guest_request',
      sourceId: 22,
      requestIds: [301, 302],
      needsAction: true,
      href: '/cabinet/external-sessions#guest-requests',
    })
    expect([...items.keys()].some((key) => key.startsWith('session:'))).toBe(false)
  })

  it('attaches only pending reschedule requests to their session', () => {
    const items = byKey(
      buildCalendarItems(
        {
          sessions: [session({ id: 7 })],
          rescheduleRequests: [
            { id: 70, session_id: 7, status: 'PENDING' },
            { id: 71, session_id: 7, status: 'DECLINED' },
            { id: 72, session_id: 999, status: 'PENDING' },
          ],
        },
        RANGE,
        NOW
      )
    )
    expect(items.get('session:7')).toMatchObject({ rescheduleRequestIds: [70], needsAction: true })
    expect(items.size).toBe(1)
  })

  it('normalizes absences and external guest sessions without inventing data', () => {
    const items = byKey(
      buildCalendarItems(
        {
          absences: [absence({ id: 4 }), absence({ id: 5, is_active: false })],
          externalSessions: [external({ id: 9 }), external({ id: 10, status: 'CANCELLED', starts_at: '2026-10-22T07:00:00Z' })],
        },
        RANGE,
        NOW
      )
    )
    expect(items.get('absence:4')).toMatchObject({ kind: 'absence', allDay: true, layer: 'absences' })
    expect(items.has('absence:5')).toBe(false)
    const ext = items.get('external_guest_session:9')
    expect(ext).toMatchObject({ kind: 'external_guest_session', layer: 'external_guest_sessions', href: '/cabinet/external-sessions/9' })
    expect(ext!.end - ext!.start).toBe(50 * 60000)
    expect(items.get('external_guest_session:10')).toMatchObject({ statusLabel: 'Скасовано' })
  })

  it('drops items outside the requested range', () => {
    const items = buildCalendarItems({ sessions: [session({ id: 1, slot_start_at: '2026-11-02T07:00:00Z', slot_end_at: '2026-11-02T07:50:00Z' })] }, RANGE, NOW)
    expect(items).toEqual([])
  })
})

describe('conflict indicators', () => {
  it('flags external guest overlaps, slots and sessions during absences and session overlaps', () => {
    const items = byKey(
      buildCalendarItems(
        {
          sessions: [
            session({ id: 1 }),
            session({ id: 2, slot_start_at: '2026-10-23T07:30:00Z', slot_end_at: '2026-10-23T08:20:00Z' }),
            session({ id: 3, status: 'CANCELLED' }),
            session({ id: 4, slot_start_at: '2026-10-25T07:00:00Z', slot_end_at: '2026-10-25T07:50:00Z' }),
          ],
          schedule: [scheduleEvent({ type: 'available_slot', slot_id: 30, start_at: '2026-10-25T09:00:00Z', end_at: '2026-10-25T09:50:00Z' })],
          absences: [absence({ id: 8 })],
          externalSessions: [external({ id: 9 }), external({ id: 10, status: 'CANCELLED' })],
        },
        RANGE,
        NOW
      )
    )
    expect(items.get('session:1')?.conflicts).toEqual(expect.arrayContaining(['external_overlap', 'session_overlap']))
    expect(items.get('session:2')?.conflicts).toEqual(expect.arrayContaining(['external_overlap', 'session_overlap']))
    expect(items.get('session:3')?.conflicts).toEqual([])
    expect(items.get('session:4')?.conflicts).toEqual(['session_during_absence'])
    expect(items.get('free_slot:30')?.conflicts).toEqual(['slot_during_absence'])
    expect(items.get('external_guest_session:9')?.conflicts).toEqual(['external_overlap'])
    expect(items.get('external_guest_session:10')?.conflicts).toEqual([])
  })
})

describe('visibility layers and presets', () => {
  const items = buildCalendarItems(
    {
      sessions: [session({ id: 1 }), session({ id: 2, status: 'CANCELLED' })],
      schedule: [
        scheduleEvent({ type: 'available_slot', slot_id: 21 }),
        scheduleEvent({ type: 'booked_slot', slot_id: 22, requests_count: 1, request_ids: [301] }),
      ],
      externalSessions: [external({ id: 9 })],
    },
    RANGE,
    NOW
  )

  it('mirrors the UC-00 preset collections', () => {
    expect(PRESET_LAYERS.all.external_guest_sessions).toBe(false)
    expect(PRESET_LAYERS.workday).toMatchObject({ free_slots: false, guest_requests: true })
    expect(PRESET_LAYERS.availability).toMatchObject({ past: false, free_slots: true })
    expect(PRESET_LAYERS.needs_action).toMatchObject({ free_slots: false, absences: false })
  })

  it('filters by layer and needs-action without removing anything from the feed', () => {
    expect(visibleItems(items, PRESET_LAYERS.all).map((item) => item.key)).not.toContain('external_guest_session:9')
    expect(visibleItems(items, PRESET_LAYERS.workday).map((item) => item.kind)).not.toContain('free_slot')
    expect(visibleItems(items, PRESET_LAYERS.needs_action, { needsActionOnly: true }).map((item) => item.key)).toEqual(['guest_request:slot-22'])
    expect(items).toHaveLength(5)
  })

  it('summarizes hidden layers and counts hidden items that need action', () => {
    const layers = { ...PRESET_LAYERS.all, guest_requests: false }
    expect(hiddenSummary(items, layers)).toEqual([
      { layer: 'guest_requests', total: 1, needsAction: 1 },
      { layer: 'external_guest_sessions', total: 1, needsAction: 0 },
    ])
  })
})

describe('status markers (CALENDAR_3A_SPEC §6)', () => {
  it('writes the state out as one text marker per item', () => {
    const items = byKey(
      buildCalendarItems(
        {
          sessions: [
            session({ id: 1, status: 'SCHEDULED' }),
            session({ id: 2, slot_start_at: '2026-10-24T07:00:00Z', slot_end_at: '2026-10-24T07:50:00Z', session_format: 'online', meeting_link_ready: false }),
            session({ id: 3, status: 'NO_SHOW', slot_start_at: '2026-10-20T07:00:00Z', slot_end_at: '2026-10-20T07:50:00Z' }),
            session({ id: 4, status: 'COMPLETED', has_note: false, slot_start_at: '2026-10-21T07:00:00Z', slot_end_at: '2026-10-21T07:50:00Z' }),
            session({ id: 5, slot_start_at: '2026-10-24T10:00:00Z', slot_end_at: '2026-10-24T10:50:00Z', session_format: 'offline', meeting_link_ready: false }),
            session({ id: 6, slot_start_at: '2026-10-25T10:00:00Z', slot_end_at: '2026-10-25T10:50:00Z' }),
          ],
          rescheduleRequests: [{ id: 60, session_id: 6, status: 'PENDING' }],
          schedule: [scheduleEvent({ type: 'booked_slot', slot_id: 22, requests_count: 1, request_ids: [301] })],
          externalSessions: [external({ id: 9, starts_at: '2026-10-23T07:30:00Z' })],
        },
        RANGE,
        NOW
      )
    )
    expect(items.get('session:1')?.marker).toBe('? Підтвердити')
    expect(items.get('session:2')).toMatchObject({ marker: '! Посилання', missingLink: true, needsAction: true })
    expect(items.get('session:3')?.marker).toBe('Не підтв. вчасно')
    expect(items.get('session:4')?.marker).toBe('✎ Нотатки')
    expect(items.get('session:5')).toMatchObject({ marker: null, missingLink: false })
    expect(items.get('session:6')?.marker).toBe('⇄ Перенесення')
    expect(items.get('guest_request:slot-22')?.marker).toBe('Запит')
    expect(items.get('external_guest_session:9')?.marker).toBe('Зовнішня · перетин')
  })
})
