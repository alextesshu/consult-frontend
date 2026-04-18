import { beforeEach, describe, expect, it, vi } from 'vitest'
import { apiGet, apiPatch, apiPost } from './api'
import {
  archivePracticeBoardItem,
  createPracticeBoard,
  createPracticeBoardItem,
  fetchPracticeBoardItems,
  fetchPracticeBoards,
  isBoardLimitReachedError,
  movePracticeBoardItem,
  normalizePracticeBoardColumns,
  resolveDefaultPracticeBoardId,
  updatePracticeBoard,
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
      in_progress: [],
      done: [],
    })

    expect(columns.todo).toHaveLength(1)
    expect(columns.in_progress).toHaveLength(0)
    expect(columns.done).toHaveLength(0)
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
      ],
    })

    expect(columns.todo).toHaveLength(1)
    expect(columns.in_progress).toHaveLength(0)
    expect(columns.done).toHaveLength(0)
  })

  it('loads boards list from canonical endpoint', async () => {
    mockedApiGet.mockResolvedValue([
      { id: 1, title: 'Main board', is_default: true },
      { id: 2, title: 'Secondary board', is_default: false },
    ] as never)

    const boards = await fetchPracticeBoards()

    expect(mockedApiGet).toHaveBeenCalledWith('/cabinet/practice-board/boards/')
    expect(boards).toHaveLength(2)
    expect(boards[0]?.title).toBe('Main board')
  })

  it('resolves default board id with fallback to first board', () => {
    expect(resolveDefaultPracticeBoardId([])).toBeNull()
    expect(
      resolveDefaultPracticeBoardId([
        { id: 11, title: 'A', is_default: false },
        { id: 22, title: 'B', is_default: false },
      ])
    ).toBe(11)
    expect(
      resolveDefaultPracticeBoardId([
        { id: 11, title: 'A', is_default: false },
        { id: 22, title: 'B', is_default: true },
      ])
    ).toBe(22)
  })

  it('fetches board items with board_id query when board is selected', async () => {
    mockedApiGet.mockResolvedValue({ items: [] } as never)

    await fetchPracticeBoardItems(77)

    expect(mockedApiGet).toHaveBeenCalledWith('/cabinet/practice-board/items/', {
      params: { board_id: 77 },
    })
  })

  it('uses canonical endpoints for board create and rename', async () => {
    mockedApiPost.mockResolvedValue({} as never)
    mockedApiPatch.mockResolvedValue({} as never)

    await createPracticeBoard({ title: 'Focus board' })
    await updatePracticeBoard(5, { title: 'Updated title' })

    expect(mockedApiPost).toHaveBeenCalledWith('/cabinet/practice-board/boards/', { title: 'Focus board' })
    expect(mockedApiPatch).toHaveBeenCalledWith('/cabinet/practice-board/boards/5/', { title: 'Updated title' })
  })

  it('uses canonical endpoint for create item and requires board_id payload', async () => {
    mockedApiPost.mockResolvedValue({} as never)

    await createPracticeBoardItem({
      board_id: 2,
      title: 'Create me',
    })

    expect(mockedApiPost).toHaveBeenCalledWith('/cabinet/practice-board/items/', {
      board_id: 2,
      title: 'Create me',
    })
  })

  it('uses canonical endpoint for item update', async () => {
    mockedApiPatch.mockResolvedValue({} as never)

    await updatePracticeBoardItem(42, { title: 'Update me' })

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

  it('archives item via canonical endpoint', async () => {
    mockedApiPost.mockResolvedValue({} as never)

    await archivePracticeBoardItem(9)

    expect(mockedApiPost).toHaveBeenCalledWith('/cabinet/practice-board/items/9/archive/', {})
  })

  it('detects board quota error by status+code', () => {
    expect(isBoardLimitReachedError({ response: { status: 409, data: { code: 'BOARD_LIMIT_REACHED' } } })).toBe(true)
    expect(isBoardLimitReachedError({ response: { status: 409, data: { code: 'OTHER' } } })).toBe(false)
    expect(isBoardLimitReachedError({ response: { status: 400, data: { code: 'BOARD_LIMIT_REACHED' } } })).toBe(false)
  })
})
