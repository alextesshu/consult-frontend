<template>
  <div class="pc2-exception-fields">
    <label>Дата початку<input v-model="model.start_date" type="date" required /></label>
    <label>Дата завершення<input v-model="model.end_date" type="date" required /></label>
    <label>Час початку<input v-model="model.start_time" type="time" required /></label>
    <label>Час завершення<input v-model="model.end_time" type="time" required /></label>
    <label class="pc2-check"><input v-model="model.is_all_day" type="checkbox" /> Весь день</label>
    <label class="pc2-check"><input v-model="model.is_active" type="checkbox" /> Активна пауза</label>
    <label class="pc2-exception-fields__note">Примітка — бачите лише ви<input v-model="model.note" type="text" /></label>
  </div>
</template>
<script setup lang="ts">
const model = defineModel<{ start_date: string; end_date: string; start_time: string; end_time: string; is_all_day: boolean; is_active: boolean; note: string }>({ required: true })
</script>
<style scoped>
.pc2-exception-fields { display:grid; grid-template-columns:repeat(2,minmax(0,1fr)); gap:12px; }
label { display:grid; gap:6px; min-width:0; font-size:13px; color:var(--pc-text-muted); }
input { width:100%; min-width:0; min-height:44px; border:1px solid var(--pc-border); border-radius:12px; padding:8px; background:var(--pc-bg-soft); color:var(--pc-text-main); font:inherit; }
.pc2-check { display:flex; align-items:center; min-height:44px; } .pc2-check input { width:24px; min-height:24px; }
.pc2-exception-fields__note { grid-column:1/-1; } :focus-visible { outline:3px solid var(--pc-navy-900); outline-offset:2px; }
</style>
