<template>
  <section class="pc2-cal" :class="{ 'is-mobile': isMobile, 'is-tablet': isTablet }" aria-labelledby="pc2-cal-title">
    <div class="pc2-cal__mobile-head">
      <h1 id="pc2-cal-title" class="pc2-cal__page-title">Календар</h1>
      <button
        v-if="isMobile"
        ref="viewButtonMobileRef"
        type="button"
        class="pc2-cal__icon-btn"
        aria-haspopup="dialog"
        :aria-expanded="viewOpen"
        aria-controls="pc2-cal-view-menu"
        aria-label="Вигляд календаря"
        @click="openView($event)"
      >≡</button>
    </div>

    <div class="pc2-cal__top">
      <CalendarNextAction :card="nextCard" :now="nowValue" :time-zone="timeZone" :week="range" :loading="actionsStatus === 'loading'" :partial="actionsFailed.length > 0" />
      <div class="pc2-cal__control">
        <div v-if="!isMobile" class="pc2-cal__navrow">
          <button
            ref="viewButtonRef"
            type="button"
            class="pc2-cal__quiet-btn"
            aria-haspopup="dialog"
            :aria-expanded="viewOpen"
            aria-controls="pc2-cal-view-menu"
            title="Що показувати в сітці"
            @click="openView($event)"
          >Вигляд ▾</button>
          <span class="pc2-cal__spacer"></span>
          <button type="button" class="pc2-cal__btn" :disabled="effectiveView === 'day' ? anchor === todayKey : isCurrentWeek" @click="goToday">Сьогодні</button>
          <button type="button" class="pc2-cal__icon-btn" :aria-label="effectiveView === 'day' ? 'Попередній день' : 'Попередній тиждень'" @click="shift(effectiveView === 'day' ? -1 : -7)">‹</button>
          <button type="button" class="pc2-cal__icon-btn" :aria-label="effectiveView === 'day' ? 'Наступний день' : 'Наступний тиждень'" @click="shift(effectiveView === 'day' ? 1 : 7)">›</button>
          <h2 class="pc2-cal__range">{{ effectiveView === 'day' ? dayLabels(anchor).full : weekLabel }}</h2>
        </div>
        <div
          class="pc2-cal__modes"
          role="tablist"
          aria-label="Режим календаря"
          @keydown="onTabKeydown"
        >
          <button
            v-for="option in CALENDAR_MODES"
            :id="`pc2-cal-tab-${option}`"
            :key="option"
            :ref="(el) => setTabRef(option, el)"
            type="button"
            role="tab"
            class="pc2-cal__mode"
            :aria-selected="mode === option"
            :aria-disabled="prefs.canWrite === false || prefs.saving || undefined"
            aria-controls="pc2-cal-panel"
            :tabindex="mode === option ? 0 : -1"
            @click="selectMode(option)"
          >
            {{ isMobile ? CALENDAR_MODE_SHORT_LABELS[option] : CALENDAR_MODE_LABELS[option] }}
            <span v-if="option === 'needs_action' && actionsTotal !== null" class="pc2-cal__badge" :aria-label="`${actionsTotal} дій`">{{ actionsTotal }}</span>
          </button>
        </div>
        <div class="pc2-cal__desc-row">
          <span class="pc2-cal__desc">{{ CALENDAR_MODE_DESCRIPTIONS[mode] }}</span>
          <button
            v-for="deviation in deviations"
            :key="deviation.layer"
            type="button"
            class="pc2-cal__deviation"
            :disabled="!canEdit"
            :aria-label="`Повернути «${CALENDAR_LAYER_CHIP_LABELS[deviation.layer]}» до режиму`"
            @click="setLayer(deviation.layer, !deviation.visible)"
          >
            {{ deviation.visible ? '+' : '−' }} {{ CALENDAR_LAYER_CHIP_LABELS[deviation.layer] }}<span aria-hidden="true">×</span>
          </button>
        </div>
      </div>
    </div>
    <p class="pc2-cal-sr" aria-live="polite">{{ announcement }}</p>

    <div v-if="isPreview" class="pc2-cal__warning" role="status" data-testid="calendar-mode-preview">
      <p>Тимчасовий перегляд за посиланням. Збережені налаштування не змінено.</p>
      <button type="button" class="pc2-cal__btn" :disabled="prefs.canWrite === false || prefs.saving" @click="adoptPreview">Зберегти цей режим</button>
      <button type="button" class="pc2-cal__btn pc2-cal__btn--quiet" @click="clearPreview">Повернути збережений</button>
    </div>

    <p v-if="prefs.timezoneSource !== 'server'" class="pc2-cal__note">
      Тимчасово: режим і вигляд діють лише в цій вкладці й не синхронізуються між пристроями. Час показано за {{ timeZone }}.
    </p>
    <p v-if="mode !== 'needs_action' && feedStatus === 'ready' && feedFailed.length" class="pc2-cal__warning" role="status">
      Не вдалося завантажити: {{ feedFailed.map((source) => CALENDAR_SOURCE_LABELS[source]).join(', ') }}. Показано решту.
      <button type="button" class="pc2-cal__link-btn" @click="retryFeed">Повторити</button>
    </p>

    <div v-if="isMobile && mode !== 'needs_action'" class="pc2-cal__mobile-nav">
      <button type="button" class="pc2-cal__icon-btn" aria-label="Попередній тиждень" @click="shift(-7)">‹</button>
      <span class="pc2-cal__mobile-range">{{ weekLabel }}</span>
      <button type="button" class="pc2-cal__icon-btn" aria-label="Наступний тиждень" @click="shift(7)">›</button>
      <button type="button" class="pc2-cal__btn" :disabled="anchor === todayKey" @click="goToday">Сьогодні</button>
    </div>
    <div v-if="isMobile && mode !== 'needs_action'" class="pc2-cal__strip" role="group" aria-label="Дні тижня">
      <button
        v-for="day in stripDays"
        :key="day.key"
        type="button"
        class="pc2-cal__strip-day"
        :class="{ 'is-today': day.key === todayKey }"
        :aria-pressed="day.key === anchor"
        :aria-label="`${day.labels.full}${day.sessions ? `, сесій: ${day.sessions}` : ''}${day.action ? ', є дія' : ''}`"
        @click="anchor = day.key"
      >
        <span>{{ day.labels.short }}</span>
        <strong>{{ day.labels.day }}</strong>
        <span class="pc2-cal__strip-dots" aria-hidden="true">
          <span v-if="day.sessions" class="pc2-cal__strip-dot"></span>
          <span v-if="day.action" class="pc2-cal__strip-dot is-action"></span>
        </span>
      </button>
    </div>

    <div id="pc2-cal-panel" class="pc2-cal__body" role="tabpanel" :aria-labelledby="`pc2-cal-tab-${mode}`" :aria-busy="mode !== 'needs_action' && feedStatus === 'loading'">
      <template v-if="mode === 'needs_action'">
        <div v-if="actionsStatus === 'loading'" class="pc2-cal__skeleton" role="status">
          <span class="pc2-cal-sr">Завантажуємо дії…</span><span v-for="index in 3" :key="index" aria-hidden="true"></span>
        </div>
        <CalendarActionsList
          v-else
          :this-week="weekActions.thisWeek"
          :elsewhere="weekActions.elsewhere"
          :complete="actionsComplete"
          :failed-labels="actionsFailed.map((source) => CALENDAR_ACTION_SOURCE_LABELS[source]).join(', ')"
          :time-zone="timeZone"
          @retry="retryActions"
        />
      </template>
      <template v-else>
        <div v-if="feedStatus === 'loading'" class="pc2-cal__skeleton" role="status">
          <span class="pc2-cal-sr">Завантажуємо календар…</span><span v-for="index in 4" :key="index" aria-hidden="true"></span>
        </div>
        <div v-else-if="feedStatus === 'error'" class="pc2-cal__state" role="alert">
          <p>Не вдалося завантажити календар. Дані не змінено.</p>
          <button type="button" class="pc2-cal__btn" @click="retryFeed">Спробувати ще раз</button>
        </div>
        <div v-else-if="effectiveView === 'list' && !agendaDays.length" class="pc2-cal__state" role="status">У цьому тижні подій немає.</div>
        <template v-else-if="isMobile || effectiveView === 'list'">
        <CalendarAgenda
          v-for="day in agendaDays"
          :key="day"
          :day="day"
          :items="gridItems"
          :summary-items="weekItems"
          :windows="visibleWindows"
          :summary-windows="allWindows"
          :mode="mode"
          :time-zone="timeZone"
          :today-key="todayKey"
          @open="openDetails"
          @open-window="openWindow"
        />
        </template>
        <CalendarTimeGrid
          v-else
          :days="gridDays"
          :weekend="isTablet && effectiveView === 'week' ? weekendDays : undefined"
          :items="gridItems"
          :windows="visibleWindows"
          :summary-items="weekItems"
          :summary-windows="allWindows"
          :mode="mode"
          :time-zone="timeZone"
          :today-key="todayKey"
          :now="nowValue"
          @open="openDetails"
          @open-window="openWindow"
        />
      </template>
    </div>

    <CalendarViewMenu
      v-if="viewOpen"
      :mode="mode"
      :layers="state.layers"
      :counts="layerCounts"
      :sheet="isMobile"
      :anchor="viewAnchor"
      :view="state.view"
      :disabled="!canEdit"
      @close="closeView"
      @reset="reset"
      @set-view="setView"
      @set-layer="setLayer"
    />

    <template v-if="details">
      <div class="pc2-cal__backdrop" @click="closeDetails"></div>
      <div
        ref="detailsRef"
        class="pc2-cal__panel pc2-cal__details"
        role="dialog"
        aria-modal="true"
        aria-labelledby="pc2-cal-details-title"
        tabindex="-1"
        @keydown.esc.stop="closeDetails"
      >
        <p class="pc2-cal__eyebrow">{{ details.kindLabel }}</p>
        <h2 id="pc2-cal-details-title" class="pc2-cal__panel-title">{{ details.title }}</h2>
        <dl class="pc2-cal__facts">
          <div v-for="fact in details.facts" :key="fact.label"><dt>{{ fact.label }}</dt><dd>{{ fact.value }}</dd></div>
        </dl>
        <p class="pc2-cal__panel-note">Тут лише перегляд. Змінити це можна на відповідній сторінці.</p>
        <div class="pc2-cal__panel-actions">
          <RouterLink v-if="details.href" :to="details.href" class="pc2-cal__btn">{{ details.linkLabel }}</RouterLink>
          <button type="button" class="pc2-cal__btn pc2-cal__btn--quiet" @click="closeDetails">Закрити</button>
        </div>
      </div>
    </template>
  </section>
</template>

<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch, type ComponentPublicInstance } from 'vue'
import { RouterLink, useRoute, useRouter } from 'vue-router'
import { CALENDAR_ACTION_SOURCE_LABELS, useCalendarActions } from '../../composables/useCalendarActions'
import { CALENDAR_SOURCE_LABELS, useCalendarFeed } from '../../composables/useCalendarFeed'
import { pickNextAction, splitActionsByWeek } from '../../lib/calendarActions'
import { CALENDAR_CONFLICT_LABELS, CALENDAR_LAYERS, visibleItems, type CalendarItem, type CalendarLayer } from '../../lib/calendarItems'
import {
  CALENDAR_LAYER_CHIP_LABELS,
  CALENDAR_MODE_DESCRIPTIONS,
  CALENDAR_MODE_LABELS,
  CALENDAR_MODE_SHORT_LABELS,
  CALENDAR_MODES,
  layerDeviations,
  parseCalendarMode,
  modeLayers,
  type CalendarMode,
} from '../../lib/calendarModes'
import { createLocalCalendarPreferences, type CalendarPreferencesSource } from '../../lib/calendarPreferencesSource'
import { addDays, dayBounds, dayKeyOf, dayLabels, formatTime, rangeLabel, weekStartOf, type DayKey } from '../../lib/calendarTime'
import { groupFreeWindows, slotsLabel, type FreeWindow } from '../../lib/calendarWindows'
import CalendarActionsList from './CalendarActionsList.vue'
import CalendarAgenda from './CalendarAgenda.vue'
import CalendarNextAction from './CalendarNextAction.vue'
import CalendarTimeGrid from './CalendarTimeGrid.vue'
import CalendarViewMenu from './CalendarViewMenu.vue'
import '../../styles/calendarV2.css'

const props = defineProps<{ preferences?: CalendarPreferencesSource; now?: () => number }>()

const prefs = props.preferences ?? createLocalCalendarPreferences()
const persistedState = prefs.state
const route = useRoute()
const router = useRouter()
const requestedMode = computed(() => parseCalendarMode(route.query.mode))
const isPreview = computed(() => requestedMode.value !== null && requestedMode.value !== persistedState.value.mode)
const state = computed(() => isPreview.value && requestedMode.value
  ? { ...persistedState.value, mode: requestedMode.value, preset: requestedMode.value, layers: modeLayers(requestedMode.value) }
  : persistedState.value)
const canEdit = computed(() => prefs.canWrite !== false && !prefs.saving && !isPreview.value)
const mode = computed(() => state.value.mode)
const timeZone = computed(() => state.value.timezone)
const clock = props.now ?? (() => Date.now())

// < 768px: day agenda; 768–1279px: Mon–Fri + one «Сб–Нд» column; ≥ 1280px: full week (§1, §7).
const media = (query: string) => (typeof window !== 'undefined' && typeof window.matchMedia === 'function' ? window.matchMedia(query) : null)
const mobileMedia = media('(max-width: 767px)')
const tabletMedia = media('(max-width: 1279px)')
const isMobile = ref(Boolean(mobileMedia?.matches))
const isTabletOrLess = ref(Boolean(tabletMedia?.matches))
const isTablet = computed(() => !isMobile.value && isTabletOrLess.value)
// Phone projection never persists a different view on behalf of the viewport.
const effectiveView = computed(() => isMobile.value && state.value.view === 'week' ? 'day' : state.value.view)
const syncMedia = () => {
  isMobile.value = Boolean(mobileMedia?.matches)
  isTabletOrLess.value = Boolean(tabletMedia?.matches)
}
onMounted(() => {
  mobileMedia?.addEventListener('change', syncMedia)
  tabletMedia?.addEventListener('change', syncMedia)
})
onBeforeUnmount(() => {
  mobileMedia?.removeEventListener('change', syncMedia)
  tabletMedia?.removeEventListener('change', syncMedia)
})

// «через N хв» and the now line refresh once a minute.
const nowValue = ref(clock())
const timer = setInterval(() => {
  nowValue.value = clock()
}, 60_000)
onBeforeUnmount(() => clearInterval(timer))

const todayKey = computed(() => dayKeyOf(nowValue.value, timeZone.value))
const anchor = ref<DayKey>(todayKey.value)
const weekDays = computed(() => Array.from({ length: 7 }, (_, index) => addDays(weekStartOf(anchor.value), index)))
const weekLabel = computed(() => rangeLabel(weekDays.value[0] ?? anchor.value, weekDays.value[6] ?? anchor.value))
const range = computed(() => ({
  start: dayBounds(weekDays.value[0] ?? anchor.value, timeZone.value).start,
  end: dayBounds(weekDays.value[6] ?? anchor.value, timeZone.value).end,
}))
const isCurrentWeek = computed(() => weekDays.value.includes(todayKey.value))
function shift(days: number) {
  anchor.value = addDays(anchor.value, days)
}
function goToday() {
  anchor.value = todayKey.value
}

const { items, status: feedStatus, failedSources: feedFailed, retry: retryFeed } = useCalendarFeed(range, { now: clock })
const {
  actions,
  upcomingSessions,
  status: actionsStatus,
  failedSources: actionsFailed,
  complete: actionsComplete,
  retry: retryActions,
} = useCalendarActions(timeZone)

const weekItems = computed(() => items.value.filter((item) => item.start < range.value.end && item.end > range.value.start))
// Free slots are drawn as windows, never one by one.
const gridItems = computed(() => visibleItems(weekItems.value, state.value.layers).filter((item) => item.kind !== 'free_slot'))
const allWindows = computed(() => groupFreeWindows(weekItems.value, timeZone.value))
const visibleWindows = computed(() => (state.value.layers.free_slots ? allWindows.value : []))
const gridDays = computed(() => effectiveView.value === 'day' ? [anchor.value] : isTablet.value ? weekDays.value.slice(0, 5) : weekDays.value)
const weekendDays = computed(() => weekDays.value.slice(5))
const agendaDays = computed(() => effectiveView.value !== 'list' ? [anchor.value] : weekDays.value.filter((day) => {
  const bounds = dayBounds(day, timeZone.value)
  return weekItems.value.some((item) => item.start < bounds.end && item.end > bounds.start)
}))

const weekActions = computed(() => splitActionsByWeek(actions.value, range.value))
// The badge is the global N + M, shown only when every source loaded (never a partial guess).
const actionsTotal = computed(() => (actionsComplete.value ? actions.value.length : null))
const nextCard = computed(() =>
  pickNextAction({ actions: actions.value, upcomingSessions: upcomingSessions.value, now: nowValue.value, timeZone: timeZone.value })
)

const deviations = computed(() => layerDeviations(mode.value, state.value.layers))
const layerCounts = computed(() => {
  const counts: Partial<Record<CalendarLayer, number>> = {}
  for (const layer of CALENDAR_LAYERS) counts[layer] = weekItems.value.filter((item) => item.layer === layer).length
  return counts
})

const stripDays = computed(() =>
  weekDays.value.map((key) => {
    const bounds = dayBounds(key, timeZone.value)
    const dayItems = weekItems.value.filter((item) => item.start < bounds.end && item.end > bounds.start)
    return {
      key,
      labels: dayLabels(key),
      sessions: dayItems.filter((item) => item.kind === 'session' && item.status !== 'CANCELLED').length,
      action:
        dayItems.some((item) => item.needsAction) ||
        actions.value.some((action) => action.when !== null && action.when >= bounds.start && action.when < bounds.end),
    }
  })
)

// URL modes are temporary projections. Only explicit user commands may write preferences.
const announcement = ref('')
const tabRefs = new Map<CalendarMode, HTMLElement>()
function setTabRef(option: CalendarMode, el: Element | ComponentPublicInstance | null) {
  if (el instanceof HTMLElement) tabRefs.set(option, el)
}
function clearPreview() {
  const query = { ...route.query }
  delete query.mode
  return router.replace({ path: route.path, query, hash: route.hash })
}
async function saveMode(next: CalendarMode) {
  if (prefs.canWrite === false || prefs.saving) return
  const navigation = route.fullPath
  if (next !== persistedState.value.mode) {
    const result = await prefs.setMode(next)
    if (result === false || persistedState.value.mode !== next) return
  }
  // A completed save must not rewrite a newer Back/Forward/navigation destination.
  if (route.fullPath === navigation) await clearPreview()
}
function selectMode(next: CalendarMode) {
  if (isPreview.value && next === requestedMode.value) return
  return saveMode(next)
}
function adoptPreview() {
  if (isPreview.value && requestedMode.value) return saveMode(requestedMode.value)
}
function setLayer(layer: CalendarLayer, visible: boolean) {
  if (canEdit.value) void prefs.setLayer(layer, visible)
}
function setView(view: typeof state.value.view) {
  // The displayed view decides a no-op: a phone shows a saved Week as Day, and pressing
  // that Day must not overwrite the Week other devices use.
  if (view === effectiveView.value) return
  if (canEdit.value && mode.value !== 'needs_action') void prefs.setView(view)
}
function reset() {
  if (canEdit.value) void (prefs.reset ? prefs.reset() : prefs.setMode(persistedState.value.mode))
}
async function onTabKeydown(event: KeyboardEvent) {
  const index = CALENDAR_MODES.indexOf(mode.value)
  const keys: Record<string, number> = { ArrowRight: index + 1, ArrowLeft: index - 1, Home: 0, End: CALENDAR_MODES.length - 1 }
  if (!(event.key in keys)) return
  event.preventDefault()
  const next = CALENDAR_MODES[(keys[event.key]! + CALENDAR_MODES.length) % CALENDAR_MODES.length]!
  await selectMode(next)
  await nextTick()
  tabRefs.get(mode.value)?.focus()
}
watch(mode, (next) => {
  announcement.value = `Режим: ${CALENDAR_MODE_LABELS[next]}`
})

// «Вигляд» menu: focus returns to the button that opened it.
const viewOpen = ref(false)
const viewAnchor = ref<{ top: number; left: number } | null>(null)
let viewTrigger: HTMLElement | null = null
function openView(event: Event) {
  viewTrigger = event.currentTarget instanceof HTMLElement ? event.currentTarget : null
  // The desktop popover opens under its trigger, kept inside the viewport (320px wide + 16px gutter).
  const rect = viewTrigger?.getBoundingClientRect()
  viewAnchor.value = rect && rect.height ? { top: rect.bottom + 8, left: Math.max(16, Math.min(rect.left, window.innerWidth - 336)) } : null
  viewOpen.value = true
}
function closeView() {
  viewOpen.value = false
  viewTrigger?.focus()
}

// Read-only details for non-session items and availability windows.
type Details = { kindLabel: string; title: string; facts: { label: string; value: string }[]; href: string | null; linkLabel: string }
const details = ref<Details | null>(null)
const detailsRef = ref<HTMLElement | null>(null)
let detailsTrigger: HTMLElement | null = null
const KIND_TITLES: Record<CalendarItem['kind'], string> = {
  session: 'Сесія',
  free_slot: 'Вільний слот',
  guest_request: 'Запит на час',
  absence: 'Відсутність',
  external_guest_session: 'Зовнішня гостьова сесія',
}
const LINK_LABELS: Record<CalendarItem['kind'], string> = {
  session: 'Відкрити сесію',
  free_slot: 'Керувати вікнами в розкладі',
  guest_request: 'Відкрити запит',
  absence: 'Відкрити відсутності',
  external_guest_session: 'Відкрити гостьову сесію',
}
function timeText(start: number, end: number, allDay = false) {
  const tz = timeZone.value
  const startDay = dayKeyOf(start, tz)
  const endDay = dayKeyOf(end - 1, tz)
  if (allDay) return startDay === endDay ? `${dayLabels(startDay).full}, увесь день` : `${dayLabels(startDay).full} – ${dayLabels(endDay).full}`
  const from = `${dayLabels(startDay).full}, ${formatTime(start, tz)}`
  return startDay === endDay ? `${from}–${formatTime(end, tz)}` : `${from} – ${dayLabels(endDay).full}, ${formatTime(end, tz)}`
}
async function showDetails(next: Details) {
  detailsTrigger = document.activeElement instanceof HTMLElement ? document.activeElement : null
  details.value = next
  await nextTick()
  detailsRef.value?.focus()
}
function openDetails(item: CalendarItem) {
  void showDetails({
    kindLabel: KIND_TITLES[item.kind],
    title: item.title,
    facts: [
      { label: 'Час', value: timeText(item.start, item.end, item.allDay) },
      { label: 'Стан', value: item.marker || item.statusLabel },
      ...(item.actionReasons.length ? [{ label: 'Потребує уваги', value: item.actionReasons.join('; ') }] : []),
      ...(item.conflicts.length ? [{ label: 'Можливий конфлікт', value: item.conflicts.map((conflict) => CALENDAR_CONFLICT_LABELS[conflict]).join('; ') }] : []),
    ],
    href: item.href,
    linkLabel: LINK_LABELS[item.kind],
  })
}
function openWindow(window: FreeWindow) {
  void showDetails({
    kindLabel: 'Вільне вікно',
    title: `${formatTime(window.start, timeZone.value)}–${formatTime(window.end, timeZone.value)} · ${slotsLabel(window.slots.length)}`,
    facts: [
      { label: 'День', value: dayLabels(window.day).full },
      { label: 'Слоти', value: window.slots.map((slot) => `${formatTime(slot.start, timeZone.value)}–${formatTime(slot.end, timeZone.value)}`).join(', ') },
    ],
    href: '/cabinet/slots?tab=availability',
    linkLabel: LINK_LABELS.free_slot,
  })
}
function closeDetails() {
  details.value = null
  detailsTrigger?.focus()
  detailsTrigger = null
}
</script>
