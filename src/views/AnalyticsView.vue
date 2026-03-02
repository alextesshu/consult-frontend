<template>
  <section class="analytics">
    <header class="analytics__hero">
      <div>
        <div class="badge">Аналітика</div>
        <h1 class="title analytics__title">Пульс практики</h1>
        <p class="muted analytics__subtitle">
          Огляд сесій, клієнтів, доходу та групових подій. Дані оновлюються в межах
          останніх {{ rangeLabel }} днів.
        </p>
      </div>
      <RouterLink class="btn btn--ghost" to="/cabinet">Назад до кабінету</RouterLink>
    </header>

    <section class="panel panel--wide analytics-filters">
      <div class="filters-row">
        <div class="filters-field">
          <div class="field-label">Період</div>
          <select v-model="rangePreset" class="input input--select" @change="applyPreset">
            <option value="7">7 днів</option>
            <option value="30">30 днів</option>
            <option value="90">90 днів</option>
            <option value="180">180 днів</option>
            <option value="365">365 днів</option>
            <option value="custom">Кастомний</option>
          </select>
        </div>
        <div v-if="rangePreset === 'custom'" class="filters-field">
          <div class="field-label">Від</div>
          <input v-model="customFrom" type="date" class="input" />
        </div>
        <div v-if="rangePreset === 'custom'" class="filters-field">
          <div class="field-label">До</div>
          <input v-model="customTo" type="date" class="input" />
        </div>
        <div class="filters-actions">
          <button class="btn btn--sm" type="button" :disabled="loading" @click="applyRange">
            Застосувати
          </button>
          <button class="btn btn--ghost btn--sm" type="button" :disabled="loading" @click="resetRange">
            Скинути
          </button>
        </div>
      </div>
      <div class="filters-actions">
        <button class="btn btn--ghost btn--sm" type="button" @click="exportAnalyticsCsv">
          Експорт CSV
        </button>
      </div>
    </section>

    <div v-if="error" class="form-error">{{ error }}</div>
    <div v-if="loading" class="muted" style="margin-top: 12px;">Завантаження...</div>

    <template v-else>
      <section class="panel panel--wide analytics-plan">
        <div class="panel__header">
          <div>
            <div class="badge badge--soft">План</div>
            <h2 class="panel__title">{{ planLabel }}</h2>
          </div>
          <RouterLink class="btn btn--ghost btn--sm" to="/cabinet/billing">Плани та доступ</RouterLink>
        </div>
        <div class="muted">
          <span v-if="isLeader">Leader відкриває глибоку аналітику та прогнози.</span>
          <span v-else-if="isPro">Pro — повний набір базових метрик.</span>
          <span v-else>Аналітика доступна на тарифах Pro та Leader.</span>
        </div>
      </section>

      <section class="panel panel--wide">
        <div class="panel__header">
          <div>
            <div class="badge badge--soft">Огляд</div>
            <h2 class="panel__title">Ключові показники</h2>
          </div>
          <div class="panel__meta">Останні {{ rangeLabel }} днів</div>
        </div>
        <div class="kpi-grid">
          <div class="kpi-card">
            <div class="kpi-label">Сесії</div>
            <div class="kpi-value">{{ totalSessions }}</div>
            <div class="muted">Завершено: {{ completedSessions }}</div>
          </div>
          <div class="kpi-card">
            <div class="kpi-label">Скасовано</div>
            <div class="kpi-value">{{ cancelledSessions }}</div>
            <div class="muted">Рівень: {{ cancelRateLabel }}</div>
          </div>
          <div class="kpi-card">
            <div class="kpi-label">Активні клієнти</div>
            <div class="kpi-value">{{ activeClients }}</div>
            <div class="muted">Нові: {{ newClients }}</div>
            <div class="muted">Неактивні: {{ inactiveClients }} · Архів: {{ archivedClients }}</div>
          </div>
          <div class="kpi-card">
            <div class="kpi-label">Дохід (оцінка)</div>
            <div class="kpi-value">{{ revenueLabel }}</div>
            <div class="muted">Середній чек: {{ averageRevenueLabel }}</div>
            <div v-if="revenueEstimated" class="muted">Оцінка: є сесії без зафіксованої ціни.</div>
          </div>
          <div class="kpi-card">
            <div class="kpi-label">Групові події</div>
            <div class="kpi-value">{{ totalEvents }}</div>
            <div class="muted">Заплановано: {{ upcomingEvents }}</div>
          </div>
          <div class="kpi-card">
            <div class="kpi-label">Повторні клієнти</div>
            <div class="kpi-value">{{ repeatClients }}</div>
            <div class="muted">Конверсія інтрo: {{ introConversionLabel }}</div>
          </div>
        </div>
        <div v-if="!priceConfigured" class="plan-warning">
          Дохід оцінюється приблизно: заповніть ціну у профілі для точніших розрахунків.
        </div>
      </section>

      <section v-if="isPro" class="panel">
        <div class="panel__header">
          <div>
            <div class="badge badge--soft">Сесії</div>
            <h2 class="panel__title">Динаміка та структура</h2>
          </div>
          <div class="panel__meta">Останні 8 тижнів</div>
        </div>
        <div class="sparkline">
          <div
            v-for="week in weeklySessions"
            :key="week.label"
            class="sparkline__bar"
            :style="{ height: `${week.height}%` }"
            :title="`${week.label}: ${week.count}`"
          ></div>
        </div>
        <div class="sparkline__labels">
          <span v-for="week in weeklySessions" :key="week.label">{{ week.label }}</span>
        </div>
      </section>

      <section v-if="isPro" class="panel">
        <div class="panel__header">
          <div>
            <div class="badge badge--soft">Події</div>
            <h2 class="panel__title">Групові івенти</h2>
          </div>
        </div>
        <div class="event-grid">
          <div class="event-card">
            <div class="event-label">Заплановано</div>
            <div class="event-value">{{ upcomingEvents }}</div>
          </div>
          <div class="event-card">
            <div class="event-label">Завершено</div>
            <div class="event-value">{{ completedEvents }}</div>
          </div>
          <div class="event-card">
            <div class="event-label">Скасовано</div>
            <div class="event-value">{{ cancelledEvents }}</div>
          </div>
          <div class="event-card">
            <div class="event-label">Рівень завершення</div>
            <div class="event-value">{{ eventCompletionLabel }}</div>
          </div>
        </div>
      </section>

      <section v-if="isLeader" class="panel panel--wide leader-lab">
        <div class="panel__header">
          <div>
            <div class="badge badge--soft">Leader Lab</div>
            <h2 class="panel__title">Глибокі інсайти</h2>
          </div>
          <div class="panel__meta">Вау-аналітика</div>
        </div>
        <div class="leader-grid">
          <div class="leader-card">
            <div class="leader-label">Прогноз на 30 днів</div>
            <div class="leader-value">{{ forecastLabel }}</div>
            <div class="muted">На базі середнього тижня</div>
          </div>
          <div class="leader-card">
            <div class="leader-label">Retенція</div>
            <div class="leader-value">{{ retentionLabel }}</div>
            <div class="muted">Клієнтів з 2+ сесіями</div>
          </div>
          <div class="leader-card">
            <div class="leader-label">Конверсія інтрo</div>
            <div class="leader-value">{{ introConversionLabel }}</div>
            <div class="muted">Інтрo → регулярні</div>
          </div>
          <div class="leader-card">
            <div class="leader-label">Середній інтервал</div>
            <div class="leader-value">{{ cadenceLabel }}</div>
            <div class="muted">Між сесіями з клієнтом</div>
          </div>
        </div>
        <div class="heatmap">
          <div class="heatmap__title">Пікові години</div>
          <div class="heatmap__grid">
            <div class="heatmap__row heatmap__head">
              <span></span>
              <span>Ранок</span>
              <span>День</span>
              <span>Вечір</span>
            </div>
            <div v-for="row in heatmapRows" :key="row.day" class="heatmap__row">
              <span class="heatmap__day">{{ row.day }}</span>
              <span
                v-for="cell in row.cells"
                :key="cell.key"
                class="heatmap__cell"
                :style="{ '--heat': cell.intensity }"
                :title="cell.label"
              ></span>
            </div>
          </div>
          <div class="muted heatmap__hint">Відображає навантаження за останні {{ rangeLabel }} днів.</div>
        </div>
      </section>

      <section v-if="!isPro" class="panel panel--wide locked">
        <div class="locked__body">
          <div>
            <h2 class="panel__title">Розблокуйте аналітику</h2>
            <p class="muted">
              На тарифі Pro доступні всі базові метрики, а Leader додає глибокі інсайти та прогнозування.
            </p>
          </div>
          <RouterLink class="btn" to="/cabinet/billing">Перейти до планів</RouterLink>
        </div>
      </section>
    </template>
  </section>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { storeToRefs } from 'pinia'
import { useAuthStore } from '../stores/auth'
import { apiGet, fetchSpecialistProfile, type SpecialistProfile } from '../lib/api'
import { toUtcRange } from '../lib/dates'

type Session = {
  id: number
  client: number
  status: 'SCHEDULED' | 'CONFIRMED' | 'COMPLETED' | 'CANCELLED' | string
  type: 'INDIVIDUAL' | 'PAIR' | string
  is_intro: boolean
  slot_start_at: string
  slot_end_at: string
  created_at: string
  price_amount?: string | number | null
  price_currency?: string | null
}

type GroupEvent = {
  id: number
  state: 'DRAFT' | 'SCHEDULED' | 'LIVE' | 'COMPLETED' | 'CANCELLED'
  starts_at: string | null
  ends_at: string | null
}

type ClientState = {
  client: number
  state: 'ACTIVE' | 'INACTIVE' | 'ARCHIVED' | 'CREATED'
}

type AnalyticsSummary = {
  currency: string
  total_revenue: string
  average_revenue: string
  sessions_total: number
  sessions_completed: number
  sessions_cancelled: number
  estimated: boolean
}

const auth = useAuthStore()
const { me } = storeToRefs(auth)
const loading = ref(true)
const error = ref('')
const sessions = ref<Session[]>([])
const events = ref<GroupEvent[]>([])
const clients = ref<ClientState[]>([])
const profilePrice = ref<number | null>(null)
const introPrice = ref<number | null>(null)
const revenueTotal = ref<number | null>(null)
const averageRevenue = ref<number | null>(null)
const revenueCurrency = ref<string>('UAH')
const revenueEstimated = ref(false)
const rangeDays = ref(90)
const rangePreset = ref<'7' | '30' | '90' | '180' | '365' | 'custom'>('90')
const customFrom = ref('')
const customTo = ref('')
const rangeLabel = computed(() => {
  if (rangePreset.value === 'custom') {
    if (customFrom.value && customTo.value) {
      return `${customFrom.value} – ${customTo.value}`
    }
    return 'кастомний період'
  }
  return `${rangeDays.value} днів`
})
const revenueCurrencyLabel = computed(() => revenueCurrency.value || 'UAH')

const plan = computed(() => me.value?.effective_entitlements?.plan || 'START')
const isLeader = computed(() => plan.value === 'LEADER')
const isPro = computed(() => plan.value === 'PRO' || isLeader.value)

const planLabel = computed(() => {
  if (plan.value === 'PRO') return 'Pro'
  if (plan.value === 'LEADER') return 'Leader'
  return 'Start'
})

const activeClients = computed(() => me.value?.counts?.active_clients ?? 0)

const totalSessions = computed(() => sessions.value.length)
const completedSessions = computed(() => sessions.value.filter((s) => s.status === 'COMPLETED').length)
const cancelledSessions = computed(() => sessions.value.filter((s) => s.status === 'CANCELLED').length)

const cancelRateLabel = computed(() => {
  if (!sessions.value.length) return '0%'
  return `${Math.round((cancelledSessions.value / sessions.value.length) * 100)}%`
})

const uniqueClients = computed(() => new Set(sessions.value.map((s) => s.client)).size)
const newClients = computed(() => {
  const byClient = new Map<number, string>()
  sessions.value.forEach((s) => {
    const existing = byClient.get(s.client)
    if (!existing || new Date(s.slot_start_at) < new Date(existing)) {
      byClient.set(s.client, s.slot_start_at)
    }
  })
  const cutoff = new Date()
  cutoff.setDate(cutoff.getDate() - rangeDays.value)
  let count = 0
  byClient.forEach((first) => {
    if (new Date(first) >= cutoff) count += 1
  })
  return count
})

const repeatClients = computed(() => {
  const counter = new Map<number, number>()
  sessions.value
    .filter((s) => s.status === 'COMPLETED')
    .forEach((s) => counter.set(s.client, (counter.get(s.client) || 0) + 1))
  let count = 0
  counter.forEach((value) => {
    if (value >= 2) count += 1
  })
  return count
})

const priceConfigured = computed(() => profilePrice.value !== null || introPrice.value !== null)
const inactiveClients = computed(() => clients.value.filter((c) => c.state === 'INACTIVE').length)
const archivedClients = computed(() => clients.value.filter((c) => c.state === 'ARCHIVED').length)

const revenueLabel = computed(() => formatCurrency(revenueTotal.value))
const averageRevenueLabel = computed(() => formatCurrency(averageRevenue.value))

const totalEvents = computed(() => events.value.length)
const upcomingEvents = computed(() => events.value.filter((e) => e.state === 'SCHEDULED' || e.state === 'LIVE').length)
const completedEvents = computed(() => events.value.filter((e) => e.state === 'COMPLETED').length)
const cancelledEvents = computed(() => events.value.filter((e) => e.state === 'CANCELLED').length)

const eventCompletionLabel = computed(() => {
  if (!events.value.length) return '0%'
  return `${Math.round((completedEvents.value / events.value.length) * 100)}%`
})

const introConversionLabel = computed(() => {
  const introClients = new Set<number>()
  const converted = new Set<number>()
  sessions.value
    .filter((s) => s.status === 'COMPLETED')
    .forEach((s) => {
      if (s.is_intro) introClients.add(s.client)
      if (!s.is_intro && introClients.has(s.client)) converted.add(s.client)
    })
  if (!introClients.size) return '0%'
  return `${Math.round((converted.size / introClients.size) * 100)}%`
})

const retentionLabel = computed(() => {
  if (!uniqueClients.value) return '0%'
  return `${Math.round((repeatClients.value / uniqueClients.value) * 100)}%`
})

const forecastLabel = computed(() => {
  const weekly = weeklySessions.value.reduce((sum, item) => sum + item.revenue, 0)
  if (!weeklySessions.value.length) return '—'
  const avgWeek = weekly / weeklySessions.value.length
  return formatCurrency(avgWeek * 4)
})

const cadenceLabel = computed(() => {
  const byClient = new Map<number, Date[]>()
  sessions.value
    .filter((s) => s.status === 'COMPLETED')
    .forEach((s) => {
      const list = byClient.get(s.client) || []
      list.push(new Date(s.slot_start_at))
      byClient.set(s.client, list)
    })
  let total = 0
  let count = 0
  byClient.forEach((dates) => {
    dates.sort((a, b) => a.getTime() - b.getTime())
    for (let i = 1; i < dates.length; i += 1) {
      total += Math.abs(dates[i].getTime() - dates[i - 1].getTime())
      count += 1
    }
  })
  if (!count) return '—'
  const days = Math.round(total / count / (1000 * 60 * 60 * 24))
  return `${days} дн.`
})

const weeklySessions = computed(() => {
  const weeks: Array<{ label: string; count: number; revenue: number }> = []
  const now = new Date()
  for (let i = 7; i >= 0; i -= 1) {
    const start = new Date(now)
    start.setDate(now.getDate() - i * 7)
    const end = new Date(start)
    end.setDate(start.getDate() + 7)
    const label = `${start.getDate()}.${start.getMonth() + 1}`
    const subset = sessions.value.filter((s) => {
      const dt = new Date(s.slot_start_at)
      return dt >= start && dt < end && s.status === 'COMPLETED'
    })
    const revenue = subset.reduce((sum, s) => sum + resolveSessionRevenue(s), 0)
    weeks.push({ label, count: subset.length, revenue })
  }
  const max = Math.max(...weeks.map((w) => w.count), 1)
  return weeks.map((w) => ({ ...w, height: Math.round((w.count / max) * 100) }))
})

const heatmapRows = computed(() => {
  const days = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Нд']
  const segments = [
    { label: 'Ранок', start: 6, end: 12 },
    { label: 'День', start: 12, end: 18 },
    { label: 'Вечір', start: 18, end: 24 },
  ]
  const counts = Array.from({ length: 7 }, () => Array(3).fill(0))
  sessions.value
    .filter((s) => s.status === 'COMPLETED')
    .forEach((s) => {
      const dt = new Date(s.slot_start_at)
      const day = (dt.getDay() + 6) % 7
      const hour = dt.getHours()
      const segment = segments.findIndex((seg) => hour >= seg.start && hour < seg.end)
      if (segment >= 0) counts[day][segment] += 1
    })
  const max = Math.max(1, ...counts.flat())
  return days.map((day, idx) => ({
    day,
    cells: counts[idx].map((value, segIndex) => ({
      key: `${day}-${segIndex}`,
      intensity: (value / max).toFixed(2),
      label: `${day} · ${segments[segIndex].label}: ${value}`,
    })),
  }))
})

function formatCurrency(value: number | null) {
  if (!value) return '—'
  return new Intl.NumberFormat('uk-UA', {
    style: 'currency',
    currency: revenueCurrencyLabel.value,
    maximumFractionDigits: 0,
  }).format(value)
}

function resolveSessionRevenue(session: Session) {
  if (session.price_amount !== null && session.price_amount !== undefined) {
    return Number(session.price_amount) || 0
  }
  const price = profilePrice.value ?? 0
  const intro = introPrice.value ?? price
  return session.is_intro ? intro : price
}

function buildRangeParams() {
  if (rangePreset.value === 'custom' && customFrom.value && customTo.value) {
    return { date_from: customFrom.value, date_to: customTo.value }
  }
  const now = new Date()
  const from = new Date()
  from.setDate(now.getDate() - rangeDays.value)
  return toUtcRange(from, now)
}

function applyPreset() {
  if (rangePreset.value === 'custom') return
  rangeDays.value = Number(rangePreset.value)
  customFrom.value = ''
  customTo.value = ''
  loadData()
}

function applyRange() {
  if (rangePreset.value !== 'custom') {
    applyPreset()
    return
  }
  if (!customFrom.value || !customTo.value) {
    error.value = 'Оберіть період для фільтра.'
    return
  }
  loadData()
}

function resetRange() {
  rangePreset.value = '90'
  rangeDays.value = 90
  customFrom.value = ''
  customTo.value = ''
  loadData()
}

function escapeCsv(value: string | number | null | undefined) {
  if (value === null || value === undefined) return ''
  const raw = String(value)
  if (/[",\n]/.test(raw)) {
    return `"${raw.replace(/"/g, '""')}"`
  }
  return raw
}

function exportAnalyticsCsv() {
  const lines: string[] = []
  lines.push('Summary')
  lines.push(`range,${escapeCsv(rangeLabel.value)}`)
  lines.push(`sessions_total,${totalSessions.value}`)
  lines.push(`sessions_completed,${completedSessions.value}`)
  lines.push(`sessions_cancelled,${cancelledSessions.value}`)
  lines.push(`active_clients,${activeClients.value}`)
  lines.push(`revenue_total,${revenueTotal.value ?? ''}`)
  lines.push(`revenue_currency,${escapeCsv(revenueCurrencyLabel.value)}`)
  lines.push(`revenue_estimated,${revenueEstimated.value}`)
  lines.push('')

  lines.push('Sessions')
  lines.push('id,slot_start_at,slot_end_at,status,is_intro,price_amount,price_currency,client')
  sessions.value.forEach((session) => {
    lines.push(
      [
        session.id,
        session.slot_start_at,
        session.slot_end_at,
        session.status,
        session.is_intro,
        session.price_amount ?? '',
        session.price_currency ?? '',
        session.client,
      ]
        .map(escapeCsv)
        .join(',')
    )
  })
  lines.push('')

  lines.push('Group events')
  lines.push('id,state,starts_at,ends_at')
  events.value.forEach((event) => {
    lines.push(
      [event.id, event.state, event.starts_at ?? '', event.ends_at ?? '']
        .map(escapeCsv)
        .join(',')
    )
  })
  lines.push('')

  lines.push('Clients')
  lines.push('client,state')
  clients.value.forEach((client) => {
    lines.push([client.client, client.state].map(escapeCsv).join(','))
  })

  const blob = new Blob([lines.join('\n')], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `analytics-${new Date().toISOString().slice(0, 10)}.csv`
  link.click()
  URL.revokeObjectURL(url)
}

async function loadData() {
  loading.value = true
  error.value = ''
  try {
    const range = buildRangeParams()
    const results = await Promise.allSettled([
      apiGet<Session[]>('/booking/sessions/', { params: range }),
      apiGet<GroupEvent[]>('/cabinet/group-events/'),
      apiGet<ClientState[]>('/cabinet/clients/'),
      fetchSpecialistProfile(),
      apiGet<AnalyticsSummary>('/cabinet/analytics/summary/', { params: range }),
    ])
    const sessionResp = results[0]
    const eventResp = results[1]
    const clientResp = results[2]
    const profileResp = results[3] as PromiseSettledResult<SpecialistProfile>
    const summaryResp = results[4]

    if (sessionResp.status === 'fulfilled') {
      sessions.value = sessionResp.value || []
    } else {
      error.value = 'Не вдалося завантажити сесії для аналітики.'
    }

    if (eventResp.status === 'fulfilled') {
      events.value = eventResp.value || []
    }

    if (clientResp.status === 'fulfilled') {
      clients.value = clientResp.value || []
    }

    if (profileResp.status === 'fulfilled') {
      profilePrice.value = profileResp.value?.price ? Number(profileResp.value.price) : null
      introPrice.value = profileResp.value?.intro_price ? Number(profileResp.value.intro_price) : null
    }
    if (summaryResp.status === 'fulfilled') {
      revenueCurrency.value = summaryResp.value.currency || 'UAH'
      revenueTotal.value = Number(summaryResp.value.total_revenue || 0)
      averageRevenue.value = Number(summaryResp.value.average_revenue || 0)
      revenueEstimated.value = Boolean(summaryResp.value.estimated)
    }
  } catch (err: any) {
    error.value = err?.message || 'Не вдалося завантажити аналітику.'
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  loadData()
})
</script>

<style scoped>
.analytics {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.analytics__hero {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 24px;
  flex-wrap: wrap;
}

.analytics__title {
  margin: 8px 0;
}

.analytics__subtitle {
  max-width: 640px;
}

.kpi-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 16px;
  margin-top: 12px;
}

.analytics-filters {
  margin-top: 12px;
}

.filters-row {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  align-items: flex-end;
  justify-content: space-between;
}

.filters-field {
  min-width: 160px;
}

.filters-actions {
  display: flex;
  gap: 8px;
  align-items: center;
}

.field-label {
  font-size: 12px;
  color: #64748b;
  margin-bottom: 4px;
}

.kpi-card {
  border: 1px solid rgba(15, 23, 42, 0.08);
  border-radius: 16px;
  padding: 16px;
  background: #fff;
}

.kpi-label {
  font-size: 13px;
  color: #64748b;
}

.kpi-value {
  font-size: 26px;
  font-weight: 600;
  margin: 8px 0;
}

.sparkline {
  display: grid;
  grid-template-columns: repeat(8, 1fr);
  gap: 8px;
  height: 120px;
  align-items: end;
  margin-top: 16px;
}

.sparkline__bar {
  background: linear-gradient(180deg, #0ea5e9, #38bdf8);
  border-radius: 8px 8px 0 0;
  min-height: 6px;
}

.sparkline__labels {
  display: grid;
  grid-template-columns: repeat(8, 1fr);
  gap: 8px;
  font-size: 12px;
  color: #64748b;
  margin-top: 8px;
}

.event-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
  gap: 12px;
}

.event-card {
  border-radius: 14px;
  padding: 14px;
  background: rgba(15, 118, 110, 0.08);
}

.event-label {
  font-size: 13px;
  color: #0f766e;
}

.event-value {
  font-size: 22px;
  font-weight: 600;
  margin-top: 6px;
}

.leader-lab {
  background: linear-gradient(180deg, rgba(14, 165, 233, 0.08), rgba(59, 130, 246, 0.03));
}

.leader-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 16px;
  margin-bottom: 20px;
}

.leader-card {
  border-radius: 16px;
  padding: 16px;
  background: #fff;
  border: 1px solid rgba(59, 130, 246, 0.1);
}

.leader-label {
  font-size: 12px;
  color: #1e40af;
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

.leader-value {
  font-size: 24px;
  font-weight: 600;
  margin: 6px 0;
}

.heatmap {
  background: #fff;
  border-radius: 16px;
  padding: 16px;
  border: 1px solid rgba(15, 23, 42, 0.08);
}

.heatmap__title {
  font-weight: 600;
  margin-bottom: 12px;
}

.heatmap__grid {
  display: grid;
  gap: 6px;
}

.heatmap__row {
  display: grid;
  grid-template-columns: 60px repeat(3, 1fr);
  gap: 6px;
  align-items: center;
}

.heatmap__head span {
  font-size: 12px;
  color: #64748b;
  text-align: center;
}

.heatmap__day {
  font-size: 12px;
  color: #475569;
}

.heatmap__cell {
  height: 22px;
  border-radius: 6px;
  background: rgba(14, 165, 233, calc(0.15 + var(--heat)));
}

.heatmap__hint {
  margin-top: 10px;
}

.locked {
  border: 1px dashed rgba(148, 163, 184, 0.6);
}

.locked__body {
  display: flex;
  justify-content: space-between;
  gap: 16px;
  align-items: center;
}

@media (max-width: 720px) {
  .analytics__hero {
    flex-direction: column;
    align-items: flex-start;
  }

  .locked__body {
    flex-direction: column;
    align-items: flex-start;
  }
}
</style>
