<template>
  <section class="admin-billing-request-detail">
    <header class="admin-billing-request-detail__hero panel">
      <div>
        <div class="badge">Адмін</div>
        <h1 class="title admin-billing-request-detail__title">Опрацювання billing-запиту</h1>
        <p class="muted admin-billing-request-detail__subtitle">
          Деталі запиту та операційні дії для прийняття рішення.
        </p>
      </div>
      <div class="admin-billing-request-detail__hero-actions">
        <RouterLink class="btn btn--ghost" to="/admin/billing-access-requests">До списку</RouterLink>
        <RouterLink class="btn btn--ghost" to="/admin/inbox">До inbox</RouterLink>
      </div>
    </header>

    <div v-if="loading" class="muted">Завантаження billing-запиту…</div>
    <div v-else-if="error" class="form-error">{{ error }}</div>

    <template v-else-if="request">
      <section class="panel">
        <div class="panel__header">
          <div>
            <div class="badge badge--soft">Зведення</div>
            <h2 class="panel__title">Request #{{ request.id }}</h2>
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
            <div class="muted">Email</div>
            <div>{{ userEmail }}</div>
          </div>
          <div>
            <div class="muted">Ідентифікатори</div>
            <div>{{ identifiersSummary }}</div>
          </div>
          <div>
            <div class="muted">Поточний план</div>
            <div>{{ planLabel(request.current_plan) }}</div>
          </div>
          <div>
            <div class="muted">Запитаний план</div>
            <div>{{ planLabel(request.requested_plan) }}</div>
          </div>
          <div>
            <div class="muted">Створено</div>
            <div>{{ formatDate(request.created_at) }}</div>
          </div>
          <div>
            <div class="muted">Оновлено</div>
            <div>{{ formatDate(request.updated_at) }}</div>
          </div>
        </div>
      </section>

      <section class="panel">
        <div class="panel__header">
          <div>
            <div class="badge badge--soft">Контекст</div>
            <h2 class="panel__title">Нотатки і metadata</h2>
          </div>
        </div>

        <div class="context-grid">
          <div>
            <div class="muted">Note</div>
            <div>{{ request.note?.trim() || '—' }}</div>
          </div>
          <div>
            <div class="muted">Admin note</div>
            <div>{{ request.admin_note?.trim() || '—' }}</div>
          </div>
        </div>

        <details v-if="metadataJson" class="metadata-block">
          <summary>Metadata</summary>
          <pre>{{ metadataJson }}</pre>
        </details>
      </section>

      <section class="panel">
        <div class="panel__header">
          <div>
            <div class="badge badge--soft">Inbox relation</div>
            <h2 class="panel__title">Повʼязані inbox item</h2>
          </div>
        </div>

        <div class="inbox-relation-summary">
          <div><strong>Linked:</strong> {{ linkedItemsCount }}</div>
          <div><strong>Open:</strong> {{ openItemsCount }}</div>
          <div>
            <strong>Стан:</strong>
            {{ hasOpenInboxItems ? 'Є відкриті item' : 'Відкритих item немає' }}
          </div>
        </div>

        <div v-if="inboxItems.length > 0" class="inbox-item-list">
          <article v-for="item in inboxItems" :key="item.id" class="inbox-item-card">
            <div class="inbox-item-card__row">
              <strong>Inbox #{{ item.id }}</strong>
              <span class="status-pill" :class="inboxItemStatusClass(item.status)">{{ inboxItemStatusLabel(item.status) }}</span>
            </div>
            <div class="muted">
              {{ item.code || '—' }}
              <span v-if="item.created_at"> · {{ formatDate(item.created_at) }}</span>
            </div>
            <div>{{ item.title || 'Без заголовка' }}</div>
            <RouterLink class="btn btn--ghost btn--sm" :to="`/admin/inbox/${item.id}`">Відкрити inbox item</RouterLink>
          </article>
        </div>
        <div v-else class="muted">Повʼязані inbox item не передані backend-ом.</div>
      </section>

      <section class="panel">
        <div class="panel__header">
          <div>
            <div class="badge badge--soft">Рішення</div>
            <h2 class="panel__title">Approve / Reject</h2>
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
          <div v-if="!canDecide" class="muted">Цей запит вже має фінальний статус і недоступний для повторного рішення.</div>
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

const canDecide = computed(() => normalizeStatus(request.value?.status) === 'PENDING')
const userSummary = computed(() => {
  const user = request.value?.user
  if (!user) return '—'
  return user.display_name || user.full_name || user.username || user.email || '—'
})
const specialistSummary = computed(() => {
  const specialist = request.value?.specialist
  if (!specialist) return '—'
  if (specialist.display_name && specialist.slug) {
    return `${specialist.display_name} (${specialist.slug})`
  }
  return specialist.display_name || specialist.slug || '—'
})
const userEmail = computed(() => request.value?.user?.email || '—')
const identifiersSummary = computed(() => {
  const userId = request.value?.user?.id
  const specialistId = request.value?.specialist?.id
  const parts = [
    Number.isFinite(userId) ? `user:${userId}` : '',
    Number.isFinite(specialistId) ? `specialist:${specialistId}` : '',
  ].filter(Boolean)
  return parts.length > 0 ? parts.join(' · ') : '—'
})
const metadataJson = computed(() => {
  if (!request.value?.metadata) return ''
  try {
    return JSON.stringify(request.value.metadata, null, 2)
  } catch {
    return ''
  }
})
const inboxItems = computed<AdminBillingAccessRequestInboxItem[]>(() => {
  const items = request.value?.inbox_relation?.items
  return Array.isArray(items) ? items : []
})
const linkedItemsCount = computed(() => {
  const linked = Number(request.value?.inbox_relation?.linked_items_count)
  if (Number.isFinite(linked)) return String(linked)
  return String(inboxItems.value.length)
})
const openItemsCount = computed(() => {
  const open = Number(request.value?.inbox_relation?.open_items_count)
  if (Number.isFinite(open)) return String(open)
  return String(inboxItems.value.filter((item) => normalizeInboxStatus(item.status) === 'OPEN').length)
})
const hasOpenInboxItems = computed(() => {
  const explicit = request.value?.inbox_relation?.has_open_items
  if (typeof explicit === 'boolean') return explicit
  return inboxItems.value.some((item) => normalizeInboxStatus(item.status) === 'OPEN')
})

function normalizeStatus(status: string | null | undefined) {
  return String(status || '').trim().toUpperCase()
}

function normalizeInboxStatus(status: string | null | undefined) {
  return String(status || '').trim().toUpperCase()
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
  if (normalized === 'OPEN' || normalized === 'IN_PROGRESS') return 'status-pill--warn'
  if (normalized === 'RESOLVED' || normalized === 'DONE') return 'status-pill--ok'
  if (normalized === 'DISMISSED' || normalized === 'CLOSED') return 'status-pill--danger'
  return 'status-pill--muted'
}

function formatDate(value: string | null | undefined) {
  return formatUkDateTimeCompact(value)
}

function planLabel(value: string | null | undefined) {
  const normalized = String(value || '').trim().toUpperCase()
  return normalized || 'Невідомо'
}

async function loadRequest() {
  if (!Number.isInteger(requestId.value) || requestId.value <= 0) {
    request.value = null
    error.value = 'Некоректний ідентифікатор billing-запиту.'
    return
  }

  loading.value = true
  error.value = ''
  actionError.value = ''
  try {
    request.value = await fetchAdminBillingAccessRequest(requestId.value)
  } catch (err) {
    request.value = null
    error.value = getApiErrorMessage(err, 'Не вдалося завантажити billing-запит.')
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
    toast.success('Billing-запит погоджено.')
    await loadRequest()
  } catch (err) {
    actionError.value = getApiErrorMessage(err, 'Не вдалося погодити billing-запит.')
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
    toast.success('Billing-запит відхилено.')
    await loadRequest()
  } catch (err) {
    actionError.value = getApiErrorMessage(err, 'Не вдалося відхилити billing-запит.')
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

.metadata-block {
  margin: 0;
}

.metadata-block pre {
  margin: 8px 0 0;
  padding: 10px;
  border: 1px solid var(--line);
  border-radius: var(--radius-sm);
  background: color-mix(in srgb, var(--surface) 85%, #ffffff);
  overflow: auto;
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
