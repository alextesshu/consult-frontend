<template>
  <PublicProfileOverlay :open="open" kind="share" title="Поділитися профілем" title-id="profile-share-title" :anchor="anchor" @update:open="emit('update:open', $event)">
    <div class="pc2-profile-share__card"><img v-if="photo" :src="photo" alt="" /><div><strong>{{ name }}</strong><p>{{ canonicalUrl }}</p></div></div>
    <div class="pc2-profile-share__targets">
      <a :href="telegram" target="_blank" rel="noopener noreferrer" @click="emit('shared', 'telegram')"><span class="pc2-profile-share__tg">TG</span>Telegram</a>
      <button type="button" @click="copy(true)"><span class="pc2-profile-share__ig">IG</span>Instagram</button>
      <a :href="facebook" target="_blank" rel="noopener noreferrer" @click="emit('shared', 'facebook')"><span class="pc2-profile-share__fb">f</span>Facebook</a>
      <a :href="threads" target="_blank" rel="noopener noreferrer" @click="emit('shared', 'threads')"><span class="pc2-profile-share__th">@</span>Threads</a>
    </div>
    <p v-if="instagram" role="status">Посилання скопійовано — вставте в сторіз або в шапку профілю.</p>
    <p v-if="error" role="alert">Не вдалося скопіювати. Скопіюйте адресу вручну: {{ canonicalUrl }}</p>
    <button class="pc2-profile-share__copy" type="button" @click="copy(false)">{{ copied ? 'Скопійовано ✓' : 'Копіювати посилання' }}</button>
  </PublicProfileOverlay>
</template>
<script setup lang="ts">
import { computed, onBeforeUnmount, ref, watch } from 'vue'
import PublicProfileOverlay from './PublicProfileOverlay.vue'
const props = defineProps<{ open: boolean; canonicalUrl: string; name: string; photo?: string | null; anchor?: HTMLElement | null }>()
const emit = defineEmits<{ 'update:open': [value: boolean]; shared: [destination: 'copy_link' | 'telegram' | 'facebook' | 'threads'] }>()
const copied = ref(false), error = ref(false), instagram = ref(false)
let generation = 0
onBeforeUnmount(() => { generation++ })
watch(() => props.open, () => { generation++; copied.value = false; error.value = false; instagram.value = false })
const telegram = computed(() => `https://t.me/share/url?url=${encodeURIComponent(props.canonicalUrl)}&text=${encodeURIComponent(props.name)}`)
const facebook = computed(() => `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(props.canonicalUrl)}`)
const threads = computed(() => `https://www.threads.net/intent/post?text=${encodeURIComponent(props.name + ' ' + props.canonicalUrl)}`)
async function copy(toInstagram: boolean) {
 const token = generation
 try {
  if (!navigator.clipboard?.writeText) throw new Error('Clipboard unavailable')
  await navigator.clipboard.writeText(props.canonicalUrl)
  if (token !== generation || !props.open) return
  copied.value = true; error.value = false; instagram.value = toInstagram; emit('shared', 'copy_link')
 } catch { if (token === generation && props.open) { error.value = true; copied.value = false; instagram.value = false } }
}
</script>
<style>
html[data-ui="v2"] .pc2-profile-share__card { display: flex; gap: 12px; align-items: center; padding: 12px; border: 1px solid #EDE7DE; border-radius: 16px; background: #FBF9F5; }
html[data-ui="v2"] .pc2-profile-share__card img { width: 44px; height: 44px; border-radius: 12px; object-fit: cover; }
html[data-ui="v2"] .pc2-profile-share__card div { min-width: 0; }
html[data-ui="v2"] .pc2-profile-share__card p { overflow-wrap: anywhere; font-size: 13px; color: #5A6578; margin: 4px 0 0; }
html[data-ui="v2"] .pc2-profile-share__targets { display: grid; grid-template-columns: repeat(4,minmax(0,1fr)); gap: 4px; margin: 14px 0; }
html[data-ui="v2"] .pc2-profile-share__targets :is(a,button) { display: flex; align-items: center; flex-direction: column; gap: 6px; padding: 8px 0; border: 0; background: transparent; font: inherit; font-size: 12px; color: #12233A; text-decoration: none; cursor: pointer; }
html[data-ui="v2"] .pc2-profile-share__targets span { width: 52px; height: 52px; display: grid; place-items: center; border-radius: 16px; color: #fff; font-size: 16px; font-weight: 600; }
html[data-ui="v2"] .pc2-profile-share__tg { background: #2A9FD8; } html[data-ui="v2"] .pc2-profile-share__ig { background: #C13584; } html[data-ui="v2"] .pc2-profile-share__fb { background: #1877F2; } html[data-ui="v2"] .pc2-profile-share__th { background: #12233A; }
html[data-ui="v2"] .pc2-profile-share__copy { width: 100%; min-height: 52px; border: 1.5px solid #12345A; border-radius: 999px; color: #12345A; background: #fff; font: inherit; cursor: pointer; }
</style>
