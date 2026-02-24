<template>
  <section class="cabinet">
    <header class="cabinet__hero">
      <div>
        <div class="badge">Кабінет спеціаліста</div>
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
      <section class="panel panel--wide panel--plan">
        <div class="panel__header">
          <div class="badge badge--soft">Ваш план</div>
          <RouterLink
            v-if="showUpgradeButton"
            class="btn btn--ghost btn--sm"
            to="/pricing"
          >
            Оновити план
          </RouterLink>
        </div>
        <div class="plan-row">
          <div class="plan-badges">
            <span class="badge badge--outline">{{ planCodeLabel }}</span>
            <span v-if="planCodeLabel === 'PRO'" class="badge badge--soft">Рекомендовано</span>
          </div>
          <div class="muted plan-hint">Підписка без комісій</div>
        </div>
        <div class="plan-metrics">
          <div class="plan-metrics__line">
            Активні клієнти: <strong>{{ activeClientsCount }}</strong> з
            <strong>{{ activeClientLimitLabel }}</strong>
          </div>
          <div class="progress">
            <div class="progress__bar" :style="{ width: `${progressPercent}%` }"></div>
          </div>
          <div v-if="isNearLimit" class="plan-warning">Ви наближаєтесь до ліміту плану</div>
          <div v-if="showStartNudge" class="plan-nudge">
            Переходьте на PRO для зростання практики
          </div>
        </div>
      </section>
      <section class="panel panel--wide panel--tips">
        <div class="panel__header">
          <div class="badge badge--soft">Підказки</div>
          <div class="panel__meta">Що зробити далі</div>
        </div>
        <ul class="tips-list">
          <li>
            <RouterLink class="tips-link" to="/cabinet/profile">Заповніть профіль і увімкніть публічність</RouterLink>
            <span class="muted">Щоб клієнти бачили вас у каталозі.</span>
          </li>
          <li>
            <RouterLink class="tips-link" to="/cabinet/slots">Створіть вільні віконця на тиждень</RouterLink>
            <span class="muted">Так клієнти зможуть забронювати сесію.</span>
          </li>
          <li>
            <RouterLink class="tips-link" to="/cabinet/sessions">Перевіряйте запити та сесії</RouterLink>
            <span class="muted">Підтвердження та перенесення приходять сюди.</span>
          </li>
          <li>
            <RouterLink class="tips-link" to="/cabinet/profile">Поділіться публічним посиланням</RouterLink>
            <span class="muted">Надішліть його клієнтам або колегам.</span>
          </li>
        </ul>
      </section>

      <section class="panel panel--wide panel--actions">
        <div class="panel__header">
          <div class="badge badge--soft">Швидкі дії</div>
          <div class="panel__meta">Щоденні інструменти</div>
        </div>
        <div class="cabinet-actions">
          <RouterLink class="btn btn--ghost" to="/cabinet/slots">
            Віконця
          </RouterLink>
          <RouterLink class="btn btn--ghost" to="/cabinet/sessions">
            Сесії
          </RouterLink>
          <RouterLink class="btn btn--ghost" to="/cabinet/analytics">
            Аналітика
          </RouterLink>
          <RouterLink class="btn btn--ghost" to="/cabinet/reviews">
            Відгуки
          </RouterLink>
          <RouterLink class="btn btn--ghost" to="/cabinet/clients">
            Клієнти
          </RouterLink>
          <RouterLink class="btn btn--ghost" to="/cabinet/billing">
            Плани та доступ
          </RouterLink>
          <RouterLink class="btn btn--ghost" to="/cabinet/profile">
            Керування профілем
          </RouterLink>
          <RouterLink class="btn btn--ghost" to="/cabinet/group-events">
            Групові події
          </RouterLink>
        </div>
</section>
      <RouterLink
        class="panel panel--accent panel--clickable"
        to="/cabinet/profile"
        aria-label="Перейти до керування профілем"
      >
        <div class="panel__header">
          <div class="badge badge--soft">Акаунт</div>
          <span class="status-dot" :class="statusDotClass"></span>
        </div>
        <h2 class="panel__title">{{ me.user.username }}</h2>
        <div class="muted">{{ me.user.email || 'немає ел. пошти' }}</div>
        <div class="muted">Ролі: {{ me.user.roles.join(', ') }}</div>
      </RouterLink>

      <RouterLink
        class="panel panel--clickable"
        to="/cabinet/billing"
        aria-label="Перейти до планів та доступу"
      >
        <div class="panel__header">
          <div class="badge badge--soft">Доступ</div>
          <div class="access-pill" :class="accessPillClass">{{ accessLabel }}</div>
        </div>
        <h2 class="panel__title">{{ planLabel }}</h2>
        <div class="muted">{{ accessHint }}</div>
        <div v-if="showOverLimit" class="alert">
          Перевищено ліміт активних клієнтів. Нові підтвердження тимчасово заблоковані.
        </div>
      </RouterLink>

      <RouterLink
        class="panel panel--clickable"
        to="/cabinet/clients"
        aria-label="Перейти до клієнтів"
      >
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
      </RouterLink>

      <RouterLink
        class="panel panel--clickable"
        to="/cabinet/sessions"
        aria-label="Перейти до сесій"
      >
        <div class="panel__header">
          <div class="badge badge--soft">Сесії</div>
          <div class="panel__meta">Найближчі</div>
        </div>
        <div class="stat">
          <div class="stat__value">{{ me.counts?.upcoming_sessions_count ?? 0 }}</div>
          <div class="stat__label">Заплановано</div>
        </div>
        <div class="muted">Слідкуй за завантаженням тижня.</div>
      </RouterLink>

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
import { computed, ref } from 'vue'
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
  if (state === 'SUSPENDED') return 'Призупинено'
  return state
})

const planLabel = computed(() => {
  const plan = me.value?.effective_entitlements?.plan
  if (plan === 'START') return 'Start'
  if (plan === 'PRO') return 'Pro'
  if (plan === 'LEADER') return 'Leader'
  return plan || 'Н/Д'
})

const PLAN_LIMITS: Record<string, number> = {
  START: 3,
  PRO: 20,
  LEADER: Number.POSITIVE_INFINITY,
}

const planCodeLabel = computed(() => {
  const raw = me.value?.effective_entitlements?.plan
  // TODO: replace with real billing plan when backend is ready
  return (raw && PLAN_LIMITS[raw] !== undefined ? raw : 'START') as keyof typeof PLAN_LIMITS
})

const activeClientsCount = computed(() => me.value?.counts?.active_clients ?? 0)

const activeClientLimit = computed(() => PLAN_LIMITS[planCodeLabel.value] ?? 3)

const activeClientLimitLabel = computed(() => {
  return Number.isFinite(activeClientLimit.value) ? String(activeClientLimit.value) : '?'
})

const progressPercent = computed(() => {
  if (!Number.isFinite(activeClientLimit.value) || activeClientLimit.value === 0) return 0
  return Math.min(100, Math.round((activeClientsCount.value / activeClientLimit.value) * 100))
})

const isNearLimit = computed(() => {
  if (!Number.isFinite(activeClientLimit.value) || activeClientLimit.value === 0) return false
  return activeClientsCount.value / activeClientLimit.value >= 0.8
})

const showStartNudge = computed(() => planCodeLabel.value === 'START')

const showUpgradeButton = computed(() => planCodeLabel.value !== 'LEADER')

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
  if (state === 'SUSPENDED') return 'Доступ призупинено адміністрацією.'
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
  router.push('/')
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
  align-items: center;
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

.panel--clickable {
  text-decoration: none;
  color: inherit;
  cursor: pointer;
  transition: transform 0.2s ease, box-shadow 0.2s ease, border-color 0.2s ease;
}

.panel--clickable:hover {
  transform: translateY(-1px);
  box-shadow: 0 12px 24px rgba(16, 33, 50, 0.12);
  border-color: rgba(31, 74, 96, 0.25);
}

.panel--clickable:focus-visible {
  outline: 2px solid rgba(31, 74, 96, 0.35);
  outline-offset: 2px;
}

.panel--accent {
  background: linear-gradient(160deg, #ffffff, #eef6fb);
}

.panel--wide {
  grid-column: 1 / -1;
}

.panel--tips {
  background: rgba(7, 47, 71, 0.03);
}

.panel--plan {
  display: grid;
  gap: 12px;
}

.plan-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.plan-badges {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.badge--outline {
  border: 1px solid rgba(31, 74, 96, 0.25);
  background: transparent;
  color: var(--ink);
}

.plan-hint {
  font-size: 13px;
}

.plan-metrics {
  display: grid;
  gap: 8px;
}

.plan-metrics__line {
  font-size: 14px;
}

.progress {
  width: 100%;
  height: 8px;
  border-radius: 999px;
  background: color-mix(in srgb, var(--primary) 15%, #ffffff);
  overflow: hidden;
}

.progress__bar {
  height: 100%;
  border-radius: inherit;
  background: color-mix(in srgb, var(--primary) 75%, #ffffff);
}

.plan-warning {
  color: #8a6b2f;
  font-size: 13px;
}

.plan-nudge {
  font-size: 13px;
  color: var(--muted);
}

.btn--sm {
  padding: 6px 10px;
  font-size: 12px;
  border-radius: 10px;
}

.tips-list {
  margin: 0;
  padding-left: 18px;
  display: grid;
  gap: 10px;
}

.tips-list li {
  display: grid;
  gap: 4px;
}

.tips-link {
  font-weight: 600;
  color: var(--ink);
  text-decoration: none;
}

.tips-link:hover {
  text-decoration: underline;
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
