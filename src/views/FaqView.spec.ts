import { render, screen } from '@testing-library/vue'
import { describe, expect, it } from 'vitest'
import FaqView from './FaqView.vue'

const routerLinkStub = {
  template: '<a><slot /></a>',
}

describe('FaqView', () => {
  it('describes first contact as request-first with optional direct booking time', () => {
    const { container } = render(FaqView, {
      global: {
        stubs: {
          RouterLink: routerLinkStub,
        },
      },
    })

    expect(screen.getByRole('heading', { name: 'Часті питання' })).toBeInTheDocument()
    expect(screen.getByText(/залишає запит без реєстрації/)).toBeInTheDocument()
    expect(screen.getByText(/Доступний час можна додати окремо/)).toBeInTheDocument()
    expect(container).not.toHaveTextContent('обирає вільний слот і бронює')
    expect(container).not.toHaveTextContent('Створіть перший слот')
  })
})
