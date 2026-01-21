<!--components/common/DataTable.vue-->
<template>
  <div class="data-table-container">
    <div v-if="loading" class="loading-overlay">
      <div class="loading-spinner"></div>
      <div>Loading...</div>
    </div>
    
    <div class="table-wrapper">
      <table class="data-table">
        <thead>
          <tr>
            <th v-for="header in headers" :key="header.key">
              {{ header.label }}
            </th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="items.length === 0">
            <td :colspan="headers.length" class="empty-state">
              No data available
            </td>
          </tr>
          <tr v-for="(item, index) in paginatedItems" :key="index">
            <td v-for="header in headers" :key="header.key">
              <slot 
                :name="`cell(${header.key})`" 
                :item="item" 
                :value="item[header.key]"
              >
                {{ formatValue(item[header.key], header) }}
              </slot>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
    
    <div v-if="showPagination && totalPages > 1" class="pagination">
      <button 
        :disabled="currentPage === 1"
        @click="prevPage"
        class="btn btn-secondary btn-sm"
      >
        Previous
      </button>
      <span class="page-info">
        Page {{ currentPage }} of {{ totalPages }}
      </span>
      <button 
        :disabled="currentPage === totalPages"
        @click="nextPage"
        class="btn btn-secondary btn-sm"
      >
        Next
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'

const props = defineProps({
  headers: {
    type: Array,
    required: true
  },
  items: {
    type: Array,
    default: () => []
  },
  loading: {
    type: Boolean,
    default: false
  },
  pageSize: {
    type: Number,
    default: 10
  },
  showPagination: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['page-change'])

const currentPage = ref(1)

const paginatedItems = computed(() => {
  if (!props.showPagination) return props.items
  
  const start = (currentPage.value - 1) * props.pageSize
  const end = start + props.pageSize
  return props.items.slice(start, end)
})

const totalPages = computed(() => {
  return Math.ceil(props.items.length / props.pageSize)
})

const formatValue = (value, header) => {
  if (value === null || value === undefined) return '-'
  
  if (header.format === 'currency') {
    return new Intl.NumberFormat('en-UG', {
      style: 'currency',
      currency: 'UGX',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value)
  }
  
  if (header.format === 'date') {
    try {
      return new Date(value).toLocaleDateString('en-UG')
    } catch {
      return value
    }
  }
  
  if (header.format === 'datetime') {
    try {
      const date = new Date(value)
      return date.toLocaleDateString('en-UG') + ' ' + date.toLocaleTimeString('en-UG', {
        hour: '2-digit',
        minute: '2-digit'
      })
    } catch {
      return value
    }
  }
  
  return value
}

const prevPage = () => {
  if (currentPage.value > 1) {
    currentPage.value--
    emit('page-change', currentPage.value)
  }
}

const nextPage = () => {
  if (currentPage.value < totalPages.value) {
    currentPage.value++
    emit('page-change', currentPage.value)
  }
}
</script>

<style scoped>
.data-table-container {
  position: relative;
  width: 100%;
  min-height: 200px;
}

.loading-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(255, 255, 255, 0.8);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  z-index: 10;
  border-radius: 8px;
}

.loading-spinner {
  width: 40px;
  height: 40px;
  border: 3px solid #DDDDDD;
  border-top-color: #0066CC;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: 10px;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

/* TABLE WRAPPER FOR HORIZONTAL SCROLLING */
.table-wrapper {
  width: 100%;
  overflow-x: auto;
  border: 1px solid #dee2e6;
  border-radius: 8px;
  margin-bottom: 20px;
  -webkit-overflow-scrolling: touch; /* Smooth scrolling on iOS */
}

/* Ensure table takes full width and doesn't shrink */
.data-table {
  width: 100%;
  min-width: 800px; /* Minimum width to ensure content fits */
  border-collapse: collapse;
  margin: 0;
}

.data-table thead {
  background: #003366;
  color: white;
  position: sticky;
  top: 0;
  z-index: 1;
}

.data-table th,
.data-table td {
  padding: 15px;
  text-align: left;
  border-bottom: 1px solid #dee2e6;
  white-space: nowrap; /* Prevent text wrapping */
  min-width: 120px; /* Minimum column width */
}

/* Allow wrapping for specific columns if needed */
.data-table th:nth-child(3), /* Title column */
.data-table td:nth-child(3) {
  white-space: normal;
  min-width: 200px;
}

.data-table th:nth-child(2), /* Client column */
.data-table td:nth-child(2) {
  min-width: 150px;
}

.data-table th:last-child, /* Actions column */
.data-table td:last-child {
  white-space: nowrap;
  min-width: 150px;
}

.data-table tbody tr:hover {
  background: #f8f9fa;
}

.empty-state {
  text-align: center;
  padding: 40px;
  color: #666;
  font-style: italic;
}

/* PAGINATION */
.pagination {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 20px;
  margin-top: 20px;
  padding: 20px 0;
}

.page-info {
  color: #666;
  font-weight: 500;
  font-size: 0.95em;
}

.btn {
  padding: 8px 16px;
  border: none;
  border-radius: 5px;
  cursor: pointer;
  font-size: 0.9em;
  transition: all 0.3s;
  font-weight: 500;
}

.btn-secondary {
  background: #0066CC;
  color: white;
}

.btn-secondary:hover:not(:disabled) {
  background: #0052a3;
}

.btn-secondary:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  background: #6c757d;
}

.btn-sm {
  padding: 6px 12px;
  font-size: 0.85em;
}

/* Responsive adjustments */
@media (max-width: 768px) {
  .data-table th,
  .data-table td {
    padding: 12px 8px;
    font-size: 0.9em;
  }
  
  .table-wrapper {
    border-radius: 6px;
  }
  
  .pagination {
    flex-direction: column;
    gap: 10px;
  }
  
  .page-info {
    order: -1;
  }
}

/* Scrollbar styling */
.table-wrapper::-webkit-scrollbar {
  height: 8px;
}

.table-wrapper::-webkit-scrollbar-track {
  background: #f1f1f1;
  border-radius: 4px;
}

.table-wrapper::-webkit-scrollbar-thumb {
  background: #0066CC;
  border-radius: 4px;
}

.table-wrapper::-webkit-scrollbar-thumb:hover {
  background: #0052a3;
}
</style>