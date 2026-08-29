import type { AxiosRequestConfig, AxiosResponse, InternalAxiosRequestConfig } from 'axios'
import { createPinia, setActivePinia } from 'pinia'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { http } from './http'
import { useAuthStore } from '../stores/auth'

function authorization(config?: AxiosRequestConfig) {
  const headers = config?.headers as { Authorization?: string; get?: (name: string) => string | undefined }
  return headers?.get?.('Authorization') || headers?.Authorization
}

function success(config: InternalAxiosRequestConfig): AxiosResponse {
  return {
    config,
    data: {},
    headers: {},
    status: 200,
    statusText: 'OK',
  }
}

describe('HTTP authenticated auth endpoints', () => {
  const originalAdapter = http.defaults.adapter

  beforeEach(() => {
    setActivePinia(createPinia())
    useAuthStore().setToken('initial-access-token')
  })

  afterEach(() => {
    http.defaults.adapter = originalAdapter
    vi.restoreAllMocks()
  })

  it('adds Bearer authentication to verification resend requests', async () => {
    const requests: AxiosRequestConfig[] = []
    http.defaults.adapter = async (config) => {
      requests.push(config)
      return success(config)
    }

    await http.post('/auth/email-verification/resend/', {})

    expect(authorization(requests[0])).toBe('Bearer initial-access-token')
  })

  it('keeps verification confirmation public', async () => {
    const requests: AxiosRequestConfig[] = []
    http.defaults.adapter = async (config) => {
      requests.push(config)
      return success(config)
    }

    await http.post('/auth/email-verification/confirm/', { token: 'private-token-only-in-body' })

    expect(authorization(requests[0])).toBeUndefined()
  })

  it('refreshes and retries an unauthorized verification resend request', async () => {
    const auth = useAuthStore()
    const refresh = vi.spyOn(auth, 'refreshAccessToken').mockImplementation(async () => {
      auth.setToken('refreshed-access-token')
      return 'refreshed-access-token'
    })
    const requestAuthorizations: Array<string | undefined> = []
    http.defaults.adapter = async (config) => {
      requestAuthorizations.push(authorization(config))
      if (requestAuthorizations.length === 1) {
        return Promise.reject({ config, response: { status: 401 } })
      }
      return success(config)
    }

    await http.post('/auth/email-verification/resend/', {})

    expect(refresh).toHaveBeenCalledTimes(1)
    expect(requestAuthorizations).toEqual([
      'Bearer initial-access-token',
      'Bearer refreshed-access-token',
    ])
  })

  it('keeps enable-specialist authenticated', async () => {
    const requests: AxiosRequestConfig[] = []
    http.defaults.adapter = async (config) => {
      requests.push(config)
      return success(config)
    }

    await http.post('/auth/enable-specialist/', {})

    expect(authorization(requests[0])).toBe('Bearer initial-access-token')
  })
})
