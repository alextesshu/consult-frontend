import { fireEvent, render, screen, waitFor } from '@testing-library/vue'
import { createMemoryHistory, createRouter } from 'vue-router'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import PublicJournalView from './PublicJournalView.vue'
import {
  fetchPublicAuthorJournalPosts,
  fetchPublicJournalCollections,
  fetchPublicSpecialistProfile,
  type PublicAuthorJournalPost,
} from '../lib/api'

vi.mock('../lib/api', async () => {
  const actual = await vi.importActual<typeof import('../lib/api')>('../lib/api')

  return {
    ...actual,
    fetchPublicAuthorJournalPosts: vi.fn(),
    fetchPublicJournalCollections: vi.fn(),
    fetchPublicSpecialistProfile: vi.fn(),
  }
})

const mockedFetchPublicAuthorJournalPosts = vi.mocked(fetchPublicAuthorJournalPosts)
const mockedFetchPublicJournalCollections = vi.mocked(fetchPublicJournalCollections)
const mockedFetchPublicSpecialistProfile = vi.mocked(fetchPublicSpecialistProfile)

function post(overrides: Partial<PublicAuthorJournalPost> = {}): PublicAuthorJournalPost {
  return {
    id: 1,
    category: 'TIP',
    is_featured: false,
    featured_order: 0,
    title: 'Як підготуватися до першої сесії',
    slug: 'first-session',
    summary: 'Короткий опис статті',
    cover_image_url: '',
    published_at: '2026-01-01T10:00:00Z',
    created_at: '2026-01-01T10:00:00Z',
    ...overrides,
  } as PublicAuthorJournalPost
}

async function renderView(initialPath = '/s/olena/journal') {
  const router = createRouter({
    history: createMemoryHistory(),
    routes: [
      {
        path: '/s/:slug/journal',
        name: 'public-journal',
        component: PublicJournalView,
      },
      {
        path: '/s/:slug',
        name: 'public-profile',
        component: { template: '<div>Public Profile</div>' },
      },
      {
        path: '/s/:slug/journal/:postSlug',
        name: 'public-journal-post',
        component: { template: '<div>Public Journal Post</div>' },
      },
      {
        path: '/:slug/journal/:postSlug',
        component: { template: '<div>Public Journal Post</div>' },
      },
    ],
  })

  await router.push(initialPath)
  await router.isReady()

  const result = render(PublicJournalView, {
    global: {
      plugins: [router],
    },
  })

  return { router, ...result }
}

describe('PublicJournalView', () => {
  beforeEach(() => {
    mockedFetchPublicAuthorJournalPosts.mockReset()
    mockedFetchPublicJournalCollections.mockReset()
    mockedFetchPublicSpecialistProfile.mockReset()

    mockedFetchPublicSpecialistProfile.mockResolvedValue({
      display_name: 'Олена Коваль',
      slug: 'olena',
      public_slug: 'olena',
    } as any)
    mockedFetchPublicJournalCollections.mockResolvedValue([])
  })

  it('keeps empty category state inside the specialist journal', async () => {
    mockedFetchPublicAuthorJournalPosts.mockResolvedValue([post({ category: 'TIP' })])
    const { container } = await renderView()

    expect(await screen.findByText('Як підготуватися до першої сесії')).toBeInTheDocument()

    await fireEvent.click(screen.getByRole('button', { name: 'Пояснення' }))

    expect(screen.getByText('Немає статей у цій категорії')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Показати всі статті' })).toBeInTheDocument()
    expect(screen.queryByText('Знайти профіль спеціаліста')).not.toBeInTheDocument()
    expect(container.querySelector('a[href="/specialists"]')).not.toBeInTheDocument()

    await fireEvent.click(screen.getByRole('button', { name: 'Показати всі статті' }))

    expect(screen.getByText('Як підготуватися до першої сесії')).toBeInTheDocument()
  })

  it('links to the specialist profile when there are no published posts', async () => {
    mockedFetchPublicAuthorJournalPosts.mockResolvedValue([])
    const { container } = await renderView()

    expect(
      await screen.findByText('У цьому блозі поки немає опублікованих статей.')
    ).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'До профілю спеціаліста' })).toHaveAttribute(
      'href',
      '/s/olena'
    )
    expect(screen.queryByText('Знайти профіль спеціаліста')).not.toBeInTheDocument()
    expect(container.querySelector('a[href="/specialists"]')).not.toBeInTheDocument()
  })

  it('keeps the hero profile action pointed to the current specialist', async () => {
    mockedFetchPublicAuthorJournalPosts.mockResolvedValue([post()])
    await renderView()

    await waitFor(() => {
      expect(mockedFetchPublicAuthorJournalPosts).toHaveBeenCalledWith('olena')
    })
    expect(screen.getByRole('link', { name: 'Профіль' })).toHaveAttribute('href', '/s/olena')
  })

  it('shows a localized not found state without specialist journal hero', async () => {
    mockedFetchPublicSpecialistProfile.mockRejectedValueOnce(new Error('Profile not found.'))
    mockedFetchPublicAuthorJournalPosts.mockResolvedValue([])
    const { container } = await renderView('/s/missing/journal')

    expect(await screen.findByText('Профіль не знайдено')).toBeInTheDocument()
    expect(screen.getByText('Можливо, сторінку вимкнено або посилання змінено.')).toBeInTheDocument()
    expect(screen.queryByText('Блог спеціаліста')).not.toBeInTheDocument()
    expect(screen.queryByRole('link', { name: 'Профіль' })).not.toBeInTheDocument()
    expect(screen.queryByText('Знайти профіль спеціаліста')).not.toBeInTheDocument()
    expect(container.querySelector('a[href="/specialists"]')).not.toBeInTheDocument()
    expect(mockedFetchPublicAuthorJournalPosts).not.toHaveBeenCalled()
  })
})
