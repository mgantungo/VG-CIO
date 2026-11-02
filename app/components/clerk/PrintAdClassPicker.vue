<!-- components/clerk/PrintAdClassPicker.vue -->
<!--
  Display ad / Classified — required on every print booking.
  v-model is 'display' | 'classified' | ''. `suggested` is what the chosen
  rate card implies (classified / per-word rate cards → classified); the
  parent pre-selects it until the clerk picks one by hand.
-->
<template>
  <fieldset class="pac" :class="{ 'pac--missing': showMissing }" :disabled="disabled">
    <legend class="pac__legend">Print advert type <span class="pac__req">required</span></legend>

    <div class="pac__grid" role="radiogroup" aria-label="Print advert type">
      <label
        v-for="opt in OPTIONS"
        :key="opt.value"
        class="pac__opt"
        :class="{ 'pac__opt--on': modelValue === opt.value }"
      >
        <input
          type="radio"
          name="print-ad-class"
          :value="opt.value"
          :checked="modelValue === opt.value"
          @change="pick(opt.value)"
        >
        <span class="pac__text">
          <span class="pac__name">
            {{ opt.label }}
            <em v-if="suggested === opt.value" class="pac__hint">matches rate card</em>
          </span>
          <span class="pac__desc">{{ opt.desc }}</span>
        </span>
      </label>
    </div>

    <p v-if="mismatch" class="pac__note pac__note--warn">
      The selected rate card looks like a {{ suggested === 'classified' ? 'classified' : 'display' }} rate.
      Keep your choice only if the rate card is wrong for this advert.
    </p>
    <p v-else-if="showMissing" class="pac__note pac__note--err">Choose Display ad or Classified to book a print advert.</p>
    <p v-else class="pac__note">Used for the Display vs Classified report and to route the advert at Copy Desk.</p>
  </fieldset>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  modelValue: { type: String, default: '' },
  suggested: { type: String, default: '' },
  disabled: { type: Boolean, default: false },
  showMissing: { type: Boolean, default: false },
})
const emit = defineEmits(['update:modelValue', 'picked'])

const OPTIONS = [
  { value: 'display', label: 'Display ad', desc: 'Sized in columns × cm. Artwork from Design House.' },
  { value: 'classified', label: 'Classified', desc: 'Priced per word or per classified slot. Text built in the classified builder.' },
]

const mismatch = computed(() =>
  !!props.modelValue && !!props.suggested && props.modelValue !== props.suggested
)

const pick = (value) => {
  emit('update:modelValue', value)
  emit('picked', value)
}
</script>

<style scoped>
.pac {
  border: 1px solid #9DC3E6; background: #F5F9FD; border-radius: 2px;
  padding: 14px 16px 12px; margin: 0 0 20px; font-family: 'IBM Plex Sans', 'Segoe UI', sans-serif;
}
.pac--missing { border-color: #C0181E; background: #FFF7F7; }
.pac__legend { font-size: 11px; font-weight: 700; color: #003366; padding: 0 6px; text-transform: uppercase; letter-spacing: .06em; }
.pac__req { font-weight: 600; color: #C0181E; text-transform: none; letter-spacing: 0; margin-left: 4px; }
.pac__grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 12px; }
.pac__opt {
  display: flex; gap: 12px; align-items: flex-start; cursor: pointer;
  background: #fff; border: 1px solid #D1D9E0; border-radius: 2px; padding: 12px 14px; min-height: 44px;
}
.pac__opt--on { border: 2px solid #003366; padding: 11px 13px; }
.pac__opt input { margin-top: 3px; accent-color: #003366; width: 16px; height: 16px; flex-shrink: 0; }
.pac__text { display: flex; flex-direction: column; gap: 3px; }
.pac__name { font-size: 14px; font-weight: 700; color: #0F172A; display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
.pac__opt--on .pac__name { color: #003366; }
.pac__hint { font-style: normal; font-size: 10.5px; font-weight: 600; color: #14532D; background: #ECFDF3; border: 1px solid #86D9A8; border-radius: 2px; padding: 1px 6px; }
.pac__desc { font-size: 12px; color: #475569; line-height: 1.4; }
.pac__note { margin: 10px 0 0; font-size: 11.5px; color: #475569; }
.pac__note--warn { color: #7A4A00; }
.pac__note--err { color: #8A1014; font-weight: 600; }
fieldset[disabled] .pac__opt { cursor: not-allowed; opacity: .7; }
@media (max-width: 640px) { .pac__grid { grid-template-columns: 1fr; } }
</style>
