<template>
  <aside v-if="profile" class="identity-rail">
    <div class="identity-rail__card">
      <div class="badge badge--soft">Швидкий огляд</div>
      <h2 class="identity-rail__title">{{ heroCtaTitle }}</h2>

      <div class="identity-rail__prices" v-if="introPriceDisplay || priceDisplay">
        <div v-if="introPriceDisplay" class="identity-rail__price identity-rail__price--intro">
          Ознайомча сесія: {{ introPriceDisplay }}
          <span v-if="introDurationLabel">· {{ introDurationLabel }}</span>
        </div>
        <div v-if="priceDisplay" class="identity-rail__price">
          Консультація: {{ priceDisplay }}
          <span> · {{ standardSessionDurationLabel }}</span>
        </div>
      </div>

      <div class="identity-rail__actions">
        <template v-if="showClientSessionsCta">
          <a class="btn btn--primary" href="#slots">Записатися на сесію</a>
          <button class="btn btn--ghost" type="button" @click="$emit('primary-action')">
            {{ heroPrimaryLabel }}
          </button>
          <RouterLink class="btn btn--ghost" to="/client">
            Мої сесії
          </RouterLink>
        </template>
        <template v-else>
          <button class="btn btn--primary" type="button" @click="$emit('primary-action')">
            {{ heroPrimaryLabel }}
          </button>
          <a class="btn btn--ghost" href="#slots">Переглянути вільні вікна</a>
          <RouterLink class="btn btn--ghost" :to="feedbackLink">Відгуки</RouterLink>
        </template>
      </div>

      <section class="identity-rail__contacts" v-if="showContactActions">
        <div class="identity-rail__contacts-title">Зв’язок зі спеціалістом</div>
        <div class="identity-rail__contact-list">
          <a
            v-for="item in contactActions"
            :key="item.id"
            class="identity-rail__contact"
            :href="item.actionUrl"
            target="_blank"
            rel="noopener noreferrer"
            @click.prevent="$emit('direct-contact-action', item)"
          >
            <span class="identity-rail__contact-label">{{ item.channelLabel }}</span>
            <span class="identity-rail__contact-value">{{ item.valueText }}</span>
          </a>
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
}

defineProps<Props>()

defineEmits<{
  (event: 'primary-action'): void
  (event: 'direct-contact-action', item: ContactAction): void
}>()
</script>

<style scoped>
.identity-rail {
  position: relative;
  align-self: start;
}

.identity-rail__card {
  display: grid;
  gap: 12px;
  border: 1px solid var(--pc-border);
  background: linear-gradient(
    160deg,
    color-mix(in srgb, var(--pc-bg-card) 94%, var(--pc-teal-100)),
    color-mix(in srgb, var(--pc-bg-card) 88%, var(--pc-peach-100))
  );
  border-radius: var(--radius-xl);
  padding: 16px;
  box-shadow: var(--pc-shadow-card);
  color: var(--pc-text-main);
}

.identity-rail__title {
  margin: 0;
  font-size: 20px;
  line-height: 1.25;
  color: var(--pc-navy-950);
  letter-spacing: 0;
}

.identity-rail__prices {
  display: grid;
  gap: 8px;
}

.identity-rail__price {
  padding: 8px 10px;
  border-radius: 10px;
  border: 1px solid var(--pc-border);
  background: var(--pc-bg-card);
  font-size: 13px;
  font-weight: 600;
  color: var(--pc-navy-900);
}

.identity-rail__price--intro {
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
  font-size: 12px;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  font-weight: 700;
  color: color-mix(in srgb, var(--pc-navy-900) 82%, var(--pc-text-muted));
}

.identity-rail__contact-list {
  display: grid;
  gap: 6px;
}

.identity-rail__contact {
  border: 1px solid var(--pc-border);
  border-radius: 10px;
  padding: 6px 8px;
  display: grid;
  gap: 2px;
  text-decoration: none;
  color: inherit;
  background: var(--pc-bg-card);
}

.identity-rail__contact:hover {
  border-color: color-mix(in srgb, var(--pc-teal-500) 44%, var(--pc-border));
}

.identity-rail__contact-label {
  font-size: 10px;
  text-transform: uppercase;
  letter-spacing: 0.07em;
  color: var(--pc-text-muted);
}

.identity-rail__contact-value {
  font-size: 12px;
  font-weight: 600;
  overflow-wrap: anywhere;
  color: var(--pc-navy-950);
}

.badge--soft {
  width: fit-content;
  background: color-mix(in srgb, var(--pc-peach-100) 74%, var(--pc-bg-card));
  border-color: color-mix(in srgb, var(--pc-peach-500) 32%, var(--pc-border));
  color: var(--pc-navy-900);
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
    padding: 10px 12px;
    gap: 8px;
    box-shadow: var(--pc-shadow-soft);
  }

  .identity-rail__title {
    font-size: 18px;
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
