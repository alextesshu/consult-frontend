import { fireEvent, render, screen, waitFor, within } from '@testing-library/vue'
import { createPinia, setActivePinia } from 'pinia'
import { createMemoryHistory, createRouter } from 'vue-router'
import { describe, expect, it, vi } from 'vitest'
import HomeView from './HomeView.vue'
import { useAuthStore } from '../stores/auth'
import { productAnalytics } from '../lib/productAnalytics'

vi.mock('../lib/productAnalytics', () => ({
  productAnalytics: { capture: vi.fn(), initialize: vi.fn(), identify: vi.fn(), reset: vi.fn() },
}))

async function renderHome(options?: { authenticated?: boolean; roles?: string[] }) {
  const routes = [
    { path: '/', component: HomeView },
    { path: '/signup', component: { template: '<div>Signup</div>' } },
    { path: '/s/:slug', component: { template: '<div>Public Profile</div>' } },
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
  it('captures the client discovery CTA once without properties', async () => {
    const { container } = await renderHome()
    const hero = container.querySelector('.home-hero') as HTMLElement
    const heroCta = within(hero).getByRole('link', { name: 'Знайти спеціаліста' })
    const clientEntryCta = container.querySelector('.client-entry-section a[href="/specialists"]') as HTMLAnchorElement

    expect(clientEntryCta).toBeInTheDocument()
    await fireEvent.click(heroCta)
    await fireEvent.click(clientEntryCta)

    expect(productAnalytics.capture).toHaveBeenCalledTimes(1)
    expect(productAnalytics.capture).toHaveBeenCalledWith('client_entry_cta_clicked')
  })

  it('renders the polished homepage with the rich hero composition', async () => {
    const { container } = await renderHome()

    expect(
      screen.getByRole('heading', {
        name: 'Консультаційна практика — в одному спокійному просторі',
      })
    ).toBeInTheDocument()
    expect(
      screen.getByText(
        'Професійно представте себе, отримуйте звернення від клієнтів і ведіть регулярну консультаційну практику — сесії, календар, клієнтів, матеріали та щоденну роботу в одному місці.'
      )
    ).toBeInTheDocument()
    expect(screen.getByText('Прямий контакт із клієнтом')).toBeInTheDocument()
    expect(screen.getByText('Без рейтингів')).toBeInTheDocument()
    expect(container).not.toHaveTextContent('Без платного просування у пошуку')
    const hero = container.querySelector('.home-hero') as HTMLElement
    const principlesLine = hero.querySelector('.home-hero__principles') as HTMLElement
    expect(principlesLine).toHaveAttribute('aria-label', 'Принципи Pro Consult')
    expect(principlesLine).toHaveTextContent(
      /Прямий контакт із клієнтом.*·.*Без комісій з консультацій.*Без рейтингів/
    )
    expect(within(hero).getByRole('link', { name: 'Створити свій простір' })).toHaveAttribute(
      'href',
      '/signup'
    )
    expect(within(hero).getByRole('link', { name: 'Знайти спеціаліста' })).toHaveAttribute(
      'href',
      '/specialists'
    )
    expect(hero.querySelector('.home-hero__client-path')).not.toBeInTheDocument()
    expect(container.querySelector('.home-hero a[href="/tour"]')).not.toBeInTheDocument()
    const clientEntry = container.querySelector('.client-entry-section') as HTMLElement
    expect(within(clientEntry).getByRole('heading', { name: 'Шукаєте спеціаліста?' })).toBeInTheDocument()
    expect(
      within(clientEntry).getByText(
        'Опишіть свій запит або оберіть напрям, перегляньте професійні сторінки й зверніться напряму до спеціаліста, який вам підходить.'
      )
    ).toBeInTheDocument()
    expect(within(clientEntry).getByText("Без обов'язкової реєстрації для першого звернення.")).toBeInTheDocument()
    expect(within(clientEntry).getByRole('link', { name: 'Знайти спеціаліста' })).toHaveAttribute(
      'href',
      '/specialists'
    )

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
      screen.getByRole('heading', {
        name: 'Дві сторони одного професійного простору',
      })
    ).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Звернення без реєстрації' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Дайте клієнту можливість познайомитися з вами до консультації' })).toBeInTheDocument()
    expect(screen.getByText('Не кожен готовий звернутися одразу.')).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Від першого знайомства — до регулярної роботи' })).toBeInTheDocument()
    expect(
      screen.getByText('Pro Consult поєднує вашу професійну сторінку з робочим простором для регулярної консультаційної практики.')
    ).toBeInTheDocument()
    expect(screen.getAllByText('Без комісій з консультацій').length).toBeGreaterThan(0)
    expect(screen.getByText('Діліться сторінкою у своїх каналах')).toBeInTheDocument()
    expect(screen.getByText('Клієнт може звернутися без реєстрації')).toBeInTheDocument()
    expect(screen.getByText('Ви самі вирішуєте, коли публікувати сторінку')).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Тарифи' })).toBeInTheDocument()
    expect(
      screen.getByText(
        /Start — для знайомства з Pro Consult і невеликої практики.*Pro — для регулярної роботи з більшою кількістю клієнтів/s
      )
    ).toBeInTheDocument()
    const pricing = container.querySelector('#pricing') as HTMLElement
    expect(pricing.querySelectorAll('.pricing__grid .plan-card')).toHaveLength(2)
    expect(within(pricing).getByText('0 грн')).toBeInTheDocument()
    expect(within(pricing).getByText('990 грн/міс')).toBeInTheDocument()
    expect(within(pricing).queryByText('2 490 грн/міс')).not.toBeInTheDocument()
    expect(screen.getByText('Для невеликої практики та знайомства з основними можливостями Pro Consult.')).toBeInTheDocument()
    expect(within(pricing).getByText('Професійна публічна сторінка')).toBeInTheDocument()
    expect(within(pricing).getByText('Запити від клієнтів без обов’язкової реєстрації на сайті')).toBeInTheDocument()
    expect(within(pricing).getByText('Простір для ведення сесій, календаря і ваших перших клієнтів')).toBeInTheDocument()
    expect(within(pricing).getByText('3 активні клієнти включено')).toBeInTheDocument()
    expect(within(pricing).getByText('Можна розширити ліміт до 6 клієнтів')).toBeInTheDocument()
    expect(screen.queryByText(/Можна почати без картки/)).not.toBeInTheDocument()
    expect(screen.getByText('Для регулярної приватної практики.')).toBeInTheDocument()
    expect(within(pricing).getByText('Усе зі Start')).toBeInTheDocument()
    expect(within(pricing).getByText('20 активних клієнтів включено')).toBeInTheDocument()
    expect(within(pricing).getByText('Можна розширити ліміт до 26 клієнтів')).toBeInTheDocument()
    expect(within(pricing).getByText('Власний блог')).toBeInTheDocument()
    expect(within(pricing).getByText('Матеріали й рекомендації для клієнтів')).toBeInTheDocument()
    expect(within(pricing).getByText('Розширена аналітика практики')).toBeInTheDocument()
    expect(within(pricing).getByText('Робоча дошка для кращої організації практики')).toBeInTheDocument()
    expect(within(pricing).getByText('Приватні відгуки від клієнтів')).toBeInTheDocument()
    expect(within(pricing).getByText(/Робоча дошка/)).toBeInTheDocument()
    expect(within(pricing).getByText(/Приватні відгуки/)).toBeInTheDocument()
    expect(within(pricing).queryByText(/можливістю поділитися ними/)).not.toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Потрібно більше простору для практики?' })).toBeInTheDocument()
    expect(screen.getByText(/до 60 активних клієнтів/)).toBeInTheDocument()
    expect(screen.getByText(/до 3 дошок задач/)).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Як рахуються ліміти' })).toBeInTheDocument()
    expect(screen.getByText(/Активний клієнт — це клієнт/)).toBeInTheDocument()
    expect(screen.getByText('Для Start і Pro доступне розширення ліміту активних клієнтів.')).toBeInTheDocument()
    expect(screen.queryByText(/200 грн\/міс/)).not.toBeInTheDocument()
    expect(screen.getByText('Pro Consult не бере відсоток із консультацій на жодному тарифі.')).toBeInTheDocument()
    expect(pricing).not.toHaveTextContent(/базов/i)
    expect(screen.getByRole('heading', { name: 'Відкритий ранній доступ' })).toBeInTheDocument()
    expect(screen.getByText(/Ранній доступ активується після реєстрації й дає змогу спробувати розширені можливості Pro Consult/)).toBeInTheDocument()
    expect(within(pricing).getByRole('link', { name: 'Отримати безкоштовно' })).toHaveAttribute(
      'href',
      '/signup'
    )
    expect(within(pricing).getByRole('link', { name: 'Обрати Pro' })).toHaveAttribute(
      'href',
      '/signup'
    )
    expect(within(pricing).getByRole('link', { name: 'Обговорити формат' })).toHaveAttribute(
      'href',
      '/support-and-data-requests'
    )
    expect(within(pricing).queryByRole('link', { name: 'Подати запит' })).not.toBeInTheDocument()
    expect(container).not.toHaveTextContent('FOUNDER')
    expect(container).not.toHaveTextContent(/маркетплейс|гарантовано приведе клієнтів/i)
    expect(container).not.toHaveTextContent(/ми приведемо клієнтів|гарантовані клієнти|оберіть найкращого спеціаліста/i)
    expect(container).not.toHaveTextContent(/професійної присутності|без хаосу|Більше запитів від клієнтів/i)
    expect(screen.queryByText('До 3 ' + 'активних клієнтів')).not.toBeInTheDocument()
    expect(screen.queryByText('Максимум 6 ' + 'активних клієнтів на Start')).not.toBeInTheDocument()
    expect(screen.queryByText('До 20 ' + 'активних клієнтів')).not.toBeInTheDocument()
    expect(screen.queryByText('Максимум 27 ' + 'активних клієнтів на PRO')).not.toBeInTheDocument()
    expect(screen.getAllByRole('link', { name: 'Створити свій простір' }).length).toBeGreaterThan(0)
  })

  it('connects five workflow steps with both capability groups before client discovery and pricing', async () => {
    const { container } = await renderHome()
    const workflow = screen.getByRole('region', { name: 'Від першого знайомства — до регулярної роботи' })
    const steps = within(workflow).getAllByRole('listitem')
    expect(steps).toHaveLength(5)
    const expectedSteps = [
      ['Покажіть свою практику', 'Створіть професійну сторінку: розкажіть про себе, свій підхід, теми роботи, формат консультацій і вартість.'],
      ['Отримайте звернення', 'Клієнт може знайти вас у Pro Consult або перейти за вашим посиланням, познайомитися з вами й залишити запит без реєстрації чи записатися на сесію.'],
      ['Проведіть консультацію', 'Погоджуйте час, плануйте сесії та тримайте робочий календар в одному місці.'],
      ['Продовжуйте роботу з клієнтом', 'Регулярні сесії, приватні нотатки та матеріали залишаються в контексті вашої роботи з клієнтом.'],
      ['Тримайте практику в порядку', 'Керуйте клієнтами, задачами й робочими процесами без набору розрізнених інструментів.'],
    ]
    expectedSteps.forEach(([title, copy], index) => {
      expect(within(steps[index]!).getByRole('heading', { name: title })).toBeInTheDocument()
      expect(within(steps[index]!).getByText(copy!)).toBeInTheDocument()
    })

    const presence = screen.getByRole('region', { name: 'Покажіть свою практику' })
    const practice = screen.getByRole('region', { name: 'Ведіть свою практику' })
    expect(within(presence).getAllByRole('listitem')).toHaveLength(4)
    expect(within(practice).getAllByRole('listitem')).toHaveLength(4)
    for (const title of ['Професійна сторінка', 'Звернення без реєстрації', 'Власний блог', 'Пошук спеціалістів']) {
      expect(within(presence).getByRole('heading', { name: title, level: 4 })).toBeInTheDocument()
    }
    for (const title of ['Сесії та календар', 'Робота з клієнтами', 'Приватні нотатки та матеріали', 'Задачі та організація практики']) {
      expect(within(practice).getByRole('heading', { name: title, level: 4 })).toBeInTheDocument()
    }
    expect(within(practice).getByText('Внутрішні записи спеціаліста залишаються приватними, а клієнту відкривається лише те, чим ви свідомо ділитеся.')).toBeInTheDocument()

    const sections = Array.from(container.querySelector('.home-lite__container')!.children)
    const workflowIndex = sections.indexOf(workflow)
    const productIndex = sections.indexOf(screen.getByRole('region', { name: 'Дві сторони одного професійного простору' }))
    const blogIndex = sections.indexOf(screen.getByRole('region', { name: 'Дайте клієнту можливість познайомитися з вами до консультації' }))
    const clientIndex = sections.indexOf(screen.getByRole('region', { name: 'Шукаєте спеціаліста?' }))
    const pricingIndex = sections.indexOf(screen.getByRole('region', { name: 'Тарифи' }))
    expect(workflowIndex).toBeLessThan(productIndex)
    expect(productIndex).toBeLessThan(blogIndex)
    expect(clientIndex).toBe(blogIndex + 1)
    expect(pricingIndex).toBe(clientIndex + 1)
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
    expect(screen.queryByText('Знайти профіль спеціаліста')).not.toBeInTheDocument()
    expect(container.querySelector('a[href="/tour"]')).not.toBeInTheDocument()
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
    expect(screen.queryByText('2 490 грн/міс')).not.toBeInTheDocument()

    await fireEvent.click(screen.getByRole('button', { name: 'Рік' }))

    expect(screen.getByText('9 900 грн/рік')).toBeInTheDocument()
    expect(screen.queryByText('24 900 грн/рік')).not.toBeInTheDocument()
  })

  it('routes authenticated specialist primary cta to cabinet without a signup cta', async () => {
    const { container, router } = await renderHome({ authenticated: true, roles: ['SPECIALIST'] })
    const hero = container.querySelector('.home-hero') as HTMLElement

    const heroButton = within(hero).getByRole('button', { name: 'Перейти до кабінету' })
    expect(within(hero).queryByRole('link', { name: 'Створити свій простір' })).not.toBeInTheDocument()
    expect(within(hero).getByRole('link', { name: 'Знайти спеціаліста' })).toHaveAttribute('href', '/specialists')

    await fireEvent.click(heroButton)

    await waitFor(() => {
      expect(router.currentRoute.value.fullPath).toBe('/cabinet')
    })
  })
})
