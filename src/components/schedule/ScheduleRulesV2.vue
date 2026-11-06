<template>
  <section class="pc2-rules" aria-label="Робочі години">
    <p>Робочі години — лише шаблон. Вікна створюються окремо після перегляду й підтвердження генерації.</p>
    <p>Кожен проміжок зберігається окремо зі своєю тривалістю та паузою. Помилка одного збереження не скасовує інші.</p>
    <div v-if="error" role="alert">{{ error }} <button type="button" :disabled="busy" @click="$emit('reload')">Оновити</button></div>
    <p v-if="busy" role="status">Завантажуємо або зберігаємо…</p>
    <template v-if="rules.length || (!busy && !error)">
    <div v-for="(day, index) in days" :key="day" class="pc2-rules__day">
      <h2>{{ day }}</h2>
      <div class="pc2-rules__intervals">
        <p v-if="!rules.some(r => r.weekday === index)">Проміжків немає</p>
        <article v-for="rule in rules.filter(r => r.weekday === index)" :key="rule.id" :aria-label="`${day} ${rule.start_time}–${rule.end_time}`" class="pc2-rules__interval">
          <slot v-if="editing === rule.id" name="edit" :rule="rule" />
          <template v-else>
            <div><strong>{{ rule.start_time }}–{{ rule.end_time }}</strong><p>{{ rule.session_duration_minutes }} хв · пауза {{ rule.buffer_minutes }} хв</p><small v-if="rule.needs_regeneration">Потрібна генерація вікон</small></div>
            <div class="pc2-rules__actions">
              <button type="button" role="switch" :aria-checked="rule.is_active" :aria-label="`${day} ${rule.start_time}: активний проміжок`" :disabled="busy || toggling !== null || editing !== null" @click="$emit('toggle', rule)">{{ rule.is_active ? 'Активний' : 'Неактивний' }}</button>
              <button type="button" :disabled="busy || toggling !== null" @click="$emit('edit', rule)">Редагувати</button>
              <button type="button" :disabled="busy || toggling !== null" @click="$emit('remove', rule.id)">Видалити</button>
            </div>
          </template>
        </article>
        <button type="button" :disabled="busy || toggling !== null" @click="$emit('add', index)">+ Проміжок</button>
      </div>
    </div>
    </template>
    <slot name="create" />
    <slot name="generation" />
  </section>
</template>
<script setup lang="ts">
import type { AvailabilityRule } from '../../lib/api'
defineProps<{ rules: AvailabilityRule[]; busy: boolean; error: string; editing: number | null; toggling: number | null }>()
defineEmits<{ add: [day: number]; edit: [rule: AvailabilityRule]; toggle: [rule: AvailabilityRule]; remove: [id: number]; reload: [] }>()
const days = ['Понеділок', 'Вівторок', 'Середа', 'Четвер', 'П’ятниця', 'Субота', 'Неділя']
</script>
<style scoped>
.pc2-rules { padding:22px 24px; border:1px solid var(--pc-border); border-radius:24px; background:var(--pc-bg-card); min-width:0; }
p { margin:0 0 10px; color:var(--pc-text-muted); font-size:14px; line-height:1.5; }
.pc2-rules__day { display:grid; grid-template-columns:150px minmax(0,1fr); gap:12px; border-top:1px solid var(--pc-border); padding:14px 0; }
h2 { font-size:15px; font-weight:500; margin:12px 0; } .pc2-rules__intervals { min-width:0; display:grid; gap:8px; }
.pc2-rules__interval { padding:10px 12px; border-radius:12px; background:var(--pc-bg-soft); display:flex; flex-wrap:wrap; gap:10px 20px; justify-content:space-between; align-items:center; min-width:0; }
.pc2-rules__actions { display:flex; flex-wrap:wrap; gap:6px; }
button { min-height:44px; padding:8px 12px; border:1px solid var(--pc-border); border-radius:999px; color:var(--pc-text-main); background:var(--pc-bg-card); font:inherit; font-size:13px; cursor:pointer; justify-self:start; }
button[aria-checked="true"] { background:var(--pc-navy-900); color:#fff; }
button:disabled { opacity:.6; cursor:default; } :focus-visible { outline:3px solid var(--pc-navy-900); outline-offset:3px; }
@media(max-width:767px) { .pc2-rules { padding:18px 16px; } .pc2-rules__day { grid-template-columns:minmax(0,1fr); gap:4px; } }
</style>
