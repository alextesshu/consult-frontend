import axios from 'axios'
import type { InternalAxiosRequestConfig } from 'axios'
import { useAuthStore } from '../stores/auth'

function resolveApiBaseUrl() {
  const value = String(import.meta.env.VITE_API_BASE_URL || '').trim()
  if (!value) {
    throw new Error(
      '[config] Missing VITE_API_BASE_URL. Set it explicitly (example: http://localhost:8000/api).'
    )
  }
  return value
}

const API_BASE_URL = resolveApiBaseUrl()

function isEnableSpecialistEndpoint(url: string) {
  return url.includes('/auth/enable-specialist/')
}

export const http = axios.create({
  baseURL: API_BASE_URL,
  headers: { 'Content-Type': 'application/json' },
  withCredentials: true,
})

let refreshPromise: Promise<string | null> | null = null

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
  const isAuthEndpoint = url.includes('/auth/') && !isEnableSpecialistEndpoint(url)
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
    const isAuthEndpoint = url.includes('/auth/') && !isEnableSpecialistEndpoint(url)
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

    return Promise.reject(error)
  }
)
