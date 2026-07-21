<template>
  <section class="panel panel--trust" v-if="hasCompetenceContent || publicDocuments.length">
    <div class="panel__header">
      <div>
        <p class="panel__eyebrow">Публічна інформація</p>
        <h2 class="panel__title">Моя професійна підготовка</h2>
        <p class="panel__lead">
          Цей розділ містить інформацію, яку спеціаліст вирішив опублікувати:
          освіту, професійний розвиток і документи. Pro Consult показує ці дані
          як частину профілю, але не позначає їх як перевірені платформою.
        </p>
      </div>
    </div>

    <div v-if="hasCompetenceContent" class="competence-block">
      <article v-if="educationSummary" class="competence-entry">
        <h3 class="competence-entry__title">Коротко про підготовку</h3>
        <p class="competence-entry__text">{{ educationSummary }}</p>
      </article>

      <article v-if="educationItems.length" class="competence-entry">
        <h3 class="competence-entry__title">Базова освіта / програми</h3>
        <ul class="competence-list">
          <li
            v-for="(item, index) in educationItems"
            :key="`education-${index}-${item}`"
            class="competence-list__item"
          >
            {{ item }}
          </li>
        </ul>
      </article>

      <article v-if="professionalDevelopmentItems.length" class="competence-entry">
        <h3 class="competence-entry__title">Курси та професійний розвиток</h3>
        <ul class="competence-list">
          <li
            v-for="(item, index) in professionalDevelopmentItems"
            :key="`development-${index}-${item}`"
            class="competence-list__item"
          >
            {{ item }}
          </li>
        </ul>
      </article>
    </div>

    <section class="documents-block" v-if="publicDocuments.length">
      <div class="documents-block__header">
        <div class="documents-block__summary">
          <div>
            <h3 class="documents-block__title">Документи та сертифікати</h3>
            <p class="documents-block__lead">
              Документи додані спеціалістом. Pro Consult показує їх для ознайомлення і не підтверджує їхній зміст.
            </p>
          </div>
          <div class="documents-block__count">{{ documentsCountLabel }}</div>
        </div>
        <button
          class="documents-block__toggle"
          type="button"
          :aria-expanded="documentsExpanded"
          :aria-controls="documentsGridId"
          :aria-label="documentsToggleAriaLabel"
          @click="documentsExpanded = !documentsExpanded"
        >
          <span>{{ documentsExpanded ? 'Згорнути документи' : 'Показати документи' }}</span>
          <span class="documents-block__toggle-count">{{ publicDocuments.length }}</span>
          <span class="documents-block__toggle-chevron" aria-hidden="true">
            {{ documentsExpanded ? '⌃' : '⌄' }}
          </span>
        </button>
      </div>

      <div v-if="documentsExpanded" :id="documentsGridId" class="documents-grid">
        <article
          v-for="document in publicDocuments"
          :key="document.id"
          class="document-card"
          :class="{ 'document-card--file': !canRenderImageDocument(document) }"
        >
          <div v-if="canRenderImageDocument(document)" class="document-card__preview">
            <img
              :src="documentFileUrl(document)"
              :alt="document.title"
              loading="lazy"
            />
          </div>
          <div v-else class="document-card__file-top">
            <div class="document-card__file-badge">
              {{ isPdfDocument(document) ? 'PDF' : 'DOC' }}
            </div>
            <div class="document-card__kind document-card__kind--file">{{ documentKindLabel(document.document_kind) }}</div>
          </div>
          <div class="document-card__body">
            <div v-if="canRenderImageDocument(document)" class="document-card__kind">{{ documentKindLabel(document.document_kind) }}</div>
            <h3 class="document-card__title">{{ document.title }}</h3>
            <div v-if="document.uploaded_at" class="document-card__meta">
              Додано: {{ formatDate(document.uploaded_at) }}
            </div>
          </div>
          <a
            v-if="hasDocumentFileUrl(document)"
            class="btn btn--ghost document-card__action"
            :href="documentFileUrl(document)"
            target="_blank"
            rel="noopener noreferrer"
          >
            {{ isPdfDocument(document) ? 'Відкрити документ' : 'Відкрити' }}
          </a>
          <div v-else class="document-card__missing">Перегляд файла тимчасово недоступний.</div>
        </article>
      </div>
    </section>
  </section>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'

type PublicDocument = {
  id: number | string
  title: string
  file_url?: string | null
  document_kind: string
  uploaded_at?: string | null
}

type Props = {
  educationSummary: string
  educationItems: string[]
  professionalDevelopmentItems: string[]
  publicDocuments: PublicDocument[]
  isImageDocument: (document: any) => boolean
  isPdfDocument: (document: any) => boolean
  documentKindLabel: (kind: string) => string
  formatDate: (value: string) => string
}

const props = defineProps<Props>()
const documentsExpanded = ref(false)
const documentsGridId = 'public-profile-documents-grid'

const hasCompetenceContent = computed(
  () =>
    Boolean(props.educationSummary) ||
    props.educationItems.length > 0 ||
    props.professionalDevelopmentItems.length > 0
)

const documentsCountLabel = computed(() => {
  const count = props.publicDocuments.length
  const mod10 = count % 10
  const mod100 = count % 100
  if (mod10 === 1 && mod100 !== 11) return `${count} документ`
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return `${count} документи`
  return `${count} документів`
})

const documentsToggleAriaLabel = computed(
  () =>
    `${documentsExpanded.value ? 'Згорнути документи' : 'Показати документи'}, ${props.publicDocuments.length}`
)

function hasDocumentFileUrl(document: PublicDocument): boolean {
  return Boolean(String(document.file_url || '').trim())
}

function documentFileUrl(document: PublicDocument): string {
  return String(document.file_url || '').trim()
}

function canRenderImageDocument(document: PublicDocument): boolean {
  return hasDocumentFileUrl(document) && props.isImageDocument(document)
}
</script>

<style scoped>
.panel--trust,
.panel--documents {
  grid-column: 1 / -1;
}

.panel {
  border: 1px solid var(--line);
  border-radius: var(--radius-lg);
  padding: 18px 18px 20px;
  background: color-mix(in srgb, #ffffff 90%, var(--surface));
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

.panel__title {
  margin: 0;
  font-family: var(--font-display);
  font-size: 22px;
}

.panel__lead {
  margin: 0;
  max-width: 76ch;
  color: var(--muted);
  font-size: 13px;
  line-height: 1.5;
}

.panel__eyebrow {
  margin: 0;
  width: fit-content;
  font-size: 11px;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  font-weight: 700;
  color: color-mix(in srgb, var(--pc-navy-900) 78%, var(--pc-text-muted));
}

.competence-block {
  display: grid;
  gap: 10px;
}

.competence-entry {
  border: 1px solid var(--line);
  border-radius: 12px;
  padding: 10px 12px;
  background: color-mix(in srgb, var(--color-primary-100) 20%, #ffffff);
  display: grid;
  gap: 8px;
}

.competence-entry__title {
  margin: 0;
  font-size: 14px;
  line-height: 1.4;
}

.competence-entry__text {
  margin: 0;
  white-space: pre-line;
  color: color-mix(in srgb, var(--text) 92%, var(--muted));
  line-height: 1.55;
}

.competence-list {
  margin: 0;
  padding-left: 0;
  list-style: none;
  display: grid;
  gap: 6px;
}

.competence-list__item {
  line-height: 1.5;
  display: grid;
  grid-template-columns: auto minmax(0, 1fr);
  gap: 8px;
}

.competence-list__item::before {
  content: '●';
  font-size: 9px;
  line-height: 1.7;
  color: var(--pc-teal-500);
}

.documents-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(min(100%, 178px), 1fr));
  gap: 8px;
  align-items: start;
}

.documents-block {
  display: grid;
  gap: 10px;
  padding-top: 6px;
  border-top: 1px dashed color-mix(in srgb, var(--line) 82%, #d8cfbf);
}

.documents-block__header {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  align-items: flex-start;
  flex-wrap: wrap;
}

.documents-block__summary {
  display: grid;
  gap: 6px;
  min-width: min(100%, 340px);
  flex: 1;
}

.documents-block__title {
  margin: 0;
  font-family: var(--font-display);
  font-size: 18px;
  line-height: 1.3;
}

.documents-block__lead {
  margin: 0;
  color: var(--muted);
  font-size: 13px;
  line-height: 1.45;
}

.documents-block__count {
  width: fit-content;
  border: 1px solid color-mix(in srgb, var(--line) 82%, #d8cfbf);
  border-radius: 10px;
  padding: 4px 8px;
  color: color-mix(in srgb, var(--text) 86%, var(--muted));
  background: #fff;
  font-size: 12px;
  font-weight: 700;
}

.documents-block__toggle {
  min-height: 38px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  border: 1px solid var(--line);
  border-radius: 10px;
  padding: 8px 10px;
  background: #fff;
  color: var(--text);
  font: inherit;
  font-size: 13px;
  font-weight: 700;
  cursor: pointer;
  box-shadow: 0 4px 12px rgba(53, 46, 34, 0.06);
}

.documents-block__toggle:hover {
  border-color: color-mix(in srgb, var(--pc-navy-900) 24%, var(--line));
}

.documents-block__toggle:focus-visible {
  outline: 2px solid var(--pc-navy-900);
  outline-offset: 2px;
}

.documents-block__toggle-count {
  min-width: 22px;
  border-radius: 8px;
  padding: 2px 6px;
  color: var(--pc-navy-900);
  background: color-mix(in srgb, var(--color-primary-100) 42%, #ffffff);
  border: 1px solid color-mix(in srgb, var(--pc-navy-900) 16%, var(--line));
  font-size: 12px;
}

.documents-block__toggle-chevron {
  line-height: 1;
  color: var(--muted);
}

.document-card {
  border: 1px solid var(--line);
  border-radius: 12px;
  padding: 8px;
  background: #fff;
  display: grid;
  gap: 7px;
  min-width: 0;
}

.document-card--file {
  gap: 7px;
  background: color-mix(in srgb, #f8f3e8 38%, #ffffff);
}

.document-card__preview {
  width: 100%;
  height: clamp(92px, 11vw, 122px);
  border-radius: 10px;
  border: 1px solid var(--line);
  overflow: hidden;
  background: color-mix(in srgb, #f4efe2 58%, #ffffff);
  padding: 5px;
}

.document-card__preview img {
  width: 100%;
  height: 100%;
  object-fit: contain;
  display: block;
  border-radius: 7px;
}

.document-card__file-top {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.document-card__file-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 44px;
  height: 26px;
  padding: 0 10px;
  border-radius: 8px;
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: #6a573f;
  border: 1px solid #dccdb4;
  background: color-mix(in srgb, #efe1c9 76%, #ffffff);
}

.document-card__body {
  display: grid;
  gap: 3px;
  min-width: 0;
}

.document-card__kind {
  width: fit-content;
  padding: 3px 7px;
  border-radius: 8px;
  font-size: 10px;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: #5f5345;
  border: 1px solid #e6dccb;
  background: #f5efe3;
}

.document-card__title {
  margin: 0;
  font-size: 15px;
  line-height: 1.3;
  overflow: hidden;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow-wrap: anywhere;
}

.document-card__meta {
  font-size: 11px;
  color: var(--muted);
}

.document-card__kind--file {
  margin: 0;
}

.document-card__action {
  justify-self: start;
  min-height: 34px;
  padding: 7px 10px;
}

.document-card__missing {
  color: var(--muted);
  font-size: 12px;
  line-height: 1.35;
}

@media (max-width: 960px) {
  .documents-grid {
    grid-template-columns: repeat(auto-fit, minmax(min(100%, 160px), 1fr));
  }
}

@media (max-width: 520px) {
  .documents-grid {
    grid-template-columns: 1fr;
  }

  .documents-block__toggle {
    width: 100%;
  }
}
</style>
