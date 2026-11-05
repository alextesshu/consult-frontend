<template>
  <div class="pc2-cal__backdrop" :class="{ 'is-transparent': !sheet }" @click="$emit('close')"></div>
  <div
    id="pc2-cal-view-menu"
    ref="panelRef"
    class="pc2-cal-view"
    :class="{ 'is-sheet': sheet }"
    :style="!sheet && anchor ? { top: `${anchor.top}px`, left: `${anchor.left}px`, right: 'auto', maxHeight: `calc(100dvh - ${anchor.top + 16}px)` } : undefined"
    role="dialog"
    aria-modal="true"
    aria-labelledby="pc2-cal-view-title"
    @keydown.esc.stop.prevent="$emit('close')"
  >
    <div class="pc2-cal-view__head">
      <h2 id="pc2-cal-view-title" class="pc2-cal-view__title">Вигляд · {{ CALENDAR_MODE_LABELS[mode] }}</h2>
      <button type="button" class="pc2-cal__icon-btn pc2-cal-view__close" aria-label="Закрити вигляд" @click="$emit('close')">×</button>
    </div>
    <div class="pc2-cal-view__body">
    <fieldset class="pc2-cal-view__layers">
      <legend class="pc2-cal-sr">Що показувати</legend>
      <label v-for="layer in CALENDAR_LAYERS" :key="layer" class="pc2-cal-view__layer">
        <input
          type="checkbox"
          :checked="layers[layer]"
          :disabled="layers[layer] && visibleCount === 1"
          @change="$emit('set-layer', layer, ($event.target as HTMLInputElement).checked)"
        />
        <span class="pc2-cal-view__name">{{ CALENDAR_LAYER_LABELS[layer] }}</span>
        <span v-if="deviated.has(layer)" class="pc2-cal-view__changed">змінено</span>
        <span class="pc2-cal-view__count" :aria-label="`${counts[layer] ?? 0} у вибраному періоді`">{{ counts[layer] ?? 0 }}</span>
      </label>
    </fieldset>
    <p class="pc2-cal-view__note">Видимість не змінює доступність і правила запису. Лічильники — за вибраний період.</p>
    <button type="button" class="pc2-cal__btn" :disabled="!deviated.size" @click="$emit('reset')">Скинути до режиму</button>
    <details class="pc2-cal-view__legend">
      <summary>Що означають позначки</summary>
      <dl>
        <div v-for="entry in MARKER_LEGEND" :key="entry.marker"><dt>{{ entry.marker }}</dt><dd>{{ entry.meaning }}</dd></div>
      </dl>
    </details>
    <button type="button" class="pc2-cal__btn pc2-cal__btn--quiet" @click="$emit('close')">Готово</button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref } from 'vue'
import { CALENDAR_LAYER_LABELS, CALENDAR_LAYERS, type CalendarLayer, type CalendarLayers } from '../../lib/calendarItems'
import { CALENDAR_MODE_LABELS, layerDeviations, type CalendarMode } from '../../lib/calendarModes'

const props = defineProps<{ mode: CalendarMode; layers: CalendarLayers; counts: Partial<Record<CalendarLayer, number>>; sheet: boolean; anchor?: { top: number; left: number } | null }>()
defineEmits<{ close: []; reset: []; 'set-layer': [layer: CalendarLayer, visible: boolean] }>()

const MARKER_LEGEND = [
  { marker: '? Підтвердити', meaning: 'Сесія чекає вашого підтвердження.' },
  { marker: '! Посилання', meaning: 'Онлайн-сесія без посилання на зустріч.' },
  { marker: '⇄ Перенесення', meaning: 'Клієнт просить перенести сесію.' },
  { marker: 'Запит', meaning: 'Запит на сесію від гостя — ще не сесія.' },
  { marker: '✎ Нотатки', meaning: 'Минула сесія без нотатки.' },
  { marker: 'Не підтв. вчасно', meaning: 'Сесію не підтвердили до її початку; це не означає неявку клієнта.' },
  { marker: 'Зовнішня', meaning: 'Зовнішня гостьова сесія; перетин із нею система не блокує.' },
  { marker: 'Вікно · N слотів', meaning: 'Вільний час: лише суміжні слоти без сесій між ними.' },
]

const deviated = computed(() => new Set(layerDeviations(props.mode, props.layers).map((entry) => entry.layer)))
const visibleCount = computed(() => CALENDAR_LAYERS.filter((layer) => props.layers[layer]).length)

const panelRef = ref<HTMLElement | null>(null)
// The phone sheet scrolls on its own; the page behind it does not.
let restoreOverflow: string | null = null
onMounted(async () => {
  if (props.sheet) {
    restoreOverflow = document.documentElement.style.overflow
    document.documentElement.style.overflow = 'hidden'
  }
  await nextTick()
  panelRef.value?.querySelector<HTMLInputElement>('input:not(:disabled)')?.focus()
})
onBeforeUnmount(() => {
  if (restoreOverflow !== null) document.documentElement.style.overflow = restoreOverflow
})
</script>
