<template>
  <section class="card">
    <h1 class="title" style="font-size: 28px;">Sign in</h1>
    <p class="muted">Email or login + password.</p>
    <form class="form" @submit.prevent="onSubmit">
      <label class="field">
        <span>Email or login</span>
        <input v-model="identifier" class="input" type="text" placeholder="you@example.com or username" />
      </label>
      <label class="field">
        <span>Password</span>
        <input v-model="password" class="input" type="password" placeholder="••••••••" />
      </label>
      <p v-if="error" class="muted">{{ error }}</p>
      <button class="btn" type="submit" :disabled="loading">
        {{ loading ? 'Signing in...' : 'Continue' }}
      </button>
    </form>
  </section>
</template>

<script setup lang="ts">
import { ref } from 'vue'
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
    error.value = 'Please enter credentials.'
    return
  }
  try {
    await auth.login(identifier.value.trim(), password.value)
    router.push('/cabinet')
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Login failed'
  }
}
</script>
<style scoped></style>
