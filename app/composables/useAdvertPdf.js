// composables/useAdvertPdf.js
//
// Single source of truth for the "Advert Booking Confirmation" PDF layout -
// navy header band, barcode + QR code (only once a BC reference exists),
// two-column Client & Contact / Advert & Booking tables, Pricing & Payment,
// Publishing Date table, then Special Instructions.
//
// Used by both New.vue (the live booking form, before/around submission) and
// Indexpage.vue (reprinting an already-saved advert record from the
// dashboard). Neither caller's data shape matches the other directly - a
// live form has `form.email`, a saved record has `advert.contactEmail` - so
// each caller maps its own fields into the normalized `data` shape below
// before calling into this composable. That's what keeps both PDFs
// pixel-identical by construction, instead of by two hand-maintained copies
// of the same jsPDF code drifting apart over time.
//
// Expected `data` shape (all fields optional, every one degrades to '—'):
// {
//   systemReference, bcReference, statusLabel,
//   clientName, contactPerson, contactEmail, contactPhone, clientRefNo, marketSector,
//   advertTitle, product, adSize, officeLocation, salesAgent, colorType,
//   basePrice, surcharge, discountPercent, totalAmount,   // raw numbers - formatted here
//   paymentMethod, paymentStatus,
//   publishingDates,       // array of date strings/Dates
//   specialInstructions,
//   filename                // used by downloadAdvertPdf(), defaults if omitted
// }

const formatCurrency = (amount) => {
  if (amount === undefined || amount === null) return 'UGX 0'
  return new Intl.NumberFormat('en-UG', { style: 'currency', currency: 'UGX', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(amount)
}

// Color/Type is a plain toggle in the booking form ('full_color' /
// 'black_white') but is important downstream (design house, print ops need
// to know at a glance which plate to run) - spelled out here rather than
// left as the raw internal value.
const formatColorType = (colorType) => {
  if (colorType === 'full_color') return 'Full Color'
  if (colorType === 'black_white') return 'Black & White'
  return colorType || ''
}

const formatDate = (dateValue) => {
  if (!dateValue) return ''
  try {
    return new Date(dateValue).toLocaleDateString('en-UG', { month: 'short', day: 'numeric', year: 'numeric' })
  } catch {
    return String(dateValue)
  }
}

// Publishing dates can run into the dozens for adverts that repeat over a
// month or more, so a long run is compacted into "Mon{d,d,d}" groups (e.g.
// "Jan{1,2,4,6,21,27}, Feb{3,6,10}") once there are enough of them that the
// full list would overflow the space next to the Pricing & Payment table.
// Below that threshold, dates are just spelled out in full and comma-joined.
const COMPACT_DATE_THRESHOLD = 15

const formatPublishingDatesCompact = (dates) => {
  const parsed = (dates || [])
    .map((d) => (d instanceof Date ? d : new Date(d)))
    .filter((d) => !isNaN(d))
    .sort((a, b) => a - b)

  if (!parsed.length) return '—'

  if (parsed.length < COMPACT_DATE_THRESHOLD) {
    return parsed.map((d) => formatDate(d)).join(', ')
  }

  const groups = []
  parsed.forEach((d) => {
    // Key by month+year so a run spanning a year boundary doesn't merge two
    // different Januarys into one group; the label itself stays short.
    const monthYearKey = `${d.getFullYear()}-${d.getMonth()}`
    let group = groups.find((g) => g.key === monthYearKey)
    if (!group) {
      group = { key: monthYearKey, label: d.toLocaleDateString('en-UG', { month: 'short' }), days: [] }
      groups.push(group)
    }
    group.days.push(d.getDate())
  })

  return groups.map((g) => `${g.label}{${g.days.join(',')}}`).join(', ')
}

export const useAdvertPdf = () => {
  // Builds the jsPDF document. Returns the doc without saving or printing it.
  const buildAdvertPdf = async (data) => {
    const { default: jsPDF } = await import('jspdf')
    const { default: autoTable } = await import('jspdf-autotable')

    const doc = new jsPDF({ unit: 'mm', format: 'a4' })
    const pageWidth = doc.internal.pageSize.getWidth()

    const hasBcReference = !!data.bcReference

    doc.setFillColor(0, 51, 102)
    doc.rect(0, 0, pageWidth, 22, 'F')
    doc.setTextColor(255, 255, 255)
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(14)
    doc.text('Vision Group Advertising Management System', 10, 10)
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(10)
    doc.text('Advert Booking Confirmation', 10, 16)
    doc.setFontSize(12)
    doc.setFont('helvetica', 'bold')
    doc.text(data.systemReference || 'DRAFT', pageWidth - 10, 10, { align: 'right' })
    doc.setFontSize(10)
    doc.setFont('helvetica', 'normal')
    doc.text((data.statusLabel || '').toString().toUpperCase(), pageWidth - 10, 16, { align: 'right' })

    let y = 28
    doc.setTextColor(20, 20, 20)

    // Product is key information for downstream teams (design house, print
    // ops, finance) - shown prominently here in a larger bold line, in
    // addition to its row in the Advert & Booking table below. Color/Type
    // rides along on the same line since it's just as critical for whoever
    // is running the plate - they need to see "Full Color" vs "B&W" without
    // hunting through the table.
    if (data.product || data.colorType) {
      doc.setFontSize(13)
      doc.setFont('helvetica', 'bold')
      doc.setTextColor(0, 51, 102)
      const productLine = [
        data.product ? `Product: ${data.product}` : null,
        data.colorType ? formatColorType(data.colorType) : null,
      ].filter(Boolean).join('  ·  ')
      doc.text(productLine, 10, y)
      doc.setTextColor(20, 20, 20)
      doc.setFont('helvetica', 'normal')
      y += 8
    }

    // Barcode (left, encodes the system reference) + QR code (right) - both
    // only once a BC reference confirms this advert has actually been
    // submitted and synced. The QR encodes the Business Central reference
    // code itself (e.g. "B-SO-236997N") as plain text, not a link.
    if (hasBcReference) {
      try {
        const { default: JsBarcode } = await import('jsbarcode')
        const barcodeCanvas = document.createElement('canvas')
        JsBarcode(barcodeCanvas, data.systemReference || data.bcReference, {
          format: 'CODE128', width: 1.6, height: 34, displayValue: true, fontSize: 11, margin: 4
        })
        doc.addImage(barcodeCanvas.toDataURL('image/png'), 'PNG', 10, y, 62, 16)
      } catch (e) {
        console.warn('Barcode generation skipped:', e)
      }

      try {
        const QRCodeModule = await import('qrcode')
        const QRCode = QRCodeModule.default || QRCodeModule
        const qrDataUrl = await QRCode.toDataURL(data.bcReference, { width: 200, margin: 1 })
        doc.addImage(qrDataUrl, 'PNG', pageWidth - 32, y - 2, 22, 22)
      } catch (e) {
        console.warn('QR code generation skipped:', e)
      }

      y += 22
    }

    const pageMargin = 10
    const gap = 6
    const colWidth = (pageWidth - pageMargin * 2 - gap) / 2

    autoTable(doc, {
      startY: y,
      theme: 'grid',
      head: [['Client & Contact', '']],
      body: [
        ['Client', data.clientName || '—'],
        ['Contact Person', data.contactPerson || '—'],
        ['Contact Email', data.contactEmail || '—'],
        ['Contact Phone', data.contactPhone || '—'],
        ['Client Ref No', data.clientRefNo || '—'],
        ['Market Sector', data.marketSector || '—'],
      ],
      styles: { fontSize: 9.5, cellPadding: 2.5, overflow: 'linebreak' },
      headStyles: { fillColor: [0, 51, 102], textColor: 255 },
      columnStyles: { 0: { fontStyle: 'bold', cellWidth: colWidth * 0.42 } },
      tableWidth: colWidth,
      margin: { left: pageMargin, right: pageMargin + colWidth + gap },
    })
    const leftFinalY = doc.lastAutoTable.finalY

    const advertBookingRows = [
      ['Reference No.', data.systemReference || '—'],
      ['BC Reference No.', data.bcReference || '—'],
      ['Advert Title', data.advertTitle || '—'],
      ['Product', data.product || '—'],
      ['Ad Definition', data.adSize || '—'],
      ['Color/Type', data.colorType ? formatColorType(data.colorType) : '—'],
      ['Sales Agent', data.salesAgent || '—'],
      ['Office Location', data.officeLocation || '—'],
      ['Status', data.statusLabel || '—'],
    ]
    // Product, Ad Definition, and Color/Type are the fields downstream teams
    // (design house, print ops) scan for first - bolded here (both label and
    // value column) in addition to Product's larger standalone line above.
    const boldedRowLabels = new Set(['Product', 'Ad Definition', 'Color/Type'])

    autoTable(doc, {
      startY: y,
      theme: 'grid',
      head: [['Advert & Booking', '']],
      body: advertBookingRows,
      styles: { fontSize: 9.5, cellPadding: 2.5, overflow: 'linebreak' },
      headStyles: { fillColor: [0, 102, 204], textColor: 255 },
      columnStyles: { 0: { fontStyle: 'bold', cellWidth: colWidth * 0.42 } },
      tableWidth: colWidth,
      margin: { left: pageMargin + colWidth + gap, right: pageMargin },
      didParseCell: (cellData) => {
        if (boldedRowLabels.has(advertBookingRows[cellData.row.index]?.[0])) {
          cellData.cell.styles.fontStyle = 'bold'
        }
      },
    })
    const rightFinalY = doc.lastAutoTable.finalY

    y = Math.max(leftFinalY, rightFinalY) + 6

    autoTable(doc, {
      startY: y,
      theme: 'grid',
      head: [['Pricing & Payment', '']],
      body: [
        ['Base Price', formatCurrency(data.basePrice || 0)],
        ['Surcharge', formatCurrency(data.surcharge || 0)],
        ['Discount', `${Number(data.discountPercent || 0).toFixed(1)}%`],
        ['Total Amount', formatCurrency(data.totalAmount || 0)],
        ['Payment Method', (data.paymentMethod || '—').toString().replace(/_/g, ' ')],
        ['Payment Status', data.paymentStatus || '—'],
      ],
      styles: { fontSize: 9.5, cellPadding: 2.5 },
      headStyles: { fillColor: [0, 102, 204], textColor: 255 },
      columnStyles: { 0: { fontStyle: 'bold', cellWidth: colWidth * 0.42 } },
      tableWidth: colWidth,
      margin: { left: pageMargin, right: pageMargin + colWidth + gap },
    })
    const pricingFinalY = doc.lastAutoTable.finalY

    // Publishing Dates sits beside Pricing & Payment rather than below it -
    // a single column, two-row table (header + one comma-separated cell)
    // instead of one row per date, so a long run of dates doesn't push the
    // page length out.
    const pubDates = data.publishingDates || []
    let pubDatesFinalY = pricingFinalY
    if (pubDates.length) {
      autoTable(doc, {
        startY: y,
        theme: 'grid',
        head: [['Publishing Dates']],
        body: [[formatPublishingDatesCompact(pubDates)]],
        styles: { fontSize: 9, cellPadding: 2.5, overflow: 'linebreak' },
        headStyles: { fillColor: [0, 51, 102], textColor: 255 },
        tableWidth: colWidth,
        margin: { left: pageMargin + colWidth + gap, right: pageMargin },
      })
      pubDatesFinalY = doc.lastAutoTable.finalY
    }

    y = Math.max(pricingFinalY, pubDatesFinalY) + 6

    // Special Instructions can now include structured layout details (size,
    // column count, photo/logo count, word count) alongside any assembled
    // classified ad copy, so this section runs longer than before - added
    // page-break handling so long content doesn't overlap the footer or
    // spill off the page.
    if (data.specialInstructions) {
      if (y > 250) {
        doc.addPage()
        y = 20
      }
      doc.setFontSize(10)
      doc.setFont('helvetica', 'bold')
      doc.text('Special Instructions:', 10, y)
      doc.setFont('helvetica', 'normal')
      doc.setFontSize(9.5)
      const lines = doc.splitTextToSize(data.specialInstructions, pageWidth - 20)
      let lineY = y + 6
      lines.forEach((line) => {
        if (lineY > 280) {
          doc.addPage()
          lineY = 20
        }
        doc.text(line, 10, lineY)
        lineY += 5
      })
      y = lineY
    }

    doc.setFontSize(8)
    doc.setTextColor(120, 120, 120)
    doc.text(`Generated ${new Date().toLocaleString('en-UG')} · VGAMS`, 10, 290)

    return doc
  }

  // Builds and saves the PDF as a file download.
  const downloadAdvertPdf = async (data) => {
    const doc = await buildAdvertPdf(data)
    doc.save(data.filename || `advert-${data.systemReference || 'draft'}.pdf`)
  }

  // Builds the PDF, opens it in a new tab, and triggers the browser print
  // dialog. Throws an Error with message 'POPUP_BLOCKED' if the browser
  // blocked the new tab, so callers can show an appropriate message.
  const printAdvertPdf = async (data) => {
    const doc = await buildAdvertPdf(data)
    doc.autoPrint()
    const blobUrl = doc.output('bloburl')
    const printWindow = window.open(blobUrl, '_blank')
    if (!printWindow) {
      throw new Error('POPUP_BLOCKED')
    }
  }

  return { buildAdvertPdf, downloadAdvertPdf, printAdvertPdf }
}