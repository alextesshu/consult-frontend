<template>
  <RouterLink class="result-card" :to="profileRoute">
    <div class="result-card__media">
      <img v-if="item.photo_url" :src="item.photo_url" :alt="publicName" class="result-card__photo" />
      <div v-else class="result-card__photo result-card__photo--empty">Фото</div>
    </div>
    <div class="result-card__body">
      <div class="result-card__head">
        <div class="result-card__name">{{ publicName }}</div>
        <p v-if="specializations[0]" class="result-card__headline">{{ specializations[0] }}</p>
      </div>
      <p v-if="item.public_profile_summary" class="result-card__summary">{{ item.public_profile_summary }}</p>
      <dl class="result-card__details">
        <div v-if="specializations.length" class="result-card__detail">
          <dt>Теми</dt>
          <dd>{{ specializations.join(', ') }}</dd>
        </div>
        <div v-if="formatText" class="result-card__detail">
          <dt>Формат</dt>
          <dd>{{ formatText }}</dd>
        </div>
        <div v-if="item.location" class="result-card__detail">
          <dt>Локація</dt>
          <dd>{{ item.location }}</dd>
        </div>
      </dl>
      <span class="btn btn--ghost result-card__cta">Відкрити профіль</span>
    </div>
  </RouterLink>
</template>

<script setup lang="ts">
import { computed } from 'vue'

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
    photo_url?: string | null
  }
}>()

const publicName = computed(() => (props.item.public_display_name || props.item.display_name || '').trim())
const specializations = computed(() => {
  if (Array.isArray(props.item.specializations)) return props.item.specializations.map((item) => item.trim()).filter(Boolean)
  const value = props.item.specializations?.trim()
  return value ? [value] : []
})
const formatText = computed(() => {
  const formats = []
  if (props.item.offers_online) formats.push('Онлайн')
  if (props.item.offers_offline) formats.push('Офлайн')
  return formats.join(' · ')
})
const profileRoute = computed(() => {
  const path = String(props.item.public_profile_path || '').trim()
  if (/^\/s\/[^/?#]+\/?$/.test(path)) return path
  const slug = String(props.item.public_slug || props.item.slug || '').trim()
  return slug ? `/s/${slug}` : '/specialists'
})
</script>

<style scoped>
.result-card { display: grid; grid-template-columns: 176px minmax(0, 1fr); gap: 20px; align-items: start; padding: 18px; border: 1px solid var(--line); border-radius: var(--radius-lg); background: #fff; color: inherit; text-decoration: none; }
.result-card:hover { box-shadow: 0 10px 24px rgba(15, 23, 42, .08); transform: translateY(-1px); }
.result-card:focus-visible { outline: 2px solid rgba(15, 118, 110, .5); outline-offset: 2px; }
.result-card__photo { display: block; width: 100%; aspect-ratio: 1; object-fit: cover; border-radius: var(--radius-md); background: rgba(15,23,42,.04); }
.result-card__photo--empty { display: grid; place-items: center; color: var(--muted); font-weight: 600; }
.result-card__body, .result-card__head, .result-card__details { display: grid; gap: 10px; min-width: 0; }
.result-card__name { font-size: 22px; font-weight: 700; line-height: 1.2; color: var(--text); }
.result-card__headline, .result-card__summary { margin: 0; color: var(--muted); }
.result-card__summary { color: var(--text); line-height: 1.65; }
.result-card__detail { display: grid; gap: 3px; }
.result-card__detail dt { font-size: 12px; font-weight: 700; text-transform: uppercase; color: var(--muted); }
.result-card__detail dd { margin: 0; line-height: 1.5; }
.result-card__cta { width: fit-content; pointer-events: none; }
@media (max-width: 720px) { .result-card { grid-template-columns: 1fr; gap: 16px; } .result-card__photo { aspect-ratio: 16 / 10; max-height: 220px; } }
</style>
