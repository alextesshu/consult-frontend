import { render, screen } from '@testing-library/vue'
import { describe, expect, it } from 'vitest'
import PrivacyView from './PrivacyView.vue'
import SupportAndDataRequestsView from './SupportAndDataRequestsView.vue'
import TermsView from './TermsView.vue'
import DisclaimerView from './DisclaimerView.vue'

const routerLinkStub = {
  props: ['to'],
  template: '<a :href="typeof to === \'string\' ? to : to?.path"><slot /></a>',
}

function renderLegalPage(component: unknown) {
  return render(component as any, {
    global: {
      stubs: {
        RouterLink: routerLinkStub,
      },
    },
  })
}

describe('legal and support pages', () => {
  it('keeps privacy copy calm and explicit about private workspace boundaries', () => {
    const { container } = renderLegalPage(PrivacyView)
    const text = container.textContent || ''

    expect(screen.getAllByText('support@proconsult.space').length).toBeGreaterThan(0)
    expect(text).toContain('Останнє оновлення: 08.08.2026')
    expect(text).toContain('Приватний зошит спеціаліста не відображається в клієнтському кабінеті')
    expect(text).toContain('Підтримка не читає приватні нотатки для звичайної роботи сервісу')
    expect(text).toContain('Pro Consult не є медичною інформаційною системою')
    expect(text).toContain('не призначений для ведення медичної документації, діагнозів')
    expect(screen.getByRole('heading', { name: '10. Файли cookie та аналітика' })).toBeInTheDocument()
    expect(text).toContain('PostHog EU Cloud')
    expect(text).toContain('зовнішньому сервісі аналітики')
    expect(text).toContain('приблизну географічну інформацію')
    expect(text).toContain('відповідно до правил зберігання сервісу аналітики')
    expect(text).toContain('свою згоду — змінити чи відкликати')
    expect(text).toContain('Ми не використовуємо session replay, запис екрана або теплові карти')
    expect(text).toContain('Відмова не обмежує функції Pro Consult.')
    expect(screen.getByRole('link', { name: 'Питання та відповіді' })).toHaveAttribute('href', '/faq')
    expect(text).not.toContain('абсолютної технічної недоторканності')
    expect(text).not.toContain('витік')
  })

  it('makes ordinary support and data requests distinguishable', () => {
    const { container } = renderLegalPage(SupportAndDataRequestsView)
    const text = container.textContent || ''

    expect(text).toContain('Останнє оновлення: 21.06.2026')
    expect(screen.getByText('Основний контакт підтримки')).toBeInTheDocument()
    expect(screen.getByText('Напишіть нам на email:')).toBeInTheDocument()
    expect(screen.getAllByText('support@proconsult.space').length).toBeGreaterThan(0)
    expect(screen.getByRole('button', { name: 'Копіювати email' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Відкрити поштовий клієнт' })).toHaveAttribute(
      'href',
      'mailto:support@proconsult.space'
    )
    expect(screen.queryByRole('link', { name: 'Написати в підтримку' })).not.toBeInTheDocument()
    expect(screen.getByRole('heading', { name: '1. Звичайні питання підтримки' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: '2. Запити щодо даних і конфіденційності' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: '3. Чи є Pro Consult медичною інформаційною системою?' })).toBeInTheDocument()
    expect(text).toContain('Сервіс не призначений для ведення медичної документації')
    expect(screen.getByRole('link', { name: 'Питання та відповіді' })).toHaveAttribute('href', '/faq')
    expect(screen.getByText(/акаунта, доступу, білінгу, конфіденційності та даних/i)).toBeInTheDocument()
  })

  it('aligns terms with private notes and support access boundaries', () => {
    const { container } = renderLegalPage(TermsView)
    const text = container.textContent || ''

    expect(screen.getAllByText('support@proconsult.space').length).toBeGreaterThan(0)
    expect(text).toContain('Останнє оновлення: 21.06.2026')
    expect(text).toContain('Приватний зошит залишаються приватними функціями спеціаліста')
    expect(text).toContain('Спеціаліст відповідає за зміст даних, які він вносить у сервіс')
    expect(text).toContain('не повинен використовувати Pro Consult для ведення офіційної медичної документації')
    expect(text).toContain('Технічна підтримка працює з даними в межах конкретного звернення')
    expect(screen.getByRole('link', { name: 'Питання та відповіді' })).toHaveAttribute('href', '/faq')
    expect(text).not.toContain('абсолютної технічної недоторканності')
    expect(text).not.toContain('витік')
  })

  it('uses a static last-updated date on the disclaimer page', () => {
    const { container } = renderLegalPage(DisclaimerView)
    const text = container.textContent || ''

    expect(text).toContain('Останнє оновлення: 21.06.2026')
    expect(text).not.toContain('Invalid Date')
  })
})
