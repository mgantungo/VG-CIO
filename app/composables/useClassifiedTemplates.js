// composables/useClassifiedTemplates.js
//
// Defines the fixed set of "classified" text types (Lost ID, Lost Passport,
// Property to Let, etc). Each template lists its labeled fields in order.
// Given a template id + the field values a clerk has entered, buildClassifiedText()
// assembles the printable/countable text and returns the word count, applying
// two special rules:
//   1. A field marked `optional: true` is dropped entirely (label + value) if left blank.
//   2. A field marked `excludeLabelFromCount: true` still shows its label in the
//      assembled text, but the label's words are not counted — only the value's words are.

const TEMPLATES = [
  {
    id: 'lost_academic_document',
    name: 'Lost Academic Document',
    fields: [
      { key: 'registration_number', label: 'Registration Number:', required: true },
      { key: 'name', label: 'Name:', required: true },
      { key: 'phone', label: 'Phone:', required: true },
      { key: 'school', label: 'School:', required: true }
    ]
  },
  {
    id: 'lost_driving_permit',
    name: 'Lost Driving Permit',
    fields: [
      { key: 'permit_number', label: 'Permit Number:', required: true },
      { key: 'name', label: 'Name:', required: true },
      { key: 'phone', label: 'Phone:', required: true }
    ]
  },
  {
    id: 'lost_id',
    name: 'Lost Id',
    fields: [
      { key: 'id_number', label: 'Id Number:', required: true },
      { key: 'name', label: 'Name:', required: true },
      { key: 'phone', label: 'Phone:', required: true }
    ]
  },
  {
    id: 'lost_land_title',
    name: 'Lost Land Title',
    fields: [
      { key: 'block_number', label: 'Block Number:', required: true },
      { key: 'plot_number', label: 'Plot Number:', required: true },
      { key: 'registered_owner', label: 'Registered Owner:', required: true },
      { key: 'advocation_of_land', label: 'Advocation of land:', required: true },
      { key: 'phone', label: 'Phone:', required: true }
    ]
  },
  {
    id: 'lost_logbook',
    name: 'Lost Logbook',
    fields: [
      { key: 'vehicle_number', label: 'Vehicle Number:', required: true },
      { key: 'name', label: 'Name:', required: true },
      { key: 'phone', label: 'Phone:', required: true }
    ]
  },
  {
    id: 'lost_number_plate',
    name: 'Lost Number Plate',
    fields: [
      { key: 'vehicle_number', label: 'Vehicle Number:', required: true },
      { key: 'name', label: 'Name:', required: true },
      { key: 'phone', label: 'Phone:', required: true }
    ]
  },
  {
    id: 'lost_passport',
    name: 'Lost Passport',
    fields: [
      { key: 'passport_number', label: 'Passport Number', required: true },
      { key: 'name', label: 'Name:', required: true },
      { key: 'phone', label: 'Phone:', required: true }
    ]
  },
  {
    id: 'transfer_of_number_plate',
    name: 'Transfer of Number Plate',
    fields: [
      { key: 'vehicle_number', label: 'Vehicle Number:', required: true },
      { key: 'name', label: 'Name:', required: true },
      // Optional: if left blank, this field (label + value) is dropped entirely
      { key: 'company', label: 'Company:', required: false, optional: true },
      { key: 'phone', label: 'Phone:', required: true }
    ]
  },
  {
    id: 'property_to_let',
    name: 'Property to Let / Lease',
    fields: [
      // Free text field. Label is shown but not counted toward the word count.
      { key: 'advert_text', label: 'Advert Text:', required: true, excludeLabelFromCount: true, freeText: true }
    ]
  },
  {
    id: 'property_for_rent',
    name: 'Property For Rent',
    fields: [
      { key: 'advert_text', label: 'Advert Text:', required: true, excludeLabelFromCount: true, freeText: true }
    ]
  },
  {
    id: 'others',
    name: 'Others',
    // The type-name line ("Others") is still printed but shouldn't count as
    // a billable word - unlike every other template here where the name is
    // part of the ad content.
    excludeNameFromCount: true,
    fields: [
      // Label excluded from count - only the title's own words count, not
      // the word "Title:" itself.
      { key: 'title', label: 'Title:', required: true, excludeLabelFromCount: true },
      // Free text field, same pattern as Advert Text: only the value's
      // words count, not the "Text:" label itself.
      { key: 'text', label: 'Text:', required: true, excludeLabelFromCount: true, freeText: true }
    ]
  }
]

// Split on any whitespace, ignore empty tokens
const countWords = (str) => {
  if (!str) return 0
  const trimmed = String(str).trim()
  if (!trimmed) return 0
  return trimmed.split(/\s+/).filter(Boolean).length
}

export const useClassifiedTemplates = () => {
  const getTemplate = (templateId) => {
    return TEMPLATES.find((t) => t.id === templateId) || null
  }

  const createEmptyValues = (templateId) => {
    const template = getTemplate(templateId)
    if (!template) return {}
    return template.fields.reduce((acc, field) => {
      acc[field.key] = ''
      return acc
    }, {})
  }

  // Returns which required fields are still missing a value
  const getMissingRequiredFields = (templateId, values) => {
    const template = getTemplate(templateId)
    if (!template) return []
    return template.fields.filter((field) => {
      if (!field.required) return false
      const value = (values?.[field.key] ?? '').toString().trim()
      return value.length === 0
    })
  }

  const isTemplateComplete = (templateId, values) => {
    return getMissingRequiredFields(templateId, values).length === 0
  }

  // Builds the assembled text (text type name, then one field per line: "Label: value")
  // and the word count. The text type name itself counts toward the word total since
  // it is printed as part of the ad content / Special Instructions.
  //
  // options.manualWordCount: for bulk bookings of several identical classifieds
  // under one order line (e.g. 20 Lost Number Plate notices for one client),
  // the clerk enters a single total word count directly instead of filling in
  // per-unit field values. When set (a positive number), every field is shown
  // as "N/A" in the assembled text regardless of `values` or `optional`, and
  // the returned wordCount is exactly the entered figure rather than a count
  // derived from the (placeholder) field text.
  const buildClassifiedText = (templateId, values, options = {}) => {
    const template = getTemplate(templateId)
    if (!template) return { text: '', wordCount: 0 }

    const { manualWordCount } = options
    const isManualCount = manualWordCount != null && manualWordCount > 0

    let wordCount = 0
    const lines = []

    // Text type name is always the first printed line. It counts toward the
    // word total unless the template explicitly opts out via
    // excludeNameFromCount (currently only "Others"), or a manual count is
    // in effect (the manual figure is the total, full stop).
    lines.push(template.name)
    if (!template.excludeNameFromCount && !isManualCount) {
      wordCount += countWords(template.name)
    }

    template.fields.forEach((field) => {
      let rawValue = (values?.[field.key] ?? '').toString().trim()

      if (isManualCount) {
        // Bulk entry: individual field values aren't captured per unit, so
        // every field - including ones normally marked optional - shows as
        // N/A rather than being left blank or dropped.
        rawValue = 'N/A'
      } else if (field.optional && !rawValue) {
        // Rule 1: optional + blank -> drop entirely (label + value not shown, not counted)
        return
      }

      const line = `${field.label} ${rawValue}`.trim()
      lines.push(line)

      if (isManualCount) {
        // Placeholder N/A text is never counted - the manual figure is
        // the whole word count.
        return
      }

      // Rule 2: label excluded from count -> only count the value's words
      if (field.excludeLabelFromCount) {
        wordCount += countWords(rawValue)
      } else {
        wordCount += countWords(line)
      }
    })

    return {
      text: lines.join('\n'),
      wordCount: isManualCount ? manualWordCount : wordCount
    }
  }

  return {
    templates: TEMPLATES,
    getTemplate,
    createEmptyValues,
    getMissingRequiredFields,
    isTemplateComplete,
    buildClassifiedText,
    countWords
  }
}