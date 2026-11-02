<!-- components/common/RoleRail.vue -->
<!--
  The navy rail used by every role (built from the Admin Hub rail in
  pages/dashboard/admin.vue). Items come from app/config/roles.js, so a role's
  menu is data, not markup. Collapses to a slide-over below 900px.
-->
<template>
  <div>
    <div v-if="railOpen" class="rr-scrim" @click="railOpen = false"></div>
    <nav class="rr" :class="{ 'rr--open': railOpen }" :aria-label="`${roleName} menu`">
      <div class="rr__brand">
        <div class="rr__logo" aria-hidden="true">
          <svg viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2.4" stroke-linecap="round"><path d="M4 7h16M4 12h10M4 17h13"/></svg>
        </div>
        <div class="rr__name">VGAMS<small>{{ roleName }}</small></div>
      </div>

      <div class="rr__scroll">
        <template v-for="group in groups" :key="group.title">
          <p class="rr__grp">{{ group.title }}</p>
          <NuxtLink
            v-for="item in group.items"
            :key="group.title + item.to"
            :to="item.to"
            class="rr__item"
            :class="{ 'rr__item--on': isActive(item) }"
            :aria-current="isActive(item) ? 'page' : undefined"
            @click="railOpen = false"
          >
            <span class="rr__ic" aria-hidden="true" v-html="icon(item.icon)"></span>
            <span class="rr__label">{{ item.label }}</span>
            <em v-if="badgeFor(item)" class="rr__badge">{{ badgeFor(item) }}</em>
          </NuxtLink>
        </template>
      </div>

      <div class="rr__foot">
        <div class="rr__av" aria-hidden="true">{{ initials }}</div>
        <div class="rr__who">
          <div class="rr__uname">{{ userName }}</div>
          <div class="rr__urole">{{ roleName }}</div>
        </div>
        <button class="rr__out" type="button" title="Sign out" aria-label="Sign out" @click="signOut">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9"/></svg>
        </button>
      </div>
    </nav>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useRoute, useRouter } from '#app'
import { railGroups, roleLabel } from '~/config/roles'
import { useWorkspace } from '~/composables/useWorkspace'
import { useAuth } from '~/composables/useAuth'

const props = defineProps({
  role: { type: String, required: true },
  user: { type: Object, default: null },
})

const route = useRoute()
const router = useRouter()
const ws = useWorkspace()
const { logout } = useAuth()
const railOpen = ws.railOpen

const groups = computed(() => railGroups(props.role, ws.flags))
const roleName = computed(() => roleLabel(props.role))
const userName = computed(() => props.user?.name || props.user?.email?.split('@')[0] || 'User')
const initials = computed(() =>
  (userName.value || 'U').split(/\s+/).map(w => w[0]).join('').toUpperCase().slice(0, 2)
)

const isActive = (item) =>
  item.exact ? route.path === item.to : (route.path === item.to || route.path.startsWith(`${item.to}/`))

const badgeFor = (item) => {
  const n = item.badge ? Number(ws.badges.value?.[item.badge] || 0) : 0
  return n > 0 ? (n > 99 ? '99+' : String(n)) : ''
}

const signOut = () => {
  logout()
  router.push('/login')
}

const ICONS = {
  plus: '<path d="M12 5v14M5 12h14"/>',
  list: '<path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01"/>',
  chart: '<path d="M3 3v18h18M7 16v-5M12 16V8M17 16v-8"/>',
  bar: '<path d="M4 20V10M10 20V4M16 20v-7M22 20H2"/>',
  layout: '<rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18M9 21V9"/>',
  grid: '<rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/>',
  pen: '<path d="M12 20h9M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z"/>',
  check: '<path d="M20 6L9 17l-5-5"/>',
  tick: '<path d="M9 11l3 3L22 4M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/>',
  receipt: '<path d="M4 2v20l3-2 3 2 3-2 3 2 3-2 3 2V2l-3 2-3-2-3 2-3-2-3 2z"/><path d="M8 9h8M8 13h6"/>',
  dollar: '<path d="M12 1v22M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>',
  card: '<rect x="1" y="4" width="22" height="16" rx="2"/><path d="M1 10h22"/>',
  settings: '<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 0 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 0 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 0 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 0 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z"/>',
}

const icon = (name) =>
  `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${ICONS[name] || ICONS.list}</svg>`
</script>

<style scoped>
.rr {
  --nv: #003366; --nvd: #002244;
  position: fixed; left: 0; top: 0; bottom: 0; width: 204px; z-index: 950;
  background: var(--nv); border-right: 1px solid var(--nvd);
  display: flex; flex-direction: column;
  font-family: 'IBM Plex Sans', 'Segoe UI', sans-serif;
}
.rr__brand { display: flex; align-items: center; gap: 10px; padding: 16px 14px 12px; border-bottom: 1px solid rgba(255,255,255,.08); }
.rr__logo { width: 26px; height: 26px; background: var(--nvd); border: 1px solid rgba(255,255,255,.2); border-radius: 2px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
.rr__logo svg { width: 16px; height: 16px; }
.rr__name { font-size: 12px; font-weight: 700; color: #fff; letter-spacing: .04em; line-height: 1.3; }
.rr__name small { display: block; font-size: 9px; font-weight: 500; color: #9DC3E6; text-transform: uppercase; letter-spacing: .08em; }

.rr__scroll { flex: 1; overflow-y: auto; padding: 8px; display: flex; flex-direction: column; gap: 1px; }
.rr__grp { font-size: 9px; font-weight: 700; text-transform: uppercase; letter-spacing: .08em; color: rgba(255,255,255,.5); padding: 12px 10px 4px; margin: 0; }
.rr__item {
  display: flex; align-items: center; gap: 9px; min-height: 36px; padding: 8px 10px;
  color: rgba(255,255,255,.74); text-decoration: none; border-radius: 2px;
  font-size: 12px; font-weight: 500; position: relative;
  transition: background .15s, color .15s;
}
.rr__item:hover { background: rgba(255,255,255,.07); color: #fff; }
.rr__item:focus-visible { outline: 2px solid #9DC3E6; outline-offset: -2px; }
.rr__item--on { background: rgba(255,255,255,.13); color: #fff; font-weight: 600; }
.rr__item--on::before { content: ''; position: absolute; left: 0; top: 6px; bottom: 6px; width: 3px; background: #9DC3E6; border-radius: 0 2px 2px 0; }
.rr__ic { width: 15px; height: 15px; flex-shrink: 0; display: inline-flex; }
.rr__ic :deep(svg) { width: 15px; height: 15px; }
.rr__label { flex: 1; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.rr__badge {
  min-width: 18px; height: 18px; padding: 0 5px; border-radius: 9px; background: #C0181E; color: #fff;
  font-size: 10px; font-weight: 700; font-style: normal; display: inline-flex; align-items: center; justify-content: center;
}

.rr__foot { display: flex; align-items: center; gap: 9px; padding: 10px 12px; border-top: 1px solid rgba(255,255,255,.08); }
.rr__av { width: 28px; height: 28px; flex-shrink: 0; background: rgba(255,255,255,.14); border: 1px solid rgba(255,255,255,.2); border-radius: 2px; display: flex; align-items: center; justify-content: center; color: #fff; font-weight: 700; font-size: 10px; }
.rr__who { flex: 1; min-width: 0; }
.rr__uname { color: #fff; font-size: 11px; font-weight: 600; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.rr__urole { color: #9DC3E6; font-size: 9px; text-transform: uppercase; letter-spacing: .06em; }
.rr__out { width: 32px; height: 32px; flex-shrink: 0; border: 1px solid rgba(255,255,255,.18); background: transparent; color: rgba(255,255,255,.8); border-radius: 2px; cursor: pointer; display: inline-flex; align-items: center; justify-content: center; }
.rr__out:hover { background: rgba(255,255,255,.1); color: #fff; }
.rr__out svg { width: 15px; height: 15px; }

.rr-scrim { display: none; }

@media (max-width: 900px) {
  .rr { transform: translateX(-100%); transition: transform .2s ease; box-shadow: 0 0 40px rgba(0,0,0,.25); }
  .rr--open { transform: translateX(0); }
  .rr-scrim { display: block; position: fixed; inset: 0; background: rgba(15,23,42,.4); z-index: 940; }
}
</style>
