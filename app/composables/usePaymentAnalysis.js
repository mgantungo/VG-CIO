// composables/usePaymentAnalysis.js
//
// Pure data logic behind the "Payment Analysis" panel (bar chart of paid vs
// unpaid value over time + a pie chart of the overall split). Kept separate
// from PaymentAnalysisPanel.vue so the bucketing/granularity rules and the
// pie-wedge geometry can be reasoned about (and unit-tested) without a DOM.
//
// Granularity is driven by the *selected* date range, not by where the data
// happens to fall within it:
//   - range <= 30 days                 -> daily buckets
//   - range >  30 days, <= 3 months    -> monthly buckets
//   - range spans more than 3 months   -> quarterly buckets
//
// Usage: usePaymentAnalysis(adverts, startDate, endDate) where all three
// arguments are Vue refs - adverts: Ref<Array<{ createdAt, isPaid, totalAmount }>>,
// startDate/endDate: Ref<string> in 'YYYY-MM-DD' form (or any Date-parseable string).

import { computed } from 'vue'

const DAY_MS = 86400000
const MONTHLY_THRESHOLD_DAYS = 30
const QUARTERLY_THRESHOLD_MONTHS = 3

// Quarter buckets follow the financial year, not the calendar year. Uganda's
// government/parastatal financial year runs July - June, so FQ1 = Jul-Sep,
// FQ2 = Oct-Dec, FQ3 = Jan-Mar, FQ4 = Apr-Jun - change this one constant
// (0 = January ... 11 = December) if Vision Group's FY starts elsewhere.
const FISCAL_YEAR_START_MONTH = 6 // July

const monthsBetweenInclusive = (start, end) =>
  (end.getFullYear() - start.getFullYear()) * 12 + (end.getMonth() - start.getMonth()) + 1

// A financial year is named by the calendar year it ends in (Uganda
// convention: the year starting Jul 2026 is "FY27", ending Jun 2027).
const fiscalQuarterInfo = (date) => {
  const monthsIntoFY = (date.getMonth() - FISCAL_YEAR_START_MONTH + 12) % 12
  const quarter = Math.floor(monthsIntoFY / 3) + 1
  const fiscalYearEnd = date.getMonth() >= FISCAL_YEAR_START_MONTH ? date.getFullYear() + 1 : date.getFullYear()
  return { quarter, fiscalYearEnd }
}

const bucketKeyFor = (date, granularity) => {
  if (granularity === 'day') return date.toISOString().split('T')[0]
  if (granularity === 'month') return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
  const { quarter, fiscalYearEnd } = fiscalQuarterInfo(date)
  return `FY${fiscalYearEnd}-Q${quarter}`
}

const formatBucketLabel = (date, granularity) => {
  if (granularity === 'day') return date.toLocaleDateString('en-UG', { month: 'short', day: 'numeric' })
  if (granularity === 'month') return date.toLocaleDateString('en-UG', { month: 'short', year: '2-digit' })
  const { quarter, fiscalYearEnd } = fiscalQuarterInfo(date)
  return `Q${quarter} FY${String(fiscalYearEnd).slice(-2)}`
}

// Wedge geometry for a simple two-slice pie chart (paid / unpaid), drawn as
// SVG path "d" attributes on a 100x100 viewBox centered at (50,50).
const toRad = (deg) => ((deg - 90) * Math.PI) / 180
const arcPoint = (cx, cy, r, angleDeg) => {
  const rad = toRad(angleDeg)
  return [cx + r * Math.cos(rad), cy + r * Math.sin(rad)]
}
const wedgePath = (cx, cy, r, startAngle, endAngle) => {
  const [x1, y1] = arcPoint(cx, cy, r, startAngle)
  const [x2, y2] = arcPoint(cx, cy, r, endAngle)
  const largeArc = endAngle - startAngle > 180 ? 1 : 0
  return `M ${cx} ${cy} L ${x1} ${y1} A ${r} ${r} 0 ${largeArc} 1 ${x2} ${y2} Z`
}
// A full circle can't be expressed as one wedge (the arc's start and end
// points would coincide), so 0%/100% splits are drawn as a near-complete
// circle instead - visually identical, but valid SVG.
const fullCirclePath = (cx, cy, r) => `M ${cx} ${cy - r} A ${r} ${r} 0 1 1 ${cx - 0.01} ${cy - r} Z`

export const usePaymentAnalysis = (adverts, startDate, endDate) => {
  const granularity = computed(() => {
    const start = startDate.value ? new Date(startDate.value) : null
    const end = endDate.value ? new Date(endDate.value) : null
    if (!start || !end || isNaN(start.getTime()) || isNaN(end.getTime())) return 'day'

    const spanDays = Math.max(1, Math.round((end - start) / DAY_MS) + 1)
    if (spanDays <= MONTHLY_THRESHOLD_DAYS) return 'day'

    const spanMonths = monthsBetweenInclusive(start, end)
    return spanMonths > QUARTERLY_THRESHOLD_MONTHS ? 'quarter' : 'month'
  })

  const buckets = computed(() => {
    const g = granularity.value
    const map = new Map()

    ;(adverts.value || []).forEach((a) => {
      const d = new Date(a.createdAt)
      if (isNaN(d.getTime())) return
      const key = bucketKeyFor(d, g)
      if (!map.has(key)) {
        map.set(key, { key, date: d, paidValue: 0, unpaidValue: 0, paidCount: 0, unpaidCount: 0 })
      }
      const bucket = map.get(key)
      const amount = Number(a.totalAmount) || 0
      if (a.isPaid) {
        bucket.paidValue += amount
        bucket.paidCount++
      } else {
        bucket.unpaidValue += amount
        bucket.unpaidCount++
      }
    })

    const arr = Array.from(map.values()).sort((a, b) => a.key.localeCompare(b.key))
    const maxValue = Math.max(1, ...arr.map((b) => Math.max(b.paidValue, b.unpaidValue)))

    return arr.map((b) => ({
      ...b,
      total: b.paidValue + b.unpaidValue,
      count: b.paidCount + b.unpaidCount,
      label: formatBucketLabel(b.date, g),
      paidHeightPct: Math.round((b.paidValue / maxValue) * 100),
      unpaidHeightPct: Math.round((b.unpaidValue / maxValue) * 100),
    }))
  })

  const paidVsUnpaid = computed(() => {
    let paidValue = 0
    let unpaidValue = 0
    let paidCount = 0
    let unpaidCount = 0

    ;(adverts.value || []).forEach((a) => {
      const amount = Number(a.totalAmount) || 0
      if (a.isPaid) {
        paidValue += amount
        paidCount++
      } else {
        unpaidValue += amount
        unpaidCount++
      }
    })

    const total = paidValue + unpaidValue || 1
    return {
      paidValue,
      unpaidValue,
      paidCount,
      unpaidCount,
      paidPct: Math.round((paidValue / total) * 100),
      unpaidPct: Math.round((unpaidValue / total) * 100),
    }
  })

  const pieChart = computed(() => {
    const { paidPct, unpaidPct, paidValue, unpaidValue } = paidVsUnpaid.value
    const cx = 50
    const cy = 50
    const r = 45

    if (paidValue + unpaidValue <= 0) {
      return { paidPath: '', unpaidPath: '', paidPct: 0, unpaidPct: 0, paidValue, unpaidValue }
    }
    if (unpaidValue <= 0) {
      return { paidPath: fullCirclePath(cx, cy, r), unpaidPath: '', paidPct: 100, unpaidPct: 0, paidValue, unpaidValue }
    }
    if (paidValue <= 0) {
      return { paidPath: '', unpaidPath: fullCirclePath(cx, cy, r), paidPct: 0, unpaidPct: 100, paidValue, unpaidValue }
    }

    const paidAngle = (paidPct / 100) * 360
    return {
      paidPath: wedgePath(cx, cy, r, 0, paidAngle),
      unpaidPath: wedgePath(cx, cy, r, paidAngle, 360),
      paidPct,
      unpaidPct,
      paidValue,
      unpaidValue,
    }
  })

  return { granularity, buckets, paidVsUnpaid, pieChart }
}