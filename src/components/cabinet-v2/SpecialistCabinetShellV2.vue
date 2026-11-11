<template>
  <div class="pc2-cabinet-shell">
    <aside class="pc2-cabinet-sidebar" aria-label="Навігація кабінету спеціаліста">
      <nav class="pc2-cabinet-sidebar__nav" aria-label="Розділи кабінету">
        <RouterLink
          v-for="item in navItems"
          :key="item.key"
          class="pc2-cabinet-sidebar__link"
          :class="{ 'is-active': item.active }"
          :to="item.to"
          :aria-current="item.active ? 'page' : undefined"
        >
          <span>{{ item.label }}</span>
          <span v-if="item.badge" class="pc2-cabinet-badge"><span aria-hidden="true">{{ item.badge }}</span><span class="pc2-cabinet-sr">, нових: {{ item.badge }}</span></span>
        </RouterLink>
      </nav>
      <RouterLink class="pc2-cabinet-account" :to="publicProfileTo" title="Публічний профіль (перегляд)">
        <span class="pc2-cabinet-account__avatar" aria-hidden="true">{{ accountInitials }}</span>
        <span class="pc2-cabinet-account__text"><span>{{ accountTitle }}</span><span>{{ accountSubtitle }}</span></span>
      </RouterLink>
    </aside>

    <section class="pc2-cabinet-shell__content">
      <slot />
    </section>

    <nav class="pc2-cabinet-tabbar" aria-label="Основні розділи кабінету">
      <RouterLink
        v-for="tab in tabItems"
        :key="tab.key"
        class="pc2-cabinet-tab"
        :class="{ 'is-active': tab.active }"
        :to="tab.to"
        :aria-current="tab.active ? 'page' : undefined"
      >
        <span class="pc2-cabinet-tab__icon" aria-hidden="true" v-html="TAB_ICONS[tab.key]"></span>
        <span>{{ tab.label }}</span>
        <span v-if="tab.badge" class="pc2-cabinet-badge is-tab"><span aria-hidden="true">{{ tab.badge }}</span><span class="pc2-cabinet-sr">, нових: {{ tab.badge }}</span></span>
      </RouterLink>
      <button
        ref="moreTrigger"
        class="pc2-cabinet-tab"
        :class="{ 'is-active': moreActive || moreOpen }"
        type="button"
        aria-haspopup="dialog"
        aria-controls="cabinet-more-sheet"
        :aria-expanded="moreOpen"
        @click="setMore(true)"
      >
        <span class="pc2-cabinet-tab__icon" aria-hidden="true" v-html="TAB_ICONS.more"></span>
        <span>Ще</span>
        <span v-if="moreCount" class="pc2-cabinet-badge is-tab"><span aria-hidden="true">{{ moreCount }}</span><span class="pc2-cabinet-sr">, нових: {{ moreCount }}</span></span>
      </button>
    </nav>

    <Teleport to="body">
      <div class="pc2-cabinet-more" :class="{ 'is-open': moreOpen, 'is-dragging': dragY > 0 }">
        <div class="pc2-cabinet-more__backdrop" aria-hidden="true" @click="setMore(false)"></div>
        <div
          id="cabinet-more-sheet"
          ref="sheet"
          class="pc2-cabinet-more__sheet"
          role="dialog"
          aria-modal="true"
          aria-label="Інші розділи кабінету"
          tabindex="-1"
          :aria-hidden="moreOpen ? undefined : 'true'"
          :inert="moreOpen ? undefined : true"
          :style="dragY > 0 ? { transform: `translateY(${dragY}px)` } : undefined"
          @touchstart.passive="onDragStart"
          @touchmove.passive="onDragMove"
          @touchend="onDragEnd"
          @touchcancel="onDragEnd"
        >
          <span class="pc2-cabinet-more__handle" aria-hidden="true"></span>
          <RouterLink class="pc2-cabinet-more__account" :to="publicProfileTo" @click="setMore(false)">
            <span class="pc2-cabinet-account__avatar is-lg" aria-hidden="true">{{ accountInitials }}</span>
            <span class="pc2-cabinet-account__text"><span>{{ accountTitle }}</span><span>{{ accountSubtitle }}</span></span>
            <span class="pc2-cabinet-more__chevron" aria-hidden="true">›</span>
          </RouterLink>
          <nav class="pc2-cabinet-more__grid" aria-label="Інші розділи">
            <RouterLink
              v-for="item in moreItems"
              :key="item.key"
              class="pc2-cabinet-more__item"
              :class="{ 'is-active': item.active }"
              :to="item.to"
              :aria-current="item.active ? 'page' : undefined"
              @click="setMore(false)"
            >
              <span>{{ item.label }}</span>
              <span v-if="item.badge" class="pc2-cabinet-badge"><span aria-hidden="true">{{ item.badge }}</span><span class="pc2-cabinet-sr">, нових: {{ item.badge }}</span></span>
            </RouterLink>
          </nav>
          <button class="pc2-cabinet-more__logout" type="button" @click="logout">Вийти</button>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useMobileOverlay } from '../../composables/useMobileOverlay'
import {
  CABINET_MORE_KEYS,
  CABINET_NAV,
  CABINET_TAB_KEYS,
  badgeLabel,
  cabinetNavItem,
  isCabinetNavActive,
  moreBadge,
  type CabinetNavBadges,
} from '../../lib/specialistCabinetNav'
import '../../styles/cabinetShellV2.css'

const props = withDefaults(defineProps<{
  path: string
  badges?: CabinetNavBadges
  moreOpen?: boolean
  accountTitle: string
  accountSubtitle?: string
  accountInitials: string
  publicProfileTo?: string
}>(), { badges: () => ({}), moreOpen: false, accountSubtitle: '', publicProfileTo: '/public' })
const emit = defineEmits<{ 'update:moreOpen': [value: boolean]; logout: [] }>()

// Simple line icons in the 22px slot of the source tab bar.
const TAB_ICONS: Record<string, string> = {
  dashboard: '<svg viewBox="0 0 24 24"><path d="M4 11.5 12 5l8 6.5V19a1 1 0 0 1-1 1h-4.5v-5h-5v5H5a1 1 0 0 1-1-1z"/></svg>',
  sessions: '<svg viewBox="0 0 24 24"><rect x="4" y="5.5" width="16" height="14" rx="2.5"/><path d="M4 10h16M8.5 3.5v4M15.5 3.5v4"/></svg>',
  clients: '<svg viewBox="0 0 24 24"><circle cx="9" cy="9" r="3.2"/><path d="M3.5 19c.6-3.2 2.8-5 5.5-5s4.9 1.8 5.5 5"/><circle cx="16.8" cy="8.6" r="2.6"/><path d="M15.6 13.6c2.4 0 4.3 1.6 4.9 4.4"/></svg>',
  requests: '<svg viewBox="0 0 24 24"><path d="M4.5 6.5h15v11h-15z"/><path d="m4.8 7 7.2 6 7.2-6"/></svg>',
  more: '<svg viewBox="0 0 24 24"><circle cx="6" cy="12" r="1.4"/><circle cx="12" cy="12" r="1.4"/><circle cx="18" cy="12" r="1.4"/></svg>',
}

const view = (keys = CABINET_NAV.map((item) => item.key)) => keys.map((key) => {
  const item = cabinetNavItem(key)
  return { ...item, active: isCabinetNavActive(item, props.path), badge: badgeLabel(props.badges[key]) }
})
const navItems = computed(() => view())
const tabItems = computed(() => view(CABINET_TAB_KEYS))
const moreItems = computed(() => view(CABINET_MORE_KEYS))
const moreActive = computed(() => moreItems.value.some((item) => item.active))
const moreCount = computed(() => badgeLabel(moreBadge(props.badges)))

const sheet = ref<HTMLElement | null>(null)
const moreTrigger = ref<HTMLElement | null>(null)
const open = computed({ get: () => props.moreOpen, set: (value: boolean) => emit('update:moreOpen', value) })
// Focus lands on the sheet itself so the first item is not pre-highlighted; Tab then walks the items.
useMobileOverlay({ open, panel: sheet, trigger: moreTrigger, initialFocus: sheet })
function setMore(value: boolean) { open.value = value }
function logout() { setMore(false); emit('logout') }
watch(() => props.path, () => { if (props.moreOpen) setMore(false) })

// Source M2: the sheet closes with a downward swipe (in addition to backdrop and Escape).
const dragY = ref(0)
let dragStart: number | null = null
function onDragStart(event: TouchEvent) {
  if ((sheet.value?.scrollTop ?? 0) > 0) return
  dragStart = event.touches[0]?.clientY ?? null
}
function onDragMove(event: TouchEvent) {
  if (dragStart === null) return
  dragY.value = Math.max(0, (event.touches[0]?.clientY ?? dragStart) - dragStart)
}
function onDragEnd() {
  if (dragStart !== null && dragY.value > 80) setMore(false)
  dragStart = null
  dragY.value = 0
}
</script>
