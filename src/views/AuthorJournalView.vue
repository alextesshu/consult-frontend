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
                v-model.trim="journalForm.summary"
                class="input"
                rows="3"
                placeholder="2–3 речення для превʼю"
              />
            </label>

            <label class="field field--full">
              <span class="label">Текст поста</span>
              <textarea
                v-model.trim="journalForm.body"
                class="input input--area"
                rows="10"
                placeholder="Основний текст"
              />
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
            <div class="muted">
              {{ post.is_published ? 'Опубліковано' : 'Чернетка' }}
              <span v-if="post.published_at">· {{ formatJournalDate(post.published_at) }}</span>
              <span v-else>· {{ formatJournalDate(post.created_at) }}</span>
            </div>
            <div class="muted" v-if="post.summary">{{ post.summary }}</div>
            <div v-if="openPostId === post.id" class="journal-admin-body">
              {{ post.body }}
            </div>
          </div>
          <div class="journal-admin-actions">
            <button class="btn btn--ghost btn--sm" type="button" @click="togglePostPreview(post.id)">
              {{ openPostId === post.id ? 'Згорнути' : 'Переглянути' }}
            </button>
            <button class="btn btn--ghost btn--sm" type="button" @click="startInlineEdit(post)">
              Редагувати
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
const coverInput = ref<HTMLInputElement | null>(null)
const coverPreviewUrl = ref('')
const coverUploading = ref(false)
const coverChanged = ref(false)
const journalForm = reactive({
  title: '',
  summary: '',
  body: '',
  cover_image_url: '',
  is_published: false,
})

const editForm = reactive({
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

@media (max-width: 900px) {
  .journal-hero {
    flex-direction: column;
    align-items: flex-start;
  }
}
</style>
