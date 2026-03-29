<template>
  <section class="slots">
    <header class="slots__header">
      <div>
        <div class="badge">Розклад</div>
        <h1 class="title slots__title">Вільні вікна</h1>
        <p class="muted slots__subtitle">
          Переглядайте та оновлюйте вільні вікна, які доступні клієнтам для запису.
        </p>
      </div>
      <RouterLink class="btn btn--ghost" to="/cabinet">Назад до кабінету</RouterLink>
    </header>

    <div class="slots__subnav">
      <ScheduleSubnav active="slots" />
    </div>

    <section class="panel">
      <div class="filters-toolbar__row filters-toolbar__row--header">
        <div>
          <div class="badge badge--soft">Навігація</div>
          <h2 class="panel__title">Дні та фільтри</h2>
        </div>
        <div class="day-nav-actions">
          <button class="btn btn--ghost btn--sm" type="button" :disabled="dayOffset === 0" @click="shiftDays(-1)">
            Попередні 7 днів
          </button>
          <button class="btn btn--ghost btn--sm" type="button" @click="shiftDays(1)">
            Наступні 7 днів
          </button>
        </div>
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

      <div class="filters-toolbar__row filters-toolbar__row--controls">
        <div class="slot-filter" role="group" aria-label="Фільтр за статусом вікон">
          <button
            class="btn btn--ghost btn--sm"
            type="button"
            :class="{ 'btn--active': slotStatusFilter === 'ALL' }"
            @click="slotStatusFilter = 'ALL'"
          >
            Усі
          </button>
          <button
            class="btn btn--ghost btn--sm"
            type="button"
            :class="{ 'btn--active': slotStatusFilter === 'FREE' }"
            @click="slotStatusFilter = 'FREE'"
          >
            Вільні
          </button>
          <button
            class="btn btn--ghost btn--sm"
            type="button"
            :class="{ 'btn--active': slotStatusFilter === 'BOOKED' }"
            @click="slotStatusFilter = 'BOOKED'"
          >
            Заброньовані
          </button>
        </div>
        <label class="field day-picker day-picker--compact">
          Дата
          <input v-model="selectedDate" class="input" type="date" lang="uk-ua" @click="openPicker" />
        </label>
      </div>

      <div class="filters-toolbar__row filters-toolbar__row--meta">
        <div class="muted day-hint">
          Показано за: {{ formatDateOnly(selectedDate) }}
          <span v-if="isSelectedToday" class="day-hint__today">· Сьогодні</span>
        </div>
        <div class="muted slot-summary">
          {{ slotsForSelectedDay.length }} слотів · {{ selectedDayStatusSummary.free }} вільних · {{ selectedDayStatusSummary.booked }} заброньовані
        </div>
        <button
          v-if="hasPastSlotsOnSelectedDate"
          class="btn btn--ghost btn--sm slot-toggle"
          type="button"
          @click="showPastSlots = !showPastSlots"
        >
          {{ showPastSlots ? 'Сховати минулі вікна' : `Показати минулі вікна (${hiddenPastSlotsCount})` }}
        </button>
      </div>

      <p v-if="isSelectedToday" class="slot-note slot-note--quiet">
        Якщо нічний час для сьогодні вже минув, він не з'явиться у списку. Для перевірки нового нічного розкладу оберіть майбутню дату.
      </p>
    </section>

    <div v-if="loading" class="muted" style="margin-top: 8px;">Завантаження...</div>

    <section class="slot-list">
      <div v-if="filteredSlots.length === 0" class="muted">Вільних вікон на цей день немає.</div>
      <article
        v-for="slot in filteredSlots"
        :key="slot.id"
        class="slot-card"
        :class="{ 'slot-card--editing': isEditing(slot.id), 'slot-card--booked': slot.is_booked }"
      >
        <div class="slot-card__top">
          <div class="slot-card__main">
            <template v-if="isEditing(slot.id)">
              <div class="slot-card__edit">
                <input
                  v-model="editStartDate"
                  class="input"
                  type="date"
                  lang="uk"
                  placeholder="ДД.ММ.РРРР"
                  @click="openPicker"
                />
                <input
                  v-model="editStartTime"
                  class="input"
                  type="text"
                  inputmode="numeric"
                  placeholder="ГГ:ХХ"
                  list="time-options"
                />
                <input
                  v-model.number="editDuration"
                  class="input"
                  type="number"
                  min="15"
                  step="5"
                  placeholder="хв"
                  aria-label="Тривалість у хвилинах"
                />
              </div>
            </template>
            <template v-else>
              <div class="slot-card__time">{{ formatDate(slot.start_at) }}</div>
              <div class="slot-card__meta">{{ formatDuration(slot) }}</div>
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
            @click="requestDeleteSlot(slot.id)"
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
          Це вікно вже заброньовано - редагування та видалення недоступні.
        </div>
      </article>
    </section>

    <section class="panel panel--split">
      <div>
        <h2 class="panel__title">Нове вільне вікно</h2>
        <p class="muted" style="margin: 6px 0 0;">
          Вільне вікно - це вільний час для запису клієнта. Вкажіть початок і тривалість, і воно з'явиться у публічному профілі.
        </p>
        <p class="slot-note">
          Робочі години не створюють вільні вікна автоматично. Після зміни розкладу використайте
          <RouterLink class="slot-note__link" to="/cabinet/availability-rules">генерацію у налаштуваннях розкладу</RouterLink>
          або масове заповнення нижче.
        </p>
      </div>
      <form class="slot-form" @submit.prevent="createSlot">
        <label class="field">
          Початок
          <div class="datetime-field">
            <input
              v-model="newStartDate"
              class="input"
              type="date"
              lang="uk"
              placeholder="ДД.ММ.РРРР"
              aria-label="Дата початку"
              required
              @click="openPicker"
            />
            <input
              v-model="newStartTime"
              class="input"
              type="text"
              inputmode="numeric"
              placeholder="ГГ:ХХ"
              aria-label="Час початку"
              list="time-options"
              required
            />
          </div>
        </label>
        <label class="field">
          Тривалість
          <input
            v-model.number="newDuration"
            class="input"
            type="number"
            min="15"
            step="5"
            placeholder="хв"
            aria-label="Тривалість у хвилинах"
            required
          />
        </label>
        <datalist id="time-options">
          <option v-for="option in timeOptions" :key="option" :value="option" />
        </datalist>
        <button class="btn" type="button" @click="createSlot">
          Створити вільне вікно
        </button>
        <div v-if="error" class="form-error form-error--inline">{{ error }}</div>
      </form>
    </section>

    <section class="panel">
      <div class="panel__header">
        <div>
          <div class="badge badge--soft">Масове заповнення</div>
          <h2 class="panel__title">Швидкі шаблони</h2>
        </div>
      </div>
      <div class="slot-bulk">
        <div class="bulk-group">
          <label class="field">
            Дата для дня
            <input v-model="fillDayDate" class="input" type="date" lang="uk" @click="openPicker" />
          </label>
          <button
            class="btn btn--ghost btn--sm"
            type="button"
            :disabled="loading || !fillDayDate"
            @click="fillDay"
          >
            Заповнити день
          </button>
          <div class="bulk-hint">
            Формат: {{ formatDateOnly(fillDayDate) }}
            <span v-if="isFillDayToday" class="bulk-hint__today">· Сьогодні</span>
          </div>
        </div>
        <div class="bulk-group">
          <label class="field">
            Дата для тижня
            <input v-model="fillWeekDate" class="input" type="date" lang="uk" @click="openPicker" />
          </label>
          <button
            class="btn btn--ghost btn--sm"
            type="button"
            :disabled="loading || !fillWeekDate"
            @click="fillWeek"
          >
            Заповнити тиждень (Пн-Пт)
          </button>
          <div class="bulk-hint">
            Формат: {{ formatDateOnly(fillWeekDate) }}
            <span v-if="isFillWeekToday" class="bulk-hint__today">· Сьогодні</span>
          </div>
        </div>
      </div>
      <p class="slot-note">
        Якщо обрана дата - сьогодні, система пропускає години, що вже минули. Нічні вікна можна створити лише для майбутнього часу або майбутньої дати.
      </p>
    </section>
    <ConfirmModal
      :open="confirmModal.open"
      :title="confirmModal.title"
      :message="confirmModal.message"
      :confirm-text="confirmModal.confirmText"
      :cancel-text="confirmModal.cancelText"
      :tone="confirmModal.tone"
      @confirm="confirmModal.confirm"
      @cancel="confirmModal.closeConfirm"
    />
  </section>
</template>

<script setup lang="ts">
import { computed, nextTick, onMounted, ref } from 'vue'
import { apiDelete, apiGet, apiPatch, apiPost } from '../lib/api'
import { getBookingErrorCode, getBookingErrorMessage } from '../lib/bookingCopy'
import { useToast } from '../composables/useToast'
import ConfirmModal from '../components/ConfirmModal.vue'
import ScheduleSubnav from '../components/ScheduleSubnav.vue'
import { useConfirmModal } from '../composables/useConfirmModal'

type Slot = {
  id: number
  start_at: string
  end_at: string
  is_booked: boolean
}

type SlotConflict = {
  slot_id?: number
  start_at?: string
  end_at?: string
}

const slots = ref<Slot[]>([])
const loading = ref(false)
const error = ref('')
const editErrors = ref<Record<number, string>>({})
const editErrorRefs = ref<Record<number, HTMLElement | null>>({})
const toast = useToast()
const confirmModal = useConfirmModal()

const newStartDate = ref('')
const newStartTime = ref('')
const newDuration = ref(50)
const timeOptions = Array.from({ length: 24 * 4 }, (_, index) => {
  const minutes = index * 15
  const hours = String(Math.floor(minutes / 60)).padStart(2, '0')
  const mins = String(minutes % 60).padStart(2, '0')
  return `${hours}:${mins}`
})
const todayKey = toDateInputValue(new Date())
const fillDayDate = ref(todayKey)
const fillWeekDate = ref(todayKey)
const dayOffset = ref(0)
const selectedDate = ref(todayKey)
const showPastSlots = ref(false)
const slotStatusFilter = ref<'ALL' | 'FREE' | 'BOOKED'>('ALL')
const pastSlotMessage = 'Неможливо створити вікно в минулому. Для нічного часу оберіть майбутню дату або майбутній час.'

const editingId = ref<number | null>(null)
const editStartDate = ref('')
const editStartTime = ref('')
const editDuration = ref(50)
const WEEKDAY_SHORT_UK = ['нд', 'пн', 'вт', 'ср', 'чт', 'пт', 'сб']

function parseDateLike(value: string | Date): Date | null {
  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? null : value
  }
  const raw = String(value || '').trim()
  const isoDate = /^(\d{4})-(\d{2})-(\d{2})$/.exec(raw)
  if (isoDate) {
    const year = Number(isoDate[1])
    const month = Number(isoDate[2])
    const day = Number(isoDate[3])
    const date = new Date(year, month - 1, day, 0, 0, 0, 0)
    if (
      date.getFullYear() === year &&
      date.getMonth() === month - 1 &&
      date.getDate() === day
    ) {
      return date
    }
  }
  const parsed = new Date(raw)
  return Number.isNaN(parsed.getTime()) ? null : parsed
}

function pad2(value: number) {
  return String(value).padStart(2, '0')
}

function formatDateParts(date: Date) {
  return `${pad2(date.getDate())}.${pad2(date.getMonth() + 1)}.${date.getFullYear()}`
}

function formatTimeParts(date: Date) {
  return `${pad2(date.getHours())}:${pad2(date.getMinutes())}`
}

function formatDayOptionLabel(date: Date) {
  const weekday = WEEKDAY_SHORT_UK[date.getDay()] || ''
  return `${weekday}, ${pad2(date.getDate())}.${pad2(date.getMonth() + 1)}`
}

function formatDate(value: string) {
  const parsed = parseDateLike(value)
  if (!parsed) return value
  return formatTimeParts(parsed)
}

function formatDateTime(value: string | Date) {
  const parsed = parseDateLike(value)
  if (!parsed) return String(value)
  return `${formatDateParts(parsed)}, ${formatTimeParts(parsed)}`
}

function formatDateOnly(value: string) {
  const parsed = parseDateLike(value)
  if (!parsed) return value
  return formatDateParts(parsed)
}

function formatDuration(slot: Slot) {
  const start = new Date(slot.start_at)
  const end = new Date(slot.end_at)
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return '-'
  const minutes = Math.max(0, Math.round((end.getTime() - start.getTime()) / 60000))
  return `${minutes} хв`
}

function toLocalDateKey(value: string) {
  const dt = new Date(value)
  if (Number.isNaN(dt.getTime())) return value
  const offset = dt.getTimezoneOffset() * 60000
  return new Date(dt.getTime() - offset).toISOString().slice(0, 10)
}

function isFutureSlot(slot: Slot) {
  const start = new Date(slot.start_at).getTime()
  return !Number.isNaN(start) && start > Date.now()
}

function getSlotsForDate(dateKey: string) {
  return slots.value.filter((slot) => toLocalDateKey(slot.start_at) === dateKey)
}

function getNearestFutureDateKey(fromDateKey: string) {
  const nearest = slots.value
    .filter((slot) => isFutureSlot(slot))
    .map((slot) => toLocalDateKey(slot.start_at))
    .filter((dateKey) => dateKey >= fromDateKey)
    .sort()[0]
  return nearest || ''
}

function switchToNearestFutureDateIfNeeded() {
  if (!selectedDate.value || showPastSlots.value || filteredSlots.value.length > 0) return
  const nearestDateKey = getNearestFutureDateKey(selectedDate.value)
  if (!nearestDateKey || nearestDateKey === selectedDate.value) return
  const previousDateKey = selectedDate.value
  selectedDate.value = nearestDateKey
  toast.info(
    `За ${formatDateOnly(previousDateKey)} немає майбутніх вікон. Показано найближчу дату: ${formatDateOnly(nearestDateKey)}.`
  )
}

function getHiddenPastSlotsCount(dateKey: string, excludedSlotId?: number) {
  return getSlotsForDate(dateKey).filter((slot) => {
    if (excludedSlotId !== undefined && slot.id === excludedSlotId) return false
    return !isFutureSlot(slot)
  }).length
}

function formatUkTime(value: Date) {
  return formatTimeParts(value)
}

function parseUkDateTime(dateStr: string, timeStr: string) {
  const trimmedDate = dateStr.trim()
  const trimmedTime = timeStr.trim()
  const dateMatch = /^(\d{2})\.(\d{2})\.(\d{4})$/.exec(trimmedDate)
  const isoMatch = /^(\d{4})-(\d{2})-(\d{2})$/.exec(trimmedDate)
  const timeMatch = /^(\d{1,2}):(\d{1,2})$/.exec(trimmedTime)
  if (!timeMatch) return null

  let year: number
  let month: number
  let day: number

  if (dateMatch) {
    day = Number(dateMatch[1])
    month = Number(dateMatch[2])
    year = Number(dateMatch[3])
  } else if (isoMatch) {
    year = Number(isoMatch[1])
    month = Number(isoMatch[2])
    day = Number(isoMatch[3])
  } else {
    return null
  }

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
  return (el: Element | { $el?: Element } | null) => {
    const element = el && '$el' in el ? el.$el ?? null : el
    editErrorRefs.value[id] = element as HTMLElement | null
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

function normalizeConflict(err: any): SlotConflict | null {
  const conflict = err?.response?.data?.conflict
  if (!conflict || typeof conflict !== 'object') return null

  const normalized: SlotConflict = {}
  if (typeof conflict.slot_id === 'number') normalized.slot_id = conflict.slot_id
  if (typeof conflict.start_at === 'string' && conflict.start_at.trim()) normalized.start_at = conflict.start_at
  if (typeof conflict.end_at === 'string' && conflict.end_at.trim()) normalized.end_at = conflict.end_at

  return normalized.slot_id || normalized.start_at || normalized.end_at ? normalized : null
}

function formatConflictRange(conflict: SlotConflict) {
  if (conflict.start_at && conflict.end_at) {
    const startLabel = formatDateTime(conflict.start_at)
    const sameDay = toLocalDateKey(conflict.start_at) === toLocalDateKey(conflict.end_at)
    const endDate = new Date(conflict.end_at)
    if (sameDay && !Number.isNaN(endDate.getTime())) {
      return `${startLabel}-${formatUkTime(endDate)}`
    }
    return `${startLabel} - ${formatDateTime(conflict.end_at)}`
  }

  if (conflict.start_at) {
    return formatDateTime(conflict.start_at)
  }

  if (typeof conflict.slot_id === 'number') {
    return `ID ${conflict.slot_id}`
  }

  return ''
}

function isPastConflict(conflict: SlotConflict | null) {
  if (!conflict?.end_at) return false
  const end = new Date(conflict.end_at).getTime()
  return !Number.isNaN(end) && end <= Date.now()
}

function translateError(
  message: string,
  options?: { code?: string | null; conflict?: SlotConflict | null }
) {
  if (!message && options?.code !== 'SLOT_OVERLAP') return ''
  if (options?.code === 'SLOT_OVERLAP' || message.includes('overlaps')) {
    const conflictRange = options?.conflict ? formatConflictRange(options.conflict) : ''
    if (conflictRange && isPastConflict(options?.conflict || null)) {
      return `Віконце перетинається з уже існуючим: ${conflictRange}. Це вікно вже в минулому, тому не показується у списку за замовчуванням.`
    }
    if (conflictRange) {
      return `Віконце перетинається з уже існуючим: ${conflictRange}.`
    }
    return 'Віконце перетинається з уже існуючим.'
  }
  if (message.includes('end_at must be greater than start_at')) {
    return 'Кінець має бути пізніше за початок.'
  }
  if (message.includes('Slot not found')) {
    return 'Віконце не знайдено.'
  }
  return message
}

function getSlotErrorMessage(err: unknown, fallback: string) {
  const code = getBookingErrorCode(err)
  const raw = normalizeError(err)
  const conflict = normalizeConflict(err)
  const translated = translateError(raw, { code, conflict })
  if (translated) return translated
  return getBookingErrorMessage(err, fallback)
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
  return Array.from({ length: 7 }, (_, idx) => {
    const d = new Date(start.getTime() + idx * 24 * 60 * 60 * 1000)
    return {
      key: toDateInputValue(d),
      label: formatDayOptionLabel(d),
    }
  })
})

const slotsForSelectedDay = computed(() => {
  if (!selectedDate.value) {
    return showPastSlots.value ? slots.value : slots.value.filter(isFutureSlot)
  }
  const slotsForDate = getSlotsForDate(selectedDate.value)
  return showPastSlots.value ? slotsForDate : slotsForDate.filter(isFutureSlot)
})

const selectedDayStatusSummary = computed(() => {
  const free = slotsForSelectedDay.value.filter((slot) => !slot.is_booked).length
  return {
    free,
    booked: slotsForSelectedDay.value.length - free,
  }
})

const filteredSlots = computed(() => {
  if (slotStatusFilter.value === 'FREE') {
    return slotsForSelectedDay.value.filter((slot) => !slot.is_booked)
  }
  if (slotStatusFilter.value === 'BOOKED') {
    return slotsForSelectedDay.value.filter((slot) => slot.is_booked)
  }
  return slotsForSelectedDay.value
})

const hiddenPastSlotsCount = computed(() => {
  if (!selectedDate.value) return 0
  return getHiddenPastSlotsCount(selectedDate.value)
})

const hasPastSlotsOnSelectedDate = computed(() => hiddenPastSlotsCount.value > 0)

const isSelectedToday = computed(() => selectedDate.value === todayKey)
const isFillDayToday = computed(() => fillDayDate.value === todayKey)
const isFillWeekToday = computed(() => fillWeekDate.value === todayKey)

function selectDay(key: string) {
  selectedDate.value = key
  showPastSlots.value = false
}

function shiftDays(direction: number) {
  dayOffset.value = Math.max(0, dayOffset.value + direction * 7)
  const first = dayOptions.value[0]
  if (first) {
    selectedDate.value = first.key
  }
}

async function loadSlots() {
  loading.value = true
  error.value = ''
  try {
    const resp = await apiGet<Slot[]>('/cabinet/slots/')
    slots.value = resp || []
    switchToNearestFutureDateIfNeeded()
    if (selectedDate.value && getHiddenPastSlotsCount(selectedDate.value) === 0) {
      showPastSlots.value = false
    }
  } catch (err: any) {
    error.value = getBookingErrorMessage(err, '\u041d\u0435 \u0432\u0434\u0430\u043b\u043e\u0441\u044f \u0437\u0430\u0432\u0430\u043d\u0442\u0430\u0436\u0438\u0442\u0438 \u0441\u043b\u043e\u0442\u0438')
  } finally {
    loading.value = false
  }
}

async function createSlot() {
  loading.value = true
  error.value = ''
  try {
    const startAt = parseUkDateTime(newStartDate.value, newStartTime.value)
    const durationMinutes = Number(newDuration.value)
    if (!startAt || !Number.isFinite(durationMinutes) || durationMinutes <= 0) {
      error.value = 'Вкажіть дату, час і тривалість у хвилинах.'
      return
    }
    if (startAt.getTime() < Date.now()) {
      error.value = pastSlotMessage
      return
    }
    const endAt = new Date(startAt.getTime() + durationMinutes * 60000)
    const payload = {
      start_at: startAt.toISOString(),
      end_at: endAt.toISOString(),
    }
    await apiPost<Slot>('/cabinet/slots/', payload)
    selectedDate.value = toDateInputValue(startAt)
    showPastSlots.value = false
    await loadSlots()
    newStartDate.value = ''
    newStartTime.value = ''
    newDuration.value = 50
    toast.success(`Вільне вікно на ${formatDateTime(startAt)} створено.`)
  } catch (err: any) {
    error.value = getSlotErrorMessage(err, '\u041d\u0435 \u0432\u0434\u0430\u043b\u043e\u0441\u044f \u0441\u0442\u0432\u043e\u0440\u0438\u0442\u0438 \u0432\u0456\u043b\u044c\u043d\u0435 \u0432\u0456\u043a\u043d\u043e')
    newStartTime.value = ''
  } finally {
    loading.value = false
  }
}

async function fillDay() {
  loading.value = true
  error.value = ''
  try {
    await apiPost('/cabinet/slots/fill-day/', {
      date: fillDayDate.value,
    })
    selectedDate.value = fillDayDate.value
    showPastSlots.value = false
    await loadSlots()
    toast.success(
      isFillDayToday.value
        ? `День ${formatDateOnly(fillDayDate.value)} заповнено. Додано лише майбутні вікна.`
        : `День ${formatDateOnly(fillDayDate.value)} заповнено.`,
    )
  } catch (err: any) {
    error.value = getBookingErrorMessage(err, '\u041d\u0435 \u0432\u0434\u0430\u043b\u043e\u0441\u044f \u0437\u0430\u043f\u043e\u0432\u043d\u0438\u0442\u0438 \u0434\u0435\u043d\u044c \u0432\u0456\u043b\u044c\u043d\u0438\u043c\u0438 \u0432\u0456\u043a\u043d\u0430\u043c\u0438')
  } finally {
    loading.value = false
  }
}

async function fillWeek() {
  loading.value = true
  error.value = ''
  try {
    await apiPost('/cabinet/slots/fill-week/', {
      date: fillWeekDate.value,
    })
    selectedDate.value = fillWeekDate.value
    showPastSlots.value = false
    await loadSlots()
    toast.success(
      isFillWeekToday.value
        ? `Тиждень від ${formatDateOnly(fillWeekDate.value)} заповнено. Для сьогодні додано лише майбутні вікна.`
        : `Тиждень від ${formatDateOnly(fillWeekDate.value)} заповнено.`,
    )
  } catch (err: any) {
    error.value = getBookingErrorMessage(err, '\u041d\u0435 \u0432\u0434\u0430\u043b\u043e\u0441\u044f \u0437\u0430\u043f\u043e\u0432\u043d\u0438\u0442\u0438 \u0442\u0438\u0436\u0434\u0435\u043d\u044c \u0432\u0456\u043b\u044c\u043d\u0438\u043c\u0438 \u0432\u0456\u043a\u043d\u0430\u043c\u0438')
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
    editStartDate.value = toDateInputValue(start)
    editStartTime.value = formatUkTime(start)
  }
  if (!Number.isNaN(end.getTime())) {
    const durationMs = end.getTime() - start.getTime()
    editDuration.value = Math.max(15, Math.round(durationMs / 60000))
  }
}

function cancelEdit() {
  if (editingId.value !== null) {
    editErrors.value[editingId.value] = ''
  }
  editingId.value = null
  editStartDate.value = ''
  editStartTime.value = ''
  editDuration.value = 50
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
    const durationMinutes = Number(editDuration.value)
    if (!startAt || !Number.isFinite(durationMinutes) || durationMinutes <= 0) {
      error.value = 'Вкажіть дату, час і тривалість у хвилинах.'
      return
    }
    if (startAt.getTime() < Date.now()) {
      editErrors.value[slotId] = pastSlotMessage
      await nextTick()
      const errorEl = editErrorRefs.value[slotId]
      if (errorEl) {
        errorEl.scrollIntoView({ block: 'nearest' })
      }
      return
    }
    const endAt = new Date(startAt.getTime() + durationMinutes * 60000)
    const payload = {
      start_at: startAt.toISOString(),
      end_at: endAt.toISOString(),
    }
    const resp = await apiPatch<Slot>(`/cabinet/slots/${slotId}/`, payload)
    slots.value = slots.value.map((slot) => (slot.id === slotId ? resp : slot))
    cancelEdit()
  } catch (err: any) {
    editErrors.value[slotId] =
      getSlotErrorMessage(err, '\u041d\u0435 \u0432\u0434\u0430\u043b\u043e\u0441\u044f \u043e\u043d\u043e\u0432\u0438\u0442\u0438 \u0432\u0456\u043b\u044c\u043d\u0435 \u0432\u0456\u043a\u043d\u043e')
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
    await apiDelete(`/cabinet/slots/${slotId}/`)
    slots.value = slots.value.filter((slot) => slot.id !== slotId)
  } catch (err: any) {
    error.value = getBookingErrorMessage(err, '\u041d\u0435 \u0432\u0434\u0430\u043b\u043e\u0441\u044f \u0432\u0438\u0434\u0430\u043b\u0438\u0442\u0438 \u0432\u0456\u043b\u044c\u043d\u0435 \u0432\u0456\u043a\u043d\u043e')
  } finally {
    loading.value = false
  }
}

function requestDeleteSlot(slotId: number) {
  confirmModal.openConfirm({
    title: 'Видалити вільне вікно?',
    message: 'Воно зникне з публічного профілю.',
    confirmText: 'Видалити',
    cancelText: 'Скасувати',
    tone: 'danger',
    onConfirm: () => deleteSlot(slotId),
  })
}

onMounted(loadSlots)
</script>

<style scoped>
.slots {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.slots__header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 10px;
  background: transparent;
  border: 0;
  border-radius: 0;
  padding: 2px 2px 0;
  box-shadow: none;
}

.slots__header .btn {
  height: 34px;
  padding: 0 12px;
}

.slots__title {
  font-size: 26px;
  margin-bottom: 2px;
}

.slots__subtitle {
  max-width: 600px;
  font-size: 14px;
}

.slots__subnav {
  margin-top: -2px;
}

.panel {
  border: 1px solid var(--line);
  border-radius: 14px;
  padding: 14px;
  background: #fff;
  display: grid;
  gap: 8px;
}

.panel--split {
  grid-template-columns: minmax(240px, 0.9fr) minmax(480px, 1.1fr);
  align-items: start;
  gap: 20px;
}

.panel--split > div {
  padding-right: 8px;
}

.panel__header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
}

.panel__title {
  margin: 0;
  font-family: var(--font-display);
  font-size: 22px;
}

.badge--soft {
  background: rgba(8, 113, 201, 0.12);
}

.slot-form {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(0, 1fr) minmax(0, 180px);
  column-gap: 10px;
  row-gap: 8px;
  align-items: start;
  width: 100%;
  max-width: 100%;
}

.slot-form .field {
  display: grid;
  gap: 6px;
  font-size: 12px;
  color: var(--muted);
}

.slot-form .input,
.slot-form .btn {
  height: 40px;
}

.slot-form .input {
  font-size: 13px;
  padding: 10px 12px;
}

.slot-form .btn {
  align-self: end;
}

.slot-form .btn {
  width: 100%;
  min-width: 0;
  justify-self: stretch;
}

.slot-form .input {
  min-width: 0;
}

.datetime-field {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 76px;
  gap: 8px;
  align-items: center;
}

.slot-list {
  display: grid;
  grid-template-columns: 1fr;
  gap: 8px;
}

.slot-summary {
  font-size: 12px;
}

.day-nav-actions {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
  justify-content: flex-end;
}

.day-list {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
}

.slot-filter {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
}

.filters-toolbar__row {
  display: flex;
  gap: 8px;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
}

.filters-toolbar__row--controls {
  justify-content: flex-start;
  gap: 10px;
}

.filters-toolbar__row--meta {
  justify-content: flex-start;
  gap: 10px;
}

.day-picker {
  display: grid;
  gap: 2px;
  font-size: 12px;
  color: var(--muted);
}

.day-picker--compact .input {
  height: 36px;
  width: 220px;
}

.day-hint {
  font-size: 12px;
  text-align: left;
}

.day-hint__today {
  color: #0b4a7d;
  font-weight: 600;
  margin-left: 6px;
}

.slot-toggle {
  width: fit-content;
}

.slot-note {
  margin: 0;
  font-size: 12px;
  color: var(--muted);
}

.slot-note--quiet {
  font-size: 11px;
  opacity: 0.8;
}

.slot-note__link {
  color: #0b4a7d;
  font-weight: 600;
  text-decoration: none;
}

.slot-note__link:hover,
.slot-note__link:focus-visible {
  text-decoration: underline;
}

.btn--active {
  border-color: #0b4a7d;
  color: #0b4a7d;
  background: #eef6ff;
}

.slot-bulk {
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
  row-gap: 8px;
  align-items: end;
}

.bulk-group .input,
.bulk-group .btn {
  height: 40px;
}

.bulk-group .field {
  grid-column: 1;
  grid-row: 1;
}

.bulk-group .btn {
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

.bulk-hint__today {
  color: #0b4a7d;
  font-weight: 600;
  margin-left: 6px;
}

.slot-card {
  border: 1px solid var(--line);
  border-radius: 12px;
  padding: 10px;
  background: #fff;
  display: grid;
  gap: 6px;
}

.slot-card--editing {
  grid-column: 1 / -1;
}

.slot-card--booked {
  background: #faf7f6;
  border-color: #e6dad7;
}

.slot-card--booked .slot-card__time {
  color: #564943;
}

.slot-card--booked .slot-card__meta {
  color: #7b6b64;
}

.slot-card__top {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 8px;
}

.slot-card__main {
  min-width: 0;
  display: grid;
  gap: 3px;
}

.slot-card__time {
  font-size: 15px;
  font-weight: 600;
  line-height: 1.2;
}

.slot-card__meta {
  font-size: 12px;
  color: var(--muted);
}

.slot-card__edit {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 76px 80px;
  gap: 6px;
  align-items: center;
}

.field-hint {
  margin-top: 4px;
  font-size: 12px;
  color: var(--muted);
}

.slot-status {
  font-size: 12px;
  padding: 4px 8px;
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
  margin-top: 0;
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
}

.slot-actions .btn--sm {
  height: 34px;
  padding: 5px 10px;
  font-size: 12px;
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

.form-error--inline {
  margin-top: 8px;
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

@media (max-width: 860px) {
  .slots__header {
    flex-direction: column;
    align-items: flex-start;
  }

  .panel--split {
    grid-template-columns: 1fr;
  }

  .filters-toolbar__row {
    align-items: flex-start;
  }

  .day-picker--compact .input {
    width: 100%;
    max-width: 260px;
  }

  .filters-toolbar__row--meta {
    gap: 6px;
  }

  .slot-card__edit {
    grid-template-columns: minmax(0, 1fr) 84px;
  }
}

@media (min-width: 680px) {
  .slot-list {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (min-width: 980px) {
  .slot-list {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }
}

@media (min-width: 1260px) {
  .slot-list {
    grid-template-columns: repeat(4, minmax(0, 1fr));
  }
}
</style>
