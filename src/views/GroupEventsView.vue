<template>
  <section class="groups">
    <header class="groups__hero">
      <div>
        <div class="badge">Group Room</div>
        <h1 class="title groups__title">Групові події</h1>
        <p class="muted groups__subtitle">
          Керуйте зустрічами та трансляціями. План визначає доступ і місткість.
        </p>
      </div>
      <RouterLink class="btn btn--ghost" to="/cabinet">Назад до кабінету</RouterLink>
    </header>

    <section class="panel">
      <div class="panel__header">
        <div>
          <div class="badge badge--soft">Статус доступу</div>
          <h2 class="panel__title">Поточні можливості</h2>
        </div>
        <div class="access-chip" :class="accessChipClass">{{ accessLabel }}</div>
      </div>
      <div class="access-grid">
        <div class="access-card">
          <div class="access-title">Group Room</div>
          <div class="access-value">{{ groupRoomLabel }}</div>
        </div>
        <div class="access-card">
          <div class="access-title">Meeting ліміт</div>
          <div class="access-value">{{ meetingLimitLabel }}</div>
        </div>
        <div class="access-card">
          <div class="access-title">Broadcast</div>
          <div class="access-value">{{ broadcastLabel }}</div>
        </div>
      </div>
      <div v-if="!groupRoomEnabled" class="group-hint">
        Групові події недоступні на цьому плані. Підготовка можлива лише після оновлення доступу.
      </div>
      <div v-else class="group-actions">
        <button class="btn" type="button" @click="createDraft('MEETING')" :disabled="loading">
          Створити MEETING
        </button>
        <button class="btn btn--ghost" type="button" @click="createDraft('BROADCAST')" :disabled="loading">
          Створити BROADCAST
        </button>
      </div>
    </section>

    <div v-if="error" class="form-error">{{ error }}</div>
    <div v-if="loading" class="muted" style="margin-top: 12px;">Завантаження...</div>

    <section v-else class="group-list">
      <div v-if="events.length === 0" class="muted">Подій поки немає.</div>
      <article v-for="event in events" :key="event.id" class="group-card">
        <div class="group-card__header">
          <div class="badge badge--soft">{{ event.mode }}</div>
          <div class="state-pill" :class="statePillClass(event.state)">{{ event.state }}</div>
        </div>
        <div class="group-title">Старт: {{ formatDate(event.starts_at) || 'Без розкладу' }}</div>
        <div class="muted">
          Завершення: {{ formatDate(event.ends_at) || 'Не задано' }}
        </div>
        <div class="group-card-actions">
          <button
            v-if="event.state === 'DRAFT'"
            class="btn btn--ghost btn--sm"
            type="button"
            @click="deleteDraft(event)"
            :disabled="loading"
          >
            Видалити
          </button>
        </div>
      </article>
    </section>
  </section>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { storeToRefs } from 'pinia'
import { useAuthStore } from '../stores/auth'
import { http } from '../lib/http'

type GroupEvent = {
  id: number
  mode: 'MEETING' | 'BROADCAST'
  state: string
  starts_at: string | null
  ends_at: string | null
}

const auth = useAuthStore()
const { me } = storeToRefs(auth)
const events = ref<GroupEvent[]>([])
const loading = ref(false)
const error = ref('')

const groupRoomEnabled = computed(() => !!me.value?.effective_entitlements?.group_room_enabled)

const meetingLimitLabel = computed(() => {
  const limit = me.value?.effective_entitlements?.group_room_meeting_limit
  if (limit === null || limit === undefined) return 'Н/Д'
  return Number.isFinite(limit) ? String(limit) : '∞'
})

const broadcastLabel = computed(() => {
  const enabled = me.value?.effective_entitlements?.group_room_broadcast_enabled
  if (enabled === null || enabled === undefined) return 'Н/Д'
  return enabled ? 'Доступний' : 'Недоступний'
})

const groupRoomLabel = computed(() => {
  if (!me.value?.effective_entitlements) return 'Н/Д'
  return groupRoomEnabled.value ? 'Увімкнено' : 'Вимкнено'
})

const accessLabel = computed(() => {
  const state = me.value?.access_state
  if (!state) return 'Невідомо'
  if (state === 'OK') return 'Повний доступ'
  if (state === 'GRACE') return 'Пільговий доступ'
  if (state === 'RESTRICTED') return 'Обмежений режим'
  return state
})

const accessChipClass = computed(() => {
  const state = me.value?.access_state
  if (state === 'GRACE') return 'access-chip--warn'
  if (state === 'RESTRICTED') return 'access-chip--danger'
  return 'access-chip--ok'
})

function statePillClass(state: string) {
  if (state === 'LIVE') return 'state-pill--live'
  if (state === 'SCHEDULED') return 'state-pill--scheduled'
  if (state === 'CANCELLED') return 'state-pill--cancelled'
  if (state === 'COMPLETED') return 'state-pill--completed'
  return 'state-pill--draft'
}

function formatDate(value: string | null) {
  if (!value) return ''
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

async function loadEvents() {
  loading.value = true
  error.value = ''
  try {
    const resp = await http.get<GroupEvent[]>('/cabinet/group-events/')
    events.value = resp.data || []
  } catch (err: any) {
    error.value = err?.response?.data?.detail || 'Не вдалося завантажити події'
  } finally {
    loading.value = false
  }
}

async function createDraft(mode: GroupEvent['mode']) {
  loading.value = true
  error.value = ''
  try {
    const resp = await http.post<GroupEvent>('/cabinet/group-events/', { mode })
    events.value = [resp.data, ...events.value]
  } catch (err: any) {
    const data = err?.response?.data
    error.value = data?.detail || data?.code || 'Не вдалося створити подію'
  } finally {
    loading.value = false
  }
}

async function deleteDraft(event: GroupEvent) {
  loading.value = true
  error.value = ''
  try {
    await http.delete(`/cabinet/group-events/${event.id}/`)
    events.value = events.value.filter((item) => item.id !== event.id)
  } catch (err: any) {
    const data = err?.response?.data
    error.value = data?.detail || data?.code || 'Не вдалося видалити подію'
  } finally {
    loading.value = false
  }
}

onMounted(loadEvents)
</script>

<style scoped>
.groups {
  display: grid;
  gap: 18px;
}

.groups__hero {
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  gap: 20px;
  background: linear-gradient(135deg, rgba(8, 113, 201, 0.16), rgba(7, 47, 71, 0.06));
  border: 1px solid var(--line);
  border-radius: var(--radius);
  padding: 22px 24px;
  box-shadow: var(--shadow);
}

.groups__title {
  font-size: 32px;
}

.groups__subtitle {
  max-width: 520px;
}

.panel {
  border: 1px solid var(--line);
  border-radius: 18px;
  padding: 18px;
  background: #fff;
  display: grid;
  gap: 16px;
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

.access-chip {
  padding: 6px 12px;
  border-radius: 999px;
  font-size: 12px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  background: rgba(31, 122, 76, 0.16);
  color: #1f7a4c;
}

.access-chip--warn {
  background: rgba(217, 164, 65, 0.2);
  color: #a57011;
}

.access-chip--danger {
  background: rgba(194, 75, 75, 0.2);
  color: #a03838;
}

.access-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 12px;
}

.access-card {
  padding: 12px 14px;
  border-radius: 14px;
  border: 1px solid rgba(7, 47, 71, 0.1);
  background: rgba(7, 47, 71, 0.04);
}

.access-title {
  font-size: 12px;
  color: var(--muted);
  text-transform: uppercase;
  letter-spacing: 0.12em;
}

.access-value {
  margin-top: 6px;
  font-weight: 600;
}

.group-actions {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
}

.group-hint {
  color: #8a6d3b;
  background: #fff7e6;
  border: 1px solid #f3e1b3;
  padding: 10px 12px;
  border-radius: 12px;
}

.group-list {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 12px;
}

.group-card {
  border: 1px solid var(--line);
  border-radius: 16px;
  padding: 16px;
  background: #fff;
}

.group-card__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.group-title {
  margin: 10px 0 4px;
  font-weight: 600;
}

.group-card-actions {
  margin-top: 10px;
}

.state-pill {
  font-size: 11px;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  padding: 6px 10px;
  border-radius: 999px;
  background: #eef6ff;
  color: #0b4a7d;
}

.state-pill--draft {
  background: #eef6ff;
  color: #0b4a7d;
}

.state-pill--scheduled {
  background: rgba(217, 164, 65, 0.18);
  color: #a57011;
}

.state-pill--live {
  background: rgba(31, 122, 76, 0.18);
  color: #1f7a4c;
}

.state-pill--completed {
  background: rgba(7, 47, 71, 0.12);
  color: #13455e;
}

.state-pill--cancelled {
  background: rgba(194, 75, 75, 0.18);
  color: #a03838;
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
  .groups__hero {
    flex-direction: column;
    align-items: flex-start;
  }
}
</style>
