<template>
  <RouterLink
    v-if="item.kind === 'session' && item.href"
    :to="item.href"
    class="pc2-cal-event"
    :class="classes"
    :aria-label="description"
    :data-kind="item.kind"
  >
    <span class="pc2-cal-event__time">{{ timeRange }}</span>
    <span class="pc2-cal-event__title">{{ item.title }}</span>
    <span v-if="!compact" class="pc2-cal-event__status">{{ item.statusLabel }}</span>
    <span v-if="markers" class="pc2-cal-event__marks" aria-hidden="true">{{ markers }}</span>
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
    <span class="pc2-cal-event__time">{{ timeRange }}</span>
    <span class="pc2-cal-event__title">{{ item.title }}</span>
    <span v-if="!compact" class="pc2-cal-event__status">{{ item.statusLabel }}</span>
    <span v-if="markers" class="pc2-cal-event__marks" aria-hidden="true">{{ markers }}</span>
  </button>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { RouterLink } from 'vue-router'
import { CALENDAR_CONFLICT_LABELS, type CalendarItem } from '../../lib/calendarItems'
import { formatTime } from '../../lib/calendarTime'

const props = defineProps<{ item: CalendarItem; timeZone: string; compact?: boolean }>()
defineEmits<{ open: [item: CalendarItem] }>()

const timeRange = computed(() =>
  props.item.allDay ? 'Увесь день' : `${formatTime(props.item.start, props.timeZone)}–${formatTime(props.item.end, props.timeZone)}`
)

const KIND_LABELS: Record<CalendarItem['kind'], string> = {
  session: 'Сесія',
  free_slot: 'Вільне вікно',
  guest_request: 'Заявка на час',
  absence: 'Відсутність',
  external_guest_session: 'Зовнішня гостьова сесія',
}

const classes = computed(() => [
  `pc2-cal-event--${props.item.kind}`,
  props.item.kind === 'session' ? `pc2-cal-event--status-${props.item.status.toLowerCase()}` : '',
  {
    'is-guest': props.item.guest,
    'is-past': props.item.layer === 'past',
    'needs-action': props.item.needsAction,
    'has-conflict': props.item.conflicts.length > 0,
  },
])

// Status is always written out; the markers only repeat it visually.
const markers = computed(() =>
  [
    props.item.rescheduleRequestIds.length ? '⇄' : '',
    props.item.needsAction ? '●' : '',
    props.item.conflicts.length ? '⚠' : '',
  ]
    .filter(Boolean)
    .join(' ')
)

const description = computed(() =>
  [
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
)
</script>
