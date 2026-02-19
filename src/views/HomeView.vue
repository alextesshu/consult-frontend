<template>
  <section class="home" ref="homeRef">
    <div
      class="scene-frame"
      ref="sceneRef"
      :class="sceneStateClass"
      :style="sceneStyle"
      @mousemove="onSceneMove"
      @mouseleave="onSceneLeave"
    >
      <div class="scene-stack">
        <div class="scene-brand">
          <div class="scene-brand__mark">Pro Consult</div>
          <div class="scene-brand__tagline">Therapist Workspace</div>
        </div>
        <img v-for="layer in layers" :key="layer.src" :src="layer.src" :class="layer.class" />

        <button
          class="scene-hotspot scene-hotspot--tent"
          type="button"
          aria-label="Намет"
          @mouseenter="hoveringTent = true"
          @mouseleave="hoveringTent = false"
        ></button>
        <button
          class="scene-hotspot scene-hotspot--therapist"
          type="button"
          aria-label="Фігура терапевта"
          @mouseenter="hoverTherapist(true)"
          @mouseleave="hoverTherapist(false)"
          @click="onTherapistClick"
        ></button>
        <button
          class="scene-hotspot scene-hotspot--client"
          type="button"
          aria-label="Фігура клієнта"
          @mouseenter="hoverClient(true)"
          @mouseleave="hoverClient(false)"
          @click="onClientClick"
        ></button>

        <div class="scene-cta">
          <template v-if="!isAuthenticated">
            <RouterLink
              class="btn btn--ghost btn--ghost-cta"
              to="/login"
              @mouseenter="hoverTherapist(true)"
              @mouseleave="hoverTherapist(false)"
            >
              Увійти як терапевт
            </RouterLink>
            <RouterLink
              class="btn btn--ghost btn--ghost-cta"
              to="/login"
              @mouseenter="hoverClient(true)"
              @mouseleave="hoverClient(false)"
            >
              Увійти як клієнт
            </RouterLink>
          </template>
          <template v-else>
          <button class="btn btn--ghost btn--ghost-cta" type="button" @click="goToCabinet">
            Кабінет
          </button>
            <button class="btn btn--ghost btn--ghost-cta" type="button" @click="onLogout">
              Вийти
            </button>
          </template>
        </div>




        <div v-if="hoveringTherapist" class="scene-label scene-label--therapist">Терапевт</div>
        <div v-if="hoveringClient" class="scene-label scene-label--client">Клієнт</div>

      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { useAuthStore } from '../stores/auth'
import { useRouter } from 'vue-router'
import bgSky from '../assets/parallax/01_bg_sky.png'
import bgVignette from '../assets/parallax/02_bg_vignette.png'
import bgStarsFine from '../assets/parallax/03_bg_stars_fine.png'
import bgStarsGlow from '../assets/parallax/03_bg_stars_glow.png'
import mountainFar from '../assets/parallax/10_mountain_far.png'
import mountainNear from '../assets/parallax/11_mountain_near.png'
import forestBack from '../assets/parallax/20_forest_back.png'
import ground from '../assets/parallax/30_ground.png'
import tentBase from '../assets/parallax/80_tent_base.png'
import tentInside from '../assets/parallax/81_tent_inside_glow.png'
import tentOuter from '../assets/parallax/82_tent_outer_glow.png'
import lanternBloom from '../assets/parallax/83_lantern_bloom.png'
import lanternOn from '../assets/parallax/85_lantern_on.png'
import therapist from '../assets/parallax/86_therapist_figure.png'
import client from '../assets/parallax/87_client_figure.png'
import therapistLight from '../assets/parallax/88_therapist_figure_light.png'
import clientLight from '../assets/parallax/89_client_figure_light.png'
import nightOverlay from '../assets/parallax/90_night_cold_overlay.png'
import bushes from '../assets/parallax/95_bushes.png'
import treesNear from '../assets/parallax/96_trees_near.png'
import forestNear from '../assets/parallax/97_forest_near.png'

const router = useRouter()
const auth = useAuthStore()
const isAuthenticated = computed(() => Boolean(auth.accessToken))
const roles = computed(() => auth.me?.user.roles ?? auth.user?.roles ?? [])

const resolveCabinetRoute = () => {
  if (roles.value.includes('THERAPIST')) return '/cabinet'
  if (roles.value.includes('CLIENT')) return '/client'
  return '/login'
}

const goToCabinet = async () => {
  if (!auth.accessToken) {
    await router.push('/login')
    return
  }
  if (!auth.me) {
    try {
      await auth.loadMe()
    } catch {
      await router.push('/login')
      return
    }
  }
  await router.push(resolveCabinetRoute())
}

const layers = [
  { src: bgSky, class: 'layer layer--sky' },
  { src: bgStarsFine, class: 'layer layer--stars layer--stars-fine' },
  { src: bgStarsGlow, class: 'layer layer--stars layer--stars-glow' },
  { src: bgStarsGlow, class: 'layer layer--stars layer--stars-glow layer--stars-glow-zone layer--stars-zone-1' },
  { src: bgStarsGlow, class: 'layer layer--stars layer--stars-glow layer--stars-glow-zone layer--stars-zone-2' },
  { src: bgStarsGlow, class: 'layer layer--stars layer--stars-glow layer--stars-glow-zone layer--stars-zone-3' },
  { src: bgStarsGlow, class: 'layer layer--stars layer--stars-glow layer--stars-glow-zone layer--stars-zone-4' },
  { src: bgStarsGlow, class: 'layer layer--stars layer--stars-glow layer--stars-glow-zone layer--stars-zone-5' },
  { src: bgStarsGlow, class: 'layer layer--stars layer--stars-glow layer--stars-glow-zone layer--stars-zone-6' },
  { src: bgStarsGlow, class: 'layer layer--stars layer--stars-glow layer--stars-glow-zone layer--stars-zone-7' },
  { src: mountainFar, class: 'layer layer--mountain-far' },
  { src: mountainNear, class: 'layer layer--mountain-near' },
  { src: forestBack, class: 'layer layer--forest-back' },
  { src: ground, class: 'layer layer--ground' },
  { src: tentBase, class: 'layer layer--tent layer--tent-group' },
  { src: therapist, class: 'layer layer--figure layer--tent-group' },
  { src: client, class: 'layer layer--figure layer--tent-group' },
  { src: bushes, class: 'layer layer--bushes' },
  { src: treesNear, class: 'layer layer--trees-near' },
  { src: nightOverlay, class: 'layer layer--overlay layer--overlay-base' },

  { src: bgVignette, class: 'layer layer--vignette layer--lit' },
  { src: tentInside, class: 'layer layer--glow layer--lit layer--tent-group' },
  { src: tentOuter, class: 'layer layer--glow layer--lit layer--tent-group' },
  { src: lanternBloom, class: 'layer layer--lantern layer--lit layer--tent-group' },
  { src: lanternOn, class: 'layer layer--lantern layer--lantern-on layer--lit layer--tent-group' },
  { src: therapistLight, class: 'layer layer--figure layer--figure-therapist layer--lit layer--tent-group' },
  { src: clientLight, class: 'layer layer--figure layer--figure-client layer--lit layer--tent-group' },
  { src: forestNear, class: 'layer layer--forest-front' },
]

const hoveringTent = ref(false)
const hoveringTherapist = ref(false)
const hoveringClient = ref(false)
const pointerX = ref(0)
const pointerY = ref(0)
const scrollProgress = ref(0)
const sceneRef = ref<HTMLElement | null>(null)

const sceneStyle = computed(() => ({
  '--px': `${pointerX.value}`,
  '--py': `${pointerY.value}`,
  '--sy': `${scrollProgress.value}`,
}))

const sceneStateClass = computed(() => ({
  'is-lit': hoveringTent.value,
  'is-therapist': hoveringTherapist.value,
  'is-client': hoveringClient.value,
}))

function onSceneMove(event: MouseEvent) {
  const target = event.currentTarget as HTMLElement
  const rect = target.getBoundingClientRect()
  pointerX.value = (event.clientX - rect.left - rect.width / 2) / (rect.width / 2)
  pointerY.value = (event.clientY - rect.top - rect.height / 2) / (rect.height / 2)
}

function onSceneLeave() {
  pointerX.value = 0
  pointerY.value = 0
  hoveringTent.value = false
  hoveringTherapist.value = false
  hoveringClient.value = false
}

function hoverTherapist(state: boolean) {
  hoveringTherapist.value = state
  if (state) {
    hoveringTent.value = true
    hoveringClient.value = false
  }
}

function hoverClient(state: boolean) {
  hoveringClient.value = state
  if (state) {
    hoveringTent.value = true
    hoveringTherapist.value = false
  }
}

function onTherapistClick() {
  router.push('/login')
}

function onClientClick() {
  router.push('/login')
}

function onLogout() {
  auth.logout()
  router.push('/')
}

scrollProgress.value = 0
</script>

<style scoped>
.scene-frame {
  border-radius: 0;
  border: none;
  background: #0c1b2b;
  overflow: hidden;
  box-shadow: var(--shadow);
  width: 100vw;
  min-height: 100vh;
  height: 100vh;
  position: relative;
}

.home {
  width: 100vw;
  margin-left: calc(50% - 50vw);
  min-height: 100vh;
  overflow: hidden;
}

.scene-stack {
  position: absolute;
  inset: 0;
}

.layer {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 260ms ease, opacity 240ms ease;
  pointer-events: none;
  will-change: transform, opacity;
}

.layer--sky {
    z-index: 0;
  transform: translate3d(
    calc(var(--px) * 15px),
    calc(var(--py) * 15px + var(--sy) * 20px),
    0
  );
}

.layer--stars {
  z-index: 1;
}

.layer--stars-fine {
  opacity: 0.55;
  transform: translate3d(
    calc(var(--px) * 20px),
    calc(var(--py) * 20px + var(--sy) * 30px),
    0
  );
  animation: starsTwinkle 9s ease-in-out infinite;
}

.layer--stars-glow {
  opacity: 0;
  transform: translate3d(
    calc(var(--px) * 22.5px),
    calc(var(--py) * 22.5px + var(--sy) * 36px),
    0
  );
  mix-blend-mode: screen;
  filter: drop-shadow(0 0 4px rgba(140, 200, 255, 0.5));
  animation: starsPulse 7s ease-in-out infinite;
}

.scene-frame.is-lit .layer--stars-glow {
  opacity: 0.35;
}

.layer--stars-glow-zone {
  opacity: 0;
  mix-blend-mode: screen;
  filter: drop-shadow(0 0 6px rgba(160, 220, 255, 0.7));
  animation: starsPulse 6.5s ease-in-out infinite;
}

.layer--stars-glow-zone {
  mask-image: radial-gradient(
    circle var(--mask-size) at var(--mask-x) var(--mask-y),
    #fff 0%,
    rgba(255, 255, 255, 0.85) 35%,
    rgba(255, 255, 255, 0.35) 55%,
    transparent 75%
  );
  -webkit-mask-image: radial-gradient(
    circle var(--mask-size) at var(--mask-x) var(--mask-y),
    #fff 0%,
    rgba(255, 255, 255, 0.85) 35%,
    rgba(255, 255, 255, 0.35) 55%,
    transparent 75%
  );
}

.scene-frame.is-lit .layer--stars-glow-zone,
.scene-frame.is-therapist .layer--stars-glow-zone,
.scene-frame.is-client .layer--stars-glow-zone {
  opacity: 0.9;
}

.layer--mountain-far {
    z-index: 3;
  transform: translate3d(
    calc(var(--px) * 17.5px),
    calc(var(--py) * 17.5px + var(--sy) * 50px),
    0
  );
}

.layer--mountain-near {
    z-index: 4;
  transform: translate3d(
    calc(var(--px) * 15px),
    calc(var(--py) * 15px + var(--sy) * 70px),
    0
  );
}

.layer--forest-back {
    z-index: 5;
  transform: translate3d(
    calc(var(--px) * 11.25px),
    calc(var(--py) * 11.25px + var(--sy) * 90px),
    0
  );
}

.layer--ground {
    z-index: 6;
  transform: translate3d(
    calc(var(--px) * 4.5px),
    calc(var(--py) * 4.5px + var(--sy) * 120px),
    0
  );
}

.layer--bushes,
.layer--trees-near,
.layer--forest-front {
  z-index: 12;
  transform: translate3d(
    calc(var(--px) * 3.5px),
    calc(var(--py) * 3.5px + var(--sy) * 160px),
    0
  );
}

.layer--tent-group {
  z-index: 12;
  transform: translate3d(
    calc(var(--px) * 3px),
    calc(var(--py) * 3px + var(--sy) * 160px),
    0
  );
}


.layer--tent {
  z-index: 7;
}

.layer--lantern {
  z-index: 8;
}

.layer--figure {
  z-index: 9;
}

.layer--bushes {
  z-index: 10;
}

.layer--trees-near {
  z-index: 11;
}

.layer--forest-front {
  z-index: 12;
}

.layer--glow {
  z-index: 14;
}

.layer--lantern-on {
  z-index: 15;
}

.layer--figure-therapist,
.layer--figure-client {
  z-index: 16;
}

.layer--lit {
  opacity: 0;
  transition: transform 200ms ease, opacity 280ms ease;
}

.scene-frame.is-lit .layer--lit {
  opacity: 1;
}

.layer--overlay-base {
  z-index: 20;
  opacity: 1;
  transition: opacity 280ms ease;
}

.scene-frame.is-lit .layer--overlay-base {
  opacity: 0;
}

.scene-brand {
  position: absolute;
  top: 16px;
  left: 50%;
  transform: translateX(-50%);
  text-align: center;
  color: #f1f6f9;
  z-index: 21;
  pointer-events: none;
}

.scene-brand__mark {
  font-family: var(--font-display);
  font-weight: 700;
  font-size: 20px;
  letter-spacing: 0.4px;
}

.scene-brand__tagline {
  font-size: 11px;
  letter-spacing: 0.18em;
  text-transform: uppercase;
  color: rgba(241, 246, 249, 0.7);
}

.scene-cta {
  position: absolute;
  left: 4%;
  top: 16%;
  display: grid;
  gap: 10px;
  z-index: 20;
  pointer-events: auto;
}

.btn--ghost-cta {
  background: rgba(255, 255, 255, 0.12);
  border-color: rgba(255, 255, 255, 0.28);
  color: rgba(241, 246, 249, 0.78);
  backdrop-filter: blur(6px);
  font-family: var(--font-sans);
  font-size: 14px;
  font-weight: 600;
  line-height: 1;
}

.btn--ghost-cta:hover {
  background: rgba(255, 255, 255, 0.22);
}

.scene-frame.is-therapist .scene-cta .btn--ghost-cta:first-child,
.scene-frame.is-client .scene-cta .btn--ghost-cta:last-child {
  box-shadow: 0 0 18px rgba(130, 190, 255, 0.45);
  border-color: rgba(180, 220, 255, 0.55);
  color: rgba(241, 246, 249, 0.95);
}

.layer--bushes {
  z-index: 16;
}

.layer--trees-near {
  z-index: 17;
}

.layer--forest-front {
  z-index: 18;
}

.scene-hotspot {
  position: absolute;
  background: transparent;
  border: none;
  padding: 0;
  cursor: pointer;
  z-index: 22;
}

.scene-hotspot--tent {
  left: calc(29% - 10px);
  bottom: 10%;
  width: calc(42% - 100px);
  height: 36%;
}

.scene-hotspot--therapist {
  left: calc(36% - 70px);
  bottom: 20%;
  width: 12%;
  height: 22%;
}

.scene-hotspot--client {
  left: calc(49% - 60px);
  bottom: 20%;
  width: 12%;
  height: 22%;
}

.scene-label {
  position: absolute;
  padding: 6px 10px;
  border-radius: 999px;
  background: transparent;
  color: rgba(255, 255, 255, 0.72);
  font-size: 12px;
  z-index: 25;
  pointer-events: none;
  text-shadow: 0 2px 6px rgba(0, 0, 0, 0.55);
}

.scene-label--therapist {
  left: calc(36% + 20px);
  bottom: calc(46% - 30px);
}

.scene-label--client {
  left: calc(52% - 60px);
  bottom: calc(46% - 30px);
}

.layer--stars-zone-1 {
  --mask-x: 13%;
  --mask-y: 45%;
  --mask-size: 5.2%;
}

.layer--stars-zone-2 {
  --mask-x: 25%;
  --mask-y: 25%;
  --mask-size: 5.2%;
}

.layer--stars-zone-3 {
  --mask-x: 87%;
  --mask-y: 28%;
  --mask-size: 5.2%;
}

.layer--stars-zone-4 {
  --mask-x: 43%;
  --mask-y: 14%;
  --mask-size: 5.2%;
}

.layer--stars-zone-5 {
  --mask-x: 40%;
  --mask-y: 30%;
  --mask-size: 5.6%;
}

.layer--stars-zone-6 {
  --mask-x: 73%;
  --mask-y: 10%;
  --mask-size: 4.8%;
}

.layer--stars-zone-7 {
  --mask-x: 82%;
  --mask-y: 15%;
  --mask-size: 5%;
}


@keyframes starsTwinkle {
  0% {
    opacity: 0.5;
  }
  50% {
    opacity: 0.75;
  }
  100% {
    opacity: 0.55;
  }
}

@keyframes starsPulse {
  0% {
    opacity: 0.15;
    transform: translate3d(
      calc(var(--px) * 7px),
      calc(var(--py) * 7px + var(--sy) * 12px),
      0
    );
  }
  50% {
    opacity: 0.85;
    transform: translate3d(
      calc(var(--px) * 8px),
      calc(var(--py) * 8px + var(--sy) * 14px),
      0
    );
  }
  100% {
    opacity: 0.2;
    transform: translate3d(
      calc(var(--px) * 7px),
      calc(var(--py) * 7px + var(--sy) * 12px),
      0
    );
  }
}

@media (max-width: 980px) {
  .scene-frame {
    min-height: 70vh;
  }

  .scene-overlay {
    position: static;
    margin: 16px;
    max-width: none;
  }
}
</style>
