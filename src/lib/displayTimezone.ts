// Label for the timezone public slot times are displayed in. Slot dates and times are formatted
// with the browser's own timezone (Intl without `timeZone`), so the label names exactly that zone;
// no offset to Kyiv is computed.

const KYIV_TIME_ZONE = 'Europe/Kyiv'
// ICU/IANA still ship the legacy spelling; it is the same zone.
const KYIV_ALIASES = new Set(['Europe/Kyiv', 'Europe/Kiev'])

export function normalizeDisplayTimeZone(timeZone: string | null | undefined): string {
  const value = String(timeZone || '').trim()
  return KYIV_ALIASES.has(value) ? KYIV_TIME_ZONE : value
}

export function browserDisplayTimeZone(): string {
  try {
    return normalizeDisplayTimeZone(Intl.DateTimeFormat().resolvedOptions().timeZone)
  } catch {
    return ''
  }
}

export function displayTimeZoneLabel(timeZone: string | null | undefined = browserDisplayTimeZone()): string {
  const normalized = normalizeDisplayTimeZone(timeZone)
  if (normalized === KYIV_TIME_ZONE) return 'Час за Києвом'
  return normalized ? `Ваш місцевий час · ${normalized}` : 'Ваш місцевий час'
}
