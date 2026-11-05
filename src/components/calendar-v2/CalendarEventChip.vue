<template>
  <RouterLink
    v-if="item.kind === 'session' && item.href"
    :to="item.href"
    class="pc2-cal-event"
    :class="classes"
    :aria-label="description"
    :data-kind="item.kind"
  >
    <span class="pc2-cal-event__line"><span class="pc2-cal-event__time">{{ timeRange }}</span> <span class="pc2-cal-event__title">{{ title }}</span></span>
    <span v-if="!compact && !muted" class="pc2-cal-event__status">{{ item.statusLabel }}</span>
    <span v-if="shownMarker" class="pc2-cal-event__marker">{{ shownMarker }}</span>
  </RouterLink>
  <button
    v-else
    type="button"
    class="pc2-cal-event"
    :class="classes"
    :aria-label="description"
    aria-haspopup="dialog"
    :data-kind="item.kind"
    @click="$emit('open', item)"
  >
    <span class="pc2-cal-event__line"><span class="pc2-cal-event__time">{{ timeRange }}</span> <span class="pc2-cal-event__title">{{ title }}</span></span>
    <span v-if="!compact" class="pc2-cal-event__status">{{ item.statusLabel }}</span>
    <span v-if="shownMarker" class="pc2-cal-event__marker">{{ shownMarker }}</span>
  </button>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { RouterLink } from 'vue-router'
import { CALENDAR_CONFLICT_LABELS, type CalendarItem } from '../../lib/calendarItems'
import { dayKeyOf, dayLabels, formatTime } from '../../lib/calendarTime'

const props = defineProps<{
  item: CalendarItem
  timeZone: string
  compact?: boolean
  /** «Доступність»: sessions are shown only as «Зайнято», without names (§3). */
  muted?: boolean
  /** Prefix the weekday (collapsed weekend column). */
  showDay?: boolean
}>()
defineEmits<{ open: [item: CalendarItem] }>()

const timeRange = computed(() => {
  if (props.item.allDay) return 'Увесь день'
  const range = `${formatTime(props.item.start, props.timeZone)}–${formatTime(props.item.end, props.timeZone)}`
  return props.showDay ? `${dayLabels(dayKeyOf(props.item.start, props.timeZone)).short} ${range}` : range
})
const title = computed(() => (props.muted ? 'Зайнято' : props.item.title))
const shownMarker = computed(() => (props.muted ? null : props.item.marker))

const KIND_LABELS: Record<CalendarItem['kind'], string> = {
  session: 'Сесія',
  free_slot: 'Вільне вікно',
  guest_request: 'Запит на час',
  absence: 'Відсутність',
  external_guest_session: 'Зовнішня гостьова сесія',
}

const classes = computed(() => [
  `pc2-cal-event--${props.item.kind}`,
  props.item.kind === 'session' ? `pc2-cal-event--status-${props.item.status.toLowerCase()}` : '',
  {
    'is-guest': props.item.guest,
    'is-past': props.item.layer === 'past',
    'is-muted': props.muted,
    'needs-action': props.item.needsAction,
    'has-conflict': props.item.conflicts.length > 0,
    'is-reschedule': props.item.rescheduleRequestIds.length > 0,
    'is-missing-link': props.item.missingLink,
  },
])

// The marker and status are always written out; colour only repeats them.
const description = computed(() => {
  if (props.muted) return `${timeRange.value}, Зайнято`
  return [
    timeRange.value,
    KIND_LABELS[props.item.kind],
    props.item.title,
    props.item.kind === 'session' || props.item.kind === 'external_guest_session' ? props.item.statusLabel : '',
    props.item.guest && props.item.kind === 'session' ? 'без реєстрації' : '',
    ...props.item.actionReasons,
    ...props.item.conflicts.map((conflict) => CALENDAR_CONFLICT_LABELS[conflict]),
  ]
    .filter(Boolean)
    .join(', ')
})
</script>
