import { fireEvent, render, screen, waitFor } from '@testing-library/vue'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { ref } from 'vue'
import SignupView from './SignupView.vue'
import { enableSpecialist } from '../lib/api'
import {
  clearSpecialistRegistrationAttribution,
  getSpecialistRegistrationAttribution,
} from '../lib/registrationAttribution'

const mockPush = vi.fn()
const mockSignup = vi.fn()
const mockLoadMe = vi.fn()
const loadingRef = ref(false)
const mockMe = ref<any>(null)
const mockUser = ref<any>(null)

vi.mock('pinia', () => ({
  storeToRefs: () => ({ loading: loadingRef }),
}))

vi.mock('vue-router', () => ({
  useRouter: () => ({ push: mockPush }),
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

const mockedEnableSpecialist = vi.mocked(enableSpecialist)
const mockedClearSpecialistRegistrationAttribution = vi.mocked(clearSpecialistRegistrationAttribution)
const mockedGetSpecialistRegistrationAttribution = vi.mocked(getSpecialistRegistrationAttribution)

function renderView() {
  return render(SignupView, {
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

describe('SignupView dual-role enable flow', () => {
  beforeEach(() => {
    mockPush.mockReset()
    mockSignup.mockReset()
    mockLoadMe.mockReset()
    mockedEnableSpecialist.mockReset()
    mockedClearSpecialistRegistrationAttribution.mockReset()
    mockedGetSpecialistRegistrationAttribution.mockReturnValue({ utm_source: 'threads', first_landing_path: '/' })
    loadingRef.value = false
    mockMe.value = null
    mockUser.value = null
  })

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
