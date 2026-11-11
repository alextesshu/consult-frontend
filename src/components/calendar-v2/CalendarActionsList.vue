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
      <h2 id="pc2-cal-actions-how" class="pc2-cal-actions__how-title">Потребує вашої уваги</h2>
      <p>Підтверджуйте сесії, додавайте посилання на зустрічі та переглядайте запити на сесію чи перенесення.</p>
      <p v-if="complete && elsewhere.length">Лічильник вкладки не обмежений вибраним тижнем.</p>
      <p v-if="!complete">Не вдалося завантажити: {{ failedLabels }}. Показані лише доступні справи. Спробуйте ще раз.</p>
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

const groups = computed(() => [
  { id: 'week', title: 'Цей тиждень', items: props.thisWeek, empty: 'У вибраному тижні дій немає.' },
  { id: 'elsewhere', title: 'Поза цим тижнем', items: props.elsewhere, empty: 'Поза тижнем дій немає.' },
])
const actionsLabel = (count: number) => `${count} ${plural(count, 'дія', 'дії', 'дій')}`
</script>
