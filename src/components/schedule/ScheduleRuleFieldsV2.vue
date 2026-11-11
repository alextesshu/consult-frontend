<template>
  <div class="pc2-rule-fields">
    <label>День тижня<select v-model.number="model.weekday"><option v-for="(day, index) in days" :key="day" :value="index">{{ day }}</option></select></label>
    <label>Початок<input v-model="model.start_time" type="time" required /></label>
    <label>Кінець<input v-model="model.end_time" type="time" required /></label>
    <label>Тривалість сесії, хв<input v-model.number="model.session_duration_minutes" type="number" min="5" required /></label>
    <label>Пауза між сесіями, хв<input v-model.number="model.buffer_minutes" type="number" min="0" required /></label>
    <label class="pc2-check"><input v-model="model.is_active" type="checkbox" /> Активний проміжок</label>
  </div>
</template>
<script setup lang="ts">
const model = defineModel<{ weekday: number; start_time: string; end_time: string; session_duration_minutes: number; buffer_minutes: number; is_active: boolean }>({ required: true })
const days = ['Понеділок', 'Вівторок', 'Середа', 'Четвер', 'П’ятниця', 'Субота', 'Неділя']
</script>
<style scoped>
.pc2-rule-fields { display:grid; grid-template-columns:repeat(auto-fit,minmax(min(100%,155px),1fr)); gap:12px; }
label { display:grid; gap:6px; font-size:13px; color:var(--pc-text-muted); min-width:0; }
input, select { width:100%; min-width:0; min-height:44px; border:1px solid var(--pc-border); border-radius:12px; padding:8px; background:var(--pc-bg-soft); color:var(--pc-text-main); font:inherit; }
.pc2-check { display:flex; align-items:center; min-height:44px; } .pc2-check input { width:24px; min-height:24px; }
:focus-visible { outline:3px solid var(--pc-navy-900); outline-offset:2px; }
</style>
