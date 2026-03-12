<template>
  <section class="settings">
    <header class="panel">
      <div class="badge badge--soft">Налаштування</div>
      <h1 class="title">Сповіщення</h1>
      <p class="muted">Оберіть, які події показувати вам у застосунку.</p>
      <SettingsSubnav active="notifications" />
    </header>

    <section class="panel">
      <div v-if="loading" class="muted">Завантаження...</div>
      <div v-else class="prefs">
        <label class="pref-item">
          <input v-model="form.notify_session_booked_in_app" type="checkbox" />
          <span>
            <strong>Нові бронювання</strong>
            <small>Показувати в застосунку нові запити на сесії</small>
          </span>
        </label>

        <label class="pref-item">
          <input v-model="form.notify_session_confirmed_in_app" type="checkbox" />
          <span>
            <strong>Підтвердження сесій</strong>
            <small>Показувати в застосунку події підтвердження</small>
          </span>
        </label>

        <label class="pref-item">
          <input v-model="form.notify_session_starts_24h_in_app" type="checkbox" />
          <span>
            <strong>Нагадування за 24 години</strong>
          </span>
        </label>

        <label class="pref-item">
          <input v-model="form.notify_session_starts_1h_in_app" type="checkbox" />
          <span>
            <strong>Нагадування за 1 годину</strong>
          </span>
        </label>
      </div>

      <div class="actions">
        <button class="btn" type="button" :disabled="saving || loading" @click="save">
          {{ saving ? 'Зберігаємо...' : 'Зберегти' }}
        </button>
      </div>
    </section>
  </section>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { fetchNotificationSettings, updateNotificationSettings, type NotificationSettings } from '../lib/api'
import { getApiErrorMessage } from '../lib/errors'
import { useToast } from '../composables/useToast'
import SettingsSubnav from '../components/SettingsSubnav.vue'

const toast = useToast()
const loading = ref(true)
const saving = ref(false)
const form = ref<NotificationSettings>({
  notify_session_booked_in_app: true,
  notify_session_confirmed_in_app: true,
  notify_session_starts_24h_in_app: true,
  notify_session_starts_1h_in_app: true,
})

async function load() {
  loading.value = true
  try {
    form.value = await fetchNotificationSettings()
  } catch (err) {
    toast.error(getApiErrorMessage(err, 'Не вдалося завантажити налаштування сповіщень.'))
  } finally {
    loading.value = false
  }
}

async function save() {
  saving.value = true
  try {
    form.value = await updateNotificationSettings(form.value)
    toast.success('Налаштування сповіщень збережено.')
  } catch (err) {
    toast.error(getApiErrorMessage(err, 'Не вдалося зберегти налаштування сповіщень.'))
  } finally {
    saving.value = false
  }
}

onMounted(load)
</script>

<style scoped>
.settings {
  display: grid;
  gap: 16px;
}

.panel {
  border: 1px solid var(--line);
  border-radius: 16px;
  padding: 16px;
  background: #fff;
  display: grid;
  gap: 10px;
}

.badge--soft {
  width: fit-content;
  background: rgba(8, 113, 201, 0.12);
}

.prefs {
  display: grid;
  gap: 10px;
}

.pref-item {
  display: grid;
  grid-template-columns: 24px 1fr;
  gap: 10px;
  align-items: start;
  padding: 10px 12px;
  border-radius: 10px;
  border: 1px solid var(--line);
  background: rgba(7, 47, 71, 0.03);
}

.pref-item strong {
  display: block;
}

.pref-item small {
  color: var(--muted);
}

.actions {
  margin-top: 8px;
  display: flex;
  gap: 8px;
}
</style>
