<template>
  <section class="invite-join">
    <div class="invite-card">
      <div class="badge">Запрошення</div>
      <h1 class="title invite-title">Запрошення до групової події</h1>
      <p class="muted invite-subtitle">
        Прийміть запрошення, щоб долучитися до зустрічі.
      </p>

      <div v-if="loading" class="muted">Перевіряємо запрошення...</div>
      <p v-else-if="error" class="invite-error">{{ error }}</p>
      <div v-else-if="joined" class="invite-success">
        Запрошення підтверджено. Ви додані до події.
      </div>

      <div v-if="joined && eventInfo" class="invite-event">
        <div class="invite-event__title">Деталі події</div>
        <div class="invite-event__row">Статус: {{ formatState(eventInfo.state) }}</div>
        <div class="invite-event__row">Початок: {{ formatDate(eventInfo.starts_at) || 'Не задано' }}</div>
        <div class="invite-event__row">Завершення: {{ formatDate(eventInfo.ends_at) || 'Не задано' }}</div>
        <RouterLink class="btn btn--ghost btn--sm" :to="`/client/group-events/${eventInfo.id}`">
          Відкрити подію
        </RouterLink>
      </div>

      <div class="invite-consent" v-if="!joined">
        <p>
          Приймаючи запрошення, ви погоджуєтесь стати активним клієнтом цього спеціаліста.
        </p>
      </div>

      <div class="invite-actions">
        <button class="btn" type="button" @click="acceptInvite" :disabled="loading || joined">
          {{ joined ? 'Запрошення прийнято' : 'Прийняти запрошення' }}
        </button>
        <button class="btn btn--ghost" type="button" @click="goToCabinet">
          Перейти до кабінету
        </button>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'
import { apiPost } from '../lib/api'
import { formatUkDateTimeCompact } from '../lib/dateTime'

const route = useRoute()
const router = useRouter()
const auth = useAuthStore()

const loading = ref(false)
const error = ref('')
const joined = ref(false)
const eventInfo = ref<{
  id: number
  mode: string
  state: string
  starts_at: string | null
  ends_at: string | null
} | null>(null)

const token = computed(() => String(route.params.token || ''))

function defaultPath() {
  const roles = auth.me?.user.roles ?? auth.user?.roles ?? []
  if (roles.includes('SPECIALIST') || roles.includes('THERAPIST')) return '/cabinet'
  if (roles.includes('CLIENT')) return '/client'
  return '/login'
}

async function ensureAuth() {
  if (!auth.accessToken) {
    router.replace({ name: 'login', query: { redirect: route.fullPath } })
    return false
  }
  if (!auth.me) {
    try {
      await auth.loadMe()
    } catch {
      router.replace({ name: 'login', query: { redirect: route.fullPath } })
      return false
    }
  }
  return true
}

async function acceptInvite() {
  if (!token.value) {
    error.value = 'Посилання на запрошення недійсне.'
    return
  }
  loading.value = true
  error.value = ''
  try {
    const resp = await apiPost<{ event?: typeof eventInfo.value }>(
      `/group-invites/${token.value}/join/`
    )
    joined.value = true
    eventInfo.value = resp?.event || null
  } catch (err: any) {
    const code = err?.response?.data?.code
    if (code === 'EVENT_CANCELLED') {
      error.value = 'Подію скасовано. Запрошення більше неактуальне.'
    } else if (code === 'EVENT_COMPLETED') {
      error.value = 'Подію вже завершено. Запрошення більше неактуальне.'
    } else if (code === 'EVENT_NOT_READY') {
      error.value = 'Подія ще не запланована. Спробуйте пізніше.'
    } else if (code === 'EVENT_NOT_AVAILABLE') {
      error.value = 'Подія наразі недоступна.'
    } else {
      error.value = err?.response?.data?.detail || 'Не вдалося прийняти запрошення'
    }
  } finally {
    loading.value = false
  }
}

function goToCabinet() {
  router.push(defaultPath())
}

onMounted(async () => {
  const ok = await ensureAuth()
  if (!ok) return
})

function formatState(state?: string | null) {
  if (!state) return ''
  if (state === 'DRAFT') return 'Чернетка'
  if (state === 'SCHEDULED') return 'Заплановано'
  if (state === 'LIVE') return 'Триває'
  if (state === 'COMPLETED') return 'Завершено'
  if (state === 'CANCELLED') return 'Скасовано'
  return state
}

function formatDate(value?: string | null) {
  return formatUkDateTimeCompact(value, '')
}
</script>

<style scoped>
.invite-join {
  display: grid;
  place-items: center;
  padding: 32px 0 40px;
}

.invite-card {
  width: min(720px, 92vw);
  background: var(--card);
  border: 1px solid var(--line);
  border-radius: var(--radius);
  padding: 28px;
  box-shadow: var(--shadow);
  display: grid;
  gap: 12px;
}

.invite-title {
  font-size: 28px;
}

.invite-subtitle {
  max-width: 520px;
}

.invite-consent {
  background: rgba(8, 113, 201, 0.08);
  border: 1px solid rgba(8, 113, 201, 0.18);
  border-radius: 12px;
  padding: 12px 14px;
  font-size: 14px;
}

.invite-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.invite-error {
  color: #b3261e;
  background: #fdecea;
  border: 1px solid #f5c2c0;
  border-radius: 10px;
  padding: 8px 10px;
}

.invite-success {
  color: #1f7a4c;
  background: rgba(31, 122, 76, 0.12);
  border: 1px solid rgba(31, 122, 76, 0.24);
  border-radius: 10px;
  padding: 8px 10px;
}

.invite-event {
  border: 1px solid var(--line);
  border-radius: 12px;
  padding: 12px 14px;
  background: rgba(7, 47, 71, 0.03);
  display: grid;
  gap: 6px;
}

.invite-event__title {
  font-weight: 600;
}
</style>
