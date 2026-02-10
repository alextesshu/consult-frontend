import axios from 'axios'
import type { InternalAxiosRequestConfig } from 'axios'
import { useAuthStore } from '../stores/auth'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api'

export const http = axios.create({
  baseURL: API_BASE_URL,
  headers: { 'Content-Type': 'application/json' },
})

let refreshPromise: Promise<string | null> | null = null

http.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const auth = useAuthStore()
  const url = config.url || ''
  const isAuthEndpoint = url.includes('/auth/')
  if (!isAuthEndpoint && auth.accessToken) {
    config.headers.Authorization = `Bearer ${auth.accessToken}`
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
    const isAuthEndpoint = url.includes('/auth/')
    if (!isAuthEndpoint && error.response?.status === 401 && auth.refreshToken) {
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
    }

    return Promise.reject(error)
  }
)
