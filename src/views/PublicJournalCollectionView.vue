<template>
  <section class="collection-page">
    <header v-if="collection" class="collection-hero">
      <div v-if="collectionHeroCoverUrl" class="collection-cover">
        <img :src="collectionHeroCoverUrl" :alt="collection.title" />
      </div>
      <div class="collection-head">
        <div class="badge badge--soft">Part of journal</div>
        <h1 class="title collection-title">{{ collection.title }}</h1>
        <p v-if="collection.description" class="muted collection-description">
          {{ collection.description }}
        </p>
      </div>
    </header>

    <div v-if="loading" class="muted">Loading collection...</div>
    <div v-else-if="error" class="form-error">{{ error }}</div>

    <ol v-else-if="items.length" class="items-list">
      <li
        v-for="(item, index) in items"
        :key="`${item.post_slug}-${item.sort_order}`"
        :class="['item-card', item.post_slug === currentSlug ? 'item-card--current' : '']"
      >
        <div class="item-order">{{ index + 1 }}</div>
        <div class="item-body">
          <RouterLink class="item-title" :to="`/${slug}/journal/${item.post_slug}`">
            {{ item.post_title }}
          </RouterLink>
          <div class="item-meta">{{ item.reading_time }} min read</div>
          <p v-if="item.summary" class="item-summary">{{ item.summary }}</p>
        </div>
        <div v-if="item.cover_image_url" class="item-cover">
          <img :src="item.cover_image_url" :alt="item.post_title" />
        </div>
      </li>
    </ol>

    <div v-else class="muted">No published posts in this collection yet.</div>
  </section>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import { fetchPublicJournalCollectionDetail, getApiErrorMessage, type PublicJournalCollectionDetail } from '../lib/api'

const route = useRoute()
const slug = computed(() =>
  String(route.params.slug || route.params.specialist_slug || '').trim()
)
const collectionSlug = computed(() =>
  String(route.params.collectionSlug || route.params.collection_slug || '').trim()
)
const currentSlug = computed(() => String(route.query.current || '').trim())

const loading = ref(false)
const error = ref('')
const collection = ref<PublicJournalCollectionDetail | null>(null)

const items = computed(() => collection.value?.items || [])
const collectionHeroCoverUrl = computed(() => {
  if (!collection.value) return ''
  if (collection.value.cover_image_url) return collection.value.cover_image_url
  return collection.value.items?.[0]?.cover_image_url || ''
})

function upsertMeta(name: string, content: string) {
  if (!content) return
  let el = document.querySelector(`meta[name="${name}"]`) as HTMLMetaElement | null
  if (!el) {
    el = document.createElement('meta')
    el.setAttribute('name', name)
    document.head.appendChild(el)
  }
  el.setAttribute('content', content)
}

function upsertCanonical(href: string) {
  let el = document.querySelector('link[rel="canonical"]') as HTMLLinkElement | null
  if (!el) {
    el = document.createElement('link')
    el.setAttribute('rel', 'canonical')
    document.head.appendChild(el)
  }
  el.setAttribute('href', href)
}

function applySeo(data: PublicJournalCollectionDetail) {
  document.title = data.title
  const summary = (data.description || '').replace(/\s+/g, ' ').trim().slice(0, 160)
  upsertMeta('description', summary || 'Collection of specialist journal articles.')
  upsertCanonical(window.location.origin + window.location.pathname)
}

async function load() {
  if (!slug.value || !collectionSlug.value) return
  loading.value = true
  error.value = ''
  try {
    collection.value = await fetchPublicJournalCollectionDetail(slug.value, collectionSlug.value)
    applySeo(collection.value)
  } catch (err) {
    collection.value = null
    error.value = getApiErrorMessage(err, 'Failed to load collection.')
  } finally {
    loading.value = false
  }
}

watch([slug, collectionSlug], () => {
  collection.value = null
  load()
})

onMounted(load)
</script>

<style scoped>
.collection-page {
  display: grid;
  gap: 16px;
}

.collection-hero {
  display: grid;
  gap: 14px;
  border: 1px solid var(--line);
  border-radius: 18px;
  padding: 18px;
  background: #fff;
}

.collection-cover {
  border-radius: 14px;
  overflow: hidden;
  border: 1px solid var(--line);
  background: var(--color-neutral-50, #f7f8f9);
}

.collection-cover img {
  width: 100%;
  max-height: 300px;
  object-fit: cover;
  display: block;
}

.collection-title {
  margin: 8px 0 4px;
}

.collection-description {
  margin: 0;
}

.items-list {
  margin: 0;
  padding: 0;
  list-style: none;
  display: grid;
  gap: 10px;
}

.item-card {
  display: grid;
  grid-template-columns: 34px minmax(0, 1fr) 140px;
  gap: 12px;
  align-items: start;
  padding: 14px;
  border: 1px solid var(--line);
  border-radius: 14px;
  background: #fff;
}

.item-card--current {
  border-color: rgba(43, 122, 111, 0.35);
  background: rgba(43, 122, 111, 0.06);
}

.item-order {
  width: 30px;
  height: 30px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 999px;
  background: rgba(43, 122, 111, 0.12);
  color: #2b7a6f;
  font-size: 12px;
  font-weight: 700;
}

.item-body {
  min-width: 0;
  display: grid;
  gap: 6px;
}

.item-title {
  color: var(--color-neutral-900, #14171a);
  text-decoration: none;
  font-weight: 700;
  line-height: 1.35;
}

.item-title:hover {
  color: #2b7a6f;
}

.item-meta {
  font-size: 12px;
  color: var(--color-neutral-600, #5b6168);
}

.item-summary {
  margin: 0;
  color: var(--color-neutral-700, #4b4f54);
  line-height: 1.5;
}

.item-cover {
  border-radius: 12px;
  overflow: hidden;
  border: 1px solid var(--line);
}

.item-cover img {
  width: 100%;
  height: 96px;
  object-fit: cover;
  display: block;
}

.form-error {
  color: #b3261e;
  background: #fdecea;
  border: 1px solid #f5c2c0;
  border-radius: 10px;
  padding: 8px 10px;
}

@media (max-width: 900px) {
  .item-card {
    grid-template-columns: 34px minmax(0, 1fr);
  }

  .item-cover {
    grid-column: 2;
  }
}
</style>
