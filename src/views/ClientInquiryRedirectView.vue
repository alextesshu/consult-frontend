<template>
  <section class="redirect-state card">
    <div class="card__title">Переходимо до запиту</div>
    <div v-if="loading" class="muted">Шукаємо профіль спеціаліста...</div>
    <div v-else-if="error" class="form-error">{{ error }}</div>
    <RouterLink v-if="error" class="btn btn--ghost" to="/specialists">Перейти до каталогу</RouterLink>
  </section>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { RouterLink, useRoute, useRouter } from 'vue-router'
import { fetchPublicSpecialists } from '../lib/api'

const route = useRoute()
const router = useRouter()
const loading = ref(true)
const error = ref('')

function parsedSpecialistId() {
  const raw = Number(route.params.specialistId)
  if (!Number.isInteger(raw) || raw <= 0) return null
  return raw
}

async function resolvePublicSlugBySpecialistId(specialistId: number) {
  let page = 1
  let totalPages = 1

  while (page <= totalPages) {
    const resp = await fetchPublicSpecialists({
      page,
      page_size: 100,
    })
    const match = (resp.results || []).find(
      (item) => item.therapist_id === specialistId && (item.public_slug || item.slug)
    )
    const resolvedSlug = String(match?.public_slug || match?.slug || '').trim()
    if (resolvedSlug) {
      return resolvedSlug
    }
    totalPages = Math.max(resp.total_pages || 1, 1)
    page += 1
  }

  return ''
}

onMounted(async () => {
  const specialistId = parsedSpecialistId()
  if (!specialistId) {
    error.value = 'Не вдалося визначити спеціаліста для цього запиту.'
    loading.value = false
    return
  }

  try {
    const slug = await resolvePublicSlugBySpecialistId(specialistId)
    if (!slug) {
      error.value = 'Не вдалося відкрити профіль спеціаліста для цього запиту.'
      return
    }
    await router.replace({
      name: 'public-profile',
      params: { slug },
      hash: '#inquiry',
    })
  } catch {
    error.value = 'Не вдалося відкрити запит до бронювання.'
  } finally {
    loading.value = false
  }
})
</script>

<style scoped>
.redirect-state {
  display: grid;
  gap: 12px;
  max-width: 520px;
}
</style>
