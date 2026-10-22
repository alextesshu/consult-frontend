<template>
  <RouterLink class="result-card" :class="{ 'pc2-specialist-card pc2-card pc2-card--interactive': uiV2 }" :to="profileRoute" :aria-label="profileLinkLabel">
    <div class="result-card__media">
      <img v-if="item.photo_url" :src="item.photo_url" :alt="publicName" class="result-card__photo" />
      <div v-else class="result-card__photo result-card__photo--empty" aria-hidden="true">Фото</div>
    </div>
    <div class="result-card__body">
      <div class="result-card__head">
        <div class="result-card__identity">
          <h3 class="result-card__name">{{ publicName }}</h3>
          <p v-if="primarySpecialization" class="result-card__headline">{{ primarySpecialization }}</p>
          <p v-if="priceText" class="result-card__price">{{ priceText }}</p>
        </div>
      </div>
      <p v-if="item.public_profile_summary" class="result-card__summary">{{ item.public_profile_summary }}</p>
      <ul v-if="topics.length" class="result-card__topics" aria-label="Основні теми">
        <li v-for="topic in topics" :key="topic">{{ topic }}</li>
      </ul>
      <dl class="result-card__details">
        <div v-if="formatText" class="result-card__detail">
          <dt>Формат</dt>
          <dd>{{ formatText }}</dd>
        </div>
        <div v-if="publicLocation" class="result-card__detail">
          <dt>Локація</dt>
          <dd>{{ publicLocation }}</dd>
        </div>
      </dl>
    </div>
  </RouterLink>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { isUiV2 } from '../lib/uiVersion'

const uiV2 = computed(isUiV2)

const props = defineProps<{
  item: {
    slug?: string | null
    public_slug?: string | null
    public_profile_path?: string | null
    display_name: string
    public_display_name?: string | null
    public_profile_summary?: string | null
    specializations?: string | string[] | null
    location?: string | null
    offers_online?: boolean
    offers_offline?: boolean
    price?: string | number | null
    price_currency?: string | null
    photo_url?: string | null
  }
}>()

const publicName = computed(() => (props.item.public_display_name || props.item.display_name || '').trim())
const profileLinkLabel = computed(() => `Відкрити профіль ${publicName.value}`.trim())
const specializations = computed(() => {
  if (Array.isArray(props.item.specializations)) return props.item.specializations.map((item) => item.trim()).filter(Boolean)
  const value = props.item.specializations?.trim()
  return value ? [value] : []
})
const primarySpecialization = computed(() => specializations.value[0] || '')
const topics = computed(() => specializations.value.slice(1, 4))
const formatText = computed(() => {
  if (props.item.offers_online && props.item.offers_offline) return 'Онлайн та офлайн'
  if (props.item.offers_online) return 'Онлайн'
  if (props.item.offers_offline) return 'Офлайн'
  return ''
})
const publicLocation = computed(() => (
  props.item.offers_offline ? String(props.item.location || '').trim() : ''
))
const priceText = computed(() => {
  if (props.item.price === null || props.item.price === undefined) return ''
  const amount = String(props.item.price).trim().replace(/([.,])00$/, '')
  if (!amount) return ''
  const currency = String(props.item.price_currency || 'UAH').toUpperCase()
  if (currency === 'UAH') return `${amount} грн`
  if (currency === 'USD') return `$${amount}`
  if (currency === 'EUR') return `€${amount}`
  return `${amount} ${currency}`
})
const profileRoute = computed(() => {
  const path = String(props.item.public_profile_path || '').trim()
  if (/^\/s\/[^/?#]+\/?$/.test(path)) return path
  const slug = String(props.item.public_slug || props.item.slug || '').trim()
  return slug ? `/s/${slug}` : '/specialists'
})
</script>

<style scoped>
.result-card { display: grid; grid-template-columns: 132px minmax(0, 1fr); gap: 16px; align-items: start; padding: 16px; border: 1px solid var(--line); border-radius: var(--radius-lg); background: #fff; color: inherit; text-decoration: none; transition: box-shadow .18s ease, transform .18s ease, border-color .18s ease; }
.result-card:hover { box-shadow: 0 10px 24px rgba(15, 23, 42, .08); transform: translateY(-1px); }
.result-card:focus-visible { outline: 3px solid rgba(15, 118, 110, .55); outline-offset: 3px; }
.result-card__photo { display: block; width: 100%; aspect-ratio: 1; object-fit: cover; border-radius: var(--radius-md); background: rgba(15,23,42,.04); }
.result-card__photo--empty { display: grid; place-items: center; color: var(--muted); font-weight: 600; }
.result-card__body, .result-card__identity { display: grid; gap: 6px; min-width: 0; }
.result-card__head { min-width: 0; }
.result-card__name { margin: 0; font-size: 20px; font-weight: 700; line-height: 1.2; color: var(--text); overflow-wrap: anywhere; }
.result-card__headline, .result-card__summary { margin: 0; color: var(--muted); }
.result-card__headline { font-weight: 600; }
.result-card__price { margin: 0; color: var(--text); font-size: 17px; font-weight: 700; line-height: 1.35; overflow-wrap: anywhere; }
.result-card__summary { display: -webkit-box; margin-top: 2px; overflow: hidden; color: var(--text); line-height: 1.5; -webkit-box-orient: vertical; -webkit-line-clamp: 3; }
.result-card__topics { display: flex; flex-wrap: wrap; gap: 6px; margin: 4px 0 0; padding: 0; list-style: none; }
.result-card__topics li { border-radius: 999px; background: rgba(15, 118, 110, .09); color: var(--text); font-size: 13px; line-height: 1.3; padding: 5px 9px; }
.result-card__details { display: flex; flex-wrap: wrap; gap: 6px 16px; margin: 4px 0 0; min-width: 0; }
.result-card__detail { display: flex; align-items: baseline; gap: 5px; min-width: 0; line-height: 1.35; }
.result-card__detail dt { font-size: 12px; font-weight: 700; line-height: inherit; text-transform: uppercase; color: var(--muted); }
.result-card__detail dd { margin: 0; line-height: inherit; overflow-wrap: anywhere; }
@media (max-width: 720px) { .result-card { grid-template-columns: 104px minmax(0, 1fr); gap: 14px; } }
@media (max-width: 420px) {
  .result-card { grid-template-columns: 84px minmax(0, 1fr); gap: 12px; padding: 12px; }
  .result-card__name { font-size: 18px; }
  .result-card__price { font-size: 15px; }
  .result-card__summary { -webkit-line-clamp: 2; }
  .result-card__details { display: grid; gap: 5px; }
}
</style>

<style>
html[data-ui="v2"] .pc2-specialist-card { grid-template-columns: var(--pc-space-24) minmax(0, 1fr); gap: var(--pc-space-5); padding: var(--pc-space-6); border: 1px solid var(--pc-border-hair); border-radius: var(--pc-radius-md); background: var(--pc-bg-card); color: var(--pc-text-main); font-family: var(--pc-font); box-shadow: none; transition: border-color var(--pc-dur) var(--pc-ease), box-shadow var(--pc-dur) var(--pc-ease); }
html[data-ui="v2"] .pc2-specialist-card:hover { border-color: var(--pc-border-strong); box-shadow: var(--pc-shadow-sm); transform: none; color: var(--pc-text-main); }
html[data-ui="v2"] .pc2-specialist-card:focus-visible { outline: var(--pc-focus-width) solid var(--pc-navy-900); outline-offset: var(--pc-focus-offset); }
html[data-ui="v2"] .pc2-specialist-card .result-card__photo { border-radius: var(--pc-radius-sm); background: var(--pc-bg-soft); color: var(--pc-text-muted); font-weight: var(--pc-fw-medium); }
html[data-ui="v2"] .pc2-specialist-card .result-card__body,
html[data-ui="v2"] .pc2-specialist-card .result-card__identity { gap: var(--pc-space-2); }
html[data-ui="v2"] .pc2-specialist-card .result-card__identity { grid-template-columns: minmax(0, 1fr) auto; align-items: baseline; }
html[data-ui="v2"] .pc2-specialist-card .result-card__name { grid-column: 1; grid-row: 1; font-size: var(--pc-fs-h3); font-weight: var(--pc-fw-medium); line-height: var(--pc-lh-head); color: var(--pc-text-main); }
html[data-ui="v2"] .pc2-specialist-card .result-card__headline { grid-column: 1 / -1; grid-row: 2; font-size: var(--pc-fs-small); color: var(--pc-text-muted); font-weight: var(--pc-fw-regular); }
html[data-ui="v2"] .pc2-specialist-card .result-card__price { grid-column: 2; grid-row: 1; font-size: var(--pc-fs-ui); font-weight: var(--pc-fw-strong); color: var(--pc-text-main); }
html[data-ui="v2"] .pc2-specialist-card .result-card__summary { font-size: var(--pc-fs-ui); line-height: var(--pc-lh-body); color: var(--pc-text-body); -webkit-line-clamp: 2; }
html[data-ui="v2"] .pc2-specialist-card .result-card__topics { gap: var(--pc-space-2); }
html[data-ui="v2"] .pc2-specialist-card .result-card__topics li { padding: var(--pc-space-1) var(--pc-space-2); border-radius: var(--pc-radius-pill); background: var(--pc-teal-100); color: var(--pc-teal-ink); font-size: var(--pc-fs-meta); }
html[data-ui="v2"] .pc2-specialist-card .result-card__details { gap: var(--pc-space-2) var(--pc-space-4); }
html[data-ui="v2"] .pc2-specialist-card .result-card__detail { flex-wrap: wrap; font-size: var(--pc-fs-meta); color: var(--pc-text-muted); }
html[data-ui="v2"] .pc2-specialist-card .result-card__detail dt { text-transform: none; font-size: inherit; font-weight: var(--pc-fw-medium); color: inherit; }
@media (max-width: 480px) {
  html[data-ui="v2"] .pc2-specialist-card .result-card__identity { grid-template-columns: minmax(0, 1fr); }
  html[data-ui="v2"] .pc2-specialist-card .result-card__price { grid-column: 1; grid-row: 3; }
  html[data-ui="v2"] .pc2-specialist-card { grid-template-columns: var(--pc-space-16) minmax(0, 1fr); gap: var(--pc-space-3); padding: var(--pc-space-4); }
}
</style>
