<template>
  <section class="auth-reset">
    <div class="auth-reset__card">
      <div class="badge">Відновлення доступу</div>
      <h1 class="title">Новий пароль</h1>

      <template v-if="completed">
        <p class="auth-reset__success">Пароль змінено</p>
        <RouterLink class="btn" to="/login">Увійти з новим паролем</RouterLink>
      </template>

      <template v-else-if="invalidLink">
        <p class="form-error">Посилання для відновлення пароля недійсне або термін його дії минув.</p>
        <RouterLink class="btn" to="/forgot-password">Запросити нове посилання</RouterLink>
      </template>

      <form v-else class="form" @submit.prevent="onSubmit">
        <label class="field">
          <span>Новий пароль</span>
          <input
            v-model="newPassword"
            class="input"
            :type="showPassword ? 'text' : 'password'"
            autocomplete="new-password"
            name="new-password"
          />
        </label>
        <label class="field">
          <span>Повторіть новий пароль</span>
          <input
            v-model="newPasswordConfirm"
            class="input"
            :type="showPassword ? 'text' : 'password'"
            autocomplete="new-password"
            name="new-password-confirm"
          />
        </label>
        <button
          class="auth-reset__toggle"
          type="button"
          :aria-label="showPassword ? 'Сховати пароль' : 'Показати пароль'"
          @click="showPassword = !showPassword"
        >
          {{ showPassword ? 'Сховати пароль' : 'Показати пароль' }}
        </button>
        <p v-if="error" class="form-error">{{ error }}</p>
        <button class="btn" type="submit" :disabled="submitting">
          {{ submitting ? 'Зберігаємо...' : 'Змінити пароль' }}
        </button>
      </form>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRoute } from 'vue-router'
import { confirmPasswordReset, getApiErrorMessage } from '../lib/api'

const route = useRoute()
const newPassword = ref('')
const newPasswordConfirm = ref('')
const showPassword = ref(false)
const error = ref('')
const completed = ref(false)
const submitting = ref(false)
const uid = computed(() => String(route.params.uid || '').trim())
const token = computed(() => String(route.params.token || '').trim())
const invalidLink = ref(!uid.value || !token.value)

async function onSubmit() {
  error.value = ''
  if (!newPassword.value || !newPasswordConfirm.value) {
    error.value = 'Введіть і повторіть новий пароль.'
    return
  }
  if (newPassword.value !== newPasswordConfirm.value) {
    error.value = 'Паролі не співпадають.'
    return
  }
  submitting.value = true
  try {
    await confirmPasswordReset(uid.value, token.value, newPassword.value, newPasswordConfirm.value)
    completed.value = true
  } catch (err) {
    const code = (err as { response?: { data?: { code?: unknown } } })?.response?.data?.code
    if (code === 'invalid_password_reset_link') {
      invalidLink.value = true
      return
    }
    error.value = getApiErrorMessage(err, 'Не вдалося змінити пароль. Спробуйте ще раз.')
  } finally {
    submitting.value = false
  }
}
</script>

<style scoped>
.auth-reset {
  display: grid;
  place-items: start center;
  padding: 32px 0;
}

.auth-reset__card {
  width: min(100%, 520px);
  display: grid;
  gap: 18px;
  padding: 28px;
  border: 1px solid var(--line);
  border-radius: var(--radius);
  background: var(--card);
  box-shadow: var(--shadow);
}

.auth-reset__card .title,
.auth-reset__card p {
  margin: 0;
}

.auth-reset__success {
  padding: 12px;
  border: 1px solid color-mix(in srgb, var(--primary) 24%, var(--line));
  border-radius: 10px;
  background: color-mix(in srgb, var(--primary) 7%, #ffffff);
  line-height: 1.5;
}

.auth-reset__toggle {
  width: fit-content;
  padding: 0;
  border: 0;
  background: transparent;
  color: var(--primary);
  font: inherit;
  font-weight: 600;
  cursor: pointer;
}

.form-error {
  color: #b3261e;
  background: #fdecea;
  border: 1px solid #f5c2c0;
  border-radius: 10px;
  padding: 8px 10px;
}
</style>
