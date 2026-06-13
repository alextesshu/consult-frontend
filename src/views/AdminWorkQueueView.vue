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

      <div class="admin-work-queue__filter-group">
        <div class="admin-work-queue__filter-label">Стан</div>
        <div class="admin-work-queue__filters" aria-label="Фільтри стану черги роботи">
          <button
            v-for="filter in lifecycleFilterItems"
            :key="filter.key"
            class="filter-chip"
            :class="{ 'is-active': activeLifecycleFilter === filter.key }"
            type="button"
            :disabled="loading"
            @click="setLifecycleFilter(filter.key)"
          >
            {{ filter.label }}
          </button>
        </div>
      </div>

      <div class="admin-work-queue__filter-group">
        <div class="admin-work-queue__filter-label">Тип</div>
        <div class="admin-work-queue__filters" aria-label="Фільтри типу черги роботи">
        <button
          v-for="filter in categoryFilterItems"
          :key="filter.key"
          class="filter-chip"
          :class="{ 'is-active': activeCategoryFilter === filter.key }"
          type="button"
          @click="activeCategoryFilter = filter.key"
        >
          {{ filter.label }}
        </button>
        </div>
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
          :class="[
            `queue-item--${severityTone(item.severity)}`,
            { 'queue-item--closed': isClosed(item) },
          ]"
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
            <div
              v-if="isPublicGuestRequestItem(item)"
              class="queue-item__request-summary"
            >
              <span>{{ publicRequestClientLabel(item) }}</span>
              <span>{{ publicRequestContactLabel(item) }}</span>
              <span>{{ publicRequestCategoryLabel(item) }}</span>
              <span>{{ publicRequestFormatLabel(item) }}</span>
              <span>{{ publicRequestMessageLabel(item) }}</span>
            </div>

            <div v-if="expandedItemKey === itemKey(item)" class="queue-item__detail">
              <div
                v-if="isPublicGuestRequestItem(item)"
                class="queue-item__request-context"
              >
                <strong>Що це за запит</strong>
                <dl>
                  <div>
                    <dt>Клієнт</dt>
                    <dd>{{ publicRequestClientValue(item) }}</dd>
                  </div>
                  <div>
                    <dt>Контакт</dt>
                    <dd>{{ publicRequestContactValue(item) }}</dd>
                  </div>
                  <div>
                    <dt>Категорія</dt>
                    <dd>{{ publicRequestCategoryValue(item) }}</dd>
                  </div>
                  <div>
                    <dt>Формат</dt>
                    <dd>{{ publicRequestFormatValue(item) }}</dd>
                  </div>
                  <div>
                    <dt>Повідомлення</dt>
                    <dd>{{ publicRequestMessageValue(item) }}</dd>
                  </div>
                </dl>
              </div>
              <div>
                <strong>Чому це в черзі</strong>
                <p>{{ detailWhy(item) }}</p>
              </div>
              <div>
                <strong>Що зробити</strong>
                <p>{{ detailNextStep(item) }}</p>
              </div>
              <div v-if="item.resolution_note">
                <strong>Примітка до рішення</strong>
                <p>{{ item.resolution_note }}</p>
              </div>
              <label
                v-if="canCloseOperationally(item)"
                class="queue-item__note-field"
              >
                <span>Примітка або причина (необов’язково)</span>
                <textarea
                  v-model="resolutionNotes[itemKey(item)]"
                  rows="3"
                  maxlength="2000"
                />
              </label>
            </div>
          </div>

          <div class="queue-item__actions">
            <button
              class="btn btn--ghost btn--sm"
              type="button"
              @click="toggleDetails(item)"
            >
              {{ expandedItemKey === itemKey(item) ? 'Згорнути' : 'Деталі' }}
            </button>
            <RouterLink
              v-if="internalTargetPath(workQueueTargetUrl(item))"
              class="btn btn--sm"
              :to="internalTargetPath(workQueueTargetUrl(item))"
            >
              Відкрити
            </RouterLink>
            <a
              v-else-if="externalTargetUrl(workQueueTargetUrl(item))"
              class="btn btn--sm"
              :href="externalTargetUrl(workQueueTargetUrl(item))"
              target="_blank"
              rel="noopener noreferrer"
            >
              Відкрити
            </a>
            <p v-else-if="unsupportedTargetMessage(item)" class="muted queue-item__action-note">
              {{ unsupportedTargetMessage(item) }}
            </p>
            <button
              v-for="action in lifecycleActions(item)"
              :key="action.code"
              class="btn btn--ghost btn--sm"
              type="button"
              :disabled="transitioningItemKey === itemKey(item)"
              @click="runLifecycleAction(item, action.code)"
            >
              {{ lifecycleActionLabel(action.code) }}
            </button>
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
  transitionAdminWorkQueueItem,
  type AdminWorkQueueItem,
  type AdminWorkQueueRelated,
  type AdminWorkQueueResponse,
  type AdminWorkQueueStatusFilter,
  type AdminWorkQueueSummary,
} from '../lib/api'
import { formatUkDateTimeCompact } from '../lib/dateTime'

type CategoryFilterKey = 'all' | 'requests' | 'specialists' | 'notifications' | 'invites' | 'billing' | 'problems'
type LifecycleActionCode = 'start' | 'resolve' | 'ignore' | 'reopen'
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
const activeLifecycleFilter = ref<AdminWorkQueueStatusFilter>('active')
const activeCategoryFilter = ref<CategoryFilterKey>('all')
const expandedItemKey = ref('')
const transitioningItemKey = ref('')
const resolutionNotes = ref<Record<string, string>>({})

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

const lifecycleFilterItems: Array<{ key: AdminWorkQueueStatusFilter; label: string }> = [
  { key: 'active', label: 'Активні' },
  { key: 'open', label: 'Відкриті' },
  { key: 'in_progress', label: 'В роботі' },
  { key: 'resolved', label: 'Вирішені' },
  { key: 'ignored', label: 'Ігноровані' },
  { key: 'all', label: 'Усі' },
]

const categoryFilterItems: Array<{ key: CategoryFilterKey; label: string }> = [
  { key: 'all', label: 'Усі типи' },
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
  if (activeCategoryFilter.value === 'all') return response.value.items
  return response.value.items.filter((item) => itemMatchesFilter(item, activeCategoryFilter.value))
})

function normalizeToken(value: string | null | undefined) {
  return String(value || '').trim().toLowerCase()
}

function itemMatchesFilter(item: AdminWorkQueueItem, filter: CategoryFilterKey) {
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
    billing_access_request_pending: 'Доступ / тариф',
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
  if (isBillingAccessRequestItem(item)) {
    const domainStatus = billingDomainStatus(item)
    if (domainStatus === 'approved') {
      return {
        title: 'Запит на доступ погоджено',
        description: 'Запит опрацьовано у billing-процесі. Доступ погоджено.',
      }
    }
    if (domainStatus === 'rejected') {
      return {
        title: 'Запит на доступ відхилено',
        description: 'Запит опрацьовано у billing-процесі. Доступ відхилено.',
      }
    }
    return {
      title: 'Запит на доступ очікує рішення',
      description: 'Спеціаліст подав запит на зміну тарифу або доступу.',
    }
  }
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
  if (normalized === 'ignored') return 'Ігноровано'
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
  if (normalized === 'ignored') return 'status-pill--muted'
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
  const domainStatus = billingDomainStatus(item)
  if (domainStatus) parts.push(`Статус запиту: ${billingDomainStatusLabel(domainStatus)}`)
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
  const requestId =
    relatedValue(related, 'public_request_id') ||
    relatedValue(related, 'request_id')
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

function publicRequestClientValue(item: AdminWorkQueueItem) {
  return safeRelatedText(relatedValue(item.related, 'client_name')) || 'не вказано'
}

function publicRequestContactValue(item: AdminWorkQueueItem) {
  const contact = safeRelatedText(relatedValue(item.related, 'client_contact'))
  const contactType =
    safeRelatedText(relatedValue(item.related, 'contact_type')) ||
    safeRelatedText(relatedValue(item.related, 'contact_channel'))
  if (!contact) return 'не вказано'
  return contactType ? `${contact} (${contactTypeLabel(contactType)})` : contact
}

function publicRequestCategoryValue(item: AdminWorkQueueItem) {
  const labels = relatedStringList(item.related, 'request_topic_labels')
  if (labels.length) return labels.join(', ')
  const topics = relatedStringList(item.related, 'request_topics')
  return topics.length ? topics.join(', ') : 'не вказано'
}

function publicRequestFormatValue(item: AdminWorkQueueItem) {
  const value =
    safeRelatedText(relatedValue(item.related, 'format')) ||
    safeRelatedText(relatedValue(item.related, 'session_format'))
  const labels: Record<string, string> = {
    online: 'Онлайн',
    offline: 'Офлайн',
  }
  return labels[normalizeToken(value)] || value || 'не вказано'
}

function publicRequestMessageValue(item: AdminWorkQueueItem) {
  return safeRelatedText(relatedValue(item.related, 'message_preview')) || 'немає тексту'
}

function publicRequestClientLabel(item: AdminWorkQueueItem) {
  return `Клієнт: ${publicRequestClientValue(item)}`
}

function publicRequestContactLabel(item: AdminWorkQueueItem) {
  return `Контакт: ${publicRequestContactValue(item)}`
}

function publicRequestCategoryLabel(item: AdminWorkQueueItem) {
  return `Категорія: ${publicRequestCategoryValue(item)}`
}

function publicRequestFormatLabel(item: AdminWorkQueueItem) {
  return `Формат: ${publicRequestFormatValue(item)}`
}

function publicRequestMessageLabel(item: AdminWorkQueueItem) {
  return `Коротко: ${publicRequestMessageValue(item)}`
}

function relatedStringList(
  related: AdminWorkQueueRelated | null | undefined,
  key: string
) {
  const value = relatedValue(related, key)
  if (!Array.isArray(value)) return []
  return value.filter(
    (item): item is string => typeof item === 'string' && Boolean(item.trim())
  )
}

function contactTypeLabel(value: string) {
  const labels: Record<string, string> = {
    email: 'Email',
    phone: 'Телефон',
    telegram: 'Telegram',
  }
  return labels[normalizeToken(value)] || value
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

function isPublicGuestRequestItem(item: AdminWorkQueueItem) {
  const type = normalizeToken(item.type)
  const objectType = normalizeToken(String(relatedValue(item.related, 'object_type') || '')).replace(/[^a-z0-9]/g, '')
  return type.includes('public_guest_request') || type.includes('public_request') || isPublicRequestObjectType(objectType)
}

function isBillingAccessRequestItem(item: AdminWorkQueueItem) {
  return normalizeToken(item.type).startsWith('billing_access_request')
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

function itemKey(item: AdminWorkQueueItem) {
  return String(item.item_key || item.id || '')
}

function isClosed(item: AdminWorkQueueItem) {
  const status = normalizeToken(item.status)
  return status === 'resolved' || status === 'ignored'
}

function billingDomainStatus(item: AdminWorkQueueItem) {
  if (!isBillingAccessRequestItem(item)) return ''
  return normalizeToken(
    String(
      relatedValue(item.related, 'domain_status') ||
      relatedValue(item.related, 'request_status') ||
      ''
    )
  )
}

function billingDomainStatusLabel(status: string) {
  const labels: Record<string, string> = {
    pending: 'Очікує',
    approved: 'Погоджено',
    rejected: 'Відхилено',
    cancelled: 'Скасовано',
  }
  return labels[normalizeToken(status)] || status
}

function detailWhy(item: AdminWorkQueueItem) {
  if (normalizeToken(item.type) === 'client_record_invite_pending') {
    return 'Клієнт ще не використав запрошення до кабінету.'
  }
  if (isBillingAccessRequestItem(item)) {
    return billingDomainStatus(item) === 'pending'
      ? 'Спеціаліст подав запит на зміну тарифу або доступу.'
      : 'Billing-запит уже опрацьовано у профільному процесі.'
  }
  if (isPublicGuestRequestItem(item)) {
    return 'Публічний запит досі очікує на дію спеціаліста.'
  }
  return item.detail?.why || displayItemDescription(item) || 'Подія потребує операційної перевірки.'
}

function detailNextStep(item: AdminWorkQueueItem) {
  if (normalizeToken(item.type) === 'client_record_invite_pending') {
    return 'Перевірте контакт або зв’яжіться зі спеціалістом чи клієнтом. Після перевірки позначте елемент вирішеним або ігнорованим.'
  }
  if (isBillingAccessRequestItem(item)) {
    return billingDomainStatus(item) === 'pending'
      ? 'Відкрийте профільний billing-запит і погодьте або відхиліть його там. Дії черги не змінюють тариф.'
      : 'Перегляньте рішення у профільному billing-запиті.'
  }
  if (isPublicGuestRequestItem(item)) {
    return 'Перевірте контекст запиту та за потреби зв’яжіться зі спеціалістом.'
  }
  return item.detail?.next_step || 'Перевірте контекст і оновіть операційний статус елемента.'
}

function toggleDetails(item: AdminWorkQueueItem) {
  const key = itemKey(item)
  expandedItemKey.value = expandedItemKey.value === key ? '' : key
}

function lifecycleActions(item: AdminWorkQueueItem) {
  if (!item.item_key) return []
  const allowed = new Set<LifecycleActionCode>(['start', 'resolve', 'ignore', 'reopen'])
  return (item.actions || []).filter(
    (action): action is { code: LifecycleActionCode; label: string; kind?: string } =>
      action.kind === 'mutation' && allowed.has(action.code as LifecycleActionCode)
  )
}

function lifecycleActionLabel(action: LifecycleActionCode) {
  const labels: Record<LifecycleActionCode, string> = {
    start: 'Позначити в роботі',
    resolve: 'Позначити вирішеним',
    ignore: 'Ігнорувати',
    reopen: 'Повернути до відкритих',
  }
  return labels[action]
}

function canCloseOperationally(item: AdminWorkQueueItem) {
  return lifecycleActions(item).some(
    (action) => action.code === 'resolve' || action.code === 'ignore'
  )
}

async function runLifecycleAction(item: AdminWorkQueueItem, action: LifecycleActionCode) {
  const key = itemKey(item)
  if (!key) return
  transitioningItemKey.value = key
  error.value = ''
  try {
    await transitionAdminWorkQueueItem(
      key,
      action,
      action === 'resolve' || action === 'ignore'
        ? resolutionNotes.value[key] || ''
        : ''
    )
    await loadWorkQueue()
  } catch (err) {
    error.value = getApiErrorMessage(err, 'Не вдалося оновити статус елемента.')
  } finally {
    transitioningItemKey.value = ''
  }
}

function workQueueTargetUrl(item: AdminWorkQueueItem) {
  const target = item.target_url || ''
  if (isPublicGuestRequestItem(item) && isAdminInboxTarget(target)) return ''
  return target
}

function unsupportedTargetMessage(item: AdminWorkQueueItem) {
  if (!isPublicGuestRequestItem(item) || workQueueTargetUrl(item)) return ''
  return 'Деталі запиту наведені в черзі. Окремої адмін-сторінки для цього типу запиту ще немає.'
}

function isAdminInboxTarget(value: string | null | undefined) {
  const target = String(value || '').trim()
  if (/^\/admin\/inbox(?:[/?#]|$)/.test(target)) return true
  if (!/^https?:\/\//i.test(target)) return false
  try {
    return /^\/admin\/inbox(?:[/?#]|$)/.test(new URL(target).pathname)
  } catch {
    return false
  }
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
    const payload = await fetchAdminWorkQueue(activeLifecycleFilter.value)
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

function setLifecycleFilter(filter: AdminWorkQueueStatusFilter) {
  if (activeLifecycleFilter.value === filter) return
  activeLifecycleFilter.value = filter
  expandedItemKey.value = ''
  void loadWorkQueue()
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

.queue-item__action-note {
  max-width: 260px;
  margin: 0;
  font-size: 13px;
  line-height: 1.4;
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

.admin-work-queue__filter-group {
  display: grid;
  gap: 6px;
}

.admin-work-queue__filter-group + .admin-work-queue__filter-group {
  margin-top: 14px;
}

.admin-work-queue__filter-label {
  color: var(--muted);
  font-size: 12px;
  font-weight: 800;
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

.queue-item--closed {
  background: color-mix(in srgb, var(--muted) 4%, #ffffff);
  opacity: 0.86;
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

.queue-item__request-summary {
  display: grid;
  gap: 4px;
  border-left: 2px solid color-mix(in srgb, var(--primary) 30%, var(--line));
  padding-left: 10px;
  color: var(--text);
  font-size: 13px;
  line-height: 1.4;
}

.queue-item__detail {
  display: grid;
  gap: 10px;
  border-top: 1px solid var(--line);
  padding-top: 10px;
  font-size: 13px;
}

.queue-item__request-context dl {
  display: grid;
  gap: 6px;
  margin: 8px 0 0;
}

.queue-item__request-context dl > div {
  display: grid;
  grid-template-columns: minmax(90px, 120px) minmax(0, 1fr);
  gap: 8px;
}

.queue-item__request-context dt {
  color: var(--muted);
  font-weight: 700;
}

.queue-item__request-context dd {
  margin: 0;
  overflow-wrap: anywhere;
}

.queue-item__detail p {
  margin: 4px 0 0;
  line-height: 1.45;
}

.queue-item__note-field {
  display: grid;
  gap: 6px;
  font-weight: 700;
}

.queue-item__note-field textarea {
  width: 100%;
  resize: vertical;
  border: 1px solid var(--line);
  border-radius: var(--radius-sm);
  padding: 8px 10px;
  color: var(--text);
  background: #fff;
  font: inherit;
  font-weight: 400;
}

.queue-item__actions {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  flex-wrap: wrap;
  max-width: 420px;
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

  .queue-item__request-context dl > div {
    grid-template-columns: 1fr;
    gap: 2px;
  }
}
</style>
