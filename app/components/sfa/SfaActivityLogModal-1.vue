<!-- components/sfa/SfaActivityLogModal.vue -->
<!--
  Logs an activity against an opportunity.
  After saving, if the activity type suggests progress (call, visit, meeting, email)
  and the current stage has a natural next stage, the user is asked whether to
  advance the opportunity to the next funnel stage.
-->
<template>
  <Teleport to="body">
    <Transition name="modal">
      <div v-if="modelValue" class="modal-backdrop" @click.self="phase === 'log' && close()">
        <div class="modal">

          <!-- ── Phase: log activity ───────────────────────────────────── -->
          <template v-if="phase === 'log'">
            <div class="modal-header">
              <div class="modal-header-icon">📝</div>
              <div>
                <div class="modal-title">Log Activity</div>
                <div class="modal-sub">Record a client interaction or internal note</div>
              </div>
              <button class="modal-close" @click="close">✕</button>
            </div>

            <div class="modal-body">
              <div v-if="submitError" class="error-banner">⚠ {{ submitError }}</div>

              <!-- Activity type -->
              <div class="type-tabs">
                <button
                  v-for="t in ACTIVITY_TYPES"
                  :key="t.id"
                  class="type-tab"
                  :class="{ 'type-tab--active': form.type === t.id }"
                  :style="form.type === t.id
                    ? { borderColor: t.color, color: t.color, background: t.color + '12' }
                    : {}"
                  @click="form.type = t.id"
                >
                  {{ t.icon }} {{ t.label }}
                </button>
              </div>

              <div class="field-grid">
                <div class="field">
                  <label class="field-label">Date & Time <span class="req">*</span></label>
                  <input v-model="form.activity_date" class="field-input" type="datetime-local"
                    :class="{ 'field-input--error': errors.activity_date }" />
                  <span v-if="errors.activity_date" class="field-error">{{ errors.activity_date }}</span>
                </div>

                <div class="field">
                  <label class="field-label">Follow-up Date</label>
                  <input v-model="form.next_followup_date" class="field-input" type="date" />
                </div>

                <div class="field field--full">
                  <label class="field-label">Summary <span class="req">*</span></label>
                  <textarea v-model="form.summary" class="field-input field-textarea" rows="3"
                    :class="{ 'field-input--error': errors.summary }"
                    placeholder="What was discussed?" />
                  <span v-if="errors.summary" class="field-error">{{ errors.summary }}</span>
                </div>

                <div class="field field--full">
                  <label class="field-label">Outcome / Next Steps</label>
                  <textarea v-model="form.outcome" class="field-input field-textarea" rows="2"
                    placeholder="What was agreed or decided?" />
                </div>

                <!-- Attachments -->
                <div class="field field--full">
                  <label class="field-label">Attachments (optional)</label>
                  <div class="file-zone" @click="$refs.fileInput.click()"
                    @dragover.prevent @drop.prevent="onFileDrop">
                    <span class="fz-icon">📎</span>
                    <span class="fz-text">Click to attach or drag files here</span>
                  </div>
                  <input ref="fileInput" type="file" multiple style="display:none"
                    @change="onFileChange" />
                  <div v-if="attachments.length" class="file-list">
                    <div v-for="(f, i) in attachments" :key="i" class="file-chip">
                      <span>{{ f.name }}</span>
                      <button @click="attachments.splice(i, 1)">✕</button>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div class="modal-footer">
              <div class="footer-spacer" />
              <button class="btn-cancel" @click="close">Cancel</button>
              <button class="btn-submit" :disabled="submitting" @click="submit">
                {{ submitting ? 'Saving…' : 'Log Activity' }}
              </button>
            </div>
          </template>

          <!-- ── Phase: stage progression prompt ─────────────────────── -->
          <template v-if="phase === 'stage'">
            <div class="modal-header">
              <div class="modal-header-icon">🚀</div>
              <div>
                <div class="modal-title">Activity Logged</div>
                <div class="modal-sub">Would you like to advance this opportunity?</div>
              </div>
            </div>

            <div class="modal-body stage-body">

              <div class="stage-logged">
                ✓ Activity logged successfully
              </div>

              <div class="stage-question">
                Based on this {{ ACTIVITY_TYPE_MAP[form.type]?.label?.toLowerCase() }},
                should this opportunity move to the next stage?
              </div>

              <!-- Current → Next stage visual -->
              <div class="stage-flow">
                <div class="stage-pill stage-pill--current" :style="{ borderColor: currentStage?.color, color: currentStage?.color }">
                  <span class="stage-pill-icon">{{ currentStage?.icon }}</span>
                  <span>{{ currentStage?.label }}</span>
                </div>
                <span class="stage-arrow">→</span>
                <div class="stage-pill stage-pill--next" :style="{ borderColor: nextStage?.color, color: nextStage?.color, background: nextStage?.color + '12' }">
                  <span class="stage-pill-icon">{{ nextStage?.icon }}</span>
                  <span>{{ nextStage?.label }}</span>
                </div>
              </div>

              <div class="stage-actions">
                <button class="btn-stage-skip" @click="skipStage">
                  No, keep at <strong>{{ currentStage?.label }}</strong>
                </button>
                <button class="btn-stage-advance" :disabled="advancing"
                  :style="{ background: nextStage?.color }"
                  @click="advanceStage">
                  {{ advancing ? 'Moving…' : `Yes, move to ${nextStage?.label}` }}
                </button>
              </div>
            </div>
          </template>

        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useSfaActivities, ACTIVITY_TYPES, ACTIVITY_TYPE_MAP } from '~/composables/useSfaActivities'
import { useSfaOpportunities, SFA_STAGES, STAGE_MAP }          from '~/composables/useSfaOpportunities'

const props = defineProps({
  modelValue:       Boolean,
  opportunityId:    { type: [Number, String], required: true },
  currentFunnelStage: { type: String, default: 'opportunity_created' },
})

const emit = defineEmits(['update:modelValue', 'logged', 'stage-advanced'])

const { logActivity }  = useSfaActivities()
const { changeStage }  = useSfaOpportunities()

// ── Derived stage info ─────────────────────────────────────────────────────
const currentStage = computed(() => STAGE_MAP[props.currentFunnelStage] || null)
const nextStage    = computed(() => {
  const next = currentStage.value?.next
  return next ? STAGE_MAP[next] : null
})

// Only prompt for progression on client-facing activity types
// and only if there is a next stage (not already at approved/closed_lost)
const shouldPromptStage = computed(() =>
  ['call', 'email', 'visit', 'meeting'].includes(form.value.type) &&
  !!nextStage.value &&
  !['approved', 'closed_lost'].includes(props.currentFunnelStage)
)

// ── Form state ─────────────────────────────────────────────────────────────
const phase    = ref('log')  // 'log' | 'stage'
const now      = new Date()
now.setSeconds(0, 0)

const form = ref({
  type:               'call',
  activity_date:      now.toISOString().slice(0, 16),
  summary:            '',
  outcome:            '',
  next_followup_date: '',
})

const errors      = ref({})
const submitError = ref('')
const submitting  = ref(false)
const advancing   = ref(false)
const attachments = ref([])

function onFileChange(e) { attachments.value.push(...Array.from(e.target.files)) }
function onFileDrop(e)   { attachments.value.push(...Array.from(e.dataTransfer.files)) }

function validate() {
  errors.value = {}
  if (!form.value.activity_date) errors.value.activity_date = 'Required'
  if (!form.value.summary.trim()) errors.value.summary      = 'Required'
  return !Object.keys(errors.value).length
}

// ── Submit activity ────────────────────────────────────────────────────────
async function submit() {
  if (!validate()) return
  submitting.value  = true
  submitError.value = ''
  try {
    await logActivity({
      opportunity:        props.opportunityId,
      type:               form.value.type,
      activity_date:      form.value.activity_date,
      summary:            form.value.summary,
      outcome:            form.value.outcome,
      next_followup_date: form.value.next_followup_date || null,
      attachments:        attachments.value,
    })

    // If activity type warrants it, show stage progression prompt
    if (shouldPromptStage.value) {
      phase.value = 'stage'
    } else {
      // Internal notes / no next stage — just close
      emit('logged')
      resetForm()
    }
  } catch (e) {
    submitError.value = e?.data?.error?.message || 'Failed to log activity'
  } finally {
    submitting.value = false
  }
}

// ── Stage progression ──────────────────────────────────────────────────────
async function advanceStage() {
  if (!nextStage.value) return
  advancing.value = true
  try {
    await changeStage(props.opportunityId, nextStage.value.id)
    emit('stage-advanced', nextStage.value.id)
  } finally {
    advancing.value = false
    emit('logged')
    resetForm()
  }
}

function skipStage() {
  emit('logged')
  resetForm()
}

// ── Close / reset ──────────────────────────────────────────────────────────
function close() {
  emit('update:modelValue', false)
  resetForm()
}

function resetForm() {
  const n = new Date(); n.setSeconds(0, 0)
  phase.value = 'log'
  form.value  = {
    type:               'call',
    activity_date:      n.toISOString().slice(0, 16),
    summary:            '',
    outcome:            '',
    next_followup_date: '',
  }
  attachments.value  = []
  errors.value       = {}
  submitError.value  = ''
}
</script>

<style scoped>
.modal-backdrop {
  position: fixed; inset: 0; z-index: 8500;
  background: rgba(10,20,40,0.45);
  display: flex; align-items: center; justify-content: center; padding: 20px;
}
.modal {
  background: #FFFFFF; border-radius: 8px;
  width: 100%; max-width: 560px; max-height: 88vh;
  display: flex; flex-direction: column;
  box-shadow: 0 20px 60px rgba(0,0,0,0.2);
  font-family: 'IBM Plex Sans', sans-serif; overflow: hidden;
}

/* Header */
.modal-header {
  display: flex; align-items: flex-start; gap: 14px;
  padding: 16px 20px; border-bottom: 1px solid #D5DDEF; flex-shrink: 0;
}
.modal-header-icon { font-size: 22px; }
.modal-title { font-size: 15px; font-weight: 700; color: #003366; }
.modal-sub   { font-size: 11px; color: #8094B8; margin-top: 2px; }
.modal-close { margin-left: auto; background: none; border: none; font-size: 16px; color: #8094B8; cursor: pointer; }
.modal-close:hover { color: #C9252D; }

/* Body */
.modal-body { flex: 1; overflow-y: auto; padding: 18px 20px; }

.error-banner {
  background: #FFF0F0; color: #C9252D; border: 1px solid #C9252D33;
  border-radius: 4px; padding: 8px 12px; font-size: 12px; margin-bottom: 14px;
}

/* Type tabs */
.type-tabs { display: flex; flex-wrap: wrap; gap: 6px; margin-bottom: 16px; }
.type-tab {
  padding: 5px 12px; border-radius: 20px; font-size: 11px; font-weight: 600;
  border: 1.5px solid #D5DDEF; background: none;
  color: #3B4F70; cursor: pointer; font-family: inherit; transition: all 0.12s;
}
.type-tab:hover { border-color: #8094B8; }

/* Fields */
.field-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
.field--full { grid-column: 1 / -1; }
.field { display: flex; flex-direction: column; gap: 4px; }
.field-label { font-size: 11px; font-weight: 600; color: #3B4F70; }
.req { color: #C9252D; }
.field-input {
  padding: 7px 10px; border: 1.5px solid #D1D9E0; border-radius: 2px;
  font-size: 12px; color: #0D1830; background: #FFFFFF; font-family: inherit;
}
.field-input:focus { outline: none; border-color: #0066CC; box-shadow: 0 0 0 2px #0066CC22; }
.field-input--error { border-color: #C9252D; }
.field-textarea { resize: vertical; min-height: 70px; }
.field-error { font-size: 10px; color: #C9252D; }

/* File zone */
.file-zone {
  border: 1.5px dashed #D5DDEF; border-radius: 4px;
  padding: 14px; text-align: center; cursor: pointer; transition: border-color 0.12s;
}
.file-zone:hover { border-color: #0066CC; background: #F0F4FA; }
.fz-icon { font-size: 18px; display: block; margin-bottom: 4px; }
.fz-text { font-size: 11px; color: #8094B8; }
.file-list { display: flex; flex-wrap: wrap; gap: 6px; margin-top: 8px; }
.file-chip {
  display: flex; align-items: center; gap: 6px;
  background: #EEF2F8; border-radius: 3px; padding: 3px 8px;
  font-size: 11px; color: #3B4F70;
}
.file-chip button { background: none; border: none; color: #C9252D; cursor: pointer; font-size: 10px; padding: 0; }

/* Footer */
.modal-footer {
  display: flex; gap: 8px; align-items: center;
  padding: 12px 20px; border-top: 1px solid #D5DDEF; flex-shrink: 0;
}
.footer-spacer { flex: 1; }
.btn-cancel {
  padding: 7px 16px; border-radius: 4px; font-size: 12px; font-weight: 600;
  background: none; border: 1.5px solid #D1D9E0; color: #3B4F70; cursor: pointer; font-family: inherit;
}
.btn-submit {
  padding: 7px 20px; border-radius: 4px; font-size: 12px; font-weight: 600;
  background: #003366; color: #fff; border: none; cursor: pointer; font-family: inherit;
}
.btn-submit:hover    { background: #002244; }
.btn-submit:disabled { background: #8094B8; cursor: not-allowed; }

/* ── Stage progression phase ─────────────────────────────────────────────── */
.stage-body { display: flex; flex-direction: column; gap: 20px; padding: 24px 20px; }

.stage-logged {
  text-align: center; font-size: 13px; font-weight: 600;
  color: #1A8A3C; background: #EDFAF2; border: 1.5px solid #24A14833;
  border-radius: 6px; padding: 10px;
}

.stage-question {
  text-align: center; font-size: 14px; color: #0D1830; line-height: 1.5;
}

.stage-flow {
  display: flex; align-items: center; justify-content: center; gap: 12px;
}
.stage-pill {
  display: flex; align-items: center; gap: 6px;
  padding: 8px 16px; border-radius: 20px; border: 2px solid;
  font-size: 13px; font-weight: 600;
}
.stage-pill--current { background: #F7F9FC; }
.stage-pill-icon     { font-size: 16px; }
.stage-arrow         { font-size: 20px; color: #8094B8; }

.stage-actions {
  display: flex; flex-direction: column; gap: 8px;
}
.btn-stage-skip {
  padding: 10px; border-radius: 6px; font-size: 13px;
  background: none; border: 1.5px solid #D5DDEF; color: #3B4F70;
  cursor: pointer; font-family: inherit; text-align: center;
}
.btn-stage-skip:hover { background: #F0F4FA; }
.btn-stage-advance {
  padding: 12px; border-radius: 6px; font-size: 13px; font-weight: 600;
  border: none; color: #fff; cursor: pointer; font-family: inherit;
  transition: opacity 0.12s;
}
.btn-stage-advance:hover    { opacity: 0.88; }
.btn-stage-advance:disabled { opacity: 0.5; cursor: not-allowed; }

/* Transitions */
.modal-enter-active, .modal-leave-active { transition: all 0.2s ease; }
.modal-enter-from, .modal-leave-to       { opacity: 0; transform: scale(0.97); }
</style>
