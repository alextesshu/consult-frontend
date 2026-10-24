<template>
  <Teleport to="body">
    <div v-if="open" class="pc2-mobile-menu" :class="{ 'is-clients': audience === 'clients' }">
      <div class="pc2-mobile-menu__backdrop" aria-hidden="true" @click="close"></div>
      <div id="public-mobile-menu-v2" ref="panel" class="pc2-mobile-menu__panel" role="dialog" aria-modal="true" aria-label="Меню сайту" tabindex="-1">
        <div class="pc2-mobile-menu__bar">
          <RouterLink class="pc2-mobile-menu__brand" to="/" @click="close"><img :src="fennecHeader" alt="Pro Consult"></RouterLink>
          <button ref="closeButton" class="pc2-mobile-menu__close" type="button" aria-label="Закрити меню" @click="close"><span aria-hidden="true">×</span></button>
        </div>
        <div class="pc2-mobile-menu__body">
          <nav class="pc2-mobile-menu__audience" aria-label="Для кого Pro Consult">
            <RouterLink to="/" :aria-current="audience === 'specialists' ? 'page' : undefined" @click="close">Для спеціалістів</RouterLink>
            <RouterLink to="/for-clients" :aria-current="audience === 'clients' ? 'page' : undefined" @click="close">Для клієнтів</RouterLink>
          </nav>
          <nav class="pc2-mobile-menu__links" :aria-label="audience === 'clients' ? 'Розділи для клієнтів' : 'Розділи для спеціалістів'">
            <RouterLink v-for="item in items" :key="item.label" :to="item.to" @click="close">{{ item.label }}<span aria-hidden="true">→</span></RouterLink>
          </nav>
          <div class="pc2-mobile-menu__actions">
            <RouterLink class="pc2-mobile-menu__primary" :to="primary.to" @click="close">{{ primary.label }}</RouterLink>
            <RouterLink class="pc2-mobile-menu__secondary" to="/login" @click="close">Увійти</RouterLink>
          </div>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { computed, ref, toRef, watch } from 'vue'
import { useRoute } from 'vue-router'
import { useMobileOverlay } from '../composables/useMobileOverlay'
import { PUBLIC_MENU_ITEMS, PUBLIC_MENU_PRIMARY, type PublicMenuAudience } from '../lib/publicMobileMenu'
import fennecHeader from '../assets/brand-v2/proconsult-fennec-header.svg'

const props = withDefaults(defineProps<{
  open: boolean
  audience?: PublicMenuAudience
  trigger?: HTMLElement | null
}>(), { audience: 'specialists', trigger: null })
const emit = defineEmits<{ 'update:open': [value: boolean] }>()

const route = useRoute()
const panel = ref<HTMLElement | null>(null)
const closeButton = ref<HTMLElement | null>(null)
const items = computed(() => PUBLIC_MENU_ITEMS[props.audience])
const primary = computed(() => PUBLIC_MENU_PRIMARY[props.audience])
const openState = computed({
  get: () => props.open,
  set: (value: boolean) => emit('update:open', value),
})
useMobileOverlay({ open: openState, panel, trigger: toRef(props, 'trigger'), initialFocus: closeButton })

function close() { emit('update:open', false) }
watch(() => route.fullPath, () => { if (props.open) close() })
</script>

<style>
/* Public-Mobile.dc.html P2: full-screen menu, audience switch, 56px rows, actions at the bottom. */
html[data-ui="v2"] .pc2-mobile-menu { position: fixed; inset: 0; z-index: 70; color: var(--pc-text-main); font-family: var(--pc-font); }
/* Full screen on phones (as in the 375px source frame); wider small screens keep the backdrop visible. */
html[data-ui="v2"] .pc2-mobile-menu__backdrop { position: absolute; inset: 0; background: rgb(18 35 58 / 42%); }
html[data-ui="v2"] .pc2-mobile-menu__panel { position: absolute; top: 0; right: 0; bottom: 0; display: flex; flex-direction: column; width: min(100%, 420px); overflow-y: auto; overscroll-behavior: contain; background: var(--pc-bg-main); outline: none; }
html[data-ui="v2"] .pc2-mobile-menu__bar { display: flex; flex-shrink: 0; align-items: center; justify-content: space-between; height: 60px; padding: 0 8px 0 16px; border-bottom: 1px solid var(--pc-border-hair); }
html[data-ui="v2"] .pc2-mobile-menu__brand { display: inline-flex; margin-left: -4px; }
html[data-ui="v2"] .pc2-mobile-menu__brand img { display: block; height: 30px; width: auto; }
html[data-ui="v2"] .pc2-mobile-menu__close { display: grid; place-items: center; width: 44px; height: 44px; padding: 0; border: 0; border-radius: 50%; background: none; color: var(--pc-text-main); font: inherit; font-size: 24px; line-height: 1; cursor: pointer; }
html[data-ui="v2"] .pc2-mobile-menu__body { flex: 1; display: flex; flex-direction: column; gap: 20px; padding: 16px 20px max(32px, env(safe-area-inset-bottom)); }
html[data-ui="v2"] .pc2-mobile-menu__audience { display: grid; grid-template-columns: 1fr 1fr; gap: 2px; padding: 3px; border-radius: 999px; background: var(--pc-bg-sunk); }
html[data-ui="v2"] .pc2-mobile-menu__audience a { display: flex; align-items: center; justify-content: center; height: 40px; border-radius: 999px; color: var(--pc-text-muted); font-size: 14px; text-decoration: none; }
html[data-ui="v2"] .pc2-mobile-menu__audience a[aria-current="page"] { background: var(--pc-bg-card); color: var(--pc-text-main); box-shadow: 0 1px 2px rgb(18 35 58 / 10%); }
html[data-ui="v2"] .pc2-mobile-menu__links { display: flex; flex-direction: column; }
html[data-ui="v2"] .pc2-mobile-menu__links a { display: flex; justify-content: space-between; align-items: center; min-height: 56px; border-bottom: 1px solid var(--pc-border-hair); color: var(--pc-text-main); font-size: 20px; letter-spacing: -.01em; text-decoration: none; }
html[data-ui="v2"] .pc2-mobile-menu__links a span { color: var(--pc-text-soft); font-size: 16px; }
html[data-ui="v2"] .pc2-mobile-menu__actions { display: flex; flex-direction: column; gap: 8px; margin-top: auto; }
html[data-ui="v2"] .pc2-mobile-menu__actions a { display: flex; align-items: center; justify-content: center; border-radius: 999px; text-decoration: none; }
html[data-ui="v2"] .pc2-mobile-menu__primary { height: 52px; background: var(--pc-navy-900); color: var(--pc-bg-card); font-size: 16px; font-weight: 500; }
html[data-ui="v2"] .pc2-mobile-menu__primary:hover { background: var(--pc-navy-950); color: var(--pc-bg-card); }
html[data-ui="v2"] .pc2-mobile-menu__secondary { height: 48px; border: 1px solid var(--pc-border); color: var(--pc-text-main); font-size: 15px; }
html[data-ui="v2"] .pc2-mobile-menu :focus-visible { outline: var(--pc-focus-width) solid var(--pc-navy-900); outline-offset: var(--pc-focus-offset); }
</style>
