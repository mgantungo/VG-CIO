<!-- components/design/QueueCard.vue -->
<template>
  <div class="dd-clip" :class="{ 'dd-clip--on-layout': onLayout }">
    <div class="dd-clip-top">
      <span class="dd-clip-ref dd-mono">
        {{ advert.reference }}
        <span v-if="advert.bcReference" class="dd-clip-bcref">· BC {{ advert.bcReference }}</span>
      </span>
      <span v-if="isUrgent" class="dd-clip-urgent">Urgent</span>
      <span v-else class="dd-clip-status" :class="scheduledForDate ? 'scheduled' : 'needs'">
        {{ scheduledForDate ? '✓ Scheduled' : 'Needs Design' }}
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
  </div>
</template>
 
<script setup>
import { computed } from 'vue'
 
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
</script>

<style scoped>
/* ── Base card styles ──────────────────────────────────── */
.dd-clip {
  background: var(--dd-card, #fffdf8);
  border: 1px dashed var(--dd-rule-strong, #b7ae97);
  border-radius: 2px;
  padding: 12px 13px;
  margin-bottom: 10px;
  position: relative;
  transition: background .12s ease, border-color .12s ease;
}

/* ── Light limegreen for adverts already on layout ── */
.dd-clip--on-layout {
  background: #cdff97 !important;
  border-color: #7cb518 !important;
  border-style: solid !important;
  border-width: 2px !important;
}

/* ── File Group Badge ──────────────────────────────────── */
.dd-filegroup-badge {
  margin-top: 8px;
  padding-top: 8px;
  border-top: 1px dashed rgba(124, 181, 24, 0.4);
}

.dd-filegroup-label {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: 10px;
  font-weight: 600;
  font-family: 'IBM Plex Mono', monospace;
  color: #3d6b14;
  background: rgba(255, 255, 255, 0.7);
  padding: 2px 8px;
  border-radius: 2px;
  border: 1px solid #7cb518;
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
  color: var(--dd-ink-soft, #6b6658);
}

.dd-clip-bcref {
  color: var(--dd-blue, #1c3fa8);
}

.dd-clip-urgent {
  font-family: 'IBM Plex Mono', monospace;
  font-size: 10px;
  font-weight: 600;
  color: var(--dd-red, #a8261e);
  background: var(--dd-red-soft, #f7e6e5);
  padding: 2px 6px;
  border-radius: 2px;
}

.dd-clip-status {
  font-family: 'IBM Plex Mono', monospace;
  font-size: 10px;
  font-weight: 600;
  letter-spacing: .03em;
  padding: 2px 7px;
  border-radius: 2px;
  text-transform: uppercase;
}

.dd-clip-status.needs {
  color: var(--dd-amber, #a3691a);
  background: var(--dd-amber-soft, #f6ecdb);
}

.dd-clip-status.scheduled {
  color: var(--dd-green, #2f6f4f);
  background: var(--dd-green-soft, #e5efe9);
}

.dd-clip-title {
  font-weight: 600;
  font-size: 13.5px;
  margin: 2px 0 4px;
}

.dd-clip-meta {
  font-size: 11.5px;
  color: var(--dd-ink-soft, #6b6658);
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
  padding: 2px 6px;
  border-radius: 2px;
  border: 1px solid var(--dd-rule-strong, #b7ae97);
  color: var(--dd-ink-soft, #6b6658);
}

.dd-chip.done {
  color: var(--dd-green, #2f6f4f);
  border-color: var(--dd-green, #2f6f4f);
  background: var(--dd-green-soft, #e5efe9);
}

.dd-chip.pending {
  color: var(--dd-amber, #a3691a);
  border-color: var(--dd-amber, #a3691a);
  background: var(--dd-amber-soft, #f6ecdb);
}

.dd-chip.today {
  outline: 1.5px solid var(--dd-blue, #1c3fa8);
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
  border-radius: 2px;
  border: 1px solid var(--dd-ink, #1c1b18);
  background: var(--dd-card, #fffdf8);
  color: var(--dd-ink, #1c1b18);
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 6px;
}

.dd-btn:disabled {
  opacity: .45;
  cursor: not-allowed;
}

.dd-btn.primary {
  background: var(--dd-blue, #1c3fa8);
  border-color: var(--dd-blue, #1c3fa8);
  color: #fff;
}

.dd-btn.ghost {
  background: transparent;
}

.dd-btn.small {
  padding: 5px 9px;
  font-size: 11.5px;
}

.dd-btn-files {
  color: var(--dd-amber, #a3691a);
  border-color: var(--dd-amber, #a3691a);
}

.dd-btn-files:hover {
  background: var(--dd-amber-soft, #f6ecdb);
}
</style>