import { cleanup, fireEvent, render, waitFor } from '@testing-library/vue'
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
})
