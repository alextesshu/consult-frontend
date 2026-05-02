import { beforeEach, describe, expect, it, vi } from 'vitest'
import { http } from './http'
import {
  createSpecialistClientMaterial,
  deleteClientMaterialAttachment,
  fetchClientMaterialDetail,
  fetchClientMaterials,
  getClientMaterialAttachmentDownloadUrl,
  fetchSpecialistClientMaterials,
  hasMaterialUrl,
  listClientMaterialAttachments,
  publishSpecialistClientMaterial,
  revokeSpecialistClientMaterial,
  uploadClientMaterialAttachment,
} from './api'

vi.mock('./http', () => ({
  http: {
    get: vi.fn(),
    post: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn(),
  },
}))

const mockedHttp = {
  get: vi.mocked(http.get),
  post: vi.mocked(http.post),
  patch: vi.mocked(http.patch),
  delete: vi.mocked(http.delete),
}

describe('client materials api', () => {
  beforeEach(() => {
    mockedHttp.get.mockReset()
    mockedHttp.post.mockReset()
    mockedHttp.patch.mockReset()
    mockedHttp.delete.mockReset()
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

  it('lists specialist attachments by material', async () => {
    mockedHttp.get.mockResolvedValue({
      data: [{ id: 1, original_filename: 'exercise.pdf', mime_type: 'application/pdf', size_bytes: 245000, created_at: '2026-05-01T00:00:00Z' }],
    } as any)
    const result = await listClientMaterialAttachments(10)
    expect(mockedHttp.get).toHaveBeenCalledWith('/cabinet/client-materials/10/attachments/')
    expect(result[0]?.mime_type).toBe('application/pdf')
    expect((result[0] as any).content_type).toBeUndefined()
  })

  it('uploads specialist attachment with FormData field file', async () => {
    mockedHttp.post.mockResolvedValue({
      data: { id: 1, original_filename: 'exercise.pdf', mime_type: 'application/pdf', size_bytes: 245000, created_at: '2026-05-01T00:00:00Z' },
    } as any)
    const file = new File(['test'], 'exercise.pdf', { type: 'application/pdf' })
    await uploadClientMaterialAttachment(10, file)
    const call = mockedHttp.post.mock.calls[0]
    expect(call?.[0]).toBe('/cabinet/client-materials/10/attachments/')
    expect(call?.[1]).toBeInstanceOf(FormData)
    const body = call?.[1] as FormData
    expect(body.get('file')).toBe(file)
  })

  it('deletes specialist attachment', async () => {
    mockedHttp.delete.mockResolvedValue({} as any)
    await deleteClientMaterialAttachment(10, 7)
    expect(mockedHttp.delete).toHaveBeenCalledWith('/cabinet/client-materials/10/attachments/7/')
  })

  it('parses client material detail attachments metadata without signed url fields', async () => {
    mockedHttp.get.mockResolvedValue({
      data: {
        id: 10,
        session_id: null,
        material_type: 'document',
        title: 'Домашнє завдання',
        content: '...',
        content_preview: '...',
        url: null,
        published_at: '2026-05-01T00:00:00Z',
        attachments: [
          { id: 1, original_filename: 'exercise.pdf', mime_type: 'application/pdf', size_bytes: 245000, created_at: '2026-05-01T00:00:00Z' },
        ],
      },
    } as any)
    const detail = await fetchClientMaterialDetail(10)
    expect(detail.attachments?.[0]?.mime_type).toBe('application/pdf')
    expect((detail.attachments?.[0] as any)?.content_type).toBeUndefined()
    expect((detail.attachments?.[0] as any)?.file_url).toBeUndefined()
    expect((detail.attachments?.[0] as any)?.blob_name).toBeUndefined()
    expect((detail as any).download_url).toBeUndefined()
  })

  it('gets client attachment download url only from download endpoint', async () => {
    mockedHttp.get.mockResolvedValue({ data: { download_url: 'https://signed-url' } } as any)
    const payload = await getClientMaterialAttachmentDownloadUrl(10, 1)
    expect(mockedHttp.get).toHaveBeenCalledWith('/client/materials/10/attachments/1/download/')
    expect(payload.download_url).toBe('https://signed-url')
  })
})
