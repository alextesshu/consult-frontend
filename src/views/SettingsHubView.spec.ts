import { fireEvent, render, screen, waitFor, within } from '@testing-library/vue'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { reactive } from 'vue'
import SettingsHubView from './SettingsHubView.vue'
import {
  cancelDataDeletionRequest,
  createDataDeletionRequest,
  fetchCabinetPaymentDetails,
  fetchCurrentDataDeletionRequest,
  updateCabinetPaymentDetails,
  type DataDeletionRequest,
} from '../lib/api'

const mockToast = {
  show: vi.fn(),
  success: vi.fn(),
  error: vi.fn(),
  warning: vi.fn(),
  info: vi.fn(),
}

const mockRoute = reactive<{ query: Record<string, unknown>; hash: string }>({
  query: {},
  hash: '',
})

const mockRouter = {
  replace: vi.fn((payload: { query?: Record<string, unknown>; hash?: string }) => {
    mockRoute.query = { ...mockRoute.query, ...(payload.query || {}) }
    mockRoute.hash = payload.hash || ''
  }),
}

vi.mock('vue-router', async () => {
  const actual = await vi.importActual<typeof import('vue-router')>('vue-router')
  return {
    ...actual,
    useRoute: () => mockRoute,
    useRouter: () => mockRouter,
  }
})

vi.mock('../composables/useToast', () => ({
  useToast: () => mockToast,
}))

vi.mock('../lib/api', () => ({
  cancelDataDeletionRequest: vi.fn(),
  createDataDeletionRequest: vi.fn(),
  fetchCabinetPaymentDetails: vi.fn(),
  fetchCurrentDataDeletionRequest: vi.fn(),
  updateCabinetPaymentDetails: vi.fn(),
  getApiErrorMessage: vi.fn((err: any, fallback: string) => err?.response?.data?.detail || fallback),
}))

const mockedCancelDataDeletionRequest = vi.mocked(cancelDataDeletionRequest)
const mockedCreateDataDeletionRequest = vi.mocked(createDataDeletionRequest)
const mockedFetchCabinetPaymentDetails = vi.mocked(fetchCabinetPaymentDetails)
const mockedFetchCurrentDataDeletionRequest = vi.mocked(fetchCurrentDataDeletionRequest)
const mockedUpdateCabinetPaymentDetails = vi.mocked(updateCabinetPaymentDetails)

function paymentDetailsFixture(overrides: Record<string, unknown> = {}) {
  return {
    is_configured: false,
    available_methods: [],
    default_method_type: null,
    methods: {},
    ...overrides,
  }
}

function dataDeletionFixture(overrides: Partial<DataDeletionRequest> = {}): DataDeletionRequest {
  return {
    id: 41,
    kind: 'ACCOUNT',
    status: 'SUBMITTED',
    reason: '',
    submitted_at: '2026-06-16T12:00:00Z',
    reviewed_at: null,
    cancelled_at: null,
    ...overrides,
  }
}

function renderView() {
  return render(SettingsHubView, {
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

function bankCard() {
  const card = screen.getByRole('heading', { name: 'Банківський рахунок (IBAN)' }).closest('article')
  if (!card) throw new Error('Bank card not found')
  return within(card)
}

function cardCard() {
  const card = screen.getByRole('heading', { name: 'Картка' }).closest('article')
  if (!card) throw new Error('Card card not found')
  return within(card)
}

describe('SettingsHubView dual payment methods', () => {
  beforeEach(() => {
    mockRoute.query = {}
    mockRoute.hash = ''
    mockRouter.replace.mockClear()

    mockedFetchCabinetPaymentDetails.mockReset()
    mockedFetchCurrentDataDeletionRequest.mockReset()
    mockedUpdateCabinetPaymentDetails.mockReset()
    mockedCreateDataDeletionRequest.mockReset()
    mockedCancelDataDeletionRequest.mockReset()
    mockToast.show.mockReset()
    mockToast.success.mockReset()
    mockToast.error.mockReset()
    mockToast.warning.mockReset()
    mockToast.info.mockReset()
    mockedFetchCurrentDataDeletionRequest.mockResolvedValue(null)
  })

  it('shows dedicated Реквізити tab in settings navigation', async () => {
    renderView()

    expect(screen.getByRole('link', { name: 'Реквізити' })).toHaveAttribute(
      'href',
      '/cabinet/settings?tab=payment-details'
    )
  })

  it('keeps hub as default and does not load payment details API until payment tab is open', async () => {
    renderView()

    await waitFor(() => {
      expect(mockedFetchCurrentDataDeletionRequest).toHaveBeenCalledTimes(1)
    })
    expect(screen.getByRole('link', { name: 'Реквізити' })).toBeInTheDocument()
    expect(screen.queryByText('Реквізити для оплати')).not.toBeInTheDocument()
    expect(mockedFetchCabinetPaymentDetails).not.toHaveBeenCalled()
  })

  it('shows account and data block with submit action when there is no current request', async () => {
    renderView()

    expect(await screen.findByRole('heading', { name: 'Акаунт і дані' })).toBeInTheDocument()
    expect(await screen.findByRole('button', { name: 'Видалити акаунт' })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Скасувати видалення' })).not.toBeInTheDocument()
  })

  it('submits account deletion from confirm modal without comment field', async () => {
    mockedCreateDataDeletionRequest.mockResolvedValue(dataDeletionFixture())

    renderView()

    await fireEvent.click(await screen.findByRole('button', { name: 'Видалити акаунт' }))
    const dialog = await screen.findByRole('dialog', {
      name: 'Видалити акаунт?',
    })
    expect(within(dialog).queryByRole('textbox')).not.toBeInTheDocument()
    await fireEvent.click(within(dialog).getByRole('button', { name: 'Видалити акаунт' }))

    await waitFor(() => {
      expect(mockedCreateDataDeletionRequest).toHaveBeenCalledWith()
    })
    expect(await screen.findByText('Видалення акаунта розпочато')).toBeInTheDocument()
    expect(mockToast.success).toHaveBeenCalledWith('Видалення акаунта розпочато.')
  })

  it('shows current request and allows cancel while request is in review', async () => {
    mockedFetchCurrentDataDeletionRequest.mockResolvedValue(
      dataDeletionFixture({
        status: 'IN_REVIEW',
      })
    )
    mockedCancelDataDeletionRequest.mockResolvedValue(
      dataDeletionFixture({
        status: 'CANCELLED',
        cancelled_at: '2026-06-17T10:00:00Z',
      })
    )

    renderView()

    expect(await screen.findByText('Видалення акаунта в обробці')).toBeInTheDocument()
    await fireEvent.click(screen.getByRole('button', { name: 'Скасувати видалення' }))

    await waitFor(() => {
      expect(mockedCancelDataDeletionRequest).toHaveBeenCalledWith(41)
    })
    expect(await screen.findByText('Видалення акаунта скасовано')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Видалити акаунт' })).toBeInTheDocument()
    expect(mockToast.success).toHaveBeenCalledWith('Видалення акаунта скасовано.')
  })

  it('shows approved state without submit or cancel actions', async () => {
    mockedFetchCurrentDataDeletionRequest.mockResolvedValue(
      dataDeletionFixture({
        status: 'APPROVED',
        reviewed_at: '2026-06-17T09:00:00Z',
      })
    )

    renderView()

    expect(await screen.findByText('Видалення акаунта в обробці')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Видалити акаунт' })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Скасувати видалення' })).not.toBeInTheDocument()
  })

  it('supports canonical payment tab and 0-method empty state', async () => {
    mockRoute.query = { tab: 'payment-details' }
    mockedFetchCabinetPaymentDetails.mockResolvedValue(paymentDetailsFixture())

    renderView()

    expect(await screen.findByText('Реквізити для оплати')).toBeInTheDocument()
    expect(bankCard().getByRole('button', { name: 'Додати IBAN' })).toBeInTheDocument()
    expect(cardCard().getByRole('button', { name: 'Додати картку' })).toBeInTheDocument()
    expect(screen.queryByText('За замовчуванням')).not.toBeInTheDocument()
  })

  it('saves bank account method without affecting card method', async () => {
    mockRoute.query = { tab: 'payment-details' }
    mockedFetchCabinetPaymentDetails.mockResolvedValue(paymentDetailsFixture())
    mockedUpdateCabinetPaymentDetails.mockResolvedValue(
      paymentDetailsFixture({
        is_configured: true,
        available_methods: ['bank_account'],
        default_method_type: 'bank_account',
        methods: {
          bank_account: {
            recipient_name: 'ФОП Тест',
            iban: 'UA111',
            card_number: '',
            bank_name: 'A-Bank',
            payment_purpose: 'Оплата',
            comment: '',
          },
        },
      })
    )

    renderView()

    await screen.findByText('Реквізити для оплати')
    await fireEvent.click(bankCard().getByRole('button', { name: 'Додати IBAN' }))
    await fireEvent.update(bankCard().getByPlaceholderText('ПІБ або назва ФОП/компанії'), 'ФОП Тест')
    await fireEvent.update(bankCard().getByPlaceholderText('UA...'), 'UA111')
    await fireEvent.update(bankCard().getByLabelText("Назва банку (необов'язково)"), 'A-Bank')
    await fireEvent.update(bankCard().getByLabelText("Призначення платежу (необов'язково)"), 'Оплата')
    await fireEvent.click(bankCard().getByRole('button', { name: 'Зберегти' }))

    await waitFor(() => {
      expect(mockedUpdateCabinetPaymentDetails).toHaveBeenCalledWith({
        methods: {
          bank_account: {
            recipient_name: 'ФОП Тест',
            iban: 'UA111',
            card_number: '',
            bank_name: 'A-Bank',
            payment_purpose: 'Оплата',
            comment: '',
          },
        },
      })
    })
    expect(await screen.findByText('UA111')).toBeInTheDocument()
    expect(cardCard().getByRole('button', { name: 'Додати картку' })).toBeInTheDocument()
  })

  it('deletes only one method and preserves second method', async () => {
    mockRoute.query = { tab: 'payment-details' }
    mockedFetchCabinetPaymentDetails.mockResolvedValue(
      paymentDetailsFixture({
        is_configured: true,
        available_methods: ['bank_account', 'card'],
        default_method_type: 'card',
        methods: {
          bank_account: {
            recipient_name: 'ФОП Тест',
            iban: 'UA111',
            card_number: '',
            bank_name: '',
            payment_purpose: '',
            comment: '',
          },
          card: {
            recipient_name: 'ФОП Тест',
            iban: '',
            card_number: '4444 3333 2222 1111',
            bank_name: '',
            payment_purpose: '',
            comment: '',
          },
        },
      })
    )
    mockedUpdateCabinetPaymentDetails.mockResolvedValue(
      paymentDetailsFixture({
        is_configured: true,
        available_methods: ['card'],
        default_method_type: 'card',
        methods: {
          card: {
            recipient_name: 'ФОП Тест',
            iban: '',
            card_number: '4444 3333 2222 1111',
            bank_name: '',
            payment_purpose: '',
            comment: '',
          },
        },
      })
    )

    renderView()

    await screen.findByText('UA111')
    await fireEvent.click(bankCard().getByRole('button', { name: 'Видалити' }))

    await waitFor(() => {
      expect(mockedUpdateCabinetPaymentDetails).toHaveBeenCalledWith({
        methods: { bank_account: null },
      })
    })
    expect(await screen.findByText('4444 3333 2222 1111')).toBeInTheDocument()
    expect(bankCard().getByRole('button', { name: 'Додати IBAN' })).toBeInTheDocument()
  })

  it('updates default method when both methods are configured', async () => {
    mockRoute.query = { tab: 'payment-details' }
    mockedFetchCabinetPaymentDetails.mockResolvedValue(
      paymentDetailsFixture({
        is_configured: true,
        available_methods: ['bank_account', 'card'],
        default_method_type: 'bank_account',
        methods: {
          bank_account: {
            recipient_name: 'ФОП Тест',
            iban: 'UA111',
            card_number: '',
            bank_name: '',
            payment_purpose: '',
            comment: '',
          },
          card: {
            recipient_name: 'ФОП Тест',
            iban: '',
            card_number: '4444 3333 2222 1111',
            bank_name: '',
            payment_purpose: '',
            comment: '',
          },
        },
      })
    )
    mockedUpdateCabinetPaymentDetails.mockResolvedValue(
      paymentDetailsFixture({
        is_configured: true,
        available_methods: ['bank_account', 'card'],
        default_method_type: 'card',
        methods: {
          bank_account: {
            recipient_name: 'ФОП Тест',
            iban: 'UA111',
            card_number: '',
            bank_name: '',
            payment_purpose: '',
            comment: '',
          },
          card: {
            recipient_name: 'ФОП Тест',
            iban: '',
            card_number: '4444 3333 2222 1111',
            bank_name: '',
            payment_purpose: '',
            comment: '',
          },
        },
      })
    )

    renderView()

    await screen.findByText('За замовчуванням')
    await fireEvent.click(screen.getByRole('radio', { name: 'Картка' }))

    await waitFor(() => {
      expect(mockedUpdateCabinetPaymentDetails).toHaveBeenCalledWith({
        default_method_type: 'card',
      })
      expect(mockToast.success).toHaveBeenCalledWith('Метод за замовчуванням оновлено.')
    })
  })

  it('supports legacy hash landing by canonically switching to query tab', async () => {
    mockRoute.hash = '#payment-details'
    mockedFetchCabinetPaymentDetails.mockResolvedValue(paymentDetailsFixture())

    renderView()

    await waitFor(() => {
      expect(mockRouter.replace).toHaveBeenCalledWith({
        path: '/cabinet/settings',
        query: { tab: 'payment-details' },
        hash: '',
      })
    })
  })
})
