// Calendar time helpers. Everything is rendered in the specialist's timezone (not the
// browser's) with Intl only; day boundaries are real instants, so DST days have 23/25 hours.

export type DayKey = string // YYYY-MM-DD in the calendar timezone

export type ZonedParts = { year: number; month: number; day: number; hour: number; minute: number; weekday: number }

const partsFormatters = new Map<string, Intl.DateTimeFormat>()

function partsFormatter(timeZone: string) {
  let formatter = partsFormatters.get(timeZone)
  if (!formatter) {
    formatter = new Intl.DateTimeFormat('en-GB', {
      timeZone,
      hourCycle: 'h23',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      weekday: 'short',
    })
    partsFormatters.set(timeZone, formatter)
  }
  return formatter
}

const WEEKDAYS: Record<string, number> = { Mon: 0, Tue: 1, Wed: 2, Thu: 3, Fri: 4, Sat: 5, Sun: 6 }

/** Wall-clock parts of an instant in `timeZone`; weekday 0 = Monday. */
export function zonedParts(instant: number, timeZone: string): ZonedParts {
  const parts: Record<string, string> = {}
  for (const part of partsFormatter(timeZone).formatToParts(new Date(instant))) parts[part.type] = part.value
  return {
    year: Number(parts.year),
    month: Number(parts.month),
    day: Number(parts.day),
    hour: Number(parts.hour),
    minute: Number(parts.minute),
    weekday: WEEKDAYS[parts.weekday ?? ''] ?? 0,
  }
}

function offsetMs(instant: number, timeZone: string) {
  const p = zonedParts(instant, timeZone)
  const asUtc = Date.UTC(p.year, p.month - 1, p.day, p.hour, p.minute)
  return asUtc - Math.floor(instant / 60000) * 60000
}

/** UTC instant of wall-clock time in `timeZone` (DST-aware, two-pass offset correction). */
export function zonedTimeToUtc(year: number, month: number, day: number, hour: number, minute: number, timeZone: string) {
  const guess = Date.UTC(year, month - 1, day, hour, minute)
  const first = guess - offsetMs(guess, timeZone)
  return guess - offsetMs(first, timeZone)
}

function pad(value: number) {
  return String(value).padStart(2, '0')
}

export function dayKeyOf(instant: number, timeZone: string): DayKey {
  const p = zonedParts(instant, timeZone)
  return `${p.year}-${pad(p.month)}-${pad(p.day)}`
}

function splitKey(key: DayKey) {
  const [year = 1970, month = 1, day = 1] = key.split('-').map(Number)
  return { year, month, day }
}

/** Pure calendar arithmetic on day keys (no timezone involved). */
export function addDays(key: DayKey, days: number): DayKey {
  const { year, month, day } = splitKey(key)
  const date = new Date(Date.UTC(year, month - 1, day + days))
  return `${date.getUTCFullYear()}-${pad(date.getUTCMonth() + 1)}-${pad(date.getUTCDate())}`
}

export function weekdayOfKey(key: DayKey) {
  const { year, month, day } = splitKey(key)
  return (new Date(Date.UTC(year, month - 1, day)).getUTCDay() + 6) % 7
}

export function weekStartOf(key: DayKey): DayKey {
  return addDays(key, -weekdayOfKey(key))
}

/** Real instants of the local day: [00:00, next day's 00:00). */
export function dayBounds(key: DayKey, timeZone: string) {
  const { year, month, day } = splitKey(key)
  const next = splitKey(addDays(key, 1))
  return {
    start: zonedTimeToUtc(year, month, day, 0, 0, timeZone),
    end: zonedTimeToUtc(next.year, next.month, next.day, 0, 0, timeZone),
  }
}

/** Wall-clock minutes since local midnight (what the time grid uses for placement). */
export function wallMinutes(instant: number, timeZone: string) {
  const p = zonedParts(instant, timeZone)
  return p.hour * 60 + p.minute
}

export function formatTime(instant: number, timeZone: string) {
  const p = zonedParts(instant, timeZone)
  return `${pad(p.hour)}:${pad(p.minute)}`
}

const WEEKDAY_SHORT = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Нд']
const WEEKDAY_LONG = ['Понеділок', 'Вівторок', 'Середа', 'Четвер', 'П’ятниця', 'Субота', 'Неділя']
const MONTHS_GENITIVE = [
  'січня', 'лютого', 'березня', 'квітня', 'травня', 'червня',
  'липня', 'серпня', 'вересня', 'жовтня', 'листопада', 'грудня',
]

function monthName(month: number) {
  return MONTHS_GENITIVE[month - 1] ?? ''
}

export function dayLabels(key: DayKey) {
  const { month, day } = splitKey(key)
  const weekday = weekdayOfKey(key)
  return {
    short: WEEKDAY_SHORT[weekday] ?? '',
    long: WEEKDAY_LONG[weekday] ?? '',
    day,
    full: `${WEEKDAY_LONG[weekday] ?? ''}, ${day} ${monthName(month)}`,
    dateOnly: `${day} ${monthName(month)}`,
  }
}

export function rangeLabel(firstKey: DayKey, lastKey: DayKey) {
  const first = splitKey(firstKey)
  const last = splitKey(lastKey)
  if (firstKey === lastKey) return dayLabels(firstKey).full
  if (first.month === last.month) return `${first.day} – ${last.day} ${monthName(last.month)}`
  return `${first.day} ${monthName(first.month)} – ${last.day} ${monthName(last.month)}`
}

/** UTC calendar dates to request so a UTC-day-filtered API covers the local range. */
export function utcQueryDates(rangeStart: number, rangeEnd: number) {
  const day = 24 * 60 * 60 * 1000
  const iso = (ms: number) => new Date(ms).toISOString().slice(0, 10)
  return { dateFrom: iso(rangeStart - day), dateTo: iso(rangeEnd + day) }
}

export function isValidTimeZone(timeZone: string) {
  try {
    new Intl.DateTimeFormat('en-GB', { timeZone })
    return true
  } catch {
    return false
  }
}
