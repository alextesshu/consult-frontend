import { fireEvent, render, waitFor, within } from '@testing-library/vue'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { apiGet, apiPatch, fetchChatThreads } from '../lib/api'
import TherapistClientsView from './TherapistClientsView.vue'
import { createPracticeBoardItem, fetchPracticeBoards } from '../lib/specialistPracticeBoard'

const mockToast = {
  success: vi.fn(),
}

vi.mock('../lib/api', () => ({
  apiGet: vi.fn(),
  apiPatch: vi.fn(),
  fetchChatThreads: vi.fn(),
}))
vi.mock('../lib/specialistPracticeBoard', () => ({
  createPracticeBoardItem: vi.fn(),
  fetchPracticeBoards: vi.fn(),
  resolveDefaultPracticeBoardId: (boards: Array<{ id: number | string; is_default: boolean }>) =>
    boards.find((b) => b.is_default)?.id ?? boards[0]?.id ?? null,
}))
vi.mock('../composables/useToast', () => ({
  useToast: () => mockToast,
}))

const mockedApiGet = vi.mocked(apiGet)
const mockedApiPatch = vi.mocked(apiPatch)
const mockedFetchChatThreads = vi.mocked(fetchChatThreads)
const mockedCreatePracticeBoardItem = vi.mocked(createPracticeBoardItem)
const mockedFetchPracticeBoards = vi.mocked(fetchPracticeBoards)

const CLIENTS_URL = '/cabinet/clients/'
const REMINDERS_URL = '/cabinet/notes/reminders/'
const clientHistoryUrl = (clientId: number) => `/cabinet/clients/${clientId}/notes/history/`

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

function requireHTMLElement(node: Element | null, selector: string): HTMLElement {
  if (!(node instanceof HTMLElement)) {
    throw new Error(`Expected HTMLElement for selector: ${selector}`)
  }
  return node
}

function getPanels(container: Element) {
  const remindersPanel = requireHTMLElement(container.querySelector('.panel--reminders'), '.panel--reminders')
  const panelList = container.querySelectorAll('.panel')
  const clientsPanel = requireHTMLElement(panelList.item(1), '.panel:nth-of-type(2)')
  return { remindersPanel, clientsPanel }
}

describe('TherapistClientsView', () => {
  beforeEach(() => {
    mockedApiGet.mockReset()
    mockedApiPatch.mockReset()
    mockedFetchChatThreads.mockReset()
    mockedFetchChatThreads.mockResolvedValue([])
    mockedCreatePracticeBoardItem.mockReset()
    mockedFetchPracticeBoards.mockReset()
    mockToast.success.mockReset()
    window.history.replaceState({}, '', '/cabinet/clients')
    Object.defineProperty(HTMLElement.prototype, 'scrollIntoView', {
      configurable: true,
      value: vi.fn(),
    })
  })

  it('shows loading state while clients list is pending', async () => {
    const clientsDeferred = deferred<any[]>()
    mockedApiGet.mockImplementation(async (url) => {
      if (url === CLIENTS_URL) return clientsDeferred.promise
      if (url === REMINDERS_URL) return []
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
      if (url === CLIENTS_URL) {
        const calls = mockedApiGet.mock.calls.filter((item) => item[0] === CLIENTS_URL).length
        if (calls === 1) throw new Error('clients failed')
        return [
          {
            id: 1,
            client: 10,
            state: 'ACTIVE',
            last_session_at: '2099-06-15T10:00:00Z',
            upcoming_count: 2,
            client_display_name: 'Olena',
          },
        ]
      }
      if (url === REMINDERS_URL) return []
      throw new Error(`Unexpected apiGet call: ${url}`)
    })

    const { container } = renderView()
    const { clientsPanel } = getPanels(container)

    const retryButton = await waitFor(() => {
      const button = clientsPanel.querySelector('.empty-state .btn')
      expect(button).toBeInstanceOf(HTMLButtonElement)
      return button as HTMLButtonElement
    })

    await fireEvent.click(retryButton)

    await waitFor(() => {
      expect(within(clientsPanel).getByText('Olena')).toBeInTheDocument()
      expect(clientsPanel.querySelector('.empty-state .btn')).toBeFalsy()
    })
  })

  it('shows explicit reminders error state and retries reminders fetch from new endpoint', async () => {
    mockedApiGet.mockImplementation(async (url) => {
      if (url === CLIENTS_URL) return []
      if (url === REMINDERS_URL) {
        const calls = mockedApiGet.mock.calls.filter((item) => item[0] === REMINDERS_URL).length
        if (calls === 1) throw new Error('reminders failed')
        return []
      }
      throw new Error(`Unexpected apiGet call: ${url}`)
    })

    const { container } = renderView()
    const { remindersPanel } = getPanels(container)

    const retryButton = await waitFor(() => {
      const button = remindersPanel.querySelector('.empty-state .btn')
      expect(button).toBeInstanceOf(HTMLButtonElement)
      return button as HTMLButtonElement
    })

    await fireEvent.click(retryButton)

    await waitFor(() => {
      expect(remindersPanel.querySelector('.empty-state .btn')).toBeFalsy()
    })
    expect(mockedApiGet).not.toHaveBeenCalledWith('/booking/sessions/')
  })

  it('uses reminders endpoint as canonical source', async () => {
    mockedApiGet.mockImplementation(async (url) => {
      if (url === CLIENTS_URL) return []
      if (url === REMINDERS_URL)
        return [
          {
            session_id: 777,
            client_id: 44,
            status: 'COMPLETED',
            slot_start_at: '2099-06-15T10:00:00Z',
            slot_end_at: '2099-06-15T10:50:00Z',
            client_display_name: 'Display Client',
          },
        ]
      throw new Error(`Unexpected apiGet call: ${url}`)
    })

    const { container } = renderView()

    await waitFor(() => {
      expect(container.querySelector('a[href="/cabinet/sessions#note-777"]')).toBeInTheDocument()
      expect(container.textContent).toContain('Display Client')
    })
    expect(mockedApiGet).not.toHaveBeenCalledWith('/booking/sessions/')
  })

  it('archives client using client_id from relation payload', async () => {
    mockedApiGet.mockImplementation(async (url) => {
      if (url === CLIENTS_URL)
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
      if (url === REMINDERS_URL) return []
      throw new Error(`Unexpected apiGet call: ${url}`)
    })
    mockedApiPatch.mockResolvedValue(undefined as any)

    const { container } = renderView()

    const archiveButton = await waitFor(() => {
      const buttons = container.querySelectorAll('.client-card .client-actions button')
      expect(buttons.length).toBeGreaterThanOrEqual(3)
      return buttons[buttons.length - 1] as HTMLButtonElement
    })
    await fireEvent.click(archiveButton)

    await waitFor(() => {
      expect(mockedApiPatch).toHaveBeenCalledWith('/cabinet/clients/44/archive/')
    })
  })

  it('creates board task from client quick-add button with client context', async () => {
    mockedApiGet.mockImplementation(async (url) => {
      if (url === CLIENTS_URL)
        return [
          {
            id: 1,
            client_id: 44,
            state: 'ACTIVE',
            last_session_at: null,
            upcoming_count: 0,
            client_display_name: 'Test Client',
          },
        ]
      if (url === REMINDERS_URL) return []
      throw new Error(`Unexpected apiGet call: ${url}`)
    })
    mockedCreatePracticeBoardItem.mockResolvedValue({ id: 901 } as any)
    mockedFetchPracticeBoards.mockResolvedValue([{ id: 1, title: 'Main board', is_default: true }] as any)

    const { container } = renderView()

    const quickAddButton = await waitFor(() => {
      const buttons = container.querySelectorAll('.client-card .client-actions button')
      expect(buttons.length).toBeGreaterThanOrEqual(2)
      return buttons[1] as HTMLButtonElement
    })

    await fireEvent.click(quickAddButton)

    await waitFor(() => {
      expect(mockedCreatePracticeBoardItem).toHaveBeenCalledWith({
        board_id: 1,
        title: expect.any(String),
        related_client_id: 44,
        source_type: 'manual',
      })
      expect(mockedFetchPracticeBoards).toHaveBeenCalledTimes(1)
      expect(mockToast.success).toHaveBeenCalledWith(expect.any(String))
    })
  })

  it('loads private history from metadata endpoint and renders continuation actions', async () => {
    mockedApiGet.mockImplementation(async (url) => {
      if (url === CLIENTS_URL)
        return [
          {
            id: 1,
            client_id: 44,
            state: 'ACTIVE',
            last_session_at: null,
            upcoming_count: 0,
            client_display_name: 'Test Client',
            client_journal_content: 'journal-44',
            has_workbook_content: true,
            workbook_updated_at: '2099-06-15T11:20:00Z',
            latest_session_note_at: '2099-06-15T12:20:00Z',
            latest_session_note_session_id: 777,
          },
        ]
      if (url === REMINDERS_URL) return []
      if (url === clientHistoryUrl(44)) {
        return [
          {
            session_id: 777,
            status: 'COMPLETED',
            slot_start_at: '2099-06-15T10:00:00Z',
            slot_end_at: '2099-06-15T10:50:00Z',
            has_note: true,
            note_updated_at: '2099-06-15T12:20:00Z',
          },
          {
            session_id: 778,
            status: 'COMPLETED',
            slot_start_at: '2099-06-14T10:00:00Z',
            slot_end_at: '2099-06-14T10:50:00Z',
            has_note: false,
            note_updated_at: null,
          },
        ]
      }
      throw new Error(`Unexpected apiGet call: ${url}`)
    })

    const { container } = renderView()

    const historyButton = await waitFor(() => {
      const button = container.querySelector('.client-card .client-actions button')
      expect(button).toBeInstanceOf(HTMLButtonElement)
      return button as HTMLButtonElement
    })
    await fireEvent.click(historyButton)

    const expandButton = await waitFor(() => {
      const button = container.querySelector('.workbook-block__controls button:last-of-type')
      expect(button).toBeInstanceOf(HTMLButtonElement)
      return button as HTMLButtonElement
    })
    await fireEvent.click(expandButton)

    await waitFor(() => {
      expect(container.querySelector('textarea.workbook-textarea')).toHaveValue('journal-44')
      expect(container.querySelector('a[href="/cabinet/sessions#note-777"]')).toBeInTheDocument()
      expect(container.querySelector('a[href="/cabinet/sessions#note-778"]')).toBeInTheDocument()
      expect(container.querySelector('a[href="/cabinet/clients/44/workbook"]')).toBeInTheDocument()
    })
    expect(mockedApiGet).not.toHaveBeenCalledWith('/cabinet/clients/44/journal/')
  })

  it('handles has_workbook_content=false and workbook_updated_at=null without extra workbook fetch', async () => {
    mockedApiGet.mockImplementation(async (url) => {
      if (url === CLIENTS_URL)
        return [
          {
            id: 1,
            client_id: 44,
            state: 'ACTIVE',
            last_session_at: null,
            upcoming_count: 0,
            client_display_name: 'Metadata Client',
            has_workbook_content: false,
            workbook_updated_at: null,
            latest_session_note_at: null,
            latest_session_note_session_id: null,
          },
        ]
      if (url === REMINDERS_URL) return []
      if (url === clientHistoryUrl(44)) return []
      throw new Error(`Unexpected apiGet call: ${url}`)
    })

    const { container } = renderView()

    await waitFor(() => {
      expect(container.textContent).toContain('Metadata Client')
      expect(container.querySelector('a[href^="/cabinet/sessions#note-"]')).not.toBeInTheDocument()
    })

    const historyButton = await waitFor(() => {
      const button = container.querySelector('.client-card .client-actions button')
      expect(button).toBeInstanceOf(HTMLButtonElement)
      return button as HTMLButtonElement
    })
    await fireEvent.click(historyButton)

    await waitFor(() => {
      expect(container.querySelector('.client-history')).toBeInTheDocument()
    })
    expect(mockedApiGet).not.toHaveBeenCalledWith('/cabinet/clients/44/journal/')
  })

  it('searches clients by name, code and id and keeps status filter active', async () => {
    mockedApiGet.mockImplementation(async (url) => {
      if (url === CLIENTS_URL)
        return [
          {
            id: 1,
            client_id: 44,
            state: 'ACTIVE',
            last_session_at: null,
            upcoming_count: 0,
            client_display_name: 'Olena',
            client_code: 'A-101',
          },
          {
            id: 2,
            client_id: 55,
            state: 'INACTIVE',
            last_session_at: null,
            upcoming_count: 0,
            client_display_name: 'Marta',
            client_code: 'B-500',
          },
          {
            id: 3,
            client_id: 66,
            state: 'ARCHIVED',
            last_session_at: null,
            upcoming_count: 0,
            client_display_name: 'Ihor',
            client_code: 'C-900',
          },
        ]
      if (url === REMINDERS_URL) return []
      throw new Error(`Unexpected apiGet call: ${url}`)
    })

    const { container } = renderView()
    const { clientsPanel } = getPanels(container)

    const searchInput = await waitFor(() => {
      const input = clientsPanel.querySelector('#clients-search-input')
      expect(input).toBeInstanceOf(HTMLInputElement)
      return input as HTMLInputElement
    })
    const filterButtons = clientsPanel.querySelectorAll('.filters button')

    await waitFor(() => {
      expect(clientsPanel.querySelectorAll('.client-card')).toHaveLength(3)
    })

    await fireEvent.update(searchInput, 'A-101')
    await waitFor(() => {
      expect(clientsPanel.querySelectorAll('.client-card')).toHaveLength(1)
    })

    await fireEvent.update(searchInput, '44')
    await waitFor(() => {
      expect(clientsPanel.querySelectorAll('.client-card')).toHaveLength(1)
    })

    await fireEvent.click(filterButtons[2] as HTMLButtonElement)
    await waitFor(() => {
      expect(clientsPanel.querySelectorAll('.client-card')).toHaveLength(0)
      expect(clientsPanel.querySelector('.empty-state')).toBeTruthy()
    })

    await fireEvent.update(searchInput, 'B-500')
    await waitFor(() => {
      expect(clientsPanel.querySelectorAll('.client-card')).toHaveLength(1)
    })
  })

  it('shows fallback client title with relation id when name and code are missing', async () => {
    mockedApiGet.mockImplementation(async (url) => {
      if (url === CLIENTS_URL)
        return [
          {
            id: 1,
            client_id: 44,
            state: 'ACTIVE',
            last_session_at: null,
            upcoming_count: 0,
          },
        ]
      if (url === REMINDERS_URL) return []
      throw new Error(`Unexpected apiGet call: ${url}`)
    })

    const { container } = renderView()

    await waitFor(() => {
      expect(container.textContent).toContain('#44')
    })
  })

  it('prefers client_display_name over login-like values', async () => {
    mockedApiGet.mockImplementation(async (url) => {
      if (url === CLIENTS_URL)
        return [
          {
            id: 1,
            client_id: 44,
            state: 'ACTIVE',
            last_session_at: null,
            upcoming_count: 0,
            client_name: 'client.prcnslt',
            client_username: 'client.prcnslt',
            display_name: 'Old Display',
            client_display_name: 'Canonical Display',
          },
        ]
      if (url === REMINDERS_URL) return []
      throw new Error(`Unexpected apiGet call: ${url}`)
    })

    const { container } = renderView()

    await waitFor(() => {
      expect(container.textContent).toContain('Canonical Display')
      expect(container.textContent).not.toContain('client.prcnslt')
    })
  })

  it('uses chat thread display_name when clients payload has only login', async () => {
    mockedApiGet.mockImplementation(async (url) => {
      if (url === CLIENTS_URL)
        return [
          {
            id: 1,
            client_id: 44,
            state: 'ACTIVE',
            last_session_at: null,
            upcoming_count: 0,
            client_name: 'client.prcnslt',
            client_username: 'client.prcnslt',
          },
        ]
      if (url === REMINDERS_URL) return []
      throw new Error(`Unexpected apiGet call: ${url}`)
    })
    mockedFetchChatThreads.mockResolvedValue([
      {
        id: 12,
        therapist_id: 3,
        client_id: 44,
        last_message_at: null,
        last_message_preview: '',
        unread_count: 0,
        other_user: {
          id: 44,
          role: 'CLIENT',
          display_name: 'Chat Display 44',
        },
      },
    ] as any)

    const { container } = renderView()

    await waitFor(() => {
      expect(container.textContent).toContain('Chat Display 44')
      expect(container.textContent).not.toContain('client.prcnslt')
    })
  })

  it('opens and highlights deep-linked client card automatically with metadata history endpoint', async () => {
    window.history.replaceState({}, '', '/cabinet/clients?client=44&autoOpen=1')
    mockedApiGet.mockImplementation(async (url) => {
      if (url === CLIENTS_URL)
        return [
          {
            id: 1,
            client_id: 44,
            state: 'ACTIVE',
            last_session_at: null,
            upcoming_count: 0,
            client_display_name: 'Target Client',
            client_journal_content: 'journal-44',
            has_workbook_content: true,
          },
          {
            id: 2,
            client_id: 55,
            state: 'ACTIVE',
            last_session_at: null,
            upcoming_count: 0,
            client_display_name: 'Another Client',
          },
        ]
      if (url === REMINDERS_URL) return []
      if (url === clientHistoryUrl(44)) {
        return [
          {
            session_id: 700,
            client_id: 44,
            status: 'COMPLETED',
            slot_start_at: '2099-06-17T10:00:00Z',
            slot_end_at: '2099-06-17T10:50:00Z',
            has_note: true,
            note_updated_at: '2099-06-17T11:00:00Z',
          },
        ]
      }
      throw new Error(`Unexpected apiGet call: ${url}`)
    })

    const { container } = renderView()

    await waitFor(() => {
      const targetCard = container.querySelector('#client-card-44')
      expect(targetCard).toBeInTheDocument()
      expect(targetCard).toHaveClass('client-card--targeted')
      expect(targetCard?.querySelector('.client-history')).toBeTruthy()
    })

    expect(mockedApiGet).toHaveBeenCalledWith(clientHistoryUrl(44), { params: { limit: 10 } })
  })
})
