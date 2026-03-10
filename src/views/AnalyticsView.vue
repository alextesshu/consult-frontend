<template>
  <section class="analytics">
    <header class="analytics__hero">
      <div>
        <div class="badge">Аналітика</div>
        <h1 class="title analytics__title">Аналітика</h1>
        <p class="muted analytics__subtitle">
          Переглядайте основні показники своєї практики за вибраний період.
        </p>
      </div>
      <RouterLink class="btn btn--ghost" to="/cabinet">Назад до кабінету</RouterLink>
    </header>

    <section class="panel analytics__range">
      <div class="range-switch" role="tablist" aria-label="Період аналітики">
        <button
          v-for="option in rangeOptions"
          :key="option.value"
          class="btn btn--ghost btn--sm"
          :class="{ 'btn--active': range === option.value }"
          type="button"
          @click="setRange(option.value)"
        >
          {{ option.label }}
        </button>
      </div>
      <div class="muted">Період: {{ overview?.date_from }} — {{ overview?.date_to }}</div>
    </section>

    <div v-if="error" class="form-error">{{ error }}</div>
    <div v-if="loading" class="muted">Завантаження...</div>

    <template v-else>
      <section class="panel panel--wide">
        <div class="panel__header">
          <div>
            <div class="badge badge--soft">Огляд</div>
            <h2 class="panel__title">Ключові показники</h2>
          </div>
        </div>

        <div class="metrics-grid">
          <article class="metric-card">
            <div class="metric-card__label">Записи</div>
            <div class="metric-card__value">{{ metrics.bookings_count }}</div>
          </article>
          <article class="metric-card">
            <div class="metric-card__label">Підтверджені сесії</div>
            <div class="metric-card__value">{{ metrics.confirmed_count }}</div>
            <div class="muted">Рівень підтвердження: {{ formatRate(metrics.confirmation_rate) }}</div>
          </article>
          <article class="metric-card">
            <div class="metric-card__label">Завершені сесії</div>
            <div class="metric-card__value">{{ metrics.completed_count }}</div>
            <div class="muted">Рівень завершення: {{ formatRate(metrics.completion_rate) }}</div>
          </article>
          <article class="metric-card">
            <div class="metric-card__label">Скасування</div>
            <div class="metric-card__value">{{ metrics.cancelled_count }}</div>
            <div class="muted">Рівень скасування: {{ formatRate(metrics.cancellation_rate) }}</div>
          </article>
          <article class="metric-card">
            <div class="metric-card__label">Перенесення</div>
            <div class="metric-card__value">{{ metrics.rescheduled_count }}</div>
          </article>
          <article class="metric-card">
            <div class="metric-card__label">Заплановані</div>
            <div class="metric-card__value">{{ metrics.scheduled_count }}</div>
          </article>
        </div>
      </section>

      <section v-if="isEmpty" class="panel panel--wide empty-state">
        <h2 class="panel__title">Поки що недостатньо даних для аналітики</h2>
        <p class="muted">
          Коли у вас з’являться записи і сесії, тут буде видно динаміку практики.
        </p>
      </section>

      <template v-else>
        <section class="panel panel--wide">
          <div class="panel__header">
            <div>
              <div class="badge badge--soft">Динаміка</div>
              <h2 class="panel__title">Динаміка по днях</h2>
            </div>
          </div>

          <div class="series-list">
            <div v-for="item in visibleSeries" :key="item.date" class="series-row">
              <div class="series-row__date">{{ formatDate(item.date) }}</div>
              <div class="series-row__bar-wrap">
                <div class="series-row__bar" :style="{ width: `${barWidth(item.count)}%` }"></div>
              </div>
              <div class="series-row__count">{{ item.count }}</div>
            </div>
          </div>
        </section>

        <section class="analytics__bottom">
          <section class="panel">
            <div class="panel__header">
              <div>
                <div class="badge badge--soft">Попит</div>
                <h2 class="panel__title">Найчастіші дні</h2>
              </div>
            </div>
            <ul class="top-list">
              <li v-for="item in overview?.top_weekdays || []" :key="item.weekday">
                <span>{{ weekdayLabel(item.weekday) }}</span>
                <strong>{{ item.count }}</strong>
              </li>
            </ul>
          </section>

          <section class="panel">
            <div class="panel__header">
              <div>
                <div class="badge badge--soft">Попит</div>
                <h2 class="panel__title">Найчастіший час запису</h2>
              </div>
            </div>
            <ul class="top-list">
              <li v-for="item in overview?.top_hours || []" :key="item.hour">
                <span>{{ item.hour }}</span>
                <strong>{{ item.count }}</strong>
              </li>
            </ul>
          </section>
        </section>

        <section v-if="isLeaderAnalytics && leaderRecommendations.length" class="panel panel--wide">
          <div class="panel__header">
            <div>
              <div class="badge badge--soft">Leader</div>
              <h2 class="panel__title">Рекомендації</h2>
            </div>
          </div>

          <ul class="top-list">
            <li v-for="item in leaderRecommendations" :key="item.code">
              <span>{{ item.message }}</span>
            </li>
          </ul>
        </section>

        <section v-if="hasLeaderHotspots" class="analytics__bottom">
          <section v-if="rescheduleHotspots.length" class="panel">
            <div class="panel__header">
              <div>
                <div class="badge badge--soft">Leader</div>
                <h2 class="panel__title">Часті перенесення</h2>
              </div>
            </div>
            <ul class="top-list">
              <li v-for="item in rescheduleHotspots" :key="`reschedule-${item.weekday}-${item.hour}`">
                <span>{{ weekdayLabel(item.weekday) }}, {{ item.hour }}</span>
                <strong>{{ item.count }}</strong>
              </li>
            </ul>
          </section>

          <section v-if="cancellationHotspots.length" class="panel">
            <div class="panel__header">
              <div>
                <div class="badge badge--soft">Leader</div>
                <h2 class="panel__title">Часті скасування</h2>
              </div>
            </div>
            <ul class="top-list">
              <li
                v-for="item in cancellationHotspots"
                :key="`cancellation-${item.weekday}-${item.hour}`"
              >
                <span>{{ weekdayLabel(item.weekday) }}, {{ item.hour }}</span>
                <strong>{{ item.count }}</strong>
              </li>
            </ul>
          </section>
        </section>

        <section v-if="hasLeaderOpportunities" class="analytics__bottom">
          <section v-if="underusedWeekdays.length" class="panel">
            <div class="panel__header">
              <div>
                <div class="badge badge--soft">Leader</div>
                <h2 class="panel__title">Менш завантажені дні</h2>
              </div>
            </div>
            <ul class="top-list">
              <li v-for="item in underusedWeekdays" :key="`weekday-${item.weekday}`">
                <span>{{ weekdayLabel(item.weekday) }}</span>
                <strong>{{ item.count }}</strong>
              </li>
            </ul>
          </section>

          <section v-if="underusedHours.length" class="panel">
            <div class="panel__header">
              <div>
                <div class="badge badge--soft">Leader</div>
                <h2 class="panel__title">Менш завантажені години</h2>
              </div>
            </div>
            <ul class="top-list">
              <li v-for="item in underusedHours" :key="`hour-${item.hour}`">
                <span>{{ item.hour }}</span>
                <strong>{{ item.count }}</strong>
              </li>
            </ul>
          </section>
        </section>

        <section v-if="showLeaderTeaser" class="panel panel--wide">
          <div class="panel__header">
            <div>
              <div class="badge badge--soft">Leader</div>
              <h2 class="panel__title">Розширена аналітика</h2>
            </div>
          </div>

          <p class="muted">
            На рівні Leader доступні рекомендації, точки ризику та підказки для покращення розкладу.
          </p>
        </section>
      </template>
    </template>
  </section>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { apiGet } from '../lib/api'

type RateValue = number | null

type AnalyticsOverview = {
  range: '7d' | '30d' | '90d'
  analytics_level: string
  date_from: string
  date_to: string
  metrics: {
    bookings_count: number
    scheduled_count: number
    confirmed_count: number
    completed_count: number
    cancelled_count: number
    rescheduled_count: number
    confirmation_rate: RateValue
    completion_rate: RateValue
    cancellation_rate: RateValue
  }
  sessions_by_day: Array<{ date: string; count: number }>
  bookings_by_day: Array<{ date: string; count: number }>
  top_weekdays: Array<{ weekday: string; count: number }>
  top_hours: Array<{ hour: string; count: number }>
  insights: {
    underused_weekdays: Array<{ weekday: string; count: number }>
    underused_hours: Array<{ hour: string; count: number }>
    reschedule_hotspots: Array<{ weekday: string; hour: string; count: number }>
    cancellation_hotspots: Array<{ weekday: string; hour: string; count: number }>
    recommendations: Array<{ code: string; message: string }>
  }
}

const rangeOptions = [
  { value: '7d', label: '7 днів' },
  { value: '30d', label: '30 днів' },
  { value: '90d', label: '90 днів' },
] as const

const range = ref<'7d' | '30d' | '90d'>('30d')
const loading = ref(true)
const error = ref('')
const overview = ref<AnalyticsOverview | null>(null)

const metrics = computed(
  () =>
    overview.value?.metrics ?? {
      bookings_count: 0,
      scheduled_count: 0,
      confirmed_count: 0,
      completed_count: 0,
      cancelled_count: 0,
      rescheduled_count: 0,
      confirmation_rate: null,
      completion_rate: null,
      cancellation_rate: null,
    }
)

const isEmpty = computed(() => metrics.value.bookings_count === 0)
const isLeaderAnalytics = computed(() => overview.value?.analytics_level === 'leader')
const leaderRecommendations = computed(() => overview.value?.insights?.recommendations ?? [])
const rescheduleHotspots = computed(() => overview.value?.insights?.reschedule_hotspots ?? [])
const cancellationHotspots = computed(() => overview.value?.insights?.cancellation_hotspots ?? [])
const hasLeaderHotspots = computed(
  () =>
    isLeaderAnalytics.value &&
    (rescheduleHotspots.value.length > 0 || cancellationHotspots.value.length > 0)
)
const underusedWeekdays = computed(() => overview.value?.insights?.underused_weekdays ?? [])
const underusedHours = computed(() => overview.value?.insights?.underused_hours ?? [])
const hasLeaderOpportunities = computed(
  () =>
    isLeaderAnalytics.value &&
    (underusedWeekdays.value.length > 0 || underusedHours.value.length > 0)
)
const showLeaderTeaser = computed(() => !isLeaderAnalytics.value && !isEmpty.value)

const visibleSeries = computed(() => {
  const rows = overview.value?.sessions_by_day ?? []
  return rows.slice(Math.max(0, rows.length - 14))
})

const maxSeriesCount = computed(() => {
  return Math.max(1, ...visibleSeries.value.map((item) => item.count))
})

function barWidth(count: number) {
  return Math.round((count / maxSeriesCount.value) * 100)
}

function formatRate(value: RateValue) {
  if (value === null || value === undefined) return '—'
  return `${Math.round(value * 100)}%`
}

function formatDate(value: string) {
  const dt = new Date(value)
  if (Number.isNaN(dt.getTime())) return value
  return dt.toLocaleDateString('uk-UA', {
    day: '2-digit',
    month: '2-digit',
  })
}

function weekdayLabel(value: string) {
  const map: Record<string, string> = {
    monday: 'Понеділок',
    tuesday: 'Вівторок',
    wednesday: 'Середа',
    thursday: 'Четвер',
    friday: 'Пʼятниця',
    saturday: 'Субота',
    sunday: 'Неділя',
  }
  return map[value] || value
}

async function loadOverview() {
  loading.value = true
  error.value = ''
  try {
    overview.value = await apiGet<AnalyticsOverview>('/cabinet/analytics/overview/', {
      params: { range: range.value },
    })
  } catch {
    error.value = 'Не вдалося завантажити аналітику. Спробуйте ще раз.'
  } finally {
    loading.value = false
  }
}

function setRange(nextRange: '7d' | '30d' | '90d') {
  if (range.value === nextRange) return
  range.value = nextRange
  loadOverview()
}

onMounted(loadOverview)
</script>

<style scoped>
.analytics {
  display: grid;
  gap: 16px;
}

.analytics__hero {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 20px;
  background: linear-gradient(135deg, rgba(8, 113, 201, 0.16), rgba(7, 47, 71, 0.06));
  border: 1px solid var(--line);
  border-radius: var(--radius);
  padding: 22px 24px;
  box-shadow: var(--shadow);
}

.analytics__title {
  font-size: 30px;
}

.analytics__subtitle {
  max-width: 560px;
}

.panel {
  border: 1px solid var(--line);
  border-radius: 16px;
  padding: 16px;
  background: #fff;
  display: grid;
  gap: 12px;
}

.panel--wide {
  gap: 14px;
}

.panel__header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 12px;
}

.panel__title {
  margin: 0;
  font-family: var(--font-display);
  font-size: 22px;
}

.analytics__range {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
}

.range-switch {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.btn--active {
  border-color: #0b4a7d;
  color: #0b4a7d;
  background: #eef6ff;
}

.metrics-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(190px, 1fr));
  gap: 10px;
}

.metric-card {
  border: 1px solid var(--line);
  border-radius: 14px;
  padding: 12px;
  display: grid;
  gap: 6px;
}

.metric-card__label {
  color: var(--muted);
  font-size: 13px;
}

.metric-card__value {
  font-family: var(--font-display);
  font-size: 32px;
  font-weight: 700;
}

.empty-state {
  text-align: center;
  padding: 28px 16px;
}

.series-list {
  display: grid;
  gap: 8px;
}

.series-row {
  display: grid;
  grid-template-columns: 64px 1fr 32px;
  gap: 10px;
  align-items: center;
}

.series-row__date {
  font-size: 13px;
  color: var(--muted);
}

.series-row__bar-wrap {
  width: 100%;
  height: 10px;
  border-radius: 999px;
  background: #edf2f5;
  overflow: hidden;
}

.series-row__bar {
  height: 100%;
  background: linear-gradient(90deg, #0f9d86, #0b4a7d);
  border-radius: 999px;
}

.series-row__count {
  text-align: right;
  font-weight: 600;
}

.analytics__bottom {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
  gap: 12px;
}

.top-list {
  margin: 0;
  padding: 0;
  list-style: none;
  display: grid;
  gap: 8px;
}

.top-list li {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  border-bottom: 1px dashed var(--line);
  padding-bottom: 8px;
}

.top-list li:last-child {
  border-bottom: none;
  padding-bottom: 0;
}

.form-error {
  color: #b3261e;
  background: #fdecea;
  border: 1px solid #f5c2c0;
  border-radius: 10px;
  padding: 8px 10px;
}

@media (max-width: 860px) {
  .analytics__hero {
    flex-direction: column;
    align-items: flex-start;
  }

  .analytics__range {
    flex-direction: column;
    align-items: flex-start;
  }

  .series-row {
    grid-template-columns: 56px 1fr 28px;
  }
}
</style>
