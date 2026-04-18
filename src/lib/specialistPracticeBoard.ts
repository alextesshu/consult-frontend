import {
  apiGet,
  apiPatch,
  apiPost,
  type PracticeBoardColumns,
  type PracticeBoardCreatePayload,
  type PracticeBoardItem,
  type PracticeBoardMovePayload,
  type PracticeBoardStatus,
  type PracticeBoardUpdatePayload,
} from './api'

type PracticeBoardFlatResponse = {
  items?: unknown
}

type PracticeBoardGroupedResponse = Partial<Record<PracticeBoardStatus, unknown>>

const PRACTICE_BOARD_ITEMS_URL = '/cabinet/practice-board/items/'

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

function normalizeItem(input: unknown): PracticeBoardItem | null {
  if (!input || typeof input !== 'object') return null
  const raw = input as Record<string, unknown>
  const status = raw.status
  const title = typeof raw.title === 'string' ? raw.title.trim() : ''
  const updatedAt = typeof raw.updated_at === 'string' ? raw.updated_at : ''
  const createdAt = typeof raw.created_at === 'string' ? raw.created_at : ''
  if (!isPracticeBoardStatus(status)) return null
  if (!title) return null
  if (!updatedAt || !createdAt) return null

  return {
    id: (raw.id as number | string) ?? '',
    title,
    description: typeof raw.description === 'string' ? raw.description : null,
    status,
    priority: typeof raw.priority === 'string' ? raw.priority : null,
    related_client_id: typeof raw.related_client_id === 'number' ? raw.related_client_id : null,
    related_session_id: typeof raw.related_session_id === 'number' ? raw.related_session_id : null,
    source_type: (raw.source_type as PracticeBoardItem['source_type']) ?? null,
    source_id: (raw.source_id as PracticeBoardItem['source_id']) ?? null,
    created_at: createdAt,
    updated_at: updatedAt,
    completed_at: typeof raw.completed_at === 'string' ? raw.completed_at : null,
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

export function normalizePracticeBoardColumns(payload: unknown): PracticeBoardColumns {
  const columns = createEmptyColumns()

  if (Array.isArray(payload)) {
    const flatItems = normalizeArray(payload)
    flatItems.forEach((item) => columns[item.status].push(item))
  } else if (payload && typeof payload === 'object') {
    const asFlat = payload as PracticeBoardFlatResponse
    const asGrouped = payload as PracticeBoardGroupedResponse

    if (Array.isArray(asFlat.items)) {
      const flatItems = normalizeArray(asFlat.items)
      flatItems.forEach((item) => columns[item.status].push(item))
    } else {
      columns.todo = normalizeArray(asGrouped.todo)
      columns.in_progress = normalizeArray(asGrouped.in_progress)
      columns.done = normalizeArray(asGrouped.done)
    }
  }

  sortByUpdatedAtDesc(columns.todo)
  sortByUpdatedAtDesc(columns.in_progress)
  sortByUpdatedAtDesc(columns.done)

  return columns
}

export async function fetchPracticeBoardItems(): Promise<PracticeBoardColumns> {
  const payload = await apiGet<unknown>(PRACTICE_BOARD_ITEMS_URL)
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
