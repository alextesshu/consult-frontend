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
})
