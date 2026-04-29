<template>
  <section class="client-account-invite">
    <div class="invite-panel">
      <div class="badge">Запрошення</div>
      <h1 class="title invite-panel__title">Запрошення підключити акаунт клієнта</h1>

      <div v-if="loading" class="muted">Перевіряємо запрошення...</div>

      <template v-else-if="error">
        <p class="form-error">{{ error }}</p>
      </template>

      <template v-else>
        <p class="muted invite-panel__intro">
          Спеціаліст вже створив для вас клієнтську картку в Pro Consult.
          Щоб бачити дані про свої сесії, увійдіть у наявний акаунт або створіть новий акаунт клієнта.
        </p>

        <dl v-if="preview" class="invite-details">
          <div v-if="specialistName">
            <dt>Спеціаліст</dt>
            <dd>{{ specialistName }}</dd>
          </div>
          <div v-if="clientName">
            <dt>Клієнт</dt>
            <dd>{{ clientName }}</dd>
          </div>
          <div v-if="expiresAtLabel">
            <dt>Дійсне до</dt>
            <dd>{{ expiresAtLabel }}</dd>
          </div>
        </dl>

        <div v-if="success" class="invite-success">Кабінет підключено</div>

        <div v-else-if="identityConfirmationRequired" class="invite-confirmation">
          <p>
            Дані акаунта відрізняються від даних у картці клієнта.
            Підтвердьте, що це ваш запис, щоб підключити кабінет.
          </p>
          <button class="btn" type="button" :disabled="accepting" @click="acceptInvite(true)">
            {{ accepting ? 'Підключаємо...' : 'Підтвердити і підключити' }}
          </button>
        </div>

        <div v-else-if="!isAuthenticated" class="invite-auth-options">
          <div class="invite-auth-option">
            <RouterLink class="btn" :to="loginTarget">Увійти у свій акаунт</RouterLink>
            <p class="invite-auth-option__hint">
              Оберіть цей варіант, якщо у вас вже є акаунт у Pro Consult.
              Після входу ви зможете підтвердити підключення до вашої клієнтської картки.
            </p>
          </div>
          <div class="invite-auth-option">
            <RouterLink class="btn btn--ghost" :to="signupTarget">Створити свій акаунт клієнта</RouterLink>
            <p class="invite-auth-option__hint">
              Оберіть цей варіант, якщо ви ще не користувались Pro Consult.
              Після створення акаунта ви зможете підтвердити підключення до вашої клієнтської картки.
            </p>
          </div>
        </div>

        <div v-else-if="!isClientUser" class="invite-confirmation">
          <p>Це запрошення можна прийняти лише з клієнтського кабінету.</p>
          <button class="btn btn--ghost" type="button" @click="logoutAndLoginAsClient">
            Вийти та увійти як клієнт
          </button>
        </div>

        <div v-else class="invite-actions">
          <button class="btn" type="button" :disabled="accepting" @click="acceptInvite(false)">
            {{ accepting ? 'Підключаємо...' : 'Підключити кабінет' }}
          </button>
        </div>

        <p v-if="acceptError" class="form-error">{{ acceptError }}</p>

        <div class="invite-info-block">
          <h2 class="invite-info-block__title">Що буде доступно після підключення</h2>
          <p>
            Ви зможете бачити дані про свої сесії: дату, час, формат, статус, посилання на онлайн-зустріч, якщо воно
            додане, а також інформацію щодо оплати, якщо спеціаліст надає її через сервіс.
          </p>
        </div>

        <p class="invite-privacy-note">
          Приватні нотатки спеціаліста залишаються конфіденційними та зашифрованими. Доступ до них має лише спеціаліст,
          з яким ви працюєте.
        </p>
      </template>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import {
  acceptClientRecordAccountInvite,
  fetchPublicClientRecordAccountInvite,
  type PublicClientRecordAccountInvitePreview,
} from '../lib/api'
import { formatUkDateTimeCompact } from '../lib/dateTime'
import { useAuthStore } from '../stores/auth'

const route = useRoute()
const router = useRouter()
const auth = useAuthStore()

const loading = ref(false)
const accepting = ref(false)
const error = ref('')
const acceptError = ref('')
const success = ref(false)
const identityConfirmationRequired = ref(false)
const preview = ref<PublicClientRecordAccountInvitePreview | null>(null)

const token = computed(() => String(route.params.token || '').trim())
const redirectPath = computed(() => `/client/invite/${encodeURIComponent(token.value)}`)
const loginTarget = computed(() => ({ name: 'login', query: { redirect: redirectPath.value } }))
const signupTarget = computed(() => ({ name: 'signup-client', query: { redirect: redirectPath.value } }))
const isAuthenticated = computed(() => Boolean(auth.accessToken))
const roles = computed(() => auth.me?.user.roles ?? auth.user?.roles ?? [])
const singularRole = computed(() => String(auth.me?.user.role || auth.user?.role || '').toUpperCase())
const isClientUser = computed(() => roles.value.includes('CLIENT') || singularRole.value === 'CLIENT')
const specialistName = computed(() => preview.value?.specialist_display_name || preview.value?.specialist_name || '')
const clientName = computed(() => preview.value?.client_display_name || preview.value?.client_name || '')
const expiresAtLabel = computed(() => formatUkDateTimeCompact(preview.value?.expires_at, ''))

function inviteErrorMessage(err: unknown) {
  const status = (err as any)?.response?.status
  const payload = (err as any)?.response?.data || {}
  const code = String(payload.code || payload.reason_code || '').toUpperCase()
  if (status === 404 || code === 'INVITE_NOT_FOUND') return 'Запрошення не знайдено.'
  if (code === 'INVITE_EXPIRED') return 'Запрошення більше не дійсне. Попросіть спеціаліста надіслати нове.'
  if (code === 'INVITE_REVOKED') return 'Запрошення було відкликане. Попросіть спеціаліста надіслати нове.'
  if (code === 'INVITE_ALREADY_ACCEPTED') return 'Це запрошення вже використано.'
  if (code === 'CLIENT_RECORD_ALREADY_LINKED') return 'Кабінет уже підключено до цього клієнта.'
  if (code === 'DUPLICATE_CLIENT_RECORD_LINK') return 'Цей акаунт уже повʼязаний з іншою карткою цього спеціаліста.'
  return 'Не вдалося обробити запрошення. Спробуйте ще раз.'
}

async function loadPreview() {
  if (!token.value) {
    error.value = 'Запрошення не знайдено.'
    return
  }
  loading.value = true
  error.value = ''
  try {
    preview.value = await fetchPublicClientRecordAccountInvite(token.value)
    if (!preview.value) {
      error.value = 'Запрошення не знайдено.'
    }
  } catch (err) {
    error.value = inviteErrorMessage(err)
  } finally {
    loading.value = false
  }
}

async function ensureClientLoaded() {
  if (!auth.accessToken || auth.me) return
  try {
    await auth.loadMe()
  } catch {
    // Keep the public preview visible; accept still requires a valid client session.
  }
}

async function acceptInvite(confirmIdentity: boolean) {
  if (!token.value || accepting.value) return
  accepting.value = true
  acceptError.value = ''
  try {
    await acceptClientRecordAccountInvite(
      token.value,
      confirmIdentity ? { confirm_identity: true } : undefined
    )
    identityConfirmationRequired.value = false
    success.value = true
    await auth.loadMe()
    await router.push('/client')
  } catch (err) {
    const payload = (err as any)?.response?.data || {}
    const code = String(payload.code || payload.reason_code || '').toUpperCase()
    if (code === 'IDENTITY_CONFIRMATION_REQUIRED') {
      identityConfirmationRequired.value = true
      acceptError.value = ''
    } else {
      acceptError.value = inviteErrorMessage(err)
    }
  } finally {
    accepting.value = false
  }
}

function logoutAndLoginAsClient() {
  auth.logout()
  router.push(loginTarget.value)
}

onMounted(async () => {
  await Promise.all([loadPreview(), ensureClientLoaded()])
})
</script>

<style scoped>
.client-account-invite {
  display: grid;
  place-items: center;
  min-height: min(680px, calc(100vh - 120px));
  padding: 32px 0 44px;
}

.invite-panel {
  width: min(680px, 100%);
  display: grid;
  gap: 16px;
  border: 1px solid var(--pc-border);
  border-radius: var(--pc-radius-panel);
  padding: 28px;
  background: #fff;
  box-shadow: var(--pc-shadow-soft);
}

.invite-panel__title {
  margin: 0;
}

.invite-panel__intro {
  max-width: 560px;
}

.invite-details {
  display: grid;
  gap: 10px;
  margin: 0;
}

.invite-details div {
  display: grid;
  gap: 4px;
  border: 1px solid color-mix(in srgb, var(--pc-border) 82%, #ffffff);
  border-radius: var(--pc-radius-card);
  padding: 10px 12px;
  background: color-mix(in srgb, var(--pc-bg-main) 84%, #ffffff);
}

.invite-details dt {
  color: var(--pc-text-muted);
  font-size: 12px;
  font-weight: 700;
}

.invite-details dd {
  margin: 0;
  color: var(--pc-navy-900);
  font-weight: 700;
}

.invite-actions,
.invite-confirmation {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  align-items: center;
}

.invite-auth-options {
  display: grid;
  gap: 12px;
}

.invite-auth-option {
  display: grid;
  gap: 8px;
}

.invite-auth-option__hint {
  margin: 0;
  color: var(--pc-text-muted);
  font-size: 13px;
  line-height: 1.45;
}

.invite-confirmation {
  display: grid;
  justify-items: start;
}

.invite-confirmation p {
  margin: 0;
  color: var(--pc-text-muted);
}

.invite-success {
  border: 1px solid color-mix(in srgb, var(--pc-navy-900) 18%, var(--pc-border));
  border-radius: var(--pc-radius-card);
  padding: 10px 12px;
  background: color-mix(in srgb, var(--pc-blue-soft) 72%, #ffffff);
  color: var(--pc-navy-900);
  font-weight: 800;
}

.invite-info-block {
  border: 1px solid color-mix(in srgb, var(--pc-border) 82%, #ffffff);
  border-radius: var(--pc-radius-card);
  padding: 12px;
  background: color-mix(in srgb, var(--pc-bg-main) 82%, #ffffff);
  color: var(--pc-text-muted);
  font-size: 13px;
  line-height: 1.5;
}

.invite-info-block__title {
  margin: 0 0 6px;
  color: var(--pc-navy-900);
  font-size: 14px;
  font-weight: 800;
}

.invite-info-block p,
.invite-privacy-note {
  margin: 0;
}

.invite-privacy-note {
  color: var(--pc-text-muted);
  font-size: 12px;
  line-height: 1.5;
}
</style>
