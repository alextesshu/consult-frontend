<template>
  <section class="pc2-cal" :class="{ 'is-mobile': isMobile }" aria-labelledby="pc2-cal-title">
    <header class="pc2-cal__head">
      <div class="pc2-cal__heading">
        <p class="pc2-cal__eyebrow">Календар</p>
        <h1 id="pc2-cal-title" class="pc2-cal__title">{{ periodLabel }}</h1>
      </div>
      <div class="pc2-cal__nav" role="group" aria-label="Період">
        <button type="button" class="pc2-cal__icon-btn" :aria-label="effectiveView === 'day' ? 'Попередній день' : 'Попередній тиждень'" @click="shift(-1)">‹</button>
        <button type="button" class="pc2-cal__icon-btn" :aria-label="effectiveView === 'day' ? 'Наступний день' : 'Наступний тиждень'" @click="shift(1)">›</button>
        <button type="button" class="pc2-cal__btn" :disabled="isCurrentPeriod" @click="goToday">Сьогодні</button>
      </div>
      <div class="pc2-cal__views" role="group" aria-label="Вигляд календаря">
        <button
          v-for="option in viewOptions"
          :key="option.view"
          type="button"
          class="pc2-cal__seg"
          :aria-pressed="effectiveView === option.view"
          @click="prefs.setView(option.view)"
        >
          {{ option.label }}
        </button>
      </div>
      <button
        ref="layersButtonRef"
        type="button"
        class="pc2-cal__btn pc2-cal__layers-btn"
        aria-haspopup="dialog"
        :aria-expanded="layersOpen"
        aria-controls="pc2-cal-layers"
        @click="layersOpen ? closeLayers() : openLayers()"
      >
        Шари<span v-if="hiddenNeedsAction" class="pc2-cal__dot" aria-label="у прихованих шарах є записи, що потребують дії"></span>
      </button>
    </header>

    <div class="pc2-cal__presets" role="group" aria-label="Набори шарів">
      <button
        v-for="preset in CALENDAR_PRESETS"
        :key="preset"
        type="button"
        class="pc2-cal__chip"
        :aria-pressed="state.preset === preset"
        @click="prefs.setPreset(preset)"
      >
        {{ CALENDAR_PRESET_LABELS[preset] }}
      </button>
      <span v-if="state.preset === 'custom'" class="pc2-cal__custom">Власний набір</span>
    </div>

    <p v-if="!prefs.synced" class="pc2-cal__note">
      Вигляд і шари поки діють лише в цій вкладці й не синхронізуються між пристроями. Час показано за {{ state.timezone }}.
    </p>

    <div v-if="hidden.length" class="pc2-cal__hidden" role="status">
      <span>Приховано:</span>
      <span v-for="entry in hidden" :key="entry.layer" class="pc2-cal__hidden-item" :class="{ 'needs-action': entry.needsAction > 0 }">
        {{ CALENDAR_LAYER_LABELS[entry.layer] }} — {{ entry.total }}<template v-if="entry.needsAction">, потребують дії: {{ entry.needsAction }}</template>
        <button type="button" class="pc2-cal__link-btn" @click="prefs.setLayer(entry.layer, true)">Показати</button>
      </span>
    </div>

    <p v-if="status === 'ready' && failedSources.length" class="pc2-cal__warning" role="status">
      Не вдалося завантажити: {{ failedSources.map((source) => CALENDAR_SOURCE_LABELS[source]).join(', ') }}. Показано решту.
      <button type="button" class="pc2-cal__link-btn" @click="retry">Повторити</button>
    </p>

    <div v-if="isMobile" class="pc2-cal__strip" role="group" aria-label="Дні тижня">
      <button
        v-for="day in stripDays"
        :key="day.key"
        type="button"
        class="pc2-cal__strip-day"
        :class="{ 'is-today': day.key === todayKey }"
        :aria-pressed="effectiveView === 'day' && day.key === anchor"
        :aria-label="`${day.labels.full}${day.count ? `, ${day.count}` : ''}`"
        @click="selectDay(day.key)"
      >
        <span>{{ day.labels.short }}</span>
        <strong>{{ day.labels.day }}</strong>
        <span class="pc2-cal__strip-dot" :class="{ 'is-on': day.count > 0 }" aria-hidden="true"></span>
      </button>
    </div>

    <div class="pc2-cal__body" :aria-busy="status === 'loading'">
      <div v-if="status === 'loading'" class="pc2-cal__skeleton" role="status">
        <span class="pc2-cal-sr">Завантажуємо календар…</span>
        <span v-for="index in 4" :key="index" aria-hidden="true"></span>
      </div>
      <div v-else-if="status === 'error'" class="pc2-cal__state" role="alert">
        <p>Не вдалося завантажити календар. Дані не змінено.</p>
        <button type="button" class="pc2-cal__btn" @click="retry">Спробувати ще раз</button>
      </div>
      <template v-else>
        <p v-if="!visible.length" class="pc2-cal__state">
          {{ emptyText }}
        </p>
        <CalendarTimeGrid
          v-if="visible.length && (effectiveView === 'week' || (effectiveView === 'day' && !isMobile))"
          :days="periodDays"
          :items="visible"
          :time-zone="state.timezone"
          :today-key="todayKey"
          :now="nowValue"
          @open="openDetails"
        />
        <CalendarAgenda
          v-else-if="visible.length"
          :days="periodDays"
          :items="visible"
          :time-zone="state.timezone"
          :today-key="todayKey"
          :skip-empty-days="effectiveView === 'list'"
          :empty-text="emptyText"
          @open="openDetails"
        />
      </template>
    </div>

    <ul class="pc2-cal__legend" aria-label="Легенда">
      <li v-for="entry in LEGEND" :key="entry.label"><span class="pc2-cal__swatch" :class="entry.swatch" aria-hidden="true"></span>{{ entry.label }}</li>
    </ul>
    <p class="pc2-cal__legend-note">● потребує дії · ⇄ клієнт просить перенести · ⚠ можливий конфлікт часу</p>

    <div v-if="layersOpen" class="pc2-cal__backdrop" @click="closeLayers"></div>
    <div
      v-if="layersOpen"
      id="pc2-cal-layers"
      ref="layersPanelRef"
      class="pc2-cal__panel"
      role="dialog"
      aria-modal="true"
      aria-labelledby="pc2-cal-layers-title"
      @keydown.esc.stop="closeLayers"
    >
      <h2 id="pc2-cal-layers-title" class="pc2-cal__panel-title">Шари календаря</h2>
      <fieldset class="pc2-cal__layers">
        <legend class="pc2-cal-sr">Показувати в календарі</legend>
        <label v-for="layer in CALENDAR_LAYERS" :key="layer" class="pc2-cal__layer">
          <input
            type="checkbox"
            :checked="state.layers[layer]"
            :disabled="state.layers[layer] && visibleLayerCount === 1"
            @change="prefs.setLayer(layer, ($event.target as HTMLInputElement).checked)"
          />
          <span>{{ CALENDAR_LAYER_LABELS[layer] }}</span>
        </label>
      </fieldset>
      <p class="pc2-cal__panel-note">
        Приховані шари лише не відображаються. Записи, вікна й відсутності продовжують діяти, а зайнятість не змінюється.
      </p>
      <button type="button" class="pc2-cal__btn" @click="closeLayers">Готово</button>
    </div>

    <div v-if="selected" class="pc2-cal__backdrop" @click="closeDetails"></div>
    <div
      v-if="selected"
      ref="detailsRef"
      class="pc2-cal__panel pc2-cal__details"
      role="dialog"
      aria-modal="true"
      aria-labelledby="pc2-cal-details-title"
      tabindex="-1"
      @keydown.esc.stop="closeDetails"
    >
      <p class="pc2-cal__eyebrow">{{ KIND_TITLES[selected.kind] }}</p>
      <h2 id="pc2-cal-details-title" class="pc2-cal__panel-title">{{ selected.title }}</h2>
      <dl class="pc2-cal__facts">
        <div><dt>Час</dt><dd>{{ detailsTime }}</dd></div>
        <div><dt>Стан</dt><dd>{{ selected.statusLabel }}</dd></div>
        <div v-if="selected.actionReasons.length"><dt>Потребує уваги</dt><dd>{{ selected.actionReasons.join('; ') }}</dd></div>
        <div v-if="selected.conflicts.length">
          <dt>Можливий конфлікт</dt>
          <dd>{{ selected.conflicts.map((conflict) => CALENDAR_CONFLICT_LABELS[conflict]).join('; ') }}</dd>
        </div>
      </dl>
      <p class="pc2-cal__panel-note">Тут лише перегляд. Змінити цей запис можна на його сторінці.</p>
      <div class="pc2-cal__panel-actions">
        <RouterLink v-if="selected.href" :to="selected.href" class="pc2-cal__btn">{{ MANAGE_LABELS[selected.kind] }}</RouterLink>
        <button type="button" class="pc2-cal__btn pc2-cal__btn--quiet" @click="closeDetails">Закрити</button>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref } from 'vue'
import { RouterLink } from 'vue-router'
import { CALENDAR_SOURCE_LABELS, useCalendarFeed } from '../../composables/useCalendarFeed'
import {
  CALENDAR_CONFLICT_LABELS,
  CALENDAR_LAYER_LABELS,
  CALENDAR_LAYERS,
  CALENDAR_PRESET_LABELS,
  CALENDAR_PRESETS,
  hiddenSummary,
  visibleItems,
  type CalendarItem,
  type CalendarView,
} from '../../lib/calendarItems'
import { createLocalCalendarPreferences, type CalendarPreferencesSource } from '../../lib/calendarPreferencesSource'
import { addDays, dayBounds, dayKeyOf, dayLabels, formatTime, rangeLabel, weekStartOf, type DayKey } from '../../lib/calendarTime'
import CalendarAgenda from './CalendarAgenda.vue'
import CalendarTimeGrid from './CalendarTimeGrid.vue'
import '../../styles/calendarV2.css'

const props = defineProps<{ preferences?: CalendarPreferencesSource; now?: () => number }>()

const prefs = props.preferences ?? createLocalCalendarPreferences()
const state = prefs.state
const clock = props.now ?? (() => Date.now())

const KIND_TITLES: Record<CalendarItem['kind'], string> = {
  session: 'Сесія',
  free_slot: 'Вільне вікно для запису',
  guest_request: 'Заявка на час',
  absence: 'Відсутність',
  external_guest_session: 'Зовнішня гостьова сесія',
}
const MANAGE_LABELS: Record<CalendarItem['kind'], string> = {
  session: 'Відкрити сесію',
  free_slot: 'Керувати вікнами в розкладі',
  guest_request: 'Розглянути в запитах',
  absence: 'Відкрити відсутності',
  external_guest_session: 'Відкрити гостьову сесію',
}
const LEGEND = [
  { label: 'Чекає підтвердження', swatch: 'is-scheduled' },
  { label: 'Підтверджено', swatch: 'is-confirmed' },
  { label: 'Завершено', swatch: 'is-completed' },
  { label: 'Скасовано / Не підтверджено вчасно', swatch: 'is-cancelled' },
  { label: 'Без реєстрації', swatch: 'is-guest' },
  { label: 'Вільне вікно', swatch: 'is-free' },
  { label: 'Заявка на час', swatch: 'is-request' },
  { label: 'Відсутність', swatch: 'is-absence' },
]

// Phones (< 768px) use Day/List without the dense week grid.
const MOBILE_QUERY = '(max-width: 767px)'
const media = typeof window !== 'undefined' && typeof window.matchMedia === 'function' ? window.matchMedia(MOBILE_QUERY) : null
const isMobile = ref(Boolean(media?.matches))
const syncMobile = () => {
  isMobile.value = Boolean(media?.matches)
}
onMounted(() => media?.addEventListener('change', syncMobile))
onBeforeUnmount(() => media?.removeEventListener('change', syncMobile))

const nowValue = ref(clock())
const nowTimer = setInterval(() => {
  nowValue.value = clock()
}, 60_000)
onBeforeUnmount(() => clearInterval(nowTimer))

const todayKey = computed(() => dayKeyOf(nowValue.value, state.value.timezone))
const anchor = ref<DayKey>(todayKey.value)

const effectiveView = computed<CalendarView>(() => (isMobile.value && state.value.view === 'week' ? 'day' : state.value.view))
const viewOptions = computed(() =>
  [
    { view: 'week' as const, label: 'Тиждень' },
    { view: 'day' as const, label: 'День' },
    { view: 'list' as const, label: 'Список' },
  ].filter((option) => !isMobile.value || option.view !== 'week')
)

const weekDays = computed(() => Array.from({ length: 7 }, (_, index) => addDays(weekStartOf(anchor.value), index)))
const periodDays = computed(() => (effectiveView.value === 'day' ? [anchor.value] : weekDays.value))
const firstDay = computed(() => periodDays.value[0] ?? anchor.value)
const lastDay = computed(() => periodDays.value[periodDays.value.length - 1] ?? anchor.value)
const periodLabel = computed(() => rangeLabel(firstDay.value, lastDay.value))

// The feed always loads the whole week so the mobile day strip and day switches stay instant.
const range = computed(() => ({
  start: dayBounds(weekDays.value[0] ?? anchor.value, state.value.timezone).start,
  end: dayBounds(weekDays.value[6] ?? anchor.value, state.value.timezone).end,
}))
const { items, status, failedSources, retry } = useCalendarFeed(range, { now: clock })

const periodBounds = computed(() => ({
  start: dayBounds(firstDay.value, state.value.timezone).start,
  end: dayBounds(lastDay.value, state.value.timezone).end,
}))
const periodItems = computed(() => items.value.filter((item) => item.start < periodBounds.value.end && item.end > periodBounds.value.start))
const needsActionOnly = computed(() => state.value.preset === 'needs_action')
const visible = computed(() => visibleItems(periodItems.value, state.value.layers, { needsActionOnly: needsActionOnly.value }))
const hidden = computed(() => hiddenSummary(periodItems.value, state.value.layers))
const hiddenNeedsAction = computed(() => hidden.value.some((entry) => entry.needsAction > 0))
const visibleLayerCount = computed(() => CALENDAR_LAYERS.filter((layer) => state.value.layers[layer]).length)
const emptyText = computed(() =>
  needsActionOnly.value ? 'За цей період нічого не потребує вашої дії.' : 'За цей період у видимих шарах подій немає.'
)

const stripDays = computed(() =>
  weekDays.value.map((key) => {
    const bounds = dayBounds(key, state.value.timezone)
    const count = visibleItems(items.value, state.value.layers).filter((item) => item.start < bounds.end && item.end > bounds.start).length
    return { key, labels: dayLabels(key), count }
  })
)

const isCurrentPeriod = computed(() => periodDays.value.includes(todayKey.value))

function shift(direction: 1 | -1) {
  anchor.value = addDays(anchor.value, (effectiveView.value === 'day' ? 1 : 7) * direction)
}
function goToday() {
  anchor.value = todayKey.value
}
function selectDay(key: DayKey) {
  anchor.value = key
  if (effectiveView.value !== 'day') prefs.setView('day')
}

const layersOpen = ref(false)
const layersButtonRef = ref<HTMLButtonElement | null>(null)
const layersPanelRef = ref<HTMLElement | null>(null)
async function openLayers() {
  layersOpen.value = true
  await nextTick()
  layersPanelRef.value?.querySelector<HTMLInputElement>('input:not(:disabled)')?.focus()
}
function closeLayers() {
  layersOpen.value = false
  layersButtonRef.value?.focus()
}

const selected = ref<CalendarItem | null>(null)
const detailsRef = ref<HTMLElement | null>(null)
let detailsTrigger: HTMLElement | null = null
async function openDetails(item: CalendarItem) {
  detailsTrigger = document.activeElement instanceof HTMLElement ? document.activeElement : null
  selected.value = item
  await nextTick()
  detailsRef.value?.focus()
}
function closeDetails() {
  selected.value = null
  detailsTrigger?.focus()
  detailsTrigger = null
}
const detailsTime = computed(() => {
  const item = selected.value
  if (!item) return ''
  const tz = state.value.timezone
  const startDay = dayKeyOf(item.start, tz)
  const endDay = dayKeyOf(item.end - 1, tz)
  if (item.allDay) return startDay === endDay ? `${dayLabels(startDay).full}, увесь день` : `${dayLabels(startDay).full} – ${dayLabels(endDay).full}`
  const start = `${dayLabels(startDay).full}, ${formatTime(item.start, tz)}`
  return startDay === endDay ? `${start}–${formatTime(item.end, tz)}` : `${start} – ${dayLabels(endDay).full}, ${formatTime(item.end, tz)}`
})
</script>
