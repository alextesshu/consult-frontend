import { beforeEach, describe, expect, it, vi } from 'vitest'
import { http } from './http'
import { fetchCabinetReviews } from './api'

vi.mock('./http', () => ({
  http: {
    get: vi.fn(),
  },
}))

const mockedHttpGet = vi.mocked(http.get)

describe('reviews api', () => {
  beforeEach(() => {
    mockedHttpGet.mockReset()
  })

  it('calls cabinet reviews endpoint without filters', async () => {
    mockedHttpGet.mockResolvedValue({ data: [] } as any)
    await fetchCabinetReviews()
    expect(mockedHttpGet).toHaveBeenCalledWith('/cabinet/reviews/', {
      params: { status: undefined },
    })
  })

  it('calls cabinet reviews endpoint with pending status', async () => {
    mockedHttpGet.mockResolvedValue({ data: [] } as any)
    await fetchCabinetReviews({ status: 'PENDING' })
    expect(mockedHttpGet).toHaveBeenCalledWith('/cabinet/reviews/', {
      params: { status: 'PENDING' },
    })
  })

  it('returns contract fields from backend shape', async () => {
    mockedHttpGet.mockResolvedValue({
      data: [
        {
          id: 1,
          source: 'session',
          review_uid: 'session:1',
          author_display_name: 'Олена',
          rating: 1,
          text: 'Дякую за консультацію',
          status: 'APPROVED',
          created_at: '2026-05-02T10:00:00Z',
          session_id: 123,
        },
      ],
    } as any)

    const result = await fetchCabinetReviews()
    expect(result[0]?.source).toBe('session')
    expect(result[0]?.review_uid).toBe('session:1')
    expect(result[0]?.author_display_name).toBe('Олена')
    expect(result[0]?.text).toBe('Дякую за консультацію')
    expect(result[0]?.session_id).toBe(123)
    expect((result[0] as any)?.client_username).toBeUndefined()
    expect((result[0] as any)?.review_text).toBeUndefined()
  })
})
