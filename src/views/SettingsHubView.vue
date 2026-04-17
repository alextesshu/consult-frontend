<template>
  <section class="settings-hub">
    <header class="panel settings-hub__hero">
      <div class="badge badge--soft">Налаштування</div>
      <h1 class="title">Усі налаштування</h1>
      <p class="muted">Оберіть розділ, який хочете відкрити.</p>
      <SettingsSubnav active="hub" />
    </header>

    <section class="settings-hub__grid">
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

    <section id="payment-details" class="panel payment-details-card">
      <div class="payment-details-card__header">
        <div>
          <div class="badge badge--soft">Оплата</div>
          <h2 class="payment-details-card__title">Реквізити для оплати</h2>
        </div>
      </div>

      <div v-if="loading" class="muted">Завантаження...</div>

      <template v-else>
        <div v-if="!isEditing && !hasConfiguredDetails" class="payment-details-card__empty">
          <p class="muted">Реквізити ще не додані. Додайте їх, щоб запитувати підтвердження оплати у сесіях.</p>
          <button class="btn btn--sm" type="button" @click="startEdit">Додати реквізити</button>
        </div>

        <div v-else-if="!isEditing" class="payment-details-view">
          <div class="payment-details-row">
            <span class="muted">Спосіб оплати</span>
            <strong>{{ methodTypeLabel }}</strong>
          </div>
          <div class="payment-details-row">
            <span class="muted">Отримувач</span>
            <strong>{{ details.recipient_name }}</strong>
          </div>
          <div class="payment-details-row">
            <span class="muted">{{ mainPaymentFieldLabel }}</span>
            <strong>{{ mainPaymentFieldValue }}</strong>
          </div>
          <div v-if="details.bank_name" class="payment-details-row">
            <span class="muted">Банк</span>
            <span>{{ details.bank_name }}</span>
          </div>
          <div v-if="details.payment_purpose" class="payment-details-row">
            <span class="muted">Призначення платежу</span>
            <span>{{ details.payment_purpose }}</span>
          </div>
          <div v-if="details.comment" class="payment-details-row">
            <span class="muted">Коментар</span>
            <span>{{ details.comment }}</span>
          </div>
          <div class="payment-details-actions">
            <button class="btn btn--ghost btn--sm" type="button" @click="startEdit">Редагувати</button>
          </div>
        </div>

        <form v-else class="payment-details-form" @submit.prevent="saveDetails">
          <label class="field">
            <span class="muted">Спосіб оплати</span>
            <select v-model="form.method_type" class="input input--select">
              <option value="bank_account">Банківський рахунок (IBAN)</option>
              <option value="card">Картка</option>
            </select>
          </label>

          <label class="field">
            <span class="muted">Отримувач</span>
            <input v-model.trim="form.recipient_name" class="input" placeholder="ПІБ або назва ФОП/компанії" />
          </label>

          <label v-if="isBankAccountForm" class="field">
            <span class="muted">IBAN</span>
            <input v-model.trim="form.iban" class="input" placeholder="UA..." />
          </label>
          <label v-else class="field">
            <span class="muted">Номер картки</span>
            <input v-model.trim="form.card_number" class="input" placeholder="0000 0000 0000 0000" />
          </label>

          <label class="field">
            <span class="muted">Назва банку (необов'язково)</span>
            <input v-model.trim="form.bank_name" class="input" />
          </label>

          <label class="field">
            <span class="muted">Призначення платежу (необов'язково)</span>
            <textarea v-model.trim="form.payment_purpose" class="input textarea" rows="2" />
          </label>

          <label class="field">
            <span class="muted">Коментар (необов'язково)</span>
            <textarea v-model.trim="form.comment" class="input textarea" rows="2" />
          </label>

          <p v-if="formError" class="form-error">{{ formError }}</p>
          <p v-if="saveError" class="form-error">{{ saveError }}</p>

          <div class="payment-details-actions">
            <button class="btn btn--sm" type="submit" :disabled="saving">
              {{ saving ? 'Зберігаємо...' : 'Зберегти' }}
            </button>
            <button class="btn btn--ghost btn--sm" type="button" :disabled="saving" @click="cancelEdit">
              Скасувати
            </button>
          </div>
        </form>
      </template>
    </section>
  </section>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useToast } from '../composables/useToast'
import {
  fetchCabinetPaymentDetails,
  getApiErrorMessage,
  updateCabinetPaymentDetails,
  type SpecialistPaymentDetails,
} from '../lib/api'
import SettingsSubnav from '../components/SettingsSubnav.vue'

const toast = useToast()

const loading = ref(true)
const saving = ref(false)
const isEditing = ref(false)
const saveError = ref('')
const formError = ref('')

const emptyDetails: SpecialistPaymentDetails = {
  method_type: null,
  recipient_name: '',
  iban: '',
  card_number: '',
  bank_name: '',
  payment_purpose: '',
  comment: '',
}

const details = ref<SpecialistPaymentDetails>({ ...emptyDetails })
const form = ref<SpecialistPaymentDetails>({
  ...emptyDetails,
  method_type: 'bank_account',
})

const hasConfiguredDetails = computed(() => {
  const method = normalizeMethod(details.value.method_type)
  if (!method) return false
  const hasRecipient = Boolean(details.value.recipient_name.trim())
  const hasMainValue = method === 'bank_account' ? Boolean(details.value.iban.trim()) : Boolean(details.value.card_number.trim())
  return hasRecipient && hasMainValue
})

const isBankAccountForm = computed(() => normalizeMethod(form.value.method_type) !== 'card')
const methodTypeLabel = computed(() => (normalizeMethod(details.value.method_type) === 'card' ? 'Картка' : 'Банківський рахунок (IBAN)'))
const mainPaymentFieldLabel = computed(() => (normalizeMethod(details.value.method_type) === 'card' ? 'Номер картки' : 'IBAN'))
const mainPaymentFieldValue = computed(() =>
  normalizeMethod(details.value.method_type) === 'card' ? details.value.card_number : details.value.iban
)

function normalizeMethod(value: string | null | undefined): 'bank_account' | 'card' | null {
  return value === 'card' || value === 'bank_account' ? value : null
}

function normalizeDetails(payload: Partial<SpecialistPaymentDetails> | null | undefined): SpecialistPaymentDetails {
  const method = normalizeMethod(payload?.method_type)
  return {
    method_type: method,
    recipient_name: String(payload?.recipient_name || '').trim(),
    iban: String(payload?.iban || '').trim(),
    card_number: String(payload?.card_number || '').trim(),
    bank_name: String(payload?.bank_name || '').trim(),
    payment_purpose: String(payload?.payment_purpose || '').trim(),
    comment: String(payload?.comment || '').trim(),
  }
}

function startEdit() {
  form.value = {
    ...details.value,
    method_type: normalizeMethod(details.value.method_type) || 'bank_account',
  }
  formError.value = ''
  saveError.value = ''
  isEditing.value = true
}

function cancelEdit() {
  formError.value = ''
  saveError.value = ''
  isEditing.value = false
}

function validateForm() {
  const method = normalizeMethod(form.value.method_type)
  if (!method) return 'Оберіть спосіб оплати.'
  if (!form.value.recipient_name.trim()) return 'Вкажіть отримувача.'
  if (method === 'bank_account' && !form.value.iban.trim()) return 'Вкажіть IBAN.'
  if (method === 'card' && !form.value.card_number.trim()) return 'Вкажіть номер картки.'
  return ''
}

async function loadPaymentDetails() {
  loading.value = true
  saveError.value = ''
  formError.value = ''
  try {
    details.value = normalizeDetails(await fetchCabinetPaymentDetails())
  } catch (err) {
    toast.error(getApiErrorMessage(err, 'Не вдалося завантажити реквізити для оплати.'))
    details.value = { ...emptyDetails }
  } finally {
    loading.value = false
  }
}

async function saveDetails() {
  formError.value = validateForm()
  saveError.value = ''
  if (formError.value) return

  const method = normalizeMethod(form.value.method_type) || 'bank_account'
  const payload: Partial<SpecialistPaymentDetails> = {
    method_type: method,
    recipient_name: form.value.recipient_name.trim(),
    iban: method === 'bank_account' ? form.value.iban.trim() : '',
    card_number: method === 'card' ? form.value.card_number.trim() : '',
    bank_name: form.value.bank_name.trim(),
    payment_purpose: form.value.payment_purpose.trim(),
    comment: form.value.comment.trim(),
  }

  saving.value = true
  try {
    details.value = normalizeDetails(await updateCabinetPaymentDetails(payload))
    isEditing.value = false
    toast.success('Реквізити для оплати збережено.')
  } catch (err) {
    saveError.value = getApiErrorMessage(err, 'Не вдалося зберегти реквізити для оплати.')
  } finally {
    saving.value = false
  }
}

onMounted(loadPaymentDetails)
</script>

<style scoped>
.settings-hub {
  display: grid;
  gap: 16px;
}

.panel {
  border: 1px solid var(--line);
  border-radius: 16px;
  padding: 16px;
  background: #fff;
}

.settings-hub__hero {
  display: grid;
  gap: 10px;
}

.badge--soft {
  width: fit-content;
  background: rgba(8, 113, 201, 0.12);
}

.settings-hub__grid {
  display: grid;
  gap: 12px;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
}

.settings-card {
  text-decoration: none;
  color: inherit;
  display: grid;
  gap: 6px;
  transition: border-color 0.2s ease, box-shadow 0.2s ease;
}

.settings-card:hover {
  border-color: color-mix(in srgb, var(--primary) 35%, var(--line));
  box-shadow: 0 10px 22px rgba(31, 74, 96, 0.12);
}

.settings-card__title {
  margin: 0;
  font-family: var(--font-display);
  font-size: 22px;
}

.payment-details-card {
  display: grid;
  gap: 12px;
}

.payment-details-card__header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 10px;
}

.payment-details-card__title {
  margin: 0;
  font-family: var(--font-display);
  font-size: 22px;
}

.payment-details-card__empty {
  display: grid;
  gap: 10px;
}

.payment-details-view {
  display: grid;
  gap: 8px;
}

.payment-details-row {
  display: grid;
  gap: 2px;
}

.payment-details-form {
  display: grid;
  gap: 10px;
}

.payment-details-actions {
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
</style>
