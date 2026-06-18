import { fireEvent, render, screen, waitFor } from '@testing-library/vue'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { ref } from 'vue'
import SignupView from './SignupView.vue'
import { enableSpecialist } from '../lib/api'

const mockPush = vi.fn()
const mockSignup = vi.fn()
const mockLoadMe = vi.fn()
const loadingRef = ref(false)
const mockMe = ref<any>(null)
const mockUser = ref<any>(null)
const mockRouteQuery = ref<Record<string, string>>({})

vi.mock('pinia', () => ({
  storeToRefs: () => ({ loading: loadingRef }),
}))

vi.mock('vue-router', () => ({
  useRouter: () => ({ push: mockPush }),
  useRoute: () => ({ query: mockRouteQuery.value }),
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

const mockedEnableSpecialist = vi.mocked(enableSpecialist)

function renderView() {
  return render(SignupView, {
    global: {
      stubs: {
        RouterLink: {
          template: '<a><slot /></a>',
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
    loadingRef.value = false
    mockMe.value = null
    mockUser.value = null
    mockRouteQuery.value = {}
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
      expect(mockedEnableSpecialist).toHaveBeenCalledTimes(1)
      expect(mockLoadMe).toHaveBeenCalledTimes(1)
      expect(mockPush).toHaveBeenCalledWith('/cabinet')
    })
  })

  it('shows Founder Access signup copy without automatic beta wording', () => {
    renderView()

    expect(screen.getByText(/можна використати промокод FOUNDER/)).toBeInTheDocument()
    expect(screen.getAllByText(/1 місяць PRO-доступу без оплати/).length).toBeGreaterThan(0)
    expect(screen.getByText(/Після пробного періоду можна залишитися на Start/)).toBeInTheDocument()
    expect(screen.getByText(/розширити ліміт активних клієнтів/)).toBeInTheDocument()
    expect(screen.getByLabelText('Промокод')).toBeInTheDocument()
    expect(screen.queryByText(new RegExp('Під час beta вам одразу відкривається ' + 'Pro-доступ'))).not.toBeInTheDocument()
    expect(screen.queryByText(/оплата активується|підписка Pro оплачена|платний тариф підключено/i)).not.toBeInTheDocument()
  })

  it('prefills Founder promo from query without changing signup payload', async () => {
    mockRouteQuery.value = { promo: 'FOUNDER' }
    mockSignup.mockResolvedValue(undefined)

    renderView()

    expect(screen.getByLabelText('Промокод')).toHaveValue('FOUNDER')

    await fireEvent.update(screen.getByLabelText('Ел. пошта'), 'specialist@example.com')
    await fireEvent.update(screen.getByLabelText('Пароль'), 'password123')
    await fireEvent.update(screen.getByLabelText('Підтвердження пароля'), 'password123')
    await fireEvent.click(screen.getByRole('button', { name: 'Створити акаунт' }))

    await waitFor(() => {
      expect(mockSignup).toHaveBeenCalledWith('specialist@example.com', 'password123', 'password123')
    })
  })
})
