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

      <p class="identity-rail__next-step">{{ primaryActionNextStepCopy }}</p>
    </div>
  </aside>
</template>

<script setup lang="ts">
type PublicProfileMedia = {
  photo_url?: string | null
  video_url?: string | null
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
}

defineProps<Props>()

defineEmits<{
  (event: 'primary-action'): void
}>()
</script>

<style scoped>
.identity-rail {
  position: sticky;
  top: 20px;
  align-self: start;
  max-height: calc(100vh - 40px);
  overflow: auto;
  scrollbar-gutter: stable both-edges;
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

.badge--soft {
  background: color-mix(in srgb, #e4e9dc 62%, #f8f3e9);
  border-color: color-mix(in srgb, #6f8b73 26%, var(--line));
  color: color-mix(in srgb, #3f5945 82%, var(--text));
}

@media (max-width: 1260px) {
  .identity-rail {
    position: static;
    max-height: none;
    overflow: visible;
  }

  .identity-rail__card {
    padding: 12px;
    gap: 10px;
  }
}
</style>
