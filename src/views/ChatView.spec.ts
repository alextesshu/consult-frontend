import { fireEvent, render, screen, waitFor, within } from '@testing-library/vue'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import ChatView from './ChatView.vue'
import {
  archiveChatThread,
  deleteChatMessage,
  fetchChatMessages,
  fetchChatThreadDetail,
  fetchChatThreads,
  sendChatMessage,
  unarchiveChatThread,
} from '../lib/api'

const mockRoute = {
  query: {} as Record<string, string>,
}

const mockAuth = {
  me: {
    user: {
      id: 7,
      roles: ['CLIENT'],
    },
  },
}

vi.mock('vue-router', async () => {
  const actual = await vi.importActual<typeof import('vue-router')>('vue-router')

  return {
    ...actual,
    useRoute: () => mockRoute,
  }
})

vi.mock('../stores/auth', () => ({
  useAuthStore: () => mockAuth,
}))

vi.mock('../lib/api', () => ({
  fetchChatThreads: vi.fn(),
  fetchChatThreadDetail: vi.fn(),
  fetchChatMessages: vi.fn(),
  sendChatMessage: vi.fn(),
  deleteChatMessage: vi.fn(),
  archiveChatThread: vi.fn(),
  unarchiveChatThread: vi.fn(),
}))

const mockedFetchChatThreads = vi.mocked(fetchChatThreads)
const mockedFetchChatThreadDetail = vi.mocked(fetchChatThreadDetail)
const mockedFetchChatMessages = vi.mocked(fetchChatMessages)
const mockedSendChatMessage = vi.mocked(sendChatMessage)
const mockedDeleteChatMessage = vi.mocked(deleteChatMessage)
const mockedArchiveChatThread = vi.mocked(archiveChatThread)
const mockedUnarchiveChatThread = vi.mocked(unarchiveChatThread)

function buildThreads() {
  return [
    {
      id: 42,
      therapist_id: 12,
      client_id: 7,
      last_message_at: null,
      last_message_preview: 'Selected',
      unread_count: 1,
      other_user: {
        id: 12,
        role: 'THERAPIST' as const,
        display_name: 'Monkey Письменник',
        photo_url: '',
      },
    },
    {
      id: 43,
      therapist_id: 13,
      client_id: 7,
      last_message_at: null,
      last_message_preview: 'Other',
      unread_count: 0,
      other_user: {
        id: 13,
        role: 'THERAPIST' as const,
        display_name: 'Anna Editor',
        photo_url: '',
      },
    },
  ]
}

function buildMessages() {
  return [
    {
      id: 101,
      thread_id: 42,
      sender_id: 7,
      body: 'Моє повідомлення',
      created_at: '2026-03-01T10:00:00Z',
    },
    {
      id: 102,
      thread_id: 42,
      sender_id: 12,
      body: 'Чуже повідомлення',
      created_at: '2026-03-01T10:05:00Z',
    },
  ]
}

function renderView() {
  return render(ChatView, {
    global: {
      stubs: {
        RouterLink: {
          props: ['to'],
          template: '<a href="#" :data-to="typeof to === \'string\' ? to : JSON.stringify(to)"><slot /></a>',
        },
      },
    },
  })
}

describe('ChatView', () => {
  beforeEach(() => {
    mockRoute.query = {}
    mockAuth.me.user.roles = ['CLIENT']
    mockedFetchChatThreads.mockReset()
    mockedFetchChatThreadDetail.mockReset()
    mockedFetchChatMessages.mockReset()
    mockedSendChatMessage.mockReset()
    mockedDeleteChatMessage.mockReset()
    mockedArchiveChatThread.mockReset()
    mockedUnarchiveChatThread.mockReset()
    mockedFetchChatThreads.mockResolvedValue(buildThreads())
    mockedFetchChatThreadDetail.mockImplementation(async (threadId) => {
      const base = buildThreads().find((thread) => thread.id === threadId)
      if (!base) throw new Error('not found')
      return {
        ...base,
        header_context: {
          counterpart: {
            type: 'client',
            id: 123,
            client_id: 123,
            display_name: 'Client A',
            avatar_url: null,
            profile_target: {
              route_name: 'client-detail',
              params: { clientId: 123 },
            },
            sessions_target: {
              route_name: 'client-sessions',
              params: { clientId: 123 },
            },
          },
          relevant_session: {
            id: 456,
            status: 'scheduled',
            starts_at: '2026-04-20T15:00:00Z',
            label: 'Nearest upcoming session',
          },
        },
      }
    })
    mockedFetchChatMessages.mockResolvedValue(buildMessages())
    mockedDeleteChatMessage.mockResolvedValue()
    mockedArchiveChatThread.mockResolvedValue()
    mockedUnarchiveChatThread.mockResolvedValue()
  })

  it('preselects the chat thread requested by therapist id from route query', async () => {
    mockRoute.query = { therapist_id: '12' }

    const { container } = renderView()

    await waitFor(() => {
      expect(mockedFetchChatMessages).toHaveBeenCalledWith(42, { limit: 50 })
    })
    expect(mockedFetchChatThreadDetail).toHaveBeenCalledWith(42)

    const activeThread = container.querySelector('.thread-item--active')
    expect(activeThread).toBeTruthy()
    expect(activeThread?.textContent).toContain('Monkey Письменник')
  })

  it('renders canonical header context and context CTAs', async () => {
    mockAuth.me.user.roles = ['SPECIALIST']
    renderView()

    expect(await screen.findByText('Client A')).toBeInTheDocument()
    expect(screen.getByText(/Найближча сесія:/)).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Відкрити клієнта' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Відкрити сесії' })).toBeInTheDocument()
  })

  it('shows delete action only for own messages', async () => {
    renderView()

    await screen.findByText('Моє повідомлення')
    expect(screen.getByLabelText('Видалити повідомлення 101')).toBeInTheDocument()
    expect(screen.queryByLabelText('Видалити повідомлення 102')).not.toBeInTheDocument()
  })

  it('renders deleted message placeholder after delete success', async () => {
    renderView()

    await screen.findByText('Моє повідомлення')
    await fireEvent.click(screen.getByLabelText('Видалити повідомлення 101'))

    expect(await screen.findByText('Видалити повідомлення?')).toBeInTheDocument()
    await fireEvent.click(screen.getByRole('button', { name: 'Видалити' }))

    await waitFor(() => {
      expect(mockedDeleteChatMessage).toHaveBeenCalledWith(101)
    })
    expect(screen.getByText('Повідомлення видалено')).toBeInTheDocument()
    expect(screen.queryByText('Моє повідомлення')).not.toBeInTheDocument()
  })

  it('archives thread and removes it from active list', async () => {
    const { container } = renderView()

    await screen.findByText('Monkey Письменник')
    await fireEvent.click(screen.getByLabelText('Дії чату Monkey Письменник'))
    await fireEvent.click(screen.getByRole('menuitem', { name: 'Архівувати чат' }))
    await fireEvent.click(await screen.findByRole('button', { name: 'Архівувати' }))

    await waitFor(() => {
      expect(mockedArchiveChatThread).toHaveBeenCalledWith(42)
    })

    const threadsPane = container.querySelector('.chat__threads')
    expect(threadsPane).toBeTruthy()
    expect(within(threadsPane as HTMLElement).queryByText('Monkey Письменник')).not.toBeInTheDocument()
    expect(within(threadsPane as HTMLElement).getByText('Anna Editor')).toBeInTheDocument()
  })

  it('unarchives thread from archived tab and returns it to active list', async () => {
    const { container } = renderView()

    await screen.findByText('Monkey Письменник')
    await fireEvent.click(screen.getByLabelText('Дії чату Monkey Письменник'))
    await fireEvent.click(screen.getByRole('menuitem', { name: 'Архівувати чат' }))
    await fireEvent.click(await screen.findByRole('button', { name: 'Архівувати' }))

    const archivedTab = await screen.findByRole('tab', { name: 'Архів' })
    await fireEvent.click(archivedTab)

    const threadsPane = container.querySelector('.chat__threads')
    expect(threadsPane).toBeTruthy()
    expect(within(threadsPane as HTMLElement).getByText('Monkey Письменник')).toBeInTheDocument()

    await fireEvent.click(within(threadsPane as HTMLElement).getByLabelText('Дії чату Monkey Письменник'))
    await fireEvent.click(screen.getByRole('menuitem', { name: 'Розархівувати чат' }))
    await fireEvent.click(await screen.findByRole('button', { name: 'Розархівувати' }))

    await waitFor(() => {
      expect(mockedUnarchiveChatThread).toHaveBeenCalledWith(42)
    })

    expect(within(threadsPane as HTMLElement).queryByText('Monkey Письменник')).not.toBeInTheDocument()

    const activeTab = screen.getByRole('tab', { name: 'Активні' })
    await fireEvent.click(activeTab)
    expect(within(threadsPane as HTMLElement).getByText('Monkey Письменник')).toBeInTheDocument()
  })
})
