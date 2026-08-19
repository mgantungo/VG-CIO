<!-- components/design/ext/UnmarkCompleteModal.vue -->
<!--
  Two-step confirmation before reversing a "mark design complete" -
  guards against an accidental unmark from a stray click, since
  markDesignComplete's counterpart here changes real state (isApproved:
  false) and there was previously no way to undo a mistaken mark at all.

  Step 1: type the advert's BC reference code (without the "B-SO-" prefix,
          though the full code is accepted too) - forces the person to
          actually look at which advert they're touching, not just click
          through a generic "are you sure?".
  Step 2: explicit confirm.

  The step-1 code check here is client-side only, for a fast/friendly error
  message - the real enforcement happens server-side in
  design-house.unmarkDesignComplete, which re-verifies the same code
  against the advert's actual bc_reference_number before changing anything.
-->
<template>
  <Teleport to="body">
    <div class="ucm-backdrop" :class="{ open: !!advert }" @click.self="handleClose">
      <div class="ucm-modal" v-if="advert">

        <div class="ucm-head">
          <h3>Unmark as Complete</h3>
          <button class="ucm-close" @click="handleClose">&times;</button>
        </div>

        <div class="ucm-body">

          <div class="ucm-advert-summary">
            <div class="row"><span class="lbl">Reference</span><span class="val mono">{{ advert.reference }}</span></div>
            <div class="row"><span class="lbl">Advert Title</span><span class="val">{{ advert.advertTitle }}</span></div>
            <div class="row"><span class="lbl">Client</span><span class="val">{{ advert.clientName }}</span></div>
          </div>

          <!-- STEP 1: type the BC code -->
          <template v-if="step === 1">
            <p class="ucm-instructions">
              To confirm this is the advert you mean to unmark, type its BC reference code below.
            </p>
            <label class="ucm-label">BC Reference Code</label>
            <div class="ucm-code-input">
              <span class="prefix">B-SO-</span>
              <input
                ref="codeInputEl"
                v-model="enteredCode"
                type="text"
                placeholder="e.g. 236997N"
                autocomplete="off"
                spellcheck="false"
                @keyup.enter="handleStep1Next"
              >
            </div>
            <div class="ucm-hint">
              Full BC reference on record: <span class="mono">{{ advert.bcReference || '— not synced to BC —' }}</span>
            </div>
            <div v-if="step1Error" class="ucm-error">{{ step1Error }}</div>
          </template>

          <!-- STEP 2: explicit confirm -->
          <template v-else-if="step === 2">
            <div class="ucm-warning">
              <strong>This will unmark "{{ advert.advertTitle }}" as complete.</strong>
              <p>Design House's queue will treat it as pending design work again. This action can be redone
                 (marked complete again) at any time, but make sure this is really what you intend.</p>
            </div>
          </template>

          <div v-if="submitError" class="ucm-error">{{ submitError }}</div>
        </div>

        <div class="ucm-foot">
          <button class="ucm-btn ghost" @click="handleClose">Cancel</button>
          <button v-if="step === 1" class="ucm-btn primary" :disabled="!enteredCode.trim()" @click="handleStep1Next">
            Next
          </button>
          <template v-else-if="step === 2">
            <button class="ucm-btn ghost" @click="step = 1">Back</button>
            <button class="ucm-btn danger" :disabled="submitting" @click="handleConfirm">
              {{ submitting ? 'Unmarking…' : 'Confirm Unmark' }}
            </button>
          </template>
        </div>

      </div>
    </div>
  </Teleport>
</template>

<script setup>
import { ref, watch, nextTick } from 'vue'
import { useDesignHouse } from '~/composables/useDesignHouse'

const props = defineProps({
  // The advert being unmarked, or null when the modal should be hidden.
  // Expected shape: { id, reference, bcReference, advertTitle, clientName }
  advert: { type: Object, default: null },
})
const emit = defineEmits(['close', 'unmarked'])

const dh = useDesignHouse()

const step = ref(1)
const enteredCode = ref('')
const step1Error = ref('')
const submitError = ref('')
const submitting = ref(false)
const codeInputEl = ref(null)

function normalize(code) {
  return (code || '').trim().replace(/^b-so-/i, '').trim().toLowerCase()
}

function handleStep1Next() {
  step1Error.value = ''
  const expected = normalize(props.advert?.bcReference)
  const submitted = normalize(enteredCode.value)

  if (!expected) {
    step1Error.value = "This advert has no BC reference on record, so it can't be verified this way."
    return
  }
  if (!submitted || submitted !== expected) {
    step1Error.value = "That code doesn't match this advert's BC reference. Check you have the right advert."
    return
  }
  step.value = 2
}

async function handleConfirm() {
  if (!props.advert) return
  submitting.value = true
  submitError.value = ''
  try {
    await dh.unmarkDesignComplete(props.advert.id, enteredCode.value)
    emit('unmarked', props.advert.id)
    handleClose()
  } catch (e) {
    submitError.value = e?.data?.message || e?.message || 'Failed to unmark this advert. Please try again.'
  } finally {
    submitting.value = false
  }
}

function handleClose() {
  emit('close')
}

// Reset to a clean step-1 state every time a new advert is opened, and
// focus the code input so the person can start typing immediately.
watch(() => props.advert, (a) => {
  if (a) {
    step.value = 1
    enteredCode.value = ''
    step1Error.value = ''
    submitError.value = ''
    nextTick(() => codeInputEl.value?.focus())
  }
})
</script>

<style scoped>
.ucm-backdrop {
  position: fixed; inset: 0; background: rgba(28, 27, 24, .5); display: none;
  align-items: center; justify-content: center; z-index: 1200; padding: 20px;
}
.ucm-backdrop.open { display: flex; }
.ucm-modal {
  background: #fffdf8; border: 1px solid #b7ae97; border-radius: 3px;
  max-width: 460px; width: 100%; display: flex; flex-direction: column;
  box-shadow: 0 16px 48px rgba(0, 0, 0, .3);
}

.ucm-head { display: flex; justify-content: space-between; align-items: center; padding: 16px 20px; border-bottom: 1px solid #b7ae97; background: #f6f3ec; }
.ucm-head h3 { margin: 0; font-family: 'Source Serif 4', serif; font-size: 16px; font-weight: 700; color: #1c1b18; }
.ucm-close { cursor: pointer; font-size: 20px; color: #6b6658; line-height: 1; background: none; border: none; }
.ucm-close:hover { color: #1c1b18; }

.ucm-body { padding: 18px 20px; display: flex; flex-direction: column; gap: 12px; }

.ucm-advert-summary { background: #f6f3ec; border: 1px solid #d9d3c3; border-radius: 2px; padding: 10px 12px; display: flex; flex-direction: column; gap: 4px; }
.ucm-advert-summary .row { display: flex; justify-content: space-between; gap: 10px; font-size: 12px; }
.ucm-advert-summary .lbl { color: #6b6658; }
.ucm-advert-summary .val { color: #1c1b18; font-weight: 600; text-align: right; }

.ucm-instructions { font-size: 12.5px; color: #444; margin: 0; line-height: 1.5; }
.ucm-label { font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: .4px; color: #6b6658; }

.ucm-code-input { display: flex; align-items: center; border: 1px solid #b7ae97; border-radius: 2px; background: #fff; overflow: hidden; }
.ucm-code-input .prefix { padding: 0 0 0 10px; font-family: 'IBM Plex Mono', monospace; font-size: 13px; color: #6b6658; user-select: none; }
.ucm-code-input input {
  flex: 1; border: none; outline: none; padding: 9px 10px 9px 4px;
  font-family: 'IBM Plex Mono', monospace; font-size: 13px; color: #1c1b18; background: transparent;
}
.ucm-code-input:focus-within { border-color: #1c3fa8; box-shadow: 0 0 0 3px #e7ecfb; }

.ucm-hint { font-size: 10.5px; color: #6b6658; }

.ucm-warning { background: #FCE4D6; border: 1px solid #E31E24; border-radius: 2px; padding: 10px 12px; }
.ucm-warning strong { display: block; font-size: 12.5px; color: #9C0006; margin-bottom: 4px; }
.ucm-warning p { margin: 0; font-size: 11.5px; color: #6b3a3c; line-height: 1.5; }

.ucm-error { background: #FCE4D6; border: 1px solid #E31E24; color: #9C0006; font-size: 11px; padding: 6px 10px; border-radius: 2px; }

.ucm-foot { display: flex; justify-content: flex-end; gap: 8px; padding: 14px 20px; border-top: 1px solid #d9d3c3; }
.ucm-btn {
  font-family: 'Inter', sans-serif; font-size: 12.5px; font-weight: 600; padding: 8px 14px; border-radius: 2px;
  border: 1px solid #1c1b18; background: #fffdf8; color: #1c1b18; cursor: pointer;
}
.ucm-btn:disabled { opacity: .4; cursor: not-allowed; }
.ucm-btn.ghost { background: transparent; }
.ucm-btn.primary { background: #1c3fa8; border-color: #1c3fa8; color: #fff; }
.ucm-btn.danger { background: #C0181E; border-color: #C0181E; color: #fff; }
.ucm-btn.danger:hover:not(:disabled) { background: #9C0006; border-color: #9C0006; }

.mono { font-family: 'IBM Plex Mono', monospace; }
</style>