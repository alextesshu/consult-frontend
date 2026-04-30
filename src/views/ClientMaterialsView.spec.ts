import { fireEvent, render, screen, waitFor, within } from '@testing-library/vue'
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

  it('renders visible destination URL and safe open-link attributes', async () => {
    mockedFetchClientMaterials.mockResolvedValue({
      results: [
        {
          id: 1,
          session_id: 77,
          material_type: 'link',
          title: 'Матеріал 1',
          content: 'Текст 1',
          content_preview: 'Текст 1',
          url: 'https://kendo.com.ua',
          published_at: '2026-04-30T09:00:00Z',
        },
      ],
      next_cursor: null,
    } as any)

    const { container } = render(ClientMaterialsView)
    expect(await screen.findByText('Матеріал 1')).toBeInTheDocument()
    expect(screen.getByText('Пов’язано із сесією #77')).toBeInTheDocument()

    const card = container.querySelector('.client-material-card') as HTMLElement
    const urlNode = card.querySelector('.client-material-card__link-value') as HTMLElement
    expect(urlNode).toBeTruthy()
    expect(urlNode.textContent).toBe('https://kendo.com.ua')
    expect(urlNode.getAttribute('title')).toBe('https://kendo.com.ua')

    const link = within(card).getByRole('link', { name: 'Відкрити посилання' })
    expect(link.getAttribute('href')).toBe('https://kendo.com.ua')
    expect(link.getAttribute('target')).toBe('_blank')
    expect(link.getAttribute('rel')).toBe('noopener noreferrer')
  })

  it('keeps long URL in title attribute for truncated display', async () => {
    const longUrl = 'https://example.com/very/long/path/for/materials/testing/with/query?utm_source=client&ref=abc123'
    mockedFetchClientMaterials.mockResolvedValue({
      results: [
        {
          id: 2,
          session_id: null,
          material_type: 'link',
          title: 'Long URL',
          content: 'Body',
          content_preview: 'Body',
          url: longUrl,
          published_at: '2026-04-30T10:00:00Z',
        },
      ],
      next_cursor: null,
    } as any)

    const { container } = render(ClientMaterialsView)
    await screen.findByText('Long URL')
    const urlNode = container.querySelector('.client-material-card__link-value') as HTMLElement
    expect(urlNode).toBeTruthy()
    expect(urlNode.getAttribute('title')).toBe(longUrl)
    expect(urlNode.textContent).toBe(longUrl)
  })

  it('does not render URL block or link button when url is missing', async () => {
    mockedFetchClientMaterials.mockResolvedValue({
      results: [
        {
          id: 3,
          session_id: null,
          material_type: 'recommendation',
          title: 'No URL',
          content: 'Body',
          content_preview: 'Body',
          url: null,
          published_at: '2026-04-30T10:00:00Z',
        },
      ],
      next_cursor: null,
    } as any)

    const { container } = render(ClientMaterialsView)
    await screen.findByText('No URL')
    expect(container.querySelector('.client-material-card__link-block')).toBeFalsy()
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
