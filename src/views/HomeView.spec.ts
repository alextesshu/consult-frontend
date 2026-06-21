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
    { path: '/specialists', component: { template: '<div>Specialist Search</div>' } },
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
  it('renders the polished homepage with the rich hero composition', async () => {
    const { container } = await renderHome()

    expect(
      screen.getByRole('heading', {
        name: 'Консультаційна практика — в одному спокійному просторі',
      })
    ).toBeInTheDocument()
    expect(screen.getByText(/Pro Consult допомагає спеціалісту презентувати себе клієнтам/)).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Подивитися тарифи' })).toHaveAttribute('href', '#pricing')

    expect(screen.getByText('Кабінет спеціаліста')).toBeInTheDocument()
    expect(screen.getByText('Нових запитів')).toBeInTheDocument()
    expect(screen.getByText('Сесій цього тижня')).toBeInTheDocument()
    expect(screen.getByText('Клієнтів')).toBeInTheDocument()
    const heroStats = Array.from(container.querySelectorAll('.product-story__stat'))
    const weekSessionsStat = heroStats.find((stat) => stat.textContent?.includes('Сесій цього тижня'))
    const activeClientsStat = heroStats.find((stat) => stat.textContent?.includes('Клієнтів'))
    expect(weekSessionsStat).toHaveTextContent('8')
    expect(weekSessionsStat).toHaveTextContent('заплановано')
    expect(activeClientsStat).toHaveTextContent('12')
    expect(activeClientsStat).toHaveTextContent('активних')
    expect(screen.getByText('Останні запити')).toBeInTheDocument()
    expect(screen.getAllByText('Олена Коваль').length).toBeGreaterThan(0)
    expect(screen.getByText('12 років досвіду')).toBeInTheDocument()
    expect(screen.getByText('Новий запит')).toBeInTheDocument()
    expect(screen.getAllByText('15:00').length).toBeGreaterThan(0)
    expect(screen.getByText('Консультація з клієнтом')).toBeInTheDocument()
    expect(screen.getByText('Підтверджено')).toBeInTheDocument()

    expect(
      screen.getByText(
        /Для клієнтів: якщо ви знаєте імʼя спеціаліста або маєте частину посилання, знайдіть його публічний профіль/
      )
    ).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Знайти профіль спеціаліста' })).toHaveAttribute(
      'href',
      '/specialists'
    )
    expect(
      screen.getByRole('heading', {
        name: 'Профіль для презентації себе і робочий кабінет для розвитку практики',
      })
    ).toBeInTheDocument()
    expect(screen.getByText('Звернення від клієнтів')).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Блог, який допомагає пояснити ваш підхід' })).toBeInTheDocument()
    expect(screen.getByText(/Не кожен клієнт готовий одразу написати спеціалісту/)).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Тарифи' })).toBeInTheDocument()
    expect(screen.getByText(/Без комісій з консультацій. Ви сплачуєте за користування сервісом/)).toBeInTheDocument()
    expect(screen.getByText('3 активні клієнти включено')).toBeInTheDocument()
    expect(screen.getByText('Можна розширити ліміт до 6 клієнтів')).toBeInTheDocument()
    expect(screen.getAllByText('+1 активний клієнт — 200 грн/міс').length).toBeGreaterThan(0)
    expect(screen.getByText('20 активних клієнтів включено')).toBeInTheDocument()
    expect(screen.getByText('Можна розширити ліміт до 26 клієнтів')).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Відкритий ранній доступ' })).toBeInTheDocument()
    expect(screen.getByText(/Ранній доступ активується автоматично після реєстрації/)).toBeInTheDocument()
    expect(screen.getByText(/розширені можливості без промокоду/)).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Створити профіль' })).toHaveAttribute(
      'href',
      '/signup'
    )
    expect(container).not.toHaveTextContent('FOUNDER')
    expect(screen.queryByText('До 3 ' + 'активних клієнтів')).not.toBeInTheDocument()
    expect(screen.queryByText('Максимум 6 ' + 'активних клієнтів на Start')).not.toBeInTheDocument()
    expect(screen.queryByText('До 20 ' + 'активних клієнтів')).not.toBeInTheDocument()
    expect(screen.queryByText('Максимум 27 ' + 'активних клієнтів на PRO')).not.toBeInTheDocument()
    expect(screen.getAllByRole('link', { name: 'Створити свій простір' }).length).toBeGreaterThan(0)
  })

  it('does not render removed duplicate homepage sections or forbidden wording', async () => {
    const { container } = await renderHome()

    expect(screen.queryByText('Можливості простору')).not.toBeInTheDocument()
    expect(screen.queryByText('Сценарій роботи')).not.toBeInTheDocument()
    expect(screen.queryByText('Власна присутність')).not.toBeInTheDocument()
    expect(screen.queryByText('Що всередині')).not.toBeInTheDocument()
    expect(screen.queryByText('Від першого запиту до сесії в календарі')).not.toBeInTheDocument()
    expect(screen.queryByText('Не просто сайт-візитка')).not.toBeInTheDocument()
    expect(screen.queryByText('Інструменти, які підтримують консультаційну роботу')).not.toBeInTheDocument()
    expect(screen.queryByText('Власний профіль без залежності від зовнішнього майданчика')).not.toBeInTheDocument()
    expect(screen.queryByText(/Оберіть формат доступу для своєї практики/)).not.toBeInTheDocument()
    expect(screen.queryByText(/Створіть простір, у якому вашу роботу легко зрозуміти/)).not.toBeInTheDocument()
    expect(screen.queryByText('Знайти спеціаліста')).not.toBeInTheDocument()
    expect(container).not.toHaveTextContent(/присутність/i)
  })

  it('keeps the final homepage cta to one primary action', async () => {
    const { container } = await renderHome()
    const finalCta = container.querySelector('.final-cta') as HTMLElement

    expect(finalCta).toBeInTheDocument()
    expect(within(finalCta).getByRole('link', { name: 'Створити свій простір' })).toHaveAttribute(
      'href',
      '/signup'
    )
    expect(within(finalCta).queryByRole('link', { name: 'Переглянути тарифи' })).not.toBeInTheDocument()
    expect(within(finalCta).queryByRole('link', { name: 'Подивитися тарифи' })).not.toBeInTheDocument()
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
    const { container, router } = await renderHome({ authenticated: true, roles: ['SPECIALIST'] })
    const hero = container.querySelector('.home-hero') as HTMLElement

    const heroButton = within(hero).getByRole('button', { name: /Створити свій простір/ })

    await fireEvent.click(heroButton)

    await waitFor(() => {
      expect(router.currentRoute.value.fullPath).toBe('/cabinet')
    })
  })
})
