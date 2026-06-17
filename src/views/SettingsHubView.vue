<template>
  <section class="settings-hub">
    <header class="panel settings-hub__hero">
      <h1 class="title">Усі налаштування</h1>
      <p class="muted">Оберіть розділ, який хочете відкрити.</p>
      <SettingsSubnav :active="activeTab" />
    </header>

    <section v-if="activeTab === 'hub'" class="settings-hub__grid">
      <RouterLink class="panel settings-card" to="/cabinet/settings?tab=payment-details">
        <h2 class="settings-card__title">Реквізити</h2>
        <p class="muted">Керуйте платіжними реквізитами для запиту підтвердження оплати у сесіях.</p>
      </RouterLink>

      <RouterLink class="panel settings-card" to="/cabinet/profile">
        <h2 class="settings-card__title">Профіль</h2>
        <p class="muted">Дані публічного профілю, контакти та видимість.</p>
      </RouterLink>

      <RouterLink class="panel settings-card" to="/cabinet/settings/notifications">
        <h2 class="settings-card__title">Сповіщення</h2>
        <p class="muted">Керуйте in-app подіями для нагадувань і бронювань.</p>
      </RouterLink>

      <RouterLink class="panel settings-card" to="/cabinet/billing">
        <h2 class="settings-card__title">Плани та доступ</h2>
        <p class="muted">Поточний план, обмеження та запит на розширення.</p>
      </RouterLink>
    </section>

    <section v-if="activeTab === 'hub'" class="panel account-data-panel">
      <div class="account-data-panel__header">
        <div>
          <h2 class="account-data-panel__title">Акаунт і дані</h2>
          <p class="muted account-data-panel__copy">
            Тут можна видалити акаунт і пов’язані персональні дані з Pro Consult.
          </p>
        </div>
        <span
          v-if="dataDeletionRequest"
          class="account-data-status"
          :class="dataDeletionStatusClass(dataDeletionRequest.status)"
        >
          {{ dataDeletionStatusLabel(dataDeletionRequest.status) }}
        </span>
      </div>

      <div v-if="dataDeletionLoading" class="muted">Завантаження...</div>
      <div v-else class="account-data-panel__body">
        <div v-if="dataDeletionError" class="form-error">{{ dataDeletionError }}</div>

        <div v-if="dataDeletionRequest" class="account-data-request">
          <p class="account-data-request__meta">
            Створено:
            <strong>{{ formatDateTime(dataDeletionRequest.submitted_at) }}</strong>
          </p>
        </div>

        <div class="account-data-actions">
          <button
            v-if="canSubmitDataDeletionRequest"
            class="btn btn--danger"
            type="button"
            :disabled="dataDeletionSubmitting"
            @click="openDataDeletionConfirm"
          >
            {{ dataDeletionSubmitting ? 'Видаляємо...' : 'Видалити акаунт' }}
          </button>

          <button
            v-if="canCancelDataDeletionRequest"
            class="btn btn--ghost"
            type="button"
            :disabled="dataDeletionCancelling"
            @click="onCancelDataDeletionRequest"
          >
            {{ dataDeletionCancelling ? 'Скасовуємо...' : 'Скасувати видалення' }}
          </button>
        </div>
      </div>
    </section>

    <section v-else id="payment-details" class="panel payment-details-panel">
      <div class="payment-details-panel__header">
        <h2 class="payment-details-panel__title">Реквізити для оплати</h2>
      </div>

      <div v-if="loading" class="muted">Завантаження...</div>

      <template v-else>
        <div v-if="defaultError" class="form-error">{{ defaultError }}</div>

        <fieldset v-if="configuredMethodTypes.length === 2" class="default-selector">
          <legend class="muted">За замовчуванням</legend>
          <label class="default-selector__option">
            <input
              type="radio"
              name="default-payment-method"
              :checked="details.default_method_type === 'bank_account'"
              :disabled="defaultSaving"
              @change="setDefaultMethod('bank_account')"
            />
            <span>IBAN</span>
          </label>
          <label class="default-selector__option">
            <input
              type="radio"
              name="default-payment-method"
              :checked="details.default_method_type === 'card'"
              :disabled="defaultSaving"
              @change="setDefaultMethod('card')"
            />
            <span>Картка</span>
          </label>
        </fieldset>

        <p v-else-if="details.default_method_type" class="muted">
          За замовчуванням: {{ methodTypeLabel(details.default_method_type) }}
        </p>

        <div class="payment-methods-grid">
          <article class="panel payment-method-card">
            <h3 class="payment-method-card__title">Банківський рахунок (IBAN)</h3>

            <div v-if="!isEditingMethod('bank_account') && !hasConfiguredMethod('bank_account')" class="payment-method-card__empty">
              <p class="muted">Метод ще не налаштований.</p>
              <button class="btn btn--sm" type="button" @click="startEditMethod('bank_account')">
                Додати IBAN
              </button>
            </div>

            <div v-else-if="!isEditingMethod('bank_account')" class="payment-method-view">
              <div class="payment-method-row">
                <span class="muted">Отримувач</span>
                <strong>{{ getConfiguredMethod('bank_account')?.recipient_name }}</strong>
              </div>
              <div class="payment-method-row">
                <span class="muted">IBAN</span>
                <strong>{{ getConfiguredMethod('bank_account')?.iban }}</strong>
              </div>
              <div v-if="getConfiguredMethod('bank_account')?.bank_name" class="payment-method-row">
                <span class="muted">Банк</span>
                <span>{{ getConfiguredMethod('bank_account')?.bank_name }}</span>
              </div>
              <div v-if="getConfiguredMethod('bank_account')?.payment_purpose" class="payment-method-row">
                <span class="muted">Призначення платежу</span>
                <span>{{ getConfiguredMethod('bank_account')?.payment_purpose }}</span>
              </div>
              <div v-if="getConfiguredMethod('bank_account')?.comment" class="payment-method-row">
                <span class="muted">Коментар</span>
                <span>{{ getConfiguredMethod('bank_account')?.comment }}</span>
              </div>
              <div class="payment-method-actions">
                <button class="btn btn--ghost btn--sm" type="button" @click="startEditMethod('bank_account')">
                  Редагувати
                </button>
                <button
                  class="btn btn--ghost btn--sm"
                  type="button"
                  :disabled="deletingMethodType === 'bank_account'"
                  @click="deleteMethod('bank_account')"
                >
                  {{ deletingMethodType === 'bank_account' ? 'Видаляємо...' : 'Видалити' }}
                </button>
              </div>
            </div>

            <form v-else class="payment-method-form" @submit.prevent="saveMethod('bank_account')">
              <label class="field">
                <span class="muted">Отримувач</span>
                <input
                  v-model.trim="forms.bank_account.recipient_name"
                  class="input"
                  placeholder="ПІБ або назва ФОП/компанії"
                />
              </label>

              <label class="field">
                <span class="muted">IBAN</span>
                <input v-model.trim="forms.bank_account.iban" class="input" placeholder="UA..." />
              </label>

              <label class="field">
                <span class="muted">Назва банку (необов'язково)</span>
                <input v-model.trim="forms.bank_account.bank_name" class="input" />
              </label>

              <label class="field">
                <span class="muted">Призначення платежу (необов'язково)</span>
                <textarea v-model.trim="forms.bank_account.payment_purpose" class="input textarea" rows="2" />
              </label>

              <label class="field">
                <span class="muted">Коментар (необов'язково)</span>
                <textarea v-model.trim="forms.bank_account.comment" class="input textarea" rows="2" />
              </label>

              <p v-if="formErrors.bank_account" class="form-error">{{ formErrors.bank_account }}</p>
              <p v-if="saveErrors.bank_account" class="form-error">{{ saveErrors.bank_account }}</p>

              <div class="payment-method-actions">
                <button class="btn btn--sm" type="submit" :disabled="savingMethodType === 'bank_account'">
                  {{ savingMethodType === 'bank_account' ? 'Зберігаємо...' : 'Зберегти' }}
                </button>
                <button class="btn btn--ghost btn--sm" type="button" :disabled="savingMethodType === 'bank_account'" @click="cancelEditMethod">
                  Скасувати
                </button>
              </div>
            </form>
          </article>

          <article class="panel payment-method-card">
            <h3 class="payment-method-card__title">Картка</h3>

            <div v-if="!isEditingMethod('card') && !hasConfiguredMethod('card')" class="payment-method-card__empty">
              <p class="muted">Метод ще не налаштований.</p>
              <button class="btn btn--sm" type="button" @click="startEditMethod('card')">
                Додати картку
              </button>
            </div>

            <div v-else-if="!isEditingMethod('card')" class="payment-method-view">
              <div class="payment-method-row">
                <span class="muted">Отримувач</span>
                <strong>{{ getConfiguredMethod('card')?.recipient_name }}</strong>
              </div>
              <div class="payment-method-row">
                <span class="muted">Номер картки</span>
                <strong>{{ getConfiguredMethod('card')?.card_number }}</strong>
              </div>
              <div v-if="getConfiguredMethod('card')?.bank_name" class="payment-method-row">
                <span class="muted">Банк</span>
                <span>{{ getConfiguredMethod('card')?.bank_name }}</span>
              </div>
              <div v-if="getConfiguredMethod('card')?.payment_purpose" class="payment-method-row">
                <span class="muted">Призначення платежу</span>
                <span>{{ getConfiguredMethod('card')?.payment_purpose }}</span>
              </div>
              <div v-if="getConfiguredMethod('card')?.comment" class="payment-method-row">
                <span class="muted">Коментар</span>
                <span>{{ getConfiguredMethod('card')?.comment }}</span>
              </div>
              <div class="payment-method-actions">
                <button class="btn btn--ghost btn--sm" type="button" @click="startEditMethod('card')">
                  Редагувати
                </button>
                <button
                  class="btn btn--ghost btn--sm"
                  type="button"
                  :disabled="deletingMethodType === 'card'"
                  @click="deleteMethod('card')"
                >
                  {{ deletingMethodType === 'card' ? 'Видаляємо...' : 'Видалити' }}
                </button>
              </div>
            </div>

            <form v-else class="payment-method-form" @submit.prevent="saveMethod('card')">
              <label class="field">
                <span class="muted">Отримувач</span>
                <input
                  v-model.trim="forms.card.recipient_name"
                  class="input"
                  placeholder="ПІБ або назва ФОП/компанії"
                />
              </label>

              <label class="field">
                <span class="muted">Номер картки</span>
                <input
                  v-model.trim="forms.card.card_number"
                  class="input"
                  placeholder="0000 0000 0000 0000"
                />
              </label>

              <label class="field">
                <span class="muted">Назва банку (необов'язково)</span>
                <input v-model.trim="forms.card.bank_name" class="input" />
              </label>

              <label class="field">
                <span class="muted">Призначення платежу (необов'язково)</span>
                <textarea v-model.trim="forms.card.payment_purpose" class="input textarea" rows="2" />
              </label>

              <label class="field">
                <span class="muted">Коментар (необов'язково)</span>
                <textarea v-model.trim="forms.card.comment" class="input textarea" rows="2" />
              </label>

              <p v-if="formErrors.card" class="form-error">{{ formErrors.card }}</p>
              <p v-if="saveErrors.card" class="form-error">{{ saveErrors.card }}</p>

              <div class="payment-method-actions">
                <button class="btn btn--sm" type="submit" :disabled="savingMethodType === 'card'">
                  {{ savingMethodType === 'card' ? 'Зберігаємо...' : 'Зберегти' }}
                </button>
                <button class="btn btn--ghost btn--sm" type="button" :disabled="savingMethodType === 'card'" @click="cancelEditMethod">
                  Скасувати
                </button>
              </div>
            </form>
          </article>
        </div>
      </template>
    </section>

    <ConfirmModal
      :open="dataDeletionConfirmOpen"
      title="Видалити акаунт?"
      message="Акаунт і пов’язані персональні дані буде видалено з Pro Consult. Після цього доступ до акаунта буде закрито."
      confirm-text="Видалити акаунт"
      cancel-text="Залишити акаунт"
      tone="danger"
      @confirm="confirmCreateDataDeletionRequest"
      @cancel="closeDataDeletionConfirm"
    />
  </section>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useToast } from '../composables/useToast'
import ConfirmModal from '../components/ConfirmModal.vue'
import {
  cancelDataDeletionRequest,
  createDataDeletionRequest,
  fetchCurrentDataDeletionRequest,
  fetchCabinetPaymentDetails,
  getApiErrorMessage,
  updateCabinetPaymentDetails,
  type DataDeletionRequest,
  type SpecialistPaymentDetails,
  type SpecialistPaymentMethodDetails,
  type SpecialistPaymentMethodType,
} from '../lib/api'
import SettingsSubnav from '../components/SettingsSubnav.vue'

type CanonicalMethodType = 'bank_account' | 'card'
type DataDeletionRequestStatus =
  | 'SUBMITTED'
  | 'IN_REVIEW'
  | 'APPROVED'
  | 'REJECTED'
  | 'CANCELLED'
  | 'EXECUTED'

const PAYMENT_DETAILS_TAB = 'payment-details'
const METHOD_TYPES: CanonicalMethodType[] = ['bank_account', 'card']
const DATA_DELETION_STATUS_LABELS: Record<DataDeletionRequestStatus, string> = {
  SUBMITTED: 'Видалення акаунта розпочато',
  IN_REVIEW: 'Видалення акаунта в обробці',
  APPROVED: 'Видалення акаунта в обробці',
  REJECTED: 'Не вдалося завершити видалення акаунта',
  CANCELLED: 'Видалення акаунта скасовано',
  EXECUTED: 'Акаунт видалено',
}

const route = useRoute()
const router = useRouter()
const toast = useToast()

const loading = ref(false)
const isLoaded = ref(false)
const savingMethodType = ref<CanonicalMethodType | null>(null)
const deletingMethodType = ref<CanonicalMethodType | null>(null)
const defaultSaving = ref(false)
const defaultError = ref('')
const editingMethodType = ref<CanonicalMethodType | null>(null)
const dataDeletionLoading = ref(false)
const dataDeletionSubmitting = ref(false)
const dataDeletionCancelling = ref(false)
const dataDeletionError = ref('')
const dataDeletionRequest = ref<DataDeletionRequest | null>(null)
const dataDeletionConfirmOpen = ref(false)

const details = ref<SpecialistPaymentDetails>(createEmptyDetails())
const forms = reactive<Record<CanonicalMethodType, SpecialistPaymentMethodDetails>>({
  bank_account: createEmptyMethod(),
  card: createEmptyMethod(),
})
const formErrors = reactive<Record<CanonicalMethodType, string>>({
  bank_account: '',
  card: '',
})
const saveErrors = reactive<Record<CanonicalMethodType, string>>({
  bank_account: '',
  card: '',
})

const activeTab = computed<'hub' | 'payment-details'>(() =>
  route.query.tab === PAYMENT_DETAILS_TAB ? PAYMENT_DETAILS_TAB : 'hub'
)
const isPaymentDetailsTab = computed(() => activeTab.value === PAYMENT_DETAILS_TAB)
const canSubmitDataDeletionRequest = computed(() =>
  !dataDeletionRequest.value ||
  ['REJECTED', 'CANCELLED', 'EXECUTED'].includes(dataDeletionRequest.value.status)
)
const canCancelDataDeletionRequest = computed(() =>
  Boolean(
    dataDeletionRequest.value &&
      ['SUBMITTED', 'IN_REVIEW'].includes(dataDeletionRequest.value.status)
  )
)
const configuredMethodTypes = computed<CanonicalMethodType[]>(() =>
  METHOD_TYPES.filter((methodType) => details.value.available_methods.includes(methodType))
)

function createEmptyMethod(): SpecialistPaymentMethodDetails {
  return {
    recipient_name: '',
    iban: '',
    card_number: '',
    bank_name: '',
    payment_purpose: '',
    comment: '',
  }
}

function createEmptyDetails(): SpecialistPaymentDetails {
  return {
    is_configured: false,
    available_methods: [],
    default_method_type: null,
    methods: {},
  }
}

function normalizeMethodType(value: unknown): CanonicalMethodType | null {
  if (value === 'bank_account' || value === 'card') return value
  return null
}

function normalizeMethodDetails(payload: unknown): SpecialistPaymentMethodDetails {
  const source = payload && typeof payload === 'object' ? payload as Partial<SpecialistPaymentMethodDetails> : {}
  return {
    recipient_name: String(source.recipient_name || '').trim(),
    iban: String(source.iban || '').trim(),
    card_number: String(source.card_number || '').trim(),
    bank_name: String(source.bank_name || '').trim(),
    payment_purpose: String(source.payment_purpose || '').trim(),
    comment: String(source.comment || '').trim(),
  }
}

function hasRequiredMethodFields(
  methodType: CanonicalMethodType,
  methodDetails: SpecialistPaymentMethodDetails | null | undefined
) {
  if (!methodDetails) return false
  if (!methodDetails.recipient_name.trim()) return false
  if (methodType === 'bank_account') return Boolean(methodDetails.iban.trim())
  return Boolean(methodDetails.card_number.trim())
}

function normalizePaymentDetails(payload: unknown): SpecialistPaymentDetails {
  const source = payload && typeof payload === 'object' ? payload as Partial<SpecialistPaymentDetails> : {}
  const normalizedMethods: Partial<Record<CanonicalMethodType, SpecialistPaymentMethodDetails | null>> = {}

  METHOD_TYPES.forEach((methodType) => {
    const rawMethod = source.methods?.[methodType]
    const methodDetails = rawMethod ? normalizeMethodDetails(rawMethod) : null
    normalizedMethods[methodType] = hasRequiredMethodFields(methodType, methodDetails) ? methodDetails : null
  })

  const availableFromPayload = Array.isArray(source.available_methods)
    ? source.available_methods.map(normalizeMethodType).filter((value): value is CanonicalMethodType => Boolean(value))
    : []
  const availableMethods = availableFromPayload.length
    ? availableFromPayload.filter((methodType) => Boolean(normalizedMethods[methodType]))
    : METHOD_TYPES.filter((methodType) => Boolean(normalizedMethods[methodType]))
  const defaultMethod = normalizeMethodType(source.default_method_type)

  return {
    is_configured: availableMethods.length > 0,
    available_methods: availableMethods,
    default_method_type:
      defaultMethod && availableMethods.includes(defaultMethod)
        ? defaultMethod
        : availableMethods[0] || null,
    methods: normalizedMethods,
  }
}

function methodTypeLabel(methodType: SpecialistPaymentMethodType | null) {
  return methodType === 'card' ? 'Картка' : 'Банківський рахунок (IBAN)'
}

function dataDeletionStatusLabel(status: string) {
  return DATA_DELETION_STATUS_LABELS[status as DataDeletionRequestStatus] || status
}

function dataDeletionStatusClass(status: string) {
  if (status === 'REJECTED') return 'account-data-status--rejected'
  if (status === 'CANCELLED') return 'account-data-status--muted'
  if (status === 'EXECUTED') return 'account-data-status--ok'
  return 'account-data-status--pending'
}

function formatDateTime(value: string) {
  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) return value
  return new Intl.DateTimeFormat('uk-UA', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(parsed)
}

function getConfiguredMethod(methodType: CanonicalMethodType) {
  return details.value.methods[methodType] || null
}

function hasConfiguredMethod(methodType: CanonicalMethodType) {
  return configuredMethodTypes.value.includes(methodType) && Boolean(getConfiguredMethod(methodType))
}

function isEditingMethod(methodType: CanonicalMethodType) {
  return editingMethodType.value === methodType
}

function ensureCanonicalPaymentDetailsTab() {
  const hasLegacyHash = route.hash === '#payment-details'
  const isCanonicalTab = route.query.tab === PAYMENT_DETAILS_TAB
  if (!hasLegacyHash || isCanonicalTab) return

  router.replace({
    path: '/cabinet/settings',
    query: {
      ...route.query,
      tab: PAYMENT_DETAILS_TAB,
    },
    hash: '',
  })
}

function resetMethodErrors(methodType: CanonicalMethodType) {
  formErrors[methodType] = ''
  saveErrors[methodType] = ''
}

function startEditMethod(methodType: CanonicalMethodType) {
  const source = getConfiguredMethod(methodType) || createEmptyMethod()
  forms[methodType] = {
    recipient_name: source.recipient_name,
    iban: source.iban,
    card_number: source.card_number,
    bank_name: source.bank_name,
    payment_purpose: source.payment_purpose,
    comment: source.comment,
  }
  resetMethodErrors(methodType)
  editingMethodType.value = methodType
}

function cancelEditMethod() {
  if (!editingMethodType.value) return
  resetMethodErrors(editingMethodType.value)
  editingMethodType.value = null
}

function validateMethodForm(methodType: CanonicalMethodType) {
  const form = forms[methodType]
  if (!form.recipient_name.trim()) return 'Вкажіть отримувача.'
  if (methodType === 'bank_account' && !form.iban.trim()) return 'Вкажіть IBAN.'
  if (methodType === 'card' && !form.card_number.trim()) return 'Вкажіть номер картки.'
  return ''
}

function buildMethodPayload(methodType: CanonicalMethodType): SpecialistPaymentMethodDetails {
  const form = forms[methodType]
  return {
    recipient_name: form.recipient_name.trim(),
    iban: methodType === 'bank_account' ? form.iban.trim() : '',
    card_number: methodType === 'card' ? form.card_number.trim() : '',
    bank_name: form.bank_name.trim(),
    payment_purpose: form.payment_purpose.trim(),
    comment: form.comment.trim(),
  }
}

async function loadPaymentDetails() {
  loading.value = true
  defaultError.value = ''
  try {
    details.value = normalizePaymentDetails(await fetchCabinetPaymentDetails())
    isLoaded.value = true
  } catch (err) {
    toast.error(getApiErrorMessage(err, 'Не вдалося завантажити реквізити для оплати.'))
    details.value = createEmptyDetails()
    isLoaded.value = false
  } finally {
    loading.value = false
  }
}

async function loadDataDeletionRequest() {
  dataDeletionLoading.value = true
  dataDeletionError.value = ''
  try {
    dataDeletionRequest.value = await fetchCurrentDataDeletionRequest()
  } catch (err) {
    dataDeletionError.value = getApiErrorMessage(
      err,
      'Не вдалося завантажити стан видалення акаунта.'
    )
  } finally {
    dataDeletionLoading.value = false
  }
}

function openDataDeletionConfirm() {
  dataDeletionError.value = ''
  dataDeletionConfirmOpen.value = true
}

function closeDataDeletionConfirm() {
  dataDeletionConfirmOpen.value = false
}

async function confirmCreateDataDeletionRequest() {
  dataDeletionConfirmOpen.value = false
  dataDeletionSubmitting.value = true
  dataDeletionError.value = ''
  try {
    dataDeletionRequest.value = await createDataDeletionRequest()
    toast.success('Видалення акаунта розпочато.')
  } catch (err) {
    dataDeletionError.value = getApiErrorMessage(err, 'Не вдалося розпочати видалення акаунта.')
  } finally {
    dataDeletionSubmitting.value = false
  }
}

async function onCancelDataDeletionRequest() {
  if (!dataDeletionRequest.value) return
  dataDeletionCancelling.value = true
  dataDeletionError.value = ''
  try {
    dataDeletionRequest.value = await cancelDataDeletionRequest(dataDeletionRequest.value.id)
    toast.success('Видалення акаунта скасовано.')
  } catch (err) {
    dataDeletionError.value = getApiErrorMessage(err, 'Не вдалося скасувати видалення акаунта.')
  } finally {
    dataDeletionCancelling.value = false
  }
}

async function saveMethod(methodType: CanonicalMethodType) {
  const validationError = validateMethodForm(methodType)
  formErrors[methodType] = validationError
  saveErrors[methodType] = ''
  if (validationError) return

  savingMethodType.value = methodType
  try {
    const payload = buildMethodPayload(methodType)
    details.value = normalizePaymentDetails(
      await updateCabinetPaymentDetails({
        methods: {
          [methodType]: payload,
        },
      })
    )
    editingMethodType.value = null
    toast.success('Реквізити для оплати збережено.')
  } catch (err) {
    saveErrors[methodType] = getApiErrorMessage(err, 'Не вдалося зберегти реквізити для оплати.')
  } finally {
    savingMethodType.value = null
  }
}

async function deleteMethod(methodType: CanonicalMethodType) {
  deletingMethodType.value = methodType
  saveErrors[methodType] = ''
  try {
    details.value = normalizePaymentDetails(
      await updateCabinetPaymentDetails({
        methods: {
          [methodType]: null,
        },
      })
    )
    if (editingMethodType.value === methodType) {
      editingMethodType.value = null
    }
    toast.success('Реквізити оновлено.')
  } catch (err) {
    saveErrors[methodType] = getApiErrorMessage(err, 'Не вдалося видалити реквізити.')
  } finally {
    deletingMethodType.value = null
  }
}

async function setDefaultMethod(methodType: CanonicalMethodType) {
  if (details.value.default_method_type === methodType) return
  defaultSaving.value = true
  defaultError.value = ''
  try {
    details.value = normalizePaymentDetails(
      await updateCabinetPaymentDetails({
        default_method_type: methodType,
      })
    )
    toast.success('Метод за замовчуванням оновлено.')
  } catch (err) {
    defaultError.value = getApiErrorMessage(err, 'Не вдалося оновити метод за замовчуванням.')
  } finally {
    defaultSaving.value = false
  }
}

watch(
  () => [route.hash, route.query.tab],
  () => {
    ensureCanonicalPaymentDetailsTab()
  },
  { immediate: true }
)

watch(
  isPaymentDetailsTab,
  async (isActive) => {
    if (!isActive || isLoaded.value || loading.value) return
    await loadPaymentDetails()
  },
  { immediate: true }
)

onMounted(() => {
  void loadDataDeletionRequest()
})
</script>

<style scoped>
.settings-hub {
  display: grid;
  gap: 16px;
}

.panel {
  border: 1px solid var(--pc-border);
  border-radius: var(--pc-radius-panel);
  padding: 16px;
  background: #fff;
  box-shadow: var(--pc-shadow-soft);
}

.settings-hub__hero {
  display: grid;
  gap: 10px;
  position: relative;
  overflow: hidden;
  background:
    radial-gradient(circle at 92% 70%, color-mix(in srgb, var(--pc-peach-100) 70%, transparent) 0 120px, transparent 121px),
    linear-gradient(135deg, #ffffff 0%, color-mix(in srgb, var(--pc-primary-soft) 70%, #ffffff) 54%, color-mix(in srgb, var(--pc-yellow-soft) 45%, #ffffff) 100%);
  border: 1px solid var(--pc-border);
  border-radius: var(--pc-radius-panel);
  box-shadow: var(--pc-shadow-soft);
}

.settings-hub__hero > * {
  position: relative;
  z-index: 1;
}

.settings-hub__hero::after {
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

.settings-hub__hero .title {
  margin: 8px 0 8px;
  color: var(--pc-navy-950);
  font-size: 32px;
  line-height: 1.15;
}

.settings-hub__hero .muted {
  max-width: 520px;
  color: var(--pc-text-muted);
  line-height: 1.55;
}

.settings-hub :deep(.settings-subnav__link) {
  border: 1px solid var(--pc-border);
  border-radius: var(--pc-radius-control);
  background: #ffffff;
  color: var(--pc-text-muted);
}

.settings-hub :deep(.settings-subnav__link:hover),
.settings-hub :deep(.settings-subnav__link:focus-visible) {
  border-color: color-mix(in srgb, var(--pc-navy-900) 24%, var(--pc-border));
  background: color-mix(in srgb, var(--pc-primary-soft) 64%, #ffffff);
  color: var(--pc-navy-900);
}

.settings-hub :deep(.settings-subnav__link.is-active) {
  border-color: color-mix(in srgb, var(--pc-navy-900) 36%, var(--pc-border));
  background: color-mix(in srgb, var(--pc-primary-soft) 80%, #ffffff);
  color: var(--pc-navy-900);
}

.settings-hub__grid {
  display: grid;
  gap: 12px;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
}

.settings-card {
  border: 1px solid var(--pc-border);
  border-radius: var(--pc-radius-panel);
  background: #ffffff;
  box-shadow: var(--pc-shadow-soft);
  text-decoration: none;
  color: inherit;
  display: grid;
  gap: 6px;
  transition: background-color 0.2s ease, border-color 0.2s ease, box-shadow 0.2s ease, color 0.2s ease;
}

.settings-card:hover,
.settings-card:focus-visible {
  border-color: color-mix(in srgb, var(--pc-navy-900) 26%, var(--pc-border));
  background: color-mix(in srgb, var(--pc-primary-soft) 58%, #ffffff);
  color: var(--pc-navy-900);
  box-shadow: 0 12px 24px rgba(18, 52, 90, 0.1);
}

.settings-card__title {
  margin: 0;
  font-family: var(--font-display);
  font-size: 22px;
}

.account-data-panel {
  display: grid;
  gap: 14px;
}

.account-data-panel__header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 16px;
}

.account-data-panel__title {
  margin: 0 0 6px;
  font-family: var(--font-display);
  font-size: 22px;
}

.account-data-panel__copy {
  margin: 0;
  max-width: 720px;
  line-height: 1.55;
}

.account-data-panel__body {
  display: grid;
  gap: 12px;
}

.account-data-request {
  display: grid;
  gap: 6px;
  padding: 12px 14px;
  border: 1px solid var(--pc-border);
  border-radius: var(--pc-radius-control);
  background: color-mix(in srgb, var(--pc-primary-soft) 42%, #ffffff);
}

.account-data-request__meta,
.account-data-request__reason {
  margin: 0;
}

.account-data-actions {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
}

.account-data-status {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 32px;
  padding: 6px 12px;
  border-radius: 999px;
  font-size: 13px;
  font-weight: 600;
  line-height: 1.35;
}

.account-data-status--pending {
  background: color-mix(in srgb, var(--pc-primary-soft) 82%, #ffffff);
  color: var(--pc-navy-900);
  border: 1px solid color-mix(in srgb, var(--pc-primary) 20%, var(--pc-border));
}

.account-data-status--ok {
  background: color-mix(in srgb, #dff4e7 82%, #ffffff);
  color: #1e6a3b;
  border: 1px solid rgba(30, 106, 59, 0.16);
}

.account-data-status--rejected,
.account-data-status--muted {
  background: color-mix(in srgb, #f3f4f6 86%, #ffffff);
  color: var(--pc-text-muted);
  border: 1px solid var(--pc-border);
}

.account-data-modal__field {
  margin-top: 8px;
}

.payment-details-panel {
  display: grid;
  gap: 12px;
}

.payment-details-panel__header {
  display: grid;
  gap: 6px;
}

.payment-details-panel__title {
  margin: 0;
  font-family: var(--font-display);
  font-size: 22px;
}

.default-selector {
  margin: 0;
  border: 1px solid rgba(8, 113, 201, 0.25);
  border-radius: 12px;
  padding: 10px 12px;
  display: flex;
  flex-wrap: wrap;
  gap: 14px;
}

.default-selector__option {
  display: inline-flex;
  align-items: center;
  gap: 6px;
}

.payment-methods-grid {
  display: grid;
  gap: 12px;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
}

.payment-method-card {
  display: grid;
  gap: 10px;
}

.payment-method-card__title {
  margin: 0;
  font-size: 18px;
}

.payment-method-card__empty {
  display: grid;
  gap: 10px;
}

.payment-method-view {
  display: grid;
  gap: 8px;
}

.payment-method-row {
  display: grid;
  gap: 2px;
}

.payment-method-form {
  display: grid;
  gap: 10px;
}

.payment-method-actions {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.field {
  display: grid;
  gap: 6px;
}

.textarea {
  resize: vertical;
}

.form-error {
  margin: 0;
  color: #b3261e;
  font-size: 13px;
}

@media (max-width: 860px) {
  .settings-hub__hero {
    padding: 14px 16px;
    gap: 10px;
  }

  .settings-hub__hero::after {
    display: none;
  }

  .settings-hub__hero .title {
    font-size: 26px;
    margin: 4px 0;
    line-height: 1.16;
  }

  .settings-hub__hero .muted {
    margin: 0;
    font-size: 13px;
    line-height: 1.32;
    max-width: 100%;
    display: -webkit-box;
    -webkit-line-clamp: 1;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }

  .account-data-panel__header {
    flex-direction: column;
  }
}
</style>
