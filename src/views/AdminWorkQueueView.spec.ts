import { fireEvent, render, screen, waitFor, within } from '@testing-library/vue'
import { createMemoryHistory, createRouter } from 'vue-router'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import AdminWorkQueueView from './AdminWorkQueueView.vue'
import { fetchAdminWorkQueue, transitionAdminWorkQueueItem } from '../lib/api'
import { apiOrigin } from '../lib/http'

vi.mock('../lib/api', async () => {
  const actual = await vi.importActual<typeof import('../lib/api')>('../lib/api')
  return {
    ...actual,
    fetchAdminWorkQueue: vi.fn(),
    transitionAdminWorkQueueItem: vi.fn(),
  }
})

const mockedFetchAdminWorkQueue = vi.mocked(fetchAdminWorkQueue)
const mockedTransitionAdminWorkQueueItem = vi.mocked(transitionAdminWorkQueueItem)

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
      item_key: 'public_guest_request:33',
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
        public_request_id: 33,
        has_client_name: true,
        has_contact: true,
        has_topics: true,
        has_message: true,
        has_requested_format: true,
        specialist_id: 12,
      },
      actions: [
        { code: 'start', label: 'Mark in progress', kind: 'mutation' },
        { code: 'resolve', label: 'Вирішити', kind: 'mutation' },
        { code: 'ignore', label: 'Ignore', kind: 'mutation' },
      ],
    },
    {
      id: 'billing-1',
      item_key: 'billing_access_request:21',
      type: 'billing_access_request',
      severity: 'normal',
      status: 'open',
      title: 'Спеціаліст очікує beta-доступ',
      description: 'Потрібно перейти до запиту на доступ.',
      created_at: '2026-06-05T09:00:00Z',
      target_url: '/admin/billing-access-requests/21',
      related: {
        object_type: 'billing_access_request',
        object_id: 21,
        domain_status: 'PENDING',
      },
      actions: [
        { code: 'start', label: 'Mark in progress', kind: 'mutation' },
        { code: 'resolve', label: 'Resolve', kind: 'mutation' },
        { code: 'ignore', label: 'Ignore', kind: 'mutation' },
      ],
    },
    {
      id: 'active-client-limit-1',
      item_key: 'active_client_limit_increase_request:31',
      type: 'billing_active_client_limit_increase_request_pending',
      severity: 'normal',
      status: 'open',
      title: 'Backend active client limit request title',
      description: 'Backend active client limit request description',
      created_at: '2026-06-05T08:00:00Z',
      target_url: '/admin/booking/activeclientlimitincreaserequest/31/change/',
      related: {
        object_type: 'active_client_limit_increase_request',
        object_id: 31,
        requested_extra_slots: 3,
        domain_status: 'PENDING',
      },
      actions: [
        { code: 'start', label: 'Mark in progress', kind: 'mutation' },
        { code: 'resolve', label: 'Resolve', kind: 'mutation' },
        { code: 'ignore', label: 'Ignore', kind: 'mutation' },
      ],
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

async function renderView(initialPath = '/admin/work-queue') {
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
      { path: '/admin/specialists/:id(\\d+)', name: 'admin-specialist-detail', component: AdminWorkQueueView },
    ],
  })

  await router.push(initialPath)
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
    mockedTransitionAdminWorkQueueItem.mockReset()
    mockedFetchAdminWorkQueue.mockResolvedValue(baseResponse)
    mockedTransitionAdminWorkQueueItem.mockResolvedValue(baseResponse.items[1] as any)
  })

  it('loads and renders summary counters from summary', async () => {
    await renderView()

    await waitFor(() => {
      expect(mockedFetchAdminWorkQueue).toHaveBeenCalledTimes(1)
    })
    expect(mockedFetchAdminWorkQueue).toHaveBeenCalledWith('active')

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

  it('supports item deep-link query filters', async () => {
    await renderView(
      '/admin/work-queue?status=all&item_key=billing_access_request%3A21'
    )

    await waitFor(() => {
      expect(mockedFetchAdminWorkQueue).toHaveBeenCalledWith('all')
    })
    expect(screen.getByText('Запит на доступ очікує рішення')).toBeInTheDocument()
    expect(screen.queryByText('Запити очікують реакції спеціаліста')).not.toBeInTheDocument()
  })

  it('supports specialist-scoped query filters', async () => {
    await renderView('/admin/work-queue?status=active&specialist_id=12')

    await waitFor(() => {
      expect(mockedFetchAdminWorkQueue).toHaveBeenCalledWith('active')
    })
    expect(screen.getByText('Запити очікують реакції спеціаліста')).toBeInTheDocument()
    expect(screen.queryByText('Запит на доступ очікує рішення')).not.toBeInTheDocument()
  })

  it('renders queue item title, description, status and severity from items', async () => {
    await renderView()

    expect(await screen.findByText('Запити очікують реакції спеціаліста')).toBeInTheDocument()
    expect(screen.getByText('Операційний сигнал: запит має бути опрацьований спеціалістом у його кабінеті.')).toBeInTheDocument()
    expect(screen.queryByText('Backend public guest request pending title')).not.toBeInTheDocument()
    expect(screen.queryByText('Backend public guest request pending description')).not.toBeInTheDocument()
    expect(screen.getByText('Публічний запит')).toBeInTheDocument()
    expect(screen.getByText('Увага')).toBeInTheDocument()
    expect(screen.getAllByText('Відкрите').length).toBeGreaterThan(0)
    expect(screen.getByText(/Публічний запит #33/)).toBeInTheDocument()
    expect(screen.getByText('Дані запиту: приховано')).toBeInTheDocument()
    expect(screen.getByText('Контакт клієнта: вказано')).toBeInTheDocument()
    expect(screen.getByText('Повідомлення: вказано')).toBeInTheDocument()
    expect(screen.getByText('Категорії: вказано')).toBeInTheDocument()
    expect(screen.getByText('Формат: вказано')).toBeInTheDocument()
    expect(document.body).not.toHaveTextContent('Оксана Мельник')
    expect(document.body).not.toHaveTextContent('oksana@example.com')
    expect(document.body).not.toHaveTextContent('Стрес')
    expect(document.body).not.toHaveTextContent('Потрібна консультація')
    expect(screen.getByText(/Спеціаліст #12/)).toBeInTheDocument()
    expect(document.body).not.toHaveTextContent('public_guest_request #33')
  })

  it('renders canonical incomplete public profile readiness for specialist onboarding', async () => {
    mockedFetchAdminWorkQueue.mockResolvedValueOnce({
      summary: baseResponse.summary,
      items: [
        {
          id: 'specialist-onboarding-incomplete',
          type: 'specialist_onboarding',
          severity: 'normal',
          status: 'open',
          title: 'Specialist onboarding incomplete',
          related: {
            public_profile_readiness: {
              is_ready: false,
              completed_count: 2,
              total_count: 6,
              missing_items: ['topics'],
              items: [],
            },
          },
        },
      ],
    })

    await renderView()

    expect(await screen.findByText('Профіль 2/6')).toBeInTheDocument()
  })

  it('renders completed canonical public profile readiness for specialist onboarding', async () => {
    mockedFetchAdminWorkQueue.mockResolvedValueOnce({
      summary: baseResponse.summary,
      items: [
        {
          id: 'specialist-onboarding-ready',
          type: 'specialist_onboarding',
          severity: 'normal',
          status: 'open',
          title: 'Specialist onboarding ready',
          related: {
            public_profile_readiness: {
              is_ready: true,
              completed_count: 6,
              total_count: 6,
              missing_items: [],
              items: [],
            },
          },
        },
      ],
    })

    await renderView()

    expect(await screen.findByText('Профіль 6/6 ✓')).toBeInTheDocument()
  })

  it('does not render public profile readiness for unrelated work-queue items', async () => {
    mockedFetchAdminWorkQueue.mockResolvedValueOnce({
      summary: baseResponse.summary,
      items: [
        {
          id: 'unrelated-readiness',
          type: 'billing_access_request',
          severity: 'normal',
          status: 'open',
          title: 'Unrelated item',
          related: {
            public_profile_readiness: {
              is_ready: false,
              completed_count: 2,
              total_count: 6,
              missing_items: ['topics'],
              items: [],
            },
          },
        },
      ],
    })

    await renderView()

    await waitFor(() => {
      expect(mockedFetchAdminWorkQueue).toHaveBeenCalledTimes(1)
    })
    expect(screen.queryByText('Профіль 2/6')).not.toBeInTheDocument()
  })

  it('does not fail or render a readiness badge for missing or malformed payloads', async () => {
    mockedFetchAdminWorkQueue.mockResolvedValueOnce({
      summary: baseResponse.summary,
      items: [
        {
          id: 'specialist-onboarding-missing-readiness',
          type: 'specialist_onboarding',
          severity: 'normal',
          status: 'open',
          title: 'Missing readiness',
        },
        {
          id: 'specialist-onboarding-malformed-readiness',
          type: 'specialist_onboarding',
          severity: 'normal',
          status: 'open',
          title: 'Malformed readiness',
          related: {
            public_profile_readiness: {
              is_ready: 'yes',
              completed_count: '2',
              total_count: null,
            },
          } as any,
        },
      ],
    })

    await renderView()

    expect(await screen.findByText('Missing readiness')).toBeInTheDocument()
    expect(screen.getByText('Malformed readiness')).toBeInTheDocument()
    expect(screen.queryByText(/^Профіль /)).not.toBeInTheDocument()
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

    expect((await screen.findAllByText('Запити очікують реакції спеціаліста')).length).toBeGreaterThan(0)
    expect(screen.getByText('Операційний сигнал: процес обробки публічного запиту потребує перевірки.')).toBeInTheDocument()
    expect(screen.getByText('Повідомлення спеціалісту не підтверджено')).toBeInTheDocument()
    expect(screen.getByText('Для цього запиту немає позначки про відправлене email-повідомлення спеціалісту.')).toBeInTheDocument()
    expect(screen.getByText('Запрошення клієнта очікує')).toBeInTheDocument()
    expect(screen.getByText('Клієнт ще не використав запрошення до кабінету.')).toBeInTheDocument()
    expect(screen.getByText('Запрошення клієнта прострочене')).toBeInTheDocument()
    expect(screen.getByText('Запрошення не було використано вчасно.')).toBeInTheDocument()
    expect(screen.getByText('Спеціаліст потребує перевірки доступу')).toBeInTheDocument()
    expect(screen.getByText('Спеціаліст активний, але не має явно наданого Beta / Pro доступу. Перевірте, чи потрібно надати доступ.')).toBeInTheDocument()
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

    expect(await screen.findByText('Запити очікують реакції спеціаліста')).toBeInTheDocument()
    expect(mockedFetchAdminWorkQueue).toHaveBeenCalledTimes(2)
  })

  it('filters items by category', async () => {
    await renderView()

    expect(await screen.findByText('Запити очікують реакції спеціаліста')).toBeInTheDocument()

    await fireEvent.click(screen.getByRole('button', { name: 'Billing' }))

    expect(screen.getByText('Запит на доступ очікує рішення')).toBeInTheDocument()
    expect(screen.getByText('Backend active client limit request title')).toBeInTheDocument()
    expect(screen.queryByText('Запити очікують реакції спеціаліста')).not.toBeInTheDocument()
    expect(screen.queryByText('Проблема повідомлень')).not.toBeInTheDocument()

    await fireEvent.click(screen.getByRole('button', { name: 'Проблеми' }))

    expect(screen.getByText('Запити очікують реакції спеціаліста')).toBeInTheDocument()
    expect(screen.getAllByText('Проблема повідомлень').length).toBeGreaterThan(0)
    expect(screen.queryByText('Запит на доступ очікує рішення')).not.toBeInTheDocument()
  })

  it('labels active client limit request metadata as billing expansion request', async () => {
    await renderView()

    expect(await screen.findByText('Backend active client limit request title')).toBeInTheDocument()
    expect(screen.getByText('Запит на розширення #31')).toBeInTheDocument()
    expect(screen.queryByText('Публічний запит #31')).not.toBeInTheDocument()
    expect(screen.getByText(/Публічний запит #33/)).toBeInTheDocument()
  })

  it('loads lifecycle filters from the backend and shows approved billing status', async () => {
    mockedFetchAdminWorkQueue.mockReset()
    mockedFetchAdminWorkQueue
      .mockResolvedValueOnce(baseResponse)
      .mockResolvedValueOnce({
        summary: { ...baseResponse.summary, total_open: 0 },
        items: [
          {
            id: 'billing_access_request:21',
            item_key: 'billing_access_request:21',
            type: 'billing_access_request',
            severity: 'normal',
            status: 'resolved',
            title: 'Billing access request processed',
            target_url: '/admin/billing-access-requests/21',
            source_active: false,
            related: {
              object_type: 'billing_access_request',
              object_id: 21,
              domain_status: 'APPROVED',
            },
            actions: [],
          },
        ],
      })

    await renderView()
    await fireEvent.click(screen.getByRole('button', { name: 'Вирішені' }))

    await waitFor(() => {
      expect(mockedFetchAdminWorkQueue).toHaveBeenLastCalledWith('resolved')
    })
    expect(await screen.findByText('Запит на доступ погоджено')).toBeInTheDocument()
    expect(screen.getByText('Статус запиту: Погоджено')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Відкрити' })).toHaveAttribute(
      'href',
      '/admin/billing-access-requests/21'
    )
    expect(screen.queryByRole('button', { name: 'Повернути до відкритих' })).not.toBeInTheDocument()
  })

  it('opens inline detail and resolves an item with an optional note', async () => {
    await renderView()

    const billingTitle = await screen.findByText('Запит на доступ очікує рішення')
    const billingCard = billingTitle.closest('article')
    expect(billingCard).not.toBeNull()

    await fireEvent.click(within(billingCard as HTMLElement).getByRole('button', { name: 'Деталі' }))
    expect(
      within(billingCard as HTMLElement).getByText(
        'Відкрийте профільний billing-запит і погодьте або відхиліть його там. Дії черги не змінюють тариф.'
      )
    ).toBeInTheDocument()

    const note = within(billingCard as HTMLElement).getByLabelText(
      'Примітка або причина (необов’язково)'
    )
    await fireEvent.update(note, 'Перевірено операційно.')
    await fireEvent.click(
      within(billingCard as HTMLElement).getByRole('button', {
        name: 'Позначити вирішеним',
      })
    )

    await waitFor(() => {
      expect(mockedTransitionAdminWorkQueueItem).toHaveBeenCalledWith(
        'billing_access_request:21',
        'resolve',
        'Перевірено операційно.'
      )
    })
    expect(mockedFetchAdminWorkQueue).toHaveBeenLastCalledWith('active')
  })

  it('uses type-aware target links and suppresses unsupported public request targets', async () => {
    await renderView()

    const links = await screen.findAllByRole('link', { name: 'Відкрити' })
    expect(links).toHaveLength(2)
    expect(links.map((link) => link.getAttribute('href'))).toEqual(
      expect.arrayContaining([
        '/admin/billing-access-requests/21',
        `${apiOrigin()}/admin/booking/activeclientlimitincreaserequest/31/change/`,
      ])
    )
    expect(
      screen.getByText('Обробка запиту виконується спеціалістом у його кабінеті. Адміністратор бачить лише операційний сигнал.')
    ).toBeInTheDocument()
  })

  it('keeps SPA admin work queue targets internal while opening Django admin targets on API origin', async () => {
    mockedFetchAdminWorkQueue.mockResolvedValueOnce({
      summary: baseResponse.summary,
      items: [
        {
          id: 'spa-work-queue',
          item_key: 'active_client_limit_increase_request:2',
          type: 'billing_active_client_limit_increase_request_pending',
          severity: 'normal',
          status: 'open',
          title: 'SPA work queue target',
          target_url: '/admin/work-queue?status=active&item_key=active_client_limit_increase_request:2',
          related: {
            object_type: 'active_client_limit_increase_request',
            object_id: 2,
          },
        },
        {
          id: 'django-admin-change',
          item_key: 'active_client_limit_increase_request:3',
          type: 'billing_active_client_limit_increase_request_pending',
          severity: 'normal',
          status: 'open',
          title: 'Django admin target',
          target_url: '/admin/booking/activeclientlimitincreaserequest/3/change/',
          related: {
            object_type: 'active_client_limit_increase_request',
            object_id: 3,
          },
        },
      ],
    })

    await renderView()

    const links = await screen.findAllByRole('link', { name: 'Відкрити' })
    expect(links.map((link) => link.getAttribute('href'))).toEqual(
      expect.arrayContaining([
        '/admin/work-queue?status=active&item_key=active_client_limit_increase_request:2',
        `${apiOrigin()}/admin/booking/activeclientlimitincreaserequest/3/change/`,
      ])
    )
  })

  it('keeps admin inbox navigation for actual admin inbox items', async () => {
    mockedFetchAdminWorkQueue.mockResolvedValueOnce({
      summary: baseResponse.summary,
      items: [
        {
          id: 'admin-inbox-33',
          type: 'admin_inbox_item',
          severity: 'warning',
          status: 'open',
          title: 'Адмін-запит потребує уваги',
          target_url: '/admin/inbox/33',
          related: {
            object_type: 'admin_inbox_item',
            object_id: 33,
          },
        },
      ],
    })

    await renderView()

    expect(await screen.findByRole('link', { name: 'Відкрити' })).toHaveAttribute('href', '/admin/inbox/33')
  })

  it('renders grouped email domain notification issue as operational copy without raw provider error', async () => {
    const rawDomainError = 'The proconsult.space domain' + ' is not verified'
    const rawProviderUrl = 'resend.com' + '/domains'
    mockedFetchAdminWorkQueue.mockResolvedValueOnce({
      summary: baseResponse.summary,
      items: [
        {
          id: 'reminder_delivery_issue:email_domain_not_verified:email',
          type: 'reminder_delivery_issue',
          severity: 'critical',
          status: 'problem',
          title: rawDomainError,
          description: `See ${rawProviderUrl} for raw provider details`,
          created_at: '2026-06-05T10:00:00Z',
          updated_at: '2026-06-05T12:30:00Z',
          target_url: null,
          related: {
            object_type: 'reminder_delivery',
            object_id: 44,
            category: 'email_domain_not_verified',
            channel: 'email',
            count: 7,
            last_error: `${rawDomainError}. Visit ${rawProviderUrl}`,
          } as any,
        },
      ],
    })

    await renderView()

    expect(await screen.findByText('Глобальна проблема email')).toBeInTheDocument()
    expect(screen.getByText('Email-домен не підтверджено')).toBeInTheDocument()
    expect(screen.getByText('Email-доставки не проходять, бо домен відправника не підтверджено у провайдера.')).toBeInTheDocument()
    expect(screen.getByText('Що зробити: перевірити домен proconsult.space у Resend і DNS-записи для відправки email.')).toBeInTheDocument()
    expect(screen.getByText('Канал: email')).toBeInTheDocument()
    expect(screen.getByText('Невдалих доставок: 7')).toBeInTheDocument()
    expect(screen.getByText(/Остання: 05\.06\.2026, \d{2}:\d{2}/)).toBeInTheDocument()
    expect(document.body).not.toHaveTextContent('Обʼєкт #44')
    expect(document.body).not.toHaveTextContent('reminder_delivery #44')
    expect(document.body).not.toHaveTextContent(rawDomainError)
    expect(document.body).not.toHaveTextContent(rawProviderUrl)
  })

  it('does not render a fake action for notification issue without target url', async () => {
    mockedFetchAdminWorkQueue.mockResolvedValueOnce({
      summary: baseResponse.summary,
      items: [
        {
          id: 'notification-issue-1',
          type: 'notification_issue',
          severity: 'warning',
          status: 'problem',
          title: 'Raw notification issue',
          target_url: null,
          related: {
            category: 'unknown_delivery_failure',
          } as any,
        },
      ],
    })

    await renderView()

    expect(await screen.findByText('Проблема повідомлень')).toBeInTheDocument()
    expect(screen.queryByRole('link', { name: 'Відкрити' })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Відкрити' })).not.toBeInTheDocument()
    expect(screen.getByText('Що зробити: перевірити останні невдалі доставки та налаштування email-повідомлень.')).toBeInTheDocument()
  })

  it('renders notification issue metadata from whitelisted fields', async () => {
    mockedFetchAdminWorkQueue.mockResolvedValueOnce({
      summary: baseResponse.summary,
      items: [
        {
          id: 'reminder_delivery_issue:provider_error:email',
          type: 'reminder_delivery_issue',
          severity: 'warning',
          status: 'problem',
          title: 'Raw provider issue',
          updated_at: '2026-06-05T12:30:00Z',
          related: {
            category: 'provider_error',
            channel: 'email',
            count: 3,
          } as any,
        },
      ],
    })

    await renderView()

    expect(await screen.findByText('Помилка провайдера email')).toBeInTheDocument()
    expect(screen.getByText('Канал: email')).toBeInTheDocument()
    expect(screen.getByText('Невдалих доставок: 3')).toBeInTheDocument()
    expect(screen.getByText(/Остання: 05\.06\.2026, \d{2}:\d{2}/)).toBeInTheDocument()
  })

  it('renders specialist access review item with Ukrainian copy and safe metadata', async () => {
    const rawSpecialistTitle = 'Specialist access' + ' may need review'
    const rawSpecialistDescription = 'Specialist is active without explicit' + ' beta PRO access.'
    mockedFetchAdminWorkQueue.mockResolvedValueOnce({
      summary: baseResponse.summary,
      items: [
        {
          id: 'specialist-access-61',
          type: 'specialist_beta_access_review',
          severity: 'normal',
          status: 'open',
          title: rawSpecialistTitle,
          description: rawSpecialistDescription,
          related: {
            object_type: 'specialist',
            object_id: 61,
            specialist_id: 61,
          },
        },
      ],
    })

    await renderView()

    expect(await screen.findByText('СПЕЦІАЛІСТ')).toBeInTheDocument()
    expect(screen.getByText('Спеціаліст потребує перевірки доступу')).toBeInTheDocument()
    expect(screen.getByText('Спеціаліст активний, але не має явно наданого Beta / Pro доступу. Перевірте, чи потрібно надати доступ.')).toBeInTheDocument()
    expect(screen.getByText('Спеціаліст #61')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'До спеціаліста' })).toHaveAttribute('href', '/admin/specialists/61')
    expect(document.body).not.toHaveTextContent(rawSpecialistTitle)
    expect(document.body).not.toHaveTextContent(rawSpecialistDescription)
    expect(document.body).not.toHaveTextContent('Спеціаліст #61 · Спеціаліст #61')
  })

  it('shows public profile action for active specialist public profile', async () => {
    mockedFetchAdminWorkQueue.mockResolvedValueOnce({
      summary: baseResponse.summary,
      items: [
        {
          id: 'specialist-access-public',
          type: 'specialist_beta_access_review',
          severity: 'normal',
          status: 'open',
          title: 'Specialist access',
          target_url: '/admin/specialists/61',
          related: {
            object_type: 'specialist',
            object_id: 61,
            specialist_id: 61,
            public_profile_enabled: true,
            public_profile_slug: 'iryna-bondar',
            public_profile_path: '/s/iryna-bondar',
          },
        },
      ],
    })

    await renderView()

    const publicProfileLink = await screen.findByRole('link', { name: 'До профілю' })
    expect(publicProfileLink).toHaveAttribute('href', '/s/iryna-bondar')
    expect(publicProfileLink).toHaveAttribute('target', '_blank')
    expect(publicProfileLink).toHaveClass('btn')
    expect(publicProfileLink).not.toHaveClass('btn--ghost')
    expect(screen.getByRole('link', { name: 'До спеціаліста' })).toHaveAttribute('href', '/admin/specialists/61')
    expect(screen.getByRole('link', { name: 'Відкрити' })).toHaveClass('btn--ghost')
  })

  it('does not show public profile action for inactive specialist profile', async () => {
    mockedFetchAdminWorkQueue.mockResolvedValueOnce({
      summary: baseResponse.summary,
      items: [
        {
          id: 'specialist-access-private',
          type: 'specialist_beta_access_review',
          severity: 'normal',
          status: 'open',
          title: 'Specialist access',
          related: {
            object_type: 'specialist',
            object_id: 61,
            specialist_id: 61,
            specialist_slug: 'iryna-bondar',
            public_profile_enabled: false,
            public_profile_slug: '',
            public_profile_path: '',
          },
        },
      ],
    })

    await renderView()

    expect(await screen.findByRole('link', { name: 'До спеціаліста' })).toHaveAttribute('href', '/admin/specialists/61')
    expect(screen.queryByRole('link', { name: 'До профілю' })).not.toBeInTheDocument()
  })

  it('does not show specialist detail link when specialist id is absent', async () => {
    mockedFetchAdminWorkQueue.mockResolvedValueOnce({
      summary: baseResponse.summary,
      items: [
        {
          id: 'specialist-access-no-id',
          type: 'specialist_beta_access_review',
          severity: 'normal',
          status: 'open',
          title: 'Raw specialist title',
          description: 'Raw specialist description',
          related: {
            object_type: 'specialist',
            specialist_email: 'no-id@example.com',
          } as any,
        },
      ],
    })

    await renderView()

    expect(await screen.findByText('Спеціаліст потребує перевірки доступу')).toBeInTheDocument()
    expect(screen.getByText('Email: no-id@example.com')).toBeInTheDocument()
    expect(screen.queryByRole('link', { name: 'До спеціаліста' })).not.toBeInTheDocument()
  })

  it('prefers specialist display metadata over specialist id fallback', async () => {
    mockedFetchAdminWorkQueue.mockResolvedValueOnce({
      summary: baseResponse.summary,
      items: [
        {
          id: 'specialist-access-61',
          type: 'specialist_beta_access_review',
          severity: 'normal',
          status: 'open',
          title: 'Raw specialist title',
          description: 'Raw specialist description',
          target_url: '/admin/specialists/61',
          related: {
            object_type: 'specialist',
            object_id: 61,
            specialist_id: 61,
            specialist_display_name: 'Ірина Бондар',
            specialist_name: 'Fallback Specialist Name',
            specialist_email: 'iryna@example.com',
          } as any,
        },
      ],
    })

    await renderView()

    expect(await screen.findByText('Спеціаліст: Ірина Бондар')).toBeInTheDocument()
    expect(screen.getByText('Email: iryna@example.com')).toBeInTheDocument()
    expect(screen.queryByText('Спеціаліст #61')).not.toBeInTheDocument()
    expect(document.body).not.toHaveTextContent('Спеціаліст #61 · Спеціаліст #61')
    expect(screen.getByRole('link', { name: 'До спеціаліста' })).toHaveAttribute('href', '/admin/specialists/61')
    expect(screen.getByRole('link', { name: 'Відкрити' })).toHaveAttribute('href', '/admin/specialists/61')
  })

  it('renders public request id and safe specialist metadata', async () => {
    mockedFetchAdminWorkQueue.mockResolvedValueOnce({
      summary: baseResponse.summary,
      items: [
        {
          id: 'public-6',
          type: 'public_guest_request_pending',
          severity: 'warning',
          status: 'open',
          title: 'Raw public request title',
          target_url: '/admin/inbox',
          related: {
            object_type: 'public_guest_request',
            object_id: 6,
            request_id: 6,
            request_status: 'pending',
            specialist_id: 10,
            specialist_name: 'Назар Петренко',
            specialist_email: 'nazar@example.com',
          } as any,
        },
      ],
    })

    await renderView()

    expect(await screen.findByText('Публічний запит #6')).toBeInTheDocument()
    expect(screen.getByText('Спеціаліст: Назар Петренко')).toBeInTheDocument()
    expect(screen.getByText('Email: nazar@example.com')).toBeInTheDocument()
    expect(screen.queryByText('Спеціаліст #10')).not.toBeInTheDocument()
    expect(screen.queryByRole('link', { name: 'Відкрити' })).not.toBeInTheDocument()
    expect(
      screen.getByText('Обробка запиту виконується спеціалістом у його кабінеті. Адміністратор бачить лише операційний сигнал.')
    ).toBeInTheDocument()
  })

  it('hides public request context, shows indicators and keeps lifecycle actions working', async () => {
    await renderView()

    const title = await screen.findByText('Запити очікують реакції спеціаліста')
    const card = title.closest('article')
    expect(card).not.toBeNull()

    await fireEvent.click(within(card as HTMLElement).getByRole('button', { name: 'Деталі' }))

    expect(within(card as HTMLElement).getByText('Конфіденційність запиту')).toBeInTheDocument()
    expect(
      within(card as HTMLElement).getByText(
        'Деталі клієнтського запиту приховані з міркувань конфіденційності. Зміст запиту доступний лише спеціалісту в його кабінеті.'
      )
    ).toBeInTheDocument()
    const privacyDetail = within(card as HTMLElement)
      .getByText('Конфіденційність запиту')
      .closest('.queue-item__request-context')
    expect(privacyDetail).not.toBeNull()
    expect(within(privacyDetail as HTMLElement).getAllByText('вказано')).toHaveLength(5)
    expect(document.body).not.toHaveTextContent('Оксана Мельник')
    expect(document.body).not.toHaveTextContent('oksana@example.com')
    expect(document.body).not.toHaveTextContent('Стрес')
    expect(document.body).not.toHaveTextContent('Потрібна консультація')

    await fireEvent.click(
      within(card as HTMLElement).getByRole('button', { name: 'Позначити в роботі' })
    )

    await waitFor(() => {
      expect(mockedTransitionAdminWorkQueueItem).toHaveBeenCalledWith(
        'public_guest_request:33',
        'start',
        ''
      )
    })
  })

  it('renders safe negative indicators for missing public request context', async () => {
    mockedFetchAdminWorkQueue.mockResolvedValueOnce({
      summary: baseResponse.summary,
      items: [
        {
          id: 'public-missing-7',
          item_key: 'public_guest_request:7',
          type: 'public_guest_request_pending',
          severity: 'normal',
          status: 'open',
          title: 'Raw public request title',
          related: {
            object_type: 'public_guest_request',
            object_id: 7,
            public_request_id: 7,
            has_client_name: false,
            has_contact: false,
            has_topics: false,
            has_message: false,
            has_requested_format: false,
          },
          actions: [],
        },
      ],
    })

    await renderView()

    expect(await screen.findByText('Дані запиту: приховано')).toBeInTheDocument()
    expect(screen.getByText('Контакт клієнта: не вказано')).toBeInTheDocument()
    expect(screen.getByText('Повідомлення: не вказано')).toBeInTheDocument()
    expect(screen.getByText('Категорії: не вказано')).toBeInTheDocument()
    expect(screen.getByText('Формат: не вказано')).toBeInTheDocument()

    await fireEvent.click(screen.getByRole('button', { name: 'Деталі' }))
    const detail = screen.getByText('Конфіденційність запиту').closest('.queue-item__request-context')
    expect(detail).not.toBeNull()
    expect(within(detail as HTMLElement).getAllByText('не вказано')).toHaveLength(5)
  })

  it('renders client invite context with client and specialist metadata', async () => {
    mockedFetchAdminWorkQueue.mockResolvedValueOnce({
      summary: baseResponse.summary,
      items: [
        {
          id: 'invite-5',
          type: 'client_record_invite_pending',
          severity: 'normal',
          status: 'open',
          title: 'Raw invite title',
          target_url: '/admin/specialists/2',
          related: {
            object_type: 'client_record_account_invite',
            object_id: 5,
            invite_id: 5,
            client_record_id: 8,
            client_display_name: 'Марія Клименко',
            client_email: 'maria@example.com',
            specialist_id: 2,
            specialist_display_name: 'Олена Савчук',
            specialist_email: 'olena@example.com',
          } as any,
        },
      ],
    })

    await renderView()

    expect(await screen.findByText('Запрошення клієнта #5')).toBeInTheDocument()
    expect(screen.getByText('Клієнт: Марія Клименко')).toBeInTheDocument()
    expect(screen.getByText('Email клієнта: maria@example.com')).toBeInTheDocument()
    expect(screen.getByText('Спеціаліст: Олена Савчук')).toBeInTheDocument()
    expect(screen.getByText('Email: olena@example.com')).toBeInTheDocument()
    expect(screen.queryByText('Спеціаліст #2')).not.toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Відкрити' })).toHaveAttribute('href', '/admin/specialists/2')
  })

  it('keeps specialist id fallback only when no safe specialist name or email exists', async () => {
    mockedFetchAdminWorkQueue.mockResolvedValueOnce({
      summary: baseResponse.summary,
      items: [
        {
          id: 'specialist-fallback-77',
          type: 'specialist_access_review',
          severity: 'normal',
          status: 'open',
          title: 'Raw fallback specialist title',
          related: {
            object_type: 'specialist',
            object_id: 77,
            specialist_id: 77,
          },
        },
      ],
    })

    await renderView()

    expect(await screen.findByText('Спеціаліст #77')).toBeInTheDocument()
    expect(document.body).not.toHaveTextContent('Спеціаліст #77 · Спеціаліст #77')
  })

  it('does not render a fake action for root target url', async () => {
    mockedFetchAdminWorkQueue.mockResolvedValueOnce({
      summary: baseResponse.summary,
      items: [
        {
          id: 'root-target-1',
          type: 'admin_inbox_item',
          severity: 'warning',
          status: 'open',
          title: 'Root target item',
          target_url: '/',
        } as any,
      ],
    })

    await renderView()

    expect(await screen.findByText('Root target item')).toBeInTheDocument()
    expect(screen.queryByRole('link', { name: 'Відкрити' })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Відкрити' })).not.toBeInTheDocument()
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
          last_error: 'PRIVATE_LAST_ERROR',
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
    expect(document.body).not.toHaveTextContent('PRIVATE_LAST_ERROR')
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
