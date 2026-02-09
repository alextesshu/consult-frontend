<template>
  <section class="card">
    <h1 class="title" style="font-size: 28px;">Therapist cabinet</h1>
    <p class="muted">Private workspace. Public pages will be added later.</p>
    <div v-if="user" style="margin-top: 12px;">
      <strong>{{ user.username }}</strong>
      <div class="muted">{{ user.email || 'no email' }}</div>
      <div class="muted">Roles: {{ user.roles.join(', ') }}</div>
    </div>
    <div v-else class="muted" style="margin-top: 12px;">
      Not signed in.
    </div>
    <div style="margin-top: 16px;">
      <button class="btn btn--ghost" type="button" @click="onLogout">Logout</button>
    </div>
  </section>
</template>

<script setup lang="ts">
import { storeToRefs } from 'pinia'
import { useAuthStore } from '../stores/auth'
import { useRouter } from 'vue-router'

const auth = useAuthStore()
const { user } = storeToRefs(auth)
const router = useRouter()

function onLogout() {
  auth.logout()
  router.push('/login')
}
</script>
<style scoped></style>
