<template>
  <section class="card">
    <h1 class="title" style="font-size: 28px;">Вхід</h1>
    <form class="form" @submit.prevent="onSubmit">
      <label class="field">
        <span>Ел. пошта або логін</span>
        <input
          v-model="identifier"
          class="input"
          type="text"
          name="identifier"
          autocomplete="username"
          placeholder="name@example.com або логін"
        />
      </label>
      <label class="field">
        <span>Пароль</span>
        <input
          v-model="password"
          class="input"
          type="password"
          name="password"
          autocomplete="current-password"
          placeholder="********"
        />
      </label>
      <p v-if="error" class="muted">{{ error }}</p>
      <button class="btn" type="submit" :disabled="loading">
        {{ loading ? 'Вхід...' : 'Продовжити' }}
      </button>
      <p class="muted">
        Вперше тут?
        <RouterLink to="/signup">Створити акаунт терапевта</RouterLink>
      </p>
    </form>
  </section>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { storeToRefs } from 'pinia'
import { useAuthStore } from '../stores/auth'

const identifier = ref('')
const password = ref('')
const error = ref('')
const router = useRouter()
const auth = useAuthStore()
const { loading } = storeToRefs(auth)

async function onSubmit() {
  error.value = ''
  if (!identifier.value || !password.value) {
    error.value = 'Введіть облікові дані.'
    return
  }
  try {
    await auth.login(identifier.value.trim(), password.value)
    router.push('/cabinet')
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Не вдалося увійти'
  }
}

onMounted(() => {
  if (auth.accessToken) {
    router.replace('/cabinet')
  }
})
</script>
<style scoped></style>
