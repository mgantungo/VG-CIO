<!--components/common/DataTable.vue-->
<template>
  <div class="data-table">
    <!-- Table with horizontal scroll -->
    <div class="table-scroll-container">
      <table class="table" :class="{ 'loading': loading }">
        <thead>
          <tr>
            <th v-for="header in headers" :key="header.key" class="table-header">
              {{ header.label }}
            </th>
          </tr>
        </thead>
        <tbody v-if="!loading">
          <tr v-for="(item, index) in paginatedItems" :key="item.id || index" class="table-row">
            <td v-for="header in headers" :key="header.key" class="table-cell">
              <slot :name="`cell-${header.key}`" :item="item">
                <slot :name="`cell(${header.key})`" :item="item">
                  {{ item[header.key] }}
                </slot>
              </slot>
            </td>
          </tr>
        </tbody>
        <tbody v-else>
          <tr v-for="i in 5" :key="i" class="table-row loading-row">
            <td v-for="header in headers" :key="header.key" class="table-cell">
              <div class="loading-skeleton"></div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Pagination -->
    <div v-if="showPagination && totalPages > 1" class="pagination">
      <button 
        class="pagination-btn"
        :disabled="currentPage === 1"
        @click="currentPage--"
      >
        &laquo; Prev
      </button>
      
      <div class="pagination-pages">
        <span class="pagination-info">
          Page {{ currentPage }} of {{ totalPages }}
        </span>
        <span class="pagination-count">
          ({{ items.length }} items)
        </span>
      </div>
      
      <button 
        class="pagination-btn"
        :disabled="currentPage === totalPages"
        @click="currentPage++"
      >
        Next &raquo;
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
    default: true
  }
})

const emit = defineEmits(['page-change'])

const currentPage = ref(1)

// Computed properties
const totalPages = computed(() => {
  return Math.ceil(props.items.length / props.pageSize)
})

const paginatedItems = computed(() => {
  if (!props.showPagination) return props.items
  
  const start = (currentPage.value - 1) * props.pageSize
  const end = start + props.pageSize
  return props.items.slice(start, end)
})

// Watch for page changes
watch(currentPage, (newPage) => {
  emit('page-change', newPage)
})

// Reset to page 1 when items change
watch(() => props.items, () => {
  currentPage.value = 1
})
</script>

<style scoped>
.data-table {
  width: 100%;
}

/* Table Scroll Container */
.table-scroll-container {
  width: 100%;
  overflow-x: auto;
  border-radius: 8px;
  border: 1px solid #F5F5F5;
  background: white;
}

/* Table styles */
.table {
  width: 100%;
  min-width: 1000px; /* Minimum width for horizontal scroll */
  border-collapse: collapse;
}

.table-header {
  background: #003366;
  color: white;
  padding: 16px 20px;
  text-align: left;
  font-weight: 600;
  font-size: 0.95em;
  border-bottom: 2px solid #F5F5F5;
  white-space: nowrap;
}

.table-header:first-child {
  border-top-left-radius: 8px;
}

.table-header:last-child {
  border-top-right-radius: 8px;
}

.table-row {
  border-bottom: 1px solid #F5F5F5;
  transition: background-color 0.3s;
}

.table-row:hover {
  background-color: #f9f9f9;
}

.table-row:last-child {
  border-bottom: none;
}

.table-cell {
  padding: 16px 20px;
  vertical-align: middle;
  white-space: nowrap;
}

/* Loading state */
.table.loading .table-row:hover {
  background-color: transparent;
}

.loading-row .table-cell {
  padding: 18px 20px;
}

.loading-skeleton {
  height: 20px;
  background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
  background-size: 200% 100%;
  animation: loading 1.5s infinite;
  border-radius: 4px;
}

@keyframes loading {
  0% { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}

/* Pagination */
.pagination {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 20px;
  padding: 15px 20px;
  background: white;
  border-radius: 8px;
  border: 1px solid #F5F5F5;
}

.pagination-btn {
  padding: 8px 16px;
  background: #0066CC;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-weight: 500;
  transition: all 0.3s;
}

.pagination-btn:hover:not(:disabled) {
  background: #0052a3;
  transform: translateY(-1px);
}

.pagination-btn:disabled {
  background: #cccccc;
  cursor: not-allowed;
  opacity: 0.6;
}

.pagination-pages {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
}

.pagination-info {
  font-weight: 600;
  color: #333;
}

.pagination-count {
  font-size: 0.85em;
  color: #666;
}

/* Scrollbar styling */
.table-scroll-container::-webkit-scrollbar {
  height: 8px;
}

.table-scroll-container::-webkit-scrollbar-track {
  background: #f1f1f1;
  border-radius: 4px;
  margin: 0 4px;
}

.table-scroll-container::-webkit-scrollbar-thumb {
  background: #c1c1c1;
  border-radius: 4px;
}

.table-scroll-container::-webkit-scrollbar-thumb:hover {
  background: #a8a8a8;
}

/* Hide scrollbar for IE, Edge and Firefox */
.table-scroll-container {
  scrollbar-width: thin;
  scrollbar-color: #c1c1c1 #f1f1f1;
}

/* Responsive */
@media (max-width: 768px) {
  .table {
    min-width: 800px;
  }
  
  .table-header,
  .table-cell {
    padding: 12px 16px;
    font-size: 0.9em;
  }
  
  .pagination {
    flex-direction: column;
    gap: 15px;
    text-align: center;
  }
  
  .pagination-btn {
    width: 100%;
  }
}

@media (max-width: 480px) {
  .table {
    min-width: 700px;
  }
}
</style>