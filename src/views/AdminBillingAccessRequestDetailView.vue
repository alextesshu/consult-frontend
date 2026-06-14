<template>
  <section class="admin-billing-request-detail">
    <header class="admin-billing-request-detail__hero panel">
      <div>
        <div class="badge">Адмін</div>
        <h1 class="title admin-billing-request-detail__title">Опрацювання запиту на тариф</h1>
        <p class="muted admin-billing-request-detail__subtitle">
          Повний контекст запиту та дії для прийняття рішення.
        </p>
      </div>
      <div class="admin-billing-request-detail__hero-actions">
        <RouterLink
          v-if="specialistDetailRoute"
          class="btn btn--ghost"
          :to="specialistDetailRoute"
        >
          Деталка спеціаліста
        </RouterLink>
        <RouterLink class="btn btn--ghost" to="/admin/billing-access-requests">До списку</RouterLink>
        <RouterLink class="btn btn--ghost" to="/admin/inbox">До адмін-запитів</RouterLink>
      </div>
    </header>

    <div v-if="loading" class="muted">Завантаження запиту на тариф…</div>
    <div v-else-if="error" class="form-error">{{ error }}</div>

    <template v-else-if="request">
      <section class="panel">
        <div class="panel__header">
          <div>
            <div class="badge badge--soft">Зведення</div>
            <h2 class="panel__title">Запит №{{ request.id }}</h2>
          </div>
          <span class="status-pill" :class="statusClass(request.status)">{{ statusLabel(request.status) }}</span>
        </div>

        <div class="summary-grid">
          <div>
            <div class="muted">Користувач</div>
            <div>{{ userSummary }}</div>
          </div>
          <div>
            <div class="muted">Спеціаліст</div>
            <div>{{ specialistSummary }}</div>
          </div>
          <div>
            <div class="muted">Поточний тариф</div>
            <div>{{ planDisplay('current') }}</div>
          </div>
          <div>
            <div class="muted">Запитаний тариф</div>
            <div>{{ planDisplay('requested') }}</div>
          </div>
          <div>
            <div class="muted">Ідентифікатори</div>
            <div>{{ identifiersSummary }}</div>
          </div>
          <div>
            <div class="muted">Створено</div>
            <div>{{ formatDate(request.created_at) }}</div>
          </div>
          <div>
            <div class="muted">Оновлено</div>
            <div>{{ formatDate(request.updated_at) }}</div>
          </div>
          <div>
            <div class="muted">Рішення прийнято</div>
            <div>{{ formatDate(request.decided_at) }}</div>
          </div>
        </div>
      </section>

      <section class="panel">
        <div class="panel__header">
          <div>
            <div class="badge badge--soft">Операційний стан</div>
            <h2 class="panel__title">Доменний статус і Work Queue</h2>
          </div>
          <RouterLink
            v-if="request.work_queue_summary?.latest_item"
            class="btn btn--ghost btn--sm"
            :to="workQueueItemRoute(request.work_queue_summary.latest_item.item_key)"
          >
            Відкрити в черзі
          </RouterLink>
        </div>

        <div class="operational-status-grid">
          <div>
            <div class="muted">Доменний статус</div>
            <span class="status-pill" :class="statusClass(request.status)">
              {{ statusLabel(request.status) }}
            </span>
          </div>
          <div>
            <div class="muted">Операційний статус</div>
            <span
              v-if="request.work_queue_summary?.latest_item"
              class="status-pill"
              :class="operationalStatusClass(operationalStatus(request))"
            >
              {{ operationalStatusLabel(operationalStatus(request), request.work_queue_summary.auto_closed) }}
            </span>
            <span v-else>Немає повʼязаного елемента</span>
          </div>
          <div>
            <div class="muted">Хто змінив</div>
            <div>{{ request.work_queue_summary?.latest_item?.status_changed_by?.username || 'SYSTEM' }}</div>
          </div>
          <div>
            <div class="muted">Коли</div>
            <div>{{ formatDate(request.work_queue_summary?.latest_item?.status_changed_at) }}</div>
          </div>
        </div>

        <div class="operational-note">
          <strong>Причина / примітка:</strong>
          {{ request.work_queue_summary?.latest_item?.resolution_note || '—' }}
        </div>

        <div v-if="operationalConflictWarning(request)" class="operational-warning">
          {{ operationalConflictWarning(request) }}
        </div>
      </section>

      <section class="panel">
        <div class="panel__header">
          <div>
            <div class="badge badge--soft">Контекст</div>
            <h2 class="panel__title">Нотатки</h2>
          </div>
        </div>

        <div class="context-grid">
          <div>
            <div class="muted">Нотатка користувача</div>
            <div>{{ request.note?.trim() || 'Немає' }}</div>
          </div>
          <div>
            <div class="muted">Нотатка адміністратора</div>
            <div>{{ request.admin_note?.trim() || 'Немає' }}</div>
          </div>
        </div>
      </section>

      <section class="panel">
        <div class="panel__header">
          <div>
            <div class="badge badge--soft">Inbox</div>
            <h2 class="panel__title">Повʼязані елементи inbox</h2>
          </div>
        </div>

        <div class="inbox-relation-summary">
          <div><strong>Повʼязані:</strong> {{ linkedItemsCount }}</div>
          <div><strong>Відкриті:</strong> {{ openItemsCount }}</div>
          <div><strong>Стан:</strong> {{ relationStateText }}</div>
        </div>

        <div v-if="linkedItems.length > 0" class="inbox-item-list">
          <article v-for="item in linkedItems" :key="item.id" class="inbox-item-card">
            <div class="inbox-item-card__row">
              <strong>Елемент inbox #{{ item.id }}</strong>
              <span class="status-pill" :class="inboxItemStatusClass(item.status)">
                {{ inboxItemStatusLabel(item.status) }}
              </span>
            </div>
            <div>{{ item.title || 'Без заголовка' }}</div>
            <div class="muted">
              {{ item.code || '—' }}
              <span v-if="item.created_at"> · Створено: {{ formatDate(item.created_at) }}</span>
              <span v-if="item.read_at"> · Прочитано: {{ formatDate(item.read_at) }}</span>
              <span v-if="item.resolved_at"> · Вирішено: {{ formatDate(item.resolved_at) }}</span>
            </div>
            <RouterLink class="btn btn--ghost btn--sm" :to="`/admin/inbox/${item.id}`">Відкрити елемент inbox</RouterLink>
          </article>
        </div>
        <div v-else class="muted">Повʼязаних елементів inbox немає.</div>
      </section>

      <section class="panel">
        <div class="panel__header">
          <div>
            <div class="badge badge--soft">Рішення</div>
            <h2 class="panel__title">Погодити або відхилити</h2>
          </div>
        </div>

        <div v-if="actionError" class="form-error">{{ actionError }}</div>
        <div class="decision-actions">
          <button class="btn" type="button" :disabled="!canDecide || actionPending" @click="approveRequest">
            {{ actionPending && actionType === 'approve' ? 'Погоджуємо…' : 'Погодити' }}
          </button>
          <button
            class="btn btn--ghost"
            type="button"
            :disabled="!canDecide || actionPending"
            @click="rejectRequest"
          >
            {{ actionPending && actionType === 'reject' ? 'Відхиляємо…' : 'Відхилити' }}
          </button>
          <div v-if="!canDecide" class="muted">Запит уже має фінальний статус, повторне рішення недоступне.</div>
        </div>
      </section>
    </template>
  </section>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import { useToast } from '../composables/useToast'
import {
  approveAdminBillingAccessRequest,
  fetchAdminBillingAccessRequest,
  getApiErrorMessage,
  rejectAdminBillingAccessRequest,
  type AdminBillingAccessRequest,
  type AdminBillingAccessRequestInboxItem,
} from '../lib/api'
import { formatUkDateTimeCompact } from '../lib/dateTime'

type ActionType = 'approve' | 'reject' | null

const route = useRoute()
const toast = useToast()

const loading = ref(false)
const error = ref('')
const request = ref<AdminBillingAccessRequest | null>(null)
const actionPending = ref(false)
const actionType = ref<ActionType>(null)
const actionError = ref('')

const requestId = computed(() => Number(route.params.id))
const specialistDetailRoute = computed(() => {
  const id = Number(request.value?.specialist?.id)
  if (!Number.isInteger(id) || id <= 0) return ''
  return `/admin/specialists/${id}`
})

const canDecide = computed(() => normalizeStatus(request.value?.status) === 'PENDING')
const userSummary = computed(() => {
  const user = request.value?.user
  if (!user) return 'Немає даних'
  const name = String(user.display_name || '').trim()
  const email = String(user.email || '').trim()
  if (name && email) return `${name} (${email})`
  if (name) return name
  if (email) return email
  return 'Немає даних'
})
const specialistSummary = computed(() => {
  const specialist = request.value?.specialist
  if (!specialist) return 'Немає даних'
  const parts = [
    String(specialist.display_name || '').trim(),
    specialist.username ? `@${String(specialist.username).trim()}` : '',
    specialist.public_slug ? `/${String(specialist.public_slug).trim()}` : '',
    specialist.email ? String(specialist.email).trim() : '',
  ].filter(Boolean)
  return parts.length > 0 ? parts.join(' · ') : 'Немає даних'
})
const identifiersSummary = computed(() => {
  const userId = request.value?.user?.id
  const specialistId = request.value?.specialist?.id
  const submittedId = request.value?.submitted_by_user_id
  const parts = [
    Number.isFinite(userId) ? `user:${userId}` : '',
    Number.isFinite(specialistId) ? `specialist:${specialistId}` : '',
    Number.isFinite(submittedId) ? `submitted_by:${submittedId}` : '',
  ].filter(Boolean)
  return parts.length > 0 ? parts.join(' · ') : 'Немає даних'
})

const linkedItems = computed<AdminBillingAccessRequestInboxItem[]>(() => {
  const relation = request.value?.inbox_relation
  if (!relation) return []
  if (Array.isArray(relation.linked_items)) return relation.linked_items
  if (Array.isArray(relation.items)) return relation.items
  return []
})

const linkedItemsCount = computed(() => {
  const relation = request.value?.inbox_relation
  const linked = Number(relation?.linked_items_count)
  if (Number.isFinite(linked)) return String(linked)
  return String(linkedItems.value.length)
})

const openItemsCount = computed(() => {
  const relation = request.value?.inbox_relation
  const open = Number(relation?.open_items_count)
  if (Number.isFinite(open)) return String(open)
  return String(linkedItems.value.filter((item) => isOpenInboxStatus(item.status)).length)
})

const relationStateText = computed(() => {
  const relation = request.value?.inbox_relation
  if (!relation) return 'Звʼязок не передано'

  const hasLinked = typeof relation.has_linked_items === 'boolean'
    ? relation.has_linked_items
    : linkedItems.value.length > 0
  const hasOpen = typeof relation.has_open_items === 'boolean'
    ? relation.has_open_items
    : linkedItems.value.some((item) => isOpenInboxStatus(item.status))

  if (!hasLinked) return 'Повʼязаних елементів немає'
  if (hasOpen) return 'Є відкриті елементи'
  return 'Усі повʼязані елементи закриті'
})

function normalizeStatus(status: string | null | undefined) {
  return String(status || '').trim().toUpperCase()
}

function normalizeInboxStatus(status: string | null | undefined) {
  return String(status || '').trim().toUpperCase()
}

function isOpenInboxStatus(status: string | null | undefined) {
  const normalized = normalizeInboxStatus(status)
  return normalized === 'OPEN' || normalized === 'IN_PROGRESS' || normalized === 'NEW' || normalized === 'UNREAD'
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

function operationalStatus(requestValue: AdminBillingAccessRequest) {
  const latest = requestValue.work_queue_summary?.latest_item
  return String(latest?.persisted_status || latest?.status || '').trim().toLowerCase()
}

function operationalStatusLabel(status: string, autoClosed?: boolean) {
  if (status === 'open') return 'Відкрите'
  if (status === 'in_progress') return 'В роботі'
  if (status === 'resolved') return autoClosed ? 'Вирішено автоматично' : 'Вирішено'
  if (status === 'ignored') return 'Ігноровано'
  return status || '—'
}

function operationalStatusClass(status: string) {
  if (status === 'resolved') return 'status-pill--ok'
  if (status === 'ignored') return 'status-pill--muted'
  if (status === 'open' || status === 'in_progress') return 'status-pill--warn'
  return 'status-pill--muted'
}

function operationalConflictWarning(requestValue: AdminBillingAccessRequest) {
  const code = requestValue.work_queue_summary?.conflict_code
  if (code === 'DOMAIN_CLOSED_OPERATIONAL_ACTIVE') {
    return `Увага: запит уже має доменний статус «${statusLabel(requestValue.status)}», але повʼязаний елемент черги ще активний.`
  }
  if (code === 'DOMAIN_PENDING_OPERATIONAL_CLOSED') {
    return 'Увага: елемент черги закрито, але запит на тариф ще очікує рішення.'
  }
  return ''
}

function workQueueItemRoute(itemKey: string) {
  return `/admin/work-queue?status=all&item_key=${encodeURIComponent(itemKey)}`
}

function inboxItemStatusLabel(status: string | null | undefined) {
  const normalized = normalizeInboxStatus(status)
  if (normalized === 'OPEN' || normalized === 'IN_PROGRESS') return 'В роботі'
  if (normalized === 'UNREAD' || normalized === 'NEW') return 'Непрочитано'
  if (normalized === 'RESOLVED' || normalized === 'DONE') return 'Вирішено'
  if (normalized === 'DISMISSED' || normalized === 'CLOSED') return 'Відхилено'
  return status || '—'
}

function inboxItemStatusClass(status: string | null | undefined) {
  const normalized = normalizeInboxStatus(status)
  if (normalized === 'OPEN' || normalized === 'IN_PROGRESS' || normalized === 'UNREAD' || normalized === 'NEW') {
    return 'status-pill--warn'
  }
  if (normalized === 'RESOLVED' || normalized === 'DONE') return 'status-pill--ok'
  if (normalized === 'DISMISSED' || normalized === 'CLOSED') return 'status-pill--danger'
  return 'status-pill--muted'
}

function formatDate(value: string | null | undefined) {
  return formatUkDateTimeCompact(value)
}

function planDisplay(kind: 'current' | 'requested') {
  if (!request.value) return 'Не вказано'
  const label = kind === 'current'
    ? String(request.value.current_plan_label || '').trim()
    : String(request.value.requested_plan_label || '').trim()
  if (label) return label

  const codeCandidate = kind === 'current'
    ? request.value.current_plan || request.value.plans?.current_plan
    : request.value.requested_plan || request.value.plans?.requested_plan
  const code = String(codeCandidate || '').trim().toUpperCase()
  return code || 'Не вказано'
}

async function loadRequest() {
  if (!Number.isInteger(requestId.value) || requestId.value <= 0) {
    request.value = null
    error.value = 'Некоректний ідентифікатор запиту на тариф.'
    return
  }

  loading.value = true
  error.value = ''
  actionError.value = ''
  try {
    request.value = await fetchAdminBillingAccessRequest(requestId.value)
  } catch (err) {
    request.value = null
    error.value = getApiErrorMessage(err, 'Не вдалося завантажити запит на тариф.')
  } finally {
    loading.value = false
  }
}

async function approveRequest() {
  if (!request.value || !canDecide.value || actionPending.value) return
  actionPending.value = true
  actionType.value = 'approve'
  actionError.value = ''
  try {
    request.value = await approveAdminBillingAccessRequest(request.value.id)
    toast.success('Запит погоджено.')
    await loadRequest()
  } catch (err) {
    actionError.value = getApiErrorMessage(err, 'Не вдалося погодити запит на тариф.')
  } finally {
    actionPending.value = false
    actionType.value = null
  }
}

async function rejectRequest() {
  if (!request.value || !canDecide.value || actionPending.value) return
  actionPending.value = true
  actionType.value = 'reject'
  actionError.value = ''
  try {
    request.value = await rejectAdminBillingAccessRequest(request.value.id)
    toast.success('Запит відхилено.')
    await loadRequest()
  } catch (err) {
    actionError.value = getApiErrorMessage(err, 'Не вдалося відхилити запит на тариф.')
  } finally {
    actionPending.value = false
    actionType.value = null
  }
}

watch(
  requestId,
  async () => {
    await loadRequest()
  },
  { immediate: true }
)
</script>

<style scoped>
.admin-billing-request-detail {
  display: grid;
  gap: 16px;
}

.admin-billing-request-detail__hero {
  background: linear-gradient(135deg, rgba(8, 113, 201, 0.14), rgba(7, 47, 71, 0.06));
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.admin-billing-request-detail__hero-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.admin-billing-request-detail__title {
  margin: 0;
}

.admin-billing-request-detail__subtitle {
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

.summary-grid,
.context-grid {
  display: grid;
  gap: 12px;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
}

.operational-status-grid {
  display: grid;
  gap: 10px;
  grid-template-columns: repeat(auto-fit, minmax(170px, 1fr));
}

.operational-note,
.operational-warning {
  margin-top: 12px;
  border-radius: var(--radius-sm);
  padding: 10px;
}

.operational-note {
  border: 1px solid var(--line);
}

.operational-warning {
  border: 1px solid color-mix(in srgb, #9a6700 35%, var(--line));
  background: color-mix(in srgb, #9a6700 10%, #fff);
}

.inbox-relation-summary {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
}

.inbox-item-list {
  display: grid;
  gap: 10px;
}

.inbox-item-card {
  border: 1px solid var(--line);
  border-radius: var(--radius-md);
  padding: 10px;
  display: grid;
  gap: 6px;
}

.inbox-item-card__row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}

.decision-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  align-items: center;
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
  .admin-billing-request-detail__hero {
    flex-direction: column;
    align-items: flex-start;
  }
}
</style>
