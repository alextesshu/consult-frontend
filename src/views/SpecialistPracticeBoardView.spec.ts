import { fireEvent, render, screen, waitFor, within } from '@testing-library/vue'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import SpecialistPracticeBoardView from './SpecialistPracticeBoardView.vue'
import {
  archivePracticeBoardItem,
  createPracticeBoardItem,
  fetchPracticeBoardItems,
  movePracticeBoardItem,
  updatePracticeBoardItem,
} from '../lib/specialistPracticeBoard'

const mockToast = {
  success: vi.fn(),
}

vi.mock('../lib/specialistPracticeBoard', () => ({
  archivePracticeBoardItem: vi.fn(),
  fetchPracticeBoardItems: vi.fn(),
  createPracticeBoardItem: vi.fn(),
  movePracticeBoardItem: vi.fn(),
  updatePracticeBoardItem: vi.fn(),
}))
vi.mock('../composables/useToast', () => ({
  useToast: () => mockToast,
}))

const mockedFetchPracticeBoardItems = vi.mocked(fetchPracticeBoardItems)
const mockedCreatePracticeBoardItem = vi.mocked(createPracticeBoardItem)
const mockedMovePracticeBoardItem = vi.mocked(movePracticeBoardItem)
const mockedUpdatePracticeBoardItem = vi.mocked(updatePracticeBoardItem)
const mockedArchivePracticeBoardItem = vi.mocked(archivePracticeBoardItem)

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
        related_client_id: 44,
        related_session_id: 99,
      },
    ],
    in_progress: [],
    done: [],
  } as any
}

describe('SpecialistPracticeBoardView', () => {
  beforeEach(() => {
    mockedFetchPracticeBoardItems.mockReset()
    mockedCreatePracticeBoardItem.mockReset()
    mockedMovePracticeBoardItem.mockReset()
    mockedUpdatePracticeBoardItem.mockReset()
    mockedArchivePracticeBoardItem.mockReset()
    mockToast.success.mockReset()
  })

  it('renders board header and three columns after initial fetch', async () => {
    mockedFetchPracticeBoardItems.mockResolvedValue(buildColumns())

    render(SpecialistPracticeBoardView)

    expect(await screen.findByRole('heading', { name: 'Робоча дошка' })).toBeInTheDocument()
    expect(
      screen.getByText('Місце для ваших робочих задач, нагадувань і важливих кроків у роботі з клієнтами.')
    ).toBeInTheDocument()
    expect(await screen.findByText('Заплановано')).toBeInTheDocument()
    expect(screen.queryByText('Потребує уваги')).not.toBeInTheDocument()
    expect(screen.getByText('У роботі')).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Завершено' })).toBeInTheDocument()
    expect(screen.getByText('Todo task')).toBeInTheDocument()
  })

  it('creates item from inline form', async () => {
    const columnsAfterCreate = {
      todo: [
        ...buildColumns().todo,
        {
          id: 5,
          title: 'Нова задача',
          description: 'Опис задачі',
          status: 'todo',
          created_at: '2026-04-18T11:00:00Z',
          updated_at: '2026-04-18T11:00:00Z',
        },
      ],
      in_progress: [],
      done: [],
    } as any

    mockedFetchPracticeBoardItems.mockResolvedValueOnce(buildColumns()).mockResolvedValueOnce(columnsAfterCreate)
    mockedCreatePracticeBoardItem.mockResolvedValue({ id: 5 } as any)

    render(SpecialistPracticeBoardView)
    expect(await screen.findByText('Todo task')).toBeInTheDocument()

    await fireEvent.click(screen.getByRole('button', { name: 'Створити задачу' }))
    await fireEvent.update(screen.getByLabelText('Заголовок'), 'Нова задача')
    await fireEvent.update(screen.getByLabelText('Опис (опційно)'), 'Опис задачі')
    await fireEvent.click(screen.getByRole('button', { name: 'Зберегти' }))

    await waitFor(() => {
      expect(mockedCreatePracticeBoardItem).toHaveBeenCalledWith({
        title: 'Нова задача',
        description: 'Опис задачі',
      })
    })
    expect(mockToast.success).toHaveBeenCalledWith('Задачу додано на дошку')
  })

  it('does not submit create when title is empty', async () => {
    mockedFetchPracticeBoardItems.mockResolvedValue(buildColumns())

    render(SpecialistPracticeBoardView)
    expect(await screen.findByText('Todo task')).toBeInTheDocument()

    await fireEvent.click(screen.getByRole('button', { name: 'Створити задачу' }))
    await fireEvent.click(screen.getByRole('button', { name: 'Зберегти' }))

    expect(mockedCreatePracticeBoardItem).not.toHaveBeenCalled()
    expect(await screen.findByText('Вкажіть заголовок задачі.')).toBeInTheDocument()
  })

  it('moves item with expected payload', async () => {
    mockedFetchPracticeBoardItems.mockResolvedValueOnce(buildColumns()).mockResolvedValueOnce(buildColumns())
    mockedMovePracticeBoardItem.mockResolvedValue({} as any)

    render(SpecialistPracticeBoardView)
    expect(await screen.findByText('Todo task')).toBeInTheDocument()

    expect(screen.getByRole('button', { name: 'Взяти в роботу' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Завершено' })).toBeInTheDocument()

    await fireEvent.click(screen.getByRole('button', { name: 'Взяти в роботу' }))

    await waitFor(() => {
      expect(mockedMovePracticeBoardItem).toHaveBeenCalledWith(1, { status: 'in_progress' })
    })
  })

  it('opens description in details dialog from card action', async () => {
    const description = 'Детальний опис задачі для перевірки.'
    mockedFetchPracticeBoardItems.mockResolvedValue({
      todo: [
        {
          id: 1,
          title: 'Task with details',
          description,
          status: 'todo',
          created_at: '2026-04-18T10:00:00Z',
          updated_at: '2026-04-18T10:00:00Z',
        },
      ],
      in_progress: [],
      done: [],
    } as any)

    render(SpecialistPracticeBoardView)

    const detailsButton = await screen.findByRole('button', { name: 'Деталі' })
    expect(detailsButton).toBeInTheDocument()
    expect(detailsButton.className.includes('btn--ghost')).toBe(false)

    const card = detailsButton.closest('.board-card')
    if (!card) throw new Error('Card not found')
    const actions = card.querySelector('.board-card__actions')
    if (!(actions instanceof HTMLElement)) throw new Error('Actions container not found')
    const firstAction = actions.querySelector('button')
    expect(firstAction?.textContent?.trim()).toBe('Деталі')

    expect(screen.queryByText(description)).not.toBeInTheDocument()

    await fireEvent.click(screen.getByRole('button', { name: 'Деталі' }))

    expect(screen.getByRole('dialog', { name: 'Деталі задачі' })).toBeInTheDocument()
    expect(screen.getByText(description)).toBeInTheDocument()
  })

  it('edits card inline via patch endpoint', async () => {
    mockedFetchPracticeBoardItems
      .mockResolvedValueOnce(buildColumns())
      .mockResolvedValueOnce({
        todo: [
          {
            ...buildColumns().todo[0],
            title: 'Edited todo',
            description: 'Edited description',
          },
        ],
        in_progress: [],
        done: [],
      } as any)
    mockedUpdatePracticeBoardItem.mockResolvedValue({} as any)

    render(SpecialistPracticeBoardView)
    expect(await screen.findByText('Todo task')).toBeInTheDocument()

    await fireEvent.click(screen.getByRole('button', { name: 'Редагувати' }))

    const editForm = screen.getByDisplayValue('Todo task').closest('.board-card')
    if (!editForm) throw new Error('Edit card not found')

    await fireEvent.update(within(editForm).getByDisplayValue('Todo task'), 'Edited todo')
    await fireEvent.update(within(editForm).getByDisplayValue('Todo description'), 'Edited description')
    await fireEvent.click(within(editForm).getByRole('button', { name: 'Зберегти' }))

    await waitFor(() => {
      expect(mockedUpdatePracticeBoardItem).toHaveBeenCalledWith(1, {
        title: 'Edited todo',
        description: 'Edited description',
      })
    })
    expect(mockToast.success).toHaveBeenCalledWith('Задачу оновлено')
  })

  it('archives item after inline confirmation', async () => {
    mockedFetchPracticeBoardItems
      .mockResolvedValueOnce(buildColumns())
      .mockResolvedValueOnce({
        todo: [],
        in_progress: [],
        done: [],
      } as any)
    mockedArchivePracticeBoardItem.mockResolvedValue({} as any)

    render(SpecialistPracticeBoardView)
    expect(await screen.findByText('Todo task')).toBeInTheDocument()

    await fireEvent.click(screen.getByRole('button', { name: 'Видалити' }))
    expect(screen.getByText('Видалити цю задачу?')).toBeInTheDocument()

    const confirmPanel = screen.getByText('Видалити цю задачу?').closest('.board-card__confirm')
    if (!confirmPanel) throw new Error('Confirm panel not found')

    await fireEvent.click(within(confirmPanel).getByRole('button', { name: 'Видалити' }))

    await waitFor(() => {
      expect(mockedArchivePracticeBoardItem).toHaveBeenCalledWith(1)
    })
    expect(mockToast.success).toHaveBeenCalledWith('Задачу видалено')
  })

  it('renders backlog return CTA as "Повернути в заплановане"', async () => {
    mockedFetchPracticeBoardItems.mockResolvedValue({
      todo: [],
      in_progress: [
        {
          id: 2,
          title: 'In progress task',
          description: null,
          status: 'in_progress',
          created_at: '2026-04-18T10:00:00Z',
          updated_at: '2026-04-18T10:00:00Z',
        },
      ],
      done: [
        {
          id: 3,
          title: 'Done task',
          description: null,
          status: 'done',
          created_at: '2026-04-18T10:00:00Z',
          updated_at: '2026-04-18T10:00:00Z',
        },
      ],
    } as any)

    render(SpecialistPracticeBoardView)

    expect(await screen.findAllByRole('button', { name: 'Повернути в заплановане' })).toHaveLength(1)
    expect(screen.queryByRole('button', { name: 'Повернути до уваги' })).not.toBeInTheDocument()
  })

  it('renders empty state when there are no tasks', async () => {
    mockedFetchPracticeBoardItems.mockResolvedValue({
      todo: [],
      in_progress: [],
      done: [],
    } as any)

    render(SpecialistPracticeBoardView)

    expect(await screen.findByText('Поки що тут порожньо')).toBeInTheDocument()
    expect(
      screen.getByText('Додайте першу задачу, щоб зафіксувати важливий крок, follow-up або нагадування.')
    ).toBeInTheDocument()
  })

  it('renders fetch error without crashing view', async () => {
    mockedFetchPracticeBoardItems.mockRejectedValue(new Error('fetch failed'))

    render(SpecialistPracticeBoardView)

    expect(await screen.findByText('Не вдалося завантажити задачі дошки.')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Повторити' })).toBeInTheDocument()
  })
})
