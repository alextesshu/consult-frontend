<template>
  <template v-if="uiV2">
    <nav class="calendar-management" aria-label="Керування календарем">
      <RouterLink to="/cabinet/slots?action=create-session">+ Нова сесія</RouterLink>
      <RouterLink to="/cabinet/slots?tab=availability">Керування розкладом</RouterLink>
      <RouterLink to="/cabinet/schedule">Керування сесіями</RouterLink>
      <RouterLink to="/cabinet/slots?tab=settings">Запис і запити</RouterLink>
    </nav>
    <ServerCalendarV2 />
  </template>
  <TherapistSessionsView v-else />
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { RouterLink } from 'vue-router'
import ServerCalendarV2 from '../components/calendar-v2/ServerCalendarV2.vue'
import { isUiV2 } from '../lib/uiVersion'
import TherapistSessionsView from './TherapistSessionsView.vue'

// /cabinet/sessions: UI v2 shows the read-only unified calendar (UC-01); UI v1 keeps the
// existing sessions page unchanged. Session detail stays at /cabinet/sessions/:id.
const uiV2 = computed(isUiV2)
</script>

<style scoped>
.calendar-management {
  display: flex;
  flex-wrap: wrap;
  gap: 4px 16px;
  margin-bottom: 12px;
}
.calendar-management a {
  display: inline-flex;
  align-items: center;
  min-height: 44px;
  max-width: 100%;
  color: var(--ink);
  overflow-wrap: anywhere;
  text-underline-offset: 3px;
}
.calendar-management a:focus-visible {
  outline: 2px solid currentColor;
  outline-offset: 3px;
  border-radius: 4px;
}
</style>
