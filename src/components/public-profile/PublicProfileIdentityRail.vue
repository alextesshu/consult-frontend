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
        <button class="btn btn--primary" type="button" @click="$emit('primary-action')">
          {{ heroPrimaryLabel }}
        </button>
        <RouterLink
          v-if="showClientSessionsCta"
          class="btn btn--ghost"
          to="/client"
        >
          Мої сесії
        </RouterLink>
        <a v-else class="btn btn--ghost" href="#slots">Переглянути вільні вікна</a>
        <RouterLink class="btn btn--ghost" :to="feedbackLink">Відгуки</RouterLink>
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
  border: 1px solid color-mix(in srgb, var(--line) 64%, #ffffff);
  background: linear-gradient(
    160deg,
    color-mix(in srgb, #ffffff 95%, var(--surface)),
    color-mix(in srgb, #f7f3ea 46%, #ffffff)
  );
  border-radius: var(--radius-md);
  padding: 14px;
  box-shadow: 0 14px 36px rgba(17, 30, 40, 0.12);
}

.identity-rail__title {
  margin: 0;
  font-size: 20px;
  line-height: 1.25;
}

.identity-rail__prices {
  display: grid;
  gap: 8px;
}

.identity-rail__price {
  padding: 8px 10px;
  border-radius: 10px;
  border: 1px solid var(--line);
  background: #fff;
  font-size: 13px;
  font-weight: 600;
}

.identity-rail__price--intro {
  border-color: color-mix(in srgb, var(--color-primary-500) 20%, var(--line));
}

.identity-rail__actions {
  display: grid;
  gap: 8px;
}

.identity-rail__actions .btn {
  width: 100%;
}

.identity-rail__next-step {
  margin: 0;
  font-size: 12px;
  line-height: 1.45;
  color: color-mix(in srgb, var(--text) 78%, var(--muted));
}

.identity-rail__contacts {
  display: grid;
  gap: 6px;
  border-top: 1px dashed color-mix(in srgb, var(--line) 82%, #d8cfbf);
  padding-top: 8px;
}

.identity-rail__contacts-title {
  font-size: 12px;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  font-weight: 700;
  color: color-mix(in srgb, var(--text) 82%, var(--muted));
}

.identity-rail__contact-list {
  display: grid;
  gap: 6px;
}

.identity-rail__contact {
  border: 1px solid var(--line);
  border-radius: 10px;
  padding: 6px 8px;
  display: grid;
  gap: 2px;
  text-decoration: none;
  color: inherit;
  background: #fff;
}

.identity-rail__contact:hover {
  border-color: color-mix(in srgb, var(--primary) 28%, var(--line));
}

.identity-rail__contact-label {
  font-size: 10px;
  text-transform: uppercase;
  letter-spacing: 0.07em;
  color: var(--muted);
}

.identity-rail__contact-value {
  font-size: 12px;
  font-weight: 600;
  overflow-wrap: anywhere;
}

.badge--soft {
  background: color-mix(in srgb, #e4e9dc 62%, #f8f3e9);
  border-color: color-mix(in srgb, #6f8b73 26%, var(--line));
  color: color-mix(in srgb, #3f5945 82%, var(--text));
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
    box-shadow: 0 8px 20px rgba(17, 30, 40, 0.1);
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
