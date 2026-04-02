<template>
  <section class="external-sessions">
    <header class="external-sessions__hero">
      <div>
        <div class="badge">Зовнішні сесії</div>
        <h1 class="title external-sessions__title">Зовнішні сесії</h1>
        <p class="muted external-sessions__subtitle">
          Окремий розділ для сесій із зовнішніми гостями без змішування з основним сценарієм бронювання.
        </p>
      </div>
      <RouterLink class="btn btn--ghost" to="/cabinet">Назад до кабінету</RouterLink>
    </header>

    <section class="panel">
      <div class="panel__header">
        <div>
          <div class="badge badge--soft">Створення</div>
          <h2 class="panel__title">Нова зовнішня сесія</h2>
        </div>
      </div>

      <div v-if="createError" class="form-error">{{ createError }}</div>

      <div class="form-grid">
        <label class="field">
          <span>Дата початку</span>
          <input
            v-model="createDraft.start_date"
            class="input"
            type="date"
            lang="uk"
            @click="openDatePicker"
            @focus="openDatePicker"
          />
        </label>

        <label class="field">
          <span>Час початку</span>
          <input
            v-model="createDraft.start_time"
            class="input"
            type="text"
            inputmode="numeric"
            maxlength="5"
            placeholder="ГГ:ХХ"
            @blur="normalizeCreateStartTime"
          />
        </label>

        <label class="field">
          <span>Тривалість (хв)</span>
          <input v-model.number="createDraft.duration_minutes" class="input" type="number" min="1" max="480" />
        </label>

        <label class="field">
          <span>Формат</span>
          <select v-model="createDraft.session_format" class="input input--select">
            <option value="online">Онлайн</option>
            <option value="offline">Офлайн</option>
          </select>
        </label>

        <label v-if="isCreateOnline" class="field">
          <span>Посилання на зустріч</span>
          <input v-model="createDraft.meeting_url" class="input" type="url" placeholder="https://meet.google.com/..." />
        </label>

        <label v-else class="field">
          <span>Локація</span>
          <input
            v-model="createDraft.offline_location_snapshot"
            class="input"
            type="text"
            placeholder="Київ, вул. ..."
          />
        </label>

        <label class="field">
          <span>Ім'я гостя (опційно)</span>
          <input v-model="createDraft.guest_name" class="input" type="text" maxlength="120" />
        </label>

        <label class="field">
          <span>Email гостя (опційно)</span>
          <input v-model="createDraft.guest_email" class="input" type="email" maxlength="255" />
        </label>
      </div>

      <div class="actions-row">
        <button class="btn" type="button" :disabled="createPending" @click="submitCreate">
          {{ createPending ? 'Створюємо…' : 'Створити зовнішню сесію' }}
        </button>
      </div>
    </section>

    <section class="panel">
      <div class="panel__header">
        <div>
          <div class="badge badge--soft">Список</div>
          <h2 class="panel__title">Ваші зовнішні сесії</h2>
        </div>
      </div>

      <div v-if="listError" class="form-error">{{ listError }}</div>
      <div v-else-if="listLoading" class="muted">Завантаження зовнішніх сесій…</div>
      <div v-else-if="sessions.length === 0" class="muted">Немає зовнішніх сесій. Створіть першу сесію вище.</div>

      <div v-else class="list-grid">
        <article v-for="session in sessions" :key="session.id" class="session-card">
          <div class="session-card__main">
            <div class="session-card__time">{{ formatDateTime(session.starts_at) }}</div>
            <div class="muted">Тривалість: {{ session.duration_minutes }} хв</div>
            <div class="muted">Формат: {{ session.session_format === 'offline' ? 'Офлайн' : 'Онлайн' }}</div>
            <div v-if="session.guest_name || session.guest_email" class="muted">
              Гість: {{ session.guest_name || '—' }} <span v-if="session.guest_email">({{ session.guest_email }})</span>
            </div>
            <div class="status-pill" :class="session.status === 'CANCELLED' ? 'status-pill--danger' : 'status-pill--ok'">
              {{ session.status === 'CANCELLED' ? 'Скасовано' : 'Заплановано' }}
            </div>
          </div>
          <RouterLink class="btn btn--ghost btn--sm" :to="`/cabinet/external-sessions/${session.id}`">Деталі</RouterLink>
        </article>
      </div>
    </section>
  </section>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useToast } from '../composables/useToast'
import {
  createExternalSession,
  fetchExternalSessions,
  getApiErrorMessage,
  type ExternalSessionRecord,
  type SessionFormat,
} from '../lib/api'
import { formatUkDateTimeCompact } from '../lib/dateTime'

type CreateDraft = {
  start_date: string
  start_time: string
  duration_minutes: number
  session_format: SessionFormat
  meeting_url: string
  offline_location_snapshot: string
  guest_name: string
  guest_email: string
}

const router = useRouter()
const toast = useToast()

const listLoading = ref(false)
const listError = ref('')
const createPending = ref(false)
const createError = ref('')
const sessions = ref<ExternalSessionRecord[]>([])

const createDraft = ref<CreateDraft>({
  start_date: '',
  start_time: '',
  duration_minutes: 60,
  session_format: 'online',
  meeting_url: '',
  offline_location_snapshot: '',
  guest_name: '',
  guest_email: '',
})

const isCreateOnline = computed(() => createDraft.value.session_format === 'online')

function formatDateTime(value: string | null | undefined) {
  return formatUkDateTimeCompact(value)
}

function openDatePicker(event: Event) {
  const target = event.target as HTMLInputElement | null
  if (!target) return
  if (typeof target.showPicker === 'function') {
    try {
      target.showPicker()
    } catch {
      target.focus()
    }
    return
  }
  target.focus()
}

function normalizeTimeValue(value: string) {
  const trimmed = String(value || '').trim()
  const match = /^(\d{1,2}):(\d{2})$/.exec(trimmed)
  if (!match) return trimmed
  const hours = Number(match[1])
  const minutes = Number(match[2])
  if (!Number.isInteger(hours) || !Number.isInteger(minutes) || hours > 23 || minutes > 59) return trimmed
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`
}

function normalizeCreateStartTime() {
  createDraft.value.start_time = normalizeTimeValue(createDraft.value.start_time)
}

function combineDateTimeToIso(dateValue: string, timeValue: string) {
  if (!dateValue || !timeValue) return ''
  const normalizedTime = normalizeTimeValue(timeValue)
  if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(normalizedTime)) return ''
  const parsed = new Date(`${dateValue}T${normalizedTime}`)
  if (Number.isNaN(parsed.getTime())) return ''
  return parsed.toISOString()
}

async function loadSessions() {
  listLoading.value = true
  listError.value = ''
  try {
    const payload = await fetchExternalSessions()
    sessions.value = (payload || [])
      .slice()
      .sort((a, b) => new Date(b.starts_at).getTime() - new Date(a.starts_at).getTime())
  } catch (err) {
    listError.value = getApiErrorMessage(err, 'Не вдалося завантажити зовнішні сесії.')
    sessions.value = []
  } finally {
    listLoading.value = false
  }
}

function validateCreateDraft() {
  const startsAtIso = combineDateTimeToIso(createDraft.value.start_date, createDraft.value.start_time)
  if (!startsAtIso) return 'Вкажіть коректний час початку.'
  if (!Number.isFinite(createDraft.value.duration_minutes) || createDraft.value.duration_minutes < 1) {
    return 'Вкажіть коректну тривалість.'
  }
  if (isCreateOnline.value && !createDraft.value.meeting_url.trim()) {
    return 'Для онлайн-сесії додайте посилання на зустріч.'
  }
  if (!isCreateOnline.value && !createDraft.value.offline_location_snapshot.trim()) {
    return 'Для офлайн-сесії вкажіть локацію.'
  }
  return ''
}

async function submitCreate() {
  createError.value = ''
  const validationError = validateCreateDraft()
  if (validationError) {
    createError.value = validationError
    return
  }

  createPending.value = true
  try {
    const payload = {
      starts_at: combineDateTimeToIso(createDraft.value.start_date, createDraft.value.start_time),
      duration_minutes: createDraft.value.duration_minutes,
      session_format: createDraft.value.session_format,
      meeting_url: isCreateOnline.value ? createDraft.value.meeting_url.trim() || null : null,
      offline_location_snapshot: isCreateOnline.value
        ? null
        : createDraft.value.offline_location_snapshot.trim() || null,
      guest_name: createDraft.value.guest_name.trim() || null,
      guest_email: createDraft.value.guest_email.trim() || null,
    }

    const created = await createExternalSession(payload)
    toast.success('Зовнішню сесію створено.')
    await loadSessions()
    await router.push(`/cabinet/external-sessions/${created.id}`)
  } catch (err) {
    createError.value = getApiErrorMessage(err, 'Не вдалося створити зовнішню сесію.')
  } finally {
    createPending.value = false
  }
}

onMounted(async () => {
  await loadSessions()
})
</script>

<style scoped>
.external-sessions {
  display: grid;
  gap: 18px;
}

.external-sessions__hero {
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

.external-sessions__title {
  font-size: 32px;
}

.external-sessions__subtitle {
  max-width: 620px;
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

.form-grid {
  display: grid;
  gap: 12px;
  grid-template-columns: repeat(auto-fit, minmax(230px, 1fr));
}

.actions-row {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.list-grid {
  display: grid;
  gap: 12px;
}

.session-card {
  border: 1px solid var(--line);
  border-radius: var(--radius-md);
  padding: 12px;
  background: #fff;
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 10px;
}

.session-card__main {
  display: grid;
  gap: 6px;
}

.session-card__time {
  font-weight: 700;
}

.status-pill {
  width: fit-content;
  padding: 6px 10px;
  border-radius: var(--radius-sm);
  font-size: 12px;
  text-transform: uppercase;
  letter-spacing: 0.06em;
}

.status-pill--ok {
  background: rgba(31, 122, 76, 0.18);
  color: #1f7a4c;
}

.status-pill--danger {
  background: rgba(194, 75, 75, 0.18);
  color: #a03838;
}

.form-error {
  color: #b3261e;
  background: #fdecea;
  border: 1px solid #f5c2c0;
  border-radius: var(--radius-sm);
  padding: 8px 10px;
}

@media (max-width: 860px) {
  .external-sessions__hero {
    flex-direction: column;
    align-items: flex-start;
  }

  .session-card {
    flex-direction: column;
  }
}
</style>
