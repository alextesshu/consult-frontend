<template>
  <section class="account-email-confirm">
    <div class="panel account-email-confirm__panel">
      <h1 class="title">Підтвердження email</h1>

      <p v-if="loading" class="muted">Підтверджуємо нову адресу...</p>

      <template v-else-if="success">
        <p class="account-email-confirm__success">Email акаунта успішно змінено.</p>
        <RouterLink v-if="isAuthenticated" class="btn" to="/cabinet/settings">Повернутися до налаштувань</RouterLink>
        <RouterLink v-else class="btn" to="/login">Увійти</RouterLink>
      </template>

      <template v-else>
        <p class="form-error">
          Не вдалося підтвердити email. Посилання може бути недійсним, простроченим або вже використаним.
        </p>
        <RouterLink class="btn btn--ghost" to="/login">Увійти</RouterLink>
      </template>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRoute } from 'vue-router'
import { confirmAccountEmailChange } from '../lib/api'
import { useAuthStore } from '../stores/auth'

const route = useRoute()
const auth = useAuthStore()
const loading = ref(true)
const success = ref(false)
const token = computed(() => String(route.params.token || '').trim())
const isAuthenticated = computed(() => Boolean(auth.accessToken))

onMounted(async () => {
  if (!token.value) {
    loading.value = false
    return
  }

  try {
    await confirmAccountEmailChange(token.value)
    success.value = true
    if (auth.accessToken) {
      try {
        await auth.loadMe()
      } catch {
        // Confirmation succeeded; a later authenticated request will reconcile /me.
      }
    }
  } catch {
    success.value = false
  } finally {
    loading.value = false
  }
})
</script>

<style scoped>
.account-email-confirm {
  display: grid;
  place-items: center;
  min-height: min(560px, calc(100vh - 120px));
  padding: 32px 0;
}

.account-email-confirm__panel {
  width: min(560px, 100%);
  display: grid;
  gap: 16px;
}

.account-email-confirm__panel .title,
.account-email-confirm__success {
  margin: 0;
}

.account-email-confirm__success {
  color: var(--pc-success-text);
}
</style>
