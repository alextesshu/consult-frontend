import { beforeEach, describe, expect, it, vi } from 'vitest'
import { apiGet, apiPatch, apiPost } from './api'
import {
  createPracticeBoardItem,
  fetchPracticeBoardItems,
  movePracticeBoardItem,
  normalizePracticeBoardColumns,
  updatePracticeBoardItem,
} from './specialistPracticeBoard'

vi.mock('./api', () => ({
  apiGet: vi.fn(),
  apiPatch: vi.fn(),
  apiPost: vi.fn(),
}))

const mockedApiGet = vi.mocked(apiGet)
const mockedApiPatch = vi.mocked(apiPatch)
const mockedApiPost = vi.mocked(apiPost)

describe('specialistPracticeBoard', () => {
  beforeEach(() => {
    mockedApiGet.mockReset()
    mockedApiPatch.mockReset()
    mockedApiPost.mockReset()
  })

  it('normalizes flat list response into three columns', () => {
    const columns = normalizePracticeBoardColumns({
      items: [
        {
          id: 1,
          title: 'Task A',
          description: null,
          status: 'todo',
          created_at: '2026-04-18T10:00:00Z',
          updated_at: '2026-04-18T10:00:00Z',
        },
        {
          id: 2,
          title: 'Task B',
          description: null,
          status: 'done',
          created_at: '2026-04-18T10:00:00Z',
          updated_at: '2026-04-18T11:00:00Z',
        },
      ],
    })

    expect(columns.todo).toHaveLength(1)
    expect(columns.in_progress).toHaveLength(0)
    expect(columns.done).toHaveLength(1)
    expect(columns.todo[0]?.title).toBe('Task A')
    expect(columns.done[0]?.title).toBe('Task B')
  })

  it('normalizes grouped response into three columns', () => {
    const columns = normalizePracticeBoardColumns({
      todo: [
        {
          id: 10,
          title: 'Todo item',
          description: null,
          status: 'todo',
          created_at: '2026-04-18T10:00:00Z',
          updated_at: '2026-04-18T10:00:00Z',
        },
      ],
      in_progress: [
        {
          id: 11,
          title: 'In progress item',
          description: null,
          status: 'in_progress',
          created_at: '2026-04-18T10:00:00Z',
          updated_at: '2026-04-18T10:00:00Z',
        },
      ],
      done: [
        {
          id: 12,
          title: 'Done item',
          description: null,
          status: 'done',
          created_at: '2026-04-18T10:00:00Z',
          updated_at: '2026-04-18T10:00:00Z',
        },
      ],
    })

    expect(columns.todo).toHaveLength(1)
    expect(columns.in_progress).toHaveLength(1)
    expect(columns.done).toHaveLength(1)
  })

  it('normalizes paginated results response into three columns', () => {
    const columns = normalizePracticeBoardColumns({
      count: 2,
      next: null,
      previous: null,
      results: [
        {
          id: 101,
          title: 'Paginated todo',
          description: null,
          status: 'todo',
          created_at: '2026-04-18T10:00:00Z',
          updated_at: '2026-04-18T11:00:00Z',
        },
        {
          id: 102,
          title: 'Paginated in progress',
          description: null,
          status: 'in_progress',
          created_at: '2026-04-18T10:00:00Z',
          updated_at: '2026-04-18T10:30:00Z',
        },
      ],
    })

    expect(columns.todo).toHaveLength(1)
    expect(columns.in_progress).toHaveLength(1)
    expect(columns.done).toHaveLength(0)
    expect(columns.todo[0]?.title).toBe('Paginated todo')
    expect(columns.in_progress[0]?.title).toBe('Paginated in progress')
  })

  it('keeps items when paginated results use DRF created/updated field names', () => {
    const columns = normalizePracticeBoardColumns({
      count: 1,
      next: null,
      previous: null,
      results: [
        {
          id: 201,
          title: 'Runtime item',
          description: 'Runtime description',
          status: 'TODO',
          created: '2026-04-18T12:00:00Z',
          updated: '2026-04-18T12:30:00Z',
          related_client_id: '44',
          related_session_id: '99',
        },
      ],
    })

    expect(columns.todo).toHaveLength(1)
    expect(columns.todo[0]?.title).toBe('Runtime item')
    expect(columns.todo[0]?.related_client_id).toBe(44)
    expect(columns.todo[0]?.related_session_id).toBe(99)
  })

  it('normalizes backend canonical columns payload with nested items arrays', () => {
    const columns = normalizePracticeBoardColumns({
      board: { specialist_id: 77 },
      columns: {
        todo: {
          label: 'Потребує уваги',
          items: [
            {
              id: 301,
              title: 'Backend nested item',
              description: null,
              status: 'todo',
              created_at: '2026-04-18T10:00:00Z',
              updated_at: '2026-04-18T10:05:00Z',
            },
          ],
        },
        in_progress: { label: 'У роботі', items: [] },
        done: { label: 'Завершено', items: [] },
      },
    })

    expect(columns.todo).toHaveLength(1)
    expect(columns.in_progress).toHaveLength(0)
    expect(columns.done).toHaveLength(0)
    expect(columns.todo[0]?.title).toBe('Backend nested item')
  })

  it('fetches board items from canonical endpoint', async () => {
    mockedApiGet.mockResolvedValue({
      items: [
        {
          id: 1,
          title: 'Task A',
          description: null,
          status: 'todo',
          created_at: '2026-04-18T10:00:00Z',
          updated_at: '2026-04-18T10:00:00Z',
        },
      ],
    } as never)

    const result = await fetchPracticeBoardItems()

    expect(mockedApiGet).toHaveBeenCalledWith('/cabinet/practice-board/items/')
    expect(result.todo).toHaveLength(1)
  })

  it('uses canonical endpoints for create and update', async () => {
    mockedApiPost.mockResolvedValue({} as never)
    mockedApiPatch.mockResolvedValue({} as never)

    await createPracticeBoardItem({ title: 'Create me' })
    await updatePracticeBoardItem(42, { title: 'Update me' })

    expect(mockedApiPost).toHaveBeenCalledWith('/cabinet/practice-board/items/', { title: 'Create me' })
    expect(mockedApiPatch).toHaveBeenCalledWith('/cabinet/practice-board/items/42/', { title: 'Update me' })
  })

  it('moves item via status payload and falls back to target_status when needed', async () => {
    mockedApiPost
      .mockRejectedValueOnce({ response: { status: 400 } } as never)
      .mockResolvedValueOnce({ id: 5 } as never)

    await movePracticeBoardItem(5, { status: 'done' })

    expect(mockedApiPost).toHaveBeenNthCalledWith(1, '/cabinet/practice-board/items/5/move/', { status: 'done' })
    expect(mockedApiPost).toHaveBeenNthCalledWith(2, '/cabinet/practice-board/items/5/move/', {
      target_status: 'done',
    })
  })
})
