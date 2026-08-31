import axios from 'axios'
import type { InternalAxiosRequestConfig } from 'axios'
import { useAuthStore } from '../stores/auth'
import { hasSpecialistRole, isEntitlementOrCapabilityDeny } from './entitlementReconcile'

function resolveApiBaseUrl() {
  const value = String(import.meta.env.VITE_API_BASE_URL || '').trim()
  if (!value) {
    throw new Error(
      '[config] Missing VITE_API_BASE_URL. Set it explicitly (example: http://localhost:8000/api).'
    )
  }
  return value
}

export const API_BASE_URL = resolveApiBaseUrl()

export function apiOrigin() {
  try {
    return new URL(API_BASE_URL).origin
  } catch {
    return ''
  }
}

function isEnableSpecialistEndpoint(url: string) {
  return url.includes('/auth/enable-specialist/')
}

function isEmailVerificationResendEndpoint(url: string) {
  return url.includes('/auth/email-verification/resend/')
}

function isPublicAuthEndpoint(url: string) {
  return (
    url.includes('/auth/') &&
    !isEnableSpecialistEndpoint(url) &&
    !isEmailVerificationResendEndpoint(url)
  )
}

export const http = axios.create({
  baseURL: API_BASE_URL,
  headers: { 'Content-Type': 'application/json' },
  withCredentials: true,
})

let refreshPromise: Promise<string | null> | null = null
let entitlementReconcilePromise: Promise<void> | null = null
let lastEntitlementReconcileAt = 0
const ENTITLEMENT_RECONCILE_COOLDOWN_MS = 10_000

function maybeRefreshMeAfterEntitlementDeny(error: unknown) {
  const auth = useAuthStore()
  if (!auth.accessToken) return
  if (!hasSpecialistRole(auth.me?.user.roles ?? auth.user?.roles ?? [])) return
  if (!isEntitlementOrCapabilityDeny(error)) return

  const url = String((error as { config?: { url?: string } })?.config?.url || '')
  if (url.includes('/me/')) return

  const now = Date.now()
  if (now - lastEntitlementReconcileAt < ENTITLEMENT_RECONCILE_COOLDOWN_MS) return
  if (entitlementReconcilePromise) return

  lastEntitlementReconcileAt = now
  entitlementReconcilePromise = auth
    .loadMe()
    .catch(() => {})
    .finally(() => {
      entitlementReconcilePromise = null
    })
}

http.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  if (config.data instanceof FormData) {
    const headers = config.headers as any
    if (headers && typeof headers.delete === 'function') {
      headers.delete('Content-Type')
    } else if (headers) {
      delete headers['Content-Type']
      delete headers['content-type']
    }
  }

  const auth = useAuthStore()
  const url = config.url || ''
  const isAuthEndpoint = isPublicAuthEndpoint(url)
  const token = auth.accessToken || ''
  if (!isAuthEndpoint && token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

http.interceptors.response.use(
  (res) => res,
  async (error) => {
    const auth = useAuthStore()
    const original: any = error.config
    if (!original || original._retry) {
      return Promise.reject(error)
    }

    const url = original?.url || ''
    const isAuthEndpoint = isPublicAuthEndpoint(url)
    if (!isAuthEndpoint && error.response?.status === 401) {
      original._retry = true
      if (!refreshPromise) {
        refreshPromise = auth
          .refreshAccessToken()
          .finally(() => {
            refreshPromise = null
          })
      }
      const newToken = await refreshPromise
      if (newToken) {
        original.headers.Authorization = `Bearer ${newToken}`
        return http(original)
      }
      if (!auth.accessToken) {
        auth.logout()
      }
    } else if (!isAuthEndpoint && error.response?.status === 401) {
      if (!auth.accessToken) {
        auth.logout()
      }
    }

    if (!isAuthEndpoint) {
      maybeRefreshMeAfterEntitlementDeny(error)
    }

    return Promise.reject(error)
  }
)
