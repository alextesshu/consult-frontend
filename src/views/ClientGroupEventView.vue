<template>
  <section class="group-event">
    <header class="group-event__hero">
      <div>
        <div class="badge">Групова подія</div>
        <h1 class="title group-event__title">Деталі події</h1>
        <p class="muted group-event__subtitle">
          Тут зібрані деталі вашої участі та список учасників (якщо дозволено).
        </p>
      </div>
      <RouterLink class="btn btn--ghost" to="/client">Назад до кабінету</RouterLink>
    </header>

    <section class="panel">
      <div v-if="loading" class="muted">Завантаження...</div>
      <div v-else-if="error" class="error">{{ error }}</div>
      <div v-else-if="event" class="event-body">
        <div class="event-head">
          <div class="badge badge--soft">{{ formatMode(event.mode) }}</div>
          <div class="state-pill" :class="statePillClass(event.state)">{{ formatState(event.state) }}</div>
        </div>
        <div class="event-dates">
          <div>Початок: <strong>{{ formatDate(event.starts_at) || 'Не задано' }}</strong></div>
          <div>Завершення: <strong>{{ formatDate(event.ends_at) || 'Не задано' }}</strong></div>
        </div>
        <div class="event-host">Ведучий: <strong>{{ event.host_username || 'Невідомо' }}</strong></div>

        <div class="event-actions">
          <button class="btn" type="button" :disabled="event.state !== 'LIVE'">
            {{ event.state === 'LIVE' ? 'Приєднатись' : 'Очікуйте старт' }}
          </button>
          <div class="muted">Кнопка входу з'явиться, коли подія почнеться.</div>
        </div>

        <div class="event-participants">
          <div class="event-participants__title">Учасники</div>
          <div v-if="event.participants.length === 0" class="muted">
            Список учасників приховано організатором.
          </div>
          <div v-else class="participant-list">
            <div v-for="p in event.participants" :key="p.id" class="participant-row">
              <div class="participant-name">{{ p.user_username }}</div>
              <div class="muted">{{ formatRole(p.role) }}</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  </section>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useRoute } from 'vue-router'
import { http } from '../lib/http'

type GroupParticipant = {
  id: number
  user: number
  user_username: string
  role: 'HOST' | 'CO_HOST' | 'SPEAKER' | 'PARTICIPANT'
}

type GroupEventView = {
  id: number
  mode: 'MEETING' | 'BROADCAST'
  state: 'DRAFT' | 'SCHEDULED' | 'LIVE' | 'COMPLETED' | 'CANCELLED'
  participant_list_visibility: 'SHOW_NAMES' | 'HIDDEN'
  starts_at: string | null
  ends_at: string | null
  host_username: string | null
  participants: GroupParticipant[]
}

const route = useRoute()
const loading = ref(false)
const error = ref('')
const event = ref<GroupEventView | null>(null)

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

function formatMode(mode: GroupEventView['mode']) {
  if (mode === 'MEETING') return 'Зустріч'
  if (mode === 'BROADCAST') return 'Трансляція'
  return mode
}

function formatState(state: GroupEventView['state']) {
  if (state === 'DRAFT') return 'Чернетка'
  if (state === 'SCHEDULED') return 'Заплановано'
  if (state === 'LIVE') return 'Триває'
  if (state === 'COMPLETED') return 'Завершено'
  if (state === 'CANCELLED') return 'Скасовано'
  return state
}

function statePillClass(state: string) {
  if (state === 'LIVE') return 'state-pill--live'
  if (state === 'SCHEDULED') return 'state-pill--scheduled'
  if (state === 'CANCELLED') return 'state-pill--cancelled'
  if (state === 'COMPLETED') return 'state-pill--completed'
  return 'state-pill--draft'
}

function formatRole(role: GroupParticipant['role']) {
  if (role === 'HOST') return 'Ведучий'
  if (role === 'CO_HOST') return 'Співведучий'
  if (role === 'SPEAKER') return 'Доповідач'
  if (role === 'PARTICIPANT') return 'Учасник'
  return role
}

async function loadEvent() {
  const id = Number(route.params.id)
  if (!id) {
    error.value = 'Некоректний ідентифікатор події.'
    return
  }
  loading.value = true
  error.value = ''
  try {
    const resp = await http.get<GroupEventView>(`/booking/group-events/${id}/`)
    event.value = resp.data
  } catch (err: any) {
    error.value = err?.response?.data?.detail || 'Не вдалося завантажити подію'
  } finally {
    loading.value = false
  }
}

onMounted(loadEvent)
</script>

<style scoped>
.group-event {
  display: grid;
  gap: 18px;
}

.group-event__hero {
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

.group-event__title {
  font-size: 30px;
}

.panel {
  border: 1px solid var(--line);
  border-radius: 18px;
  padding: 18px;
  background: #fff;
}

.event-body {
  display: grid;
  gap: 12px;
}

.event-head {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
}

.event-dates {
  display: grid;
  gap: 4px;
}

.event-host {
  font-weight: 600;
}

.event-actions {
  display: grid;
  gap: 6px;
}

.event-participants {
  display: grid;
  gap: 8px;
  margin-top: 8px;
}

.event-participants__title {
  font-weight: 600;
}

.participant-list {
  display: grid;
  gap: 8px;
}

.participant-row {
  display: flex;
  justify-content: space-between;
  padding: 10px 12px;
  border-radius: 12px;
  border: 1px solid rgba(7, 47, 71, 0.12);
  background: rgba(7, 47, 71, 0.03);
}

.participant-name {
  font-weight: 600;
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

.error {
  color: #b3261e;
  background: #fdecea;
  border: 1px solid #f5c2c0;
  border-radius: 10px;
  padding: 8px 10px;
}

@media (max-width: 860px) {
  .group-event__hero {
    flex-direction: column;
    align-items: flex-start;
  }
}
</style>
