import { apiOrigin } from './http'

function cleanTarget(value: string | null | undefined) {
  return String(value || '').trim()
}

function sameOriginPath(value: string) {
  if (!/^https?:\/\//i.test(value) || typeof window === 'undefined') return ''
  try {
    const parsed = new URL(value)
    if (parsed.origin !== window.location.origin) return ''
    return `${parsed.pathname}${parsed.search}${parsed.hash}`
  } catch {
    return ''
  }
}

function targetPath(value: string) {
  if (value.startsWith('/') && !value.startsWith('//')) return value
  return sameOriginPath(value)
}

export function isDjangoAdminModelTarget(value: string | null | undefined) {
  const path = targetPath(cleanTarget(value))
  return /^\/admin\/(?:auth|booking|core)\//.test(path)
}

export function resolveDjangoAdminUrl(value: string | null | undefined) {
  const target = cleanTarget(value)
  if (!target || !isDjangoAdminModelTarget(target)) return ''
  if (/^https?:\/\//i.test(target)) return target
  const origin = apiOrigin()
  return origin ? `${origin}${target}` : target
}

export function spaRouteTargetPath(value: string | null | undefined) {
  const path = targetPath(cleanTarget(value))
  if (!path || path === '/' || path.startsWith('/api/') || isDjangoAdminModelTarget(path)) return ''
  return path
}

export function isSpaRouteTarget(value: string | null | undefined) {
  return Boolean(spaRouteTargetPath(value))
}
