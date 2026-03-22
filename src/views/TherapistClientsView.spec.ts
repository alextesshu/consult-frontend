import { fireEvent, render, waitFor, within } from '@testing-library/vue'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { apiGet, apiPatch } from '../lib/api'
import TherapistClientsView from './TherapistClientsView.vue'

vi.mock('../lib/api', () => ({
  apiGet: vi.fn(),
  apiPatch: vi.fn(),
}))

const mockedApiGet = vi.mocked(apiGet)
const mockedApiPatch = vi.mocked(apiPatch)

function renderView() {
  return render(TherapistClientsView, {
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

function deferred<T>() {
  let resolve!: (value: T) => void
  const promise = new Promise<T>((res) => {
    resolve = res
  })
  return { promise, resolve }
}

function getPanels(container: HTMLElement) {
  const remindersPanel = container.querySelector('.panel--reminders') as HTMLElement
  const panelList = container.querySelectorAll('.panel')
  const clientsPanel = panelList[1] as HTMLElement
  return { remindersPanel, clientsPanel }
}

describe('TherapistClientsView', () => {
  beforeEach(() => {
    mockedApiGet.mockReset()
    mockedApiPatch.mockReset()
  })

  it('shows loading state while clients list is pending', async () => {
    const clientsDeferred = deferred<any[]>()
    mockedApiGet.mockImplementation(async (url) => {
      if (url === '/cabinet/clients/') return clientsDeferred.promise
      if (url === '/booking/sessions/') return []
      throw new Error(`Unexpected apiGet call: ${url}`)
    })

    const { container } = renderView()
    const { clientsPanel } = getPanels(container)

    await waitFor(() => {
      expect(clientsPanel.querySelector('.skeleton')).toBeTruthy()
    })

    clientsDeferred.resolve([])
    await waitFor(() => {
      expect(clientsPanel.querySelector('.skeleton')).toBeFalsy()
      expect(clientsPanel.querySelector('.empty-state')).toBeTruthy()
    })
  })

  it('shows explicit error state and retries clients list', async () => {
    mockedApiGet.mockImplementation(async (url) => {
      if (url === '/cabinet/clients/') {
        const calls = mockedApiGet.mock.calls.filter((item) => item[0] === '/cabinet/clients/').length
        if (calls === 1) throw new Error('clients failed')
        return [
          {
            id: 1,
            client: 10,
            state: 'ACTIVE',
            last_session_at: '2099-06-15T10:00:00Z',
            upcoming_count: 2,
            client_username: 'Olena',
          },
        ]
      }
      if (url === '/booking/sessions/') return []
      throw new Error(`Unexpected apiGet call: ${url}`)
    })

    const { container } = renderView()
    const { clientsPanel } = getPanels(container)

    let retryButton: HTMLButtonElement | null = null
    await waitFor(() => {
      retryButton = clientsPanel.querySelector('.empty-state .btn') as HTMLButtonElement | null
      expect(retryButton).toBeTruthy()
    })

    await fireEvent.click(retryButton as HTMLButtonElement)

    await waitFor(() => {
      expect(within(clientsPanel).getByText('Olena')).toBeInTheDocument()
      expect(clientsPanel.querySelector('.empty-state .btn')).toBeFalsy()
    })
  })

  it('shows explicit empty state when clients list has no entries', async () => {
    mockedApiGet.mockImplementation(async (url) => {
      if (url === '/cabinet/clients/') return []
      if (url === '/booking/sessions/') return []
      throw new Error(`Unexpected apiGet call: ${url}`)
    })

    const { container } = renderView()
    const { clientsPanel } = getPanels(container)

    await waitFor(() => {
      expect(clientsPanel.querySelector('.empty-state')).toBeTruthy()
    })
    expect(clientsPanel.querySelector('.empty-state .btn')).toBeFalsy()
  })

  it('shows explicit reminders error state and retries reminders fetch', async () => {
    mockedApiGet.mockImplementation(async (url) => {
      if (url === '/cabinet/clients/') return []
      if (url === '/booking/sessions/') {
        const calls = mockedApiGet.mock.calls.filter((item) => item[0] === '/booking/sessions/').length
        if (calls === 1) throw new Error('reminders failed')
        return []
      }
      throw new Error(`Unexpected apiGet call: ${url}`)
    })

    const { container } = renderView()
    const { remindersPanel } = getPanels(container)

    let retryButton: HTMLButtonElement | null = null
    await waitFor(() => {
      retryButton = remindersPanel.querySelector('.empty-state .btn') as HTMLButtonElement | null
      expect(retryButton).toBeTruthy()
    })

    await fireEvent.click(retryButton as HTMLButtonElement)

    await waitFor(() => {
      expect(remindersPanel.querySelector('.empty-state .btn')).toBeFalsy()
    })
  })

  it('shows explicit reminders empty state when no pending notes exist', async () => {
    mockedApiGet.mockImplementation(async (url) => {
      if (url === '/cabinet/clients/') return []
      if (url === '/booking/sessions/') return []
      throw new Error(`Unexpected apiGet call: ${url}`)
    })

    const { container } = renderView()
    const { remindersPanel } = getPanels(container)

    await waitFor(() => {
      expect(remindersPanel.querySelector('.empty-state')).toBeTruthy()
    })
    expect(remindersPanel.querySelector('.empty-state .btn')).toBeFalsy()
  })

  it('archives client using client_id from relation payload', async () => {
    mockedApiGet.mockImplementation(async (url) => {
      if (url === '/cabinet/clients/')
        return [
          {
            id: 1,
            client_id: 44,
            state: 'ACTIVE',
            last_session_at: null,
            upcoming_count: 0,
            client_name: 'Test Client',
          },
        ]
      if (url === '/booking/sessions/') return []
      throw new Error(`Unexpected apiGet call: ${url}`)
    })
    mockedApiPatch.mockResolvedValue(undefined as any)

    const { getByRole } = renderView()

    const archiveButton = await waitFor(() => getByRole('button', { name: 'Архівувати' }))
    await fireEvent.click(archiveButton)

    await waitFor(() => {
      expect(mockedApiPatch).toHaveBeenCalledWith('/cabinet/clients/44/archive/')
    })
  })

  it('loads private history for matching client_id', async () => {
    mockedApiGet.mockImplementation(async (url) => {
      if (url === '/cabinet/clients/')
        return [
          {
            id: 1,
            client_id: 44,
            state: 'ACTIVE',
            last_session_at: null,
            upcoming_count: 0,
            client_name: 'Test Client',
          },
        ]
      if (url === '/booking/sessions/')
        return [
          {
            id: 777,
            client_id: 44,
            status: 'COMPLETED',
            slot_start_at: '2099-06-15T10:00:00Z',
            slot_end_at: '2099-06-15T10:50:00Z',
          },
          {
            id: 888,
            client_id: 99,
            status: 'COMPLETED',
            slot_start_at: '2099-06-16T10:00:00Z',
            slot_end_at: '2099-06-16T10:50:00Z',
          },
        ]
      if (url === '/cabinet/sessions/777/note/') return { content: 'note-44' }
      if (url === '/cabinet/sessions/888/note/') return { content: 'note-99' }
      throw new Error(`Unexpected apiGet call: ${url}`)
    })

    const { getByRole, queryByText } = renderView()

    const historyButton = await waitFor(() => getByRole('button', { name: 'Приватна історія клієнта' }))
    await fireEvent.click(historyButton)

    await waitFor(() => {
      expect(queryByText('note-44')).toBeInTheDocument()
      expect(queryByText('note-99')).not.toBeInTheDocument()
    })
  })
})
