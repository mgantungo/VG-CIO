// composables/usePrintClassReport.js
//
// Display vs Classified report for print adverts.
import { ref } from 'vue'
import { useRuntimeConfig } from '#imports'
import { apiErrorMessage, PRINT_CLASS_LABELS, PAYMENT_METHOD_LABELS } from '~/utils/vgamsSession'

export function usePrintClassReport() {
  const config = useRuntimeConfig()
  const API = config.public.apiBase

  const loading = ref(false)
  const error = ref(null)

  async function post(path, body) {
    loading.value = true
    error.value = null
    try {
      return await $fetch(`${API}${path}`, { method: 'POST', body })
    } catch (e) {
      error.value = apiErrorMessage(e, 'Report request failed')
      throw e
    } finally {
      loading.value = false
    }
  }

  /** filters: { startDate, endDate, basis: 'booked'|'run', productId?, paymentMethod? } */
  const fetchSummary = (filters) => post('/reports/print-class/summary', filters)

  /** filters + printAdClass?: 'display'|'classified'|'unclassified' */
  const fetchList = (filters) => post('/reports/print-class/list', filters)

  /** Three sheets: Summary, By product + by method, Adverts. */
  async function exportXlsx(summary, rows, filters) {
    // Loaded on demand, same as QueueSheetModal / PaidAdvertsModal
    const XLSX = await import('xlsx')
    const wb = XLSX.utils.book_new()
    const label = c => PRINT_CLASS_LABELS[c] || c
    const classes = ['display', 'classified', 'unclassified']

    const summarySheet = [
      ['Display vs Classified — print adverts'],
      ['From', filters.startDate, 'To', filters.endDate, 'Counted by', filters.basis === 'run' ? 'Run date' : 'Booked date'],
      [],
      ['Class', 'Bookings', 'Runs', 'Amount (UGX)', 'Share %', 'Column-cm', 'Words'],
      ...classes.map(c => {
        const b = summary.classes?.[c] || {}
        return [label(c), b.bookings || 0, b.runs || 0, b.amount || 0, b.sharePct || 0, b.columnCm || 0, b.words || 0]
      }),
      ['Total', summary.totals?.bookings || 0, '', summary.totals?.amount || 0],
    ]
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(summarySheet), 'Summary')

    const breakdown = (title, list, keyLabel, keyOf) => [
      [title],
      [keyLabel, ...classes.flatMap(c => [`${label(c)} bookings`, `${label(c)} UGX`]), 'Total UGX'],
      ...(list || []).map(r => [keyOf(r), ...classes.flatMap(c => [r[c]?.bookings || 0, r[c]?.amount || 0]), r.total || 0]),
      [],
    ]
    const byProductAndMethod = [
      ...breakdown('By product', summary.byProduct, 'Product', r => r.productName),
      ...breakdown('By payment method', summary.byPaymentMethod, 'Payment method', r => PAYMENT_METHOD_LABELS[r.paymentMethod] || r.paymentMethod),
    ]
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(byProductAndMethod), 'Breakdown')

    const advertSheet = [
      ['Reference', 'BC order', 'Client', 'Advert', 'Product', 'Class', 'Payment method', 'Size', 'Words', 'Run dates', 'Runs in range', 'Booking total (UGX)', 'Counted amount (UGX)', 'Paid', 'Booked by', 'Booked on'],
      ...(rows || []).map(r => [
        r.reference, r.bcReference, r.clientName, r.advertTitle, r.productName, label(r.printAdClass),
        PAYMENT_METHOD_LABELS[r.paymentMethod] || r.paymentMethod, r.adSize, r.words ?? '',
        (r.publishingDates || []).join(', '), r.runsInRange, r.totalAmount, r.amount,
        r.isPaid ? 'Yes' : 'No', r.bookedBy, String(r.createdAt || '').slice(0, 10),
      ]),
    ]
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(advertSheet), 'Adverts')

    XLSX.writeFile(wb, `display-vs-classified_${filters.startDate}_${filters.endDate}.xlsx`)
  }

  return { loading, error, fetchSummary, fetchList, exportXlsx }
}
