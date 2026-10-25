import type { CalendarItem } from './calendarItems'
import { dayKeyOf, type DayKey } from './calendarTime'

// Availability windows (CALENDAR_3A_SPEC §3): a window joins only adjacent free slots.
// Adjacent = the next slot starts at most JOIN_GAP_MINUTES after the previous one ends (this
// covers the standard 10-minute buffer between generated slots), nothing busy lies in between,
// and both are on the same local day. A session, request, absence, external guest session or
// a longer gap always starts a new window. Never «09:00–19:30» across gaps.
export const JOIN_GAP_MINUTES = 15

export type FreeWindow = {
  key: string
  day: DayKey
  start: number
  end: number
  slots: CalendarItem[]
}

const BUSY_KINDS = new Set<CalendarItem['kind']>(['session', 'guest_request', 'absence', 'external_guest_session'])
const INACTIVE_SESSION_STATUSES = new Set(['CANCELLED', 'NO_SHOW'])

export function isBusy(item: CalendarItem) {
  if (!BUSY_KINDS.has(item.kind)) return false
  if (item.kind === 'session' && INACTIVE_SESSION_STATUSES.has(item.status)) return false
  if (item.kind === 'external_guest_session' && item.status === 'CANCELLED') return false
  return true
}

export function groupFreeWindows(items: CalendarItem[], timeZone: string): FreeWindow[] {
  const slots = items.filter((item) => item.kind === 'free_slot').sort((a, b) => a.start - b.start || a.end - b.end)
  const busy = items.filter(isBusy)
  const windows: FreeWindow[] = []
  let current: FreeWindow | null = null
  for (const slot of slots) {
    const day = dayKeyOf(slot.start, timeZone)
    const gapStart = current?.end ?? 0
    const joinable =
      current !== null &&
      current.day === day &&
      slot.start >= gapStart &&
      slot.start - gapStart <= JOIN_GAP_MINUTES * 60000 &&
      // Anything busy inside the open gap (previous end, next start) breaks the window.
      !busy.some((item) => item.start < slot.start && item.end > gapStart)
    if (current && joinable) {
      current.end = Math.max(current.end, slot.end)
      current.slots.push(slot)
      continue
    }
    current = { key: `window:${slot.sourceId}`, day, start: slot.start, end: slot.end, slots: [slot] }
    windows.push(current)
  }
  return windows
}

/**
 * Label for a day column with nothing visible. A day hidden by «Вигляд» layers or with only busy
 * time is never called empty: «Порожній день» means no busy events and no free slots were loaded.
 */
export function emptyDayLabel(dayItems: CalendarItem[], freeWindows: number, mode: 'workday' | 'availability') {
  const busy = dayItems.some(isBusy)
  if (busy && mode === 'availability' && !freeWindows) return 'Немає вільних слотів · є зайняті події'
  if (busy) return 'Є зайняті події — приховані у «Вигляді»'
  if (freeWindows) return 'Сесій немає · є вільний час'
  return 'Порожній день'
}

/** Ukrainian plural helper: one / few (2–4) / many. */
export function plural(count: number, one: string, few: string, many: string) {
  const mod10 = count % 10
  const mod100 = count % 100
  if (mod10 === 1 && mod100 !== 11) return one
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 10 || mod100 >= 20)) return few
  return many
}

export const slotsLabel = (count: number) => `${count} ${plural(count, 'слот', 'слоти', 'слотів')}`
export const windowsLabel = (count: number) => `${count} ${plural(count, 'вікно', 'вікна', 'вікон')}`
