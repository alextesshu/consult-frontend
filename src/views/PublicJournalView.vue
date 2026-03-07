<template>

  <section class="public-journal">

    <header class="journal-hero">

      <div>

        <div class="badge badge--soft">Авторський журнал</div>

        <h1 class="title">{{ publicName || 'Журнал спеціаліста' }}</h1>

        <p class="muted">

          Тут зібрані опубліковані статті спеціаліста.

        </p>

      </div>

      <div class="journal-hero__actions">

        <RouterLink class="btn btn--ghost" :to="profileLink">Профіль</RouterLink>

        <RouterLink class="btn btn--ghost" to="/specialists">До списку</RouterLink>

      </div>

    </header>

    <section v-if="displayedCollections.length" class="journal-collections">
      <div class="journal-collections__head">
        <h2 class="journal-collections__title">Добірки</h2>
        <p class="journal-collections__subtitle">Серії матеріалів, зібрані в одному місці</p>
      </div>

      <div class="journal-collections__grid">
        <RouterLink
          v-for="collection in displayedCollections"
          :key="collection.slug"
          :to="`/${slug}/journal/collections/${collection.slug}`"
          class="journal-collection-card"
        >
          <div
            v-if="collection.cover_image_url"
            class="journal-collection-card__cover"
          >
            <img :src="collection.cover_image_url" :alt="collection.title" />
          </div>

          <div class="journal-collection-card__body">
            <div class="journal-collection-card__meta">
              {{ collection.posts_count }} {{ articleWord(collection.posts_count) }}
            </div>

            <h3 class="journal-collection-card__title">{{ collection.title }}</h3>

            <p v-if="collection.description" class="journal-collection-card__description">
              {{ collection.description }}
            </p>

            <ul
              v-if="collection.preview_posts?.length"
              class="journal-collection-card__preview"
            >
              <li
                v-for="post in collection.preview_posts"
                :key="post.slug"
                class="journal-collection-card__preview-item"
              >
                — {{ post.title }}
              </li>
            </ul>

            <div class="journal-collection-card__cta">Відкрити серію →</div>
          </div>
        </RouterLink>
      </div>
    </section>

    <div v-if="journalLoading" class="muted">Завантажуємо журнал...</div>

    <div v-else-if="journalError" class="form-error">{{ journalError }}</div>

    <div v-else-if="filteredJournalPosts.length === 0" class="empty">

      <div class="empty-title">Немає статей у цій категорії</div>

      <div class="muted">Спробуйте інший фільтр або поверніться до всіх статей.</div>

      <button class="btn btn--ghost btn--sm" type="button" @click="activeCategory = 'ALL'">

        Повернути всі статті

      </button>

    </div>



    <div v-else class="journal-list">

      <div class="journal-filters" role="tablist" aria-label="Фільтр статей">

        <button

          v-for="opt in categoryOptions"

          :key="opt.key"

          type="button"

          class="filter-chip"

          :class="{ 'is-active': activeCategory === opt.key }"

          @click="activeCategory = opt.key"

        >

          {{ opt.label }}

        </button>

      </div>



      <article

        v-if="featuredPost"

        :class="[

          'journal-card',

          'journal-card--feature',

          featuredPost.is_featured ? 'journal-card--pinned' : '',

          'journal-card--closed',

        ]"

        role="button"

        tabindex="0"

        @click="navigateToPost(featuredPost)"

        @keydown.enter="navigateToPost(featuredPost)"

        @keydown.space.prevent="navigateToPost(featuredPost)"

      >

        <div class="journal-body">

          <span class="post-tag" :style="{ '--cat': categoryColor(featuredPost.category) }">

            {{ categoryLabel(featuredPost.category) }}

          </span>

          <span v-if="featuredPost.is_featured" class="pin-badge">Закріплено</span>

          <div class="journal-title">{{ featuredPost.title }}</div>

          <div class="journal-meta">

            {{ formatDate(featuredPost.published_at || featuredPost.created_at) }}

          · {{ readingTime(featuredPost.summary) }} хв читання

          </div>

          <div class="journal-summary" v-if="featuredPost.summary" v-html="renderMarkdown(featuredPost.summary)"></div>

          <RouterLink class="read-more" :to="`/${slug}/journal/${featuredPost.slug}`" @click.stop>

            Читати статтю →

          </RouterLink>

        </div>

        <div v-if="featuredPost.cover_image_url" class="journal-cover">

          <img :src="featuredPost.cover_image_url" alt="Обкладинка статті" />

        </div>

      </article>



      <div class="journal-grid">

        <article

          v-for="post in gridPosts"

          :key="post.id"

          :class="[

            'journal-card',

            post.is_featured ? 'journal-card--pinned' : '',

            'journal-card--closed',

          ]"

          role="button"

          tabindex="0"

        @click="navigateToPost(post)"

        @keydown.enter="navigateToPost(post)"

        @keydown.space.prevent="navigateToPost(post)"

        >

          <div class="journal-body">

            <span class="post-tag" :style="{ '--cat': categoryColor(post.category) }">

              {{ categoryLabel(post.category) }}

            </span>

            <span v-if="post.is_featured" class="pin-badge">Закріплено</span>

            <div class="journal-title">{{ post.title }}</div>

            <div class="journal-meta">

              {{ formatDate(post.published_at || post.created_at) }}

          · {{ readingTime(post.summary) }} хв читання

            </div>

            <div class="journal-summary" v-if="post.summary" v-html="renderMarkdown(post.summary)"></div>

            <RouterLink class="read-more" :to="`/${slug}/journal/${post.slug}`" @click.stop>

              Читати статтю →

            </RouterLink>

          </div>

          <div v-if="post.cover_image_url" class="journal-cover">

            <img :src="post.cover_image_url" alt="Обкладинка статті" />

          </div>

        </article>

      </div>

    </div>

</section>

</template>



<script setup lang="ts">

import { computed, onMounted, ref, watch } from 'vue'

import { useRoute, useRouter } from 'vue-router'

import DOMPurify from 'dompurify'

import { marked } from 'marked'

import { getApiErrorMessage } from '../lib/errors'

import {

  fetchPublicAuthorJournalPosts,
  fetchPublicJournalCollections,

  fetchPublicSpecialistProfile,

  type PublicAuthorJournalPost,
  type PublicJournalCollectionListItem,

} from '../lib/api'



const route = useRoute()

const router = useRouter()

const slug = computed(() => String(route.params.slug || '').trim())



const journalPosts = ref<PublicAuthorJournalPost[]>([])
const collections = ref<PublicJournalCollectionListItem[]>([])

const journalLoading = ref(false)

const journalError = ref('')



type JournalCategory = 'ALL' | 'TIP' | 'EXPLAIN' | 'FAQ' | 'RESEARCH' | 'PRACTICE'

const activeCategory = ref<JournalCategory>('ALL')

const categoryOptions: { key: JournalCategory; label: string }[] = [

  { key: 'ALL', label: 'Усі' },

  { key: 'TIP', label: 'Порада' },

  { key: 'EXPLAIN', label: 'Пояснення' },

  { key: 'PRACTICE', label: 'Практика' },

  { key: 'RESEARCH', label: 'Дослідження' },

  { key: 'FAQ', label: 'FAQ' },

]



const publicName = ref('')



const profileLink = computed(() => (slug.value ? `/t/${slug.value}` : '/specialists'))



function postCategory(post: PublicAuthorJournalPost): Exclude<JournalCategory, 'ALL'> | null {

  const v = (post as { category?: string })?.category

  if (v === 'TIP' || v === 'EXPLAIN' || v === 'FAQ' || v === 'RESEARCH' || v === 'PRACTICE') return v

  return null

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

      return 'Порада'

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



function renderMarkdown(text?: string | null) {

  if (!text) return ''

  const raw = marked.parse(text, { breaks: true }) as string

  return DOMPurify.sanitize(raw)

}



function readingTime(text: string | null | undefined): number {

  if (!text) return 1

  const words = text.trim().split(/\\s+/).length

  const minutes = Math.ceil(words / 200)

  return Math.max(1, minutes)

}



const filteredJournalPosts = computed(() => {

  if (activeCategory.value === 'ALL') return journalPosts.value

  return journalPosts.value.filter((p) => postCategory(p) === activeCategory.value)

})



const featuredPost = computed(() => filteredJournalPosts.value.find((p) => p.is_featured) || null)
const displayedCollections = computed(() => collections.value.slice(0, 3))

function articleWord(count: number): string {
  if (count % 10 === 1 && count % 100 !== 11) return 'стаття'
  if ([2, 3, 4].includes(count % 10) && ![12, 13, 14].includes(count % 100)) {
    return 'статті'
  }
  return 'статей'
}



function navigateToPost(post: PublicAuthorJournalPost) {
  if (!slug.value || !post.slug) return
  router.push({
    name: 'public-journal-post',
    params: { slug: slug.value, postSlug: post.slug },
    query: {
      from: 'journal',
      cat: activeCategory.value,
      open: String(post.id),
    },
  })
}




const gridPosts = computed(() =>

  featuredPost.value

    ? filteredJournalPosts.value.filter((p) => p.id !== featuredPost.value?.id)

    : filteredJournalPosts.value

)



function formatDate(value: string) {

  if (!value) return ''

  const date = new Date(value)

  if (Number.isNaN(date.getTime())) return value

  return date.toLocaleDateString('uk-UA', {

    day: '2-digit',

    month: 'long',

    year: 'numeric',

  })

}



async function loadJournal() {

  if (!slug.value) return

  journalLoading.value = true

  journalError.value = ''

  try {

    journalPosts.value = await fetchPublicAuthorJournalPosts(slug.value)
    collections.value = await fetchPublicJournalCollections(slug.value)

  } catch (err) {

    journalPosts.value = []
    collections.value = []

    journalError.value = getApiErrorMessage(err, 'Не вдалося завантажити авторський журнал.')

  } finally {

    journalLoading.value = false

  }

}



async function loadProfileTitle() {

  if (!slug.value) return

  try {

    const profile = await fetchPublicSpecialistProfile(slug.value)

    publicName.value = profile.display_name || profile.public_profile_name || profile.public_slug || ''

  } catch {

    publicName.value = ''

  }

}



onMounted(async () => {

  await loadProfileTitle()

  await loadJournal()

})

</script>



<style scoped>

.public-journal {

  display: grid;

  gap: 16px;

}



.journal-hero {

  display: flex;

  align-items: flex-end;

  justify-content: space-between;

  gap: 16px;

  border: 1px solid var(--line);

  border-radius: 18px;

  padding: 20px 24px;

  background: #fff;

}



.journal-hero__actions {

  display: flex;

  gap: 10px;

  flex-wrap: wrap;

}

.journal-collections {
  margin: 0 0 10px;
}

.journal-collections__head {
  margin-bottom: 20px;
}

.journal-collections__title {
  margin: 0 0 6px;
  font-size: 28px;
  line-height: 1.15;
  font-weight: 700;
}

.journal-collections__subtitle {
  margin: 0;
  font-size: 15px;
  line-height: 1.5;
  color: var(--color-text-muted, #6c7279);
}

.journal-collections__grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 20px;
}

.journal-collection-card {
  display: block;
  overflow: hidden;
  border: 1px solid var(--line);
  border-radius: 20px;
  background: var(--color-surface, #fff);
  text-decoration: none;
  color: inherit;
  transition: transform 0.18s ease, box-shadow 0.18s ease, border-color 0.18s ease;
}

.journal-collection-card:hover {
  transform: translateY(-2px);
  border-color: var(--color-border-strong, #949aa1);
  box-shadow: 0 10px 24px rgba(0, 0, 0, 0.06);
}

.journal-collection-card__cover {
  aspect-ratio: 16 / 8;
  background: var(--color-surface-soft, #f3f5f7);
  overflow: hidden;
}

.journal-collection-card__cover img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

.journal-collection-card__body {
  padding: 16px;
}

.journal-collection-card__meta {
  margin-bottom: 8px;
  font-size: 13px;
  line-height: 1.4;
  color: var(--color-text-muted, #6c7279);
}

.journal-collection-card__title {
  margin: 0 0 8px;
  font-size: 20px;
  line-height: 1.25;
  font-weight: 700;
}

.journal-collection-card__description {
  margin: 0 0 10px;
  font-size: 14px;
  line-height: 1.5;
  color: var(--color-text-muted, #6c7279);
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.journal-collection-card__preview {
  margin: 10px 0 0;
  padding: 0;
  list-style: none;
}

.journal-collection-card__preview-item {
  font-size: 14px;
  line-height: 1.45;
  color: var(--color-text-muted, #6c7279);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.journal-collection-card__preview-item + .journal-collection-card__preview-item {
  margin-top: 6px;
}

.journal-collection-card__cta {
  margin-top: 12px;
  font-size: 14px;
  font-weight: 600;
}



.journal-list {

  display: grid;

  gap: 12px;

  grid-template-columns: 1fr;

}



.journal-grid {

  display: grid;

  grid-template-columns: repeat(2, minmax(0, 1fr));

  gap: 14px;

  align-items: start;

  grid-auto-rows: 1fr;

}



.journal-filters {

  display: flex;

  flex-wrap: wrap;

  gap: 10px;

  margin: 6px 0 14px;

}



.filter-chip {

  border: 1px solid var(--line);

  background: rgba(255, 255, 255, 0.7);

  backdrop-filter: blur(10px);

  border-radius: 999px;

  padding: 8px 12px;

  font-size: 13px;

  cursor: pointer;

  transition: transform 0.15s ease, box-shadow 0.15s ease, background 0.15s ease;

}



.filter-chip:hover {

  transform: translateY(-1px);

  box-shadow: 0 10px 20px rgba(0, 0, 0, 0.06);

}



.filter-chip.is-active {

  background: rgba(43, 122, 111, 0.12);

  border-color: rgba(43, 122, 111, 0.35);

}



.empty {

  display: grid;

  gap: 10px;

  padding: 16px 18px;

  border-radius: 12px;

  border: 1px dashed var(--line);

  background: #fff;

}



.empty-title {

  font-weight: 600;

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

  margin-top: 8px;

}



.journal-card {

  display: grid;

  border: 1px solid var(--line);

  border-radius: 14px;

  padding: 24px;

  background: #fff;

  overflow: hidden;

  gap: 24px;

  border-left: 4px solid #9ad7c8;

  transition: transform 0.18s ease, box-shadow 0.18s ease, border-color 0.18s ease;

  height: auto;

  align-items: start;

  animation: journalFade 0.35s ease;

}



.journal-card:hover {

  transform: translateY(-4px);

  border-color: #2b7a6f;

  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.06), 0 2px 6px rgba(0, 0, 0, 0.04);

}



.journal-card--pinned {

  border-color: rgba(43, 122, 111, 0.35);

  box-shadow: 0 10px 30px rgba(43, 122, 111, 0.1);

}



.journal-card--feature {

  grid-template-columns: 1fr 360px;

  padding: 34px 34px 34px 28px;

  border-left-width: 6px;

  grid-column: 1 / -1;

}



.journal-card--feature .journal-title {

  font-size: 30px;

  line-height: 1.25;

}



.journal-card--feature .journal-summary {

  font-size: 17px;

  -webkit-line-clamp: 3;

}



.journal-cover {

  background: var(--color-neutral-50, #f7f8f9);

  display: flex;

  justify-content: center;

  align-items: flex-start;

  padding: 12px;

  border-radius: 12px;

  position: relative;

  aspect-ratio: 3 / 2;

  overflow: hidden;

}



.journal-cover img {

  width: 100%;

  display: block;

  height: 100%;

  object-fit: cover;

  object-position: 50% 35%;

  transition: transform 0.4s ease;

}



.journal-card:hover .journal-cover img {

  transform: scale(1.04);

}



.journal-body {

  display: grid;

  gap: 10px;

  padding: 0;

}



.journal-title {

  font-weight: 600;

  font-size: 22px;

  line-height: 1.35;

}



.journal-meta {

  font-size: 14px;

  color: #8a8a8a;

}



.journal-summary {

  font-size: 16px;

  line-height: 1.6;

  color: #555;

  max-width: 540px;

  display: -webkit-box;

  -webkit-line-clamp: 2;

  -webkit-box-orient: vertical;

  overflow: hidden;

}



.read-more {

  margin-top: 10px;

  align-self: flex-start;

  font-size: 15px;

  font-weight: 500;

  color: #2b7a6f;

  background: transparent;

  border: none;

  padding: 0;

  cursor: pointer;

}



.read-more:hover {

  text-decoration: underline;

}



.journal-card--closed {

  grid-template-columns: minmax(0, 2fr) minmax(0, 1fr);

  align-items: start;

}



.journal-card--closed .journal-cover {

  grid-column: 2;

  grid-row: 1;

}



.journal-card--closed .journal-body {

  grid-column: 1;

  grid-row: 1;

}



.journal-card--open {

  grid-template-columns: minmax(0, 2fr) minmax(0, 1fr);

  align-items: start;

}



.journal-grid .journal-card {

  grid-template-columns: 1fr 180px;

  padding: 18px 18px 18px 16px;

  height: 100%;

  align-content: start;

}



.journal-grid .journal-cover {

  height: 100%;

  align-items: center;

  aspect-ratio: auto;

}



.journal-grid .journal-cover img {

  height: 100%;

  object-fit: contain;

  max-height: 140px;

}



.journal-card--open .journal-cover {

  grid-column: 2;

  grid-row: 1;

}



.journal-card--open .journal-body {

  grid-column: 1;

  grid-row: 1;

  padding-right: 6px;

}



@media (max-width: 900px) {

  .journal-hero {

    flex-direction: column;

    align-items: flex-start;

  }



  .journal-grid {

    grid-template-columns: 1fr;

  }

  .journal-collections__grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }



  .journal-grid .journal-card {

    grid-template-columns: 1fr;

  }



  .journal-grid .journal-cover img {

    max-height: 200px;

  }



  .journal-card--feature {

    grid-template-columns: 1fr;

    padding: 18px;

  }

}

@media (max-width: 640px) {
  .journal-collections__grid {
    grid-template-columns: 1fr;
  }
}



@keyframes journalFade {

  from {

    opacity: 0;

    transform: translateY(10px);

  }



  to {

    opacity: 1;

    transform: translateY(0);

  }

}



</style>

