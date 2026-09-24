<!-- components/clerk/BookingPreflightModal.vue -->
<!--
  Pre-flight checklist shown before an advert is saved/submitted.
  - All checks pass  → green ticks, countdown bar, auto-closes and emits 'passed'
  - Any check fails  → ticks for provided fields, ✗ + "Missing" for the rest,
                       stays open until the clerk closes it; emits 'close' only.
  Nothing is processed by this component — the parent decides what 'passed' runs.
-->
<template>
  <div
    v-if="visible"
    class="preflight-backdrop"
    @click.self="handleBackdrop"
    @keydown.esc="handleCancel"
    tabindex="-1"
    ref="backdropRef"
  >
    <div
      class="preflight-card"
      :class="allPassed ? 'is-passed' : 'is-failed'"
      role="dialog"
      aria-modal="true"
      aria-labelledby="preflight-title"
    >
      <!-- Header -->
      <div class="preflight-header">
        <div class="preflight-badge">
          <svg v-if="allPassed" viewBox="0 0 24 24" fill="none">
            <circle cx="12" cy="12" r="10" fill="currentColor" />
            <path d="M7.5 12.5L10.5 15.5L16.5 9" stroke="#fff" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" />
          </svg>
          <svg v-else viewBox="0 0 24 24" fill="none">
            <circle cx="12" cy="12" r="10" fill="currentColor" />
            <path d="M9 9L15 15M15 9L9 15" stroke="#fff" stroke-width="2.2" stroke-linecap="round" />
          </svg>
        </div>
        <div class="preflight-heading">
          <h3 id="preflight-title">
            {{ allPassed ? 'All required fields complete' : 'Required information missing' }}
          </h3>
          <p v-if="allPassed">
            {{ passedCount }} of {{ checks.length }} checks passed — {{ actionLabel.toLowerCase() }} will continue automatically.
          </p>
          <p v-else>
            {{ failedCount }} of {{ checks.length }} {{ failedCount === 1 ? 'item needs' : 'items need' }} attention.
            Nothing has been saved.
          </p>
        </div>
      </div>

      <!-- Countdown bar (pass state only) -->
      <div v-if="allPassed" class="preflight-countdown">
        <div class="preflight-countdown-fill" :style="{ animationDuration: `${autoCloseMs}ms` }"></div>
      </div>

      <!-- Checklist grouped by section -->
      <div class="preflight-body">
        <div v-for="group in groupedChecks" :key="group.section" class="preflight-group">
          <div class="preflight-group-title">
            <span>{{ group.section }}</span>
            <span class="group-count" :class="{ 'has-missing': group.missing > 0 }">
              {{ group.items.length - group.missing }}/{{ group.items.length }}
            </span>
          </div>
          <ul class="preflight-list">
            <li
              v-for="item in group.items"
              :key="item.key"
              class="preflight-item"
              :class="item.ok ? 'ok' : 'missing'"
            >
              <span class="item-icon" aria-hidden="true">{{ item.ok ? '✓' : '✗' }}</span>
              <span class="item-label">{{ item.label }}</span>
              <span v-if="item.ok" class="item-value" :title="item.value || ''">{{ item.value || 'Provided' }}</span>
              <span v-else class="item-missing">
                <strong>Missing</strong><template v-if="item.message"> — {{ item.message }}</template>
              </span>
            </li>
          </ul>
        </div>
      </div>

      <!-- Footer -->
      <div class="preflight-footer">
        <template v-if="allPassed">
          <span class="footer-note">Proceeding to {{ actionLabel.toLowerCase() }}…</span>
          <button type="button" class="pf-btn pf-btn-ghost" @click="handleCancel" ref="primaryBtnRef">
            Cancel
          </button>
        </template>
        <template v-else>
          <span class="footer-note">Complete the items marked ✗, then try again.</span>
          <button type="button" class="pf-btn pf-btn-primary" @click="handleCancel" ref="primaryBtnRef">
            Go back & complete
          </button>
        </template>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, watch, ref, nextTick, onBeforeUnmount } from 'vue'

const props = defineProps({
  visible: { type: Boolean, default: false },
  // [{ key, section, label, ok, value?, message? }]
  checks: { type: Array, default: () => [] },
  autoCloseMs: { type: Number, default: 1800 },
  actionLabel: { type: String, default: 'Save' }
})

const emit = defineEmits(['passed', 'close'])

const backdropRef = ref(null)
const primaryBtnRef = ref(null)
let passTimer = null

const allPassed = computed(() => props.checks.length > 0 && props.checks.every(c => c.ok))
const passedCount = computed(() => props.checks.filter(c => c.ok).length)
const failedCount = computed(() => props.checks.length - passedCount.value)

const groupedChecks = computed(() => {
  const groups = []
  props.checks.forEach(check => {
    let group = groups.find(g => g.section === check.section)
    if (!group) {
      group = { section: check.section || 'General', items: [], missing: 0 }
      groups.push(group)
    }
    group.items.push(check)
    if (!check.ok) group.missing++
  })
  return groups
})

const clearPassTimer = () => {
  if (passTimer) {
    clearTimeout(passTimer)
    passTimer = null
  }
}

watch(() => props.visible, async (isVisible) => {
  clearPassTimer()
  if (!isVisible) return

  await nextTick()
  ;(primaryBtnRef.value || backdropRef.value)?.focus?.()

  if (allPassed.value) {
    passTimer = setTimeout(() => {
      passTimer = null
      emit('passed')
    }, props.autoCloseMs)
  }
})

const handleCancel = () => {
  clearPassTimer()
  emit('close')
}

// Backdrop click only closes the failed state; the pass state needs an explicit Cancel
const handleBackdrop = () => {
  if (!allPassed.value) handleCancel()
}

onBeforeUnmount(clearPassTimer)
</script>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Sans:wght@400;500;600;700&family=IBM+Plex+Mono:wght@400;500&display=swap');

.preflight-backdrop {
  --navy: #003366; --navy-light: #004080; --red: #C0181E;
  --surface: #FFFFFF; --page-bg: #F0F4F8; --border: #D1D9E0; --border-lt: #E8ECF0;
  --text-1: #0F172A; --text-2: #334155; --text-3: #64748B; --text-4: #94A3B8;
  --green: #16A34A; --green-text: #166534; --green-bg: #F0FDF4; --green-bd: #86EFAC;
  --red-text: #991B1B; --red-bg: #FEF2F2; --red-bd: #FECACA;
  --radius: 2px;
  --font: "IBM Plex Sans", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
  --mono: "IBM Plex Mono", ui-monospace, monospace;

  position: fixed; inset: 0; z-index: 10000;
  display: flex; align-items: center; justify-content: center;
  padding: 16px; background: rgba(15, 23, 42, .55);
  font-family: var(--font); outline: none;
  animation: pf-fade .15s ease;
}

.preflight-card {
  width: 100%; max-width: 560px; max-height: calc(100vh - 32px);
  display: flex; flex-direction: column;
  background: var(--surface); border-radius: var(--radius);
  box-shadow: 0 20px 50px rgba(0, 0, 0, .25);
  border-top: 4px solid var(--navy); overflow: hidden;
  animation: pf-rise .18s ease;
}
.preflight-card.is-passed { border-top-color: var(--green); }
.preflight-card.is-failed { border-top-color: var(--red); }

.preflight-header { display: flex; gap: 14px; align-items: flex-start; padding: 18px 20px 14px; }
.preflight-badge { width: 36px; height: 36px; flex-shrink: 0; }
.preflight-badge svg { width: 100%; height: 100%; }
.is-passed .preflight-badge { color: var(--green); }
.is-failed .preflight-badge { color: var(--red); }
.preflight-heading h3 { margin: 0 0 3px; font-size: 15px; font-weight: 700; color: var(--text-1); }
.preflight-heading p { margin: 0; font-size: 12px; color: var(--text-3); }

.preflight-countdown { height: 3px; background: var(--green-bg); }
.preflight-countdown-fill {
  height: 100%; width: 100%; background: var(--green);
  transform-origin: left; animation-name: pf-countdown; animation-timing-function: linear; animation-fill-mode: forwards;
}

.preflight-body { overflow-y: auto; padding: 4px 20px 12px; border-top: 1px solid var(--border-lt); }

.preflight-group { margin-top: 12px; }
.preflight-group-title {
  display: flex; justify-content: space-between; align-items: center;
  font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: .08em;
  color: var(--navy); margin-bottom: 4px;
}
.group-count { font-family: var(--mono); color: var(--green-text); }
.group-count.has-missing { color: var(--red-text); }

.preflight-list { list-style: none; margin: 0; padding: 0; border: 1px solid var(--border-lt); border-radius: var(--radius); }
.preflight-item {
  display: grid; grid-template-columns: 20px 150px minmax(0, 1fr);
  align-items: center; gap: 8px; padding: 7px 10px; font-size: 12px;
  border-bottom: 1px solid var(--border-lt);
}
.preflight-item:last-child { border-bottom: none; }
.preflight-item.ok { background: var(--surface); }
.preflight-item.missing { background: var(--red-bg); }

.item-icon {
  width: 18px; height: 18px; display: inline-flex; align-items: center; justify-content: center;
  border-radius: 50%; font-size: 11px; font-weight: 700; color: #fff;
}
.ok .item-icon { background: var(--green); }
.missing .item-icon { background: var(--red); }

.item-label { font-weight: 600; color: var(--text-2); }
.item-value {
  color: var(--text-3); white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
}
.item-missing { color: var(--red-text); }
.item-missing strong { font-weight: 700; text-transform: uppercase; font-size: 10px; letter-spacing: .06em; }

.preflight-footer {
  display: flex; align-items: center; justify-content: space-between; gap: 12px;
  padding: 12px 20px; background: var(--page-bg); border-top: 1px solid var(--border-lt);
}
.footer-note { font-size: 11px; color: var(--text-3); }

.pf-btn {
  height: 34px; padding: 0 16px; border-radius: var(--radius); border: none;
  font-family: var(--font); font-size: 12px; font-weight: 600; cursor: pointer; white-space: nowrap;
  transition: background .14s ease;
}
.pf-btn:focus-visible { outline: none; box-shadow: 0 0 0 3px rgba(0, 102, 204, .25); }
.pf-btn-primary { background: var(--navy); color: #fff; }
.pf-btn-primary:hover { background: var(--navy-light); }
.pf-btn-ghost { background: var(--surface); color: var(--text-2); border: 1.5px solid var(--border); }
.pf-btn-ghost:hover { background: #E2E8F0; }

@keyframes pf-fade { from { opacity: 0; } to { opacity: 1; } }
@keyframes pf-rise { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: none; } }
@keyframes pf-countdown { from { transform: scaleX(1); } to { transform: scaleX(0); } }

@media (max-width: 560px) {
  .preflight-item { grid-template-columns: 20px minmax(0, 1fr); }
  .item-value, .item-missing { grid-column: 2; }
  .preflight-footer { flex-direction: column; align-items: stretch; }
  .pf-btn { width: 100%; }
}
</style>