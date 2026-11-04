<template>
  <div class="pc2-cal-agenda">
    <section
      v-for="group in groups"
      :key="group.key"
      class="pc2-cal-agenda__day"
      :class="{ 'is-today': group.key === todayKey }"
      :aria-labelledby="`pc2-cal-day-${group.key}`"
    >
      <h2 :id="`pc2-cal-day-${group.key}`" class="pc2-cal-agenda__title">
        {{ group.labels.full }}<span v-if="group.key === todayKey" class="pc2-cal-agenda__today"> · сьогодні</span>
      </h2>
      <ul v-if="group.items.length" class="pc2-cal-agenda__list" role="list">
        <li v-for="item in group.items" :key="item.key">
          <CalendarEventChip :item="item" :time-zone="timeZone" @open="$emit('open', $event)" />
        </li>
      </ul>
      <p v-else class="pc2-cal-agenda__empty">{{ emptyText }}</p>
    </section>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { CalendarItem } from '../../lib/calendarItems'
import { dayBounds, dayLabels, type DayKey } from '../../lib/calendarTime'
import CalendarEventChip from './CalendarEventChip.vue'

const props = defineProps<{
  days: DayKey[]
  items: CalendarItem[]
  timeZone: string
  todayKey: DayKey
  /** Hide days without items (the list view); single-day views always show their day. */
  skipEmptyDays?: boolean
  emptyText?: string
}>()
defineEmits<{ open: [item: CalendarItem] }>()

const groups = computed(() =>
  props.days
    .map((key) => {
      const bounds = dayBounds(key, props.timeZone)
      return {
        key,
        labels: dayLabels(key),
        items: props.items.filter((item) => item.start < bounds.end && item.end > bounds.start),
      }
    })
    .filter((group) => !props.skipEmptyDays || group.items.length > 0)
)
</script>
