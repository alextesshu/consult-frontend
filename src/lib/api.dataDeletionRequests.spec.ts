import { beforeEach, describe, expect, it, vi } from 'vitest'
import { http } from './http'
import {
  cancelDataDeletionRequest,
  createDataDeletionRequest,
  fetchCurrentDataDeletionRequest,
} from './api'

vi.mock('./http', () => ({
  http: {
    get: vi.fn(),
    post: vi.fn(),
  },
}))

const mockedHttp = {
  get: vi.mocked(http.get),
  post: vi.mocked(http.post),
}

describe('data deletion requests api', () => {
  beforeEach(() => {
    mockedHttp.get.mockReset()
    mockedHttp.post.mockReset()
  })

  it('creates a data deletion request with optional reason', async () => {
    mockedHttp.post.mockResolvedValue({
      data: {
        id: 17,
        kind: 'ACCOUNT',
        status: 'SUBMITTED',
        reason: 'Потрібно завершити акаунт.',
        submitted_at: '2026-06-16T12:00:00Z',
        reviewed_at: null,
        cancelled_at: null,
      },
    } as any)

    const result = await createDataDeletionRequest('Потрібно завершити акаунт.')

    expect(mockedHttp.post).toHaveBeenCalledWith('/account/data-deletion-requests/', {
      reason: 'Потрібно завершити акаунт.',
    })
    expect(result.status).toBe('SUBMITTED')
  })

  it('unwraps current request payload and returns null when there is no open request', async () => {
    mockedHttp.get.mockResolvedValue({ data: { request: null } } as any)

    const result = await fetchCurrentDataDeletionRequest()

    expect(mockedHttp.get).toHaveBeenCalledWith('/account/data-deletion-requests/current/')
    expect(result).toBeNull()
  })

  it('returns current request from wrapped payload', async () => {
    mockedHttp.get.mockResolvedValue({
      data: {
        request: {
          id: 22,
          kind: 'ACCOUNT',
          status: 'IN_REVIEW',
          reason: '',
          submitted_at: '2026-06-16T12:00:00Z',
          reviewed_at: '2026-06-17T09:00:00Z',
          cancelled_at: null,
        },
      },
    } as any)

    const result = await fetchCurrentDataDeletionRequest()

    expect(result?.id).toBe(22)
    expect(result?.status).toBe('IN_REVIEW')
  })

  it('cancels a request by id', async () => {
    mockedHttp.post.mockResolvedValue({
      data: {
        id: 17,
        kind: 'ACCOUNT',
        status: 'CANCELLED',
        reason: '',
        submitted_at: '2026-06-16T12:00:00Z',
        reviewed_at: null,
        cancelled_at: '2026-06-17T10:00:00Z',
      },
    } as any)

    const result = await cancelDataDeletionRequest(17)

    expect(mockedHttp.post).toHaveBeenCalledWith('/account/data-deletion-requests/17/cancel/', {})
    expect(result.status).toBe('CANCELLED')
  })
})
