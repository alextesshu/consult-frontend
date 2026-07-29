import { fireEvent, render, screen, waitFor } from '@testing-library/vue'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import PublicJournalPostView from './PublicJournalPostView.vue'
import {
  fetchAuthorJournalPost,
  fetchPublicAuthorJournalPostDetail,
  type AuthorJournalPost,
  type PublicAuthorJournalPostDetail,
} from '../lib/api'

const { mockedRoute } = vi.hoisted(() => ({
  mockedRoute: {
    name: 'public-journal-post' as string,
    params: { slug: 'canonical-specialist', postSlug: 'article-slug' } as Record<string, string>,
    query: {} as Record<string, string>,
  },
}))

vi.mock('vue-router', () => ({
  useRoute: () => mockedRoute,
}))

vi.mock('../lib/api', async () => {
  const actual = await vi.importActual<typeof import('../lib/api')>('../lib/api')
  return {
    ...actual,
    fetchAuthorJournalPost: vi.fn(),
    fetchPublicAuthorJournalPostDetail: vi.fn(),
  }
})

const mockedFetchAuthorJournalPost = vi.mocked(fetchAuthorJournalPost)
const mockedFetchPublicPost = vi.mocked(fetchPublicAuthorJournalPostDetail)

function buildPublicPost(): PublicAuthorJournalPostDetail {
  return {
    id: 41,
    category: 'EXPLAIN',
    is_featured: false,
    featured_order: 0,
    title: 'Тестова стаття',
    slug: 'article-slug',
    summary: 'Короткий опис',
    body: 'Текст статті',
    cover_image_url: '',
    published_at: '2026-07-29T10:00:00Z',
    created_at: '2026-07-29T09:00:00Z',
    collection: null,
  }
}

function buildDraft(): AuthorJournalPost {
  return {
    id: 41,
    category: 'EXPLAIN',
    is_featured: false,
    featured_order: 0,
    title: 'Чернетка автора',
    slug: 'draft-slug',
    summary: '',
    body: 'Текст чернетки',
    cover_image_url: '',
    is_published: false,
    published_at: null,
    created_at: '2026-07-29T09:00:00Z',
    updated_at: '2026-07-29T10:00:00Z',
  }
}

function renderView() {
  return render(PublicJournalPostView, {
    global: {
      stubs: {
        RouterLink: {
          props: ['to'],
          template: '<a href="#" :data-to="typeof to === \'string\' ? to : JSON.stringify(to)"><slot /></a>',
        },
      },
    },
  })
}

describe('PublicJournalPostView routes and owner preview', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockedRoute.name = 'public-journal-post'
    mockedRoute.params = { slug: 'canonical-specialist', postSlug: 'article-slug' }
    mockedRoute.query = {}
    mockedFetchPublicPost.mockResolvedValue(buildPublicPost())
    mockedFetchAuthorJournalPost.mockResolvedValue(buildDraft())
    window.history.replaceState({}, '', '/s/canonical-specialist/journal/article-slug?from=cabinet#share')
    document.querySelectorAll('link[rel="canonical"], meta[property^="og:"], meta[name^="twitter:"]').forEach(
      (element) => element.remove()
    )
  })

  it('loads a published article by canonical slug and uses it for profile and blog links', async () => {
    renderView()

    expect(await screen.findByText('Тестова стаття')).toBeInTheDocument()
    expect(mockedFetchPublicPost).toHaveBeenCalledWith('canonical-specialist', 'article-slug')
    expect(screen.getByRole('link', { name: 'До профілю' })).toHaveAttribute(
      'data-to',
      '/s/canonical-specialist'
    )
    expect(screen.getByRole('link', { name: 'До блогу' })).toHaveAttribute(
      'data-to',
      '/s/canonical-specialist/journal'
    )
    const shareButton = screen.getByRole('button', { name: 'Поділитися дописом' })
    expect(shareButton).toHaveClass('btn', 'post-share-cta')
    expect(shareButton).not.toHaveClass('btn--ghost')
  })

  it('opens the custom dialog with a canonical URL that excludes query and hash', async () => {
    renderView()
    const shareButton = await screen.findByRole('button', { name: 'Поділитися дописом' })

    await fireEvent.click(shareButton)

    expect(screen.getByRole('dialog', { name: 'Поділитися дописом' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Telegram' })).toHaveAttribute(
      'href',
      expect.stringContaining(
        encodeURIComponent(`${window.location.origin}/s/canonical-specialist/journal/article-slug`)
      )
    )
    expect(screen.getByRole('link', { name: 'Telegram' }).getAttribute('href')).not.toContain(
      encodeURIComponent('?from=cabinet')
    )
  })

  it('closes the dialog with Escape and its button, returning focus to the CTA', async () => {
    renderView()
    const shareButton = await screen.findByRole('button', { name: 'Поділитися дописом' })
    await fireEvent.click(shareButton)

    await fireEvent.keyDown(screen.getByRole('dialog'), { key: 'Escape' })
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument())
    expect(shareButton).toHaveFocus()

    await fireEvent.click(shareButton)
    await fireEvent.click(screen.getByRole('button', { name: 'Закрити' }))
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument())
    expect(shareButton).toHaveFocus()
  })

  it('sets the absolute generic social image when the article has no cover', async () => {
    renderView()
    await screen.findByText('Тестова стаття')

    expect(document.querySelector('meta[property="og:image"]')).toHaveAttribute(
      'content',
      `${window.location.origin}/og-image.png?v=20260707`
    )
    expect(document.querySelector('meta[name="twitter:image"]')).toHaveAttribute(
      'content',
      `${window.location.origin}/og-image.png?v=20260707`
    )
  })

  it('loads an owner draft only through the authenticated cabinet endpoint', async () => {
    mockedRoute.name = 'cabinet-journal-preview'
    mockedRoute.params = { postId: '41', postSlug: 'draft-slug' }
    renderView()

    expect(await screen.findByText('Чернетка автора')).toBeInTheDocument()
    expect(mockedFetchAuthorJournalPost).toHaveBeenCalledWith(41)
    expect(mockedFetchPublicPost).not.toHaveBeenCalled()
    expect(screen.getByRole('link', { name: 'До редактора' })).toHaveAttribute(
      'data-to',
      '/cabinet/journal'
    )
    expect(screen.queryByRole('button', { name: 'Поділитися дописом' })).not.toBeInTheDocument()
  })

  it('shows a Ukrainian not-found state instead of the raw API message', async () => {
    mockedFetchPublicPost.mockRejectedValueOnce({
      response: { status: 404, data: { detail: 'Profile not found.' } },
    })
    renderView()

    expect(await screen.findByText('Не вдалося знайти профіль або статтю.')).toBeInTheDocument()
    expect(screen.queryByText('Profile not found.')).not.toBeInTheDocument()
  })

  it('shows a Ukrainian owner-preview not-found state', async () => {
    mockedRoute.name = 'cabinet-journal-preview'
    mockedRoute.params = { postId: '41', postSlug: 'draft-slug' }
    mockedFetchAuthorJournalPost.mockRejectedValueOnce({
      response: { status: 404, data: { detail: 'Post not found.' } },
    })
    renderView()

    await waitFor(() => {
      expect(screen.getByText('Не вдалося знайти цей допис у вашому журналі.')).toBeInTheDocument()
    })
    expect(screen.queryByText('Post not found.')).not.toBeInTheDocument()
  })
})
