<template>
  <section class="session-detail">
    <header class="detail-hero">
      <div>
        <div class="badge">Сесія клієнта</div>
        <h1 class="title detail-title">Деталі сесії</h1>
        <p class="muted detail-subtitle">Перегляд статусу, скасування або перенесення.</p>
      </div>
      <RouterLink class="btn btn--ghost" to="/client">Назад до кабінету</RouterLink>
    </header>

    <div v-if="error" class="form-error">{{ error }}</div>
    <div v-if="loading" class="muted" style="margin-top: 12px;">Завантаження...</div>

    <section v-if="session" class="panel">
      <div class="panel__header">
        <div>
          <div class="badge badge--soft">Статус</div>
          <h2 class="panel__title">{{ statusLabel(session.status) }}</h2>
        </div>
      </div>
      <div class="detail-grid">
        <div class="detail-card">
          <div class="detail-label">Початок</div>
          <div class="detail-value">{{ formatDateTime(session.slot_start_at) }}</div>
        </div>
        <div class="detail-card">
          <div class="detail-label">Кінець</div>
          <div class="detail-value">{{ formatDateTime(session.slot_end_at) }}</div>
        </div>
        <div class="detail-card">
          <div class="detail-label">Терапевт</div>
          <div class="detail-value">#{{ session.therapist }}</div>
        </div>
      </div>

      <div class="action-row">
        <button
          class="btn btn--ghost"
          type="button"
          :disabled="actionLoading || !canCancel(session.status)"
          @click="cancelSession"
        >
          Скасувати сесію
        </button>
      </div>
    </section>

    <section v-if="session" class="panel">
      <div class="panel__header">
        <div>
          <div class="badge badge--soft">Перенесення</div>
          <h2 class="panel__title">Обрати новий слот</h2>
        </div>
      </div>
      <div class="muted" style="margin-top: 6px;">
        <span v-if="session.status === 'CONFIRMED'">
          Підтверджені сесії переносяться лише після підтвердження терапевта.
        </span>
        <span v-else>
          Перенесення виконується як нове бронювання зі скасуванням попередньої сесії.
        </span>
      </div>
      <div v-if="slotsLoading" class="muted" style="margin-top: 10px;">Завантаження слотів...</div>
      <div v-else-if="availableSlots.length === 0" class="muted" style="margin-top: 10px;">
        Немає доступних слотів.
      </div>
      <div v-else class="slot-list">
        <div v-for="slot in availableSlots" :key="slot.id" class="slot-card">
          <div>
            <div class="slot-time">{{ formatDateTime(slot.start_at) }}</div>
            <div class="muted">{{ formatDateTime(slot.end_at) }}</div>
          </div>
          <button
            class="btn btn--ghost btn--sm"
            type="button"
            :disabled="actionLoading"
            @click="session.status === 'CONFIRMED' ? requestReschedule(slot.id) : rescheduleTo(slot.id)"
          >
            {{ session.status === 'CONFIRMED' ? 'Запросити перенос' : 'Перенести сюди' }}
          </button>
        </div>
      </div>
    </section>
  </section>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { http } from '../lib/http'

type SessionDetail = {
  id: number
  status: string
  slot_start_at: string | null
  slot_end_at: string | null
  therapist: number
  client: number
}

type PublicSlot = {
  id: number
  start_at: string
  end_at: string
}

const route = useRoute()
const router = useRouter()
const sessionId = computed(() => Number(route.params.id))
const session = ref<SessionDetail | null>(null)
const loading = ref(false)
const error = ref('')
const actionLoading = ref(false)
const slotsLoading = ref(false)
const availableSlots = ref<PublicSlot[]>([])

const statusMap: Record<string, string> = {
  SCHEDULED: 'Заплановано',
  CONFIRMED: 'Підтверджено',
  COMPLETED: 'Завершено',
  CANCELLED: 'Скасовано',
  NO_SHOW: 'Не відбулося',
  DRAFT: 'Чернетка',
}

const statusLabel = (status: string) => statusMap[status] || status

const canCancel = (status: string) => status === 'SCHEDULED' || status === 'CONFIRMED'

function formatDateTime(value?: string | null) {
  if (!value) return '—'
  const dt = new Date(value)
  if (Number.isNaN(dt.getTime())) return value
  return dt.toLocaleString('uk-UA', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  })
}

async function loadSession() {
  if (!sessionId.value) return
  loading.value = true
  error.value = ''
  try {
    const resp = await http.get<SessionDetail>(`/booking/sessions/${sessionId.value}/`)
    session.value = resp.data
  } catch (err: any) {
    error.value = err?.response?.data?.detail || 'Не вдалося завантажити сесію'
  } finally {
    loading.value = false
  }
}

async function loadSlots() {
  if (!session.value) return
  slotsLoading.value = true
  try {
    const resp = await http.get<PublicSlot[]>('/booking/slots/', {
      params: { therapist_id: session.value.therapist, date_from: new Date().toISOString().slice(0, 10) },
    })
    availableSlots.value = (resp.data || []).filter((slot) => slot.id)
  } catch {
    availableSlots.value = []
  } finally {
    slotsLoading.value = false
  }
}

async function cancelSession() {
  if (!session.value) return
  actionLoading.value = true
  error.value = ''
  try {
    await http.patch(`/booking/sessions/${session.value.id}/cancel/`)
    await loadSession()
  } catch (err: any) {
    error.value = err?.response?.data?.detail || 'Не вдалося скасувати сесію'
  } finally {
    actionLoading.value = false
  }
}

async function rescheduleTo(slotId: number) {
  if (!session.value) return
  actionLoading.value = true
  error.value = ''
  try {
    await http.post('/booking/sessions/', { slot_id: slotId })
    await http.patch(`/booking/sessions/${session.value.id}/cancel/`)
    await loadSession()
    router.push('/client')
  } catch (err: any) {
    error.value = err?.response?.data?.detail || 'Не вдалося перенести сесію'
  } finally {
    actionLoading.value = false
  }
}

async function requestReschedule(slotId: number) {
  if (!session.value) return
  actionLoading.value = true
  error.value = ''
  try {
    await http.post(`/booking/sessions/${session.value.id}/reschedule-request/`, {
      slot_id: slotId,
    })
    router.push('/client')
  } catch (err: any) {
    error.value = err?.response?.data?.detail || 'Не вдалося надіслати запит на перенос'
  } finally {
    actionLoading.value = false
  }
}

onMounted(async () => {
  await loadSession()
  await loadSlots()
})
</script>

<style scoped>
.session-detail {
  display: grid;
  gap: 18px;
}

.detail-hero {
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

.detail-title {
  font-size: 32px;
}

.detail-subtitle {
  max-width: 520px;
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

.detail-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 12px;
}

.detail-card {
  padding: 12px 14px;
  border-radius: 14px;
  border: 1px solid rgba(7, 47, 71, 0.1);
  background: rgba(7, 47, 71, 0.04);
}

.detail-label {
  font-size: 12px;
  color: var(--muted);
  text-transform: uppercase;
  letter-spacing: 0.12em;
}

.detail-value {
  margin-top: 6px;
  font-weight: 600;
}

.action-row {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
}

.slot-list {
  display: grid;
  gap: 10px;
  margin-top: 12px;
}

.slot-card {
  border: 1px solid var(--line);
  border-radius: 12px;
  padding: 10px 12px;
  background: rgba(7, 47, 71, 0.04);
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.slot-time {
  font-weight: 600;
}

.btn--sm {
  padding: 6px 10px;
  font-size: 13px;
}

.form-error {
  color: #b3261e;
  background: #fdecea;
  border: 1px solid #f5c2c0;
  border-radius: 10px;
  padding: 8px 10px;
}

@media (max-width: 860px) {
  .detail-hero {
    flex-direction: column;
    align-items: flex-start;
  }
}
</style>
