// composables/useClassifiedTemplates.js
//
// Defines the fixed set of "classified" text types (Lost ID, Lost Passport,
// Property to Let, etc). Field sets and composed wording for the "LOST ..."
// and "TRANSFER ..." templates are sourced directly from
// ADVERTISING_FORMATS.docx (the actual printed classified layouts), not
// invented - do not add/remove fields on those without checking that source.
//
// Each template lists its labeled fields (used to render the data-entry form
// and for required-field validation) in order. Given a template id + the
// field values a clerk has entered, buildClassifiedText() assembles the
// printable/countable text and returns the word count.
//
// Two assembly modes:
//   1. GENERIC (default): the type name is printed as its own title line,
//      then one line per field as "Label: value". Two special rules apply:
//        - A field marked `optional: true` is dropped entirely (label +
//          value) if left blank.
//        - A field marked `excludeLabelFromCount: true` still shows its
//          label in the assembled text, but the label's words are not
//          counted - only the value's words are.
//   2. COMPOSE (`template.compose` is a function): the real printed format
//      is a fixed sentence with the type name embedded inline (e.g. "LOST
//      DRIVING PERMIT NO 12345"), not a title line above a field list.
//      compose(values) returns the exact assembled text; every word in it
//      is billable print content, so the whole thing is counted - there's
//      no separate label-vs-value split for these.

const TEMPLATES = [
  {
    id: 'lost_academic_document',
    name: 'Lost Academic Document',
    // Not in ADVERTISING_FORMATS.docx - no source for its exact printed
    // wording, so this stays on the generic Label: value assembly rather
    // than a guessed compose() sentence.
    fields: [
      { key: 'registration_number', label: 'Registration Number:', required: true },
      { key: 'name', label: 'Name:', required: true },
      { key: 'contact', label: 'Contact:', required: true },
      { key: 'school', label: 'School:', required: true }
    ]
  },
  {
    id: 'lost_driving_permit',
    name: 'Lost Driving Permit',
    fields: [
      { key: 'permit_number', label: 'Permit Number:', required: true },
      { key: 'name', label: 'Name:', required: true },
      { key: 'contact', label: 'Contact:', required: true }
    ],
    compose: (values) => {
      const permitNumber = (values?.permit_number ?? '').toString().trim()
      const name = (values?.name ?? '').toString().trim()
      const contact = (values?.contact ?? '').toString().trim()
      return `LOST DRIVING PERMIT NO ${permitNumber}\nNAME ${name}\nCONTACT: ${contact}`
    }
  },
  {
    id: 'lost_id',
    name: 'Lost Id',
    // Not explicitly in ADVERTISING_FORMATS.docx, but follows the identical
    // "LOST [document] NO / NAME / CONTACT" pattern shown for Driving
    // Permit and Passport, so composed the same way for consistency.
    fields: [
      { key: 'id_number', label: 'Id Number:', required: true },
      { key: 'name', label: 'Name:', required: true },
      { key: 'contact', label: 'Contact:', required: true }
    ],
    compose: (values) => {
      const idNumber = (values?.id_number ?? '').toString().trim()
      const name = (values?.name ?? '').toString().trim()
      const contact = (values?.contact ?? '').toString().trim()
      return `LOST ID NO ${idNumber}\nNAME ${name}\nCONTACT: ${contact}`
    }
  },
  {
    id: 'lost_land_title',
    name: 'Lost Land Title',
    // Matches the doc exactly: BLOCK NO, PLOT NO, LAND AT, REGISTERED
    // PROPRIETOR, CONTACT. The old `advocation_of_land` field didn't exist
    // in the real format and has been removed; `land_at` (which the real
    // ad has and the old template was missing) has been added.
    fields: [
      { key: 'block_number', label: 'Block Number:', required: true },
      { key: 'plot_number', label: 'Plot Number:', required: true },
      { key: 'land_at', label: 'Land At:', required: true },
      { key: 'registered_proprietor', label: 'Registered Proprietor:', required: true },
      { key: 'contact', label: 'Contact:', required: true }
    ],
    compose: (values) => {
      const blockNumber = (values?.block_number ?? '').toString().trim()
      const plotNumber = (values?.plot_number ?? '').toString().trim()
      const landAt = (values?.land_at ?? '').toString().trim()
      const registeredProprietor = (values?.registered_proprietor ?? '').toString().trim()
      const contact = (values?.contact ?? '').toString().trim()
      return `LOST LAND TITLE BLOCK NO ${blockNumber}, PLOT NO ${plotNumber}\nLAND AT ${landAt}\nREGISTERED PROPRIETOR ${registeredProprietor}\nCONTACT: ${contact}`
    }
  },
  {
    id: 'lost_logbook',
    name: 'Lost Logbook',
    // The real ad has no name field - just the vehicle number and contact.
    // Vehicle type is a fixed choice (Motor Vehicle / Motor Cycle) so the
    // wording in the composed text is always exactly right rather than
    // typed freehand.
    fields: [
      { key: 'vehicle_type', label: 'Vehicle Type:', required: true, options: ['Motor Vehicle', 'Motor Cycle'] },
      { key: 'vehicle_number', label: 'Registration Number:', required: true },
      { key: 'contact', label: 'Contact:', required: true }
    ],
    compose: (values) => {
      const vehicleType = (values?.vehicle_type || 'Motor Vehicle').toString().trim().toUpperCase()
      const vehicleNumber = (values?.vehicle_number ?? '').toString().trim()
      const contact = (values?.contact ?? '').toString().trim()
      return `LOST LOG BOOK FOR ${vehicleType} NO ${vehicleNumber}\nCONTACT: ${contact}`
    }
  },
  {
    id: 'lost_number_plate',
    name: 'Lost Number Plate',
    // Same reasoning as Lost Logbook: no name field, and vehicle type is a
    // fixed select rather than free text.
    fields: [
      { key: 'vehicle_type', label: 'Vehicle Type:', required: true, options: ['Motor Vehicle', 'Motor Cycle'] },
      { key: 'vehicle_number', label: 'Registration Number:', required: true },
      { key: 'contact', label: 'Contact:', required: true }
    ],
    compose: (values) => {
      const vehicleType = (values?.vehicle_type || 'Motor Vehicle').toString().trim().toUpperCase()
      const vehicleNumber = (values?.vehicle_number ?? '').toString().trim()
      const contact = (values?.contact ?? '').toString().trim()
      return `LOST NUMBER PLATE FOR ${vehicleType} NO ${vehicleNumber}\nCONTACT: ${contact}`
    }
  },
  {
    id: 'lost_passport',
    name: 'Lost Passport',
    fields: [
      { key: 'passport_number', label: 'Passport Number:', required: true },
      { key: 'name', label: 'Name:', required: true },
      { key: 'contact', label: 'Contact:', required: true }
    ],
    compose: (values) => {
      const passportNumber = (values?.passport_number ?? '').toString().trim()
      const name = (values?.name ?? '').toString().trim()
      const contact = (values?.contact ?? '').toString().trim()
      return `LOST PASSPORT NO ${passportNumber}\nNAME ${name}\nCONTACT: ${contact}`
    }
  },
  {
    // Split from the old single "Transfer of Number Plate" template, which
    // didn't match the real ad at all (it's a fixed Ministry of Works
    // regulatory notice, not a generic vehicle/name/company/phone list).
    // Motor Vehicle and Motor Cycle are two separate exact notices in the
    // source doc, kept as separate templates so the wording can't be
    // mixed up between them.
    id: 'transfer_of_motor_vehicle',
    name: 'Transfer of Motor Vehicle',
    fields: [
      { key: 'names_in_logbook', label: 'Names in Logbook:', required: true },
      { key: 'vehicle_number', label: 'Motor Vehicle No:', required: true },
      { key: 'contact', label: 'Contact:', required: true }
    ],
    compose: (values) => {
      const names = (values?.names_in_logbook ?? '').toString().trim()
      const vehicleNumber = (values?.vehicle_number ?? '').toString().trim()
      const contact = (values?.contact ?? '').toString().trim()
      return `TRANSFER ${names} REPORT TO MINISTRY OF WORKS TO TRANSFER MOTOR VEHICLE NO ${vehicleNumber}\nCONTACT: ${contact}`
    }
  },
  {
    id: 'transfer_of_motor_cycle',
    name: 'Transfer of Motor Cycle',
    fields: [
      { key: 'names_in_logbook', label: 'Names in Logbook:', required: true },
      { key: 'vehicle_number', label: 'Motor Cycle No:', required: true },
      { key: 'contact', label: 'Contact:', required: true }
    ],
    compose: (values) => {
      const names = (values?.names_in_logbook ?? '').toString().trim()
      const vehicleNumber = (values?.vehicle_number ?? '').toString().trim()
      const contact = (values?.contact ?? '').toString().trim()
      return `TRANSFER ${names} REPORT TO MINISTRY OF WORKS TO TRANSFER MOTOR CYCLE NO ${vehicleNumber}\nCONTACT: ${contact}`
    }
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
    fields: [
      { key: 'title', label: 'Title:', required: true },
      { key: 'text', label: 'Text:', required: true, freeText: true }
    ],
    // The printed ad is just the title then the body text - no "Others"
    // type-name line and no "Title:"/"Text:" labels, unlike every other
    // template here. Word count still only reflects the title's and text's
    // own words, since there are no label words in the composed string to
    // begin with.
    compose: (values) => {
      const title = (values?.title ?? '').toString().trim()
      const text = (values?.text ?? '').toString().trim()
      return `${title}\n${text}`
    }
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

    // Compose-based templates: the assembled text is a fixed sentence with
    // the type name embedded inline, not a title line above a field list.
    // Every word is billable print content, so the entire composed string
    // is counted - there's no label-vs-value split to apply here.
    if (template.compose) {
      if (isManualCount) {
        const naValues = {}
        template.fields.forEach((field) => { naValues[field.key] = 'N/A' })
        const composed = template.compose(naValues)
        return { text: composed, wordCount: manualWordCount }
      }
      const composed = template.compose(values || {})
      return { text: composed, wordCount: countWords(composed) }
    }

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