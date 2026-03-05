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
                <textarea v-model.trim="editForm.body" class="input input--area" rows="8" />
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
              <div v-if="post.cover_image_url" class="journal-admin-cover">
                <img :src="post.cover_image_url" alt="Обкладинка поста" />
              </div>
            <div class="journal-admin-title">{{ post.title }}</div>
            <div class="journal-meta">
              <div v-if="post.is_featured" class="pin-badge">Закріплено</div>
              {{ post.is_published ? 'Опубліковано' : 'Чернетка' }}
              <span v-if="post.published_at">· {{ formatJournalDate(post.published_at) }}</span>
              <span v-else>· {{ formatJournalDate(post.created_at) }}</span>
              · {{ readingTime(post.body) }} хв читання
            </div>
            <div
              class="muted"
              v-if="post.summary"
              v-html="renderMarkdown(post.summary)"
            ></div>
            <div
              v-if="openPostId === post.id"
              class="journal-admin-body"
              v-html="renderMarkdown(post.body)"
            ></div>
          </div>
          <div class="journal-admin-actions">
            <button class="btn btn--ghost btn--sm" type="button" @click="togglePostPreview(post.id)">
              {{ openPostId === post.id ? 'Згорнути' : 'Переглянути' }}
            </button>
            <button class="btn btn--ghost btn--sm" type="button" @click="startInlineEdit(post)">
              Редагувати
            </button>
            <button
              v-if="!post.is_featured"
              class="btn btn--ghost btn--sm"
              type="button"
              title="Закріпити пост"
              @click="pinPost(post)"
            >
              📌 Закріпити
            </button>
            <button
              v-else
              class="btn btn--ghost btn--sm"
              type="button"
              title="Відкріпити пост"
              @click="unpinPost(post)"
            >
              📍 Відкріпити
            </button>
            <button class="btn btn--ghost btn--sm" type="button" @click="requestDeleteJournal(post)">
              Видалити
            </button>
          </div>
          </template>
        </article>
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
import DOMPurify from 'dompurify'
import { marked } from 'marked'
import {
  fetchAuthorJournalPosts,
  createAuthorJournalPost,
  updateAuthorJournalPost,
  deleteAuthorJournalPost,
  uploadAuthorJournalCover,
  getApiErrorMessage,
  type AuthorJournalPost,
} from '../lib/api'
import ConfirmModal from '../components/ConfirmModal.vue'
import { useConfirmModal } from '../composables/useConfirmModal'

const journalLoading = ref(false)
const journalSaving = ref(false)
const journalError = ref('')
const journalPosts = ref<AuthorJournalPost[]>([])
const createOpen = ref(false)
const editingPostId = ref<number | null>(null)
const openPostId = ref<number | null>(null)
const editSaving = ref(false)
const editCoverInput = ref<HTMLInputElement | null>(null)
const editCoverUploading = ref(false)
const bodyInput = ref<HTMLTextAreaElement | null>(null)
const summaryInput = ref<HTMLTextAreaElement | null>(null)
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

function renderMarkdown(text?: string | null) {
  if (!text) return ''
  const raw = marked.parse(text, { breaks: true }) as string
  return DOMPurify.sanitize(raw)
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

.journal-admin-list {
  display: grid;
  gap: 12px;
}

.journal-admin-card {
  border: 1px solid var(--line);
  border-radius: 12px;
  padding: 12px;
  background: #fff;
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
}

.journal-admin-main {
  display: grid;
  gap: 8px;
}

.journal-admin-cover {
  width: 160px;
  max-width: 100%;
  border-radius: 10px;
  overflow: hidden;
  border: 1px solid var(--line);
  background: #fff;
}

.journal-admin-cover img {
  width: 100%;
  display: block;
  object-fit: cover;
}

.journal-admin-title {
  font-weight: 600;
  margin-bottom: 4px;
}

.journal-meta {
  font-size: 14px;
  color: #8a8a8a;
  margin-bottom: 6px;
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
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
}

.journal-admin-body {
  white-space: pre-wrap;
  color: var(--color-neutral-800, #1e2124);
}

.journal-admin-actions {
  display: flex;
  flex-direction: column;
  gap: 8px;
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
