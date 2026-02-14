<template>
  <section class="cabinet">
    <header class="cabinet__hero">
      <div>
        <div class="badge">Кабінет терапевта</div>
        <h1 class="title cabinet__title">Твій робочий простір</h1>
        <p class="muted cabinet__subtitle">
          Тут зібрані доступи, активність і швидкі дії. Публічні сторінки — окремо.
        </p>
      </div>
      <div class="hero-chip">
        <div class="hero-chip__label">Серверний час</div>
        <div class="hero-chip__value">{{ serverTimeLabel }}</div>
      </div>
    </header>

    <div v-if="me" class="cabinet__grid">

      <section class="panel panel--wide panel--actions">
        <div class="panel__header">
          <div class="badge badge--soft">Швидкі дії</div>
          <div class="panel__meta">Щоденні інструменти</div>
        </div>
        <div class="cabinet-actions">
          <RouterLink class="btn btn--ghost" to="/cabinet/slots">
            Слоти
          </RouterLink>
          <RouterLink class="btn btn--ghost" to="/cabinet/profile">
            Профіль терапевта
          </RouterLink>
          <RouterLink class="btn btn--ghost" to="/cabinet/group-events">
            Групові події
          </RouterLink>
          <button class="btn btn--ghost" type="button" @click="onLogout">Вийти</button>
        </div>
      </section>
      <section class="panel panel--accent">
        <div class="panel__header">
          <div class="badge badge--soft">Акаунт</div>
          <span class="status-dot" :class="statusDotClass"></span>
        </div>
        <h2 class="panel__title">{{ me.user.username }}</h2>
        <div class="muted">{{ me.user.email || 'немає ел. пошти' }}</div>
        <div class="muted">Ролі: {{ me.user.roles.join(', ') }}</div>
      </section>

      <section class="panel">
        <div class="panel__header">
          <div class="badge badge--soft">Доступ</div>
          <div class="access-pill" :class="accessPillClass">{{ accessLabel }}</div>
        </div>
        <h2 class="panel__title">{{ planLabel }}</h2>
        <div class="muted">{{ accessHint }}</div>
        <div v-if="showOverLimit" class="alert">
          Перевищено ліміт активних клієнтів. Нові підтвердження тимчасово заблоковані.
        </div>
      </section>

      <section class="panel">
        <div class="panel__header">
          <div class="badge badge--soft">Клієнти</div>
          <div class="panel__meta">
            Ліміт: {{ activeLimitLabel }}
          </div>
        </div>
        <div class="stat">
          <div class="stat__value">{{ me.counts?.active_clients ?? 0 }}</div>
          <div class="stat__label">Активні</div>
        </div>
        <div class="stat stat--secondary">
          <div class="stat__value">{{ me.counts?.prospect_clients ?? 0 }}</div>
          <div class="stat__label">Потенційні</div>
        </div>
      </section>

      <section class="panel">
        <div class="panel__header">
          <div class="badge badge--soft">Сесії</div>
          <div class="panel__meta">Найближчі</div>
        </div>
        <div class="stat">
          <div class="stat__value">{{ me.counts?.upcoming_sessions_count ?? 0 }}</div>
          <div class="stat__label">Заплановано</div>
        </div>
        <div class="muted">Слідкуй за завантаженням тижня.</div>
      </section>

      <section class="panel panel--wide">
        <div class="panel__header">
          <div class="badge badge--soft">Можливості</div>
          <div class="panel__meta">Права доступу</div>
        </div>
        <div class="feature-grid">
          <div class="feature">
            <div class="feature__title">Group Room</div>
            <div class="feature__value">{{ groupRoomLabel }}</div>
          </div>
          <div class="feature">
            <div class="feature__title">Meeting ліміт</div>
            <div class="feature__value">{{ meetingLimitLabel }}</div>
          </div>
          <div class="feature">
            <div class="feature__title">Broadcast</div>
            <div class="feature__value">{{ broadcastLabel }}</div>
          </div>
          <div class="feature">
            <div class="feature__title">Технічна місткість</div>
            <div class="feature__value">{{ technicalCapLabel }}</div>
          </div>
        </div>
      </section>
    </div>

    <div v-else class="card cabinet__loading">
      Завантаження профілю...
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { storeToRefs } from 'pinia'
import { useAuthStore } from '../stores/auth'
import { useRouter } from 'vue-router'

const auth = useAuthStore()
const { me } = storeToRefs(auth)
const router = useRouter()

const accessLabel = computed(() => {
  const state = me.value?.access_state
  if (!state) return 'Невідомо'
  if (state === 'OK') return 'Повний доступ'
  if (state === 'GRACE') return 'Пільговий період'
  if (state === 'RESTRICTED') return 'Обмежений режим'
  return state
})

const planLabel = computed(() => me.value?.effective_entitlements?.plan || 'Н/Д')

const activeLimitLabel = computed(() => {
  const limit = me.value?.effective_entitlements?.active_client_limit
  if (limit === null || limit === undefined) return 'Н/Д'
  return Number.isFinite(limit) ? String(limit) : '∞'
})

const showOverLimit = computed(() => {
  const limit = me.value?.effective_entitlements?.active_client_limit
  const count = me.value?.counts?.active_clients
  if (limit === null || limit === undefined || count === null || count === undefined) return false
  return Number.isFinite(limit) && count > limit
})

const accessHint = computed(() => {
  const state = me.value?.access_state
  if (state === 'GRACE') return 'Оплата потребує уваги. Доступ тимчасово збережено.'
  if (state === 'RESTRICTED') return 'Доступ лише для читання. Нові дії заблоковані.'
  if (showOverLimit.value) return 'Ліміт активних клієнтів перевищено.'
  return 'Все працює у штатному режимі.'
})

const groupRoomLabel = computed(() => {
  const enabled = me.value?.effective_entitlements?.group_room_enabled
  if (enabled === null || enabled === undefined) return 'Н/Д'
  return enabled ? 'Доступний' : 'Недоступний'
})

const meetingLimitLabel = computed(() => {
  const limit = me.value?.effective_entitlements?.group_room_meeting_limit
  if (limit === null || limit === undefined) return 'Н/Д'
  return Number.isFinite(limit) ? String(limit) : '∞'
})

const broadcastLabel = computed(() => {
  const enabled = me.value?.effective_entitlements?.group_room_broadcast_enabled
  if (enabled === null || enabled === undefined) return 'Н/Д'
  return enabled ? 'Увімкнено' : 'Вимкнено'
})

const technicalCapLabel = computed(() => {
  const cap = me.value?.effective_entitlements?.default_technical_cap
  if (cap === null || cap === undefined) return 'Н/Д'
  return String(cap)
})

const accessPillClass = computed(() => {
  const state = me.value?.access_state
  if (state === 'GRACE') return 'access-pill--warn'
  if (state === 'RESTRICTED') return 'access-pill--danger'
  return 'access-pill--ok'
})

const statusDotClass = computed(() => {
  const state = me.value?.access_state
  if (state === 'GRACE') return 'status-dot--warn'
  if (state === 'RESTRICTED') return 'status-dot--danger'
  return 'status-dot--ok'
})

const serverTimeLabel = computed(() => {
  const raw = me.value?.server_time
  if (!raw) return '—'
  const parsed = new Date(raw)
  if (Number.isNaN(parsed.getTime())) return raw
  return parsed.toLocaleString()
})

function onLogout() {
  auth.logout()
  router.push('/login')
}
</script>

<style scoped>
.cabinet {
  display: grid;
  gap: 20px;
}

.cabinet__hero {
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  gap: 24px;
  background: linear-gradient(135deg, rgba(8, 113, 201, 0.16), rgba(7, 47, 71, 0.06));
  border: 1px solid var(--line);
  border-radius: var(--radius);
  padding: 22px 24px;
  box-shadow: var(--shadow);
}

.cabinet__title {
  font-size: 34px;
}

.cabinet__subtitle {
  max-width: 480px;
}

.hero-chip {
  background: #0b2230;
  color: #f1f6f9;
  border-radius: 16px;
  padding: 14px 18px;
  min-width: 220px;
  box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.08);
}

.hero-chip__label {
  font-size: 12px;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  opacity: 0.65;
}

.hero-chip__value {
  margin-top: 8px;
  font-weight: 600;
}

.cabinet__grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  gap: 16px;
}

.panel {
  border: 1px solid var(--line);
  border-radius: 18px;
  padding: 18px;
  background: #fff;
  display: grid;
  gap: 12px;
}

.panel--accent {
  background: linear-gradient(160deg, #ffffff, #eef6fb);
}

.panel--wide {
  grid-column: 1 / -1;
}

.panel__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.panel__title {
  margin: 0;
  font-family: var(--font-display);
  font-size: 22px;
}

.panel__meta {
  font-size: 12px;
  color: var(--muted);
}

.badge--soft {
  background: rgba(8, 113, 201, 0.12);
}

.status-dot {
  width: 10px;
  height: 10px;
  border-radius: 999px;
  background: #1f4a60;
}

.status-dot--ok {
  background: #1f7a4c;
}

.status-dot--warn {
  background: #d9a441;
}

.status-dot--danger {
  background: #c24b4b;
}

.access-pill {
  padding: 6px 12px;
  border-radius: 999px;
  font-size: 12px;
  font-weight: 600;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  background: rgba(31, 122, 76, 0.16);
  color: #1f7a4c;
}

.access-pill--warn {
  background: rgba(217, 164, 65, 0.2);
  color: #a57011;
}

.access-pill--danger {
  background: rgba(194, 75, 75, 0.2);
  color: #a03838;
}

.stat {
  display: flex;
  align-items: baseline;
  gap: 10px;
}

.stat__value {
  font-size: 28px;
  font-weight: 700;
  font-family: var(--font-display);
}

.stat__label {
  color: var(--muted);
}

.stat--secondary {
  opacity: 0.85;
}

.feature-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 12px;
}

.feature {
  padding: 12px 14px;
  border-radius: 14px;
  background: rgba(7, 47, 71, 0.04);
  border: 1px solid rgba(7, 47, 71, 0.08);
}

.feature__title {
  font-size: 12px;
  color: var(--muted);
  text-transform: uppercase;
  letter-spacing: 0.12em;
}

.feature__value {
  margin-top: 6px;
  font-weight: 600;
}

.alert {
  margin-top: 8px;
  padding: 10px 12px;
  border-radius: 12px;
  background: rgba(194, 75, 75, 0.1);
  color: #8b3030;
  font-size: 13px;
}

.cabinet-actions {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
}

.cabinet__loading {
  text-align: center;
  padding: 32px;
}

@media (max-width: 780px) {
  .cabinet__hero {
    flex-direction: column;
    align-items: flex-start;
  }

  .hero-chip {
    width: 100%;
  }
}
</style>
