<template>
  <section class="guest-external-session">
    <div v-if="loading" class="panel">
      <h1 class="title">Доступ до зовнішньої сесії</h1>
      <p class="muted">Завантажуємо запрошення…</p>
    </div>

    <div v-else-if="errorState" class="panel">
      <h1 class="title">Доступ до зовнішньої сесії</h1>
      <p class="muted">{{ errorTitle }}</p>
      <p class="muted">{{ errorDescription }}</p>
    </div>

    <div v-else-if="invite" class="panel">
      <h1 class="title">Доступ до зовнішньої сесії</h1>
      <p class="muted">
        {{ inviteIntroText }}
      </p>

      <div class="details">
        <div><strong>Спеціаліст:</strong> {{ invite.specialist_name || '—' }}</div>
        <div><strong>Початок:</strong> {{ formatDateTime(invite.starts_at) }}</div>
        <div v-if="invite.ends_at"><strong>Завершення:</strong> {{ formatDateTime(invite.ends_at) }}</div>
        <div><strong>Формат:</strong> {{ isOffline ? 'Офлайн' : 'Онлайн' }}</div>
        <div v-if="isOffline"><strong>Локація:</strong> {{ invite.offline_location || 'Уточніть у спеціаліста' }}</div>
      </div>

      <div v-if="joinError" class="form-error">{{ joinError }}</div>

      <div class="actions">
        <button v-if="!isOffline" class="btn" type="button" :disabled="joinPending || !invite.can_join" @click="joinInvite">
          {{ joinPending ? 'Підключаємо…' : 'Приєднатися до сесії' }}
        </button>
        <button v-else class="btn" type="button" :disabled="joinPending || !invite.can_join" @click="joinInvite">
          {{ joinPending ? 'Оновлюємо…' : 'Переглянути деталі зустрічі' }}
        </button>
      </div>

      <p v-if="offlineInfoVisible" class="muted">
        Це офлайн-зустріч. Приходьте у погоджений час за вказаною локацією.
      </p>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import {
  fetchPublicExternalSessionInvite,
  getApiErrorMessage,
  joinPublicExternalSessionInvite,
  type PublicExternalSessionInviteResolved,
} from '../lib/api'
import { formatUkDateTimeCompact } from '../lib/dateTime'

type GuestErrorState = 'invalid' | 'expired' | 'revoked' | 'unavailable' | 'generic' | null

const route = useRoute()
const token = computed(() => String(route.params.token || '').trim())

const loading = ref(false)
const joinPending = ref(false)
const joinError = ref('')
const invite = ref<PublicExternalSessionInviteResolved | null>(null)
const errorState = ref<GuestErrorState>(null)
const offlineInfoVisible = ref(false)

const isOffline = computed(() => invite.value?.session_format === 'offline')
const defaultGuestIntroText =
  'Ваш спеціаліст запросив вас на сесію. Це обмежене посилання лише для цієї зустрічі без реєстрації.'
const inviteIntroText = computed(() => localizeGuestInstruction(invite.value?.instructions))

const errorTitle = computed(() => {
  if (errorState.value === 'invalid') return 'Лінк недійсний'
  if (errorState.value === 'expired') return 'Термін дії лінка завершився'
  if (errorState.value === 'revoked') return 'Лінк відкликано'
  if (errorState.value === 'unavailable') return 'Сесія недоступна'
  return 'Неможливо відкрити запрошення'
})

const errorDescription = computed(() => {
  if (errorState.value === 'invalid') return 'Перевірте посилання або попросіть спеціаліста надіслати нове.'
  if (errorState.value === 'expired') return 'Попросіть спеціаліста створити нове гостьове посилання для цієї сесії.'
  if (errorState.value === 'revoked') return 'Спеціаліст відкликав це гостьове посилання.'
  if (errorState.value === 'unavailable') return 'Ця сесія зараз недоступна за цим запрошенням.'
  return 'Спробуйте відкрити лінк трохи пізніше.'
})

function formatDateTime(value: string | null | undefined) {
  return formatUkDateTimeCompact(value)
}

function classifyError(err: unknown): GuestErrorState {
  const status = (err as { response?: { status?: number } })?.response?.status
  const data = (err as { response?: { data?: { code?: string; reason_code?: string; detail?: string } } })?.response?.data
  const code = String(data?.code || data?.reason_code || '').toUpperCase()
  const detail = String(data?.detail || '').toUpperCase()

  if (status === 404 || code === 'EXTERNAL_GUEST_INVITE_INVALID') return 'invalid'
  if (code === 'EXTERNAL_GUEST_INVITE_EXPIRED' || status === 410 || detail.includes('EXPIRED')) return 'expired'
  if (code === 'EXTERNAL_GUEST_INVITE_REVOKED' || detail.includes('REVOKED')) return 'revoked'
  if (code === 'EXTERNAL_SESSION_UNAVAILABLE' || detail.includes('UNAVAILABLE')) return 'unavailable'
  return 'generic'
}

function classifyResolvedStatus(statusRaw: string | null | undefined): GuestErrorState {
  const status = String(statusRaw || '').toUpperCase()
  if (status.includes('REVOKED')) return 'revoked'
  if (status.includes('EXPIRED')) return 'expired'
  if (status.includes('UNAVAILABLE')) return 'unavailable'
  return null
}

function localizeGuestInstruction(value: string | null | undefined) {
  const trimmed = String(value || '').trim()
  if (!trimmed) return defaultGuestIntroText
  if (trimmed === 'Your specialist invited you to an external session.') {
    return defaultGuestIntroText
  }
  return trimmed
}

function normalizeResolvedInvite(
  payload: PublicExternalSessionInviteResolved | { guest_session?: PublicExternalSessionInviteResolved | null } | null
): PublicExternalSessionInviteResolved | null {
  if (!payload || typeof payload !== 'object') return null
  if ('guest_session' in payload) return payload.guest_session || null
  return payload as PublicExternalSessionInviteResolved
}

async function loadInvite() {
  if (!token.value) {
    invite.value = null
    errorState.value = 'invalid'
    return
  }

  loading.value = true
  joinError.value = ''
  offlineInfoVisible.value = false

  try {
    const payload = await fetchPublicExternalSessionInvite(token.value)
    const normalized = normalizeResolvedInvite(payload as any)
    if (!normalized) {
      invite.value = null
      errorState.value = 'invalid'
      return
    }
    const resolvedError = classifyResolvedStatus(normalized.status)
    if (resolvedError) {
      invite.value = null
      errorState.value = resolvedError
      return
    }

    invite.value = normalized
    errorState.value = null
  } catch (err) {
    invite.value = null
    errorState.value = classifyError(err)
  } finally {
    loading.value = false
  }
}

async function joinInvite() {
  if (!token.value) return
  joinPending.value = true
  joinError.value = ''
  try {
    const payload = await joinPublicExternalSessionInvite(token.value)
    if (payload.session_format === 'online' && payload.meeting_url) {
      window.location.assign(payload.meeting_url)
      return
    }
    offlineInfoVisible.value = true
  } catch (err) {
    joinError.value = getApiErrorMessage(err, 'Не вдалося виконати приєднання до сесії.')
  } finally {
    joinPending.value = false
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
.guest-external-session {
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

.form-error {
  color: #b3261e;
  background: #fdecea;
  border: 1px solid #f5c2c0;
  border-radius: var(--radius-sm);
  padding: 8px 10px;
}
</style>
