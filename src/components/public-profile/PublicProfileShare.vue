<template>
  <PublicProfileOverlay :open="open" kind="share" title="Поділитися профілем" title-id="profile-share-title" :anchor="anchor" @update:open="emit('update:open', $event)">
    <div ref="content">
    <div class="pc2-profile-share__card"><img v-if="photo" :src="photo" alt="" /><div><strong>{{ name }}</strong><p>{{ canonicalUrl }}</p></div></div>
    <div class="pc2-profile-share__targets">
      <a :href="targets.telegram" target="_blank" rel="noopener noreferrer" @click="emit('shared', 'telegram')"><span class="pc2-profile-share__tg" aria-hidden="true">TG</span>Telegram</a>
      <button type="button" @click="copy(true)"><span class="pc2-profile-share__ig" aria-hidden="true">IG</span>Instagram<small>Копіювати посилання</small></button>
      <a :href="targets.facebook" target="_blank" rel="noopener noreferrer" @click="emit('shared', 'facebook')"><span class="pc2-profile-share__fb" aria-hidden="true">f</span>Facebook</a>
      <a :href="targets.threads" target="_blank" rel="noopener noreferrer" @click="threadsRequested = true; emit('shared', 'threads')"><span class="pc2-profile-share__th" aria-hidden="true">@</span>Threads</a>
    </div>
    <p class="pc2-profile-share__hint">Публікацію підтверджуєте самі у вибраній соцмережі.</p>
    <p v-if="threadsRequested" class="pc2-profile-share__hint" role="status">Threads не відкрився? Скопіюйте посилання кнопкою нижче та вставте його вручну.</p>
    <p v-if="copied" role="status">{{ instagram ? 'Посилання скопійовано — вставте в сторіз або в шапку профілю.' : 'Посилання скопійовано.' }}</p>
    <a v-if="instagram" class="pc2-profile-share__instagram-open" href="https://www.instagram.com/" target="_blank" rel="noopener noreferrer">Відкрити Instagram</a>
    <div v-if="error">
      <p role="alert">Не вдалося скопіювати. Виділіть посилання та скопіюйте вручну.</p>
      <label class="pc2-profile-share__manual">Посилання профілю<input :value="canonicalUrl" readonly @focus="selectManualUrl" /></label>
    </div>
    <button class="pc2-profile-share__copy" type="button" @click="copy(false)">{{ copied ? 'Скопійовано ✓' : 'Копіювати посилання' }}</button>
    </div>
  </PublicProfileOverlay>
</template>
<script setup lang="ts">
import { computed, onBeforeUnmount, ref, watch } from 'vue'
import PublicProfileOverlay from './PublicProfileOverlay.vue'
import { publicProfileShareTargets } from '../../lib/publicProfileSharing'
const props = defineProps<{ open: boolean; canonicalUrl: string; name: string; photo?: string | null; anchor?: HTMLElement | null }>()
const emit = defineEmits<{ 'update:open': [value: boolean]; shared: [destination: 'copy_link' | 'telegram' | 'facebook' | 'threads'] }>()
const copied = ref(false), error = ref(false), instagram = ref(false), threadsRequested = ref(false)
const content = ref<HTMLElement | null>(null)
let generation = 0
onBeforeUnmount(() => { generation++ })
watch(() => [props.open, props.canonicalUrl], () => { generation++; copied.value = false; error.value = false; instagram.value = false; threadsRequested.value = false }, { flush: 'sync' })
const targets = computed(() => publicProfileShareTargets(props.canonicalUrl, props.name))
function selectManualUrl(event: FocusEvent) { (event.target as HTMLInputElement).select() }
function fallbackCopy() {
 const previous = document.activeElement
 const textarea = document.createElement('textarea')
 textarea.value = props.canonicalUrl
 textarea.readOnly = true
 textarea.style.cssText = 'position:fixed;left:0;top:0;width:1px;height:1px;opacity:0'
 // A native modal makes body siblings inert: the fallback must remain inside it.
 content.value?.appendChild(textarea)
 try {
  textarea.focus({ preventScroll: true }); textarea.select()
  return typeof document.execCommand === 'function' && document.execCommand('copy')
 } catch { return false }
 finally { textarea.remove(); if (previous instanceof HTMLElement && previous.isConnected) previous.focus({ preventScroll: true }) }
}
async function copy(toInstagram: boolean) {
 const token = ++generation
 instagram.value = toInstagram
 copied.value = false; error.value = false
 try {
  let success = false
  try { if (navigator.clipboard?.writeText) { await navigator.clipboard.writeText(props.canonicalUrl); success = true } } catch { /* Try the in-dialog DOM fallback. */ }
  if (token !== generation || !props.open) return
  if (!success) success = fallbackCopy()
  if (!success) throw new Error('Clipboard unavailable')
  copied.value = true; emit('shared', 'copy_link')
 } catch { if (token === generation && props.open) { error.value = true; copied.value = false } }
}
</script>
<style>
html[data-ui="v2"] .pc2-profile-share__card { display: flex; gap: 12px; align-items: center; padding: 12px; border: 1px solid #EDE7DE; border-radius: 16px; background: #FBF9F5; }
html[data-ui="v2"] .pc2-profile-share__card img { width: 44px; height: 44px; border-radius: 12px; object-fit: cover; }
html[data-ui="v2"] .pc2-profile-share__card div { min-width: 0; }
html[data-ui="v2"] .pc2-profile-share__card p { overflow-wrap: anywhere; font-size: 13px; color: #5A6578; margin: 4px 0 0; }
html[data-ui="v2"] .pc2-profile-share__targets { display: grid; grid-template-columns: repeat(4,minmax(0,1fr)); gap: 4px; margin: 14px 0; }
html[data-ui="v2"] .pc2-profile-share__targets :is(a,button) { display: flex; align-items: center; flex-direction: column; gap: 6px; padding: 8px 0; border: 0; background: transparent; font: inherit; font-size: 12px; color: #12233A; text-decoration: none; cursor: pointer; }
html[data-ui="v2"] .pc2-profile-share__targets small { font-size: 10px; line-height: 1.3; text-align: center; }
html[data-ui="v2"] .pc2-profile-share__hint { font-size: 13px; line-height: 1.5; color: #5A6578; }
html[data-ui="v2"] .pc2-profile-share__instagram-open { display: inline-flex; align-items: center; min-height: 44px; margin-bottom: 8px; color: #12345A; }
html[data-ui="v2"] .pc2-profile-share__manual { display: grid; gap: 6px; margin-bottom: 12px; font-size: 13px; }
html[data-ui="v2"] .pc2-profile-share__manual input { width: 100%; min-width: 0; min-height: 44px; padding: 8px; border: 1px solid #EDE7DE; border-radius: 8px; }
html[data-ui="v2"] .pc2-profile-share__targets span { width: 52px; height: 52px; display: grid; place-items: center; border-radius: 16px; color: #fff; font-size: 16px; font-weight: 600; }
html[data-ui="v2"] .pc2-profile-share__tg { background: #2A9FD8; } html[data-ui="v2"] .pc2-profile-share__ig { background: #C13584; } html[data-ui="v2"] .pc2-profile-share__fb { background: #1877F2; } html[data-ui="v2"] .pc2-profile-share__th { background: #12233A; }
html[data-ui="v2"] .pc2-profile-share__copy { width: 100%; min-height: 52px; border: 1.5px solid #12345A; border-radius: 999px; color: #12345A; background: #fff; font: inherit; cursor: pointer; }
@media (min-width: 860px) {
 html[data-ui="v2"] .pc2-profile-overlay--share { max-height: calc(100dvh - var(--profile-share-top,120px) - 16px); }
}
</style>
