<template>
  <section class="admin-inbox">
    <header class="admin-inbox__hero panel">
      <div>
        <div class="badge">Адмін</div>
        <h1 class="title admin-inbox__title">Адмінські запити</h1>
        <p class="muted admin-inbox__subtitle">
          Операційна стрічка для запитів, які потребують дій адміністратора.
        </p>
      </div>
      <RouterLink class="btn btn--ghost" to="/admin/billing-access-requests">Запити на доступ до тарифу</RouterLink>
    </header>

    <section class="panel admin-inbox__counters" aria-label="Лічильники inbox">
      <article class="counter-tile">
        <div class="counter-tile__label">Непрочитані</div>
        <div class="counter-tile__value">{{ counters.unread }}</div>
      </article>
      <article class="counter-tile">
        <div class="counter-tile__label">В роботі</div>
        <div class="counter-tile__value">{{ counters.open }}</div>
      </article>
      <article class="counter-tile">
        <div class="counter-tile__label">Усього</div>
        <div class="counter-tile__value">{{ counters.total }}</div>
      </article>
    </section>

    <section class="panel">
      <div class="panel__header">
        <div>
          <div class="badge badge--soft">Фільтри</div>
          <h2 class="panel__title">Вибірка запитів</h2>
        </div>
      </div>

      <div class="admin-inbox__filters">
        <label class="field">
          <span>Статус</span>
          <select v-model="statusFilter" class="input input--select">
            <option value="">Усі статуси</option>
            <option v-for="status in statusOptions" :key="status" :value="status">
              {{ statusLabel(status) }}
            </option>
          </select>
        </label>

        <label class="field">
          <span>Код події</span>
          <select v-model="codeFilter" class="input input--select">
            <option value="">Усі коди</option>
            <option v-for="code in codeOptions" :key="code" :value="code">{{ code }}</option>
          </select>
        </label>

        <label class="field field--checkbox">
          <input v-model="unreadOnly" type="checkbox" />
          <span>Лише непрочитані</span>
        </label>
      </div>
    </section>

    <section class="panel">
      <div class="panel__header">
        <div>
          <div class="badge badge--soft">Список</div>
          <h2 class="panel__title">Операційні елементи</h2>
        </div>
      </div>

      <div v-if="loading" class="muted">Завантаження inbox…</div>
      <div v-else-if="error" class="form-error">{{ error }}</div>
      <EmptyState
        v-else-if="items.length === 0"
        title="Запитів за поточними фільтрами немає"
        description="Змініть фільтри або зачекайте на нові події в admin inbox."
      />

      <div v-else class="admin-inbox__list">
        <article
          v-for="item in items"
          :key="item.id"
          class="inbox-item"
          :class="{ 'inbox-item--active': selectedItemId === item.id }"
        >
          <div class="inbox-item__header">
            <div class="inbox-item__heading">
              <div class="inbox-item__title-row">
                <h3 class="inbox-item__title">{{ item.title || item.code }}</h3>
                <span class="status-pill" :class="statusClass(item.status)">{{ statusLabel(item.status) }}</span>
              </div>
              <div class="muted inbox-item__meta">
                {{ item.code }} · {{ formatDate(item.created_at) }}
                <span v-if="item.created_by"> · {{ actorLabel(item.created_by) }}</span>
              </div>
            </div>
          </div>

          <p class="inbox-item__message">{{ item.message || 'Без додаткового опису.' }}</p>

          <div
            v-if="item.code === 'BILLING_ACCESS_REQUEST_CREATED'"
            class="inbox-item__summary inbox-item__summary--billing"
          >
            <div class="summary-row"><strong>Хто подав:</strong> {{ billingSummary(item).requester }}</div>
            <div class="summary-row"><strong>Поточний план:</strong> {{ billingSummary(item).currentPlan }}</div>
            <div class="summary-row"><strong>Запитаний план:</strong> {{ billingSummary(item).requestedPlan }}</div>
            <div class="summary-row"><strong>Створено:</strong> {{ formatDate(billingSummary(item).createdAt) }}</div>
          </div>

          <div v-else-if="relatedSummary(item)" class="inbox-item__summary">
            {{ relatedSummary(item) }}
          </div>

          <div class="inbox-item__actions">
            <RouterLink class="btn btn--ghost btn--sm" :to="`/admin/inbox/${item.id}`">Відкрити запит</RouterLink>
            <RouterLink
              v-if="billingRequestRoute(item)"
              class="btn btn--ghost btn--sm"
              :to="billingRequestRoute(item)"
            >
              Відкрити опрацювання запиту
            </RouterLink>
            <RouterLink
              v-if="specialistDetailRoute(item)"
              class="btn btn--ghost btn--sm"
              :to="specialistDetailRoute(item)"
            >
              Відкрити деталку спеціаліста
            </RouterLink>
            <button
              v-if="canMarkRead(item)"
              class="btn btn--ghost btn--sm"
              type="button"
              :disabled="isActionPending(item.id, 'read')"
              @click="runAction(item.id, 'read')"
            >
              {{ isActionPending(item.id, 'read') ? 'Оновлюємо…' : 'Позначити як прочитане' }}
            </button>
            <button
              v-if="canStart(item)"
              class="btn btn--ghost btn--sm"
              type="button"
              :disabled="isActionPending(item.id, 'start')"
              @click="runAction(item.id, 'start')"
            >
              {{ isActionPending(item.id, 'start') ? 'Оновлюємо…' : 'Взяти в роботу' }}
            </button>
            <button
              v-if="canResolve(item)"
              class="btn btn--ghost btn--sm"
              type="button"
              :disabled="isActionPending(item.id, 'resolve')"
              @click="runAction(item.id, 'resolve')"
            >
              {{ isActionPending(item.id, 'resolve') ? 'Оновлюємо…' : 'Вирішено' }}
            </button>
            <button
              v-if="canDismiss(item)"
              class="btn btn--ghost btn--sm"
              type="button"
              :disabled="isActionPending(item.id, 'dismiss')"
              @click="runAction(item.id, 'dismiss')"
            >
              {{ isActionPending(item.id, 'dismiss') ? 'Оновлюємо…' : 'Відхилити' }}
            </button>
          </div>
        </article>
      </div>
    </section>

    <section v-if="selectedItem" class="panel">
      <div class="panel__header">
        <div>
          <div class="badge badge--soft">Деталі</div>
          <h2 class="panel__title">Запит #{{ selectedItem.id }}</h2>
        </div>
        <RouterLink class="btn btn--ghost btn--sm" to="/admin/inbox">Закрити</RouterLink>
      </div>
      <div class="admin-inbox__detail">
        <div><strong>Заголовок:</strong> {{ selectedItem.title || '—' }}</div>
        <div><strong>Код:</strong> {{ selectedItem.code || '—' }}</div>
        <div><strong>Статус:</strong> {{ statusLabel(selectedItem.status) }}</div>
        <div><strong>Створено:</strong> {{ formatDate(selectedItem.created_at) }}</div>
        <div><strong>Повідомлення:</strong> {{ selectedItem.message || '—' }}</div>
        <RouterLink
          v-if="billingRequestRoute(selectedItem)"
          class="btn btn--ghost btn--sm"
          :to="billingRequestRoute(selectedItem)"
        >
          Перейти до опрацювання запиту
        </RouterLink>
      </div>
    </section>
  </section>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter, type LocationQuery, type LocationQueryRaw } from 'vue-router'
import EmptyState from '../components/EmptyState.vue'
import { useToast } from '../composables/useToast'
import {
  dismissAdminInboxItem,
  fetchAdminInbox,
  fetchAdminInboxItem,
  getApiErrorMessage,
  markAdminInboxItemRead,
  resolveAdminInboxItem,
  startAdminInboxItem,
  type AdminInboxActor,
  type AdminInboxItem,
  type AdminInboxListFilters,
  type AdminInboxListResponse,
} from '../lib/api'
import { formatUkDateTimeCompact } from '../lib/dateTime'

type InboxAction = 'read' | 'start' | 'resolve' | 'dismiss'

type BillingSummary = {
  requester: string
  currentPlan: string
  requestedPlan: string
  createdAt: string | null
}

const route = useRoute()
const router = useRouter()
const toast = useToast()

const loading = ref(false)
const error = ref('')
const listResponse = ref<AdminInboxListResponse | null>(null)
const items = ref<AdminInboxItem[]>([])
const selectedItem = ref<AdminInboxItem | null>(null)
const actionPending = ref<Record<number, Partial<Record<InboxAction, boolean>>>>({})
const allowedStatusFilters = ['NEW', 'IN_PROGRESS', 'RESOLVED', 'DISMISSED'] as const
type InboxStatusFilter = (typeof allowedStatusFilters)[number]

const statusFilter = ref(readStatusQuery(route.query))
const codeFilter = ref(readCodeQuery(route.query))
const unreadOnly = ref(readUnreadOnlyQuery(route.query))
const applyingRouteQuery = ref(false)

const selectedItemId = computed(() => {
  const rawId = Number(route.params.id)
  return Number.isFinite(rawId) && rawId > 0 ? rawId : null
})

const counters = computed(() => {
  const total = Number.isFinite(Number(listResponse.value?.count)) ? Number(listResponse.value?.count) : items.value.length
  const unread = Number.isFinite(Number(listResponse.value?.unread_count)) ? Number(listResponse.value?.unread_count) : 0
  const open = Number.isFinite(Number(listResponse.value?.open_count)) ? Number(listResponse.value?.open_count) : 0
  return { total, unread, open }
})

const statusOptions = computed(() => {
  const fromItems = items.value
    .map((item) => normalizeStatus(item.status))
    .filter((item): item is string => Boolean(item))
  const fromFilters = statusFilter.value ? [statusFilter.value] : []
  return Array.from(new Set([...allowedStatusFilters, ...fromItems, ...fromFilters])).sort()
})

const codeOptions = computed(() => {
  return Array.from(new Set(items.value.map((item) => String(item.code || '')).filter(Boolean))).sort()
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
  const normalized = normalizeStatusFilterValue(raw)
  return normalized
}

function normalizeStatusFilterValue(raw: string) {
  const normalized = normalizeStatus(raw)
  if (normalized === 'UNREAD') return 'NEW'
  if (normalized === 'OPEN') return 'IN_PROGRESS'
  return allowedStatusFilters.includes(normalized as InboxStatusFilter) ? normalized : ''
}

function readCodeQuery(query: LocationQuery) {
  const raw = firstQueryValue(query.code)
  return typeof raw === 'string' ? raw.trim() : ''
}

function readUnreadOnlyQuery(query: LocationQuery) {
  const raw = firstQueryValue(query.unread_only)
  return typeof raw === 'string' && ['1', 'true', 'yes', 'on'].includes(raw.trim().toLowerCase())
}

function buildInboxFiltersFromQuery(query: LocationQuery): AdminInboxListFilters {
  const filters: AdminInboxListFilters = {}
  const status = readStatusQuery(query)
  const code = readCodeQuery(query)
  const unreadOnlyValue = readUnreadOnlyQuery(query)

  if (status) filters.status = status as InboxStatusFilter
  if (code) filters.code = code
  if (unreadOnlyValue) filters.unread_only = true
  return filters
}

function buildQueryFromFilters() {
  const nextQuery: LocationQueryRaw = { ...route.query }

  if (statusFilter.value) nextQuery.status = statusFilter.value
  else delete nextQuery.status

  if (codeFilter.value) nextQuery.code = codeFilter.value
  else delete nextQuery.code

  if (unreadOnly.value) nextQuery.unread_only = '1'
  else delete nextQuery.unread_only

  return nextQuery
}

function areManagedQueriesEqual(query: LocationQuery, nextQuery: LocationQueryRaw) {
  const currentStatus = readStatusQuery(query)
  const nextStatus = readStatusQuery(nextQuery as LocationQuery)
  if (currentStatus !== nextStatus) return false

  const currentCode = readCodeQuery(query)
  const nextCode = readCodeQuery(nextQuery as LocationQuery)
  if (currentCode !== nextCode) return false

  const currentUnreadOnly = readUnreadOnlyQuery(query)
  const nextUnreadOnly = readUnreadOnlyQuery(nextQuery as LocationQuery)
  return currentUnreadOnly === nextUnreadOnly
}

function isUnreadStatus(status: string | null | undefined) {
  const normalized = normalizeStatus(status)
  return normalized === 'UNREAD' || normalized === 'NEW'
}

function statusLabel(status: string | null | undefined) {
  const normalized = normalizeStatus(status)
  if (normalized === 'UNREAD' || normalized === 'NEW') return 'Непрочитано'
  if (normalized === 'OPEN' || normalized === 'IN_PROGRESS') return 'В роботі'
  if (normalized === 'RESOLVED' || normalized === 'DONE') return 'Вирішено'
  if (normalized === 'DISMISSED' || normalized === 'CLOSED') return 'Відхилено'
  return status || '—'
}

function statusClass(status: string | null | undefined) {
  const normalized = normalizeStatus(status)
  if (normalized === 'OPEN' || normalized === 'IN_PROGRESS') return 'status-pill--warn'
  if (normalized === 'RESOLVED' || normalized === 'DONE') return 'status-pill--ok'
  if (normalized === 'DISMISSED' || normalized === 'CLOSED') return 'status-pill--danger'
  return 'status-pill--muted'
}

function formatDate(value: string | null | undefined) {
  return formatUkDateTimeCompact(value)
}

function actorLabel(actor: AdminInboxActor | null | undefined) {
  if (!actor) return '—'
  return actor.display_name || actor.full_name || actor.username || actor.email || '—'
}

function relatedPayload(item: AdminInboxItem) {
  return item.payload || item.data || item.metadata || {}
}

function pickText(payload: Record<string, unknown>, keys: string[], fallback = '—') {
  for (const key of keys) {
    const value = payload[key]
    if (typeof value === 'string' && value.trim()) return value.trim()
    if (typeof value === 'number' && Number.isFinite(value)) return String(value)
  }
  return fallback
}

function pickNumber(payload: Record<string, unknown>, keys: string[]) {
  for (const key of keys) {
    const value = payload[key]
    if (typeof value === 'number' && Number.isInteger(value) && value > 0) return value
    if (typeof value === 'string' && /^\\d+$/.test(value.trim())) return Number(value.trim())
    if (value && typeof value === 'object' && 'id' in value) {
      const idValue = (value as { id?: unknown }).id
      if (typeof idValue === 'number' && Number.isInteger(idValue) && idValue > 0) return idValue
      if (typeof idValue === 'string' && /^\\d+$/.test(idValue.trim())) return Number(idValue.trim())
    }
  }
  return null
}

function billingSummary(item: AdminInboxItem): BillingSummary {
  const payload = relatedPayload(item)
  const requester =
    actorLabel(item.created_by) !== '—'
      ? actorLabel(item.created_by)
      : pickText(payload, [
          'specialist_display_name',
          'user_display_name',
          'requester_name',
          'requested_by_name',
          'specialist_name',
          'therapist_name',
          'user_name',
          'specialist_email',
          'user_email',
        ])
  return {
    requester,
    currentPlan: pickText(payload, ['current_plan_label', 'current_plan', 'from_plan', 'active_plan'], 'Не вказано'),
    requestedPlan: pickText(payload, ['requested_plan_label', 'requested_plan', 'target_plan', 'plan'], 'Не вказано'),
    createdAt: pickText(payload, ['created_at', 'request_created_at'], item.created_at) || item.created_at,
  }
}

function billingRequestId(item: AdminInboxItem) {
  if (item.code !== 'BILLING_ACCESS_REQUEST_CREATED') return null

  const payload = relatedPayload(item)
  const fromPayload = pickNumber(payload, [
    'billing_access_request_id',
    'billing_request_id',
    'request_id',
    'target_id',
    'billing_access_request',
    'request',
  ])
  if (fromPayload) return fromPayload

  const related = item.related_object
  if (related && typeof related === 'object') {
    const relatedType = String(related.type || related.code || '').trim().toUpperCase()
    const relatedId =
      typeof related.id === 'number'
        ? related.id
        : typeof related.id === 'string' && /^\\d+$/.test(related.id.trim())
          ? Number(related.id.trim())
          : null
    if (relatedId && (!relatedType || relatedType.includes('BILLING_ACCESS_REQUEST'))) {
      return relatedId
    }
  }

  return null
}

function billingRequestRoute(item: AdminInboxItem) {
  const requestId = billingRequestId(item)
  if (!requestId) return ''
  return `/admin/billing-access-requests/${requestId}`
}

function specialistIdFromPayload(payload: Record<string, unknown>) {
  return pickNumber(payload, [
    'specialist_id',
    'therapist_id',
    'user_id',
    'subject_id',
    'target_user_id',
    'requested_by_user_id',
  ])
}

function specialistDetailRoute(item: AdminInboxItem) {
  const payload = relatedPayload(item)
  const specialistId = specialistIdFromPayload(payload)
  if (specialistId) return `/admin/specialists/${specialistId}`
  return ''
}

function relatedSummary(item: AdminInboxItem) {
  const related = item.related_object
  if (!related || typeof related !== 'object') return ''
  const title = typeof related.title === 'string' ? related.title : typeof related.name === 'string' ? related.name : ''
  const status = typeof related.status === 'string' ? related.status : ''
  const summary = typeof related.summary === 'string' ? related.summary : ''
  const parts = [summary, title, status].filter((part) => typeof part === 'string' && part.trim())
  return parts.join(' · ')
}

function isActionPending(itemId: number, action: InboxAction) {
  return Boolean(actionPending.value[itemId]?.[action])
}

function setActionPending(itemId: number, action: InboxAction, value: boolean) {
  const next = { ...actionPending.value }
  const current = { ...(next[itemId] || {}) }
  current[action] = value
  if (!current.read && !current.start && !current.resolve && !current.dismiss) {
    delete next[itemId]
  } else {
    next[itemId] = current
  }
  actionPending.value = next
}

function canMarkRead(item: AdminInboxItem) {
  return isUnreadStatus(item.status)
}

function canStart(item: AdminInboxItem) {
  const status = normalizeStatus(item.status)
  return status !== 'OPEN' && status !== 'IN_PROGRESS' && status !== 'RESOLVED' && status !== 'DONE' && status !== 'DISMISSED'
}

function canResolve(item: AdminInboxItem) {
  const status = normalizeStatus(item.status)
  return status !== 'RESOLVED' && status !== 'DONE' && status !== 'DISMISSED'
}

function canDismiss(item: AdminInboxItem) {
  const status = normalizeStatus(item.status)
  return status !== 'DISMISSED' && status !== 'RESOLVED' && status !== 'DONE'
}

async function loadInbox(filters: AdminInboxListFilters = {}) {
  loading.value = true
  error.value = ''
  try {
    const response = await fetchAdminInbox(filters)
    listResponse.value = response
    const resolved = Array.isArray(response.results)
      ? response.results
      : Array.isArray(response.items)
        ? response.items
        : []
    items.value = resolved
      .slice()
      .sort((a, b) => new Date(b.created_at || '').getTime() - new Date(a.created_at || '').getTime())
  } catch (err) {
    error.value = getApiErrorMessage(err, 'Не вдалося завантажити адмінські запити.')
    items.value = []
    listResponse.value = null
  } finally {
    loading.value = false
  }
}

async function loadSelectedItem(itemId: number | null) {
  if (!itemId) {
    selectedItem.value = null
    return
  }
  try {
    selectedItem.value = await fetchAdminInboxItem(itemId)
  } catch {
    selectedItem.value = null
  }
}

async function runAction(itemId: number, action: InboxAction) {
  setActionPending(itemId, action, true)
  try {
    if (action === 'read') await markAdminInboxItemRead(itemId)
    if (action === 'start') await startAdminInboxItem(itemId)
    if (action === 'resolve') await resolveAdminInboxItem(itemId)
    if (action === 'dismiss') await dismissAdminInboxItem(itemId)
    await loadInbox(buildInboxFiltersFromQuery(route.query))
    if (selectedItemId.value) {
      await loadSelectedItem(selectedItemId.value)
    }
    toast.success('Статус запиту оновлено.')
  } catch (err) {
    toast.error(getApiErrorMessage(err, 'Не вдалося оновити статус запиту.'))
  } finally {
    setActionPending(itemId, action, false)
  }
}

watch(
  () => selectedItemId.value,
  async (itemId) => {
    await loadSelectedItem(itemId)
  }
)

watch(
  () => route.query,
  async (query) => {
    applyingRouteQuery.value = true
    statusFilter.value = readStatusQuery(query)
    codeFilter.value = readCodeQuery(query)
    unreadOnly.value = readUnreadOnlyQuery(query)
    applyingRouteQuery.value = false

    await loadInbox(buildInboxFiltersFromQuery(query))
  },
  { immediate: true }
)

watch([statusFilter, codeFilter, unreadOnly], async () => {
  if (applyingRouteQuery.value) return
  const nextQuery = buildQueryFromFilters()
  if (areManagedQueriesEqual(route.query, nextQuery)) return
  await router.push({ path: route.path, query: nextQuery })
})

onMounted(async () => {
  await loadSelectedItem(selectedItemId.value)
})
</script>

<style scoped>
.admin-inbox {
  display: grid;
  gap: 16px;
}

.admin-inbox__hero {
  background: linear-gradient(135deg, rgba(8, 113, 201, 0.14), rgba(7, 47, 71, 0.06));
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
}

.admin-inbox__title {
  margin: 0;
}

.admin-inbox__subtitle {
  margin: 6px 0 0;
}

.admin-inbox__counters {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 12px;
}

.counter-tile {
  border: 1px solid var(--line);
  border-radius: var(--radius-md);
  background: #fff;
  padding: 12px;
  display: grid;
  gap: 4px;
}

.counter-tile__label {
  color: var(--muted);
  font-size: 13px;
}

.counter-tile__value {
  font-size: 28px;
  font-weight: 700;
  line-height: 1;
}

.admin-inbox__filters {
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

.admin-inbox__list {
  display: grid;
  gap: 12px;
}

.inbox-item {
  border: 1px solid var(--line);
  border-radius: var(--radius-md);
  padding: 12px;
  display: grid;
  gap: 10px;
}

.inbox-item--active {
  border-color: color-mix(in srgb, var(--primary) 45%, var(--line));
  box-shadow: inset 0 0 0 1px color-mix(in srgb, var(--primary) 12%, transparent);
}

.inbox-item__title-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  flex-wrap: wrap;
}

.inbox-item__title {
  margin: 0;
  font-size: 18px;
}

.inbox-item__meta {
  margin-top: 4px;
}

.inbox-item__message {
  margin: 0;
  white-space: pre-wrap;
}

.inbox-item__summary {
  border: 1px solid color-mix(in srgb, var(--primary) 20%, var(--line));
  border-radius: var(--radius-sm);
  background: color-mix(in srgb, var(--primary) 5%, #ffffff);
  padding: 10px;
  display: grid;
  gap: 4px;
}

.inbox-item__summary--billing {
  border-color: color-mix(in srgb, #1f7a4c 35%, var(--line));
  background: color-mix(in srgb, #1f7a4c 7%, #ffffff);
}

.summary-row {
  font-size: 14px;
}

.inbox-item__actions {
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

.admin-inbox__detail {
  display: grid;
  gap: 8px;
}

.form-error {
  color: #b3261e;
  background: #fdecea;
  border: 1px solid #f5c2c0;
  border-radius: var(--radius-sm);
  padding: 8px 10px;
}

@media (max-width: 840px) {
  .admin-inbox__hero {
    flex-direction: column;
    align-items: flex-start;
  }

  .admin-inbox__counters {
    grid-template-columns: 1fr;
  }
}
</style>
