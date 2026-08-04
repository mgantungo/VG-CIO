// composables/usePagerExport.js
import { useRuntimeConfig } from '#imports'

// ── Pure pagination helpers — no Vue state, easy to test/reason about ──────

/**
 * Standard saddle-stitch imposition: page N pairs with page (total+1-N).
 * Isolated here on purpose — the one place to change if your actual print
 * imposition scheme turns out to differ from this default assumption.
 */
export function buildSpreadOrder(totalPages) {
  const pairs = []
  for (let i = 1; i <= Math.ceil(totalPages / 2); i++) {
    pairs.push([i, totalPages + 1 - i])
  }
  return pairs
}

/**
 * getLayout returns { publication, left, right } split across two reader
 * columns. Combine + sort by page_number to get the canonical full page
 * list, independent of exactly how the backend split them — the export
 * composable computes its own spread order (above) rather than trusting
 * left/right's split for that purpose.
 */
export function flattenPages(layoutData) {
  const all = [...(layoutData.left || []), ...(layoutData.right || [])]
  all.sort((a, b) => a.page_number - b.page_number)
  return all
}

/**
 * The single flat page order for a given view mode — used by the live box
 * grid, the PDF export's grid pages, and anywhere else that needs to agree
 * on ordering. 'sequential' is just 1..N. 'pairs' interleaves each spread
 * pair (page N, then its saddle-stitch partner) so a continuous 11-column
 * grid reads as consecutive spreads, not two separate halves.
 */
export function buildOrderedPages(layoutData, mode = 'pairs') {
  const flat = flattenPages(layoutData)
  if (mode === 'sequential') return flat

  const total = layoutData.publication.total_pages
  return buildSpreadOrder(total)
    .flatMap(([l, r]) => [
      flat.find(p => p.page_number === l),
      flat.find(p => p.page_number === r),
    ])
    .filter(Boolean)
}

/**
 * Classify one page for display. Clusters adverts by slotKey (stamped by
 * the backend's buildSlotMap) so a page with one or several ad slots always
 * shows the SLOT(s) — never a per-advert breakdown, and never silently
 * collapses multiple slots on one page into just one.
 */
export function classifyPage(page) {
  if (!page) return { kind: 'empty' }
  if (page.is_cover)      return { kind: 'cover', label: 'COVER' }
  if (page.is_back_cover) return { kind: 'cover', label: 'BACK COVER' }

  const bySlot = new Map()
  for (const a of (page.adverts || [])) {
    if (!a.slotKey) continue
    if (!bySlot.has(a.slotKey)) bySlot.set(a.slotKey, { label: a.slotLabel, file: a.slotFile, advertIds: [] })
    bySlot.get(a.slotKey).advertIds.push(a.id)
  }

  if (bySlot.size > 0) {
    return {
      kind: 'adslot',
      slots: [...bySlot.values()].map(s => ({
        label: s.label || s.file?.name || 'Ad slot',
        fileName: s.file?.name || null,
        count: s.advertIds.length,
        advertIds: s.advertIds,
      })),
    }
  }
  if (page.section) return { kind: 'section', label: page.section }
  return { kind: 'empty' }
}

export function usePagerExport() {
  const config = useRuntimeConfig()
  const API = config.public.apiBase

  // Deliberately NOT pager.loadLayout() — that mutates activePublication.value
  // as a side effect, which would silently swap whatever the user has open
  // behind an export modal that's looping over several publications.
  async function fetchLayout(publicationId) {
    return $fetch(`${API}/pager-publications/${publicationId}/layout`)
  }

  /**
   * Exports one combined PDF covering every publicationId given — one PDF
   * regardless of how many publications are included, per "if I select all,
   * I should get one pdf file with all."
   * modes: which views to include per publication — { sequential, pairs, detail }, all true by default.
   */
  async function exportPagerMap(publicationIds, modes = {}) {
    const { sequential = true, pairs = true, detail = true } = modes
    if (!Array.isArray(publicationIds) || publicationIds.length === 0) {
      throw new Error('Select at least one publication to export')
    }

    const { default: jsPDF } = await import('jspdf')
    const autoTable = (await import('jspdf-autotable')).default

    const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' })
    let firstSection = true
    const codes = []

    for (const pubId of publicationIds) {
      const layoutData = await fetchLayout(pubId)
      const pub = layoutData.publication
      codes.push(pub.publication_code)
      const flatPages = flattenPages(layoutData)
      const spreadOrder = buildSpreadOrder(pub.total_pages)

      if (sequential) {
        if (!firstSection) doc.addPage()
        firstSection = false
        drawGridPage(doc, pub, flatPages, 'Sequential')
      }

      if (pairs) {
        if (!firstSection) doc.addPage()
        firstSection = false
        const orderedPages = spreadOrder
          .flatMap(([l, r]) => [
            flatPages.find(p => p.page_number === l),
            flatPages.find(p => p.page_number === r),
          ])
          .filter(Boolean)
        drawGridPage(doc, pub, orderedPages, 'Page Pairs')
      }

      if (detail) {
        if (!firstSection) doc.addPage()
        firstSection = false
        drawDetailTable(doc, autoTable, pub, flatPages, spreadOrder)
      }
    }

    const filename = codes.length === 1
      ? `${codes[0]}-pager-map.pdf`
      : `pager-map-export-${codes.length}-publications.pdf`
    doc.save(filename)

    return { publicationCodes: codes }
  }

  return { exportPagerMap }
}

// ── PDF drawing helpers (module-private, no Vue state) ──────────────────────

function drawHeader(doc, pub, subtitle) {
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(15)
  doc.setTextColor(0, 51, 102)
  doc.text(`${pub.publication_code}  \u00b7  ${subtitle}`, 12, 14)

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(9)
  doc.setTextColor(90, 90, 90)
  const dateStr = pub.publication_date
    ? new Date(pub.publication_date).toLocaleDateString('en-UG', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
    : ''
  doc.text(`${pub.masthead} \u00b7 ${pub.total_pages} pages \u00b7 ${dateStr}`, 12, 19)
}

function drawGridPage(doc, pub, orderedPages, subtitle) {
  drawHeader(doc, pub, `Pager Map \u2014 ${subtitle}`)

  const pageWidth = doc.internal.pageSize.getWidth()
  const margin = 12
  const cols = 11
  const gap = 1.5
  const cellW = (pageWidth - margin * 2 - gap * (cols - 1)) / cols
  const cellH = cellW * 1.3
  const startY = 26

  orderedPages.forEach((page, i) => {
    const col = i % cols
    const row = Math.floor(i / cols)
    const x = margin + col * (cellW + gap)
    const y = startY + row * (cellH + gap)

    const info = classifyPage(page)
    const isMulti = info.kind === 'adslot' && info.slots.length > 1

    if (info.kind === 'cover') {
      doc.setFillColor(0, 51, 102)
      doc.setDrawColor(0, 51, 102)
      doc.setLineWidth(0.3)
    } else if (info.kind === 'adslot') {
      doc.setFillColor(234, 241, 251)
      if (isMulti) { doc.setDrawColor(255, 204, 0); doc.setLineWidth(0.5) }
      else { doc.setDrawColor(0, 102, 204); doc.setLineWidth(0.25) }
    } else {
      doc.setFillColor(250, 250, 250)
      doc.setDrawColor(180, 180, 180)
      doc.setLineWidth(0.15)
    }
    doc.rect(x, y, cellW, cellH, 'FD')

    // Page number
    doc.setFont('courier', 'bold')
    doc.setFontSize(7)
    if (info.kind === 'cover') doc.setTextColor(255, 255, 255)
    else doc.setTextColor(0, 51, 102)
    doc.text(String(page.page_number), x + 1.2, y + 3.2)

    // Content
    doc.setFontSize(4.6)
    let textY = y + 6.2
    const maxTextY = y + cellH - 1

    if (info.kind === 'cover') {
      doc.setFont('helvetica', 'normal')
      doc.setTextColor(255, 255, 255)
      doc.text(doc.splitTextToSize(info.label, cellW - 2.4), x + 1.2, textY)
    } else if (info.kind === 'section') {
      doc.setFont('helvetica', 'normal')
      doc.setTextColor(70, 70, 70)
      doc.text(doc.splitTextToSize(info.label, cellW - 2.4), x + 1.2, textY)
    } else if (info.kind === 'adslot') {
      doc.setFont('helvetica', 'bold')
      doc.setTextColor(11, 60, 122)
      for (const slot of info.slots) {
        const lines = doc.splitTextToSize(slot.label, cellW - 2.4)
        if (textY > maxTextY) break // out of room in this box — the detail table has the full list
        doc.text(lines, x + 1.2, textY)
        textY += lines.length * 1.9 + 0.7
      }
    }
  })
}

function drawDetailTable(doc, autoTable, pub, flatPages, spreadOrder) {
  drawHeader(doc, pub, 'Page-by-Page Detail')

  const pageWidth = doc.internal.pageSize.getWidth()

  const sectionCell = (info) => (info.kind === 'cover' || info.kind === 'section') ? info.label : '\u2014'
  const slotCell = (info) => {
    if (info.kind === 'cover') return info.label
    if (info.kind !== 'adslot') return '\u2014'
    return info.slots.map(s => `${s.label}${s.fileName ? ` (${s.fileName})` : ''}`).join('\n')
  }

  const rows = spreadOrder.map(([l, r]) => {
    const lp = flatPages.find(p => p.page_number === l)
    const rp = flatPages.find(p => p.page_number === r)
    const li = classifyPage(lp)
    const ri = classifyPage(rp)
    return [
      lp ? String(lp.page_number) : '', sectionCell(li), slotCell(li),
      rp ? String(rp.page_number) : '', sectionCell(ri), slotCell(ri),
    ]
  })

  autoTable(doc, {
    startY: 26,
    head: [['#', 'Section', 'Ad Slot / File', '#', 'Section', 'Ad Slot / File']],
    body: rows,
    styles: { font: 'helvetica', fontSize: 7.5, cellPadding: 1.8, valign: 'top' },
    headStyles: { fillColor: [0, 51, 102], textColor: 255, fontStyle: 'bold' },
    columnStyles: {
      0: { cellWidth: 7, halign: 'center', fontStyle: 'bold' },
      1: { cellWidth: 26 },
      2: { cellWidth: 'auto' },
      3: { cellWidth: 7, halign: 'center', fontStyle: 'bold' },
      4: { cellWidth: 26 },
      5: { cellWidth: 'auto' },
    },
    alternateRowStyles: { fillColor: [240, 244, 248] },
    margin: { left: 12, right: 12 },
    tableWidth: pageWidth - 24,
  })
}