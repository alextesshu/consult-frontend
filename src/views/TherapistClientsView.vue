<template>
  <section class="clients">
    <header class="clients__hero">
      <div>
        <div class="badge">Клієнти</div>
        <h1 class="title clients__title">CRM терапевта</h1>
        <p class="muted clients__subtitle">
          Управління статусами клієнтів та доступом до активної роботи.
        </p>
      </div>
      <RouterLink class="btn btn--ghost" to="/cabinet">Назад до кабінету</RouterLink>
    </header>

    <div v-if="error" class="form-error">{{ error }}</div>
    <div v-if="loading" class="muted" style="margin-top: 12px;">Завантаження...</div>

    <section class="panel">
      <div class="panel__header">
        <div>
          <div class="badge badge--soft">Список</div>
          <h2 class="panel__title">Клієнти</h2>
        </div>
      </div>
      <div class="filters">
        <button class="btn btn--ghost btn--sm" :class="{ 'btn--active': filter === 'ALL' }" @click="setFilter('ALL')">
          Усі
        </button>
        <button class="btn btn--ghost btn--sm" :class="{ 'btn--active': filter === 'ACTIVE' }" @click="setFilter('ACTIVE')">
          Активні
        </button>
        <button class="btn btn--ghost btn--sm" :class="{ 'btn--active': filter === 'INACTIVE' }" @click="setFilter('INACTIVE')">
          Неактивні
        </button>
        <button class="btn btn--ghost btn--sm" :class="{ 'btn--active': filter === 'ARCHIVED' }" @click="setFilter('ARCHIVED')">
          Архів
        </button>
      </div>

      <div v-if="filteredClients.length === 0 && !loading" class="muted">
        Немає клієнтів для цього фільтра.
      </div>
      <div v-else class="client-list">
        <article v-for="client in filteredClients" :key="client.client" class="client-card">
          <div class="client-info">
            <div class="client-name">{{ client.client_username || `Клієнт #${client.client}` }}</div>
            <div class="muted">Статус: {{ client.state }}</div>
            <div class="muted">Остання сесія: {{ formatDateTime(client.last_session_at) }}</div>
            <div class="muted">Заплановано: {{ client.upcoming_count ?? 0 }}</div>
          </div>
          <div class="client-actions">
            <button
              v-if="client.state !== 'ARCHIVED'"
              class="btn btn--ghost btn--sm"
              type="button"
              :disabled="isActionLoading(client.client)"
              @click="archiveClient(client.client)"
            >
              Архівувати
            </button>
            <button
              v-else
              class="btn btn--ghost btn--sm"
              type="button"
              :disabled="isActionLoading(client.client)"
              @click="restoreClient(client.client)"
            >
              Відновити
            </button>
          </div>
        </article>
      </div>
    </section>
  </section>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { http } from '../lib/http'

type ClientState = {
  id: number
  client: number
  state: 'CREATED' | 'ACTIVE' | 'INACTIVE' | 'ARCHIVED'
  last_session_at: string | null
  upcoming_count: number
  client_username?: string
}

const clients = ref<ClientState[]>([])
const loading = ref(false)
const error = ref('')
const filter = ref<'ALL' | 'ACTIVE' | 'INACTIVE' | 'ARCHIVED'>('ALL')
const actionLoading = ref<Set<number>>(new Set())

const filteredClients = computed(() => {
  if (filter.value === 'ALL') return clients.value
  return clients.value.filter((client) => client.state === filter.value)
})

const isActionLoading = (id: number) => actionLoading.value.has(id)

function setFilter(value: 'ALL' | 'ACTIVE' | 'INACTIVE' | 'ARCHIVED') {
  filter.value = value
}

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

function setActionLoading(id: number, value: boolean) {
  const next = new Set(actionLoading.value)
  if (value) {
    next.add(id)
  } else {
    next.delete(id)
  }
  actionLoading.value = next
}

async function loadClients() {
  loading.value = true
  error.value = ''
  try {
    const resp = await http.get<ClientState[]>('/cabinet/clients/')
    clients.value = resp.data || []
  } catch (err: any) {
    error.value = err?.response?.data?.detail || 'Не вдалося завантажити клієнтів'
  } finally {
    loading.value = false
  }
}

async function archiveClient(id: number) {
  setActionLoading(id, true)
  error.value = ''
  try {
    await http.patch(`/cabinet/clients/${id}/archive/`)
    await loadClients()
  } catch (err: any) {
    error.value = err?.response?.data?.detail || 'Не вдалося архівувати клієнта'
  } finally {
    setActionLoading(id, false)
  }
}

async function restoreClient(id: number) {
  setActionLoading(id, true)
  error.value = ''
  try {
    await http.patch(`/cabinet/clients/${id}/restore/`)
    await loadClients()
  } catch (err: any) {
    error.value = err?.response?.data?.detail || 'Не вдалося відновити клієнта'
  } finally {
    setActionLoading(id, false)
  }
}

onMounted(loadClients)
</script>

<style scoped>
.clients {
  display: grid;
  gap: 18px;
}

.clients__hero {
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

.clients__title {
  font-size: 32px;
}

.clients__subtitle {
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

.filters {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.btn--active {
  border-color: #0b4a7d;
  color: #0b4a7d;
  background: #eef6ff;
}

.client-list {
  display: grid;
  gap: 12px;
  margin-top: 10px;
}

.client-card {
  border: 1px solid var(--line);
  border-radius: 16px;
  padding: 14px;
  background: #fff;
  display: grid;
  gap: 12px;
}

.client-info {
  display: grid;
  gap: 6px;
}

.client-name {
  font-weight: 600;
}

.client-actions {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
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
  .clients__hero {
    flex-direction: column;
    align-items: flex-start;
  }
}
</style>
