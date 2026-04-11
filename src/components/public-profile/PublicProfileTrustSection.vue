<template>
  <section class="panel panel--trust" v-if="hasCompetenceContent || publicDocuments.length">
    <div class="panel__header">
      <div>
        <div class="badge badge--soft">Професійний профіль</div>
        <h2 class="panel__title">Освіта і професійний розвиток</h2>
        <p class="panel__lead">
          Коротко про професійну підготовку спеціаліста та матеріали, які він додав для ознайомлення.
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
        <h3 class="documents-block__title">Документи та сертифікати</h3>
        <p class="documents-block__lead">
          Матеріали, завантажені спеціалістом для ознайомлення. PRO CONSULT не здійснює автоматичної
          верифікації їх змісту, якщо інше прямо не зазначено.
        </p>
      </div>

      <div class="documents-grid">
        <article
          v-for="document in publicDocuments"
          :key="document.id"
          class="document-card"
          :class="{ 'document-card--file': !isImageDocument(document) }"
        >
          <div v-if="isImageDocument(document)" class="document-card__preview">
            <img
              :src="document.file_url"
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
            <div v-if="isImageDocument(document)" class="document-card__kind">{{ documentKindLabel(document.document_kind) }}</div>
            <h3 class="document-card__title">{{ document.title }}</h3>
            <div v-if="document.uploaded_at" class="document-card__meta">
              Додано: {{ formatDate(document.uploaded_at) }}
            </div>
          </div>
          <a
            class="btn btn--ghost document-card__action"
            :href="document.file_url"
            target="_blank"
            rel="noopener noreferrer"
          >
            {{ isPdfDocument(document) ? 'Відкрити документ' : 'Відкрити' }}
          </a>
        </article>
      </div>
    </section>
  </section>
</template>

<script setup lang="ts">
import { computed } from 'vue'

type PublicDocument = {
  id: number | string
  title: string
  file_url: string
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

const hasCompetenceContent = computed(
  () =>
    Boolean(props.educationSummary) ||
    props.educationItems.length > 0 ||
    props.professionalDevelopmentItems.length > 0
)
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
  color: var(--muted);
  font-size: 14px;
  line-height: 1.55;
  max-width: 78ch;
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
  padding-left: 18px;
  display: grid;
  gap: 6px;
}

.competence-list__item {
  line-height: 1.5;
}

.documents-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(min(100%, 220px), 280px));
  gap: 10px;
  justify-content: start;
  align-items: start;
}

.documents-block {
  display: grid;
  gap: 10px;
  padding-top: 6px;
  border-top: 1px dashed color-mix(in srgb, var(--line) 82%, #d8cfbf);
}

.documents-block__header {
  display: grid;
  gap: 4px;
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

.document-card {
  border: 1px solid var(--line);
  border-radius: 14px;
  padding: 10px;
  background: #fff;
  display: grid;
  gap: 8px;
}

.document-card--file {
  gap: 8px;
  background: color-mix(in srgb, #f8f3e8 38%, #ffffff);
}

.document-card__preview {
  width: 100%;
  height: clamp(124px, 16vw, 172px);
  border-radius: 12px;
  border: 1px solid var(--line);
  overflow: hidden;
  background: color-mix(in srgb, #f4efe2 58%, #ffffff);
  padding: 6px;
}

.document-card__preview img {
  width: 100%;
  height: 100%;
  object-fit: contain;
  display: block;
  border-radius: 8px;
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
  border-radius: 999px;
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
  gap: 4px;
}

.document-card__kind {
  width: fit-content;
  padding: 4px 8px;
  border-radius: 999px;
  font-size: 11px;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: #5f5345;
  border: 1px solid #e6dccb;
  background: #f5efe3;
}

.document-card__title {
  margin: 0;
  font-size: 17px;
  line-height: 1.35;
}

.document-card__meta {
  font-size: 12px;
  color: var(--muted);
}

.document-card__kind--file {
  margin: 0;
}

.document-card__action {
  justify-self: start;
}

.badge--soft {
  background: color-mix(in srgb, #e4e9dc 62%, #f8f3e9);
  border-color: color-mix(in srgb, #6f8b73 26%, var(--line));
  color: color-mix(in srgb, #3f5945 82%, var(--text));
}

@media (max-width: 960px) {
  .documents-grid {
    grid-template-columns: repeat(auto-fit, minmax(min(100%, 190px), 240px));
  }
}
</style>
