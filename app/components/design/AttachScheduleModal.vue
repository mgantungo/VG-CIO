<!-- components/design/AttachScheduleModal.vue -->
<template>
  <Teleport to="body">
    <div class="dd-modal-backdrop" :class="{ open: !!batch }" @click.self="$emit('close')">
      <div class="dd-modal" v-if="batch">
        <div class="dd-modal-head">
          <h3>Attach to Schedule</h3>
          <button class="dd-modal-close" @click="$emit('close')">&times;</button>
        </div>
        <div class="dd-modal-body">
          <p style="margin:0 0 12px;font-size:12.5px;color:var(--dd-ink-soft);">
            Batch <b class="dd-mono" style="color:var(--dd-ink);">{{ batch.reference }}</b>
            · {{ batch.advertsCount }} advert{{ batch.advertsCount === 1 ? '' : 's' }} across {{ batch.fileGroupsCount }} file group{{ batch.fileGroupsCount === 1 ? '' : 's' }}
            · {{ batch.filesCount }} file{{ batch.filesCount === 1 ? '' : 's' }} uploaded
          </p>

          <div class="dd-ticket-row" style="margin-bottom:0;">
            <div class="dd-field">
              <label>Run Date <span style="text-transform:none;font-weight:400;">(set on the batch)</span></label>
              <input type="text" :value="formatDate(batch.targetRunDate)" disabled />
            </div>
            <div class="dd-field">
              <label>Run Time</label>
              <input type="text" v-model="runTime" placeholder="00:00 AM" />
            </div>
          </div>

          <label class="dd-carry">
            <input v-model="carryForward" type="checkbox" />
            Also use this artwork for every later run date these adverts are booked for
          </label>

          <div class="dd-note-box">
            <template v-if="carryForward">
              Attaches {{ formatDate(batch.targetRunDate) }} and carries the same files to each later booked date (one schedule row per date, marked as carried).
              Any single date can still be dropped from the Artwork panel on the advert.
            </template>
            <template v-else>
              Attaching finds or creates the schedule row for {{ formatDate(batch.targetRunDate) }} and merges this batch's files and adverts into it.
              Each advert's remaining dates stay in the queue until every booked date is covered.
            </template>
          </div>
        </div>
        <div class="dd-modal-foot">
          <button class="dd-btn ghost" @click="$emit('close')">Cancel</button>
          <button class="dd-btn primary" :disabled="attaching" @click="confirm">
            {{ attaching ? 'Attaching…' : 'Attach Batch' }}
          </button>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup>
import { ref, watch } from 'vue'

const props = defineProps({
  batch: { type: Object, default: null }, // getBatchDetail shape
})
const emit = defineEmits(['close', 'confirm'])

const runTime = ref('00:00 AM')
const attaching = ref(false)
const carryForward = ref(true)

watch(() => props.batch, (b) => { if (!b) { attaching.value = false; carryForward.value = true } })

function formatDate(d) {
  if (!d) return '—'
  return new Date(d).toLocaleDateString('en-UG', { day: '2-digit', month: 'short', year: 'numeric' })
}

function confirm() {
  attaching.value = true
  emit('confirm', runTime.value, { carryForward: carryForward.value })
}
</script>

<style scoped>
.dd-modal-backdrop{
  position:fixed;inset:0;background:rgba(28,27,24,.45);display:none;
  align-items:center;justify-content:center;z-index:1000;padding:20px;
}
.dd-modal-backdrop.open{display:flex;}
.dd-modal{background:#f6f3ec;border:1px solid #b7ae97;border-radius:3px;max-width:560px;width:100%;max-height:88vh;display:flex;flex-direction:column;box-shadow:0 12px 40px rgba(0,0,0,.25);}
.dd-modal.dd-modal-lg{max-width:820px;}
.dd-modal-head{display:flex;justify-content:space-between;align-items:center;padding:16px 20px;border-bottom:1px solid #b7ae97;}
.dd-modal-head h3{margin:0;font-family:'Source Serif 4',serif;font-size:17px;font-weight:700;}
.dd-modal-close{cursor:pointer;font-size:20px;color:#6b6658;line-height:1;background:none;border:none;}
.dd-modal-body{padding:18px 20px;overflow-y:auto;}
.dd-modal-foot{display:flex;justify-content:flex-end;gap:8px;padding:14px 20px;border-top:1px solid #d9d3c3;}

.dd-btn{
  font-family:'Inter',sans-serif;font-size:12.5px;font-weight:600;padding:8px 14px;border-radius:2px;
  border:1px solid #1c1b18;background:#fffdf8;color:#1c1b18;cursor:pointer;
  display:inline-flex;align-items:center;gap:6px;
}
.dd-btn:disabled{opacity:.45;cursor:not-allowed;}
.dd-btn.primary{background:#1c3fa8;border-color:#1c3fa8;color:#fff;}
.dd-btn.ghost{background:transparent;}
.dd-mono{font-family:'IBM Plex Mono',monospace;}

.dd-btn.small{padding:5px 9px;font-size:11.5px;}
.dd-ticket-row{display:flex;gap:16px;margin-bottom:10px;flex-wrap:wrap;}
.dd-field{flex:1;min-width:140px;}
.dd-field label{display:block;font-size:10px;letter-spacing:.06em;text-transform:uppercase;color:#6b6658;margin-bottom:4px;}
.dd-field input, .dd-field select, .dd-field textarea{
  width:100%;font-family:'Inter',sans-serif;font-size:13px;padding:7px 9px;
  border:1px solid #b7ae97;border-radius:2px;background:#fffdf8;color:#1c1b18;
}
.dd-field input:disabled{color:#6b6658;background:#efeade;}
.dd-carry{display:flex;align-items:center;gap:8px;margin-top:12px;font-size:12.5px;font-weight:600;color:#1c1b18;cursor:pointer;}
.dd-carry input{width:16px;height:16px;}
.dd-note-box{background:#e7ebf8;color:#1c3fa8;font-size:12px;padding:10px 12px;border-radius:2px;margin-top:12px;}
</style>