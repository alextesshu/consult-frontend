import { fireEvent, render, screen, waitFor } from '@testing-library/vue'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import AuthorJournalView from './AuthorJournalView.vue'
import { createAuthorJournalPost } from '../lib/api'

vi.mock('vue-router', () => ({
  useRouter: () => ({ push: vi.fn() }),
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
    fetchSpecialistProfile: vi.fn().mockResolvedValue({ slug: 'synthetic-specialist' }),
    createAuthorJournalPost: vi.fn().mockResolvedValue({}),
    updateAuthorJournalPost: vi.fn().mockResolvedValue({}),
    deleteAuthorJournalPost: vi.fn().mockResolvedValue(undefined),
    uploadAuthorJournalCover: vi.fn(),
  }
})

const mockedCreateAuthorJournalPost = vi.mocked(createAuthorJournalPost)

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

describe('AuthorJournalView content-driven FAQ visibility', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockedCreateAuthorJournalPost.mockResolvedValue({} as never)
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
