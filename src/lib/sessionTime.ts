/** Presentation-only phase. Persisted status and mutation permissions stay authoritative. */
export function sessionTimePhase(start: number, end: number, now: number): 'upcoming' | 'ongoing' | 'ended' | 'unknown' {
  if (![start, end, now].every(Number.isFinite) || end <= start) return 'unknown'
  return now < start ? 'upcoming' : now < end ? 'ongoing' : 'ended'
}

export function needsMeetingLink(status: string, format: string | null | undefined, ready: boolean | null | undefined, start: number, end: number, now: number) {
  const phase = sessionTimePhase(start, end, now)
  return status === 'CONFIRMED' && format === 'online' && ready === false && (phase === 'upcoming' || phase === 'ongoing')
}

/** Never silently substitute the browser's timezone for an unresolved specialist timezone. */
export function formatSpecialistSessionDateTime(value: string | null | undefined, timeZone: string | null) {
  if (!value || !timeZone) return '—'
  const date = new Date(value)
  if (!Number.isFinite(date.getTime())) return '—'
  try {
    return new Intl.DateTimeFormat('uk-UA', { timeZone, day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }).format(date)
  } catch {
    return '—'
  }
}
