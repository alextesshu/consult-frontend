<template>
  <header class="public-profile-hero">
    <div class="hero-profile">
      <div class="hero-media" v-if="profile">
        <img
          v-if="profile.photo_url && !(uiV2 && photoFailed)"
          class="hero-photo"
          :src="profile.photo_url"
          alt="Фото спеціаліста"
          @error="photoFailed = true"
        />
        <div
          v-else-if="uiV2"
          class="pc2-profile-photo-fallback"
          role="img"
          :aria-label="profile.photo_url ? 'Фото спеціаліста не завантажилося' : 'Фото спеціаліста не додано'"
        >
          <span aria-hidden="true">{{ photoInitials }}</span>
        </div>
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
        <slot name="share-action" />
      </div>

      <div class="hero-main">
        <div class="hero-main__intro">
          <p v-if="uiV2 && profile && heroRoleLine" class="hero-main__role">{{ heroRoleLine }}</p>
          <h1 ref="titleRef" class="title public__title" :style="uiV2 && fittedTitleSize ? { fontSize: `${fittedTitleSize}px` } : undefined"><template v-if="uiV2"><template v-for="(word, index) in titleWords" :key="index"><span class="pc2-profile-name-word">{{ word }}</span>{{ index < titleWords.length - 1 ? ' ' : '' }}</template></template><template v-else>{{ publicName || 'Профіль спеціаліста' }}</template></h1>
          <p v-if="!uiV2 && profile && displayHeroRoleLine" class="hero-main__role">{{ displayHeroRoleLine }}</p>
          <p class="hero-main__lead hero-main__lead--teaser">{{ profile ? heroLeadText : 'Завантаження профілю' }}</p>
          <button
            v-if="profile && showAboutDetails"
            class="hero-main__about-action"
            type="button"
            @click="emit('about-action')"
          >
            Більше про мене
          </button>
        </div>

        <div v-if="profile && (displaySpecializationChips.length || generalInfoItems.length)" class="hero-main__details">
          <section v-if="displaySpecializationChips.length" class="hero-section" aria-label="Мої спеціалізації">
            <h2 class="hero-section__title">Мої спеціалізації</h2>
            <div class="hero-trust">
              <span v-for="(chip, index) in displaySpecializationChips" :key="`${chip}-${index}`">{{ chip }}</span>
            </div>
          </section>

          <section v-if="generalInfoItems.length" class="hero-section hero-info" aria-label="Загальна інформація">
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
        </div>

        <p v-if="profile && heroSupportText" class="hero-main__support">{{ heroSupportText }}</p>
      </div>
    </div>
  </header>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'

type HeroInfoItem = {
  label: string
  value: string
}

type PublicProfileMedia = {
  photo_url?: string | null
  video_url?: string | null
}

type Props = {
  uiV2?: boolean
  profile: PublicProfileMedia | null
  publicName: string
  heroRoleLine: string
  heroLeadText: string
  heroSupportText: string
  displaySpecializationChips: string[]
  generalInfoItems: HeroInfoItem[]
  showAboutDetails: boolean
}

const props = defineProps<Props>()
const emit = defineEmits<{
  (event: 'video-action'): void
  (event: 'about-action'): void
}>()

// UI v2: a missing or broken photo becomes a neutral initials tile instead of the browser's
// broken-image icon. A new photo URL gets a fresh attempt.
const photoFailed = ref(false)
watch(() => props.profile?.photo_url, () => { photoFailed.value = false })
const photoInitials = computed(() =>
  (props.publicName || '')
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word.charAt(0).toLocaleUpperCase('uk-UA'))
    .join('')
)

// Keep complete name words while preserving the source size whenever they fit.
const titleRef = ref<HTMLElement | null>(null)
const fittedTitleSize = ref<number | null>(null)
const titleWords = computed(() => (props.publicName || 'Профіль спеціаліста').split(/\s+/))
let titleObserver: ResizeObserver | undefined
let titleDisposed = false
function fitTitleWords() {
  const title = titleRef.value
  if (titleDisposed || !props.uiV2 || !title || !title.clientWidth) return
  const sourceSize = window.innerWidth < 860 ? 34 : Math.min(60, Math.max(40, window.innerWidth * .046))
  const style = getComputedStyle(title)
  const probe = document.createElement('span')
  Object.assign(probe.style, {
    position: 'fixed', visibility: 'hidden', whiteSpace: 'nowrap',
    fontFamily: style.fontFamily, fontWeight: style.fontWeight,
    fontSize: `${sourceSize}px`,
    letterSpacing: `${(parseFloat(style.letterSpacing) || 0) * sourceSize / parseFloat(style.fontSize)}px`,
  })
  document.body.append(probe)
  let longest = 0
  for (const word of (props.publicName || title.textContent || '').split(/\s+/)) {
    probe.textContent = word
    longest = Math.max(longest, probe.getBoundingClientRect().width)
  }
  probe.remove()
  fittedTitleSize.value = longest > title.clientWidth
    ? Math.floor(sourceSize * title.clientWidth / longest * 100) / 100
    : sourceSize
}
onMounted(() => {
  if (typeof ResizeObserver !== 'undefined') {
    titleObserver = new ResizeObserver(fitTitleWords)
    if (titleRef.value) titleObserver.observe(titleRef.value)
  }
  window.addEventListener('resize', fitTitleWords)
  void document.fonts?.ready.then(fitTitleWords)
  fitTitleWords()
})
watch(() => [props.publicName, props.uiV2], () => {
  fittedTitleSize.value = null
  fitTitleWords()
}, { flush: 'post' })
onBeforeUnmount(() => {
  titleDisposed = true
  titleObserver?.disconnect()
  window.removeEventListener('resize', fitTitleWords)
})

function normalizeHeroText(value: string): string {
  return value.trim().toLocaleLowerCase('uk-UA').replace(/\s+/g, ' ')
}

const displayHeroRoleLine = computed(() => {
  const candidate = props.heroRoleLine.trim()
  if (!candidate) return ''

  const knownGeneratedFragments = new Set(
    [
      ...props.displaySpecializationChips,
      ...props.generalInfoItems
        .filter((item) =>
          ['локація', 'офлайн локація', 'location', 'offline location'].includes(
            normalizeHeroText(item.label)
          )
        )
        .map((item) => item.value),
    ]
      .map(normalizeHeroText)
      .filter(Boolean)
  )
  const candidateFragments = candidate
    .split('·')
    .flatMap((part) => part.split(','))
    .map(normalizeHeroText)
    .filter(Boolean)

  if (
    candidateFragments.length > 0 &&
    candidateFragments.every((fragment) => knownGeneratedFragments.has(fragment))
  ) {
    return ''
  }
  return candidate
})
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
  gap: 18px;
  align-content: start;
  min-width: 0;
  max-width: 100%;
}

.hero-main__intro {
  display: grid;
  gap: 8px;
  align-content: start;
}

.hero-main__details {
  display: grid;
  gap: 15px;
}

.hero-main__role {
  margin: 0;
  font-size: 14px;
  line-height: 1.45;
  color: color-mix(in srgb, var(--pc-navy-900) 70%, var(--pc-text-muted));
  font-weight: 600;
}

.hero-main__lead {
  margin: 0;
  font-size: 16px;
  line-height: 1.68;
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

.hero-main__about-action {
  width: fit-content;
  border: 1px solid color-mix(in srgb, var(--pc-navy-900) 16%, var(--pc-border));
  border-radius: 8px;
  padding: 6px 9px;
  background: color-mix(in srgb, var(--pc-bg-card) 84%, transparent);
  color: var(--pc-navy-900);
  font: inherit;
  font-size: 13px;
  font-weight: 700;
  cursor: pointer;
}

.hero-main__about-action:hover,
.hero-main__about-action:focus-visible {
  border-color: color-mix(in srgb, var(--pc-teal-500) 42%, var(--pc-border));
  background: var(--pc-bg-card);
  color: var(--pc-teal-600);
}

.hero-main__support {
  margin: -4px 0 0;
  font-size: 14px;
  line-height: 1.6;
  color: var(--pc-text-muted);
}

.hero-section {
  display: grid;
  gap: 8px;
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
  gap: 8px;
}

.hero-trust span {
  padding: 6px 10px;
  border-radius: 10px;
  background: color-mix(in srgb, var(--pc-bg-card) 88%, var(--pc-teal-100));
  border: 1px solid var(--pc-border);
  font-size: 12px;
  line-height: 1.3;
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
  gap: 8px;
}

.hero-info__item {
  border: 1px solid var(--pc-border);
  border-radius: 10px;
  background: color-mix(in srgb, var(--pc-bg-card) 92%, var(--pc-bg-soft));
  padding: 9px 10px;
  display: grid;
  grid-template-columns: 20px minmax(0, 1fr);
  align-items: start;
  gap: 8px;
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
  gap: 2px;
}

.hero-info__label {
  font-size: 9px;
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

  .hero-main__details {
    gap: 14px;
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
    gap: 12px;
  }

  .hero-main__intro {
    gap: 6px;
  }

  .hero-main__details {
    gap: 10px;
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
