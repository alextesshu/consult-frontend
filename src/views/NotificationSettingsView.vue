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
  border: 1px solid var(--pc-border);
  border-radius: var(--pc-radius-panel);
  padding: 16px;
  background: #fff;
  box-shadow: var(--pc-shadow-soft);
  display: grid;
  gap: 10px;
}

.panel:first-of-type {
  position: relative;
  overflow: hidden;
  background:
    radial-gradient(circle at 92% 70%, color-mix(in srgb, var(--pc-peach-100) 70%, transparent) 0 120px, transparent 121px),
    linear-gradient(135deg, #ffffff 0%, color-mix(in srgb, var(--pc-primary-soft) 70%, #ffffff) 54%, color-mix(in srgb, var(--pc-yellow-soft) 45%, #ffffff) 100%);
}

.panel:first-of-type > * {
  position: relative;
  z-index: 1;
}

.panel:first-of-type::after {
  content: "";
  position: absolute;
  right: -44px;
  bottom: -58px;
  width: 180px;
  height: 180px;
  border-radius: 999px;
  background: rgba(247, 183, 126, 0.18);
  pointer-events: none;
}

.panel:first-of-type .title {
  margin: 8px 0 8px;
  color: var(--pc-navy-950);
  font-size: 32px;
  line-height: 1.15;
}

.panel:first-of-type .muted {
  max-width: 520px;
  color: var(--pc-text-muted);
  line-height: 1.55;
}

.badge--soft {
  width: fit-content;
  border: 1px solid color-mix(in srgb, var(--pc-navy-900) 24%, var(--pc-border));
  background: color-mix(in srgb, var(--pc-primary-soft) 78%, #ffffff);
  color: var(--pc-navy-900);
}

.settings :deep(.settings-subnav__link) {
  border: 1px solid var(--pc-border);
  border-radius: var(--pc-radius-control);
  background: #ffffff;
  color: var(--pc-text-muted);
  font-weight: 700;
}

.settings :deep(.settings-subnav__link:hover),
.settings :deep(.settings-subnav__link:focus-visible) {
  border-color: color-mix(in srgb, var(--pc-navy-900) 24%, var(--pc-border));
  background: color-mix(in srgb, var(--pc-primary-soft) 64%, #ffffff);
  color: var(--pc-navy-900);
}

.settings :deep(.settings-subnav__link.is-active) {
  border-color: color-mix(in srgb, var(--pc-navy-900) 36%, var(--pc-border));
  background: color-mix(in srgb, var(--pc-primary-soft) 80%, #ffffff);
  color: var(--pc-navy-900);
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
  border-radius: var(--pc-radius-card);
  border: 1px solid var(--pc-border);
  background: color-mix(in srgb, var(--pc-surface) 94%, #ffffff);
  transition: background-color 0.18s ease, border-color 0.18s ease;
}

.pref-item:hover,
.pref-item:focus-within {
  border-color: color-mix(in srgb, var(--pc-navy-900) 24%, var(--pc-border));
  background: color-mix(in srgb, var(--pc-primary-soft) 46%, #ffffff);
}

.pref-item input[type="checkbox"] {
  accent-color: var(--pc-navy-900);
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

.actions .btn {
  border-color: var(--pc-navy-900);
  border-radius: var(--pc-radius-control);
  background: linear-gradient(180deg, var(--pc-navy-900), var(--pc-navy-950));
  color: #ffffff;
}
</style>
