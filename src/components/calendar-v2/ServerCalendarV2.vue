<template>
  <div class="pc2-cal-server">
    <div v-if="!source" class="pc2-cal__state" :role="status === 'error' || error ? 'alert' : 'status'">
      <p>{{ error || 'Завантажуємо налаштування календаря…' }}</p>
      <button v-if="status === 'error' || error" type="button" class="pc2-cal__btn" :disabled="refreshing" @click="reload">Спробувати ще раз</button>
    </div>
    <template v-else>
      <div v-if="error" class="pc2-cal__warning" role="alert">
        <p>{{ error }}</p>
        <button type="button" class="pc2-cal__btn pc2-cal__btn--quiet" :disabled="refreshing" @click="reload">Оновити налаштування</button>
      </div>
      <p v-if="!regularViewSupported" class="pc2-cal__note">Сервер ще не підтримує збереження звичайного вигляду. Показано сумісний вигляд лише для читання.</p>
      <p v-if="saving || refreshing" role="status" class="pc2-cal__note">{{ saving ? 'Зберігаємо налаштування…' : 'Оновлюємо налаштування…' }}</p>
      <CalendarV2 :key="auth.authEpoch" :preferences="source" />
    </template>
  </div>
</template>

<script setup lang="ts">
import { useServerCalendarPreferencesSource } from '../../composables/useServerCalendarPreferencesSource'
import { useAuthStore } from '../../stores/auth'
import CalendarV2 from './CalendarV2.vue'
import '../../styles/calendarV2.css'

const auth = useAuthStore()
const { source, status, saving, error, reload, refreshing, regularViewSupported } = useServerCalendarPreferencesSource()
</script>
