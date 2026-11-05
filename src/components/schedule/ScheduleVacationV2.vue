<template>
  <div class="pc2-vacation">
    <section class="pc2-vacation__card"><h2>Нова пауза</h2><slot name="create" /><p>Пауза враховується під час генерації вікон. Уже створені вікна перевірте окремо. Заплановані сесії автоматично не скасовуються.</p><RouterLink to="/cabinet/slots?tab=availability">Перевірити створені вікна →</RouterLink></section>
    <section aria-label="Заплановані паузи">
      <h2>Заплановані паузи</h2><p v-if="busy" role="status">Завантажуємо або зберігаємо…</p>
      <div v-if="error" role="alert">{{ error }} <button type="button" :disabled="busy" @click="$emit('reload')">Оновити</button></div>
      <p v-if="!busy && !error && !exceptions.length">Пауз поки немає.</p>
      <article v-for="item in exceptions" :key="item.id" class="pc2-vacation__card">
        <slot v-if="editing === item.id" name="edit" :item="item" />
        <template v-else>
          <strong>{{ format(item.starts_at, item.ends_at) }}</strong><p>{{ item.is_all_day ? 'Весь день' : 'Частина дня' }} · {{ item.is_active ? 'Активна' : 'Неактивна' }}</p><p v-if="item.note">{{ item.note }}</p>
          <div class="pc2-vacation__actions"><button type="button" :disabled="busy" @click="$emit('edit', item)">Редагувати</button><button type="button" :disabled="busy" @click="$emit('remove', item.id)">Видалити</button></div>
        </template>
      </article>
    </section>
  </div>
</template>
<script setup lang="ts">
import type { AvailabilityException } from '../../lib/api'
defineProps<{ exceptions: AvailabilityException[]; busy: boolean; error: string; editing: number | null; format: (start: string, end: string) => string }>()
defineEmits<{ edit: [item: AvailabilityException]; remove: [id: number]; reload: [] }>()
</script>
<style scoped>
.pc2-vacation { display:grid; grid-template-columns:repeat(2,minmax(0,1fr)); gap:16px; align-items:start; min-width:0; }
.pc2-vacation__card { display:grid; gap:14px; padding:22px 24px; border:1px solid var(--pc-border); border-radius:24px; background:var(--pc-bg-card); margin-bottom:12px; min-width:0; overflow-wrap:anywhere; }
h2 { font-size:19px; font-weight:500; margin:0 0 12px; } p { font-size:14px; line-height:1.5; color:var(--pc-text-muted); margin:0; }
button, a { min-height:44px; padding:8px 12px; display:inline-flex; align-items:center; border:1px solid var(--pc-border); border-radius:999px; color:var(--pc-text-main); background:var(--pc-bg-card); font:inherit; font-size:13px; cursor:pointer; }
.pc2-vacation__actions { display:flex; flex-wrap:wrap; gap:8px; } :focus-visible { outline:3px solid var(--pc-navy-900); outline-offset:3px; }
@media(max-width:1099px) { .pc2-vacation { grid-template-columns:minmax(0,1fr); } }
@media(max-width:767px) { .pc2-vacation__card { padding:18px 16px; } }
</style>
