import type { AvailabilityException, CabinetScheduleEvent, ExternalSessionRecord } from './api'

// Unified calendar read model (UC-01). Pure functions: API rows in, CalendarItem[] out.
// Every item keeps its source identity (kind + source id); ids of different models are
// never mixed, and nothing is invented when a source has no data.

export type CalendarItemKind = 'session' | 'free_slot' | 'guest_request' | 'absence' | 'external_guest_session'

export const CALENDAR_LAYERS = [
  'sessions',
  'past',
  'free_slots',
  'guest_requests',
  'absences',
  'external_guest_sessions',
] as const
export type CalendarLayer = (typeof CALENDAR_LAYERS)[number]
export type CalendarLayers = Record<CalendarLayer, boolean>

export const CALENDAR_LAYER_LABELS: Record<CalendarLayer, string> = {
  sessions: 'Заплановані сесії',
  past: 'Минулі сесії',
  free_slots: 'Вільні вікна',
  guest_requests: 'Заявки на час',
  absences: 'Відсутності',
  external_guest_sessions: 'Зовнішні гостьові сесії',
}

// Same vocabulary and preset collections as the UC-00 preferences contract.
export const CALENDAR_PRESETS = ['all', 'workday', 'availability', 'needs_action'] as const
export type CalendarSelectablePreset = (typeof CALENDAR_PRESETS)[number]
export type CalendarPreset = CalendarSelectablePreset | 'custom'
export type CalendarView = 'week' | 'day' | 'list'

export const CALENDAR_PRESET_LABELS: Record<CalendarSelectablePreset, string> = {
  all: 'Усе',
  workday: 'Робочий день',
  availability: 'Доступність',
  needs_action: 'Потребує дії',
}

export const PRESET_LAYERS: Record<CalendarSelectablePreset, CalendarLayers> = {
  all: { sessions: true, past: true, free_slots: true, guest_requests: true, absences: true, external_guest_sessions: false },
  workday: { sessions: true, past: true, free_slots: false, guest_requests: true, absences: true, external_guest_sessions: false },
  availability: { sessions: true, past: false, free_slots: true, guest_requests: true, absences: true, external_guest_sessions: false },
  needs_action: { sessions: true, past: true, free_slots: false, guest_requests: true, absences: false, external_guest_sessions: false },
}
export const PRESET_VIEW: Partial<Record<CalendarSelectablePreset, CalendarView>> = { needs_action: 'list' }

/** Session list row (`GET /booking/sessions/`): only the fields the calendar reads. */
export type CalendarSessionRow = {
  id: number
  status: string
  slot_start_at: string | null
  slot_end_at: string | null
  client_display_name?: string | null
  client_name?: string | null
  client_username?: string | null
  client_has_account?: boolean | null
  client_record_id?: number | null
  session_format?: string | null
  has_note?: boolean | null
  payment_badge_state?: 'paid' | 'awaiting_confirmation' | 'unpaid' | null
}

export type CalendarRescheduleRequestRow = {
  id: number
  session_id: number
  status: string
  requested_slot_start_at?: string | null
}

export type CalendarConflict = 'external_overlap' | 'slot_during_absence' | 'session_during_absence' | 'session_overlap'

export const CALENDAR_CONFLICT_LABELS: Record<CalendarConflict, string> = {
  external_overlap: 'Перетинається із зовнішньою гостьовою сесією — система це не блокує',
  slot_during_absence: 'Вікно під час відсутності — клієнти все ще можуть його обрати',
  session_during_absence: 'Сесія під час відсутності',
  session_overlap: 'Перетинається з іншою сесією',
}

export type CalendarItem = {
  key: string
  kind: CalendarItemKind
  sourceId: number
  layer: CalendarLayer
  start: number
  end: number
  status: string
  statusLabel: string
  title: string
  guest: boolean
  allDay: boolean
  needsAction: boolean
  actionReasons: string[]
  rescheduleRequestIds: number[]
  requestIds: number[]
  conflicts: CalendarConflict[]
  /** Navigation only. Sessions open their existing detail page. */
  href: string | null
}

export const SESSION_STATUS_LABELS: Record<string, string> = {
  DRAFT: 'Чернетка',
  SCHEDULED: 'Чекає підтвердження',
  CONFIRMED: 'Підтверджено',
  COMPLETED: 'Завершено',
  CANCELLED: 'Скасовано',
  // Assigned by the time-based reconcile job; not proof that the client did not come.
  NO_SHOW: 'Не підтверджено вчасно',
}

const ACTIVE_SESSION_STATUSES = new Set(['SCHEDULED', 'CONFIRMED'])

function toMs(value: string | null | undefined) {
  if (!value) return null
  const ms = Date.parse(value)
  return Number.isFinite(ms) ? ms : null
}

function baseItem(partial: Omit<CalendarItem, 'needsAction' | 'actionReasons' | 'rescheduleRequestIds' | 'requestIds' | 'conflicts' | 'guest' | 'allDay' | 'href'> & Partial<CalendarItem>): CalendarItem {
  return {
    guest: false,
    allDay: false,
    needsAction: false,
    actionReasons: [],
    rescheduleRequestIds: [],
    requestIds: [],
    conflicts: [],
    href: null,
    ...partial,
  }
}

function sessionClientName(row: CalendarSessionRow, fallback: string | null) {
  return (row.client_display_name || row.client_name || fallback || row.client_username || 'Клієнт').trim()
}

type ScheduleSessionHint = { client: string | null; guest: boolean; start: number; end: number; status?: string }

function sessionItem(row: CalendarSessionRow | null, id: number, hint: ScheduleSessionHint | null, now: number): CalendarItem | null {
  const start = toMs(row?.slot_start_at) ?? hint?.start ?? null
  const end = toMs(row?.slot_end_at) ?? hint?.end ?? null
  if (start === null || end === null) return null
  const status = row?.status || hint?.status || ''
  const active = ACTIVE_SESSION_STATUSES.has(status)
  const guest = row ? row.client_has_account === false : Boolean(hint?.guest)
  const item = baseItem({
    key: `session:${id}`,
    kind: 'session',
    sourceId: id,
    layer: active && end > now ? 'sessions' : 'past',
    start,
    end,
    status,
    statusLabel: SESSION_STATUS_LABELS[status] || status || 'Сесія',
    title: row ? sessionClientName(row, hint?.client ?? null) : hint?.client || 'Клієнт',
    guest,
    href: `/cabinet/sessions/${id}`,
  })
  if (status === 'SCHEDULED' && start > now) item.actionReasons.push('Потрібне ваше підтвердження')
  if (status === 'COMPLETED' && row?.has_note === false) item.actionReasons.push('Без нотатки')
  return item
}

export type CalendarSources = {
  schedule: CabinetScheduleEvent[]
  sessions: CalendarSessionRow[]
  rescheduleRequests: CalendarRescheduleRequestRow[]
  absences: AvailabilityException[]
  externalSessions: ExternalSessionRecord[]
}

/** Normalizes all sources; drops nothing that falls inside [rangeStart, rangeEnd). */
export function buildCalendarItems(sources: Partial<CalendarSources>, range: { start: number; end: number }, now: number): CalendarItem[] {
  const items = new Map<string, CalendarItem>()
  const overlapsRange = (item: CalendarItem) => item.start < range.end && item.end > range.start
  const put = (item: CalendarItem | null) => {
    if (item && overlapsRange(item)) items.set(item.key, item)
  }

  // Sessions: /booking/sessions/ is the richer source; /cabinet/schedule/ adds client_kind
  // and covers sessions the list did not return. One `session:{id}` per session.
  const scheduleHints = new Map<number, ScheduleSessionHint>()
  for (const event of sources.schedule || []) {
    const start = toMs(event.start_at)
    const end = toMs(event.end_at)
    if (start === null || end === null) continue
    if (event.session_id) {
      scheduleHints.set(event.session_id, {
        client: event.client_display_name,
        guest: event.client_kind === 'guest',
        start,
        end,
        status: event.status,
      })
    } else if (event.type === 'available_slot' && event.slot_id) {
      put(
        baseItem({
          key: `free_slot:${event.slot_id}`,
          kind: 'free_slot',
          sourceId: event.slot_id,
          layer: 'free_slots',
          start,
          end,
          status: 'available',
          statusLabel: 'Вільне вікно',
          title: 'Вільне вікно',
          href: '/cabinet/slots?tab=availability',
        })
      )
    } else if (event.type === 'booked_slot' && event.slot_id) {
      // Pending public guest requests grouped by slot by the backend: still requests, not sessions.
      const requestIds = (event.request_ids || []).filter((value) => Number.isInteger(value))
      const count = event.requests_count ?? requestIds.length
      put(
        baseItem({
          key: `guest_request:slot-${event.slot_id}`,
          kind: 'guest_request',
          sourceId: event.slot_id,
          layer: 'guest_requests',
          start,
          end,
          status: 'pending',
          statusLabel: count > 1 ? `Заявки на час · ${count}` : 'Заявка на час',
          title: count > 1 ? `${count} заявки на цей час` : 'Заявка на цей час',
          requestIds,
          needsAction: true,
          actionReasons: ['Заявка чекає на розгляд'],
          href: '/cabinet/external-sessions#guest-requests',
        })
      )
    }
  }
  const sessionRows = new Map<number, CalendarSessionRow>()
  for (const row of sources.sessions || []) sessionRows.set(row.id, row)
  for (const id of new Set([...sessionRows.keys(), ...scheduleHints.keys()])) {
    put(sessionItem(sessionRows.get(id) ?? null, id, scheduleHints.get(id) ?? null, now))
  }

  for (const request of sources.rescheduleRequests || []) {
    if (request.status !== 'PENDING') continue
    const session = items.get(`session:${request.session_id}`)
    if (!session) continue
    session.rescheduleRequestIds.push(request.id)
    session.actionReasons.push('Клієнт просить перенести')
  }

  for (const absence of sources.absences || []) {
    if (!absence.is_active) continue
    const start = toMs(absence.starts_at)
    const end = toMs(absence.ends_at)
    if (start === null || end === null) continue
    put(
      baseItem({
        key: `absence:${absence.id}`,
        kind: 'absence',
        sourceId: absence.id,
        layer: 'absences',
        start,
        end,
        status: 'active',
        statusLabel: 'Відсутність',
        title: absence.note?.trim() || 'Відсутність',
        allDay: absence.is_all_day,
        href: '/cabinet/availability-exceptions',
      })
    )
  }

  for (const external of sources.externalSessions || []) {
    const start = toMs(external.starts_at)
    if (start === null) continue
    const end = toMs(external.ends_at) ?? start + (external.duration_minutes || 0) * 60000
    if (end <= start) continue
    const cancelled = external.status === 'CANCELLED'
    put(
      baseItem({
        key: `external_guest_session:${external.id}`,
        kind: 'external_guest_session',
        sourceId: external.id,
        layer: 'external_guest_sessions',
        start,
        end,
        status: external.status,
        statusLabel: cancelled ? 'Скасовано' : 'Зовнішня гостьова сесія',
        title: external.guest_name?.trim() || 'Гість',
        guest: true,
        href: `/cabinet/external-sessions/${external.id}`,
      })
    )
  }

  const result = [...items.values()]
  markConflicts(result)
  for (const item of result) item.needsAction = item.actionReasons.length > 0
  return result.sort((a, b) => a.start - b.start || a.end - b.end || a.key.localeCompare(b.key))
}

function overlaps(a: CalendarItem, b: CalendarItem) {
  return a.start < b.end && b.start < a.end
}

function addConflict(item: CalendarItem, conflict: CalendarConflict) {
  if (!item.conflicts.includes(conflict)) item.conflicts.push(conflict)
}

/** Conservative, display-only warnings; the backend remains the source of truth. */
export function markConflicts(items: CalendarItem[]) {
  const activeSessions = items.filter((item) => item.kind === 'session' && ACTIVE_SESSION_STATUSES.has(item.status))
  const freeSlots = items.filter((item) => item.kind === 'free_slot')
  const absences = items.filter((item) => item.kind === 'absence')
  const externals = items.filter((item) => item.kind === 'external_guest_session' && item.status !== 'CANCELLED')

  for (const external of externals) {
    for (const other of [...activeSessions, ...freeSlots]) {
      if (!overlaps(external, other)) continue
      addConflict(external, 'external_overlap')
      addConflict(other, 'external_overlap')
    }
  }
  for (const absence of absences) {
    for (const slot of freeSlots) if (overlaps(absence, slot)) addConflict(slot, 'slot_during_absence')
    for (const session of activeSessions) if (overlaps(absence, session)) addConflict(session, 'session_during_absence')
  }
  activeSessions.forEach((first, index) => {
    for (const second of activeSessions.slice(index + 1)) {
      if (!overlaps(first, second)) continue
      addConflict(first, 'session_overlap')
      addConflict(second, 'session_overlap')
    }
  })
}

/** Visibility filter. It never removes items from the feed itself. */
export function visibleItems(items: CalendarItem[], layers: CalendarLayers, options: { needsActionOnly?: boolean } = {}) {
  return items.filter((item) => layers[item.layer] && (!options.needsActionOnly || item.needsAction))
}

export type HiddenSummary = { layer: CalendarLayer; total: number; needsAction: number }

/** What hidden layers contain, so items that need action never disappear silently. */
export function hiddenSummary(items: CalendarItem[], layers: CalendarLayers): HiddenSummary[] {
  const summary = new Map<CalendarLayer, HiddenSummary>()
  for (const item of items) {
    if (layers[item.layer]) continue
    const entry = summary.get(item.layer) || { layer: item.layer, total: 0, needsAction: 0 }
    entry.total += 1
    if (item.needsAction) entry.needsAction += 1
    summary.set(item.layer, entry)
  }
  return CALENDAR_LAYERS.map((layer) => summary.get(layer)).filter((entry): entry is HiddenSummary => Boolean(entry))
}

export function layersEqual(a: CalendarLayers, b: CalendarLayers) {
  return CALENDAR_LAYERS.every((layer) => a[layer] === b[layer])
}
