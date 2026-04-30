import { fireEvent, render, screen, waitFor } from '@testing-library/vue'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import ClientMaterialsView from './ClientMaterialsView.vue'
import { fetchClientMaterials } from '../lib/api'

vi.mock('../lib/api', async () => {
  const actual = await vi.importActual<typeof import('../lib/api')>('../lib/api')
  return {
    ...actual,
    fetchClientMaterials: vi.fn(),
  }
})

const mockedFetchClientMaterials = vi.mocked(fetchClientMaterials)

describe('ClientMaterialsView', () => {
  beforeEach(() => {
    mockedFetchClientMaterials.mockReset()
  })

  it('renders empty state', async () => {
    mockedFetchClientMaterials.mockResolvedValue({ results: [], next_cursor: null })
    const { container } = render(ClientMaterialsView)
    await waitFor(() => {
      expect(container.querySelector('.empty-state')).toBeTruthy()
    })
  })

  it('renders published materials and hides link button for empty url', async () => {
    mockedFetchClientMaterials.mockResolvedValue({
      results: [
        {
          id: 1,
          session_id: 77,
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
    expect(screen.getByText('Пов’язано із сесією #77')).toBeInTheDocument()
    expect(screen.queryByRole('link', { name: 'Відкрити посилання' })).not.toBeInTheDocument()
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
