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
    isComplete: false
  }),

  actions: {
    setTemplate(templateId, emptyValues = {}) {
      this.templateId = templateId
      this.values = { ...emptyValues }
    },

    setFieldValue(key, value) {
      this.values = { ...this.values, [key]: value }
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
    }
  }
})