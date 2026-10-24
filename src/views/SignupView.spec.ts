import { fireEvent, render, screen, waitFor } from '@testing-library/vue'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { ref, nextTick, computed, reactive } from 'vue'
import { stringifyQuery, type LocationQuery } from 'vue-router'
import { applyUiVersion } from '../lib/uiVersion'
import SignupView from './SignupView.vue'
import { RegistrationError, enableSpecialist } from '../lib/api'
import {
  clearSpecialistRegistrationAttribution,
  getSpecialistRegistrationAttribution,
} from '../lib/registrationAttribution'
import { productAnalytics } from '../lib/productAnalytics'

const routeState = reactive({ query: {} as LocationQuery })
const mockPush = vi.fn()
const mockSignup = vi.fn()
const mockLoadMe = vi.fn()
const loadingRef = ref(false)
const mockMe = ref<any>(null)
const mockUser = ref<any>(null)

vi.mock('pinia', () => ({
  storeToRefs: () => ({ loading: loadingRef }),
}))

vi.mock('vue-router', async () => ({
  ...await vi.importActual<typeof import('vue-router')>('vue-router'),
  useRouter: () => ({ push: mockPush }),
  useRoute: () => routeState,
}))

vi.mock('../stores/auth', () => ({
  useAuthStore: () => ({
    me: mockMe.value,
    user: mockUser.value,
    signup: mockSignup,
    loadMe: mockLoadMe,
  }),
}))

vi.mock('../lib/api', async () => {
  const actual = await vi.importActual<typeof import('../lib/api')>('../lib/api')
  return {
    ...actual,
    enableSpecialist: vi.fn(),
    getApiErrorMessage: vi.fn((_err: unknown, fallback: string) => fallback),
  }
})

vi.mock('../lib/registrationAttribution', () => ({
  clearSpecialistRegistrationAttribution: vi.fn(),
  getSpecialistRegistrationAttribution: vi.fn(),
}))

vi.mock('../lib/productAnalytics', () => ({
  productAnalytics: {
    capture: vi.fn(),
  },
}))

const mockedEnableSpecialist = vi.mocked(enableSpecialist)
const mockedClearSpecialistRegistrationAttribution = vi.mocked(clearSpecialistRegistrationAttribution)
const mockedGetSpecialistRegistrationAttribution = vi.mocked(getSpecialistRegistrationAttribution)

const accountRouterLinkStub = {
  props: ['to'],
  setup(props: any) {
    return { href: computed(() => {
      if (typeof props.to === 'string') return props.to
      const query = stringifyQuery(props.to.query ?? {})
      return props.to.path + (query ? '?' + query : '')
    }) }
  },
  template: '<a :href="href"><slot /></a>',
}

function renderView() {
  return render(SignupView, {
    global: {
      stubs: {
        RouterLink: accountRouterLinkStub,
      },
    },
  })
}

beforeEach(() => {
  applyUiVersion('v1')
  routeState.query = {}
  mockPush.mockReset()
  mockSignup.mockReset()
  mockLoadMe.mockReset()
  mockedEnableSpecialist.mockReset()
  mockedClearSpecialistRegistrationAttribution.mockReset()
  mockedGetSpecialistRegistrationAttribution.mockReturnValue({ utm_source: 'threads', first_landing_path: '/' })
  vi.mocked(productAnalytics.capture).mockReset()
  loadingRef.value = false
  mockMe.value = null
  mockUser.value = null
})

describe('SignupView dual-role enable flow', () => {
  it('uses enable-specialist flow for authenticated client-only user', async () => {
    mockMe.value = {
      user: {
        id: 11,
        username: 'client1',
        email: 'client1@example.com',
        roles: ['CLIENT'],
      },
    }
    mockedEnableSpecialist.mockResolvedValue(undefined)
    mockLoadMe.mockResolvedValue(undefined)

    renderView()

    const enableButton = screen.getByRole('button', { name: 'Увімкнути кабінет спеціаліста' })
    await fireEvent.click(enableButton)

    await waitFor(() => {
      expect(mockedEnableSpecialist).toHaveBeenCalledWith({ utm_source: 'threads', first_landing_path: '/' })
      expect(mockedClearSpecialistRegistrationAttribution).toHaveBeenCalledTimes(1)
      expect(mockLoadMe).toHaveBeenCalledTimes(1)
      expect(mockPush).toHaveBeenCalledWith('/cabinet')
      expect(productAnalytics.capture).toHaveBeenCalledWith('specialist_activated')
    })
  })

  it('shows automatic early access copy without promo-code dependency', () => {
    renderView()

    expect(screen.getByText(/Ранній доступ активується автоматично після реєстрації/)).toBeInTheDocument()
    expect(screen.getAllByText(/без промокоду/).length).toBeGreaterThan(0)
    expect(screen.getByText(/далі залишитися на Start/)).toBeInTheDocument()
    expect(screen.getByText(/розширити ліміт активних клієнтів/)).toBeInTheDocument()
    expect(screen.getByText(/Без картки/)).toBeInTheDocument()
    expect(screen.getByText(/Профіль не публікується автоматично/)).toBeInTheDocument()
    expect(screen.getByText(/Start — 0 грн/)).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Увійти' })).toHaveAttribute('href', '/login')
    expect(screen.getByRole('link', { name: 'Увійти' })).toHaveClass('auth__secondary-link')
    expect(screen.getByRole('link', { name: 'Зареєструватися як клієнт' })).toHaveAttribute(
      'href',
      '/signup-client'
    )
    expect(screen.getByRole('link', { name: 'Зареєструватися як клієнт' })).toHaveClass('auth__secondary-link')
    expect(screen.queryByLabelText('Промокод')).not.toBeInTheDocument()
    expect(screen.queryByText(/FOUNDER/)).not.toBeInTheDocument()
    expect(document.body).not.toHaveTextContent(/маркетплейс|рейтинг|гарантовано приведе клієнтів/i)
    expect(screen.queryByText(/Створіть перший слот/)).not.toBeInTheDocument()
    expect(screen.getByText('Отримуйте запити й створюйте сесії')).toBeInTheDocument()
    expect(screen.queryByText(new RegExp('Під час beta вам одразу відкривається ' + 'Pro-доступ'))).not.toBeInTheDocument()
    expect(screen.queryByText(/оплата активується|підписка Pro оплачена|платний тариф підключено/i)).not.toBeInTheDocument()
  })

  it('submits signup without promo payload', async () => {
    mockSignup.mockResolvedValue(undefined)

    renderView()

    await fireEvent.update(screen.getByLabelText('Ел. пошта'), 'specialist@example.com')
    await fireEvent.update(screen.getByLabelText('Пароль'), 'password123')
    await fireEvent.update(screen.getByLabelText('Підтвердження пароля'), 'password123')
    await fireEvent.click(screen.getByRole('button', { name: 'Створити акаунт' }))

    await waitFor(() => {
      expect(mockSignup).toHaveBeenCalledWith('specialist@example.com', 'password123', 'password123')
    })
  })

  it('records only the semantic signup form start on mount', () => {
    renderView()
    expect(productAnalytics.capture).toHaveBeenCalledWith('signup_started')
  })

  it('toggles password fields without submitting signup', async () => {
    renderView()

    const passwordInput = screen.getByLabelText('Пароль') as HTMLInputElement
    const confirmInput = screen.getByLabelText('Підтвердження пароля') as HTMLInputElement

    expect(passwordInput.type).toBe('password')
    expect(confirmInput.type).toBe('password')

    await fireEvent.click(screen.getByRole('button', { name: 'Показати пароль' }))
    expect(passwordInput.type).toBe('text')
    expect(screen.getByRole('button', { name: 'Сховати пароль' })).toBeInTheDocument()
    expect(mockSignup).not.toHaveBeenCalled()

    await fireEvent.click(screen.getByRole('button', { name: 'Показати підтвердження пароля' }))
    expect(confirmInput.type).toBe('text')
    expect(screen.getByRole('button', { name: 'Сховати підтвердження пароля' })).toBeInTheDocument()
    expect(mockSignup).not.toHaveBeenCalled()

    await fireEvent.click(screen.getByRole('button', { name: 'Сховати пароль' }))
    await fireEvent.click(screen.getByRole('button', { name: 'Сховати підтвердження пароля' }))

    expect(passwordInput.type).toBe('password')
    expect(confirmInput.type).toBe('password')
    expect(mockSignup).not.toHaveBeenCalled()
  })
})


describe('SignupView v2', () => {
  beforeEach(() => { applyUiVersion('v2') })

  async function fillValidForm() {
    await fireEvent.update(screen.getByRole('textbox', { name: /^Ім’я/ }), '  Олена  ')
    await fireEvent.click(screen.getByRole('button', { name: 'Далі' }))
    expect(mockSignup).not.toHaveBeenCalled()
    await fireEvent.click(screen.getByRole('radio', { name: 'Психологічна практика' }))
    await fireEvent.click(screen.getByRole('button', { name: 'Далі' }))
    expect(mockSignup).not.toHaveBeenCalled()
    await fireEvent.update(screen.getByLabelText('Ел. пошта'), 'specialist@example.com')
    await fireEvent.update(screen.getByLabelText('Пароль'), 'password123')
  }

  it('requires a meaningful name and canonical focus before reaching account, without creating accounts', async () => {
    const { container } = renderView()
    await fireEvent.submit(container.querySelector('form')!)
    expect(screen.getByRole('alert')).toHaveTextContent('Вкажіть ім’я.')
    await fireEvent.update(screen.getByRole('textbox', { name: /^Ім’я/ }), '\u200b')
    await fireEvent.submit(container.querySelector('form')!)
    expect(mockSignup).not.toHaveBeenCalled()
    await fireEvent.update(screen.getByRole('textbox', { name: /^Ім’я/ }), 'Олена')
    await fireEvent.submit(container.querySelector('form')!)
    expect(screen.getAllByRole('radio')).toHaveLength(6)
    await fireEvent.submit(container.querySelector('form')!)
    expect(screen.getByRole('alert')).toHaveTextContent('Оберіть напрям практики.')
    expect(mockSignup).not.toHaveBeenCalled()
  })

  it('retains values through back and UI switching and sends only v2 at final submission', async () => {
    const { container } = renderView()
    await fillValidForm()
    expect(screen.queryByLabelText('Підтвердження пароля')).toBeNull()
    await fireEvent.click(screen.getByRole('button', { name: 'Назад' }))
    expect(screen.getByRole('radio', { name: 'Психологічна практика' })).toBeChecked()
    await fireEvent.click(screen.getByRole('button', { name: 'Назад' }))
    expect(screen.getByRole('textbox', { name: /^Ім’я/ })).toHaveValue('  Олена  ')
    applyUiVersion('v1'); await nextTick()
    expect(screen.getByLabelText('Ел. пошта')).toHaveValue('specialist@example.com')
    expect(screen.getByLabelText('Пароль')).toHaveValue('password123')
    expect(screen.getByLabelText('Підтвердження пароля')).toBeInTheDocument()
    applyUiVersion('v2'); await nextTick()
    await fireEvent.submit(container.querySelector('form')!)
    await fireEvent.submit(container.querySelector('form')!)
    await fireEvent.submit(container.querySelector('form')!)
    expect(mockSignup).toHaveBeenCalledWith('specialist@example.com', 'password123', undefined, { registration_contract_version: 2, first_name: 'Олена', professional_focus: 'psychological_practice' })
    await waitFor(() => expect(mockPush).toHaveBeenCalledWith('/cabinet'))
    expect(productAnalytics.capture).toHaveBeenCalledTimes(1)
  })

  it('guards duplicate final submissions even when UI changes during the request', async () => {
    let complete!: () => void
    mockSignup.mockImplementationOnce(() => new Promise<void>(resolve => { complete = resolve }))
    const { container } = renderView()
    await fillValidForm()
    await fireEvent.submit(container.querySelector('form')!)
    expect(screen.getByRole('button', { name: 'Створення акаунта...' })).toBeDisabled()
    await fireEvent.submit(container.querySelector('form')!)
    applyUiVersion('v1'); await nextTick()
    await fireEvent.submit(container.querySelector('form')!)
    expect(mockSignup).toHaveBeenCalledTimes(1)
    complete()
    await waitFor(() => expect(mockPush).toHaveBeenCalledWith('/cabinet'))
  })

  it.each(['first_name', 'professional_focus'] as const)('returns server %s errors to their step and allows recovery', async field => {
    mockSignup.mockRejectedValueOnce(new RegistrationError('Server validation', { [field]: 'Invalid field' }))
    const { container } = renderView()
    await fillValidForm()
    await fireEvent.submit(container.querySelector('form')!)
    await waitFor(() => expect(screen.getByText('Invalid field')).toBeInTheDocument())
    expect(container.querySelector('[aria-invalid="true"]')).toBeInTheDocument()
    expect(mockPush).not.toHaveBeenCalled()
    await waitFor(() => expect(container.querySelector('button[type="submit"]')).not.toBeDisabled())
    if (field === 'first_name') await fireEvent.submit(container.querySelector('form')!)
    await fireEvent.submit(container.querySelector('form')!)
    expect(screen.getByLabelText('Пароль')).toHaveValue('password123')
    await fireEvent.submit(container.querySelector('form')!)
    await waitFor(() => expect(mockPush).toHaveBeenCalledWith('/cabinet'))
  })

  it.each([400, 429, 500])('retains account fields and enables retry for status %s', async status => {
    mockSignup.mockRejectedValueOnce(new Error(`HTTP ${status}`))
    const { container } = renderView()
    await fillValidForm()
    await fireEvent.submit(container.querySelector('form')!)
    await waitFor(() => expect(screen.getByRole('alert')).toHaveTextContent(`HTTP ${status}`))
    expect(screen.getByLabelText('Ел. пошта')).toHaveValue('specialist@example.com')
    expect(screen.getByRole('button', { name: 'Створити акаунт' })).not.toBeDisabled()
    await fireEvent.submit(container.querySelector('form')!)
    await waitFor(() => expect(mockPush).toHaveBeenCalledWith('/cabinet'))
  })

  it('keeps the password toggle and autocomplete without confirmation in v2', async () => {
    renderView()
    await fillValidForm()
    await fireEvent.click(screen.getByRole('button', { name: 'Показати пароль' }))
    expect(screen.getByLabelText('Пароль')).toHaveAttribute('type', 'text')
    expect(screen.getByLabelText('Пароль')).toHaveAttribute('autocomplete', 'new-password')
    expect(screen.queryByLabelText('Підтвердження пароля')).toBeNull()
    expect(mockSignup).not.toHaveBeenCalled()
  })

  it('guards duplicate client activation and retains attribution, analytics and redirect', async () => {
    mockMe.value = { user: { roles: ['CLIENT'] } }
    let complete!: () => void
    mockedEnableSpecialist.mockImplementationOnce(() => new Promise<void>((resolve) => { complete = resolve }))
    const { container } = renderView()
    expect(container.querySelector('form')).toBeNull()
    const button = screen.getByRole('button', { name: 'Увімкнути кабінет спеціаліста' })
    await fireEvent.click(button)
    await fireEvent.click(button)
    expect(button).toBeDisabled()
    expect(mockedEnableSpecialist).toHaveBeenCalledTimes(1)
    expect(mockSignup).not.toHaveBeenCalled()
    expect(mockedClearSpecialistRegistrationAttribution).not.toHaveBeenCalled()
    complete()
    await waitFor(() => expect(mockPush).toHaveBeenCalledWith('/cabinet'))
    expect(mockedEnableSpecialist).toHaveBeenCalledWith({ utm_source: 'threads', first_landing_path: '/' })
    expect(mockLoadMe).toHaveBeenCalledTimes(1)
    expect(productAnalytics.capture).toHaveBeenCalledWith('specialist_activated')
    expect(mockedClearSpecialistRegistrationAttribution).toHaveBeenCalledTimes(1)
  })

  it('announces activation failure and permits retry without clearing attribution', async () => {
    mockUser.value = { roles: ['CLIENT'] }
    mockedEnableSpecialist.mockRejectedValueOnce(new Error('unavailable'))
    renderView()
    await fireEvent.click(screen.getByRole('button', { name: 'Увімкнути кабінет спеціаліста' }))
    await waitFor(() => expect(screen.getByRole('alert')).toHaveTextContent('Не вдалося увімкнути роль спеціаліста.'))
    expect(mockedClearSpecialistRegistrationAttribution).not.toHaveBeenCalled()
    expect(mockPush).not.toHaveBeenCalled()
    expect(screen.getByRole('button', { name: 'Увімкнути кабінет спеціаліста' })).not.toBeDisabled()
  })

  it.each([[['CLIENT', 'SPECIALIST']], [['CLIENT', 'THERAPIST']], [['SPECIALIST']], [['ADMIN']]])('preserves the existing form branch for roles %j', (roles) => {
    mockMe.value = { user: { roles } }
    const { container } = renderView()
    expect(container.querySelector('form')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Увімкнути кабінет спеціаліста' })).toBeNull()
  })
})


describe('specialist account-type navigation', () => {
  it('leaves v1 navigation unchanged and adds no selector', () => {
    renderView()
    expect(screen.queryByRole('navigation', { name: 'Тип акаунта' })).toBeNull()
    expect(screen.getByRole('link', { name: 'Зареєструватися як клієнт' })).toHaveAttribute('href', '/signup-client')
  })

  it('shows two equal choices above the fields with specialist selected', () => {
    applyUiVersion('v2')
    const { container } = renderView()
    const nav = screen.getByRole('navigation', { name: 'Тип акаунта' })
    expect(nav.querySelectorAll('a')).toHaveLength(2)
    expect(screen.getByRole('link', { name: /Я спеціаліст/ })).toHaveAttribute('aria-current', 'page')
    expect(screen.getByRole('link', { name: /Я клієнт/ })).not.toHaveAttribute('aria-current')
    expect(nav.compareDocumentPosition(container.querySelector('input')!) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
    expect(screen.queryByRole('link', { name: 'Зареєструватися як клієнт' })).toBeNull()
  })

  it('preserves supported queries and safe redirects without forwarding unknown or credential keys', () => {
    applyUiVersion('v2')
    routeState.query = { ui: 'v2', utm_source: 'source & context', utm_campaign: 'campaign', redirect: '/client/invite/local-fixture?from=1#context', password: 'not-forwarded', token: 'not-forwarded', unknown: 'discard', utm_term: ['a', 'b'] }
    renderView()
    const href = screen.getByRole('link', { name: /Я клієнт/ }).getAttribute('href')!
    const url = new URL(href, 'http://localhost')
    expect(url.pathname).toBe('/signup-client')
    expect(Object.fromEntries(url.searchParams)).toEqual({ ui: 'v2', utm_source: 'source & context', utm_campaign: 'campaign', redirect: '/client/invite/local-fixture?from=1#context' })
  })

  it.each(['https://example.test', '//example.test', '/\\example.test', '/client/\u0001invalid'])('does not forward an unsafe selector redirect %j', (redirect) => {
    applyUiVersion('v2')
    routeState.query = { redirect }
    renderView()
    expect(screen.getByRole('link', { name: /Я клієнт/ })).toHaveAttribute('href', '/signup-client?ui=v2')
  })
})
