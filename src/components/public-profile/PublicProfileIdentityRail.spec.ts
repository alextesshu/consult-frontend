import { render, screen } from '@testing-library/vue'
import { describe, expect, it } from 'vitest'
import PublicProfileIdentityRail from './PublicProfileIdentityRail.vue'

function renderRail({ showBlogCta = false, showOwnerReviewsCta = false } = {}) {
  return render(PublicProfileIdentityRail, {
    props: {
      profile: {},
      heroCtaTitle: 'Звернутися до мене',
      heroPrimaryLabel: 'Записатися на сесію',
      showClientSessionsCta: false,
      primaryActionNextStepCopy: '',
      introPriceDisplay: '',
      introDurationLabel: '',
      priceDisplay: '',
      standardSessionDurationLabel: '',
      couplePriceDisplay: '',
      coupleDurationLabel: '',
      showContactActions: false,
      contactActions: [],
      showBlogCta,
      blogLink: { name: 'public-journal', params: { slug: 'olena' } },
      showOwnerReviewsCta,
    },
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
})
