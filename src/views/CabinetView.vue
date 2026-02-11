<template>
  <section class="card">
    <h1 class="title" style="font-size: 28px;">Кабінет терапевта</h1>
    <p class="muted">Приватний робочий простір. Публічні сторінки з’являться пізніше.</p>
    <div v-if="me" class="dash">
      <div class="panel">
        <div class="badge">Акаунт</div>
        <h2 class="panel__title">{{ me.user.username }}</h2>
        <div class="muted">{{ me.user.email || 'немає ел. пошти' }}</div>
        <div class="muted">Ролі: {{ me.user.roles.join(', ') }}</div>
      </div>
      <div class="panel">
        <div class="badge">Доступ</div>
        <h2 class="panel__title">{{ me.access_state || 'НЕВІДОМО' }}</h2>
        <div class="muted">План: {{ me.effective_entitlements?.plan || 'Н/Д' }}</div>
      </div>
      <div class="panel">
        <div class="badge">Клієнти</div>
        <h2 class="panel__title">{{ me.counts?.active_clients ?? 0 }}</h2>
        <div class="muted">
          Ліміт: {{ me.effective_entitlements?.active_client_limit ?? 'Н/Д' }}
        </div>
        <div class="muted">
          Потенційні: {{ me.counts?.prospect_clients ?? 0 }}
        </div>
      </div>
      <div class="panel">
        <div class="badge">Сесії</div>
        <h2 class="panel__title">{{ me.counts?.upcoming_sessions_count ?? 0 }}</h2>
        <div class="muted">Найближчих цього тижня</div>
      </div>
    </div>
    <div v-else class="muted" style="margin-top: 12px;">
      Завантаження профілю...
    </div>
    <div class="cabinet-actions">
      <RouterLink class="btn btn--ghost" to="/cabinet/profile">
        Редагувати профіль
      </RouterLink>
      <RouterLink class="btn btn--ghost" to="/cabinet/group-events">
        Групові події
      </RouterLink>
      <button class="btn btn--ghost" type="button" @click="onLogout">Вийти</button>
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
  font-family: var(--font-display);
  font-size: 22px;
}
.cabinet-actions {
  margin-top: 16px;
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
}
</style>
