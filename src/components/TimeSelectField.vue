<template>
  <label class="field">
    <span v-if="label" :class="labelClass">{{ label }}</span>
    <select
      :id="id"
      :name="name"
      :value="modelValue"
      class="input input--select"
      :disabled="disabled"
      :aria-invalid="Boolean(error) || undefined"
      :aria-describedby="error ? errorId : undefined"
      @change="handleChange"
      @click="$emit('click', $event)"
      @focus="$emit('focus', $event)"
      @blur="$emit('blur', $event)"
    >
      <option v-for="option in resolvedOptions" :key="option" :value="option">
        {{ option }}
      </option>
    </select>
    <div v-if="error" :id="errorId" class="field-error">{{ error }}</div>
  </label>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { buildTenMinuteTimeOptions } from '../lib/timeOptions'

const props = withDefaults(
  defineProps<{
    modelValue: string
    label?: string
    disabled?: boolean
    error?: string
    id?: string
    name?: string
    options?: string[]
    labelClass?: string
  }>(),
  {
    label: '',
    disabled: false,
    error: '',
    id: '',
    name: '',
    options: undefined,
    labelClass: '',
  }
)

const emit = defineEmits<{
  'update:modelValue': [value: string]
  click: [event: MouseEvent]
  focus: [event: FocusEvent]
  blur: [event: FocusEvent]
}>()

const resolvedOptions = computed(() => props.options || buildTenMinuteTimeOptions())
const errorId = computed(() => `${props.id || props.name || 'time-select'}-error`)

function handleChange(event: Event) {
  const target = event.target as HTMLSelectElement | null
  emit('update:modelValue', target?.value || '')
}
</script>

<style scoped>
.input--select {
  border: 1px solid var(--pc-border);
  border-radius: var(--pc-radius-control);
}
</style>
