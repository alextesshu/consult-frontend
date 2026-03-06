<template>
  <section class="public-post">
    <header class="post-hero">
      <div>
        <div class="badge badge--soft">Авторський журнал</div>
        <h1 class="title post-title">{{ post?.title || 'Стаття' }}</h1>
        <p class="muted post-subtitle">
          <span v-if="post">
            {{ formatDate(post.published_at || post.created_at) }}
            · {{ readingTime(post.body || post.summary) }} хв читання
          </span>
          <span v-else>Завантаження...</span>
        </p>
      </div>
      <div class="post-hero__actions">
        <RouterLink class="btn btn--ghost" :to="backTo">← Назад</RouterLink>
        <RouterLink class="btn btn--ghost" :to="`/t/${slug}`">До профілю</RouterLink>
        <RouterLink class="btn btn--ghost" :to="`/t/${slug}/journal`">До журналу</RouterLink>
        <button class="btn btn--ghost btn--sm" type="button" :disabled="shareBusy" @click="onShare">
          {{ shareDone ? 'Скопійовано ✓' : (shareBusy ? '...' : 'Поділитися') }}
        </button>
        <span v-if="shareError" class="muted">{{ shareError }}</span>
      </div>
    </header>

    <div v-if="loading" class="muted">Завантаження статті...</div>
    <div v-else-if="error" class="form-error">{{ error }}</div>

    <article v-else-if="post" class="post-card">
      <div class="post-card__meta">
        <span v-if="post.category" class="post-tag" :style="{ '--cat': categoryColor(post.category) }">
          {{ categoryLabel(post.category) }}
        </span>
        <span v-if="post.is_featured" class="pin-badge">Закріплено</span>
      </div>

      <div class="post-card__grid">
        <div class="post-card__body">
          <p v-if="post.summary" class="post-summary" v-html="renderMarkdown(post.summary)"></p>
          <div class="post-body" v-html="renderMarkdown(post.body)"></div>

          <section
            v-if="post.collection && post.collection.items.length > 1"
            class="collection-card"
            aria-label="Part of collection"
          >
            <div class="collection-card__eyebrow">Part of collection</div>
            <div class="collection-card__head">
              <div>
                <h2 class="collection-card__title">
                  <RouterLink
                    class="collection-card__title-link"
                    :to="`/${slug}/journal/collections/${post.collection.slug}?current=${post.slug}`"
                  >
                    {{ post.collection.title }}
                  </RouterLink>
                </h2>
                <p v-if="post.collection.description" class="collection-card__description">
                  {{ post.collection.description }}
                </p>
              </div>
              <div v-if="post.collection.current_post_index" class="collection-card__index">
                Article {{ post.collection.current_post_index }} of {{ post.collection.items.length }}
              </div>
            </div>

            <ol class="collection-list">
              <li
                v-for="(item, index) in post.collection.items"
                :key="`${item.post.slug}-${item.sort_order}`"
                :class="[
                  'collection-list__item',
                  item.post.slug === post.slug ? 'collection-list__item--current' : '',
                ]"
              >
                <span class="collection-list__order">{{ index + 1 }}</span>
                <RouterLink
                  v-if="item.post.slug !== post.slug"
                  class="collection-list__link"
                  :to="`/${slug}/journal/${item.post.slug}`"
                >
                  {{ item.post.title }}
                </RouterLink>
                <span v-else class="collection-list__current">
                  {{ item.post.title }}
                </span>
              </li>
            </ol>
          </section>
        </div>

        <div v-if="post.cover_image_url" class="post-cover">
          <img :src="post.cover_image_url" alt="Обкладинка статті" />
        </div>
      </div>
    </article>
  </section>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import DOMPurify from 'dompurify'
import { marked } from 'marked'
import { getApiErrorMessage } from '../lib/errors'
import { fetchPublicAuthorJournalPostDetail, type PublicAuthorJournalPostDetail } from '../lib/api'

const route = useRoute()
const slug = computed(() => String(route.params.slug || '').trim())
const postSlug = computed(() => String(route.params.postSlug || '').trim())

const backTo = computed(() => {
  const from = String(route.query.from || 'profile')
  const cat = String(route.query.cat || 'ALL')
  if (from === 'journal') {
    return { path: `/t/${slug.value}/journal`, query: { cat } }
  }
  return { path: `/t/${slug.value}`, query: { cat, open: String(route.query.open || '') } }
})

const loading = ref(false)
const error = ref('')
const post = ref<PublicAuthorJournalPostDetail | null>(null)

const shareBusy = ref(false)
const shareDone = ref(false)
const shareError = ref('')

function renderMarkdown(text?: string | null) {
  if (!text) return ''
  const raw = marked.parse(text, { breaks: true }) as string
  return DOMPurify.sanitize(raw)
}

function formatDate(value: string) {
  if (!value) return ''
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return date.toLocaleDateString('uk-UA', { day: '2-digit', month: 'long', year: 'numeric' })
}

function readingTime(text: string | null | undefined): number {
  if (!text) return 1
  const words = text.trim().split(/\s+/).length
  return Math.max(1, Math.ceil(words / 200))
}

function categoryLabel(cat?: string) {
  switch (cat) {
    case 'TIP':
      return 'Порада'
    case 'EXPLAIN':
      return 'Пояснення'
    case 'FAQ':
      return 'FAQ'
    case 'RESEARCH':
      return 'Дослідження'
    case 'PRACTICE':
      return 'Практика'
    default:
      return 'Стаття'
  }
}

function categoryColor(cat?: string) {
  switch (cat) {
    case 'TIP':
      return '#2b7a6f'
    case 'EXPLAIN':
      return '#355c7d'
    case 'FAQ':
      return '#6b5b95'
    case 'RESEARCH':
      return '#9c6b2f'
    case 'PRACTICE':
      return '#2f6f9c'
    default:
      return '#2b7a6f'
  }
}

async function load() {
  if (!slug.value || !postSlug.value) return
  loading.value = true
  error.value = ''
  try {
    post.value = await fetchPublicAuthorJournalPostDetail(slug.value, postSlug.value)
    applySeo()
  } catch (err) {
    post.value = null
    error.value = getApiErrorMessage(err, 'Не вдалося завантажити статтю.')
  } finally {
    loading.value = false
  }
}

async function copyLink() {
  try {
    await navigator.clipboard.writeText(window.location.href)
  } catch {
    // ignore
  }
}

async function onShare() {
  if (shareBusy.value) return
  shareBusy.value = true
  shareDone.value = false
  shareError.value = ''
  try {
    const url = window.location.href
    const title = post.value?.title || document.title
    const text = post.value?.summary || ''
    const nav: any = navigator
    if (nav?.share) {
      await nav.share({ title, text, url })
      shareDone.value = true
      return
    }
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(url)
      shareDone.value = true
      return
    }
    window.prompt('Скопіюйте посилання:', url)
    shareDone.value = true
  } catch (e: any) {
    const msg = String(e?.message || '')
    if (!msg.toLowerCase().includes('abort')) {
      shareError.value = 'Не вдалося поділитися посиланням.'
    }
  } finally {
    shareBusy.value = false
    if (shareDone.value) {
      window.setTimeout(() => (shareDone.value = false), 1600)
    }
  }
}

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

function upsertPropertyMeta(property: string, content: string) {
  if (!content) return
  let el = document.querySelector(`meta[property="${property}"]`) as HTMLMetaElement | null
  if (!el) {
    el = document.createElement('meta')
    el.setAttribute('property', property)
    document.head.appendChild(el)
  }
  el.setAttribute('content', content)
}

function upsertTwitterMeta(name: string, content: string) {
  if (!content) return
  let el = document.querySelector(`meta[name="${name}"]`) as HTMLMetaElement | null
  if (!el) {
    el = document.createElement('meta')
    el.setAttribute('name', name)
    document.head.appendChild(el)
  }
  el.setAttribute('content', content)
}

function applySeo() {
  const title = post.value?.title?.trim() || 'Стаття'
  document.title = title
  const summary = (post.value?.summary || '').replace(/\s+/g, ' ').trim().slice(0, 160)
  upsertMeta('description', summary || 'Авторська стаття спеціаліста.')
  const url = window.location.origin + window.location.pathname
  upsertCanonical(url)

  const image = post.value?.cover_image_url || ''

  upsertPropertyMeta('og:type', 'article')
  upsertPropertyMeta('og:title', document.title)
  upsertPropertyMeta('og:description', summary || 'Авторська стаття спеціаліста.')
  upsertPropertyMeta('og:url', url)
  upsertPropertyMeta('og:site_name', 'Pro Consult')
  upsertPropertyMeta('og:locale', 'uk_UA')
  if (image) upsertPropertyMeta('og:image', image)

  upsertTwitterMeta('twitter:card', image ? 'summary_large_image' : 'summary')
  upsertTwitterMeta('twitter:title', document.title)
  upsertTwitterMeta('twitter:description', summary || 'Авторська стаття спеціаліста.')
  if (image) upsertTwitterMeta('twitter:image', image)
}

watch([slug, postSlug], () => {
  post.value = null
  load()
})

onMounted(load)
</script>

<style scoped>
.public-post {
  display: grid;
  gap: 16px;
}

.post-hero {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 16px;
  border: 1px solid var(--line);
  border-radius: 18px;
  padding: 20px 24px;
  background: #fff;
}

.post-title {
  margin: 8px 0 4px;
}

.post-subtitle {
  margin: 0;
}

.post-hero__actions {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.post-card {
  border: 1px solid var(--line);
  border-radius: 18px;
  padding: 22px 24px;
  background: #fff;
  display: grid;
  gap: 16px;
}

.post-card__meta {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  align-items: center;
}

.post-card__grid {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 280px;
  gap: 22px;
  align-items: start;
}

.post-card__body {
  display: grid;
  gap: 12px;
}

.post-summary {
  font-size: 16px;
  line-height: 1.6;
  color: var(--color-neutral-700, #4b4f54);
}

.post-body {
  font-size: 16px;
  line-height: 1.75;
  color: var(--color-neutral-800, #1e2124);
}

.collection-card {
  display: grid;
  gap: 14px;
  margin-top: 12px;
  padding: 18px;
  border-radius: 16px;
  border: 1px solid rgba(43, 122, 111, 0.18);
  background:
    linear-gradient(180deg, rgba(43, 122, 111, 0.07), rgba(43, 122, 111, 0.02)),
    #fcfffd;
}

.collection-card__eyebrow {
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: #2b7a6f;
}

.collection-card__head {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  align-items: flex-start;
}

.collection-card__title {
  margin: 0;
  font-size: 20px;
  line-height: 1.25;
}

.collection-card__title-link {
  color: inherit;
  text-decoration: none;
}

.collection-card__title-link:hover {
  color: #2b7a6f;
}

.collection-card__description {
  margin: 6px 0 0;
  color: var(--color-neutral-700, #4b4f54);
}

.collection-card__index {
  white-space: nowrap;
  font-size: 13px;
  font-weight: 600;
  color: #2b7a6f;
}

.collection-list {
  display: grid;
  gap: 8px;
  margin: 0;
  padding: 0;
  list-style: none;
}

.collection-list__item {
  display: grid;
  grid-template-columns: 28px minmax(0, 1fr);
  gap: 10px;
  align-items: center;
  padding: 10px 12px;
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.85);
  border: 1px solid rgba(0, 0, 0, 0.06);
}

.collection-list__item--current {
  border-color: rgba(43, 122, 111, 0.35);
  background: rgba(43, 122, 111, 0.08);
}

.collection-list__order {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  border-radius: 999px;
  background: rgba(43, 122, 111, 0.12);
  color: #2b7a6f;
  font-size: 12px;
  font-weight: 700;
}

.collection-list__link,
.collection-list__current {
  min-width: 0;
  font-weight: 600;
  color: var(--color-neutral-900, #14171a);
  text-decoration: none;
}

.collection-list__link:hover {
  color: #2b7a6f;
}

.post-cover {
  border-radius: 16px;
  overflow: hidden;
  border: 1px solid var(--line);
  background: var(--color-neutral-50, #f7f8f9);
  align-self: start;
}

.post-cover img {
  width: 100%;
  display: block;
  object-fit: contain;
  max-height: 420px;
}

.post-tag {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  padding: 6px 10px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.85);
  border: 1px solid rgba(0, 0, 0, 0.06);
  backdrop-filter: blur(8px);
  color: var(--cat, #2b7a6f);
}

.post-tag::before {
  content: '';
  width: 8px;
  height: 8px;
  border-radius: 999px;
  background: currentColor;
  opacity: 0.9;
}

.pin-badge {
  display: inline-flex;
  align-items: center;
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  padding: 6px 10px;
  border-radius: 999px;
  background: rgba(43, 122, 111, 0.12);
  border: 1px solid rgba(43, 122, 111, 0.25);
  color: #2b7a6f;
  width: fit-content;
}

.form-error {
  color: #b3261e;
  background: #fdecea;
  border: 1px solid #f5c2c0;
  border-radius: 10px;
  padding: 8px 10px;
}

@media (max-width: 900px) {
  .post-hero {
    flex-direction: column;
    align-items: flex-start;
  }

  .post-card__grid {
    grid-template-columns: 1fr;
  }

  .collection-card__head {
    flex-direction: column;
  }

  .post-cover img {
    max-height: 280px;
  }
}
</style>
