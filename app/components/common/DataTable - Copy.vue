<template>
  <div class="data-table-container">
    <div v-if="loading" class="loading-overlay">
      <div class="loading-spinner"></div>
      <div>Loading...</div>
    </div>
    
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
        <tr v-for="(item, index) in items" :key="index">
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
    
    <div v-if="showPagination" class="pagination">
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
  if (header.format === 'currency') {
    return new Intl.NumberFormat('en-UG', {
      style: 'currency',
      currency: 'UGX'
    }).format(value)
  }
  
  if (header.format === 'date') {
    return new Date(value).toLocaleDateString()
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

.data-table {
  width: 100%;
  border-collapse: collapse;
  margin-top: 20px;
}

.data-table thead {
  background: #003366;
  color: white;
}

.data-table th,
.data-table td {
  padding: 15px;
  text-align: left;
  border-bottom: 1px solid #DDDDDD;
}

.data-table tbody tr:hover {
  background: #F5F5F5;
}

.empty-state {
  text-align: center;
  padding: 40px;
  color: #666;
  font-style: italic;
}

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
}

.btn {
  padding: 8px 16px;
  border: none;
  border-radius: 5px;
  cursor: pointer;
  font-size: 0.9em;
  transition: all 0.3s;
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
}

.btn-sm {
  padding: 6px 12px;
  font-size: 0.9em;
}
</style>