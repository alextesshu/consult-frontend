import { fireEvent, render, screen, waitFor } from '@testing-library/vue'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import ClientMaterialsView from './ClientMaterialsView.vue'
import {
  fetchClientMaterialDetail,
  fetchClientMaterials,
  getClientMaterialAttachmentDownloadUrl,
} from '../lib/api'

vi.mock('../lib/api', async () => {
  const actual = await vi.importActual<typeof import('../lib/api')>('../lib/api')
  return {
    ...actual,
    fetchClientMaterials: vi.fn(),
    fetchClientMaterialDetail: vi.fn(),
    getClientMaterialAttachmentDownloadUrl: vi.fn(),
  }
})

const mockedFetchClientMaterials = vi.mocked(fetchClientMaterials)
const mockedFetchClientMaterialDetail = vi.mocked(fetchClientMaterialDetail)
const mockedGetClientMaterialAttachmentDownloadUrl = vi.mocked(getClientMaterialAttachmentDownloadUrl)

describe('ClientMaterialsView', () => {
  beforeEach(() => {
    mockedFetchClientMaterials.mockReset()
    mockedFetchClientMaterialDetail.mockReset()
    mockedGetClientMaterialAttachmentDownloadUrl.mockReset()
    vi.spyOn(window, 'open').mockImplementation(() => null)
  })

  it('renders empty state', async () => {
    mockedFetchClientMaterials.mockResolvedValue({ results: [], next_cursor: null })
    const { container } = render(ClientMaterialsView)
    await waitFor(() => {
      expect(container.querySelector('.empty-state')).toBeTruthy()
    })
  })

  it('client material list does not require attachments', async () => {
    mockedFetchClientMaterials.mockResolvedValue({
      results: [
        {
          id: 1,
          session_id: null,
          material_type: 'recommendation',
          title: 'Матеріал 1',
          content: 'Текст 1',
          content_preview: 'Текст 1',
          url: null,
          published_at: '2026-04-30T09:00:00Z',
        },
      ],
      next_cursor: null,
    } as any)

    render(ClientMaterialsView)
    expect(await screen.findByText('Матеріал 1')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Переглянути матеріал' })).toBeInTheDocument()
  })

  it('fetches material detail before rendering attachments', async () => {
    mockedFetchClientMaterials.mockResolvedValue({
      results: [
        {
          id: 10,
          session_id: null,
          material_type: 'document',
          title: 'Домашнє завдання',
          content: '...',
          content_preview: '...',
          url: null,
          published_at: '2026-05-01T00:00:00Z',
        },
      ],
      next_cursor: null,
    } as any)
    mockedFetchClientMaterialDetail.mockResolvedValue({
      id: 10,
      session_id: null,
      material_type: 'document',
      title: 'Домашнє завдання',
      content: '...',
      content_preview: '...',
      url: null,
      published_at: '2026-05-01T00:00:00Z',
      attachments: [
        {
          id: 1,
          original_filename: 'exercise.pdf',
          mime_type: 'application/pdf',
          size_bytes: 245000,
          created_at: '2026-05-01T00:00:00Z',
        },
      ],
    } as any)

    render(ClientMaterialsView)
    await fireEvent.click(await screen.findByRole('button', { name: 'Переглянути матеріал' }))

    await waitFor(() => {
      expect(mockedFetchClientMaterialDetail).toHaveBeenCalledWith(10)
      expect(screen.getByText('exercise.pdf')).toBeInTheDocument()
      expect(screen.getByRole('button', { name: 'Завантажити файл' })).toBeInTheDocument()
    })
  })

  it('calls download endpoint and opens returned signed url safely', async () => {
    mockedFetchClientMaterials.mockResolvedValue({
      results: [
        {
          id: 10,
          session_id: null,
          material_type: 'document',
          title: 'Домашнє завдання',
          content: '...',
          content_preview: '...',
          url: null,
          published_at: '2026-05-01T00:00:00Z',
        },
      ],
      next_cursor: null,
    } as any)
    mockedFetchClientMaterialDetail.mockResolvedValue({
      id: 10,
      session_id: null,
      material_type: 'document',
      title: 'Домашнє завдання',
      content: '...',
      content_preview: '...',
      url: null,
      published_at: '2026-05-01T00:00:00Z',
      attachments: [
        {
          id: 1,
          original_filename: 'exercise.pdf',
          mime_type: 'application/pdf',
          size_bytes: 245000,
          created_at: '2026-05-01T00:00:00Z',
        },
      ],
    } as any)
    mockedGetClientMaterialAttachmentDownloadUrl.mockResolvedValue({ download_url: 'https://signed-url' })

    render(ClientMaterialsView)
    await fireEvent.click(await screen.findByRole('button', { name: 'Переглянути матеріал' }))
    await fireEvent.click(await screen.findByRole('button', { name: 'Завантажити файл' }))

    expect(mockedGetClientMaterialAttachmentDownloadUrl).toHaveBeenCalledWith(10, 1)
    expect(window.open).toHaveBeenCalledWith('https://signed-url', '_blank', 'noopener,noreferrer')
  })

  it('does not render raw signed URL visibly', async () => {
    mockedFetchClientMaterials.mockResolvedValue({
      results: [
        {
          id: 10,
          session_id: null,
          material_type: 'document',
          title: 'Домашнє завдання',
          content: '...',
          content_preview: '...',
          url: null,
          published_at: '2026-05-01T00:00:00Z',
        },
      ],
      next_cursor: null,
    } as any)
    mockedFetchClientMaterialDetail.mockResolvedValue({
      id: 10,
      session_id: null,
      material_type: 'document',
      title: 'Домашнє завдання',
      content: '...',
      content_preview: '...',
      url: null,
      published_at: '2026-05-01T00:00:00Z',
      attachments: [],
    } as any)

    const { container } = render(ClientMaterialsView)
    await fireEvent.click(await screen.findByRole('button', { name: 'Переглянути матеріал' }))
    expect(container.textContent || '').not.toContain('https://signed-url')
  })

  it('shows Ukrainian error when download endpoint fails', async () => {
    mockedFetchClientMaterials.mockResolvedValue({
      results: [
        {
          id: 10,
          session_id: null,
          material_type: 'document',
          title: 'Домашнє завдання',
          content: '...',
          content_preview: '...',
          url: null,
          published_at: '2026-05-01T00:00:00Z',
        },
      ],
      next_cursor: null,
    } as any)
    mockedFetchClientMaterialDetail.mockResolvedValue({
      id: 10,
      session_id: null,
      material_type: 'document',
      title: 'Домашнє завдання',
      content: '...',
      content_preview: '...',
      url: null,
      published_at: '2026-05-01T00:00:00Z',
      attachments: [
        {
          id: 1,
          original_filename: 'exercise.pdf',
          mime_type: 'application/pdf',
          size_bytes: 245000,
          created_at: '2026-05-01T00:00:00Z',
        },
      ],
    } as any)
    mockedGetClientMaterialAttachmentDownloadUrl.mockRejectedValue({
      response: { data: { code: 'ATTACHMENT_DOWNLOAD_UNAVAILABLE' } },
    })

    render(ClientMaterialsView)
    await fireEvent.click(await screen.findByRole('button', { name: 'Переглянути матеріал' }))
    await fireEvent.click(await screen.findByRole('button', { name: 'Завантажити файл' }))

    expect(await screen.findByText('Не вдалося підготувати посилання для завантаження. Спробуйте пізніше.')).toBeInTheDocument()
  })

  it('does not show attachments for material detail without attachments', async () => {
    mockedFetchClientMaterials.mockResolvedValue({
      results: [
        {
          id: 10,
          session_id: null,
          material_type: 'document',
          title: 'Домашнє завдання',
          content: '...',
          content_preview: '...',
          url: null,
          published_at: '2026-05-01T00:00:00Z',
        },
      ],
      next_cursor: null,
    } as any)
    mockedFetchClientMaterialDetail.mockResolvedValue({
      id: 10,
      session_id: null,
      material_type: 'document',
      title: 'Домашнє завдання',
      content: '...',
      content_preview: '...',
      url: null,
      published_at: '2026-05-01T00:00:00Z',
      attachments: [],
    } as any)

    render(ClientMaterialsView)
    await fireEvent.click(await screen.findByRole('button', { name: 'Переглянути матеріал' }))
    expect(await screen.findByText('До цього матеріалу немає прикріплених файлів.')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Завантажити файл' })).not.toBeInTheDocument()
  })

  it('loads next page when next_cursor exists', async () => {
    mockedFetchClientMaterials
      .mockResolvedValueOnce({
        results: [
          {
            id: 1,
            session_id: null,
            material_type: 'link',
            title: 'Перший',
            content: 'A',
            content_preview: 'A',
            url: 'https://example.com/1',
            published_at: '2026-04-30T09:00:00Z',
          },
        ],
        next_cursor: 'cursor-2',
      } as any)
      .mockResolvedValueOnce({
        results: [
          {
            id: 2,
            session_id: null,
            material_type: 'document',
            title: 'Другий',
            content: 'B',
            content_preview: 'B',
            url: null,
            published_at: '2026-04-30T10:00:00Z',
          },
        ],
        next_cursor: null,
      } as any)

    render(ClientMaterialsView)
    expect(await screen.findByText('Перший')).toBeInTheDocument()
    await fireEvent.click(screen.getByRole('button', { name: 'Показати ще' }))
    await waitFor(() => {
      expect(screen.getByText('Другий')).toBeInTheDocument()
    })
    expect(mockedFetchClientMaterials).toHaveBeenNthCalledWith(1)
    expect(mockedFetchClientMaterials).toHaveBeenNthCalledWith(2, 'cursor-2')
  })
})


