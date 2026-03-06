<template>
  <section class="journal-page">
    <header class="journal-hero">
      <div>
        <div class="badge">Кабінет спеціаліста</div>
        <h1 class="title journal-title">Авторський журнал</h1>
        <p class="muted journal-subtitle">
          Публікуйте нотатки для профілю спеціаліста. Опубліковані записи видно всім.
        </p>
      </div>
      <div class="journal-actions">
        <RouterLink class="btn btn--ghost" to="/cabinet/profile">Профіль</RouterLink>
        <RouterLink class="btn btn--ghost" to="/cabinet">Назад до кабінету</RouterLink>
      </div>
    </header>

    <section class="panel">
      <div class="panel__header">
        <div>
          <div class="panel__eyebrow">
            <span class="pill pill--neutral">Створення</span>
          </div>
          <h2 class="panel__title">Новий запис</h2>
          <p class="panel__hint">
            Чернетки видно лише вам. Опубліковані записи зʼявляються у публічному профілі.
          </p>
        </div>

        <div class="panel__headerActions">
          <button
            class="btn"
            type="button"
            @click="createOpen = !createOpen; if (createOpen) cancelInlineEdit()"
          >
            {{ createOpen ? 'Згорнути' : '+ Новий пост' }}
          </button>
        </div>
      </div>

      <div v-if="createOpen" class="collapse">
        <form class="form" @submit.prevent="onSaveJournal">
        <div class="form-grid">
          <label class="field">
            <span class="label">Категорія</span>
            <select v-model="journalForm.category" class="input">
              <option value="TIP">Порада</option>
              <option value="EXPLAIN">Пояснення</option>
              <option value="PRACTICE">Практика</option>
              <option value="RESEARCH">Дослідження</option>
              <option value="FAQ">FAQ</option>
            </select>
          </label>

          <label class="field">
            <span class="label">Назва</span>
            <input
              v-model.trim="journalForm.title"
              class="input"
                type="text"
                placeholder="Напр. Як підготуватись до першої сесії"
                autocomplete="off"
              />
            </label>

            <label class="field">
              <span class="label">Короткий опис</span>
            <textarea
              ref="summaryInput"
              v-model.trim="journalForm.summary"
              class="input"
              rows="3"
              placeholder="2–3 речення для превʼю"
              @focus="activeMdField = 'summary'"
            />
            </label>

          <label class="field field--full">
            <span class="label">Текст поста</span>
            <div class="md-toolbar" role="toolbar" aria-label="Форматування тексту">
              <button
                class="md-btn"
                type="button"
                title="Жирний"
                @mousedown.prevent
                @click="mdWrap('**', '**')"
              >
                <b>B</b>
              </button>
              <button
                class="md-btn"
                type="button"
                title="Курсив"
                @mousedown.prevent
                @click="mdWrap('_', '_')"
              >
                <i>I</i>
              </button>
              <button
                class="md-btn"
                type="button"
                title="Посилання"
                @mousedown.prevent
                @click="mdLink()"
              >
                🔗
              </button>
              <button class="md-btn" type="button" title="Список" @mousedown.prevent @click="mdList()">•</button>
            </div>

            <textarea
              ref="bodyInput"
              v-model.trim="journalForm.body"
              class="input input--area"
              rows="10"
              placeholder="Основний текст (підтримується Markdown: **жирний**, _курсив_, списки, посилання)"
              @focus="activeMdField = 'body'"
            />

            <div class="muted md-hint">
              Підтримується Markdown. Приклад: <code>**жирний**</code>, <code>_курсив_</code>,
              <code>[текст](https://...)</code>.
            </div>
          </label>

            <div class="field field--full">
              <span class="label">Обкладинка</span>

              <div class="cover">
                <div class="cover-controls">
                  <input
                    ref="coverInput"
                    class="input input--file"
                    type="file"
                    accept="image/*"
                    @change="onCoverSelected"
                  />

                  <button class="btn btn--ghost btn--sm" type="button" @click="triggerCoverSelect">
                    Завантажити
                  </button>

                  <button
                    v-if="coverPreviewUrl"
                    class="btn btn--ghost btn--sm"
                    type="button"
                    :disabled="coverUploading"
                    @click="clearCover"
                  >
                    Прибрати
                  </button>

                  <span v-if="coverUploading" class="muted">Завантаження…</span>
                </div>

                <div v-if="coverPreviewUrl" class="cover-preview">
                  <img :src="coverPreviewUrl" alt="Обкладинка поста" />
                </div>

                <p class="muted cover-hint">
                  Рекомендація: горизонтальне зображення, без дрібного тексту.
                </p>
              </div>
            </div>

            <label class="check field--full">
              <input v-model="journalForm.is_published" type="checkbox" />
              <span>Опублікувати</span>
              <span class="muted">— запис стане видимим у публічному профілі</span>
            </label>
          </div>

          <div class="actions">
            <button class="btn" type="submit" :disabled="journalSaving">
              Створити
            </button>

            <button class="btn btn--ghost" type="button" :disabled="journalSaving" @click="resetJournalForm">
              Очистити
            </button>

            <span v-if="journalSaving" class="muted">Збереження…</span>
          </div>

          <div v-if="journalError" class="form-error" role="alert">{{ journalError }}</div>
        </form>
      </div>
    </section>

    <section class="panel">
      <div class="panel__header">
        <div>
          <div class="badge badge--soft">Список</div>
          <h2 class="panel__title">Ваші записи</h2>
        </div>
      </div>

      <div class="journal-tabs">
        <button
          class="journal-tab"
          :class="{ active: activeTab === 'posts' }"
          @click="activeTab = 'posts'"
        >
          Записи
        </button>

        <button
          class="journal-tab"
          :class="{ active: activeTab === 'collections' }"
          @click="activeTab = 'collections'"
        >
          Добірки
        </button>
      </div>

      <div v-if="activeTab === 'posts'">
        <div v-if="journalLoading" class="muted">Завантаження постів...</div>
        <div v-else-if="journalPosts.length === 0" class="muted">
          Ще немає постів.
        </div>
        <div v-else class="journal-admin-list">
        <article v-for="post in journalPosts" :key="post.id" class="journal-admin-card">
          <template v-if="editingPostId === post.id">
            <div class="inline-edit">
            <div class="inline-edit__top">
              <div class="pill pill--warm">Редагування</div>
              <div class="muted">ID: {{ post.id }}</div>
            </div>

            <label class="field">
              <span class="label">Категорія</span>
              <select v-model="editForm.category" class="input">
                <option value="TIP">Порада</option>
                <option value="EXPLAIN">Пояснення</option>
                <option value="PRACTICE">Практика</option>
                <option value="RESEARCH">Дослідження</option>
                <option value="FAQ">FAQ</option>
              </select>
            </label>

            <label class="field">
              <span class="label">Назва</span>
              <input v-model.trim="editForm.title" class="input" type="text" />
            </label>

              <label class="field">
                <span class="label">Короткий опис</span>
                <textarea v-model.trim="editForm.summary" class="input" rows="3" />
              </label>

              <label class="field">
                <span class="label">Текст поста</span>
                <div class="md-toolbar" role="toolbar" aria-label="Форматування тексту">
                  <button
                    class="md-btn"
                    type="button"
                    title="Жирний"
                    @mousedown.prevent="prepareEditSelection"
                    @click="mdWrapEdit('**', '**')"
                  >
                    <b>B</b>
                  </button>
                  <button
                    class="md-btn"
                    type="button"
                    title="Курсив"
                    @mousedown.prevent="prepareEditSelection"
                    @click="mdWrapEdit('_', '_')"
                  >
                    <i>I</i>
                  </button>
                  <button
                    class="md-btn"
                    type="button"
                    title="Посилання"
                    @mousedown.prevent="prepareEditSelection"
                    @click="mdLinkEdit()"
                  >
                    🔗
                  </button>
                  <button
                    class="md-btn"
                    type="button"
                    title="Список"
                    @mousedown.prevent="prepareEditSelection"
                    @click="mdListEdit()"
                  >
                    •
                  </button>
                </div>
                <textarea
                  :ref="setEditBodyInput"
                  v-model="editForm.body"
                  class="input input--area"
                  rows="10"
                  placeholder="Основний текст"
                  @focus="updateEditSelection"
                  @select="updateEditSelection"
                  @keyup="updateEditSelection"
                  @mouseup="updateEditSelection"
                />
              </label>

              <div class="field">
                <span class="label">Обкладинка</span>
                <div class="cover-row">
                  <input
                    ref="editCoverInput"
                    class="input input--file cover-input"
                    type="file"
                    accept="image/*"
                    @change="onEditCoverSelected"
                  />
                  <button class="btn btn--ghost btn--sm" type="button" @click="triggerEditCoverSelect">
                    Завантажити
                  </button>
                  <button
                    v-if="editForm.coverPreviewUrl"
                    class="btn btn--ghost btn--sm"
                    type="button"
                    :disabled="editCoverUploading"
                    @click="clearEditCover"
                  >
                    Прибрати
                  </button>
                  <span v-if="editCoverUploading" class="muted">Завантаження…</span>
                </div>

                <div v-if="editForm.coverPreviewUrl" class="cover-preview">
                  <img :src="editForm.coverPreviewUrl" alt="Обкладинка поста" />
                </div>
              </div>

              <label class="check">
                <input v-model="editForm.is_published" type="checkbox" />
                <span>Опублікувати</span>
              </label>

              <div class="field-row">
                <button class="btn" type="button" :disabled="editSaving" @click="saveInlineEdit(post.id)">
                  Зберегти
                </button>
                <button class="btn btn--ghost" type="button" :disabled="editSaving" @click="cancelInlineEdit">
                  Скасувати
                </button>
              </div>
            </div>
          </template>

          <template v-else>
            <div class="journal-admin-main">
              <div class="journal-admin-content">
                <div class="journal-admin-badges">
                  <span class="post-tag" :style="{ '--cat': categoryColor(post.category) }">
                    {{ categoryLabel(post.category) }}
                  </span>
                  <span v-if="post.is_featured" class="pin-badge">Закріплено</span>
                </div>

                <div class="journal-admin-title">{{ post.title }}</div>

                <div class="journal-meta">
                  {{ post.is_published ? 'Опубліковано' : 'Чернетка' }}
                  - {{ formatJournalDate(post.published_at || post.created_at) }}
                  - {{ readingTime(post.body || post.summary) }} хв читання
                </div>

                <div v-if="post.summary" class="journal-summary" v-html="renderMarkdown(post.summary)"></div>

                <div class="journal-admin-actions-inline">
                  <button class="btn btn--sm btn--primary-soft" type="button" @click="startInlineEdit(post)">
                    Редагувати
                  </button>

                  <button class="btn btn--ghost btn--sm" type="button" @click="previewPost(post)">
                    Переглянути
                  </button>

                  <button
                    v-if="!post.is_featured"
                    class="btn btn--ghost btn--sm"
                    type="button"
                    @click="pinPost(post)"
                  >
                    Закріпити
                  </button>

                  <button
                    v-else
                    class="btn btn--ghost btn--sm"
                    type="button"
                    @click="unpinPost(post)"
                  >
                    Відкріпити
                  </button>

                  <button class="btn btn--ghost btn--sm btn--danger-soft" type="button" @click="requestDeleteJournal(post)">
                    Видалити
                  </button>
                </div>
              </div>

              <div v-if="post.cover_image_url" class="journal-admin-cover">
                <img :src="post.cover_image_url" alt="Обкладинка поста" />
              </div>
              <div v-else class="journal-admin-cover journal-admin-cover--fallback">
                <span class="cover-fallback-icon">*</span>
              </div>
            </div>
          </template>
        </article>
        </div>
      </div>

      <div v-if="activeTab === 'collections'">
        <p class="collections-hint">
          Об’єднуйте записи в серії, щоб клієнтам було легше читати матеріали по порядку.
        </p>

        <div class="collections-actions">
          <button class="btn" type="button" @click="createCollectionOpen = !createCollectionOpen">
            {{ createCollectionOpen ? 'Скасувати' : 'Створити серію' }}
          </button>
        </div>

        <form v-if="createCollectionOpen" class="form collection-form" @submit.prevent="onCreateCollection">
          <div class="collection-form__head">
            <h3 class="collection-form__title">Створити серію</h3>
            <p class="collection-form__subtitle">
              Об’єднайте кілька записів у спільну тему. Після створення серії ви зможете додати до неї потрібні записи.
            </p>
          </div>

          <div class="form-grid">
            <label class="field">
              <span class="label">Назва серії</span>
              <input v-model.trim="collectionForm.title" class="input" type="text" required />
            </label>

            <label class="field field--full">
              <span class="label">Опис серії</span>
              <textarea v-model.trim="collectionForm.description" class="input" rows="3" />
            </label>

            <label class="check field--full">
              <input v-model="collectionForm.is_published" type="checkbox" />
              <span>Публічно</span>
            </label>
          </div>

          <div class="actions">
            <button class="btn" type="submit" :disabled="collectionSubmitting">
              Створити серію
            </button>
            <span v-if="collectionSubmitting" class="muted">Збереження…</span>
          </div>
        </form>

        <div v-if="collectionError" class="form-error" role="alert">{{ collectionError }}</div>
        <p v-if="collectionSuccessMessage" class="journal-success-message">
          {{ collectionSuccessMessage }}
        </p>

        <div v-if="collectionsLoading">Завантаження...</div>

        <div v-else-if="!collections.length">
          <strong>У вас ще немає добірок</strong><br />
          Створіть першу серію та додайте до неї потрібні записи.
        </div>

        <div v-else class="journal-collections-list">
          <article
            v-for="collection in collections"
            :key="collection.id"
            class="journal-collection-row"
          >
            <div class="journal-collection-row__top">
              <div>
                <div>{{ collection.title }}</div>
                <div>{{ collection.posts_count }} постів</div>
                <div v-if="collection.description">{{ collection.description }}</div>
              </div>
              <button class="btn btn--ghost btn--sm" type="button" @click="toggleManageCollection(collection.id)">
                {{ managingCollectionId === collection.id ? 'Сховати' : 'Керувати постами' }}
              </button>
            </div>

            <div v-if="managingCollectionId === collection.id" class="collection-manage">
              <div v-if="collectionDetailsLoadingId === collection.id" class="muted">
                Завантаження складу добірки...
              </div>
              <div v-else-if="!journalPosts.length" class="muted">
                Немає постів для додавання.
              </div>
              <div v-else class="collection-posts-list">
                <article v-for="post in journalPosts" :key="post.id" class="collection-post-row">
                  <div class="collection-post-row__title">{{ post.title }}</div>
                  <button
                    class="btn btn--ghost btn--sm"
                    type="button"
                    :disabled="isPostInCollection(collection.id, post.id) || collectionAddingKey === `${collection.id}:${post.id}`"
                    @click="addPostToCollection(collection.id, post.id)"
                  >
                    {{
                      isPostInCollection(collection.id, post.id)
                        ? 'Додано'
                        : collectionAddingKey === `${collection.id}:${post.id}`
                          ? 'Додаємо...'
                          : 'Додати'
                    }}
                  </button>
                </article>
              </div>
            </div>
          </article>
        </div>
      </div>
    </section>

    <ConfirmModal
      :open="journalDeleteModal.open"
      :title="journalDeleteModal.title"
      :message="journalDeleteModal.message"
      :confirm-text="journalDeleteModal.confirmText"
      :cancel-text="journalDeleteModal.cancelText"
      :tone="journalDeleteModal.tone"
      @confirm="journalDeleteModal.confirm"
      @cancel="journalDeleteModal.closeConfirm"
    />
  </section>
</template>

<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import DOMPurify from 'dompurify'
import { marked } from 'marked'
import {
  fetchAuthorJournalPosts,
  fetchCabinetJournalCollections,
  createCabinetJournalCollection,
  fetchCabinetJournalCollectionDetail,
  createCabinetJournalCollectionItem,
  fetchSpecialistProfile,
  createAuthorJournalPost,
  updateAuthorJournalPost,
  deleteAuthorJournalPost,
  uploadAuthorJournalCover,
  getApiErrorMessage,
  type AuthorJournalPost,
  type CabinetJournalCollection,
  type CabinetJournalCollectionDetail,
} from '../lib/api'
import ConfirmModal from '../components/ConfirmModal.vue'
import { useConfirmModal } from '../composables/useConfirmModal'

const journalLoading = ref(false)
const collectionsLoading = ref(false)
const collectionSubmitting = ref(false)
const collectionDetailsLoadingId = ref<number | null>(null)
const collectionAddingKey = ref('')
const journalSaving = ref(false)
const journalError = ref('')
const collectionError = ref('')
const collectionSuccessMessage = ref('')
const journalPosts = ref<AuthorJournalPost[]>([])
const collections = ref<CabinetJournalCollection[]>([])
const profileSlug = ref('')
const createOpen = ref(false)
const editingPostId = ref<number | null>(null)
const openPostId = ref<number | null>(null)
const editSaving = ref(false)
const editCoverInput = ref<HTMLInputElement | null>(null)
const editBodyInput = ref<HTMLTextAreaElement | null>(null)
const editSelStart = ref(0)
const editSelEnd = ref(0)
const editCoverUploading = ref(false)
const bodyInput = ref<HTMLTextAreaElement | null>(null)
const summaryInput = ref<HTMLTextAreaElement | null>(null)
const router = useRouter()
const activeTab = ref<'posts' | 'collections'>('posts')
const createCollectionOpen = ref(false)
const managingCollectionId = ref<number | null>(null)
const collectionDetailsById = ref<Record<number, CabinetJournalCollectionDetail>>({})
const activeMdField = ref<'summary' | 'body'>('body')
const coverInput = ref<HTMLInputElement | null>(null)
const coverPreviewUrl = ref('')
const coverUploading = ref(false)
const coverChanged = ref(false)
const journalForm = reactive({
  category: 'EXPLAIN' as 'TIP' | 'EXPLAIN' | 'FAQ' | 'RESEARCH' | 'PRACTICE',
  title: '',
  summary: '',
  body: '',
  cover_image_url: '',
  is_published: false,
})
const collectionForm = reactive({
  title: '',
  description: '',
  is_published: false,
})

const editForm = reactive({
  category: 'EXPLAIN' as 'TIP' | 'EXPLAIN' | 'FAQ' | 'RESEARCH' | 'PRACTICE',
  title: '',
  summary: '',
  body: '',
  is_published: false,
  cover_image_url: '',
  coverPreviewUrl: '',
  coverChanged: false,
})
const journalDeleteModal = useConfirmModal()

async function loadJournal() {
  journalLoading.value = true
  journalError.value = ''
  try {
    journalPosts.value = await fetchAuthorJournalPosts()
  } catch (err) {
    journalPosts.value = []
    journalError.value = getApiErrorMessage(err, 'Не вдалося завантажити авторський журнал')
  } finally {
    journalLoading.value = false
  }
}

async function loadCollections() {
  collectionsLoading.value = true
  collectionError.value = ''
  try {
    collections.value = await fetchCabinetJournalCollections()
  } catch (err) {
    collections.value = []
    collectionError.value = getApiErrorMessage(err, 'Не вдалося завантажити добірки')
  } finally {
    collectionsLoading.value = false
  }
}

async function loadProfileSlug() {
  try {
    const profile = await fetchSpecialistProfile()
    profileSlug.value = profile.public_slug || ''
  } catch {
    profileSlug.value = ''
  }
}


function resetJournalForm() {
  journalForm.category = 'EXPLAIN'
  journalForm.title = ''
  journalForm.summary = ''
  journalForm.body = ''
  journalForm.cover_image_url = ''
  journalForm.is_published = false
  coverPreviewUrl.value = ''
  coverChanged.value = false
}

function resetCollectionForm() {
  collectionForm.title = ''
  collectionForm.description = ''
  collectionForm.is_published = false
}

function slugify(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/['’"]/g, '')
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-_]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
}

async function onCreateCollection() {
  collectionSubmitting.value = true
  collectionError.value = ''
  try {
    await createCabinetJournalCollection({
      title: collectionForm.title,
      slug: slugify(collectionForm.title),
      description: collectionForm.description,
      is_published: collectionForm.is_published,
    })
    await loadCollections()
    resetCollectionForm()
    createCollectionOpen.value = false
    collectionSuccessMessage.value = 'Серію створено.'
    setTimeout(() => {
      collectionSuccessMessage.value = ''
    }, 3000)
  } catch (err) {
    collectionError.value = getApiErrorMessage(err, 'Не вдалося створити добірку')
  } finally {
    collectionSubmitting.value = false
  }
}

function isPostInCollection(collectionId: number, postId: number): boolean {
  const detail = collectionDetailsById.value[collectionId]
  if (!detail) return false
  return detail.items.some((item) => item.post === postId)
}

async function loadCollectionDetail(collectionId: number) {
  collectionDetailsLoadingId.value = collectionId
  collectionError.value = ''
  try {
    const detail = await fetchCabinetJournalCollectionDetail(collectionId)
    collectionDetailsById.value[collectionId] = detail
  } catch (err) {
    collectionError.value = getApiErrorMessage(err, 'Не вдалося завантажити склад добірки')
  } finally {
    collectionDetailsLoadingId.value = null
  }
}

async function toggleManageCollection(collectionId: number) {
  if (managingCollectionId.value === collectionId) {
    managingCollectionId.value = null
    return
  }
  managingCollectionId.value = collectionId
  await loadCollectionDetail(collectionId)
}

async function addPostToCollection(collectionId: number, postId: number) {
  if (isPostInCollection(collectionId, postId)) return
  const addKey = `${collectionId}:${postId}`
  collectionAddingKey.value = addKey
  collectionError.value = ''
  try {
    const detail = await createCabinetJournalCollectionItem(collectionId, { post: postId })
    collectionDetailsById.value[collectionId] = detail
    await loadCollections()
  } catch (err) {
    collectionError.value = getApiErrorMessage(err, 'Не вдалося додати пост у добірку')
  } finally {
    collectionAddingKey.value = ''
  }
}

async function onSaveJournal() {
  journalSaving.value = true
  journalError.value = ''
  try {
    const payload: Partial<AuthorJournalPost> = {
      category: journalForm.category,
      title: journalForm.title,
      summary: journalForm.summary,
      body: journalForm.body,
      is_published: journalForm.is_published,
    }
    if (coverChanged.value) {
      payload.cover_image_url = journalForm.cover_image_url
    }
    await createAuthorJournalPost(payload)
    await loadJournal()
    resetJournalForm()
    createOpen.value = false
  } catch (err) {
    journalError.value = getApiErrorMessage(err, 'Не вдалося зберегти пост')
  } finally {
    journalSaving.value = false
  }
}

function startInlineEdit(post: AuthorJournalPost) {
  createOpen.value = false
  editingPostId.value = post.id
  editForm.category = (post.category || 'EXPLAIN') as 'TIP' | 'EXPLAIN' | 'FAQ' | 'RESEARCH' | 'PRACTICE'
  editForm.title = post.title || ''
  editForm.summary = post.summary || ''
  editForm.body = post.body || ''
  editForm.is_published = post.is_published
  editForm.cover_image_url = ''
  editForm.coverPreviewUrl = post.cover_image_url || ''
  editForm.coverChanged = false
}

function cancelInlineEdit() {
  editingPostId.value = null
  editForm.category = 'EXPLAIN'
  editForm.title = ''
  editForm.summary = ''
  editForm.body = ''
  editForm.is_published = false
  editForm.cover_image_url = ''
  editForm.coverPreviewUrl = ''
  editForm.coverChanged = false
}

function togglePostPreview(postId: number) {
  openPostId.value = openPostId.value === postId ? null : postId
}

async function saveInlineEdit(postId: number) {
  editSaving.value = true
  journalError.value = ''
  try {
    const payload: Partial<AuthorJournalPost> = {
      category: editForm.category,
      title: editForm.title,
      summary: editForm.summary,
      body: editForm.body,
      is_published: editForm.is_published,
    }
    if (editForm.coverChanged) {
      payload.cover_image_url = editForm.cover_image_url
    }
    await updateAuthorJournalPost(postId, payload)
    await loadJournal()
    cancelInlineEdit()
  } catch (err) {
    journalError.value = getApiErrorMessage(err, 'Не вдалося оновити пост')
  } finally {
    editSaving.value = false
  }
}

async function pinPost(post: AuthorJournalPost) {
  journalError.value = ''
  try {
    const pinned = journalPosts.value.filter((p) => p.is_featured)
    const nextOrder = pinned.length === 0 ? 1 : Math.max(...pinned.map((p) => p.featured_order || 0)) + 1
    await updateAuthorJournalPost(post.id, {
      is_featured: true,
      featured_order: nextOrder,
    })
    await loadJournal()
  } catch (err) {
    journalError.value = getApiErrorMessage(err, 'Не вдалося закріпити пост')
  }
}

async function unpinPost(post: AuthorJournalPost) {
  journalError.value = ''
  try {
    await updateAuthorJournalPost(post.id, {
      is_featured: false,
      featured_order: 0,
    })
    await loadJournal()
  } catch (err) {
    journalError.value = getApiErrorMessage(err, 'Не вдалося відкріпити пост')
  }
}

function triggerEditCoverSelect() {
  editCoverInput.value?.click()
}

async function onEditCoverSelected(event: Event) {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  if (!file) return

  journalError.value = ''
  editCoverUploading.value = true
  try {
    const data = await uploadAuthorJournalCover(file)
    editForm.cover_image_url = data.blob_name
    editForm.coverPreviewUrl = data.preview_url || data.blob_name
    editForm.coverChanged = true
  } catch (err) {
    journalError.value = getApiErrorMessage(err, 'Не вдалося завантажити обкладинку')
  } finally {
    editCoverUploading.value = false
    input.value = ''
  }
}

function clearEditCover() {
  editForm.cover_image_url = ''
  editForm.coverPreviewUrl = ''
  editForm.coverChanged = true
}

function previewPost(post: AuthorJournalPost) {
  const specialistSlug = profileSlug.value
  if (!specialistSlug || !post.slug) return
  router.push(`/${specialistSlug}/journal/${post.slug}`)
}

function requestDeleteJournal(post: AuthorJournalPost) {
  journalDeleteModal.openConfirm({
    title: 'Видалити пост?',
    message: 'Пост зникне з публічного профілю.',
    confirmText: 'Видалити',
    cancelText: 'Скасувати',
    tone: 'danger',
    onConfirm: async () => {
      journalError.value = ''
      try {
        await deleteAuthorJournalPost(post.id)
        await loadJournal()
        if (editingPostId.value === post.id) {
          cancelInlineEdit()
        }
      } catch (err) {
        journalError.value = getApiErrorMessage(err, 'Не вдалося видалити пост')
      }
    },
  })
}

function formatJournalDate(value: string | null) {
  if (!value) return ''
  const dt = new Date(value)
  if (Number.isNaN(dt.getTime())) return value
  return dt.toLocaleDateString('uk-UA', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })
}

function readingTime(text: string | null | undefined): number {
  if (!text) return 1
  const words = text.trim().split(/\s+/).length
  const minutes = Math.ceil(words / 200)
  return Math.max(1, minutes)
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

function updateEditSelection() {
  const el = editBodyInput.value
  if (!el) return
  editSelStart.value = el.selectionStart ?? 0
  editSelEnd.value = el.selectionEnd ?? editSelStart.value
}

function setEditBodyInput(el: HTMLTextAreaElement | null) {
  if (el) {
    editBodyInput.value = el
  }
}

function prepareEditSelection() {
  // Capture selection before toolbar click steals focus
  const el = editBodyInput.value
  if (!el) return
  editSelStart.value = el.selectionStart ?? editSelStart.value
  editSelEnd.value = el.selectionEnd ?? editSelEnd.value
}

function mdWrapEdit(left: string, right: string) {
  const el = editBodyInput.value
  if (!el) return

  const value = editForm.body || ''
  const start = (el.selectionStart ?? 0) || editSelStart.value
  const end = (el.selectionEnd ?? 0) || editSelEnd.value || start
  const selected = value.slice(start, end) || (start !== end ? '' : 'текст')

  editForm.body = value.slice(0, start) + left + selected + right + value.slice(end)

  requestAnimationFrame(() => {
    el.focus()
    const selStart = start + left.length
    const selEnd = selStart + selected.length
    el.setSelectionRange(selStart, selEnd)
  })
}

function mdLinkEdit() {
  const el = editBodyInput.value
  if (!el) return

  const value = editForm.body || ''
  const start = (el.selectionStart ?? 0) || editSelStart.value
  const end = (el.selectionEnd ?? 0) || editSelEnd.value || start
  const selected = value.slice(start, end) || (start !== end ? '' : 'посилання')
  const url = 'https://'

  const snippet = `[${selected}](${url})`
  editForm.body = value.slice(0, start) + snippet + value.slice(end)

  requestAnimationFrame(() => {
    el.focus()
    const urlStart = start + 1 + selected.length + 2
    const urlEnd = urlStart + url.length
    el.setSelectionRange(urlStart, urlEnd)
  })
}

function mdListEdit() {
  const el = editBodyInput.value
  if (!el) return

  const value = editForm.body || ''
  const start = (el.selectionStart ?? 0) || editSelStart.value
  const end = (el.selectionEnd ?? 0) || editSelEnd.value || start
  const selected = value.slice(start, end)

  const lines = (selected || 'пункт 1\nпункт 2')
    .split('\n')
    .map((l) => (l.trim().startsWith('- ') ? l : `- ${l}`))
    .join('\n')

  editForm.body = value.slice(0, start) + lines + value.slice(end)

  requestAnimationFrame(() => {
    el.focus()
    el.setSelectionRange(start, start + lines.length)
  })
}

function mdWrap(left: string, right: string) {
  const el = activeMdField.value === 'summary' ? summaryInput.value : bodyInput.value
  if (!el) return

  const value = activeMdField.value === 'summary' ? journalForm.summary || '' : journalForm.body || ''
  const start = el.selectionStart ?? 0
  const end = el.selectionEnd ?? 0
  const selected = value.slice(start, end) || 'текст'
  const next = value.slice(0, start) + left + selected + right + value.slice(end)
  if (activeMdField.value === 'summary') {
    journalForm.summary = next
  } else {
    journalForm.body = next
  }

  requestAnimationFrame(() => {
    el.focus()
    const selStart = start + left.length
    const selEnd = selStart + selected.length
    el.setSelectionRange(selStart, selEnd)
  })
}

function mdLink() {
  const el = activeMdField.value === 'summary' ? summaryInput.value : bodyInput.value
  if (!el) return

  const value = activeMdField.value === 'summary' ? journalForm.summary || '' : journalForm.body || ''
  const start = el.selectionStart ?? 0
  const end = el.selectionEnd ?? 0
  const selected = value.slice(start, end) || 'посилання'
  const url = 'https://'
  const snippet = `[${selected}](${url})`
  const next = value.slice(0, start) + snippet + value.slice(end)
  if (activeMdField.value === 'summary') {
    journalForm.summary = next
  } else {
    journalForm.body = next
  }

  requestAnimationFrame(() => {
    el.focus()
    const urlStart = start + 1 + selected.length + 2
    const urlEnd = urlStart + url.length
    el.setSelectionRange(urlStart, urlEnd)
  })
}

function mdList() {
  const el = activeMdField.value === 'summary' ? summaryInput.value : bodyInput.value
  if (!el) return

  const value = activeMdField.value === 'summary' ? journalForm.summary || '' : journalForm.body || ''
  const start = el.selectionStart ?? 0
  const end = el.selectionEnd ?? 0
  const selected = value.slice(start, end)
  const lines = (selected || 'пункт 1\nпункт 2')
    .split('\n')
    .map((l) => (l.trim().startsWith('- ') ? l : `- ${l}`))
    .join('\n')
  const next = value.slice(0, start) + lines + value.slice(end)
  if (activeMdField.value === 'summary') {
    journalForm.summary = next
  } else {
    journalForm.body = next
  }

  requestAnimationFrame(() => {
    el.focus()
    el.setSelectionRange(start, start + lines.length)
  })
}

function triggerCoverSelect() {
  coverInput.value?.click()
}

async function onCoverSelected(event: Event) {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  if (!file) return
  journalError.value = ''
  coverUploading.value = true
  try {
    const data = await uploadAuthorJournalCover(file)
    journalForm.cover_image_url = data.blob_name
    coverPreviewUrl.value = data.preview_url || data.blob_name
    coverChanged.value = true
  } catch (err) {
    journalError.value = getApiErrorMessage(err, 'Не вдалося завантажити обкладинку')
  } finally {
    coverUploading.value = false
    input.value = ''
  }
}

function clearCover() {
  journalForm.cover_image_url = ''
  coverPreviewUrl.value = ''
  coverChanged.value = true
}

onMounted(() => {
  loadJournal()
  loadCollections()
  loadProfileSlug()
})
</script>

<style scoped>
.journal-page {
  display: grid;
  gap: 18px;
}

.journal-hero {
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  gap: 20px;
  background: linear-gradient(135deg, rgba(22, 175, 142, 0.18), rgba(17, 64, 54, 0.08));
  border: 1px solid var(--line);
  border-radius: var(--radius);
  padding: 22px 24px;
  box-shadow: var(--shadow);
}

.journal-title {
  font-size: 32px;
}

.journal-subtitle {
  max-width: 560px;
}

.journal-actions {
  display: flex;
  gap: 12px;
  align-items: center;
  flex-wrap: wrap;
  justify-content: flex-end;
}

.panel {
  border: 1px solid var(--line);
  border-radius: 18px;
  padding: 18px;
  background: #fff;
  display: grid;
  gap: 14px;
}

.panel__header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
}

.panel__headerActions {
  display: flex;
  align-items: center;
  gap: 12px;
}

.collapse {
  margin-top: 12px;
  padding-top: 12px;
  border-top: 1px solid var(--line);
}

.panel__title {
  margin: 0;
  font-family: var(--font-display);
  font-size: 22px;
}

.panel__hint {
  margin: 6px 0 0;
  font-size: 13px;
  color: var(--muted);
  max-width: 640px;
}

.badge--soft {
  background: rgba(22, 175, 142, 0.16);
}

.journal-tabs {
  display: inline-flex;
  gap: 8px;
  padding: 4px;
  border: 1px solid var(--line);
  border-radius: 12px;
  background: rgba(246, 248, 250, 0.8);
}

.journal-tab {
  border: 0;
  background: transparent;
  color: var(--muted);
  font-size: 14px;
  font-weight: 600;
  padding: 8px 12px;
  border-radius: 8px;
  cursor: pointer;
}

.journal-tab.active {
  background: #fff;
  color: var(--text);
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.08);
}

.journal-admin-list {
  display: grid;
  gap: 12px;
}

.journal-collections-list {
  display: grid;
  gap: 10px;
}

.collections-actions {
  margin-bottom: 12px;
}

.collections-hint {
  margin: 0 0 10px;
  color: var(--muted);
  font-size: 14px;
  line-height: 1.5;
}

.collection-form {
  margin-bottom: 12px;
}

.collection-form__head {
  margin-bottom: 10px;
}

.collection-form__title {
  margin: 0 0 4px;
  font-size: 18px;
}

.collection-form__subtitle {
  margin: 0;
  color: var(--muted);
  font-size: 14px;
  line-height: 1.5;
}

.journal-success-message {
  margin: 0 0 10px;
  color: #1f5f56;
  font-size: 14px;
  font-weight: 600;
}

.journal-collection-row {
  border: 1px solid var(--line);
  border-radius: 12px;
  padding: 12px 14px;
  background: #fff;
}

.journal-collection-row__top {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 12px;
}

.collection-manage {
  margin-top: 12px;
  padding-top: 12px;
  border-top: 1px solid var(--line);
}

.collection-posts-list {
  display: grid;
  gap: 8px;
}

.collection-post-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  border: 1px solid var(--line);
  border-radius: 10px;
  padding: 8px 10px;
  background: #fff;
}

.collection-post-row__title {
  font-size: 14px;
}

.journal-admin-card {
  border: 1px solid var(--line);
  border-radius: 12px;
  padding: 12px;
  background: #fff;
  display: block;
}

.journal-admin-main {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(0, 200px);
  gap: 24px;
  align-items: start;
}

.journal-admin-content {
  display: grid;
  gap: 10px;
  align-content: start;
}

.journal-admin-badges,
.inline-edit__badges {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  align-items: center;
  margin-bottom: 4px;
}

.post-tag {
  --cat: #2b7a6f;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  padding: 6px 10px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.9);
  border: 1px solid rgba(0, 0, 0, 0.06);
  color: var(--cat);
  width: fit-content;
  line-height: 1;
}

.post-tag::before {
  content: "";
  width: 8px;
  height: 8px;
  border-radius: 999px;
  background: currentColor;
  opacity: 0.9;
}

.journal-admin-cover {
  width: 100%;
  max-width: 200px;
  aspect-ratio: 1 / 1;
  border-radius: 14px;
  overflow: hidden;
  border: 1px solid var(--line);
  background: #f7f3e8;
  padding: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  justify-self: end;
}

.journal-admin-cover img {
  width: 100%;
  height: 100%;
  display: block;
  object-fit: contain;
  object-position: 50% 50%;
  border-radius: 10px;
}

.journal-admin-title {
  font-size: 20px;
  line-height: 1.35;
  font-weight: 600;
  color: var(--color-neutral-900, #111315);
  margin-top: 2px;
}

.journal-meta {
  font-size: 14px;
  color: #8a8a8a;
}

.pin-badge {
  display: inline-flex;
  align-items: center;
  gap: 8px;
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
  line-height: 1;
}

.journal-summary {
  font-size: 15px;
  line-height: 1.65;
  color: #5c636a;
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
  max-width: 720px;
}

.btn--primary-soft {
  background: rgba(43, 122, 111, 0.12);
  border: 1px solid rgba(43, 122, 111, 0.28);
  color: #1f5f56;
}

.btn--primary-soft:hover {
  background: rgba(43, 122, 111, 0.18);
}

.btn--danger-soft {
  border-color: rgba(181, 82, 74, 0.25);
  color: #8a3c34;
}

.btn--danger-soft:hover {
  background: rgba(181, 82, 74, 0.08);
}

.journal-admin-actions-inline {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-top: 8px;
}

.journal-admin-body {
  white-space: pre-wrap;
  color: var(--color-neutral-800, #1e2124);
}


.cover-row {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}

.cover-input {
  display: none;
}

.cover-preview {
  margin-top: 10px;
  border-radius: 12px;
  overflow: hidden;
  border: 1px solid var(--line);
  background: #fff;
  max-width: 320px;
}

.cover-preview img {
  width: 100%;
  display: block;
}

.inline-edit {
  width: 100%;
  display: grid;
  gap: 12px;
}

.inline-edit__top {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
}

.inline-edit .field-row {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
}

.md-toolbar {
  display: flex;
  gap: 8px;
  align-items: center;
  padding: 8px 10px;
  border: 1px solid var(--line);
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.75);
  margin: 8px 0 10px;
}

.md-btn {
  border: 1px solid var(--line);
  background: #fff;
  border-radius: 10px;
  padding: 6px 10px;
  cursor: pointer;
  font-size: 13px;
  line-height: 1;
}

.md-btn:hover {
  transform: translateY(-1px);
}

.md-hint {
  margin-top: 8px;
  font-size: 12px;
}

@media (max-width: 900px) {
  .journal-hero {
    flex-direction: column;
    align-items: flex-start;
  }
}
</style>
