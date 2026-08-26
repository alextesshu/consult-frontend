<template>
  <section class="auth-reset">
    <div class="auth-reset__card">
      <div class="badge">Відновлення доступу</div>
      <h1 class="title">Відновлення пароля</h1>
      <p class="muted">Вкажіть email, який використовуєте для акаунта Pro Consult.</p>

      <template v-if="sent">
        <p class="auth-reset__success">
          Якщо акаунт із такою електронною поштою існує, ми надіслали посилання для відновлення пароля.
        </p>
        <RouterLink class="btn" to="/login">Повернутися до входу</RouterLink>
      </template>

      <form v-else class="form" @submit.prevent="onSubmit">
        <label class="field">
          <span>Ел. пошта</span>
          <input v-model="email" class="input" type="email" autocomplete="email" name="email" />
        </label>
        <p v-if="error" class="form-error">{{ error }}</p>
        <button class="btn" type="submit" :disabled="submitting">
          {{ submitting ? 'Надсилаємо...' : 'Надіслати посилання' }}
        </button>
        <RouterLink class="auth-reset__link" to="/login">Повернутися до входу</RouterLink>
      </form>
    </div>
  </section>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { getApiErrorMessage, requestPasswordReset } from '../lib/api'

const email = ref('')
const error = ref('')
const sent = ref(false)
const submitting = ref(false)

async function onSubmit() {
  error.value = ''
  if (!email.value.trim()) {
    error.value = 'Вкажіть електронну пошту.'
    return
  }
  submitting.value = true
  try {
    await requestPasswordReset(email.value.trim())
    sent.value = true
  } catch (err) {
    error.value = getApiErrorMessage(err, 'Не вдалося надіслати посилання. Спробуйте ще раз.')
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

.auth-reset__link {
  width: fit-content;
  color: var(--primary);
  font-weight: 600;
}

.form-error {
  color: #b3261e;
  background: #fdecea;
  border: 1px solid #f5c2c0;
  border-radius: 10px;
  padding: 8px 10px;
}
</style>
