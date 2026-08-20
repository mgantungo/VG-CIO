<!--components/design/QueueCard.vue-->
<template>
  <div
    class="dd-clip"
    :class="{ 'dd-clip--on-layout': onLayout, 'dd-clip--dragging': isDragging }"
    :draggable="canAddToBoard"
    :title="canAddToBoard ? 'Drag onto an ad slot, or use + Add to Board' : ''"
    @click="spawnRipple"
    @dragstart="onDragStart"
    @dragend="onDragEnd"
  >
    <div class="dd-clip-top">
      <span class="dd-clip-ref dd-mono">
        {{ advert.reference }}
        <span v-if="advert.bcReference" class="dd-clip-bcref">· BC {{ advert.bcReference }}</span>
      </span>
      <span v-if="isUrgent" class="dd-clip-urgent"><i class="dd-led"></i>Urgent</span>
      <span v-else class="dd-clip-status" :class="scheduledForDate ? 'scheduled' : 'needs'">
        <i class="dd-led"></i>{{ scheduledForDate ? 'Scheduled' : 'Needs Design' }}
      </span>
    </div>
 
    <div class="dd-clip-title dd-serif">{{ advert.advertTitle }}</div>
    <div class="dd-clip-meta">
      <span>{{ advert.clientName }}</span>
      <span>{{ advert.adSize }}</span>
      <span>{{ advert.platform }}</span>
    </div>
 
    <div class="dd-date-chips">
      <span
        v-for="d in advert.publishingDates"
        :key="d"
        class="dd-chip"
        :class="[advert.scheduledDates.includes(d) ? 'done' : 'pending', d === activeDate ? 'today' : '']"
      >
        {{ formatShort(d) }} {{ advert.scheduledDates.includes(d) ? '✓' : '' }}
      </span>
    </div>
 
    <div class="dd-clip-actions">
      <button
        class="dd-btn small primary"
        :disabled="!canAddToBoard"
        :title="!canAddToBoard ? `Not booked (or already scheduled) for ${activeDate}` : ''"
        @click="$emit('add-to-board', advert)"
      >
        {{ canAddToBoard ? '+ Add to Board' : 'Not for this date' }}
      </button>
      <button v-if="advert.hasBrief" class="dd-btn small ghost" @click="$emit('view-brief', advert)">View brief</button>
      <button
        v-if="attachmentsCount > 0"
        class="dd-btn small ghost dd-btn-files"
        :title="`${attachmentsCount} file${attachmentsCount !== 1 ? 's' : ''} attached`"
        @click="$emit('view-attachments', advert)"
      >
        <svg width="13" height="13" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.4">
          <path d="M1.5 4.2c0-.66.54-1.2 1.2-1.2h3.4l1.3 1.6h6.9c.66 0 1.2.54 1.2 1.2v6.4c0 .66-.54 1.2-1.2 1.2H2.7c-.66 0-1.2-.54-1.2-1.2V4.2z" stroke-linejoin="round"/>
        </svg>
        {{ attachmentsCount }}
      </button>
    </div>

    <!-- Show which file group this advert belongs to -->
    <div v-if="onLayout && fileGroupName" class="dd-filegroup-badge">
      <span class="dd-filegroup-label">📁 {{ fileGroupName }}</span>
    </div>

    <!-- Click ripple feedback (ignored for interactive elements, see spawnRipple) -->
    <span
      v-for="r in ripples"
      :key="r.id"
      class="dd-ripple"
      :style="{ width: r.size + 'px', height: r.size + 'px', left: r.x + 'px', top: r.y + 'px' }"
      aria-hidden="true"
    ></span>
  </div>
</template>
 
<script setup>
import { computed, ref } from 'vue'
 
const props = defineProps({
  advert: { type: Object, required: true },
  activeDate: { type: String, default: null },
  onLayout: { type: Boolean, default: false },
  fileGroupName: { type: String, default: null }, // Name of the file group this advert belongs to
})
 
defineEmits(['add-to-board', 'view-brief', 'view-attachments'])

const attachmentsCount = computed(() =>
  props.advert.attachmentsCount ?? props.advert.attachments?.length ?? 0
)
 
const scheduledForDate = computed(() =>
  props.advert.scheduledForThisDate ?? (props.activeDate ? props.advert.scheduledDates?.includes(props.activeDate) : false)
)
 
// Booked (pending) for the active batch's target date specifically
const canAddToBoard = computed(() => {
  if (!props.activeDate) return false
  return (props.advert.pendingDates || []).includes(props.activeDate)
})
 
const isUrgent = computed(() => {
  const next = (props.advert.pendingDates || [])[0]
  if (!next) return false
  const daysLeft = Math.ceil((new Date(next) - new Date()) / 86400000)
  return daysLeft >= 0 && daysLeft <= 3
})
 
function formatShort(dateStr) {
  if (!dateStr) return ''
  const d = new Date(dateStr)
  return d.toLocaleDateString('en-UG', { day: '2-digit', month: 'short' })
}

// ── Drag source ────────────────────────────────────────────
// Feeds the drop target that already exists in FileGroupCard.vue,
// which reads e.dataTransfer.getData('text/plain') as the advert id
// and emits 'assign-advert' — already wired in the parent to the
// same assignAdvertDirectly() used by the tested spreadsheet-view
// drag path. Gated by canAddToBoard so drag and the "+ Add to
// Board" button always agree on whether this advert can be placed
// for the active date.
const isDragging = ref(false)

function onDragStart(e) {
  if (!canAddToBoard.value) {
    e.preventDefault()
    return
  }
  isDragging.value = true
  e.dataTransfer.effectAllowed = 'copy'
  e.dataTransfer.setData('text/plain', String(props.advert.id))
}

function onDragEnd() {
  isDragging.value = false
}

// ── Click ripple ──────────────────────────────────────────
// Purely cosmetic feedback; does not intercept or affect any
// existing button click handlers/emits.
const ripples = ref([])
let rippleSeq = 0
const prefersReducedMotion =
  typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches

function spawnRipple(e) {
  if (prefersReducedMotion) return
  // Buttons/links already have their own hover/active feedback —
  // skip so the ripple doesn't double up on top of them.
  if (e.target.closest('button, a, input, select, textarea')) return

  const rect = e.currentTarget.getBoundingClientRect()
  const size = Math.max(rect.width, rect.height) * 1.6
  const id = ++rippleSeq
  ripples.value.push({
    id,
    size,
    x: e.clientX - rect.left - size / 2,
    y: e.clientY - rect.top - size / 2,
  })
  setTimeout(() => {
    ripples.value = ripples.value.filter((r) => r.id !== id)
  }, 620)
}
</script>

<style scoped>
/* ── Base card — brushed-metal panel with machined bevel ──── */
.dd-clip {
  --dd-metal-50:  #F7F8F9;
  --dd-metal-100: #EEF0F2;
  --dd-metal-300: #CDD1D6;
  --dd-metal-rail:#B7BCC2;
  --dd-ink:       #1D2226;
  --dd-ink-soft:  #5B6169;
  --dd-navy:      #00335F;
  --dd-led-green: #2E8B57;
  --dd-led-green-soft: #E6F4EC;
  --dd-led-amber: #C08A22;
  --dd-led-amber-soft: #F8F0DC;
  --dd-led-red:   #C23B3B;
  --dd-led-red-soft:   #FBEAEA;
  --dd-led-blue:  #3E6FB0;

  background: linear-gradient(180deg, #fff, var(--dd-metal-50));
  border-radius: 4px;
  box-shadow:
    0 1px 0 rgba(255,255,255,.75) inset,
    0 -1px 0 rgba(0,0,0,.10) inset,
    0 0 0 1px var(--dd-metal-300);
  padding: 12px 13px;
  margin-bottom: 10px;
  position: relative;
  overflow: hidden;
  cursor: default;
  transition: transform .16s cubic-bezier(.22,.68,.36,1), box-shadow .16s ease;
}

.dd-clip:hover {
  transform: translateY(-2px);
  box-shadow:
    0 1px 0 rgba(255,255,255,.75) inset,
    0 -1px 0 rgba(0,0,0,.10) inset,
    0 0 0 1px var(--dd-metal-rail),
    0 8px 16px -8px rgba(20,24,28,.22);
}
.dd-clip:hover .dd-clip-ref {
  color: var(--dd-navy);
}

/* ── Drag source affordance ─────────────────────────────────── */
.dd-clip[draggable="true"] {
  cursor: grab;
}
.dd-clip--dragging {
  opacity: .45;
  cursor: grabbing;
  transform: scale(.98);
}

/* ── Cards already pinned to the layout board ──────────────── */
.dd-clip--on-layout {
  background: linear-gradient(180deg, #fff, var(--dd-led-green-soft));
  box-shadow:
    0 1px 0 rgba(255,255,255,.75) inset,
    0 -1px 0 rgba(0,0,0,.10) inset,
    0 0 0 1.5px var(--dd-led-green);
}
.dd-clip--on-layout:hover {
  box-shadow:
    0 1px 0 rgba(255,255,255,.75) inset,
    0 -1px 0 rgba(0,0,0,.10) inset,
    0 0 0 1.5px var(--dd-led-green),
    0 8px 16px -8px rgba(46,139,87,.28);
}

/* ── Click ripple ───────────────────────────────────────────── */
.dd-ripple {
  position: absolute;
  border-radius: 50%;
  background: radial-gradient(circle, rgba(0,51,95,.16) 0%, rgba(0,51,95,.06) 60%, rgba(0,51,95,0) 72%);
  transform: scale(0);
  pointer-events: none;
  animation: dd-ripple-out .6s cubic-bezier(.22,.68,.36,1) forwards;
}
.dd-clip--on-layout .dd-ripple {
  background: radial-gradient(circle, rgba(46,139,87,.18) 0%, rgba(46,139,87,.07) 60%, rgba(46,139,87,0) 72%);
}
@keyframes dd-ripple-out {
  from { transform: scale(0); opacity: .9; }
  to   { transform: scale(1); opacity: 0; }
}

/* ── File Group Badge ──────────────────────────────────── */
.dd-filegroup-badge {
  margin-top: 8px;
  padding-top: 8px;
  border-top: 1px dashed var(--dd-metal-300);
}

.dd-filegroup-label {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: 10px;
  font-weight: 600;
  font-family: 'IBM Plex Mono', monospace;
  color: #1e5c3d;
  background: var(--dd-led-green-soft);
  padding: 2px 8px;
  border-radius: 3px;
  box-shadow: 0 0 0 1px rgba(46,139,87,.35);
}

.dd-clip-top {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 6px;
  gap: 8px;
}

.dd-clip-ref {
  font-family: 'IBM Plex Mono', monospace;
  font-size: 10.5px;
  color: var(--dd-ink-soft);
  transition: color .16s ease;
}

.dd-clip-bcref {
  color: var(--dd-led-blue);
}

/* ── LED status indicators ─────────────────────────────────── */
.dd-led {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  display: inline-block;
  margin-right: 6px;
  vertical-align: middle;
}

.dd-clip-urgent {
  font-family: 'IBM Plex Mono', monospace;
  font-size: 10px;
  font-weight: 600;
  letter-spacing: .03em;
  text-transform: uppercase;
  color: #8f2626;
  background: var(--dd-led-red-soft);
  padding: 3px 9px 3px 7px;
  border-radius: 10px;
  display: inline-flex;
  align-items: center;
}
.dd-clip-urgent .dd-led {
  background: var(--dd-led-red);
  box-shadow: 0 0 5px 1px rgba(194,59,59,.7);
  animation: dd-blink 1.4s infinite;
}
@keyframes dd-blink {
  0%, 100% { opacity: 1; }
  50%      { opacity: .35; }
}

.dd-clip-status {
  font-family: 'IBM Plex Mono', monospace;
  font-size: 10px;
  font-weight: 600;
  letter-spacing: .03em;
  padding: 3px 9px 3px 7px;
  border-radius: 10px;
  text-transform: uppercase;
  display: inline-flex;
  align-items: center;
}

.dd-clip-status.needs {
  color: #7a591a;
  background: var(--dd-led-amber-soft);
}
.dd-clip-status.needs .dd-led {
  background: var(--dd-led-amber);
  box-shadow: 0 0 4px 1px rgba(192,138,34,.6);
}

.dd-clip-status.scheduled {
  color: #1e5c3d;
  background: var(--dd-led-green-soft);
}
.dd-clip-status.scheduled .dd-led {
  background: var(--dd-led-green);
  box-shadow: 0 0 4px 1px rgba(46,139,87,.6);
}

.dd-clip-title {
  font-weight: 600;
  font-size: 13.5px;
  margin: 2px 0 4px;
  color: var(--dd-ink);
}

.dd-clip-meta {
  font-size: 11.5px;
  color: var(--dd-ink-soft);
  margin-bottom: 8px;
}

.dd-clip-meta span + span::before {
  content: " · ";
}

.dd-date-chips {
  display: flex;
  flex-wrap: wrap;
  gap: 5px;
  margin-bottom: 10px;
}

.dd-chip {
  font-family: 'IBM Plex Mono', monospace;
  font-size: 10px;
  padding: 3px 8px;
  border-radius: 3px;
  background: var(--dd-metal-100);
  box-shadow: 0 0 0 1px var(--dd-metal-300);
  color: var(--dd-ink-soft);
}

.dd-chip.done {
  color: #1e5c3d;
  background: var(--dd-led-green-soft);
  box-shadow: 0 0 0 1px rgba(46,139,87,.35);
}

.dd-chip.pending {
  color: #7a591a;
  background: var(--dd-led-amber-soft);
  box-shadow: 0 0 0 1px rgba(192,138,34,.35);
}

.dd-chip.today {
  box-shadow: 0 0 0 1.5px var(--dd-led-blue);
}

.dd-clip-actions {
  display: flex;
  gap: 6px;
  align-items: center;
  flex-wrap: wrap;
}

/* ── Buttons ────────────────────────────────────────────── */
.dd-btn {
  font-family: 'Inter', sans-serif;
  font-size: 12.5px;
  font-weight: 600;
  padding: 8px 14px;
  border-radius: 4px;
  border: none;
  background: linear-gradient(180deg, #fff, var(--dd-metal-100));
  color: var(--dd-ink);
  box-shadow:
    0 1px 0 rgba(255,255,255,.75) inset,
    0 -1px 0 rgba(0,0,0,.10) inset,
    0 0 0 1px var(--dd-metal-300);
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  transition: box-shadow .1s ease, transform .1s ease, background .12s ease;
}

.dd-btn:active {
  box-shadow:
    0 1px 2px rgba(0,0,0,.14) inset,
    0 -1px 0 rgba(255,255,255,.5) inset;
  transform: translateY(1px);
}

.dd-btn:disabled {
  opacity: .45;
  cursor: not-allowed;
}

.dd-btn.primary {
  background: linear-gradient(180deg, #2E5F9E, var(--dd-navy));
  box-shadow: 0 1px 0 rgba(255,255,255,.25) inset, 0 2px 4px rgba(0,51,95,.35);
  color: #fff;
}
.dd-btn.primary:hover:not(:disabled) {
  background: linear-gradient(180deg, #3B6EAE, #06427A);
}
.dd-btn.primary:active {
  box-shadow: 0 1px 3px rgba(0,51,95,.4) inset;
}

.dd-btn.ghost {
  background: transparent;
  box-shadow: 0 0 0 1px var(--dd-metal-300);
}

.dd-btn.small {
  padding: 5px 9px;
  font-size: 11.5px;
}

.dd-btn-files {
  color: #7a591a;
  box-shadow: 0 0 0 1px rgba(192,138,34,.5);
}

.dd-btn-files:hover {
  background: var(--dd-led-amber-soft);
}

/* ── Entrance fade-in ───────────────────────────────────────
   Applied by the parent via a plain `class="dd-fade"` +
   `:style="{ '--dd-d': ... }"` on the <QueueCard> component tag
   (attribute fallthrough onto this root element). Defined here,
   not in the parent, because scoped CSS only reaches elements
   that live in this component's own template.               */
.dd-fade {
  animation: dd-fade-in .5s cubic-bezier(.22,.68,.36,1) forwards;
  animation-delay: var(--dd-d, 0s);
  opacity: 0;
}
@keyframes dd-fade-in {
  from { opacity: 0; transform: translateY(8px); }
  to   { opacity: 1; transform: translateY(0); }
}

/* ── Motion preferences ────────────────────────────────────── */
@media (prefers-reduced-motion: reduce) {
  .dd-clip { transition: box-shadow .16s ease; }
  .dd-clip:hover { transform: none; }
  .dd-clip-urgent .dd-led { animation: none; }
  .dd-ripple { display: none; }
  .dd-fade { animation: none; opacity: 1; }
}
</style>