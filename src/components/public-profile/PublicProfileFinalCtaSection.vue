<template>
  <section class="panel panel--footer-cta">
    <div class="closing-cta">
      <div class="closing-cta__copy">
        <h2 class="closing-cta__title">Готові зробити перший крок?</h2>
        <p class="closing-cta__subtitle">{{ closingCtaSupportLine }}</p>
        <p class="closing-cta__next-step">{{ primaryActionNextStepCopy }}</p>
      </div>
      <div class="closing-cta__actions">
        <button v-if="showChatCta" class="btn btn--primary" type="button" @click="$emit('chat-action')">
          {{ chatCtaLabel }}
        </button>
        <button v-else class="btn btn--primary" type="button" @click="$emit('primary-action')">
          {{ closingPrimaryLabel }}
        </button>
        <RouterLink
          v-if="closingSecondaryKind === 'sessions'"
          class="btn btn--ghost"
          to="/client"
        >
          Мої сесії
        </RouterLink>
        <button v-if="showChatCta && showRequestCta" class="btn btn--ghost" type="button" @click="$emit('request-action')">
          {{ requestCtaLabel }}
        </button>
        <RouterLink
          v-if="!showChatCta && showFeedbackCta && closingSecondaryKind === 'reviews'"
          class="btn btn--ghost"
          :to="feedbackLink"
        >
          Відгуки
        </RouterLink>
        <button
          v-else-if="!showChatCta && closingSecondaryKind === 'slots'"
          class="btn btn--ghost"
          type="button"
          @click="$emit('scroll-slots')"
        >
          Переглянути вільні вікна
        </button>
        <button
          v-else-if="!showChatCta && closingSecondaryKind === 'contact'"
          class="btn btn--ghost"
          type="button"
          @click="$emit('open-contact')"
        >
          {{ contactCtaLabel }}
        </button>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
type ClosingSecondaryKind = 'sessions' | 'reviews' | 'slots' | 'contact' | 'none'

type Props = {
  closingCtaSupportLine: string
  primaryActionNextStepCopy: string
  closingPrimaryLabel: string
  closingSecondaryKind: ClosingSecondaryKind
  feedbackLink: string | Record<string, unknown>
  contactCtaLabel: string
  showChatCta?: boolean
  chatCtaLabel?: string
  showRequestCta?: boolean
  requestCtaLabel?: string
  showFeedbackCta?: boolean
}

withDefaults(defineProps<Props>(), {
  showChatCta: false,
  chatCtaLabel: 'Написати в чат',
  showRequestCta: false,
  requestCtaLabel: 'Залишити запит',
  showFeedbackCta: false,
})

defineEmits<{
  (event: 'primary-action'): void
  (event: 'chat-action'): void
  (event: 'request-action'): void
  (event: 'scroll-slots'): void
  (event: 'open-contact'): void
}>()
</script>

<style scoped>
.panel--footer-cta {
  grid-column: 1 / -1;
}

.panel {
  border: 1px solid var(--line);
  border-radius: var(--radius-lg);
  padding: 12px;
  background: color-mix(in srgb, #ffffff 90%, var(--surface));
  display: grid;
  gap: 8px;
}

.closing-cta {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  gap: 14px;
  align-items: center;
  border: 1px solid color-mix(in srgb, var(--primary) 24%, var(--line));
  border-radius: var(--radius-md);
  background: linear-gradient(
    180deg,
    color-mix(in srgb, #f7f2e7 76%, #ffffff),
    color-mix(in srgb, #f2eee2 64%, #ffffff)
  );
  padding: 14px 16px;
}

.closing-cta__copy {
  display: grid;
  gap: 4px;
}

.closing-cta__title {
  margin: 0;
  font-size: 24px;
  line-height: 1.22;
  font-family: var(--font-display);
}

.closing-cta__subtitle {
  margin: 0;
  color: var(--muted);
  font-size: 14px;
  line-height: 1.5;
}

.closing-cta__next-step {
  margin: 0;
  color: color-mix(in srgb, var(--text) 82%, var(--muted));
  font-size: 13px;
  line-height: 1.45;
}

.closing-cta__actions {
  display: grid;
  gap: 8px;
  min-width: 280px;
}

@media (max-width: 960px) {
  .closing-cta {
    grid-template-columns: 1fr;
  }

  .closing-cta__actions {
    min-width: 0;
  }
}
</style>
