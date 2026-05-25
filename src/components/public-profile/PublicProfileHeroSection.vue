<template>
  <header class="public-profile-hero">
    <div class="hero-profile">
      <div class="hero-media" v-if="profile">
        <img
          v-if="profile.photo_url"
          class="hero-photo"
          :src="profile.photo_url"
          alt="Фото спеціаліста"
        />
        <div v-else class="hero-photo-placeholder">Фото спеціаліста</div>
        <button
          v-if="profile.video_url"
          class="hero-video-button"
          type="button"
          aria-label="Відеовізитка"
          @click="emit('video-action')"
        >
          <span class="hero-video-button__icon" aria-hidden="true">
            <svg viewBox="0 0 20 20" focusable="false">
              <path d="M7 5.5v9l7-4.5-7-4.5Z" />
            </svg>
          </span>
          <span>Відеовізитка</span>
        </button>
      </div>

      <div class="hero-main">
        <h1 class="title public__title">{{ publicName || 'Профіль спеціаліста' }}</h1>
        <p v-if="profile && heroRoleLine" class="hero-main__role">{{ heroRoleLine }}</p>
        <p class="hero-main__lead hero-main__lead--teaser">{{ profile ? heroLeadText : 'Завантаження профілю' }}</p>
        <section v-if="profile && displaySpecializationChips.length" class="hero-section" aria-label="Спеціалізації">
          <h2 class="hero-section__title">Спеціалізації</h2>
          <div class="hero-trust">
            <span v-for="(chip, index) in displaySpecializationChips" :key="`${chip}-${index}`">{{ chip }}</span>
          </div>
        </section>

        <section v-if="profile && generalInfoItems.length" class="hero-section hero-info" aria-label="Загальна інформація">
          <h2 class="hero-section__title">Загальна інформація</h2>
          <ul class="hero-info__list">
            <li v-for="(item, index) in generalInfoItems" :key="`${item.label}-${index}`" class="hero-info__item">
              <span class="hero-info__icon" aria-hidden="true">●</span>
              <span class="hero-info__meta">
                <span class="hero-info__label">{{ item.label }}</span>
                <span class="hero-info__value">{{ item.value }}</span>
              </span>
            </li>
          </ul>
        </section>

        <p v-if="profile && heroSupportText" class="hero-main__support">{{ heroSupportText }}</p>
        <p v-if="profile && completedSessionsBadge" class="hero-main__sessions">
          Проведено сесій: {{ completedSessionsBadge }}
        </p>
      </div>
    </div>
  </header>
</template>

<script setup lang="ts">
type HeroInfoItem = {
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
  heroLeadText: string
  heroSupportText: string
  completedSessionsBadge: string | null
  displaySpecializationChips: string[]
  generalInfoItems: HeroInfoItem[]
}

defineProps<Props>()
const emit = defineEmits<{
  (event: 'video-action'): void
}>()
</script>

<style scoped>
.public-profile-hero {
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  align-items: start;
  gap: 18px;
  background: linear-gradient(
    155deg,
    color-mix(in srgb, var(--pc-bg-card) 94%, var(--pc-teal-100)),
    color-mix(in srgb, var(--pc-bg-card) 88%, var(--pc-peach-100))
  );
  border: 1px solid var(--pc-border);
  border-radius: var(--radius-xl);
  padding: clamp(18px, 2.2vw, 28px);
  box-shadow: var(--pc-shadow-card);
  color: var(--pc-text-main);
}

.hero-profile {
  display: flex;
  align-items: flex-start;
  gap: clamp(18px, 2.2vw, 26px);
  width: 100%;
  min-width: 0;
}

.hero-media {
  flex: 0 0 clamp(190px, 22vw, 270px);
  width: 100%;
  max-width: 270px;
  min-width: 190px;
  display: grid;
  gap: 12px;
  align-content: start;
}

.hero-photo {
  width: 100%;
  aspect-ratio: 4 / 5;
  object-fit: cover;
  border-radius: 16px;
  border: 1px solid var(--pc-border);
  background: var(--pc-bg-card);
  box-shadow: var(--pc-shadow-soft);
}

.hero-photo-placeholder {
  width: 100%;
  aspect-ratio: 4 / 5;
  border-radius: 16px;
  border: 1px dashed var(--pc-border-strong);
  display: grid;
  place-items: center;
  font-size: 12px;
  color: var(--pc-text-muted);
  background: color-mix(in srgb, var(--pc-bg-card) 78%, var(--pc-bg-soft));
}

.hero-video-button {
  width: 100%;
  min-height: 46px;
  border: 1px solid var(--pc-navy-950);
  border-radius: 12px;
  padding: 0 16px;
  background: var(--pc-navy-950);
  color: #fff;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 9px;
  font-weight: 700;
  font-size: 15px;
  line-height: 1;
  cursor: pointer;
  box-shadow: 0 14px 28px rgba(14, 45, 82, 0.18);
  transition:
    background-color 0.16s ease,
    border-color 0.16s ease,
    transform 0.16s ease,
    box-shadow 0.16s ease;
}

.hero-video-button:hover,
.hero-video-button:focus-visible {
  border-color: var(--pc-navy-800);
  background: var(--pc-navy-800);
  box-shadow: 0 16px 30px rgba(14, 45, 82, 0.22);
}

.hero-video-button:active {
  transform: translateY(1px);
}

.hero-video-button__icon {
  width: 24px;
  height: 24px;
  border: 1px solid color-mix(in srgb, #fff 72%, transparent);
  border-radius: 999px;
  display: inline-grid;
  place-items: center;
  flex: 0 0 auto;
}

.hero-video-button__icon svg {
  width: 14px;
  height: 14px;
  fill: currentColor;
}

.hero-video-button__icon path {
  transform: translateX(1px);
  transform-origin: center;
}

.public__title {
  font-size: clamp(30px, 4vw, 40px);
  line-height: 1.15;
  color: var(--pc-navy-950);
  letter-spacing: 0;
  max-width: 100%;
  min-width: 0;
  white-space: normal;
  overflow-wrap: anywhere;
}

.hero-main {
  flex: 1 1 auto;
  display: grid;
  gap: 10px;
  align-content: start;
  min-width: 0;
  max-width: 100%;
}

.hero-main__role {
  margin: -2px 0 0;
  font-size: 14px;
  color: color-mix(in srgb, var(--pc-navy-900) 70%, var(--pc-text-muted));
  font-weight: 600;
}

.hero-main__lead {
  margin: 0;
  font-size: 16px;
  line-height: 1.66;
  color: var(--pc-text-main);
  max-width: 70ch;
}

.hero-main__lead--teaser {
  display: -webkit-box;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 3;
  line-clamp: 3;
  overflow: hidden;
}

.hero-main__support {
  margin: -4px 0 0;
  font-size: 14px;
  line-height: 1.6;
  color: var(--pc-text-muted);
}

.hero-main__sessions {
  margin: -2px 0 0;
  font-size: 14px;
  line-height: 1.5;
  font-weight: 600;
  color: color-mix(in srgb, var(--pc-navy-950) 84%, var(--pc-text-muted));
}

.hero-section {
  display: grid;
  gap: 6px;
  padding-top: 2px;
}

.hero-section__title {
  margin: 0;
  font-size: 11px;
  line-height: 1.2;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  font-weight: 800;
  color: color-mix(in srgb, var(--pc-navy-900) 76%, var(--pc-text-muted));
}

.hero-trust {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.hero-trust span {
  padding: 5px 9px;
  border-radius: 10px;
  background: color-mix(in srgb, var(--pc-bg-card) 88%, var(--pc-teal-100));
  border: 1px solid var(--pc-border);
  font-size: 11px;
  color: var(--pc-navy-900);
}

.hero-info {
  margin-top: 0;
}

.hero-info__list {
  margin: 0;
  padding: 0;
  list-style: none;
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 7px;
}

.hero-info__item {
  border: 1px solid var(--pc-border);
  border-radius: 10px;
  background: color-mix(in srgb, var(--pc-bg-card) 92%, var(--pc-bg-soft));
  padding: 7px 8px;
  display: grid;
  grid-template-columns: 20px minmax(0, 1fr);
  align-items: start;
  gap: 6px;
  min-width: 0;
}

.hero-info__icon {
  width: 20px;
  height: 20px;
  border-radius: 7px;
  display: grid;
  place-items: center;
  background: color-mix(in srgb, var(--pc-teal-100) 74%, var(--pc-bg-card));
  color: var(--pc-teal-600);
  font-size: 7px;
  line-height: 1;
}

.hero-info__meta {
  display: grid;
  gap: 1px;
}

.hero-info__label {
  font-size: 9px;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: var(--pc-text-muted);
}

.hero-info__value {
  font-size: 12px;
  line-height: 1.28;
  font-weight: 600;
  color: var(--pc-navy-950);
  overflow-wrap: anywhere;
}

@media (max-width: 1280px) {
  .hero-profile {
    display: grid;
    grid-template-columns: minmax(170px, 240px) minmax(0, 1fr);
  }

  .hero-media {
    max-width: 240px;
    min-width: 0;
    flex: none;
  }

  .hero-info__list {
    grid-template-columns: repeat(auto-fit, minmax(170px, 1fr));
  }
}

@media (max-width: 960px) {
  .hero-profile {
    grid-template-columns: 1fr;
  }

  .hero-media {
    width: 100%;
    max-width: 340px;
  }

  .hero-main {
    width: 100%;
  }

  .hero-main__lead--teaser {
    -webkit-line-clamp: 4;
    line-clamp: 4;
  }
}

@media (min-width: 700px) and (max-width: 1099px) {
  .hero-profile {
    display: grid;
    grid-template-columns: minmax(210px, 32%) minmax(0, 1fr);
    align-items: start;
    gap: clamp(16px, 2.4vw, 24px);
  }

  .hero-media {
    width: 100%;
    max-width: 260px;
    min-width: 0;
  }

  .hero-main {
    width: 100%;
  }

  .hero-info__list {
    grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  }
}

@media (max-width: 1024px) and (max-height: 560px) {
  .public-profile-hero {
    padding: 14px;
  }

  .hero-profile {
    display: grid;
    grid-template-columns: minmax(132px, 180px) minmax(0, 1fr);
    align-items: start;
    gap: 14px;
  }

  .hero-media {
    width: 100%;
    max-width: 180px;
    min-width: 0;
    gap: 8px;
  }

  .hero-photo,
  .hero-photo-placeholder {
    border-radius: 14px;
  }

  .hero-video-button {
    min-height: 38px;
    border-radius: 10px;
    padding: 0 10px;
    gap: 7px;
    font-size: 13px;
  }

  .hero-video-button__icon {
    width: 20px;
    height: 20px;
  }

  .hero-video-button__icon svg {
    width: 12px;
    height: 12px;
  }

  .public__title {
    font-size: clamp(24px, 4vw, 32px);
    line-height: 1.08;
  }

  .hero-main {
    width: 100%;
    gap: 7px;
  }

  .hero-main__role {
    font-size: 13px;
    line-height: 1.3;
  }

  .hero-main__lead {
    font-size: 14px;
    line-height: 1.45;
  }

  .hero-main__lead--teaser {
    -webkit-line-clamp: 2;
    line-clamp: 2;
  }

  .hero-section {
    gap: 5px;
    padding-top: 0;
  }

  .hero-trust {
    gap: 5px;
  }

  .hero-trust span {
    padding: 4px 7px;
  }

  .hero-info__list {
    grid-template-columns: repeat(auto-fit, minmax(132px, 1fr));
    gap: 5px;
  }

  .hero-info__item {
    grid-template-columns: 18px minmax(0, 1fr);
    gap: 5px;
    padding: 5px 6px;
    border-radius: 9px;
  }

  .hero-info__icon {
    width: 18px;
    height: 18px;
    border-radius: 6px;
  }

  .hero-info__label {
    font-size: 8px;
  }

  .hero-info__value {
    font-size: 11px;
    line-height: 1.22;
  }
}
</style>
