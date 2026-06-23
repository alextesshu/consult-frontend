import { cleanup, fireEvent, render, screen } from '@testing-library/vue'
import { createPinia, setActivePinia } from 'pinia'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { reactive } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { fetchMe, loginWithIdentifier } from '../lib/api'
import LoginView from './LoginView.vue'

vi.mock('../lib/api', () => ({
  fetchMe: vi.fn(),
  loginWithIdentifier: vi.fn(),
  logoutSession: vi.fn(),
  refreshToken: vi.fn(),
  signupClient: vi.fn(),
  signupSpecialist: vi.fn(),
}))

vi.mock('vue-router', () => ({
  RouterLink: {
    props: ['to'],
    template: '<a><slot /></a>',
  },
  useRoute: vi.fn(),
  useRouter: vi.fn(),
}))

const mockedUseRoute = vi.mocked(useRoute)
const mockedUseRouter = vi.mocked(useRouter)
const mockedFetchMe = vi.mocked(fetchMe)
const mockedLoginWithIdentifier = vi.mocked(loginWithIdentifier)
const routeState = reactive({ query: {} as Record<string, string> })
const invalidCredentialsMessage = 'Не вдалося увійти з цими даними. Перевірте електронну пошту та пароль.'

function renderView() {
  const pinia = createPinia()
  setActivePinia(pinia)
  render(LoginView, {
    global: {
      plugins: [pinia],
      stubs: {
        RouterLink: {
          props: ['to'],
          template: '<a><slot /></a>',
        },
      },
    },
  })
}

describe('LoginView', () => {
  beforeEach(() => {
    cleanup()
    routeState.query = {}
    vi.clearAllMocks()
    mockedUseRoute.mockReturnValue(routeState as any)
    mockedUseRouter.mockReturnValue({ push: vi.fn(), replace: vi.fn() } as any)
  })

  it('shows invite-context notice when redirect points to client invite', async () => {
    routeState.query = { redirect: '/client/invite/token-123' }
    renderView()

    expect(
      await screen.findByText(
        'Ви відкрили запрошення до акаунта клієнта. Увійдіть, щоб продовжити підключення до клієнтської картки.'
      )
    ).toBeInTheDocument()
  })

  it('does not show invite-context notice for regular login', () => {
    routeState.query = { redirect: '/cabinet' }
    renderView()

    expect(
      screen.queryByText(
        'Ви відкрили запрошення до акаунта клієнта. Увійдіть, щоб продовжити підключення до клієнтської картки.'
      )
    ).not.toBeInTheDocument()
  })

  it('maps invalid credentials errors to a generic Ukrainian message', async () => {
    mockedLoginWithIdentifier.mockRejectedValueOnce(
      new Error('No active account found with the given credentials')
    )
    renderView()

    await fireEvent.update(screen.getByLabelText('Ел. пошта або логін'), 'wrong@example.com')
    await fireEvent.update(screen.getByLabelText('Пароль'), 'wrong-password')
    await fireEvent.click(screen.getByRole('button', { name: 'Продовжити' }))

    expect(await screen.findByText(invalidCredentialsMessage)).toBeInTheDocument()
    expect(mockedFetchMe).not.toHaveBeenCalled()
  })

  it('maps similar provided-credentials errors to the same generic message', async () => {
    mockedLoginWithIdentifier.mockRejectedValueOnce(
      new Error('Unable to log in with provided credentials.')
    )
    renderView()

    await fireEvent.update(screen.getByLabelText('Ел. пошта або логін'), 'wrong@example.com')
    await fireEvent.update(screen.getByLabelText('Пароль'), 'wrong-password')
    await fireEvent.click(screen.getByRole('button', { name: 'Продовжити' }))

    expect(await screen.findByText(invalidCredentialsMessage)).toBeInTheDocument()
  })

  it('maps Ukrainian invalid account-data errors to the same generic message', async () => {
    mockedLoginWithIdentifier.mockRejectedValueOnce(
      new Error('detail: Невірні облікові дані.')
    )
    renderView()

    await fireEvent.update(screen.getByLabelText('Ел. пошта або логін'), 'wrong@example.com')
    await fireEvent.update(screen.getByLabelText('Пароль'), 'wrong-password')
    await fireEvent.click(screen.getByRole('button', { name: 'Продовжити' }))

    expect(await screen.findByText(invalidCredentialsMessage)).toBeInTheDocument()
  })

  it('toggles password visibility without submitting the form', async () => {
    renderView()

    const passwordInput = screen.getByLabelText('Пароль') as HTMLInputElement
    expect(passwordInput.type).toBe('password')

    await fireEvent.click(screen.getByRole('button', { name: 'Показати пароль' }))

    expect(passwordInput.type).toBe('text')
    expect(screen.getByRole('button', { name: 'Сховати пароль' })).toBeInTheDocument()
    expect(mockedLoginWithIdentifier).not.toHaveBeenCalled()

    await fireEvent.click(screen.getByRole('button', { name: 'Сховати пароль' }))

    expect(passwordInput.type).toBe('password')
    expect(screen.getByRole('button', { name: 'Показати пароль' })).toBeInTheDocument()
    expect(mockedLoginWithIdentifier).not.toHaveBeenCalled()
  })
})
