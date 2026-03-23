import { fireEvent, render, screen, waitFor } from '@testing-library/vue'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { fetchPublicSpecialists } from '../lib/api'
import PublicTherapistsView from './PublicTherapistsView.vue'

vi.mock('../lib/api', () => ({
  fetchPublicSpecialists: vi.fn(),
}))

const mockedFetchPublicSpecialists = vi.mocked(fetchPublicSpecialists)

async function flushPromises() {
  await new Promise((resolve) => setTimeout(resolve, 0))
}

function renderView() {
  return render(PublicTherapistsView, {
    global: {
      stubs: {
        RouterLink: {
          props: ['to'],
          template: '<a :href="typeof to === \'string\' ? to : \'\'"><slot /></a>',
        },
      },
    },
  })
}

describe('PublicTherapistsView', () => {
  beforeEach(() => {
    mockedFetchPublicSpecialists.mockReset()
  })

  it('renders the empty state action slot when the catalog is empty', async () => {
    mockedFetchPublicSpecialists.mockResolvedValue({
      results: [],
      page: 1,
      page_size: 12,
      total: 0,
      total_pages: 1,
    })

    renderView()

    await flushPromises()
    expect(screen.getByText('Нічого не знайдено')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Скинути фільтри' })).toBeInTheDocument()
    expect(screen.queryByText(/Сторінка 1 з 1/i)).not.toBeInTheDocument()
  })

  it('renders an explicit error state and retries without falling back to empty copy', async () => {
    mockedFetchPublicSpecialists
      .mockRejectedValueOnce(new Error('catalog failed'))
      .mockResolvedValueOnce({
        results: [
          {
            therapist_id: 12,
            public_slug: 'olena',
            display_name: 'Olena Marchenko',
            languages: ['Українська'],
          } as any,
        ],
        page: 1,
        page_size: 12,
        total: 1,
        total_pages: 1,
      })

    renderView()

    expect(await screen.findByText('Не вдалося завантажити каталог')).toBeInTheDocument()
    expect(screen.queryByText('Нічого не знайдено')).not.toBeInTheDocument()

    await fireEvent.click(screen.getByRole('button', { name: 'Спробувати ще раз' }))

    expect(await screen.findByText('Olena M.')).toBeInTheDocument()
    await waitFor(() => {
      expect(screen.queryByText('Не вдалося завантажити каталог')).not.toBeInTheDocument()
    })
  })

  it('shows completed sessions badge only for specialists with 50+ completed sessions', async () => {
    mockedFetchPublicSpecialists.mockResolvedValue({
      results: [
        {
          therapist_id: 1,
          public_slug: 'below-threshold',
          display_name: 'Ira Bondar',
          completed_sessions_count: 34,
        },
        {
          therapist_id: 2,
          public_slug: 'first-bucket',
          display_name: 'Marta Kovalenko',
          completed_sessions_count: 50,
        },
        {
          therapist_id: 3,
          public_slug: 'top-bucket',
          display_name: 'Dmytro Lysenko',
          completed_sessions_count: 1200,
        },
      ],
      page: 1,
      page_size: 12,
      total: 3,
      total_pages: 1,
    })

    renderView()

    expect(await screen.findByText('Marta K.')).toBeInTheDocument()
    expect(screen.queryByText('34+ сесій')).not.toBeInTheDocument()
    expect(screen.getByText('50+ сесій')).toBeInTheDocument()
    expect(screen.getByText('1000+ сесій')).toBeInTheDocument()
  })

  it('sends offers_online=1 when online filter is enabled', async () => {
    mockedFetchPublicSpecialists.mockResolvedValue({
      results: [],
      page: 1,
      page_size: 12,
      total: 0,
      total_pages: 1,
    })

    renderView()
    await flushPromises()

    await fireEvent.click(screen.getByLabelText('Онлайн'))

    await waitFor(() => {
      expect(mockedFetchPublicSpecialists.mock.calls.length).toBeGreaterThan(1)
    })
    const lastParams = mockedFetchPublicSpecialists.mock.calls.at(-1)?.[0] as Record<string, unknown>
    expect(lastParams.offers_online).toBe('1')
    expect(lastParams.offers_offline).toBeUndefined()
  })

  it('sends offers_offline=1 when offline filter is enabled', async () => {
    mockedFetchPublicSpecialists.mockResolvedValue({
      results: [],
      page: 1,
      page_size: 12,
      total: 0,
      total_pages: 1,
    })

    renderView()
    await flushPromises()

    await fireEvent.click(screen.getByLabelText('Офлайн'))

    await waitFor(() => {
      expect(mockedFetchPublicSpecialists.mock.calls.length).toBeGreaterThan(1)
    })
    const lastParams = mockedFetchPublicSpecialists.mock.calls.at(-1)?.[0] as Record<string, unknown>
    expect(lastParams.offers_online).toBeUndefined()
    expect(lastParams.offers_offline).toBe('1')
  })

  it('sends both offers_online=1 and offers_offline=1 when both filters are enabled', async () => {
    mockedFetchPublicSpecialists.mockResolvedValue({
      results: [],
      page: 1,
      page_size: 12,
      total: 0,
      total_pages: 1,
    })

    renderView()
    await flushPromises()

    await fireEvent.click(screen.getByLabelText('Онлайн'))
    await fireEvent.click(screen.getByLabelText('Офлайн'))

    await waitFor(() => {
      expect(mockedFetchPublicSpecialists.mock.calls.length).toBeGreaterThan(2)
    })
    const lastParams = mockedFetchPublicSpecialists.mock.calls.at(-1)?.[0] as Record<string, unknown>
    expect(lastParams.offers_online).toBe('1')
    expect(lastParams.offers_offline).toBe('1')
  })

  it('renders online and offline badges on specialist cards', async () => {
    mockedFetchPublicSpecialists.mockResolvedValue({
      results: [
        {
          therapist_id: 10,
          public_slug: 'online-only',
          display_name: 'Olena Petrenko',
          offers_online: true,
          offers_offline: false,
        },
        {
          therapist_id: 11,
          public_slug: 'offline-only',
          display_name: 'Ira Bondar',
          offers_online: false,
          offers_offline: true,
        },
        {
          therapist_id: 12,
          public_slug: 'both',
          display_name: 'Marta Lysenko',
          offers_online: true,
          offers_offline: true,
        },
      ],
      page: 1,
      page_size: 12,
      total: 3,
      total_pages: 1,
    })

    renderView()

    const onlineOnlyCard = (await screen.findByText('Olena P.')).closest('.therapist-card')
    const offlineOnlyCard = screen.getByText('Ira B.').closest('.therapist-card')
    const bothCard = screen.getByText('Marta L.').closest('.therapist-card')

    expect(onlineOnlyCard).toHaveTextContent('Онлайн')
    expect(onlineOnlyCard).not.toHaveTextContent('Офлайн')
    expect(offlineOnlyCard).not.toHaveTextContent('Онлайн')
    expect(offlineOnlyCard).toHaveTextContent('Офлайн')
    expect(bothCard).toHaveTextContent('Онлайн')
    expect(bothCard).toHaveTextContent('Офлайн')
  })
})
