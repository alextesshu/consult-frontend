const UK_LOCALE = 'uk-UA'

export type DateTimeInput = string | number | Date | null | undefined

function hasTimeParts(options: Intl.DateTimeFormatOptions) {
  return Boolean(options.hour || options.minute || options.second)
}

function normalizeOptions(options: Intl.DateTimeFormatOptions) {
  if (!hasTimeParts(options)) return options
  return {
    ...options,
    hour12: false,
  }
}

function toDate(value: DateTimeInput) {
  if (value === null || value === undefined || value === '') return null
  const date = value instanceof Date ? value : new Date(value)
  if (Number.isNaN(date.getTime())) return null
  return date
}

export function formatUkDateTime(
  value: DateTimeInput,
  options: Intl.DateTimeFormatOptions,
  empty = '—'
) {
  if (value === null || value === undefined || value === '') return empty
  const date = toDate(value)
  if (!date) return String(value)
  return new Intl.DateTimeFormat(UK_LOCALE, normalizeOptions(options)).format(date)
}

export function formatUkTime(value: DateTimeInput, empty = '—') {
  return formatUkDateTime(
    value,
    {
      hour: '2-digit',
      minute: '2-digit',
    },
    empty
  )
}

export function formatUkDateTimeCompact(value: DateTimeInput, empty = '—') {
  return formatUkDateTime(
    value,
    {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    },
    empty
  )
}

export function formatUkDateCompact(value: DateTimeInput, empty = '—') {
  return formatUkDateTime(
    value,
    {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    },
    empty
  )
}

export function formatUkDateLong(value: DateTimeInput, empty = '—') {
  return formatUkDateTime(
    value,
    {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    },
    empty
  )
}

export function formatUkDayMonth(value: DateTimeInput, empty = '—') {
  return formatUkDateTime(
    value,
    {
      day: '2-digit',
      month: '2-digit',
    },
    empty
  )
}

export function formatUkWeekdayShort(value: DateTimeInput, empty = '') {
  return formatUkDateTime(
    value,
    {
      weekday: 'short',
    },
    empty
  )
}
