<template>
  <section class="home">
    <div
      class="scene-frame"
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
            <RouterLink class="btn btn--ghost btn--ghost-cta" :to="cabinetRoute">
              Кабінет
            </RouterLink>
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
import bgStars from '../assets/parallax/03_bg_stars.png'
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
const roles = computed(() => auth.me?.user.roles ?? [])
const cabinetRoute = computed(() => {
  if (roles.value.includes('THERAPIST')) return '/cabinet'
  if (roles.value.includes('CLIENT')) return '/client'
  return '/login'
})

const layers = [
  { src: bgSky, class: 'layer layer--sky' },
  { src: bgStars, class: 'layer layer--stars' },
  { src: mountainFar, class: 'layer layer--mountain-far' },
  { src: mountainNear, class: 'layer layer--mountain-near' },
  { src: forestBack, class: 'layer layer--forest-back' },
  { src: ground, class: 'layer layer--ground' },
  { src: tentBase, class: 'layer layer--tent' },
  { src: therapist, class: 'layer layer--figure' },
  { src: client, class: 'layer layer--figure' },
  { src: bushes, class: 'layer layer--bushes' },
  { src: treesNear, class: 'layer layer--trees-near' },
  { src: nightOverlay, class: 'layer layer--overlay layer--overlay-base' },

  { src: bgVignette, class: 'layer layer--vignette layer--lit' },
  { src: tentInside, class: 'layer layer--glow layer--lit' },
  { src: tentOuter, class: 'layer layer--glow layer--lit' },
  { src: lanternBloom, class: 'layer layer--lantern layer--lit' },
  { src: lanternOn, class: 'layer layer--lantern layer--lantern-on layer--lit' },
  { src: therapistLight, class: 'layer layer--figure layer--figure-therapist layer--lit' },
  { src: clientLight, class: 'layer layer--figure layer--figure-client layer--lit' },
  { src: forestNear, class: 'layer layer--forest-front' },
]

const hoveringTent = ref(false)
const hoveringTherapist = ref(false)
const hoveringClient = ref(false)
const pointerX = ref(0)
const pointerY = ref(0)

const sceneStyle = computed(() => ({
  '--px': `${pointerX.value}px`,
  '--py': `${pointerY.value}px`,
}))

const sceneStateClass = computed(() => ({
  'is-lit': hoveringTent.value,
  'is-therapist': hoveringTherapist.value,
  'is-client': hoveringClient.value,
}))

function onSceneMove(event: MouseEvent) {
  const target = event.currentTarget as HTMLElement
  const rect = target.getBoundingClientRect()
  pointerX.value = (event.clientX - rect.left - rect.width / 2) / rect.width
  pointerY.value = (event.clientY - rect.top - rect.height / 2) / rect.height
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
  position: relative;
}

.home {
  width: 100vw;
  margin-left: calc(50% - 50vw);
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
  transition: transform 200ms ease, opacity 200ms ease;
  pointer-events: none;
}

.layer--sky {
    z-index: 0;
  transform: translate(calc(var(--px) * 4px), calc(var(--py) * 4px));
}

.layer--stars {
  z-index: 1;
}

.layer--mountain-far {
    z-index: 3;
  transform: translate(calc(var(--px) * 6px), calc(var(--py) * 6px));
}

.layer--mountain-near {
    z-index: 4;
  transform: translate(calc(var(--px) * 8px), calc(var(--py) * 8px));
}

.layer--forest-back {
    z-index: 5;
  transform: translate(calc(var(--px) * 10px), calc(var(--py) * 10px));
}

.layer--ground {
    z-index: 6;
  transform: translate(calc(var(--px) * 14px), calc(var(--py) * 14px));
}

.layer--tent,
.layer--lantern,
.layer--figure,
.layer--bushes,
.layer--trees-near,
.layer--forest-front {
  z-index: 12;
  transform: translate(calc(var(--px) * 16px), calc(var(--py) * 16px));
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
