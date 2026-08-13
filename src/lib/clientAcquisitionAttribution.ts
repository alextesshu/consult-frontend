export type ClientAcquisitionPayload = {
  utm_source?: string
  utm_medium?: string
  utm_campaign?: string
  utm_content?: string
  utm_term?: string
  referrer?: string
  first_landing_path?: string
  used_proconsult_discovery?: boolean
}

export const clientAcquisitionAttributionStorageKey = 'proconsult.client_acquisition_first_touch.v1'
const UTM_KEYS = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term'] as const
const PRIVATE = ['/admin', '/cabinet', '/client', '/guest', '/invite']
const CONTROL = /[\u0000-\u001f\u007f-\u009f]/g
const EMAIL = /\b[^\s@]+@[^\s@]+\.[^\s@]+\b/
const PHONE = /(?<!\d)(?:\+?380|0\d{9}|[1-9]\d{9,14})(?!\d)/
const SENSITIVE = /(?:access[_-]?token|auth(?:orization)?|bearer|password|secret|session[_-]?id)/i

function safeText(value: unknown, max = 120): string {
  if (typeof value !== 'string') return ''
  const text = value.replace(CONTROL, '').trim().slice(0, max)
  return !text || EMAIL.test(text) || PHONE.test(text) || SENSITIVE.test(text) ? '' : text
}

function safePath(value: unknown): string {
  const raw = safeText(value, 300)
  if (!raw || !raw.startsWith('/') || raw.startsWith('//')) return ''
  const withoutQuery = raw.split('?', 1)[0] || ''
  const path = (withoutQuery.split('#', 1)[0] || '').replace(/\/+$/, '') || '/'
  return PRIVATE.some((prefix) => path === prefix || path.startsWith(`${prefix}/`)) ? '' : path
}

function safeReferrer(value: unknown, origin: string): string {
  if (typeof value !== 'string') return ''
  try {
    const parsed = new URL(value)
    if (!['http:', 'https:'].includes(parsed.protocol) || parsed.username || parsed.password || parsed.origin === origin) return ''
    if (parsed.hostname === 'proconsult.space' || parsed.hostname.endsWith('.proconsult.space')) return ''
    return parsed.origin
  } catch { return '' }
}

function read(): ClientAcquisitionPayload | null {
  try {
    const raw = sessionStorage.getItem(clientAcquisitionAttributionStorageKey)
    const value = raw ? JSON.parse(raw) : null
    return value && typeof value === 'object' ? value : null
  } catch { return null }
}

function write(value: ClientAcquisitionPayload) {
  try { sessionStorage.setItem(clientAcquisitionAttributionStorageKey, JSON.stringify(value)) } catch { /* storage is optional */ }
}

export function captureClientAcquisitionContext(
  environment: { href?: string; origin?: string; referrer?: string } = {
    href: window.location.href, origin: window.location.origin, referrer: document.referrer,
  }
): ClientAcquisitionPayload | null {
  const existing = read()
  if (existing) return existing
  let url: URL
  try { url = new URL(environment.href || '', environment.origin) } catch { return null }
  const value: ClientAcquisitionPayload = { first_landing_path: safePath(url.pathname) }
  for (const key of UTM_KEYS) {
    const item = safeText(url.searchParams.get(key))
    if (item) value[key] = item
  }
  const referrer = safeReferrer(environment.referrer, url.origin)
  if (referrer) value.referrer = referrer
  if (!Object.values(value).some(Boolean)) return null
  write(value)
  return value
}

export function markClientAcquisitionDiscoveryUsed(): ClientAcquisitionPayload | null {
  const value = read() || captureClientAcquisitionContext()
  if (!value) return null
  const next = { ...value, used_proconsult_discovery: true }
  write(next)
  return next
}

export function getClientAcquisitionContext(): ClientAcquisitionPayload | null { return read() }
export function clearClientAcquisitionContext(): void { try { sessionStorage.removeItem(clientAcquisitionAttributionStorageKey) } catch { /* no-op */ } }
