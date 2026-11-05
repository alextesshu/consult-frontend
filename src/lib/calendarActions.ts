import type { GuestBookingRequestRecord } from './api'
import type { CalendarRescheduleRequestRow, CalendarSessionRow } from './calendarItems'
import { dayKeyOf, dayLabels, formatTime } from './calendarTime'

// «Потребує дії» and the next-action card (CALENDAR_3A_SPEC §2–§3). Built only from complete,
// existing GET sets, so the total is global (not limited to the loaded week):
// - GET /booking/sessions/?upcoming=true — every future SCHEDULED/CONFIRMED session;
// - GET /cabinet/sessions/reschedule-requests/ — every pending reschedule request;
// - GET /cabinet/guest-booking-requests/ — every guest request (PENDING kept).
// One action = one reason from one source. Past sessions without notes are not counted:
// the notes-reminder API is paginated without a total (backend gate), so a global number
// for them would be a guess.

export type UpcomingSessionRow = CalendarSessionRow & {
  meeting_link_ready?: boolean | null
  meeting_url?: string | null
}

export type CalendarActionKind = 'confirm' | 'missing_link' | 'reschedule' | 'request'

export type CalendarAction = {
  key: string
  kind: CalendarActionKind
  /** Event time the action is about; null when the source has no time (slot-less request). */
  when: number | null
  who: string
  reason: string
  marker: string
  primaryLabel: string
  /** Existing page that performs the action; UC-02 never mutates inline. */
  href: string
  sessionId: number | null
}

export const ACTION_MARKERS: Record<CalendarActionKind, string> = {
  confirm: '? Підтвердити',
  missing_link: '! Посилання',
  reschedule: '⇄ Перенесення',
  request: 'Запит',
}

const GUEST_REQUESTS_HREF = '/cabinet/external-sessions#guest-requests'

function toMs(value: string | null | undefined) {
  if (!value) return null
  const ms = Date.parse(value)
  return Number.isFinite(ms) ? ms : null
}

function sessionName(row: CalendarSessionRow) {
  return (row.client_display_name || row.client_name || row.client_username || 'Клієнт').trim()
}

export function formatWhen(ms: number, timeZone: string) {
  const label = dayLabels(dayKeyOf(ms, timeZone))
  return `${label.short}, ${label.dateOnly} · ${formatTime(ms, timeZone)}`
}

export function buildCalendarActions(
  sources: {
    upcomingSessions: UpcomingSessionRow[]
    rescheduleRequests: CalendarRescheduleRequestRow[]
    guestRequests: GuestBookingRequestRecord[]
  },
  timeZone: string
): CalendarAction[] {
  const actions: CalendarAction[] = []
  const sessionsById = new Map(sources.upcomingSessions.map((row) => [row.id, row]))

  for (const row of sources.upcomingSessions) {
    const when = toMs(row.slot_start_at)
    const href = `/cabinet/sessions/${row.id}`
    if (row.status === 'SCHEDULED') {
      actions.push({ key: `confirm:${row.id}`, kind: 'confirm', when, who: sessionName(row), reason: 'сесія чекає вашого підтвердження', marker: ACTION_MARKERS.confirm, primaryLabel: 'Підтвердити', href, sessionId: row.id })
    }
    if (row.status === 'CONFIRMED' && row.session_format === 'online' && row.meeting_link_ready === false) {
      actions.push({ key: `missing_link:${row.id}`, kind: 'missing_link', when, who: sessionName(row), reason: 'немає посилання на зустріч', marker: ACTION_MARKERS.missing_link, primaryLabel: 'Додати посилання', href, sessionId: row.id })
    }
  }

  for (const request of sources.rescheduleRequests) {
    if (request.status !== 'PENDING') continue
    const session = sessionsById.get(request.session_id)
    const requested = toMs(request.requested_slot_start_at)
    actions.push({
      key: `reschedule:${request.id}`,
      kind: 'reschedule',
      when: session ? toMs(session.slot_start_at) : requested,
      who: session ? sessionName(session) : 'Клієнт',
      reason: requested ? `просить перенести на ${formatWhen(requested, timeZone)}` : 'просить перенести сесію',
      marker: ACTION_MARKERS.reschedule,
      primaryLabel: 'Переглянути перенесення',
      href: `/cabinet/sessions/${request.session_id}`,
      sessionId: request.session_id,
    })
  }

  for (const request of sources.guestRequests) {
    if (request.status !== 'PENDING') continue
    const when = toMs(request.requested_slot_start)
    actions.push({
      key: `request:${request.id}`,
      kind: 'request',
      when,
      who: (request.guest_name || request.client_name || 'Гість').trim(),
      reason: when ? 'запит на сесію (гість)' : 'запит без обраного часу (гість)',
      marker: ACTION_MARKERS.request,
      primaryLabel: 'Відкрити запит',
      href: GUEST_REQUESTS_HREF,
      sessionId: null,
    })
  }

  return actions.sort((a, b) => (a.when ?? Infinity) - (b.when ?? Infinity) || a.key.localeCompare(b.key))
}

/** Splits the global set by the selected week; the two parts always add up to the total. */
export function splitActionsByWeek(actions: CalendarAction[], week: { start: number; end: number }) {
  const thisWeek = actions.filter((action) => action.when !== null && action.when >= week.start && action.when < week.end)
  const elsewhere = actions.filter((action) => !thisWeek.includes(action))
  return { thisWeek, elsewhere }
}

export type NextActionCard =
  | { kind: 'action'; action: CalendarAction; when: number }
  | { kind: 'session'; session: UpcomingSessionRow; when: number; today: boolean }
  | { kind: 'none' }

/**
 * Priority (§2): nearest future event with an action → otherwise the nearest session
 * («Наступна») → a quiet card when today has nothing. Only real, loaded data is used.
 */
export function pickNextAction(input: { actions: CalendarAction[] | null; upcomingSessions: UpcomingSessionRow[] | null; now: number; timeZone: string }): NextActionCard {
  const nextAction = (input.actions || []).find((action) => action.when !== null && action.when >= input.now)
  if (nextAction && nextAction.when !== null) return { kind: 'action', action: nextAction, when: nextAction.when }
  const nextSession = (input.upcomingSessions || [])
    .map((row) => ({ row, when: toMs(row.slot_start_at) }))
    .filter((entry): entry is { row: UpcomingSessionRow; when: number } => entry.when !== null && entry.when >= input.now)
    .sort((a, b) => a.when - b.when)[0]
  if (nextSession) {
    return { kind: 'session', session: nextSession.row, when: nextSession.when, today: dayKeyOf(nextSession.when, input.timeZone) === dayKeyOf(input.now, input.timeZone) }
  }
  return { kind: 'none' }
}

/** «через N хв» / «скоро» (< 15 хв); refreshed by the caller once a minute. */
export function relativeLabel(when: number, now: number) {
  const minutes = Math.round((when - now) / 60000)
  if (minutes < 15) return 'скоро'
  if (minutes < 60) return `через ${minutes} хв`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `через ${hours} год${minutes % 60 ? ` ${minutes % 60} хв` : ''}`
  return ''
}
