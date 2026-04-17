import { fireEvent, render, screen, waitFor, within } from '@testing-library/vue'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { reactive } from 'vue'
import SettingsHubView from './SettingsHubView.vue'
import { fetchCabinetPaymentDetails, updateCabinetPaymentDetails } from '../lib/api'

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
  fetchCabinetPaymentDetails: vi.fn(),
  updateCabinetPaymentDetails: vi.fn(),
  getApiErrorMessage: vi.fn((err: any, fallback: string) => err?.response?.data?.detail || fallback),
}))

const mockedFetchCabinetPaymentDetails = vi.mocked(fetchCabinetPaymentDetails)
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
    mockedUpdateCabinetPaymentDetails.mockReset()
    mockToast.show.mockReset()
    mockToast.success.mockReset()
    mockToast.error.mockReset()
    mockToast.warning.mockReset()
    mockToast.info.mockReset()
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

    expect(screen.getByRole('link', { name: 'Реквізити' })).toBeInTheDocument()
    expect(screen.queryByText('Реквізити для оплати')).not.toBeInTheDocument()
    expect(mockedFetchCabinetPaymentDetails).not.toHaveBeenCalled()
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
