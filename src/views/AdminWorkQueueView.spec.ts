import { fireEvent, render, screen, waitFor, within } from '@testing-library/vue'
import { createMemoryHistory, createRouter } from 'vue-router'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import AdminWorkQueueView from './AdminWorkQueueView.vue'
import { fetchAdminWorkQueue } from '../lib/api'

vi.mock('../lib/api', async () => {
  const actual = await vi.importActual<typeof import('../lib/api')>('../lib/api')
  return {
    ...actual,
    fetchAdminWorkQueue: vi.fn(),
  }
})

const mockedFetchAdminWorkQueue = vi.mocked(fetchAdminWorkQueue)

const baseResponse = {
  summary: {
    total_open: 7,
    public_requests_pending: 2,
    public_requests_stale: 1,
    specialists_pending_review: 3,
    notification_issues: 4,
    client_invites_pending: 5,
    billing_issues: 6,
  },
  items: [
    {
      id: 'public-1',
      type: 'public_guest_request_pending',
      severity: 'warning',
      status: 'new',
      title: 'Backend public guest request pending title',
      description: 'Backend public guest request pending description',
      created_at: '2026-06-05T10:00:00Z',
      updated_at: '2026-06-05T11:00:00Z',
      target_url: '/admin/inbox/33',
      related: {
        object_type: 'public_guest_request',
        object_id: 33,
        specialist_id: 12,
      },
      actions: [
        { code: 'open', label: 'Відкрити', kind: 'link' },
        { code: 'resolve', label: 'Вирішити', kind: 'mutation' },
      ],
    },
    {
      id: 'billing-1',
      type: 'billing_access_request',
      severity: 'normal',
      status: 'open',
      title: 'Спеціаліст очікує beta-доступ',
      description: 'Потрібно перейти до запиту на доступ.',
      created_at: '2026-06-05T09:00:00Z',
      target_url: '/admin/billing-access-requests/21',
    },
    {
      id: 'notification-1',
      type: 'reminder_delivery_failed',
      severity: 'critical',
      status: 'problem',
      title: 'Backend reminder delivery failed title',
      description: 'Backend reminder delivery failed description',
      created_at: '2026-06-04T09:00:00Z',
    },
  ],
}

async function renderView() {
  const router = createRouter({
    history: createMemoryHistory(),
    routes: [
      { path: '/admin/work-queue', name: 'admin-work-queue', component: AdminWorkQueueView },
      { path: '/admin/inbox', name: 'admin-inbox', component: AdminWorkQueueView },
      { path: '/admin/inbox/:id(\\d+)', name: 'admin-inbox-item', component: AdminWorkQueueView },
      {
        path: '/admin/billing-access-requests',
        name: 'admin-billing-access-requests',
        component: AdminWorkQueueView,
      },
      {
        path: '/admin/billing-access-requests/:id(\\d+)',
        name: 'admin-billing-access-request-detail',
        component: AdminWorkQueueView,
      },
      { path: '/admin/specialists', name: 'admin-specialists', component: AdminWorkQueueView },
    ],
  })

  await router.push('/admin/work-queue')
  await router.isReady()

  render(AdminWorkQueueView, {
    global: {
      plugins: [router],
    },
  })

  return { router }
}

describe('AdminWorkQueueView', () => {
  beforeEach(() => {
    mockedFetchAdminWorkQueue.mockReset()
    mockedFetchAdminWorkQueue.mockResolvedValue(baseResponse)
  })

  it('loads and renders summary counters from summary', async () => {
    await renderView()

    await waitFor(() => {
      expect(mockedFetchAdminWorkQueue).toHaveBeenCalledTimes(1)
    })

    const counters = screen.getByLabelText('Лічильники черги роботи')
    expect(within(counters).getByText('Відкриті')).toBeInTheDocument()
    expect(within(counters).getByText('Публічні запити')).toBeInTheDocument()
    expect(within(counters).getByText('Очікують реакції')).toBeInTheDocument()
    expect(within(counters).getByText('Проблеми повідомлень')).toBeInTheDocument()
    expect(within(counters).getByText('Запрошення клієнтів')).toBeInTheDocument()
    expect(within(counters).getByText('Beta / Pro доступ')).toBeInTheDocument()
    expect(within(counters).getByText('Billing')).toBeInTheDocument()
    for (const value of ['7', '2', '1', '4', '5', '3', '6']) {
      expect(within(counters).getByText(value)).toBeInTheDocument()
    }
  })

  it('renders queue item title, description, status and severity from items', async () => {
    await renderView()

    expect(await screen.findByText('Новий публічний запит')).toBeInTheDocument()
    expect(screen.getByText('Клієнт залишив запит через публічний профіль спеціаліста.')).toBeInTheDocument()
    expect(screen.queryByText('Backend public guest request pending title')).not.toBeInTheDocument()
    expect(screen.queryByText('Backend public guest request pending description')).not.toBeInTheDocument()
    expect(screen.getByText('Публічний запит')).toBeInTheDocument()
    expect(screen.getByText('Увага')).toBeInTheDocument()
    expect(screen.getAllByText('Відкрите').length).toBeGreaterThan(0)
    expect(screen.getByText(/Публічний запит #33/)).toBeInTheDocument()
    expect(screen.getByText(/Спеціаліст #12/)).toBeInTheDocument()
    expect(document.body).not.toHaveTextContent('public_guest_request #33')
  })

  it('maps known backend item types to Ukrainian operational copy', async () => {
    mockedFetchAdminWorkQueue.mockResolvedValueOnce({
      summary: baseResponse.summary,
      items: [
        {
          id: 'stale-1',
          type: 'public_guest_request_stale',
          severity: 'normal',
          status: 'open',
          title: 'Raw stale public request',
          description: 'Raw stale public request description',
        },
        {
          id: 'missing-notification-1',
          type: 'public_guest_request_notification_missing',
          severity: 'warning',
          status: 'problem',
          title: 'Raw missing notification',
          description: 'Raw missing notification description',
        },
        {
          id: 'invite-pending-1',
          type: 'client_record_invite_pending',
          severity: 'normal',
          status: 'open',
          title: 'Raw invite pending',
          description: 'Raw invite pending description',
        },
        {
          id: 'invite-expired-1',
          type: 'client_record_invite_expired',
          severity: 'warning',
          status: 'problem',
          title: 'Raw invite expired',
          description: 'Raw invite expired description',
        },
        {
          id: 'beta-1',
          type: 'specialist_beta_access_missing',
          severity: 'normal',
          status: 'open',
          title: 'Raw beta access',
          description: 'Raw beta access description',
        },
        {
          id: 'billing-event-1',
          type: 'billing_event_failed',
          severity: 'critical',
          status: 'problem',
          title: 'Raw billing event',
          description: 'Raw billing event description',
        },
      ],
    })

    await renderView()

    expect((await screen.findAllByText('Запит очікує реакції')).length).toBeGreaterThan(0)
    expect(screen.getByText('Публічний запит досі не опрацьований. Перевірте, чи спеціаліст відреагував.')).toBeInTheDocument()
    expect(screen.getByText('Повідомлення спеціалісту не підтверджено')).toBeInTheDocument()
    expect(screen.getByText('Для цього запиту немає позначки про відправлене email-повідомлення спеціалісту.')).toBeInTheDocument()
    expect(screen.getByText('Запрошення клієнта очікує')).toBeInTheDocument()
    expect(screen.getByText('Клієнт ще не використав запрошення до кабінету.')).toBeInTheDocument()
    expect(screen.getByText('Запрошення клієнта прострочене')).toBeInTheDocument()
    expect(screen.getByText('Запрошення не було використано вчасно.')).toBeInTheDocument()
    expect(screen.getByText('Спеціаліст очікує Beta / Pro доступ')).toBeInTheDocument()
    expect(screen.getByText('Перевірте, чи потрібно надати спеціалісту доступ.')).toBeInTheDocument()
    expect(screen.getByText('Помилка billing-події')).toBeInTheDocument()
    expect(screen.getByText('Billing-подія потребує перевірки або повторної обробки.')).toBeInTheDocument()
    expect(screen.getAllByText('Звичайна увага').length).toBeGreaterThan(0)

    expect(document.body).not.toHaveTextContent('Raw stale public request')
    expect(document.body).not.toHaveTextContent('Raw missing notification')
    expect(document.body).not.toHaveTextContent('Raw invite pending')
    expect(document.body).not.toHaveTextContent('Raw invite expired')
    expect(document.body).not.toHaveTextContent('Raw beta access')
    expect(document.body).not.toHaveTextContent('Raw billing event')
  })

  it('renders empty state when items are empty', async () => {
    mockedFetchAdminWorkQueue.mockResolvedValueOnce({
      summary: { ...baseResponse.summary, total_open: 0 },
      items: [],
    })

    await renderView()

    expect(await screen.findByText('Подій, які потребують уваги, немає.')).toBeInTheDocument()
  })

  it('renders loading state', async () => {
    mockedFetchAdminWorkQueue.mockReturnValueOnce(new Promise(() => {}))

    await renderView()

    expect(await screen.findByText('Завантаження черги роботи…')).toBeInTheDocument()
  })

  it('renders error state and retry', async () => {
    mockedFetchAdminWorkQueue.mockRejectedValueOnce({})
    mockedFetchAdminWorkQueue.mockResolvedValueOnce(baseResponse)

    await renderView()

    expect(await screen.findByText('Не вдалося завантажити чергу роботи.')).toBeInTheDocument()

    await fireEvent.click(screen.getByRole('button', { name: 'Спробувати ще раз' }))

    expect(await screen.findByText('Новий публічний запит')).toBeInTheDocument()
    expect(mockedFetchAdminWorkQueue).toHaveBeenCalledTimes(2)
  })

  it('filters items by category', async () => {
    await renderView()

    expect(await screen.findByText('Новий публічний запит')).toBeInTheDocument()

    await fireEvent.click(screen.getByRole('button', { name: 'Billing' }))

    expect(screen.getByText('Спеціаліст очікує beta-доступ')).toBeInTheDocument()
    expect(screen.queryByText('Новий публічний запит')).not.toBeInTheDocument()
    expect(screen.queryByText('Помилка повідомлення')).not.toBeInTheDocument()

    await fireEvent.click(screen.getByRole('button', { name: 'Проблеми' }))

    expect(screen.getByText('Новий публічний запит')).toBeInTheDocument()
    expect(screen.getAllByText('Помилка повідомлення').length).toBeGreaterThan(0)
    expect(screen.queryByText('Спеціаліст очікує beta-доступ')).not.toBeInTheDocument()
  })

  it('renders target link when target_url exists', async () => {
    await renderView()

    const links = await screen.findAllByRole('link', { name: 'Відкрити' })
    expect(links[0]).toHaveAttribute('href', '/admin/inbox/33')
    expect(links[1]).toHaveAttribute('href', '/admin/billing-access-requests/21')
  })

  it('does not render private body-like fields from mocked payload', async () => {
    mockedFetchAdminWorkQueue.mockResolvedValueOnce({
      summary: baseResponse.summary,
      items: [
        {
          id: 'private-1',
          type: 'admin_inbox_item',
          severity: 'warning',
          status: 'open',
          title: 'Безпечна операційна подія',
          description: 'Безпечний опис.',
          content: 'PRIVATE_CONTENT_BODY',
          internal_note: 'PRIVATE_INTERNAL_NOTE',
          note_body: 'PRIVATE_NOTE_BODY',
          journal: 'PRIVATE_JOURNAL_BODY',
          token_hash: 'PRIVATE_TOKEN_HASH',
          payload: { raw: 'PRIVATE_RAW_PAYLOAD' },
          message: 'PRIVATE_RAW_MESSAGE',
        } as any,
      ],
    })

    await renderView()

    expect(await screen.findByText('Безпечна операційна подія')).toBeInTheDocument()
    expect(document.body).not.toHaveTextContent('PRIVATE_CONTENT_BODY')
    expect(document.body).not.toHaveTextContent('PRIVATE_INTERNAL_NOTE')
    expect(document.body).not.toHaveTextContent('PRIVATE_NOTE_BODY')
    expect(document.body).not.toHaveTextContent('PRIVATE_JOURNAL_BODY')
    expect(document.body).not.toHaveTextContent('PRIVATE_TOKEN_HASH')
    expect(document.body).not.toHaveTextContent('PRIVATE_RAW_PAYLOAD')
    expect(document.body).not.toHaveTextContent('PRIVATE_RAW_MESSAGE')
  })

  it('does not expose unsupported mutation actions as clickable behavior', async () => {
    mockedFetchAdminWorkQueue.mockResolvedValueOnce({
      summary: baseResponse.summary,
      items: [
        {
          id: 'mutation-1',
          type: 'client_record_invite_pending',
          severity: 'normal',
          status: 'open',
          title: 'Запрошення клієнта ще не використано',
          actions: [
            { code: 'regenerate', label: 'Regenerate private invite', kind: 'mutation' },
            { code: 'resolve', label: 'Resolve private note', kind: 'mutation' },
          ],
        },
      ],
    })

    await renderView()

    expect(await screen.findByText('Запрошення клієнта очікує')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Regenerate private invite' })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Resolve private note' })).not.toBeInTheDocument()
    expect(screen.queryByRole('link', { name: 'Regenerate private invite' })).not.toBeInTheDocument()
    expect(screen.queryByRole('link', { name: 'Resolve private note' })).not.toBeInTheDocument()
  })
})
