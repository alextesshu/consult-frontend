import { fireEvent, render, screen, waitFor } from '@testing-library/vue'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import SpecialistInquiriesView from './SpecialistInquiriesView.vue'
import {
  fetchInquiryMessages,
  fetchInquiryThreads,
  sendInquiryMessage,
  type InquiryThread,
} from '../lib/api'

const mockRoute = {
  query: {} as Record<string, string>,
}

const mockAuth = {
  me: {
    user: {
      id: 12,
      roles: ['SPECIALIST'],
    },
  },
}

vi.mock('../stores/auth', () => ({
  useAuthStore: () => mockAuth,
}))

vi.mock('vue-router', async () => {
  const actual = await vi.importActual<typeof import('vue-router')>('vue-router')

  return {
    ...actual,
    useRoute: () => mockRoute,
  }
})

vi.mock('../lib/api', () => ({
  fetchInquiryThreads: vi.fn(),
  fetchInquiryMessages: vi.fn(),
  sendInquiryMessage: vi.fn(),
}))

const mockedFetchInquiryThreads = vi.mocked(fetchInquiryThreads)
const mockedFetchInquiryMessages = vi.mocked(fetchInquiryMessages)
const mockedSendInquiryMessage = vi.mocked(sendInquiryMessage)

function renderView() {
  return render(SpecialistInquiriesView, {
    global: {
      stubs: {
        RouterLink: {
          props: ['to'],
          template: '<a :href="to"><slot /></a>',
        },
      },
    },
  })
}

function buildThread(
  overrides: Partial<Omit<InquiryThread, 'other_user'>> & {
    other_user?: Partial<InquiryThread['other_user']>
  } = {}
): InquiryThread {
  const base: InquiryThread = {
    id: 91,
    specialist_id: 12,
    client_id: 7,
    created_at: '2026-03-11T10:00:00Z',
    last_message_at: '2026-03-11T10:00:00Z',
    inquiry_status: 'OPEN',
    closed_reason: null,
    other_user: {
      id: 7,
      role: 'CLIENT',
      display_name: 'Олена',
      photo_url: '',
    },
    last_message_preview: 'Чи можна уточнити формат?',
    unread_count: 0,
    can_client_send: false,
    client_send_reason_code: 'FOLLOW_UP_REQUIRES_SPECIALIST_REPLY',
    can_specialist_reply: true,
    specialist_reply_reason_code: null,
  }

  return {
    ...base,
    ...overrides,
    other_user: {
      ...base.other_user,
      ...overrides.other_user,
    },
  }
}

describe('SpecialistInquiriesView', () => {
  beforeEach(() => {
    mockRoute.query = {}
    mockedFetchInquiryThreads.mockReset()
    mockedFetchInquiryMessages.mockReset()
    mockedSendInquiryMessage.mockReset()
    mockedFetchInquiryMessages.mockResolvedValue([])
  })

  it('shows an intentional avatar fallback and no image when avatar is missing', async () => {
    mockedFetchInquiryThreads.mockResolvedValue([
      buildThread({
        other_user: {
          display_name: 'Олена',
          photo_url: null,
        },
      }),
    ])

    const { container } = renderView()

    expect(await screen.findByText('Олена')).toBeInTheDocument()
    expect(container.querySelector('.thread-item__avatar img')).toBeNull()
    expect(container.querySelector('.thread-item__avatar-fallback')?.textContent).toContain('ОЛ')
  })

  it('replaces an unavailable avatar image with fallback initials', async () => {
    mockedFetchInquiryThreads.mockResolvedValue([
      buildThread({
        other_user: {
          display_name: 'Олена',
          photo_url: 'https://example.test/missing-avatar.jpg',
        },
      }),
    ])

    const { container } = renderView()

    expect(await screen.findByText('Олена')).toBeInTheDocument()
    const avatarImage = container.querySelector('.thread-item__avatar img')
    expect(avatarImage).toHaveAttribute('src', 'https://example.test/missing-avatar.jpg')

    await fireEvent.error(avatarImage as Element)

    expect(container.querySelector('.thread-item__avatar img')).toBeNull()
    expect(container.querySelector('.thread-item__avatar-fallback')?.textContent).toContain('ОЛ')
  })

  it('shows client-card CTA for active client state when a stable client id exists', async () => {
    mockedFetchInquiryThreads.mockResolvedValue([
      buildThread({
        client_id: 77,
        inquiry_status: 'ACTIVE_CLIENT',
        can_specialist_reply: false,
        specialist_reply_reason_code: 'ACTIVE_CLIENT_USE_CHAT',
      }),
    ])

    renderView()

    expect(await screen.findByText('Повний чат уже доступний')).toBeInTheDocument()
    const clientCardLink = screen.getByRole('link', { name: 'Відкрити картку клієнта' })
    expect(clientCardLink).toHaveAttribute('href', '/cabinet/clients?client=77&autoOpen=1')
  })

  it('hides client-card CTA when the payload has no stable registered client id', async () => {
    mockedFetchInquiryThreads.mockResolvedValue([
      buildThread({
        client_id: null,
        client_record_id: 501,
        inquiry_status: 'ACTIVE_CLIENT',
        can_specialist_reply: false,
        specialist_reply_reason_code: 'ACTIVE_CLIENT_USE_CHAT',
      }),
    ])

    renderView()

    expect(await screen.findByText('Повний чат уже доступний')).toBeInTheDocument()
    expect(screen.queryByRole('link', { name: 'Відкрити картку клієнта' })).not.toBeInTheDocument()
  })

  it('opens a selected inquiry and only shows reply action when backend allows it', async () => {
    mockedFetchInquiryThreads.mockResolvedValue([
      {
        id: 91,
        specialist_id: 12,
        client_id: 7,
        created_at: '2026-03-11T10:00:00Z',
        last_message_at: '2026-03-11T10:00:00Z',
        inquiry_status: 'OPEN',
        closed_reason: null,
        other_user: {
          id: 7,
          role: 'CLIENT',
          display_name: 'Ірина',
          photo_url: '',
        },
        last_message_preview: 'Чи можна уточнити формат?',
        unread_count: 0,
        can_client_send: false,
        client_send_reason_code: 'FOLLOW_UP_REQUIRES_SPECIALIST_REPLY',
        can_specialist_reply: true,
        specialist_reply_reason_code: null,
      },
      {
        id: 92,
        specialist_id: 12,
        client_id: 8,
        created_at: '2026-03-11T10:00:00Z',
        last_message_at: '2026-03-11T11:00:00Z',
        inquiry_status: 'CLOSED',
        closed_reason: 'LIMIT_REACHED',
        other_user: {
          id: 8,
          role: 'CLIENT',
          display_name: 'Марина',
          photo_url: '',
        },
        last_message_preview: 'Дякую, все зрозуміло.',
        unread_count: 0,
        can_client_send: false,
        client_send_reason_code: 'THREAD_CLOSED',
        can_specialist_reply: false,
        specialist_reply_reason_code: 'THREAD_CLOSED',
      },
    ])
    mockedFetchInquiryMessages.mockImplementation(async (threadId) => {
      if (threadId === 91) {
        return [
          {
            id: 301,
            thread_id: 91,
            sender_id: 7,
            body: 'Чи можна уточнити формат?',
            created_at: '2026-03-11T10:00:00Z',
          },
        ]
      }

      return [
        {
          id: 302,
          thread_id: 92,
          sender_id: 8,
          body: 'Дякую, все зрозуміло.',
          created_at: '2026-03-11T11:00:00Z',
        },
      ]
    })
    mockedSendInquiryMessage.mockResolvedValue({
      id: 401,
      thread_id: 91,
      sender_id: 12,
      body: 'Так, коротко поясню.',
      created_at: '2026-03-11T10:05:00Z',
    })

    renderView()

    expect(await screen.findByText('Ірина')).toBeInTheDocument()
    expect(await screen.findByText('Деталі запиту')).toBeInTheDocument()

    await fireEvent.update(screen.getByLabelText('Коротка відповідь'), 'Так, коротко поясню.')
    await fireEvent.click(screen.getByRole('button', { name: 'Надіслати відповідь' }))

    expect(mockedSendInquiryMessage).toHaveBeenCalledWith(91, 'Так, коротко поясню.')

    await fireEvent.click(screen.getByRole('button', { name: /Марина/ }))

    await waitFor(() => {
      expect(mockedFetchInquiryMessages).toHaveBeenCalledWith(92, { limit: 50 })
    })

    expect(await screen.findByText('Запит завершено')).toBeInTheDocument()
    expect(
      screen.getByText(
        'Цей запит перед сесією вже завершено. Якщо співпраця почнеться, подальше спілкування продовжиться у звичайному чаті.'
      )
    ).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Надіслати відповідь' })).not.toBeInTheDocument()
  })

  it('preselects the thread from the route query when present', async () => {
    mockRoute.query = {
      thread_id: '92',
    }
    mockedFetchInquiryThreads.mockResolvedValue([
      {
        id: 91,
        specialist_id: 12,
        client_id: 7,
        created_at: '2026-03-11T10:00:00Z',
        last_message_at: '2026-03-11T10:00:00Z',
        inquiry_status: 'OPEN',
        closed_reason: null,
        other_user: {
          id: 7,
          role: 'CLIENT',
          display_name: 'Ірина',
          photo_url: '',
        },
        last_message_preview: 'Чи можна уточнити формат?',
        unread_count: 0,
        can_client_send: false,
        client_send_reason_code: 'FOLLOW_UP_REQUIRES_SPECIALIST_REPLY',
        can_specialist_reply: true,
        specialist_reply_reason_code: null,
      },
      {
        id: 92,
        specialist_id: 12,
        client_id: 8,
        created_at: '2026-03-11T10:00:00Z',
        last_message_at: '2026-03-11T11:00:00Z',
        inquiry_status: 'OPEN',
        closed_reason: null,
        other_user: {
          id: 8,
          role: 'CLIENT',
          display_name: 'Марина',
          photo_url: '',
        },
        last_message_preview: 'Маю ще одне уточнення.',
        unread_count: 1,
        can_client_send: false,
        client_send_reason_code: 'FOLLOW_UP_REQUIRES_SPECIALIST_REPLY',
        can_specialist_reply: true,
        specialist_reply_reason_code: null,
      },
    ])
    mockedFetchInquiryMessages.mockImplementation(async (threadId) => {
      if (threadId === 92) {
        return [
          {
            id: 302,
            thread_id: 92,
            sender_id: 8,
            body: 'Маю ще одне уточнення.',
            created_at: '2026-03-11T11:00:00Z',
          },
        ]
      }
      return []
    })

    renderView()

    await waitFor(() => {
      expect(mockedFetchInquiryMessages).toHaveBeenCalledWith(92, { limit: 50 })
    })

    expect(await screen.findByText('Марина')).toBeInTheDocument()
    expect(screen.getAllByText('Маю ще одне уточнення.').length).toBeGreaterThan(0)
  })
})
