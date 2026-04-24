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
        <video
          v-if="profile.video_url"
          class="hero-video"
          :src="profile.video_url"
          controls
          preload="metadata"
        ></video>
      </div>

      <div class="hero-main">
        <div class="badge">Профіль спеціаліста</div>
        <h1 class="title public__title">{{ publicName || 'Профіль спеціаліста' }}</h1>
        <p v-if="profile && heroRoleLine" class="hero-main__role">{{ heroRoleLine }}</p>
        <p class="hero-main__lead hero-main__lead--teaser">{{ profile ? heroLeadText : 'Завантаження профілю' }}</p>
        <button
          v-if="profile && showReadMore"
          type="button"
          class="hero-main__read-more"
          @click="emit('read-more')"
        >
          Читати далі
        </button>
        <p v-if="profile && heroSupportText" class="hero-main__support">{{ heroSupportText }}</p>
        <p v-if="profile && completedSessionsBadge" class="hero-main__sessions">
          Проведено сесій: {{ completedSessionsBadge }}
        </p>

        <div v-if="profile && displaySpecializationChips.length" class="hero-trust">
          <span v-for="(chip, index) in displaySpecializationChips" :key="`${chip}-${index}`">{{ chip }}</span>
        </div>
      </div>

      <aside v-if="profile && generalInfoItems.length" class="hero-info" aria-label="Загальна інформація">
        <div class="badge badge--soft">Загальна інформація</div>
        <ul class="hero-info__list">
          <li v-for="(item, index) in generalInfoItems" :key="`${item.label}-${index}`" class="hero-info__item">
            <span class="hero-info__label">{{ item.label }}</span>
            <span class="hero-info__value">{{ item.value }}</span>
          </li>
        </ul>
      </aside>
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
  showReadMore: boolean
  completedSessionsBadge: string | null
  displaySpecializationChips: string[]
  generalInfoItems: HeroInfoItem[]
}

defineProps<Props>()
const emit = defineEmits<{
  (event: 'read-more'): void
}>()
</script>

<style scoped>
.public-profile-hero {
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  align-items: start;
  gap: 16px;
  background: linear-gradient(
    145deg,
    color-mix(in srgb, var(--pc-bg-card) 88%, var(--pc-teal-100)),
    color-mix(in srgb, var(--pc-bg-card) 82%, var(--pc-peach-100))
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
  gap: 16px;
  width: 100%;
  min-width: 0;
}

.hero-media {
  flex: 0 0 clamp(180px, 24vw, 280px);
  width: 100%;
  max-width: 280px;
  min-width: 180px;
  display: grid;
  gap: 12px;
  align-content: start;
}

.hero-photo {
  width: 100%;
  aspect-ratio: 1 / 1;
  object-fit: cover;
  border-radius: 16px;
  border: 1px solid var(--pc-border);
  background: var(--pc-bg-card);
  box-shadow: var(--pc-shadow-soft);
}

.hero-photo-placeholder {
  width: 100%;
  aspect-ratio: 1 / 1;
  border-radius: 16px;
  border: 1px dashed var(--pc-border-strong);
  display: grid;
  place-items: center;
  font-size: 12px;
  color: var(--pc-text-muted);
  background: color-mix(in srgb, var(--pc-bg-card) 78%, var(--pc-bg-soft));
}

.hero-video {
  width: 100%;
  border-radius: 12px;
  border: 1px solid var(--pc-border);
  background: var(--pc-navy-950);
}

.public__title {
  font-size: clamp(30px, 4vw, 40px);
  line-height: 1.15;
  color: var(--pc-navy-950);
  letter-spacing: 0;
}

.hero-main {
  flex: 1 1 auto;
  display: grid;
  gap: 12px;
  align-content: start;
  min-width: 0;
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

.hero-main__read-more {
  justify-self: start;
  margin-top: -6px;
  border: none;
  background: transparent;
  padding: 0;
  font-size: 13px;
  line-height: 1.35;
  font-weight: 600;
  color: var(--pc-navy-900);
  text-decoration: underline;
  text-underline-offset: 2px;
  cursor: pointer;
}

.hero-main__read-more:hover {
  color: var(--pc-navy-950);
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

.hero-trust {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.hero-trust span {
  padding: 6px 10px;
  border-radius: 10px;
  background: color-mix(in srgb, var(--pc-bg-card) 86%, var(--pc-teal-100));
  border: 1px solid var(--pc-border);
  font-size: 12px;
  color: var(--pc-navy-900);
}

.hero-info {
  flex: 0 0 clamp(156px, 16vw, 188px);
  width: clamp(156px, 16vw, 188px);
  max-width: 188px;
  min-width: 156px;
  border: 1px solid var(--pc-border);
  border-radius: 14px;
  background: color-mix(in srgb, var(--pc-bg-card) 88%, var(--pc-bg-soft));
  padding: 12px;
  display: grid;
  gap: 10px;
  align-content: start;
  min-width: 0;
}

.hero-info__list {
  margin: 0;
  padding: 0;
  list-style: none;
  display: grid;
  gap: 8px;
}

.hero-info__item {
  border: 1px solid var(--pc-border);
  border-radius: 10px;
  background: var(--pc-bg-card);
  padding: 8px 10px;
  display: grid;
  gap: 2px;
}

.hero-info__label {
  font-size: 10px;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: var(--pc-text-muted);
}

.hero-info__value {
  font-size: 13px;
  line-height: 1.35;
  font-weight: 600;
  color: var(--pc-navy-950);
  overflow-wrap: anywhere;
}

.badge {
  width: fit-content;
  border-color: color-mix(in srgb, var(--pc-teal-500) 34%, var(--pc-border));
  background: color-mix(in srgb, var(--pc-teal-100) 72%, var(--pc-bg-card));
  color: var(--pc-navy-900);
}

.badge--soft {
  border-color: color-mix(in srgb, var(--pc-peach-500) 30%, var(--pc-border));
  background: color-mix(in srgb, var(--pc-peach-100) 72%, var(--pc-bg-card));
  color: var(--pc-navy-900);
}

@media (max-width: 1120px) {
  .hero-profile {
    display: grid;
    grid-template-columns: minmax(190px, 260px) minmax(0, 1fr);
  }

  .hero-media {
    max-width: 260px;
    min-width: 0;
    flex: none;
  }

  .hero-info {
    grid-column: 1 / -1;
    width: 100%;
    max-width: none;
    min-width: 0;
    flex: none;
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
</style>
