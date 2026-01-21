<template>
  <div class="revenue-chart">
    <div class="chart-header">
      <h3>Revenue Overview</h3>
      <div class="chart-controls">
        <select v-model="selectedPeriod" @change="updateChart">
          <option value="monthly">This Month</option>
          <option value="quarterly">This Quarter</option>
          <option value="yearly">This Year</option>
          <option value="custom">Custom Range</option>
        </select>
        
        <div v-if="selectedPeriod === 'custom'" class="date-range">
          <input v-model="startDate" type="date" @change="updateChart">
          <span>to</span>
          <input v-model="endDate" type="date" @change="updateChart">
        </div>
      </div>
    </div>

    <div class="chart-container">
      <canvas ref="chartCanvas"></canvas>
    </div>

    <div class="chart-summary">
      <div class="summary-item">
        <div class="summary-label">Total Revenue</div>
        <div class="summary-value">{{ formatCurrency(totalRevenue) }}</div>
        <div class="summary-change" :class="changeClass">
          {{ formatPercentage(revenueChange) }}
        </div>
      </div>
      
      <div class="summary-item">
        <div class="summary-label">Avg. per Advert</div>
        <div class="summary-value">{{ formatCurrency(avgPerAdvert) }}</div>
        <div class="summary-change" :class="avgChangeClass">
          {{ formatPercentage(avgChange) }}
        </div>
      </div>
      
      <div class="summary-item">
        <div class="summary-label">Platforms</div>
        <div class="summary-value">{{ platforms.length }}</div>
        <div class="summary-change">
          {{ formatPercentage(platformGrowth) }}
        </div>
      </div>
    </div>

    <div class="platform-breakdown">
      <h4>Revenue by Platform</h4>
      <div class="platform-list">
        <div v-for="platform in platforms" :key="platform.name" class="platform-item">
          <div class="platform-info">
            <div class="platform-name">{{ platform.name }}</div>
            <div class="platform-stats">
              <span class="platform-revenue">{{ formatCurrency(platform.revenue) }}</span>
              <span class="platform-percentage">({{ platform.percentage }}%)</span>
            </div>
          </div>
          <div class="platform-bar">
            <div 
              class="bar-fill" 
              :style="{ width: `${platform.percentage}%`, backgroundColor: platform.color }"
            ></div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, computed, watch } from 'vue'
import { formatCurrency, formatPercentage } from '~/utils/formatters'
import { Chart, registerables } from 'chart.js'

// Register Chart.js components
Chart.register(...registerables)

const props = defineProps({
  data: {
    type: Object,
    default: () => ({})
  }
})

const chartCanvas = ref(null)
let chartInstance = null

const selectedPeriod = ref('monthly')
const startDate = ref('')
const endDate = ref('')

// Mock data for demonstration
const chartData = ref({
  labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
  datasets: [
    {
      label: 'New Vision',
      data: [18500000, 17500000, 19500000, 20500000, 21500000, 22500000],
      backgroundColor: 'rgba(0, 102, 204, 0.8)',
      borderColor: '#0066CC',
      borderWidth: 2,
      tension: 0.4
    },
    {
      label: 'Bukedde',
      data: [12300000, 11500000, 12500000, 13000000, 13500000, 14000000],
      backgroundColor: 'rgba(227, 30, 36, 0.8)',
      borderColor: '#E31E24',
      borderWidth: 2,
      tension: 0.4
    },
    {
      label: 'UBC TV',
      data: [8700000, 8500000, 9000000, 9200000, 9500000, 9800000],
      backgroundColor: 'rgba(255, 182, 18, 0.8)',
      borderColor: '#FFB612',
      borderWidth: 2,
      tension: 0.4
    }
  ]
})

const totalRevenue = computed(() => {
  return chartData.value.datasets.reduce((total, dataset) => {
    return total + dataset.data.reduce((sum, value) => sum + value, 0)
  }, 0)
})

const revenueChange = computed(() => {
  // Mock calculation
  return 23.5
})

const avgPerAdvert = computed(() => {
  const totalAdverts = 45 // Mock data
  return totalRevenue.value / totalAdverts
})

const avgChange = computed(() => {
  // Mock calculation
  return 15.2
})

const platforms = computed(() => {
  const platformTotals = chartData.value.datasets.map(dataset => ({
    name: dataset.label,
    revenue: dataset.data.reduce((sum, value) => sum + value, 0),
    color: dataset.backgroundColor
  }))
  
  const total = platformTotals.reduce((sum, platform) => sum + platform.revenue, 0)
  
  return platformTotals.map(platform => ({
    ...platform,
    percentage: Math.round((platform.revenue / total) * 100)
  })).sort((a, b) => b.revenue - a.revenue)
})

const platformGrowth = computed(() => {
  // Mock calculation
  return 8.7
})

const changeClass = computed(() => {
  return revenueChange.value >= 0 ? 'positive' : 'negative'
})

const avgChangeClass = computed(() => {
  return avgChange.value >= 0 ? 'positive' : 'negative'
})

onMounted(() => {
  // Set default date range for custom period
  const today = new Date()
  const lastMonth = new Date()
  lastMonth.setMonth(lastMonth.getMonth() - 1)
  
  startDate.value = lastMonth.toISOString().split('T')[0]
  endDate.value = today.toISOString().split('T')[0]
  
  initChart()
  
  // Handle window resize
  window.addEventListener('resize', handleResize)
})

onUnmounted(() => {
  if (chartInstance) {
    chartInstance.destroy()
  }
  window.removeEventListener('resize', handleResize)
})

const initChart = () => {
  if (!chartCanvas.value) return
  
  const ctx = chartCanvas.value.getContext('2d')
  
  chartInstance = new Chart(ctx, {
    type: 'line',
    data: chartData.value,
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'top',
          labels: {
            padding: 20,
            usePointStyle: true,
            pointStyle: 'circle'
          }
        },
        tooltip: {
          mode: 'index',
          intersect: false,
          callbacks: {
            label: (context) => {
              return `${context.dataset.label}: ${formatCurrency(context.raw)}`
            }
          }
        }
      },
      scales: {
        x: {
          grid: {
            display: false
          },
          ticks: {
            font: {
              size: 12
            }
          }
        },
        y: {
          beginAtZero: true,
          ticks: {
            callback: (value) => {
              if (value >= 1000000) {
                return `UGX ${(value / 1000000).toFixed(0)}M`
              }
              if (value >= 1000) {
                return `UGX ${(value / 1000).toFixed(0)}K`
              }
              return `UGX ${value}`
            },
            font: {
              size: 11
            }
          },
          grid: {
            color: 'rgba(0,0,0,0.05)'
          }
        }
      },
      interaction: {
        mode: 'nearest',
        axis: 'x',
        intersect: false
      },
      elements: {
        point: {
          radius: 4,
          hoverRadius: 6
        }
      },
      animations: {
        tension: {
          duration: 1000,
          easing: 'linear'
        }
      }
    }
  })
}

const updateChart = () => {
  if (!chartInstance) return
  
  // In production, this would fetch new data based on selected period
  // For now, we'll just update with mock data
  
  let newData = { ...chartData.value }
  
  switch (selectedPeriod.value) {
    case 'quarterly':
      newData.labels = ['Q1', 'Q2', 'Q3', 'Q4']
      newData.datasets.forEach(dataset => {
        dataset.data = [45000000, 48000000, 52000000, 55000000]
      })
      break
      
    case 'yearly':
      newData.labels = ['2020', '2021', '2022', '2023', '2024']
      newData.datasets.forEach(dataset => {
        dataset.data = [150000000, 180000000, 210000000, 240000000, 270000000]
      })
      break
      
    default:
      // Monthly data (default)
      newData.labels = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun']
      newData.datasets = [
        {
          label: 'New Vision',
          data: [18500000, 17500000, 19500000, 20500000, 21500000, 22500000],
          backgroundColor: 'rgba(0, 102, 204, 0.8)',
          borderColor: '#0066CC',
          borderWidth: 2,
          tension: 0.4
        },
        {
          label: 'Bukedde',
          data: [12300000, 11500000, 12500000, 13000000, 13500000, 14000000],
          backgroundColor: 'rgba(227, 30, 36, 0.8)',
          borderColor: '#E31E24',
          borderWidth: 2,
          tension: 0.4
        },
        {
          label: 'UBC TV',
          data: [8700000, 8500000, 9000000, 9200000, 9500000, 9800000],
          backgroundColor: 'rgba(255, 182, 18, 0.8)',
          borderColor: '#FFB612',
          borderWidth: 2,
          tension: 0.4
        }
      ]
  }
  
  chartInstance.data = newData
  chartInstance.update()
}

const handleResize = () => {
  if (chartInstance) {
    chartInstance.resize()
  }
}

// Watch for changes in data prop
watch(() => props.data, (newData) => {
  if (newData && chartInstance) {
    chartInstance.data = newData
    chartInstance.update()
  }
}, { deep: true })
</script>

<style scoped>
.revenue-chart {
  background: white;
  border-radius: 10px;
  padding: 25px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.chart-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 25px;
  flex-wrap: wrap;
  gap: 15px;
}

.chart-header h3 {
  color: #003366;
  margin: 0;
  font-size: 1.3em;
}

.chart-controls {
  display: flex;
  align-items: center;
  gap: 15px;
  flex-wrap: wrap;
}

.chart-controls select {
  padding: 8px 16px;
  border: 1px solid #DDDDDD;
  border-radius: 5px;
  background: white;
  font-size: 0.95em;
  color: #333;
  cursor: pointer;
  min-width: 150px;
}

.chart-controls select:focus {
  outline: none;
  border-color: #0066CC;
  box-shadow: 0 0 0 3px rgba(0, 102, 204, 0.1);
}

.date-range {
  display: flex;
  align-items: center;
  gap: 10px;
}

.date-range input {
  padding: 8px 12px;
  border: 1px solid #DDDDDD;
  border-radius: 5px;
  font-size: 0.95em;
}

.date-range input:focus {
  outline: none;
  border-color: #0066CC;
}

.date-range span {
  color: #666;
  font-size: 0.9em;
}

.chart-container {
  height: 300px;
  margin-bottom: 30px;
  position: relative;
}

.chart-summary {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 20px;
  margin-bottom: 30px;
  padding-top: 25px;
  border-top: 2px solid #F5F5F5;
}

.summary-item {
  text-align: center;
  padding: 20px;
  background: #F9F9F9;
  border-radius: 8px;
  transition: transform 0.3s;
}

.summary-item:hover {
  transform: translateY(-2px);
  background: white;
  box-shadow: 0 4px 12px rgba(0,0,0,0.1);
}

.summary-label {
  color: #666;
  font-size: 0.9em;
  margin-bottom: 8px;
  font-weight: 500;
}

.summary-value {
  color: #003366;
  font-size: 1.5em;
  font-weight: 700;
  margin-bottom: 5px;
}

.summary-change {
  font-size: 0.85em;
  font-weight: 600;
}

.summary-change.positive {
  color: #28a745;
}

.summary-change.negative {
  color: #dc3545;
}

.platform-breakdown {
  padding-top: 25px;
  border-top: 2px solid #F5F5F5;
}

.platform-breakdown h4 {
  color: #003366;
  margin-bottom: 20px;
  font-size: 1.1em;
}

.platform-list {
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.platform-item {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.platform-info {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.platform-name {
  color: #333;
  font-weight: 500;
  font-size: 0.95em;
}

.platform-stats {
  text-align: right;
}

.platform-revenue {
  color: #003366;
  font-weight: 600;
  font-size: 0.95em;
}

.platform-percentage {
  color: #666;
  font-size: 0.85em;
  margin-left: 5px;
}

.platform-bar {
  height: 8px;
  background: #F5F5F5;
  border-radius: 4px;
  overflow: hidden;
}

.bar-fill {
  height: 100%;
  transition: width 1s ease;
  border-radius: 4px;
}

@media (max-width: 768px) {
  .chart-header {
    flex-direction: column;
    align-items: stretch;
  }
  
  .chart-controls {
    flex-direction: column;
    align-items: stretch;
  }
  
  .date-range {
    flex-direction: column;
    gap: 8px;
  }
  
  .chart-summary {
    grid-template-columns: 1fr;
  }
}
</style>