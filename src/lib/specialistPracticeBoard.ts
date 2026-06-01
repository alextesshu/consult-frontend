import {
  apiGet,
  apiPatch,
  apiPost,
  type PracticeBoard,
  type PracticeBoardColumns,
  type PracticeBoardCreatePayload,
  type PracticeBoardEntityCreatePayload,
  type PracticeBoardEntityUpdatePayload,
  type PracticeBoardItem,
  type PracticeBoardMovePayload,
  type PracticeBoardStatus,
  type PracticeBoardUpdatePayload,
} from './api'

type PracticeBoardFlatResponse = {
  items?: unknown
  results?: unknown
  columns?: unknown
}

type PracticeBoardGroupedResponse = Partial<Record<PracticeBoardStatus, unknown>>

type PracticeBoardsPayload = {
  boards?: unknown
  items?: unknown
  results?: unknown
}

const PRACTICE_BOARD_ITEMS_URL = '/cabinet/practice-board/items/'
const PRACTICE_BOARDS_URL = '/cabinet/practice-board/boards/'

function createEmptyColumns(): PracticeBoardColumns {
  return {
    todo: [],
    in_progress: [],
    done: [],
  }
}

function isPracticeBoardStatus(value: unknown): value is PracticeBoardStatus {
  return value === 'todo' || value === 'in_progress' || value === 'done'
}

function normalizeStatus(value: unknown): PracticeBoardStatus | null {
  if (typeof value !== 'string') return null
  const normalized = value.trim().toLowerCase()
  return isPracticeBoardStatus(normalized) ? normalized : null
}

function readString(source: Record<string, unknown>, key: string): string {
  const value = source[key]
  return typeof value === 'string' ? value.trim() : ''
}

function readDateString(source: Record<string, unknown>, keys: string[]): string {
  for (const key of keys) {
    const value = readString(source, key)
    if (value) return value
  }
  return ''
}

function readNumberOrNull(value: unknown): number | null {
  if (typeof value === 'number' && Number.isFinite(value)) return value
  if (typeof value !== 'string') return null
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : null
}

function normalizeItem(input: unknown): PracticeBoardItem | null {
  if (!input || typeof input !== 'object') return null
  const raw = input as Record<string, unknown>
  const status = normalizeStatus(raw.status)
  const title = readString(raw, 'title')
  const createdAt = readDateString(raw, ['created_at', 'createdAt', 'created'])
  const updatedAt = readDateString(raw, ['updated_at', 'updatedAt', 'updated']) || createdAt
  if (!status) return null
  if (!title) return null
  if (!updatedAt || !createdAt) return null

  return {
    id: (raw.id as number | string) ?? '',
    board_id: (raw.board_id as number | string) ?? null,
    title,
    description: typeof raw.description === 'string' ? raw.description : null,
    status,
    priority: typeof raw.priority === 'string' ? raw.priority : null,
    related_client_id: readNumberOrNull(raw.related_client_id),
    related_session_id: readNumberOrNull(raw.related_session_id),
    related_client_display_name: readString(raw, 'related_client_display_name') || null,
    related_session_starts_at: readDateString(raw, ['related_session_starts_at', 'related_session_start_at']) || null,
    related_session_label: readString(raw, 'related_session_label') || null,
    source_type: (raw.source_type as PracticeBoardItem['source_type']) ?? null,
    source_id: (raw.source_id as PracticeBoardItem['source_id']) ?? null,
    created_at: createdAt,
    updated_at: updatedAt,
    completed_at: typeof raw.completed_at === 'string' ? raw.completed_at : null,
  }
}

function normalizeBoard(input: unknown): PracticeBoard | null {
  if (!input || typeof input !== 'object') return null
  const raw = input as Record<string, unknown>
  const id = raw.id as number | string | undefined
  const title = readString(raw, 'title')
  if (!id) return null
  if (!title) return null

  return {
    id,
    title,
    is_default: Boolean(raw.is_default),
    created_at: readDateString(raw, ['created_at', 'createdAt', 'created']) || undefined,
    updated_at: readDateString(raw, ['updated_at', 'updatedAt', 'updated']) || undefined,
  }
}

function sortByUpdatedAtDesc(items: PracticeBoardItem[]) {
  items.sort((a, b) => {
    const aTs = new Date(a.updated_at).getTime()
    const bTs = new Date(b.updated_at).getTime()
    if (Number.isNaN(aTs) && Number.isNaN(bTs)) return 0
    if (Number.isNaN(aTs)) return 1
    if (Number.isNaN(bTs)) return -1
    return bTs - aTs
  })
}

function normalizeArray(raw: unknown): PracticeBoardItem[] {
  if (!Array.isArray(raw)) return []
  const items = raw
    .map((entry) => normalizeItem(entry))
    .filter((entry): entry is PracticeBoardItem => Boolean(entry))
  sortByUpdatedAtDesc(items)
  return items
}

function normalizeBoards(payload: unknown): PracticeBoard[] {
  let rawList: unknown = []
  if (Array.isArray(payload)) {
    rawList = payload
  } else if (payload && typeof payload === 'object') {
    const wrapped = payload as PracticeBoardsPayload
    if (Array.isArray(wrapped.boards)) rawList = wrapped.boards
    else if (Array.isArray(wrapped.items)) rawList = wrapped.items
    else if (Array.isArray(wrapped.results)) rawList = wrapped.results
  }

  if (!Array.isArray(rawList)) return []
  return rawList
    .map((entry) => normalizeBoard(entry))
    .filter((entry): entry is PracticeBoard => Boolean(entry))
}

function readColumnItems(rawColumn: unknown): unknown {
  if (Array.isArray(rawColumn)) return rawColumn
  if (!rawColumn || typeof rawColumn !== 'object') return []
  const asObject = rawColumn as { items?: unknown }
  return Array.isArray(asObject.items) ? asObject.items : []
}

function withBoardParams(boardId?: number | string) {
  if (boardId === undefined || boardId === null || boardId === '') return undefined
  return {
    params: {
      board_id: boardId,
    },
  }
}

export function resolveDefaultPracticeBoardId(boards: PracticeBoard[]): number | string | null {
  if (!boards.length) return null
  return boards.find((board) => board.is_default)?.id ?? boards[0]?.id ?? null
}

export function isBoardLimitReachedError(error: unknown): boolean {
  const data = (error as any)?.response?.data
  const status = (error as any)?.response?.status
  return status === 409 && data?.code === 'BOARD_LIMIT_REACHED'
}

export function normalizePracticeBoardColumns(payload: unknown): PracticeBoardColumns {
  const columns = createEmptyColumns()

  if (Array.isArray(payload)) {
    const flatItems = normalizeArray(payload)
    flatItems.forEach((item) => columns[item.status].push(item))
  } else if (payload && typeof payload === 'object') {
    const asFlat = payload as PracticeBoardFlatResponse
    const asColumnsWrapped = asFlat.columns as PracticeBoardGroupedResponse | undefined
    const asGrouped = payload as PracticeBoardGroupedResponse

    if (Array.isArray(asFlat.items)) {
      const flatItems = normalizeArray(asFlat.items)
      flatItems.forEach((item) => columns[item.status].push(item))
    } else if (Array.isArray(asFlat.results)) {
      const flatItems = normalizeArray(asFlat.results)
      flatItems.forEach((item) => columns[item.status].push(item))
    } else if (asColumnsWrapped && typeof asColumnsWrapped === 'object') {
      columns.todo = normalizeArray(readColumnItems(asColumnsWrapped.todo))
      columns.in_progress = normalizeArray(readColumnItems(asColumnsWrapped.in_progress))
      columns.done = normalizeArray(readColumnItems(asColumnsWrapped.done))
    } else {
      columns.todo = normalizeArray(readColumnItems(asGrouped.todo))
      columns.in_progress = normalizeArray(readColumnItems(asGrouped.in_progress))
      columns.done = normalizeArray(readColumnItems(asGrouped.done))
    }
  }

  sortByUpdatedAtDesc(columns.todo)
  sortByUpdatedAtDesc(columns.in_progress)
  sortByUpdatedAtDesc(columns.done)

  return columns
}

export async function fetchPracticeBoards(): Promise<PracticeBoard[]> {
  const payload = await apiGet<unknown>(PRACTICE_BOARDS_URL)
  return normalizeBoards(payload)
}

export async function createPracticeBoard(payload: PracticeBoardEntityCreatePayload): Promise<PracticeBoard> {
  return apiPost<PracticeBoard>(PRACTICE_BOARDS_URL, payload)
}

export async function updatePracticeBoard(
  boardId: number | string,
  payload: PracticeBoardEntityUpdatePayload
): Promise<PracticeBoard> {
  return apiPatch<PracticeBoard>(`${PRACTICE_BOARDS_URL}${boardId}/`, payload)
}

export async function fetchPracticeBoardItems(boardId?: number | string): Promise<PracticeBoardColumns> {
  const payload = await apiGet<unknown>(PRACTICE_BOARD_ITEMS_URL, withBoardParams(boardId))
  return normalizePracticeBoardColumns(payload)
}

export async function createPracticeBoardItem(payload: PracticeBoardCreatePayload): Promise<PracticeBoardItem> {
  return apiPost<PracticeBoardItem>(PRACTICE_BOARD_ITEMS_URL, payload)
}

export async function updatePracticeBoardItem(
  itemId: number | string,
  payload: PracticeBoardUpdatePayload
): Promise<PracticeBoardItem> {
  return apiPatch<PracticeBoardItem>(`${PRACTICE_BOARD_ITEMS_URL}${itemId}/`, payload)
}

export async function movePracticeBoardItem(
  itemId: number | string,
  payload: PracticeBoardMovePayload
): Promise<PracticeBoardItem> {
  const endpoint = `${PRACTICE_BOARD_ITEMS_URL}${itemId}/move/`
  try {
    return await apiPost<PracticeBoardItem>(endpoint, payload)
  } catch (error: any) {
    if (error?.response?.status !== 400) throw error
    return apiPost<PracticeBoardItem>(endpoint, { target_status: payload.status })
  }
}

export async function archivePracticeBoardItem(itemId: number | string): Promise<PracticeBoardItem> {
  return apiPost<PracticeBoardItem>(`${PRACTICE_BOARD_ITEMS_URL}${itemId}/archive/`, {})
}
