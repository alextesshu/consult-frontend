import { beforeEach, describe, expect, it, vi } from 'vitest'
import { http } from './http'
import { createPracticeReview, fetchCabinetReviews, updateCabinetReviewStatus } from './api'

vi.mock('./http', () => ({
  http: {
    get: vi.fn(),
    post: vi.fn(),
    patch: vi.fn(),
  },
}))

const mockedHttpGet = vi.mocked(http.get)
const mockedHttpPost = vi.mocked(http.post)
const mockedHttpPatch = vi.mocked(http.patch)

describe('reviews api', () => {
  beforeEach(() => {
    mockedHttpGet.mockReset()
    mockedHttpPost.mockReset()
    mockedHttpPatch.mockReset()
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
          share_card_permission: {
            can_create: false,
            status: 'UNSUPPORTED_REVIEW_SOURCE',
            mode: null,
          },
        },
      ],
    } as any)

    const result = await fetchCabinetReviews()
    expect(result[0]?.source).toBe('session')
    expect(result[0]?.review_uid).toBe('session:1')
    expect(result[0]?.share_card_permission?.status).toBe('UNSUPPORTED_REVIEW_SOURCE')
    expect(result[0]?.author_display_name).toBe('Олена')
    expect(result[0]?.text).toBe('Дякую за консультацію')
    expect(result[0]?.session_id).toBe(123)
    expect((result[0] as any)?.client_username).toBeUndefined()
    expect((result[0] as any)?.review_text).toBeUndefined()
  })

  it('sends allow_anonymous_external_use=true when requested', async () => {
    mockedHttpPost.mockResolvedValue({ data: { id: 55 } } as any)
    await createPracticeReview(10, 'text', true)
    expect(mockedHttpPost).toHaveBeenCalledWith('/practice/specialists/10/reviews/', {
      review_text: 'text',
      allow_anonymous_external_use: true,
    })
  })

  it('omits allow_anonymous_external_use when not provided', async () => {
    mockedHttpPost.mockResolvedValue({ data: { id: 56 } } as any)
    await createPracticeReview(11, 'text')
    expect(mockedHttpPost).toHaveBeenCalledWith('/practice/specialists/11/reviews/', {
      review_text: 'text',
    })
  })

  it('updates review status for practice source', async () => {
    mockedHttpPatch.mockResolvedValue({
      data: { id: 123, source: 'practice', review_uid: 'practice:123', status: 'APPROVED' },
    } as any)

    const result = await updateCabinetReviewStatus({
      source: 'practice',
      id: 123,
      status: 'APPROVED',
    })

    expect(mockedHttpPatch).toHaveBeenCalledWith('/cabinet/reviews/practice/123/status/', {
      status: 'APPROVED',
    })
    expect(result).toEqual({
      id: 123,
      source: 'practice',
      review_uid: 'practice:123',
      status: 'APPROVED',
    })
  })

  it('supports session source status updates', async () => {
    mockedHttpPatch.mockResolvedValue({
      data: { id: 22, source: 'session', review_uid: 'session:22', status: 'REJECTED' },
    } as any)

    const result = await updateCabinetReviewStatus({
      source: 'session',
      id: 22,
      status: 'REJECTED',
    })

    expect(mockedHttpPatch).toHaveBeenCalledWith('/cabinet/reviews/session/22/status/', {
      status: 'REJECTED',
    })
    expect(result.review_uid).toBe('session:22')
    expect(result.status).toBe('REJECTED')
  })
})
