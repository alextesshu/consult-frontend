import { apiGet, apiPatch, apiPost, apiPut } from './api'
import { BOOKING_UI_MESSAGES, getSuggestionReasonLabel } from './bookingCopy'

type SessionSlot = {
  start_at?: string | null
  end_at?: string | null
}

export type SpecialistSessionLike = {
  id: number
  status: string
  client: number
  client_username?: string | null
  client_name?: string | null
  slot?: SessionSlot | number | null
  slot_start_at?: string | null
  slot_end_at?: string | null
}

export type SpecialistSlot = {
  id: number
  start_at: string
  end_at: string
  is_booked: boolean
}

export type SpecialistRescheduleRequest = {
  id: number
  session_id: number
  requested_slot_id: number
  requested_slot_start_at?: string | null
  requested_slot_end_at?: string | null
  client_username?: string | null
  client_name?: string | null
  client_email?: string | null
  status: string
  created_at?: string
  resolved_at?: string | null
}

export type SpecialistRescheduleSuggestion = {
  slot_id: number
  start_at: string
  end_at: string
  label: string
  reason_tag: string
}

export type SpecialistRecurringSkippedItem = {
  start_at: string
  reason: string
}

export type SpecialistRecurringSummary = {
  created_count: number
  skipped_count: number
  created_dates: string[]
  skipped_reasons: Array<{ reason: string; count: number }>
  skipped: SpecialistRecurringSkippedItem[]
}

const statusMap: Record<string, string> = {
  SCHEDULED: 'Заплановано',
  CONFIRMED: 'Підтверджено',
  COMPLETED: 'Завершено',
  CANCELLED: 'Скасовано',
  NO_SHOW: 'Не відбулося',
  DRAFT: 'Чернетка',
}

const rescheduleStatusMap: Record<string, string> = {
  PENDING: 'Очікує підтвердження',
  APPROVED: 'Погоджено',
  DECLINED: 'Відхилено',
  CANCELLED: 'Скасовано',
}

export function sessionStartAt(detail: Pick<SpecialistSessionLike, 'slot' | 'slot_start_at'>) {
  if (detail.slot && typeof detail.slot === 'object') {
    return detail.slot.start_at || detail.slot_start_at || null
  }
  return detail.slot_start_at || null
}

export function sessionEndAt(detail: Pick<SpecialistSessionLike, 'slot' | 'slot_end_at'>) {
  if (detail.slot && typeof detail.slot === 'object') {
    return detail.slot.end_at || detail.slot_end_at || null
  }
  return detail.slot_end_at || null
}

export function formatSessionDateTime(value?: string | null) {
  if (!value) return '—'
  const dt = new Date(value)
  if (Number.isNaN(dt.getTime())) return value
  return dt.toLocaleString('uk-UA', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  })
}

export function formatSessionDuration(
  start?: string | null,
  end?: string | null,
  options?: { empty?: string; prefix?: string }
) {
  const empty = options?.empty ?? '—'
  const prefix = options?.prefix ?? ''

  if (!start || !end) return empty
  const startDt = new Date(start)
  const endDt = new Date(end)
  if (Number.isNaN(startDt.getTime()) || Number.isNaN(endDt.getTime())) return empty
  const minutes = Math.max(0, Math.round((endDt.getTime() - startDt.getTime()) / 60000))
  if (!minutes) return `${prefix}0 хв`
  const hours = Math.floor(minutes / 60)
  const mins = minutes % 60
  const parts = []
  if (hours) parts.push(`${hours} год`)
  if (mins) parts.push(`${mins} хв`)
  return `${prefix}${parts.join(' ')}`
}

export function isSessionInProgress(detail: Pick<SpecialistSessionLike, 'status' | 'slot' | 'slot_start_at' | 'slot_end_at'>) {
  if (detail.status !== 'CONFIRMED') return false
  const start = sessionStartAt(detail)
  const end = sessionEndAt(detail)
  if (!start || !end) return false
  const startValue = new Date(start).getTime()
  const endValue = new Date(end).getTime()
  if (Number.isNaN(startValue) || Number.isNaN(endValue)) return false
  const now = Date.now()
  return now >= startValue && now <= endValue
}

export function timeUntilLabel(detail: Pick<SpecialistSessionLike, 'slot' | 'slot_start_at'>) {
  const start = sessionStartAt(detail)
  if (!start) return ''
  const startValue = new Date(start).getTime()
  if (Number.isNaN(startValue)) return ''
  const diffMs = startValue - Date.now()
  if (diffMs <= 0) return ''
  const diffMin = Math.round(diffMs / 60000)
  if (diffMin > 120) return ''
  if (diffMin < 60) return `${diffMin} хв`
  const hours = Math.floor(diffMin / 60)
  const mins = diffMin % 60
  return mins ? `${hours} год ${mins} хв` : `${hours} год`
}

export function clientLabel(detail: Pick<SpecialistSessionLike, 'client' | 'client_name' | 'client_username'>) {
  return detail.client_name || detail.client_username || `#${detail.client}`
}

export function statusLabel(detail: Pick<SpecialistSessionLike, 'status' | 'slot' | 'slot_start_at' | 'slot_end_at'>) {
  if (isSessionInProgress(detail)) return 'В процесі'
  return statusMap[detail.status] || detail.status
}

export function statusClass(detail: Pick<SpecialistSessionLike, 'status' | 'slot' | 'slot_start_at' | 'slot_end_at'>) {
  if (isSessionInProgress(detail)) return 'status-pill--ok'
  if (detail.status === 'CONFIRMED') return 'status-pill--ok'
  if (detail.status === 'SCHEDULED') return 'status-pill--warn'
  if (detail.status === 'COMPLETED') return 'status-pill--muted'
  if (detail.status === 'CANCELLED' || detail.status === 'NO_SHOW') return 'status-pill--danger'
  return 'status-pill--muted'
}

export function rescheduleStatusLabel(status: string) {
  return rescheduleStatusMap[status] || status
}

export function requestStatusClass(status: string) {
  if (status === 'PENDING') return 'status-pill--warn'
  if (status === 'APPROVED') return 'status-pill--ok'
  if (status === 'DECLINED') return 'status-pill--danger'
  return 'status-pill--muted'
}

export function suggestionReasonLabel(reasonTag: string) {
  return getSuggestionReasonLabel(reasonTag)
}

export function canCancel(status: string) {
  return status === 'SCHEDULED' || status === 'CONFIRMED'
}

export function canReschedule(status: string) {
  return status === 'SCHEDULED' || status === 'CONFIRMED'
}

export function canShowRecurringAction(
  detail: Pick<SpecialistSessionLike, 'status' | 'slot' | 'slot_start_at'>,
  hasPendingReschedule = false
) {
  if (!canReschedule(detail.status) || hasPendingReschedule) return false
  const start = sessionStartAt(detail)
  if (!start) return false
  const startValue = new Date(start).getTime()
  if (Number.isNaN(startValue)) return false
  return startValue - Date.now() >= 24 * 60 * 60 * 1000
}

export function parseActualDurationInput(input: string) {
  if (!input.trim()) {
    return { payload: undefined as Record<string, number> | undefined, error: '' }
  }

  const minutes = Number(input)
  if (!Number.isFinite(minutes) || minutes <= 0 || minutes > 480) {
    return { payload: undefined, error: BOOKING_UI_MESSAGES.invalidDuration }
  }

  return {
    payload: {
      actual_duration_minutes: Math.round(minutes),
    },
    error: '',
  }
}

export function parseRecurringOccurrences(
  preset: number | 'custom',
  customOccurrences: number | ''
) {
  if (preset === 'custom') {
    const value = Number(customOccurrences)
    if (!Number.isInteger(value) || value < 1 || value > 52) {
      return null
    }
    return value
  }

  return preset
}

export async function fetchSpecialistAvailableSlots() {
  const resp = await apiGet<SpecialistSlot[]>('/cabinet/slots/')
  const now = Date.now()
  return (resp || []).filter((slot) => {
    const start = new Date(slot.start_at).getTime()
    return !slot.is_booked && !Number.isNaN(start) && start > now
  })
}

export async function fetchSpecialistRescheduleSuggestions(sessionId: number) {
  const resp = await apiGet<{ suggestions?: SpecialistRescheduleSuggestion[] }>(
    `/booking/sessions/${sessionId}/reschedule-suggestions/`
  )
  return resp?.suggestions || []
}

export async function fetchSpecialistRescheduleRequests() {
  const resp = await apiGet<SpecialistRescheduleRequest[]>('/cabinet/sessions/reschedule-requests/')
  return resp || []
}

export async function fetchSpecialistSessionNoteContent(sessionId: number) {
  try {
    const resp = await apiGet<{ content?: string } | null>(`/cabinet/sessions/${sessionId}/note/`)
    return resp?.content || ''
  } catch (err: any) {
    if (err?.response?.status === 404) {
      return ''
    }
    throw err
  }
}

export async function saveSpecialistSessionNote(sessionId: number, content: string) {
  return apiPut(`/cabinet/sessions/${sessionId}/note/`, { content })
}

export async function confirmSpecialistSession(sessionId: number) {
  return apiPatch(`/booking/sessions/${sessionId}/confirm/`)
}

export async function completeSpecialistSession(
  sessionId: number,
  payload?: Record<string, number>
) {
  return apiPatch(`/booking/sessions/${sessionId}/complete/`, payload)
}

export async function cancelSpecialistSession(sessionId: number) {
  return apiPatch(`/booking/sessions/${sessionId}/cancel/`)
}

export async function rescheduleSpecialistSession(sessionId: number, slotId: number) {
  return apiPatch(`/booking/sessions/${sessionId}/reschedule/`, { slot_id: slotId })
}

export async function createRecurringSpecialistSessions(sessionId: number, occurrences: number) {
  return apiPost<SpecialistRecurringSummary>(`/booking/sessions/${sessionId}/create-recurring/`, {
    frequency: 'weekly',
    occurrences,
  })
}

export async function approveSpecialistRescheduleRequest(requestId: number) {
  return apiPatch(`/cabinet/sessions/reschedule-requests/${requestId}/approve/`)
}

export async function declineSpecialistRescheduleRequest(requestId: number) {
  return apiPatch(`/cabinet/sessions/reschedule-requests/${requestId}/decline/`)
}
