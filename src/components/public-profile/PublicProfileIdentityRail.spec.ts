import { fireEvent, render, screen } from '@testing-library/vue'
import { describe, expect, it } from 'vitest'
import PublicProfileIdentityRail from './PublicProfileIdentityRail.vue'

function renderRail({
  showBlogCta = false,
  showOwnerReviewsCta = false,
  showContacts = false,
  withShare = false,
  uiV2 = false,
  prices = { standard: '', intro: '', couple: '' },
  selectedOfferType = null as 'standard' | 'intro' | 'couple' | null,
} = {}) {
  return render(PublicProfileIdentityRail, {
    props: {
      uiV2,
      selectedOfferType,
      profile: {},
      heroCtaTitle: 'Звернутися до мене',
      heroPrimaryLabel: 'Записатися на сесію',
      showClientSessionsCta: false,
      primaryActionNextStepCopy: '',
      introPriceDisplay: prices.intro,
      introDurationLabel: '',
      priceDisplay: prices.standard,
      standardSessionDurationLabel: '',
      couplePriceDisplay: prices.couple,
      coupleDurationLabel: '',
      showContactActions: showContacts,
      contactActions: showContacts
        ? [
            {
              id: 'telegram',
              channel: 'TELEGRAM',
              channelLabel: 'Telegram',
              valueText: '@olena',
              actionUrl: 'https://t.me/olena',
              actionScheme: 'https',
            },
          ]
        : [],
      showBlogCta,
      blogLink: { name: 'public-journal', params: { slug: 'olena' } },
      showOwnerReviewsCta,
    },
    slots: withShare
      ? {
          'share-action': '<button class="btn public-profile-share-cta">Поділитися профілем</button>',
        }
      : {},
    global: {
      stubs: {
        RouterLink: {
          props: ['to'],
          template: '<a href="#" :data-target="JSON.stringify(to)"><slot /></a>',
        },
      },
    },
  })
}

describe('PublicProfileIdentityRail', () => {
  it('exposes named native toggle buttons in consultation order with one controlled pressed state', async () => {
    const view = renderRail({ uiV2: true, prices: { standard: '1500 грн', intro: '600 грн', couple: '2000 грн' } })
    const buttons = screen.getAllByRole('button', { pressed: false })
    expect(buttons.map(button => button.getAttribute('aria-label'))).toEqual([
      'Консультація: 1500 грн', 'Ознайомча сесія: 600 грн', 'Парна консультація: 2000 грн',
    ])
    for (const button of buttons) {
      expect(button.tagName).toBe('BUTTON')
      expect(button).toHaveAttribute('type', 'button')
      expect(button).not.toHaveAttribute('tabindex', '-1')
      expect(button).toBeEnabled()
    }
    expect(screen.queryByRole('radiogroup')).not.toBeInTheDocument()
    // jsdom does not activate native buttons from keyboard events; Chromium
    // covers Enter/Space and actual forward/reverse Tab navigation.
    for (const [index, type] of ['standard', 'intro', 'couple'].entries()) {
      await fireEvent.click(buttons[index]!)
      expect(view.emitted()['select-offer']?.at(-1)).toEqual([type])
      await view.rerender({ selectedOfferType: type })
      expect(screen.getAllByRole('button', { pressed: true })).toEqual([buttons[index]])
      expect(screen.getAllByRole('button', { pressed: false })).toHaveLength(2)
    }
  })

  it('omits unavailable offers from the accessible and focusable controls', () => {
    renderRail({ uiV2: true, prices: { standard: '1500 грн', intro: '', couple: '' } })
    expect(screen.getAllByRole('button', { pressed: false })).toHaveLength(1)
    expect(screen.queryByRole('button', { name: /Ознайомча сесія/ })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /Парна консультація/ })).not.toBeInTheDocument()
  })

  it('shows the specialist blog CTA only when public posts are available', () => {
    renderRail({ showBlogCta: true })

    const blogLink = screen.getByRole('link', { name: 'Читати мій блог' })
    expect(blogLink).toHaveAttribute('data-target', JSON.stringify({ name: 'public-journal', params: { slug: 'olena' } }))
  })

  it('does not render a blog CTA when the specialist has no public posts', () => {
    renderRail()

    expect(screen.queryByRole('link', { name: 'Читати мій блог' })).not.toBeInTheDocument()
  })

  it('renders the owner-only reviews shortcut through the cabinet SPA route', () => {
    renderRail({ showOwnerReviewsCta: true })

    const reviewsLink = screen.getByRole('link', { name: 'Мої відгуки' })
    expect(reviewsLink).toHaveAttribute('data-target', JSON.stringify('/cabinet/reviews'))
    expect(screen.queryByRole('link', { name: 'Відгуки' })).not.toBeInTheDocument()
  })

  it('keeps the blog CTA independent and does not render an empty context wrapper', () => {
    const { unmount } = renderRail({ showBlogCta: true })

    expect(screen.getByRole('link', { name: 'Читати мій блог' })).toBeInTheDocument()
    expect(screen.queryByRole('link', { name: 'Мої відгуки' })).not.toBeInTheDocument()
    unmount()

    const hidden = renderRail()
    expect(hidden.container.querySelector('.identity-rail__context-actions')).toBeNull()
  })

  it('places the full-width profile share action after owner context links and before contacts', () => {
    const { container } = renderRail({
      showOwnerReviewsCta: true,
      showContacts: true,
      withShare: true,
    })

    const reviewsLink = screen.getByRole('link', { name: 'Мої відгуки' })
    const shareButton = screen.getByRole('button', { name: 'Поділитися профілем' })
    const contacts = screen.getByText('Мої контакти')
    expect(shareButton).toHaveClass('public-profile-share-cta')
    expect(container.querySelector('.identity-rail__share-action')).toContainElement(shareButton)
    expect(
      Boolean(reviewsLink.compareDocumentPosition(shareButton) & Node.DOCUMENT_POSITION_FOLLOWING)
    ).toBe(true)
    expect(
      Boolean(shareButton.compareDocumentPosition(contacts) & Node.DOCUMENT_POSITION_FOLLOWING)
    ).toBe(true)
  })
})
