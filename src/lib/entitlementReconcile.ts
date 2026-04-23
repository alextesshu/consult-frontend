const ENTITLEMENT_DENY_CODES = new Set([
  'OVER_LIMIT',
  'BILLING_RESTRICTED',
  'BILLING_GRACE',
  'SUSPENDED',
  'ACCESS_DENIED',
  'PERMISSION_DENIED',
])

function normalizeCode(value: unknown): string | null {
  if (typeof value !== 'string') return null
  const normalized = value.trim().toUpperCase()
  if (!normalized) return null
  return normalized
}

function collectCodes(data: unknown): string[] {
  if (!data || typeof data !== 'object') return []
  const typed = data as Record<string, unknown>
  const candidates: Array<unknown> = [typed.code, typed.reason_code]
  const detail = typed.detail
  if (typeof detail === 'string' && /^[A-Z0-9_]+$/.test(detail.trim())) {
    candidates.push(detail)
  }
  return candidates
    .map((value) => normalizeCode(value))
    .filter((value): value is string => Boolean(value))
}

function hasEntitlementDetail(data: unknown): boolean {
  if (!data || typeof data !== 'object') return false
  const detail = (data as Record<string, unknown>).detail
  if (typeof detail !== 'string') return false
  const normalized = detail.trim().toLowerCase()
  if (!normalized) return false
  if (normalized.includes('author journal') && normalized.includes('not enabled')) return true
  if (normalized.includes('group') && normalized.includes('not enabled')) return true
  return false
}

export function isEntitlementOrCapabilityDeny(err: unknown): boolean {
  const status = (err as { response?: { status?: number } })?.response?.status
  if (status !== 403) return false
  const data = (err as { response?: { data?: unknown } })?.response?.data
  if (hasEntitlementDetail(data)) return true
  return collectCodes(data).some((code) => ENTITLEMENT_DENY_CODES.has(code))
}

export function isSpecialistCriticalReconcileRoute(path: string): boolean {
  if (!path) return false
  if (path === '/cabinet') return true
  if (path === '/') return true
  if (path.startsWith('/cabinet/billing')) return true
  if (path.startsWith('/cabinet/group-events')) return true
  if (path.startsWith('/cabinet/journal')) return true
  return false
}

export function hasSpecialistRole(roles: unknown): boolean {
  const upper = normalizeRoles(roles)
  return upper.includes('SPECIALIST') || upper.includes('THERAPIST')
}

export function hasAdminRole(roles: unknown): boolean {
  const upper = normalizeRoles(roles)
  return upper.includes('ADMIN') || upper.includes('SUPERADMIN')
}

export function hasClientRole(roles: unknown): boolean {
  return normalizeRoles(roles).includes('CLIENT')
}

export function normalizeRoles(roles: unknown): string[] {
  if (!Array.isArray(roles)) return []
  return roles.map((role) => String(role).toUpperCase())
}

export function normalizeUserRoles(user: unknown): string[] {
  if (!user || typeof user !== 'object') return []
  const typed = user as { role?: unknown; roles?: unknown }
  const fromRoles = normalizeRoles(typed.roles)
  const fromRole = typeof typed.role === 'string' ? [typed.role.toUpperCase()] : []
  return Array.from(new Set([...fromRoles, ...fromRole]))
}
