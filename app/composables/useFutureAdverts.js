// composables/useFutureAdverts.js
//
// Data behind the future-bookings calendar. Fetches adverts whose run
// window (start_date/end_date) overlaps a future window - via the
// dedicated /adverts-schedule-range endpoint (advert-schedule.js on the
// backend, kept isolated from the existing createdAt-based date-range
// endpoint) - and indexes them by calendar day using each advert's
// publishingDates (the precise days it runs, not just its overall
// start/end window), for the calendar to render day cells straight from.
//
// Deliberately asks for nothing from the clerk up front - no date range to
// fill in - because the premise is they may not know or care when an
// advert was booked, only that it's coming up. One fetch covers a generous
// window (12 months by default); month navigation in the calendar then
// just reads different slices of the same already-fetched data instead of
// making a new request per month.
//
// Requires useAdverts() to expose getScheduleAdverts, calling
// GET /adverts-schedule-range - see the note in the chat reply for the
// small addition needed in useAdverts.js.

import { ref, computed } from 'vue'
import { useAdverts } from '~/composables/useAdverts'

const toLocalISODate = (date) => {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

export const useFutureAdverts = () => {
  const { getScheduleAdverts: getScheduleAdvertsApi } = useAdverts()

  const loading = ref(false)
  const error = ref(null)
  const adverts = ref([])
  const fetchedThroughMonths = ref(0)

  const fetchFutureAdverts = async (monthsAhead = 12) => {
    loading.value = true
    error.value = null
    try {
      const today = new Date()
      const future = new Date(today)
      future.setMonth(future.getMonth() + monthsAhead)

      const response = await getScheduleAdvertsApi({
        startDate: toLocalISODate(today),
        endDate: toLocalISODate(future),
        limit: 2000,
      })

      adverts.value = response?.data || []
      fetchedThroughMonths.value = monthsAhead
    } catch (err) {
      error.value = err?.message || 'Failed to load upcoming adverts'
      adverts.value = []
    } finally {
      loading.value = false
    }
  }

  // 'YYYY-MM-DD' -> array of adverts publishing that day. Falls back to
  // start/end date when an advert has no publishingDates recorded (older
  // records, or ones created before that field existed).
  const advertsByDay = computed(() => {
    const map = new Map()
    adverts.value.forEach((a) => {
      const days = (a.publishingDates && a.publishingDates.length)
        ? a.publishingDates
        : [a.startDate, a.endDate].filter(Boolean)

      const uniqueDays = new Set(days.map((d) => String(d).slice(0, 10)))
      uniqueDays.forEach((key) => {
        if (!map.has(key)) map.set(key, [])
        map.get(key).push(a)
      })
    })
    return map
  })

  // Summary for one calendar day - count, total value, and the adverts
  // themselves for the detail list.
  const daySummary = (dateKey) => {
    const list = advertsByDay.value.get(dateKey) || []
    return {
      count: list.length,
      totalValue: list.reduce((sum, a) => sum + (Number(a.totalAmount) || 0), 0),
      adverts: list,
    }
  }

  return { loading, error, adverts, advertsByDay, daySummary, fetchFutureAdverts, fetchedThroughMonths }
}