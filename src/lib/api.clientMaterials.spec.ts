import { beforeEach, describe, expect, it, vi } from 'vitest'
import { http } from './http'
import {
  createSpecialistClientMaterial,
  fetchClientMaterials,
  fetchSpecialistClientMaterials,
  hasMaterialUrl,
  publishSpecialistClientMaterial,
  revokeSpecialistClientMaterial,
} from './api'

vi.mock('./http', () => ({
  http: {
    get: vi.fn(),
    post: vi.fn(),
    patch: vi.fn(),
  },
}))

const mockedHttp = {
  get: vi.mocked(http.get),
  post: vi.mocked(http.post),
  patch: vi.mocked(http.patch),
}

describe('client materials api', () => {
  beforeEach(() => {
    mockedHttp.get.mockReset()
    mockedHttp.post.mockReset()
    mockedHttp.patch.mockReset()
  })

  it('calls specialist list endpoint with filters', async () => {
    mockedHttp.get.mockResolvedValue({ data: [] } as any)
    await fetchSpecialistClientMaterials({ client_record_id: 22, client_id: 44, status: 'draft', q: 'abc' })
    expect(mockedHttp.get).toHaveBeenCalledWith('/cabinet/client-materials/', {
      params: { client_record_id: 22, client_id: 44, status: 'draft', q: 'abc' },
    })
  })

  it('creates specialist material via POST', async () => {
    mockedHttp.post.mockResolvedValue({
      data: {
        id: 1,
        client_record_id: 22,
        session_id: null,
        status: 'draft',
        material_type: 'recommendation',
        title: 'T',
        content: 'C',
        content_preview: 'C',
        url: '',
        published_at: null,
        revoked_at: null,
        created_at: '2026-04-30T00:00:00Z',
        updated_at: '2026-04-30T00:00:00Z',
      },
    } as any)
    const material = await createSpecialistClientMaterial({
      client_record_id: 22,
      title: 'T',
      content: 'C',
      material_type: 'recommendation',
    })
    expect(mockedHttp.post).toHaveBeenCalledWith('/cabinet/client-materials/', {
      client_record_id: 22,
      title: 'T',
      content: 'C',
      material_type: 'recommendation',
    })
    expect(material.url).toBeNull()
  })

  it('creates specialist material via client_id scope', async () => {
    mockedHttp.post.mockResolvedValue({
      data: {
        id: 2,
        client_record_id: 99,
        session_id: null,
        status: 'draft',
        material_type: 'recommendation',
        title: 'T2',
        content: 'C2',
        content_preview: 'C2',
        url: null,
        published_at: null,
        revoked_at: null,
        created_at: '2026-04-30T00:00:00Z',
        updated_at: '2026-04-30T00:00:00Z',
      },
    } as any)
    await createSpecialistClientMaterial({
      client_id: 44,
      title: 'T2',
      content: 'C2',
      material_type: 'recommendation',
    })
    expect(mockedHttp.post).toHaveBeenCalledWith('/cabinet/client-materials/', {
      client_id: 44,
      title: 'T2',
      content: 'C2',
      material_type: 'recommendation',
    })
  })

  it('calls publish/revoke specialist actions', async () => {
    mockedHttp.post.mockResolvedValue({ data: {} } as any)
    await publishSpecialistClientMaterial(5)
    await revokeSpecialistClientMaterial(5)
    expect(mockedHttp.post).toHaveBeenNthCalledWith(1, '/cabinet/client-materials/5/publish/', {})
    expect(mockedHttp.post).toHaveBeenNthCalledWith(2, '/cabinet/client-materials/5/revoke/', {})
  })

  it('reads client materials cursor pagination and normalizes url', async () => {
    mockedHttp.get.mockResolvedValue({
      data: {
        results: [
          {
            id: 9,
            session_id: null,
            material_type: 'link',
            title: 'L',
            content: 'C',
            content_preview: 'C',
            url: '',
            published_at: '2026-04-30T00:00:00Z',
          },
        ],
        next_cursor: 'abc',
      },
    } as any)
    const payload = await fetchClientMaterials('c1', 11)
    expect(mockedHttp.get).toHaveBeenCalledWith('/client/materials/', {
      params: { cursor: 'c1', session_id: 11 },
    })
    expect(payload.results[0]?.url).toBeNull()
    expect(payload.next_cursor).toBe('abc')
  })

  it('hasMaterialUrl handles empty and null url', () => {
    expect(hasMaterialUrl({ url: '' })).toBe(false)
    expect(hasMaterialUrl({ url: null })).toBe(false)
    expect(hasMaterialUrl({ url: ' https://example.com ' })).toBe(true)
  })
})
