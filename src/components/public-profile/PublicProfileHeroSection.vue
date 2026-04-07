<template>
  <header class="public__hero">
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
        <p class="hero-main__lead">{{ profile ? heroLeadText : 'Завантаження профілю' }}</p>
        <p v-if="profile && heroSupportText" class="hero-main__support">{{ heroSupportText }}</p>
        <p v-if="profile && completedSessionsBadge" class="hero-main__sessions">
          Проведено сесій: {{ completedSessionsBadge }}
        </p>

        <div v-if="profile && displaySpecializationChips.length" class="hero-trust">
          <span v-for="(chip, index) in displaySpecializationChips" :key="`${chip}-${index}`">{{ chip }}</span>
        </div>
      </div>
    </div>
  </header>
</template>

<script setup lang="ts">
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
}

defineProps<Props>()
</script>

<style scoped>
.public__hero {
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  align-items: start;
  gap: 16px;
  background: linear-gradient(
    140deg,
    color-mix(in srgb, var(--color-primary-100) 65%, #ffffff),
    color-mix(in srgb, var(--color-neutral-100) 52%, #ffffff)
  );
  border: 1px solid var(--line);
  border-radius: var(--radius);
  padding: 20px 22px;
  box-shadow: var(--shadow);
}

.hero-profile {
  display: grid;
  grid-template-columns: minmax(156px, 196px) minmax(0, 1fr);
  gap: 16px;
  min-width: 0;
}

.hero-media {
  width: 100%;
  max-width: 196px;
  display: grid;
  gap: 10px;
  align-content: start;
}

.hero-photo {
  width: 100%;
  aspect-ratio: 1 / 1;
  object-fit: cover;
  border-radius: 16px;
  border: 1px solid var(--line);
  background: #fff;
}

.hero-photo-placeholder {
  width: 100%;
  aspect-ratio: 1 / 1;
  border-radius: 16px;
  border: 1px dashed var(--line);
  display: grid;
  place-items: center;
  font-size: 12px;
  color: var(--muted);
  background: rgba(255, 255, 255, 0.65);
}

.hero-video {
  width: 100%;
  border-radius: 12px;
  border: 1px solid var(--line);
  background: #0f2b3a;
}

.public__title {
  font-size: clamp(30px, 4vw, 40px);
  line-height: 1.15;
}

.hero-main {
  display: grid;
  gap: 12px;
  align-content: start;
  min-width: 0;
}

.hero-main__role {
  margin: -2px 0 0;
  font-size: 14px;
  color: color-mix(in srgb, var(--text) 72%, var(--muted));
  font-weight: 600;
}

.hero-main__lead {
  margin: 0;
  font-size: 16px;
  line-height: 1.66;
  color: var(--deep);
  max-width: 72ch;
}

.hero-main__support {
  margin: -4px 0 0;
  font-size: 14px;
  line-height: 1.6;
  color: var(--muted);
}

.hero-main__sessions {
  margin: -2px 0 0;
  font-size: 14px;
  line-height: 1.5;
  font-weight: 600;
  color: color-mix(in srgb, var(--text) 86%, var(--muted));
}

.hero-trust {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.hero-trust span {
  padding: 6px 10px;
  border-radius: 10px;
  background: rgba(255, 255, 255, 0.82);
  border: 1px solid var(--line);
  font-size: 12px;
}

@media (max-width: 960px) {
  .hero-profile {
    grid-template-columns: 1fr;
  }

  .hero-media {
    width: 100%;
    max-width: 280px;
  }

  .hero-main {
    width: 100%;
  }
}
</style>
