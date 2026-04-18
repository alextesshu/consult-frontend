import { fireEvent, render, screen, waitFor } from '@testing-library/vue'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import SpecialistPracticeBoardView from './SpecialistPracticeBoardView.vue'
import {
  createPracticeBoardItem,
  fetchPracticeBoardItems,
  movePracticeBoardItem,
} from '../lib/specialistPracticeBoard'

vi.mock('../lib/specialistPracticeBoard', () => ({
  fetchPracticeBoardItems: vi.fn(),
  createPracticeBoardItem: vi.fn(),
  movePracticeBoardItem: vi.fn(),
}))

const mockedFetchPracticeBoardItems = vi.mocked(fetchPracticeBoardItems)
const mockedCreatePracticeBoardItem = vi.mocked(createPracticeBoardItem)
const mockedMovePracticeBoardItem = vi.mocked(movePracticeBoardItem)

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
  })

  it('renders three board columns after initial fetch', async () => {
    mockedFetchPracticeBoardItems.mockResolvedValue(buildColumns())

    render(SpecialistPracticeBoardView)

    expect(await screen.findByText('Потребує уваги')).toBeInTheDocument()
    expect(screen.getByText('У роботі')).toBeInTheDocument()
    expect(screen.getByText('Завершено')).toBeInTheDocument()
    expect(screen.getByText('Todo task')).toBeInTheDocument()
  })

  it('creates item from inline form', async () => {
    mockedFetchPracticeBoardItems
      .mockResolvedValueOnce(buildColumns())
      .mockResolvedValueOnce(buildColumns())
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
    mockedFetchPracticeBoardItems
      .mockResolvedValueOnce(buildColumns())
      .mockResolvedValueOnce(buildColumns())
    mockedMovePracticeBoardItem.mockResolvedValue({} as any)

    render(SpecialistPracticeBoardView)
    expect(await screen.findByText('Todo task')).toBeInTheDocument()

    await fireEvent.click(screen.getByRole('button', { name: 'Перемістити в роботу' }))

    await waitFor(() => {
      expect(mockedMovePracticeBoardItem).toHaveBeenCalledWith(1, { status: 'in_progress' })
    })
  })

  it('renders empty state when there are no tasks', async () => {
    mockedFetchPracticeBoardItems.mockResolvedValue({
      todo: [],
      in_progress: [],
      done: [],
    } as any)

    render(SpecialistPracticeBoardView)

    expect(await screen.findByText('Поки що немає задач')).toBeInTheDocument()
  })

  it('renders fetch error without crashing view', async () => {
    mockedFetchPracticeBoardItems.mockRejectedValue(new Error('fetch failed'))

    render(SpecialistPracticeBoardView)

    expect(await screen.findByText('Не вдалося завантажити задачі дошки.')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Повторити' })).toBeInTheDocument()
  })
})
