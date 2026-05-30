import { fireEvent, render, screen, waitFor, within } from '@testing-library/vue'
import { createPinia, setActivePinia } from 'pinia'
import { createMemoryHistory, createRouter } from 'vue-router'
import { describe, expect, it } from 'vitest'
import HomeView from './HomeView.vue'
import { useAuthStore } from '../stores/auth'

async function renderHome(options?: { authenticated?: boolean; roles?: string[] }) {
  const routes = [
    { path: '/', component: HomeView },
    { path: '/signup', component: { template: '<div>Signup</div>' } },
    { path: '/pricing', component: { template: '<div>Pricing</div>' } },
    { path: '/support-and-data-requests', component: { template: '<div>Support</div>' } },
    { path: '/cabinet', component: { template: '<div>Cabinet</div>' } },
    { path: '/client', component: { template: '<div>Client</div>' } },
    { path: '/login', component: { template: '<div>Login</div>' } },
  ]

  const router = createRouter({
    history: createMemoryHistory(),
    routes,
  })

  const pinia = createPinia()
  setActivePinia(pinia)

  if (options?.authenticated) {
    const auth = useAuthStore()
    auth.accessToken = 'token'
    auth.setMe({
      user: {
        id: 1,
        username: 'specialist',
        email: 'specialist@example.com',
        roles: options.roles ?? ['SPECIALIST'],
      },
      access_state: null,
      effective_entitlements: null,
      counts: null,
      server_time: '2026-05-05T08:00:00Z',
    })
  }

  await router.push('/')
  await router.isReady()

  const result = render(HomeView, {
    global: {
      plugins: [pinia, router],
    },
  })

  return { router, ...result }
}

describe('HomeView', () => {
  it('renders simplified hero with primary value and trust markers', async () => {
    await renderHome()

    expect(screen.getByText('ДЛЯ СПЕЦІАЛІСТІВ ПРИВАТНОЇ ПРАКТИКИ')).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Простір для ведення консультацій' })).toBeInTheDocument()
    expect(
      screen.getByText(/Публічний профіль, сесії, календар, власний блог та багато іншого/)
    ).toBeInTheDocument()
    expect(screen.getByText(/приймати клієнтів і працювати системно/)).toBeInTheDocument()
    const heroTrust = screen.getByRole('list', { name: 'Переваги платформи' })
    expect(within(heroTrust).getByText('Публічний профіль')).toBeInTheDocument()
    expect(within(heroTrust).getByText('Запити без реєстрації')).toBeInTheDocument()
    expect(within(heroTrust).getByText('Власний блог')).toBeInTheDocument()
    expect(screen.getByText('Мій кабінет')).toBeInTheDocument()
    expect(screen.getByText('Останні запити')).toBeInTheDocument()
    expect(screen.getByText('Новий запит')).toBeInTheDocument()
    expect(screen.getAllByText('15:00').length).toBeGreaterThan(0)
    expect(screen.getByText('консультація з клієнтом')).toBeInTheDocument()
    expect(screen.getAllByRole('link', { name: 'Створити свій простір' }).length).toBeGreaterThan(0)
  })

  it('switches pricing values for yearly billing', async () => {
    await renderHome()

    expect(screen.getByText('990 грн/міс')).toBeInTheDocument()
    expect(screen.getByText('2 490 грн/міс')).toBeInTheDocument()

    await fireEvent.click(screen.getByRole('button', { name: 'Рік' }))

    expect(screen.getByText('9 900 грн/рік')).toBeInTheDocument()
    expect(screen.getByText('24 900 грн/рік')).toBeInTheDocument()
  })

  it('routes authenticated primary cta to cabinet', async () => {
    const { router } = await renderHome({ authenticated: true, roles: ['SPECIALIST'] })

    const cabinetButtons = screen.getAllByRole('button', { name: 'Перейти в кабінет' })
    expect(cabinetButtons.length).toBeGreaterThan(0)

    await fireEvent.click(cabinetButtons[0] as HTMLElement)

    await waitFor(() => {
      expect(router.currentRoute.value.fullPath).toBe('/cabinet')
    })
  })
})
