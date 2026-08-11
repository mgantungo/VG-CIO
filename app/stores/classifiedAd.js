// stores/classifiedAd.js
//
// Persists the "per word" classified ad builder state (which text type was
// chosen, the field values typed in, and the derived text/word count) across
// re-opens of RateCardDetailsModal — e.g. when the clerk toggles Full Colour /
// Black & White, which re-triggers rate card selection and would otherwise
// wipe out everything they'd already typed.
import { defineStore } from 'pinia'

export const useClassifiedAdStore = defineStore('classifiedAd', {
  state: () => ({
    templateId: '',
    values: {},
    text: '',
    wordCount: 0,
    isComplete: false,
    // Bulk entry: several identical classifieds booked as one order line
    // (e.g. 20 Lost Number Plate notices for one client). When true, the
    // clerk enters a single total word count directly instead of filling in
    // per-unit field values, and every field is shown as N/A in the
    // assembled text.
    isBulk: false,
    manualWordCount: null
  }),

  actions: {
    setTemplate(templateId, emptyValues = {}) {
      this.templateId = templateId
      this.values = { ...emptyValues }
    },

    setFieldValue(key, value) {
      this.values = { ...this.values, [key]: value }
    },

    setBulkMode(isBulk) {
      this.isBulk = !!isBulk
      if (!this.isBulk) {
        this.manualWordCount = null
      }
    },

    setManualWordCount(count) {
      this.manualWordCount = count
    },

    setDerived({ text, wordCount, isComplete }) {
      this.text = text || ''
      this.wordCount = wordCount || 0
      this.isComplete = !!isComplete
    },

    // Explicit "start over" action - clerk-initiated, not automatic
    clear() {
      this.templateId = ''
      this.values = {}
      this.text = ''
      this.wordCount = 0
      this.isComplete = false
      this.isBulk = false
      this.manualWordCount = null
    }
  }
})