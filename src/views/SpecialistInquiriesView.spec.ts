import { fireEvent, render, screen, waitFor } from '@testing-library/vue'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { nextTick, reactive } from 'vue'
import { applyUiVersion } from '../lib/uiVersion'
import SpecialistInquiriesView from './SpecialistInquiriesView.vue'
import {
  fetchInquiryMessages,
  fetchInquiryThreads,
  sendInquiryMessage,
  type InquiryThread,
} from '../lib/api'

const mockRoute = reactive({
  query: {} as Record<string, string>,
})
const mockRouter = { push: vi.fn() }

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
    useRouter: () => mockRouter,
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

function deferred<T>() {
  let resolve!: (value: T) => void
  let reject!: (error: unknown) => void
  const promise = new Promise<T>((accept, fail) => { resolve = accept; reject = fail })
  return { promise, resolve, reject }
}

function message(threadId: number, body: string) {
  return { id: threadId * 10, thread_id: threadId, sender_id: 7, body, created_at: '2026-03-11T10:00:00Z' }
}

describe('SpecialistInquiriesView v2 and reliability', () => {
  beforeEach(() => {
    applyUiVersion('v2')
    mockRoute.query = { ui: 'v2' }
    mockRouter.push.mockReset()
    mockedFetchInquiryThreads.mockReset()
    mockedFetchInquiryMessages.mockReset()
    mockedSendInquiryMessage.mockReset()
    mockedFetchInquiryMessages.mockResolvedValue([])
    mockedFetchInquiryThreads.mockResolvedValue([buildThread(), buildThread({ id: 92, client_id: 8, other_user: { display_name: 'Інший клієнт' } })])
  })
  afterEach(() => { vi.unstubAllGlobals(); applyUiVersion('v1') })

  it('groups real states, uses existing preview, and does not expose prototype-only contracts', async () => {
    mockedFetchInquiryThreads.mockResolvedValue([
      buildThread({ last_message_preview: 'Остання відповідь, не перше питання' }),
      buildThread({ id: 92, can_specialist_reply: false, specialist_reply_reason_code: 'WAIT_FOR_CLIENT_MESSAGE' }),
      ...(['CLOSED', 'ACTIVE_CLIENT', 'BLOCKED', 'ARCHIVED'] as const).map((status, index) => buildThread({ id: 93 + index, inquiry_status: status, can_specialist_reply: false })),
    ])
    const { container } = renderView()
    expect(await screen.findByRole('tab', { name: 'Чекають відповіді 1' })).toHaveAttribute('aria-selected', 'true')
    expect(screen.getByRole('tab', { name: 'Чекають клієнта 1' })).toBeInTheDocument()
    expect(screen.getByRole('tab', { name: 'Завершені 4' })).toBeInTheDocument()
    expect(screen.getByText('Остання відповідь, не перше питання')).toBeInTheDocument()
    const field = await screen.findByLabelText('Коротка відповідь')
    expect(field).not.toHaveAttribute('maxlength')
    await fireEvent.update(field, 'x'.repeat(601))
    expect(field).toHaveValue('x'.repeat(601))
    expect(container.textContent).not.toMatch(/600|отримає.*email|Запропонувати сесію|Спам|Порадити іншого/)
    await fireEvent.click(screen.getByRole('tab', { name: 'Завершені 4' }))
    expect(screen.queryByLabelText('Коротка відповідь')).toBeNull()
  })

  it('starts compact mode at the list and reconciles unread only after successful message loading', async () => {
    vi.stubGlobal('matchMedia', vi.fn((query: string) => ({ matches: query.includes('1023px'), addEventListener: vi.fn(), removeEventListener: vi.fn() })))
    mockedFetchInquiryThreads.mockResolvedValue([buildThread({ unread_count: 2 })])
    const pending = deferred<ReturnType<typeof message>[]>()
    mockedFetchInquiryMessages.mockReturnValue(pending.promise)
    const { container } = renderView()
    await screen.findByText('Непрочитаних: 2')
    expect(mockedFetchInquiryMessages).not.toHaveBeenCalled()
    await fireEvent.click(container.querySelector('#inquiry-thread-91')!)
    expect(container.querySelector('.pc2-inquiries')).toHaveClass('is-thread-open')
    expect(mockRouter.push).toHaveBeenCalledWith({ query: { ui: 'v2', thread_id: '91' } })
    expect(screen.getByText('Завантажуємо повідомлення…')).toBeInTheDocument()
    pending.resolve([message(91, 'Read after API success')])
    await screen.findByText('Read after API success')
    expect(screen.queryByText('Непрочитаних: 2')).toBeNull()
    await fireEvent.click(screen.getByRole('button', { name: 'Назад до запитів' }))
    expect(container.querySelector('.pc2-inquiries')).not.toHaveClass('is-thread-open')
    expect(document.activeElement).toHaveAttribute('id', 'inquiry-thread-91')
  })

  it('does not let an obsolete message response replace the newly selected thread', async () => {
    const old = deferred<ReturnType<typeof message>[]>()
    mockedFetchInquiryMessages.mockImplementation(id => id === 91 ? old.promise : Promise.resolve([message(92, 'Current thread text')]))
    const { container } = renderView()
    await waitFor(() => expect(mockedFetchInquiryMessages).toHaveBeenCalledWith(91, { limit: 50 }))
    await fireEvent.click(container.querySelector('#inquiry-thread-92')!)
    await screen.findByText('Current thread text')
    old.resolve([message(91, 'Obsolete private text')])
    await nextTick(); await nextTick()
    expect(screen.queryByText('Obsolete private text')).toBeNull()
    expect(screen.getByText('Current thread text')).toBeInTheDocument()
  })

  it('preserves unread on failure and provides a real message retry', async () => {
    mockedFetchInquiryThreads.mockResolvedValue([buildThread({ unread_count: 3 })])
    mockedFetchInquiryMessages.mockRejectedValueOnce(new Error('Read unavailable')).mockResolvedValueOnce([message(91, 'Retried message')])
    renderView()
    await screen.findByRole('alert')
    expect(screen.getByText('Непрочитаних: 3')).toBeInTheDocument()
    await fireEvent.click(screen.getByRole('button', { name: 'Спробувати ще раз' }))
    await screen.findByText('Retried message')
    expect(screen.queryByText('Непрочитаних: 3')).toBeNull()
  })

  it('guards repeated submit and preserves another thread draft while the first send completes', async () => {
    const pending = deferred<ReturnType<typeof message>>()
    mockedSendInquiryMessage.mockReturnValue(pending.promise)
    const { container } = renderView()
    const field = await screen.findByLabelText('Коротка відповідь')
    await fireEvent.update(field, 'Reply for A')
    await fireEvent.submit(container.querySelector('form')!)
    await fireEvent.submit(container.querySelector('form')!)
    expect(mockedSendInquiryMessage).toHaveBeenCalledTimes(1)
    expect(mockedSendInquiryMessage).toHaveBeenCalledWith(91, 'Reply for A')
    expect(field).toBeDisabled()
    await fireEvent.click(container.querySelector('#inquiry-thread-92')!)
    const otherField = screen.getByLabelText('Коротка відповідь')
    expect(otherField).not.toBeDisabled()
    await fireEvent.update(otherField, 'Private draft for B')
    mockedFetchInquiryThreads.mockResolvedValue([buildThread({ can_specialist_reply: false, specialist_reply_reason_code: 'WAIT_FOR_CLIENT_MESSAGE' }), buildThread({ id: 92, other_user: { display_name: 'Інший клієнт' } })])
    pending.resolve(message(91, 'Reply for A'))
    await waitFor(() => expect(screen.getByRole('button', { name: 'Надіслати відповідь' })).not.toBeDisabled())
    expect(screen.getByLabelText('Коротка відповідь')).toHaveValue('Private draft for B')
    expect(mockedFetchInquiryMessages.mock.calls.filter(([id]) => id === 92)).toHaveLength(1)
    expect(screen.getByRole('tab', { name: 'Чекають клієнта 1' })).toBeInTheDocument()
  })

  it('keeps errors with their source thread and prioritizes inquiry reason_code over guest code', async () => {
    const pending = deferred<ReturnType<typeof message>>()
    mockedSendInquiryMessage.mockReturnValue(pending.promise)
    const { container } = renderView()
    await fireEvent.update(await screen.findByLabelText('Коротка відповідь'), 'Reply retained on failure')
    await fireEvent.submit(container.querySelector('form')!)
    await fireEvent.click(container.querySelector('#inquiry-thread-92')!)
    pending.reject({ response: { data: { reason_code: 'WAIT_FOR_CLIENT_MESSAGE', code: 'CLIENT_RECORD_SELECTION_STALE' } } })
    await waitFor(() => expect(screen.getByRole('button', { name: 'Надіслати відповідь' })).toBeDisabled())
    expect(container.textContent).not.toContain('Ви вже відповіли на останнє повідомлення')
    await fireEvent.click(container.querySelector('#inquiry-thread-91')!)
    expect(await screen.findByRole('alert')).toHaveTextContent('Ви вже відповіли на останнє повідомлення')
    expect(screen.getByLabelText('Коротка відповідь')).toHaveValue('Reply retained on failure')
    expect(container.textContent).not.toContain('CLIENT_RECORD_SELECTION_STALE')
  })

  it('uses the returned CLOSED state after sending instead of inventing a waiting state', async () => {
    mockedSendInquiryMessage.mockResolvedValue(message(91, 'Last allowed reply'))
    const { container } = renderView()
    await fireEvent.update(await screen.findByLabelText('Коротка відповідь'), 'Last allowed reply')
    mockedFetchInquiryThreads.mockResolvedValue([buildThread({ inquiry_status: 'CLOSED', can_specialist_reply: false, specialist_reply_reason_code: 'THREAD_CLOSED' })])
    await fireEvent.submit(container.querySelector('form')!)
    expect(await screen.findByRole('tab', { name: 'Завершені 1' })).toBeInTheDocument()
    await waitFor(() => expect(screen.queryByLabelText('Коротка відповідь')).toBeNull())
    expect(screen.getByRole('tab', { name: 'Чекають клієнта 0' })).toBeInTheDocument()
  })

  it('distinguishes list failure from empty and retries without a fake success', async () => {
    mockedFetchInquiryThreads.mockRejectedValueOnce(new Error('List unavailable')).mockResolvedValue([])
    renderView()
    await screen.findByRole('alert')
    expect(screen.queryByText('Немає запитів, що чекають вашої відповіді.')).toBeNull()
    await fireEvent.click(screen.getByRole('button', { name: 'Спробувати ще раз' }))
    await screen.findByText('Немає запитів, що чекають вашої відповіді.')
  })

  it('supports arrow-key filters and restores selected query navigation without duplicate fetches', async () => {
    renderView()
    await screen.findByLabelText('Коротка відповідь')
    const tab = screen.getByRole('tab', { name: 'Чекають відповіді 2' })
    await fireEvent.keyDown(tab, { key: 'ArrowRight' })
    expect(screen.getByRole('tab', { name: 'Чекають клієнта 0' })).toHaveFocus()
    mockRoute.query = { ui: 'v2', thread_id: '92' }
    await waitFor(() => expect(mockedFetchInquiryMessages).toHaveBeenCalledWith(92, { limit: 50 }))
    expect(screen.getByRole('tab', { name: 'Чекають відповіді 2' })).toHaveAttribute('aria-selected', 'true')
  })

  it('ignores send completion after unmount and removes both media listeners', async () => {
    const remove = vi.fn()
    vi.stubGlobal('matchMedia', vi.fn(() => ({ matches: false, addEventListener: vi.fn(), removeEventListener: remove })))
    const pending = deferred<ReturnType<typeof message>>()
    mockedSendInquiryMessage.mockReturnValue(pending.promise)
    const view = renderView()
    await fireEvent.update(await screen.findByLabelText('Коротка відповідь'), 'Pending at unmount')
    await fireEvent.submit(view.container.querySelector('form')!)
    view.unmount()
    pending.resolve(message(91, 'Done'))
    await nextTick(); await nextTick()
    expect(mockedFetchInquiryThreads).toHaveBeenCalledTimes(1)
    expect(remove).toHaveBeenCalledTimes(2)
  })

  it('marks only a settled empty filter for compact content sizing', async () => {
    vi.stubGlobal('matchMedia', vi.fn((query: string) => ({ matches: query.includes('1023px'), addEventListener: vi.fn(), removeEventListener: vi.fn() })))
    const pending = deferred<ReturnType<typeof buildThread>[]>()
    mockedFetchInquiryThreads.mockReturnValue(pending.promise)
    const { container } = renderView()
    await screen.findByText('Завантажуємо запити…')
    expect(container.querySelector('.pc2-inquiries')).not.toHaveClass('is-list-empty')
    pending.resolve([buildThread()])
    await screen.findByRole('tab', { name: 'Чекають відповіді 1' })
    expect(container.querySelector('.pc2-inquiries')).not.toHaveClass('is-list-empty')
    await fireEvent.click(screen.getByRole('tab', { name: 'Завершені 0' }))
    expect(container.querySelector('.pc2-inquiries')).toHaveClass('is-list-empty')
    await fireEvent.click(screen.getByRole('tab', { name: 'Чекають відповіді 1' }))
    expect(container.querySelector('.pc2-inquiries')).not.toHaveClass('is-list-empty')
  })

  it.each(['removed', 'forbidden'])('returns compact mode to the list when refreshed selection is %s', async outcome => {
    vi.stubGlobal('matchMedia', vi.fn((query: string) => ({ matches: query.includes('1023px'), addEventListener: vi.fn(), removeEventListener: vi.fn() })))
    mockedSendInquiryMessage.mockResolvedValue(message(91, 'Accepted reply'))
    const { container } = renderView()
    await waitFor(() => expect(container.querySelector('#inquiry-thread-91')).not.toBeNull())
    await fireEvent.click(container.querySelector('#inquiry-thread-91')!)
    await fireEvent.update(await screen.findByLabelText('Коротка відповідь'), 'Accepted reply')
    if (outcome === 'removed') mockedFetchInquiryThreads.mockResolvedValue([buildThread({ id: 92, other_user: { display_name: 'Інший клієнт' } })])
    else mockedFetchInquiryThreads.mockRejectedValue({ response: { status: 403, data: { reason_code: 'ACCESS_DENIED' } } })
    await fireEvent.submit(container.querySelector('form')!)
    await waitFor(() => expect(container.querySelector('.pc2-inquiries')).not.toHaveClass('is-thread-open'))
    expect(container.querySelector('.pc2-inquiries__message')).toBeNull()
    if (outcome === 'removed') expect(container.querySelector('#inquiry-thread-92')).not.toBeNull()
    else expect(screen.getByRole('alert')).toHaveTextContent('Цей запит недоступний')
  })
})

describe('SpecialistInquiriesView', () => {
  beforeEach(() => {
    applyUiVersion('v1')
    mockRouter.push.mockReset()
    mockRoute.query = {}
    mockedFetchInquiryThreads.mockReset()
    mockedFetchInquiryMessages.mockReset()
    mockedSendInquiryMessage.mockReset()
    mockedFetchInquiryMessages.mockResolvedValue([])
  })

  afterEach(() => { vi.unstubAllGlobals(); applyUiVersion('v1') })

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
