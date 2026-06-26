export type DatePickerDay = {
  key: string
  isoDate: string
  displayDate: string
  day: number
  inCurrentMonth: boolean
}

const DISPLAY_DATE_PATTERN = /^(\d{1,2})\.(\d{1,2})\.(\d{4})$/
const ISO_DATE_PATTERN = /^(\d{4})-(\d{2})-(\d{2})$/

function parseDisplayDateParts(displayDate: string) {
  const match = DISPLAY_DATE_PATTERN.exec(String(displayDate || '').trim())
  if (!match) return null
  return {
    day: Number(match[1]),
    month: Number(match[2]),
    year: Number(match[3]),
  }
}

function isRealLocalDate(year: number, month: number, day: number) {
  const parsed = new Date(year, month - 1, day)
  return parsed.getFullYear() === year && parsed.getMonth() === month - 1 && parsed.getDate() === day
}

export function formatIsoDateForDisplay(isoDate: string): string {
  const match = ISO_DATE_PATTERN.exec(String(isoDate || '').trim())
  if (!match) return ''
  const year = Number(match[1])
  const month = Number(match[2])
  const day = Number(match[3])
  if (!isRealLocalDate(year, month, day)) return ''
  return `${match[3]}.${match[2]}.${match[1]}`
}

export function parseDisplayDateToIso(displayDate: string): string | null {
  const parts = parseDisplayDateParts(displayDate)
  if (!parts || !isRealLocalDate(parts.year, parts.month, parts.day)) return null
  return `${parts.year}-${String(parts.month).padStart(2, '0')}-${String(parts.day).padStart(2, '0')}`
}

export function normalizeDisplayDate(displayDate: string): string {
  const raw = String(displayDate || '').trim()
  const parts = parseDisplayDateParts(raw)
  if (!parts || !isRealLocalDate(parts.year, parts.month, parts.day)) return raw
  return `${String(parts.day).padStart(2, '0')}.${String(parts.month).padStart(2, '0')}.${parts.year}`
}

export function isValidDisplayDate(displayDate: string): boolean {
  return parseDisplayDateToIso(normalizeDisplayDate(displayDate)) !== null
}

export function isoDateToLocalDate(isoDate: string): Date | null {
  const match = ISO_DATE_PATTERN.exec(String(isoDate || '').trim())
  if (!match) return null
  const year = Number(match[1])
  const month = Number(match[2])
  const day = Number(match[3])
  const parsed = new Date(year, month - 1, day)
  if (!isRealLocalDate(year, month, day)) return null
  return parsed
}

export function localDateToIsoDate(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

export function startOfLocalMonth(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), 1)
}

export function buildDatePickerDays(monthDate: Date): DatePickerDay[] {
  const monthStart = startOfLocalMonth(monthDate)
  const gridStart = new Date(monthStart)
  const mondayOffset = (monthStart.getDay() + 6) % 7
  gridStart.setDate(monthStart.getDate() - mondayOffset)

  return Array.from({ length: 42 }, (_, index) => {
    const date = new Date(gridStart)
    date.setDate(gridStart.getDate() + index)
    const isoDate = localDateToIsoDate(date)
    return {
      key: isoDate,
      isoDate,
      displayDate: formatIsoDateForDisplay(isoDate),
      day: date.getDate(),
      inCurrentMonth: date.getMonth() === monthStart.getMonth(),
    }
  })
}

export function formatDatePickerMonth(monthDate: Date): string {
  return new Intl.DateTimeFormat('uk-UA', { month: 'long', year: 'numeric' }).format(monthDate)
}
