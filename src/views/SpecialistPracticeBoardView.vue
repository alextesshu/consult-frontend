<template>
  <section class="practice-board">
    <header class="practice-board__hero">
      <div>
        <div class="badge">Робоча дошка</div>
        <h1 class="title practice-board__title">Робоча дошка</h1>
        <p class="muted practice-board__subtitle">
          Місце для ваших робочих задач, нагадувань і важливих кроків у роботі з клієнтами.
        </p>
      </div>
      <button class="btn" type="button" @click="toggleCreateForm">
        {{ showCreateForm ? 'Скасувати' : 'Створити задачу' }}
      </button>
    </header>

    <form v-if="showCreateForm" class="panel practice-board__create" @submit.prevent="submitCreate">
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
          <textarea
            v-model.trim="createDraft.description"
            class="input practice-board__description"
            rows="4"
            maxlength="1000"
          ></textarea>
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
      <button class="btn btn--ghost btn--sm practice-board__retry" type="button" @click="loadBoard">
        Повторити
      </button>
    </div>
    <div v-if="moveError" class="form-error">{{ moveError }}</div>

    <LoadingSkeleton v-if="loading" variant="card" :count="6" height="140px" />

    <EmptyState
      v-else-if="hasNoItems"
      title="Поки що тут порожньо"
      description="Додайте першу задачу, щоб зафіксувати важливий крок, follow-up або нагадування."
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
            <h3 class="board-card__title">{{ item.title }}</h3>
            <p v-if="item.description" class="board-card__description muted">{{ item.description }}</p>

            <div v-if="hasMetadata(item)" class="board-card__meta muted">
              <span v-if="item.related_client_id">Клієнт #{{ item.related_client_id }}</span>
              <span v-if="item.related_session_id">Сесія #{{ item.related_session_id }}</span>
            </div>

            <div class="board-card__actions">
              <button
                v-for="action in moveActions(item.status)"
                :key="action.target"
                class="btn btn--ghost btn--sm"
                type="button"
                :disabled="isMovePending(item.id)"
                @click="moveItem(item.id, action.target)"
              >
                {{ action.label }}
              </button>
            </div>
          </article>
        </div>
      </article>
    </section>
  </section>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import EmptyState from '../components/EmptyState.vue'
import LoadingSkeleton from '../components/LoadingSkeleton.vue'
import { useToast } from '../composables/useToast'
import type {
  PracticeBoardColumns,
  PracticeBoardCreatePayload,
  PracticeBoardItem,
  PracticeBoardStatus,
} from '../lib/api'
import {
  createPracticeBoardItem,
  fetchPracticeBoardItems,
  movePracticeBoardItem,
} from '../lib/specialistPracticeBoard'

type CreateDraft = {
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
    { label: 'Завершити', target: 'done' },
  ],
  in_progress: [
    { label: 'Повернути в заплановане', target: 'todo' },
    { label: 'Завершити', target: 'done' },
  ],
  done: [
    { label: 'Повернути в роботу', target: 'in_progress' },
    { label: 'Повернути в заплановане', target: 'todo' },
  ],
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
const createError = ref('')
const moveError = ref('')
const showCreateForm = ref(false)
const createPending = ref(false)
const movePending = ref<Set<string>>(new Set())
const boardColumns = ref<PracticeBoardColumns>(createEmptyColumns())
const createDraft = ref<CreateDraft>({
  title: '',
  description: '',
})
const toast = useToast()

const hasNoItems = computed(
  () =>
    boardColumns.value.todo.length === 0 &&
    boardColumns.value.in_progress.length === 0 &&
    boardColumns.value.done.length === 0
)

function toPendingKey(itemId: number | string) {
  return String(itemId)
}

function isMovePending(itemId: number | string) {
  return movePending.value.has(toPendingKey(itemId))
}

function setMovePending(itemId: number | string, value: boolean) {
  const next = new Set(movePending.value)
  const key = toPendingKey(itemId)
  if (value) {
    next.add(key)
  } else {
    next.delete(key)
  }
  movePending.value = next
}

function hasMetadata(item: PracticeBoardItem) {
  return Boolean(item.related_client_id || item.related_session_id)
}

function moveActions(status: PracticeBoardStatus) {
  return MOVE_ACTIONS_BY_STATUS[status]
}

function toggleCreateForm() {
  showCreateForm.value = !showCreateForm.value
  createError.value = ''
}

function cancelCreate() {
  showCreateForm.value = false
  createError.value = ''
  createDraft.value = {
    title: '',
    description: '',
  }
}

async function loadBoard() {
  loading.value = true
  boardError.value = ''
  try {
    boardColumns.value = await fetchPracticeBoardItems()
  } catch (error) {
    boardError.value = 'Не вдалося завантажити задачі дошки.'
  } finally {
    loading.value = false
  }
}

function createPayloadFromDraft(): PracticeBoardCreatePayload | null {
  const title = createDraft.value.title.trim()
  if (!title) return null
  const description = createDraft.value.description.trim()
  return {
    title,
    description: description || null,
  }
}

async function submitCreate() {
  createError.value = ''
  moveError.value = ''
  const payload = createPayloadFromDraft()
  if (!payload) {
    createError.value = 'Вкажіть заголовок задачі.'
    return
  }

  createPending.value = true
  try {
    await createPracticeBoardItem(payload)
    toast.success('Задачу додано на дошку')
    cancelCreate()
    await loadBoard()
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
    await loadBoard()
  } catch {
    moveError.value = 'Не вдалося перемістити задачу.'
  } finally {
    setMovePending(itemId, false)
  }
}

onMounted(async () => {
  await loadBoard()
})
</script>

<style scoped>
.practice-board {
  display: grid;
  gap: 16px;
}

.practice-board__hero {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 16px;
  background: linear-gradient(135deg, rgba(8, 113, 201, 0.14), rgba(7, 47, 71, 0.06));
  border: 1px solid var(--line);
  border-radius: var(--radius);
  padding: 18px 20px;
}

.practice-board__title {
  font-size: 30px;
}

.practice-board__subtitle {
  max-width: 680px;
}

.panel {
  border: 1px solid var(--line);
  border-radius: var(--radius-lg);
  padding: 14px;
  background: #fff;
  display: grid;
  gap: 12px;
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
  gap: 10px;
  grid-template-columns: repeat(3, minmax(0, 1fr));
}

.board-column {
  border: 1px solid var(--line);
  border-radius: var(--radius-lg);
  background: #fff;
  padding: 12px;
  display: grid;
  gap: 10px;
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
  border-radius: var(--radius-pill);
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
  border-radius: var(--radius-md);
  background: rgba(7, 47, 71, 0.02);
  padding: 10px;
  display: grid;
  gap: 8px;
}

.board-card__title {
  margin: 0;
  font-size: 15px;
}

.board-card__description {
  margin: 0;
  font-size: 13px;
  line-height: 1.45;
  white-space: pre-wrap;
}

.board-card__meta {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
  font-size: 12px;
}

.board-card__actions {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
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
  .practice-board__hero {
    flex-direction: column;
    align-items: flex-start;
  }
}
</style>
