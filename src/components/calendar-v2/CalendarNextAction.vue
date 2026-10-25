<template>
  <section class="pc2-cal-next" :class="{ 'is-quiet': quiet, 'is-loading': loading }" aria-labelledby="pc2-cal-next-title">
    <template v-if="loading">
      <p class="pc2-cal-next__meta">Найближча дія</p>
      <p id="pc2-cal-next-title" class="pc2-cal-next__who">Завантажуємо…</p>
    </template>
    <template v-else-if="card.kind === 'action'">
      <p class="pc2-cal-next__meta">Найближча дія · {{ whenLabel }}<template v-if="relative"> · {{ relative }}</template></p>
      <h2 id="pc2-cal-next-title" class="pc2-cal-next__who">{{ card.action.who }}</h2>
      <p class="pc2-cal-next__state"><span class="pc2-cal-next__marker">{{ card.action.marker }}</span>{{ card.action.reason }}</p>
      <RouterLink class="pc2-cal-next__btn" :to="card.action.href">{{ card.action.primaryLabel }} →</RouterLink>
    </template>
    <template v-else-if="card.kind === 'session' && card.today">
      <p class="pc2-cal-next__meta">Наступна · {{ whenLabel }}<template v-if="relative"> · {{ relative }}</template></p>
      <h2 id="pc2-cal-next-title" class="pc2-cal-next__who">{{ sessionName }}</h2>
      <p class="pc2-cal-next__state">{{ sessionState }}</p>
      <RouterLink class="pc2-cal-next__btn" :to="`/cabinet/sessions/${card.session.id}`">Відкрити сесію →</RouterLink>
    </template>
    <template v-else-if="card.kind === 'session'">
      <p class="pc2-cal-next__meta">Сьогодні сесій немає</p>
      <h2 id="pc2-cal-next-title" class="pc2-cal-next__who">Найближча — {{ whenLabel }}</h2>
      <p class="pc2-cal-next__state">{{ sessionName }} · {{ sessionState }}</p>
      <RouterLink class="pc2-cal-next__btn" :to="`/cabinet/sessions/${card.session.id}`">Відкрити сесію →</RouterLink>
    </template>
    <template v-else>
      <p class="pc2-cal-next__meta">Найближча дія</p>
      <h2 id="pc2-cal-next-title" class="pc2-cal-next__who">Найближчих сесій і дій немає</h2>
      <p v-if="partial" class="pc2-cal-next__state">Частину даних не вдалося завантажити.</p>
    </template>
  </section>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { RouterLink } from 'vue-router'
import { formatWhen, relativeLabel, type NextActionCard } from '../../lib/calendarActions'
import { SESSION_STATUS_LABELS } from '../../lib/calendarItems'
import { addDays, dayKeyOf, formatTime } from '../../lib/calendarTime'

const props = defineProps<{ card: NextActionCard; now: number; timeZone: string; loading?: boolean; partial?: boolean }>()

const quiet = computed(() => props.card.kind === 'none' || (props.card.kind === 'session' && !props.card.today))

const whenLabel = computed(() => {
  const card = props.card
  if (card.kind === 'none') return ''
  const key = dayKeyOf(card.when, props.timeZone)
  const today = dayKeyOf(props.now, props.timeZone)
  if (key === today) return `сьогодні ${formatTime(card.when, props.timeZone)}`
  if (key === addDays(today, 1)) return `завтра ${formatTime(card.when, props.timeZone)}`
  return formatWhen(card.when, props.timeZone)
})

const relative = computed(() => (props.card.kind === 'none' ? '' : relativeLabel(props.card.when, props.now)))

const sessionName = computed(() => {
  if (props.card.kind !== 'session') return ''
  const row = props.card.session
  return (row.client_display_name || row.client_name || row.client_username || 'Клієнт').trim()
})
const sessionState = computed(() => {
  if (props.card.kind !== 'session') return ''
  const row = props.card.session
  const format = row.session_format === 'offline' ? 'Офлайн' : row.session_format === 'online' ? 'Онлайн' : ''
  return [SESSION_STATUS_LABELS[row.status] || row.status, format].filter(Boolean).join(' · ')
})
</script>
