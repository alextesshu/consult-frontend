import { fireEvent, render, screen, waitFor } from '@testing-library/vue'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import SpecialistPracticeBoardView from './SpecialistPracticeBoardView.vue'
import {
  archivePracticeBoardItem,
  createPracticeBoard,
  createPracticeBoardItem,
  fetchPracticeBoardItems,
  fetchPracticeBoards,
  movePracticeBoardItem,
  updatePracticeBoard,
  updatePracticeBoardItem,
} from '../lib/specialistPracticeBoard'

const mockToast = {
  success: vi.fn(),
}

vi.mock('../lib/specialistPracticeBoard', () => ({
  archivePracticeBoardItem: vi.fn(),
  createPracticeBoard: vi.fn(),
  createPracticeBoardItem: vi.fn(),
  fetchPracticeBoardItems: vi.fn(),
  fetchPracticeBoards: vi.fn(),
  isBoardLimitReachedError: (error: any) => error?.response?.status === 409 && error?.response?.data?.code === 'BOARD_LIMIT_REACHED',
  movePracticeBoardItem: vi.fn(),
  resolveDefaultPracticeBoardId: (boards: Array<{ id: number | string; is_default: boolean }>) =>
    boards.find((b) => b.is_default)?.id ?? boards[0]?.id ?? null,
  updatePracticeBoard: vi.fn(),
  updatePracticeBoardItem: vi.fn(),
}))
vi.mock('../composables/useToast', () => ({
  useToast: () => mockToast,
}))

const mockedFetchPracticeBoards = vi.mocked(fetchPracticeBoards)
const mockedFetchPracticeBoardItems = vi.mocked(fetchPracticeBoardItems)
const mockedCreatePracticeBoard = vi.mocked(createPracticeBoard)
const mockedUpdatePracticeBoard = vi.mocked(updatePracticeBoard)
const mockedCreatePracticeBoardItem = vi.mocked(createPracticeBoardItem)
const mockedMovePracticeBoardItem = vi.mocked(movePracticeBoardItem)
const mockedUpdatePracticeBoardItem = vi.mocked(updatePracticeBoardItem)
const mockedArchivePracticeBoardItem = vi.mocked(archivePracticeBoardItem)

function buildBoards() {
  return [
    { id: 1, title: 'Основна дошка', is_default: true },
    { id: 2, title: 'Дошка follow-up', is_default: false },
  ]
}

function buildColumns() {
  return {
    todo: [
      {
        id: 1,
        title: 'Todo task',
        description: 'Todo description',
        status: 'todo',
        created_at: '2026-04-18T10:00:00Z',
        updated_at: '2026-04-18T10:00:00Z',
      },
    ],
    in_progress: [],
    done: [],
  } as any
}

describe('SpecialistPracticeBoardView', () => {
  beforeEach(() => {
    mockedFetchPracticeBoards.mockReset()
    mockedFetchPracticeBoardItems.mockReset()
    mockedCreatePracticeBoard.mockReset()
    mockedUpdatePracticeBoard.mockReset()
    mockedCreatePracticeBoardItem.mockReset()
    mockedMovePracticeBoardItem.mockReset()
    mockedUpdatePracticeBoardItem.mockReset()
    mockedArchivePracticeBoardItem.mockReset()
    mockToast.success.mockReset()
  })

  it('loads boards and resolves current board from default', async () => {
    mockedFetchPracticeBoards.mockResolvedValue(buildBoards() as any)
    mockedFetchPracticeBoardItems.mockResolvedValue(buildColumns())

    const { container } = render(SpecialistPracticeBoardView)

    expect(await screen.findByRole('heading', { level: 1, name: 'Задачі' })).toBeInTheDocument()
    expect(screen.getByText('ЗАДАЧІ')).toBeInTheDocument()
    expect(
      screen.getByText('Наступні кроки, нагадування й задачі по клієнтах та сесіях — в одному місці.')
    ).toBeInTheDocument()
    expect(await screen.findByText('Todo task')).toBeInTheDocument()
    expect(screen.getByText('СПИСКИ ЗАДАЧ')).toBeInTheDocument()
    await waitFor(() => {
      expect(container.querySelectorAll('.practice-board__board-chip').length).toBe(2)
    })
    expect(mockedFetchPracticeBoardItems).toHaveBeenCalledWith('1')
  })

  it('uses first board when default is not marked', async () => {
    mockedFetchPracticeBoards.mockResolvedValue([
      { id: 11, title: 'Перша дошка', is_default: false },
      { id: 22, title: 'Друга дошка', is_default: false },
    ] as any)
    mockedFetchPracticeBoardItems.mockResolvedValue(buildColumns())

    render(SpecialistPracticeBoardView)
    await screen.findByText('Todo task')

    expect(mockedFetchPracticeBoardItems).toHaveBeenCalledWith('11')
  })

  it('shows empty-board bootstrap state and no item create form when boards are missing', async () => {
    mockedFetchPracticeBoards.mockResolvedValue([])
    mockedFetchPracticeBoardItems.mockResolvedValue(buildColumns())

    render(SpecialistPracticeBoardView)

    expect(await screen.findByText('Поки що немає списків')).toBeInTheDocument()
    expect(mockedFetchPracticeBoardItems).not.toHaveBeenCalled()
    expect(
      screen.getByText('Створіть перший список, щоб додавати задачі та організовувати роботу.')
    ).toBeInTheDocument()
    expect(screen.queryByRole('heading', { level: 2, name: 'Нова задача' })).not.toBeInTheDocument()
    expect(screen.getAllByRole('button', { name: 'Створити список' }).length).toBeGreaterThan(0)

    await fireEvent.click(screen.getAllByRole('button', { name: 'Створити список' })[0]!)
    expect(screen.getByLabelText('Назва списку')).toBeInTheDocument()
  })

  it('switches board and refetches board-scoped items', async () => {
    mockedFetchPracticeBoards.mockResolvedValue(buildBoards() as any)
    mockedFetchPracticeBoardItems
      .mockResolvedValueOnce(buildColumns())
      .mockResolvedValueOnce({
        todo: [],
        in_progress: [{ ...buildColumns().todo[0], id: 2, status: 'in_progress', title: 'In Progress Task' }],
        done: [],
      } as any)

    render(SpecialistPracticeBoardView)
    expect(await screen.findByText('Todo task')).toBeInTheDocument()

    await fireEvent.click(screen.getByRole('button', { name: 'Дошка follow-up' }))
    await waitFor(() => expect(mockedFetchPracticeBoardItems).toHaveBeenLastCalledWith('2'))
    expect(await screen.findByText('In Progress Task')).toBeInTheDocument()
  })

  it('includes board_id when creating item', async () => {
    mockedFetchPracticeBoards.mockResolvedValue(buildBoards() as any)
    mockedFetchPracticeBoardItems.mockResolvedValue(buildColumns())
    mockedCreatePracticeBoardItem.mockResolvedValue({ id: 5 } as any)

    render(SpecialistPracticeBoardView)
    expect(await screen.findByText('Todo task')).toBeInTheDocument()

    await fireEvent.click(screen.getByRole('button', { name: 'Створити задачу' }))
    await fireEvent.update(screen.getByLabelText('Заголовок'), 'Нова задача')
    await fireEvent.click(screen.getByRole('button', { name: 'Зберегти' }))

    await waitFor(() => {
      expect(mockedCreatePracticeBoardItem).toHaveBeenCalledWith(
        expect.objectContaining({
          board_id: '1',
          title: 'Нова задача',
        })
      )
    })
  })

  it('creates board and switches to it', async () => {
    mockedFetchPracticeBoards
      .mockResolvedValueOnce([{ id: 1, title: 'Основна дошка', is_default: true }] as any)
      .mockResolvedValueOnce([
        { id: 1, title: 'Основна дошка', is_default: true },
        { id: 8, title: 'Тиждень', is_default: false },
      ] as any)
    mockedFetchPracticeBoardItems.mockResolvedValue(buildColumns())
    mockedCreatePracticeBoard.mockResolvedValue({ id: 8, title: 'Тиждень', is_default: false } as any)

    render(SpecialistPracticeBoardView)
    await screen.findByText('Todo task')

    await fireEvent.click(screen.getByRole('button', { name: 'Створити список' }))
    await fireEvent.update(screen.getByLabelText('Назва списку'), 'Тиждень')
    await fireEvent.click(screen.getAllByRole('button', { name: 'Зберегти' })[0]!)

    await waitFor(() => {
      expect(mockedCreatePracticeBoard).toHaveBeenCalledWith({ title: 'Тиждень' })
      expect(mockedFetchPracticeBoardItems).toHaveBeenLastCalledWith('8')
    })
  })

  it('renames current board', async () => {
    mockedFetchPracticeBoards.mockResolvedValue(buildBoards() as any)
    mockedFetchPracticeBoardItems.mockResolvedValue(buildColumns())
    mockedUpdatePracticeBoard.mockResolvedValue({ id: 1, title: 'Оновлена', is_default: true } as any)

    render(SpecialistPracticeBoardView)
    await screen.findByText('Todo task')

    await fireEvent.click(screen.getByRole('button', { name: 'Редагувати назву' }))
    await fireEvent.update(screen.getByLabelText('Нова назва списку'), 'Оновлена')
    await fireEvent.click(screen.getAllByRole('button', { name: 'Зберегти' })[0]!)

    await waitFor(() => expect(mockedUpdatePracticeBoard).toHaveBeenCalledWith('1', { title: 'Оновлена' }))
  })

  it('handles BOARD_LIMIT_REACHED for create board', async () => {
    mockedFetchPracticeBoards.mockResolvedValue([{ id: 1, title: 'Основна дошка', is_default: true }] as any)
    mockedFetchPracticeBoardItems.mockResolvedValue(buildColumns())
    mockedCreatePracticeBoard.mockRejectedValue({
      response: { status: 409, data: { code: 'BOARD_LIMIT_REACHED' } },
    })

    render(SpecialistPracticeBoardView)
    await screen.findByText('Todo task')

    await fireEvent.click(screen.getByRole('button', { name: 'Створити список' }))
    await fireEvent.update(screen.getByLabelText('Назва списку'), 'Нова дошка')
    await fireEvent.click(screen.getAllByRole('button', { name: 'Зберегти' })[0]!)

    expect(await screen.findByText('Ліміт списків для вашого тарифу вичерпано.')).toBeInTheDocument()
  })

  it('renders simple single-board UX without switcher chips', async () => {
    mockedFetchPracticeBoards.mockResolvedValue([{ id: 1, title: 'Єдина дошка', is_default: true }] as any)
    mockedFetchPracticeBoardItems.mockResolvedValue(buildColumns())

    const { container } = render(SpecialistPracticeBoardView)
    await screen.findByText('Todo task')

    expect(container.querySelectorAll('.practice-board__board-chip').length).toBe(0)
    expect(container.querySelector('.practice-board__boards .panel__title')?.textContent).toContain('Єдина дошка')
  })

  it('localizes legacy Board title in UI', async () => {
    mockedFetchPracticeBoards.mockResolvedValue([{ id: 1, title: 'Board', is_default: true }] as any)
    mockedFetchPracticeBoardItems.mockResolvedValue(buildColumns())

    const { container } = render(SpecialistPracticeBoardView)
    await screen.findByText('Todo task')

    expect(container.querySelector('.practice-board__boards .panel__title')?.textContent).toContain('Основний список')
    expect(container.querySelector('.practice-board__boards .panel__title')?.textContent).not.toContain('Робоча дошка')
  })

  it('prefills new board form with Ukrainian default title', async () => {
    mockedFetchPracticeBoards.mockResolvedValue(buildBoards() as any)
    mockedFetchPracticeBoardItems.mockResolvedValue(buildColumns())

    render(SpecialistPracticeBoardView)
    await screen.findByText('Todo task')

    await fireEvent.click(screen.getByRole('button', { name: 'Створити список' }))
    const input = screen.getByLabelText('Назва списку') as HTMLInputElement
    expect(input.value).toBe('Новий список')
  })

  it('renders human task context without internal client or session ids', async () => {
    mockedFetchPracticeBoards.mockResolvedValue(buildBoards() as any)
    mockedFetchPracticeBoardItems.mockResolvedValue({
      todo: [
        {
          ...buildColumns().todo[0],
          id: 10,
          title: 'Session fallback task',
          related_client_id: 41,
          related_session_id: 77,
          source_type: 'session',
        },
        {
          ...buildColumns().todo[0],
          id: 11,
          title: 'Named client task',
          related_client_id: 42,
          related_session_id: 78,
          related_client_display_name: 'Олена Коваль',
          related_session_starts_at: '2026-06-01T09:00:00Z',
        },
      ],
      in_progress: [],
      done: [],
    } as any)

    render(SpecialistPracticeBoardView)
    await screen.findByText('Session fallback task')

    expect(screen.getByText('Задача з сесії')).toBeInTheDocument()
    expect(screen.getByText(/Клієнт: Олена Коваль/)).toBeInTheDocument()
    expect(document.body).not.toHaveTextContent(/Клієнт\s#/)
    expect(document.body).not.toHaveTextContent(/Сесія\s#/)
  })

  it('keeps move, edit, and archive behavior', async () => {
    mockedFetchPracticeBoards.mockResolvedValue(buildBoards() as any)
    mockedFetchPracticeBoardItems.mockResolvedValue(buildColumns())
    mockedMovePracticeBoardItem.mockResolvedValue({} as any)
    mockedUpdatePracticeBoardItem.mockResolvedValue({} as any)
    mockedArchivePracticeBoardItem.mockResolvedValue({} as any)

    const { container } = render(SpecialistPracticeBoardView)
    await screen.findByText('Todo task')

    await fireEvent.click(screen.getByRole('button', { name: 'Взяти в роботу' }))
    await waitFor(() => expect(mockedMovePracticeBoardItem).toHaveBeenCalledWith(1, { status: 'in_progress' }))

    await fireEvent.click(screen.getByRole('button', { name: 'Редагувати' }))
    await fireEvent.update(screen.getByDisplayValue('Todo task'), 'Edited todo')
    await fireEvent.click(screen.getByRole('button', { name: 'Зберегти' }))
    await waitFor(() => expect(mockedUpdatePracticeBoardItem).toHaveBeenCalledWith(1, expect.any(Object)))

    const removeButton = container.querySelector('.board-card__remove') as HTMLButtonElement | null
    expect(removeButton).toBeTruthy()
    await fireEvent.click(removeButton as HTMLButtonElement)
    const confirmDeleteButton = container.querySelector('.board-card__confirm .btn.btn--sm') as HTMLButtonElement | null
    expect(confirmDeleteButton).toBeTruthy()
    await fireEvent.click(confirmDeleteButton as HTMLButtonElement)
    await waitFor(() => expect(mockedArchivePracticeBoardItem).toHaveBeenCalledWith(1))
  })
})
