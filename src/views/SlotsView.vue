<template>
  <section class="slots">
    <header class="slots__hero">
      <div>
        <div class="badge">Р РѕР·РєР»Р°Рґ</div>
        <h1 class="title slots__title">Р’С–Р»СЊРЅС– РІС–РєРЅР°</h1>
        <p class="muted slots__subtitle">
          РџРµСЂРµРіР»СЏРґР°Р№С‚Рµ С‚Р° РѕРЅРѕРІР»СЋР№С‚Рµ РІС–Р»СЊРЅС– РІС–РєРЅР°, СЏРєС– РґРѕСЃС‚СѓРїРЅС– РєР»С–С”РЅС‚Р°Рј РґР»СЏ Р·Р°РїРёСЃСѓ.
        </p>
      </div>
      <RouterLink class="btn btn--ghost" to="/cabinet">РќР°Р·Р°Рґ РґРѕ РєР°Р±С–РЅРµС‚Сѓ</RouterLink>
    </header>

    <ScheduleSubnav active="slots" />

    <section class="panel panel--split">
      <div>
        <h2 class="panel__title">РќРѕРІРµ РІС–Р»СЊРЅРµ РІС–РєРЅРѕ</h2>
        <p class="muted" style="margin: 6px 0 0;">
          Р’С–Р»СЊРЅРµ РІС–РєРЅРѕ вЂ” С†Рµ РІС–Р»СЊРЅРёР№ С‡Р°СЃ РґР»СЏ Р·Р°РїРёСЃСѓ РєР»С–С”РЅС‚Р°. Р’РєР°Р¶С–С‚СЊ РїРѕС‡Р°С‚РѕРє С– С‚СЂРёРІР°Р»С–СЃС‚СЊ, С– РІРѕРЅРѕ Р·'СЏРІРёС‚СЊСЃСЏ Сѓ РїСѓР±Р»С–С‡РЅРѕРјСѓ РїСЂРѕС„С–Р»С–.
        </p>
        <p class="slot-note">
          Р РѕР±РѕС‡С– РіРѕРґРёРЅРё РЅРµ СЃС‚РІРѕСЂСЋСЋС‚СЊ РІС–Р»СЊРЅС– РІС–РєРЅР° Р°РІС‚РѕРјР°С‚РёС‡РЅРѕ. РџС–СЃР»СЏ Р·РјС–РЅРё СЂРѕР·РєР»Р°РґСѓ РІРёРєРѕСЂРёСЃС‚Р°Р№С‚Рµ
          <RouterLink class="slot-note__link" to="/cabinet/availability-rules">РіРµРЅРµСЂР°С†С–СЋ Сѓ РЅР°Р»Р°С€С‚СѓРІР°РЅРЅСЏС… СЂРѕР·РєР»Р°РґСѓ</RouterLink>
          Р°Р±Рѕ РјР°СЃРѕРІРµ Р·Р°РїРѕРІРЅРµРЅРЅСЏ РЅРёР¶С‡Рµ.
        </p>
      </div>
      <form class="slot-form" @submit.prevent="createSlot">
        <label class="field">
          РџРѕС‡Р°С‚РѕРє
          <div class="datetime-field">
            <input
              v-model="newStartDate"
              class="input"
              type="date"
              lang="uk"
              placeholder="Р”Р”.РњРњ.Р Р Р Р "
              aria-label="Р”Р°С‚Р° РїРѕС‡Р°С‚РєСѓ"
              required
              @click="openPicker"
            />
            <input
              v-model="newStartTime"
              class="input"
              type="text"
              inputmode="numeric"
              placeholder="Р“Р“:РҐРҐ"
              aria-label="Р§Р°СЃ РїРѕС‡Р°С‚РєСѓ"
              list="time-options"
              required
            />
          </div>
        </label>
        <label class="field">
          РўСЂРёРІР°Р»С–СЃС‚СЊ
          <input
            v-model.number="newDuration"
            class="input"
            type="number"
            min="15"
            step="5"
            placeholder="С…РІ"
            aria-label="РўСЂРёРІР°Р»С–СЃС‚СЊ Сѓ С…РІРёР»РёРЅР°С…"
            required
          />
        </label>
                <datalist id="time-options">
          <option v-for="option in timeOptions" :key="option" :value="option" />
        </datalist>
        <button class="btn" type="button" @click="createSlot">
          РЎС‚РІРѕСЂРёС‚Рё РІС–Р»СЊРЅРµ РІС–РєРЅРѕ
        </button>
        <div v-if="error" class="form-error form-error--inline">{{ error }}</div>
      </form>
    </section>

    <section class="panel">
      <div class="panel__header">
        <div>
          <div class="badge badge--soft">РњР°СЃРѕРІРµ Р·Р°РїРѕРІРЅРµРЅРЅСЏ</div>
          <h2 class="panel__title">РЁРІРёРґРєС– С€Р°Р±Р»РѕРЅРё</h2>
        </div>
      </div>
      <div class="slot-bulk">
        <div class="bulk-group">
          <label class="field">
            Р”Р°С‚Р° РґР»СЏ РґРЅСЏ
            <input v-model="fillDayDate" class="input" type="date" lang="uk" @click="openPicker" />
          </label>
          <button
            class="btn btn--ghost btn--sm"
            type="button"
            :disabled="loading || !fillDayDate"
            @click="fillDay"
          >
            Р—Р°РїРѕРІРЅРёС‚Рё РґРµРЅСЊ
          </button>
          <div class="bulk-hint">
            Р¤РѕСЂРјР°С‚: {{ formatDateOnly(fillDayDate) }}
            <span v-if="isFillDayToday" class="bulk-hint__today">В· РЎСЊРѕРіРѕРґРЅС–</span>
          </div>
        </div>
        <div class="bulk-group">
          <label class="field">
            Р”Р°С‚Р° РґР»СЏ С‚РёР¶РЅСЏ
            <input v-model="fillWeekDate" class="input" type="date" lang="uk" @click="openPicker" />
          </label>
          <button
            class="btn btn--ghost btn--sm"
            type="button"
            :disabled="loading || !fillWeekDate"
            @click="fillWeek"
          >
            Р—Р°РїРѕРІРЅРёС‚Рё С‚РёР¶РґРµРЅСЊ (РџРЅвЂ“РџС‚)
          </button>
          <div class="bulk-hint">
            Р¤РѕСЂРјР°С‚: {{ formatDateOnly(fillWeekDate) }}
            <span v-if="isFillWeekToday" class="bulk-hint__today">В· РЎСЊРѕРіРѕРґРЅС–</span>
          </div>
        </div>
      </div>
      <p class="slot-note">
        РЇРєС‰Рѕ РѕР±СЂР°РЅР° РґР°С‚Р° вЂ” СЃСЊРѕРіРѕРґРЅС–, СЃРёСЃС‚РµРјР° РїСЂРѕРїСѓСЃРєР°С” РіРѕРґРёРЅРё, С‰Рѕ РІР¶Рµ РјРёРЅСѓР»Рё. РќС–С‡РЅС– РІС–РєРЅР° РјРѕР¶РЅР° СЃС‚РІРѕСЂРёС‚Рё Р»РёС€Рµ РґР»СЏ РјР°Р№Р±СѓС‚РЅСЊРѕРіРѕ С‡Р°СЃСѓ Р°Р±Рѕ РјР°Р№Р±СѓС‚РЅСЊРѕС— РґР°С‚Рё.
      </p>
    </section>

    <section class="panel">
      <div class="panel__header">
        <div>
          <div class="badge badge--soft">РќР°РІС–РіР°С†С–СЏ</div>
          <h2 class="panel__title">Р”РЅС– С‚Р° С„С–Р»СЊС‚СЂРё</h2>
        </div>
        <div class="day-nav-actions">
          <button class="btn btn--ghost btn--sm" type="button" :disabled="dayOffset === 0" @click="shiftDays(-1)">
            РџРѕРїРµСЂРµРґРЅС– 7 РґРЅС–РІ
          </button>
          <button class="btn btn--ghost btn--sm" type="button" @click="shiftDays(1)">
            РќР°СЃС‚СѓРїРЅС– 7 РґРЅС–РІ
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
      <label class="field day-picker">
        РћР±СЂР°С‚Рё РґР°С‚Сѓ
        <input v-model="selectedDate" class="input" type="date" lang="uk-ua" @click="openPicker" />
        <span class="field-hint">Р¤РѕСЂРјР°С‚: {{ formatDateOnly(selectedDate) }}</span>
      </label>
      <div class="muted day-hint">
        РџРѕРєР°Р·Р°РЅРѕ РІС–Р»СЊРЅС– РІС–РєРЅР° Р·Р°: {{ formatDateOnly(selectedDate) }}
        <span v-if="isSelectedToday" class="day-hint__today">В· РЎСЊРѕРіРѕРґРЅС–</span>
      </div>
      <button
        v-if="hasPastSlotsOnSelectedDate"
        class="btn btn--ghost btn--sm slot-toggle"
        type="button"
        @click="showPastSlots = !showPastSlots"
      >
        {{ showPastSlots ? 'РЎС…РѕРІР°С‚Рё РјРёРЅСѓР»С– РІС–РєРЅР°' : `РџРѕРєР°Р·Р°С‚Рё РјРёРЅСѓР»С– РІС–РєРЅР° (${hiddenPastSlotsCount})` }}
      </button>
      <p v-if="isSelectedToday" class="slot-note">
        РЇРєС‰Рѕ РЅС–С‡РЅРёР№ С‡Р°СЃ РґР»СЏ СЃСЊРѕРіРѕРґРЅС– РІР¶Рµ РјРёРЅСѓРІ, РІС–РЅ РЅРµ Р·'СЏРІРёС‚СЊСЃСЏ Сѓ СЃРїРёСЃРєСѓ. Р”Р»СЏ РїРµСЂРµРІС–СЂРєРё РЅРѕРІРѕРіРѕ РЅС–С‡РЅРѕРіРѕ СЂРѕР·РєР»Р°РґСѓ РѕР±РµСЂС–С‚СЊ РјР°Р№Р±СѓС‚РЅСЋ РґР°С‚Сѓ.
      </p>
    </section>

    <div v-if="loading" class="muted" style="margin-top: 12px;">Р—Р°РІР°РЅС‚Р°Р¶РµРЅРЅСЏ...</div>

    <section class="slot-list">
      <div v-if="filteredSlots.length === 0" class="muted">Р’С–Р»СЊРЅРёС… РІС–РєРѕРЅ РЅР° С†РµР№ РґРµРЅСЊ РЅРµРјР°С”.</div>
      <article v-for="slot in filteredSlots" :key="slot.id" class="slot-card">
        <div class="slot-row">
          <div class="slot-meta">
            <div class="slot-label">РџРѕС‡Р°С‚РѕРє</div>
            <template v-if="isEditing(slot.id)">
              <div class="datetime-field">
                <input
                    v-model="editStartDate"
                    class="input"
                    type="date"
                    lang="uk"
                    placeholder="Р”Р”.РњРњ.Р Р Р Р "
                    @click="openPicker"
                  />
                <input
                    v-model="editStartTime"
                    class="input"
                    type="text"
                    inputmode="numeric"
                    placeholder="Р“Р“:РҐРҐ"
                    list="time-options"
                  />
              </div>
            </template>
            <template v-else>
              <div>{{ formatDate(slot.start_at) }}</div>
            </template>
          </div>
          <div class="slot-meta">
            <div class="slot-label">РўСЂРёРІР°Р»С–СЃС‚СЊ</div>
            <template v-if="isEditing(slot.id)">
              <div class="datetime-field">
                <input
                  v-model.number="editDuration"
                  class="input"
                  type="number"
                  min="15"
                  step="5"
                  placeholder="С…РІ"
                  aria-label="РўСЂРёРІР°Р»С–СЃС‚СЊ Сѓ С…РІРёР»РёРЅР°С…"
                />
              </div>
            </template>
            <template v-else>
              <div>{{ formatDuration(slot) }}</div>
            </template>
          </div>
          <div class="slot-status" :class="{ 'slot-status--booked': slot.is_booked }">
            {{ slot.is_booked ? 'Р—Р°Р±СЂРѕРЅСЊРѕРІР°РЅРѕ' : 'Р’С–Р»СЊРЅРѕ' }}
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
            Р РµРґР°РіСѓРІР°С‚Рё
          </button>
          <button
            v-else
            class="btn btn--sm"
            type="button"
            :disabled="loading"
            @click="saveEdit(slot.id)"
          >
            Р—Р±РµСЂРµРіС‚Рё
          </button>
          <button
            v-if="isEditing(slot.id)"
            class="btn btn--ghost btn--sm"
            type="button"
            :disabled="loading"
            @click="cancelEdit"
          >
            РЎРєР°СЃСѓРІР°С‚Рё
          </button>
          <button
            class="btn btn--ghost btn--sm"
            type="button"
            :disabled="slot.is_booked || loading"
            @click="requestDeleteSlot(slot.id)"
          >
            Р’РёРґР°Р»РёС‚Рё
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
          Р¦Рµ РІС–РєРЅРѕ РІР¶Рµ Р·Р°Р±СЂРѕРЅСЊРѕРІР°РЅРѕ вЂ” СЂРµРґР°РіСѓРІР°РЅРЅСЏ С‚Р° РІРёРґР°Р»РµРЅРЅСЏ РЅРµРґРѕСЃС‚СѓРїРЅС–.
        </div>
      </article>
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
import { formatUkDateCompact, formatUkDateTime, formatUkDateTimeCompact } from '../lib/dateTime'

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
const pastSlotMessage = 'РќРµРјРѕР¶Р»РёРІРѕ СЃС‚РІРѕСЂРёС‚Рё РІС–РєРЅРѕ РІ РјРёРЅСѓР»РѕРјСѓ. Р”Р»СЏ РЅС–С‡РЅРѕРіРѕ С‡Р°СЃСѓ РѕР±РµСЂС–С‚СЊ РјР°Р№Р±СѓС‚РЅСЋ РґР°С‚Сѓ Р°Р±Рѕ РјР°Р№Р±СѓС‚РЅС–Р№ С‡Р°СЃ.'

const editingId = ref<number | null>(null)
const editStartDate = ref('')
const editStartTime = ref('')
const editDuration = ref(50)

function formatDate(value: string) {
  return formatUkDateTimeCompact(value, value)
}

function formatDateOnly(value: string) {
  return formatUkDateCompact(value, value)
}

function formatDuration(slot: Slot) {
  const start = new Date(slot.start_at)
  const end = new Date(slot.end_at)
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return 'вЂ”'
  const minutes = Math.max(0, Math.round((end.getTime() - start.getTime()) / 60000))
  return `${minutes} С…РІ`
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

function getHiddenPastSlotsCount(dateKey: string, excludedSlotId?: number) {
  return getSlotsForDate(dateKey).filter((slot) => {
    if (excludedSlotId !== undefined && slot.id === excludedSlotId) return false
    return !isFutureSlot(slot)
  }).length
}

function formatUkTime(value: Date) {
  const hours = String(value.getHours()).padStart(2, '0')
  const minutes = String(value.getMinutes()).padStart(2, '0')
  return `${hours}:${minutes}`
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
    const startLabel = formatUkDateTimeCompact(conflict.start_at, '')
    const sameDay = toLocalDateKey(conflict.start_at) === toLocalDateKey(conflict.end_at)
    const endDate = new Date(conflict.end_at)
    if (sameDay && !Number.isNaN(endDate.getTime())) {
      return `${startLabel}-${formatUkTime(endDate)}`
    }
    return `${startLabel} - ${formatUkDateTimeCompact(conflict.end_at, '')}`
  }

  if (conflict.start_at) {
    return formatUkDateTimeCompact(conflict.start_at, '')
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
      return `Р’С–РєРѕРЅС†Рµ РїРµСЂРµС‚РёРЅР°С”С‚СЊСЃСЏ Р· СѓР¶Рµ С–СЃРЅСѓСЋС‡РёРј: ${conflictRange}. Р¦Рµ РІС–РєРЅРѕ РІР¶Рµ РІ РјРёРЅСѓР»РѕРјСѓ, С‚РѕРјСѓ РЅРµ РїРѕРєР°Р·СѓС”С‚СЊСЃСЏ Сѓ СЃРїРёСЃРєСѓ Р·Р° Р·Р°РјРѕРІС‡СѓРІР°РЅРЅСЏРј.`
    }
    if (conflictRange) {
      return `Р’С–РєРѕРЅС†Рµ РїРµСЂРµС‚РёРЅР°С”С‚СЊСЃСЏ Р· СѓР¶Рµ С–СЃРЅСѓСЋС‡РёРј: ${conflictRange}.`
    }
    return 'Р’С–РєРѕРЅС†Рµ РїРµСЂРµС‚РёРЅР°С”С‚СЊСЃСЏ Р· СѓР¶Рµ С–СЃРЅСѓСЋС‡РёРј.'
  }
  if (message.includes('end_at must be greater than start_at')) {
    return 'РљС–РЅРµС†СЊ РјР°С” Р±СѓС‚Рё РїС–Р·РЅС–С€Рµ Р·Р° РїРѕС‡Р°С‚РѕРє.'
  }
  if (message.includes('Slot not found')) {
    return 'Р’С–РєРѕРЅС†Рµ РЅРµ Р·РЅР°Р№РґРµРЅРѕ.'
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
      label: formatUkDateTime(d, {
        weekday: 'short',
        day: '2-digit',
        month: '2-digit',
      }, ''),
    }
  })
})

const filteredSlots = computed(() => {
  if (!selectedDate.value) {
    return showPastSlots.value ? slots.value : slots.value.filter(isFutureSlot)
  }
  const slotsForDate = getSlotsForDate(selectedDate.value)
  return showPastSlots.value ? slotsForDate : slotsForDate.filter(isFutureSlot)
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
      error.value = 'Р’РєР°Р¶С–С‚СЊ РґР°С‚Сѓ, С‡Р°СЃ С– С‚СЂРёРІР°Р»С–СЃС‚СЊ Сѓ С…РІРёР»РёРЅР°С….'
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
    toast.success(`Р’С–Р»СЊРЅРµ РІС–РєРЅРѕ РЅР° ${formatUkDateTimeCompact(startAt, '')} СЃС‚РІРѕСЂРµРЅРѕ.`)
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
        ? `Р”РµРЅСЊ ${formatDateOnly(fillDayDate.value)} Р·Р°РїРѕРІРЅРµРЅРѕ. Р”РѕРґР°РЅРѕ Р»РёС€Рµ РјР°Р№Р±СѓС‚РЅС– РІС–РєРЅР°.`
        : `Р”РµРЅСЊ ${formatDateOnly(fillDayDate.value)} Р·Р°РїРѕРІРЅРµРЅРѕ.`,
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
        ? `РўРёР¶РґРµРЅСЊ РІС–Рґ ${formatDateOnly(fillWeekDate.value)} Р·Р°РїРѕРІРЅРµРЅРѕ. Р”Р»СЏ СЃСЊРѕРіРѕРґРЅС– РґРѕРґР°РЅРѕ Р»РёС€Рµ РјР°Р№Р±СѓС‚РЅС– РІС–РєРЅР°.`
        : `РўРёР¶РґРµРЅСЊ РІС–Рґ ${formatDateOnly(fillWeekDate.value)} Р·Р°РїРѕРІРЅРµРЅРѕ.`,
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
      error.value = 'Р’РєР°Р¶С–С‚СЊ РґР°С‚Сѓ, С‡Р°СЃ С– С‚СЂРёРІР°Р»С–СЃС‚СЊ Сѓ С…РІРёР»РёРЅР°С….'
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
    title: 'Р’РёРґР°Р»РёС‚Рё РІС–Р»СЊРЅРµ РІС–РєРЅРѕ?',
    message: 'Р’РѕРЅРѕ Р·РЅРёРєРЅРµ Р· РїСѓР±Р»С–С‡РЅРѕРіРѕ РїСЂРѕС„С–Р»СЋ.',
    confirmText: 'Р’РёРґР°Р»РёС‚Рё',
    cancelText: 'РЎРєР°СЃСѓРІР°С‚Рё',
    tone: 'danger',
    onConfirm: () => deleteSlot(slotId),
  })
}

onMounted(loadSlots)
</script>

<style scoped>
.slots {
  display: grid;
  gap: 18px;
}

.slots__hero {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 20px;
  min-height: 172px;
  background: linear-gradient(135deg, rgba(8, 113, 201, 0.16), rgba(7, 47, 71, 0.06));
  border: 1px solid var(--line);
  border-radius: var(--radius);
  padding: 22px 24px;
  box-shadow: var(--shadow);
}

.slots__hero .btn {
  height: 40px;
  padding: 0 18px;
}

.slots__title {
  font-size: 32px;
}

.slots__subtitle {
  max-width: 520px;
}

.panel {
  border: 1px solid var(--line);
  border-radius: 18px;
  padding: 18px;
  background: #fff;
  display: grid;
  gap: 14px;
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
  display: flex;
  flex-direction: column;
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
  font-size: 13px;
  color: var(--muted);
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
  border-radius: 16px;
  padding: 16px;
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
  .slots__hero {
    flex-direction: column;
    align-items: flex-start;
  }

  .panel--split {
    grid-template-columns: 1fr;
  }
}
</style>




