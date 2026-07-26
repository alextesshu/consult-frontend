<template>
  <div
    class="profile-visibility-control"
    :class="{ 'profile-visibility-control--compact': compact }"
    :data-testid="`${controlId}-visibility-control`"
  >
    <div
      v-if="available"
      class="profile-visibility-control__options"
      role="group"
      :aria-label="`Видимість поля «${fieldLabel}»`"
      :aria-describedby="descriptionIds"
    >
      <button
        class="profile-visibility-control__option"
        :class="{ 'profile-visibility-control__option--selected': modelValue }"
        type="button"
        :aria-pressed="modelValue"
        @click="setVisibility(true)"
        @keydown.enter.prevent="setVisibility(true)"
        @keydown.space.prevent="setVisibility(true)"
      >
        <span v-if="modelValue" aria-hidden="true">✓</span>
        {{ visibleLabel }}
      </button>
      <button
        class="profile-visibility-control__option"
        :class="{ 'profile-visibility-control__option--selected': !modelValue }"
        type="button"
        :aria-pressed="!modelValue"
        @click="setVisibility(false)"
        @keydown.enter.prevent="setVisibility(false)"
        @keydown.space.prevent="setVisibility(false)"
      >
        <span v-if="!modelValue" aria-hidden="true">✓</span>
        {{ hiddenLabel }}
      </button>
    </div>
    <p v-else :id="statusId" class="profile-visibility-control__unavailable">
      {{ unavailableText }}
    </p>
    <p
      v-if="available && !(hasValue && !modelValue && hiddenWarning)"
      :id="statusId"
      class="profile-visibility-control__status"
    >
      {{ modelValue ? visibleStatus : hiddenStatus }}
    </p>
    <p
      v-if="available && hasValue && !modelValue && hiddenWarning"
      :id="warningId"
      class="profile-visibility-control__warning"
    >
      {{ hiddenWarning }}
    </p>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

const props = withDefaults(
  defineProps<{
    modelValue: boolean
    controlId: string
    fieldLabel: string
    visibleLabel?: string
    hiddenLabel?: string
    visibleStatus?: string
    hiddenStatus?: string
    hasValue?: boolean
    hiddenWarning?: string
    available?: boolean
    unavailableText?: string
    compact?: boolean
  }>(),
  {
    hasValue: false,
    hiddenWarning: '',
    available: true,
    unavailableText: 'Спочатку заповніть поле.',
    visibleLabel: 'Показувати клієнтам',
    hiddenLabel: 'Не показувати',
    visibleStatus: 'Показується на публічній сторінці',
    hiddenStatus: 'Приховано від клієнтів',
    compact: true,
  }
)

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
}>()

const statusId = computed(() => `${props.controlId}-visibility-status`)
const warningId = computed(() => `${props.controlId}-visibility-warning`)
const descriptionIds = computed(() =>
  props.hasValue && !props.modelValue && props.hiddenWarning
    ? `${statusId.value} ${warningId.value}`
    : statusId.value
)

function setVisibility(value: boolean) {
  emit('update:modelValue', value)
}
</script>

<style scoped>
.profile-visibility-control {
  display: grid;
  gap: 6px;
  min-width: 0;
}

.profile-visibility-control__options {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 8px;
  width: min(100%, 360px);
}

.profile-visibility-control__option {
  min-width: 0;
  min-height: 44px;
  padding: 9px 12px;
  border: 1px solid var(--pc-border);
  border-radius: var(--pc-radius-control);
  background: #fff;
  color: var(--pc-navy-900);
  font: inherit;
  font-size: 13px;
  font-weight: 700;
  line-height: 1.25;
  white-space: normal;
  overflow-wrap: anywhere;
  cursor: pointer;
}

.profile-visibility-control--compact .profile-visibility-control__options {
  gap: 6px;
  width: min(100%, 340px);
}

.profile-visibility-control--compact .profile-visibility-control__option {
  padding-inline: 8px;
  font-size: 12px;
}

.profile-visibility-control__option:hover {
  border-color: color-mix(in srgb, var(--pc-navy-900) 35%, var(--pc-border));
}

.profile-visibility-control__option:focus-visible {
  outline: 3px solid color-mix(in srgb, var(--pc-primary) 32%, transparent);
  outline-offset: 2px;
}

.profile-visibility-control__option--selected {
  border-color: var(--pc-primary);
  background: var(--pc-primary);
  color: #fff;
  box-shadow: 0 6px 14px rgba(15, 81, 90, 0.14);
}

.profile-visibility-control__status,
.profile-visibility-control__unavailable,
.profile-visibility-control__warning {
  margin: 0;
  font-size: 12px;
  line-height: 1.45;
}

.profile-visibility-control__status,
.profile-visibility-control__unavailable {
  color: var(--muted);
}

.profile-visibility-control__warning {
  color: #9a4c00;
  font-weight: 700;
}

@media (max-width: 520px) {
  .profile-visibility-control__options {
    width: 100%;
  }

  .profile-visibility-control__option {
    padding-inline: 8px;
  }
}
</style>
