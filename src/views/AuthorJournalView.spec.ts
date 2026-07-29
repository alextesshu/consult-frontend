import { fireEvent, render, screen, waitFor } from '@testing-library/vue'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import AuthorJournalView from './AuthorJournalView.vue'
import {
  createAuthorJournalPost,
  fetchAuthorJournalPosts,
  fetchSpecialistProfile,
  updateAuthorJournalPost,
  uploadAuthorJournalCover,
  type AuthorJournalPost,
} from '../lib/api'

const { mockedRouterPush } = vi.hoisted(() => ({ mockedRouterPush: vi.fn() }))

vi.mock('vue-router', () => ({
  useRouter: () => ({ push: mockedRouterPush }),
}))

vi.mock('../stores/auth', () => ({
  useAuthStore: () => ({
    me: { effective_entitlements: { plan: 'PRO' } },
  }),
}))

vi.mock('../composables/useToast', () => ({
  useToast: () => ({ success: vi.fn(), error: vi.fn() }),
}))

vi.mock('../lib/api', async () => {
  const actual = await vi.importActual<typeof import('../lib/api')>('../lib/api')
  return {
    ...actual,
    fetchAuthorJournalPosts: vi.fn().mockResolvedValue([]),
    fetchCabinetJournalCollections: vi.fn().mockResolvedValue([]),
    fetchSpecialistProfile: vi.fn().mockResolvedValue({
      slug: 'synthetic-specialist',
      public_slug: 'legacy-public-slug',
      public_profile_enabled: true,
    }),
    createAuthorJournalPost: vi.fn().mockResolvedValue({}),
    updateAuthorJournalPost: vi.fn().mockResolvedValue({}),
    deleteAuthorJournalPost: vi.fn().mockResolvedValue(undefined),
    uploadAuthorJournalCover: vi.fn(),
  }
})

const mockedCreateAuthorJournalPost = vi.mocked(createAuthorJournalPost)
const mockedFetchAuthorJournalPosts = vi.mocked(fetchAuthorJournalPosts)
const mockedFetchSpecialistProfile = vi.mocked(fetchSpecialistProfile)
const mockedUpdateAuthorJournalPost = vi.mocked(updateAuthorJournalPost)
const mockedUploadAuthorJournalCover = vi.mocked(uploadAuthorJournalCover)

function buildPost(overrides: Partial<AuthorJournalPost> = {}): AuthorJournalPost {
  return {
    id: 41,
    category: 'EXPLAIN',
    is_featured: false,
    featured_order: 0,
    title: 'Тестовий допис',
    slug: 'test-post',
    summary: 'Короткий опис',
    body: 'Текст допису',
    cover_image_url: '',
    is_published: false,
    published_at: null,
    created_at: '2026-07-29T10:00:00Z',
    updated_at: '2026-07-29T10:00:00Z',
    ...overrides,
  }
}

function buildCoverFile(name = 'cover.png', type = 'image/png', bytes: BlobPart = 'cover'): File {
  return new File([bytes], name, { type })
}

function renderView() {
  return render(AuthorJournalView, {
    global: {
      stubs: {
        RouterLink: { template: '<a><slot /></a>' },
        ConfirmModal: true,
      },
    },
  })
}

describe('AuthorJournalView preview routing', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockedFetchSpecialistProfile.mockResolvedValue({
      slug: 'canonical-specialist',
      public_slug: 'legacy-public-slug',
      public_profile_enabled: true,
    } as never)
  })

  it('opens a published post with the canonical profile slug and preserves the article slug', async () => {
    mockedFetchAuthorJournalPosts.mockResolvedValue([
      buildPost({ is_published: true, slug: 'article-slug-with-dashes' }),
    ])
    renderView()

    await fireEvent.click(await screen.findByRole('button', { name: 'Переглянути' }))

    expect(mockedRouterPush).toHaveBeenCalledWith(
      '/s/canonical-specialist/journal/article-slug-with-dashes'
    )
    expect(mockedRouterPush).not.toHaveBeenCalledWith(expect.stringContaining('specialist-41'))
    expect(mockedRouterPush).not.toHaveBeenCalledWith(expect.stringContaining('legacy-public-slug'))
  })

  it('opens a draft through the protected cabinet preview route', async () => {
    mockedFetchAuthorJournalPosts.mockResolvedValue([buildPost({ is_published: false })])
    renderView()

    await fireEvent.click(await screen.findByRole('button', { name: 'Переглянути' }))

    expect(mockedRouterPush).toHaveBeenCalledWith({
      name: 'cabinet-journal-preview',
      params: { postId: '41', postSlug: 'test-post' },
    })
  })

  it('uses owner preview for a published post while the public profile is disabled', async () => {
    mockedFetchSpecialistProfile.mockResolvedValue({
      slug: 'canonical-specialist',
      public_profile_enabled: false,
    } as never)
    mockedFetchAuthorJournalPosts.mockResolvedValue([buildPost({ is_published: true })])
    renderView()

    await fireEvent.click(await screen.findByRole('button', { name: 'Переглянути' }))

    expect(mockedRouterPush).toHaveBeenCalledWith({
      name: 'cabinet-journal-preview',
      params: { postId: '41', postSlug: 'test-post' },
    })
  })
})

describe('AuthorJournalView content-driven FAQ visibility', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockedFetchAuthorJournalPosts.mockResolvedValue([])
    mockedCreateAuthorJournalPost.mockResolvedValue({} as never)
    mockedUpdateAuthorJournalPost.mockResolvedValue({} as never)
    mockedUploadAuthorJournalCover.mockResolvedValue({
      blob_name: 'therapists/test/journal/cover.png',
      preview_url: 'https://example.test/cover.png',
    })
  })

  it('publishes a valid FAQ without rendering the post visibility checkbox', async () => {
    renderView()

    await fireEvent.click(await screen.findByRole('button', { name: '+ Новий допис' }))
    await fireEvent.update(screen.getByLabelText('Категорія'), 'FAQ')

    expect(screen.queryByLabelText(/Опублікувати/)).not.toBeInTheDocument()
    expect(
      screen.getByText('Заповнене FAQ відображається у публічному профілі. Щоб прибрати його, видаліть FAQ.')
    ).toBeInTheDocument()

    await fireEvent.update(screen.getByLabelText('Назва'), 'Synthetic FAQ')
    await fireEvent.update(screen.getByPlaceholderText(/Основний текст/), 'Synthetic answer')
    await fireEvent.click(screen.getByRole('button', { name: 'Створити' }))

    await waitFor(() => {
      expect(mockedCreateAuthorJournalPost).toHaveBeenCalledWith(
        expect.objectContaining({ category: 'FAQ', is_published: true })
      )
    })
  })

  it('keeps the explicit publication control for non-FAQ journal categories', async () => {
    renderView()

    await fireEvent.click(await screen.findByRole('button', { name: '+ Новий допис' }))

    expect(screen.getByLabelText(/Опублікувати/)).not.toBeChecked()
    expect(
      screen.queryByText('Заповнене FAQ відображається у публічному профілі. Щоб прибрати його, видаліть FAQ.')
    ).not.toBeInTheDocument()
  })
})

describe('AuthorJournalView create validation', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockedFetchAuthorJournalPosts.mockResolvedValue([])
    mockedCreateAuthorJournalPost.mockResolvedValue(buildPost())
    mockedUpdateAuthorJournalPost.mockResolvedValue({} as never)
    mockedUploadAuthorJournalCover.mockResolvedValue({
      blob_name: 'therapists/test/journal/cover.png',
      preview_url: 'https://example.test/cover.png',
    })
  })

  async function openCreateForm() {
    renderView()
    await fireEvent.click(await screen.findByRole('button', { name: '+ Новий допис' }))
  }

  it('shows Ukrainian required-field errors, focuses the title, and does not call the API', async () => {
    await openCreateForm()

    await fireEvent.click(screen.getByRole('button', { name: 'Створити' }))

    expect(screen.getByText('Додайте заголовок допису')).toBeInTheDocument()
    expect(screen.getByText('Додайте текст допису')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('Напр. Як підготуватись до першої сесії')).toHaveFocus()
    expect(mockedCreateAuthorJournalPost).not.toHaveBeenCalled()
  })

  it('does not expose raw server validation after selecting a cover and clearing the form', async () => {
    await openCreateForm()
    await fireEvent.change(screen.getByLabelText('Завантажити файл обкладинки'), {
      target: { files: [buildCoverFile()] },
    })
    await waitFor(() => expect(mockedUploadAuthorJournalCover).toHaveBeenCalled())

    await fireEvent.click(screen.getByRole('button', { name: 'Очистити' }))
    await fireEvent.click(screen.getByRole('button', { name: 'Створити' }))

    expect(screen.getByText('Додайте заголовок допису')).toBeInTheDocument()
    expect(screen.getByText('Додайте текст допису')).toBeInTheDocument()
    expect(screen.queryByText(/title: This field may not be blank/)).not.toBeInTheDocument()
    expect(screen.queryByText(/body: This field may not be blank/)).not.toBeInTheDocument()
    expect(mockedCreateAuthorJournalPost).not.toHaveBeenCalled()
  })

  it('localizes title and body validation returned by the server', async () => {
    mockedCreateAuthorJournalPost.mockRejectedValueOnce({
      response: {
        data: {
          title: ['This field may not be blank.'],
          body: ['This field may not be blank.'],
        },
      },
    })
    await openCreateForm()
    await fireEvent.update(screen.getByLabelText('Назва'), 'Назва для server validation')
    await fireEvent.update(screen.getByPlaceholderText(/Основний текст/), 'Текст для server validation')

    await fireEvent.click(screen.getByRole('button', { name: 'Створити' }))

    expect(await screen.findByText('Додайте заголовок допису')).toBeInTheDocument()
    expect(screen.getByText('Додайте текст допису')).toBeInTheDocument()
    expect(screen.getByText('Перевірте заповнення обов’язкових полів.')).toBeInTheDocument()
    expect(screen.queryByText(/This field may not be blank/)).not.toBeInTheDocument()
  })

  it('creates a valid post without a cover', async () => {
    await openCreateForm()
    await fireEvent.update(screen.getByLabelText('Назва'), 'Допіс без обкладинки')
    await fireEvent.update(screen.getByPlaceholderText(/Основний текст/), 'Текст без обкладинки')

    await fireEvent.click(screen.getByRole('button', { name: 'Створити' }))

    await waitFor(() => {
      expect(mockedCreateAuthorJournalPost).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'Допіс без обкладинки',
          body: 'Текст без обкладинки',
        })
      )
    })
    expect(mockedCreateAuthorJournalPost.mock.calls[0]?.[0]).not.toHaveProperty('cover_image_url')
  })
})

describe('AuthorJournalView cover editing', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockedFetchAuthorJournalPosts.mockResolvedValue([])
    mockedCreateAuthorJournalPost.mockResolvedValue({} as never)
    mockedUpdateAuthorJournalPost.mockResolvedValue({} as never)
    mockedUploadAuthorJournalCover.mockResolvedValue({
      blob_name: 'therapists/test/journal/cover.png',
      preview_url: 'https://example.test/cover.png',
    })
  })

  async function openInlineEditor(post: AuthorJournalPost) {
    mockedFetchAuthorJournalPosts.mockResolvedValue([post])
    const result = renderView()
    await screen.findByText(post.title)
    await screen.findByRole('button', { name: 'Редагувати' })
    await fireEvent.click(screen.getByRole('button', { name: 'Редагувати' }))
    await screen.findByLabelText('Назва')
    return result
  }

  it('validates an empty title while editing and does not call the update API', async () => {
    await openInlineEditor(buildPost())
    const title = screen.getByLabelText('Назва')
    await fireEvent.update(title, '')

    await fireEvent.click(screen.getByRole('button', { name: 'Зберегти' }))

    expect(screen.getByText('Додайте заголовок допису')).toBeInTheDocument()
    expect(title).toHaveFocus()
    expect(mockedUpdateAuthorJournalPost).not.toHaveBeenCalled()
  })

  it('validates an empty body while editing and focuses the body editor', async () => {
    await openInlineEditor(buildPost())
    const body = screen.getByPlaceholderText('Основний текст')
    await fireEvent.update(body, '')

    await fireEvent.click(screen.getByRole('button', { name: 'Зберегти' }))

    expect(screen.getByText('Додайте текст допису')).toBeInTheDocument()
    expect(body).toHaveFocus()
    expect(mockedUpdateAuthorJournalPost).not.toHaveBeenCalled()
  })

  it('shows both edit errors and focuses the title when title and body are empty', async () => {
    await openInlineEditor(buildPost())
    const title = screen.getByLabelText('Назва')
    await fireEvent.update(title, '')
    await fireEvent.update(screen.getByPlaceholderText('Основний текст'), '')

    await fireEvent.click(screen.getByRole('button', { name: 'Зберегти' }))

    expect(screen.getByText('Додайте заголовок допису')).toBeInTheDocument()
    expect(screen.getByText('Додайте текст допису')).toBeInTheDocument()
    expect(title).toHaveFocus()
    expect(mockedUpdateAuthorJournalPost).not.toHaveBeenCalled()
  })

  it('localizes a server-side title error during update', async () => {
    mockedUpdateAuthorJournalPost.mockRejectedValueOnce({
      response: { data: { title: ['This field may not be blank.'] } },
    })
    await openInlineEditor(buildPost())

    await fireEvent.click(screen.getByRole('button', { name: 'Зберегти' }))

    expect(await screen.findByText('Додайте заголовок допису')).toBeInTheDocument()
    expect(screen.queryByText(/This field may not be blank/)).not.toBeInTheDocument()
    expect(screen.queryByText(/^title:/)).not.toBeInTheDocument()
  })

  it('localizes a server-side body error during update', async () => {
    mockedUpdateAuthorJournalPost.mockRejectedValueOnce({
      response: { data: { body: ['This field may not be blank.'] } },
    })
    await openInlineEditor(buildPost())

    await fireEvent.click(screen.getByRole('button', { name: 'Зберегти' }))

    expect(await screen.findByText('Додайте текст допису')).toBeInTheDocument()
    expect(screen.queryByText(/This field may not be blank/)).not.toBeInTheDocument()
    expect(screen.queryByText(/^body:/)).not.toBeInTheDocument()
  })

  it('uses a safe Ukrainian fallback for non-field update errors', async () => {
    mockedUpdateAuthorJournalPost.mockRejectedValueOnce({
      response: { data: { non_field_errors: ['Unsafe backend validation text'] } },
    })
    await openInlineEditor(buildPost())

    await fireEvent.click(screen.getByRole('button', { name: 'Зберегти' }))

    expect(
      await screen.findByText('Не вдалося оновити допис. Перевірте дані та спробуйте ще раз.')
    ).toBeInTheDocument()
    expect(screen.queryByText(/Unsafe backend validation text/)).not.toBeInTheDocument()
    expect(screen.queryByText(/non_field_errors/)).not.toBeInTheDocument()
  })

  it('updates a valid existing post without a cover', async () => {
    const post = buildPost({ cover_image_url: '' })
    mockedUpdateAuthorJournalPost.mockResolvedValue(post)
    await openInlineEditor(post)

    await fireEvent.click(screen.getByRole('button', { name: 'Зберегти' }))

    await waitFor(() => expect(mockedUpdateAuthorJournalPost).toHaveBeenCalledWith(post.id, expect.any(Object)))
    expect(mockedUpdateAuthorJournalPost.mock.calls[0]?.[1]).not.toHaveProperty('cover_image_url')
  })

  it('opens the file chooser for an existing post without a cover', async () => {
    await openInlineEditor(buildPost())

    const input = screen.getByLabelText('Завантажити файл обкладинки') as HTMLInputElement
    const clickSpy = vi.spyOn(input, 'click')
    await fireEvent.click(screen.getByRole('button', { name: 'Завантажити файл' }))

    expect(clickSpy).toHaveBeenCalledOnce()
    expect(input).toHaveAttribute('accept', 'image/*')
    expect(input.closest('.cover-row')).toBeInTheDocument()
  })

  it('allows adding a cover after a post was created without one', async () => {
    const post = buildPost({ title: 'Створений без обкладинки' })
    mockedFetchAuthorJournalPosts.mockResolvedValueOnce([]).mockResolvedValue([post])
    mockedCreateAuthorJournalPost.mockResolvedValue(post)
    renderView()

    await fireEvent.click(await screen.findByRole('button', { name: '+ Новий допис' }))
    await fireEvent.update(screen.getByLabelText('Назва'), post.title)
    await fireEvent.update(screen.getByPlaceholderText(/Основний текст/), post.body)
    await fireEvent.click(screen.getByRole('button', { name: 'Створити' }))
    await waitFor(() => expect(mockedCreateAuthorJournalPost).toHaveBeenCalled())

    await fireEvent.click(await screen.findByRole('button', { name: 'Редагувати' }))
    const file = buildCoverFile()
    await fireEvent.change(screen.getByLabelText('Завантажити файл обкладинки'), {
      target: { files: [file] },
    })

    await waitFor(() => expect(mockedUploadAuthorJournalCover).toHaveBeenCalledWith(file))
    expect(screen.getByRole('img', { name: 'Обкладинка допису' })).toHaveAttribute(
      'src',
      'https://example.test/cover.png'
    )
  })

  it('adds a cover to an existing post, previews it, and keeps the edit payload current', async () => {
    const post = buildPost()
    const savedPost = buildPost({ cover_image_url: 'https://example.test/saved-cover.png' })
    const { container } = await openInlineEditor(post)
    mockedFetchAuthorJournalPosts.mockResolvedValue([savedPost])
    mockedUpdateAuthorJournalPost.mockResolvedValue(savedPost)
    const file = buildCoverFile()

    await fireEvent.change(screen.getByLabelText('Завантажити файл обкладинки'), {
      target: { files: [file] },
    })

    await waitFor(() => {
      expect(mockedUploadAuthorJournalCover).toHaveBeenCalledWith(file)
    })
    expect(container.querySelector('.cover-preview img')).toHaveAttribute(
      'src',
      'https://example.test/cover.png'
    )

    await fireEvent.click(screen.getByRole('button', { name: 'Зберегти' }))
    await waitFor(() => {
      expect(mockedUpdateAuthorJournalPost).toHaveBeenCalledWith(
        post.id,
        expect.objectContaining({
          cover_image_url: 'therapists/test/journal/cover.png',
          title: post.title,
          body: post.body,
          is_published: false,
        })
      )
    })

    await waitFor(() => expect(screen.getByRole('button', { name: 'Редагувати' })).toBeInTheDocument())
    await fireEvent.click(screen.getByRole('button', { name: 'Редагувати' }))
    expect(container.querySelector('.cover-preview img')).toHaveAttribute(
      'src',
      'https://example.test/saved-cover.png'
    )
  })

  it('replaces and removes an existing cover without changing publication state or text', async () => {
    const post = buildPost({
      title: 'Незмінна назва',
      body: 'Незмінний текст',
      is_published: true,
      cover_image_url: 'https://example.test/original-cover.png',
    })
    const { container } = await openInlineEditor(post)
    const replacement = buildCoverFile('replacement.webp', 'image/webp')

    await fireEvent.change(screen.getByLabelText('Завантажити файл обкладинки'), {
      target: { files: [replacement] },
    })
    await waitFor(() => expect(mockedUploadAuthorJournalCover).toHaveBeenCalledWith(replacement))
    expect(container.querySelector('.cover-preview img')).toHaveAttribute(
      'src',
      'https://example.test/cover.png'
    )

    await fireEvent.click(screen.getByRole('button', { name: 'Зберегти' }))
    await waitFor(() => {
      expect(mockedUpdateAuthorJournalPost).toHaveBeenCalledWith(
        post.id,
        expect.objectContaining({
          cover_image_url: 'therapists/test/journal/cover.png',
          title: 'Незмінна назва',
          body: 'Незмінний текст',
          is_published: true,
        })
      )
    })

    await waitFor(() => expect(screen.getByRole('button', { name: 'Редагувати' })).toBeInTheDocument())
    await fireEvent.click(screen.getByRole('button', { name: 'Редагувати' }))
    await fireEvent.click(screen.getByRole('button', { name: 'Прибрати' }))
    expect(container.querySelector('.inline-edit .cover-preview img')).not.toBeInTheDocument()
    await fireEvent.click(screen.getByRole('button', { name: 'Зберегти' }))
    await waitFor(() => {
      expect(mockedUpdateAuthorJournalPost).toHaveBeenLastCalledWith(
        post.id,
        expect.objectContaining({ cover_image_url: '' })
      )
    })
  })

  it('does not remove an unchanged cover and ignores a cancelled file selection', async () => {
    const post = buildPost({ cover_image_url: 'https://example.test/original-cover.png' })
    await openInlineEditor(post)

    await fireEvent.change(screen.getByLabelText('Завантажити файл обкладинки'), {
      target: { files: [] },
    })
    expect(mockedUploadAuthorJournalCover).not.toHaveBeenCalled()
    expect(screen.getByRole('img', { name: 'Обкладинка допису' })).toBeInTheDocument()

    await fireEvent.click(screen.getByRole('button', { name: 'Зберегти' }))
    await waitFor(() => expect(mockedUpdateAuthorJournalPost).toHaveBeenCalled())
    expect(mockedUpdateAuthorJournalPost.mock.calls[0]?.[1]).not.toHaveProperty('cover_image_url')
  })

  it('shows local validation and upload errors without replacing the saved preview', async () => {
    const post = buildPost({ cover_image_url: 'https://example.test/original-cover.png' })
    const { container } = await openInlineEditor(post)

    await fireEvent.change(screen.getByLabelText('Завантажити файл обкладинки'), {
      target: { files: [buildCoverFile('cover.pdf', 'application/pdf')] },
    })
    expect(screen.getByRole('alert')).toHaveTextContent('Оберіть файл зображення для обкладинки.')
    expect(mockedUploadAuthorJournalCover).not.toHaveBeenCalled()

    const oversized = buildCoverFile('large.png', 'image/png', new Uint8Array(10 * 1024 * 1024 + 1))
    await fireEvent.change(screen.getByLabelText('Завантажити файл обкладинки'), {
      target: { files: [oversized] },
    })
    expect(screen.getByRole('alert')).toHaveTextContent('Розмір обкладинки не може перевищувати 10 МБ.')

    mockedUploadAuthorJournalCover.mockRejectedValueOnce({
      response: { data: { detail: 'Не вдалося завантажити обкладинку.' } },
    })
    await fireEvent.change(screen.getByLabelText('Завантажити файл обкладинки'), {
      target: { files: [buildCoverFile('new.png')] },
    })
    await waitFor(() => expect(screen.getByRole('alert')).toHaveTextContent('Не вдалося завантажити обкладинку'))
    expect(container.querySelector('.cover-preview img')).toHaveAttribute(
      'src',
      'https://example.test/original-cover.png'
    )
  })

  it('keeps the existing create-with-cover flow intact before an article is edited', async () => {
    mockedCreateAuthorJournalPost.mockResolvedValue(buildPost() as never)
    renderView()

    await fireEvent.click(await screen.findByRole('button', { name: '+ Новий допис' }))
    await fireEvent.update(screen.getByLabelText('Назва'), 'Новий допис')
    await fireEvent.update(screen.getByPlaceholderText(/Основний текст/), 'Текст нового допису')
    const file = buildCoverFile('new-cover.jpg', 'image/jpeg')
    await fireEvent.change(screen.getByLabelText('Завантажити файл обкладинки'), {
      target: { files: [file] },
    })
    await waitFor(() => expect(mockedUploadAuthorJournalCover).toHaveBeenCalledWith(file))

    await fireEvent.click(screen.getByRole('button', { name: 'Створити' }))
    await waitFor(() => {
      expect(mockedCreateAuthorJournalPost).toHaveBeenCalledWith(
        expect.objectContaining({ cover_image_url: 'therapists/test/journal/cover.png' })
      )
    })
  })
})
