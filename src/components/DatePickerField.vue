<template>
  <div ref="rootEl" class="field date-picker-field-wrapper">
    <label v-if="label" :for="inputId" class="date-picker-label">{{ label }}</label>
    <div class="date-picker-field">
      <input
        :id="inputId"
        :name="name"
        :value="modelValue"
        class="input"
        type="text"
        inputmode="numeric"
        maxlength="10"
        :placeholder="placeholder"
        :disabled="disabled"
        :required="required"
        :aria-invalid="Boolean(error) || undefined"
        :aria-describedby="error ? errorId : undefined"
        @click="openCalendar"
        @focus="handleFocus"
        @input="handleInput"
        @blur="handleBlur"
      />
      <button
        class="date-picker-toggle"
        type="button"
        :disabled="disabled"
        aria-label="Відкрити календар"
        @click="toggleCalendar"
      >
        ▾
      </button>
      <div v-if="calendarOpen" class="date-picker-popover">
        <div class="date-picker-header">
          <button class="date-picker-nav" type="button" aria-label="Попередній місяць" @click="moveMonth(-1)">‹</button>
          <div class="date-picker-title">{{ monthLabel }}</div>
          <button class="date-picker-nav" type="button" aria-label="Наступний місяць" @click="moveMonth(1)">›</button>
        </div>
        <div class="date-picker-weekdays">
          <span v-for="weekday in weekdays" :key="weekday" class="date-picker-weekday">{{ weekday }}</span>
        </div>
        <div class="date-picker-grid">
          <button
            v-for="day in pickerDays"
            :key="day.key"
            class="date-picker-day"
            :class="{
              'date-picker-day--muted': !day.inCurrentMonth,
              'date-picker-day--selected': day.displayDate === normalizedModelValue,
            }"
            type="button"
            :aria-label="day.displayDate"
            @click="selectDate(day.isoDate)"
          >
            {{ day.day }}
          </button>
        </div>
      </div>
    </div>
    <div v-if="error" :id="errorId" class="field-error">{{ error }}</div>
  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, ref, watch } from 'vue'
import {
  buildDatePickerDays,
  formatDatePickerMonth,
  formatIsoDateForDisplay,
  isoDateToLocalDate,
  normalizeDisplayDate,
  parseDisplayDateToIso,
  startOfLocalMonth,
} from '../lib/dateFormat'

const props = withDefaults(
  defineProps<{
    modelValue: string
    label?: string
    placeholder?: string
    disabled?: boolean
    error?: string
    id?: string
    name?: string
    required?: boolean
  }>(),
  {
    label: '',
    placeholder: 'ДД.ММ.РРРР',
    disabled: false,
    error: '',
    id: '',
    name: '',
    required: false,
  }
)

const emit = defineEmits<{
  'update:modelValue': [value: string]
  'select-iso': [value: string]
  blur: [event: FocusEvent]
  focus: [event: FocusEvent]
}>()

const rootEl = ref<HTMLElement | null>(null)
const calendarOpen = ref(false)
const monthDate = ref(startOfLocalMonth(new Date()))
const generatedId = `date-picker-${Math.random().toString(36).slice(2)}`
const inputId = computed(() => props.id || generatedId)
const errorId = computed(() => `${inputId.value}-error`)
const weekdays = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Нд']
const normalizedModelValue = computed(() => normalizeDisplayDate(props.modelValue))
const monthLabel = computed(() => formatDatePickerMonth(monthDate.value))
const pickerDays = computed(() => buildDatePickerDays(monthDate.value))

function syncMonthToValue() {
  const isoDate = parseDisplayDateToIso(props.modelValue)
  const parsed = isoDateToLocalDate(isoDate || '')
  monthDate.value = startOfLocalMonth(parsed || new Date())
}

function openCalendar() {
  if (props.disabled) return
  syncMonthToValue()
  calendarOpen.value = true
  nextTick(() => {
    document.addEventListener('pointerdown', handleDocumentPointerDown)
  })
}

function closeCalendar() {
  calendarOpen.value = false
  document.removeEventListener('pointerdown', handleDocumentPointerDown)
}

function toggleCalendar() {
  if (props.disabled) return
  if (calendarOpen.value) {
    closeCalendar()
    return
  }
  openCalendar()
}

function handleInput(event: Event) {
  const target = event.target as HTMLInputElement | null
  const value = target?.value || ''
  emit('update:modelValue', value)
  const isoDate = parseDisplayDateToIso(value)
  const parsed = isoDateToLocalDate(isoDate || '')
  if (parsed) monthDate.value = startOfLocalMonth(parsed)
}

function handleFocus(event: FocusEvent) {
  emit('focus', event)
  openCalendar()
}

function handleBlur(event: FocusEvent) {
  const normalized = normalizeDisplayDate(props.modelValue)
  if (normalized && normalized !== props.modelValue) {
    emit('update:modelValue', normalized)
  }
  emit('blur', event)
}

function moveMonth(delta: number) {
  monthDate.value = new Date(monthDate.value.getFullYear(), monthDate.value.getMonth() + delta, 1)
}

function selectDate(isoDate: string) {
  const displayDate = formatIsoDateForDisplay(isoDate)
  emit('update:modelValue', displayDate)
  emit('select-iso', isoDate)
  monthDate.value = startOfLocalMonth(isoDateToLocalDate(isoDate) || new Date())
  closeCalendar()
}

function handleDocumentPointerDown(event: PointerEvent) {
  const target = event.target as Node | null
  if (target && rootEl.value?.contains(target)) return
  closeCalendar()
}

watch(
  () => props.disabled,
  (disabled) => {
    if (disabled) closeCalendar()
  }
)

onBeforeUnmount(() => {
  document.removeEventListener('pointerdown', handleDocumentPointerDown)
})

defineExpose({ closeCalendar, openCalendar })
</script>

<style scoped>
.date-picker-field-wrapper {
  min-width: 0;
}

.date-picker-label {
  display: inline-block;
}

.date-picker-field {
  position: relative;
  display: flex;
  align-items: stretch;
}

.date-picker-field .input {
  width: 100%;
  padding-right: 44px;
  border: 1px solid var(--pc-border);
  border-radius: var(--pc-radius-control);
}

.date-picker-toggle {
  position: absolute;
  top: 50%;
  right: 6px;
  display: inline-flex;
  width: 32px;
  height: 32px;
  transform: translateY(-50%);
  align-items: center;
  justify-content: center;
  border: 0;
  border-radius: 8px;
  background: transparent;
  color: var(--pc-text-muted);
  cursor: pointer;
}

.date-picker-toggle:hover,
.date-picker-toggle:focus-visible {
  background: color-mix(in srgb, var(--pc-blue-soft) 70%, #ffffff);
  color: var(--pc-navy-900);
  outline: none;
}

.date-picker-popover {
  position: absolute;
  z-index: 30;
  top: calc(100% + 6px);
  left: 0;
  width: min(306px, calc(100vw - 32px));
  border: 1px solid var(--pc-border);
  border-radius: var(--pc-radius-card);
  background: #fff;
  box-shadow: var(--pc-shadow-soft);
  padding: 10px;
}

.date-picker-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  margin-bottom: 8px;
}

.date-picker-title {
  color: var(--pc-navy-900);
  font-weight: 700;
  text-transform: capitalize;
}

.date-picker-nav {
  display: inline-flex;
  width: 30px;
  height: 30px;
  align-items: center;
  justify-content: center;
  border: 1px solid var(--pc-border);
  border-radius: 8px;
  background: #fff;
  color: var(--pc-navy-900);
  cursor: pointer;
}

.date-picker-weekdays,
.date-picker-grid {
  display: grid;
  grid-template-columns: repeat(7, minmax(0, 1fr));
  gap: 4px;
}

.date-picker-weekday {
  color: var(--pc-text-muted);
  font-size: 12px;
  text-align: center;
}

.date-picker-day {
  min-width: 0;
  height: 32px;
  border: 0;
  border-radius: 8px;
  background: #fff;
  color: var(--pc-navy-900);
  cursor: pointer;
}

.date-picker-day:hover,
.date-picker-day:focus-visible {
  background: color-mix(in srgb, var(--pc-blue-soft) 70%, #ffffff);
  outline: none;
}

.date-picker-day--muted {
  color: color-mix(in srgb, var(--pc-text-muted) 62%, #ffffff);
}

.date-picker-day--selected {
  background: var(--pc-navy-900);
  color: #fff;
}
</style>
