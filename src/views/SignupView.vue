<template>
  <section class="card">
    <h1 class="title" style="font-size: 28px;">Реєстрація терапевта</h1>
    <p class="muted">Створіть свій кабінет терапевта. Безкоштовний план за замовчуванням.</p>
    <form class="form" @submit.prevent="onSubmit">
      <label class="field">
        <span>Логін</span>
        <input
          v-model="username"
          class="input"
          type="text"
          name="username"
          autocomplete="username"
          placeholder="ваш-логін"
        />
      </label>
      <label class="field">
        <span>Ел. пошта</span>
        <input
          v-model="email"
          class="input"
          type="email"
          name="email"
          autocomplete="email"
          placeholder="name@example.com"
        />
      </label>
      <label class="field">
        <span>Пароль</span>
        <input
          v-model="password"
          class="input"
          type="password"
          name="password"
          autocomplete="new-password"
          placeholder="********"
        />
      </label>
      <label class="field">
        <span>Підтвердження пароля</span>
        <input
          v-model="passwordConfirm"
          class="input"
          type="password"
          name="password_confirm"
          autocomplete="new-password"
          placeholder="********"
        />
      </label>
      <p v-if="error" class="muted">{{ error }}</p>
      <button class="btn" type="submit" :disabled="loading">
        {{ loading ? 'Створення акаунта...' : 'Створити акаунт' }}
      </button>
      <p class="muted">
        Вже маєте акаунт?
        <RouterLink to="/login">Увійти</RouterLink>
      </p>
    </form>
  </section>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { storeToRefs } from 'pinia'
import { useAuthStore } from '../stores/auth'

const username = ref('')
const email = ref('')
const password = ref('')
const passwordConfirm = ref('')
const error = ref('')
const router = useRouter()
const auth = useAuthStore()
const { loading } = storeToRefs(auth)

async function onSubmit() {
  error.value = ''
  if (!username.value || !email.value || !password.value || !passwordConfirm.value) {
    error.value = 'Заповніть усі поля.'
    return
  }
  if (password.value !== passwordConfirm.value) {
    error.value = 'Паролі не збігаються.'
    return
  }
  try {
    await auth.signup(
      username.value.trim(),
      email.value.trim(),
      password.value,
      passwordConfirm.value
    )
    router.push('/cabinet')
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Не вдалося зареєструватися'
  }
}
</script>
<style scoped></style>
