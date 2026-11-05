<template>
  <section class="pc2-profile-contacts" aria-labelledby="pc2-profile-contacts-title">
    <div class="pc2-profile-contacts__head">
      <h2 id="pc2-profile-contacts-title" class="pc2-profile-contacts__title">Написати напряму</h2>
      <span class="pc2-profile-contacts__tag">поза Pro Consult</span>
    </div>
    <p class="pc2-profile-contacts__note">Звернення поза Pro Consult не зберігатимуться у вашій історії запитів на платформі.</p>
    <ul class="pc2-profile-contacts__list">
      <li v-for="item in contactActions" :key="item.id" class="pc2-profile-contacts__row" :class="{ 'is-copied': copiedContactId === item.id }">
        <span class="pc2-profile-contacts__label">{{ item.channelLabel }}</span>
        <span class="pc2-profile-contacts__value">{{ item.valueText }}</span>
        <button
          class="pc2-profile-contacts__action"
          type="button"
          :aria-label="`Скопіювати ${item.channelLabel}: ${item.valueText}`"
          aria-live="polite"
          @click="$emit('copy-contact-action', item)"
        >
          {{ copiedContactId === item.id ? 'Скопійовано' : 'Скопіювати' }}
        </button>
      </li>
    </ul>
  </section>
</template>

<script setup lang="ts">
// UI v2 only: the specialist's public contact actions, outside the request flow. Same data,
// visibility condition and copy action as the former «Мої контакти» block in the request rail.
type ContactAction = {
  id: string
  channel: string
  channelLabel: string
  valueText: string
  actionUrl: string
  actionScheme: string
}

withDefaults(defineProps<{ contactActions: ContactAction[]; copiedContactId?: string }>(), { copiedContactId: '' })

defineEmits<{ (event: 'copy-contact-action', item: ContactAction): void }>()
</script>
