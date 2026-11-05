<template>
  <div class="pc2-cal-actions">
    <div class="pc2-cal-actions__groups">
      <section v-for="group in groups" :key="group.id" class="pc2-cal-actions__group" :aria-labelledby="`pc2-cal-actions-${group.id}`">
        <h2 :id="`pc2-cal-actions-${group.id}`" class="pc2-cal-actions__head">
          <span>{{ group.title }}</span><span>{{ actionsLabel(group.items.length) }}</span>
        </h2>
        <ul v-if="group.items.length" class="pc2-cal-actions__list" role="list">
          <li v-for="action in group.items" :key="action.key" class="pc2-cal-actions__row">
            <span class="pc2-cal-actions__when">{{ action.when === null ? 'Без часу' : formatWhen(action.when, timeZone) }}</span>
            <span class="pc2-cal-actions__marker">{{ action.marker }}</span>
            <span class="pc2-cal-actions__what"><b>{{ action.who }}</b> — {{ action.reason }}</span>
            <RouterLink class="pc2-cal-actions__go" :to="action.href" :aria-label="`${action.primaryLabel}: ${action.who}`">{{ action.primaryLabel }} →</RouterLink>
          </li>
        </ul>
        <p v-else class="pc2-cal-actions__empty">{{ group.empty }}</p>
      </section>
    </div>
    <aside class="pc2-cal-actions__how" aria-labelledby="pc2-cal-actions-how">
      <h2 id="pc2-cal-actions-how" class="pc2-cal-actions__how-title">Як рахуємо</h2>
      <p v-if="complete">
        Лічильник вкладки — {{ total }}: усе, що чекає на вас, незалежно від тижня. Тут — {{ thisWeek.length }} у вибраному тижні й
        {{ elsewhere.length }} поза ним. Сума завжди дорівнює лічильнику.
      </p>
      <p v-else>
        Не вдалося завантажити: {{ failedLabels }}. Загальну кількість не показуємо, щоб не вводити в оману; нижче — лише те, що
        завантажилося.
      </p>
      <p>Враховуємо: підтвердження сесій, посилання на зустріч, перенесення та запити гостей. Минулі сесії без нотаток позначені в
        календарі «✎ Нотатки», але сюди не входять — для них поки немає загального лічильника.</p>
      <button v-if="!complete" type="button" class="pc2-cal__btn" @click="$emit('retry')">Повторити</button>
    </aside>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { RouterLink } from 'vue-router'
import { formatWhen, type CalendarAction } from '../../lib/calendarActions'
import { plural } from '../../lib/calendarWindows'

const props = defineProps<{
  thisWeek: CalendarAction[]
  elsewhere: CalendarAction[]
  complete: boolean
  failedLabels: string
  timeZone: string
}>()
defineEmits<{ retry: [] }>()

const total = computed(() => props.thisWeek.length + props.elsewhere.length)
const groups = computed(() => [
  { id: 'week', title: 'Цей тиждень', items: props.thisWeek, empty: 'У вибраному тижні дій немає.' },
  { id: 'elsewhere', title: 'Поза цим тижнем', items: props.elsewhere, empty: 'Поза тижнем дій немає.' },
])
const actionsLabel = (count: number) => `${count} ${plural(count, 'дія', 'дії', 'дій')}`
</script>
