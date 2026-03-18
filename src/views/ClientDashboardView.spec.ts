import { render, screen, within } from '@testing-library/vue'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { apiGet, fetchPublicSpecialistProfile } from '../lib/api'
import ClientDashboardView from './ClientDashboardView.vue'

vi.mock('../lib/api', () => ({
  apiGet: vi.fn(),
  fetchPublicSpecialistProfile: vi.fn(),
}))

vi.mock('../composables/useConfirmModal', () => ({
  useConfirmModal: () => ({
    open: false,
    title: '',
    message: '',
    confirmText: '',
    cancelText: '',
    tone: 'default',
    confirm: vi.fn(),
    closeConfirm: vi.fn(),
    openConfirm: vi.fn(),
  }),
}))

const mockedApiGet = vi.mocked(apiGet)
const mockedFetchPublicSpecialistProfile = vi.mocked(fetchPublicSpecialistProfile)

async function flushPromises() {
  await new Promise((resolve) => setTimeout(resolve, 0))
}

function renderView() {
  return render(ClientDashboardView, {
    global: {
      stubs: {
        ConfirmModal: true,
        RouterLink: {
          props: ['to'],
          template: '<a :href="typeof to === \'string\' ? to : \'\'"><slot /></a>',
        },
      },
    },
  })
}

describe('ClientDashboardView', () => {
  beforeEach(() => {
    mockedApiGet.mockReset()
    mockedFetchPublicSpecialistProfile.mockReset()
    localStorage.clear()
  })

  it('shows join actions for upcoming online sessions when the payload has an external meeting link', async () => {
    mockedApiGet.mockImplementation(async (url, config) => {
      if (url === '/booking/sessions/' && config?.params?.upcoming === true) {
        return [
          {
            id: 88,
            status: 'CONFIRMED',
            specialist: 14,
            therapist_name: 'Олена',
            therapist_public_slug: 'olena',
            meeting_url: 'https://meet.google.com/room-123',
            meeting_provider: 'google_meet',
            slot: null,
            slot_start_at: '2099-06-15T10:00:00Z',
            slot_end_at: '2099-06-15T11:00:00Z',
          },
        ]
      }
      if (url === '/booking/sessions/' && config?.params?.upcoming === false) {
        return []
      }
      if (url === '/booking/group-events/') {
        return []
      }
      throw new Error(`Unexpected apiGet call: ${url} ${JSON.stringify(config)}`)
    })

    const view = renderView()

    expect(await screen.findAllByText('Онлайн-зустріч: Google Meet')).not.toHaveLength(0)
    expect(screen.getAllByRole('link', { name: 'Приєднатися' })).toHaveLength(2)
    expect(screen.getAllByRole('link', { name: 'Приєднатися' })[0]).toHaveAttribute(
      'href',
      'https://meet.google.com/room-123'
    )
  })

  it('prioritizes a live session card and keeps direct join as primary CTA', async () => {
    mockedApiGet.mockImplementation(async (url, config) => {
      if (url === '/booking/sessions/' && config?.params?.upcoming === true) {
        return [
          {
            id: 101,
            status: 'CONFIRMED',
            specialist: 14,
            specialist_name: 'Олена',
            specialist_public_slug: 'olena',
            meeting_url: 'https://meet.google.com/live-room',
            meeting_provider: 'google_meet',
            join_available: true,
            join_starts_at: '2000-01-01T00:00:00Z',
            join_ends_at: '2100-01-01T00:00:00Z',
            slot: null,
            slot_start_at: '2099-06-15T10:00:00Z',
            slot_end_at: '2099-06-15T11:00:00Z',
          },
          {
            id: 102,
            status: 'CONFIRMED',
            specialist: 15,
            specialist_name: 'Іван',
            specialist_public_slug: 'ivan',
            meeting_url: 'https://meet.google.com/next-room',
            meeting_provider: 'google_meet',
            join_available: true,
            join_starts_at: '2099-06-16T09:00:00Z',
            join_ends_at: '2099-06-16T10:00:00Z',
            slot: null,
            slot_start_at: '2099-06-16T09:00:00Z',
            slot_end_at: '2099-06-16T10:00:00Z',
          },
        ]
      }
      if (url === '/booking/sessions/' && config?.params?.upcoming === false) {
        return []
      }
      if (url === '/booking/group-events/') {
        return []
      }
      throw new Error(`Unexpected apiGet call: ${url} ${JSON.stringify(config)}`)
    })

    const view = renderView()

    expect(await screen.findByRole('link', { name: 'Сесія триває' })).toHaveAttribute(
      'href',
      '/client/sessions/101'
    )

    const priorityCard = view.container.querySelector('.priority-card')
    expect(priorityCard).toBeInTheDocument()
    expect(within(priorityCard as HTMLElement).getByRole('link', { name: 'Приєднатися' })).toHaveAttribute(
      'href',
      'https://meet.google.com/live-room'
    )
    expect(within(priorityCard as HTMLElement).getByRole('link', { name: 'Профіль спеціаліста' })).toHaveAttribute(
      'href',
      '/specialist/olena'
    )
  })

  it('keeps live marker when active confirmed session is returned in past list', async () => {
    mockedApiGet.mockImplementation(async (url, config) => {
      if (url === '/booking/sessions/' && config?.params?.upcoming === true) {
        return []
      }
      if (url === '/booking/sessions/' && config?.params?.upcoming === false) {
        return [
          {
            id: 201,
            status: 'CONFIRMED',
            specialist: 14,
            specialist_name: 'Олена',
            specialist_public_slug: 'olena',
            meeting_url: 'https://meet.google.com/live-from-past',
            meeting_provider: 'google_meet',
            join_available: true,
            join_starts_at: '2000-01-01T00:00:00Z',
            join_ends_at: '2100-01-01T00:00:00Z',
            slot: null,
            slot_start_at: '2099-06-15T10:00:00Z',
            slot_end_at: '2099-06-15T11:00:00Z',
          },
        ]
      }
      if (url === '/booking/group-events/') {
        return []
      }
      throw new Error(`Unexpected apiGet call: ${url} ${JSON.stringify(config)}`)
    })

    renderView()

    expect(await screen.findByRole('link', { name: 'Сесія триває' })).toHaveAttribute(
      'href',
      '/client/sessions/201'
    )
    expect(screen.getByRole('link', { name: 'Приєднатися' })).toHaveAttribute(
      'href',
      'https://meet.google.com/live-from-past'
    )
  })

  it('shows live marker for scheduled in-progress session', async () => {
    mockedApiGet.mockImplementation(async (url, config) => {
      if (url === '/booking/sessions/' && config?.params?.upcoming === true) {
        return []
      }
      if (url === '/booking/sessions/' && config?.params?.upcoming === false) {
        return [
          {
            id: 202,
            status: 'SCHEDULED',
            specialist: 14,
            specialist_name: 'Олена',
            specialist_public_slug: 'olena',
            meeting_url: null,
            meeting_provider: null,
            join_available: false,
            slot: null,
            slot_start_at: '2000-01-01T00:00:00Z',
            slot_end_at: '2100-01-01T00:00:00Z',
          },
        ]
      }
      if (url === '/booking/group-events/') {
        return []
      }
      throw new Error(`Unexpected apiGet call: ${url} ${JSON.stringify(config)}`)
    })

    renderView()

    expect(await screen.findByRole('link', { name: 'Сесія триває' })).toHaveAttribute(
      'href',
      '/client/sessions/202'
    )
  })

  it('renders explicit error states for the priority, sessions, and group-events sections', async () => {
    mockedApiGet.mockRejectedValue(new Error('dashboard failed'))

    renderView()

    expect(await screen.findByText('Не вдалося завантажити найближчу сесію')).toBeInTheDocument()
    expect(screen.getByText('Не вдалося завантажити заплановані сесії')).toBeInTheDocument()
    expect(screen.getByText('Не вдалося завантажити історію сесій')).toBeInTheDocument()
    expect(screen.getByText('Не вдалося завантажити групові події')).toBeInTheDocument()
    expect(screen.queryByText('Немає майбутніх сесій.')).not.toBeInTheDocument()
  })

  it('renders explicit empty states when sessions and group events are absent', async () => {
    mockedApiGet.mockImplementation(async (url, config) => {
      if (url === '/booking/sessions/') {
        return []
      }
      if (url === '/booking/group-events/') {
        return []
      }
      throw new Error(`Unexpected apiGet call: ${url} ${JSON.stringify(config)}`)
    })

    renderView()

    await flushPromises()
    await flushPromises()
    expect(screen.getByText('Майбутніх сесій поки немає')).toBeInTheDocument()
    expect(screen.getByText('Запланованих сесій поки немає')).toBeInTheDocument()
    expect(screen.getByText('Історія сесій поки порожня')).toBeInTheDocument()
    expect(screen.getByText('Групових подій поки немає')).toBeInTheDocument()
  })

  it('renders the backend-mapped sessions error description from code fields', async () => {
    mockedApiGet.mockImplementation(async (url) => {
      if (url === '/booking/sessions/') {
        throw {
          response: {
            status: 403,
            data: {
              code: 'OVER_LIMIT',
              detail: 'Action unavailable due to plan limits.',
            },
          },
        }
      }

      if (url === '/booking/group-events/') {
        return []
      }

      throw new Error(`Unexpected apiGet call: ${url}`)
    })

    renderView()

    expect(
      await screen.findAllByText('Дія недоступна через обмеження плану. Перевірте доступ у Billing.')
    ).toHaveLength(3)
  })
})


