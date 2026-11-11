<template>
  <section class="pc2-schedule-slots" aria-label="Вікна для запису">
    <div class="pc2-schedule-slots__toolbar">
      <div class="pc2-schedule-slots__week">
        <button type="button" aria-label="Попередній тиждень" @click="$emit('shift', -1)">‹</button>
        <strong aria-live="polite">{{ weekLabel }}</strong>
        <button type="button" aria-label="Наступний тиждень" @click="$emit('shift', 1)">›</button>
        <button type="button" @click="$emit('today')">Сьогодні</button>
      </div>
      <button type="button" :disabled="busy || !canClear" @click="$emit('clearWeek')">Очистити тиждень</button>
    </div>
    <div class="pc2-schedule-slots__guidance" role="note">
      <strong>{{ status }}</strong>
      <p>{{ guidance }}</p>
      <RouterLink to="/cabinet/slots?tab=settings">Налаштування запису і запитів →</RouterLink>
    </div>
    <div class="pc2-schedule-slots__filters" role="group" aria-label="Фільтр за статусом вікон для запису">
      <button v-for="option in filters" :key="option.value" type="button" :aria-pressed="filter === option.value" @click="$emit('filter', option.value)">{{ option.label }}</button>
      <button v-if="pastCount" type="button" :aria-pressed="showPast" @click="$emit('past')">{{ showPast ? 'Сховати минулі' : `Показати минулі (${pastCount})` }}</button>
    </div>
    <p class="pc2-schedule-slots__summary">{{ free }} {{ freeLabel }} · {{ booked }} заброньовано</p>
    <p v-if="loading" role="status">Завантажуємо вікна…</p>
    <div v-if="error" role="alert" class="pc2-schedule-slots__error">{{ error }} <button type="button" :disabled="busy" @click="$emit('reload')">Повторити</button></div>
    <div v-if="empty && !loading && !error" class="pc2-schedule-slots__empty">
      <h2>На цьому тижні ще немає вікон для запису</h2>
      <p>Робочі години — лише шаблон. Створіть вікна за графіком або додайте час вручну.</p>
      <button type="button" :disabled="busy" @click="$emit('create', selectedDate)">Додати одне вікно</button>
    </div>
    <div class="pc2-schedule-slots__days" aria-label="Дні тижня">
      <button v-for="day in days" :key="day.key" type="button" :aria-pressed="day.key === selectedDate" :aria-label="`${day.weekday} ${day.dateLabel}`" @click="$emit('day', day.key)">
        <span>{{ shortDays[day.weekday] || day.weekday }}</span><strong>{{ day.dateLabel }}</strong><i :class="{ 'has-windows': slots.some(s => dateKey(s.start_at) === day.key) }" aria-hidden="true"></i>
      </button>
    </div>
    <p v-if="filteredEmpty && !loading && !error" class="pc2-schedule-slots__caption">{{ filteredEmpty }}</p>
    <div class="pc2-schedule-slots__grid">
      <section v-for="day in days" :key="day.key" :class="{ 'is-selected-day': day.key === selectedDate }" class="pc2-schedule-slots__day" :aria-label="`${day.weekday} ${day.dateLabel}`">
        <h2><span>{{ shortDays[day.weekday] || day.weekday }}</span><strong>{{ day.dateLabel }}</strong></h2>
        <p v-if="!slots.some(s => dateKey(s.start_at) === day.key)" class="pc2-schedule-slots__caption">Немає вікон за обраними умовами</p>
        <div v-for="slot in slots.filter(s => dateKey(s.start_at) === day.key)" :key="slot.id" class="pc2-schedule-slots__row" :class="{ 'is-booked': slot.is_booked, 'is-past': isPast(slot), 'is-selected': selectedIds.includes(slot.id) }">
          <button type="button" class="pc2-schedule-slots__slot" :title="formatTime(slot)" :aria-label="`${slot.is_booked ? 'Заброньовано' : 'Вікно для запису'} ${formatTime(slot)}`" @click="$emit('select', slot)">
            <span class="pc2-schedule-slots__time-start">{{ formatTime(slot).split('–')[0] }}</span><span class="pc2-schedule-slots__time-full">{{ formatTime(slot) }}</span><small>{{ isPast(slot) ? 'Минуло' : slot.is_booked ? 'Заброньовано' : 'Вікно' }}</small>
          </button>
          <button v-if="!slot.is_booked" type="button" class="pc2-schedule-slots__choose" :disabled="busy" :aria-pressed="selectedIds.includes(slot.id)" :aria-label="`Вибрати вікно ${formatTime(slot)}`" @click="$emit('toggle', slot)">{{ selectedIds.includes(slot.id) ? '✓' : '+' }}</button>
        </div>
        <button type="button" class="pc2-schedule-slots__add" :disabled="busy" @click="$emit('create', day.key)">+ Вікно</button>
      </section>
    </div>
    <div v-if="selectedIds.length" class="pc2-schedule-slots__selection" aria-label="Вибрані вікна">
      <span role="status">Вибрано: {{ selectedIds.length }}</span>
      <button type="button" :disabled="busy" @click="$emit('clearSelection')">Скасувати вибір</button>
      <button type="button" :disabled="busy" class="pc2-schedule-slots__danger" @click="$emit('deleteSelection')">Видалити вибрані</button>
    </div>
    <p class="pc2-schedule-slots__caption">Календар показує збережені вікна, а не попередній розрахунок. Публічну доступність визначають правила запису.</p>
  </section>
</template>

<script setup lang="ts">
type Slot = { id: number; start_at: string; end_at: string; is_booked: boolean }
type Filter = 'ALL' | 'FREE' | 'BOOKED'
defineProps<{
  days: Array<{ key: string; weekday: string; dateLabel: string }>; slots: Slot[]; weekLabel: string; selectedDate: string;
  selectedIds: number[]; filter: Filter; free: number; booked: number; busy: boolean; loading: boolean; error: string;
  status: string; guidance: string; freeLabel: string; empty: boolean; filteredEmpty: string; showPast: boolean; pastCount: number; canClear: boolean;
  formatTime: (slot: Slot) => string; dateKey: (iso: string) => string; isPast: (slot: Slot) => boolean;
}>()
defineEmits<{
  shift: [amount: number]; today: []; day: [date: string]; create: [date: string]; select: [slot: Slot]; toggle: [slot: Slot];
  filter: [filter: Filter]; past: []; clearSelection: []; deleteSelection: []; clearWeek: []; reload: [];
}>()
const filters: Array<{ value: Filter; label: string }> = [{ value: 'ALL', label: 'Усі' }, { value: 'FREE', label: 'Незайняті' }, { value: 'BOOKED', label: 'Заброньовано' }]
const shortDays: Record<string, string> = { 'Понеділок': 'Пн', 'Вівторок': 'Вт', 'Середа': 'Ср', 'Четвер': 'Чт', 'П’ятниця': 'Пт', 'Пʼятниця': 'Пт', 'П\'ятниця': 'Пт', 'Субота': 'Сб', 'Неділя': 'Нд' }
</script>

<style scoped>
.pc2-schedule-slots { display: flex; flex-direction: column; gap: 16px; min-width: 0; color: var(--pc-text-main); }
.pc2-schedule-slots button { min-height: 44px; padding: 8px 12px; border: 1px solid var(--pc-border); border-radius: 999px; background: var(--pc-bg-card); color: var(--pc-text-main); font: inherit; font-size: 14px; cursor: pointer; transition: background .2s, border-color .2s; }
.pc2-schedule-slots button:disabled { opacity: .6; cursor: default; }
.pc2-schedule-slots button:hover:not(:disabled) { border-color: var(--pc-navy-900); }
.pc2-schedule-slots button:focus-visible, .pc2-schedule-slots a:focus-visible { outline: 3px solid var(--pc-navy-900); outline-offset: 3px; }
.pc2-schedule-slots__toolbar, .pc2-schedule-slots__week, .pc2-schedule-slots__filters { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
.pc2-schedule-slots__toolbar { justify-content: space-between; }
.pc2-schedule-slots__week > button:first-child, .pc2-schedule-slots__week > button:nth-child(3) { min-width: 44px; font-size: 22px; }
.pc2-schedule-slots__week strong { font-size: 16px; font-weight: 500; }
.pc2-schedule-slots__guidance { padding: 14px 18px; background: var(--pc-bg-soft); border-radius: 16px; font-size: 14px; line-height: 1.5; }
.pc2-schedule-slots__guidance p { margin: 4px 0; }
.pc2-schedule-slots__guidance a { color: var(--pc-navy-900); display: inline-flex; align-items: center; min-height: 44px; }
.pc2-schedule-slots__filters [aria-pressed="true"] { background: var(--pc-navy-900); border-color: var(--pc-navy-900); color: #fff; }
.pc2-schedule-slots__summary, .pc2-schedule-slots__caption { font-size: 13px; line-height: 1.5; color: var(--pc-text-muted); margin: 0; }
.pc2-schedule-slots__grid { display: grid; grid-template-columns: repeat(7,minmax(0,1fr)); gap: 8px; align-items: start; }
.pc2-schedule-slots__day { min-width: 0; min-height: 180px; padding: 10px; border: 1px solid var(--pc-border-hair); background: var(--pc-bg-card); border-radius: 18px; display: flex; flex-direction: column; gap: 6px; }
.pc2-schedule-slots__day h2 { display: flex; justify-content: space-between; align-items: baseline; gap: 4px; margin: 0 0 6px; font-size: 13px; color: var(--pc-text-muted); font-weight: 400; }
.pc2-schedule-slots__day h2 strong { color: var(--pc-text-main); font-size: 16px; font-weight: 500; }
.pc2-schedule-slots__row { border: 1.5px solid var(--pc-teal-500); border-radius: 10px; display: flex; align-items: center; min-width: 0; }
.pc2-schedule-slots__row .pc2-schedule-slots__slot { border: 0; border-radius: 8px; text-align: left; padding: 6px; min-width: 0; flex: 1 1 0; display: flex; flex-direction: column; gap: 2px; background: transparent; color: inherit; }
.pc2-schedule-slots__slot span { white-space: nowrap; font-size: 13px; font-variant-numeric: tabular-nums; }
.pc2-schedule-slots__slot small { font-size: 11px; }
.pc2-schedule-slots__slot .pc2-schedule-slots__time-full { display: none; }
.pc2-schedule-slots__row.is-booked { background: var(--pc-navy-900); border-color: var(--pc-navy-900); color: #fff; }
.pc2-schedule-slots__row.is-selected { background: var(--pc-danger-soft); border-color: #e8a8a8; }
.pc2-schedule-slots__row.is-past { border-style: dashed; }
.pc2-schedule-slots__row .pc2-schedule-slots__choose { border: 0; border-radius: 8px; padding: 4px; min-width: 44px; background: transparent; }
.pc2-schedule-slots__day .pc2-schedule-slots__add { border: 1.5px dashed var(--pc-border-strong); border-radius: 10px; background: transparent; }
.pc2-schedule-slots__days { display: none; }
.pc2-schedule-slots__selection { position: sticky; bottom: 16px; z-index: 4; display: flex; flex-wrap: wrap; align-items: center; gap: 8px; padding: 12px; border: 1px solid var(--pc-border); border-radius: 20px; background: #fff; box-shadow: 0 12px 32px #12233a1a; }
.pc2-schedule-slots__selection .pc2-schedule-slots__danger { color: #fff; background: var(--pc-danger); border-color: var(--pc-danger); }
.pc2-schedule-slots__empty { padding: 20px; border-radius: 18px; background: var(--pc-bg-soft); }
.pc2-schedule-slots__empty h2 { font-size: 19px; margin: 0; font-weight: 500; }
.pc2-schedule-slots__error { color: var(--pc-danger); }
@media (min-width: 768px) and (max-width: 1099px) { .pc2-schedule-slots__grid { grid-template-columns: repeat(4,minmax(0,1fr)); } }
@media (max-width: 767px) {
  .pc2-schedule-slots__days { display: grid; grid-template-columns: repeat(7,minmax(0,1fr)); gap: 3px; }
  .pc2-schedule-slots__days button { min-width: 0; padding: 8px 0; border: 0; border-radius: 12px; display: flex; flex-direction: column; align-items: center; gap: 3px; }
  .pc2-schedule-slots__days button[aria-pressed="true"] { color: #fff; background: var(--pc-navy-900); }
  .pc2-schedule-slots__days i { width: 5px; height: 5px; border-radius: 50%; background: transparent; }
  .pc2-schedule-slots__days .has-windows { background: var(--pc-teal-500); }
  .pc2-schedule-slots__grid { grid-template-columns: minmax(0,1fr); }
  .pc2-schedule-slots__day:not(.is-selected-day) { display: none; }
  .pc2-schedule-slots__row { flex-wrap: nowrap; }
  .pc2-schedule-slots__row .pc2-schedule-slots__slot { flex-direction: row; align-items: center; justify-content: space-between; padding: 10px; }
  .pc2-schedule-slots__slot .pc2-schedule-slots__time-start { display: none; }
  .pc2-schedule-slots__slot .pc2-schedule-slots__time-full { display: inline; }
  .pc2-schedule-slots__selection { bottom: 8px; }
}
@media (prefers-reduced-motion: reduce) { .pc2-schedule-slots button { transition: none; } }
</style>
