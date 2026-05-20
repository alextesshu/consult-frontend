import { fireEvent, render, screen, waitFor, within } from '@testing-library/vue'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import {
  apiGet,
  apiPatch,
  apiPost,
  createClientRegularTime,
  createNextSessionFromClientRegularTime,
  createSpecialistClientMaterial,
  deleteClientMaterialAttachment,
  createClientRecordAccountInvite,
  fetchClientRegularTimes,
  fetchSpecialistClientMaterials,
  fetchChatThreads,
  fetchClientRecordAccountInvite,
  listClientMaterialAttachments,
  pauseClientRegularTime,
  publishSpecialistClientMaterial,
  regenerateClientRecordAccountInvite,
  resumeClientRegularTime,
  revokeSpecialistClientMaterial,
  revokeClientRecordAccountInvite,
  uploadClientMaterialAttachment,
  updateClientRegularTime,
  updateSpecialistClientMaterial,
} from '../lib/api'
import TherapistClientsView from './TherapistClientsView.vue'
import { createPracticeBoardItem, fetchPracticeBoards } from '../lib/specialistPracticeBoard'
import { skipSpecialistSessionNote } from '../lib/specialistSessions'

const mockToast = {
  success: vi.fn(),
  error: vi.fn(),
  info: vi.fn(),
}

vi.mock('../lib/api', () => ({
  apiGet: vi.fn(),
  apiPatch: vi.fn(),
  apiPost: vi.fn(),
  createClientRegularTime: vi.fn(),
  createNextSessionFromClientRegularTime: vi.fn(),
  createSpecialistClientMaterial: vi.fn(),
  deleteClientMaterialAttachment: vi.fn(),
  createClientRecordAccountInvite: vi.fn(),
  fetchClientRegularTimes: vi.fn(),
  fetchSpecialistClientMaterials: vi.fn(),
  fetchChatThreads: vi.fn(),
  fetchClientRecordAccountInvite: vi.fn(),
  listClientMaterialAttachments: vi.fn(),
  pauseClientRegularTime: vi.fn(),
  hasMaterialUrl: (material: { url?: string | null }) => Boolean(String(material?.url || '').trim()),
  publishSpecialistClientMaterial: vi.fn(),
  regenerateClientRecordAccountInvite: vi.fn(),
  resumeClientRegularTime: vi.fn(),
  revokeSpecialistClientMaterial: vi.fn(),
  revokeClientRecordAccountInvite: vi.fn(),
  uploadClientMaterialAttachment: vi.fn(),
  updateClientRegularTime: vi.fn(),
  updateSpecialistClientMaterial: vi.fn(),
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
const mockedCreateClientRegularTime = vi.mocked(createClientRegularTime)
const mockedCreateNextSessionFromClientRegularTime = vi.mocked(createNextSessionFromClientRegularTime)
const mockedCreateSpecialistClientMaterial = vi.mocked(createSpecialistClientMaterial)
const mockedDeleteClientMaterialAttachment = vi.mocked(deleteClientMaterialAttachment)
const mockedCreateClientRecordAccountInvite = vi.mocked(createClientRecordAccountInvite)
const mockedFetchClientRegularTimes = vi.mocked(fetchClientRegularTimes)
const mockedFetchSpecialistClientMaterials = vi.mocked(fetchSpecialistClientMaterials)
const mockedFetchChatThreads = vi.mocked(fetchChatThreads)
const mockedFetchClientRecordAccountInvite = vi.mocked(fetchClientRecordAccountInvite)
const mockedListClientMaterialAttachments = vi.mocked(listClientMaterialAttachments)
const mockedPauseClientRegularTime = vi.mocked(pauseClientRegularTime)
const mockedPublishSpecialistClientMaterial = vi.mocked(publishSpecialistClientMaterial)
const mockedRegenerateClientRecordAccountInvite = vi.mocked(regenerateClientRecordAccountInvite)
const mockedResumeClientRegularTime = vi.mocked(resumeClientRegularTime)
const mockedRevokeSpecialistClientMaterial = vi.mocked(revokeSpecialistClientMaterial)
const mockedRevokeClientRecordAccountInvite = vi.mocked(revokeClientRecordAccountInvite)
const mockedUploadClientMaterialAttachment = vi.mocked(uploadClientMaterialAttachment)
const mockedUpdateClientRegularTime = vi.mocked(updateClientRegularTime)
const mockedUpdateSpecialistClientMaterial = vi.mocked(updateSpecialistClientMaterial)
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

function getClientRows(container: Element) {
  return Array.from(container.querySelectorAll('.client-row')) as HTMLElement[]
}

async function selectClientRowByName(container: Element, name: string) {
  const row = await waitFor(() => {
    const item = getClientRows(container).find((node) => node.textContent?.includes(name))
    expect(item).toBeInstanceOf(HTMLElement)
    return item as HTMLElement
  })
  await fireEvent.click(row)
  return row
}

async function openAccordionSection(scope: HTMLElement, name: string) {
  const button = await waitFor(() => {
    const item = Array.from(scope.querySelectorAll('.client-accordion__header')).find((node) =>
      node.textContent?.includes(name)
    )
    expect(item).toBeInstanceOf(HTMLButtonElement)
    return item as HTMLButtonElement
  })
  await fireEvent.click(button)
  return button
}

async function selectRegularTimeDate(scope: HTMLElement, isoDate: string) {
  const [yearRaw, monthRaw, dayRaw] = isoDate.split('-')
  const year = Number(yearRaw)
  const month = Number(monthRaw)
  const day = Number(dayRaw)
  const displayDate = `${String(day).padStart(2, '0')}.${String(month).padStart(2, '0')}.${year}`

  await fireEvent.click(within(scope).getByLabelText('Вибрати дату'))

  const current = new Date()
  const monthDelta = (year - current.getFullYear()) * 12 + (month - 1 - current.getMonth())
  const directionName = monthDelta >= 0 ? 'Наступний місяць' : 'Попередній місяць'
  for (let index = 0; index < Math.abs(monthDelta); index += 1) {
    await fireEvent.click(within(scope).getByLabelText(directionName))
  }

  await fireEvent.click(within(scope).getByRole('button', { name: displayDate }))
  return displayDate
}

function manualClientRecord(overrides: Record<string, unknown> = {}) {
  return {
    id: 201,
    user_id: null,
    display_name: 'Manual Client',
    email: null,
    account_email: null,
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

function regularTimeRecord(overrides: Record<string, unknown> = {}) {
  return {
    id: 801,
    client_record: 201,
    weekday: 2,
    start_time: '15:00',
    duration_minutes: 50,
    frequency: 'weekly',
    starts_on: '2026-05-20',
    timezone: 'Europe/Kyiv',
    session_format: 'online',
    meeting_url: '',
    offline_location: '',
    status: 'active',
    paused_at: null,
    created_at: '2026-05-15T10:00:00Z',
    updated_at: '2026-05-15T10:00:00Z',
    ...overrides,
  }
}

describe('TherapistClientsView', () => {
  beforeEach(() => {
    mockedApiGet.mockReset()
    mockedApiPatch.mockReset()
    mockedApiPost.mockReset()
    mockedCreateClientRegularTime.mockReset()
    mockedCreateClientRegularTime.mockResolvedValue({} as any)
    mockedCreateNextSessionFromClientRegularTime.mockReset()
    mockedCreateNextSessionFromClientRegularTime.mockResolvedValue({
      created: true,
      regular_time_id: 801,
      occurrence_start_at: '2026-05-20T15:00:00+03:00',
      occurrence_end_at: '2026-05-20T15:50:00+03:00',
      session: { id: 9901 },
    } as any)
    mockedCreateSpecialistClientMaterial.mockReset()
    mockedCreateSpecialistClientMaterial.mockResolvedValue({} as any)
    mockedDeleteClientMaterialAttachment.mockReset()
    mockedDeleteClientMaterialAttachment.mockResolvedValue(undefined as any)
    mockedCreateClientRecordAccountInvite.mockReset()
    mockedCreateClientRecordAccountInvite.mockResolvedValue({ invite: null, invite_url: null } as any)
    mockedFetchChatThreads.mockReset()
    mockedFetchChatThreads.mockResolvedValue([])
    mockedFetchClientRecordAccountInvite.mockReset()
    mockedFetchClientRecordAccountInvite.mockResolvedValue(null)
    mockedFetchClientRegularTimes.mockReset()
    mockedFetchClientRegularTimes.mockResolvedValue([])
    mockedListClientMaterialAttachments.mockReset()
    mockedListClientMaterialAttachments.mockResolvedValue([])
    mockedPauseClientRegularTime.mockReset()
    mockedPauseClientRegularTime.mockResolvedValue({} as any)
    mockedFetchSpecialistClientMaterials.mockReset()
    mockedFetchSpecialistClientMaterials.mockResolvedValue([])
    mockedPublishSpecialistClientMaterial.mockReset()
    mockedPublishSpecialistClientMaterial.mockResolvedValue({} as any)
    mockedRegenerateClientRecordAccountInvite.mockReset()
    mockedRegenerateClientRecordAccountInvite.mockResolvedValue({ invite: null, invite_url: null } as any)
    mockedResumeClientRegularTime.mockReset()
    mockedResumeClientRegularTime.mockResolvedValue({} as any)
    mockedRevokeSpecialistClientMaterial.mockReset()
    mockedRevokeSpecialistClientMaterial.mockResolvedValue({} as any)
    mockedRevokeClientRecordAccountInvite.mockReset()
    mockedRevokeClientRecordAccountInvite.mockResolvedValue({ invite: null, invite_url: null } as any)
    mockedUploadClientMaterialAttachment.mockReset()
    mockedUploadClientMaterialAttachment.mockResolvedValue({} as any)
    mockedUpdateClientRegularTime.mockReset()
    mockedUpdateClientRegularTime.mockResolvedValue({} as any)
    mockedUpdateSpecialistClientMaterial.mockReset()
    mockedUpdateSpecialistClientMaterial.mockResolvedValue({} as any)
    mockedCreatePracticeBoardItem.mockReset()
    mockedFetchPracticeBoards.mockReset()
    mockedSkipSpecialistSessionNote.mockReset()
    mockedSkipSpecialistSessionNote.mockResolvedValue(undefined)
    mockToast.success.mockReset()
    mockToast.error.mockReset()
    mockToast.info.mockReset()
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
      if (url === CLIENT_RECORDS_URL) return []
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
      expect(within(clientsPanel).getAllByText('Olena').length).toBeGreaterThan(0)
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

    const card = await waitFor(() => {
      const node = container.querySelector('.client-card')
      expect(node).toBeInstanceOf(HTMLElement)
      return node as HTMLElement
    })
    await openAccordionSection(card, 'Керування клієнтом')
    await fireEvent.click(within(card).getByRole('button', { name: 'Архівувати' }))

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
      if (url === CLIENT_RECORDS_URL) return []
      if (url === REMINDERS_URL) return []
      throw new Error(`Unexpected apiGet call: ${url}`)
    })
    mockedCreatePracticeBoardItem.mockResolvedValue({ id: 901 } as any)
    mockedFetchPracticeBoards.mockResolvedValue([{ id: 1, title: 'Main board', is_default: true }] as any)

    const { container } = renderView()
    const card = await waitFor(() => {
      const node = container.querySelector('.client-card')
      expect(node).toBeInstanceOf(HTMLElement)
      return node as HTMLElement
    })
    await openAccordionSection(card, 'Керування клієнтом')

    const quickAddButton = await waitFor(() => {
      const button = screen.getByRole('button', { name: 'Додати на дошку' })
      expect(button).toBeInstanceOf(HTMLButtonElement)
      return button as HTMLButtonElement
    })

    await fireEvent.click(quickAddButton)
    const quickAddModal = await screen.findByRole('dialog')
    const quickAddInput = quickAddModal.querySelector('.quick-add-modal__content input.input')
    const quickAddSubmit = quickAddModal.querySelector('.quick-add-modal__actions .btn')
    expect(quickAddInput).toBeInstanceOf(HTMLInputElement)
    expect(quickAddSubmit).toBeInstanceOf(HTMLButtonElement)
    await fireEvent.update(quickAddInput as HTMLInputElement, 'Client follow-up task')
    await fireEvent.click(quickAddSubmit as HTMLButtonElement)

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
      if (url === CLIENT_RECORDS_URL) return []
      if (url === REMINDERS_URL) return []
      throw new Error(`Unexpected apiGet call: ${url}`)
    })

    const { container } = renderView()
    const card = await waitFor(() => {
      const node = container.querySelector('.client-card')
      expect(node).toBeInstanceOf(HTMLElement)
      return node as HTMLElement
    })
    await openAccordionSection(card, 'Керування клієнтом')

    const quickAddButton = await waitFor(() => {
      const button = screen.getByRole('button', { name: 'Додати на дошку' })
      expect(button).toBeInstanceOf(HTMLButtonElement)
      return button as HTMLButtonElement
    })

    await fireEvent.click(quickAddButton)
    const quickAddModal = await screen.findByRole('dialog')
    const quickAddSubmit = quickAddModal.querySelector('.quick-add-modal__actions .btn')
    expect(quickAddSubmit).toBeInstanceOf(HTMLButtonElement)
    await fireEvent.click(quickAddSubmit as HTMLButtonElement)

    await waitFor(() => {
      expect(quickAddModal.querySelector('.form-error')).toBeTruthy()
    })
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
      if (url === CLIENT_RECORDS_URL) return []
      if (url === REMINDERS_URL) return []
      throw new Error(`Unexpected apiGet call: ${url}`)
    })
    mockedCreatePracticeBoardItem.mockResolvedValue({ id: 902 } as any)
    mockedFetchPracticeBoards.mockResolvedValue([])

    const { container } = renderView()
    const card = await waitFor(() => {
      const node = container.querySelector('.client-card')
      expect(node).toBeInstanceOf(HTMLElement)
      return node as HTMLElement
    })
    await openAccordionSection(card, 'Керування клієнтом')

    const quickAddButton = await waitFor(() => {
      const button = screen.getByRole('button', { name: 'Додати на дошку' })
      expect(button).toBeInstanceOf(HTMLButtonElement)
      return button as HTMLButtonElement
    })

    await fireEvent.click(quickAddButton)
    const quickAddModal = await screen.findByRole('dialog')
    const quickAddInput = quickAddModal.querySelector('.quick-add-modal__content input.input')
    const quickAddSubmit = quickAddModal.querySelector('.quick-add-modal__actions .btn')
    expect(quickAddInput).toBeInstanceOf(HTMLInputElement)
    expect(quickAddSubmit).toBeInstanceOf(HTMLButtonElement)
    await fireEvent.update(quickAddInput as HTMLInputElement, 'No-board client task')
    await fireEvent.click(quickAddSubmit as HTMLButtonElement)

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
      if (url === CLIENT_RECORDS_URL) return []
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

    const card = await waitFor(() => {
      const node = container.querySelector('.client-card')
      expect(node).toBeInstanceOf(HTMLElement)
      return node as HTMLElement
    })
    await openAccordionSection(card, 'Приватна історія')
    await openAccordionSection(card, 'Робочий зошит')

    const expandButton = await waitFor(() => {
      const button = container.querySelector('.workbook-block__controls button:last-of-type')
      expect(button).toBeInstanceOf(HTMLButtonElement)
      return button as HTMLButtonElement
    })
    await fireEvent.click(expandButton)

    await waitFor(() => {
      expect(container.querySelector('textarea.workbook-textarea')).toHaveValue('journal-44')
    })

    await openAccordionSection(card, 'Нотатки по сесіях')

    await waitFor(() => {
      expect(container.querySelector('a[href="/cabinet/sessions#note-777"]')).toBeInTheDocument()
      expect(container.querySelector('a[href="/cabinet/sessions#note-778"]')).toBeInTheDocument()
      expect(container.querySelector('a[href="/cabinet/clients/44/workbook"]')).toBeInTheDocument()
    })
    expect(mockedApiGet).not.toHaveBeenCalledWith('/cabinet/clients/44/journal/')
  })

  it('shows client session notes dose-wise and reveals older notes on demand', async () => {
    const historyItems = Array.from({ length: 8 }, (_, index) => {
      const sessionId = 801 + index
      const day = 20 - index
      return {
        session_id: sessionId,
        status: 'COMPLETED',
        slot_start_at: `2099-06-${String(day).padStart(2, '0')}T10:00:00Z`,
        slot_end_at: `2099-06-${String(day).padStart(2, '0')}T10:50:00Z`,
        has_note: sessionId !== 803,
        note_updated_at: sessionId === 803 ? null : `2099-06-${String(day).padStart(2, '0')}T11:00:00Z`,
      }
    })

    mockedApiGet.mockImplementation(async (url) => {
      if (url === CLIENTS_URL)
        return [
          {
            id: 1,
            client_id: 44,
            state: 'ACTIVE',
            last_session_at: null,
            upcoming_count: 0,
            client_display_name: 'Compact History Client',
            client_journal_content: 'private workbook',
            has_workbook_content: true,
          },
        ]
      if (url === CLIENT_RECORDS_URL) return []
      if (url === REMINDERS_URL) return []
      if (url === clientHistoryUrl(44)) return historyItems
      throw new Error(`Unexpected apiGet call: ${url}`)
    })

    const { container } = renderView()

    const card = await waitFor(() => {
      const node = container.querySelector('.client-card')
      expect(node).toBeInstanceOf(HTMLElement)
      return node as HTMLElement
    })
    await openAccordionSection(card, 'Приватна історія')

    await waitFor(() => {
      expect(container.querySelector('.history-title')?.textContent).toContain('Приватна історія')
    })

    await openAccordionSection(card, 'Нотатки по сесіях')

    await waitFor(() => {
      expect(container.querySelector('a[href="/cabinet/sessions#note-801"]')).toBeInTheDocument()
      expect(container.querySelector('a[href="/cabinet/sessions#note-802"]')).toBeInTheDocument()
      expect(container.querySelector('a[href="/cabinet/sessions#note-803"]')).toBeInTheDocument()
    })

    expect(container.querySelector('a[href="/cabinet/sessions#note-804"]')).not.toBeInTheDocument()
    const emptyNote = screen.getByText('Нотатки ще немає.')
    expect(emptyNote.closest('.history-item')).toHaveClass('history-item--empty')
    expect(screen.getByRole('button', { name: 'Показати ще' })).toBeInTheDocument()

    await fireEvent.click(screen.getByRole('button', { name: 'Показати ще' }))

    await waitFor(() => {
      expect(container.querySelector('a[href="/cabinet/sessions#note-808"]')).toBeInTheDocument()
    })
    expect(screen.queryByRole('button', { name: 'Показати ще' })).not.toBeInTheDocument()
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
      expect(clientsPanel.querySelectorAll('.client-row')).toHaveLength(3)
      expect(clientsPanel.querySelectorAll('.client-card')).toHaveLength(1)
    })

    await fireEvent.update(searchInput, 'A-101')
    await waitFor(() => {
      expect(clientsPanel.querySelectorAll('.client-row')).toHaveLength(1)
      expect(clientsPanel.querySelectorAll('.client-card')).toHaveLength(1)
    })

    await fireEvent.update(searchInput, '44')
    await waitFor(() => {
      expect(clientsPanel.querySelectorAll('.client-row')).toHaveLength(1)
      expect(clientsPanel.querySelectorAll('.client-card')).toHaveLength(1)
    })

    await fireEvent.click(filterButtons[2] as HTMLButtonElement)
    await waitFor(() => {
      expect(clientsPanel.querySelectorAll('.client-row')).toHaveLength(0)
      expect(clientsPanel.querySelectorAll('.client-card')).toHaveLength(0)
      expect(clientsPanel.querySelector('.empty-state')).toBeTruthy()
    })

    await fireEvent.update(searchInput, 'B-500')
    await waitFor(() => {
      expect(clientsPanel.querySelectorAll('.client-row')).toHaveLength(1)
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
      expect(within(clientsPanel).getAllByText('Active Client').length).toBeGreaterThan(0)
      expect(clientsPanel.querySelectorAll('.client-row')).toHaveLength(3)
      expect(clientsPanel.querySelectorAll('.client-card')).toHaveLength(1)
      expect(clientsPanel.querySelector('.client-row--selected')).toHaveTextContent('Active Client')
      expect(clientsPanel.querySelector('.client-status--active')).toHaveTextContent('Активний')
      expect(clientsPanel.querySelector('.client-status--inactive')).toHaveTextContent('Неактивний')
      expect(clientsPanel.querySelector('.client-status--archived')).toHaveTextContent('Архів')
    })

    const firstCard = clientsPanel.querySelector('.client-card') as HTMLElement
    expect(within(firstCard).getByText('Остання сесія')).toBeInTheDocument()
    expect(within(firstCard).getByText('Майбутніх сесій')).toBeInTheDocument()
    expect(within(firstCard).getByText('Остання нотатка')).toBeInTheDocument()
    expect(within(firstCard).getAllByText('Робочий зошит').length).toBeGreaterThan(0)
    expect(within(firstCard).getByText('Оновлено')).toBeInTheDocument()
    expect(within(firstCard).getByRole('link', { name: 'Відкрити нотатку' })).toHaveAttribute(
      'href',
      '/cabinet/sessions#note-777'
    )
    expect(within(firstCard).getByText('Редагування, дошка, архів')).toBeInTheDocument()
    await openAccordionSection(firstCard, 'Керування клієнтом')
    expect(within(firstCard).getByRole('button', { name: 'Додати на дошку' })).toBeInTheDocument()
    expect(within(firstCard).getByRole('button', { name: 'Архівувати' })).toBeInTheDocument()
    expect(clientsPanel).not.toHaveTextContent('ACTIVE')
    expect(clientsPanel).not.toHaveTextContent('INACTIVE')
    expect(clientsPanel).not.toHaveTextContent('ARCHIVED')
  })

  it('renders compact rows and switches the single details panel on client selection', async () => {
    mockedApiGet.mockImplementation(async (url) => {
      if (url === CLIENTS_URL)
        return [
          {
            id: 1,
            client_id: 44,
            state: 'ACTIVE',
            last_session_at: null,
            upcoming_count: 1,
            client_display_name: 'First Client',
          },
          {
            id: 2,
            client_id: 55,
            state: 'ACTIVE',
            last_session_at: null,
            upcoming_count: 0,
            client_display_name: 'Second Client',
          },
        ]
      if (url === REMINDERS_URL) return []
      if (url === clientHistoryUrl(55)) return []
      throw new Error(`Unexpected apiGet call: ${url}`)
    })

    const { container } = renderView()
    const { clientsPanel } = getPanels(container)

    await waitFor(() => {
      expect(clientsPanel.querySelectorAll('.client-row')).toHaveLength(2)
      expect(clientsPanel.querySelectorAll('.client-card')).toHaveLength(1)
      expect(clientsPanel.querySelector('.client-row--selected')).toHaveTextContent('First Client')
      expect(clientsPanel.querySelector('.client-card')).toHaveTextContent('First Client')
      expect(clientsPanel.querySelector('.client-card')).not.toHaveTextContent('Second Client')
    })

    await selectClientRowByName(clientsPanel, 'Second Client')

    await waitFor(() => {
      expect(clientsPanel.querySelectorAll('.client-card')).toHaveLength(1)
      expect(clientsPanel.querySelector('.client-row--selected')).toHaveTextContent('Second Client')
      expect(clientsPanel.querySelector('.client-row--selected')).toHaveAttribute('aria-current', 'true')
      expect(clientsPanel.querySelector('.client-card')).toHaveTextContent('Second Client')
      expect(clientsPanel.querySelector('.client-card')).not.toHaveTextContent('First Client')
    })

    const selectedCard = clientsPanel.querySelector('.client-card') as HTMLElement
    expect(selectedCard).not.toHaveTextContent('Інформація зашифрована')
    expect(selectedCard).not.toHaveTextContent('Зошит згорнуто')
    expect(selectedCard).not.toHaveTextContent('Нотаток по цьому клієнту')

    const privateHeader = await openAccordionSection(selectedCard, 'Приватна історія')
    expect(privateHeader).toHaveAttribute('aria-expanded', 'true')
    expect(selectedCard).toHaveTextContent('Інформація зашифрована')

    await openAccordionSection(selectedCard, 'Нотатки по сесіях')
    await waitFor(() => {
      expect(selectedCard).not.toHaveTextContent('Інформація зашифрована')
      expect(selectedCard).toHaveTextContent('Нотаток по цьому клієнту ще немає.')
    })
  })

  it('places selected client details directly after the selected row in DOM order', async () => {
    mockedApiGet.mockImplementation(async (url) => {
      if (url === CLIENTS_URL)
        return [
          {
            id: 1,
            client_id: 44,
            state: 'ACTIVE',
            last_session_at: null,
            upcoming_count: 0,
            client_display_name: 'First Client',
          },
          {
            id: 2,
            client_id: 55,
            state: 'ACTIVE',
            last_session_at: null,
            upcoming_count: 0,
            client_display_name: 'Second Client',
          },
          {
            id: 3,
            client_id: 66,
            state: 'ACTIVE',
            last_session_at: null,
            upcoming_count: 0,
            client_display_name: 'Third Client',
          },
        ]
      if (url === REMINDERS_URL) return []
      throw new Error(`Unexpected apiGet call: ${url}`)
    })

    const { container } = renderView()
    const { clientsPanel } = getPanels(container)

    await selectClientRowByName(clientsPanel, 'Second Client')

    await waitFor(() => {
      const master = clientsPanel.querySelector('.clients-master-detail')
      expect(master).toBeInstanceOf(HTMLElement)
      const children = Array.from(master?.children || []) as HTMLElement[]
      const secondRow = children.find((node) => node.classList.contains('client-row') && node.textContent?.includes('Second Client'))
      const thirdRow = children.find((node) => node.classList.contains('client-row') && node.textContent?.includes('Third Client'))
      const detail = children.find((node) => node.classList.contains('client-detail'))

      expect(detail).toBeInstanceOf(HTMLElement)
      expect(detail).toHaveTextContent('Second Client')
      expect(detail).not.toHaveTextContent('First Client')
      expect(detail).not.toHaveTextContent('Third Client')
      expect(children.indexOf(detail as HTMLElement)).toBe(children.indexOf(secondRow as HTMLElement) + 1)
      expect(children.indexOf(detail as HTMLElement)).toBeLessThan(children.indexOf(thirdRow as HTMLElement))
      expect(clientsPanel.querySelectorAll('.client-detail')).toHaveLength(1)
    })
  })

  it('keeps selected client detail in inline visual order on tablet-width layouts', async () => {
    Object.defineProperty(window, 'innerWidth', {
      configurable: true,
      value: 820,
    })
    mockedApiGet.mockImplementation(async (url) => {
      if (url === CLIENTS_URL)
        return [
          {
            id: 1,
            client_id: 44,
            state: 'ACTIVE',
            last_session_at: null,
            upcoming_count: 0,
            client_display_name: 'Tablet First',
          },
          {
            id: 2,
            client_id: 55,
            state: 'ACTIVE',
            last_session_at: null,
            upcoming_count: 0,
            client_display_name: 'Tablet Second',
          },
        ]
      if (url === REMINDERS_URL) return []
      throw new Error(`Unexpected apiGet call: ${url}`)
    })

    const { container } = renderView()
    const { clientsPanel } = getPanels(container)

    const selectedRow = await selectClientRowByName(clientsPanel, 'Tablet First')
    const detail = await waitFor(() => {
      const node = selectedRow.nextElementSibling
      expect(node).toBeInstanceOf(HTMLElement)
      expect(node).toHaveClass('client-detail')
      return node as HTMLElement
    })
    const secondRow = await waitFor(() => {
      const node = Array.from(clientsPanel.querySelectorAll('.client-row')).find((item) =>
        item.textContent?.includes('Tablet Second')
      )
      expect(node).toBeInstanceOf(HTMLElement)
      return node as HTMLElement
    })

    expect(detail.compareDocumentPosition(secondRow) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
  })

  it('moves inline selected client detail under the newly selected row', async () => {
    mockedApiGet.mockImplementation(async (url) => {
      if (url === CLIENTS_URL)
        return [
          {
            id: 1,
            client_id: 44,
            state: 'ACTIVE',
            last_session_at: null,
            upcoming_count: 0,
            client_display_name: 'Move First',
          },
          {
            id: 2,
            client_id: 55,
            state: 'ACTIVE',
            last_session_at: null,
            upcoming_count: 0,
            client_display_name: 'Move Second',
          },
          {
            id: 3,
            client_id: 66,
            state: 'ACTIVE',
            last_session_at: null,
            upcoming_count: 0,
            client_display_name: 'Move Third',
          },
        ]
      if (url === REMINDERS_URL) return []
      throw new Error(`Unexpected apiGet call: ${url}`)
    })

    const { container } = renderView()
    const { clientsPanel } = getPanels(container)

    const firstRow = await selectClientRowByName(clientsPanel, 'Move First')
    await waitFor(() => {
      expect(firstRow.nextElementSibling).toBeInstanceOf(HTMLElement)
      expect(firstRow.nextElementSibling).toHaveClass('client-detail')
      expect(firstRow.nextElementSibling).toHaveTextContent('Move First')
    })

    const secondRow = await selectClientRowByName(clientsPanel, 'Move Second')

    await waitFor(() => {
      expect(firstRow.nextElementSibling).toHaveClass('client-row')
      expect(firstRow.nextElementSibling).toHaveTextContent('Move Second')
      expect(secondRow.nextElementSibling).toBeInstanceOf(HTMLElement)
      expect(secondRow.nextElementSibling).toHaveClass('client-detail')
      expect(secondRow.nextElementSibling).toHaveTextContent('Move Second')
      expect(clientsPanel.querySelectorAll('.client-detail')).toHaveLength(1)
    })
  })

  it('keeps regular time accordion available inside inline selected client details', async () => {
    mockedApiGet.mockImplementation(async (url) => {
      if (url === CLIENTS_URL)
        return [
          {
            id: 1,
            client_id: 44,
            client_record_id: 901,
            state: 'ACTIVE',
            last_session_at: null,
            upcoming_count: 0,
            client_display_name: 'First Client',
          },
          {
            id: 2,
            client_id: 55,
            client_record_id: 5,
            state: 'ACTIVE',
            last_session_at: null,
            upcoming_count: 0,
            client_display_name: 'Second Client',
          },
          {
            id: 3,
            client_id: 66,
            client_record_id: 903,
            state: 'ACTIVE',
            last_session_at: null,
            upcoming_count: 0,
            client_display_name: 'Third Client',
          },
        ]
      if (url === REMINDERS_URL) return []
      throw new Error(`Unexpected apiGet call: ${url}`)
    })
    mockedFetchClientRegularTimes.mockResolvedValue([
      regularTimeRecord({ client_record: 5, weekday: 2, start_time: '15:00' }),
    ] as any)

    const { container } = renderView()
    const { clientsPanel } = getPanels(container)

    const selectedRow = await selectClientRowByName(clientsPanel, 'Second Client')
    const inlineDetail = await waitFor(() => {
      const detail = selectedRow.nextElementSibling
      expect(detail).toBeInstanceOf(HTMLElement)
      expect(detail).toHaveClass('client-detail')
      return detail as HTMLElement
    })
    const selectedCard = inlineDetail.querySelector('.client-card') as HTMLElement

    await openAccordionSection(selectedCard, 'Регулярний час')

    await waitFor(() => {
      expect(mockedFetchClientRegularTimes).toHaveBeenCalledWith(5)
      expect(selectedCard).toHaveTextContent('Середа, 15:00')
      expect(selectedCard).toHaveTextContent('щотижня')
    })
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
        'Додавайте клієнтів вручну, щоб швидко почати роботу. Коли буде потрібно, запросіть клієнта до кабінету — там він бачитиме розклад своїх сесій, нагадування, інформацію про оплату та матеріали.'
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
      expect(within(clientsPanel).getAllByText('Марія Коваль').length).toBeGreaterThan(0)
      expect(within(clientsPanel).getAllByText('Без реєстрації').length).toBeGreaterThan(0)
      expect(within(clientsPanel).getAllByText('maria@example.com').length).toBeGreaterThan(0)
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
      expect(within(clientsPanel).getAllByText('Manual After').length).toBeGreaterThan(0)
      expect(within(clientsPanel).getAllByText('after@example.com').length).toBeGreaterThan(0)
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
    expect(within(manualCard).getByText('Редагування, дошка, архів')).toBeInTheDocument()
    await openAccordionSection(manualCard, 'Керування клієнтом')
    expect(within(manualCard).getAllByRole('button', { name: 'Редагувати' })).toHaveLength(1)
    expect(within(manualCard).getByRole('button', { name: 'Архівувати' })).toBeInTheDocument()
    expect(within(manualCard).queryByRole('button', { name: 'Приватна історія клієнта' })).not.toBeInTheDocument()
  })

  it('shows contact and account email separately for linked manual client when they differ', async () => {
    mockedApiGet.mockImplementation(async (url) => {
      if (url === CLIENTS_URL) return []
      if (url === CLIENT_RECORDS_URL) {
        return [
          manualClientRecord({
            id: 271,
            user_id: 991,
            has_account: true,
            email: 'contact271@example.com',
            account_email: 'account271@example.com',
          }),
        ]
      }
      if (url === REMINDERS_URL) return []
      throw new Error(`Unexpected apiGet call: ${url}`)
    })

    const { container } = renderView()
    const { clientsPanel } = getPanels(container)
    const manualCard = await waitFor(() => {
      const card = clientsPanel.querySelector('#manual-client-record-271')
      expect(card).toBeInstanceOf(HTMLElement)
      return card as HTMLElement
    })

    expect(within(manualCard).getByText('contact271@example.com')).toBeInTheDocument()
    expect(within(manualCard).getByText('account271@example.com')).toBeInTheDocument()
  })

  it('shows only account email when contact email is empty', async () => {
    mockedApiGet.mockImplementation(async (url) => {
      if (url === CLIENTS_URL) return []
      if (url === CLIENT_RECORDS_URL) {
        return [
          manualClientRecord({
            id: 272,
            user_id: 992,
            has_account: true,
            email: null,
            account_email: 'account272@example.com',
          }),
        ]
      }
      if (url === REMINDERS_URL) return []
      throw new Error(`Unexpected apiGet call: ${url}`)
    })

    const { container } = renderView()
    const { clientsPanel } = getPanels(container)
    const manualCard = await waitFor(() => {
      const card = clientsPanel.querySelector('#manual-client-record-272')
      expect(card).toBeInstanceOf(HTMLElement)
      return card as HTMLElement
    })

    expect(within(manualCard).getByText('account272@example.com')).toBeInTheDocument()
    expect(within(manualCard).queryByText('contact272@example.com')).not.toBeInTheDocument()
  })

  it('does not render account email row for unlinked manual client', async () => {
    mockedApiGet.mockImplementation(async (url) => {
      if (url === CLIENTS_URL) return []
      if (url === CLIENT_RECORDS_URL) {
        return [
          manualClientRecord({
            id: 273,
            user_id: null,
            has_account: false,
            email: 'contact273@example.com',
            account_email: null,
          }),
        ]
      }
      if (url === REMINDERS_URL) return []
      throw new Error(`Unexpected apiGet call: ${url}`)
    })

    const { container } = renderView()
    const { clientsPanel } = getPanels(container)
    const manualCard = await waitFor(() => {
      const card = clientsPanel.querySelector('#manual-client-record-273')
      expect(card).toBeInstanceOf(HTMLElement)
      return card as HTMLElement
    })

    expect(within(manualCard).getByText('contact273@example.com')).toBeInTheDocument()
    expect(within(manualCard).queryByText('account273@example.com')).not.toBeInTheDocument()
  })

  it('does not duplicate email row when contact and account email are equal', async () => {
    mockedApiGet.mockImplementation(async (url) => {
      if (url === CLIENTS_URL) return []
      if (url === CLIENT_RECORDS_URL) {
        return [
          manualClientRecord({
            id: 274,
            user_id: 993,
            has_account: true,
            email: 'same274@example.com',
            account_email: 'same274@example.com',
          }),
        ]
      }
      if (url === REMINDERS_URL) return []
      throw new Error(`Unexpected apiGet call: ${url}`)
    })

    const { container } = renderView()
    const { clientsPanel } = getPanels(container)
    const manualCard = await waitFor(() => {
      const card = clientsPanel.querySelector('#manual-client-record-274')
      expect(card).toBeInstanceOf(HTMLElement)
      return card as HTMLElement
    })

    expect(within(manualCard).getByText('same274@example.com')).toBeInTheDocument()
    expect(within(manualCard).queryAllByText('same274@example.com')).toHaveLength(1)
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
    await openAccordionSection(manualCard, 'Запросити до кабінету')

    expect(within(manualCard).getByText('Клієнт зможе увійти або зареєструватися і побачити свої сесії в кабінеті.')).toBeInTheDocument()
    expect(within(manualCard).getAllByRole('button', { name: 'Запросити до кабінету' }).length).toBeGreaterThan(0)
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
      expect(within(clientsPanel).getAllByText('Registered Client').length).toBeGreaterThan(0)
    })
    expect(within(clientsPanel).queryByRole('button', { name: 'Запросити до кабінету' })).not.toBeInTheDocument()
  })

  it('renders registered client email when client_email exists', async () => {
    mockedApiGet.mockImplementation(async (url) => {
      if (url === CLIENTS_URL) {
        return [
          {
            id: 2,
            client_id: 45,
            client_email: 'registered45@example.com',
            state: 'ACTIVE',
            last_session_at: null,
            upcoming_count: 0,
            client_display_name: 'Registered With Email',
          },
        ]
      }
      if (url === CLIENT_RECORDS_URL) return []
      if (url === REMINDERS_URL) return []
      throw new Error(`Unexpected apiGet call: ${url}`)
    })

    const { container } = renderView()
    const { clientsPanel } = getPanels(container)
    const registeredCard = await waitFor(() => {
      const card = clientsPanel.querySelector('#client-card-45')
      expect(card).toBeInstanceOf(HTMLElement)
      return card as HTMLElement
    })

    expect(within(registeredCard).getByText('registered45@example.com')).toBeInTheDocument()
    expect(within(registeredCard).getByText('EMAIL')).toBeInTheDocument()
  })

  it('does not render empty registered email block when client_email is missing', async () => {
    mockedApiGet.mockImplementation(async (url) => {
      if (url === CLIENTS_URL) {
        return [
          {
            id: 3,
            client_id: 46,
            client_email: null,
            state: 'ACTIVE',
            last_session_at: null,
            upcoming_count: 0,
            client_display_name: 'Registered Without Email',
          },
        ]
      }
      if (url === CLIENT_RECORDS_URL) return []
      if (url === REMINDERS_URL) return []
      throw new Error(`Unexpected apiGet call: ${url}`)
    })

    const { container } = renderView()
    const { clientsPanel } = getPanels(container)
    const registeredCard = await waitFor(() => {
      const card = clientsPanel.querySelector('#client-card-46')
      expect(card).toBeInstanceOf(HTMLElement)
      return card as HTMLElement
    })

    expect(within(registeredCard).queryByText('EMAIL')).not.toBeInTheDocument()
    expect(within(registeredCard).queryByText('registered46@example.com')).not.toBeInTheDocument()
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
    await openAccordionSection(manualCard, 'Запросити до кабінету')

    const createInviteButton = manualCard.querySelector('.manual-account-invite__cta')
    expect(createInviteButton).toBeInstanceOf(HTMLButtonElement)
    await fireEvent.click(createInviteButton as HTMLButtonElement)

    await waitFor(() => {
      expect(mockedCreateClientRecordAccountInvite).toHaveBeenCalledWith(210)
      expect(within(manualCard).getByText('https://proconsult.space/client/invite/new-token')).toBeInTheDocument()
      expect(manualCard.querySelector('.manual-account-invite__actions .btn')).toBeInstanceOf(HTMLButtonElement)
    })

    const copyInviteButton = manualCard.querySelector('.manual-account-invite__actions .btn')
    expect(copyInviteButton).toBeInstanceOf(HTMLButtonElement)
    await fireEvent.click(copyInviteButton as HTMLButtonElement)
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
      return card as HTMLElement
    })
    await openAccordionSection(manualCard, 'Запросити до кабінету')
    await waitFor(() => {
      expect(manualCard.querySelector('.manual-account-invite__hint')).toBeTruthy()
    })

    expect(manualCard.querySelector('.manual-account-invite__link')).toBeFalsy()
    expect(manualCard.querySelectorAll('.manual-account-invite__actions button').length).toBe(2)
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
      return card as HTMLElement
    })
    await openAccordionSection(manualCard, 'Запросити до кабінету')
    await waitFor(() => {
      expect(manualCard.querySelector('.manual-account-invite__hint')).toBeTruthy()
    })

    const regenerateButton = manualCard.querySelector('.manual-account-invite__actions button')
    expect(regenerateButton).toBeInstanceOf(HTMLButtonElement)
    await fireEvent.click(regenerateButton as HTMLButtonElement)

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
      return card as HTMLElement
    })
    await openAccordionSection(manualCard, 'Запросити до кабінету')
    await waitFor(() => {
      expect(manualCard).toHaveTextContent('https://proconsult.space/client/invite/revoke-me')
    })

    await fireEvent.click(within(manualCard).getByRole('button', { name: 'Відкликати' }))

    await waitFor(() => {
      expect(mockedRevokeClientRecordAccountInvite).toHaveBeenCalledWith(213)
      expect(within(manualCard).getAllByRole('button', { name: 'Запросити до кабінету' }).length).toBeGreaterThan(0)
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
    await openAccordionSection(manualCard, 'Запросити до кабінету')

    await fireEvent.click(requireHTMLElement(manualCard.querySelector('.manual-account-invite__cta'), 'invite cta'))

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
    expect(container.querySelector('a[href^="/cabinet/sessions"]')).not.toBeInTheDocument()
    await openAccordionSection(manualCard, 'Керування клієнтом')
    expect(within(manualCard).queryByRole('button', { name: 'Додати на дошку' })).not.toBeInTheDocument()

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
      expect(within(clientsPanel).getAllByText('Registered Client').length).toBeGreaterThan(0)
      expect(container).toHaveTextContent('Не вдалося завантажити клієнтів без реєстрації')
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
      expect(getClientRows(clientsPanel).map((row) => row.textContent || '').join(' ')).toContain('Manual Active Filter')
      expect(getClientRows(clientsPanel).map((row) => row.textContent || '').join(' ')).toContain('Manual Archived Filter')
      return clientsPanel.querySelectorAll('.filters button')
    })

    await fireEvent.click(filterButtons[1] as HTMLButtonElement)
    await waitFor(() => {
      const rowText = getClientRows(clientsPanel).map((row) => row.textContent || '').join(' ')
      expect(rowText).toContain('Manual Active Filter')
      expect(rowText).not.toContain('Manual Archived Filter')
    })

    await fireEvent.click(filterButtons[3] as HTMLButtonElement)
    await waitFor(() => {
      const rowText = getClientRows(clientsPanel).map((row) => row.textContent || '').join(' ')
      expect(rowText).not.toContain('Manual Active Filter')
      expect(rowText).toContain('Manual Archived Filter')
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
      const targetRow = container.querySelector('#client-row-44')
      expect(targetCard).toBeInTheDocument()
      expect(targetCard).toHaveClass('client-card--targeted')
      expect(targetCard?.querySelector('.client-history')).toBeTruthy()
      expect(targetRow).toHaveClass('client-row--selected')
      expect(targetRow).toHaveAttribute('aria-current', 'true')
    })

    expect(mockedApiGet).toHaveBeenCalledWith(clientHistoryUrl(44), { params: { limit: 10 } })
  })

  it('shows soft materials notice for manual client without linked account', async () => {
    mockedApiGet.mockImplementation(async (url) => {
      if (url === CLIENTS_URL) return []
      if (url === CLIENT_RECORDS_URL) return [manualClientRecord({ id: 501, has_account: false, user_id: null })]
      if (url === REMINDERS_URL) return []
      throw new Error(`Unexpected apiGet call: ${url}`)
    })

    const { container } = renderView()
    const { clientsPanel } = getPanels(container)
    const manualCard = await waitFor(() => {
      const card = clientsPanel.querySelector('#manual-client-record-501')
      expect(card).toBeInstanceOf(HTMLElement)
      return card as HTMLElement
    })
    expect(within(manualCard).getByText('Матеріали для клієнта')).toBeInTheDocument()
    await openAccordionSection(manualCard, 'Матеріали для клієнта')
    expect(within(manualCard).getByText('Матеріал можна підготувати зараз. Клієнт побачить його після підключення акаунта.')).toBeInTheDocument()
  })

  it('creates draft material via specialist endpoint', async () => {
    mockedApiGet.mockImplementation(async (url) => {
      if (url === CLIENTS_URL) return []
      if (url === CLIENT_RECORDS_URL) return [manualClientRecord({ id: 502 })]
      if (url === REMINDERS_URL) return []
      throw new Error(`Unexpected apiGet call: ${url}`)
    })
    mockedFetchSpecialistClientMaterials.mockResolvedValue([])

    const { container } = renderView()
    const { clientsPanel } = getPanels(container)
    const manualCard = await waitFor(() => {
      const card = clientsPanel.querySelector('#manual-client-record-502')
      expect(card).toBeInstanceOf(HTMLElement)
      return card as HTMLElement
    })
    await openAccordionSection(manualCard, 'Матеріали для клієнта')
    await fireEvent.update(within(manualCard).getByLabelText('Назва'), 'Новий матеріал')
    await fireEvent.update(within(manualCard).getByLabelText('Текст'), 'Опис')
    await fireEvent.click(within(manualCard).getByRole('button', { name: 'Додати матеріал' }))

    await waitFor(() => {
      expect(mockedCreateSpecialistClientMaterial).toHaveBeenCalledWith({
        client_record_id: 502,
        title: 'Новий матеріал',
        content: 'Опис',
        material_type: 'recommendation',
        url: null,
      })
    })
  })

  it('normalizes create material URL without protocol to https', async () => {
    mockedApiGet.mockImplementation(async (url) => {
      if (url === CLIENTS_URL) return []
      if (url === CLIENT_RECORDS_URL) return [manualClientRecord({ id: 504 })]
      if (url === REMINDERS_URL) return []
      throw new Error(`Unexpected apiGet call: ${url}`)
    })
    mockedFetchSpecialistClientMaterials.mockResolvedValue([])

    const { container } = renderView()
    const { clientsPanel } = getPanels(container)
    const manualCard = await waitFor(() => {
      const card = clientsPanel.querySelector('#manual-client-record-504')
      expect(card).toBeInstanceOf(HTMLElement)
      return card as HTMLElement
    })
    await openAccordionSection(manualCard, 'Матеріали для клієнта')
    const createBlock = requireHTMLElement(manualCard.querySelector('.client-materials__create'), 'create block')
    const titleInput = requireHTMLElement(createBlock.querySelector('input.input:not([type=\"url\"])'), 'title') as HTMLInputElement
    const contentInput = requireHTMLElement(createBlock.querySelector('textarea'), 'content') as HTMLTextAreaElement
    const urlInput = requireHTMLElement(createBlock.querySelector('input[type=\"url\"]'), 'url') as HTMLInputElement
    const createButton = requireHTMLElement(createBlock.querySelector('button.btn'), 'create') as HTMLButtonElement
    await fireEvent.update(titleInput, 'Link material')
    await fireEvent.update(contentInput, 'Link content')
    await fireEvent.update(urlInput, 'kendo.com.ua')
    await fireEvent.click(createButton)

    await waitFor(() => {
      expect(mockedCreateSpecialistClientMaterial).toHaveBeenCalledWith({
        client_record_id: 504,
        title: 'Link material',
        content: 'Link content',
        material_type: 'recommendation',
        url: 'https://kendo.com.ua',
      })
    })
  })

  it('requires URL for link material type and shows scoped create error', async () => {
    mockedApiGet.mockImplementation(async (url) => {
      if (url === CLIENTS_URL) return []
      if (url === CLIENT_RECORDS_URL)
        return [manualClientRecord({ id: 505, display_name: 'Manual With Published' })]
      if (url === REMINDERS_URL) return []
      throw new Error(`Unexpected apiGet call: ${url}`)
    })
    mockedFetchSpecialistClientMaterials.mockResolvedValue([
      {
        id: 901,
        client_record_id: 505,
        session_id: null,
        status: 'published',
        material_type: 'recommendation',
        title: 'Published',
        content: 'Published content',
        content_preview: 'Published content',
        url: null,
        published_at: '2026-04-30T01:00:00Z',
        revoked_at: null,
        created_at: '2026-04-30T00:00:00Z',
        updated_at: '2026-04-30T01:00:00Z',
      } as any,
    ])

    const { container } = renderView()
    const { clientsPanel } = getPanels(container)
    const manualCard = await waitFor(() => {
      const card = clientsPanel.querySelector('#manual-client-record-505')
      expect(card).toBeInstanceOf(HTMLElement)
      return card as HTMLElement
    })
    await openAccordionSection(manualCard, 'Матеріали для клієнта')
    const createBlock = requireHTMLElement(manualCard.querySelector('.client-materials__create'), 'create block')
    const titleInput = requireHTMLElement(createBlock.querySelector('input.input:not([type=\"url\"])'), 'title') as HTMLInputElement
    const typeSelect = requireHTMLElement(createBlock.querySelector('select'), 'type') as HTMLSelectElement
    const contentInput = requireHTMLElement(createBlock.querySelector('textarea'), 'content') as HTMLTextAreaElement
    const createButton = requireHTMLElement(createBlock.querySelector('button.btn'), 'create') as HTMLButtonElement

    await fireEvent.update(titleInput, 'Link title')
    await fireEvent.change(typeSelect, { target: { value: 'link' } })
    await fireEvent.update(contentInput, 'Link body')
    await fireEvent.click(createButton)

    expect(mockedCreateSpecialistClientMaterial).not.toHaveBeenCalled()
    await waitFor(() => {
      const createError = createBlock.querySelector('.form-error')
      expect(createError).toBeTruthy()
      expect(createError?.textContent || '').toContain('Додайте посилання')
    })
    const listBlockError = manualCard.querySelector('.client-materials__body > .form-error')
    expect(listBlockError).toBeFalsy()
    const publishedMaterialTitleInput = manualCard.querySelector('.client-material input.input') as HTMLInputElement | null
    expect(publishedMaterialTitleInput?.value).toBe('Published')
  })

  it('localizes backend URL validation error in create form', async () => {
    mockedApiGet.mockImplementation(async (url) => {
      if (url === CLIENTS_URL) return []
      if (url === CLIENT_RECORDS_URL) return [manualClientRecord({ id: 506 })]
      if (url === REMINDERS_URL) return []
      throw new Error(`Unexpected apiGet call: ${url}`)
    })
    mockedFetchSpecialistClientMaterials.mockResolvedValue([])
    mockedCreateSpecialistClientMaterial.mockRejectedValueOnce({
      response: { data: { url: ['Enter a valid URL.'] } },
    })

    const { container } = renderView()
    const { clientsPanel } = getPanels(container)
    const manualCard = await waitFor(() => {
      const card = clientsPanel.querySelector('#manual-client-record-506')
      expect(card).toBeInstanceOf(HTMLElement)
      return card as HTMLElement
    })
    await openAccordionSection(manualCard, 'Матеріали для клієнта')
    const createBlock = requireHTMLElement(manualCard.querySelector('.client-materials__create'), 'create block')
    const titleInput = requireHTMLElement(createBlock.querySelector('input.input:not([type=\"url\"])'), 'title') as HTMLInputElement
    const typeSelect = requireHTMLElement(createBlock.querySelector('select'), 'type') as HTMLSelectElement
    const contentInput = requireHTMLElement(createBlock.querySelector('textarea'), 'content') as HTMLTextAreaElement
    const urlInput = requireHTMLElement(createBlock.querySelector('input[type=\"url\"]'), 'url') as HTMLInputElement
    const createButton = requireHTMLElement(createBlock.querySelector('button.btn'), 'create') as HTMLButtonElement

    await fireEvent.update(titleInput, 'Link title')
    await fireEvent.change(typeSelect, { target: { value: 'link' } })
    await fireEvent.update(contentInput, 'Link body')
    await fireEvent.update(urlInput, 'https://')
    await fireEvent.click(createButton)

    await waitFor(() => {
      const createError = createBlock.querySelector('.form-error')
      expect(createError).toBeTruthy()
      expect(createError?.textContent || '').toContain('Введіть коректне посилання')
    })
  })

  it('shows edit and action errors only on affected material card', async () => {
    mockedApiGet.mockImplementation(async (url) => {
      if (url === CLIENTS_URL) return []
      if (url === CLIENT_RECORDS_URL) return [manualClientRecord({ id: 507 })]
      if (url === REMINDERS_URL) return []
      throw new Error(`Unexpected apiGet call: ${url}`)
    })
    mockedFetchSpecialistClientMaterials.mockResolvedValue([
      {
        id: 910,
        client_record_id: 507,
        session_id: null,
        status: 'draft',
        material_type: 'recommendation',
        title: 'Draft A',
        content: 'A',
        content_preview: 'A',
        url: null,
        published_at: null,
        revoked_at: null,
        created_at: '2026-04-30T00:00:00Z',
        updated_at: '2026-04-30T00:00:00Z',
      } as any,
      {
        id: 911,
        client_record_id: 507,
        session_id: null,
        status: 'draft',
        material_type: 'recommendation',
        title: 'Draft B',
        content: 'B',
        content_preview: 'B',
        url: null,
        published_at: null,
        revoked_at: null,
        created_at: '2026-04-30T00:00:00Z',
        updated_at: '2026-04-30T00:00:00Z',
      } as any,
    ])
    mockedUpdateSpecialistClientMaterial.mockRejectedValueOnce({
      response: { data: { url: ['Enter a valid URL.'] } },
    } as any)
    mockedPublishSpecialistClientMaterial.mockRejectedValueOnce(new Error('publish failed'))

    const { container } = renderView()
    const { clientsPanel } = getPanels(container)
    const manualCard = await waitFor(() => {
      const card = clientsPanel.querySelector('#manual-client-record-507')
      expect(card).toBeInstanceOf(HTMLElement)
      return card as HTMLElement
    })
    await openAccordionSection(manualCard, 'Матеріали для клієнта')
    const materials = await waitFor(() => {
      const nodes = manualCard.querySelectorAll('.client-material')
      expect(nodes.length).toBe(2)
      return nodes
    })
    const first = materials[0] as HTMLElement
    const second = materials[1] as HTMLElement
    const firstUrl = requireHTMLElement(first.querySelector('input[type=\"url\"]'), 'first url') as HTMLInputElement
    const firstSave = requireHTMLElement(first.querySelector('.client-material__actions button.btn--ghost'), 'first save') as HTMLButtonElement
    await fireEvent.update(firstUrl, 'https://')
    await fireEvent.click(firstSave)
    await waitFor(() => {
      expect(first.querySelector('.form-error')?.textContent || '').toContain('Введіть коректне посилання')
    })
    expect(second.querySelector('.form-error')).toBeFalsy()

    const firstPublish = within(first).getByRole('button', { name: 'Опублікувати для клієнта' })
    await fireEvent.click(firstPublish)
    await waitFor(() => {
      expect(first.textContent || '').toContain('publish failed')
    })
    expect(second.querySelector('.form-error')).toBeFalsy()
  })

  it('publishes and revokes material from materials block', async () => {
    mockedApiGet.mockImplementation(async (url) => {
      if (url === CLIENTS_URL) return []
      if (url === CLIENT_RECORDS_URL) return [manualClientRecord({ id: 503 })]
      if (url === REMINDERS_URL) return []
      throw new Error(`Unexpected apiGet call: ${url}`)
    })
    mockedFetchSpecialistClientMaterials
      .mockResolvedValueOnce([
        {
          id: 900,
          client_record_id: 503,
          session_id: null,
          status: 'draft',
          material_type: 'recommendation',
          title: 'M1',
          content: 'C1',
          content_preview: 'C1',
          url: '',
          published_at: null,
          revoked_at: null,
          created_at: '2026-04-30T00:00:00Z',
          updated_at: '2026-04-30T00:00:00Z',
        } as any,
      ])
      .mockResolvedValueOnce([
        {
          id: 900,
          client_record_id: 503,
          session_id: null,
          status: 'published',
          material_type: 'recommendation',
          title: 'M1',
          content: 'C1',
          content_preview: 'C1',
          url: null,
          published_at: '2026-04-30T01:00:00Z',
          revoked_at: null,
          created_at: '2026-04-30T00:00:00Z',
          updated_at: '2026-04-30T01:00:00Z',
        } as any,
      ])
      .mockResolvedValueOnce([
        {
          id: 900,
          client_record_id: 503,
          session_id: null,
          status: 'revoked',
          material_type: 'recommendation',
          title: 'M1',
          content: 'C1',
          content_preview: 'C1',
          url: null,
          published_at: '2026-04-30T01:00:00Z',
          revoked_at: '2026-04-30T02:00:00Z',
          created_at: '2026-04-30T00:00:00Z',
          updated_at: '2026-04-30T02:00:00Z',
        } as any,
      ])

    const { container } = renderView()
    const { clientsPanel } = getPanels(container)
    const manualCard = await waitFor(() => {
      const card = clientsPanel.querySelector('#manual-client-record-503')
      expect(card).toBeInstanceOf(HTMLElement)
      return card as HTMLElement
    })

    await openAccordionSection(manualCard, 'Матеріали для клієнта')
    await fireEvent.click(await within(manualCard).findByRole('button', { name: 'Опублікувати для клієнта' }))
    await waitFor(() => {
      expect(mockedPublishSpecialistClientMaterial).toHaveBeenCalledWith(900)
    })
    await fireEvent.click(await within(manualCard).findByRole('button', { name: 'Відкликати доступ' }))
    await waitFor(() => {
      expect(mockedRevokeSpecialistClientMaterial).toHaveBeenCalledWith(900)
    })
  })

  it('shows materials block for registered client and fetches materials via client_id', async () => {
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
    mockedFetchSpecialistClientMaterials.mockResolvedValue([])

    const { container } = renderView()
    const { clientsPanel } = getPanels(container)
    const registeredCard = await waitFor(() => {
      const card = clientsPanel.querySelector('#client-card-44')
      expect(card).toBeInstanceOf(HTMLElement)
      return card as HTMLElement
    })

    expect(registeredCard.querySelector('.client-materials')).toBeTruthy()
    expect(registeredCard.querySelector('.client-materials__note')).toBeFalsy()

    await openAccordionSection(registeredCard, 'Матеріали для клієнта')

    await waitFor(() => {
      expect(mockedFetchSpecialistClientMaterials).toHaveBeenCalledWith({ client_id: 44 })
    })
  })

  it('creates material for registered client using client_id', async () => {
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
    mockedFetchSpecialistClientMaterials.mockResolvedValue([])

    const { container } = renderView()
    const { clientsPanel } = getPanels(container)
    const registeredCard = await waitFor(() => {
      const card = clientsPanel.querySelector('#client-card-44')
      expect(card).toBeInstanceOf(HTMLElement)
      return card as HTMLElement
    })

    await openAccordionSection(registeredCard, 'Матеріали для клієнта')

    const createBlock = await waitFor(() => {
      const node = registeredCard.querySelector('.client-materials__create')
      expect(node).toBeTruthy()
      return node as HTMLElement
    })
    const titleInput = createBlock.querySelector('input.input:not([type=\"url\"])')
    const contentInput = createBlock.querySelector('textarea')
    const createButton = createBlock.querySelector('button.btn')
    expect(titleInput).toBeInstanceOf(HTMLInputElement)
    expect(contentInput).toBeInstanceOf(HTMLTextAreaElement)
    expect(createButton).toBeInstanceOf(HTMLButtonElement)

    await fireEvent.update(titleInput as HTMLInputElement, 'Registered material')
    await fireEvent.update(contentInput as HTMLTextAreaElement, 'Registered content')
    await fireEvent.click(createButton as HTMLButtonElement)

    await waitFor(() => {
      expect(mockedCreateSpecialistClientMaterial).toHaveBeenCalledWith({
        client_id: 44,
        title: 'Registered material',
        content: 'Registered content',
        material_type: 'recommendation',
        url: null,
      })
    })
  })

  it('keeps materials state isolated for registered and manual cards with the same numeric id', async () => {
    mockedApiGet.mockImplementation(async (url) => {
      if (url === CLIENTS_URL)
        return [
          {
            id: 1,
            client_id: 34,
            state: 'ACTIVE',
            last_session_at: null,
            upcoming_count: 0,
            client_display_name: 'Registered #34',
          },
        ]
      if (url === CLIENT_RECORDS_URL)
        return [
          manualClientRecord({
            id: 1,
            user_id: 66,
            has_account: true,
            display_name: 'Manual #1',
          }),
        ]
      if (url === REMINDERS_URL) return []
      throw new Error(`Unexpected apiGet call: ${url}`)
    })
    mockedFetchSpecialistClientMaterials.mockResolvedValue([])

    const { container } = renderView()
    const { clientsPanel } = getPanels(container)

    const registeredCard = await waitFor(() => {
      const card = clientsPanel.querySelector('#client-card-34')
      expect(card).toBeInstanceOf(HTMLElement)
      return card as HTMLElement
    })

    await openAccordionSection(registeredCard, 'Матеріали для клієнта')
    const regCreate = requireHTMLElement(registeredCard.querySelector('.client-materials__create'), '.client-materials__create')
    const regTitle = requireHTMLElement(regCreate.querySelector('input.input:not([type="url"])'), 'registered title') as HTMLInputElement
    const regContent = requireHTMLElement(regCreate.querySelector('textarea'), 'registered content') as HTMLTextAreaElement
    const regSubmit = requireHTMLElement(regCreate.querySelector('button.btn'), 'registered submit') as HTMLButtonElement

    await fireEvent.update(regTitle, 'Registered only title')
    await fireEvent.update(regContent, 'Registered only content')
    await fireEvent.click(regSubmit)

    await selectClientRowByName(clientsPanel, 'Manual #1')
    const manualCard = await waitFor(() => {
      const card = clientsPanel.querySelector('#manual-client-record-1')
      expect(card).toBeInstanceOf(HTMLElement)
      return card as HTMLElement
    })
    await openAccordionSection(manualCard, 'Матеріали для клієнта')
    const manCreate = requireHTMLElement(manualCard.querySelector('.client-materials__create'), '.client-materials__create')
    const manTitle = requireHTMLElement(manCreate.querySelector('input.input:not([type="url"])'), 'manual title') as HTMLInputElement
    const manContent = requireHTMLElement(manCreate.querySelector('textarea'), 'manual content') as HTMLTextAreaElement
    const manSubmit = requireHTMLElement(manCreate.querySelector('button.btn'), 'manual submit') as HTMLButtonElement
    expect(manTitle.value).toBe('')
    expect(manContent.value).toBe('')

    await fireEvent.update(manTitle, 'Manual only title')
    await fireEvent.update(manContent, 'Manual only content')
    await fireEvent.click(manSubmit)

    await waitFor(() => {
      expect(mockedFetchSpecialistClientMaterials).toHaveBeenCalledWith({ client_id: 34 })
      expect(mockedFetchSpecialistClientMaterials).toHaveBeenCalledWith({ client_record_id: 1 })
      expect(mockedCreateSpecialistClientMaterial).toHaveBeenCalledWith({
        client_id: 34,
        title: 'Registered only title',
        content: 'Registered only content',
        material_type: 'recommendation',
        url: null,
      })
      expect(mockedCreateSpecialistClientMaterial).toHaveBeenCalledWith({
        client_record_id: 1,
        title: 'Manual only title',
        content: 'Manual only content',
        material_type: 'recommendation',
        url: null,
      })
    })
  })

  it('renders attachment section for material cards and uploads file', async () => {
    mockedApiGet.mockImplementation(async (url) => {
      if (url === CLIENTS_URL) return []
      if (url === CLIENT_RECORDS_URL) return [manualClientRecord({ id: 701 })]
      if (url === REMINDERS_URL) return []
      throw new Error(`Unexpected apiGet call: ${url}`)
    })
    mockedFetchSpecialistClientMaterials.mockResolvedValue([
      {
        id: 991,
        client_record_id: 701,
        session_id: null,
        status: 'draft',
        material_type: 'document',
        title: 'M1',
        content: 'C1',
        content_preview: 'C1',
        url: null,
        published_at: null,
        revoked_at: null,
        created_at: '2026-05-01T00:00:00Z',
        updated_at: '2026-05-01T00:00:00Z',
      } as any,
    ])
    mockedListClientMaterialAttachments.mockResolvedValueOnce([])
    mockedListClientMaterialAttachments.mockResolvedValueOnce([
      {
        id: 3001,
        original_filename: 'exercise.pdf',
        mime_type: 'application/pdf',
        size_bytes: 245000,
        created_at: '2026-05-01T00:00:00Z',
      },
    ] as any)

    const { container } = renderView()
    const manualCard = await waitFor(() => {
      const card = container.querySelector('#manual-client-record-701')
      expect(card).toBeInstanceOf(HTMLElement)
      return card as HTMLElement
    })
    await openAccordionSection(manualCard, 'Матеріали для клієнта')
    expect(await within(manualCard).findByText('Файли')).toBeInTheDocument()

    const fileInput = manualCard.querySelector('input[type=\"file\"]') as HTMLInputElement
    const file = new File(['x'], 'exercise.pdf', { type: 'application/pdf' })
    await fireEvent.change(fileInput, { target: { files: [file] } })

    await waitFor(() => {
      expect(mockedUploadClientMaterialAttachment).toHaveBeenCalledWith(991, expect.any(File))
      expect(within(manualCard).getByText('exercise.pdf · 239 КБ')).toBeInTheDocument()
    })
  })

  it('shows scoped upload validation errors and does not leak between materials', async () => {
    mockedApiGet.mockImplementation(async (url) => {
      if (url === CLIENTS_URL) return []
      if (url === CLIENT_RECORDS_URL) return [manualClientRecord({ id: 702 })]
      if (url === REMINDERS_URL) return []
      throw new Error(`Unexpected apiGet call: ${url}`)
    })
    mockedFetchSpecialistClientMaterials.mockResolvedValue([
      {
        id: 992,
        client_record_id: 702,
        session_id: null,
        status: 'draft',
        material_type: 'document',
        title: 'A',
        content: 'A',
        content_preview: 'A',
        url: null,
        published_at: null,
        revoked_at: null,
        created_at: '2026-05-01T00:00:00Z',
        updated_at: '2026-05-01T00:00:00Z',
      } as any,
      {
        id: 993,
        client_record_id: 702,
        session_id: null,
        status: 'draft',
        material_type: 'document',
        title: 'B',
        content: 'B',
        content_preview: 'B',
        url: null,
        published_at: null,
        revoked_at: null,
        created_at: '2026-05-01T00:00:00Z',
        updated_at: '2026-05-01T00:00:00Z',
      } as any,
    ])

    const { container } = renderView()
    const manualCard = await waitFor(() => {
      const card = container.querySelector('#manual-client-record-702')
      expect(card).toBeInstanceOf(HTMLElement)
      return card as HTMLElement
    })
    await openAccordionSection(manualCard, 'Матеріали для клієнта')
    const materialCards = await waitFor(() => {
      const nodes = manualCard.querySelectorAll('.client-material')
      expect(nodes.length).toBe(2)
      return nodes
    })
    const firstFile = materialCards[0]! .querySelector('input[type=\"file\"]') as HTMLInputElement
    const secondFile = materialCards[1]! .querySelector('input[type=\"file\"]') as HTMLInputElement
    const bigFile = new File([new Uint8Array(21 * 1024 * 1024)], 'big.pdf', { type: 'application/pdf' })
    const badExt = new File(['x'], 'bad.exe', { type: 'application/octet-stream' })

    await fireEvent.change(firstFile, { target: { files: [bigFile] } })
    await waitFor(() => {
      expect(materialCards[0]! .textContent || '').toContain('Файл завеликий. Максимальний розмір одного файлу — 20 МБ.')
    })
    expect(materialCards[1]! .textContent || '').not.toContain('Файл завеликий')

    await fireEvent.change(secondFile, { target: { files: [badExt] } })
    await waitFor(() => {
      expect(materialCards[1]! .textContent || '').toContain('Цей тип файлу не підтримується.')
    })
    expect(materialCards[0]! .textContent || '').not.toContain('Цей тип файлу не підтримується.')
  })

  it('deletes attachment from the correct material', async () => {
    mockedApiGet.mockImplementation(async (url) => {
      if (url === CLIENTS_URL) return []
      if (url === CLIENT_RECORDS_URL) return [manualClientRecord({ id: 703 })]
      if (url === REMINDERS_URL) return []
      throw new Error(`Unexpected apiGet call: ${url}`)
    })
    mockedFetchSpecialistClientMaterials.mockResolvedValue([
      {
        id: 994,
        client_record_id: 703,
        session_id: null,
        status: 'draft',
        material_type: 'document',
        title: 'A',
        content: 'A',
        content_preview: 'A',
        url: null,
        published_at: null,
        revoked_at: null,
        created_at: '2026-05-01T00:00:00Z',
        updated_at: '2026-05-01T00:00:00Z',
      } as any,
    ])
    mockedListClientMaterialAttachments.mockResolvedValue([
      {
        id: 4001,
        original_filename: 'exercise.pdf',
        mime_type: 'application/pdf',
        size_bytes: 1200,
        created_at: '2026-05-01T00:00:00Z',
      },
    ] as any)

    const { container } = renderView()
    const manualCard = await waitFor(() => {
      const card = container.querySelector('#manual-client-record-703')
      expect(card).toBeInstanceOf(HTMLElement)
      return card as HTMLElement
    })
    await openAccordionSection(manualCard, 'Матеріали для клієнта')
    await fireEvent.click(await within(manualCard).findByRole('button', { name: 'Видалити файл' }))
    await waitFor(() => {
      expect(mockedDeleteClientMaterialAttachment).toHaveBeenCalledWith(994, 4001)
      expect(manualCard.textContent || '').toContain('Файл видалено')
    })
  })

  it('loads regular times for manual client using client record id', async () => {
    mockedApiGet.mockImplementation(async (url) => {
      if (url === CLIENTS_URL) return []
      if (url === CLIENT_RECORDS_URL) return [manualClientRecord({ id: 4 })]
      if (url === REMINDERS_URL) return []
      throw new Error(`Unexpected apiGet call: ${url}`)
    })
    mockedFetchClientRegularTimes.mockResolvedValue([])

    const { container } = renderView()
    const manualCard = await waitFor(() => {
      const card = container.querySelector('#manual-client-record-4')
      expect(card).toBeInstanceOf(HTMLElement)
      return card as HTMLElement
    })
    await openAccordionSection(manualCard, 'Регулярний час')

    await waitFor(() => {
      expect(mockedFetchClientRegularTimes).toHaveBeenCalledWith(4)
    })
  })

  it('loads regular times for registered client using client_record_id', async () => {
    mockedApiGet.mockImplementation(async (url) => {
      if (url === CLIENTS_URL)
        return [
          {
            id: 6,
            client_id: 44,
            client_record_id: 5,
            source: 'manual',
            state: 'ACTIVE',
            last_session_at: null,
            upcoming_count: 0,
            client_display_name: 'Registered Regular',
          },
        ]
      if (url === CLIENT_RECORDS_URL) return []
      if (url === REMINDERS_URL) return []
      throw new Error(`Unexpected apiGet call: ${url}`)
    })
    mockedFetchClientRegularTimes.mockResolvedValue([])

    const { container } = renderView()
    const registeredCard = await waitFor(() => {
      const card = container.querySelector('#client-card-44')
      expect(card).toBeInstanceOf(HTMLElement)
      return card as HTMLElement
    })
    await openAccordionSection(registeredCard, 'Регулярний час')

    await waitFor(() => {
      expect(mockedFetchClientRegularTimes).toHaveBeenCalledWith(5)
      expect(mockedFetchClientRegularTimes).not.toHaveBeenCalledWith(6)
    })
  })

  it('does not call regular-times endpoints for registered client without client_record_id', async () => {
    mockedApiGet.mockImplementation(async (url) => {
      if (url === CLIENTS_URL)
        return [
          {
            id: 1,
            client_id: 44,
            client_record_id: null,
            state: 'ACTIVE',
            last_session_at: null,
            upcoming_count: 0,
            client_display_name: 'Registered Missing Record',
          },
        ]
      if (url === CLIENT_RECORDS_URL) return []
      if (url === REMINDERS_URL) return []
      throw new Error(`Unexpected apiGet call: ${url}`)
    })

    const { container } = renderView()
    const registeredCard = await waitFor(() => {
      const card = container.querySelector('#client-card-44')
      expect(card).toBeInstanceOf(HTMLElement)
      return card as HTMLElement
    })
    await openAccordionSection(registeredCard, 'Регулярний час')

    expect(registeredCard.textContent || '').toContain('Регулярний час можна буде додати після створення картки клієнта.')
    expect(registeredCard.textContent || '').not.toContain(
      'Не вдалося завантажити регулярний час. Спробуйте оновити сторінку.'
    )
    expect(within(registeredCard).queryByRole('button', { name: 'Додати регулярний час' })).not.toBeInTheDocument()
    expect(within(registeredCard).queryByRole('button', { name: 'Редагувати' })).not.toBeInTheDocument()
    expect(within(registeredCard).queryByRole('button', { name: 'Поставити на паузу' })).not.toBeInTheDocument()
    expect(within(registeredCard).queryByRole('button', { name: 'Відновити' })).not.toBeInTheDocument()
    expect(mockedFetchClientRegularTimes).not.toHaveBeenCalled()
    expect(mockedCreateClientRegularTime).not.toHaveBeenCalled()
    expect(mockedCreateNextSessionFromClientRegularTime).not.toHaveBeenCalled()
    expect(mockedUpdateClientRegularTime).not.toHaveBeenCalled()
    expect(mockedPauseClientRegularTime).not.toHaveBeenCalled()
    expect(mockedResumeClientRegularTime).not.toHaveBeenCalled()
  })

  it('does not fallback to client id for registered client without client_record_id even when payload is manual-like', async () => {
    mockedApiGet.mockImplementation(async (url) => {
      if (url === CLIENTS_URL)
        return [
          {
            id: 6,
            client_id: 44,
            client_record_id: null,
            source: 'manual',
            status: 'active',
            last_session_at: null,
            upcoming_count: 0,
            client_display_name: 'Registered Manual-like',
          },
        ]
      if (url === CLIENT_RECORDS_URL) return []
      if (url === REMINDERS_URL) return []
      throw new Error(`Unexpected apiGet call: ${url}`)
    })

    const { container } = renderView()
    const registeredCard = await waitFor(() => {
      const card = container.querySelector('#client-card-44')
      expect(card).toBeInstanceOf(HTMLElement)
      return card as HTMLElement
    })
    await openAccordionSection(registeredCard, 'Регулярний час')

    expect(registeredCard.textContent || '').toContain('Регулярний час можна буде додати після створення картки клієнта.')
    expect(registeredCard.textContent || '').not.toContain('Картку клієнта не знайдено або вона недоступна.')
    expect(mockedFetchClientRegularTimes).not.toHaveBeenCalled()
    expect(mockedFetchClientRegularTimes).not.toHaveBeenCalledWith(6)
  })

  it('does not fallback to client id for registered client when a manual record has the same id', async () => {
    mockedApiGet.mockImplementation(async (url) => {
      if (url === CLIENTS_URL)
        return [
          {
            id: 6,
            client_record_id: null,
            source: 'manual',
            status: 'active',
            client_display_name: 'Registered Collision',
          },
        ]
      if (url === CLIENT_RECORDS_URL) return [manualClientRecord({ id: 6, display_name: 'Manual Collision' })]
      if (url === REMINDERS_URL) return []
      throw new Error(`Unexpected apiGet call: ${url}`)
    })

    const { container } = renderView()
    const registeredCard = await waitFor(() => {
      const card = container.querySelector('#client-card-0')
      expect(card).toBeInstanceOf(HTMLElement)
      return card as HTMLElement
    })
    await openAccordionSection(registeredCard, 'Регулярний час')

    expect(registeredCard.textContent || '').toContain('Регулярний час можна буде додати після створення картки клієнта.')
    expect(registeredCard.textContent || '').not.toContain('Картку клієнта не знайдено або вона недоступна.')
    expect(mockedFetchClientRegularTimes).not.toHaveBeenCalled()
    expect(mockedFetchClientRegularTimes).not.toHaveBeenCalledWith(6)
  })

  it('shows regular time loading state while section request is pending', async () => {
    const regularTimesDeferred = deferred<any[]>()
    mockedApiGet.mockImplementation(async (url) => {
      if (url === CLIENTS_URL) return []
      if (url === CLIENT_RECORDS_URL) return [manualClientRecord({ id: 903 })]
      if (url === REMINDERS_URL) return []
      throw new Error(`Unexpected apiGet call: ${url}`)
    })
    mockedFetchClientRegularTimes.mockReturnValue(regularTimesDeferred.promise as any)

    const { container } = renderView()
    const manualCard = await waitFor(() => {
      const card = container.querySelector('#manual-client-record-903')
      expect(card).toBeInstanceOf(HTMLElement)
      return card as HTMLElement
    })
    await openAccordionSection(manualCard, 'Регулярний час')

    expect(manualCard.textContent || '').toContain('Завантаження регулярного часу')
    regularTimesDeferred.resolve([])
    await waitFor(() => {
      expect(manualCard.textContent || '').toContain('Регулярний час ще не додано.')
    })
  })

  it('shows regular time empty state with create CTA', async () => {
    mockedApiGet.mockImplementation(async (url) => {
      if (url === CLIENTS_URL) return []
      if (url === CLIENT_RECORDS_URL) return [manualClientRecord({ id: 904 })]
      if (url === REMINDERS_URL) return []
      throw new Error(`Unexpected apiGet call: ${url}`)
    })
    mockedFetchClientRegularTimes.mockResolvedValue([])

    const { container } = renderView()
    const manualCard = await waitFor(() => {
      const card = container.querySelector('#manual-client-record-904')
      expect(card).toBeInstanceOf(HTMLElement)
      return card as HTMLElement
    })
    await openAccordionSection(manualCard, 'Регулярний час')

    await waitFor(() => {
      expect(manualCard.textContent || '').toContain('Регулярний час ще не додано.')
      expect(manualCard.textContent || '').not.toContain(
        'Не вдалося завантажити регулярний час. Спробуйте оновити сторінку.'
      )
      expect(within(manualCard).getByRole('button', { name: 'Додати регулярний час' })).toBeInTheDocument()
    })
  })

  it('shows only regular time load error when section request fails', async () => {
    mockedApiGet.mockImplementation(async (url) => {
      if (url === CLIENTS_URL) return []
      if (url === CLIENT_RECORDS_URL) return [manualClientRecord({ id: 921 })]
      if (url === REMINDERS_URL) return []
      throw new Error(`Unexpected apiGet call: ${url}`)
    })
    mockedFetchClientRegularTimes.mockRejectedValueOnce(new Error('regular times failed'))

    const { container } = renderView()
    const manualCard = await waitFor(() => {
      const card = container.querySelector('#manual-client-record-921')
      expect(card).toBeInstanceOf(HTMLElement)
      return card as HTMLElement
    })
    await openAccordionSection(manualCard, 'Регулярний час')

    await waitFor(() => {
      expect(manualCard.textContent || '').toContain(
        'Не вдалося завантажити регулярний час. Спробуйте оновити сторінку.'
      )
      expect(manualCard.textContent || '').not.toContain('Регулярний час ще не додано.')
      expect(within(manualCard).queryByRole('button', { name: 'Додати регулярний час' })).not.toBeInTheDocument()
    })
  })

  it('shows inaccessible client record copy when regular times request returns 404', async () => {
    mockedApiGet.mockImplementation(async (url) => {
      if (url === CLIENTS_URL) return []
      if (url === CLIENT_RECORDS_URL) return [manualClientRecord({ id: 922 })]
      if (url === REMINDERS_URL) return []
      throw new Error(`Unexpected apiGet call: ${url}`)
    })
    mockedFetchClientRegularTimes.mockRejectedValueOnce({
      response: { status: 404, data: { code: 'CLIENT_RECORD_NOT_FOUND' } },
    })

    const { container } = renderView()
    const manualCard = await waitFor(() => {
      const card = container.querySelector('#manual-client-record-922')
      expect(card).toBeInstanceOf(HTMLElement)
      return card as HTMLElement
    })
    await openAccordionSection(manualCard, 'Регулярний час')

    await waitFor(() => {
      expect(manualCard.textContent || '').toContain('Картку клієнта не знайдено або вона недоступна.')
      expect(manualCard.textContent || '').not.toContain('Регулярний час ще не додано.')
    })
  })

  it('creates regular time for registered client using client_record_id', async () => {
    mockedApiGet.mockImplementation(async (url) => {
      if (url === CLIENTS_URL)
        return [
          {
            id: 6,
            client_id: 44,
            client_record_id: 5,
            state: 'ACTIVE',
            last_session_at: null,
            upcoming_count: 0,
            client_display_name: 'Registered Regular',
          },
        ]
      if (url === CLIENT_RECORDS_URL) return []
      if (url === REMINDERS_URL) return []
      throw new Error(`Unexpected apiGet call: ${url}`)
    })
    mockedFetchClientRegularTimes.mockResolvedValue([])

    const { container } = renderView()
    const registeredCard = await waitFor(() => {
      const card = container.querySelector('#client-card-44')
      expect(card).toBeInstanceOf(HTMLElement)
      return card as HTMLElement
    })
    await openAccordionSection(registeredCard, 'Регулярний час')
    await fireEvent.click(await within(registeredCard).findByRole('button', { name: 'Додати регулярний час' }))
    await fireEvent.update(within(registeredCard).getByLabelText('День тижня'), '2')
    await selectRegularTimeDate(registeredCard, '2026-05-20')
    await fireEvent.click(within(registeredCard).getByRole('button', { name: 'Зберегти' }))

    await waitFor(() => {
      expect(mockedCreateClientRegularTime).toHaveBeenCalledWith(
        5,
        expect.objectContaining({
          starts_on: '2026-05-20',
        })
      )
      expect(mockedCreateClientRegularTime).not.toHaveBeenCalledWith(6, expect.anything())
    })
  })

  it('updates regular time for registered client using client_record_id', async () => {
    mockedApiGet.mockImplementation(async (url) => {
      if (url === CLIENTS_URL)
        return [
          {
            id: 6,
            client_id: 44,
            client_record_id: 5,
            state: 'ACTIVE',
            last_session_at: null,
            upcoming_count: 0,
            client_display_name: 'Registered Regular',
          },
        ]
      if (url === CLIENT_RECORDS_URL) return []
      if (url === REMINDERS_URL) return []
      throw new Error(`Unexpected apiGet call: ${url}`)
    })
    mockedFetchClientRegularTimes.mockResolvedValue([regularTimeRecord({ id: 830, client_record: 5 })] as any)

    const { container } = renderView()
    const registeredCard = await waitFor(() => {
      const card = container.querySelector('#client-card-44')
      expect(card).toBeInstanceOf(HTMLElement)
      return card as HTMLElement
    })
    await openAccordionSection(registeredCard, 'Регулярний час')
    const regularTimeBlock = await waitFor(() => {
      const block = registeredCard.querySelector('.client-regular-time')
      expect(block).toBeInstanceOf(HTMLElement)
      return block as HTMLElement
    })
    await fireEvent.click(within(regularTimeBlock).getByRole('button', { name: 'Редагувати' }))
    await fireEvent.update(within(registeredCard).getByLabelText('Тривалість'), '60')
    await fireEvent.click(within(registeredCard).getByRole('button', { name: 'Зберегти' }))

    await waitFor(() => {
      expect(mockedUpdateClientRegularTime).toHaveBeenCalledWith(
        5,
        830,
        expect.objectContaining({
          duration_minutes: 60,
        })
      )
      expect(mockedUpdateClientRegularTime).not.toHaveBeenCalledWith(6, 830, expect.anything())
    })
  })

  it('pauses and creates next session for registered client using client_record_id', async () => {
    mockedApiGet.mockImplementation(async (url) => {
      if (url === CLIENTS_URL)
        return [
          {
            id: 6,
            client_id: 44,
            client_record_id: 5,
            state: 'ACTIVE',
            last_session_at: null,
            upcoming_count: 0,
            client_display_name: 'Registered Regular',
          },
        ]
      if (url === CLIENT_RECORDS_URL) return []
      if (url === REMINDERS_URL) return []
      if (url === '/booking/sessions/') return []
      throw new Error(`Unexpected apiGet call: ${url}`)
    })
    mockedFetchClientRegularTimes.mockResolvedValue([regularTimeRecord({ id: 831, client_record: 5 })] as any)

    const { container } = renderView()
    const registeredCard = await waitFor(() => {
      const card = container.querySelector('#client-card-44')
      expect(card).toBeInstanceOf(HTMLElement)
      return card as HTMLElement
    })
    await openAccordionSection(registeredCard, 'Регулярний час')
    await fireEvent.click(await within(registeredCard).findByRole('button', { name: 'Створити наступну сесію' }))

    await waitFor(() => {
      expect(mockedCreateNextSessionFromClientRegularTime).toHaveBeenCalledWith(5, 831)
      expect(mockedCreateNextSessionFromClientRegularTime).not.toHaveBeenCalledWith(6, 831)
    })

    await fireEvent.click(await within(registeredCard).findByRole('button', { name: 'Поставити на паузу' }))

    await waitFor(() => {
      expect(mockedPauseClientRegularTime).toHaveBeenCalledWith(5, 831)
      expect(mockedPauseClientRegularTime).not.toHaveBeenCalledWith(6, 831)
    })
  })

  it('resumes regular time for registered client using client_record_id', async () => {
    mockedApiGet.mockImplementation(async (url) => {
      if (url === CLIENTS_URL)
        return [
          {
            id: 6,
            client_id: 44,
            client_record_id: 5,
            state: 'ACTIVE',
            last_session_at: null,
            upcoming_count: 0,
            client_display_name: 'Registered Regular',
          },
        ]
      if (url === CLIENT_RECORDS_URL) return []
      if (url === REMINDERS_URL) return []
      throw new Error(`Unexpected apiGet call: ${url}`)
    })
    mockedFetchClientRegularTimes.mockResolvedValue([
      regularTimeRecord({ id: 832, client_record: 5, status: 'paused' }),
    ] as any)

    const { container } = renderView()
    const registeredCard = await waitFor(() => {
      const card = container.querySelector('#client-card-44')
      expect(card).toBeInstanceOf(HTMLElement)
      return card as HTMLElement
    })
    await openAccordionSection(registeredCard, 'Регулярний час')
    await fireEvent.click(await within(registeredCard).findByRole('button', { name: 'Відновити' }))

    await waitFor(() => {
      expect(mockedResumeClientRegularTime).toHaveBeenCalledWith(5, 832)
      expect(mockedResumeClientRegularTime).not.toHaveBeenCalledWith(6, 832)
    })
  })

  it('renders active regular time details', async () => {
    mockedApiGet.mockImplementation(async (url) => {
      if (url === CLIENTS_URL) return []
      if (url === CLIENT_RECORDS_URL) return [manualClientRecord({ id: 905 })]
      if (url === REMINDERS_URL) return []
      throw new Error(`Unexpected apiGet call: ${url}`)
    })
    mockedFetchClientRegularTimes.mockResolvedValue([regularTimeRecord({ client_record: 905 })] as any)

    const { container } = renderView()
    const manualCard = await waitFor(() => {
      const card = container.querySelector('#manual-client-record-905')
      expect(card).toBeInstanceOf(HTMLElement)
      return card as HTMLElement
    })
    await openAccordionSection(manualCard, 'Регулярний час')

    await waitFor(() => {
      expect(manualCard.textContent || '').toContain('Середа, 15:00')
      expect(manualCard.textContent || '').toContain('50 хв')
      expect(manualCard.textContent || '').toContain('щотижня')
      expect(manualCard.textContent || '').toContain('онлайн')
      expect(manualCard.textContent || '').toContain('Активний')
      expect(manualCard.textContent || '').toContain('20.05.2026')
      expect(within(manualCard).getByRole('button', { name: 'Створити наступну сесію' })).toBeInTheDocument()
      expect(manualCard.textContent || '').toContain('Створить одну найближчу майбутню сесію за цим регулярним часом.')
    })
  })

  it('renders paused regular time with resume action', async () => {
    mockedApiGet.mockImplementation(async (url) => {
      if (url === CLIENTS_URL) return []
      if (url === CLIENT_RECORDS_URL) return [manualClientRecord({ id: 906 })]
      if (url === REMINDERS_URL) return []
      throw new Error(`Unexpected apiGet call: ${url}`)
    })
    mockedFetchClientRegularTimes.mockResolvedValue([
      regularTimeRecord({
        client_record: 906,
        weekday: 4,
        frequency: 'every_two_weeks',
        session_format: 'offline',
        status: 'paused',
        paused_at: '2026-05-16T10:00:00Z',
      }),
    ] as any)

    const { container } = renderView()
    const manualCard = await waitFor(() => {
      const card = container.querySelector('#manual-client-record-906')
      expect(card).toBeInstanceOf(HTMLElement)
      return card as HTMLElement
    })
    await openAccordionSection(manualCard, 'Регулярний час')

    await waitFor(() => {
      expect(manualCard.textContent || '').toContain('Пʼятниця')
      expect(manualCard.textContent || '').toContain('раз на два тижні')
      expect(manualCard.textContent || '').toContain('офлайн')
      expect(manualCard.textContent || '').toContain('На паузі')
      expect(within(manualCard).getByRole('button', { name: 'Відновити' })).toBeInTheDocument()
      expect(within(manualCard).queryByRole('button', { name: 'Створити наступну сесію' })).not.toBeInTheDocument()
    })
  })

  it('creates next session from active regular time', async () => {
    mockedApiGet.mockImplementation(async (url) => {
      if (url === CLIENTS_URL) return []
      if (url === CLIENT_RECORDS_URL) return [manualClientRecord({ id: 913 })]
      if (url === REMINDERS_URL) return []
      if (url === '/booking/sessions/') return []
      throw new Error(`Unexpected apiGet call: ${url}`)
    })
    mockedFetchClientRegularTimes.mockResolvedValue([regularTimeRecord({ id: 813, client_record: 913 })] as any)

    const { container } = renderView()
    const manualCard = await waitFor(() => {
      const card = container.querySelector('#manual-client-record-913')
      expect(card).toBeInstanceOf(HTMLElement)
      return card as HTMLElement
    })
    await openAccordionSection(manualCard, 'Регулярний час')
    await fireEvent.click(await within(manualCard).findByRole('button', { name: 'Створити наступну сесію' }))

    await waitFor(() => {
      expect(mockedCreateNextSessionFromClientRegularTime).toHaveBeenCalledWith(913, 813)
      expect(mockedFetchClientRegularTimes).toHaveBeenCalledTimes(2)
      expect(mockToast.success).toHaveBeenCalledWith('Наступну сесію створено.')
    })
  })

  it('prevents duplicate next-session clicks while request is pending', async () => {
    const createDeferred = deferred<any>()
    mockedApiGet.mockImplementation(async (url) => {
      if (url === CLIENTS_URL) return []
      if (url === CLIENT_RECORDS_URL) return [manualClientRecord({ id: 914 })]
      if (url === REMINDERS_URL) return []
      if (url === '/booking/sessions/') return []
      throw new Error(`Unexpected apiGet call: ${url}`)
    })
    mockedFetchClientRegularTimes.mockResolvedValue([regularTimeRecord({ id: 814, client_record: 914 })] as any)
    mockedCreateNextSessionFromClientRegularTime.mockReturnValue(createDeferred.promise as any)

    const { container } = renderView()
    const manualCard = await waitFor(() => {
      const card = container.querySelector('#manual-client-record-914')
      expect(card).toBeInstanceOf(HTMLElement)
      return card as HTMLElement
    })
    await openAccordionSection(manualCard, 'Регулярний час')
    const button = await within(manualCard).findByRole('button', { name: 'Створити наступну сесію' })
    await fireEvent.click(button)
    await fireEvent.click(button)

    expect(mockedCreateNextSessionFromClientRegularTime).toHaveBeenCalledTimes(1)
    expect(button).toBeDisabled()
    expect(button).toHaveTextContent('Створюємо...')

    createDeferred.resolve({
      created: true,
      regular_time_id: 814,
      occurrence_start_at: '2026-05-20T15:00:00+03:00',
      occurrence_end_at: '2026-05-20T15:50:00+03:00',
      session: { id: 9902 },
    })

    await waitFor(() => {
      expect(within(manualCard).getByRole('button', { name: 'Створити наступну сесію' })).not.toBeDisabled()
    })
  })

  it('shows already-created toast for existing next session', async () => {
    mockedApiGet.mockImplementation(async (url) => {
      if (url === CLIENTS_URL) return []
      if (url === CLIENT_RECORDS_URL) return [manualClientRecord({ id: 915 })]
      if (url === REMINDERS_URL) return []
      if (url === '/booking/sessions/') return []
      throw new Error(`Unexpected apiGet call: ${url}`)
    })
    mockedFetchClientRegularTimes.mockResolvedValue([regularTimeRecord({ id: 815, client_record: 915 })] as any)
    mockedCreateNextSessionFromClientRegularTime.mockResolvedValueOnce({
      created: false,
      regular_time_id: 815,
      occurrence_start_at: '2026-05-20T15:00:00+03:00',
      occurrence_end_at: '2026-05-20T15:50:00+03:00',
      session: { id: 9903 },
    } as any)

    const { container } = renderView()
    const manualCard = await waitFor(() => {
      const card = container.querySelector('#manual-client-record-915')
      expect(card).toBeInstanceOf(HTMLElement)
      return card as HTMLElement
    })
    await openAccordionSection(manualCard, 'Регулярний час')
    await fireEvent.click(await within(manualCard).findByRole('button', { name: 'Створити наступну сесію' }))

    await waitFor(() => {
      expect(mockToast.info).toHaveBeenCalledWith('Наступна сесія вже була створена.')
    })
  })

  it('shows conflict copy when creating next session fails', async () => {
    mockedApiGet.mockImplementation(async (url) => {
      if (url === CLIENTS_URL) return []
      if (url === CLIENT_RECORDS_URL) return [manualClientRecord({ id: 916 })]
      if (url === REMINDERS_URL) return []
      throw new Error(`Unexpected apiGet call: ${url}`)
    })
    mockedFetchClientRegularTimes.mockResolvedValue([regularTimeRecord({ id: 816, client_record: 916 })] as any)
    mockedCreateNextSessionFromClientRegularTime.mockRejectedValueOnce({
      response: { data: { code: 'SESSION_TIME_CONFLICT' } },
    })

    const { container } = renderView()
    const manualCard = await waitFor(() => {
      const card = container.querySelector('#manual-client-record-916')
      expect(card).toBeInstanceOf(HTMLElement)
      return card as HTMLElement
    })
    await openAccordionSection(manualCard, 'Регулярний час')
    await fireEvent.click(await within(manualCard).findByRole('button', { name: 'Створити наступну сесію' }))

    await waitFor(() => {
      expect(manualCard).toHaveTextContent('На цей час уже є інша сесія.')
      expect(mockToast.error).toHaveBeenCalledWith('На цей час уже є інша сесія.')
    })
  })

  it('keeps regular time card editable when create-next-session returns anchor mismatch', async () => {
    mockedApiGet.mockImplementation(async (url) => {
      if (url === CLIENTS_URL) return []
      if (url === CLIENT_RECORDS_URL) return [manualClientRecord({ id: 923 })]
      if (url === REMINDERS_URL) return []
      throw new Error(`Unexpected apiGet call: ${url}`)
    })
    mockedFetchClientRegularTimes.mockResolvedValue([regularTimeRecord({ id: 823, client_record: 923 })] as any)
    mockedCreateNextSessionFromClientRegularTime.mockRejectedValueOnce({
      response: { data: { code: 'CLIENT_REGULAR_TIME_ANCHOR_MISMATCH' } },
    })

    const { container } = renderView()
    const manualCard = await waitFor(() => {
      const card = container.querySelector('#manual-client-record-923')
      expect(card).toBeInstanceOf(HTMLElement)
      return card as HTMLElement
    })
    await openAccordionSection(manualCard, 'Регулярний час')
    await fireEvent.click(await within(manualCard).findByRole('button', { name: 'Створити наступну сесію' }))

    await waitFor(() => {
      const regularTimeBlock = manualCard.querySelector('.client-regular-time') as HTMLElement | null
      expect(regularTimeBlock).toBeInstanceOf(HTMLElement)
      expect(regularTimeBlock).toHaveTextContent('Регулярний час має некоректну дату початку. Відредагуйте його.')
      expect(within(regularTimeBlock as HTMLElement).getByRole('button', { name: 'Редагувати' })).toBeInTheDocument()
      expect(within(regularTimeBlock as HTMLElement).getByRole('button', { name: 'Поставити на паузу' })).toBeInTheDocument()
      expect(manualCard).not.toHaveTextContent('Не вдалося завантажити регулярний час. Спробуйте оновити сторінку.')
      expect(mockToast.error).toHaveBeenCalledWith('Регулярний час має некоректну дату початку. Відредагуйте його.')
    })
  })

  it('shows warning and disables next-session action for existing anchor mismatch', async () => {
    mockedApiGet.mockImplementation(async (url) => {
      if (url === CLIENTS_URL) return []
      if (url === CLIENT_RECORDS_URL) return [manualClientRecord({ id: 924 })]
      if (url === REMINDERS_URL) return []
      throw new Error(`Unexpected apiGet call: ${url}`)
    })
    mockedFetchClientRegularTimes.mockResolvedValue([
      regularTimeRecord({ id: 824, client_record: 924, weekday: 2, starts_on: '2026-05-21' }),
    ] as any)

    const { container } = renderView()
    const manualCard = await waitFor(() => {
      const card = container.querySelector('#manual-client-record-924')
      expect(card).toBeInstanceOf(HTMLElement)
      return card as HTMLElement
    })
    await openAccordionSection(manualCard, 'Регулярний час')

    await waitFor(() => {
      const regularTimeBlock = manualCard.querySelector('.client-regular-time') as HTMLElement | null
      expect(regularTimeBlock).toBeInstanceOf(HTMLElement)
      expect(manualCard).toHaveTextContent('Дата початку не відповідає дню тижня. Відредагуйте регулярний час.')
      expect(within(manualCard).getByRole('button', { name: 'Створити наступну сесію' })).toBeDisabled()
      expect(within(regularTimeBlock as HTMLElement).getByRole('button', { name: 'Редагувати' })).toBeInTheDocument()
      expect(mockedCreateNextSessionFromClientRegularTime).not.toHaveBeenCalled()
    })
  })

  it.each([
    ['CLIENT_RECORD_ARCHIVED', 'Картку клієнта архівовано. Спершу відновіть її.'],
    ['CLIENT_REGULAR_TIME_PAUSED', 'Регулярний час на паузі.'],
  ])('shows %s copy when creating next session fails', async (code, message) => {
    mockedApiGet.mockImplementation(async (url) => {
      if (url === CLIENTS_URL) return []
      if (url === CLIENT_RECORDS_URL) return [manualClientRecord({ id: 920 })]
      if (url === REMINDERS_URL) return []
      throw new Error(`Unexpected apiGet call: ${url}`)
    })
    mockedFetchClientRegularTimes.mockResolvedValue([regularTimeRecord({ id: 820, client_record: 920 })] as any)
    mockedCreateNextSessionFromClientRegularTime.mockRejectedValueOnce({
      response: { data: { code } },
    })

    const { container } = renderView()
    const manualCard = await waitFor(() => {
      const card = container.querySelector('#manual-client-record-920')
      expect(card).toBeInstanceOf(HTMLElement)
      return card as HTMLElement
    })
    await openAccordionSection(manualCard, 'Регулярний час')
    await fireEvent.click(await within(manualCard).findByRole('button', { name: 'Створити наступну сесію' }))

    await waitFor(() => {
      expect(manualCard).toHaveTextContent(message)
      expect(mockToast.error).toHaveBeenCalledWith(message)
    })
  })

  it('creates regular time without timezone field', async () => {
    mockedApiGet.mockImplementation(async (url) => {
      if (url === CLIENTS_URL) return []
      if (url === CLIENT_RECORDS_URL) return [manualClientRecord({ id: 907 })]
      if (url === REMINDERS_URL) return []
      throw new Error(`Unexpected apiGet call: ${url}`)
    })
    mockedFetchClientRegularTimes.mockResolvedValue([])

    const { container } = renderView()
    const manualCard = await waitFor(() => {
      const card = container.querySelector('#manual-client-record-907')
      expect(card).toBeInstanceOf(HTMLElement)
      return card as HTMLElement
    })
    await openAccordionSection(manualCard, 'Регулярний час')
    await fireEvent.click(await within(manualCard).findByRole('button', { name: 'Додати регулярний час' }))
    const startTimeSelect = within(manualCard).getByLabelText('Час початку') as HTMLSelectElement
    expect(startTimeSelect.tagName).toBe('SELECT')
    expect(startTimeSelect).toHaveValue('09:00')
    await fireEvent.update(startTimeSelect, '09:30')
    const timeOptionText = Array.from(startTimeSelect.options).map((option) => option.textContent || '').join(' ')
    expect(timeOptionText).toContain('09:00')
    expect(timeOptionText).toContain('09:30')
    expect(timeOptionText).not.toMatch(/\b(?:AM|PM)\b/i)
    const startsOnInput = within(manualCard).getByLabelText('Починаючи з') as HTMLInputElement
    expect(startsOnInput).toHaveAttribute('readonly')
    await fireEvent.update(within(manualCard).getByLabelText('День тижня'), '2')
    await selectRegularTimeDate(manualCard, '2026-05-20')
    expect(startsOnInput).toHaveValue('20.05.2026')
    await fireEvent.update(within(manualCard).getByLabelText('Посилання на зустріч'), 'https://meet.example/one')
    await fireEvent.click(within(manualCard).getByRole('button', { name: 'Зберегти' }))

    await waitFor(() => {
      expect(mockedCreateClientRegularTime).toHaveBeenCalledWith(907, {
        weekday: 2,
        start_time: '09:30',
        duration_minutes: 50,
        frequency: 'weekly',
        starts_on: '2026-05-20',
        session_format: 'online',
        meeting_url: 'https://meet.example/one',
        offline_location: '',
      })
      expect(mockedCreateClientRegularTime.mock.calls[0]?.[1]).not.toHaveProperty('timezone')
      expect(mockToast.success).toHaveBeenCalledWith('Регулярний час додано.')
    })
  })

  it('creates offline regular time with empty meeting URL string', async () => {
    mockedApiGet.mockImplementation(async (url) => {
      if (url === CLIENTS_URL) return []
      if (url === CLIENT_RECORDS_URL) return [manualClientRecord({ id: 919 })]
      if (url === REMINDERS_URL) return []
      throw new Error(`Unexpected apiGet call: ${url}`)
    })
    mockedFetchClientRegularTimes.mockResolvedValue([])

    const { container } = renderView()
    const manualCard = await waitFor(() => {
      const card = container.querySelector('#manual-client-record-919')
      expect(card).toBeInstanceOf(HTMLElement)
      return card as HTMLElement
    })
    await openAccordionSection(manualCard, 'Регулярний час')
    await fireEvent.click(await within(manualCard).findByRole('button', { name: 'Додати регулярний час' }))
    await fireEvent.update(within(manualCard).getByLabelText('День тижня'), '2')
    await selectRegularTimeDate(manualCard, '2026-05-20')
    await fireEvent.update(within(manualCard).getByLabelText('Формат'), 'offline')
    await fireEvent.update(within(manualCard).getByLabelText('Адреса / місце зустрічі'), ' Кабінет 12 ')
    await fireEvent.click(within(manualCard).getByRole('button', { name: 'Зберегти' }))

    await waitFor(() => {
      expect(mockedCreateClientRegularTime).toHaveBeenCalledWith(
        919,
        expect.objectContaining({
          session_format: 'offline',
          meeting_url: '',
          offline_location: 'Кабінет 12',
        })
      )
    })
  })

  it('rejects missing regular time date before request', async () => {
    mockedApiGet.mockImplementation(async (url) => {
      if (url === CLIENTS_URL) return []
      if (url === CLIENT_RECORDS_URL) return [manualClientRecord({ id: 917 })]
      if (url === REMINDERS_URL) return []
      throw new Error(`Unexpected apiGet call: ${url}`)
    })
    mockedFetchClientRegularTimes.mockResolvedValue([])

    const { container } = renderView()
    const manualCard = await waitFor(() => {
      const card = container.querySelector('#manual-client-record-917')
      expect(card).toBeInstanceOf(HTMLElement)
      return card as HTMLElement
    })
    await openAccordionSection(manualCard, 'Регулярний час')
    await fireEvent.click(await within(manualCard).findByRole('button', { name: 'Додати регулярний час' }))
    await fireEvent.click(within(manualCard).getByRole('button', { name: 'Зберегти' }))

    await waitFor(() => {
      expect(manualCard).toHaveTextContent('Вкажіть дату початку у форматі ДД.ММ.РРРР.')
      expect(mockedCreateClientRegularTime).not.toHaveBeenCalled()
    })
  })

  it('rejects mismatched regular time weekday and start date before create request', async () => {
    mockedApiGet.mockImplementation(async (url) => {
      if (url === CLIENTS_URL) return []
      if (url === CLIENT_RECORDS_URL) return [manualClientRecord({ id: 925 })]
      if (url === REMINDERS_URL) return []
      throw new Error(`Unexpected apiGet call: ${url}`)
    })
    mockedFetchClientRegularTimes.mockResolvedValue([])

    const { container } = renderView()
    const manualCard = await waitFor(() => {
      const card = container.querySelector('#manual-client-record-925')
      expect(card).toBeInstanceOf(HTMLElement)
      return card as HTMLElement
    })
    await openAccordionSection(manualCard, 'Регулярний час')
    await fireEvent.click(await within(manualCard).findByRole('button', { name: 'Додати регулярний час' }))
    await selectRegularTimeDate(manualCard, '2026-05-20')
    await fireEvent.click(within(manualCard).getByRole('button', { name: 'Зберегти' }))

    await waitFor(() => {
      expect(manualCard).toHaveTextContent('Дата початку має відповідати обраному дню тижня.')
      expect(mockedCreateClientRegularTime).not.toHaveBeenCalled()
    })
  })

  it('rejects missing regular time start time before request', async () => {
    mockedApiGet.mockImplementation(async (url) => {
      if (url === CLIENTS_URL) return []
      if (url === CLIENT_RECORDS_URL) return [manualClientRecord({ id: 918 })]
      if (url === REMINDERS_URL) return []
      throw new Error(`Unexpected apiGet call: ${url}`)
    })
    mockedFetchClientRegularTimes.mockResolvedValue([])

    const { container } = renderView()
    const manualCard = await waitFor(() => {
      const card = container.querySelector('#manual-client-record-918')
      expect(card).toBeInstanceOf(HTMLElement)
      return card as HTMLElement
    })
    await openAccordionSection(manualCard, 'Регулярний час')
    await fireEvent.click(await within(manualCard).findByRole('button', { name: 'Додати регулярний час' }))
    await fireEvent.update(within(manualCard).getByLabelText('День тижня'), '2')
    await selectRegularTimeDate(manualCard, '2026-05-20')
    await fireEvent.update(within(manualCard).getByLabelText('Час початку'), '')
    await fireEvent.click(within(manualCard).getByRole('button', { name: 'Зберегти' }))

    await waitFor(() => {
      expect(manualCard).toHaveTextContent('Вкажіть час початку.')
      expect(mockedCreateClientRegularTime).not.toHaveBeenCalled()
    })
  })

  it('rejects mismatched regular time weekday and start date before update request', async () => {
    mockedApiGet.mockImplementation(async (url) => {
      if (url === CLIENTS_URL) return []
      if (url === CLIENT_RECORDS_URL) return [manualClientRecord({ id: 926 })]
      if (url === REMINDERS_URL) return []
      throw new Error(`Unexpected apiGet call: ${url}`)
    })
    mockedFetchClientRegularTimes.mockResolvedValue([
      regularTimeRecord({ id: 826, client_record: 926, weekday: 2, starts_on: '2026-05-21' }),
    ] as any)

    const { container } = renderView()
    const manualCard = await waitFor(() => {
      const card = container.querySelector('#manual-client-record-926')
      expect(card).toBeInstanceOf(HTMLElement)
      return card as HTMLElement
    })
    await openAccordionSection(manualCard, 'Регулярний час')
    const regularTimeBlock = await waitFor(() => {
      const block = manualCard.querySelector('.client-regular-time')
      expect(block).toBeInstanceOf(HTMLElement)
      return block as HTMLElement
    })
    await fireEvent.click(within(regularTimeBlock).getByRole('button', { name: 'Редагувати' }))
    await fireEvent.click(within(manualCard).getByRole('button', { name: 'Зберегти' }))

    await waitFor(() => {
      expect(manualCard).toHaveTextContent('Дата початку має відповідати обраному дню тижня.')
      expect(mockedUpdateClientRegularTime).not.toHaveBeenCalled()
    })
  })

  it('updates regular time', async () => {
    mockedApiGet.mockImplementation(async (url) => {
      if (url === CLIENTS_URL) return []
      if (url === CLIENT_RECORDS_URL) return [manualClientRecord({ id: 908 })]
      if (url === REMINDERS_URL) return []
      throw new Error(`Unexpected apiGet call: ${url}`)
    })
    mockedFetchClientRegularTimes.mockResolvedValue([regularTimeRecord({ id: 810, client_record: 908 })] as any)

    const { container } = renderView()
    const manualCard = await waitFor(() => {
      const card = container.querySelector('#manual-client-record-908')
      expect(card).toBeInstanceOf(HTMLElement)
      return card as HTMLElement
    })
    await openAccordionSection(manualCard, 'Регулярний час')
    const regularTimeBlock = await waitFor(() => {
      const block = manualCard.querySelector('.client-regular-time')
      expect(block).toBeInstanceOf(HTMLElement)
      return block as HTMLElement
    })
    await fireEvent.click(within(regularTimeBlock).getByRole('button', { name: 'Редагувати' }))
    await fireEvent.update(within(manualCard).getByLabelText('Тривалість'), '60')
    await fireEvent.click(within(manualCard).getByRole('button', { name: 'Зберегти' }))

    await waitFor(() => {
      expect(mockedUpdateClientRegularTime).toHaveBeenCalledWith(
        908,
        810,
        expect.objectContaining({
          duration_minutes: 60,
          starts_on: '2026-05-20',
        })
      )
      expect(mockToast.success).toHaveBeenCalledWith('Регулярний час оновлено.')
    })
  })

  it('pauses regular time', async () => {
    mockedApiGet.mockImplementation(async (url) => {
      if (url === CLIENTS_URL) return []
      if (url === CLIENT_RECORDS_URL) return [manualClientRecord({ id: 909 })]
      if (url === REMINDERS_URL) return []
      throw new Error(`Unexpected apiGet call: ${url}`)
    })
    mockedFetchClientRegularTimes.mockResolvedValue([regularTimeRecord({ id: 811, client_record: 909 })] as any)

    const { container } = renderView()
    const manualCard = await waitFor(() => {
      const card = container.querySelector('#manual-client-record-909')
      expect(card).toBeInstanceOf(HTMLElement)
      return card as HTMLElement
    })
    await openAccordionSection(manualCard, 'Регулярний час')
    await fireEvent.click(await within(manualCard).findByRole('button', { name: 'Поставити на паузу' }))

    await waitFor(() => {
      expect(mockedPauseClientRegularTime).toHaveBeenCalledWith(909, 811)
      expect(mockToast.success).toHaveBeenCalledWith('Регулярний час поставлено на паузу.')
    })
  })

  it('resumes regular time', async () => {
    mockedApiGet.mockImplementation(async (url) => {
      if (url === CLIENTS_URL) return []
      if (url === CLIENT_RECORDS_URL) return [manualClientRecord({ id: 910 })]
      if (url === REMINDERS_URL) return []
      throw new Error(`Unexpected apiGet call: ${url}`)
    })
    mockedFetchClientRegularTimes.mockResolvedValue([
      regularTimeRecord({ id: 812, client_record: 910, status: 'paused' }),
    ] as any)

    const { container } = renderView()
    const manualCard = await waitFor(() => {
      const card = container.querySelector('#manual-client-record-910')
      expect(card).toBeInstanceOf(HTMLElement)
      return card as HTMLElement
    })
    await openAccordionSection(manualCard, 'Регулярний час')
    await fireEvent.click(await within(manualCard).findByRole('button', { name: 'Відновити' }))

    await waitFor(() => {
      expect(mockedResumeClientRegularTime).toHaveBeenCalledWith(910, 812)
      expect(mockToast.success).toHaveBeenCalledWith('Регулярний час відновлено.')
    })
  })

  it('shows duplicate regular time backend error copy', async () => {
    mockedApiGet.mockImplementation(async (url) => {
      if (url === CLIENTS_URL) return []
      if (url === CLIENT_RECORDS_URL) return [manualClientRecord({ id: 911 })]
      if (url === REMINDERS_URL) return []
      throw new Error(`Unexpected apiGet call: ${url}`)
    })
    mockedFetchClientRegularTimes.mockResolvedValue([])
    mockedCreateClientRegularTime.mockRejectedValueOnce({
      response: { data: { code: 'CLIENT_REGULAR_TIME_DUPLICATE' } },
    })

    const { container } = renderView()
    const manualCard = await waitFor(() => {
      const card = container.querySelector('#manual-client-record-911')
      expect(card).toBeInstanceOf(HTMLElement)
      return card as HTMLElement
    })
    await openAccordionSection(manualCard, 'Регулярний час')
    await fireEvent.click(await within(manualCard).findByRole('button', { name: 'Додати регулярний час' }))
    await fireEvent.update(within(manualCard).getByLabelText('День тижня'), '2')
    await selectRegularTimeDate(manualCard, '2026-05-20')
    await fireEvent.click(within(manualCard).getByRole('button', { name: 'Зберегти' }))

    await waitFor(() => {
      expect(manualCard.textContent || '').toContain('Такий регулярний час уже додано для цього клієнта.')
      expect(mockToast.success).not.toHaveBeenCalled()
    })
  })

  it('shows archived client regular time backend error copy', async () => {
    mockedApiGet.mockImplementation(async (url) => {
      if (url === CLIENTS_URL) return []
      if (url === CLIENT_RECORDS_URL) return [manualClientRecord({ id: 912 })]
      if (url === REMINDERS_URL) return []
      throw new Error(`Unexpected apiGet call: ${url}`)
    })
    mockedFetchClientRegularTimes.mockResolvedValue([])
    mockedCreateClientRegularTime.mockRejectedValueOnce({
      response: { data: { code: 'CLIENT_RECORD_ARCHIVED' } },
    })

    const { container } = renderView()
    const manualCard = await waitFor(() => {
      const card = container.querySelector('#manual-client-record-912')
      expect(card).toBeInstanceOf(HTMLElement)
      return card as HTMLElement
    })
    await openAccordionSection(manualCard, 'Регулярний час')
    await fireEvent.click(await within(manualCard).findByRole('button', { name: 'Додати регулярний час' }))
    await fireEvent.update(within(manualCard).getByLabelText('День тижня'), '2')
    await selectRegularTimeDate(manualCard, '2026-05-20')
    await fireEvent.click(within(manualCard).getByRole('button', { name: 'Зберегти' }))

    await waitFor(() => {
      expect(manualCard.textContent || '').toContain('Картка клієнта в архіві. Регулярний час не можна змінити.')
    })
  })
})
