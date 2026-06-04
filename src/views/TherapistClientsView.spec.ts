import { fireEvent, render, screen, waitFor, within } from '@testing-library/vue'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import {
  apiGet,
  apiPatch,
  apiPost,
  createClientRegularTime,
  createSpecialistClientMaterial,
  deleteClientMaterialAttachment,
  createClientRecordAccountInvite,
  fetchClientRegularTimes,
  fetchSpecialistClientMaterials,
  fetchChatThreads,
  fetchClientRecordAccountInvite,
  fetchSpecialistProfile,
  listClientMaterialAttachments,
  materializeClientRegularTimeSessions,
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
  materializeClientRegularTimeSessions: vi.fn(),
  createSpecialistClientMaterial: vi.fn(),
  deleteClientMaterialAttachment: vi.fn(),
  createClientRecordAccountInvite: vi.fn(),
  fetchClientRegularTimes: vi.fn(),
  fetchSpecialistClientMaterials: vi.fn(),
  fetchChatThreads: vi.fn(),
  fetchClientRecordAccountInvite: vi.fn(),
  fetchSpecialistProfile: vi.fn(),
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
const mockedMaterializeClientRegularTimeSessions = vi.mocked(materializeClientRegularTimeSessions)
const mockedCreateSpecialistClientMaterial = vi.mocked(createSpecialistClientMaterial)
const mockedDeleteClientMaterialAttachment = vi.mocked(deleteClientMaterialAttachment)
const mockedCreateClientRecordAccountInvite = vi.mocked(createClientRecordAccountInvite)
const mockedFetchClientRegularTimes = vi.mocked(fetchClientRegularTimes)
const mockedFetchSpecialistClientMaterials = vi.mocked(fetchSpecialistClientMaterials)
const mockedFetchChatThreads = vi.mocked(fetchChatThreads)
const mockedFetchClientRecordAccountInvite = vi.mocked(fetchClientRecordAccountInvite)
const mockedFetchSpecialistProfile = vi.mocked(fetchSpecialistProfile)
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
const SESSIONS_URL = '/booking/sessions/'
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

function expectSummaryCount(container: Element, label: string, value: number) {
  const item = Array.from(container.querySelectorAll('.client-counts__item')).find((node) =>
    node.textContent?.includes(label)
  )
  expect(item).toBeInstanceOf(HTMLElement)
  expect(item).toHaveTextContent(label)
  expect(item).toHaveTextContent(String(value))
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

async function openMaterialsManagement(scope: HTMLElement) {
  const summary = await waitFor(() => {
    const title = within(scope).getByText('Матеріали для клієнта')
    const card = title.closest('.client-summary-card')
    expect(card).toBeInstanceOf(HTMLElement)
    return card as HTMLElement
  })
  await fireEvent.click(within(summary).getByRole('button', { name: 'Відкрити' }))
  return screen.findByRole('dialog', { name: 'Картка клієнта' })
}

async function selectRegularTimeDate(scope: HTMLElement, isoDate: string) {
  const [yearRaw, monthRaw, dayRaw] = isoDate.split('-')
  const year = Number(yearRaw)
  const month = Number(monthRaw)
  const day = Number(dayRaw)
  const displayDate = `${String(day).padStart(2, '0')}.${String(month).padStart(2, '0')}.${year}`
  const targetTime = new Date(year, month - 1, day).getTime()

  await fireEvent.click(within(scope).getByLabelText('Вибрати дату'))

  for (let index = 0; index < 24; index += 1) {
    const targetButton = within(scope).queryByRole('button', { name: displayDate })
    if (targetButton) {
      await fireEvent.click(targetButton)
      return displayDate
    }

    const pickerDays = Array.from(scope.querySelectorAll('.date-picker-day')) as HTMLButtonElement[]
    const visibleTimes = pickerDays
      .map((button) => {
        const label = button.getAttribute('aria-label') || ''
        const [dayText, monthText, yearText] = label.split('.')
        if (!dayText || !monthText || !yearText) return Number.NaN
        const dayValue = Number(dayText)
        const monthValue = Number(monthText)
        const yearValue = Number(yearText)
        return new Date(yearValue, monthValue - 1, dayValue).getTime()
      })
      .filter((value) => Number.isFinite(value))

    if (!visibleTimes.length) break

    const minVisibleTime = Math.min(...visibleTimes)
    const maxVisibleTime = Math.max(...visibleTimes)
    const directionName = targetTime < minVisibleTime ? 'Попередній місяць' : 'Наступний місяць'

    if (targetTime >= minVisibleTime && targetTime <= maxVisibleTime) break

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

function sessionRecord(overrides: Record<string, unknown> = {}) {
  return {
    id: 7001,
    client_id: 44,
    client_record_id: null,
    status: 'SCHEDULED',
    slot_start_at: '2099-06-15T10:00:00Z',
    slot_end_at: '2099-06-15T10:50:00Z',
    session_format: 'online',
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
    mockedMaterializeClientRegularTimeSessions.mockReset()
    mockedMaterializeClientRegularTimeSessions.mockResolvedValue({
      regular_time_id: 801,
      horizon_weeks: 4,
      max_occurrences: 4,
      occurrences_considered: 4,
      created_count: 1,
      skipped_existing_count: 0,
      skipped_conflicts_count: 0,
      created_sessions: [{ id: 9901 }],
      skipped_existing_sessions: [],
      skipped_conflicts: [],
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
    mockedFetchSpecialistProfile.mockReset()
    mockedFetchSpecialistProfile.mockResolvedValue({ standard_session_duration_minutes: 50 } as any)
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

    const retryButton = await within(clientsPanel).findByRole('button', { name: 'Спробувати ще раз' })

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
      expect(screen.getAllByText('Клієнт без імені')).toHaveLength(3)
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

  it('confirms ending work before archiving client using client_id from relation payload', async () => {
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
    expect(within(card).queryByText('Клієнт буде перенесений в архів. Історія, нотатки й матеріали збережуться.')).not.toBeInTheDocument()
    expect(within(card).queryByRole('button', { name: 'Архівувати' })).not.toBeInTheDocument()
    await fireEvent.click(within(card).getByRole('button', { name: 'Завершити роботу' }))

    const dialog = await screen.findByRole('dialog', { name: 'Завершити роботу з клієнтом?' })
    expect(dialog).toHaveTextContent(
      'Клієнт буде перенесений в архів. Його історія, нотатки й матеріали залишаться доступними. Ви зможете повернути клієнта в роботу пізніше.'
    )
    expect(mockedApiPatch).not.toHaveBeenCalled()
    await fireEvent.click(within(dialog).getByRole('button', { name: 'Завершити роботу' }))

    await waitFor(() => {
      expect(mockedApiPatch).toHaveBeenCalledWith('/cabinet/clients/44/archive/')
    })
  })

  it('cancels ending work without calling archive endpoint', async () => {
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

    const { container } = renderView()

    const card = await waitFor(() => {
      const node = container.querySelector('.client-card')
      expect(node).toBeInstanceOf(HTMLElement)
      return node as HTMLElement
    })
    await openAccordionSection(card, 'Керування клієнтом')
    await fireEvent.click(within(card).getByRole('button', { name: 'Завершити роботу' }))
    const dialog = await screen.findByRole('dialog', { name: 'Завершити роботу з клієнтом?' })

    await fireEvent.click(within(dialog).getByRole('button', { name: 'Скасувати' }))

    await waitFor(() => {
      expect(screen.queryByRole('dialog', { name: 'Завершити роботу з клієнтом?' })).not.toBeInTheDocument()
    })
    expect(mockedApiPatch).not.toHaveBeenCalled()
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
      const button = screen.getByRole('button', { name: 'Додати задачу' })
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
      })
      const payload = mockedCreatePracticeBoardItem.mock.calls[0]?.[0] || {}
      expect(payload).not.toHaveProperty('source_type')
      expect(payload).not.toHaveProperty('source_id')
      expect(mockedFetchPracticeBoards).toHaveBeenCalledTimes(1)
      expect(mockToast.success).toHaveBeenCalledWith('Задачу додано. Вона доступна в розділі «Задачі».')
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
      const button = screen.getByRole('button', { name: 'Додати задачу' })
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
      const button = screen.getByRole('button', { name: 'Додати задачу' })
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
      })
      const payload = mockedCreatePracticeBoardItem.mock.calls[0]?.[0] || {}
      expect(payload).not.toHaveProperty('source_type')
      expect(payload).not.toHaveProperty('source_id')
      expect(mockToast.success).toHaveBeenCalledWith('Задачу додано. Вона доступна в розділі «Задачі».')
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
    await openAccordionSection(card, 'Приватний зошит')

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
      if (url === CLIENT_RECORDS_URL) return []
      if (url === REMINDERS_URL) return []
      if (url === clientHistoryUrl(44)) return []
      throw new Error(`Unexpected apiGet call: ${url}`)
    })

    const { container } = renderView()

    await waitFor(() => {
      expect(container.textContent).toContain('Metadata Client')
      expect(container.querySelector('a[href^="/cabinet/sessions#note-"]')).not.toBeInTheDocument()
    })

    const card = await waitFor(() => {
      const node = container.querySelector('#client-card-44')
      expect(node).toBeInstanceOf(HTMLElement)
      return node as HTMLElement
    })
    await openAccordionSection(card, 'Приватний зошит')

    await waitFor(() => {
      expect(container.querySelector('.workbook-block')).toBeInTheDocument()
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
      if (url === CLIENT_RECORDS_URL) return []
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

  it('renders summary counts from currently loaded registered and manual clients', async () => {
    mockedApiGet.mockImplementation(async (url) => {
      if (url === CLIENTS_URL)
        return [
          {
            id: 1,
            client_id: 44,
            state: 'ACTIVE',
            last_session_at: null,
            upcoming_count: 0,
            client_display_name: 'Active Registered',
          },
          {
            id: 2,
            client_id: 55,
            state: 'INACTIVE',
            last_session_at: null,
            upcoming_count: 0,
            client_display_name: 'Inactive Registered',
          },
          {
            id: 3,
            client_id: 66,
            state: 'ARCHIVED',
            last_session_at: null,
            upcoming_count: 0,
            client_display_name: 'Archived Registered',
          },
        ]
      if (url === CLIENT_RECORDS_URL)
        return [
          manualClientRecord({ id: 610, display_name: 'Manual Active', status: 'active' }),
          manualClientRecord({ id: 611, display_name: 'Manual Linked', status: 'active', has_account: true, user_id: 700 }),
          manualClientRecord({ id: 612, display_name: 'Manual Archived', status: 'archived' }),
        ]
      if (url === REMINDERS_URL) return []
      throw new Error(`Unexpected apiGet call: ${url}`)
    })

    const { container } = renderView()
    const { clientsPanel } = getPanels(container)

    await waitFor(() => {
      expect(clientsPanel.querySelectorAll('.client-row')).toHaveLength(6)
      expect(clientsPanel.querySelector('.client-counts')).toBeInTheDocument()
      expect(clientsPanel.querySelectorAll('.client-counts__item')).toHaveLength(6)
      expectSummaryCount(clientsPanel, 'Усього', 6)
      expectSummaryCount(clientsPanel, 'Активні', 3)
      expectSummaryCount(clientsPanel, 'Неактивні', 1)
      expectSummaryCount(clientsPanel, 'З кабінетом', 4)
      expectSummaryCount(clientsPanel, 'Без реєстрації', 2)
      expectSummaryCount(clientsPanel, 'Архів', 2)
    })

    const searchInput = clientsPanel.querySelector('#clients-search-input') as HTMLInputElement
    await fireEvent.update(searchInput, 'Manual Active')
    await waitFor(() => {
      expect(clientsPanel.querySelectorAll('.client-row')).toHaveLength(1)
      expectSummaryCount(clientsPanel, 'Усього', 6)
    })

    expect(container).toHaveTextContent('Швидкий список клієнтів. Натисніть на рядок, щоб відкрити повну картку клієнта.')
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
    expect(within(firstCard).getAllByText('Приватний зошит').length).toBeGreaterThan(0)
    expect(within(firstCard).getByText('Оновлено')).toBeInTheDocument()
    const primaryActions = requireHTMLElement(firstCard.querySelector('.client-actions__primary'), '.client-actions__primary')
    expect(within(primaryActions).getByRole('button', { name: 'Керувати клієнтом' })).toHaveClass('btn--sm')
    expect(within(primaryActions).queryByRole('link', { name: 'Відкрити нотатку' })).not.toBeInTheDocument()
    expect(within(primaryActions).queryByRole('button', { name: 'Відкрити приватний зошит' })).not.toBeInTheDocument()
    expect(within(firstCard).queryByRole('button', { name: 'Відкрити зошит' })).not.toBeInTheDocument()
    expect(within(firstCard).getByText('Доступ, статус, завершення')).toBeInTheDocument()
    await openAccordionSection(firstCard, 'Керування клієнтом')
    expect(within(firstCard).getByRole('button', { name: 'Додати задачу' })).toBeInTheDocument()
    expect(within(firstCard).getByRole('button', { name: 'Завершити роботу' })).toBeInTheDocument()
    expect(within(firstCard).queryByRole('button', { name: 'Архівувати' })).not.toBeInTheDocument()
    expect(clientsPanel).not.toHaveTextContent('ACTIVE')
    expect(clientsPanel).not.toHaveTextContent('INACTIVE')
    expect(clientsPanel).not.toHaveTextContent('ARCHIVED')
  })

  it('renders compact rows and keeps the old selected-client panel out of the page layout', async () => {
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
            client_email: 'second@example.com',
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
      expect(clientsPanel.querySelector('.clients-list-header')).toHaveTextContent('Клієнт')
      expect(clientsPanel.querySelector('.clients-list-header')).toHaveTextContent('Контакт')
      expect(clientsPanel.querySelector('.clients-list-header')).toHaveTextContent('Статус')
      expect(clientsPanel.querySelector('.clients-list-header')).toHaveTextContent('Найближча сесія')
      expect(clientsPanel.querySelector('.clients-list-header')).toHaveTextContent('Останнє')
      expect(clientsPanel.querySelector('.client-detail')).toHaveClass('client-detail--legacy-cache')
      expect(clientsPanel.querySelector('.client-row--selected')).toHaveTextContent('First Client')
      expect(clientsPanel.querySelector('.client-card')).toHaveTextContent('First Client')
      expect(clientsPanel.querySelector('.client-card')).not.toHaveTextContent('Second Client')
    })

    const firstRow = clientsPanel.querySelector('.client-row--selected') as HTMLElement
    expect(firstRow).toHaveTextContent('First Client')
    expect(firstRow.querySelector('.client-row__main')).toHaveTextContent('First Client')
    expect(firstRow.querySelector('.client-row__contact')).toHaveTextContent('Немає контакту')
    expect(firstRow.querySelector('.client-row__badges')).toHaveTextContent('З кабінетом')
    expect(firstRow.querySelector('.client-row__badges')).toHaveTextContent('Активний')
    expect(firstRow.querySelector('.client-row__next')).toHaveTextContent('1 майбутня сесія')
    expect(firstRow.querySelector('.client-row__last')).toHaveTextContent('Немає оновлень')
    expect(firstRow).not.toHaveTextContent('Контакт')
    expect(firstRow).not.toHaveTextContent('Найближча')
    expect(firstRow).not.toHaveTextContent('Останнє')

    await selectClientRowByName(clientsPanel, 'Second Client')

    await waitFor(() => {
      expect(clientsPanel.querySelectorAll('.client-card')).toHaveLength(1)
      expect(clientsPanel.querySelector('.client-detail')).toHaveClass('client-detail--legacy-cache')
      expect(clientsPanel.querySelector('.client-row--selected')).toHaveTextContent('Second Client')
      expect(clientsPanel.querySelector('.client-row--selected')).toHaveAttribute('aria-current', 'true')
      expect(clientsPanel.querySelector('.client-card')).toHaveTextContent('Second Client')
      expect(clientsPanel.querySelector('.client-card')).not.toHaveTextContent('First Client')
    })

    const selectedCard = clientsPanel.querySelector('.client-card') as HTMLElement
    expect(selectedCard).not.toHaveTextContent('Інформація зашифрована')
    expect(selectedCard).not.toHaveTextContent('Зошит згорнуто')
    expect(selectedCard).not.toHaveTextContent('Нотаток по цьому клієнту')

    const privateHeader = await openAccordionSection(selectedCard, 'Приватний зошит')
    expect(privateHeader).toHaveAttribute('aria-expanded', 'true')
    expect(selectedCard).toHaveTextContent('Клієнт не бачить ці записи')

    await openAccordionSection(selectedCard, 'Нотатки по сесіях')
    await waitFor(() => {
      expect(selectedCard).not.toHaveTextContent('Клієнт не бачить ці записи')
      expect(selectedCard).toHaveTextContent('Нотаток по цьому клієнту ще немає.')
    })
  })

  it('opens client management modal when a registered client row is clicked and updates it for another client', async () => {
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
            client_email: 'second@example.com',
          },
        ]
      if (url === REMINDERS_URL) return []
      if (url === SESSIONS_URL)
        return [
          sessionRecord({
            id: 7101,
            client_id: 55,
            status: 'SCHEDULED',
            slot_start_at: '2099-06-20T10:00:00Z',
            slot_end_at: '2099-06-20T10:50:00Z',
            session_format: 'online',
          }),
        ]
      throw new Error(`Unexpected apiGet call: ${url}`)
    })
    mockedFetchSpecialistClientMaterials.mockResolvedValue([])

    const { container } = renderView()
    const { clientsPanel } = getPanels(container)

    expect(screen.queryByRole('dialog', { name: 'Картка клієнта' })).not.toBeInTheDocument()
    await selectClientRowByName(clientsPanel, 'Second Client')

    const dialog = await screen.findByRole('dialog', { name: 'Картка клієнта' })
    expect(within(dialog).getByText('Second Client')).toBeInTheDocument()
    expect(clientsPanel.querySelector('.client-row--selected')).toHaveTextContent('Second Client')
    expect(within(dialog).getAllByRole('tab').map((tab) => tab.textContent?.trim())).toEqual([
      'Огляд',
      'Контакти',
      'Сесії',
      'Матеріали',
      'Регулярний час',
      'Приватний зошит',
      'Нотатки',
      'Доступ',
    ])
    expect(within(dialog).getByRole('tab', { name: 'Огляд' })).toHaveAttribute('aria-selected', 'true')
    expect(within(dialog).getByRole('tab', { name: 'Контакти' })).toBeInTheDocument()
    expect(within(dialog).getByRole('tab', { name: 'Сесії' })).toBeInTheDocument()
    expect(within(dialog).getByRole('tab', { name: 'Матеріали' })).toBeInTheDocument()
    expect(within(dialog).getByRole('tab', { name: 'Регулярний час' })).toBeInTheDocument()
    expect(within(dialog).getByRole('tab', { name: 'Приватний зошит' })).toBeInTheDocument()
    expect(within(dialog).getByRole('tab', { name: 'Нотатки' })).toBeInTheDocument()
    expect(within(dialog).getByRole('tab', { name: 'Доступ' })).toBeInTheDocument()
    expect(within(dialog).getByText('Статус')).toBeInTheDocument()
    expect(within(dialog).getByText('Кабінет')).toBeInTheDocument()
    expect(within(dialog).getByText('second@example.com')).toBeInTheDocument()
    expect(within(dialog).getByText('Немає запланованих')).toBeInTheDocument()
    expect(within(dialog).getByText('Матеріалів немає')).toBeInTheDocument()

    await fireEvent.click(within(dialog).getByRole('tab', { name: 'Контакти' }))
    expect(within(dialog).getByRole('heading', { name: 'Контакти' })).toBeInTheDocument()
    expect(within(dialog).getByText('Email')).toBeInTheDocument()
    expect(within(dialog).getByText('second@example.com')).toBeInTheDocument()
    expect(within(dialog).getByText('Телефон')).toBeInTheDocument()
    expect(within(dialog).getByText('Не вказано')).toBeInTheDocument()
    expect(within(dialog).getByText('Кабінет')).toBeInTheDocument()
    expect(within(dialog).getByText('З кабінетом')).toBeInTheDocument()
    expect(within(dialog).getByText('Джерело картки')).toBeInTheDocument()
    expect(within(dialog).getByText('Підключено до кабінету клієнта')).toBeInTheDocument()
    expect(dialog).not.toHaveTextContent('Тип картки')
    expect(dialog).not.toHaveTextContent('Клієнт з кабінетом')
    expect(dialog).not.toHaveTextContent('У Phase 1 цей розділ залишається доступним у правій панелі')

    await fireEvent.click(within(dialog).getByRole('tab', { name: 'Сесії' }))
    expect(within(dialog).getByRole('heading', { name: 'Сесії' })).toBeInTheDocument()
    expect(await within(dialog).findByText('20.06.2099, 13:00')).toBeInTheDocument()
    expect(within(dialog).getByText('50 хв · Формат: онлайн')).toBeInTheDocument()
    expect(within(dialog).getByRole('link', { name: 'Відкрити сесію' })).toHaveAttribute(
      'href',
      '/cabinet/sessions/7101'
    )
    expect(dialog).not.toHaveTextContent('У Phase 1 цей розділ залишається доступним у правій панелі')

    await selectClientRowByName(clientsPanel, 'First Client')

    await waitFor(() => {
      expect(within(dialog).getByText('First Client')).toBeInTheDocument()
      expect(within(dialog).queryByText('Second Client')).not.toBeInTheDocument()
      expect(clientsPanel.querySelector('.client-row--selected')).toHaveTextContent('First Client')
    })
  })

  it('opens client management modal when a manual client row is clicked', async () => {
    mockedApiGet.mockImplementation(async (url) => {
      if (url === CLIENTS_URL) return []
      if (url === CLIENT_RECORDS_URL)
        return [
          manualClientRecord({ id: 620, display_name: 'Manual First' }),
          manualClientRecord({
            id: 621,
            display_name: 'Manual Second',
            email: 'manual@example.com',
            phone: '+380501112233',
            telegram: '@manual_second',
          }),
        ]
      if (url === REMINDERS_URL) return []
      throw new Error(`Unexpected apiGet call: ${url}`)
    })
    mockedFetchSpecialistClientMaterials.mockResolvedValue([])

    const { container } = renderView()
    const { clientsPanel } = getPanels(container)

    expect(screen.queryByRole('dialog', { name: 'Картка клієнта' })).not.toBeInTheDocument()
    await selectClientRowByName(clientsPanel, 'Manual Second')

    const dialog = await screen.findByRole('dialog', { name: 'Картка клієнта' })
    expect(within(dialog).getByText('Manual Second')).toBeInTheDocument()
    expect(clientsPanel.querySelector('.client-row--selected')).toHaveTextContent('Manual Second')
    expect(within(dialog).getByRole('tab', { name: 'Огляд' })).toBeInTheDocument()
    expect(within(dialog).getByRole('tab', { name: 'Контакти' })).toBeInTheDocument()
    expect(within(dialog).getByText('Без реєстрації')).toBeInTheDocument()
    expect(within(dialog).getByText('manual@example.com')).toBeInTheDocument()

    await fireEvent.click(within(dialog).getByRole('tab', { name: 'Контакти' }))
    expect(within(dialog).getByText('Email')).toBeInTheDocument()
    expect(within(dialog).getByText('manual@example.com')).toBeInTheDocument()
    expect(within(dialog).getByText('Телефон')).toBeInTheDocument()
    expect(within(dialog).getByText('+380501112233')).toBeInTheDocument()
    expect(within(dialog).getByText('Telegram')).toBeInTheDocument()
    expect(within(dialog).getByText('@manual_second')).toBeInTheDocument()
    expect(within(dialog).getByText('Кабінет')).toBeInTheDocument()
    expect(within(dialog).getByText('Без реєстрації')).toBeInTheDocument()
    expect(within(dialog).getByText('Джерело картки')).toBeInTheDocument()
    expect(within(dialog).getByText('Створено вручну')).toBeInTheDocument()
    expect(dialog).not.toHaveTextContent('Тип картки')
    expect(dialog).not.toHaveTextContent('internal_note')
  })

  it('shows read-only sessions tab for manual client using client_record_id session rows', async () => {
    mockedApiGet.mockImplementation(async (url) => {
      if (url === CLIENTS_URL) return []
      if (url === CLIENT_RECORDS_URL) return [manualClientRecord({ id: 622, display_name: 'Manual Sessions' })]
      if (url === REMINDERS_URL) return []
      if (url === SESSIONS_URL)
        return [
          sessionRecord({
            id: 7201,
            client_id: null,
            client_record_id: 622,
            status: 'CONFIRMED',
            slot_start_at: '2099-07-01T09:00:00Z',
            slot_end_at: '2099-07-01T09:50:00Z',
            session_format: 'offline',
          }),
          sessionRecord({
            id: 7202,
            client_id: null,
            client_record_id: 622,
            status: 'COMPLETED',
            slot_start_at: '2026-05-01T09:00:00Z',
            slot_end_at: '2026-05-01T09:50:00Z',
            session_format: 'online',
          }),
        ]
      throw new Error(`Unexpected apiGet call: ${url}`)
    })
    mockedFetchSpecialistClientMaterials.mockResolvedValue([])

    const { container } = renderView()
    const { clientsPanel } = getPanels(container)

    await selectClientRowByName(clientsPanel, 'Manual Sessions')
    const dialog = await screen.findByRole('dialog', { name: 'Картка клієнта' })
    await fireEvent.click(within(dialog).getByRole('tab', { name: 'Сесії' }))

    expect(await within(dialog).findByText('01.07.2099, 12:00')).toBeInTheDocument()
    expect(within(dialog).getByText('01.05.2026, 12:00')).toBeInTheDocument()
    expect(within(dialog).getByText('Підтверджено')).toBeInTheDocument()
    expect(within(dialog).getByText('Завершено')).toBeInTheDocument()
    expect(within(dialog).getByText('50 хв · Формат: офлайн')).toBeInTheDocument()
    expect(within(dialog).getByText('50 хв · Формат: онлайн')).toBeInTheDocument()
    expect(within(dialog).getAllByRole('link', { name: 'Відкрити сесію' }).map((link) => link.getAttribute('href'))).toEqual([
      '/cabinet/sessions/7201',
      '/cabinet/sessions/7202',
    ])
    expect(dialog).not.toHaveTextContent('internal_note')
    expect(dialog).not.toHaveTextContent('session note body')
  })

  it('shows truthful limited sessions summary for registered client without session ids', async () => {
    mockedApiGet.mockImplementation(async (url) => {
      if (url === CLIENTS_URL)
        return [
          {
            id: 1,
            client_id: 88,
            state: 'ACTIVE',
            last_session_at: '2026-05-15T11:00:00Z',
            upcoming_count: 2,
            client_display_name: 'Registered Limited Sessions',
          },
        ]
      if (url === CLIENT_RECORDS_URL) return []
      if (url === REMINDERS_URL) return []
      if (url === SESSIONS_URL) return []
      throw new Error(`Unexpected apiGet call: ${url}`)
    })
    mockedFetchSpecialistClientMaterials.mockResolvedValue([])

    const { container } = renderView()
    const { clientsPanel } = getPanels(container)

    await selectClientRowByName(clientsPanel, 'Registered Limited Sessions')
    const dialog = await screen.findByRole('dialog', { name: 'Картка клієнта' })
    await fireEvent.click(within(dialog).getByRole('tab', { name: 'Сесії' }))

    expect(within(dialog).getByText('Деталі майбутніх сесій не передані в цю картку.')).toBeInTheDocument()
    expect(within(dialog).getByText('Деталі останніх сесій не передані в цю картку.')).toBeInTheDocument()
    expect(within(dialog).getByText(/Є 2 майбутні сесії; остання сесія:/)).toBeInTheDocument()
    expect(within(dialog).queryByRole('link', { name: 'Відкрити сесію' })).not.toBeInTheDocument()
  })

  it('does not open client management modal when nested right-panel controls are clicked', async () => {
    mockedApiGet.mockImplementation(async (url) => {
      if (url === CLIENTS_URL)
        return [
          {
            id: 1,
            client_id: 44,
            state: 'ACTIVE',
            last_session_at: null,
            upcoming_count: 0,
            client_display_name: 'Nested Control Client',
          },
        ]
      if (url === REMINDERS_URL) return []
      if (url === clientHistoryUrl(44)) return []
      throw new Error(`Unexpected apiGet call: ${url}`)
    })
    mockedFetchSpecialistClientMaterials.mockResolvedValue([])

    const { container } = renderView()
    const { clientsPanel } = getPanels(container)
    const card = await waitFor(() => {
      const node = clientsPanel.querySelector('#client-card-44')
      expect(node).toBeInstanceOf(HTMLElement)
      return node as HTMLElement
    })

    await openAccordionSection(card, 'Нотатки по сесіях')

    expect(screen.queryByRole('dialog', { name: 'Картка клієнта' })).not.toBeInTheDocument()
    expect(card).toHaveTextContent('Нотаток по цьому клієнту ще немає.')
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
      expect(clientsPanel).toHaveTextContent('Клієнтів не знайдено')
      expect(clientsPanel).toHaveTextContent('Клієнти з’являться після перших консультацій')
      expect(within(clientsPanel).getByRole('button', { name: 'Додати клієнта' })).toBeInTheDocument()
      expect(container).toHaveTextContent('Швидкий список клієнтів. Натисніть на рядок, щоб відкрити повну картку клієнта.')
    })

    const searchInput = clientsPanel.querySelector('#clients-search-input') as HTMLInputElement
    await fireEvent.update(searchInput, 'олена')
    await waitFor(() => {
      expect(clientsPanel).toHaveTextContent('Клієнтів не знайдено')
      expect(clientsPanel).toHaveTextContent('Перевірте написання або змініть фільтр')
    })

    await fireEvent.update(searchInput, '')
    const filterButtons = clientsPanel.querySelectorAll('.filters button')
    await fireEvent.click(filterButtons[1] as HTMLButtonElement)
    await waitFor(() => {
      expect(clientsPanel).toHaveTextContent('Клієнтів не знайдено')
      expect(clientsPanel).toHaveTextContent('Активні клієнти з’являться тут')
    })
    await fireEvent.click(filterButtons[3] as HTMLButtonElement)
    await waitFor(() => {
      expect(clientsPanel).toHaveTextContent('Клієнтів не знайдено')
      expect(clientsPanel).toHaveTextContent('Архівовані клієнти зберігатимуться тут')
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
    expect(within(manualCard).getByRole('button', { name: 'Створити сесію' })).toBeInTheDocument()
    expect(within(manualCard).queryByRole('button', { name: 'Редагувати' })).not.toBeInTheDocument()

    await openAccordionSection(manualCard, 'Керування клієнтом')
    await fireEvent.click(within(manualCard).getByRole('button', { name: 'Редагувати дані клієнта' }))

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
    expect(within(manualCard).queryByRole('button', { name: 'Редагувати' })).not.toBeInTheDocument()
    expect(within(manualCard).getByText('Дані, доступ, архів')).toBeInTheDocument()
    await openAccordionSection(manualCard, 'Керування клієнтом')
    expect(within(manualCard).getByRole('button', { name: 'Редагувати дані клієнта' })).toBeInTheDocument()
    expect(within(manualCard).getByRole('button', { name: 'Завершити роботу' })).toBeInTheDocument()
    expect(within(manualCard).queryByRole('button', { name: 'Відкрити приватний зошит' })).not.toBeInTheDocument()
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

  it('shows cabinet access invite block inside client management for manual client records without account', async () => {
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
    expect(within(manualCard).queryByRole('button', { name: 'Запросити до кабінету' })).not.toBeInTheDocument()
    await openAccordionSection(manualCard, 'Керування клієнтом')

    expect(within(manualCard).getByText('Доступ до кабінету')).toBeInTheDocument()
    expect(
      within(manualCard).getByText(
        'Клієнт ще не має доступу до кабінету. Надішліть запрошення, щоб він міг бачити свої сесії, нагадування й матеріали.'
      )
    ).toBeInTheDocument()
    expect(within(manualCard).getByRole('button', { name: 'Надіслати запрошення' })).toBeInTheDocument()
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

    await openAccordionSection(manualCard, 'Керування клієнтом')

    expect(within(manualCard).getByText('Клієнт має доступ до кабінету.')).toBeInTheDocument()
    expect(within(manualCard).queryByRole('button', { name: 'Надіслати запрошення' })).not.toBeInTheDocument()
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
    const registeredCard = clientsPanel.querySelector('#client-card-44') as HTMLElement
    await openAccordionSection(registeredCard, 'Керування клієнтом')
    expect(within(registeredCard).getByText('Клієнт має доступ до кабінету.')).toBeInTheDocument()
    expect(within(registeredCard).queryByRole('button', { name: 'Надіслати запрошення' })).not.toBeInTheDocument()
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
    await openAccordionSection(manualCard, 'Керування клієнтом')

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
    await openAccordionSection(manualCard, 'Керування клієнтом')
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
    await openAccordionSection(manualCard, 'Керування клієнтом')
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
    await openAccordionSection(manualCard, 'Керування клієнтом')
    await waitFor(() => {
      expect(manualCard).toHaveTextContent('https://proconsult.space/client/invite/revoke-me')
    })

    await fireEvent.click(within(manualCard).getByRole('button', { name: 'Відкликати' }))

    await waitFor(() => {
      expect(mockedRevokeClientRecordAccountInvite).toHaveBeenCalledWith(213)
      expect(within(manualCard).getByRole('button', { name: 'Надіслати запрошення' })).toBeInTheDocument()
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
    await openAccordionSection(manualCard, 'Керування клієнтом')

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
    expect(within(manualCard).queryByRole('button', { name: 'Відкрити приватний зошит' })).not.toBeInTheDocument()
    expect(container.querySelector('a[href^="/cabinet/sessions"]')).not.toBeInTheDocument()
    await openAccordionSection(manualCard, 'Керування клієнтом')
    expect(within(manualCard).queryByRole('button', { name: 'Додати задачу' })).not.toBeInTheDocument()

    await fireEvent.click(within(manualCard).getByRole('button', { name: 'Завершити роботу' }))
    const dialog = await screen.findByRole('dialog', { name: 'Завершити роботу з клієнтом?' })
    await fireEvent.click(within(dialog).getByRole('button', { name: 'Завершити роботу' }))

    await waitFor(() => {
      expect(mockedApiPost).toHaveBeenCalledWith('/cabinet/client-records/203/archive/', {})
      expect(within(manualCard).getByText('Архів')).toBeInTheDocument()
      expect(within(manualCard).getByRole('button', { name: 'Повернути в роботу' })).toBeInTheDocument()
    })

    await fireEvent.click(within(manualCard).getByRole('button', { name: 'Повернути в роботу' }))

    await waitFor(() => {
      expect(mockedApiPost).toHaveBeenCalledWith('/cabinet/client-records/203/restore/', {})
      expect(within(manualCard).getByText('Активний')).toBeInTheDocument()
      expect(within(manualCard).getByRole('button', { name: 'Завершити роботу' })).toBeInTheDocument()
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

  it('shows human fallback client title when name and code are missing', async () => {
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
      expect(container.textContent).toContain('Клієнт без імені')
      expect(container.textContent).not.toContain('#44')
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
      expect(targetCard?.querySelector('.workbook-block')).toBeTruthy()
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
    expect(within(manualCard).getByText('Клієнт побачить матеріали після підключення кабінету.')).toBeInTheDocument()
    const dialog = await openMaterialsManagement(manualCard)
    expect(
      within(dialog).getByText(
        'Клієнт побачить матеріали після підключення кабінету. Для клієнтів без кабінету спершу надішліть запрошення в розділі “Доступ”.'
      )
    ).toBeInTheDocument()
  })

  it('keeps right panel compact and opens full client management modal from selected manual client', async () => {
    mockedApiGet.mockImplementation(async (url) => {
      if (url === CLIENTS_URL) return []
      if (url === CLIENT_RECORDS_URL) return [manualClientRecord({ id: 509, display_name: 'Manual Compact' })]
      if (url === REMINDERS_URL) return []
      throw new Error(`Unexpected apiGet call: ${url}`)
    })
    mockedFetchSpecialistClientMaterials.mockResolvedValue([
      {
        id: 930,
        client_record_id: 509,
        session_id: null,
        status: 'published',
        material_type: 'homework',
        title: 'Breathing homework',
        content: 'Short practice',
        content_preview: 'Short practice',
        url: null,
        published_at: '2026-04-30T01:00:00Z',
        revoked_at: null,
        created_at: '2026-04-30T00:00:00Z',
        updated_at: '2026-04-30T01:00:00Z',
      } as any,
    ])

    const { container } = renderView()
    const manualCard = await waitFor(() => {
      const card = container.querySelector('#manual-client-record-509')
      expect(card).toBeInstanceOf(HTMLElement)
      return card as HTMLElement
    })

    expect(within(manualCard).getByText('Матеріали для клієнта')).toBeInTheDocument()
    expect(manualCard.querySelector('.client-material')).toBeFalsy()
    expect(manualCard.querySelector('.client-material input')).toBeFalsy()
    expect(manualCard.querySelector('.client-material textarea')).toBeFalsy()
    expect(await within(manualCard).findByText('1 матеріал')).toBeInTheDocument()
    expect(within(manualCard).getByText('Останній матеріал: Breathing homework')).toBeInTheDocument()
    const primaryActions = requireHTMLElement(manualCard.querySelector('.client-actions__primary'), '.client-actions__primary')
    const primaryButtons = within(primaryActions).getAllByRole('button')
    expect(primaryButtons[0]).toHaveTextContent('Керувати клієнтом')
    expect(primaryButtons[0]).toHaveClass('btn--sm')
    expect(within(primaryActions).queryByRole('link', { name: 'Відкрити нотатку' })).not.toBeInTheDocument()

    await fireEvent.click(within(manualCard).getByRole('button', { name: 'Керувати клієнтом' }))
    const dialog = await screen.findByRole('dialog', { name: 'Картка клієнта' })
    expect(within(dialog).getByText('Manual Compact')).toBeInTheDocument()
    expect(within(dialog).getByRole('tab', { name: 'Огляд' })).toBeInTheDocument()
    expect(within(dialog).getByRole('tab', { name: 'Матеріали' })).toBeInTheDocument()

    await fireEvent.click(within(dialog).getByRole('tab', { name: 'Матеріали' }))
    expect(await within(dialog).findByText('Breathing homework')).toBeInTheDocument()
    expect(within(dialog).getByText('Домашнє завдання')).toBeInTheDocument()
  })

  it('opens full client management modal for registered client branch', async () => {
    mockedApiGet.mockImplementation(async (url) => {
      if (url === CLIENTS_URL)
        return [
          {
            id: 1,
            client_id: 45,
            state: 'ACTIVE',
            last_session_at: null,
            upcoming_count: 0,
            client_display_name: 'Registered Compact',
          },
        ]
      if (url === CLIENT_RECORDS_URL) return []
      if (url === REMINDERS_URL) return []
      throw new Error(`Unexpected apiGet call: ${url}`)
    })
    mockedFetchSpecialistClientMaterials.mockResolvedValue([])

    const { container } = renderView()
    const registeredCard = await waitFor(() => {
      const card = container.querySelector('#client-card-45')
      expect(card).toBeInstanceOf(HTMLElement)
      return card as HTMLElement
    })

    expect(registeredCard.querySelector('.client-materials-summary')).toBeTruthy()
    await fireEvent.click(within(registeredCard).getByRole('button', { name: 'Керувати клієнтом' }))
    const dialog = await screen.findByRole('dialog', { name: 'Картка клієнта' })
    expect(within(dialog).getByText('Registered Compact')).toBeInTheDocument()
    expect(within(dialog).getByRole('tab', { name: 'Матеріали' })).toBeInTheDocument()
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
    const managementDialog = await openMaterialsManagement(manualCard)
    await fireEvent.click(within(managementDialog).getByRole('button', { name: '+ Додати матеріал' }))
    const dialog = await screen.findByRole('dialog', { name: 'Новий матеріал для клієнта' })
    await fireEvent.update(within(dialog).getByLabelText('Назва'), 'Новий матеріал')
    await fireEvent.update(within(dialog).getByLabelText('Текст'), 'Опис')
    await fireEvent.click(within(dialog).getByRole('button', { name: 'Зберегти' }))

    await waitFor(() => {
      expect(mockedCreateSpecialistClientMaterial).toHaveBeenCalledWith({
        client_record_id: 502,
        title: 'Новий матеріал',
        content: 'Опис',
        material_type: 'recommendation',
        url: null,
      })
    })
    await waitFor(() => {
      expect(screen.queryByRole('dialog', { name: 'Новий матеріал для клієнта' })).not.toBeInTheDocument()
    })
  })

  it('keeps add-material modal closed until requested and cancel resets it', async () => {
    mockedApiGet.mockImplementation(async (url) => {
      if (url === CLIENTS_URL) return []
      if (url === CLIENT_RECORDS_URL) return [manualClientRecord({ id: 508 })]
      if (url === REMINDERS_URL) return []
      throw new Error(`Unexpected apiGet call: ${url}`)
    })
    mockedFetchSpecialistClientMaterials.mockResolvedValue([
      {
        id: 920,
        client_record_id: 508,
        session_id: null,
        status: 'draft',
        material_type: 'recommendation',
        title: 'Existing advice',
        content: 'Existing content',
        content_preview: 'Existing content',
        url: null,
        published_at: null,
        revoked_at: null,
        created_at: '2026-04-30T00:00:00Z',
        updated_at: '2026-04-30T00:00:00Z',
      } as any,
    ])

    const { container } = renderView()
    const { clientsPanel } = getPanels(container)
    const manualCard = await waitFor(() => {
      const card = clientsPanel.querySelector('#manual-client-record-508')
      expect(card).toBeInstanceOf(HTMLElement)
      return card as HTMLElement
    })
    const managementDialog = await openMaterialsManagement(manualCard)

    expect(await within(managementDialog).findByText('Existing advice')).toBeInTheDocument()
    expect(within(managementDialog).getByText('Рекомендація')).toBeInTheDocument()
    expect(within(managementDialog).getByText('Чернетка')).toBeInTheDocument()
    expect(within(managementDialog).getByText('Existing content')).toBeInTheDocument()
    expect(manualCard.querySelector('.client-materials__create')).toBeFalsy()
    expect(manualCard.querySelector('.client-material')).toBeFalsy()
    expect(manualCard.querySelector('.client-material input')).toBeFalsy()

    await fireEvent.click(within(managementDialog).getByRole('button', { name: '+ Додати матеріал' }))
    const dialog = await screen.findByRole('dialog', { name: 'Новий матеріал для клієнта' })
    await fireEvent.update(within(dialog).getByLabelText('Назва'), 'Draft to cancel')
    await fireEvent.click(within(dialog).getByRole('button', { name: 'Скасувати' }))

    expect(manualCard.querySelector('.client-materials__create')).toBeFalsy()
    expect(screen.queryByRole('dialog', { name: 'Новий матеріал для клієнта' })).not.toBeInTheDocument()
    expect(within(managementDialog).getByText('Existing advice')).toBeInTheDocument()

    await fireEvent.click(within(managementDialog).getByRole('button', { name: '+ Додати матеріал' }))
    const reopenedDialog = await screen.findByRole('dialog', { name: 'Новий матеріал для клієнта' })
    expect(within(reopenedDialog).getByLabelText('Назва')).toHaveValue('')
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
    const managementDialog = await openMaterialsManagement(manualCard)
    await fireEvent.click(within(managementDialog).getByRole('button', { name: '+ Додати матеріал' }))
    const dialog = await screen.findByRole('dialog', { name: 'Новий матеріал для клієнта' })
    await fireEvent.update(within(dialog).getByLabelText('Назва'), 'Link material')
    await fireEvent.update(within(dialog).getByLabelText('Текст'), 'Link content')
    await fireEvent.update(within(dialog).getByLabelText(/URL/), 'kendo.com.ua')
    await fireEvent.click(within(dialog).getByRole('button', { name: 'Зберегти' }))

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
    const managementDialog = await openMaterialsManagement(manualCard)
    await fireEvent.click(within(managementDialog).getByRole('button', { name: '+ Додати матеріал' }))
    const dialog = await screen.findByRole('dialog', { name: 'Новий матеріал для клієнта' })
    await fireEvent.update(within(dialog).getByLabelText('Назва'), 'Link title')
    await fireEvent.change(within(dialog).getByLabelText('Тип'), { target: { value: 'link' } })
    await fireEvent.update(within(dialog).getByLabelText('Текст'), 'Link body')
    await fireEvent.click(within(dialog).getByRole('button', { name: 'Зберегти' }))

    expect(mockedCreateSpecialistClientMaterial).not.toHaveBeenCalled()
    await waitFor(() => {
      const createError = dialog.querySelector('.form-error')
      expect(createError).toBeTruthy()
      expect(createError?.textContent || '').toContain('Додайте посилання')
    })
    const listBlockError = managementDialog.querySelector('.client-management-materials > .form-error')
    expect(listBlockError).toBeFalsy()
    expect(manualCard.querySelector('.client-material input.input')).toBeFalsy()
    expect(within(managementDialog).getByText('Published')).toBeInTheDocument()
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
    const managementDialog = await openMaterialsManagement(manualCard)
    await fireEvent.click(within(managementDialog).getByRole('button', { name: '+ Додати матеріал' }))
    const dialog = await screen.findByRole('dialog', { name: 'Новий матеріал для клієнта' })
    await fireEvent.update(within(dialog).getByLabelText('Назва'), 'Link title')
    await fireEvent.change(within(dialog).getByLabelText('Тип'), { target: { value: 'link' } })
    await fireEvent.update(within(dialog).getByLabelText('Текст'), 'Link body')
    await fireEvent.update(within(dialog).getByLabelText(/URL/), 'https://')
    await fireEvent.click(within(dialog).getByRole('button', { name: 'Зберегти' }))

    await waitFor(() => {
      const createError = dialog.querySelector('.form-error')
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
    const managementDialog = await openMaterialsManagement(manualCard)
    const materials = await waitFor(() => {
      const nodes = managementDialog.querySelectorAll('.client-material')
      expect(nodes.length).toBe(2)
      return nodes
    })
    const first = materials[0] as HTMLElement
    const second = materials[1] as HTMLElement
    await fireEvent.click(within(first).getByRole('button', { name: 'Редагувати' }))
    const editDialog = await screen.findByRole('dialog', { name: 'Матеріал для клієнта' })
    await fireEvent.update(within(editDialog).getByLabelText(/URL/), 'https://')
    await fireEvent.click(within(editDialog).getByRole('button', { name: 'Зберегти' }))
    await waitFor(() => {
      expect(editDialog.querySelector('.form-error')?.textContent || '').toContain('Введіть коректне посилання')
    })
    expect(second.querySelector('.form-error')).toBeFalsy()

    await fireEvent.click(within(editDialog).getByRole('button', { name: 'Опублікувати' }))
    await waitFor(() => {
      expect(editDialog.textContent || '').toContain('publish failed')
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

    const managementDialog = await openMaterialsManagement(manualCard)
    await fireEvent.click(await within(managementDialog).findByRole('button', { name: 'Редагувати' }))
    const editDialog = await screen.findByRole('dialog', { name: 'Матеріал для клієнта' })
    await fireEvent.click(within(editDialog).getByRole('button', { name: 'Опублікувати' }))
    await waitFor(() => {
      expect(mockedPublishSpecialistClientMaterial).toHaveBeenCalledWith(900)
    })
    await fireEvent.click(await within(editDialog).findByRole('button', { name: 'Відкликати доступ' }))
    await waitFor(() => {
      expect(mockedRevokeSpecialistClientMaterial).toHaveBeenCalledWith(900)
    })
    expect(await within(managementDialog).findByText('Доступ відкликано')).toBeInTheDocument()
    expect(within(managementDialog).getByText('Клієнт більше не бачить цей матеріал.')).toBeInTheDocument()
    expect(within(managementDialog).queryByText('Відкликано')).not.toBeInTheDocument()
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

    expect(registeredCard.querySelector('.client-materials-summary')).toBeTruthy()
    expect(registeredCard.querySelector('.client-materials__note')).toBeFalsy()

    await openMaterialsManagement(registeredCard)

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

    const managementDialog = await openMaterialsManagement(registeredCard)
    await fireEvent.click(within(managementDialog).getByRole('button', { name: '+ Додати матеріал' }))

    const dialog = await screen.findByRole('dialog', { name: 'Новий матеріал для клієнта' })
    await fireEvent.update(within(dialog).getByLabelText('Назва'), 'Registered material')
    await fireEvent.update(within(dialog).getByLabelText('Текст'), 'Registered content')
    await fireEvent.click(within(dialog).getByRole('button', { name: 'Зберегти' }))

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

    const registeredDialog = await openMaterialsManagement(registeredCard)
    await fireEvent.click(within(registeredDialog).getByRole('button', { name: '+ Додати матеріал' }))
    const regDialog = await screen.findByRole('dialog', { name: 'Новий матеріал для клієнта' })

    await fireEvent.update(within(regDialog).getByLabelText('Назва'), 'Registered only title')
    await fireEvent.update(within(regDialog).getByLabelText('Текст'), 'Registered only content')
    await fireEvent.click(within(regDialog).getByRole('button', { name: 'Зберегти' }))
    await waitFor(() => {
      expect(screen.queryByRole('dialog', { name: 'Новий матеріал для клієнта' })).not.toBeInTheDocument()
    })

    await selectClientRowByName(clientsPanel, 'Manual #1')
    const manualCard = await waitFor(() => {
      const card = clientsPanel.querySelector('#manual-client-record-1')
      expect(card).toBeInstanceOf(HTMLElement)
      return card as HTMLElement
    })
    const manualDialog = await openMaterialsManagement(manualCard)
    await fireEvent.click(within(manualDialog).getByRole('button', { name: '+ Додати матеріал' }))
    const manDialog = await screen.findByRole('dialog', { name: 'Новий матеріал для клієнта' })
    expect(within(manDialog).getByLabelText('Назва')).toHaveValue('')
    expect(within(manDialog).getByLabelText('Текст')).toHaveValue('')

    await fireEvent.update(within(manDialog).getByLabelText('Назва'), 'Manual only title')
    await fireEvent.update(within(manDialog).getByLabelText('Текст'), 'Manual only content')
    await fireEvent.click(within(manDialog).getByRole('button', { name: 'Зберегти' }))

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

  it('renders attachment helper and uploads multiple selected files one by one', async () => {
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
    mockedListClientMaterialAttachments.mockResolvedValueOnce([])
    mockedListClientMaterialAttachments.mockResolvedValueOnce([
      {
        id: 3001,
        original_filename: 'exercise.pdf',
        mime_type: 'application/pdf',
        size_bytes: 245000,
        created_at: '2026-05-01T00:00:00Z',
      },
      {
        id: 3002,
        original_filename: 'instruction.txt',
        mime_type: 'text/plain',
        size_bytes: 1200,
        created_at: '2026-05-01T00:00:00Z',
      },
    ] as any)

    const { container } = renderView()
    const manualCard = await waitFor(() => {
      const card = container.querySelector('#manual-client-record-701')
      expect(card).toBeInstanceOf(HTMLElement)
      return card as HTMLElement
    })
    const managementDialog = await openMaterialsManagement(manualCard)
    expect(await within(managementDialog).findByText('M1')).toBeInTheDocument()
    expect(manualCard.querySelector('.client-material input')).toBeFalsy()
    await fireEvent.click(within(managementDialog).getByRole('button', { name: 'Редагувати' }))
    const dialog = await screen.findByRole('dialog', { name: 'Матеріал для клієнта' })
    expect(within(dialog).getByText('Прикріплені файли')).toBeInTheDocument()
    expect(within(dialog).getByText('Додайте файл, якщо хочете передати клієнту документ, вправу або інструкцію.')).toBeInTheDocument()
    expect(within(dialog).getByText('Файлів ще немає')).toBeInTheDocument()

    const fileInput = dialog.querySelector('input[type=\"file\"]') as HTMLInputElement
    expect(fileInput.multiple).toBe(true)
    const firstFile = new File(['x'], 'exercise.pdf', { type: 'application/pdf' })
    const secondFile = new File(['x'], 'instruction.txt', { type: 'text/plain' })
    await fireEvent.change(fileInput, { target: { files: [firstFile, secondFile] } })

    await waitFor(() => {
      expect(mockedUploadClientMaterialAttachment).toHaveBeenNthCalledWith(1, 991, firstFile)
      expect(mockedUploadClientMaterialAttachment).toHaveBeenNthCalledWith(2, 991, secondFile)
      expect(within(dialog).getByText('exercise.pdf')).toBeInTheDocument()
      expect(within(dialog).getByText('239 КБ')).toBeInTheDocument()
      expect(within(dialog).getByText('instruction.txt')).toBeInTheDocument()
      expect(within(dialog).getByText('1 КБ')).toBeInTheDocument()
    })
    expect(dialog.querySelectorAll('.client-material__attachments-item').length).toBe(2)
    expect(fileInput.value).toBe('')
  })

  it('keeps upload failures scoped and still uploads valid files from the same selection', async () => {
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
    const managementDialog = await openMaterialsManagement(manualCard)
    const materialCards = await waitFor(() => {
      const nodes = managementDialog.querySelectorAll('.client-material')
      expect(nodes.length).toBe(2)
      return nodes
    })
    const bigFile = new File([new Uint8Array(21 * 1024 * 1024)], 'big.pdf', { type: 'application/pdf' })
    const badExt = new File(['x'], 'bad.exe', { type: 'application/octet-stream' })
    const validFile = new File(['x'], 'valid.pdf', { type: 'application/pdf' })
    mockedUploadClientMaterialAttachment.mockResolvedValueOnce({} as any)
    mockedUploadClientMaterialAttachment.mockRejectedValueOnce({
      response: { data: { code: 'ATTACHMENT_COUNT_LIMIT_REACHED' } },
    })

    await fireEvent.click(within(materialCards[0] as HTMLElement).getByRole('button', { name: 'Додати файл' }))
    const firstDialog = await screen.findByRole('dialog', { name: 'Матеріал для клієнта' })
    const firstFile = firstDialog.querySelector('input[type=\"file\"]') as HTMLInputElement
    await fireEvent.change(firstFile, { target: { files: [bigFile, badExt, validFile] } })
    await waitFor(() => {
      expect(mockedUploadClientMaterialAttachment).toHaveBeenCalledWith(992, validFile)
      expect(firstDialog.textContent || '').toContain('Не всі файли вдалося додати:')
      expect(firstDialog.textContent || '').toContain('big.pdf: Файл завеликий. Максимальний розмір одного файлу — 20 МБ.')
      expect(firstDialog.textContent || '').toContain('bad.exe: Цей тип файлу не підтримується.')
    })
    expect(materialCards[1]! .textContent || '').not.toContain('Файл завеликий')
    expect(firstFile.value).toBe('')
    await fireEvent.click(within(firstDialog).getByRole('button', { name: 'Скасувати' }))
    await waitFor(() => {
      expect(screen.queryByRole('dialog', { name: 'Матеріал для клієнта' })).not.toBeInTheDocument()
    })

    await fireEvent.click(within(materialCards[1] as HTMLElement).getByRole('button', { name: 'Додати файл' }))
    const secondDialog = await screen.findByRole('dialog', { name: 'Матеріал для клієнта' })
    const secondFile = secondDialog.querySelector('input[type=\"file\"]') as HTMLInputElement
    await fireEvent.change(secondFile, { target: { files: [badExt, validFile] } })
    await waitFor(() => {
      expect(mockedUploadClientMaterialAttachment).toHaveBeenCalledWith(993, validFile)
      expect(secondDialog.textContent || '').toContain('Не всі файли вдалося додати:')
      expect(secondDialog.textContent || '').toContain('bad.exe: Цей тип файлу не підтримується.')
      expect(secondDialog.textContent || '').toContain('valid.pdf: До одного матеріалу можна додати не більше 10 файлів.')
    })
    expect(materialCards[0]! .textContent || '').not.toContain('До одного матеріалу можна додати не більше 10 файлів.')
    expect(secondFile.value).toBe('')
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
    const managementDialog = await openMaterialsManagement(manualCard)
    expect(await within(manualCard).findByText('1 файл')).toBeInTheDocument()
    await fireEvent.click(await within(managementDialog).findByRole('button', { name: 'Редагувати' }))
    const dialog = await screen.findByRole('dialog', { name: 'Матеріал для клієнта' })
    await fireEvent.click(await within(dialog).findByRole('button', { name: 'Видалити файл' }))
    await waitFor(() => {
      expect(mockedDeleteClientMaterialAttachment).toHaveBeenCalledWith(994, 4001)
      expect(dialog.textContent || '').toContain('Файл видалено')
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
    expect(mockedMaterializeClientRegularTimeSessions).not.toHaveBeenCalled()
    expect(mockedUpdateClientRegularTime).not.toHaveBeenCalled()
    expect(mockedPauseClientRegularTime).not.toHaveBeenCalled()
    expect(mockedResumeClientRegularTime).not.toHaveBeenCalled()
  })

  it('shows neutral regular-time helper for inactive registered client without client_record_id', async () => {
    mockedApiGet.mockImplementation(async (url) => {
      if (url === CLIENTS_URL)
        return [
          {
            id: 1,
            client_id: 44,
            client_record_id: null,
            state: 'INACTIVE',
            last_session_at: null,
            upcoming_count: 0,
            client_display_name: 'Inactive Registered',
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

    expect(registeredCard.textContent || '').toContain(
      'Регулярний час недоступний, бо клієнт не має активної робочої картки.'
    )
    expect(registeredCard.textContent || '').toContain(
      'Активуйте клієнта в розділі “Керування клієнтом”.'
    )
    const regularTimeSection = within(registeredCard)
      .getByText(/Регулярний час недоступний/)
      .closest('.client-accordion__section') as HTMLElement
    expect(within(regularTimeSection).queryByRole('button', { name: 'Активувати клієнта' })).not.toBeInTheDocument()
    expect(mockedFetchClientRegularTimes).not.toHaveBeenCalled()
  })

  it('shows activation CTA in client management for inactive registered client without client_record_id', async () => {
    mockedApiGet.mockImplementation(async (url) => {
      if (url === CLIENTS_URL)
        return [
          {
            id: 1,
            client_id: 44,
            client_record_id: null,
            state: 'INACTIVE',
            last_session_at: null,
            upcoming_count: 0,
            client_display_name: 'Inactive Registered',
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
    await openAccordionSection(registeredCard, 'Керування клієнтом')

    expect(registeredCard.textContent || '').toContain(
      'Клієнт неактивний. Активуйте клієнта, щоб додавати сесії, регулярний час, матеріали й робочі записи.'
    )
    expect(within(registeredCard).getByRole('button', { name: 'Активувати клієнта' })).toBeInTheDocument()
  })

  it('activates inactive registered client from management and enables regular time section', async () => {
    let activated = false
    mockedApiGet.mockImplementation(async (url) => {
      if (url === CLIENTS_URL)
        return [
          {
            id: 1,
            client_id: 44,
            client_record_id: activated ? 701 : null,
            state: activated ? 'ACTIVE' : 'INACTIVE',
            last_session_at: null,
            upcoming_count: 0,
            client_display_name: 'Inactive Registered',
          },
        ]
      if (url === CLIENT_RECORDS_URL) return []
      if (url === REMINDERS_URL) return []
      throw new Error(`Unexpected apiGet call: ${url}`)
    })
    mockedApiPost.mockImplementation(async (url) => {
      if (url === '/cabinet/clients/44/activate-record/') {
        activated = true
        return {
          id: 1,
          client_id: 44,
          client_record_id: 701,
          state: 'ACTIVE',
          last_session_at: null,
          upcoming_count: 0,
          client_display_name: 'Inactive Registered',
        } as any
      }
      throw new Error(`Unexpected apiPost call: ${url}`)
    })

    const { container } = renderView()
    const registeredCard = await waitFor(() => {
      const card = container.querySelector('#client-card-44')
      expect(card).toBeInstanceOf(HTMLElement)
      return card as HTMLElement
    })
    await openAccordionSection(registeredCard, 'Керування клієнтом')

    await fireEvent.click(within(registeredCard).getByRole('button', { name: 'Активувати клієнта' }))

    await waitFor(() => {
      expect(mockedApiPost).toHaveBeenCalledWith('/cabinet/clients/44/activate-record/', {})
      expect(mockToast.success).toHaveBeenCalledWith('Клієнта активовано.')
    })

    const activeCard = await waitFor(() => {
      const card = Array.from(container.querySelectorAll('#client-card-44')).find((node) =>
        (node.textContent || '').includes('Активний')
      )
      expect(card).toBeInstanceOf(HTMLElement)
      return card as HTMLElement
    })
    await openAccordionSection(activeCard, 'Регулярний час')

    await waitFor(() => {
      expect(mockedFetchClientRegularTimes).toHaveBeenCalledWith(701)
      expect(within(activeCard).getByRole('button', { name: 'Додати регулярний час' })).toBeInTheDocument()
    })
  })

  it('does not show activation CTA for active registered client', async () => {
    mockedApiGet.mockImplementation(async (url) => {
      if (url === CLIENTS_URL)
        return [
          {
            id: 1,
            client_id: 44,
            client_record_id: 701,
            state: 'ACTIVE',
            last_session_at: null,
            upcoming_count: 0,
            client_display_name: 'Active Registered',
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
    await openAccordionSection(registeredCard, 'Керування клієнтом')

    expect(within(registeredCard).queryByRole('button', { name: 'Активувати клієнта' })).not.toBeInTheDocument()
  })

  it('shows return-to-work copy for archived registered client', async () => {
    mockedApiGet.mockImplementation(async (url) => {
      if (url === CLIENTS_URL)
        return [
          {
            id: 1,
            client_id: 44,
            client_record_id: 701,
            state: 'ARCHIVED',
            last_session_at: null,
            upcoming_count: 0,
            client_display_name: 'Archived Registered',
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
    await openAccordionSection(registeredCard, 'Керування клієнтом')

    expect(within(registeredCard).getByRole('button', { name: 'Повернути в роботу' })).toBeInTheDocument()
    expect(within(registeredCard).queryByRole('button', { name: 'Відновити' })).not.toBeInTheDocument()
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

  it('uses specialist standard session duration as new regular time default', async () => {
    mockedFetchSpecialistProfile.mockResolvedValueOnce({ standard_session_duration_minutes: 75 } as any)
    mockedApiGet.mockImplementation(async (url) => {
      if (url === CLIENTS_URL) return []
      if (url === CLIENT_RECORDS_URL) return [manualClientRecord({ id: 927 })]
      if (url === REMINDERS_URL) return []
      throw new Error(`Unexpected apiGet call: ${url}`)
    })
    mockedFetchClientRegularTimes.mockResolvedValue([])

    const { container } = renderView()
    const manualCard = await waitFor(() => {
      const card = container.querySelector('#manual-client-record-927')
      expect(card).toBeInstanceOf(HTMLElement)
      return card as HTMLElement
    })
    await openAccordionSection(manualCard, 'Регулярний час')
    await fireEvent.click(await within(manualCard).findByRole('button', { name: 'Додати регулярний час' }))

    expect(within(manualCard).getByLabelText('Тривалість')).toHaveValue(75)

    await fireEvent.update(within(manualCard).getByLabelText('День тижня'), '2')
    await selectRegularTimeDate(manualCard, '2026-05-20')
    await fireEvent.click(within(manualCard).getByRole('button', { name: 'Зберегти' }))

    await waitFor(() => {
      expect(mockedCreateClientRegularTime).toHaveBeenCalledWith(
        927,
        expect.objectContaining({
          duration_minutes: 75,
        })
      )
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
    expect(await screen.findByRole('heading', { name: 'Оновити майбутні сесії?' })).toBeInTheDocument()
    await fireEvent.click(screen.getByRole('button', { name: 'Оновити майбутні сесії' }))

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
    await fireEvent.click(await within(registeredCard).findByRole('button', { name: 'Створити майбутні сесії' }))

    await waitFor(() => {
      expect(mockedMaterializeClientRegularTimeSessions).toHaveBeenCalledWith(5, 831)
      expect(mockedMaterializeClientRegularTimeSessions).not.toHaveBeenCalledWith(6, 831)
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
      expect(within(manualCard).getByRole('button', { name: 'Створити майбутні сесії' })).toBeInTheDocument()
      expect(manualCard.textContent || '').toContain('Майбутні сесії створюються автоматично на кілька тижнів наперед.')
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
      expect(within(manualCard).queryByRole('button', { name: 'Створити майбутні сесії' })).not.toBeInTheDocument()
    })
  })

  it('renders regular time edit form after first selected card and before second card', async () => {
    mockedApiGet.mockImplementation(async (url) => {
      if (url === CLIENTS_URL) return []
      if (url === CLIENT_RECORDS_URL) return [manualClientRecord({ id: 940 })]
      if (url === REMINDERS_URL) return []
      throw new Error(`Unexpected apiGet call: ${url}`)
    })
    mockedFetchClientRegularTimes.mockResolvedValue([
      regularTimeRecord({ id: 840, client_record: 940, weekday: 2, start_time: '09:00' }),
      regularTimeRecord({ id: 841, client_record: 940, weekday: 4, start_time: '11:00' }),
    ] as any)

    const { container } = renderView()
    const manualCard = await waitFor(() => {
      const card = container.querySelector('#manual-client-record-940')
      expect(card).toBeInstanceOf(HTMLElement)
      return card as HTMLElement
    })
    await openAccordionSection(manualCard, 'Регулярний час')
    const list = await waitFor(() => {
      const node = manualCard.querySelector('.client-regular-times__list')
      expect(node).toBeInstanceOf(HTMLElement)
      return node as HTMLElement
    })
    const regularTimeCards = Array.from(list.querySelectorAll('.client-regular-time')) as HTMLElement[]
    expect(regularTimeCards).toHaveLength(2)

    await fireEvent.click(within(regularTimeCards[0]!).getByRole('button', { name: 'Редагувати' }))

    const form = await waitFor(() => {
      const node = list.querySelector('.client-regular-times__form')
      expect(node).toBeInstanceOf(HTMLElement)
      return node as HTMLElement
    })
    expect(Array.from(list.children).slice(0, 3)).toEqual([regularTimeCards[0], form, regularTimeCards[1]])
  })

  it('moves regular time edit form under second card when editing another regular time', async () => {
    mockedApiGet.mockImplementation(async (url) => {
      if (url === CLIENTS_URL) return []
      if (url === CLIENT_RECORDS_URL) return [manualClientRecord({ id: 941 })]
      if (url === REMINDERS_URL) return []
      throw new Error(`Unexpected apiGet call: ${url}`)
    })
    mockedFetchClientRegularTimes.mockResolvedValue([
      regularTimeRecord({ id: 842, client_record: 941, weekday: 2, start_time: '09:00' }),
      regularTimeRecord({ id: 843, client_record: 941, weekday: 4, start_time: '11:00' }),
    ] as any)

    const { container } = renderView()
    const manualCard = await waitFor(() => {
      const card = container.querySelector('#manual-client-record-941')
      expect(card).toBeInstanceOf(HTMLElement)
      return card as HTMLElement
    })
    await openAccordionSection(manualCard, 'Регулярний час')
    const list = await waitFor(() => {
      const node = manualCard.querySelector('.client-regular-times__list')
      expect(node).toBeInstanceOf(HTMLElement)
      return node as HTMLElement
    })
    const regularTimeCards = Array.from(list.querySelectorAll('.client-regular-time')) as HTMLElement[]
    expect(regularTimeCards).toHaveLength(2)

    await fireEvent.click(within(regularTimeCards[0]!).getByRole('button', { name: 'Редагувати' }))
    await fireEvent.click(within(regularTimeCards[1]!).getByRole('button', { name: 'Редагувати' }))

    const form = await waitFor(() => {
      const nodes = list.querySelectorAll('.client-regular-times__form')
      expect(nodes).toHaveLength(1)
      return nodes[0] as HTMLElement
    })
    expect(Array.from(list.children).slice(0, 3)).toEqual([regularTimeCards[0], regularTimeCards[1], form])
  })

  it('keeps only one regular time edit form visible', async () => {
    mockedApiGet.mockImplementation(async (url) => {
      if (url === CLIENTS_URL) return []
      if (url === CLIENT_RECORDS_URL) return [manualClientRecord({ id: 942 })]
      if (url === REMINDERS_URL) return []
      throw new Error(`Unexpected apiGet call: ${url}`)
    })
    mockedFetchClientRegularTimes.mockResolvedValue([
      regularTimeRecord({ id: 844, client_record: 942, weekday: 2, start_time: '09:00' }),
      regularTimeRecord({ id: 845, client_record: 942, weekday: 4, start_time: '11:00' }),
    ] as any)

    const { container } = renderView()
    const manualCard = await waitFor(() => {
      const card = container.querySelector('#manual-client-record-942')
      expect(card).toBeInstanceOf(HTMLElement)
      return card as HTMLElement
    })
    await openAccordionSection(manualCard, 'Регулярний час')
    const list = await waitFor(() => {
      const node = manualCard.querySelector('.client-regular-times__list')
      expect(node).toBeInstanceOf(HTMLElement)
      return node as HTMLElement
    })
    const regularTimeCards = Array.from(list.querySelectorAll('.client-regular-time')) as HTMLElement[]
    expect(regularTimeCards).toHaveLength(2)

    await fireEvent.click(within(regularTimeCards[0]!).getByRole('button', { name: 'Редагувати' }))
    expect(list.querySelectorAll('.client-regular-times__form')).toHaveLength(1)

    await fireEvent.click(within(regularTimeCards[1]!).getByRole('button', { name: 'Редагувати' }))
    expect(list.querySelectorAll('.client-regular-times__form')).toHaveLength(1)
  })

  it('closes regular time edit form when cancel is clicked', async () => {
    mockedApiGet.mockImplementation(async (url) => {
      if (url === CLIENTS_URL) return []
      if (url === CLIENT_RECORDS_URL) return [manualClientRecord({ id: 943 })]
      if (url === REMINDERS_URL) return []
      throw new Error(`Unexpected apiGet call: ${url}`)
    })
    mockedFetchClientRegularTimes.mockResolvedValue([
      regularTimeRecord({ id: 846, client_record: 943 }),
      regularTimeRecord({ id: 847, client_record: 943, weekday: 4, start_time: '11:00' }),
    ] as any)

    const { container } = renderView()
    const manualCard = await waitFor(() => {
      const card = container.querySelector('#manual-client-record-943')
      expect(card).toBeInstanceOf(HTMLElement)
      return card as HTMLElement
    })
    await openAccordionSection(manualCard, 'Регулярний час')
    const list = await waitFor(() => {
      const node = manualCard.querySelector('.client-regular-times__list')
      expect(node).toBeInstanceOf(HTMLElement)
      return node as HTMLElement
    })
    const regularTimeCards = Array.from(list.querySelectorAll('.client-regular-time')) as HTMLElement[]
    await fireEvent.click(within(regularTimeCards[0]!).getByRole('button', { name: 'Редагувати' }))
    expect(list.querySelectorAll('.client-regular-times__form')).toHaveLength(1)

    await fireEvent.click(within(list).getByRole('button', { name: 'Скасувати' }))

    await waitFor(() => {
      expect(list.querySelector('.client-regular-times__form')).not.toBeInTheDocument()
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
    await fireEvent.click(await within(manualCard).findByRole('button', { name: 'Створити майбутні сесії' }))

    await waitFor(() => {
      expect(mockedMaterializeClientRegularTimeSessions).toHaveBeenCalledWith(913, 813)
      expect(mockedFetchClientRegularTimes).toHaveBeenCalledTimes(2)
      expect(mockToast.success).toHaveBeenCalledWith('Майбутні сесії створено.')
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
    mockedMaterializeClientRegularTimeSessions.mockReturnValue(createDeferred.promise as any)

    const { container } = renderView()
    const manualCard = await waitFor(() => {
      const card = container.querySelector('#manual-client-record-914')
      expect(card).toBeInstanceOf(HTMLElement)
      return card as HTMLElement
    })
    await openAccordionSection(manualCard, 'Регулярний час')
    const button = await within(manualCard).findByRole('button', { name: 'Створити майбутні сесії' })
    await fireEvent.click(button)
    await fireEvent.click(button)

    expect(mockedMaterializeClientRegularTimeSessions).toHaveBeenCalledTimes(1)
    expect(button).toBeDisabled()
    expect(button).toHaveTextContent('Створюємо...')

    createDeferred.resolve({
      regular_time_id: 814,
      horizon_weeks: 4,
      max_occurrences: 4,
      occurrences_considered: 4,
      created_count: 1,
      skipped_existing_count: 0,
      skipped_conflicts_count: 0,
      created_sessions: [{ id: 9902 }],
      skipped_existing_sessions: [],
      skipped_conflicts: [],
    })

    await waitFor(() => {
      expect(within(manualCard).getByRole('button', { name: 'Створити майбутні сесії' })).not.toBeDisabled()
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
    mockedMaterializeClientRegularTimeSessions.mockResolvedValueOnce({
      regular_time_id: 815,
      horizon_weeks: 4,
      max_occurrences: 4,
      occurrences_considered: 4,
      created_count: 0,
      skipped_existing_count: 4,
      skipped_conflicts_count: 0,
      created_sessions: [],
      skipped_existing_sessions: [{ id: 9903 }],
      skipped_conflicts: [],
    } as any)

    const { container } = renderView()
    const manualCard = await waitFor(() => {
      const card = container.querySelector('#manual-client-record-915')
      expect(card).toBeInstanceOf(HTMLElement)
      return card as HTMLElement
    })
    await openAccordionSection(manualCard, 'Регулярний час')
    await fireEvent.click(await within(manualCard).findByRole('button', { name: 'Створити майбутні сесії' }))

    await waitFor(() => {
      expect(mockToast.info).toHaveBeenCalledWith('Майбутні сесії вже створені.')
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
    mockedMaterializeClientRegularTimeSessions.mockRejectedValueOnce({
      response: { data: { code: 'SESSION_TIME_CONFLICT' } },
    })

    const { container } = renderView()
    const manualCard = await waitFor(() => {
      const card = container.querySelector('#manual-client-record-916')
      expect(card).toBeInstanceOf(HTMLElement)
      return card as HTMLElement
    })
    await openAccordionSection(manualCard, 'Регулярний час')
    await fireEvent.click(await within(manualCard).findByRole('button', { name: 'Створити майбутні сесії' }))

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
    mockedMaterializeClientRegularTimeSessions.mockRejectedValueOnce({
      response: { data: { code: 'CLIENT_REGULAR_TIME_ANCHOR_MISMATCH' } },
    })

    const { container } = renderView()
    const manualCard = await waitFor(() => {
      const card = container.querySelector('#manual-client-record-923')
      expect(card).toBeInstanceOf(HTMLElement)
      return card as HTMLElement
    })
    await openAccordionSection(manualCard, 'Регулярний час')
    await fireEvent.click(await within(manualCard).findByRole('button', { name: 'Створити майбутні сесії' }))

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
      expect(within(manualCard).getByRole('button', { name: 'Створити майбутні сесії' })).toBeDisabled()
      expect(within(regularTimeBlock as HTMLElement).getByRole('button', { name: 'Редагувати' })).toBeInTheDocument()
      expect(mockedMaterializeClientRegularTimeSessions).not.toHaveBeenCalled()
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
    mockedMaterializeClientRegularTimeSessions.mockRejectedValueOnce({
      response: { data: { code } },
    })

    const { container } = renderView()
    const manualCard = await waitFor(() => {
      const card = container.querySelector('#manual-client-record-920')
      expect(card).toBeInstanceOf(HTMLElement)
      return card as HTMLElement
    })
    await openAccordionSection(manualCard, 'Регулярний час')
    await fireEvent.click(await within(manualCard).findByRole('button', { name: 'Створити майбутні сесії' }))

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
      expect(mockToast.success).toHaveBeenCalledWith('Регулярний час додано, майбутні сесії створено.')
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
    expect(await screen.findByRole('heading', { name: 'Оновити майбутні сесії?' })).toBeInTheDocument()
    await fireEvent.click(screen.getByRole('button', { name: 'Оновити майбутні сесії' }))

    await waitFor(() => {
      expect(mockedUpdateClientRegularTime).toHaveBeenCalledWith(
        908,
        810,
        expect.objectContaining({
          duration_minutes: 60,
          starts_on: '2026-05-20',
        })
      )
      expect(mockToast.success).toHaveBeenCalledWith('Регулярний час оновлено. Майбутні сесії перенесено.')
    })
  })

  it('does not submit regular time update when user cancels future-session move confirm', async () => {
    mockedApiGet.mockImplementation(async (url) => {
      if (url === CLIENTS_URL) return []
      if (url === CLIENT_RECORDS_URL) return [manualClientRecord({ id: 929 })]
      if (url === REMINDERS_URL) return []
      throw new Error(`Unexpected apiGet call: ${url}`)
    })
    mockedFetchClientRegularTimes.mockResolvedValue([regularTimeRecord({ id: 829, client_record: 929 })] as any)

    const { container } = renderView()
    const manualCard = await waitFor(() => {
      const card = container.querySelector('#manual-client-record-929')
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

    expect(await screen.findByRole('heading', { name: 'Оновити майбутні сесії?' })).toBeInTheDocument()
    const confirmDialog = await screen.findByRole('dialog', { name: 'Оновити майбутні сесії?' })
    await fireEvent.click(within(confirmDialog).getByRole('button', { name: 'Скасувати' }))

    await waitFor(() => {
      expect(mockedUpdateClientRegularTime).not.toHaveBeenCalled()
      expect(screen.queryByRole('heading', { name: 'Оновити майбутні сесії?' })).not.toBeInTheDocument()
    })
  })

  it('shows update-conflict copy when future-session move fails', async () => {
    mockedApiGet.mockImplementation(async (url) => {
      if (url === CLIENTS_URL) return []
      if (url === CLIENT_RECORDS_URL) return [manualClientRecord({ id: 930 })]
      if (url === REMINDERS_URL) return []
      throw new Error(`Unexpected apiGet call: ${url}`)
    })
    mockedFetchClientRegularTimes.mockResolvedValue([regularTimeRecord({ id: 830, client_record: 930 })] as any)
    mockedUpdateClientRegularTime.mockRejectedValueOnce({
      response: { data: { code: 'CLIENT_REGULAR_TIME_UPDATE_CONFLICT' } },
    })

    const { container } = renderView()
    const manualCard = await waitFor(() => {
      const card = container.querySelector('#manual-client-record-930')
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
    await fireEvent.click(await screen.findByRole('button', { name: 'Оновити майбутні сесії' }))

    await waitFor(() => {
      expect(manualCard.textContent || '').toContain(
        'Не вдалося оновити майбутні сесії: новий час перетинається з іншою сесією або недоступністю.'
      )
      expect(mockedUpdateClientRegularTime).toHaveBeenCalledTimes(1)
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
      expect(mockToast.success).toHaveBeenCalledWith('Регулярний час відновлено. Майбутні сесії створено.')
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
