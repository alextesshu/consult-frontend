<template>
  <section class="practice-board">
    <header class="practice-board__hero">
      <div>
        <div class="badge">ЗАДАЧІ</div>
        <h1 class="title practice-board__title">Задачі</h1>
        <p class="muted practice-board__subtitle">
          Наступні кроки, нагадування й задачі по клієнтах та сесіях — в одному місці.
        </p>
      </div>
      <button class="btn" type="button" @click="handlePrimaryAction">
        {{ primaryActionLabel }}
      </button>
    </header>

    <section v-if="!loading && boards.length" class="panel practice-board__boards">
      <div class="practice-board__boards-header">
        <div>
          <div class="badge badge--soft">СПИСКИ ЗАДАЧ</div>
          <h2 class="panel__title">{{ currentBoardDisplayTitle }}</h2>
        </div>
        <div class="practice-board__boards-actions">
          <button class="btn btn--ghost btn--sm" type="button" @click="toggleRenameBoardForm" :disabled="!currentBoardId">
            {{ showRenameBoardForm ? 'Скасувати' : 'Редагувати назву' }}
          </button>
          <button class="btn btn--ghost btn--sm" type="button" @click="toggleCreateBoardForm">
            {{ showCreateBoardForm ? 'Скасувати' : 'Створити список' }}
          </button>
        </div>
      </div>

      <div v-if="boards.length > 1" class="practice-board__switcher" role="tablist" aria-label="Вибір списку">
        <button
          v-for="board in boards"
          :key="board.id"
          class="btn btn--ghost btn--sm practice-board__board-chip"
          :class="{ 'practice-board__board-chip--active': String(board.id) === currentBoardId }"
          type="button"
          @click="selectBoard(board.id)"
        >
          {{ displayBoardTitle(board.title) }}
        </button>
      </div>

      <form v-if="showRenameBoardForm && currentBoard" class="practice-board__board-form" @submit.prevent="submitRenameBoard">
        <label class="field">
          <span>Нова назва списку</span>
          <input v-model.trim="renameBoardTitle" class="input" type="text" maxlength="120" />
        </label>
        <div v-if="boardFormError" class="form-error">{{ boardFormError }}</div>
        <div class="practice-board__create-actions">
          <button class="btn btn--sm" type="submit" :disabled="renameBoardPending">
            {{ renameBoardPending ? 'Зберігаємо…' : 'Зберегти' }}
          </button>
          <button class="btn btn--ghost btn--sm" type="button" :disabled="renameBoardPending" @click="toggleRenameBoardForm">
            Скасувати
          </button>
        </div>
      </form>
    </section>

    <form v-if="showCreateBoardForm" class="panel practice-board__board-form" @submit.prevent="submitCreateBoard">
      <label class="field">
        <span>Назва списку</span>
        <input v-model.trim="createBoardTitle" class="input" type="text" maxlength="120" />
      </label>
      <div v-if="boardFormError" class="form-error">{{ boardFormError }}</div>
      <div class="practice-board__create-actions">
        <button class="btn btn--sm" type="submit" :disabled="createBoardPending">
          {{ createBoardPending ? 'Зберігаємо…' : 'Зберегти' }}
        </button>
        <button class="btn btn--ghost btn--sm" type="button" :disabled="createBoardPending" @click="toggleCreateBoardForm">
          Скасувати
        </button>
      </div>
    </form>

    <form v-if="showCreateForm && hasCurrentBoard" class="panel practice-board__create" @submit.prevent="submitCreate">
      <div class="panel__header">
        <h2 class="panel__title">Нова задача</h2>
      </div>
      <div v-if="createError" class="form-error">{{ createError }}</div>
      <div class="practice-board__create-grid">
        <label class="field">
          <span>Заголовок</span>
          <input v-model.trim="createDraft.title" class="input" type="text" maxlength="180" />
        </label>
        <label class="field">
          <span>Опис (опційно)</span>
          <textarea v-model.trim="createDraft.description" class="input practice-board__description" rows="4" maxlength="1000"></textarea>
        </label>
      </div>
      <div class="practice-board__create-actions">
        <button class="btn btn--sm" type="submit" :disabled="createPending">
          {{ createPending ? 'Зберігаємо…' : 'Зберегти' }}
        </button>
        <button class="btn btn--ghost btn--sm" type="button" :disabled="createPending" @click="cancelCreate">
          Скасувати
        </button>
      </div>
    </form>

    <div v-if="boardError" class="form-error">
      {{ boardError }}
      <button class="btn btn--ghost btn--sm practice-board__retry" type="button" @click="loadPage">
        Повторити
      </button>
    </div>
    <div v-if="moveError" class="form-error">{{ moveError }}</div>

    <LoadingSkeleton v-if="loading" variant="card" :count="6" height="140px" />

    <EmptyState
      v-else-if="showEmptyBoardState"
      title="Поки що немає списків"
      description="Створіть перший список, щоб додавати задачі та організовувати роботу."
    >
      <template #actions>
        <button class="btn" type="button" @click="toggleCreateBoardForm">Створити список</button>
      </template>
    </EmptyState>

    <EmptyState
      v-else-if="hasNoItems"
      title="Поки що тут порожньо"
      description="У цьому списку ще немає задач. Додайте першу задачу, щоб зафіксувати важливий крок, follow-up або нагадування."
    />

    <section v-else class="practice-board__columns">
      <article v-for="column in columnsConfig" :key="column.status" class="board-column">
        <header class="board-column__header">
          <h2 class="board-column__title">{{ column.label }}</h2>
          <span class="board-column__count">{{ boardColumns[column.status].length }}</span>
        </header>

        <div v-if="boardColumns[column.status].length === 0" class="board-column__empty muted">
          Немає задач у цій колонці.
        </div>

        <div v-else class="board-column__list">
          <article v-for="item in boardColumns[column.status]" :key="item.id" class="board-card">
            <header class="board-card__header">
              <h3 class="board-card__title">{{ item.title }}</h3>
              <button
                class="btn btn--ghost btn--sm board-card__remove"
                type="button"
                aria-label="Видалити"
                :disabled="isArchivePending(item.id)"
                @click="openArchiveConfirm(item.id)"
              >
                &times;
              </button>
            </header>

            <template v-if="isEditing(item.id)">
              <div v-if="editError" class="form-error">{{ editError }}</div>
              <div class="board-card__edit-grid">
                <label class="field">
                  <span>Заголовок</span>
                  <input v-model.trim="editDraft.title" class="input" type="text" maxlength="180" />
                </label>
                <label class="field">
                  <span>Опис (опційно)</span>
                  <textarea
                    v-model.trim="editDraft.description"
                    class="input board-card__edit-description"
                    rows="4"
                    maxlength="1000"
                  ></textarea>
                </label>
              </div>
              <div class="board-card__actions">
                <button class="btn btn--sm" type="button" :disabled="editPending" @click="submitEdit(item.id)">
                  {{ editPending ? 'Зберігаємо…' : 'Зберегти' }}
                </button>
                <button class="btn btn--ghost btn--sm" type="button" :disabled="editPending" @click="cancelEdit">
                  Скасувати
                </button>
              </div>
            </template>

            <template v-else>
              <div v-if="itemContextLabel(item)" class="board-card__meta muted">
                {{ itemContextLabel(item) }}
              </div>

              <div v-if="isArchiveConfirmOpen(item.id)" class="board-card__confirm">
                <p class="board-card__confirm-title">Видалити цю задачу?</p>
                <div v-if="archiveError" class="form-error">{{ archiveError }}</div>
                <div class="board-card__actions">
                  <button class="btn btn--sm" type="button" :disabled="isArchivePending(item.id)" @click="confirmArchive(item.id)">
                    {{ isArchivePending(item.id) ? 'Видаляємо…' : 'Видалити' }}
                  </button>
                  <button class="btn btn--ghost btn--sm" type="button" :disabled="isArchivePending(item.id)" @click="closeArchiveConfirm">
                    Скасувати
                  </button>
                </div>
              </div>

              <div v-else class="board-card__actions">
                <button v-if="item.description && item.description.trim()" class="btn btn--sm" type="button" @click="openDetails(item)">
                  Деталі
                </button>
                <button class="btn btn--ghost btn--sm" type="button" aria-label="Редагувати" @click="startEdit(item)">
                  <span class="board-card__icon" aria-hidden="true">✎</span>
                </button>
                <button
                  v-for="action in moveActions(item.status)"
                  :key="action.target"
                  class="btn btn--ghost btn--sm"
                  type="button"
                  :aria-label="action.label"
                  :disabled="isMovePending(item.id)"
                  @click="moveItem(item.id, action.target)"
                >
                  <span v-if="action.target === 'done'" class="board-card__icon board-card__icon--success" aria-hidden="true">✓</span>
                  <span v-else>{{ action.label }}</span>
                </button>
              </div>
            </template>
          </article>
        </div>
      </article>
    </section>

    <div v-if="detailsItem" class="practice-board__details-backdrop" @click.self="closeDetails">
      <section class="practice-board__details panel" role="dialog" aria-modal="true" aria-label="Деталі задачі">
        <div class="panel__header practice-board__details-header">
          <h2 class="panel__title practice-board__details-title">{{ detailsItem.title }}</h2>
          <button class="btn btn--ghost btn--sm practice-board__details-cancel" type="button" @click="closeDetails">Скасувати</button>
        </div>
        <div v-if="itemContextLabel(detailsItem)" class="board-card__meta muted">
          {{ itemContextLabel(detailsItem) }}
        </div>
        <p class="practice-board__details-text muted">{{ detailsItem.description }}</p>
      </section>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import EmptyState from '../components/EmptyState.vue'
import LoadingSkeleton from '../components/LoadingSkeleton.vue'
import { useToast } from '../composables/useToast'
import type { PracticeBoard, PracticeBoardColumns, PracticeBoardCreatePayload, PracticeBoardItem, PracticeBoardStatus } from '../lib/api'
import {
  archivePracticeBoardItem,
  createPracticeBoard,
  createPracticeBoardItem,
  fetchPracticeBoardItems,
  fetchPracticeBoards,
  isBoardLimitReachedError,
  movePracticeBoardItem,
  resolveDefaultPracticeBoardId,
  updatePracticeBoard,
  updatePracticeBoardItem,
} from '../lib/specialistPracticeBoard'

type CreateDraft = {
  title: string
  description: string
}

type EditDraft = {
  title: string
  description: string
}

type MoveAction = {
  label: string
  target: PracticeBoardStatus
}

const columnsConfig: Array<{ status: PracticeBoardStatus; label: string }> = [
  { status: 'todo', label: 'Заплановано' },
  { status: 'in_progress', label: 'У роботі' },
  { status: 'done', label: 'Завершено' },
]

const MOVE_ACTIONS_BY_STATUS: Record<PracticeBoardStatus, MoveAction[]> = {
  todo: [
    { label: 'Взяти в роботу', target: 'in_progress' },
    { label: 'Завершено', target: 'done' },
  ],
  in_progress: [
    { label: 'Повернути в заплановане', target: 'todo' },
    { label: 'Завершено', target: 'done' },
  ],
  done: [{ label: 'Повернути в роботу', target: 'in_progress' }],
}

function createEmptyColumns(): PracticeBoardColumns {
  return {
    todo: [],
    in_progress: [],
    done: [],
  }
}

const loading = ref(true)
const boardError = ref('')
const boardFormError = ref('')
const createError = ref('')
const moveError = ref('')
const editError = ref('')
const archiveError = ref('')

const showCreateForm = ref(false)
const showCreateBoardForm = ref(false)
const showRenameBoardForm = ref(false)

const createPending = ref(false)
const createBoardPending = ref(false)
const renameBoardPending = ref(false)
const editPending = ref(false)

const movePending = ref<Set<string>>(new Set())
const editingItemId = ref<string | null>(null)
const archiveConfirmItemId = ref<string | null>(null)
const archivePendingItemId = ref<string | null>(null)
const detailsItem = ref<PracticeBoardItem | null>(null)

const boards = ref<PracticeBoard[]>([])
const currentBoardId = ref<string | null>(null)
const boardColumns = ref<PracticeBoardColumns>(createEmptyColumns())

const createBoardTitle = ref('')
const renameBoardTitle = ref('')
const createDraft = ref<CreateDraft>({ title: '', description: '' })
const editDraft = ref<EditDraft>({ title: '', description: '' })

const toast = useToast()

const currentBoard = computed(() => boards.value.find((board) => String(board.id) === currentBoardId.value) || null)
const currentBoardDisplayTitle = computed(() => displayBoardTitle(currentBoard.value?.title))
const hasCurrentBoard = computed(() => Boolean(currentBoardId.value && currentBoard.value))
const showEmptyBoardState = computed(() => !hasCurrentBoard.value)
const primaryActionLabel = computed(() => {
  if (hasCurrentBoard.value) return showCreateForm.value ? 'Скасувати' : 'Створити задачу'
  return showCreateBoardForm.value ? 'Скасувати' : 'Створити список'
})
const hasNoItems = computed(
  () => boardColumns.value.todo.length === 0 && boardColumns.value.in_progress.length === 0 && boardColumns.value.done.length === 0
)

function displayBoardTitle(title?: string | null) {
  const normalized = title?.trim() ?? ''
  if (!normalized) return 'Основний список'
  if (normalized.toLowerCase() === 'board') return 'Основний список'
  return normalized
}

function toPendingKey(itemId: number | string) {
  return String(itemId)
}

function isMovePending(itemId: number | string) {
  return movePending.value.has(toPendingKey(itemId))
}

function setMovePending(itemId: number | string, value: boolean) {
  const next = new Set(movePending.value)
  const key = toPendingKey(itemId)
  if (value) next.add(key)
  else next.delete(key)
  movePending.value = next
}

function formatSessionDateTime(value?: string | null) {
  if (!value) return ''
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ''
  return new Intl.DateTimeFormat('uk-UA', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date)
}

function itemContextLabel(item: PracticeBoardItem | null) {
  if (!item) return ''
  const parts: string[] = []
  const clientName = item.related_client_display_name?.trim()
  const sessionLabel = item.related_session_label?.trim()
  const sessionTime = formatSessionDateTime(item.related_session_starts_at)
  if (clientName) parts.push(`Клієнт: ${clientName}`)
  if (sessionLabel) parts.push(`Сесія: ${sessionLabel}`)
  else if (sessionTime) parts.push(`Сесія: ${sessionTime}`)
  if (parts.length) return parts.join(' · ')
  if (item.related_session_id || item.source_type === 'session') return 'Задача з сесії'
  if (item.related_client_id) return 'Пов’язано з клієнтом'
  return ''
}

function moveActions(status: PracticeBoardStatus) {
  return MOVE_ACTIONS_BY_STATUS[status]
}

function openDetails(item: PracticeBoardItem) {
  detailsItem.value = item
}

function closeDetails() {
  detailsItem.value = null
}

function isEditing(itemId: number | string) {
  return editingItemId.value === toPendingKey(itemId)
}

function startEdit(item: PracticeBoardItem) {
  editError.value = ''
  archiveError.value = ''
  archiveConfirmItemId.value = null
  editingItemId.value = toPendingKey(item.id)
  editDraft.value = {
    title: item.title,
    description: item.description || '',
  }
}

function cancelEdit() {
  editError.value = ''
  editingItemId.value = null
  editDraft.value = { title: '', description: '' }
}

function buildEditPayload() {
  const title = editDraft.value.title.trim()
  if (!title) return null
  const description = editDraft.value.description.trim()
  return {
    title,
    description: description || null,
  }
}

async function submitEdit(itemId: number | string) {
  editError.value = ''
  const payload = buildEditPayload()
  if (!payload) {
    editError.value = 'Вкажіть заголовок задачі.'
    return
  }

  editPending.value = true
  try {
    await updatePracticeBoardItem(itemId, payload)
    toast.success('Задачу оновлено')
    cancelEdit()
    await loadBoardItems()
  } catch {
    editError.value = 'Не вдалося оновити задачу.'
  } finally {
    editPending.value = false
  }
}

function openArchiveConfirm(itemId: number | string) {
  archiveError.value = ''
  editError.value = ''
  editingItemId.value = null
  archiveConfirmItemId.value = toPendingKey(itemId)
}

function closeArchiveConfirm() {
  archiveError.value = ''
  archiveConfirmItemId.value = null
}

function isArchiveConfirmOpen(itemId: number | string) {
  return archiveConfirmItemId.value === toPendingKey(itemId)
}

function isArchivePending(itemId: number | string) {
  return archivePendingItemId.value === toPendingKey(itemId)
}

async function confirmArchive(itemId: number | string) {
  archiveError.value = ''
  archivePendingItemId.value = toPendingKey(itemId)
  try {
    await archivePracticeBoardItem(itemId)
    toast.success('Задачу видалено')
    closeArchiveConfirm()
    await loadBoardItems()
  } catch {
    archiveError.value = 'Не вдалося видалити задачу.'
  } finally {
    archivePendingItemId.value = null
  }
}

function toggleCreateForm() {
  if (!hasCurrentBoard.value) return
  showCreateForm.value = !showCreateForm.value
  createError.value = ''
}

function handlePrimaryAction() {
  if (hasCurrentBoard.value) {
    toggleCreateForm()
    return
  }
  toggleCreateBoardForm()
}

function cancelCreate() {
  showCreateForm.value = false
  createError.value = ''
  createDraft.value = { title: '', description: '' }
}

function toggleCreateBoardForm() {
  showCreateBoardForm.value = !showCreateBoardForm.value
  if (showCreateBoardForm.value) {
    showRenameBoardForm.value = false
    showCreateForm.value = false
    createBoardTitle.value = 'Новий список'
  } else {
    createBoardTitle.value = ''
  }
  boardFormError.value = ''
}

function toggleRenameBoardForm() {
  if (!currentBoard.value) return
  showRenameBoardForm.value = !showRenameBoardForm.value
  if (showRenameBoardForm.value) {
    showCreateBoardForm.value = false
    renameBoardTitle.value = currentBoard.value.title
  } else {
    renameBoardTitle.value = ''
  }
  boardFormError.value = ''
}

function resolveCurrentBoardId(nextBoards: PracticeBoard[]) {
  if (!nextBoards.length) {
    currentBoardId.value = null
    showCreateForm.value = false
    return
  }
  const hasCurrent = currentBoardId.value && nextBoards.some((board) => String(board.id) === currentBoardId.value)
  if (hasCurrent) return
  const resolved = resolveDefaultPracticeBoardId(nextBoards)
  if (resolved !== null && resolved !== undefined) {
    currentBoardId.value = String(resolved)
    return
  }
  const firstBoardId = nextBoards[0]?.id
  currentBoardId.value = firstBoardId !== null && firstBoardId !== undefined ? String(firstBoardId) : null
  if (!currentBoardId.value) showCreateForm.value = false
}

async function loadBoards() {
  const nextBoards = await fetchPracticeBoards()
  boards.value = nextBoards
  resolveCurrentBoardId(nextBoards)
}

async function loadBoardItems() {
  if (!currentBoardId.value) {
    boardColumns.value = createEmptyColumns()
    return
  }
  boardColumns.value = await fetchPracticeBoardItems(currentBoardId.value)
}

async function loadPage() {
  loading.value = true
  boardError.value = ''
  try {
    await loadBoards()
    await loadBoardItems()
  } catch {
    boardError.value = 'Не вдалося завантажити задачі.'
  } finally {
    loading.value = false
  }
}

async function selectBoard(boardId: number | string) {
  const nextId = String(boardId)
  if (nextId === currentBoardId.value) return
  currentBoardId.value = nextId
  boardError.value = ''
  try {
    await loadBoardItems()
  } catch {
    boardError.value = 'Не вдалося завантажити задачі для вибраного списку.'
  }
}

async function submitCreateBoard() {
  boardFormError.value = ''
  const title = createBoardTitle.value.trim()
  if (!title) {
    boardFormError.value = 'Вкажіть назву списку.'
    return
  }

  createBoardPending.value = true
  try {
    const created = await createPracticeBoard({ title })
    await loadBoards()
    currentBoardId.value = String(created.id)
    createBoardTitle.value = ''
    showCreateBoardForm.value = false
    await loadBoardItems()
  } catch (error) {
    boardFormError.value = isBoardLimitReachedError(error)
      ? 'Ліміт списків для вашого тарифу вичерпано.'
      : 'Не вдалося створити список.'
  } finally {
    createBoardPending.value = false
  }
}

async function submitRenameBoard() {
  boardFormError.value = ''
  const boardId = currentBoardId.value
  const title = renameBoardTitle.value.trim()
  if (!boardId) {
    boardFormError.value = 'Оберіть список.'
    return
  }
  if (!title) {
    boardFormError.value = 'Вкажіть назву списку.'
    return
  }

  renameBoardPending.value = true
  try {
    await updatePracticeBoard(boardId, { title })
    await loadBoards()
    showRenameBoardForm.value = false
    toast.success('Назву списку оновлено')
  } catch {
    boardFormError.value = 'Не вдалося оновити назву списку.'
  } finally {
    renameBoardPending.value = false
  }
}

function createPayloadFromDraft(): PracticeBoardCreatePayload | null {
  const title = createDraft.value.title.trim()
  const boardId = currentBoardId.value
  if (!title) return null
  if (!boardId) return null
  const description = createDraft.value.description.trim()
  return {
    board_id: boardId,
    title,
    description: description || null,
  }
}

async function submitCreate() {
  createError.value = ''
  moveError.value = ''
  const payload = createPayloadFromDraft()
  if (!payload) {
    createError.value = currentBoardId.value ? 'Вкажіть заголовок задачі.' : 'Оберіть список для створення задачі.'
    return
  }

  createPending.value = true
  try {
    await createPracticeBoardItem(payload)
    toast.success('Задачу додано')
    cancelCreate()
    await loadBoardItems()
  } catch {
    createError.value = 'Не вдалося створити задачу.'
  } finally {
    createPending.value = false
  }
}

async function moveItem(itemId: number | string, status: PracticeBoardStatus) {
  moveError.value = ''
  setMovePending(itemId, true)
  try {
    await movePracticeBoardItem(itemId, { status })
    await loadBoardItems()
  } catch {
    moveError.value = 'Не вдалося перемістити задачу.'
  } finally {
    setMovePending(itemId, false)
  }
}

onMounted(async () => {
  await loadPage()
})
</script>

<style scoped>
.practice-board {
  display: grid;
  gap: 14px;
}

.practice-board__hero {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 14px;
  background: #fff;
  border: 1px solid var(--line);
  border-radius: var(--pc-radius-control, var(--radius-sm));
  padding: 14px 16px;
  box-shadow: var(--pc-shadow-soft);
}

.practice-board__title {
  font-size: 28px;
  line-height: 1.12;
}

.practice-board__subtitle {
  max-width: 680px;
  margin: 4px 0 0;
}

.panel {
  border: 1px solid var(--line);
  border-radius: var(--pc-radius-control, var(--radius-sm));
  padding: 12px;
  background: #fff;
  display: grid;
  gap: 10px;
}

.panel__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.panel__title {
  margin: 0;
  font-size: 20px;
  font-family: var(--font-display);
}

.practice-board__boards-header {
  display: flex;
  align-items: start;
  justify-content: space-between;
  gap: 12px;
}

.practice-board__boards-actions {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.practice-board__switcher {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.practice-board__board-chip--active {
  border-color: rgba(8, 113, 201, 0.42);
  background: rgba(8, 113, 201, 0.1);
}

.practice-board__board-form {
  display: grid;
  gap: 10px;
}

.practice-board__create-grid {
  display: grid;
  gap: 10px;
}

.practice-board__description {
  min-height: 96px;
  resize: vertical;
}

.practice-board__create-actions {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.practice-board__retry {
  margin-left: 10px;
}

.practice-board__columns {
  display: grid;
  gap: 8px;
  grid-template-columns: repeat(3, minmax(0, 1fr));
}

.board-column {
  border: 1px solid var(--line);
  border-radius: var(--pc-radius-control, var(--radius-sm));
  background: #fff;
  padding: 10px;
  display: grid;
  gap: 8px;
  align-content: start;
}

.board-column__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}

.board-column__title {
  margin: 0;
  font-size: 16px;
}

.board-column__count {
  min-width: 26px;
  height: 26px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: var(--pc-radius-control, var(--radius-sm));
  background: rgba(8, 113, 201, 0.12);
  font-size: 12px;
  font-weight: 600;
}

.board-column__empty {
  font-size: 13px;
}

.board-column__list {
  display: grid;
  gap: 8px;
}

.board-card {
  border: 1px solid rgba(7, 47, 71, 0.14);
  border-radius: var(--pc-radius-control, var(--radius-sm));
  background: rgba(7, 47, 71, 0.02);
  padding: 9px;
  display: grid;
  gap: 8px;
  min-height: 96px;
}

.board-card__header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 8px;
}

.board-card__title {
  margin: 0;
  font-size: 15px;
}

.board-card__remove {
  width: 30px;
  height: 30px;
  padding: 0;
  line-height: 1;
  opacity: 0;
  pointer-events: none;
  transition: opacity 0.15s ease;
}

.board-card:hover .board-card__remove,
.board-card:focus-within .board-card__remove {
  opacity: 1;
  pointer-events: auto;
}

.board-card__icon {
  font-size: 14px;
  line-height: 1;
}

.board-card__icon--success {
  color: #1f8b4c;
  font-weight: 700;
}

.board-card__edit-grid {
  display: grid;
  gap: 8px;
}

.board-card__edit-description {
  min-height: 86px;
  resize: vertical;
}

.board-card__meta {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
  font-size: 12px;
}

.board-card__confirm {
  border: 1px solid rgba(7, 47, 71, 0.16);
  border-radius: var(--radius-sm);
  background: rgba(255, 255, 255, 0.9);
  padding: 8px;
  display: grid;
  gap: 8px;
}

.board-card__confirm-title {
  margin: 0;
  font-size: 13px;
  font-weight: 600;
}

.board-card__actions {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
}

.practice-board__details-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(7, 47, 71, 0.28);
  display: grid;
  place-items: center;
  padding: 16px;
  z-index: 60;
}

.practice-board__details {
  width: min(560px, 100%);
  max-height: 80vh;
  overflow: auto;
}

.practice-board__details-header {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  align-items: start;
}

.practice-board__details-title {
  min-width: 0;
  overflow-wrap: anywhere;
  word-break: break-word;
}

.practice-board__details-cancel {
  flex-shrink: 0;
}

.practice-board__details-text {
  margin: 0;
  white-space: pre-wrap;
  line-height: 1.5;
}

.btn--sm {
  padding: 6px 10px;
  font-size: 12px;
}

.form-error {
  color: #b3261e;
  background: #fdecea;
  border: 1px solid #f5c2c0;
  border-radius: var(--radius-sm);
  padding: 8px 10px;
}

@media (max-width: 1000px) {
  .practice-board__columns {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 860px) {
  .practice-board__hero,
  .practice-board__boards-header {
    flex-direction: column;
    align-items: flex-start;
  }
}
</style>
