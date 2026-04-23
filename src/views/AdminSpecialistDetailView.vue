<template>
  <section class="admin-specialist-detail">
    <header class="admin-specialist-detail__hero panel">
      <div>
        <div class="badge">Адмін</div>
        <h1 class="title admin-specialist-detail__title">Деталка спеціаліста</h1>
        <p class="muted admin-specialist-detail__subtitle">
          Поточний доступ, повʼязані запити та історія адміністративних змін.
        </p>
      </div>
      <div class="admin-specialist-detail__hero-actions">
        <RouterLink class="btn btn--ghost" to="/admin/inbox">До адмін-запитів</RouterLink>
        <RouterLink class="btn btn--ghost" to="/admin/billing-access-requests">До запитів на тариф</RouterLink>
        <RouterLink class="btn btn--ghost" to="/admin/specialists">До списку спеціалістів</RouterLink>
      </div>
    </header>

    <div v-if="loading" class="muted">Завантаження деталки спеціаліста…</div>
    <div v-else-if="error" class="form-error">{{ error }}</div>

    <template v-else-if="detail">
      <section class="panel">
        <div class="panel__header">
          <div>
            <div class="badge badge--soft">ПІДСУМОК</div>
            <h2 class="panel__title">{{ detail.identity.display_name || detail.identity.username }}</h2>
          </div>
          <div class="summary-actions">
            <button class="btn btn--sm" type="button" @click="openPlanModal">Змінити базовий тариф</button>
            <button class="btn btn--ghost btn--sm" type="button" @click="openTrialModal">Керувати тестовим доступом</button>
            <button class="btn btn--ghost btn--sm" type="button" @click="openOverrideModal">Керувати перевизначенням доступу</button>
          </div>
        </div>

        <div class="summary-grid">
          <div><span class="muted">ID:</span> {{ detail.identity.id }}</div>
          <div><span class="muted">Логін:</span> @{{ detail.identity.username }}</div>
          <div><span class="muted">Email:</span> {{ detail.identity.email || '—' }}</div>
          <div><span class="muted">Слаг профілю:</span> {{ detail.identity.slug || '—' }}</div>
          <div>
            <span class="muted">Публічний профіль:</span>
            {{ detail.identity.public_profile_enabled ? 'Увімкнено' : 'Вимкнено' }}
          </div>
          <div><span class="muted">Створено:</span> {{ formatDate(detail.identity.created_at) }}</div>
        </div>
      </section>

      <section class="panel">
        <div class="panel__header">
          <div>
            <div class="badge badge--soft">ПОТОЧНИЙ ДОСТУП</div>
            <h2 class="panel__title">Стан доступу</h2>
          </div>
        </div>

        <div class="access-grid">
          <div>
            <div class="muted">Базовий тариф</div>
            <strong>{{ detail.tariff_access.base_plan }}</strong>
          </div>
          <div>
            <div class="muted">Фактичний тариф</div>
            <strong>{{ detail.tariff_access.effective_plan }}</strong>
          </div>
          <div>
            <div class="muted">Статус тестового доступу</div>
            <span :class="pillClass(detail.tariff_access.trial.active)">
              {{ detail.tariff_access.trial.active ? 'ТЕСТОВИЙ ДОСТУП АКТИВНИЙ' : 'ТЕСТОВИЙ ДОСТУП НЕАКТИВНИЙ' }}
            </span>
            <div v-if="detail.tariff_access.trial.active" class="muted">
              {{ detail.tariff_access.trial.trial_plan || '—' }} ·
              {{ formatDate(detail.tariff_access.trial.starts_at) }} → {{ formatDate(detail.tariff_access.trial.ends_at) }}
            </div>
          </div>
          <div>
            <div class="muted">Статус перевизначення</div>
            <span :class="pillClass(detail.tariff_access.override.active)">
              {{ detail.tariff_access.override.active ? 'ПЕРЕВИЗНАЧЕННЯ АКТИВНЕ' : 'ПЕРЕВИЗНАЧЕННЯ НЕАКТИВНЕ' }}
            </span>
            <div v-if="detail.tariff_access.override.active" class="muted">
              {{ detail.tariff_access.override.override_plan || '—' }} ·
              {{ formatDate(detail.tariff_access.override.starts_at) }} → {{ formatDate(detail.tariff_access.override.ends_at) }}
            </div>
          </div>
        </div>

        <div class="summary-list">
          <div><strong>Базовий тариф:</strong> {{ planLabel(detail.tariff_access.base_plan) }}</div>
          <div>
            <strong>Активний тестовий доступ:</strong>
            <template v-if="detail.tariff_access.trial.active">
              {{ planLabel(detail.tariff_access.trial.trial_plan || '—') }} до {{ formatDate(detail.tariff_access.trial.ends_at) }}
            </template>
            <template v-else>немає</template>
          </div>
          <div>
            <strong>Активне перевизначення:</strong>
            <template v-if="detail.tariff_access.override.active">
              {{ planLabel(detail.tariff_access.override.override_plan || '—') }}
              <template v-if="detail.tariff_access.override.ends_at">
                до {{ formatDate(detail.tariff_access.override.ends_at) }}
              </template>
            </template>
            <template v-else>немає</template>
          </div>
          <div><strong>Фактичний доступ зараз:</strong> {{ planLabel(detail.tariff_access.effective_plan) }}</div>
        </div>

        <div
          v-if="detail.tariff_access.override.active && detail.tariff_access.base_plan !== detail.tariff_access.effective_plan"
          class="access-warning"
        >
          Активне перевизначення перекриває базовий тариф.
        </div>
      </section>

      <section class="panel">
        <div class="panel__header">
          <div>
            <div class="badge badge--soft">ПОВ’ЯЗАНІ ЗАПИТИ</div>
            <h2 class="panel__title">Зведення відкритих запитів</h2>
          </div>
        </div>
        <div class="requests-grid">
          <div>
            <span class="muted">Відкриті billing/admin запити:</span>
            {{ detail.admin_context.open_billing_admin_requests_count }}
          </div>
          <div>
            <span class="muted">Відкриті елементи inbox:</span>
            {{ detail.admin_context.open_admin_inbox_items_count ?? 0 }}
          </div>
          <div v-if="detail.admin_context.latest_related_request_summary" class="request-highlight">
            <div>
              <strong>Останній запит:</strong>
              #{{ detail.admin_context.latest_related_request_summary.id }}
              · {{ detail.admin_context.latest_related_request_summary.status }}
              · запитано {{ detail.admin_context.latest_related_request_summary.requested_plan || '—' }}
            </div>
            <RouterLink
              class="btn btn--ghost btn--sm"
              :to="`/admin/billing-access-requests/${detail.admin_context.latest_related_request_summary.id}`"
            >
              Відкрити запит
            </RouterLink>
          </div>
          <div v-else class="muted">Немає відкритих запитів</div>
        </div>
      </section>

      <section class="panel">
        <div class="panel__header">
          <div>
            <div class="badge badge--soft">ІСТОРІЯ ЗМІН ДОСТУПУ</div>
            <h2 class="panel__title">Історія змін доступу</h2>
          </div>
        </div>
        <div v-if="historyLoading" class="muted">Завантаження історії…</div>
        <div v-else-if="historyError" class="form-error">{{ historyError }}</div>
        <div v-else-if="history.length === 0" class="muted">Історія змін поки порожня.</div>
        <div v-else class="history-list">
          <article v-for="item in history" :key="item.id" class="history-item">
            <div class="history-item__head">
              <strong>{{ eventLabel(item.event_type) }}</strong>
            </div>
            <div><span class="muted">Опис зміни:</span> {{ beforeAfterSummary(item) }}</div>
            <div><span class="muted">Створено:</span> {{ formatDate(item.created_at) }}</div>
            <div><span class="muted">Хто змінив:</span> {{ item.actor_username || 'SYSTEM' }}</div>
            <div><span class="muted">Причина:</span> {{ item.reason || '—' }}</div>
          </article>
        </div>
      </section>
    </template>

    <div v-if="planModalOpen" class="setting-modal" @keydown.esc="closePlanModal">
      <div class="setting-modal__backdrop" @click="closePlanModal"></div>
      <section class="setting-modal__content panel" role="dialog" aria-modal="true" aria-label="Змінити базовий тариф">
        <div class="panel__header">
          <div>
            <div class="badge badge--soft">Адмін-дія</div>
            <h3 class="panel__title">Змінити базовий тариф</h3>
          </div>
          <button class="btn btn--ghost btn--sm" type="button" @click="closePlanModal">Закрити</button>
        </div>

        <label class="field">
          <span>Тариф</span>
          <select v-model="planForm.plan" class="input input--select">
            <option value="START">START</option>
            <option value="PRO">PRO</option>
            <option value="LEADER">LEADER</option>
          </select>
        </label>

        <label class="field">
          <span>Причина</span>
          <textarea v-model="planForm.reason" class="input input--textarea" rows="4" placeholder="Причина є обов’язковою" />
        </label>

        <div v-if="planFormError" class="form-error">{{ planFormError }}</div>

        <div class="setting-modal__footer">
          <button class="btn" type="button" :disabled="planSaving" @click="submitPlanAction">
            {{ planSaving ? 'Зберігаємо…' : 'Застосувати' }}
          </button>
          <button class="btn btn--ghost" type="button" :disabled="planSaving" @click="closePlanModal">Скасувати</button>
        </div>
      </section>
    </div>

    <div v-if="trialModalOpen" class="setting-modal" @keydown.esc="closeTrialModal">
      <div class="setting-modal__backdrop" @click="closeTrialModal"></div>
      <section class="setting-modal__content panel" role="dialog" aria-modal="true" aria-label="Керувати тестовим доступом">
        <div class="panel__header">
          <div>
            <div class="badge badge--soft">ТЕСТОВИЙ ДОСТУП</div>
            <h3 class="panel__title">Керувати тестовим доступом</h3>
          </div>
          <button class="btn btn--ghost btn--sm" type="button" @click="closeTrialModal">Закрити</button>
        </div>

        <label class="field">
          <span>Дія</span>
          <select v-model="trialForm.action" class="input input--select">
            <option value="START">Запустити тестовий доступ</option>
            <option value="END">Завершити тестовий доступ</option>
          </select>
        </label>

        <template v-if="trialForm.action === 'START'">
          <label class="field">
            <span>Тариф тестового доступу</span>
            <select v-model="trialForm.trial_plan" class="input input--select">
              <option value="PRO">PRO</option>
              <option value="LEADER">LEADER</option>
            </select>
          </label>
          <label class="field">
            <span>Початок дії</span>
            <input v-model="trialForm.starts_at" type="datetime-local" class="input" />
          </label>
          <label class="field">
            <span>Завершення дії</span>
            <input v-model="trialForm.ends_at" type="datetime-local" class="input" />
          </label>
        </template>

        <label class="field">
          <span>Причина</span>
          <textarea v-model="trialForm.reason" class="input input--textarea" rows="4" placeholder="Причина є обов’язковою" />
        </label>

        <div v-if="trialFormError" class="form-error">{{ trialFormError }}</div>

        <div class="setting-modal__footer">
          <button class="btn" type="button" :disabled="trialSaving" @click="submitTrialAction">
            {{ trialSaving ? 'Зберігаємо…' : 'Застосувати' }}
          </button>
          <button class="btn btn--ghost" type="button" :disabled="trialSaving" @click="closeTrialModal">Скасувати</button>
        </div>
      </section>
    </div>

    <div v-if="overrideModalOpen" class="setting-modal" @keydown.esc="closeOverrideModal">
      <div class="setting-modal__backdrop" @click="closeOverrideModal"></div>
      <section class="setting-modal__content panel" role="dialog" aria-modal="true" aria-label="Керувати перевизначенням доступу">
        <div class="panel__header">
          <div>
            <div class="badge badge--soft">ПЕРЕВИЗНАЧЕННЯ</div>
            <h3 class="panel__title">Керувати перевизначенням доступу</h3>
          </div>
          <button class="btn btn--ghost btn--sm" type="button" @click="closeOverrideModal">Закрити</button>
        </div>

        <label class="field">
          <span>Дія</span>
          <select v-model="overrideForm.action" class="input input--select">
            <option value="ENABLE">Увімкнути перевизначення</option>
            <option value="UPDATE">Оновити перевизначення</option>
            <option value="DISABLE">Вимкнути перевизначення</option>
          </select>
        </label>

        <template v-if="overrideForm.action !== 'DISABLE'">
          <label class="field">
            <span>Тариф</span>
            <select v-model="overrideForm.forced_plan" class="input input--select">
              <option value="START">START</option>
              <option value="PRO">PRO</option>
              <option value="LEADER">LEADER</option>
            </select>
          </label>
          <label class="field">
            <span>Початок дії (необов’язково)</span>
            <input v-model="overrideForm.starts_at" type="datetime-local" class="input" />
          </label>
          <label class="field">
            <span>Завершення дії (необов’язково)</span>
            <input v-model="overrideForm.expires_at" type="datetime-local" class="input" />
          </label>
        </template>

        <label class="field">
          <span>Причина</span>
          <textarea
            v-model="overrideForm.reason"
            class="input input--textarea"
            rows="4"
            placeholder="Причина є обов’язковою"
          />
        </label>

        <div v-if="overrideFormError" class="form-error">{{ overrideFormError }}</div>

        <div class="setting-modal__footer">
          <button class="btn" type="button" :disabled="overrideSaving" @click="submitOverrideAction">
            {{ overrideSaving ? 'Зберігаємо…' : 'Застосувати' }}
          </button>
          <button class="btn btn--ghost" type="button" :disabled="overrideSaving" @click="closeOverrideModal">
            Скасувати
          </button>
        </div>
      </section>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import { useToast } from '../composables/useToast'
import {
  applyAdminSpecialistOverrideAction,
  applyAdminSpecialistPlanAction,
  applyAdminSpecialistTrialAction,
  fetchAdminSpecialistAccessHistory,
  fetchAdminSpecialistDetail,
  getApiErrorMessage,
  type AdminSpecialistAccessHistoryItem,
  type AdminSpecialistDetailResponse,
} from '../lib/api'
import { formatUkDateTimeCompact } from '../lib/dateTime'

type TrialAction = 'START' | 'END'
type OverrideAction = 'ENABLE' | 'UPDATE' | 'DISABLE'

const route = useRoute()
const toast = useToast()

const loading = ref(false)
const error = ref('')
const detail = ref<AdminSpecialistDetailResponse | null>(null)

const historyLoading = ref(false)
const historyError = ref('')
const history = ref<AdminSpecialistAccessHistoryItem[]>([])

const planModalOpen = ref(false)
const planSaving = ref(false)
const planFormError = ref('')
const planForm = ref<{ plan: 'START' | 'PRO' | 'LEADER'; reason: string }>({ plan: 'START', reason: '' })

const trialModalOpen = ref(false)
const trialSaving = ref(false)
const trialFormError = ref('')
const trialForm = ref<{
  action: TrialAction
  trial_plan: 'PRO' | 'LEADER'
  starts_at: string
  ends_at: string
  reason: string
}>({
  action: 'START',
  trial_plan: 'PRO',
  starts_at: '',
  ends_at: '',
  reason: '',
})

const overrideModalOpen = ref(false)
const overrideSaving = ref(false)
const overrideFormError = ref('')
const overrideForm = ref<{
  action: OverrideAction
  forced_plan: 'START' | 'PRO' | 'LEADER'
  starts_at: string
  expires_at: string
  reason: string
}>({
  action: 'ENABLE',
  forced_plan: 'PRO',
  starts_at: '',
  expires_at: '',
  reason: '',
})

const specialistId = computed(() => Number(route.params.id))

function formatDate(value: string | null | undefined) {
  return formatUkDateTimeCompact(value)
}

function toInputDateTime(value?: string | null) {
  if (!value) return ''
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ''
  const pad = (num: number) => String(num).padStart(2, '0')
  const y = date.getFullYear()
  const m = pad(date.getMonth() + 1)
  const d = pad(date.getDate())
  const hh = pad(date.getHours())
  const mm = pad(date.getMinutes())
  return `${y}-${m}-${d}T${hh}:${mm}`
}

function toIsoOrNull(value?: string) {
  const normalized = String(value || '').trim()
  if (!normalized) return null
  const date = new Date(normalized)
  if (Number.isNaN(date.getTime())) return null
  return date.toISOString()
}

function pillClass(active: boolean) {
  return active ? 'status-pill status-pill--ok' : 'status-pill status-pill--muted'
}

function planLabel(value: string) {
  const code = String(value || '').trim().toUpperCase()
  if (!code) return '—'
  return code
}

function eventLabel(eventType: string) {
  const mapping: Record<string, string> = {
    BASE_PLAN_CHANGED: 'Базовий тариф змінено',
    TRIAL_STARTED: 'Тестовий доступ розпочато',
    TRIAL_ENDED: 'Тестовий доступ завершено',
    OVERRIDE_ENABLED: 'Перевизначення увімкнено',
    OVERRIDE_UPDATED: 'Перевизначення оновлено',
    OVERRIDE_DISABLED: 'Перевизначення вимкнено',
    REQUEST_APPROVED: 'Запит погоджено',
    REQUEST_REJECTED: 'Запит відхилено',
  }
  return mapping[eventType] || eventType
}

function beforeAfterSummary(item: AdminSpecialistAccessHistoryItem) {
  if (item.event_type === 'BASE_PLAN_CHANGED' && item.before_plan && item.after_plan) {
    return `Базовий тариф змінено: ${item.before_plan} → ${item.after_plan}`
  }
  if (item.event_type === 'TRIAL_STARTED') {
    const after = item.after_plan || '—'
    const untilDate = formatDate(
      (item.after_snapshot as { trial_ends_at?: string | null } | null)?.trial_ends_at || null
    )
    if (untilDate && untilDate !== '—') return `Тестовий доступ розпочато: ${after} до ${untilDate}`
    return `Тестовий доступ розпочато: ${after}`
  }
  if (item.event_type === 'TRIAL_ENDED') return 'Тестовий доступ завершено'
  if (item.event_type === 'OVERRIDE_ENABLED') {
    const after = item.after_plan || '—'
    return `Перевизначення увімкнено: ${after}`
  }
  if (item.event_type === 'OVERRIDE_UPDATED') {
    const after = item.after_plan || '—'
    return `Перевизначення оновлено: ${after}`
  }
  if (item.event_type === 'OVERRIDE_DISABLED') return 'Перевизначення вимкнено'
  if (item.event_type === 'REQUEST_APPROVED') return 'Запит погоджено'
  if (item.event_type === 'REQUEST_REJECTED') return 'Запит відхилено'
  if (item.before_plan && item.after_plan && item.before_plan !== item.after_plan) {
    return `Змінено: ${item.before_plan} → ${item.after_plan}`
  }
  return '—'
}

async function loadDetail() {
  if (!Number.isInteger(specialistId.value) || specialistId.value <= 0) {
    detail.value = null
    error.value = 'Некоректний id спеціаліста.'
    return
  }
  loading.value = true
  error.value = ''
  try {
    detail.value = await fetchAdminSpecialistDetail(specialistId.value)
  } catch (err) {
    detail.value = null
    error.value = getApiErrorMessage(err, 'Не вдалося завантажити деталку спеціаліста.')
  } finally {
    loading.value = false
  }
}

async function loadHistory() {
  if (!Number.isInteger(specialistId.value) || specialistId.value <= 0) {
    history.value = []
    historyError.value = 'Некоректний id спеціаліста.'
    return
  }
  historyLoading.value = true
  historyError.value = ''
  try {
    history.value = await fetchAdminSpecialistAccessHistory(specialistId.value)
  } catch (err) {
    history.value = []
    historyError.value = getApiErrorMessage(err, 'Не вдалося завантажити історію доступу.')
  } finally {
    historyLoading.value = false
  }
}

async function refreshAfterAction(successMessage: string) {
  await Promise.all([loadDetail(), loadHistory()])
  toast.success(successMessage)
}

function openPlanModal() {
  planFormError.value = ''
  const basePlan = String(detail.value?.tariff_access.base_plan || 'START').toUpperCase()
  planForm.value.plan = basePlan === 'PRO' || basePlan === 'LEADER' ? basePlan : 'START'
  planForm.value.reason = ''
  planModalOpen.value = true
}

function closePlanModal() {
  if (planSaving.value) return
  planModalOpen.value = false
}

async function submitPlanAction() {
  const reason = planForm.value.reason.trim()
  if (!reason) {
    planFormError.value = 'Причина є обов’язковою.'
    return
  }
  planFormError.value = ''
  planSaving.value = true
  try {
    await applyAdminSpecialistPlanAction(specialistId.value, {
      plan: planForm.value.plan,
      reason,
    })
    planModalOpen.value = false
    await refreshAfterAction('Базовий тариф оновлено')
  } catch (err) {
    planFormError.value = getApiErrorMessage(err, 'Не вдалося оновити базовий тариф')
  } finally {
    planSaving.value = false
  }
}

function openTrialModal() {
  trialFormError.value = ''
  trialForm.value.action = detail.value?.tariff_access.trial.active ? 'END' : 'START'
  trialForm.value.trial_plan = (detail.value?.tariff_access.trial.trial_plan || 'PRO') as 'PRO' | 'LEADER'
  trialForm.value.starts_at = toInputDateTime(detail.value?.tariff_access.trial.starts_at) || toInputDateTime(new Date().toISOString())
  const plus7d = new Date()
  plus7d.setDate(plus7d.getDate() + 7)
  trialForm.value.ends_at = toInputDateTime(detail.value?.tariff_access.trial.ends_at) || toInputDateTime(plus7d.toISOString())
  trialForm.value.reason = ''
  trialModalOpen.value = true
}

function closeTrialModal() {
  if (trialSaving.value) return
  trialModalOpen.value = false
}

async function submitTrialAction() {
  const reason = trialForm.value.reason.trim()
  if (!reason) {
    trialFormError.value = 'Причина є обов’язковою.'
    return
  }
  trialFormError.value = ''
  trialSaving.value = true
  try {
    if (trialForm.value.action === 'START') {
      const startsAt = toIsoOrNull(trialForm.value.starts_at)
      const endsAt = toIsoOrNull(trialForm.value.ends_at)
      if (!endsAt) {
        trialFormError.value = 'Для запуску тестового доступу потрібно вказати завершення дії.'
        return
      }
      await applyAdminSpecialistTrialAction(specialistId.value, {
        action: 'START',
        trial_plan: trialForm.value.trial_plan,
        starts_at: startsAt || undefined,
        ends_at: endsAt,
        reason,
      })
    } else {
      await applyAdminSpecialistTrialAction(specialistId.value, {
        action: 'END',
        reason,
      })
    }
    trialModalOpen.value = false
    await refreshAfterAction('Тестовий доступ оновлено')
  } catch (err) {
    trialFormError.value = getApiErrorMessage(err, 'Не вдалося оновити тестовий доступ')
  } finally {
    trialSaving.value = false
  }
}

function openOverrideModal() {
  overrideFormError.value = ''
  const overrideActive = Boolean(detail.value?.tariff_access.override.active)
  overrideForm.value.action = overrideActive ? 'UPDATE' : 'ENABLE'
  const overridePlan = String(detail.value?.tariff_access.override.override_plan || 'PRO').toUpperCase()
  overrideForm.value.forced_plan =
    overridePlan === 'START' || overridePlan === 'LEADER' ? overridePlan : 'PRO'
  overrideForm.value.starts_at = toInputDateTime(detail.value?.tariff_access.override.starts_at) || toInputDateTime(new Date().toISOString())
  overrideForm.value.expires_at = toInputDateTime(detail.value?.tariff_access.override.ends_at)
  overrideForm.value.reason = ''
  overrideModalOpen.value = true
}

function closeOverrideModal() {
  if (overrideSaving.value) return
  overrideModalOpen.value = false
}

async function submitOverrideAction() {
  const reason = overrideForm.value.reason.trim()
  if (!reason) {
    overrideFormError.value = 'Причина є обов’язковою.'
    return
  }
  overrideFormError.value = ''
  overrideSaving.value = true
  try {
    if (overrideForm.value.action === 'DISABLE') {
      await applyAdminSpecialistOverrideAction(specialistId.value, {
        action: 'DISABLE',
        reason,
      })
    } else {
      await applyAdminSpecialistOverrideAction(specialistId.value, {
        action: overrideForm.value.action,
        forced_plan: overrideForm.value.forced_plan,
        starts_at: toIsoOrNull(overrideForm.value.starts_at),
        expires_at: toIsoOrNull(overrideForm.value.expires_at),
        reason,
      })
    }
    overrideModalOpen.value = false
    await refreshAfterAction('Перевизначення оновлено')
  } catch (err) {
    overrideFormError.value = getApiErrorMessage(err, 'Не вдалося оновити перевизначення')
  } finally {
    overrideSaving.value = false
  }
}

watch(
  specialistId,
  async () => {
    await Promise.all([loadDetail(), loadHistory()])
  },
  { immediate: true }
)
</script>

<style scoped>
.admin-specialist-detail {
  display: grid;
  gap: 16px;
}

.admin-specialist-detail__hero {
  background: linear-gradient(135deg, rgba(8, 113, 201, 0.14), rgba(7, 47, 71, 0.06));
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.admin-specialist-detail__hero-actions {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.admin-specialist-detail__title {
  margin: 0;
}

.admin-specialist-detail__subtitle {
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

.summary-actions {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.summary-grid,
.access-grid,
.requests-grid {
  display: grid;
  gap: 10px;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
}

.summary-list {
  display: grid;
  gap: 8px;
  border: 1px solid var(--line);
  border-radius: var(--radius-sm);
  padding: 10px;
}

.access-warning {
  border: 1px solid color-mix(in srgb, #8b5f00 25%, var(--line));
  background: color-mix(in srgb, #8b5f00 8%, #fff);
  border-radius: var(--radius-sm);
  padding: 10px;
}

.request-highlight {
  display: grid;
  gap: 8px;
  border: 1px solid color-mix(in srgb, var(--primary) 20%, var(--line));
  border-radius: var(--radius-sm);
  padding: 10px;
  background: color-mix(in srgb, var(--primary) 5%, #fff);
}

.history-list {
  display: grid;
  gap: 10px;
}

.history-item {
  border: 1px solid var(--line);
  border-radius: var(--radius-sm);
  padding: 10px;
  display: grid;
  gap: 6px;
}

.history-item__head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
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

.status-pill--muted {
  background: rgba(109, 117, 139, 0.14);
  color: #4b5563;
}

.setting-modal {
  position: fixed;
  inset: 0;
  z-index: 60;
  display: grid;
  place-items: center;
  padding: 16px;
}

.setting-modal__backdrop {
  position: absolute;
  inset: 0;
  background: rgba(7, 16, 31, 0.56);
}

.setting-modal__content {
  position: relative;
  width: min(560px, calc(100vw - 24px));
  max-height: calc(100vh - 24px);
  overflow: auto;
}

.setting-modal__footer {
  display: flex;
  gap: 8px;
  justify-content: flex-end;
  flex-wrap: wrap;
}

.form-error {
  color: #b3261e;
  background: #fdecea;
  border: 1px solid #f5c2c0;
  border-radius: var(--radius-sm);
  padding: 8px 10px;
}

@media (max-width: 920px) {
  .admin-specialist-detail__hero {
    flex-direction: column;
    align-items: flex-start;
  }
}
</style>
