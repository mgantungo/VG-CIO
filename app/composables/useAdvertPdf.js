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
//   advertTitle, product, adSize, officeLocation,
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

const formatDate = (dateValue) => {
  if (!dateValue) return ''
  try {
    return new Date(dateValue).toLocaleDateString('en-UG', { month: 'short', day: 'numeric', year: 'numeric' })
  } catch {
    return String(dateValue)
  }
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
    // addition to its row in the Advert & Booking table below.
    if (data.product) {
      doc.setFontSize(13)
      doc.setFont('helvetica', 'bold')
      doc.setTextColor(0, 51, 102)
      doc.text(`Product: ${data.product}`, 10, y)
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
      ['Ad Size', data.adSize || '—'],
      ['Office Location', data.officeLocation || '—'],
      ['Status', data.statusLabel || '—'],
    ]
    const productRowIndex = advertBookingRows.findIndex((row) => row[0] === 'Product')

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
      // Product is key information for downstream teams - bolded here in
      // addition to the larger standalone line shown above.
      didParseCell: (cellData) => {
        if (cellData.row.index === productRowIndex) {
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
      styles: { fontSize: 10, cellPadding: 2.5 },
      headStyles: { fillColor: [0, 102, 204], textColor: 255 },
      columnStyles: { 0: { fontStyle: 'bold', cellWidth: 45 } },
    })
    y = doc.lastAutoTable.finalY + 6

    const pubDates = data.publishingDates || []
    if (pubDates.length) {
      autoTable(doc, {
        startY: y,
        theme: 'grid',
        head: [['#', 'Publishing Date']],
        body: pubDates.map((d, i) => [i + 1, formatDate(d)]),
        styles: { fontSize: 10, cellPadding: 2.5 },
        headStyles: { fillColor: [0, 51, 102], textColor: 255 },
        tableWidth: 80,
      })
      y = doc.lastAutoTable.finalY + 6
    }

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