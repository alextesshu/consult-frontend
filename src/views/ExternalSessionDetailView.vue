<template>
  <section class="external-session-detail">
    <header class="detail-hero">
      <div>
        <div class="badge">External Session</div>
        <h1 class="title detail-title">Деталі external session</h1>
        <p class="muted detail-subtitle">
          Редагування bounded полів, скасування і керування guest access для зовнішнього клієнта.
        </p>
      </div>
      <RouterLink class="btn btn--ghost" to="/cabinet/external-sessions">Назад до списку</RouterLink>
    </header>

    <div v-if="loadError" class="form-error">{{ loadError }}</div>
    <div v-if="loading" class="muted">Завантаження external session…</div>

    <template v-else-if="session">
      <section class="panel">
        <div class="panel__header">
          <div>
            <div class="badge badge--soft">Summary</div>
            <h2 class="panel__title">External session #{{ session.id }}</h2>
          </div>
          <div class="status-pill" :class="session.status === 'CANCELLED' ? 'status-pill--danger' : 'status-pill--ok'">
            {{ session.status === 'CANCELLED' ? 'CANCELLED' : 'SCHEDULED' }}
          </div>
        </div>

        <div class="summary-grid">
          <div>
            <div class="muted">Початок</div>
            <div>{{ formatDateTime(session.starts_at) }}</div>
          </div>
          <div>
            <div class="muted">Тривалість</div>
            <div>{{ session.duration_minutes }} хв</div>
          </div>
          <div>
            <div class="muted">Формат</div>
            <div>{{ session.session_format === 'offline' ? 'Офлайн' : 'Онлайн' }}</div>
          </div>
          <div>
            <div class="muted">Guest</div>
            <div>{{ session.guest_name || '—' }} <span v-if="session.guest_email">({{ session.guest_email }})</span></div>
          </div>
        </div>
      </section>

      <section class="panel">
        <div class="panel__header">
          <div>
            <div class="badge badge--soft">Редагування</div>
            <h2 class="panel__title">Параметри сесії</h2>
          </div>
        </div>

        <div v-if="saveError" class="form-error">{{ saveError }}</div>

        <div class="form-grid">
          <label class="field">
            <span>Початок</span>
            <input v-model="editDraft.starts_at" class="input" type="datetime-local" :disabled="isCancelled || savePending" />
          </label>

          <label class="field">
            <span>Тривалість (хв)</span>
            <input
              v-model.number="editDraft.duration_minutes"
              class="input"
              type="number"
              min="1"
              max="480"
              :disabled="isCancelled || savePending"
            />
          </label>

          <label class="field">
            <span>Формат</span>
            <select v-model="editDraft.session_format" class="input input--select" :disabled="isCancelled || savePending">
              <option value="online">Онлайн</option>
              <option value="offline">Офлайн</option>
            </select>
          </label>

          <label v-if="isEditOnline" class="field">
            <span>Meeting URL</span>
            <input
              v-model="editDraft.meeting_url"
              class="input"
              type="url"
              placeholder="https://meet.google.com/..."
              :disabled="isCancelled || savePending"
            />
          </label>

          <label v-else class="field">
            <span>Локація</span>
            <input
              v-model="editDraft.offline_location_snapshot"
              class="input"
              type="text"
              placeholder="Київ, вул. ..."
              :disabled="isCancelled || savePending"
            />
          </label>

          <label class="field">
            <span>Guest name (опційно)</span>
            <input v-model="editDraft.guest_name" class="input" type="text" maxlength="120" :disabled="isCancelled || savePending" />
          </label>

          <label class="field">
            <span>Guest email (опційно)</span>
            <input
              v-model="editDraft.guest_email"
              class="input"
              type="email"
              maxlength="255"
              :disabled="isCancelled || savePending"
            />
          </label>
        </div>

        <div class="actions-row">
          <button class="btn" type="button" :disabled="isCancelled || savePending" @click="submitSave">
            {{ savePending ? 'Зберігаємо…' : 'Зберегти' }}
          </button>
          <button class="btn btn--ghost" type="button" :disabled="isCancelled || cancelPending" @click="submitCancel">
            {{ cancelPending ? 'Скасовуємо…' : 'Скасувати сесію' }}
          </button>
        </div>

        <p v-if="isCancelled" class="muted">Сесію скасовано. Редагування та активні invite actions вимкнено.</p>
      </section>

      <section class="panel">
        <div class="panel__header">
          <div>
            <div class="badge badge--soft">Guest access</div>
            <h2 class="panel__title">Guest access</h2>
          </div>
        </div>
        <p class="muted">
          Створіть окремий лінк для гостя, щоб він міг відкрити деталі цієї external session без реєстрації.
        </p>

        <div v-if="inviteLoading" class="muted">Завантаження invite status…</div>
        <div v-else>
          <div v-if="inviteError" class="form-error">{{ inviteError }}</div>

          <template v-if="invite">
            <div class="invite-row">
              <span class="status-pill" :class="inviteStatusClass">{{ inviteStatusLabel }}</span>
              <span v-if="invite.expires_at" class="muted">Діє до: {{ formatDateTime(invite.expires_at) }}</span>
              <span v-if="invite.last_opened_at || invite.opened_at" class="muted">
                Лінк відкривали: {{ formatDateTime(invite.last_opened_at || invite.opened_at) }}
              </span>
              <span v-if="invite.joined_at" class="muted">За лінком приєдналися: {{ formatDateTime(invite.joined_at) }}</span>
            </div>

            <div class="actions-row">
              <button
                class="btn btn--ghost btn--sm"
                type="button"
                :disabled="!inviteUrl || inviteActionPending || isCancelled || invitePrimaryStatus !== 'active'"
                @click="copyInviteLink"
              >
                {{ copyLabel }}
              </button>
              <button
                class="btn btn--ghost btn--sm"
                type="button"
                :disabled="inviteActionPending || isCancelled"
                @click="regenerateInvite"
              >
                {{ inviteAction === 'regenerate' ? 'Перевидання…' : 'Перевидати' }}
              </button>
              <button
                class="btn btn--ghost btn--sm"
                type="button"
                :disabled="inviteActionPending || isCancelled || invitePrimaryStatus !== 'active'"
                @click="revokeInvite"
              >
                {{ inviteAction === 'revoke' ? 'Відкликаємо…' : 'Відкликати' }}
              </button>
            </div>

            <p v-if="invitePrimaryStatus === 'active' && !inviteUrl" class="muted">
              Після reload URL не зберігається в state. Щоб отримати новий copyable лінк, натисніть «Перевидати».
            </p>
          </template>

          <template v-else>
            <div class="muted">Активний invite ще не створено.</div>
            <div class="actions-row">
              <button class="btn" type="button" :disabled="inviteActionPending || isCancelled" @click="createInvite">
                {{ inviteAction === 'create' ? 'Створюємо…' : 'Створити invite' }}
              </button>
            </div>
          </template>
        </div>
      </section>
    </template>
  </section>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import { useToast } from '../composables/useToast'
import {
  cancelExternalSession,
  createExternalSessionInvite,
  fetchExternalSessionDetail,
  fetchExternalSessionInvite,
  getApiErrorMessage,
  regenerateExternalSessionInvite,
  revokeExternalSessionInvite,
  updateExternalSession,
  type ExternalSessionInvite,
  type ExternalSessionRecord,
  type SessionFormat,
} from '../lib/api'
import { formatUkDateTimeCompact } from '../lib/dateTime'

type EditDraft = {
  starts_at: string
  duration_minutes: number
  session_format: SessionFormat
  meeting_url: string
  offline_location_snapshot: string
  guest_name: string
  guest_email: string
}

type InviteAction = 'create' | 'revoke' | 'regenerate' | null

const route = useRoute()
const toast = useToast()

const sessionId = computed(() => Number(route.params.id))

const loading = ref(false)
const loadError = ref('')
const savePending = ref(false)
const cancelPending = ref(false)
const saveError = ref('')

const session = ref<ExternalSessionRecord | null>(null)
const editDraft = ref<EditDraft>({
  starts_at: '',
  duration_minutes: 60,
  session_format: 'online',
  meeting_url: '',
  offline_location_snapshot: '',
  guest_name: '',
  guest_email: '',
})

const inviteLoading = ref(false)
const inviteError = ref('')
const invite = ref<ExternalSessionInvite | null>(null)
const inviteUrl = ref('')
const inviteAction = ref<InviteAction>(null)
const copyLabel = ref('Скопіювати лінк')

const isCancelled = computed(() => session.value?.status === 'CANCELLED')
const isEditOnline = computed(() => editDraft.value.session_format === 'online')
const inviteActionPending = computed(() => inviteAction.value !== null)

const invitePrimaryStatus = computed<'active' | 'expired' | 'revoked'>(() => {
  if (!invite.value) return 'expired'
  const status = String(invite.value.status || '').toUpperCase()
  if (status.includes('REVOKED')) return 'revoked'
  if (status.includes('EXPIRED')) return 'expired'
  if (invite.value.expires_at) {
    const expiresAt = new Date(invite.value.expires_at).getTime()
    if (Number.isFinite(expiresAt) && expiresAt < Date.now()) return 'expired'
  }
  return 'active'
})

const inviteStatusLabel = computed(() => {
  if (invitePrimaryStatus.value === 'active') return 'Активне'
  if (invitePrimaryStatus.value === 'revoked') return 'Відкликане'
  return 'Прострочене'
})

const inviteStatusClass = computed(() => {
  if (invitePrimaryStatus.value === 'active') return 'status-pill--ok'
  if (invitePrimaryStatus.value === 'revoked') return 'status-pill--danger'
  return 'status-pill--warn'
})

function formatDateTime(value: string | null | undefined) {
  return formatUkDateTimeCompact(value)
}

function toIsoFromLocalDateTime(value: string) {
  if (!value) return ''
  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) return ''
  return parsed.toISOString()
}

function toLocalDateTimeInputValue(value: string | null | undefined) {
  if (!value) return ''
  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) return ''
  const local = new Date(parsed.getTime() - parsed.getTimezoneOffset() * 60_000)
  return local.toISOString().slice(0, 16)
}

function syncEditDraft(next: ExternalSessionRecord) {
  editDraft.value = {
    starts_at: toLocalDateTimeInputValue(next.starts_at),
    duration_minutes: next.duration_minutes,
    session_format: next.session_format === 'offline' ? 'offline' : 'online',
    meeting_url: next.meeting_url || '',
    offline_location_snapshot: next.offline_location_snapshot || '',
    guest_name: next.guest_name || '',
    guest_email: next.guest_email || '',
  }
}

async function loadSession() {
  if (!Number.isInteger(sessionId.value) || sessionId.value <= 0) {
    session.value = null
    loadError.value = 'Некоректний ідентифікатор external session.'
    return
  }
  loading.value = true
  loadError.value = ''
  try {
    const payload = await fetchExternalSessionDetail(sessionId.value)
    session.value = payload
    syncEditDraft(payload)
  } catch (err) {
    session.value = null
    loadError.value = getApiErrorMessage(err, 'Не вдалося завантажити external session.')
  } finally {
    loading.value = false
  }
}

async function loadInvite() {
  if (!session.value) return
  inviteLoading.value = true
  inviteError.value = ''
  inviteUrl.value = ''
  try {
    const payload = await fetchExternalSessionInvite(session.value.id)
    invite.value = payload || null
  } catch (err: any) {
    if (err?.response?.status === 404) {
      invite.value = null
      return
    }
    invite.value = null
    inviteError.value = getApiErrorMessage(err, 'Не вдалося завантажити invite status.')
  } finally {
    inviteLoading.value = false
  }
}

function validateEditDraft() {
  const startsAtIso = toIsoFromLocalDateTime(editDraft.value.starts_at)
  if (!startsAtIso) return 'Вкажіть коректний час початку.'
  if (!Number.isFinite(editDraft.value.duration_minutes) || editDraft.value.duration_minutes < 1) {
    return 'Вкажіть коректну тривалість.'
  }
  if (isEditOnline.value && !editDraft.value.meeting_url.trim()) {
    return 'Для онлайн-сесії додайте meeting URL.'
  }
  if (!isEditOnline.value && !editDraft.value.offline_location_snapshot.trim()) {
    return 'Для офлайн-сесії вкажіть локацію.'
  }
  return ''
}

async function submitSave() {
  if (!session.value || isCancelled.value) return
  saveError.value = ''
  const validationError = validateEditDraft()
  if (validationError) {
    saveError.value = validationError
    return
  }

  savePending.value = true
  try {
    const payload = {
      starts_at: toIsoFromLocalDateTime(editDraft.value.starts_at),
      duration_minutes: editDraft.value.duration_minutes,
      session_format: editDraft.value.session_format,
      meeting_url: isEditOnline.value ? editDraft.value.meeting_url.trim() || null : null,
      offline_location_snapshot: isEditOnline.value
        ? null
        : editDraft.value.offline_location_snapshot.trim() || null,
      guest_name: editDraft.value.guest_name.trim() || null,
      guest_email: editDraft.value.guest_email.trim() || null,
    }
    const updated = await updateExternalSession(session.value.id, payload)
    session.value = updated
    syncEditDraft(updated)
    toast.success('External session оновлено.')
  } catch (err) {
    saveError.value = getApiErrorMessage(err, 'Не вдалося оновити external session.')
  } finally {
    savePending.value = false
  }
}

async function submitCancel() {
  if (!session.value || isCancelled.value) return
  cancelPending.value = true
  saveError.value = ''
  try {
    const updated = await cancelExternalSession(session.value.id)
    session.value = updated
    syncEditDraft(updated)
    await loadInvite()
    toast.success('External session скасовано.')
  } catch (err) {
    saveError.value = getApiErrorMessage(err, 'Не вдалося скасувати external session.')
  } finally {
    cancelPending.value = false
  }
}

async function createInvite() {
  if (!session.value || isCancelled.value) return
  inviteAction.value = 'create'
  inviteError.value = ''
  try {
    const payload = await createExternalSessionInvite(session.value.id)
    invite.value = payload.invite
    inviteUrl.value = payload.invite_url || ''
    toast.success('Guest invite створено.')
  } catch (err) {
    inviteError.value = getApiErrorMessage(err, 'Не вдалося створити guest invite.')
  } finally {
    inviteAction.value = null
  }
}

async function revokeInvite() {
  if (!session.value || isCancelled.value) return
  inviteAction.value = 'revoke'
  inviteError.value = ''
  try {
    const payload = await revokeExternalSessionInvite(session.value.id)
    invite.value = payload
    inviteUrl.value = ''
    toast.success('Guest invite відкликано.')
  } catch (err) {
    inviteError.value = getApiErrorMessage(err, 'Не вдалося відкликати guest invite.')
  } finally {
    inviteAction.value = null
  }
}

async function regenerateInvite() {
  if (!session.value || isCancelled.value) return
  inviteAction.value = 'regenerate'
  inviteError.value = ''
  try {
    const payload = await regenerateExternalSessionInvite(session.value.id)
    invite.value = payload.invite
    inviteUrl.value = payload.invite_url || ''
    toast.success('Guest invite перевидано.')
  } catch (err) {
    inviteError.value = getApiErrorMessage(err, 'Не вдалося перевидати guest invite.')
  } finally {
    inviteAction.value = null
  }
}

async function copyInviteLink() {
  if (!inviteUrl.value) return
  try {
    await navigator.clipboard.writeText(inviteUrl.value)
    copyLabel.value = 'Скопійовано'
    window.setTimeout(() => {
      copyLabel.value = 'Скопіювати лінк'
    }, 1700)
  } catch {
    inviteError.value = 'Не вдалося скопіювати invite URL.'
  }
}

async function loadPage() {
  await loadSession()
  if (!session.value) return
  await loadInvite()
}

watch(
  sessionId,
  async () => {
    await loadPage()
  },
  { immediate: true }
)
</script>

<style scoped>
.external-session-detail {
  display: grid;
  gap: 18px;
}

.detail-hero {
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

.detail-title {
  font-size: 32px;
}

.detail-subtitle {
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

.summary-grid,
.form-grid {
  display: grid;
  gap: 12px;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
}

.invite-row,
.actions-row {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
  align-items: center;
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

.status-pill--warn {
  background: rgba(217, 164, 65, 0.18);
  color: #a57011;
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
  .detail-hero {
    flex-direction: column;
    align-items: flex-start;
  }
}
</style>
