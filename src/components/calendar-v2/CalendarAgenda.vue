<template>
  <section class="pc2-cal-agenda" :aria-labelledby="`pc2-cal-day-${day}`">
    <h2 :id="`pc2-cal-day-${day}`" class="pc2-cal-agenda__title">
      <span>{{ heading }}</span>
      <span class="pc2-cal-agenda__sub">{{ subheading }}</span>
    </h2>
    <ul v-if="rows.length" class="pc2-cal-agenda__list" role="list">
      <li v-for="row in rows" :key="row.key">
        <CalendarEventChip
          v-if="row.item"
          :item="row.item"
          :time-zone="timeZone"
          :muted="mode === 'availability' && row.item.kind === 'session'"
          @open="$emit('open', $event)"
        />
        <template v-else-if="row.window">
          <button
            type="button"
            class="pc2-cal-agenda__window"
            :aria-expanded="mode === 'availability' ? expanded.has(row.window.key) : undefined"
            :aria-controls="mode === 'availability' ? `${row.window.key}-slots` : undefined"
            @click="mode === 'availability' ? toggle(row.window.key) : $emit('open-window', row.window)"
          >
            <span class="pc2-cal-agenda__window-time">{{ range(row.window.start, row.window.end) }}</span>
            <span>Вільно · {{ slotsLabel(row.window.slots.length) }}</span>
          </button>
          <ul v-if="mode === 'availability' && expanded.has(row.window.key)" :id="`${row.window.key}-slots`" class="pc2-cal-agenda__slots" role="list">
            <li v-for="slot in row.window.slots" :key="slot.key">{{ range(slot.start, slot.end) }}</li>
          </ul>
        </template>
      </li>
    </ul>
    <p v-else class="pc2-cal-agenda__empty">{{ emptyLabel }}</p>
  </section>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import type { CalendarItem } from '../../lib/calendarItems'
import type { CalendarMode } from '../../lib/calendarModes'
import { dayBounds, dayLabels, formatTime, type DayKey } from '../../lib/calendarTime'
import { emptyDayLabel, plural, slotsLabel, windowsLabel, type FreeWindow } from '../../lib/calendarWindows'
import CalendarEventChip from './CalendarEventChip.vue'

const props = defineProps<{
  day: DayKey
  items: CalendarItem[]
  /** Everything loaded for the period (visible or not), so a day hidden by layers is not called empty. */
  summaryItems: CalendarItem[]
  windows: FreeWindow[]
  /** All loaded windows of the day (summary even when the free-slots layer is hidden). */
  summaryWindows: FreeWindow[]
  mode: Exclude<CalendarMode, 'needs_action'>
  timeZone: string
  todayKey: DayKey
}>()
defineEmits<{ open: [item: CalendarItem]; 'open-window': [window: FreeWindow] }>()

const expanded = ref(new Set<string>())
function toggle(key: string) {
  const next = new Set(expanded.value)
  if (next.has(key)) next.delete(key)
  else next.add(key)
  expanded.value = next
}

const range = (start: number, end: number) => `${formatTime(start, props.timeZone)}–${formatTime(end, props.timeZone)}`
const bounds = computed(() => dayBounds(props.day, props.timeZone))
const dayItems = computed(() => props.items.filter((item) => item.start < bounds.value.end && item.end > bounds.value.start))
const dayWindows = computed(() => props.windows.filter((window) => window.day === props.day))

const rows = computed(() =>
  [
    ...dayItems.value.map((item) => ({ key: item.key, start: item.start, item, window: null as FreeWindow | null })),
    ...dayWindows.value.map((window) => ({ key: window.key, start: window.start, item: null as CalendarItem | null, window })),
  ].sort((a, b) => a.start - b.start)
)

const heading = computed(() => {
  const label = dayLabels(props.day)
  const sessions = dayItems.value.filter((item) => item.kind === 'session' && item.status !== 'CANCELLED' && item.status !== 'NO_SHOW').length
  const today = props.day === props.todayKey ? ' · сьогодні' : ''
  if (props.mode === 'availability') return `${label.short}, ${label.dateOnly}${today}`
  return `${label.short}, ${label.dateOnly}${today}${sessions ? ` · ${sessions} ${plural(sessions, 'сесія', 'сесії', 'сесій')}` : ''}`
})
const emptyLabel = computed(() =>
  emptyDayLabel(
    props.summaryItems.filter((item) => item.start < bounds.value.end && item.end > bounds.value.start),
    props.summaryWindows.filter((window) => window.day === props.day).length,
    props.mode
  )
)
const subheading = computed(() => {
  const windows = props.summaryWindows.filter((window) => window.day === props.day)
  if (!windows.length) return ''
  if (props.mode === 'availability') {
    const slots = windows.reduce((sum, window) => sum + window.slots.length, 0)
    return `${slots} ${plural(slots, 'вільний', 'вільні', 'вільних')} · ${windowsLabel(windows.length)}`
  }
  return `${windows.length} ${plural(windows.length, 'вільне вікно', 'вільні вікна', 'вільних вікон')}`
})
</script>
