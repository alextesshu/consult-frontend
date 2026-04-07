<template>
  <aside v-if="profile" class="identity-rail">
    <div class="identity-rail__card">
      <div class="badge badge--soft">Швидкий огляд</div>
      <h2 class="identity-rail__title">{{ heroCtaTitle }}</h2>
      <p v-if="publicName" class="identity-rail__name">{{ publicName }}</p>
      <p v-if="heroRoleLine" class="identity-rail__role">{{ heroRoleLine }}</p>

      <div class="identity-rail__signals">
        <article
          v-for="item in identityTrustItems"
          :key="item.label"
          class="identity-rail__signal"
        >
          <div class="identity-rail__signal-label">{{ item.label }}</div>
          <div class="identity-rail__signal-value">{{ item.value }}</div>
        </article>
      </div>

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

      <p class="identity-rail__next-step">{{ primaryActionNextStepCopy }}</p>
      <ul class="identity-rail__trust-list">
        <li v-for="marker in displayedTrustMarkers" :key="marker">{{ marker }}</li>
      </ul>
    </div>
  </aside>
</template>

<script setup lang="ts">
import { computed } from 'vue'

type IdentityTrustItem = {
  label: string
  value: string
}

type PublicProfileMedia = {
  photo_url?: string | null
  video_url?: string | null
}

type Props = {
  profile: PublicProfileMedia | null
  publicName: string
  heroRoleLine: string
  heroCtaTitle: string
  heroPrimaryLabel: string
  showClientSessionsCta: boolean
  feedbackLink: string | Record<string, unknown>
  primaryActionNextStepCopy: string
  heroTrustMarkers: string[]
  identityTrustItems: IdentityTrustItem[]
  introPriceDisplay: string
  introDurationLabel: string
  priceDisplay: string
  standardSessionDurationLabel: string
}

const props = defineProps<Props>()

defineEmits<{
  (event: 'primary-action'): void
}>()

const displayedTrustMarkers = computed(() => props.heroTrustMarkers.slice(0, 3))
</script>

<style scoped>
.identity-rail {
  position: sticky;
  top: 16px;
  align-self: start;
}

.identity-rail__card {
  display: grid;
  gap: 12px;
  border: 1px solid color-mix(in srgb, var(--line) 68%, #ffffff);
  background: rgba(255, 255, 255, 0.92);
  border-radius: var(--radius-md);
  padding: 14px;
}

.identity-rail__title {
  margin: 0;
  font-size: 20px;
  line-height: 1.25;
}

.identity-rail__name {
  margin: 0;
  font-size: 17px;
  font-weight: 700;
}

.identity-rail__role {
  margin: -4px 0 0;
  font-size: 13px;
  line-height: 1.45;
  color: var(--muted);
}

.identity-rail__signals {
  display: grid;
  gap: 8px;
}

.identity-rail__signal {
  border: 1px solid var(--line);
  border-radius: 10px;
  padding: 8px 10px;
  background: #fff;
  display: grid;
  gap: 3px;
}

.identity-rail__signal-label {
  font-size: 10px;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: var(--muted);
}

.identity-rail__signal-value {
  font-size: 13px;
  font-weight: 600;
  line-height: 1.35;
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

.identity-rail__trust-list {
  margin: 0;
  padding-left: 16px;
  display: grid;
  gap: 4px;
  font-size: 12px;
  line-height: 1.4;
  color: var(--muted);
}

.badge--soft {
  background: color-mix(in srgb, #e4e9dc 62%, #f8f3e9);
  border-color: color-mix(in srgb, #6f8b73 26%, var(--line));
  color: color-mix(in srgb, #3f5945 82%, var(--text));
}

@media (max-width: 1024px) {
  .identity-rail {
    position: static;
  }

  .identity-rail__card {
    padding: 12px;
    gap: 10px;
  }
}
</style>
