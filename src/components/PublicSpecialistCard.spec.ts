import { fireEvent, render, screen, waitFor } from '@testing-library/vue'
import { createMemoryHistory, createRouter } from 'vue-router'
import { beforeEach, describe, expect, it } from 'vitest'
import { applyUiVersion } from '../lib/uiVersion'
import PublicSpecialistCard from './PublicSpecialistCard.vue'

type CardItem = {
  slug: string
  public_slug: string
  public_profile_path: string | null
  display_name: string
  public_display_name: string | null
  public_profile_summary: string | null
  specializations: string[]
  location: string | null
  offers_online: boolean
  offers_offline: boolean
  price: string | number | null
  price_currency: string | null
  match_kind?: 'exact' | 'related' | 'fallback' | null
  photo_url: string | null
}

const baseItem: CardItem = {
  slug: 'olena',
  public_slug: 'olena',
  public_profile_path: '/s/olena',
  display_name: 'Олена Коваль',
  public_display_name: 'Олена Коваль',
  public_profile_summary: 'Працюю з тривогою та підтримую у періоди важливих змін.',
  specializations: ['Психолог', 'Тривога', 'Самооцінка', 'Стосунки', 'Кар’єра'],
  location: 'Київ',
  offers_online: true,
  offers_offline: true,
  price: '900.00',
  price_currency: 'UAH',
  photo_url: 'https://example.test/olena.jpg',
}

async function renderCard(overrides: Partial<CardItem> = {}) {
  const router = createRouter({
    history: createMemoryHistory(),
    routes: [
      { path: '/specialists', component: { template: '<div>Directory</div>' } },
      { path: '/s/:slug', component: { template: '<div>Profile</div>' } },
    ],
  })
  await router.push('/specialists')
  await router.isReady()
  return render(PublicSpecialistCard, {
    props: { item: { ...baseItem, ...overrides } },
    global: { plugins: [router] },
  })
}

describe('PublicSpecialistCard', () => {
  beforeEach(() => applyUiVersion('v1'))

  it('switches presentation reactively without changing public content or the single profile link', async () => {
    const { container } = await renderCard({ price: null, offers_offline: false })
    const before = container.innerHTML
    let link = screen.getByRole('link', { name: 'Відкрити профіль Олена Коваль' })
    expect(link).not.toHaveClass('pc2-specialist-card')
    applyUiVersion('v2')
    await waitFor(() => expect(screen.getByRole('link', { name: 'Відкрити профіль Олена Коваль' })).toHaveClass('pc2-card', 'pc2-card--interactive'))
    link = screen.getByRole('link', { name: 'Відкрити профіль Олена Коваль' })
    expect(link).toHaveAttribute('href', '/s/olena')
    expect(screen.queryByText('Київ')).not.toBeInTheDocument()
    expect(screen.queryByText(/грн|рейтинг|найкращ/i)).not.toBeInTheDocument()
    expect(container.querySelectorAll('a')).toHaveLength(1)
    expect(container.querySelector('button')).toBeNull()
    link.focus()
    expect(link).toHaveFocus()
    applyUiVersion('v1')
    await waitFor(() => expect(container.innerHTML).toBe(before))
    link = screen.getByRole('link', { name: 'Відкрити профіль Олена Коваль' })
    await fireEvent.click(link)
    await waitFor(() => expect(link).toHaveAttribute('href', '/s/olena'))
  })

  it('uses one accessible canonical whole-card profile link', async () => {
    const { container } = await renderCard()

    const link = screen.getByRole('link', { name: 'Відкрити профіль Олена Коваль' })
    expect(link).toHaveAttribute('href', '/s/olena')
    expect(screen.getByRole('img', { name: 'Олена Коваль' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { level: 3, name: 'Олена Коваль' })).toBeInTheDocument()
    expect(screen.queryByText('Відкрити профіль')).not.toBeInTheDocument()
    expect(container.querySelector('.result-card a, .result-card button')).toBeNull()

    link.focus()
    expect(link).toHaveFocus()
  })

  it('renders public price in the compact identity hierarchy with topics, format, and offline location', async () => {
    const { container } = await renderCard()

    expect(screen.getByText('Психолог')).toBeInTheDocument()
    expect(screen.getByText('900 грн')).toBeInTheDocument()
    expect(screen.getByText('Онлайн та офлайн')).toBeInTheDocument()
    expect(screen.getByText('Київ')).toBeInTheDocument()
    expect(screen.getByRole('list', { name: 'Основні теми' })).toHaveTextContent(
      'ТривогаСамооцінкаСтосунки',
    )
    expect(screen.queryByText('Кар’єра')).not.toBeInTheDocument()

    const identityText = container.querySelector('.result-card__identity')?.textContent || ''
    expect(identityText.indexOf('Олена Коваль')).toBeLessThan(identityText.indexOf('Психолог'))
    expect(identityText.indexOf('Психолог')).toBeLessThan(identityText.indexOf('900 грн'))
  })

  it('omits unavailable price, topics, and online-only location without empty labels', async () => {
    await renderCard({
      public_profile_summary: null,
      specializations: ['Психолог'],
      offers_online: true,
      offers_offline: false,
      price: null,
      price_currency: null,
      photo_url: null,
    })

    expect(screen.queryByText('Основні теми')).not.toBeInTheDocument()
    expect(screen.queryByText('Локація')).not.toBeInTheDocument()
    expect(screen.queryByText('Київ')).not.toBeInTheDocument()
    expect(screen.queryByText(/грн|USD|EUR/)).not.toBeInTheDocument()
    expect(screen.getByText('Онлайн')).toBeInTheDocument()
  })

  it('keeps the full description in the DOM for CSS line clamping', async () => {
    const description = 'Довгий опис залишається повністю доступним у профілі та DOM картки без ручного обрізання.'
    const { container } = await renderCard({ public_profile_summary: description })

    expect(container.querySelector('.result-card__summary')).toHaveTextContent(description)
  })
})


describe('PublicSpecialistCard v5 data boundaries', () => {
  beforeEach(() => applyUiVersion('v2'))
  it('maps actual public values to the Claude card without fabricated slots or actions', async () => {
    const { container } = await renderCard({ match_kind: 'exact' })
    expect(screen.getByText('За вашим запитом')).toBeInTheDocument()
    expect(screen.getByText('900 грн')).toBeInTheDocument()
    expect(container.querySelector('.pc2-specialist-card__format')).toHaveTextContent('Онлайн та офлайн · Київ')
    expect(container.querySelector('.pc2-specialist-card__entry')).toHaveTextContent('ЗверненняУ профілі спеціаліста')
    expect(container).not.toHaveTextContent(/Найближче вікно|Пт 23|підтверджено|рейтинг/)
    expect(container.querySelectorAll('a')).toHaveLength(1)
    expect(container.querySelector('button')).toBeNull()
  })
  it.each([null, 'related', 'fallback'] as const)('does not infer an exact badge for %s', async match_kind => {
    await renderCard({ match_kind })
    expect(screen.queryByText('За вашим запитом')).not.toBeInTheDocument()
  })
  it('derives initials from the public name and omits absent price/location/topics', async () => {
    const { container } = await renderCard({ public_display_name: '  Ірина  Мельник ', photo_url: null, price: null, offers_offline: false, specializations: [] })
    expect(container.querySelector('.pc2-specialist-card__initials')).toHaveTextContent('ІМ')
    expect(container.querySelector('.pc2-specialist-card__price')).toBeNull()
    expect(container.querySelector('.pc2-specialist-card__meta ul')).toBeNull()
    expect(container).not.toHaveTextContent('Київ')
    expect(container.querySelector('.pc2-specialist-card__summary')).toHaveTextContent(baseItem.public_profile_summary!)
  })
})
