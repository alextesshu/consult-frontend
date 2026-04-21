<template>
  <section class="admin-billing-requests">
    <header class="admin-billing-requests__hero panel">
      <div>
        <div class="badge">Адмін</div>
        <h1 class="title admin-billing-requests__title">Запити на доступ до тарифу</h1>
        <p class="muted admin-billing-requests__subtitle">
          Операційний список запитів на зміну тарифу з переходом до екрана опрацювання.
        </p>
      </div>
      <RouterLink class="btn btn--ghost" to="/admin/inbox">Назад до inbox</RouterLink>
    </header>

    <section class="panel">
      <div class="panel__header">
        <div>
          <div class="badge badge--soft">Фільтри</div>
          <h2 class="panel__title">Вибірка</h2>
        </div>
      </div>

      <div class="admin-billing-requests__filters">
        <label class="field">
          <span>Статус</span>
          <select v-model="statusFilter" class="input input--select">
            <option value="">Усі статуси</option>
            <option v-for="status in statusOptions" :key="status" :value="status">
              {{ statusLabel(status) }}
            </option>
          </select>
        </label>

        <label class="field field--checkbox">
          <input v-model="openInboxOnly" type="checkbox" />
          <span>Лише з відкритими inbox item</span>
        </label>
      </div>
    </section>

    <section class="panel">
      <div class="panel__header">
        <div>
          <div class="badge badge--soft">Список</div>
          <h2 class="panel__title">Список запитів</h2>
        </div>
      </div>

      <div v-if="loading" class="muted">Завантаження billing-запитів…</div>
      <div v-else-if="error" class="form-error">{{ error }}</div>
      <EmptyState
        v-else-if="requests.length === 0"
        title="Запитів за поточними фільтрами немає"
        description="Спробуйте змінити фільтри або поверніться пізніше."
      />

      <div v-else class="admin-billing-requests__list">
        <article v-for="request in requests" :key="request.id" class="request-card">
          <div class="request-card__header">
            <div>
              <h3 class="request-card__title">Запит №{{ request.id }}</h3>
              <div class="muted">
                {{ formatDate(request.created_at) }}
                <span v-if="request.updated_at"> · Оновлено: {{ formatDate(request.updated_at) }}</span>
              </div>
            </div>
            <span class="status-pill" :class="statusClass(request.status)">{{ statusLabel(request.status) }}</span>
          </div>

          <div class="request-card__grid">
            <div><strong>Користувач:</strong> {{ userSummary(request) }}</div>
            <div><strong>Спеціаліст:</strong> {{ specialistSummary(request) }}</div>
            <div><strong>Поточний тариф:</strong> {{ planDisplay(request, 'current') }}</div>
            <div><strong>Запитаний тариф:</strong> {{ planDisplay(request, 'requested') }}</div>
          </div>

          <div class="request-card__summary">
            <div><strong>Коротко:</strong> {{ requestSummary(request) }}</div>
            <div><strong>Inbox:</strong> {{ inboxRelationSummary(request.inbox_relation) }}</div>
          </div>

          <div class="request-card__actions">
            <RouterLink class="btn btn--ghost btn--sm" :to="`/admin/billing-access-requests/${request.id}`">
              Відкрити деталі
            </RouterLink>
          </div>
        </article>
      </div>
    </section>
  </section>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useRoute, useRouter, type LocationQuery, type LocationQueryRaw } from 'vue-router'
import EmptyState from '../components/EmptyState.vue'
import {
  fetchAdminBillingAccessRequests,
  getApiErrorMessage,
  type AdminBillingAccessRequest,
  type AdminBillingAccessRequestListFilters,
  type AdminBillingAccessRequestInboxRelation,
} from '../lib/api'
import { formatUkDateTimeCompact } from '../lib/dateTime'

const route = useRoute()
const router = useRouter()

const loading = ref(false)
const error = ref('')
const requests = ref<AdminBillingAccessRequest[]>([])
const allowedStatusFilters = ['PENDING', 'APPROVED', 'REJECTED'] as const
type BillingRequestStatusFilter = (typeof allowedStatusFilters)[number]

const statusFilter = ref(readStatusQuery(route.query))
const openInboxOnly = ref(readOpenInboxOnlyQuery(route.query))
const applyingRouteQuery = ref(false)

const statusOptions = computed(() => {
  const fromItems = requests.value
    .map((item) => normalizeStatus(item.status))
    .filter((item): item is string => Boolean(item))
  const fromFilters = statusFilter.value ? [statusFilter.value] : []
  return Array.from(new Set([...allowedStatusFilters, ...fromItems, ...fromFilters])).sort()
})

function normalizeStatus(status: string | null | undefined) {
  return String(status || '').trim().toUpperCase()
}

function firstQueryValue(value: unknown) {
  if (Array.isArray(value)) return value[0]
  return value
}

function readStatusQuery(query: LocationQuery) {
  const raw = firstQueryValue(query.status)
  if (typeof raw !== 'string') return ''
  const normalized = normalizeStatus(raw)
  return allowedStatusFilters.includes(normalized as BillingRequestStatusFilter) ? normalized : ''
}

function readOpenInboxOnlyQuery(query: LocationQuery) {
  const raw = firstQueryValue(query.open_inbox_only)
  return typeof raw === 'string' && ['1', 'true', 'yes', 'on'].includes(raw.trim().toLowerCase())
}

function buildBillingFiltersFromQuery(query: LocationQuery): AdminBillingAccessRequestListFilters {
  const filters: AdminBillingAccessRequestListFilters = {}
  const status = readStatusQuery(query)
  const openInboxOnlyValue = readOpenInboxOnlyQuery(query)

  if (status) filters.status = status as BillingRequestStatusFilter
  if (openInboxOnlyValue) filters.open_inbox_only = true
  return filters
}

function buildQueryFromFilters() {
  const nextQuery: LocationQueryRaw = { ...route.query }

  if (statusFilter.value) nextQuery.status = statusFilter.value
  else delete nextQuery.status

  if (openInboxOnly.value) nextQuery.open_inbox_only = '1'
  else delete nextQuery.open_inbox_only

  return nextQuery
}

function areManagedQueriesEqual(query: LocationQuery, nextQuery: LocationQueryRaw) {
  const currentStatus = readStatusQuery(query)
  const nextStatus = readStatusQuery(nextQuery as LocationQuery)
  if (currentStatus !== nextStatus) return false

  const currentOpenOnly = readOpenInboxOnlyQuery(query)
  const nextOpenOnly = readOpenInboxOnlyQuery(nextQuery as LocationQuery)
  return currentOpenOnly === nextOpenOnly
}

function statusLabel(status: string | null | undefined) {
  const normalized = normalizeStatus(status)
  if (normalized === 'PENDING') return 'Очікує рішення'
  if (normalized === 'APPROVED') return 'Погоджено'
  if (normalized === 'REJECTED') return 'Відхилено'
  return status || '—'
}

function statusClass(status: string | null | undefined) {
  const normalized = normalizeStatus(status)
  if (normalized === 'PENDING') return 'status-pill--warn'
  if (normalized === 'APPROVED') return 'status-pill--ok'
  if (normalized === 'REJECTED') return 'status-pill--danger'
  return 'status-pill--muted'
}

function formatDate(value: string | null | undefined) {
  return formatUkDateTimeCompact(value)
}

function userSummary(request: AdminBillingAccessRequest) {
  const user = request.user
  if (!user) return 'Немає даних'
  const name = String(user.display_name || '').trim()
  const email = String(user.email || '').trim()
  if (name && email) return `${name} (${email})`
  if (name) return name
  if (email) return email
  return 'Немає даних'
}

function specialistSummary(request: AdminBillingAccessRequest) {
  const specialist = request.specialist
  if (!specialist) return 'Немає даних'

  const parts = [
    String(specialist.display_name || '').trim(),
    specialist.username ? `@${String(specialist.username).trim()}` : '',
    specialist.public_slug ? `/${String(specialist.public_slug).trim()}` : '',
  ].filter(Boolean)
  if (parts.length > 0) return parts.join(' · ')

  const email = String(specialist.email || '').trim()
  return email || 'Немає даних'
}

function planDisplay(request: AdminBillingAccessRequest, kind: 'current' | 'requested') {
  const label =
    kind === 'current'
      ? String(request.current_plan_label || '').trim()
      : String(request.requested_plan_label || '').trim()
  if (label) return label

  const codeCandidate =
    kind === 'current'
      ? request.current_plan || request.plans?.current_plan
      : request.requested_plan || request.plans?.requested_plan
  const code = String(codeCandidate || '').trim().toUpperCase()
  return code || 'Не вказано'
}

function requestSummary(request: AdminBillingAccessRequest) {
  return `Тариф ${planDisplay(request, 'current')} → ${planDisplay(request, 'requested')}`
}

function relationLinkedItems(relation: AdminBillingAccessRequestInboxRelation | null | undefined) {
  if (!relation) return []
  if (Array.isArray(relation.linked_items)) return relation.linked_items
  if (Array.isArray(relation.items)) return relation.items
  return []
}

function inboxRelationSummary(relation: AdminBillingAccessRequestInboxRelation | null | undefined) {
  if (!relation) return 'Звʼязок із inbox item не вказано.'

  const linkedCount = Number(relation.linked_items_count)
  const openCount = Number(relation.open_items_count)
  const linked = Number.isFinite(linkedCount) ? linkedCount : relationLinkedItems(relation).length
  const open = Number.isFinite(openCount)
    ? openCount
    : relationLinkedItems(relation).filter((item) => String(item.status || '').trim().toUpperCase() === 'OPEN').length

  if (linked <= 0) return 'Повʼязаних inbox item немає.'
  if (open > 0) return `Повʼязано: ${linked}. Відкриті: ${open}.`
  return `Повʼязано: ${linked}. Відкритих немає.`
}

async function loadRequests(filters: AdminBillingAccessRequestListFilters = {}) {
  loading.value = true
  error.value = ''
  try {
    const response = await fetchAdminBillingAccessRequests(filters)
    const resolved = Array.isArray(response.results)
      ? response.results
      : Array.isArray(response.items)
        ? response.items
        : []
    requests.value = resolved
      .slice()
      .sort((a, b) => new Date(b.created_at || '').getTime() - new Date(a.created_at || '').getTime())
  } catch (err) {
    error.value = getApiErrorMessage(err, 'Не вдалося завантажити billing-запити.')
    requests.value = []
  } finally {
    loading.value = false
  }
}

watch(
  () => route.query,
  async (query) => {
    applyingRouteQuery.value = true
    statusFilter.value = readStatusQuery(query)
    openInboxOnly.value = readOpenInboxOnlyQuery(query)
    applyingRouteQuery.value = false

    await loadRequests(buildBillingFiltersFromQuery(query))
  },
  { immediate: true }
)

watch([statusFilter, openInboxOnly], async () => {
  if (applyingRouteQuery.value) return
  const nextQuery = buildQueryFromFilters()
  if (areManagedQueriesEqual(route.query, nextQuery)) return
  await router.push({ path: route.path, query: nextQuery })
})
</script>

<style scoped>
.admin-billing-requests {
  display: grid;
  gap: 16px;
}

.admin-billing-requests__hero {
  background: linear-gradient(135deg, rgba(8, 113, 201, 0.14), rgba(7, 47, 71, 0.06));
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.admin-billing-requests__title {
  margin: 0;
}

.admin-billing-requests__subtitle {
  margin: 6px 0 0;
}

.panel {
  border: 1px solid var(--line);
  border-radius: 18px;
  padding: 18px;
  background: #fff;
  display: grid;
  gap: 14px;
}

.panel__header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
}

.panel__title {
  margin: 0;
  font-family: var(--font-display);
  font-size: 22px;
}

.badge--soft {
  background: rgba(8, 113, 201, 0.12);
}

.admin-billing-requests__filters {
  display: grid;
  gap: 12px;
  grid-template-columns: repeat(auto-fit, minmax(210px, 1fr));
  align-items: end;
}

.field--checkbox {
  display: flex;
  gap: 8px;
  align-items: center;
  min-height: 44px;
}

.admin-billing-requests__list {
  display: grid;
  gap: 12px;
}

.request-card {
  border: 1px solid var(--line);
  border-radius: var(--radius-md);
  padding: 12px;
  display: grid;
  gap: 10px;
}

.request-card__header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 10px;
}

.request-card__title {
  margin: 0;
  font-size: 18px;
}

.request-card__grid {
  display: grid;
  gap: 8px;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
}

.request-card__summary {
  border: 1px solid color-mix(in srgb, var(--primary) 20%, var(--line));
  border-radius: var(--radius-sm);
  background: color-mix(in srgb, var(--primary) 5%, #ffffff);
  padding: 10px;
  display: grid;
  gap: 4px;
}

.request-card__actions {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.status-pill {
  width: fit-content;
  padding: 6px 10px;
  border-radius: var(--radius-sm);
  font-size: 12px;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.status-pill--ok {
  background: rgba(31, 122, 76, 0.18);
  color: #1f7a4c;
}

.status-pill--warn {
  background: rgba(176, 123, 16, 0.18);
  color: #8b5f00;
}

.status-pill--danger {
  background: rgba(194, 75, 75, 0.18);
  color: #a03838;
}

.status-pill--muted {
  background: rgba(109, 117, 139, 0.14);
  color: #4b5563;
}

.form-error {
  color: #b3261e;
  background: #fdecea;
  border: 1px solid #f5c2c0;
  border-radius: var(--radius-sm);
  padding: 8px 10px;
}

@media (max-width: 860px) {
  .admin-billing-requests__hero {
    flex-direction: column;
    align-items: flex-start;
  }
}
</style>
