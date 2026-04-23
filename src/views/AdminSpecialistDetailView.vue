<template>
  <section class="admin-specialist-detail">
    <header class="admin-specialist-detail__hero panel">
      <div>
        <div class="badge">Адмін</div>
        <h1 class="title admin-specialist-detail__title">Деталка спеціаліста</h1>
        <p class="muted admin-specialist-detail__subtitle">
          Поточний стан доступу, повʼязані запити та історія ручних змін.
        </p>
      </div>
      <div class="admin-specialist-detail__hero-actions">
        <RouterLink class="btn btn--ghost" to="/admin/inbox">До inbox</RouterLink>
        <RouterLink class="btn btn--ghost" to="/admin/billing-access-requests">До запитів на тариф</RouterLink>
      </div>
    </header>

    <div v-if="loading" class="muted">Завантаження деталки спеціаліста…</div>
    <div v-else-if="error" class="form-error">{{ error }}</div>

    <template v-else-if="detail">
      <section class="panel">
        <div class="panel__header">
          <div>
            <div class="badge badge--soft">Summary</div>
            <h2 class="panel__title">{{ detail.identity.display_name || detail.identity.username }}</h2>
          </div>
          <button class="btn btn--sm" type="button" @click="openPlanModal">Змінити базовий тариф</button>
        </div>

        <div class="summary-grid">
          <div><span class="muted">ID:</span> {{ detail.identity.id }}</div>
          <div><span class="muted">Username:</span> @{{ detail.identity.username }}</div>
          <div><span class="muted">Email:</span> {{ detail.identity.email || '—' }}</div>
          <div><span class="muted">Slug:</span> {{ detail.identity.slug || '—' }}</div>
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
            <div class="badge badge--soft">Поточний доступ</div>
            <h2 class="panel__title">Base / Effective</h2>
          </div>
        </div>

        <div class="access-grid">
          <div>
            <div class="muted">Base plan</div>
            <strong>{{ detail.tariff_access.base_plan }}</strong>
          </div>
          <div>
            <div class="muted">Effective plan</div>
            <strong>{{ detail.tariff_access.effective_plan }}</strong>
          </div>
          <div>
            <div class="muted">Active trial</div>
            <span :class="pillClass(detail.tariff_access.trial.active)">
              {{ detail.tariff_access.trial.active ? 'Active' : 'Inactive' }}
            </span>
          </div>
          <div>
            <div class="muted">Active override</div>
            <span :class="pillClass(detail.tariff_access.override.active)">
              {{ detail.tariff_access.override.active ? 'Active' : 'Inactive' }}
            </span>
          </div>
        </div>

        <div
          v-if="detail.tariff_access.override.active && detail.tariff_access.base_plan !== detail.tariff_access.effective_plan"
          class="access-warning"
        >
          Активний override перекриває базовий тариф.
        </div>
      </section>

      <section class="panel">
        <div class="panel__header">
          <div>
            <div class="badge badge--soft">Повʼязані запити</div>
            <h2 class="panel__title">Open requests summary</h2>
          </div>
        </div>
        <div class="requests-grid">
          <div>
            <span class="muted">Відкриті billing/admin requests:</span>
            {{ detail.admin_context.open_billing_admin_requests_count }}
          </div>
          <div>
            <span class="muted">Відкриті inbox item:</span>
            {{ detail.admin_context.open_admin_inbox_items_count ?? 0 }}
          </div>
          <div v-if="detail.admin_context.latest_related_request_summary">
            <span class="muted">Останній запит:</span>
            #{{ detail.admin_context.latest_related_request_summary.id }}
            · {{ detail.admin_context.latest_related_request_summary.status }}
            · {{ detail.admin_context.latest_related_request_summary.requested_plan || '—' }}
          </div>
          <div v-else class="muted">Немає відкритих запитів.</div>
        </div>
      </section>

      <section class="panel">
        <div class="panel__header">
          <div>
            <div class="badge badge--soft">Історія змін доступу</div>
            <h2 class="panel__title">Audit trail</h2>
          </div>
        </div>
        <div v-if="historyLoading" class="muted">Завантаження історії…</div>
        <div v-else-if="historyError" class="form-error">{{ historyError }}</div>
        <div v-else-if="history.length === 0" class="muted">Історія змін поки порожня.</div>
        <div v-else class="history-list">
          <article v-for="item in history" :key="item.id" class="history-item">
            <div class="history-item__head">
              <strong>{{ item.event_type }}</strong>
              <span class="muted">{{ formatDate(item.created_at) }}</span>
            </div>
            <div><span class="muted">Actor:</span> {{ item.actor_username || 'SYSTEM' }}</div>
            <div><span class="muted">Reason:</span> {{ item.reason || '—' }}</div>
          </article>
        </div>
      </section>
    </template>

    <div v-if="planModalOpen" class="setting-modal" @keydown.esc="closePlanModal">
      <div class="setting-modal__backdrop" @click="closePlanModal"></div>
      <section class="setting-modal__content panel" role="dialog" aria-modal="true" aria-label="Змінити базовий тариф">
        <div class="panel__header">
          <div>
            <div class="badge badge--soft">Admin action</div>
            <h3 class="panel__title">Змінити базовий тариф</h3>
          </div>
          <button class="btn btn--ghost btn--sm" type="button" @click="closePlanModal">Закрити</button>
        </div>

        <label class="field">
          <span>Plan</span>
          <select v-model="planForm.plan" class="input input--select">
            <option value="START">START</option>
            <option value="PRO">PRO</option>
            <option value="LEADER">LEADER</option>
          </select>
        </label>

        <label class="field">
          <span>Reason</span>
          <textarea
            v-model="planForm.reason"
            class="input input--textarea"
            rows="4"
            placeholder="Вкажіть причину ручної зміни тарифу"
          />
        </label>

        <div v-if="planFormError" class="form-error">{{ planFormError }}</div>

        <div class="setting-modal__footer">
          <button class="btn" type="button" :disabled="planSaving" @click="submitPlanAction">
            {{ planSaving ? 'Зберігаємо…' : 'Застосувати' }}
          </button>
          <button class="btn btn--ghost" type="button" :disabled="planSaving" @click="closePlanModal">
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
  applyAdminSpecialistPlanAction,
  fetchAdminSpecialistAccessHistory,
  fetchAdminSpecialistDetail,
  getApiErrorMessage,
  type AdminSpecialistAccessHistoryItem,
  type AdminSpecialistDetailResponse,
} from '../lib/api'
import { formatUkDateTimeCompact } from '../lib/dateTime'

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
const planForm = ref<{ plan: 'START' | 'PRO' | 'LEADER'; reason: string }>({
  plan: 'START',
  reason: '',
})

const specialistId = computed(() => Number(route.params.id))

function formatDate(value: string | null | undefined) {
  return formatUkDateTimeCompact(value)
}

function pillClass(active: boolean) {
  return active ? 'status-pill status-pill--ok' : 'status-pill status-pill--muted'
}

async function loadDetail() {
  if (!Number.isInteger(specialistId.value) || specialistId.value <= 0) {
    error.value = 'Некоректний id спеціаліста.'
    detail.value = null
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

function openPlanModal() {
  planFormError.value = ''
  const basePlan = String(detail.value?.tariff_access?.base_plan || 'START').toUpperCase()
  if (basePlan === 'PRO' || basePlan === 'LEADER' || basePlan === 'START') {
    planForm.value.plan = basePlan
  } else {
    planForm.value.plan = 'START'
  }
  planForm.value.reason = ''
  planModalOpen.value = true
}

function closePlanModal() {
  if (planSaving.value) return
  planModalOpen.value = false
}

async function submitPlanAction() {
  planFormError.value = ''
  const reason = planForm.value.reason.trim()
  if (!reason) {
    planFormError.value = 'Поле reason є обовʼязковим.'
    return
  }
  if (!Number.isInteger(specialistId.value) || specialistId.value <= 0) {
    planFormError.value = 'Некоректний id спеціаліста.'
    return
  }

  planSaving.value = true
  try {
    await applyAdminSpecialistPlanAction(specialistId.value, {
      plan: planForm.value.plan,
      reason,
    })
    await Promise.all([loadDetail(), loadHistory()])
    planModalOpen.value = false
    toast.success('Базовий тариф змінено.')
  } catch (err) {
    planFormError.value = getApiErrorMessage(err, 'Не вдалося змінити базовий тариф.')
  } finally {
    planSaving.value = false
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

.summary-grid,
.access-grid,
.requests-grid {
  display: grid;
  gap: 10px;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
}

.access-warning {
  border: 1px solid color-mix(in srgb, #8b5f00 25%, var(--line));
  background: color-mix(in srgb, #8b5f00 8%, #fff);
  border-radius: var(--radius-sm);
  padding: 10px;
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

@media (max-width: 860px) {
  .admin-specialist-detail__hero {
    flex-direction: column;
    align-items: flex-start;
  }
}
</style>
