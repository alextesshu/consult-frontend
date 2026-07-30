<template>
  <aside v-if="profile" class="identity-rail">
    <div class="identity-rail__card" data-testid="public-profile-booking-card">
      <h2 class="identity-rail__title">{{ heroCtaTitle }}</h2>

      <div
        class="identity-rail__services"
        v-if="priceDisplay || introPriceDisplay || couplePriceDisplay"
        aria-label="Послуги та вартість"
      >
        <button
          v-if="priceDisplay"
          class="identity-rail__service"
          :class="{ 'identity-rail__service--active': selectedOfferType === 'standard' }"
          type="button"
          :aria-pressed="selectedOfferType === 'standard'"
          @click="$emit('select-offer', 'standard')"
        >
          <div class="identity-rail__service-title">Консультація: {{ priceDisplay }}</div>
          <div class="identity-rail__service-meta">{{ standardSessionDurationLabel }}</div>
        </button>
        <button
          v-if="introPriceDisplay"
          class="identity-rail__service identity-rail__service--intro"
          :class="{ 'identity-rail__service--active': selectedOfferType === 'intro' }"
          type="button"
          :aria-pressed="selectedOfferType === 'intro'"
          @click="$emit('select-offer', 'intro')"
        >
          <div class="identity-rail__service-title">Ознайомча сесія: {{ introPriceDisplay }}</div>
          <div v-if="introDurationLabel" class="identity-rail__service-meta">{{ introDurationLabel }}</div>
        </button>
        <button
          v-if="couplePriceDisplay"
          class="identity-rail__service identity-rail__service--couple"
          :class="{ 'identity-rail__service--active': selectedOfferType === 'couple' }"
          type="button"
          :aria-pressed="selectedOfferType === 'couple'"
          @click="$emit('select-offer', 'couple')"
        >
          <div class="identity-rail__service-title">Парна консультація: {{ couplePriceDisplay }}</div>
          <div v-if="coupleDurationLabel" class="identity-rail__service-meta">{{ coupleDurationLabel }}</div>
        </button>
      </div>

      <div class="identity-rail__actions">
        <template v-if="showChatCta">
          <button class="btn btn--primary" type="button" @click="$emit('chat-action')">
            {{ chatCtaLabel }}
          </button>
          <RouterLink v-if="showClientSessionsCta" class="btn btn--ghost" to="/client">
            Мої сесії
          </RouterLink>
          <div v-if="showRequestCta" class="identity-rail__request-action">
            <div
              class="identity-rail__request-control"
              @mouseenter="requestTooltipHovered = true"
              @mouseleave="requestTooltipHovered = false"
            >
              <button
                class="btn btn--ghost"
                type="button"
                aria-describedby="public-profile-request-helper public-profile-request-tooltip"
                @focus="requestTooltipFocused = true"
                @blur="requestTooltipFocused = false"
                @click="$emit('request-action')"
              >
                {{ requestCtaLabel }}
              </button>
              <div
                v-show="requestTooltipVisible"
                id="public-profile-request-tooltip"
                class="identity-rail__request-tooltip"
                role="tooltip"
              >
                {{ requestTooltipText }}
              </div>
            </div>
            <p id="public-profile-request-helper" class="identity-rail__request-helper">
              {{ requestHelperText }}
            </p>
          </div>
        </template>
        <template v-else-if="showClientSessionsCta">
          <div v-if="showRequestExplanation" class="identity-rail__request-action">
            <div
              class="identity-rail__request-control"
              @mouseenter="requestTooltipHovered = true"
              @mouseleave="requestTooltipHovered = false"
            >
              <button
                class="btn btn--primary"
                type="button"
                aria-describedby="public-profile-request-helper public-profile-request-tooltip"
                @focus="requestTooltipFocused = true"
                @blur="requestTooltipFocused = false"
                @click="$emit('primary-action')"
              >
                {{ heroPrimaryLabel }}
              </button>
              <div
                v-show="requestTooltipVisible"
                id="public-profile-request-tooltip"
                class="identity-rail__request-tooltip"
                role="tooltip"
              >
                {{ requestTooltipText }}
              </div>
            </div>
            <p id="public-profile-request-helper" class="identity-rail__request-helper">
              {{ requestHelperText }}
            </p>
          </div>
          <button v-else class="btn btn--primary" type="button" @click="$emit('primary-action')">
            {{ heroPrimaryLabel }}
          </button>
          <button v-if="showRequestCta" class="btn btn--ghost" type="button" @click="$emit('request-action')">
            {{ requestCtaLabel }}
          </button>
          <button v-if="showInquiryCta" class="btn btn--ghost" type="button" @click="$emit('inquiry-action')">
            {{ inquiryCtaLabel }}
          </button>
          <RouterLink class="btn btn--ghost" to="/client">
            Мої сесії
          </RouterLink>
        </template>
        <template v-else>
          <div v-if="showRequestExplanation" class="identity-rail__request-action">
            <div
              class="identity-rail__request-control"
              @mouseenter="requestTooltipHovered = true"
              @mouseleave="requestTooltipHovered = false"
            >
              <button
                class="btn btn--primary"
                type="button"
                aria-describedby="public-profile-request-helper public-profile-request-tooltip"
                @focus="requestTooltipFocused = true"
                @blur="requestTooltipFocused = false"
                @click="$emit('primary-action')"
              >
                {{ heroPrimaryLabel }}
              </button>
              <div
                v-show="requestTooltipVisible"
                id="public-profile-request-tooltip"
                class="identity-rail__request-tooltip"
                role="tooltip"
              >
                {{ requestTooltipText }}
              </div>
            </div>
            <p id="public-profile-request-helper" class="identity-rail__request-helper">
              {{ requestHelperText }}
            </p>
          </div>
          <button v-else class="btn btn--primary" type="button" @click="$emit('primary-action')">
            {{ heroPrimaryLabel }}
          </button>
          <button v-if="showRequestCta" class="btn btn--ghost" type="button" @click="$emit('request-action')">
            {{ requestCtaLabel }}
          </button>
          <button v-if="showInquiryCta" class="btn btn--ghost" type="button" @click="$emit('inquiry-action')">
            {{ inquiryCtaLabel }}
          </button>
          <a v-if="showSlotsCta" class="btn btn--ghost" href="#slots">Переглянути вільні вікна</a>
        </template>
      </div>

      <div v-if="showBlogCta || showOwnerReviewsCta" class="identity-rail__context-actions">
        <RouterLink v-if="showBlogCta" class="btn btn--ghost" :to="blogLink">
          Читати мій блог
        </RouterLink>
        <RouterLink v-if="showOwnerReviewsCta" class="btn btn--ghost" to="/cabinet/reviews">
          Мої відгуки
        </RouterLink>
      </div>

      <div v-if="$slots['share-action']" class="identity-rail__share-action">
        <slot name="share-action" />
      </div>

      <section class="identity-rail__contacts" v-if="showContactActions">
        <div class="identity-rail__contacts-title">Мої контакти</div>
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

      <p v-if="primaryActionNextStepCopy && !showRequestExplanation" class="identity-rail__next-step">
        {{ primaryActionNextStepCopy }}
      </p>
    </div>
  </aside>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'

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
  primaryActionNextStepCopy: string
  introPriceDisplay: string
  introDurationLabel: string
  priceDisplay: string
  standardSessionDurationLabel: string
  couplePriceDisplay: string
  coupleDurationLabel: string
  selectedOfferType?: 'standard' | 'intro' | 'couple' | null
  showContactActions: boolean
  contactActions: ContactAction[]
  copiedContactId?: string
  showChatCta?: boolean
  chatCtaLabel?: string
  showRequestCta?: boolean
  requestCtaLabel?: string
  showRequestExplanation?: boolean
  requestHelperText?: string
  requestTooltipText?: string
  showSlotsCta?: boolean
  showInquiryCta?: boolean
  inquiryCtaLabel?: string
  showOwnerReviewsCta?: boolean
  showBlogCta?: boolean
  blogLink?: string | Record<string, unknown>
}

withDefaults(defineProps<Props>(), {
  showChatCta: false,
  copiedContactId: '',
  chatCtaLabel: 'Написати в чат',
  showRequestCta: false,
  requestCtaLabel: 'Залишити запит',
  showRequestExplanation: false,
  requestHelperText: '',
  requestTooltipText: '',
  showSlotsCta: false,
  showInquiryCta: false,
  inquiryCtaLabel: 'Поставити питання перед записом',
  showOwnerReviewsCta: false,
  showBlogCta: false,
  blogLink: '',
  selectedOfferType: null,
})

const requestTooltipHovered = ref(false)
const requestTooltipFocused = ref(false)
const requestTooltipVisible = computed(
  () => requestTooltipHovered.value || requestTooltipFocused.value
)

defineEmits<{
  (event: 'primary-action'): void
  (event: 'chat-action'): void
  (event: 'request-action'): void
  (event: 'inquiry-action'): void
  (event: 'copy-contact-action', item: ContactAction): void
  (event: 'select-offer', offerType: 'standard' | 'intro' | 'couple'): void
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
  width: 100%;
  text-align: left;
  padding: 10px 11px;
  border-radius: 12px;
  border: 1px solid var(--pc-border);
  background: var(--pc-bg-card);
  display: grid;
  gap: 3px;
  cursor: pointer;
  font: inherit;
  transition:
    border-color 0.18s ease,
    box-shadow 0.18s ease,
    transform 0.18s ease;
}

.identity-rail__service:hover,
.identity-rail__service:focus-visible {
  border-color: color-mix(in srgb, var(--pc-navy-700) 42%, var(--pc-border));
  box-shadow: 0 0 0 3px color-mix(in srgb, var(--pc-teal-200) 44%, transparent);
}

.identity-rail__service--active {
  border-color: var(--pc-navy-800);
  box-shadow: inset 3px 0 0 var(--pc-navy-800);
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

.identity-rail__service--couple {
  border-color: color-mix(in srgb, var(--pc-peach-500) 44%, var(--pc-border));
  background: color-mix(in srgb, var(--pc-bg-card) 84%, var(--pc-peach-100));
}

.identity-rail__actions {
  display: grid;
  gap: 8px;
}

.identity-rail__context-actions {
  display: grid;
  gap: 8px;
  padding-top: 12px;
  border-top: 1px solid color-mix(in srgb, var(--line) 82%, #ffffff);
}

.identity-rail__share-action {
  display: grid;
  min-width: 0;
}

.identity-rail__share-action :slotted(.public-profile-share-cta) {
  box-sizing: border-box;
  width: 100%;
  min-width: 0;
  min-height: 40px;
  gap: 8px;
  border: 1.5px solid var(--pc-navy-800);
  border-radius: var(--radius-md);
  background: #ffffff;
  box-shadow: 0 4px 10px rgba(18, 52, 90, 0.08);
  color: var(--pc-navy-900);
  font-weight: 700;
  white-space: normal;
}

.identity-rail__share-action :slotted(.public-profile-share-cta:hover) {
  border-color: var(--pc-navy-950);
  background: color-mix(in srgb, var(--pc-navy-900) 7%, #ffffff);
  box-shadow: 0 6px 14px rgba(18, 52, 90, 0.14);
  color: var(--pc-navy-950);
}

.identity-rail__share-action :slotted(.public-profile-share-cta:active) {
  border-color: var(--pc-navy-950);
  background: color-mix(in srgb, var(--pc-navy-900) 12%, #ffffff);
  box-shadow: 0 2px 6px rgba(18, 52, 90, 0.12);
  transform: translateY(0);
}

.identity-rail__share-action :slotted(.public-profile-share-cta:focus-visible) {
  border-color: var(--pc-navy-950);
  outline: 3px solid color-mix(in srgb, var(--pc-navy-800) 28%, transparent);
  outline-offset: 2px;
}

.identity-rail__actions .btn {
  width: 100%;
}

.identity-rail__request-action {
  display: grid;
  gap: 7px;
}

.identity-rail__request-control {
  position: relative;
}

.identity-rail__request-helper {
  margin: 0;
  font-size: 11px;
  line-height: 1.45;
  color: var(--pc-text-muted);
}

.identity-rail__request-tooltip {
  position: absolute;
  z-index: 4;
  right: 0;
  bottom: calc(100% + 8px);
  left: 0;
  padding: 9px 10px;
  border: 1px solid color-mix(in srgb, var(--pc-navy-900) 20%, var(--pc-border));
  border-radius: 10px;
  background: var(--pc-navy-950);
  box-shadow: var(--pc-shadow-soft);
  color: #fff;
  font-size: 11px;
  line-height: 1.45;
  pointer-events: none;
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
