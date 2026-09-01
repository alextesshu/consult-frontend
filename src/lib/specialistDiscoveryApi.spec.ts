import { beforeEach, describe, expect, it, vi } from 'vitest'
import { fetchRotatedPublicSpecialistDiscovery } from './specialistDiscoveryApi'

const httpMocks = vi.hoisted(() => ({
  get: vi.fn(),
}))

vi.mock('./http', () => ({
  http: { get: httpMocks.get },
}))

describe('fetchRotatedPublicSpecialistDiscovery', () => {
  beforeEach(() => {
    httpMocks.get.mockReset()
    httpMocks.get.mockResolvedValue({ data: { total: 0 } })
  })

  it('always requests up to 50 specialists while preserving discovery state', async () => {
    await fetchRotatedPublicSpecialistDiscovery({
      shuffle_seed: 'seed-a',
      format: 'online',
      page_size: 12,
    })

    expect(httpMocks.get).toHaveBeenCalledWith(
      '/public/specialists/discovery/',
      {
        params: {
          shuffle_seed: 'seed-a',
          format: 'online',
          page_size: 50,
        },
      },
    )
  })
})
