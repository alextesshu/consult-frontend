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
      <RouterLink v-if="liveSession" class="hero-live" :to="`/cabinet/sessions/${liveSession.id}`">
        <div class="hero-live__title">Сесія триває</div>
        <div class="hero-live__meta">
          {{ liveSession.client_name || liveSession.client_username || `Клієнт #${liveSession.client}` }}
        </div>
        <a
          v-if="liveMeetingUrl && liveSession.join_available"
          class="btn btn--sm hero-live__join"
          :href="liveMeetingUrl"
          target="_blank"
          rel="noopener noreferrer"
          @click.stop
        >
          Приєднатися
        </a>
      </RouterLink>
      <div class="hero-chip">
        <div class="hero-chip__label">Серверний час</div>
        <div class="hero-chip__value">{{ serverTimeLabel }}</div>
      </div>
    </header>

    <div v-if="me" class="cabinet__grid">
      <section class="panel panel--wide panel--actions">
        <div class="panel__header">
          <div>
            <div class="badge badge--soft">Робоча панель</div>
            <div class="panel__meta">Щоденні інструменти та конфігурація практики</div>
          </div>
        </div>
        <div class="cabinet-actions">
          <section class="action-group">
            <h3 class="action-group__title">Щоденна робота</h3>
            <div class="action-group__items">
              <RouterLink class="btn btn--ghost" to="/cabinet/sessions">Сесії</RouterLink>
              <RouterLink class="btn btn--ghost" to="/cabinet/clients">Клієнти</RouterLink>
              <RouterLink class="btn btn--ghost" to="/cabinet/inquiries">Запити до бронювання</RouterLink>
              <RouterLink class="btn btn--ghost" to="/cabinet/reviews">Відгуки</RouterLink>
            </div>
          </section>

          <section class="action-group">
            <h3 class="action-group__title">Планування</h3>
            <div class="action-group__items">
              <RouterLink class="btn btn--ghost" to="/cabinet/schedule">Розклад</RouterLink>
              <RouterLink class="btn btn--ghost" to="/cabinet/group-events">Групові події</RouterLink>
            </div>
          </section>

          <section class="action-group">
            <h3 class="action-group__title">Контент</h3>
            <div class="action-group__items">
              <RouterLink class="btn btn--ghost" to="/cabinet/journal">Авторський журнал</RouterLink>
            </div>
          </section>

          <section class="action-group">
            <h3 class="action-group__title">Бізнес</h3>
            <div class="action-group__items">
              <RouterLink class="btn btn--ghost" to="/cabinet/analytics">Аналітика</RouterLink>
              <RouterLink class="btn btn--ghost" to="/cabinet/billing">Плани та доступ</RouterLink>
            </div>
          </section>
        </div>
      </section>
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
            <RouterLink class="tips-link" to="/cabinet/schedule">Налаштуйте правила розкладу</RouterLink>
            <span class="muted">Після цього згенеруйте вільні вікна на 30 днів.</span>
          </li>
          <li>
            <RouterLink class="tips-link" to="/cabinet/slots">Перегляньте вільні вікна</RouterLink>
            <span class="muted">Тут ви керуєте тим, що клієнти бачать для запису.</span>
          </li>
          <li>
            <RouterLink class="tips-link" to="/cabinet/sessions">Перевіряйте запити та сесії</RouterLink>
            <span class="muted">Підтвердження та перенесення приходять сюди.</span>
          </li>
          <li>
            <RouterLink class="tips-link" to="/cabinet/journal">Підготуйте серії в авторському журналі</RouterLink>
            <span class="muted">Це допоможе клієнтам проходити матеріали поетапно.</span>
          </li>
        </ul>
      </section>

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
            <div class="feature__title">Групові онлайн-події</div>
            <div class="feature__value">{{ groupRoomLabel }}</div>
          </div>
          <div class="feature">
            <div class="feature__title">Ліміт подій</div>
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
import { computed, onMounted, ref } from 'vue'
import { storeToRefs } from 'pinia'
import { apiGet } from '../lib/api'
import { formatUkDateTimeCompact } from '../lib/dateTime'
import { normalizeMeetingUrl } from '../lib/sessionExecution'
import { useAuthStore } from '../stores/auth'

const auth = useAuthStore()
const { me } = storeToRefs(auth)

type CabinetSession = {
  id: number
  status: string
  client: number
  client_name?: string | null
  client_username?: string | null
  meeting_url?: string | null
  join_available?: boolean
  join_starts_at?: string | null
  join_ends_at?: string | null
  slot_start_at?: string | null
  slot_end_at?: string | null
}

const allSessions = ref<CabinetSession[]>([])

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

const planCodeLabel = computed(() => {
  const raw = me.value?.effective_entitlements?.plan
  if (raw === 'START' || raw === 'PRO' || raw === 'LEADER') return raw
  return 'START'
})

const activeClientsCount = computed(() => me.value?.counts?.active_clients ?? 0)

const activeClientLimit = computed(() => {
  const limit = me.value?.effective_entitlements?.active_client_limit
  if (typeof limit === 'number') return limit
  return 5
})

const activeClientLimitLabel = computed(() => {
  return Number.isFinite(activeClientLimit.value) ? String(activeClientLimit.value) : '∞'
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

function sessionJoinStartAt(session: CabinetSession) {
  return session.join_starts_at || session.slot_start_at || null
}

function sessionJoinEndAt(session: CabinetSession) {
  return session.join_ends_at || session.slot_end_at || null
}

function isSessionInProgress(session: CabinetSession) {
  if (!['SCHEDULED', 'CONFIRMED'].includes(session.status)) return false
  const startRaw = sessionJoinStartAt(session)
  const endRaw = sessionJoinEndAt(session)
  if (!startRaw || !endRaw) return false
  const start = new Date(startRaw).getTime()
  const end = new Date(endRaw).getTime()
  if (Number.isNaN(start) || Number.isNaN(end)) return false
  const now = Date.now()
  return now >= start && now <= end
}

const liveSession = computed(() => {
  const items = allSessions.value
    .filter((session) => isSessionInProgress(session))
    .slice()
    .sort(
      (a, b) =>
        new Date(sessionJoinStartAt(a) || '').getTime() -
        new Date(sessionJoinStartAt(b) || '').getTime()
    )
  return items[0] || null
})

const liveMeetingUrl = computed(() => {
  if (!liveSession.value) return ''
  return normalizeMeetingUrl(liveSession.value.meeting_url)
})

async function loadSessionsForHero() {
  try {
    const [upcomingResp, pastResp] = await Promise.all([
      apiGet<CabinetSession[]>('/booking/sessions/', { params: { upcoming: true } }),
      apiGet<CabinetSession[]>('/booking/sessions/', { params: { upcoming: false } }),
    ])
    const upcoming = Array.isArray(upcomingResp) ? upcomingResp : []
    const past = Array.isArray(pastResp) ? pastResp : []
    allSessions.value = [...upcoming, ...past]
  } catch {
    allSessions.value = []
  }
}

const serverTimeLabel = computed(() => {
  const raw = me.value?.server_time
  if (!raw) return '—'
  const parsed = new Date(raw)
  if (Number.isNaN(parsed.getTime())) return raw
  return formatUkDateTimeCompact(raw, raw)
})

onMounted(async () => {
  await loadSessionsForHero()
})
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
  border-radius: var(--radius-lg);
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
  border-radius: var(--radius-md);
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

.hero-live {
  min-width: 260px;
  border: 1px solid rgba(194, 75, 75, 0.55);
  background: linear-gradient(135deg, rgba(194, 75, 75, 0.12), rgba(255, 255, 255, 0.95));
  border-radius: var(--radius-md);
  padding: 12px 14px;
  display: grid;
  gap: 8px;
  color: inherit;
  text-decoration: none;
}

.hero-live__title {
  color: #9d2f2f;
  font-weight: 700;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  font-size: 12px;
}

.hero-live__meta {
  font-weight: 600;
}

.hero-live__join {
  width: fit-content;
}

.cabinet__grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  gap: 16px;
}

.panel {
  border: 1px solid var(--line);
  border-radius: var(--radius-lg);
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
  border-radius: var(--radius-pill);
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
  border-radius: var(--radius-sm);
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
  border-radius: var(--radius-pill);
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
  border-radius: var(--radius-pill);
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
  border-radius: var(--radius-md);
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
  border-radius: var(--radius-sm);
  background: rgba(194, 75, 75, 0.1);
  color: #8b3030;
  font-size: 13px;
}

.cabinet-actions {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 14px;
}

.action-group {
  border: 1px solid var(--line);
  border-radius: var(--radius-md);
  padding: 12px;
  display: grid;
  gap: 10px;
  background: rgba(7, 47, 71, 0.02);
}

.action-group__title {
  margin: 0;
  font-size: 14px;
  font-weight: 700;
}

.action-group__items {
  display: flex;
  gap: 8px;
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

  .cabinet-actions {
    grid-template-columns: 1fr;
  }
}
</style>
