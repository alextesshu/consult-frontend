<template>
  <section class="card">
    <div class="page-header">
      <div>
        <h1 class="title" style="font-size: 28px;">Слоти терапевта</h1>
        <p class="muted">Створюйте та керуйте слотами для сесій.</p>
      </div>
      <RouterLink class="btn btn--ghost" to="/cabinet">Назад до кабінету</RouterLink>
    </div>

    <form class="slot-form" @submit.prevent="createSlot">
      <label class="field">
        Початок
        <input
          v-model="newStart"
          class="input"
          type="datetime-local"
          lang="uk"
          required
          @click="openPicker"
        />
      </label>
      <label class="field">
        Кінець
        <input
          v-model="newEnd"
          class="input"
          type="datetime-local"
          lang="uk"
          required
          @click="openPicker"
        />
      </label>
      <button class="btn" type="submit" :disabled="loading">Створити слот</button>
    </form>

    <div v-if="error" class="form-error" style="margin-top: 12px;">{{ error }}</div>
    <div v-if="loading" class="muted" style="margin-top: 12px;">Завантаження...</div>

    <div v-else class="slot-list">
      <div v-if="slots.length === 0" class="muted">Слотів поки немає.</div>
      <div v-for="slot in slots" :key="slot.id" class="slot-card">
        <div class="slot-row">
          <div class="slot-meta">
            <div class="slot-label">Початок</div>
            <template v-if="isEditing(slot.id)">
              <input
                v-model="editStart"
                class="input input--sm"
                type="datetime-local"
                lang="uk"
                @click="openPicker"
              />
            </template>
            <template v-else>
              <div>{{ formatDate(slot.start_at) }}</div>
            </template>
          </div>
          <div class="slot-meta">
            <div class="slot-label">Кінець</div>
            <template v-if="isEditing(slot.id)">
              <input
                v-model="editEnd"
                class="input input--sm"
                type="datetime-local"
                lang="uk"
                @click="openPicker"
              />
            </template>
            <template v-else>
              <div>{{ formatDate(slot.end_at) }}</div>
            </template>
          </div>
          <div class="slot-status" :class="{ 'slot-status--booked': slot.is_booked }">
            {{ slot.is_booked ? 'Заброньовано' : 'Вільно' }}
          </div>
        </div>
        <div class="slot-actions">
          <button
            v-if="!isEditing(slot.id)"
            class="btn btn--ghost btn--sm"
            type="button"
            :disabled="slot.is_booked || loading"
            @click="startEdit(slot)"
          >
            Редагувати
          </button>
          <button
            v-else
            class="btn btn--sm"
            type="button"
            :disabled="loading"
            @click="saveEdit(slot.id)"
          >
            Зберегти
          </button>
          <button
            v-if="isEditing(slot.id)"
            class="btn btn--ghost btn--sm"
            type="button"
            :disabled="loading"
            @click="cancelEdit"
          >
            Скасувати
          </button>
          <button
            class="btn btn--ghost btn--sm"
            type="button"
            :disabled="slot.is_booked || loading"
            @click="deleteSlot(slot.id)"
          >
            Видалити
          </button>
        </div>
        <div v-if="slot.is_booked" class="muted slot-hint">
          Слот вже заброньовано — редагування та видалення недоступні.
        </div>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { http } from '../lib/http'

type Slot = {
  id: number
  start_at: string
  end_at: string
  is_booked: boolean
}

const slots = ref<Slot[]>([])
const loading = ref(false)
const error = ref('')

const newStart = ref('')
const newEnd = ref('')

const editingId = ref<number | null>(null)
const editStart = ref('')
const editEnd = ref('')

function formatDate(value: string) {
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

function toLocalInputValue(value: string) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ''
  const offset = date.getTimezoneOffset() * 60000
  return new Date(date.getTime() - offset).toISOString().slice(0, 16)
}

function toIso(value: string) {
  const dt = new Date(value)
  if (Number.isNaN(dt.getTime())) return value
  return dt.toISOString()
}

function isEditing(id: number) {
  return editingId.value === id
}

function openPicker(event: Event) {
  const target = event.target as HTMLInputElement | null
  if (!target) return
  if (typeof target.showPicker === 'function') {
    target.showPicker()
  }
}

async function loadSlots() {
  loading.value = true
  error.value = ''
  try {
    const resp = await http.get<Slot[]>('/cabinet/slots/')
    slots.value = resp.data || []
  } catch (err: any) {
    error.value = err?.response?.data?.detail || 'Не вдалося завантажити слоти'
  } finally {
    loading.value = false
  }
}

async function createSlot() {
  loading.value = true
  error.value = ''
  try {
    const payload = {
      start_at: toIso(newStart.value),
      end_at: toIso(newEnd.value),
    }
    const resp = await http.post<Slot>('/cabinet/slots/', payload)
    slots.value = [...slots.value, resp.data]
    newStart.value = ''
    newEnd.value = ''
  } catch (err: any) {
    error.value = err?.response?.data?.detail || 'Не вдалося створити слот'
  } finally {
    loading.value = false
  }
}

function startEdit(slot: Slot) {
  editingId.value = slot.id
  editStart.value = toLocalInputValue(slot.start_at)
  editEnd.value = toLocalInputValue(slot.end_at)
}

function cancelEdit() {
  editingId.value = null
  editStart.value = ''
  editEnd.value = ''
}

async function saveEdit(slotId: number) {
  loading.value = true
  error.value = ''
  try {
    const payload = {
      start_at: toIso(editStart.value),
      end_at: toIso(editEnd.value),
    }
    const resp = await http.patch<Slot>(`/cabinet/slots/${slotId}/`, payload)
    slots.value = slots.value.map((slot) => (slot.id === slotId ? resp.data : slot))
    cancelEdit()
  } catch (err: any) {
    error.value = err?.response?.data?.detail || 'Не вдалося оновити слот'
  } finally {
    loading.value = false
  }
}

async function deleteSlot(slotId: number) {
  loading.value = true
  error.value = ''
  try {
    await http.delete(`/cabinet/slots/${slotId}/`)
    slots.value = slots.value.filter((slot) => slot.id !== slotId)
  } catch (err: any) {
    error.value = err?.response?.data?.detail || 'Не вдалося видалити слот'
  } finally {
    loading.value = false
  }
}

onMounted(loadSlots)
</script>

<style scoped>
.page-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
}
.slot-form {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 12px;
  margin-top: 16px;
}
.slot-list {
  margin-top: 16px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.slot-card {
  border: 1px solid var(--line);
  border-radius: 14px;
  padding: 14px;
  background: #fff;
}
.slot-row {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
  gap: 12px;
  align-items: center;
}
.slot-meta {
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.slot-label {
  font-size: 12px;
  color: var(--muted);
}
.slot-status {
  font-size: 13px;
  padding: 6px 10px;
  border-radius: 999px;
  background: #eef6ff;
  color: #0b4a7d;
  width: fit-content;
}
.slot-status--booked {
  background: #f6e9e9;
  color: #8a2c2c;
}
.slot-actions {
  margin-top: 12px;
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}
.slot-hint {
  margin-top: 6px;
  font-size: 12px;
}
.btn--sm {
  padding: 6px 10px;
  font-size: 13px;
}
.input--sm {
  padding: 8px 10px;
  font-size: 13px;
}
</style>
