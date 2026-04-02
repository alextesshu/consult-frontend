<template>
  <section class="guest-session">
    <div v-if="loading" class="panel">
      <h1 class="title">Доступ до сесії</h1>
      <p class="muted">Завантажуємо дані запрошення…</p>
    </div>

    <div v-else-if="errorState" class="panel">
      <h1 class="title">Доступ до сесії</h1>
      <p class="muted">{{ errorTitle }}</p>
      <p class="muted">{{ errorDescription }}</p>
    </div>

    <div v-else-if="invite" class="panel">
      <h1 class="title">Доступ до сесії</h1>
      <p class="muted">
        Ваш specialist запросив вас на сесію. Це обмежений лінк лише для цієї зустрічі.
      </p>

      <div class="details">
        <div><strong>Specialist:</strong> {{ invite.specialist_name || '—' }}</div>
        <div><strong>Початок:</strong> {{ sessionStartLabel }}</div>
        <div><strong>Формат:</strong> {{ sessionFormatLabel }}</div>
        <div v-if="isOffline"><strong>Локація:</strong> {{ offlineLocationLabel }}</div>
      </div>

      <div v-if="joinError" class="form-error">{{ joinError }}</div>

      <div class="actions">
        <button
          v-if="!isOffline"
          class="btn"
          type="button"
          :disabled="joinLoading"
          @click="joinSession"
        >
          {{ joinLoading ? 'Підключаємо…' : 'Приєднатися до сесії' }}
        </button>
        <button
          v-else
          class="btn"
          type="button"
          :disabled="joinLoading"
          @click="joinSession"
        >
          {{ joinLoading ? 'Оновлюємо…' : 'Переглянути деталі зустрічі' }}
        </button>
      </div>

      <div v-if="offlineJoinVisible" class="offline-note muted">
        Це офлайн-сесія. Приходьте за вказаною локацією у погоджений час.
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import {
  fetchPublicGuestSessionInvite,
  getApiErrorMessage,
  joinPublicGuestSessionInvite,
  type PublicGuestSessionInviteResolved,
} from '../lib/api'
import { formatUkDateTimeCompact } from '../lib/dateTime'

type GuestErrorState = 'invalid' | 'expired' | 'revoked' | 'unavailable' | 'generic' | null

const route = useRoute()
const token = computed(() => String(route.params.token || '').trim())

const loading = ref(false)
const joinLoading = ref(false)
const joinError = ref('')
const invite = ref<PublicGuestSessionInviteResolved | null>(null)
const errorState = ref<GuestErrorState>(null)
const offlineJoinVisible = ref(false)

const isOffline = computed(() => invite.value?.session_format === 'offline')
const sessionStartLabel = computed(() => formatUkDateTimeCompact(invite.value?.slot_start_at))
const sessionFormatLabel = computed(() => (isOffline.value ? 'Офлайн' : 'Онлайн'))
const offlineLocationLabel = computed(() => (invite.value?.offline_location || '').trim() || 'Уточніть у specialist')

const errorTitle = computed(() => {
  if (errorState.value === 'invalid') return 'Лінк недійсний'
  if (errorState.value === 'expired') return 'Термін дії лінка завершився'
  if (errorState.value === 'revoked') return 'Лінк відкликано'
  if (errorState.value === 'unavailable') return 'Сесія недоступна'
  return 'Неможливо відкрити запрошення'
})

const errorDescription = computed(() => {
  if (errorState.value === 'invalid') return 'Перевірте посилання або попросіть specialist надіслати новий лінк.'
  if (errorState.value === 'expired') return 'Попросіть specialist створити новий guest лінк для цієї сесії.'
  if (errorState.value === 'revoked') return 'Specialist відкликав цей guest лінк.'
  if (errorState.value === 'unavailable') return 'Ця сесія зараз недоступна за guest посиланням.'
  return 'Спробуйте відкрити лінк трохи пізніше.'
})

function classifyError(err: unknown): GuestErrorState {
  const status = (err as { response?: { status?: number } })?.response?.status
  const data = (err as { response?: { data?: { code?: string; reason_code?: string; detail?: string } } })?.response
    ?.data
  const code = String(data?.code || data?.reason_code || '').toUpperCase()
  const detail = String(data?.detail || '').toLowerCase()

  if (status === 404) return 'invalid'
  if (code.includes('EXPIRED') || detail.includes('expired')) return 'expired'
  if (code.includes('REVOKED') || detail.includes('revoked')) return 'revoked'
  if (code.includes('UNAVAILABLE') || code.includes('INELIGIBLE') || detail.includes('unavailable')) return 'unavailable'
  if (status === 410) return 'expired'
  return 'generic'
}

function normalizeResolvedInvite(payload: PublicGuestSessionInviteResolved): PublicGuestSessionInviteResolved {
  return {
    status: payload.status,
    specialist_name: payload.specialist_name || null,
    slot_start_at: payload.slot_start_at || null,
    slot_end_at: payload.slot_end_at || null,
    session_format: payload.session_format || 'online',
    offline_location: payload.offline_location || null,
  }
}

function classifyResolvedStatus(statusRaw: string | null | undefined): GuestErrorState {
  const status = String(statusRaw || '').toUpperCase()
  if (status.includes('REVOKED')) return 'revoked'
  if (status.includes('EXPIRED')) return 'expired'
  if (status.includes('UNAVAILABLE')) return 'unavailable'
  return null
}

async function loadInvite() {
  if (!token.value) {
    invite.value = null
    errorState.value = 'invalid'
    return
  }
  loading.value = true
  joinError.value = ''
  offlineJoinVisible.value = false
  try {
    const resolved = await fetchPublicGuestSessionInvite(token.value)
    const resolvedState = classifyResolvedStatus(resolved.status)
    if (resolvedState) {
      invite.value = null
      errorState.value = resolvedState
      return
    }
    invite.value = normalizeResolvedInvite(resolved)
    errorState.value = null
  } catch (err) {
    invite.value = null
    errorState.value = classifyError(err)
  } finally {
    loading.value = false
  }
}

async function joinSession() {
  if (!token.value) return
  joinLoading.value = true
  joinError.value = ''
  try {
    const payload = await joinPublicGuestSessionInvite(token.value)
    if (payload.session_format === 'online' && payload.meeting_url) {
      window.location.assign(payload.meeting_url)
      return
    }
    offlineJoinVisible.value = true
  } catch (err) {
    joinError.value = getApiErrorMessage(err, 'Не вдалося відкрити доступ до сесії.')
  } finally {
    joinLoading.value = false
  }
}

watch(
  token,
  () => {
    void loadInvite()
  },
  { immediate: true }
)
</script>

<style scoped>
.guest-session {
  width: min(760px, 92vw);
  margin: 48px auto;
}

.panel {
  border: 1px solid var(--line);
  border-radius: var(--radius);
  padding: 20px;
  background: #fff;
  display: grid;
  gap: 12px;
}

.title {
  margin: 0;
  font-size: 30px;
}

.details {
  display: grid;
  gap: 8px;
  padding: 10px 0 4px;
}

.actions {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.offline-note {
  margin: 0;
}
</style>
