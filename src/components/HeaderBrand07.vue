<template>
  <span class="header07-brand">
    <img class="header07-brand__mark" :src="mark" alt="" />
    <span class="header07-brand__copy">
      <span class="header07-brand__wordmark" aria-label="Pro Consult">PRO CONSULT</span>
      <span v-if="slogan" class="header07-brand__slogan">Простір для консультацій і приватної практики</span>
    </span>
  </span>
</template>

<script setup lang="ts">
import mark from '../assets/brand-v2/header07-fennec.svg'
withDefaults(defineProps<{ slogan?: boolean }>(), { slogan: false })
</script>

<style>
@font-face {
  font-family: 'Manrope';
  font-style: normal;
  font-weight: 800;
  font-display: swap;
  src: url('../assets/fonts/manrope-latin-800.ttf') format('truetype');
}
.header07-brand { display: inline-flex; align-items: center; gap: 11px; color: #12233a; }
.header07-brand__mark { display: block; width: 32px; height: 32px; flex: 0 0 auto; }
.header07-brand__copy { display: flex; flex-direction: column; gap: 4px; }
.header07-brand__wordmark { font: 800 18px/1 'Manrope', sans-serif; letter-spacing: .02em; white-space: nowrap; }
.header07-brand__slogan { font: 400 11.5px/1.2 var(--pc-font); color: #657287; white-space: nowrap; }
@media (max-width: 767px) {
  .header07-brand { gap: 9px; }
  .header07-brand__mark { width: 30px; height: 30px; }
  .header07-brand__wordmark { font-size: 16px; }
  .header07-brand__slogan { display: none; }
}
</style>
