<template>
  <section class="card">
    <div class="page-header">
      <div>
        <h1 class="title" style="font-size: 28px;">Слоти терапевта</h1>
        <p class="muted">Створюйте та керуйте слотами для сесій.</p>
      </div>
      <RouterLink class="btn btn--ghost" to="/cabinet">Назад до кабінету</RouterLink>
    </div>

    <form class="slot-form" @submit.prevent="createSlot">
      <label class="field">
        Початок
        <div class="datetime-field">
          <input
            v-model="newStartDate"
            class="input"
            type="text"
            inputmode="numeric"
            placeholder="ДД.ММ.РРРР"
            aria-label="Дата початку"
            required
          />
          <input
            v-model="newStartTime"
            class="input"
            type="text"
            inputmode="numeric"
            placeholder="ГГ:ХХ"
            aria-label="Час початку"
            required
          />
        </div>
      </label>
      <label class="field">
        Кінець
        <div class="datetime-field">
          <input
            v-model="newEndDate"
            class="input"
            type="text"
            inputmode="numeric"
            placeholder="ДД.ММ.РРРР"
            aria-label="Дата кінця"
            required
          />
          <input
            v-model="newEndTime"
            class="input"
            type="text"
            inputmode="numeric"
            placeholder="ГГ:ХХ"
            aria-label="Час кінця"
            required
          />
        </div>
      </label>
      <button class="btn" type="submit" :disabled="loading">Створити слот</button>
    </form>

    <div class="slot-bulk">
      <div class="bulk-group">
        <label class="field">
          Дата для дня
          <input v-model="fillDayDate" class="input" type="date" lang="uk" @click="openPicker" />
        </label>
        <div class="bulk-action">
          <button
            class="btn btn--ghost btn--sm"
            type="button"
            :disabled="loading || !fillDayDate"
            @click="fillDay"
          >
            Заповнити день слотами
          </button>
        </div>
        <div class="bulk-hint">Європейський формат: {{ formatDateOnly(fillDayDate) }}</div>
      </div>
      <div class="bulk-group">
        <label class="field">
          Дата для тижня
          <input v-model="fillWeekDate" class="input" type="date" lang="uk" @click="openPicker" />
        </label>
        <div class="bulk-action">
          <button
            class="btn btn--ghost btn--sm"
            type="button"
            :disabled="loading || !fillWeekDate"
            @click="fillWeek"
          >
            Заповнити тиждень (Пн-Пт)
          </button>
        </div>
        <div class="bulk-hint">Європейський формат: {{ formatDateOnly(fillWeekDate) }}</div>
      </div>
    </div>

    <div v-if="error" class="form-error" style="margin-top: 12px;">{{ error }}</div>
    <div v-if="loading" class="muted" style="margin-top: 12px;">Завантаження...</div>

    <div class="day-nav">
      <div class="day-nav-actions">
        <button class="btn btn--ghost btn--sm" type="button" :disabled="dayOffset === 0" @click="shiftDays(-1)">
          Попередні 3 дні
        </button>
        <button class="btn btn--ghost btn--sm" type="button" @click="shiftDays(1)">
          Наступні 3 дні
        </button>
      </div>
      <div class="day-list">
        <button
          v-for="day in dayOptions"
          :key="day.key"
          class="btn btn--ghost btn--sm"
          type="button"
          :class="{ 'btn--active': day.key === selectedDate }"
          @click="selectDay(day.key)"
        >
          {{ day.label }}
        </button>
      </div>
      <label class="field day-picker">
        Обрати дату
        <input v-model="selectedDate" class="input" type="date" lang="uk-ua" @click="openPicker" />
        <span class="field-hint">Європейський формат: {{ formatDateOnly(selectedDate) }}</span>
      </label>
      <div class="muted day-hint">Показано слоти за: {{ formatDateOnly(selectedDate) }}</div>
    </div>

    <div class="slot-list">
      <div v-if="filteredSlots.length === 0" class="muted">Слотів на цей день немає.</div>
      <div v-for="slot in filteredSlots" :key="slot.id" class="slot-card">
        <div class="slot-row">
          <div class="slot-meta">
            <div class="slot-label">Початок</div>
            <template v-if="isEditing(slot.id)">
              <div class="datetime-field">
                <input
                  v-model="editStartDate"
                  class="input input--sm"
                  type="text"
                  inputmode="numeric"
                  placeholder="ДД.ММ.РРРР"
                  aria-label="Дата початку"
                />
                <input
                  v-model="editStartTime"
                  class="input input--sm"
                  type="text"
                  inputmode="numeric"
                  placeholder="ГГ:ХХ"
                  aria-label="Час початку"
                />
              </div>
            </template>
            <template v-else>
              <div>{{ formatDate(slot.start_at) }}</div>
            </template>
          </div>
          <div class="slot-meta">
            <div class="slot-label">Кінець</div>
            <template v-if="isEditing(slot.id)">
              <div class="datetime-field">
                <input
                  v-model="editEndDate"
                  class="input input--sm"
                  type="text"
                  inputmode="numeric"
                  placeholder="ДД.ММ.РРРР"
                  aria-label="Дата кінця"
                />
                <input
                  v-model="editEndTime"
                  class="input input--sm"
                  type="text"
                  inputmode="numeric"
                  placeholder="ГГ:ХХ"
                  aria-label="Час кінця"
                />
              </div>
            </template>
            <template v-else>
              <div>{{ formatDate(slot.end_at) }}</div>
            </template>
          </div>
          <div class="slot-status" :class="{ 'slot-status--booked': slot.is_booked }">
            {{ slot.is_booked ? 'Заброньовано' : 'Вільно' }}
          </div>
        </div>
        <div class="slot-actions">
          <button
            v-if="!isEditing(slot.id)"
            class="btn btn--ghost btn--sm"
            type="button"
            :disabled="slot.is_booked || loading"
            @click="startEdit(slot)"
          >
            Редагувати
          </button>
          <button
            v-else
            class="btn btn--sm"
            type="button"
            :disabled="loading"
            @click="saveEdit(slot.id)"
          >
            Зберегти
          </button>
          <button
            v-if="isEditing(slot.id)"
            class="btn btn--ghost btn--sm"
            type="button"
            :disabled="loading"
            @click="cancelEdit"
          >
            Скасувати
          </button>
          <button
            class="btn btn--ghost btn--sm"
            type="button"
            :disabled="slot.is_booked || loading"
            @click="deleteSlot(slot.id)"
          >
            Видалити
          </button>
        </div>
        <div
          v-if="isEditing(slot.id) && editErrors[slot.id]"
          :ref="setEditErrorRef(slot.id)"
          class="form-error slot-error"
        >
          {{ editErrors[slot.id] }}
        </div>
        <div v-if="slot.is_booked" class="muted slot-hint">
          Слот вже заброньовано — редагування та видалення недоступні.
        </div>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed, nextTick, onMounted, ref } from 'vue'
import { http } from '../lib/http'

type Slot = {
  id: number
  start_at: string
  end_at: string
  is_booked: boolean
}

const slots = ref<Slot[]>([])
const loading = ref(false)
const error = ref('')
const editErrors = ref<Record<number, string>>({})
const editErrorRefs = ref<Record<number, HTMLElement | null>>({})

const newStartDate = ref('')
const newStartTime = ref('')
const newEndDate = ref('')
const newEndTime = ref('')
const fillDayDate = ref(toDateInputValue(new Date()))
const fillWeekDate = ref(toDateInputValue(new Date()))
const dayOffset = ref(0)
const selectedDate = ref(toDateInputValue(new Date()))

const editingId = ref<number | null>(null)
const editStartDate = ref('')
const editStartTime = ref('')
const editEndDate = ref('')
const editEndTime = ref('')

function formatDate(value: string) {
  const dt = new Date(value)
  if (Number.isNaN(dt.getTime())) return value
  return dt.toLocaleString('uk-UA', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  })
}

function formatDateOnly(value: string) {
  const dt = new Date(value)
  if (Number.isNaN(dt.getTime())) return value
  return dt.toLocaleDateString('uk-UA', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })
}

function toLocalDateKey(value: string) {
  const dt = new Date(value)
  if (Number.isNaN(dt.getTime())) return value
  const offset = dt.getTimezoneOffset() * 60000
  return new Date(dt.getTime() - offset).toISOString().slice(0, 10)
}

function formatUkDate(value: Date) {
  const day = String(value.getDate()).padStart(2, '0')
  const month = String(value.getMonth() + 1).padStart(2, '0')
  const year = value.getFullYear()
  return `${day}.${month}.${year}`
}

function formatUkTime(value: Date) {
  const hours = String(value.getHours()).padStart(2, '0')
  const minutes = String(value.getMinutes()).padStart(2, '0')
  return `${hours}:${minutes}`
}

function parseUkDateTime(dateStr: string, timeStr: string) {
  const dateMatch = /^(\d{2})\.(\d{2})\.(\d{4})$/.exec(dateStr.trim())
  const timeMatch = /^(\d{2}):(\d{2})$/.exec(timeStr.trim())
  if (!dateMatch || !timeMatch) return null

  const day = Number(dateMatch[1])
  const month = Number(dateMatch[2])
  const year = Number(dateMatch[3])
  const hours = Number(timeMatch[1])
  const minutes = Number(timeMatch[2])

  if (month < 1 || month > 12) return null
  if (hours > 23 || minutes > 59) return null

  const candidate = new Date(year, month - 1, day, hours, minutes, 0, 0)
  if (
    candidate.getFullYear() !== year ||
    candidate.getMonth() !== month - 1 ||
    candidate.getDate() !== day
  ) {
    return null
  }
  return candidate
}

function toDateInputValue(date: Date) {
  const offset = date.getTimezoneOffset() * 60000
  return new Date(date.getTime() - offset).toISOString().slice(0, 10)
}

function isEditing(id: number) {
  return editingId.value === id
}

function setEditErrorRef(id: number) {
  return (el: Element | null) => {
    editErrorRefs.value[id] = el as HTMLElement | null
  }
}

function normalizeError(err: any) {
  const detail = err?.response?.data?.detail
  if (Array.isArray(detail) && detail.length > 0) {
    return String(detail[0])
  }
  if (typeof detail === 'string') return detail
  if (Array.isArray(err?.response?.data) && err.response.data.length > 0) {
    return String(err.response.data[0])
  }
  return ''
}

function translateError(message: string) {
  if (!message) return ''
  if (message.includes('overlaps')) {
    return 'Слот перетинається з уже існуючим.'
  }
  if (message.includes('end_at must be greater than start_at')) {
    return 'Кінець має бути пізніше за початок.'
  }
  if (message.includes('Slot not found')) {
    return 'Слот не знайдено.'
  }
  return message
}

function openPicker(event: Event) {
  const target = event.target as HTMLInputElement | null
  if (!target) return
  if (typeof target.showPicker === 'function') {
    target.showPicker()
  }
}

const dayOptions = computed(() => {
  const base = new Date()
  base.setHours(0, 0, 0, 0)
  const start = new Date(base.getTime() + dayOffset.value * 24 * 60 * 60 * 1000)
  return Array.from({ length: 3 }, (_, idx) => {
    const d = new Date(start.getTime() + idx * 24 * 60 * 60 * 1000)
    return {
      key: toDateInputValue(d),
      label: d.toLocaleDateString('uk-UA', {
        weekday: 'short',
        day: '2-digit',
        month: '2-digit',
      }),
    }
  })
})

const filteredSlots = computed(() => {
  if (!selectedDate.value) return slots.value
  return slots.value.filter(
    (slot) => toLocalDateKey(slot.start_at) === selectedDate.value
  )
})

function selectDay(key: string) {
  selectedDate.value = key
}

function shiftDays(direction: number) {
  dayOffset.value = Math.max(0, dayOffset.value + direction * 3)
  const first = dayOptions.value[0]
  if (first) {
    selectedDate.value = first.key
  }
}

async function loadSlots() {
  loading.value = true
  error.value = ''
  try {
    const resp = await http.get<Slot[]>('/cabinet/slots/')
    slots.value = resp.data || []
  } catch (err: any) {
    error.value = err?.response?.data?.detail || 'Не вдалося завантажити слоти'
  } finally {
    loading.value = false
  }
}

async function createSlot() {
  loading.value = true
  error.value = ''
  try {
    const startAt = parseUkDateTime(newStartDate.value, newStartTime.value)
    const endAt = parseUkDateTime(newEndDate.value, newEndTime.value)
    if (!startAt || !endAt) {
      error.value = 'Вкажіть дату у форматі ДД.ММ.РРРР та час у форматі ГГ:ХХ'
      return
    }
    const payload = {
      start_at: startAt.toISOString(),
      end_at: endAt.toISOString(),
    }
    const resp = await http.post<Slot>('/cabinet/slots/', payload)
    slots.value = [...slots.value, resp.data]
    newStartDate.value = ''
    newStartTime.value = ''
    newEndDate.value = ''
    newEndTime.value = ''
  } catch (err: any) {
    const raw = normalizeError(err)
    error.value = translateError(raw) || 'Не вдалося створити слот'
  } finally {
    loading.value = false
  }
}

async function fillDay() {
  loading.value = true
  error.value = ''
  try {
    await http.post('/cabinet/slots/fill-day/', {
      date: fillDayDate.value,
    })
    await loadSlots()
  } catch (err: any) {
    error.value = err?.response?.data?.detail || 'Не вдалося заповнити день слотами'
  } finally {
    loading.value = false
  }
}

async function fillWeek() {
  loading.value = true
  error.value = ''
  try {
    await http.post('/cabinet/slots/fill-week/', {
      date: fillWeekDate.value,
    })
    await loadSlots()
  } catch (err: any) {
    error.value =
      err?.response?.data?.detail || 'Не вдалося заповнити тиждень слотами'
  } finally {
    loading.value = false
  }
}

function startEdit(slot: Slot) {
  editingId.value = slot.id
  editErrors.value[slot.id] = ''
  const start = new Date(slot.start_at)
  const end = new Date(slot.end_at)
  if (!Number.isNaN(start.getTime())) {
    editStartDate.value = formatUkDate(start)
    editStartTime.value = formatUkTime(start)
  }
  if (!Number.isNaN(end.getTime())) {
    editEndDate.value = formatUkDate(end)
    editEndTime.value = formatUkTime(end)
  }
}

function cancelEdit() {
  if (editingId.value !== null) {
    editErrors.value[editingId.value] = ''
  }
  editingId.value = null
  editStartDate.value = ''
  editStartTime.value = ''
  editEndDate.value = ''
  editEndTime.value = ''
}

async function saveEdit(slotId: number) {
  loading.value = true
  error.value = ''
  editErrors.value[slotId] = ''
  const currentScroll = window.scrollY
  const htmlStyle = document.documentElement.style
  const bodyStyle = document.body.style
  const prevScrollBehavior = htmlStyle.scrollBehavior
  const prevBodyPosition = bodyStyle.position
  const prevBodyTop = bodyStyle.top
  const prevBodyWidth = bodyStyle.width
  htmlStyle.scrollBehavior = 'auto'
  bodyStyle.position = 'fixed'
  bodyStyle.top = `-${currentScroll}px`
  bodyStyle.width = '100%'
  try {
    const startAt = parseUkDateTime(editStartDate.value, editStartTime.value)
    const endAt = parseUkDateTime(editEndDate.value, editEndTime.value)
    if (!startAt || !endAt) {
      error.value = 'Вкажіть дату у форматі ДД.ММ.РРРР та час у форматі ГГ:ХХ'
      return
    }
    const payload = {
      start_at: startAt.toISOString(),
      end_at: endAt.toISOString(),
    }
    const resp = await http.patch<Slot>(`/cabinet/slots/${slotId}/`, payload)
    slots.value = slots.value.map((slot) => (slot.id === slotId ? resp.data : slot))
    cancelEdit()
  } catch (err: any) {
    const raw = normalizeError(err)
    editErrors.value[slotId] = translateError(raw) || 'Не вдалося оновити слот'
    await nextTick()
    const errorEl = editErrorRefs.value[slotId]
    if (errorEl) {
      errorEl.scrollIntoView({ block: 'nearest' })
    } else {
      window.scrollTo({ top: currentScroll })
    }
  } finally {
    bodyStyle.position = prevBodyPosition
    bodyStyle.top = prevBodyTop
    bodyStyle.width = prevBodyWidth
    htmlStyle.scrollBehavior = prevScrollBehavior
    window.scrollTo({ top: currentScroll })
    loading.value = false
  }
}

async function deleteSlot(slotId: number) {
  loading.value = true
  error.value = ''
  try {
    await http.delete(`/cabinet/slots/${slotId}/`)
    slots.value = slots.value.filter((slot) => slot.id !== slotId)
  } catch (err: any) {
    error.value = err?.response?.data?.detail || 'Не вдалося видалити слот'
  } finally {
    loading.value = false
  }
}

onMounted(loadSlots)
</script>

<style scoped>
.page-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
}
.slot-form {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 12px;
  margin-top: 16px;
  align-items: end;
}
.slot-form .input,
.slot-form .btn {
  height: 40px;
}
.slot-form .btn {
  align-self: end;
}
.datetime-field {
  display: grid;
  grid-template-columns: 1fr 100px;
  gap: 8px;
  align-items: center;
}
.slot-list {
  margin-top: 16px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.day-nav {
  margin-top: 16px;
  display: grid;
  gap: 12px;
}
.day-nav-actions {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}
.day-list {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}
.day-picker .input {
  height: 40px;
}
.day-hint {
  font-size: 12px;
}
.btn--active {
  border-color: #0b4a7d;
  color: #0b4a7d;
  background: #eef6ff;
}
.slot-bulk {
  margin-top: 12px;
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 16px;
  align-items: start;
}
.bulk-group {
  display: grid;
  grid-template-columns: 1fr auto;
  grid-template-rows: auto auto;
  column-gap: 12px;
  row-gap: 6px;
  align-items: start;
}
.bulk-group .field {
  grid-column: 1;
  grid-row: 1;
}
.bulk-action {
  grid-column: 2;
  grid-row: 1;
  align-self: end;
}
.bulk-hint {
  grid-column: 1 / -1;
  grid-row: 2;
  font-size: 12px;
  color: var(--muted);
}
.bulk-group .input {
  height: 40px;
}
.bulk-group .btn {
  height: 40px;
}
.slot-card {
  border: 1px solid var(--line);
  border-radius: 14px;
  padding: 14px;
  background: #fff;
}
.slot-row {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
  gap: 12px;
  align-items: center;
}
.slot-meta {
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.field-hint {
  margin-top: 4px;
  font-size: 12px;
  color: var(--muted);
}
.slot-label {
  font-size: 12px;
  color: var(--muted);
}
.slot-status {
  font-size: 13px;
  padding: 6px 10px;
  border-radius: 999px;
  background: #eef6ff;
  color: #0b4a7d;
  width: fit-content;
}
.slot-status--booked {
  background: #f6e9e9;
  color: #8a2c2c;
}
.slot-actions {
  margin-top: 12px;
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}
.slot-hint {
  margin-top: 6px;
  font-size: 12px;
}
.slot-error {
  margin-top: 8px;
}
.form-error,
.slot-error {
  color: #b3261e;
  background: #fdecea;
  border: 1px solid #f5c2c0;
  border-radius: 10px;
  padding: 8px 10px;
}
.btn--sm {
  padding: 6px 12px;
  font-size: 13px;
  height: 40px;
}
.input--sm {
  padding: 8px 10px;
  font-size: 13px;
}
</style>
