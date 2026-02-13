<template>
  <section class="client">
    <header class="client__hero card">
      <div>
        <div class="eyebrow">Клієнтський кабінет</div>
        <h1 class="title">Ваші сесії</h1>
        <p class="muted">
          Тут зібрані всі заплановані та минулі сесії. Для нового запису відкрийте профіль терапевта.
        </p>
      </div>
      <RouterLink class="btn" to="/">Обрати терапевта</RouterLink>
    </header>

    <div class="client__grid">
      <div class="card">
        <div class="card__title">Найближчі</div>
        <div v-if="loading" class="muted">Завантаження...</div>
        <div v-else-if="upcoming.length === 0" class="muted">Немає запланованих сесій.</div>
        <ul v-else class="session-list">
          <li v-for="session in upcoming" :key="session.id" class="session-item">
            <div>
              <div class="session-time">{{ formatDateTime(session.slot?.start_at) }}</div>
              <div class="muted">Статус: {{ statusLabel(session.status) }}</div>
            </div>
            <div class="pill">{{ statusLabel(session.status) }}</div>
          </li>
        </ul>
      </div>

      <div class="card">
        <div class="card__title">Минулі</div>
        <div v-if="loading" class="muted">Завантаження...</div>
        <div v-else-if="past.length === 0" class="muted">Ще немає історії.</div>
        <ul v-else class="session-list">
          <li v-for="session in past" :key="session.id" class="session-item">
            <div>
              <div class="session-time">{{ formatDateTime(session.slot?.start_at) }}</div>
              <div class="muted">Статус: {{ statusLabel(session.status) }}</div>
            </div>
            <div class="pill pill--ghost">{{ statusLabel(session.status) }}</div>
          </li>
        </ul>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { http } from '../lib/http'

type Slot = {
  start_at: string
  end_at: string
}

type Session = {
  id: number
  status: string
  slot: Slot | null
}

const upcoming = ref<Session[]>([])
const past = ref<Session[]>([])
const loading = ref(false)

const statusMap: Record<string, string> = {
  SCHEDULED: 'Заплановано',
  CONFIRMED: 'Підтверджено',
  COMPLETED: 'Завершено',
  CANCELLED: 'Скасовано',
  NO_SHOW: 'Не відбулося',
  DRAFT: 'Чернетка',
}

const statusLabel = (status: string) => statusMap[status] || status

const formatDateTime = (value?: string | null) => {
  if (!value) return '—'
  const dt = new Date(value)
  if (Number.isNaN(dt.getTime())) return value
  return dt.toLocaleString('uk-UA', {
    year: 'numeric',
    month: 'short',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })
}

async function loadSessions() {
  loading.value = true
  try {
    const [upcomingResp, pastResp] = await Promise.all([
      http.get<Session[]>('/booking/sessions/', { params: { upcoming: true } }),
      http.get<Session[]>('/booking/sessions/', { params: { upcoming: false } }),
    ])
    upcoming.value = upcomingResp.data
    past.value = pastResp.data
  } finally {
    loading.value = false
  }
}

onMounted(loadSessions)
</script>

<style scoped>
.client {
  display: grid;
  gap: 20px;
}

.client__hero {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 18px;
}

.client__grid {
  display: grid;
  gap: 20px;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
}

.eyebrow {
  text-transform: uppercase;
  letter-spacing: 0.16em;
  font-size: 11px;
  color: var(--muted);
}

.session-list {
  list-style: none;
  padding: 0;
  margin: 12px 0 0;
  display: grid;
  gap: 10px;
}

.session-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 10px 12px;
  border-radius: 12px;
  background: rgba(111, 142, 151, 0.12);
}

.session-time {
  font-weight: 600;
}

.pill {
  padding: 6px 10px;
  border-radius: 999px;
  font-size: 12px;
  background: rgba(111, 142, 151, 0.2);
}

.pill--ghost {
  background: rgba(111, 142, 151, 0.12);
}

@media (max-width: 860px) {
  .client__hero {
    flex-direction: column;
    align-items: flex-start;
  }
}
</style>
