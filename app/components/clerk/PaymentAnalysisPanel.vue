<!--
  PaymentAnalysisPanel.vue

  Paid vs unpaid value, as a bar chart over time (left) and a pie chart of
  the overall split (right). Self-contained: owns its own icons, "panel
  chrome" styling, and currency formatting, so Indexpage.vue only needs to
  pass it data - all the bucketing/granularity and pie-geometry logic lives
  in the usePaymentAnalysis composable.

  Props:
    adverts   - Array of advert records ({ createdAt, isPaid, totalAmount })
    startDate - 'YYYY-MM-DD' - the selected range start (drives granularity)
    endDate   - 'YYYY-MM-DD' - the selected range end
-->
<template>
  <section class="pa-row">
    <div class="pa-panel">
      <div class="pa-panel-head">
        <div class="pa-title-group">
          <span class="pa-icon pa-icon--blue"><BarGlyph /></span>
          <span class="pa-title">Payment Analysis</span>
          <span class="pa-hint">by {{ granularityLabel }}</span>
        </div>
        <ul class="pa-legend">
          <li><span class="pa-dot pa-dot--paid"></span> Paid</li>
          <li><span class="pa-dot pa-dot--unpaid"></span> Unpaid</li>
        </ul>
      </div>

      <div class="pa-bar-chart">
        <template v-if="buckets.length">
          <div
            v-for="b in buckets"
            :key="b.key"
            class="pa-bar-col"
            :title="`${b.label}: ${formatCurrency(b.paidValue)} paid, ${formatCurrency(b.unpaidValue)} unpaid`"
          >
            <div class="pa-bar-track">
              <div class="pa-bar pa-bar--unpaid" :style="{ height: b.unpaidHeightPct + '%' }"></div>
              <div class="pa-bar pa-bar--paid" :style="{ height: b.paidHeightPct + '%' }"></div>
            </div>
            <span class="pa-bar-label">{{ b.label }}</span>
          </div>
        </template>
        <div v-else class="pa-empty">No data in the selected range</div>
      </div>
    </div>

    <div class="pa-panel pa-panel--pie">
      <div class="pa-panel-head">
        <div class="pa-title-group">
          <span class="pa-icon pa-icon--amber"><PieGlyph /></span>
          <span class="pa-title">Paid vs Unpaid</span>
        </div>
      </div>

      <div class="pa-pie-body">
        <svg class="pa-pie" viewBox="0 0 100 100">
          <circle v-if="!pieChart.paidPath && !pieChart.unpaidPath" cx="50" cy="50" r="45" class="pa-pie-empty" />
          <path v-if="pieChart.unpaidPath" :d="pieChart.unpaidPath" class="pa-pie-slice pa-pie-slice--unpaid" />
          <path v-if="pieChart.paidPath" :d="pieChart.paidPath" class="pa-pie-slice pa-pie-slice--paid" />
        </svg>
        <ul class="pa-legend pa-legend--pie">
          <li>
            <span class="pa-dot pa-dot--paid"></span>
            <span>Paid</span>
            <strong>{{ pieChart.paidPct }}%</strong>
          </li>
          <li>
            <span class="pa-dot pa-dot--unpaid"></span>
            <span>Unpaid</span>
            <strong>{{ pieChart.unpaidPct }}%</strong>
          </li>
        </ul>
      </div>
    </div>
  </section>
</template>

<script setup>
import { computed, h, toRef } from 'vue'
import { usePaymentAnalysis } from '~/composables/usePaymentAnalysis'

const props = defineProps({
  adverts: {
    type: Array,
    default: () => [],
  },
  startDate: {
    type: String,
    default: '',
  },
  endDate: {
    type: String,
    default: '',
  },
})

const { granularity, buckets, pieChart } = usePaymentAnalysis(
  toRef(props, 'adverts'),
  toRef(props, 'startDate'),
  toRef(props, 'endDate')
)

const GRANULARITY_LABELS = { day: 'day', month: 'month', quarter: 'quarter' }
const granularityLabel = computed(() => GRANULARITY_LABELS[granularity.value] || granularity.value)

const formatCurrency = (amount) =>
  new Intl.NumberFormat('en-UG', { style: 'currency', currency: 'UGX', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(amount || 0)

// Local, dependency-free icons so this component doesn't need to import
// anything from the page that hosts it.
const svgIcon = (children) =>
  h('svg', { viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', 'stroke-width': '2', 'stroke-linecap': 'round', 'stroke-linejoin': 'round' }, children)
const BarGlyph = () => svgIcon([h('path', { d: 'M4 20V10M12 20V4M20 20v-7' })])
const PieGlyph = () => svgIcon([
  h('path', { d: 'M12 2v10l7 5A10 10 0 0012 2z' }),
  h('path', { d: 'M12 12l-7 5A10 10 0 0012 22a10 10 0 007-3l-7-5z' }),
])
</script>

<style scoped>
/*
  Self-contained: falls back to sensible defaults via var(--x, fallback) so
  this still looks right if the host page doesn't define the design tokens
  used across the rest of the dashboard (see Indexpage.vue's .dash block).
*/
.pa-row {
  display: grid;
  grid-template-columns: 2fr 1fr;
  gap: 1rem;
  align-items: start;
}

.pa-panel {
  background: var(--surface, #fff);
  border: 1px solid var(--border, #e5e7eb);
  border-radius: var(--radius, 8px);
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.pa-panel-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.75rem 1rem;
  background: #f8fafc;
  border-bottom: 1px solid var(--border, #e5e7eb);
  flex-wrap: wrap;
  gap: 0.5rem;
}

.pa-title-group { display: flex; align-items: center; gap: 0.5rem; }

.pa-icon {
  width: 28px; height: 28px; border-radius: 6px;
  display: flex; align-items: center; justify-content: center;
  color: #fff; flex-shrink: 0;
}
.pa-icon svg { width: 14px; height: 14px; }
.pa-icon--blue  { background: linear-gradient(135deg, #3b82f6, #1d4ed8); }
.pa-icon--amber { background: linear-gradient(135deg, #f59e0b, #d97706); }

.pa-title { font-size: 0.8125rem; font-weight: 700; color: var(--ink, #111827); }
.pa-hint  { font-size: 0.6875rem; color: var(--faint, #9ca3af); font-weight: 500; }

.pa-legend { list-style: none; display: flex; gap: 0.875rem; margin: 0; padding: 0; }
.pa-legend li { display: flex; align-items: center; gap: 0.375rem; font-size: 0.75rem; color: var(--muted, #6b7280); font-weight: 600; }
.pa-legend--pie { flex-direction: column; align-items: flex-start; gap: 0.625rem; }
.pa-legend--pie li strong { margin-left: auto; color: var(--ink, #111827); font-family: var(--font-mono, monospace); }

.pa-dot { width: 9px; height: 9px; border-radius: 50%; display: inline-block; flex-shrink: 0; }
.pa-dot--paid   { background: var(--blue, #2563eb); }
.pa-dot--unpaid { background: var(--amber, #d97706); }

/* ── Bar chart ── */
.pa-bar-chart {
  display: flex; align-items: flex-end; gap: 0.5rem;
  height: 12rem; overflow-x: auto; padding: 1rem 1rem 0.75rem;
  scrollbar-width: thin; scrollbar-color: var(--border, #e5e7eb) transparent;
}
.pa-bar-chart::-webkit-scrollbar { height: 6px; }
.pa-bar-chart::-webkit-scrollbar-thumb { background: var(--border, #e5e7eb); border-radius: 3px; }
.pa-bar-col {
  display: flex; flex-direction: column; align-items: center; justify-content: flex-end;
  gap: 0.375rem; min-width: 34px; flex: 1 0 auto; height: 100%;
}
.pa-bar-track {
  display: flex; flex-direction: column; justify-content: flex-end; width: 100%;
  height: 9.375rem; background: var(--page-bg, #f0f4f8); border-radius: 3px 3px 0 0; overflow: hidden;
}
.pa-bar { width: 100%; transition: height .4s ease; }
.pa-bar--unpaid { background: var(--amber, #d97706); }
.pa-bar--paid   { background: var(--blue, #2563eb); }
.pa-bar-label { font-size: 0.625rem; color: var(--faint, #9ca3af); white-space: nowrap; font-weight: 600; font-family: var(--font-mono, monospace); }
.pa-empty {
  flex: 1; display: flex; align-items: center; justify-content: center;
  color: var(--faint, #9ca3af); font-size: 0.8125rem; height: 100%;
}

/* ── Pie chart ── */
.pa-panel--pie { min-width: 0; }
.pa-pie-body { display: flex; align-items: center; gap: 1.25rem; padding: 1.25rem 1rem; }
.pa-pie { width: 7.5rem; height: 7.5rem; flex-shrink: 0; }
.pa-pie-slice { stroke: var(--surface, #fff); stroke-width: 1; }
.pa-pie-slice--paid   { fill: var(--blue, #2563eb); }
.pa-pie-slice--unpaid { fill: var(--amber, #d97706); }
.pa-pie-empty { fill: none; stroke: var(--border, #e5e7eb); stroke-width: 2; }

@media (max-width: 900px) {
  .pa-row { grid-template-columns: 1fr; }
}
</style>