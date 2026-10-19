<template>
  <section class="settings">
    <header class="panel">
      <div class="badge badge--soft">Налаштування</div>
      <h1 class="title">Сповіщення</h1>
      <p class="muted">Оберіть, які події показувати вам у застосунку.</p>
      <SettingsSubnav active="notifications" />
    </header>

    <section class="panel">
      <div v-if="loading" class="muted">Завантаження...</div>
      <div v-else class="prefs">
        <h2>У застосунку</h2>
        <p class="muted">Ці сповіщення бачите ви у Pro Consult.</p>
        <label class="pref-item">
          <input v-model="form.notify_session_booked_in_app" type="checkbox" />
          <span>
            <strong>Нові запити</strong>
            <small>Показувати в застосунку нові запити на сесії</small>
          </span>
        </label>

        <label class="pref-item">
          <input v-model="form.notify_session_confirmed_in_app" type="checkbox" />
          <span>
            <strong>Підтвердження сесій</strong>
            <small>Показувати в застосунку події підтвердження</small>
          </span>
        </label>

        <label class="pref-item">
          <input v-model="form.notify_session_starts_24h_in_app" type="checkbox" />
          <span>
            <strong>Нагадування за 24 години</strong>
          </span>
        </label>

        <label class="pref-item">
          <input v-model="form.notify_session_starts_1h_in_app" type="checkbox" />
          <span>
            <strong>Нагадування за 1 годину</strong>
          </span>
        </label>
      </div>

      <section v-if="!loading && settingsLoaded" class="prefs" aria-labelledby="email-reminders-title">
        <h2 id="email-reminders-title">Email-нагадування про сесію</h2>
        <label class="pref-item" :class="{ 'pref-item--disabled': form.email_session_reminders_available !== true }">
          <input v-model="form.notify_session_reminders_email" type="checkbox"
            :disabled="form.email_session_reminders_available !== true" />
          <span>
            <strong>Email-нагадування про сесію</strong>
            <small v-if="form.email_session_reminders_available === true">За 24 години та за 1 годину — вам і клієнту, якщо у клієнта вказаний email.</small>
          </span>
        </label>
        <template v-if="form.email_session_reminders_available === false">
          <p class="muted">Email-нагадування недоступні на тарифі Start.</p>
          <p class="muted">Нагадування в застосунку залишаються доступними.</p>
          <RouterLink class="btn btn--ghost" to="/cabinet/billing">Перейти на Pro</RouterLink>
        </template>
      </section>

      <div class="actions">
        <button class="btn" type="button" :disabled="saving || loading || !settingsLoaded" @click="save">
          {{ saving ? 'Зберігаємо...' : 'Зберегти' }}
        </button>
      </div>
    </section>
    <section class="panel" aria-labelledby="telegram-title" :aria-busy="telegramBusy">
      <h2 id="telegram-title">Telegram</h2>
      <p class="muted">Підключіть свій Telegram і окремо оберіть, які сповіщення хочете отримувати. Дані клієнтів у Telegram не передаються.</p>
      <p v-if="telegramError" role="alert">{{ telegramError }}</p>
      <p v-if="telegramLinkExpired" role="status">Посилання прострочене. Створіть нове посилання для підключення Telegram.</p>
      <p v-if="telegramBusy" role="status">Завантажуємо налаштування Telegram...</p>
      <template v-if="telegram">
        <p v-if="!telegram.available" class="muted">Підключення Telegram наразі недоступне.</p>
        <p v-if="!telegram.delivery_available" class="muted">Надсилання повідомлень ще не ввімкнене.</p>
        <p v-if="telegram.state === 'unlinked'">Telegram не підключено.</p>
        <p v-else-if="telegram.state === 'stopped'">Сповіщення Telegram зупинено командою /stop. Для відновлення підтвердьте підключення знову.</p>
        <p v-else-if="telegram.state === 'active'">Telegram підключено: {{ telegram.account?.display_name }}<span v-if="telegram.account?.username"> (@{{ telegram.account.username }})</span>.</p>
        <div v-if="telegram.pending" class="prefs">
          <p>Очікує підтвердження: {{ telegram.pending.display_name }}<span v-if="telegram.pending.username"> (@{{ telegram.pending.username }})</span>.</p>
          <p class="muted">Переконайтеся, що це ваш акаунт Telegram. Якщо посилання відкрив хтось інший, скасуйте підключення. Посилання діє 10 хвилин.</p>
          <label class="pref-item">
            <input v-model="telegramIdentityConfirmed" type="checkbox" :disabled="telegramBusy || !telegram.available" />
            <span>Це мій акаунт Telegram</span>
          </label>
          <button class="btn" type="button" :disabled="telegramBusy || !telegramIdentityConfirmed || !telegram.available" @click="confirmTelegram">Підтвердити підключення</button>
        </div>
        <div v-if="telegram.state === 'active'" class="prefs">
          <h3>Згода на сповіщення</h3>
          <p class="muted">Жодна категорія не вмикається автоматично. Ці налаштування не змінюють email і сповіщення в застосунку.</p>
          <label v-for="option in telegramOptions" :key="option.key" class="pref-item">
            <input v-model="telegramPreferences[option.key]" type="checkbox" :disabled="telegramBusy || !telegram.available" />
            <span>{{ option.label }}</span>
          </label>
          <button class="btn" type="button" :disabled="telegramBusy || !telegram.available" @click="saveTelegram">Зберегти налаштування Telegram</button>
        </div>
        <div class="actions telegram-actions">
          <button v-if="telegram.state === 'unlinked' || telegram.state === 'stopped'" class="btn" type="button" :disabled="telegramBusy || !telegram.available" @click="connectTelegram">{{ telegram.state === 'stopped' ? 'Підключити знову' : 'Підключити Telegram' }}</button>
          <button v-if="telegram.state !== 'unlinked' || telegramLinkUrl" class="btn btn--ghost" type="button" :disabled="telegramBusy" @click="unlinkTelegram">{{ telegram.state === 'pending' || telegramLinkUrl ? 'Скасувати підключення' : 'Відключити Telegram' }}</button>
        </div>
        <div v-if="telegramLinkUrl" class="prefs telegram-link-step">
          <p id="telegram-link-help">Відкрийте Telegram-бота за кнопкою нижче та натисніть Start. Потім поверніться до Pro Consult і натисніть «Оновити стан Telegram».</p>
          <a class="btn telegram-open-link" :href="telegramLinkUrl" target="_blank"
            rel="noopener noreferrer" referrerpolicy="no-referrer"
            aria-describedby="telegram-link-help telegram-link-safety telegram-link-external">Відкрити Telegram-бота</a>
          <p id="telegram-link-external" class="muted">Відкриється в новій вкладці.</p>
          <p id="telegram-link-safety" class="muted">Посилання діє 10 хвилин. Не пересилайте це посилання.</p>
        </div>
      </template>
      <button class="btn btn--ghost" type="button" :disabled="telegramBusy" @click="loadTelegram">Оновити стан Telegram</button>
    </section>
  </section>
</template>

<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from 'vue'
import { fetchNotificationSettings, updateNotificationSettings, type NotificationSettings } from '../lib/api'
import { getApiErrorMessage } from '../lib/errors'
import { useToast } from '../composables/useToast'
import SettingsSubnav from '../components/SettingsSubnav.vue'
import { confirmTelegramLink, createTelegramLink, disconnectTelegram, fetchTelegramConnection, updateTelegramPreferences, type TelegramConnection, type TelegramPreferences } from '../lib/api'

const toast = useToast()
const loading = ref(true)
const saving = ref(false)
const settingsLoaded = ref(false)
const form = ref<NotificationSettings>({
  notify_session_booked_in_app: true,
  notify_session_confirmed_in_app: true,
  notify_session_starts_24h_in_app: true,
  notify_session_starts_1h_in_app: true,
  notify_session_reminders_email: true,
  email_session_reminders_available: false,
})

async function load() {
  loading.value = true
  try {
    form.value = await fetchNotificationSettings()
    settingsLoaded.value = true
  } catch (err) {
    toast.error(getApiErrorMessage(err, 'Не вдалося завантажити налаштування сповіщень.'))
  } finally {
    loading.value = false
  }
}

async function save() {
  saving.value = true
  try {
    form.value = await updateNotificationSettings({
      notify_session_booked_in_app: form.value.notify_session_booked_in_app,
      notify_session_confirmed_in_app: form.value.notify_session_confirmed_in_app,
      notify_session_starts_24h_in_app: form.value.notify_session_starts_24h_in_app,
      notify_session_starts_1h_in_app: form.value.notify_session_starts_1h_in_app,
      notify_session_reminders_email: form.value.notify_session_reminders_email,
    })
    toast.success('Налаштування сповіщень збережено.')
  } catch (err) {
    toast.error(getApiErrorMessage(err, 'Не вдалося зберегти налаштування сповіщень.'))
  } finally {
    saving.value = false
  }
}

const telegram = ref<TelegramConnection | null>(null)
const telegramBusy = ref(false)
const telegramError = ref('')
const telegramLinkUrl = ref('')
const telegramLinkExpiresAt = ref('')
const telegramLinkExpired = ref(false)
let telegramLinkTimer: ReturnType<typeof setTimeout> | undefined
const telegramIdentityConfirmed = ref(false)
const emptyTelegramPreferences = (): TelegramPreferences => ({ notify_guest_requests: false, notify_session_booked: false, notify_session_reminders: false, notify_activation_nudges: false })
const telegramPreferences = ref<TelegramPreferences>(emptyTelegramPreferences())
const telegramOptions: { key: keyof TelegramPreferences; label: string }[] = [
  { key: 'notify_guest_requests', label: 'Нові звернення від клієнтів' },
  { key: 'notify_session_booked', label: 'Нові запити на сесії' },
  { key: 'notify_session_reminders', label: 'Нагадування про сесії' },
  { key: 'notify_activation_nudges', label: 'Поради для повернення до роботи з практикою' },
]
let telegramRequest = 0

function clearTelegramLink(expired = false) {
  if (telegramLinkTimer !== undefined) clearTimeout(telegramLinkTimer)
  telegramLinkTimer = undefined
  telegramLinkUrl.value = ''
  telegramLinkExpiresAt.value = ''
  telegramLinkExpired.value = expired
}

function expireTelegramLink() {
  if (telegramLinkExpiresAt.value && Date.parse(telegramLinkExpiresAt.value) <= Date.now()) clearTelegramLink(true)
}

function setTelegramLink(link: { url: string; expires_at: string }) {
  clearTelegramLink()
  const remaining = Date.parse(link.expires_at) - Date.now()
  if (!Number.isFinite(remaining) || remaining <= 0) {
    clearTelegramLink(true)
    return
  }
  telegramLinkUrl.value = link.url
  telegramLinkExpiresAt.value = link.expires_at
  telegramLinkTimer = setTimeout(expireTelegramLink, remaining)
}

function telegramErrorCopy(err: unknown): string {
  const code = (err as { response?: { data?: { code?: string } } })?.response?.data?.code
  if (code === 'TELEGRAM_LINK_STALE') return 'Підключення прострочене. Оновіть стан і створіть нове посилання.'
  if (code === 'TELEGRAM_IDENTITY_CONFLICT') return 'Цей Telegram уже підключено або не відповідає поточному акаунту. Відключіть поточний Telegram перед зміною.'
  if (code === 'TELEGRAM_UNAVAILABLE') return 'Підключення Telegram наразі недоступне. Спробуйте пізніше.'
  return 'Не вдалося оновити Telegram. Оновіть стан і спробуйте ще раз.'
}

async function telegramAction(operation: () => Promise<TelegramConnection>) {
  if (telegramBusy.value) return
  const request = ++telegramRequest
  telegramBusy.value = true
  telegramError.value = ''
  try {
    const state = await operation()
    if (request !== telegramRequest) return
    telegram.value = state
    telegramPreferences.value = { ...state.preferences }
    telegramIdentityConfirmed.value = false
    if (state.pending || state.state === 'active' || state.state === 'stopped') clearTelegramLink()
    else expireTelegramLink()
  } catch (err) {
    if (request === telegramRequest) {
      telegramError.value = telegramErrorCopy(err)
      telegramIdentityConfirmed.value = false
      if ((err as { response?: { data?: { code?: string } } })?.response?.data?.code === 'TELEGRAM_LINK_STALE') clearTelegramLink(true)
    }
  } finally {
    if (request === telegramRequest) telegramBusy.value = false
  }
}

function loadTelegram() {
  return telegramAction(() => {
    // A refresh cannot establish whether a previously issued link was revoked in another tab.
    clearTelegramLink()
    return fetchTelegramConnection()
  })
}
function connectTelegram() {
  return telegramAction(async () => {
    const request = telegramRequest
    clearTelegramLink()
    const link = await createTelegramLink()
    if (request === telegramRequest) setTelegramLink(link)
    return fetchTelegramConnection()
  })
}
function confirmTelegram() {
  const pendingId = telegram.value?.pending?.id
  if (!pendingId || !telegramIdentityConfirmed.value) return
  return telegramAction(() => confirmTelegramLink(pendingId))
}
function unlinkTelegram() {
  return telegramAction(async () => {
    const state = await disconnectTelegram()
    clearTelegramLink()
    return state
  })
}
function saveTelegram() { return telegramAction(() => updateTelegramPreferences({ ...telegramPreferences.value })) }

onMounted(() => {
  void load(); void loadTelegram()
  window.addEventListener('focus', expireTelegramLink)
  document.addEventListener('visibilitychange', expireTelegramLink)
})
onBeforeUnmount(() => {
  telegramRequest += 1
  clearTelegramLink()
  window.removeEventListener('focus', expireTelegramLink)
  document.removeEventListener('visibilitychange', expireTelegramLink)
})
</script>

<style scoped>
.settings {
  display: grid;
  gap: 16px;
}

.panel {
  border: 1px solid var(--pc-border);
  border-radius: var(--pc-radius-panel);
  padding: 16px;
  background: #fff;
  box-shadow: var(--pc-shadow-soft);
  display: grid;
  gap: 10px;
}

.panel:first-of-type {
  position: relative;
  overflow: hidden;
  background:
    radial-gradient(circle at 92% 70%, color-mix(in srgb, var(--pc-peach-100) 70%, transparent) 0 120px, transparent 121px),
    linear-gradient(135deg, #ffffff 0%, color-mix(in srgb, var(--pc-primary-soft) 70%, #ffffff) 54%, color-mix(in srgb, var(--pc-yellow-soft) 45%, #ffffff) 100%);
}

.panel:first-of-type > * {
  position: relative;
  z-index: 1;
}

.panel:first-of-type::after {
  content: "";
  position: absolute;
  right: -44px;
  bottom: -58px;
  width: 180px;
  height: 180px;
  border-radius: 999px;
  background: rgba(247, 183, 126, 0.18);
  pointer-events: none;
}

.panel:first-of-type .title {
  margin: 8px 0 8px;
  color: var(--pc-navy-950);
  font-size: 32px;
  line-height: 1.15;
}

.panel:first-of-type .muted {
  max-width: 520px;
  color: var(--pc-text-muted);
  line-height: 1.55;
}

.badge--soft {
  width: fit-content;
  border: 1px solid color-mix(in srgb, var(--pc-navy-900) 24%, var(--pc-border));
  background: color-mix(in srgb, var(--pc-primary-soft) 78%, #ffffff);
  color: var(--pc-navy-900);
}

.settings :deep(.settings-subnav__link) {
  border: 1px solid var(--pc-border);
  border-radius: var(--pc-radius-control);
  background: #ffffff;
  color: var(--pc-text-muted);
  font-weight: 700;
}

.settings :deep(.settings-subnav__link:hover),
.settings :deep(.settings-subnav__link:focus-visible) {
  border-color: color-mix(in srgb, var(--pc-navy-900) 24%, var(--pc-border));
  background: color-mix(in srgb, var(--pc-primary-soft) 64%, #ffffff);
  color: var(--pc-navy-900);
}

.settings :deep(.settings-subnav__link.is-active) {
  border-color: color-mix(in srgb, var(--pc-navy-900) 36%, var(--pc-border));
  background: color-mix(in srgb, var(--pc-primary-soft) 80%, #ffffff);
  color: var(--pc-navy-900);
}

.prefs {
  display: grid;
  gap: 10px;
}

.pref-item {
  display: grid;
  grid-template-columns: 24px 1fr;
  gap: 10px;
  align-items: start;
  padding: 10px 12px;
  border-radius: var(--pc-radius-card);
  border: 1px solid var(--pc-border);
  background: color-mix(in srgb, var(--pc-surface) 94%, #ffffff);
  transition: background-color 0.18s ease, border-color 0.18s ease;
}

.pref-item:hover,
.pref-item:focus-within {
  border-color: color-mix(in srgb, var(--pc-navy-900) 24%, var(--pc-border));
  background: color-mix(in srgb, var(--pc-primary-soft) 46%, #ffffff);
}

.pref-item input[type="checkbox"] {
  accent-color: var(--pc-navy-900);
}

.pref-item--disabled {
  cursor: not-allowed;
  color: var(--pc-text-muted);
}

.pref-item strong {
  display: block;
}

.pref-item small {
  color: var(--muted);
}

.actions {
  margin-top: 8px;
  display: flex;
  gap: 8px;
}

.telegram-actions { flex-wrap: wrap; }

.telegram-open-link {
  width: fit-content;
  max-width: 100%;
  min-height: 44px;
  white-space: normal;
  text-align: center;
}

@media (max-width: 600px) {
  .telegram-open-link { width: 100%; }
}

.actions .btn {
  border-color: var(--pc-navy-900);
  border-radius: var(--pc-radius-control);
  background: linear-gradient(180deg, var(--pc-navy-900), var(--pc-navy-950));
  color: #ffffff;
}
</style>
