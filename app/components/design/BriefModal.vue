<!-- components/design/BriefModal.vue -->
<template>

  <Teleport to="body">

    <div class="dd-modal-backdrop" :class="{ open: !!advert }" @click.self="$emit('close')">

      <div class="dd-modal" v-if="advert">

        <div class="dd-modal-head">

          <h3>Brief — {{ advert.reference }}</h3>

          <button class="dd-modal-close" @click="$emit('close')">&times;</button>

        </div>

        <div class="dd-modal-body">

          <p class="dd-brief-text">"{{ advert.specialInstructions }}"</p>

          <div class="dd-brief-grid">

            <div><span class="k">Client</span>{{ advert.clientName }}</div>

            <div><span class="k">Contact</span>{{ advert.contactPerson }} — {{ advert.contactNumber }}</div>

            <div><span class="k">Ad Size</span>{{ advert.adSize }}</div>

            <div><span class="k">Payment</span>{{ advert.paymentMethod }} · {{ advert.isPaid ? 'Paid' : 'Unpaid' }}</div>

          </div>

        </div>

        <div class="dd-modal-foot">

          <button
            class="dd-btn ghost dd-copy-btn"
            :class="[copyState, { pulse: pulsing }]"
            @click="copyBrief"
            @animationend="pulsing = false"
          >
            <span v-if="copyState === 'copied'">✓ Copied</span>
            <span v-else-if="copyState === 'error'">✗ Couldn't copy</span>
            <span v-else>📋 Copy</span>
          </button>

          <button class="dd-btn primary" @click="$emit('close')">Close</button>

        </div>

      </div>

    </div>

  </Teleport>

</template>



<script setup>

import { ref, onUnmounted } from 'vue'

const props = defineProps({

  advert: { type: Object, default: null },

})

defineEmits(['close'])

const copyState = ref('idle') // 'idle' | 'copied' | 'error'
const pulsing = ref(false)
let resetTimer = null

function pulse() {
  // restart the animation even on rapid repeat clicks
  pulsing.value = false
  requestAnimationFrame(() => { pulsing.value = true })
}

function setCopyState(state) {
  copyState.value = state
  clearTimeout(resetTimer)
  resetTimer = setTimeout(() => { copyState.value = 'idle' }, 1800)
}

function copyBrief() {
  pulse()
  // advert.specialInstructions is the raw text — the template only adds
  // quotation marks for display, so reading it directly here keeps the
  // copied text free of the wrapping quotes.
  const text = props.advert?.specialInstructions || ''
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(text)
      .then(() => setCopyState('copied'))
      .catch(() => fallbackCopy(text))
  } else {
    fallbackCopy(text)
  }
}

function fallbackCopy(text) {
  const ta = document.createElement('textarea')
  ta.value = text
  ta.style.position = 'fixed'
  ta.style.opacity = '0'
  document.body.appendChild(ta)
  ta.focus()
  ta.select()
  try {
    document.execCommand('copy')
    setCopyState('copied')
  } catch (e) {
    console.error('[BriefModal] Copy failed:', e)
    setCopyState('error')
  }
  document.body.removeChild(ta)
}

onUnmounted(() => clearTimeout(resetTimer))

</script>



<style scoped>

.dd-modal-backdrop{

  position:fixed;inset:0;background:rgba(28,27,24,.45);display:none;

  align-items:center;justify-content:center;z-index:1100;padding:20px;

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



.dd-brief-text{font-family:'Source Serif 4',serif;font-style:italic;font-size:15px;line-height:1.6;color:#1c1b18;border-left:3px solid #b7ae97;padding-left:14px;margin:0 0 16px;}

.dd-brief-grid{display:grid;grid-template-columns:1fr 1fr;gap:12px;font-size:12.5px;}

.dd-brief-grid .k{display:block;font-size:10px;text-transform:uppercase;letter-spacing:.05em;color:#6b6658;margin-bottom:2px;}

.dd-copy-btn{transition:background .15s ease,border-color .15s ease,color .15s ease;min-width:78px;justify-content:center;}
.dd-copy-btn.copied{color:#2f6f4f;border-color:#2f6f4f;background:#e5efe9;}
.dd-copy-btn.error{color:#a8261e;border-color:#a8261e;background:#f7e6e5;}
.dd-copy-btn.pulse{animation:dd-copy-pulse .32s ease;}
@keyframes dd-copy-pulse{
  0%{transform:scale(1);}
  45%{transform:scale(.9);}
  100%{transform:scale(1);}
}

</style>