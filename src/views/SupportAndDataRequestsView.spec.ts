import { fireEvent, render, screen } from '@testing-library/vue'
import { afterEach, describe, expect, it, vi } from 'vitest'
import SupportAndDataRequestsView from './SupportAndDataRequestsView.vue'

const routerLinkStub = {
  props: ['to'],
  template: '<a :href="typeof to === \'string\' ? to : to?.path"><slot /></a>',
}

function renderSupportPage() {
  return render(SupportAndDataRequestsView, {
    global: {
      stubs: {
        RouterLink: routerLinkStub,
      },
    },
  })
}

function setClipboard(writeText?: (value: string) => Promise<void>) {
  Object.defineProperty(navigator, 'clipboard', {
    configurable: true,
    value: writeText ? { writeText } : undefined,
  })
}

describe('SupportAndDataRequestsView', () => {
  afterEach(() => {
    vi.restoreAllMocks()
    setClipboard()
  })

  it('shows the support email and copies it from the primary action', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined)
    setClipboard(writeText)

    renderSupportPage()

    expect(screen.getByText('Основний контакт підтримки')).toBeInTheDocument()
    expect(screen.getByText('Напишіть нам на email:')).toBeInTheDocument()
    const emailButton = screen.getByRole('button', { name: 'support@proconsult.space' })
    expect(emailButton).toBeInTheDocument()

    const copyButton = screen.getByRole('button', { name: 'Копіювати email' })
    expect(copyButton).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Відкрити поштовий клієнт' })).toHaveAttribute(
      'href',
      'mailto:support@proconsult.space'
    )
    expect(screen.queryByRole('link', { name: 'Написати в підтримку' })).not.toBeInTheDocument()

    await fireEvent.click(emailButton)

    expect(writeText).toHaveBeenCalledWith('support@proconsult.space')
    expect(await screen.findByRole('status')).toHaveTextContent('Email скопійовано')
  })

  it('keeps the visible email when clipboard is unavailable', async () => {
    setClipboard()

    renderSupportPage()

    await fireEvent.click(screen.getByRole('button', { name: 'Копіювати email' }))

    expect(screen.getByRole('button', { name: 'support@proconsult.space' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Відкрити поштовий клієнт' })).toHaveAttribute(
      'href',
      'mailto:support@proconsult.space'
    )
    expect(screen.queryByText('Email скопійовано')).not.toBeInTheDocument()
  })
})
