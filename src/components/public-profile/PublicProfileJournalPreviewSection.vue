<template>
  <div v-if="hasPublicJournalPosts" class="panel panel--journal" id="journal">
    <div class="panel__header">
      <div>
        <div class="badge badge--soft">Авторський журнал</div>
        <h2 class="panel__title">Статті та матеріали спеціаліста</h2>
        <p class="panel__lead">Матеріали допоможуть краще відчути стиль роботи і теми спеціаліста.</p>
      </div>
      <div class="panel__header-actions">
        <RouterLink class="btn btn--ghost btn--sm" :to="{ name: 'public-journal', params: { slug } }">
          Всі статті
        </RouterLink>
      </div>
    </div>

    <div v-if="journalLoading" class="muted">Завантажуємо журнал...</div>
    <div v-else-if="journalError" class="form-error">{{ journalError }}</div>
    <div v-else>
      <section v-if="previewCollections.length" class="profile-collections">
        <div class="profile-collections__head">
          <div class="profile-collections__title">Серії</div>
          <RouterLink class="btn btn--ghost btn--sm" :to="{ name: 'public-journal', params: { slug } }">
            Переглянути всі
          </RouterLink>
        </div>
        <div class="profile-collections__list">
          <RouterLink
            v-for="collection in previewCollections"
            :key="collection.slug"
            class="profile-collection-item"
            :to="{
              name: 'public-journal-collection',
              params: { specialist_slug: slug, collection_slug: collection.slug },
            }"
          >
            <div class="profile-collection-item__left">
              <div v-if="collectionCoverUrl(collection)" class="profile-collection-item__cover">
                <img :src="collectionCoverUrl(collection)" :alt="collection.title" />
              </div>
              <span class="profile-collection-item__name">{{ collection.title }}</span>
            </div>
            <span class="profile-collection-item__meta">{{ collection.posts_count }} статті</span>
          </RouterLink>
        </div>
      </section>

      <div v-if="canonicalEmptyStateCode" class="empty">
        <div class="empty-title">{{ canonicalEmptyStateTitle }}</div>
        <div class="muted">{{ canonicalEmptyStateBody }}</div>
      </div>
      <div v-else-if="filteredJournalPosts.length === 0" class="empty">
        <div class="empty-title">Немає статей у цій категорії</div>
        <div class="muted">Спробуйте інший фільтр або поверніться до всіх статей.</div>
        <button class="btn btn--ghost btn--sm" type="button" @click="$emit('set-active-category', 'ALL')">
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
            @click="$emit('set-active-category', opt.key)"
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
          @click="$emit('navigate-to-post', featuredPost)"
          @keydown.enter="$emit('navigate-to-post', featuredPost)"
          @keydown.space.prevent="$emit('navigate-to-post', featuredPost)"
        >
          <div class="journal-body">
            <span class="post-tag" :style="{ '--cat': categoryColor(featuredPost.category || undefined) }">
              {{ categoryLabel(featuredPost.category || undefined) }}
            </span>
            <span v-if="featuredPost.is_featured" class="pin-badge">Закріплено</span>
            <div class="journal-title">{{ featuredPost.title }}</div>
            <div class="journal-meta">
              {{ formatDate(featuredPost.published_at || featuredPost.created_at || '') }}
              · {{ readingTime(featuredPost.summary, featuredPost.reading_time_minutes) }} хв читання
            </div>
            <div class="journal-summary" v-if="featuredPost.summary" v-html="renderMarkdown(featuredPost.summary)"></div>
            <RouterLink
              class="read-more"
              :to="{ name: 'public-journal-post', params: { slug, postSlug: featuredPost.slug } }"
              @click.stop
            >
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
            @click="$emit('navigate-to-post', post)"
            @keydown.enter="$emit('navigate-to-post', post)"
            @keydown.space.prevent="$emit('navigate-to-post', post)"
          >
            <div class="journal-body">
              <span class="post-tag" :style="{ '--cat': categoryColor(post.category || undefined) }">
                {{ categoryLabel(post.category || undefined) }}
              </span>
              <span v-if="post.is_featured" class="pin-badge">Закріплено</span>
              <div class="journal-title">{{ post.title }}</div>
              <div class="journal-meta">
                {{ formatDate(post.published_at || post.created_at || '') }}
                · {{ readingTime(post.summary, post.reading_time_minutes) }} хв читання
              </div>
              <div
                class="journal-summary"
                v-if="post.summary"
                v-html="renderMarkdown(post.summary)"
              ></div>
              <RouterLink
                class="read-more"
                :to="{ name: 'public-journal-post', params: { slug, postSlug: post.slug } }"
                @click.stop
              >
                Читати статтю →
              </RouterLink>
            </div>
            <div v-if="post.cover_image_url" class="journal-cover">
              <img :src="post.cover_image_url" alt="Обкладинка статті" />
            </div>
          </article>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
type JournalCategory = 'ALL' | 'TIP' | 'EXPLAIN' | 'FAQ' | 'RESEARCH' | 'PRACTICE'

type JournalCategoryOption = {
  key: JournalCategory
  label: string
}

type JournalPost = {
  id: number
  slug: string
  title: string
  summary?: string | null
  cover_image_url?: string | null
  is_featured: boolean
  published_at?: string | null
  created_at?: string | null
  category?: string | null
  reading_time_minutes?: number | null
}

type JournalCollection = {
  slug: string
  title: string
  posts_count: number
  cover_image_url?: string | null
  preview_posts?: Array<{ title: string; slug: string }>
}

type Props = {
  hasPublicJournalPosts: boolean
  slug: string
  journalLoading: boolean
  journalError: string
  canonicalEmptyStateCode: 'JOURNAL_DISABLED' | 'NO_PUBLICATIONS' | null
  canonicalEmptyStateTitle: string
  canonicalEmptyStateBody: string
  previewCollections: JournalCollection[]
  collectionCoverUrl: (collection: any) => string
  filteredJournalPosts: JournalPost[]
  categoryOptions: JournalCategoryOption[]
  activeCategory: JournalCategory
  featuredPost: JournalPost | null
  gridPosts: JournalPost[]
  categoryColor: (category?: string) => string
  categoryLabel: (category?: string) => string
  formatDate: (value: string) => string
  readingTime: (text?: string | null, fixedMinutes?: number | null) => number
  renderMarkdown: (text?: string | null) => string
}

defineProps<Props>()

defineEmits<{
  (event: 'set-active-category', category: JournalCategory): void
  (event: 'navigate-to-post', post: any): void
}>()
</script>

<style scoped>
.panel--journal {
  grid-column: 1 / -1;
  display: grid;
  gap: 12px;
  background: linear-gradient(
    180deg,
    color-mix(in srgb, #f8f2e6 58%, #ffffff),
    color-mix(in srgb, #f4eee1 35%, #ffffff)
  );
}

.panel {
  border: 1px solid var(--line);
  border-radius: var(--radius-lg);
  padding: 18px 18px 20px;
  display: grid;
  gap: 14px;
}

.panel__header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 6px;
}

.panel__header > div {
  display: grid;
  gap: 6px;
}

.panel__header-actions {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
}

.panel__title {
  margin: 0;
  font-family: var(--font-display);
  font-size: 22px;
}

.panel__lead {
  margin: 0;
  color: var(--muted);
  font-size: 14px;
  line-height: 1.55;
  max-width: 78ch;
}

.profile-collections {
  border: 1px solid var(--line);
  border-radius: 12px;
  padding: 10px 12px;
  background: #fff;
  display: grid;
  gap: 10px;
}

.profile-collections__head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
}

.profile-collections__title {
  font-size: 16px;
  font-weight: 700;
}

.profile-collections__list {
  display: grid;
  gap: 8px;
}

.profile-collection-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  border: 1px solid var(--line);
  border-radius: 10px;
  padding: 8px 10px;
  color: inherit;
  text-decoration: none;
  background: rgba(255, 255, 255, 0.85);
}

.profile-collection-item__left {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  min-width: 0;
}

.profile-collection-item__cover {
  width: 42px;
  height: 30px;
  border-radius: 8px;
  overflow: hidden;
  border: 1px solid var(--line);
  background: var(--color-neutral-50, #f7f8f9);
  flex-shrink: 0;
}

.profile-collection-item__cover img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

.profile-collection-item:hover {
  border-color: rgba(43, 122, 111, 0.35);
  background: rgba(43, 122, 111, 0.06);
}

.profile-collection-item__name {
  font-size: 14px;
  font-weight: 600;
  min-width: 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.profile-collection-item__meta {
  font-size: 12px;
  color: var(--muted);
  white-space: nowrap;
}

.journal-list {
  display: grid;
  gap: 14px;
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
  margin: 2px 0 12px;
}

.filter-chip {
  border: 1px solid var(--line);
  background: rgba(255, 255, 255, 0.75);
  border-radius: 10px;
  padding: 7px 12px;
  font-size: 13px;
  cursor: pointer;
  transition: border-color 0.2s ease, background 0.2s ease, box-shadow 0.2s ease;
}

.filter-chip:hover {
  border-color: color-mix(in srgb, var(--primary) 34%, var(--line));
  box-shadow: 0 8px 18px rgba(16, 33, 50, 0.08);
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

.journal-card--pinned {
  border-color: rgba(43, 122, 111, 0.35);
  box-shadow: 0 8px 20px rgba(43, 122, 111, 0.08);
}

.journal-card {
  display: grid;
  border: 1px solid var(--line);
  border-radius: 14px;
  padding: 20px;
  background: #fff;
  overflow: hidden;
  gap: 18px;
  transition: border-color 0.2s ease, box-shadow 0.2s ease;
  height: auto;
  align-items: start;
  animation: journalFade 0.35s ease;
}

.journal-card:hover {
  border-color: color-mix(in srgb, var(--primary) 40%, var(--line));
  box-shadow: 0 8px 22px rgba(16, 33, 50, 0.1);
}

.journal-card--feature {
  grid-template-columns: 1fr minmax(240px, 320px);
  padding: 24px;
  grid-column: 1 / -1;
}

.journal-card--feature .journal-cover img {
  max-height: none;
}

.journal-card--feature .journal-title {
  font-size: 28px;
  line-height: 1.25;
}

.journal-card--feature .journal-summary {
  font-size: 16px;
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
  height: auto;
  display: block;
  height: 100%;
  object-fit: cover;
  object-position: 50% 35%;
  transition: transform 0.4s ease;
}

.journal-card:hover .journal-cover img {
  transform: scale(1.03);
}

.journal-body {
  display: grid;
  gap: 10px;
  padding: 0;
}

.journal-title {
  font-weight: 600;
  font-size: 22px;
  line-height: 1.33;
}

.journal-meta {
  font-size: 14px;
  color: #8a8a8a;
}

.journal-summary {
  font-size: 15px;
  line-height: 1.6;
  color: #555;
  max-width: 560px;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.read-more {
  margin-top: 6px;
  align-self: flex-start;
  font-size: 14px;
  font-weight: 600;
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

.journal-card--closed .journal-cover img {
  max-height: none;
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

.journal-grid .journal-title {
  font-size: 20px;
  line-height: 1.3;
}

.journal-grid .journal-summary {
  -webkit-line-clamp: 2;
}

.badge--soft {
  background: color-mix(in srgb, #e4e9dc 62%, #f8f3e9);
  border-color: color-mix(in srgb, #6f8b73 26%, var(--line));
  color: color-mix(in srgb, #3f5945 82%, var(--text));
}

@media (max-width: 900px) {
  .journal-grid {
    grid-template-columns: 1fr;
  }

  .journal-grid .journal-card {
    grid-template-columns: 1fr;
  }

  .journal-grid .journal-cover img {
    max-height: 200px;
  }

  .journal-card--closed,
  .journal-card--feature {
    grid-template-columns: 1fr;
    padding: 18px;
  }

  .journal-card--closed .journal-cover {
    padding: 10px 12px;
  }

  .journal-card--feature .journal-cover img {
    max-height: 220px;
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
