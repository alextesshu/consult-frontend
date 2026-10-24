<template>
  <div class="pc2-cal-grid" :style="{ '--pc2-cal-days': days.length }">
    <div class="pc2-cal-grid__head" aria-hidden="true">
      <span class="pc2-cal-grid__corner"></span>
      <span v-for="day in columns" :key="day.key" class="pc2-cal-grid__day-head" :class="{ 'is-today': day.isToday }">
        <span>{{ day.labels.short }}</span>
        <strong>{{ day.labels.day }}</strong>
      </span>
    </div>
    <div class="pc2-cal-grid__body" :style="{ height: `${bodyHeight}px` }">
      <div class="pc2-cal-grid__hours" aria-hidden="true">
        <span v-for="hour in hours" :key="hour" :style="{ top: `${(hour - startHour) * HOUR_PX}px` }">{{ String(hour).padStart(2, '0') }}:00</span>
      </div>
      <section
        v-for="day in columns"
        :key="day.key"
        class="pc2-cal-grid__col"
        :class="{ 'is-today': day.isToday }"
        :aria-label="`${day.labels.full}${day.isToday ? ', сьогодні' : ''}: ${countLabel(day.events.length)}`"
      >
        <span v-for="hour in hours" :key="hour" class="pc2-cal-grid__line" :style="{ top: `${(hour - startHour) * HOUR_PX}px` }" aria-hidden="true"></span>
        <span
          v-for="band in day.bands"
          :key="band.item.key"
          class="pc2-cal-grid__absence"
          :style="{ top: `${band.top}px`, height: `${band.height}px` }"
          aria-hidden="true"
        >{{ band.item.title }}</span>
        <ul class="pc2-cal-grid__events" role="list">
          <li
            v-for="event in day.events"
            :key="event.item.key"
            class="pc2-cal-grid__slot"
            :style="{ top: `${event.top}px`, height: `${event.height}px`, left: `calc(${event.lane} * 100% / ${event.lanes})`, width: `calc(100% / ${event.lanes})` }"
          >
            <CalendarEventChip :item="event.item" :time-zone="timeZone" compact @open="$emit('open', $event)" />
          </li>
        </ul>
        <span v-if="day.nowTop !== null" class="pc2-cal-grid__now" :style="{ top: `${day.nowTop}px` }" aria-hidden="true"></span>
        <p v-if="!day.events.length && !day.bands.length" class="pc2-cal-sr">Подій немає</p>
      </section>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { CalendarItem } from '../../lib/calendarItems'
import { dayBounds, dayLabels, wallMinutes, type DayKey } from '../../lib/calendarTime'
import CalendarEventChip from './CalendarEventChip.vue'

const props = defineProps<{ days: DayKey[]; items: CalendarItem[]; timeZone: string; todayKey: DayKey; now: number }>()
defineEmits<{ open: [item: CalendarItem] }>()

const HOUR_PX = 48
const PX_PER_MIN = HOUR_PX / 60
const MIN_EVENT_PX = 24

function countLabel(count: number) {
  if (count === 0) return 'подій немає'
  const mod10 = count % 10
  const mod100 = count % 100
  const word = mod10 === 1 && mod100 !== 11 ? 'подія' : mod10 >= 2 && mod10 <= 4 && (mod100 < 10 || mod100 >= 20) ? 'події' : 'подій'
  return `${count} ${word}`
}

// Clip every item to each local day it touches; minutes are wall-clock in the calendar timezone.
const segments = computed(() =>
  props.days.map((key) => {
    const bounds = dayBounds(key, props.timeZone)
    const touching = props.items.filter((item) => item.start < bounds.end && item.end > bounds.start)
    return {
      key,
      bounds,
      timed: touching
        .filter((item) => item.kind !== 'absence')
        .map((item) => {
          const start = Math.max(item.start, bounds.start)
          const end = Math.min(item.end, bounds.end)
          const startMinute = item.start <= bounds.start ? 0 : wallMinutes(start, props.timeZone)
          return { item, startMinute, endMinute: startMinute + (end - start) / 60000 }
        }),
      absences: touching
        .filter((item) => item.kind === 'absence')
        .map((item) => ({
          item,
          startMinute: item.allDay || item.start <= bounds.start ? 0 : wallMinutes(item.start, props.timeZone),
          endMinute: item.allDay || item.end >= bounds.end ? 24 * 60 : wallMinutes(item.end, props.timeZone),
        })),
    }
  })
)

const startHour = computed(() => {
  const earliest = Math.min(...segments.value.flatMap((day) => day.timed.map((entry) => entry.startMinute)), 8 * 60)
  return Math.max(0, Math.floor(earliest / 60))
})
const endHour = computed(() => {
  const latest = Math.max(...segments.value.flatMap((day) => day.timed.map((entry) => entry.endMinute)), 20 * 60)
  return Math.min(24, Math.ceil(latest / 60))
})
const hours = computed(() => Array.from({ length: endHour.value - startHour.value + 1 }, (_, index) => startHour.value + index))
const bodyHeight = computed(() => (endHour.value - startHour.value) * HOUR_PX)

function toPx(minute: number) {
  return (minute - startHour.value * 60) * PX_PER_MIN
}

const columns = computed(() =>
  segments.value.map((day) => {
    // Greedy lanes so overlapping events sit side by side instead of hiding each other.
    const sorted = [...day.timed].sort((a, b) => a.startMinute - b.startMinute || b.endMinute - a.endMinute)
    const laneEnds: number[] = []
    const placed = sorted.map((entry) => {
      let lane = laneEnds.findIndex((laneEnd) => laneEnd <= entry.startMinute)
      if (lane === -1) lane = laneEnds.push(entry.endMinute) - 1
      else laneEnds[lane] = entry.endMinute
      return { ...entry, lane }
    })
    const events = placed.map((entry) => {
      const lanes = 1 + Math.max(0, ...placed.filter((other) => other.startMinute < entry.endMinute && other.endMinute > entry.startMinute).map((other) => other.lane))
      const top = Math.max(0, toPx(entry.startMinute))
      return { item: entry.item, top, height: Math.max(MIN_EVENT_PX, toPx(entry.endMinute) - top), lane: entry.lane, lanes }
    })
    const windowEnd = bodyHeight.value
    const bands = day.absences
      .map((entry) => {
        const top = Math.max(0, toPx(entry.startMinute))
        return { item: entry.item, top, height: Math.min(windowEnd, toPx(entry.endMinute)) - top }
      })
      .filter((band) => band.height > 0)
    const nowInDay = props.now >= day.bounds.start && props.now < day.bounds.end
    const nowPx = nowInDay ? toPx(wallMinutes(props.now, props.timeZone)) : null
    return {
      key: day.key,
      labels: dayLabels(day.key),
      isToday: day.key === props.todayKey,
      events,
      bands,
      nowTop: nowPx !== null && nowPx >= 0 && nowPx <= windowEnd ? nowPx : null,
    }
  })
)
</script>
