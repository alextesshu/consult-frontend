<template>
  <div class="pc2-cal-grid" :style="{ '--pc2-cal-days': columns.length + (weekend.length ? 1 : 0) }">
    <div class="pc2-cal-grid__head">
      <span class="pc2-cal-grid__corner" aria-hidden="true"></span>
      <span v-for="day in columns" :key="day.key" class="pc2-cal-grid__day-head" :class="{ 'is-today': day.isToday }">
        <span class="pc2-cal-grid__day-name">{{ day.labels.short }}<template v-if="day.isToday"> · сьогодні</template></span>
        <strong>{{ day.labels.day }}</strong>
        <span class="pc2-cal-grid__sum">{{ day.summary.main }}</span>
        <span class="pc2-cal-grid__sub">{{ day.summary.sub }}</span>
      </span>
      <span v-if="weekend.length" class="pc2-cal-grid__day-head pc2-cal-grid__day-head--weekend">
        <span class="pc2-cal-grid__day-name">Сб–Нд</span>
        <strong>{{ weekendLabel }}</strong>
        <span class="pc2-cal-grid__sum">{{ weekendSummary.main }}</span>
        <span class="pc2-cal-grid__sub">{{ weekendSummary.sub }}</span>
      </span>
    </div>
    <div class="pc2-cal-grid__range">
      <span>Показано {{ hourLabel(startHour) }}–{{ hourLabel(endHour) }}<template v-if="!fullDay"> — поза цим часом подій немає</template></span>
      <button type="button" class="pc2-cal__link-btn" :aria-pressed="fullDay" @click="fullDay = !fullDay">
        {{ fullDay ? 'Лише години з подіями' : 'Показати всю добу' }}
      </button>
    </div>
    <div ref="scrollRef" class="pc2-cal-grid__scroll">
      <div class="pc2-cal-grid__body" :style="{ height: `${bodyHeight}px` }">
        <div class="pc2-cal-grid__hours" aria-hidden="true">
          <span v-for="hour in hours" :key="hour" :style="{ top: `${(hour - startHour) * hourPx}px` }">{{ hourLabel(hour) }}</span>
        </div>
        <section
          v-for="day in columns"
          :key="day.key"
          class="pc2-cal-grid__col"
          :class="{ 'is-today': day.isToday }"
          :aria-label="`${day.labels.full}${day.isToday ? ', сьогодні' : ''}: ${day.summary.main}${day.summary.sub ? `, ${day.summary.sub}` : ''}`"
        >
          <span v-for="hour in hours" :key="hour" class="pc2-cal-grid__line" :style="{ top: `${(hour - startHour) * hourPx}px` }" aria-hidden="true"></span>
          <template v-if="halfHourLines">
            <span v-for="hour in hours.slice(0, -1)" :key="`${hour}:30`" class="pc2-cal-grid__line is-half" :style="{ top: `${(hour - startHour + 0.5) * hourPx}px` }" aria-hidden="true"></span>
          </template>
          <span v-for="band in day.bands" :key="band.item.key" class="pc2-cal-grid__absence" :style="{ top: `${band.top}px`, height: `${band.height}px` }">
            <span class="pc2-cal-grid__absence-label">{{ band.item.title }}</span>
          </span>
          <ul class="pc2-cal-grid__events" role="list">
            <li
              v-for="block in day.windowBlocks"
              :key="block.window.key"
              class="pc2-cal-grid__slot pc2-cal-grid__slot--window"
              :style="{ top: `${block.top}px`, height: `${block.height}px` }"
            >
              <button type="button" class="pc2-cal-window" :aria-label="windowDescription(block.window)" @click="$emit('open-window', block.window)">
                <span class="pc2-cal-window__time">{{ windowRange(block.window) }}</span>
                <span class="pc2-cal-window__count">{{ slotsLabel(block.window.slots.length) }}</span>
              </button>
            </li>
            <li
              v-for="event in day.events"
              :key="event.item.key"
              class="pc2-cal-grid__slot"
              :class="{ 'is-overlay': event.overlay }"
              :style="event.style"
            >
              <CalendarEventChip :item="event.item" :time-zone="timeZone" :muted="mode === 'availability' && event.item.kind === 'session'" compact @open="$emit('open', $event)" />
            </li>
          </ul>
          <span v-if="day.nowTop !== null" class="pc2-cal-grid__now" :style="{ top: `${day.nowTop}px` }" aria-hidden="true"></span>
          <p v-if="day.emptyLabel" class="pc2-cal-grid__empty">{{ day.emptyLabel }}</p>
        </section>
        <section v-if="weekend.length" class="pc2-cal-grid__col pc2-cal-grid__col--weekend" :aria-label="`Вихідні, ${weekendLabel}`">
          <ul class="pc2-cal-grid__weekend-list" role="list">
            <li v-for="item in weekendItems" :key="item.key">
              <CalendarEventChip :item="item" :time-zone="timeZone" :muted="mode === 'availability' && item.kind === 'session'" compact show-day @open="$emit('open', $event)" />
            </li>
            <li v-for="window in weekendWindows" :key="window.key">
              <button type="button" class="pc2-cal-window" :aria-label="windowDescription(window)" @click="$emit('open-window', window)">
                <span class="pc2-cal-window__time">{{ dayLabels(window.day).short }} {{ windowRange(window) }}</span>
                <span class="pc2-cal-window__count">{{ slotsLabel(window.slots.length) }}</span>
              </button>
            </li>
          </ul>
          <p v-if="!weekendItems.length && !weekendWindows.length" class="pc2-cal-grid__empty">{{ weekendEmptyLabel }}</p>
        </section>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import type { CalendarItem } from '../../lib/calendarItems'
import type { CalendarMode } from '../../lib/calendarModes'
import { dayBounds, dayLabels, formatTime, wallMinutes, type DayKey } from '../../lib/calendarTime'
import { emptyDayLabel, plural, slotsLabel, windowsLabel, type FreeWindow } from '../../lib/calendarWindows'
import CalendarEventChip from './CalendarEventChip.vue'

const props = defineProps<{
  days: DayKey[]
  /** Weekend days folded into one «Сб–Нд» column (tablet). */
  weekend?: DayKey[]
  items: CalendarItem[]
  windows: FreeWindow[]
  /** Everything loaded for the period (visible or not) — day headers summarize from it. */
  summaryItems: CalendarItem[]
  summaryWindows: FreeWindow[]
  mode: Exclude<CalendarMode, 'needs_action'>
  timeZone: string
  todayKey: DayKey
  now: number
}>()
defineEmits<{ open: [item: CalendarItem]; 'open-window': [window: FreeWindow] }>()

// Hour height: at least 52px (spec); a short range is stretched to the grid's usable height
// (the scroll box's own cap, min(70vh, 720px), never below MIN_BODY_PX) instead of collapsing to a
// strip with a few hours. Only real clock hours are drawn; the range itself is not padded.
const HOUR_PX = 52
const MIN_BODY_PX = 360
const MIN_EVENT_PX = 26
const viewportHeight = ref(typeof window === 'undefined' ? 900 : window.innerHeight)
const onResize = () => { viewportHeight.value = window.innerHeight }
onMounted(() => window.addEventListener('resize', onResize))
onBeforeUnmount(() => window.removeEventListener('resize', onResize))
const weekend = computed(() => props.weekend ?? [])
const fullDay = ref(false)

const hourLabel = (hour: number) => `${String(hour).padStart(2, '0')}:00`
const windowRange = (window: FreeWindow) => `${formatTime(window.start, props.timeZone)}–${formatTime(window.end, props.timeZone)}`
const windowDescription = (window: FreeWindow) => `Вільне вікно ${windowRange(window)}, ${slotsLabel(window.slots.length)}`

function touching<T extends { start: number; end: number }>(list: T[], key: DayKey) {
  const bounds = dayBounds(key, props.timeZone)
  return list.filter((entry) => entry.start < bounds.end && entry.end > bounds.start)
}

const SESSION_COUNTED = new Set(['SCHEDULED', 'CONFIRMED', 'COMPLETED'])
function daySummary(keys: DayKey[]) {
  const items = keys.flatMap((key) => touching(props.summaryItems, key))
  const windows = props.summaryWindows.filter((window) => keys.includes(window.day))
  const slots = windows.reduce((sum, window) => sum + window.slots.length, 0)
  const sessions = new Set(items.filter((item) => item.kind === 'session' && SESSION_COUNTED.has(item.status)).map((item) => item.key)).size
  const requests = new Set(items.filter((item) => item.kind === 'guest_request').map((item) => item.key)).size
  const absent = items.some((item) => item.kind === 'absence')
  if (props.mode === 'availability') {
    return {
      main: slots ? `${slots} ${plural(slots, 'слот', 'слоти', 'слотів')} вільно` : absent ? 'відсутність' : 'немає слотів',
      sub: windows.length ? windowsLabel(windows.length) : '',
    }
  }
  const parts = [
    sessions ? `${sessions} ${plural(sessions, 'сесія', 'сесії', 'сесій')}` : '',
    requests ? `${requests} ${plural(requests, 'запит', 'запити', 'запитів')}` : '',
  ].filter(Boolean)
  return {
    main: parts.length ? parts.join(' · ') : absent ? 'відсутність' : '—',
    sub: windows.length ? `${windows.length} ${plural(windows.length, 'вільне вікно', 'вільні вікна', 'вільних вікон')}` : '',
  }
}

// Wall-clock placement in the specialist timezone; a timed entry is clipped to each day it touches.
function segment(key: DayKey) {
  const bounds = dayBounds(key, props.timeZone)
  const place = (start: number, end: number) => {
    const from = Math.max(start, bounds.start)
    const startMinute = start <= bounds.start ? 0 : wallMinutes(from, props.timeZone)
    return { startMinute, endMinute: startMinute + (Math.min(end, bounds.end) - from) / 60000 }
  }
  const dayItems = touching(props.items, key)
  return {
    key,
    bounds,
    timed: dayItems.filter((item) => item.kind !== 'absence').map((item) => ({ item, ...place(item.start, item.end) })),
    absences: dayItems
      .filter((item) => item.kind === 'absence')
      .map((item) => ({
        item,
        startMinute: item.allDay || item.start <= bounds.start ? 0 : wallMinutes(item.start, props.timeZone),
        endMinute: item.allDay || item.end >= bounds.end ? 1440 : wallMinutes(item.end, props.timeZone),
      })),
    windows: props.windows.filter((window) => window.day === key).map((window) => ({ window, ...place(window.start, window.end) })),
  }
}
const segments = computed(() => props.days.map(segment))

// Adaptive bounds: earliest → latest timed entry of the shown days, rounded to the hour.
// Events outside working hours are never hidden; all-day absences do not stretch the range.
const extremes = computed(() => {
  const entries = segments.value.flatMap((day) => [
    ...day.timed,
    ...day.windows,
    ...day.absences.filter((band) => band.endMinute - band.startMinute < 1440),
  ])
  if (!entries.length) return { from: 9 * 60, to: 18 * 60 }
  return { from: Math.min(...entries.map((entry) => entry.startMinute)), to: Math.max(...entries.map((entry) => entry.endMinute)) }
})
const startHour = computed(() => (fullDay.value ? 0 : Math.max(0, Math.floor(extremes.value.from / 60))))
const endHour = computed(() => (fullDay.value ? 24 : Math.min(24, Math.max(startHour.value + 1, Math.ceil(extremes.value.to / 60)))))
const hours = computed(() => Array.from({ length: endHour.value - startHour.value + 1 }, (_, index) => startHour.value + index))
const usableHeight = computed(() => Math.max(MIN_BODY_PX, Math.min(viewportHeight.value * 0.7, 720)))
const hourPx = computed(() => Math.max(HOUR_PX, usableHeight.value / (endHour.value - startHour.value)))
const halfHourLines = computed(() => hourPx.value >= 2 * HOUR_PX)
const bodyHeight = computed(() => (endHour.value - startHour.value) * hourPx.value)
const toPx = (minute: number) => (minute - startHour.value * 60) * (hourPx.value / 60)

const columns = computed(() =>
  segments.value.map((day) => {
    const regular = day.timed
      .filter((entry) => entry.item.kind !== 'external_guest_session')
      .sort((a, b) => a.startMinute - b.startMinute || b.endMinute - a.endMinute)
    const laneEnds: number[] = []
    const placed = regular.map((entry) => {
      let lane = laneEnds.findIndex((laneEnd) => laneEnd <= entry.startMinute)
      if (lane === -1) lane = laneEnds.push(entry.endMinute) - 1
      else laneEnds[lane] = entry.endMinute
      return { ...entry, lane }
    })
    const box = (entry: { startMinute: number; endMinute: number }) => {
      const top = Math.max(0, toPx(entry.startMinute))
      return { top, height: Math.max(MIN_EVENT_PX, toPx(entry.endMinute) - top) }
    }
    const events = placed.map((entry) => {
      const lanes = 1 + Math.max(0, ...placed.filter((other) => other.startMinute < entry.endMinute && other.endMinute > entry.startMinute).map((other) => other.lane))
      const { top, height } = box(entry)
      return { item: entry.item, overlay: false, style: { top: `${top}px`, height: `${height}px`, left: `calc(${entry.lane} * 100% / ${lanes})`, width: `calc(100% / ${lanes})` } }
    })
    // External guest sessions sit on top, shifted by 42% when they cross something (§5).
    for (const entry of day.timed.filter((candidate) => candidate.item.kind === 'external_guest_session')) {
      const crosses = regular.some((other) => other.startMinute < entry.endMinute && other.endMinute > entry.startMinute)
      const { top, height } = box(entry)
      events.push({ item: entry.item, overlay: crosses, style: { top: `${top}px`, height: `${height}px`, left: crosses ? '42%' : '0', width: crosses ? '58%' : '100%' } })
    }
    const windowBlocks = day.windows.map((entry) => ({ window: entry.window, ...box(entry) }))
    const bands = day.absences
      .map((entry) => {
        const top = Math.max(0, toPx(entry.startMinute))
        return { item: entry.item, top, height: Math.min(bodyHeight.value, toPx(entry.endMinute)) - top }
      })
      .filter((band) => band.height > 0)
    const nowInDay = props.now >= day.bounds.start && props.now < day.bounds.end
    const nowPx = nowInDay ? toPx(wallMinutes(props.now, props.timeZone)) : null
    return {
      key: day.key,
      labels: dayLabels(day.key),
      isToday: day.key === props.todayKey,
      summary: daySummary([day.key]),
      events,
      windowBlocks,
      bands,
      emptyLabel: events.length || windowBlocks.length || bands.length ? '' : dayEmptyLabel([day.key]),
      nowTop: nowPx !== null && nowPx >= 0 && nowPx <= bodyHeight.value ? nowPx : null,
    }
  })
)

function dayEmptyLabel(keys: DayKey[]) {
  const all = keys.flatMap((key) => touching(props.summaryItems, key))
  return emptyDayLabel(all, props.summaryWindows.filter((window) => keys.includes(window.day)).length, props.mode)
}

const weekendItems = computed(() => {
  const seen = new Set<string>()
  return weekend.value
    .flatMap((key) => touching(props.items, key))
    .filter((item) => (seen.has(item.key) ? false : (seen.add(item.key), true)))
})
const weekendWindows = computed(() => props.windows.filter((window) => weekend.value.includes(window.day)))
const weekendSummary = computed(() => daySummary(weekend.value))
const weekendEmptyLabel = computed(() => dayEmptyLabel(weekend.value))
const weekendLabel = computed(() => weekend.value.map((key) => dayLabels(key).day).join('–'))

// Auto-scroll to the «now» line, otherwise to today's first event, otherwise to the first event.
const scrollRef = ref<HTMLElement | null>(null)
async function autoScroll() {
  await nextTick()
  const el = scrollRef.value
  if (!el) return
  const tops = (day: (typeof columns.value)[number]) => [...day.events.map((event) => parseFloat(event.style.top)), ...day.windowBlocks.map((block) => block.top)]
  const today = columns.value.find((day) => day.isToday)
  const firstToday = today ? Math.min(...tops(today), Infinity) : Infinity
  const firstAny = Math.min(...columns.value.flatMap(tops), Infinity)
  const target = today?.nowTop ?? (Number.isFinite(firstToday) ? firstToday : Number.isFinite(firstAny) ? firstAny : 0)
  el.scrollTop = Math.max(0, target - hourPx.value)
}
onMounted(autoScroll)
watch(() => [props.days.join(), props.mode, fullDay.value], autoScroll)
</script>
