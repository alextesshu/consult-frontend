<template>
  <section class="home">
    <div class="home__intro">
      <div class="home__card">
        <div class="badge">Consult</div>
        <h1 class="title home__title">Професійний простір для терапевтів</h1>
        <p class="muted home__subtitle">
          Оберіть, як ви заходите в систему. Кабінет терапевта і простір клієнта розділені,
          але обидва працюють у спокійній, етичній логіці.
        </p>
        <div class="home__actions">
          <div class="action-card">
            <div class="action-card__title">Я терапевт</div>
            <div class="muted">Кабінет, клієнти, сесії, нотатки.</div>
            <div class="action-card__buttons">
              <RouterLink class="btn" to="/login">Увійти</RouterLink>
              <RouterLink class="btn btn--ghost" to="/signup">Створити кабінет</RouterLink>
            </div>
          </div>
          <div class="action-card action-card--soft">
            <div class="action-card__title">Я клієнт</div>
            <div class="muted">Пошук терапевта та бронювання сесій.</div>
            <div class="action-card__buttons">
              <RouterLink class="btn btn--ghost" to="/login">Увійти як клієнт</RouterLink>
            </div>
            <div class="action-card__note">Клієнтський кабінет у підготовці.</div>
          </div>
        </div>
      </div>
    </div>

    <div class="home__scene">
      <div class="scene-frame">
        <div class="scene-stack">
          <img v-for="layer in layers" :key="layer.src" :src="layer.src" :class="layer.class" />
        </div>
      </div>
      <div class="scene-note">Паралакс‑анімація буде додана окремо.</div>
    </div>
  </section>
</template>

<script setup lang="ts">
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
import lanternOff from '../assets/parallax/84_lantern_off.png'
import lanternOn from '../assets/parallax/85_lantern_on.png'
import therapist from '../assets/parallax/86_therapist_figure.png'
import client from '../assets/parallax/87_client_figure.png'
import therapistLight from '../assets/parallax/88_therapist_figure_light.png'
import clientLight from '../assets/parallax/89_client_figure_light.png'
import nightOverlay from '../assets/parallax/90_night_cold_overlay.png'
import bushes from '../assets/parallax/95_bushes.png'
import treesNear from '../assets/parallax/96_trees_near.png'
import forestNear from '../assets/parallax/97_forest_near.png'

const layers = [
  { src: bgSky, class: 'layer layer--sky' },
  { src: bgVignette, class: 'layer layer--vignette' },
  { src: bgStars, class: 'layer layer--stars' },
  { src: mountainFar, class: 'layer layer--mountain-far' },
  { src: mountainNear, class: 'layer layer--mountain-near' },
  { src: forestBack, class: 'layer layer--forest-back' },
  { src: treesNear, class: 'layer layer--trees-near' },
  { src: bushes, class: 'layer layer--bushes' },
  { src: ground, class: 'layer layer--ground' },
  { src: tentBase, class: 'layer layer--tent' },
  { src: tentInside, class: 'layer layer--glow' },
  { src: tentOuter, class: 'layer layer--glow' },
  { src: lanternBloom, class: 'layer layer--lantern' },
  { src: lanternOff, class: 'layer layer--lantern' },
  { src: lanternOn, class: 'layer layer--lantern' },
  { src: therapist, class: 'layer layer--figure' },
  { src: client, class: 'layer layer--figure' },
  { src: therapistLight, class: 'layer layer--figure' },
  { src: clientLight, class: 'layer layer--figure' },
  { src: nightOverlay, class: 'layer layer--overlay' },
  { src: forestNear, class: 'layer layer--forest-front' },
]
</script>

<style scoped>
.home {
  display: grid;
  grid-template-columns: minmax(0, 1.05fr) minmax(0, 0.95fr);
  gap: 24px;
  align-items: start;
}

.home__card {
  border: 1px solid var(--line);
  border-radius: var(--radius);
  padding: 24px;
  background: #fff;
  box-shadow: var(--shadow);
}

.home__title {
  font-size: 36px;
}

.home__subtitle {
  max-width: 520px;
}

.home__actions {
  display: grid;
  gap: 16px;
  margin-top: 18px;
}

.action-card {
  border: 1px solid var(--line);
  border-radius: 16px;
  padding: 16px;
  background: #fff;
  display: grid;
  gap: 10px;
}

.action-card--soft {
  background: rgba(7, 47, 71, 0.04);
}

.action-card__title {
  font-family: var(--font-display);
  font-size: 20px;
}

.action-card__buttons {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
}

.action-card__note {
  font-size: 12px;
  color: var(--muted);
}

.home__scene {
  display: grid;
  gap: 10px;
}

.scene-frame {
  border-radius: 24px;
  border: 1px solid var(--line);
  background: #0c1b2b;
  overflow: hidden;
  box-shadow: var(--shadow);
  aspect-ratio: 4 / 3;
  position: relative;
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
}

.scene-note {
  font-size: 12px;
  color: var(--muted);
  text-align: right;
}

@media (max-width: 980px) {
  .home {
    grid-template-columns: 1fr;
  }

  .scene-note {
    text-align: left;
  }
}
</style>
