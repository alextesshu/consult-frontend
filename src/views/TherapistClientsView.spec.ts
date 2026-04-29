import { fireEvent, render, screen, waitFor, within } from '@testing-library/vue'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import {
  apiGet,
  apiPatch,
  apiPost,
  createClientRecordAccountInvite,
  fetchChatThreads,
  fetchClientRecordAccountInvite,
  regenerateClientRecordAccountInvite,
  revokeClientRecordAccountInvite,
} from '../lib/api'
import TherapistClientsView from './TherapistClientsView.vue'
import { createPracticeBoardItem, fetchPracticeBoards } from '../lib/specialistPracticeBoard'
import { skipSpecialistSessionNote } from '../lib/specialistSessions'

const mockToast = {
  success: vi.fn(),
}

vi.mock('../lib/api', () => ({
  apiGet: vi.fn(),
  apiPatch: vi.fn(),
  apiPost: vi.fn(),
  createClientRecordAccountInvite: vi.fn(),
  fetchChatThreads: vi.fn(),
  fetchClientRecordAccountInvite: vi.fn(),
  regenerateClientRecordAccountInvite: vi.fn(),
  revokeClientRecordAccountInvite: vi.fn(),
}))
vi.mock('../lib/specialistPracticeBoard', () => ({
  createPracticeBoardItem: vi.fn(),
  fetchPracticeBoards: vi.fn(),
  resolveDefaultPracticeBoardId: (boards: Array<{ id: number | string; is_default: boolean }>) =>
    boards.find((b) => b.is_default)?.id ?? boards[0]?.id ?? null,
}))
vi.mock('../lib/specialistSessions', async () => {
  const actual = await vi.importActual<typeof import('../lib/specialistSessions')>('../lib/specialistSessions')
  return {
    ...actual,
    skipSpecialistSessionNote: vi.fn(),
  }
})
vi.mock('../composables/useToast', () => ({
  useToast: () => mockToast,
}))

const mockedApiGet = vi.mocked(apiGet)
const mockedApiPatch = vi.mocked(apiPatch)
const mockedApiPost = vi.mocked(apiPost)
const mockedCreateClientRecordAccountInvite = vi.mocked(createClientRecordAccountInvite)
const mockedFetchChatThreads = vi.mocked(fetchChatThreads)
const mockedFetchClientRecordAccountInvite = vi.mocked(fetchClientRecordAccountInvite)
const mockedRegenerateClientRecordAccountInvite = vi.mocked(regenerateClientRecordAccountInvite)
const mockedRevokeClientRecordAccountInvite = vi.mocked(revokeClientRecordAccountInvite)
const mockedCreatePracticeBoardItem = vi.mocked(createPracticeBoardItem)
const mockedFetchPracticeBoards = vi.mocked(fetchPracticeBoards)
const mockedSkipSpecialistSessionNote = vi.mocked(skipSpecialistSessionNote)

const CLIENTS_URL = '/cabinet/clients/'
const CLIENT_RECORDS_URL = '/cabinet/client-records/'
const REMINDERS_URL = '/cabinet/notes/reminders/'
const SLOTS_URL = '/cabinet/slots/'
const clientHistoryUrl = (clientId: number) => `/cabinet/clients/${clientId}/notes/history/`
const noteReminderHref = (sessionId: number) => `/cabinet/sessions?returnTo=%2Fcabinet%2Fclients#note-${sessionId}`

function renderView() {
  return render(TherapistClientsView, {
    global: {
      stubs: {
        RouterLink: {
          props: ['to'],
          template: `
            <a :href="typeof to === 'string'
              ? to
              : \`\${to.path || ''}\${to.query?.returnTo ? '?returnTo=' + encodeURIComponent(to.query.returnTo) : ''}\${to.hash || ''}\`">
              <slot />
            </a>
          `,
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
  const remindersPanel = container.querySelector('.panel--reminders') as HTMLElement | null
  const clientsPanel = requireHTMLElement(container.querySelector('.panel--clients'), '.panel--clients')
  return { remindersPanel, clientsPanel }
}

function manualClientRecord(overrides: Record<string, unknown> = {}) {
  return {
    id: 201,
    user_id: null,
    display_name: 'Manual Client',
    email: null,
    phone: null,
    telegram: null,
    internal_note: null,
    status: 'active',
    source: 'manual',
    has_account: false,
    archived_at: null,
    created_at: '2099-06-15T10:00:00Z',
    updated_at: '2099-06-15T10:00:00Z',
    ...overrides,
  }
}

function accountInviteResponse(overrides: Record<string, unknown> = {}, inviteUrl: string | null = null) {
  return {
    invite: {
      id: 301,
      client_record_id: 201,
      status: 'ACTIVE',
      expires_at: '2099-06-30T10:00:00Z',
      accepted_at: null,
      revoked_at: null,
      created_at: '2099-06-15T10:00:00Z',
      updated_at: '2099-06-15T10:00:00Z',
      invite_url: inviteUrl,
      ...overrides,
    },
    invite_url: inviteUrl,
  }
}

describe('TherapistClientsView', () => {
  beforeEach(() => {
    mockedApiGet.mockReset()
    mockedApiPatch.mockReset()
    mockedApiPost.mockReset()
    mockedCreateClientRecordAccountInvite.mockReset()
    mockedCreateClientRecordAccountInvite.mockResolvedValue({ invite: null, invite_url: null } as any)
    mockedFetchChatThreads.mockReset()
    mockedFetchChatThreads.mockResolvedValue([])
    mockedFetchClientRecordAccountInvite.mockReset()
    mockedFetchClientRecordAccountInvite.mockResolvedValue(null)
    mockedRegenerateClientRecordAccountInvite.mockReset()
    mockedRegenerateClientRecordAccountInvite.mockResolvedValue({ invite: null, invite_url: null } as any)
    mockedRevokeClientRecordAccountInvite.mockReset()
    mockedRevokeClientRecordAccountInvite.mockResolvedValue({ invite: null, invite_url: null } as any)
    mockedCreatePracticeBoardItem.mockReset()
    mockedFetchPracticeBoards.mockReset()
    mockedSkipSpecialistSessionNote.mockReset()
    mockedSkipSpecialistSessionNote.mockResolvedValue(undefined)
    mockToast.success.mockReset()
    window.history.replaceState({}, '', '/cabinet/clients')
    Object.defineProperty(HTMLElement.prototype, 'scrollIntoView', {
      configurable: true,
      value: vi.fn(),
    })
    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: {
        writeText: vi.fn().mockResolvedValue(undefined),
      },
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

    const retryButton = await waitFor(() => {
      const remindersPanel = container.querySelector('.panel--reminders')
      expect(remindersPanel).toBeInstanceOf(HTMLElement)
      const button = remindersPanel?.querySelector('.empty-state .btn')
      expect(button).toBeInstanceOf(HTMLButtonElement)
      return button as HTMLButtonElement
    })

    await fireEvent.click(retryButton)

    await waitFor(() => {
      expect(container.querySelector('.panel--reminders')).toBeFalsy()
    })
    expect(mockedApiGet.mock.calls.filter((item) => item[0] === REMINDERS_URL)).toHaveLength(2)
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

    const showSessionsButton = await waitFor(() => {
      expect(screen.getByText('Є 1 завершена сесія, до якої можна додати нотатку.')).toBeInTheDocument()
      return screen.getByRole('button', { name: 'Показати сесії' })
    })
    expect(screen.queryByRole('link', { name: 'Додати нотатку' })).not.toBeInTheDocument()

    await fireEvent.click(showSessionsButton)

    await waitFor(() => {
      expect(screen.getByRole('link', { name: 'Додати нотатку' })).toHaveAttribute('href', noteReminderHref(777))
      expect(container.textContent).toContain('Display Client')
    })
    expect(mockedApiGet).toHaveBeenCalledWith(REMINDERS_URL)
  })

  it('renders note reminders as a compact optional summary before revealing a limited list', async () => {
    mockedApiGet.mockImplementation(async (url) => {
      if (url === CLIENTS_URL) return []
      if (url === REMINDERS_URL)
        return Array.from({ length: 5 }, (_, index) => ({
          session_id: 800 + index,
          client_id: 50 + index,
          status: 'COMPLETED',
          slot_start_at: `2099-06-${15 + index}T10:00:00Z`,
          slot_end_at: `2099-06-${15 + index}T10:50:00Z`,
          client_name: `Client ${index + 1}`,
        }))
      throw new Error(`Unexpected apiGet call: ${url}`)
    })

    const { container } = renderView()

    const showSessionsButton = await waitFor(() => {
      expect(screen.getByText('Нотатки після сесій')).toBeInTheDocument()
      expect(screen.getByText('Є 5 завершені сесії, до яких можна додати нотатку.')).toBeInTheDocument()
      expect(screen.getByText('Для зручності ведення історії можна додати коротку нотатку після сесії.')).toBeInTheDocument()
      return screen.getByRole('button', { name: 'Показати сесії' })
    })

    const remindersPanel = requireHTMLElement(container.querySelector('.panel--reminders'), '.panel--reminders')
    expect(container).not.toHaveTextContent('Сесії без коментаря')
    expect(within(remindersPanel).queryByRole('link', { name: 'Додати нотатку' })).not.toBeInTheDocument()
    expect(remindersPanel).not.toHaveTextContent('потрібно')
    expect(remindersPanel).not.toHaveTextContent('обов')
    expect(remindersPanel).not.toHaveTextContent('без коментаря')

    await fireEvent.click(showSessionsButton)

    await waitFor(() => {
      const addNoteLinks = within(remindersPanel).getAllByRole('link', { name: 'Додати нотатку' })
      expect(addNoteLinks).toHaveLength(3)
      expect(addNoteLinks.map((link) => link.getAttribute('href'))).toEqual([
        noteReminderHref(804),
        noteReminderHref(803),
        noteReminderHref(802),
      ])
      expect(screen.getByRole('button', { name: 'Показати ще' })).toBeInTheDocument()
      expect(screen.getByText('Клієнт #54')).toBeInTheDocument()
      expect(screen.getByText('Клієнт #53')).toBeInTheDocument()
      expect(screen.getByText('Клієнт #52')).toBeInTheDocument()
    })

    await fireEvent.click(screen.getByRole('button', { name: 'Показати ще' }))
    await waitFor(() => {
      expect(within(remindersPanel).getAllByRole('link', { name: 'Додати нотатку' })).toHaveLength(5)
    })
  })

  it('can close a note reminder without creating fake note text', async () => {
    mockedApiGet.mockImplementation(async (url) => {
      if (url === CLIENTS_URL) return []
      if (url === REMINDERS_URL)
        return [
          {
            session_id: 900,
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

    await fireEvent.click(await screen.findByRole('button', { name: 'Показати сесії' }))
    expect(screen.getByRole('link', { name: 'Додати нотатку' })).toHaveAttribute('href', noteReminderHref(900))

    await fireEvent.click(screen.getByRole('button', { name: 'Залишити без нотатки' }))

    await waitFor(() => {
      expect(mockedSkipSpecialistSessionNote).toHaveBeenCalledWith(900)
      expect(container.querySelector('.panel--reminders')).toBeFalsy()
    })
    expect(container).not.toHaveTextContent('Без нотатки')
    expect(mockedApiGet).toHaveBeenCalledWith(REMINDERS_URL)
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

  it('creates board task from client quick-add modal with custom title and client context', async () => {
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
    await fireEvent.update(screen.getByLabelText('\u041d\u0430\u0437\u0432\u0430 \u0437\u0430\u0434\u0430\u0447\u0456'), 'Client follow-up task')
    await fireEvent.click(screen.getByRole('button', { name: '\u0414\u043e\u0434\u0430\u0442\u0438' }))

    await waitFor(() => {
      expect(mockedCreatePracticeBoardItem).toHaveBeenCalledWith({
        board_id: 1,
        title: 'Client follow-up task',
        related_client_id: 44,
        source_type: 'manual',
      })
      expect(mockedFetchPracticeBoards).toHaveBeenCalledTimes(1)
      expect(mockToast.success).toHaveBeenCalledWith('\u0417\u0430\u0434\u0430\u0447\u0443 \u0434\u043e\u0434\u0430\u043d\u043e \u043d\u0430 \u0434\u043e\u0448\u043a\u0443')
    })
  })

  it('validates empty title in client quick-add modal and does not submit', async () => {
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

    const { container } = renderView()

    const quickAddButton = await waitFor(() => {
      const buttons = container.querySelectorAll('.client-card .client-actions button')
      expect(buttons.length).toBeGreaterThanOrEqual(2)
      return buttons[1] as HTMLButtonElement
    })

    await fireEvent.click(quickAddButton)
    await fireEvent.click(screen.getByRole('button', { name: '\u0414\u043e\u0434\u0430\u0442\u0438' }))

    expect(await screen.findByText('\u0412\u043a\u0430\u0436\u0456\u0442\u044c \u043d\u0430\u0437\u0432\u0443 \u0437\u0430\u0434\u0430\u0447\u0456.')).toBeInTheDocument()
    expect(mockedCreatePracticeBoardItem).not.toHaveBeenCalled()
  })

  it('creates board task from client quick-add without board_id when no board exists yet', async () => {
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
    mockedCreatePracticeBoardItem.mockResolvedValue({ id: 902 } as any)
    mockedFetchPracticeBoards.mockResolvedValue([])

    const { container } = renderView()

    const quickAddButton = await waitFor(() => {
      const buttons = container.querySelectorAll('.client-card .client-actions button')
      expect(buttons.length).toBeGreaterThanOrEqual(2)
      return buttons[1] as HTMLButtonElement
    })

    await fireEvent.click(quickAddButton)
    await fireEvent.update(screen.getByLabelText('\u041d\u0430\u0437\u0432\u0430 \u0437\u0430\u0434\u0430\u0447\u0456'), 'No-board client task')
    await fireEvent.click(screen.getByRole('button', { name: '\u0414\u043e\u0434\u0430\u0442\u0438' }))

    await waitFor(() => {
      expect(mockedCreatePracticeBoardItem).toHaveBeenCalledWith({
        title: 'No-board client task',
        related_client_id: 44,
        source_type: 'manual',
      })
      expect(mockToast.success).toHaveBeenCalledWith('\u0417\u0430\u0434\u0430\u0447\u0443 \u0434\u043e\u0434\u0430\u043d\u043e \u043d\u0430 \u0434\u043e\u0448\u043a\u0443')
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

  it('renders Ukrainian status badges and key client metadata without raw status values', async () => {
    mockedApiGet.mockImplementation(async (url) => {
      if (url === CLIENTS_URL)
        return [
          {
            id: 1,
            client_id: 44,
            state: 'ACTIVE',
            last_session_at: '2099-06-15T10:00:00Z',
            upcoming_count: 2,
            client_display_name: 'Active Client',
            client_code: 'A-101',
            has_workbook_content: true,
            workbook_updated_at: '2099-06-15T11:20:00Z',
            latest_session_note_at: '2099-06-15T12:20:00Z',
            latest_session_note_session_id: 777,
          },
          {
            id: 2,
            client_id: 55,
            state: 'INACTIVE',
            last_session_at: null,
            upcoming_count: 0,
            client_display_name: 'Inactive Client',
          },
          {
            id: 3,
            client_id: 66,
            state: 'ARCHIVED',
            last_session_at: null,
            upcoming_count: 0,
            client_display_name: 'Archived Client',
          },
        ]
      if (url === REMINDERS_URL) return []
      throw new Error(`Unexpected apiGet call: ${url}`)
    })

    const { container } = renderView()
    const { clientsPanel } = getPanels(container)

    await waitFor(() => {
      expect(within(clientsPanel).getByText('Active Client')).toBeInTheDocument()
      expect(clientsPanel.querySelector('.client-status--active')).toHaveTextContent('Активний')
      expect(clientsPanel.querySelector('.client-status--inactive')).toHaveTextContent('Неактивний')
      expect(clientsPanel.querySelector('.client-status--archived')).toHaveTextContent('Архів')
    })

    const firstCard = clientsPanel.querySelector('.client-card') as HTMLElement
    expect(within(firstCard).getByText('Остання сесія')).toBeInTheDocument()
    expect(within(firstCard).getByText('Майбутніх сесій')).toBeInTheDocument()
    expect(within(firstCard).getByText('Остання нотатка')).toBeInTheDocument()
    expect(within(firstCard).getByText('Робочий зошит')).toBeInTheDocument()
    expect(within(firstCard).getByText('Оновлено')).toBeInTheDocument()
    expect(within(firstCard).getByRole('link', { name: 'Відкрити нотатку' })).toHaveAttribute(
      'href',
      '/cabinet/sessions#note-777'
    )
    expect(within(firstCard).getByRole('button', { name: 'Додати на дошку' })).toBeInTheDocument()
    expect(within(firstCard).getByRole('button', { name: 'Архівувати' })).toBeInTheDocument()
    expect(clientsPanel).not.toHaveTextContent('ACTIVE')
    expect(clientsPanel).not.toHaveTextContent('INACTIVE')
    expect(clientsPanel).not.toHaveTextContent('ARCHIVED')
  })

  it('shows useful empty copy for no clients, filtered lists, archive, and search', async () => {
    mockedApiGet.mockImplementation(async (url) => {
      if (url === CLIENTS_URL) return []
      if (url === REMINDERS_URL) return []
      throw new Error(`Unexpected apiGet call: ${url}`)
    })

    const { container } = renderView()
    const { clientsPanel } = getPanels(container)

    await waitFor(() => {
      expect(clientsPanel).toHaveTextContent('Клієнтів поки немає')
      expect(clientsPanel).toHaveTextContent('Клієнти з’являться після перших консультацій')
      expect(clientsPanel).toHaveTextContent(
        'Клієнта можна додати вручну без кабінету, щоб швидко почати роботу. Кабінет клієнта можна буде підключити пізніше — для власних сесій клієнта, нагадувань, оплати та зручнішої взаємодії.'
      )
    })

    const searchInput = clientsPanel.querySelector('#clients-search-input') as HTMLInputElement
    await fireEvent.update(searchInput, 'олена')
    await waitFor(() => {
      expect(clientsPanel).toHaveTextContent('Нічого не знайдено')
      expect(clientsPanel).toHaveTextContent('Перевірте написання або змініть фільтр')
    })

    await fireEvent.update(searchInput, '')
    const filterButtons = clientsPanel.querySelectorAll('.filters button')
    await fireEvent.click(filterButtons[1] as HTMLButtonElement)
    await waitFor(() => {
      expect(clientsPanel).toHaveTextContent('Активних клієнтів поки немає')
    })
    await fireEvent.click(filterButtons[3] as HTMLButtonElement)
    await waitFor(() => {
      expect(clientsPanel).toHaveTextContent('Архів порожній')
    })
  })

  it('opens manual client create modal and posts display_name payload', async () => {
    mockedApiGet.mockImplementation(async (url) => {
      if (url === CLIENTS_URL) return []
      if (url === CLIENT_RECORDS_URL) return []
      if (url === REMINDERS_URL) return []
      throw new Error(`Unexpected apiGet call: ${url}`)
    })
    mockedApiPost.mockResolvedValue(
      manualClientRecord({
        id: 202,
        display_name: 'Марія Коваль',
        email: 'maria@example.com',
        phone: '+380501112233',
        telegram: '@maria',
        internal_note: 'Prefers evening calls',
        custom_price_amount: null,
        custom_price_currency: 'UAH',
      }) as any
    )

    const { container } = renderView()
    const { clientsPanel } = getPanels(container)

    await fireEvent.click(await within(clientsPanel).findByRole('button', { name: 'Додати клієнта' }))
    const dialog = await screen.findByRole('dialog', { name: 'Додати клієнта' })

    expect(within(dialog).getByLabelText('Імʼя клієнта')).toBeInTheDocument()
    await fireEvent.update(within(dialog).getByLabelText('Імʼя клієнта'), 'Марія Коваль')
    await fireEvent.update(within(dialog).getByLabelText('Email'), 'maria@example.com')
    await fireEvent.update(within(dialog).getByLabelText('Телефон'), '+380501112233')
    await fireEvent.update(within(dialog).getByLabelText('Telegram'), '@maria')
    await fireEvent.update(within(dialog).getByLabelText('Короткий опис клієнта'), 'Prefers evening calls')
    await fireEvent.click(within(dialog).getByRole('button', { name: 'Додати клієнта' }))

    await waitFor(() => {
      expect(mockedApiPost).toHaveBeenCalledWith(CLIENT_RECORDS_URL, {
        display_name: 'Марія Коваль',
        email: 'maria@example.com',
        phone: '+380501112233',
        telegram: '@maria',
        internal_note: 'Prefers evening calls',
        custom_price_amount: null,
        custom_price_currency: 'UAH',
      })
      expect(mockedApiPost.mock.calls[0]?.[1]).not.toHaveProperty('full_name')
      expect(within(clientsPanel).getByText('Марія Коваль')).toBeInTheDocument()
      expect(within(clientsPanel).getByText('Без кабінету')).toBeInTheDocument()
      expect(within(clientsPanel).getByText('maria@example.com')).toBeInTheDocument()
    })
  })

  it('edits manual client record using display_name payload', async () => {
    mockedApiGet.mockImplementation(async (url) => {
      if (url === CLIENTS_URL) return []
      if (url === CLIENT_RECORDS_URL)
        return [
          manualClientRecord({
            id: 206,
            display_name: 'Manual Before',
            email: 'before@example.com',
            phone: '+380501111111',
            telegram: '@before',
            internal_note: 'Before note',
          }),
        ]
      if (url === REMINDERS_URL) return []
      throw new Error(`Unexpected apiGet call: ${url}`)
    })

    mockedApiPatch.mockResolvedValue(
      manualClientRecord({
        id: 206,
        display_name: 'Manual After',
        email: 'after@example.com',
        phone: '+380502222222',
        telegram: '@after',
        internal_note: 'After note',
        custom_price_amount: null,
        custom_price_currency: 'UAH',
      }) as any
    )

    const { container } = renderView()
    const { clientsPanel } = getPanels(container)

    const manualCard = await waitFor(() => {
      const card = clientsPanel.querySelector('#manual-client-record-206')
      expect(card).toBeInstanceOf(HTMLElement)
      return card as HTMLElement
    })

    await fireEvent.click(within(manualCard).getByRole('button', { name: 'Редагувати' }))

    const dialog = await screen.findByRole('dialog', { name: 'Редагувати клієнта' })

    expect(within(dialog).getByLabelText('Імʼя клієнта')).toHaveValue('Manual Before')
    expect(within(dialog).getByLabelText('Email')).toHaveValue('before@example.com')
    expect(within(dialog).getByLabelText('Телефон')).toHaveValue('+380501111111')
    expect(within(dialog).getByLabelText('Telegram')).toHaveValue('@before')
    expect(within(dialog).getByLabelText('Короткий опис клієнта')).toHaveValue('Before note')

    await fireEvent.update(within(dialog).getByLabelText('Імʼя клієнта'), 'Manual After')
    await fireEvent.update(within(dialog).getByLabelText('Email'), 'after@example.com')
    await fireEvent.update(within(dialog).getByLabelText('Телефон'), '+380502222222')
    await fireEvent.update(within(dialog).getByLabelText('Telegram'), '@after')
    await fireEvent.update(within(dialog).getByLabelText('Короткий опис клієнта'), 'After note')

    await fireEvent.click(within(dialog).getByRole('button', { name: 'Зберегти зміни' }))

    await waitFor(() => {
      expect(mockedApiPatch).toHaveBeenCalledWith('/cabinet/client-records/206/', {
        display_name: 'Manual After',
        email: 'after@example.com',
        phone: '+380502222222',
        telegram: '@after',
        internal_note: 'After note',
        custom_price_amount: null,
        custom_price_currency: 'UAH',
      })
      expect(mockedApiPatch.mock.calls[0]?.[1]).not.toHaveProperty('full_name')
      expect(within(clientsPanel).getByText('Manual After')).toBeInTheDocument()
      expect(within(clientsPanel).getByText('after@example.com')).toBeInTheDocument()
      expect(screen.queryByRole('dialog', { name: 'Редагувати клієнта' })).not.toBeInTheDocument()
    })
  })

  it('shows account badge for linked manual client records without leaving manual-card behavior', async () => {
    mockedApiGet.mockImplementation(async (url) => {
      if (url === CLIENTS_URL) return []
      if (url === CLIENT_RECORDS_URL)
        return [
          manualClientRecord({
            id: 207,
            user_id: 55,
            has_account: true,
            display_name: 'Linked Manual Client',
            email: 'linked@example.com',
          }),
        ]
      if (url === REMINDERS_URL) return []
      throw new Error(`Unexpected apiGet call: ${url}`)
    })

    const { container } = renderView()
    const { clientsPanel } = getPanels(container)

    const manualCard = await waitFor(() => {
      const card = clientsPanel.querySelector('#manual-client-record-207')
      expect(card).toBeInstanceOf(HTMLElement)
      return card as HTMLElement
    })

    expect(manualCard).toHaveClass('client-card--manual')
    expect(within(manualCard).getByText('З кабінетом')).toBeInTheDocument()
    expect(within(manualCard).getByRole('button', { name: 'Створити сесію' })).toBeInTheDocument()
    expect(within(manualCard).getByRole('button', { name: 'Редагувати' })).toBeInTheDocument()
    expect(within(manualCard).getByRole('button', { name: 'Архівувати' })).toBeInTheDocument()
    expect(within(manualCard).queryByRole('button', { name: 'Приватна історія клієнта' })).not.toBeInTheDocument()
  })

  it('shows manual account invite CTA for manual client records without account', async () => {
    mockedApiGet.mockImplementation(async (url) => {
      if (url === CLIENTS_URL) return []
      if (url === CLIENT_RECORDS_URL)
        return [
          manualClientRecord({
            id: 209,
            display_name: 'Manual Invite Candidate',
          }),
        ]
      if (url === REMINDERS_URL) return []
      throw new Error(`Unexpected apiGet call: ${url}`)
    })

    const { container } = renderView()
    const { clientsPanel } = getPanels(container)

    const manualCard = await waitFor(() => {
      const card = clientsPanel.querySelector('#manual-client-record-209')
      expect(card).toBeInstanceOf(HTMLElement)
      return card as HTMLElement
    })

    expect(within(manualCard).getByText('Клієнт зможе увійти або зареєструватися і побачити свої сесії в кабінеті.')).toBeInTheDocument()
    expect(within(manualCard).getByRole('button', { name: 'Запросити до кабінету' })).toBeInTheDocument()
  })

  it('does not show manual account invite CTA for linked manual client records', async () => {
    mockedApiGet.mockImplementation(async (url) => {
      if (url === CLIENTS_URL) return []
      if (url === CLIENT_RECORDS_URL)
        return [
          manualClientRecord({
            id: 215,
            user_id: 57,
            has_account: true,
            display_name: 'Linked Invite Hidden',
          }),
        ]
      if (url === REMINDERS_URL) return []
      throw new Error(`Unexpected apiGet call: ${url}`)
    })

    const { container } = renderView()
    const { clientsPanel } = getPanels(container)

    const manualCard = await waitFor(() => {
      const card = clientsPanel.querySelector('#manual-client-record-215')
      expect(card).toBeInstanceOf(HTMLElement)
      return card as HTMLElement
    })

    expect(within(manualCard).queryByRole('button', { name: 'Запросити до кабінету' })).not.toBeInTheDocument()
  })

  it('does not show manual account invite CTA for registered client relations', async () => {
    mockedApiGet.mockImplementation(async (url) => {
      if (url === CLIENTS_URL)
        return [
          {
            id: 1,
            client_id: 44,
            state: 'ACTIVE',
            last_session_at: null,
            upcoming_count: 0,
            client_display_name: 'Registered Client',
          },
        ]
      if (url === CLIENT_RECORDS_URL) return []
      if (url === REMINDERS_URL) return []
      throw new Error(`Unexpected apiGet call: ${url}`)
    })

    const { container } = renderView()
    const { clientsPanel } = getPanels(container)

    await waitFor(() => {
      expect(within(clientsPanel).getByText('Registered Client')).toBeInTheDocument()
    })
    expect(within(clientsPanel).queryByRole('button', { name: 'Запросити до кабінету' })).not.toBeInTheDocument()
  })

  it('creates manual account invite and shows invite URL with copy action', async () => {
    const clipboardWrite = vi.fn().mockResolvedValue(undefined)
    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: { writeText: clipboardWrite },
    })
    mockedApiGet.mockImplementation(async (url) => {
      if (url === CLIENTS_URL) return []
      if (url === CLIENT_RECORDS_URL) return [manualClientRecord({ id: 210, display_name: 'Manual Invite Create' })]
      if (url === REMINDERS_URL) return []
      throw new Error(`Unexpected apiGet call: ${url}`)
    })
    mockedCreateClientRecordAccountInvite.mockResolvedValue(
      accountInviteResponse({ id: 310, client_record_id: 210 }, 'https://proconsult.space/client/invite/new-token') as any
    )

    const { container } = renderView()
    const { clientsPanel } = getPanels(container)

    const manualCard = await waitFor(() => {
      const card = clientsPanel.querySelector('#manual-client-record-210')
      expect(card).toBeInstanceOf(HTMLElement)
      return card as HTMLElement
    })

    await fireEvent.click(within(manualCard).getByRole('button', { name: 'Запросити до кабінету' }))

    await waitFor(() => {
      expect(mockedCreateClientRecordAccountInvite).toHaveBeenCalledWith(210)
      expect(within(manualCard).getByText('https://proconsult.space/client/invite/new-token')).toBeInTheDocument()
      expect(within(manualCard).getByRole('button', { name: 'Копіювати посилання' })).toBeInTheDocument()
    })

    await fireEvent.click(within(manualCard).getByRole('button', { name: 'Копіювати посилання' }))
    expect(clipboardWrite).toHaveBeenCalledWith('https://proconsult.space/client/invite/new-token')
  })

  it('shows active invite without URL as regenerate guidance', async () => {
    mockedApiGet.mockImplementation(async (url) => {
      if (url === CLIENTS_URL) return []
      if (url === CLIENT_RECORDS_URL) return [manualClientRecord({ id: 211, display_name: 'Manual Invite Existing' })]
      if (url === REMINDERS_URL) return []
      throw new Error(`Unexpected apiGet call: ${url}`)
    })
    mockedFetchClientRecordAccountInvite.mockResolvedValue(
      accountInviteResponse({ id: 311, client_record_id: 211, invite_url: null }, null) as any
    )

    const { container } = renderView()
    const { clientsPanel } = getPanels(container)

    const manualCard = await waitFor(() => {
      const card = clientsPanel.querySelector('#manual-client-record-211')
      expect(card).toBeInstanceOf(HTMLElement)
      expect(card).toHaveTextContent('перевидайте запрошення')
      return card as HTMLElement
    })

    expect(within(manualCard).queryByRole('button', { name: 'Копіювати посилання' })).not.toBeInTheDocument()
    expect(within(manualCard).getByRole('button', { name: 'Перевидати' })).toBeInTheDocument()
    expect(within(manualCard).getByRole('button', { name: 'Відкликати' })).toBeInTheDocument()
  })

  it('regenerates manual account invite and shows new invite URL', async () => {
    mockedApiGet.mockImplementation(async (url) => {
      if (url === CLIENTS_URL) return []
      if (url === CLIENT_RECORDS_URL) return [manualClientRecord({ id: 212, display_name: 'Manual Invite Regenerate' })]
      if (url === REMINDERS_URL) return []
      throw new Error(`Unexpected apiGet call: ${url}`)
    })
    mockedFetchClientRecordAccountInvite.mockResolvedValue(
      accountInviteResponse({ id: 312, client_record_id: 212, invite_url: null }, null) as any
    )
    mockedRegenerateClientRecordAccountInvite.mockResolvedValue(
      accountInviteResponse({ id: 313, client_record_id: 212 }, 'https://proconsult.space/client/invite/regenerated') as any
    )

    const { container } = renderView()
    const { clientsPanel } = getPanels(container)

    const manualCard = await waitFor(() => {
      const card = clientsPanel.querySelector('#manual-client-record-212')
      expect(card).toBeInstanceOf(HTMLElement)
      expect(card).toHaveTextContent('перевидайте запрошення')
      return card as HTMLElement
    })

    await fireEvent.click(within(manualCard).getByRole('button', { name: 'Перевидати' }))

    await waitFor(() => {
      expect(mockedRegenerateClientRecordAccountInvite).toHaveBeenCalledWith(212)
      expect(within(manualCard).getByText('https://proconsult.space/client/invite/regenerated')).toBeInTheDocument()
    })
  })

  it('revokes manual account invite and returns to create CTA state', async () => {
    mockedApiGet.mockImplementation(async (url) => {
      if (url === CLIENTS_URL) return []
      if (url === CLIENT_RECORDS_URL) return [manualClientRecord({ id: 213, display_name: 'Manual Invite Revoke' })]
      if (url === REMINDERS_URL) return []
      throw new Error(`Unexpected apiGet call: ${url}`)
    })
    mockedFetchClientRecordAccountInvite.mockResolvedValue(
      accountInviteResponse({ id: 314, client_record_id: 213 }, 'https://proconsult.space/client/invite/revoke-me') as any
    )

    const { container } = renderView()
    const { clientsPanel } = getPanels(container)

    const manualCard = await waitFor(() => {
      const card = clientsPanel.querySelector('#manual-client-record-213')
      expect(card).toBeInstanceOf(HTMLElement)
      expect(card).toHaveTextContent('https://proconsult.space/client/invite/revoke-me')
      return card as HTMLElement
    })

    await fireEvent.click(within(manualCard).getByRole('button', { name: 'Відкликати' }))

    await waitFor(() => {
      expect(mockedRevokeClientRecordAccountInvite).toHaveBeenCalledWith(213)
      expect(within(manualCard).getByRole('button', { name: 'Запросити до кабінету' })).toBeInTheDocument()
      expect(manualCard).not.toHaveTextContent('https://proconsult.space/client/invite/revoke-me')
    })
  })

  it('shows friendly error when backend reports already linked client record', async () => {
    mockedApiGet.mockImplementation(async (url) => {
      if (url === CLIENTS_URL) return []
      if (url === CLIENT_RECORDS_URL) return [manualClientRecord({ id: 214, display_name: 'Manual Invite Error' })]
      if (url === REMINDERS_URL) return []
      throw new Error(`Unexpected apiGet call: ${url}`)
    })
    mockedCreateClientRecordAccountInvite.mockRejectedValue({
      response: { data: { code: 'CLIENT_RECORD_ALREADY_LINKED' } },
    })

    const { container } = renderView()
    const { clientsPanel } = getPanels(container)

    const manualCard = await waitFor(() => {
      const card = clientsPanel.querySelector('#manual-client-record-214')
      expect(card).toBeInstanceOf(HTMLElement)
      return card as HTMLElement
    })

    await fireEvent.click(within(manualCard).getByRole('button', { name: 'Запросити до кабінету' }))

    await waitFor(() => {
      expect(within(manualCard).getByText('Клієнт уже має підключений кабінет.')).toBeInTheDocument()
    })
  })

  it('creates session for linked manual client through client-record endpoint only', async () => {
    mockedApiGet.mockImplementation(async (url) => {
      if (url === CLIENTS_URL) return []
      if (url === CLIENT_RECORDS_URL)
        return [
          manualClientRecord({
            id: 208,
            user_id: 56,
            has_account: true,
            display_name: 'Linked Session Client',
          }),
        ]
      if (url === REMINDERS_URL) return []
      if (url === SLOTS_URL)
        return [
          {
            id: 901,
            start_at: '2099-06-20T10:00:00Z',
            end_at: '2099-06-20T10:50:00Z',
            is_booked: false,
          },
        ]
      throw new Error(`Unexpected apiGet call: ${url}`)
    })
    mockedApiPost.mockResolvedValue({ id: 710 } as any)

    const { container } = renderView()
    const { clientsPanel } = getPanels(container)

    const manualCard = await waitFor(() => {
      const card = clientsPanel.querySelector('#manual-client-record-208')
      expect(card).toBeInstanceOf(HTMLElement)
      return card as HTMLElement
    })

    await fireEvent.click(within(manualCard).getByRole('button', { name: 'Створити сесію' }))
    const dialog = await screen.findByRole('dialog', { name: /Створити сесію для Linked Session Client/ })
    await fireEvent.click(within(dialog).getByRole('button', { name: 'Створити сесію' }))

    await waitFor(() => {
      expect(mockedApiPost).toHaveBeenCalledWith('/cabinet/client-records/208/sessions/', {
        slot_id: 901,
        session_format: 'online',
      })
      expect(mockedApiPost.mock.calls[0]?.[1]).not.toHaveProperty('client_id')
      expect(mockedApiPost.mock.calls[0]?.[1]).not.toHaveProperty('client')
    })
  })

  it('archives and restores manual client records without registered client actions', async () => {
    mockedApiGet.mockImplementation(async (url) => {
      if (url === CLIENTS_URL) return []
      if (url === CLIENT_RECORDS_URL)
        return [
          manualClientRecord({
            id: 203,
            display_name: 'Manual Active',
            email: 'active@example.com',
          }),
        ]
      if (url === REMINDERS_URL) return []
      throw new Error(`Unexpected apiGet call: ${url}`)
    })
    mockedApiPost.mockImplementation(async (url) => {
      if (url === '/cabinet/client-records/203/archive/')
        return manualClientRecord({
          id: 203,
          display_name: 'Manual Active',
          email: 'active@example.com',
          status: 'archived',
          archived_at: '2099-06-15T11:00:00Z',
        }) as any
      if (url === '/cabinet/client-records/203/restore/')
        return manualClientRecord({
          id: 203,
          display_name: 'Manual Active',
          email: 'active@example.com',
          status: 'active',
          archived_at: null,
        }) as any
      throw new Error(`Unexpected apiPost call: ${url}`)
    })

    const { container } = renderView()
    const { clientsPanel } = getPanels(container)

    const manualCard = await waitFor(() => {
      const card = clientsPanel.querySelector('#manual-client-record-203')
      expect(card).toBeInstanceOf(HTMLElement)
      return card as HTMLElement
    })
    expect(within(manualCard).queryByRole('button', { name: 'Приватна історія клієнта' })).not.toBeInTheDocument()
    expect(within(manualCard).queryByRole('button', { name: 'Додати на дошку' })).not.toBeInTheDocument()
    expect(container.querySelector('a[href^="/cabinet/sessions"]')).not.toBeInTheDocument()

    await fireEvent.click(within(manualCard).getByRole('button', { name: 'Архівувати' }))

    await waitFor(() => {
      expect(mockedApiPost).toHaveBeenCalledWith('/cabinet/client-records/203/archive/', {})
      expect(within(manualCard).getByText('Архів')).toBeInTheDocument()
      expect(within(manualCard).getByRole('button', { name: 'Відновити' })).toBeInTheDocument()
    })

    await fireEvent.click(within(manualCard).getByRole('button', { name: 'Відновити' }))

    await waitFor(() => {
      expect(mockedApiPost).toHaveBeenCalledWith('/cabinet/client-records/203/restore/', {})
      expect(within(manualCard).getByText('Активний')).toBeInTheDocument()
      expect(within(manualCard).getByRole('button', { name: 'Архівувати' })).toBeInTheDocument()
    })
  })

  it('keeps registered clients visible when manual records endpoint fails', async () => {
    mockedApiGet.mockImplementation(async (url) => {
      if (url === CLIENTS_URL)
        return [
          {
            id: 1,
            client_id: 44,
            state: 'ACTIVE',
            last_session_at: null,
            upcoming_count: 0,
            client_display_name: 'Registered Client',
          },
        ]
      if (url === CLIENT_RECORDS_URL) throw { response: { data: {} } }
      if (url === REMINDERS_URL) return []
      throw new Error(`Unexpected apiGet call: ${url}`)
    })

    const { container } = renderView()
    const { clientsPanel } = getPanels(container)

    await waitFor(() => {
      expect(within(clientsPanel).getByText('Registered Client')).toBeInTheDocument()
      expect(container).toHaveTextContent('Не вдалося завантажити клієнтів без кабінету')
    })
  })

  it('filters manual records by active and archive status', async () => {
    mockedApiGet.mockImplementation(async (url) => {
      if (url === CLIENTS_URL) return []
      if (url === CLIENT_RECORDS_URL)
        return [
          manualClientRecord({ id: 204, display_name: 'Manual Active Filter', status: 'active' }),
          manualClientRecord({ id: 205, display_name: 'Manual Archived Filter', status: 'archived' }),
        ]
      if (url === REMINDERS_URL) return []
      throw new Error(`Unexpected apiGet call: ${url}`)
    })

    const { container } = renderView()
    const { clientsPanel } = getPanels(container)
    const filterButtons = await waitFor(() => {
      expect(within(clientsPanel).getByText('Manual Active Filter')).toBeInTheDocument()
      expect(within(clientsPanel).getByText('Manual Archived Filter')).toBeInTheDocument()
      return clientsPanel.querySelectorAll('.filters button')
    })

    await fireEvent.click(filterButtons[1] as HTMLButtonElement)
    await waitFor(() => {
      expect(within(clientsPanel).getByText('Manual Active Filter')).toBeInTheDocument()
      expect(within(clientsPanel).queryByText('Manual Archived Filter')).not.toBeInTheDocument()
    })

    await fireEvent.click(filterButtons[3] as HTMLButtonElement)
    await waitFor(() => {
      expect(within(clientsPanel).queryByText('Manual Active Filter')).not.toBeInTheDocument()
      expect(within(clientsPanel).getByText('Manual Archived Filter')).toBeInTheDocument()
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
