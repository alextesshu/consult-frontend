<template>
  <CalendarV2 v-if="uiV2" />
  <TherapistSessionsView v-else />
</template>

<script setup lang="ts">
import { computed } from 'vue'
import CalendarV2 from '../components/calendar-v2/CalendarV2.vue'
import { isUiV2 } from '../lib/uiVersion'
import TherapistSessionsView from './TherapistSessionsView.vue'

// /cabinet/sessions: UI v2 shows the read-only unified calendar (UC-01); UI v1 keeps the
// existing sessions page unchanged. Session detail stays at /cabinet/sessions/:id.
const uiV2 = computed(isUiV2)
</script>
