<!-- components/clerk/ClassifiedTextBuilder.vue -->
<template>
  <div class="classified-builder">
    <div class="input-group template-row">
      <div class="template-select-wrap">
        <label>Text Type:</label>
        <select v-model="templateId" :disabled="disabled" @change="handleTemplateChange">
          <option value="" disabled>Select a text type...</option>
          <option v-for="t in templates" :key="t.id" :value="t.id">{{ t.name }}</option>
        </select>
      </div>
      <button
        v-if="templateId"
        type="button"
        class="btn-start-over"
        :disabled="disabled"
        @click="confirmStartOver"
      >
        Start Over
      </button>
    </div>

    <div v-if="template" class="fields-block">
      <div v-for="field in template.fields" :key="field.key" class="input-group">
        <label>
          {{ field.label }}
          <span v-if="field.optional" class="optional-tag">optional</span>
        </label>

        <textarea
          v-if="field.freeText"
          v-model="store.values[field.key]"
          rows="4"
          :placeholder="`Enter ${field.label.replace(':', '').toLowerCase()}...`"
          :disabled="disabled"
        ></textarea>
        <input
          v-else
          type="text"
          v-model="store.values[field.key]"
          :placeholder="`Enter ${field.label.replace(':', '').toLowerCase()}...`"
          :disabled="disabled"
        >
      </div>

      <div class="count-summary">
        <div class="count-row">
          <span>Word Count:</span>
          <strong>{{ wordCount }}</strong>
        </div>
        <small class="help-text">Estimated reading time: {{ estimatedReadingTime }}</small>
      </div>

      <div v-if="missingFields.length" class="missing-warning">
        Please fill in: {{ missingFields.map(f => f.label.replace(':', '')).join(', ') }}
      </div>

      <div v-if="assembledText" class="preview-block">
        <label>Preview:</label>
        <pre class="preview-text">{{ assembledText }}</pre>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, watch } from 'vue'
import { storeToRefs } from 'pinia'
import { useClassifiedTemplates } from '~/composables/useClassifiedTemplates'
import { useClassifiedAdStore } from '~/stores/classifiedAd'

const props = defineProps({
  disabled: {
    type: Boolean,
    default: false
  }
})

// change: { templateId, values, text, wordCount, isComplete }
const emit = defineEmits(['change'])

const {
  templates,
  getTemplate,
  createEmptyValues,
  getMissingRequiredFields,
  buildClassifiedText
} = useClassifiedTemplates()

// Store is the single source of truth, so re-opening the modal (e.g. after
// switching Full Colour / Black & White) restores exactly what was typed
// rather than starting from a blank form.
const store = useClassifiedAdStore()
const { templateId } = storeToRefs(store)

const template = computed(() => getTemplate(templateId.value))

const handleTemplateChange = () => {
  // Only reset field values if there isn't already saved progress for this
  // template (switching TO a template that already has values, e.g. after
  // an ad-type toggle, should not wipe them).
  const hasExistingValues = Object.keys(store.values || {}).length > 0
  if (!hasExistingValues) {
    store.setTemplate(templateId.value, createEmptyValues(templateId.value))
  } else {
    store.templateId = templateId.value
  }
  emitChange()
}

const confirmStartOver = () => {
  if (confirm('Clear this ad content and start over? This cannot be undone.')) {
    store.clear()
    emitChange()
  }
}

const missingFields = computed(() => {
  if (!templateId.value) return []
  return getMissingRequiredFields(templateId.value, store.values)
})

const assembled = computed(() => {
  if (!templateId.value) return { text: '', wordCount: 0 }
  return buildClassifiedText(templateId.value, store.values)
})

const assembledText = computed(() => assembled.value.text)
const wordCount = computed(() => assembled.value.wordCount)

const estimatedReadingTime = computed(() => {
  if (!wordCount.value) return '0 minutes'
  const minutes = Math.ceil(wordCount.value / 200) // ~200 words per minute
  return `${minutes} minute${minutes !== 1 ? 's' : ''}`
})

const emitChange = () => {
  store.setDerived({
    text: assembledText.value,
    wordCount: wordCount.value,
    isComplete: missingFields.value.length === 0 && !!templateId.value
  })
  emit('change', {
    templateId: templateId.value,
    values: { ...store.values },
    text: assembledText.value,
    wordCount: wordCount.value,
    isComplete: missingFields.value.length === 0 && !!templateId.value
  })
}

// Re-derive + persist whenever field values or the assembled output changes.
// Deep watch on store.values covers every keystroke in any field.
watch(() => ({ ...store.values }), emitChange, { deep: true })
watch([assembledText, wordCount, templateId], emitChange, { immediate: true })
</script>

<style scoped>
.classified-builder {
  --navy:#003366; --blue:#0066CC; --blue-lt:#EEF4FF;
  --surface:#FFFFFF; --page-bg:#F0F4F8; --border:#D1D9E0; --border-lt:#E8ECF0;
  --text-1:#0F172A; --text-2:#334155; --text-3:#64748B; --text-4:#94A3B8;
  --amber-text:#78350F; --amber-bg:#FFFBEB; --amber-bd:#FCD34D;
  --red:#E31E24; --red-text:#991B1B; --red-bg:#FEF2F2; --red-bd:#FECACA;
  --radius:2px; --ring:0 0 0 3px rgba(0,102,204,.15); --t:140ms ease;
  --font:"IBM Plex Sans",-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;
  font-family: var(--font);
}

.template-row { display: flex; align-items: flex-end; gap: 10px; }
.template-select-wrap { flex: 1; }

.btn-start-over {
  height: 38px; padding: 0 12px; white-space: nowrap;
  border: 1.5px solid var(--red-bd); border-radius: var(--radius);
  background: var(--red-bg); color: var(--red-text);
  font-family: var(--font); font-size: 12px; font-weight: 600;
  cursor: pointer; transition: all var(--t);
}
.btn-start-over:hover:not(:disabled) { background: var(--red); color: #fff; }
.btn-start-over:disabled { opacity: .45; cursor: not-allowed; }

.input-group { margin-bottom: 16px; }
.input-group label {
  display: flex; align-items: center; gap: 8px; margin-bottom: 6px;
  font-size: 11px; font-weight: 600; text-transform: uppercase;
  letter-spacing: .06em; color: var(--text-3);
}
.optional-tag {
  font-size: 9px; font-weight: 700; text-transform: uppercase; letter-spacing: .04em;
  padding: 1px 6px; border-radius: 1px; color: var(--text-4);
  background: var(--page-bg); border: 1px solid var(--border-lt);
}

.input-group select,
.input-group input,
.input-group textarea {
  width: 100%; padding: 0 12px; height: 38px; box-sizing: border-box;
  border: 1.5px solid var(--border); border-radius: var(--radius);
  font-family: var(--font); font-size: 13px; color: var(--text-1);
  background: var(--surface); outline: none;
  transition: border-color var(--t), box-shadow var(--t);
}
.input-group textarea { height: auto; padding: 10px 12px; resize: vertical; }
.input-group select:focus,
.input-group input:focus,
.input-group textarea:focus { border-color: var(--blue); box-shadow: var(--ring); }
.input-group select:disabled,
.input-group input:disabled,
.input-group textarea:disabled { background: var(--page-bg); color: var(--text-4); cursor: not-allowed; }

.fields-block { margin-top: 4px; }

.count-summary {
  display: flex; flex-direction: column; gap: 4px;
  padding: 10px 12px; margin-bottom: 12px;
  background: var(--page-bg); border: 1px solid var(--border-lt); border-radius: var(--radius);
}
.count-row { display: flex; justify-content: space-between; align-items: center; font-size: 13px; color: var(--text-2); }
.count-row strong { color: var(--navy); font-size: 14px; }
.help-text { color: var(--text-4); font-size: 11px; font-style: italic; }

.missing-warning {
  padding: 8px 12px; margin-bottom: 12px; font-size: 12px;
  color: var(--amber-text); background: var(--amber-bg);
  border: 1px solid var(--amber-bd); border-radius: var(--radius);
}

.preview-block label {
  display: block; margin-bottom: 6px; font-size: 11px; font-weight: 600;
  text-transform: uppercase; letter-spacing: .06em; color: var(--text-3);
}
.preview-text {
  margin: 0; padding: 10px 12px; white-space: pre-wrap; word-break: break-word;
  font-family: "IBM Plex Mono", monospace; font-size: 12px; color: var(--text-1);
  background: var(--page-bg); border: 1px solid var(--border-lt); border-radius: var(--radius);
}
</style>