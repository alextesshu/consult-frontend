// Presentation helpers for the specialist Dashboard UI v2 (Cabinet-Dashboard.dc.html, snapshot
// claude-design-2026-10-23-4ff7cedd). They format real cabinet DTO values only; nothing here invents data.

export type DashboardQueueKind = 'request' | 'confirm' | 'link' | 'pay' | 'note' | 'update'

export type DashboardQueueItem = {
  key: string
  kind: DashboardQueueKind
  tag: string
  title: string
  body: string
  topics: string[]
  primary: string
  to: string
}

// Tag colours follow the source TAG map (request / pay / link / note).
export const QUEUE_TAG_CLASS: Record<DashboardQueueKind, string> = {
  request: 'is-request',
  confirm: 'is-request',
  pay: 'is-pay',
  link: 'is-link',
  note: 'is-note',
  update: 'is-link',
}

export function pluralUk(n: number, forms: [string, string, string]) {
  const a = Math.abs(n) % 10
  const b = Math.abs(n) % 100
  return forms[a === 1 && b !== 11 ? 0 : a >= 2 && a <= 4 && (b < 10 || b >= 20) ? 1 : 2]
}

export function greetingFor(date: Date) {
  const hour = date.getHours()
  if (hour >= 5 && hour < 12) return 'Добрий ранок'
  if (hour >= 12 && hour < 18) return 'Добрий день'
  return 'Добрий вечір'
}

function capitalize(value: string) {
  return value ? value.charAt(0).toLocaleUpperCase('uk-UA') + value.slice(1) : value
}

// "Четвер, 22 жовтня · Добрий день" — the source adds a first name, which /me/ does not expose.
export function dashboardDateLine(date: Date) {
  const day = new Intl.DateTimeFormat('uk-UA', { weekday: 'long', day: 'numeric', month: 'long' }).format(date)
  return `${capitalize(day)} · ${greetingFor(date)}`
}

export function timeHHMM(value: string | number | Date | null | undefined) {
  if (value === null || value === undefined || value === '') return ''
  const date = value instanceof Date ? value : new Date(value)
  if (Number.isNaN(date.getTime())) return ''
  return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`
}

// "Пт 23" — weekday and day of month for the "Попереду" list.
export function shortDayLabel(value: string | null | undefined) {
  if (!value) return ''
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ''
  const weekday = new Intl.DateTimeFormat('uk-UA', { weekday: 'short' }).format(date).replace('.', '')
  return `${capitalize(weekday)} ${date.getDate()}`
}

// mm:ss below one hour, h:mm:ss above it (the source shows mm:ss for its sub-hour scenarios).
export function countdownLabel(ms: number) {
  const total = Math.max(0, Math.floor(ms / 1000))
  const hours = Math.floor(total / 3600)
  const minutes = Math.floor((total % 3600) / 60)
  const seconds = total % 60
  const mmss = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
  return hours > 0 ? `${hours}:${mmss}` : mmss
}

export function ringOffset(done: number, total: number, progress = 1, circumference = 113.1) {
  if (total <= 0) return circumference.toFixed(2)
  return (circumference * (1 - (done / total) * progress)).toFixed(2)
}

// Source count-up: easeOutCubic over 900ms.
export function easeOutCubic(p: number) {
  const clamped = Math.min(1, Math.max(0, p))
  return 1 - Math.pow(1 - clamped, 3)
}

export function tween(value: number, progress: number) {
  return Math.round(value * easeOutCubic(progress))
}
