<template>
  <aside v-if="profile" class="identity-rail">
    <div class="identity-rail__card">
      <h2 class="identity-rail__title">{{ heroCtaTitle }}</h2>

      <div class="identity-rail__services" v-if="introPriceDisplay || priceDisplay" aria-label="Послуги та вартість">
        <article v-if="introPriceDisplay" class="identity-rail__service identity-rail__service--intro">
          <div class="identity-rail__service-title">Ознайомча сесія: {{ introPriceDisplay }}</div>
          <div v-if="introDurationLabel" class="identity-rail__service-meta">{{ introDurationLabel }}</div>
        </article>
        <article v-if="priceDisplay" class="identity-rail__service">
          <div class="identity-rail__service-title">Консультація: {{ priceDisplay }}</div>
          <div class="identity-rail__service-meta">{{ standardSessionDurationLabel }}</div>
        </article>
      </div>

      <div class="identity-rail__actions">
        <template v-if="showChatCta">
          <button class="btn btn--primary" type="button" @click="$emit('chat-action')">
            {{ chatCtaLabel }}
          </button>
          <RouterLink v-if="showClientSessionsCta" class="btn btn--ghost" to="/client">
            Мої сесії
          </RouterLink>
          <button v-if="showRequestCta" class="btn btn--ghost" type="button" @click="$emit('request-action')">
            {{ requestCtaLabel }}
          </button>
          <RouterLink v-if="showFeedbackCta" class="btn btn--ghost" :to="feedbackLink">Відгуки</RouterLink>
        </template>
        <template v-else-if="showClientSessionsCta">
          <button class="btn btn--primary" type="button" @click="$emit('primary-action')">
            {{ heroPrimaryLabel }}
          </button>
          <button v-if="showInquiryCta" class="btn btn--ghost" type="button" @click="$emit('inquiry-action')">
            {{ inquiryCtaLabel }}
          </button>
          <RouterLink class="btn btn--ghost" to="/client">
            Мої сесії
          </RouterLink>
          <RouterLink v-if="showFeedbackCta" class="btn btn--ghost" :to="feedbackLink">Відгуки</RouterLink>
        </template>
        <template v-else>
          <button class="btn btn--primary" type="button" @click="$emit('primary-action')">
            {{ heroPrimaryLabel }}
          </button>
          <button v-if="showInquiryCta" class="btn btn--ghost" type="button" @click="$emit('inquiry-action')">
            {{ inquiryCtaLabel }}
          </button>
          <a v-if="showSlotsCta" class="btn btn--ghost" href="#slots">Переглянути вільні вікна</a>
        </template>
      </div>

      <section class="identity-rail__contacts" v-if="showContactActions">
        <div class="identity-rail__contacts-title">Контакти спеціаліста</div>
        <div class="identity-rail__contact-list">
          <button
            v-for="item in contactActions"
            :key="item.id"
            class="identity-rail__contact"
            :class="{ 'identity-rail__contact--copied': copiedContactId === item.id }"
            type="button"
            :aria-label="`Скопіювати ${item.channelLabel}: ${item.valueText}`"
            :title="copiedContactId === item.id ? 'Скопійовано' : `Скопіювати ${item.channelLabel}`"
            @click="$emit('copy-contact-action', item)"
          >
            <span class="identity-rail__contact-meta">
              <span class="identity-rail__contact-label">{{ item.channelLabel }}</span>
              <span class="identity-rail__contact-value">{{ item.valueText }}</span>
            </span>
            <span class="identity-rail__contact-status" aria-live="polite">
              <span v-if="copiedContactId === item.id" class="identity-rail__contact-copied">Скопійовано</span>
              <svg v-else class="identity-rail__contact-copy-icon" viewBox="0 0 20 20" aria-hidden="true">
                <rect x="7" y="5" width="8" height="10" rx="2" />
                <path d="M5 12H4.5A1.5 1.5 0 0 1 3 10.5v-6A1.5 1.5 0 0 1 4.5 3h6A1.5 1.5 0 0 1 12 4.5V5" />
              </svg>
            </span>
          </button>
        </div>
      </section>

      <p class="identity-rail__next-step">{{ primaryActionNextStepCopy }}</p>
    </div>
  </aside>
</template>

<script setup lang="ts">
type PublicProfileMedia = {
  photo_url?: string | null
  video_url?: string | null
}

type ContactAction = {
  id: string
  channel: string
  channelLabel: string
  valueText: string
  actionUrl: string
  actionScheme: string
}

type Props = {
  profile: PublicProfileMedia | null
  heroCtaTitle: string
  heroPrimaryLabel: string
  showClientSessionsCta: boolean
  feedbackLink: string | Record<string, unknown>
  primaryActionNextStepCopy: string
  introPriceDisplay: string
  introDurationLabel: string
  priceDisplay: string
  standardSessionDurationLabel: string
  showContactActions: boolean
  contactActions: ContactAction[]
  copiedContactId?: string
  showChatCta?: boolean
  chatCtaLabel?: string
  showRequestCta?: boolean
  requestCtaLabel?: string
  showSlotsCta?: boolean
  showInquiryCta?: boolean
  inquiryCtaLabel?: string
  showFeedbackCta?: boolean
}

withDefaults(defineProps<Props>(), {
  showChatCta: false,
  copiedContactId: '',
  chatCtaLabel: 'Написати в чат',
  showRequestCta: false,
  requestCtaLabel: 'Залишити запит',
  showSlotsCta: false,
  showInquiryCta: false,
  inquiryCtaLabel: 'Поставити запитання',
  showFeedbackCta: false,
})

defineEmits<{
  (event: 'primary-action'): void
  (event: 'chat-action'): void
  (event: 'request-action'): void
  (event: 'inquiry-action'): void
  (event: 'copy-contact-action', item: ContactAction): void
}>()
</script>

<style scoped>
.identity-rail {
  position: relative;
  align-self: start;
}

.identity-rail__card {
  display: grid;
  gap: 14px;
  border: 1px solid var(--pc-border);
  background: linear-gradient(
    160deg,
    color-mix(in srgb, var(--pc-bg-card) 94%, var(--pc-teal-100)),
    color-mix(in srgb, var(--pc-bg-card) 88%, var(--pc-peach-100))
  );
  border-radius: var(--radius-xl);
  padding: 18px;
  box-shadow: var(--pc-shadow-card);
  color: var(--pc-text-main);
}

.identity-rail__title {
  margin: 0;
  font-size: 22px;
  line-height: 1.25;
  color: var(--pc-navy-950);
  letter-spacing: 0;
}

.identity-rail__services {
  display: grid;
  gap: 9px;
}

.identity-rail__service {
  padding: 10px 11px;
  border-radius: 12px;
  border: 1px solid var(--pc-border);
  background: var(--pc-bg-card);
  display: grid;
  gap: 3px;
}

.identity-rail__service-title {
  font-size: 14px;
  line-height: 1.35;
  font-weight: 700;
  color: var(--pc-navy-900);
}

.identity-rail__service-meta {
  font-size: 12px;
  color: var(--pc-text-muted);
}

.identity-rail__service--intro {
  border-color: color-mix(in srgb, var(--pc-teal-500) 38%, var(--pc-border));
  background: color-mix(in srgb, var(--pc-bg-card) 82%, var(--pc-teal-100));
}

.identity-rail__actions {
  display: grid;
  gap: 8px;
}

.identity-rail__actions .btn {
  width: 100%;
}

.identity-rail__actions .btn--primary {
  border-color: var(--pc-navy-950);
  background: var(--pc-navy-950);
  color: #fff;
  box-shadow: 0 12px 24px rgba(14, 45, 82, 0.18);
}

.identity-rail__actions .btn--primary:hover,
.identity-rail__actions .btn--primary:focus-visible {
  border-color: var(--pc-navy-800);
  background: var(--pc-navy-800);
}

.identity-rail__actions .btn--ghost {
  border-color: var(--pc-border);
  background: color-mix(in srgb, var(--pc-bg-card) 92%, transparent);
  color: var(--pc-navy-900);
}

.identity-rail__actions .btn--ghost:hover,
.identity-rail__actions .btn--ghost:focus-visible {
  border-color: color-mix(in srgb, var(--pc-navy-900) 28%, var(--pc-border));
  background: var(--pc-bg-card);
}

.identity-rail__next-step {
  margin: 0;
  font-size: 12px;
  line-height: 1.45;
  color: var(--pc-text-muted);
}

.identity-rail__contacts {
  display: grid;
  gap: 6px;
  border-top: 1px dashed color-mix(in srgb, var(--pc-border) 86%, var(--pc-border-strong));
  padding-top: 8px;
}

.identity-rail__contacts-title {
  font-size: 11px;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  font-weight: 700;
  color: color-mix(in srgb, var(--pc-navy-900) 82%, var(--pc-text-muted));
}

.identity-rail__contact-list {
  display: grid;
  gap: 6px;
}

.identity-rail__contact {
  width: 100%;
  border: 1px solid var(--pc-border);
  border-radius: 12px;
  padding: 8px 9px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  color: inherit;
  background: var(--pc-bg-card);
  font: inherit;
  text-align: left;
  cursor: pointer;
  transition:
    border-color 0.16s ease,
    background-color 0.16s ease;
}

.identity-rail__contact:hover,
.identity-rail__contact:focus-visible,
.identity-rail__contact--copied {
  border-color: color-mix(in srgb, var(--pc-teal-500) 44%, var(--pc-border));
  background: color-mix(in srgb, var(--pc-bg-card) 88%, var(--pc-teal-100));
}

.identity-rail__contact-meta {
  min-width: 0;
  display: grid;
  gap: 2px;
}

.identity-rail__contact-label {
  font-size: 11px;
  text-transform: uppercase;
  letter-spacing: 0.07em;
  color: var(--pc-text-muted);
}

.identity-rail__contact-value {
  font-size: 13px;
  font-weight: 600;
  overflow-wrap: anywhere;
  color: var(--pc-navy-950);
}

.identity-rail__contact-status {
  flex: 0 0 auto;
  min-width: 24px;
  display: inline-flex;
  align-items: center;
  justify-content: flex-end;
  color: var(--pc-teal-600);
}

.identity-rail__contact-copy-icon {
  width: 18px;
  height: 18px;
  fill: none;
  stroke: currentColor;
  stroke-width: 1.5;
}

.identity-rail__contact-copied {
  font-size: 11px;
  font-weight: 700;
  white-space: nowrap;
}

@media (max-width: 1100px) {
  .identity-rail {
    position: static;
    top: auto;
    max-height: none;
    overflow: visible;
    width: 100%;
  }

  .identity-rail__card {
    padding: 13px 12px;
    gap: 10px;
    box-shadow: var(--pc-shadow-soft);
  }

  .identity-rail__title {
    font-size: 20px;
  }

  .identity-rail__next-step {
    font-size: 11px;
    line-height: 1.35;
    display: -webkit-box;
    -webkit-line-clamp: 3;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }
}
</style>
