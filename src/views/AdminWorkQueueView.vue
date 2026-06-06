<template>
  <section class="admin-work-queue">
    <header class="admin-work-queue__hero panel">
      <div>
        <div class="badge">Адмін</div>
        <h1 class="title admin-work-queue__title">Черга роботи</h1>
        <p class="muted admin-work-queue__subtitle">
          Події, які потребують уваги адміністратора.
        </p>
      </div>
      <div class="admin-work-queue__hero-actions">
        <RouterLink class="btn btn--ghost" to="/admin/inbox">Адмін-запити</RouterLink>
        <RouterLink class="btn btn--ghost" to="/admin/billing-access-requests">Запити на доступ</RouterLink>
        <RouterLink class="btn btn--ghost" to="/admin/specialists">Спеціалісти</RouterLink>
      </div>
    </header>

    <section class="panel admin-work-queue__counters" aria-label="Лічильники черги роботи">
      <article v-for="counter in counterItems" :key="counter.key" class="counter-tile">
        <div class="counter-tile__label">{{ counter.label }}</div>
        <div class="counter-tile__value">{{ counter.value }}</div>
      </article>
    </section>

    <section class="panel">
      <div class="panel__header">
        <div>
          <div class="badge badge--soft">Фільтри</div>
          <h2 class="panel__title">Операційний фокус</h2>
        </div>
      </div>

      <div class="admin-work-queue__filters" aria-label="Фільтри черги роботи">
        <button
          v-for="filter in filterItems"
          :key="filter.key"
          class="filter-chip"
          :class="{ 'is-active': activeFilter === filter.key }"
          type="button"
          @click="activeFilter = filter.key"
        >
          {{ filter.label }}
        </button>
      </div>
    </section>

    <section class="panel">
      <div class="panel__header">
        <div>
          <div class="badge badge--soft">Список</div>
          <h2 class="panel__title">Що потребує дії</h2>
        </div>
        <button
          class="btn btn--ghost btn--sm"
          type="button"
          :disabled="loading"
          @click="loadWorkQueue"
        >
          Оновити
        </button>
      </div>

      <div v-if="loading && !loaded" class="admin-work-queue__state admin-work-queue__state--loading">
        Завантаження черги роботи…
      </div>
      <div v-else-if="error" class="admin-work-queue__state admin-work-queue__state--error">
        <span>{{ error }}</span>
        <button class="btn btn--ghost btn--sm" type="button" :disabled="loading" @click="loadWorkQueue">
          Спробувати ще раз
        </button>
      </div>
      <EmptyState
        v-else-if="filteredItems.length === 0"
        title="Подій, які потребують уваги, немає."
        description="Змініть фільтр або поверніться до черги пізніше."
      />

      <div v-else class="admin-work-queue__list">
        <article
          v-for="item in filteredItems"
          :key="item.id"
          class="queue-item"
          :class="`queue-item--${severityTone(item.severity)}`"
        >
          <div class="queue-item__main">
            <div class="queue-item__topline">
              <span class="queue-item__type">{{ displayTypeLabel(item) }}</span>
              <span class="status-pill" :class="severityClass(item.severity)">
                {{ severityLabel(item.severity) }}
              </span>
              <span class="status-pill" :class="statusClass(item.status)">
                {{ statusLabel(item.status) }}
              </span>
            </div>

            <h3 class="queue-item__title">{{ displayItemTitle(item) }}</h3>
            <p v-if="displayItemDescription(item)" class="muted queue-item__description">
              {{ displayItemDescription(item) }}
            </p>
            <p v-if="displayItemHint(item)" class="queue-item__hint">
              {{ displayItemHint(item) }}
            </p>

            <div class="queue-item__meta">
              <span v-for="meta in displayItemMeta(item)" :key="meta">{{ meta }}</span>
            </div>
          </div>

          <div class="queue-item__actions">
            <RouterLink
              v-if="internalTargetPath(item.target_url)"
              class="btn btn--sm"
              :to="internalTargetPath(item.target_url)"
            >
              Відкрити
            </RouterLink>
            <a
              v-else-if="externalTargetUrl(item.target_url)"
              class="btn btn--sm"
              :href="externalTargetUrl(item.target_url)"
              target="_blank"
              rel="noopener noreferrer"
            >
              Відкрити
            </a>
          </div>
        </article>
      </div>
    </section>
  </section>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import EmptyState from '../components/EmptyState.vue'
import {
  fetchAdminWorkQueue,
  getApiErrorMessage,
  type AdminWorkQueueItem,
  type AdminWorkQueueRelated,
  type AdminWorkQueueResponse,
  type AdminWorkQueueSummary,
} from '../lib/api'
import { formatUkDateTimeCompact } from '../lib/dateTime'

type FilterKey = 'all' | 'requests' | 'specialists' | 'notifications' | 'invites' | 'billing' | 'problems'
type ItemCopy = { title: string; description: string; hint?: string; typeLabel?: string }

const emptySummary: AdminWorkQueueSummary = {
  total_open: 0,
  public_requests_pending: 0,
  public_requests_stale: 0,
  specialists_pending_review: 0,
  notification_issues: 0,
  client_invites_pending: 0,
  billing_issues: 0,
}

const response = ref<AdminWorkQueueResponse>({
  summary: emptySummary,
  items: [],
})
const loading = ref(false)
const loaded = ref(false)
const error = ref('')
const activeFilter = ref<FilterKey>('all')

const notificationIssueTypes = new Set([
  'reminder_delivery_issue',
  'reminder_delivery_failed',
  'notification_issue',
])

const notificationIssueCategories = new Set([
  'email_domain_not_verified',
  'recipient_invalid_or_missing',
  'provider_error',
  'unknown_delivery_failure',
])

const specialistAccessReviewTypes = new Set([
  'specialist_beta_access_missing',
  'specialist_beta_access_review',
  'specialist_access_review',
  'specialist_access_needs_review',
  'specialist_pending_review',
  'specialist_profile_incomplete',
])

const filterItems: Array<{ key: FilterKey; label: string }> = [
  { key: 'all', label: 'Усі' },
  { key: 'requests', label: 'Запити' },
  { key: 'specialists', label: 'Спеціалісти' },
  { key: 'notifications', label: 'Повідомлення' },
  { key: 'invites', label: 'Запрошення' },
  { key: 'billing', label: 'Billing' },
  { key: 'problems', label: 'Проблеми' },
]

const counterItems = computed(() => {
  const summary = response.value.summary || emptySummary
  return [
    { key: 'total_open', label: 'Відкриті', value: summary.total_open || 0 },
    { key: 'public_requests_pending', label: 'Публічні запити', value: summary.public_requests_pending || 0 },
    { key: 'public_requests_stale', label: 'Очікують реакції', value: summary.public_requests_stale || 0 },
    { key: 'notification_issues', label: 'Проблеми повідомлень', value: summary.notification_issues || 0 },
    { key: 'client_invites_pending', label: 'Запрошення клієнтів', value: summary.client_invites_pending || 0 },
    { key: 'specialists_pending_review', label: 'Beta / Pro доступ', value: summary.specialists_pending_review || 0 },
    { key: 'billing_issues', label: 'Billing', value: summary.billing_issues || 0 },
  ]
})

const filteredItems = computed(() => {
  if (activeFilter.value === 'all') return response.value.items
  return response.value.items.filter((item) => itemMatchesFilter(item, activeFilter.value))
})

function normalizeToken(value: string | null | undefined) {
  return String(value || '').trim().toLowerCase()
}

function itemMatchesFilter(item: AdminWorkQueueItem, filter: FilterKey) {
  const type = normalizeToken(item.type)
  const severity = normalizeToken(item.severity)
  const status = normalizeToken(item.status)

  if (filter === 'requests') return type.includes('public_guest_request') || type.includes('public_request')
  if (filter === 'specialists') {
    return type.includes('specialist') || type.includes('beta') || type.includes('access') || type.includes('profile')
  }
  if (filter === 'notifications') {
    return type.includes('notification') || type.includes('reminder') || type.includes('email')
  }
  if (filter === 'invites') return type.includes('invite')
  if (filter === 'billing') return type.includes('billing')
  if (filter === 'problems') return severity === 'warning' || severity === 'critical' || status === 'problem'
  return true
}

function displayTypeLabel(item: AdminWorkQueueItem) {
  if (isNotificationIssueItem(item)) {
    const copy = notificationIssueCopy(item)
    if (copy.typeLabel) return copy.typeLabel
    return 'ПОВІДОМЛЕННЯ'
  }
  if (isSpecialistAccessReviewItem(item)) return 'СПЕЦІАЛІСТ'
  return typeLabel(item.type)
}

function typeLabel(type: string) {
  const labels: Record<string, string> = {
    admin_inbox_item: 'Адмін-запит',
    billing_access_request: 'Доступ / тариф',
    billing_event_failed: 'Billing',
    public_guest_request_pending: 'Публічний запит',
    public_guest_request_stale: 'Запит очікує реакції',
    public_guest_request_notification_missing: 'Повідомлення',
    reminder_delivery_failed: 'Помилка повідомлення',
    reminder_delivery_issue: 'Повідомлення',
    notification_issue: 'Повідомлення',
    client_record_invite_pending: 'Запрошення клієнта',
    client_record_invite_expired: 'Запрошення клієнта',
    specialist_beta_access_missing: 'Beta / Pro доступ',
    specialist_beta_access_review: 'Beta / Pro доступ',
    specialist_access_review: 'Beta / Pro доступ',
    specialist_access_needs_review: 'Beta / Pro доступ',
    specialist_pending_review: 'Beta / Pro доступ',
    specialist_profile_incomplete: 'Профіль спеціаліста',
    specialist_has_unanswered_requests: 'Запити спеціаліста',
  }
  return labels[type] || 'Подія'
}

function itemCopy(item: AdminWorkQueueItem): ItemCopy | null {
  if (isNotificationIssueItem(item)) return notificationIssueCopy(item)
  if (isSpecialistAccessReviewItem(item)) {
    return {
      title: 'Спеціаліст потребує перевірки доступу',
      description:
        'Спеціаліст активний, але не має явно наданого Beta / Pro доступу. Перевірте, чи потрібно надати доступ.',
    }
  }

  const copy: Record<string, ItemCopy> = {
    public_guest_request_stale: {
      title: 'Запит очікує реакції',
      description: 'Публічний запит досі не опрацьований. Перевірте, чи спеціаліст відреагував.',
    },
    public_guest_request_pending: {
      title: 'Новий публічний запит',
      description: 'Клієнт залишив запит через публічний профіль спеціаліста.',
    },
    public_guest_request_notification_missing: {
      title: 'Повідомлення спеціалісту не підтверджено',
      description: 'Для цього запиту немає позначки про відправлене email-повідомлення спеціалісту.',
    },
    reminder_delivery_failed: {
      title: 'Помилка повідомлення',
      description: 'Повідомлення або нагадування не було доставлено.',
    },
    client_record_invite_pending: {
      title: 'Запрошення клієнта очікує',
      description: 'Клієнт ще не використав запрошення до кабінету.',
    },
    client_record_invite_expired: {
      title: 'Запрошення клієнта прострочене',
      description: 'Запрошення не було використано вчасно.',
    },
    specialist_beta_access_missing: {
      title: 'Спеціаліст очікує Beta / Pro доступ',
      description: 'Перевірте, чи потрібно надати спеціалісту доступ.',
    },
    billing_event_failed: {
      title: 'Помилка billing-події',
      description: 'Billing-подія потребує перевірки або повторної обробки.',
    },
  }
  return copy[item.type] || null
}

function displayItemTitle(item: AdminWorkQueueItem) {
  return itemCopy(item)?.title || item.title
}

function displayItemDescription(item: AdminWorkQueueItem) {
  return itemCopy(item)?.description || item.description || ''
}

function displayItemHint(item: AdminWorkQueueItem) {
  return itemCopy(item)?.hint || ''
}

function isNotificationIssueItem(item: AdminWorkQueueItem) {
  const type = normalizeToken(item.type)
  const category = notificationCategory(item)
  const objectType = normalizeToken(String(relatedValue(item.related, 'object_type') || ''))
  return (
    notificationIssueTypes.has(type) ||
    type.includes('notification_issue') ||
    objectType === 'reminder_delivery' ||
    notificationIssueCategories.has(category)
  )
}

function isSpecialistAccessReviewItem(item: AdminWorkQueueItem) {
  return specialistAccessReviewTypes.has(normalizeToken(item.type))
}

function notificationCategory(item: AdminWorkQueueItem) {
  return normalizeToken(String(relatedValue(item.related, 'category') || ''))
}

function notificationIssueCopy(item: AdminWorkQueueItem): ItemCopy {
  const category = notificationCategory(item)
  if (category === 'email_domain_not_verified') {
    return {
      title: 'Email-домен не підтверджено',
      description: 'Email-доставки не проходять, бо домен відправника не підтверджено у провайдера.',
      hint: 'Що зробити: перевірити домен proconsult.space у Resend і DNS-записи для відправки email.',
      typeLabel: 'Глобальна проблема email',
    }
  }
  if (category === 'recipient_invalid_or_missing') {
    return {
      title: 'Некоректний email отримувача',
      description: 'Частина повідомлень не доставлена через відсутній або некоректний email отримувача.',
      hint: 'Що зробити: перевірити контактні дані отримувача або картку спеціаліста/клієнта.',
    }
  }
  if (category === 'provider_error') {
    return {
      title: 'Помилка провайдера email',
      description: 'Email-провайдер повернув помилку під час відправки повідомлень.',
      hint: 'Що зробити: перевірити налаштування email-провайдера і повторити перевірку пізніше.',
    }
  }
  return {
    title: 'Проблема повідомлень',
    description: 'Є невдалі доставки повідомлень або нагадувань, які потребують перевірки.',
    hint: 'Що зробити: перевірити останні невдалі доставки та налаштування email-повідомлень.',
  }
}

function statusLabel(status: string) {
  const normalized = normalizeToken(status)
  if (normalized === 'open' || normalized === 'new') return 'Відкрите'
  if (normalized === 'in_progress') return 'В роботі'
  if (normalized === 'problem') return 'Проблема'
  if (normalized === 'resolved') return 'Вирішено'
  return 'Інший статус'
}

function severityLabel(severity: string) {
  const normalized = normalizeToken(severity)
  if (normalized === 'info') return 'Інформація'
  if (normalized === 'normal') return 'Звичайна увага'
  if (normalized === 'warning') return 'Увага'
  if (normalized === 'critical') return 'Критично'
  return 'Увага'
}

function statusClass(status: string) {
  const normalized = normalizeToken(status)
  if (normalized === 'resolved') return 'status-pill--ok'
  if (normalized === 'problem') return 'status-pill--danger'
  if (normalized === 'in_progress') return 'status-pill--warn'
  return 'status-pill--muted'
}

function severityClass(severity: string) {
  const normalized = normalizeToken(severity)
  if (normalized === 'critical') return 'status-pill--danger'
  if (normalized === 'warning') return 'status-pill--warn'
  if (normalized === 'info') return 'status-pill--info'
  return 'status-pill--muted'
}

function severityTone(severity: string) {
  const normalized = normalizeToken(severity)
  if (normalized === 'critical') return 'critical'
  if (normalized === 'warning') return 'warning'
  if (normalized === 'info') return 'info'
  return 'normal'
}

function formatDate(value: string | null | undefined) {
  if (!value) return ''
  return formatUkDateTimeCompact(value)
}

function displayItemMeta(item: AdminWorkQueueItem) {
  if (isNotificationIssueItem(item)) return notificationIssueMeta(item)

  const parts: string[] = []
  if (formatDate(item.created_at)) parts.push(`Створено: ${formatDate(item.created_at)}`)
  if (formatDate(item.updated_at)) parts.push(`Оновлено: ${formatDate(item.updated_at)}`)
  parts.push(...relatedMetaParts(item))
  return parts
}

function notificationIssueMeta(item: AdminWorkQueueItem) {
  const parts: string[] = []
  const channel = relatedValue(item.related, 'channel')
  const count = relatedValue(item.related, 'count')
  if (typeof channel === 'string' && channel.trim()) parts.push(`Канал: ${channel.trim()}`)
  if (typeof count === 'number' && Number.isFinite(count)) parts.push(`Невдалих доставок: ${count}`)
  if (typeof count === 'string' && count.trim()) parts.push(`Невдалих доставок: ${count.trim()}`)
  if (formatDate(item.updated_at)) parts.push(`Остання: ${formatDate(item.updated_at)}`)
  return parts
}

function relatedMetaParts(item: AdminWorkQueueItem) {
  const related = item.related
  if (!related) return []

  const parts: string[] = []
  const objectType = normalizeToken(String(relatedValue(related, 'object_type') || '')).replace(/[^a-z0-9]/g, '')
  const objectId = relatedValue(related, 'object_id')
  const requestId = relatedValue(related, 'request_id')
  const inviteId = relatedValue(related, 'invite_id')

  const requestLabelId = relatedId(requestId) || (isPublicRequestObjectType(objectType) ? relatedId(objectId) : '')
  if (requestLabelId) parts.push(`Публічний запит #${requestLabelId}`)

  const inviteLabelId = relatedId(inviteId) || (isClientInviteObjectType(objectType) ? relatedId(objectId) : '')
  if (inviteLabelId) parts.push(`Запрошення клієнта #${inviteLabelId}`)

  if (!requestLabelId && !inviteLabelId && objectType && objectType !== 'specialist' && relatedId(objectId)) {
    parts.push(`${relatedObjectTypeLabel(String(relatedValue(related, 'object_type') || ''))} #${relatedId(objectId)}`)
  }

  const clientName = safeRelatedText(relatedValue(related, 'client_display_name'))
  const clientEmail = safeRelatedText(relatedValue(related, 'client_email'))
  if (clientName) parts.push(`Клієнт: ${clientName}`)
  if (clientEmail) parts.push(`Email клієнта: ${clientEmail}`)
  if (!clientName && !clientEmail && relatedId(relatedValue(related, 'client_id'))) {
    parts.push(`Клієнт #${relatedId(relatedValue(related, 'client_id'))}`)
  }

  const specialistName =
    safeRelatedText(relatedValue(related, 'specialist_display_name')) ||
    safeRelatedText(relatedValue(related, 'specialist_name'))
  const specialistEmail = safeRelatedText(relatedValue(related, 'specialist_email'))
  if (specialistName) parts.push(`Спеціаліст: ${specialistName}`)
  if (specialistEmail) parts.push(`Email: ${specialistEmail}`)
  if (!specialistName && !specialistEmail) {
    const specialistFallbackId = relatedId(relatedValue(related, 'specialist_id')) || (
      objectType === 'specialist' ? relatedId(objectId) : ''
    )
    if (specialistFallbackId) parts.push(`Спеціаліст #${specialistFallbackId}`)
  }

  return uniqueMetaParts(parts)
}

function safeRelatedText(value: unknown) {
  return typeof value === 'string' ? value.trim() : ''
}

function relatedId(value: unknown) {
  if (typeof value === 'number' && Number.isFinite(value)) return String(value)
  if (typeof value === 'string' && value.trim()) return value.trim()
  return ''
}

function isPublicRequestObjectType(objectType: string) {
  return objectType === 'publicguestrequest' || objectType === 'adminguestrequest'
}

function isClientInviteObjectType(objectType: string) {
  return objectType === 'clientrecordinvite' || objectType === 'clientrecordaccountinvite'
}

function uniqueMetaParts(parts: string[]) {
  return parts.filter((part, index) => part && parts.indexOf(part) === index)
}

function relatedValue(related: AdminWorkQueueRelated | null | undefined, key: string): unknown {
  if (!related) return undefined
  return (related as Record<string, unknown>)[key]
}

function relatedObjectTypeLabel(type: string) {
  const normalized = normalizeToken(type).replace(/[^a-z0-9]/g, '')
  const labels: Record<string, string> = {
    publicguestrequest: 'Публічний запит',
    adminguestrequest: 'Публічний запит',
    admininboxitem: 'Адмін-запит',
    billingaccessrequest: 'Запит на доступ',
    billingevent: 'Billing-подія',
    clientrecordinvite: 'Запрошення клієнта',
    clientrecordaccountinvite: 'Запрошення клієнта',
    specialist: 'Спеціаліст',
    client: 'Клієнт',
  }
  return labels[normalized] || 'Обʼєкт'
}

function internalTargetPath(value: string | null | undefined) {
  const target = String(value || '').trim()
  if (!target || target === '/') return ''
  if (target.startsWith('/') && !target.startsWith('//') && !target.startsWith('/api/')) return target
  if (!/^https?:\/\//i.test(target) || typeof window === 'undefined') return ''
  try {
    const parsed = new URL(target)
    if (parsed.origin !== window.location.origin) return ''
    return `${parsed.pathname}${parsed.search}${parsed.hash}`
  } catch {
    return ''
  }
}

function externalTargetUrl(value: string | null | undefined) {
  const target = String(value || '').trim()
  if (!target || target === '/' || internalTargetPath(target)) return ''
  return target
}

async function loadWorkQueue() {
  loading.value = true
  error.value = ''
  try {
    const payload = await fetchAdminWorkQueue()
    response.value = {
      summary: payload?.summary || emptySummary,
      items: Array.isArray(payload?.items) ? payload.items : [],
    }
    loaded.value = true
  } catch (err) {
    error.value = getApiErrorMessage(err, 'Не вдалося завантажити чергу роботи.')
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  void loadWorkQueue()
})
</script>

<style scoped>
.admin-work-queue {
  display: grid;
  gap: 18px;
}

.admin-work-queue__hero {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
}

.admin-work-queue__title {
  margin-bottom: 6px;
}

.admin-work-queue__subtitle {
  max-width: 620px;
}

.admin-work-queue__hero-actions {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
  justify-content: flex-end;
}

.admin-work-queue__counters {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
  gap: 10px;
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
  font-size: 12px;
  font-weight: 700;
}

.counter-tile__value {
  color: var(--text);
  font-size: 26px;
  font-weight: 800;
  line-height: 1;
}

.admin-work-queue__filters {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.filter-chip {
  min-height: 32px;
  border: 1px solid var(--line);
  border-radius: 8px;
  padding: 6px 10px;
  background: #fff;
  color: var(--text);
  font: inherit;
  font-size: 13px;
  font-weight: 700;
  cursor: pointer;
}

.filter-chip:hover,
.filter-chip:focus-visible {
  border-color: color-mix(in srgb, var(--primary) 32%, var(--line));
  background: color-mix(in srgb, var(--primary) 7%, #ffffff);
  outline: none;
}

.filter-chip.is-active {
  border-color: var(--primary);
  background: var(--primary);
  color: #fff;
}

.admin-work-queue__state {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  border: 1px solid var(--line);
  border-radius: var(--radius-md);
  padding: 12px;
}

.admin-work-queue__state--loading {
  color: var(--muted);
}

.admin-work-queue__state--error {
  color: #9a3d3d;
  background: rgba(194, 75, 75, 0.06);
  border-color: rgba(194, 75, 75, 0.28);
}

.admin-work-queue__list {
  display: grid;
  gap: 10px;
}

.queue-item {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  gap: 14px;
  align-items: start;
  border: 1px solid var(--line);
  border-left-width: 4px;
  border-radius: var(--radius-md);
  background: #fff;
  padding: 14px;
}

.queue-item--critical {
  border-left-color: #c24b4b;
}

.queue-item--warning {
  border-left-color: #d9a441;
}

.queue-item--info {
  border-left-color: #3b7db6;
}

.queue-item--normal {
  border-left-color: color-mix(in srgb, var(--text) 26%, var(--line));
}

.queue-item__main {
  display: grid;
  gap: 8px;
  min-width: 0;
}

.queue-item__topline {
  display: flex;
  gap: 6px;
  align-items: center;
  flex-wrap: wrap;
}

.queue-item__type {
  color: var(--muted);
  font-size: 12px;
  font-weight: 800;
  text-transform: uppercase;
}

.queue-item__title {
  margin: 0;
  color: var(--text);
  font-size: 18px;
}

.queue-item__description {
  margin: 0;
  line-height: 1.45;
}

.queue-item__hint {
  margin: 0;
  color: var(--text);
  font-size: 13px;
  font-weight: 700;
  line-height: 1.45;
}

.queue-item__meta {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
  color: var(--muted);
  font-size: 13px;
}

.queue-item__meta span + span::before {
  content: "·";
  margin-right: 8px;
  color: color-mix(in srgb, var(--muted) 70%, transparent);
}

.queue-item__actions {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
}

.status-pill {
  display: inline-flex;
  align-items: center;
  width: fit-content;
  border-radius: var(--radius-pill);
  padding: 3px 8px;
  font-size: 12px;
  font-weight: 700;
}

.status-pill--ok {
  color: #1f7a4c;
  background: rgba(31, 122, 76, 0.11);
  border: 1px solid rgba(31, 122, 76, 0.24);
}

.status-pill--warn {
  color: #8a5d12;
  background: rgba(217, 164, 65, 0.14);
  border: 1px solid rgba(217, 164, 65, 0.28);
}

.status-pill--danger {
  color: #9a3d3d;
  background: rgba(194, 75, 75, 0.12);
  border: 1px solid rgba(194, 75, 75, 0.28);
}

.status-pill--info {
  color: #2e6392;
  background: rgba(59, 125, 182, 0.12);
  border: 1px solid rgba(59, 125, 182, 0.24);
}

.status-pill--muted {
  color: var(--muted);
  background: rgba(7, 47, 71, 0.05);
  border: 1px solid rgba(7, 47, 71, 0.1);
}

@media (max-width: 760px) {
  .admin-work-queue__hero,
  .admin-work-queue__state,
  .queue-item {
    display: grid;
    grid-template-columns: 1fr;
  }

  .admin-work-queue__hero-actions,
  .queue-item__actions {
    justify-content: flex-start;
  }
}
</style>
