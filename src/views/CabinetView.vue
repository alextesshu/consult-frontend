<template>
  <section class="card">
    <h1 class="title" style="font-size: 28px;">Therapist cabinet</h1>
    <p class="muted">Private workspace. Public pages will be added later.</p>
    <div v-if="me" class="dash">
      <div class="panel">
        <div class="badge">Account</div>
        <h2 class="panel__title">{{ me.user.username }}</h2>
        <div class="muted">{{ me.user.email || 'no email' }}</div>
        <div class="muted">Roles: {{ me.user.roles.join(', ') }}</div>
      </div>
      <div class="panel">
        <div class="badge">Access</div>
        <h2 class="panel__title">{{ me.access_state || 'UNKNOWN' }}</h2>
        <div class="muted">Plan: {{ me.effective_entitlements?.plan || 'N/A' }}</div>
      </div>
      <div class="panel">
        <div class="badge">Clients</div>
        <h2 class="panel__title">{{ me.counts?.active_clients ?? 0 }}</h2>
        <div class="muted">
          Limit: {{ me.effective_entitlements?.active_client_limit ?? 'N/A' }}
        </div>
        <div class="muted">
          Prospects: {{ me.counts?.prospect_clients ?? 0 }}
        </div>
      </div>
      <div class="panel">
        <div class="badge">Sessions</div>
        <h2 class="panel__title">{{ me.counts?.upcoming_sessions_count ?? 0 }}</h2>
        <div class="muted">Upcoming this week</div>
      </div>
    </div>
    <div v-else class="muted" style="margin-top: 12px;">
      Loading profile...
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
const { me } = storeToRefs(auth)
const router = useRouter()

function onLogout() {
  auth.logout()
  router.push('/login')
}
</script>
<style scoped>
.dash {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 16px;
  margin-top: 16px;
}
.panel {
  border: 1px solid var(--line);
  border-radius: 16px;
  padding: 16px;
  background: #fff;
}
.panel__title {
  margin: 10px 0 4px;
  font-family: var(--font-serif);
  font-size: 22px;
}
</style>
