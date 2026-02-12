<template>
  <section class="card">
    <div class="page-header">
      <div>
        <h1 class="title" style="font-size: 28px;">Групові події</h1>
        <p class="muted">Керуйте груповими зустрічами та трансляціями.</p>
      </div>
      <RouterLink class="btn btn--ghost" to="/cabinet">Назад до кабінету</RouterLink>
    </div>

    <div v-if="me" class="group-toolbar">
      <div class="group-hint" v-if="!me.effective_entitlements?.group_room_enabled">
        Групові події недоступні на цьому плані.
      </div>
      <div class="group-actions" v-else>
        <button class="btn" type="button" @click="createDraft('MEETING')" :disabled="loading">
          Створити MEETING
        </button>
        <button class="btn btn--ghost" type="button" @click="createDraft('BROADCAST')" :disabled="loading">
          Створити BROADCAST
        </button>
      </div>
    </div>

    <div v-if="error" class="form-error" style="margin-top: 12px;">
      {{ error }}
    </div>

    <div v-if="loading" class="muted" style="margin-top: 12px;">
      Завантаження...
    </div>

    <div v-else class="group-list">
      <div v-if="events.length === 0" class="muted">Подій поки немає.</div>
      <div v-for="event in events" :key="event.id" class="group-card">
        <div class="badge">{{ event.mode }}</div>
        <div class="group-title">Стан: {{ event.state }}</div>
        <div class="muted">
          {{ formatDate(event.starts_at) || 'Без розкладу' }}
          <span v-if="event.ends_at">— {{ formatDate(event.ends_at) }}</span>
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
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue'
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
.page-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
}
.group-toolbar {
  margin-top: 16px;
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
  margin-top: 16px;
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 12px;
}
.group-card {
  border: 1px solid var(--line);
  border-radius: 14px;
  padding: 14px;
  background: #fff;
}
.group-title {
  margin: 8px 0 4px;
  font-weight: 600;
}
.group-card-actions {
  margin-top: 10px;
}
.btn--sm {
  padding: 6px 10px;
  font-size: 13px;
}
</style>
