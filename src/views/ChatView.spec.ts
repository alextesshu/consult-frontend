import { render, waitFor } from '@testing-library/vue'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import ChatView from './ChatView.vue'
import { fetchChatMessages, fetchChatThreads, sendChatMessage } from '../lib/api'

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
  fetchChatMessages: vi.fn(),
  sendChatMessage: vi.fn(),
}))

const mockedFetchChatThreads = vi.mocked(fetchChatThreads)
const mockedFetchChatMessages = vi.mocked(fetchChatMessages)
const mockedSendChatMessage = vi.mocked(sendChatMessage)

describe('ChatView', () => {
  beforeEach(() => {
    mockRoute.query = {}
    mockedFetchChatThreads.mockReset()
    mockedFetchChatMessages.mockReset()
    mockedSendChatMessage.mockReset()
  })

  it('preselects the chat thread requested by therapist id from route query', async () => {
    mockRoute.query = { therapist_id: '12' }
    mockedFetchChatThreads.mockResolvedValue([
      {
        id: 41,
        therapist_id: 5,
        client_id: 7,
        last_message_at: null,
        last_message_preview: 'Other',
        unread_count: 0,
        other_user: {
          id: 5,
          role: 'THERAPIST',
          display_name: 'Інший спеціаліст',
          photo_url: '',
        },
      },
      {
        id: 42,
        therapist_id: 12,
        client_id: 7,
        last_message_at: null,
        last_message_preview: 'Selected',
        unread_count: 1,
        other_user: {
          id: 12,
          role: 'THERAPIST',
          display_name: 'Потрібний спеціаліст',
          photo_url: '',
        },
      },
    ])
    mockedFetchChatMessages.mockResolvedValue([
      {
        id: 300,
        thread_id: 42,
        sender_id: 12,
        body: 'Привіт',
        created_at: '2026-03-01T10:00:00Z',
      },
    ])

    const { container } = render(ChatView, {
      global: {
        stubs: {
          RouterLink: {
            props: ['to'],
            template: '<a><slot /></a>',
          },
        },
      },
    })

    await waitFor(() => {
      expect(mockedFetchChatMessages).toHaveBeenCalledWith(42, { limit: 50 })
    })

    const activeThread = container.querySelector('.thread-item--active')
    expect(activeThread).toBeTruthy()
    expect(activeThread?.textContent).toContain('Потрібний спеціаліст')
  })
})
