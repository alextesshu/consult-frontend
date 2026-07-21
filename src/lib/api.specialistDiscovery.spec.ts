import { beforeEach, describe, expect, it, vi } from 'vitest'
import { http } from './http'
import {
  fetchPublicSpecialistDiscovery,
  getPublicSpecialistDiscoveryError,
} from './api'

vi.mock('./http', () => ({
  http: { get: vi.fn() },
}))

const mockedGet = vi.mocked(http.get)

describe('specialist discovery API helpers', () => {
  beforeEach(() => mockedGet.mockReset())

  it('trims q and omits blank or invalid optional parameters', async () => {
    mockedGet.mockResolvedValue({ data: { total: 0 } } as any)
    await fetchPublicSpecialistDiscovery({ q: '  query  ', page: 1 })
    expect(mockedGet).toHaveBeenCalledWith('/public/specialists/discovery/', {
      params: { q: 'query', page: 1 },
    })

    await fetchPublicSpecialistDiscovery({ q: '   ', page: 0 })
    expect(mockedGet).toHaveBeenLastCalledWith('/public/specialists/discovery/', {
      params: {},
    })
  })

  it('accepts only complete approved structured errors', () => {
    const error = {
      response: {
        data: { code: 'INVALID_PAGE', detail: 'Некоректна сторінка.', field: 'page' },
      },
    }
    expect(getPublicSpecialistDiscoveryError(error)).toEqual(error.response.data)
  })

  it('rejects malformed or unknown structured error values', () => {
    expect(getPublicSpecialistDiscoveryError({ response: { data: { code: 'UNKNOWN', detail: 'x', field: 'q' } } })).toBeNull()
    expect(getPublicSpecialistDiscoveryError({ response: { data: { code: 'INVALID_PAGE', detail: 'x', field: 'unknown' } } })).toBeNull()
    expect(getPublicSpecialistDiscoveryError({ response: { data: { code: 'INVALID_PAGE', field: 'page' } } })).toBeNull()
  })
})
