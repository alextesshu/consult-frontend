import { fireEvent, render, screen, waitFor } from '@testing-library/vue'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { fetchPublicSpecialists } from '../lib/api'
import ClientTherapistsView from './ClientTherapistsView.vue'

vi.mock('../lib/api', () => ({
  fetchPublicSpecialists: vi.fn(),
}))

const mockedFetchPublicSpecialists = vi.mocked(fetchPublicSpecialists)

async function flushPromises() {
  await new Promise((resolve) => setTimeout(resolve, 0))
}

function renderView() {
  return render(ClientTherapistsView, {
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

describe('ClientTherapistsView', () => {
  beforeEach(() => {
    mockedFetchPublicSpecialists.mockReset()
  })

  it('renders an explicit empty state with a search entrypoint', async () => {
    mockedFetchPublicSpecialists.mockResolvedValue({
      results: [],
      page: 1,
      page_size: 12,
      total: 0,
      total_pages: 1,
    })

    renderView()

    await flushPromises()
    expect(screen.getByText('Ще немає активних спеціалістів')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Знайти профіль спеціаліста' })).toHaveAttribute('href', '/specialists')
  })

  it('renders an explicit error state and retries the specialist list', async () => {
    mockedFetchPublicSpecialists
      .mockRejectedValueOnce(new Error('list failed'))
      .mockResolvedValueOnce({
        results: [
          {
            therapist_id: 18,
            public_slug: 'anna',
            display_name: 'Anna Koval',
            languages: ['Українська'],
          } as any,
        ],
        page: 1,
        page_size: 12,
        total: 1,
        total_pages: 1,
      })

    renderView()

    expect(await screen.findByText('Не вдалося завантажити список спеціалістів')).toBeInTheDocument()

    await fireEvent.click(screen.getByRole('button', { name: 'Спробувати ще раз' }))

    expect(await screen.findByText('Anna K.')).toBeInTheDocument()
    await waitFor(() => {
      expect(screen.queryByText('Не вдалося завантажити список спеціалістів')).not.toBeInTheDocument()
    })
  })
})
