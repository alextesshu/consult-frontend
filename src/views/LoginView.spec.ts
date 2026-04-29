import { cleanup, render, screen } from '@testing-library/vue'
import { createPinia, setActivePinia } from 'pinia'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { reactive } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import LoginView from './LoginView.vue'

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
})
