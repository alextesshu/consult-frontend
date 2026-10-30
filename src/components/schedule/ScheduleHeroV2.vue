<template>
  <header ref="root" class="pc2-schedule-hero">
    <div class="pc2-schedule-hero__top">
      <div>
        <p class="pc2-schedule-hero__eyebrow">Розклад</p>
        <h1>{{ title }}</h1>
        <p class="pc2-schedule-hero__hint">{{ subtitle }}</p>
      </div>
      <div class="pc2-schedule-hero__actions">
        <button v-if="active === 'slots'" ref="primaryAction" type="button" :disabled="busy" class="pc2-schedule-hero__fill" @click="$emit('fill')">Створити вікна</button>
        <RouterLink to="/cabinet/schedule" :aria-current="active === 'calendar' ? 'page' : undefined">Календар сесій →</RouterLink>
        <RouterLink to="/cabinet/slots?tab=settings" :aria-current="active === 'settings' ? 'page' : undefined">Запис і запити</RouterLink>
      </div>
    </div>
    <nav class="pc2-schedule-hero__nav" aria-label="Керування розкладом">
      <RouterLink to="/cabinet/slots?tab=availability" aria-label="Вікна для запису" :aria-current="active === 'slots' ? 'page' : undefined"><span class="pc2-schedule-hero__wide">Вікна для запису</span><span class="pc2-schedule-hero__compact">Вікна</span></RouterLink>
      <button type="button" disabled aria-label="Робочі години" aria-describedby="schedule-rules-deferred"><span class="pc2-schedule-hero__wide">Робочі години</span><span class="pc2-schedule-hero__compact">Години</span></button>
      <RouterLink to="/cabinet/availability-exceptions">Відпустка</RouterLink>
    </nav>
    <p id="schedule-rules-deferred" class="pc2-schedule-hero__deferred">Редактор робочих годин поки недоступний у цьому інтерфейсі.</p>
  </header>
</template>

<script setup lang="ts">
import { ref } from 'vue'
defineProps<{ active: 'slots' | 'calendar' | 'settings'; title: string; subtitle: string; busy: boolean }>()
defineEmits<{ fill: [] }>()
const root = ref<HTMLElement | null>(null)
const primaryAction = ref<HTMLButtonElement | null>(null)
defineExpose({ root, primaryAction })
</script>

<style scoped>
.pc2-schedule-hero { padding: 22px 26px; border-radius: 24px; background: var(--pc-navy-900); color: #fff; display: flex; flex-direction: column; gap: 18px; }
.pc2-schedule-hero__top { display: flex; align-items: flex-end; justify-content: space-between; flex-wrap: wrap; gap: 14px 24px; }
.pc2-schedule-hero__top > div:first-child { max-width: 520px; }
.pc2-schedule-hero p, .pc2-schedule-hero h1 { margin: 0; }
.pc2-schedule-hero__eyebrow, .pc2-schedule-hero__hint { font-size: 14px; line-height: 1.5; color: #c9d4e3; }
.pc2-schedule-hero h1 { margin: 4px 0; font-size: clamp(24px,2.6vw,30px); font-weight: 500; letter-spacing: -.03em; line-height: 1.15; }
.pc2-schedule-hero__actions, .pc2-schedule-hero__nav { display: flex; flex-wrap: wrap; gap: 8px; }
.pc2-schedule-hero a, .pc2-schedule-hero button { min-height: 44px; padding: 10px 16px; border: 1px solid #ffffff55; border-radius: 999px; color: #fff; background: transparent; font: inherit; font-size: 14px; text-decoration: none; display: inline-flex; align-items: center; justify-content: center; cursor: pointer; transition: background .25s, transform .2s; }
.pc2-schedule-hero__actions .pc2-schedule-hero__fill { background: var(--pc-peach-500); border-color: transparent; color: var(--pc-text-main); }
.pc2-schedule-hero__nav { align-self: flex-start; padding: 4px; gap: 2px; background: #ffffff19; border-radius: 24px; }
.pc2-schedule-hero__nav a, .pc2-schedule-hero__nav button { border: 0; }
.pc2-schedule-hero__nav [aria-current="page"] { background: #fff; color: var(--pc-text-main); }
.pc2-schedule-hero button:disabled { cursor: default; opacity: .65; }
.pc2-schedule-hero__compact { display: none; }
.pc2-schedule-hero__deferred { position: absolute; width: 1px; height: 1px; padding: 0; overflow: hidden; clip-path: inset(50%); white-space: nowrap; }
.pc2-schedule-hero :focus-visible { outline: 3px solid var(--pc-peach-500); outline-offset: 3px; }
.pc2-schedule-hero button:not(:disabled):active { transform: scale(.97); }
@media (max-width: 767px) { .pc2-schedule-hero { padding: 16px 18px; gap: 12px; } .pc2-schedule-hero__actions { width: 100%; gap: 4px; } .pc2-schedule-hero__actions .pc2-schedule-hero__fill { flex-basis: 100%; } .pc2-schedule-hero__actions a { padding: 8px; border: 0; text-decoration: underline; font-size: 13px; } .pc2-schedule-hero__nav { border-radius: 18px; } .pc2-schedule-hero__nav a, .pc2-schedule-hero__nav button { padding: 8px 10px; font-size: 13px; } .pc2-schedule-hero__wide { display: none; } .pc2-schedule-hero__compact { display: inline; } }
@media (prefers-reduced-motion: reduce) { .pc2-schedule-hero a, .pc2-schedule-hero button { transition: none; } }
</style>
