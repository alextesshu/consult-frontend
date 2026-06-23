import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/vue'
import { createPinia, setActivePinia } from 'pinia'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { reactive } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'
import ClientSignupView from './ClientSignupView.vue'

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
const routeState = reactive({ query: {} as Record<string, string> })
const routerPush = vi.fn()

function renderView() {
  const pinia = createPinia()
  setActivePinia(pinia)
  const auth = useAuthStore()
  vi.spyOn(auth, 'signupClient').mockResolvedValue(undefined)

  const utils = render(ClientSignupView, {
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

  return { ...utils, auth }
}

async function submitSignup(container: Element) {
  await fireEvent.update(container.querySelector('input[name="email"]') as HTMLInputElement, 'client@example.com')
  await fireEvent.update(container.querySelector('input[name="password"]') as HTMLInputElement, 'password123')
  await fireEvent.update(container.querySelector('input[name="password_confirm"]') as HTMLInputElement, 'password123')
  await fireEvent.submit(container.querySelector('form') as HTMLFormElement)
}

describe('ClientSignupView', () => {
  beforeEach(() => {
    cleanup()
    routeState.query = {}
    routerPush.mockReset()
    mockedUseRoute.mockReturnValue(routeState as any)
    mockedUseRouter.mockReturnValue({ push: routerPush } as any)
  })

  it('honors safe redirect after client signup', async () => {
    routeState.query = { redirect: '/client/invite/token-123' }
    const { container, auth } = renderView()

    await submitSignup(container)

    await waitFor(() => {
      expect(auth.signupClient).toHaveBeenCalledWith('client@example.com', 'password123', 'password123')
      expect(routerPush).toHaveBeenCalledWith('/client/invite/token-123')
    })
  })

  it('falls back to client dashboard for unsafe redirect', async () => {
    routeState.query = { redirect: '//evil.com/path' }
    const { container } = renderView()

    await submitSignup(container)

    await waitFor(() => {
      expect(routerPush).toHaveBeenCalledWith('/client')
    })
  })

  it('shows invite-context notice when redirect points to client invite', async () => {
    routeState.query = { redirect: '/client/invite/token-123' }
    renderView()

    expect(
      await screen.findByText(
        'Ви створюєте акаунт клієнта за запрошенням спеціаліста. Після реєстрації ви зможете підтвердити підключення до клієнтської картки.'
      )
    ).toBeInTheDocument()
  })

  it('does not show invite-context notice for regular signup', async () => {
    routeState.query = {}
    renderView()

    expect(
      screen.queryByText(
        'Ви створюєте акаунт клієнта за запрошенням спеціаліста. Після реєстрації ви зможете підтвердити підключення до клієнтської картки.'
      )
    ).not.toBeInTheDocument()
  })

  it('toggles password fields without submitting signup', async () => {
    const { auth } = renderView()

    const passwordInput = screen.getByLabelText('Пароль') as HTMLInputElement
    const confirmInput = screen.getByLabelText('Підтвердження пароля') as HTMLInputElement

    expect(passwordInput.type).toBe('password')
    expect(confirmInput.type).toBe('password')

    await fireEvent.click(screen.getByRole('button', { name: 'Показати пароль' }))
    expect(passwordInput.type).toBe('text')
    expect(screen.getByRole('button', { name: 'Сховати пароль' })).toBeInTheDocument()
    expect(auth.signupClient).not.toHaveBeenCalled()

    await fireEvent.click(screen.getByRole('button', { name: 'Показати підтвердження пароля' }))
    expect(confirmInput.type).toBe('text')
    expect(screen.getByRole('button', { name: 'Сховати підтвердження пароля' })).toBeInTheDocument()
    expect(auth.signupClient).not.toHaveBeenCalled()

    await fireEvent.click(screen.getByRole('button', { name: 'Сховати пароль' }))
    await fireEvent.click(screen.getByRole('button', { name: 'Сховати підтвердження пароля' }))

    expect(passwordInput.type).toBe('password')
    expect(confirmInput.type).toBe('password')
    expect(auth.signupClient).not.toHaveBeenCalled()
  })
})
