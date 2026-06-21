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
    expect(text).toContain('Останнє оновлення: 21.06.2026')
    expect(text).toContain('Приватний зошит спеціаліста не відображається в клієнтському кабінеті')
    expect(text).toContain('Підтримка не читає приватні нотатки для звичайної роботи сервісу')
    expect(text).not.toContain('абсолютної технічної недоторканності')
    expect(text).not.toContain('витік')
  })

  it('makes ordinary support and data requests distinguishable', () => {
    const { container } = renderLegalPage(SupportAndDataRequestsView)
    const text = container.textContent || ''

    expect(text).toContain('Останнє оновлення: 21.06.2026')
    expect(screen.getByRole('link', { name: 'Написати в підтримку' })).toHaveAttribute(
      'href',
      'mailto:support@proconsult.space'
    )
    expect(screen.getByRole('heading', { name: '1. Звичайні питання підтримки' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: '2. Запити щодо даних і конфіденційності' })).toBeInTheDocument()
    expect(screen.getByText(/акаунта, доступу, білінгу, конфіденційності та даних/i)).toBeInTheDocument()
  })

  it('aligns terms with private notes and support access boundaries', () => {
    const { container } = renderLegalPage(TermsView)
    const text = container.textContent || ''

    expect(screen.getAllByText('support@proconsult.space').length).toBeGreaterThan(0)
    expect(text).toContain('Останнє оновлення: 21.06.2026')
    expect(text).toContain('Приватний зошит залишаються приватними функціями спеціаліста')
    expect(text).toContain('Технічна підтримка працює з даними в межах конкретного звернення')
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
