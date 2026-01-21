<!--components/common/Breadcrumb.vue-->
<template>
  <nav class="breadcrumb" aria-label="Breadcrumb">
    <ol class="breadcrumb-list">
      <li class="breadcrumb-item">
        <router-link to="/dashboard" class="breadcrumb-link">
          <span class="breadcrumb-icon">🏠</span>
          Dashboard
        </router-link>
      </li>
      
      <li 
        v-for="(item, index) in items" 
        :key="index" 
        class="breadcrumb-item"
      >
        <span class="breadcrumb-separator">/</span>
        
        <router-link 
          v-if="item.to" 
          :to="item.to" 
          class="breadcrumb-link"
        >
          {{ item.label }}
        </router-link>
        
        <span v-else class="breadcrumb-current">
          {{ item.label }}
        </span>
      </li>
    </ol>
  </nav>
</template>

<script setup>
defineProps({
  items: {
    type: Array,
    default: () => []
  }
})
</script>

<style scoped>
.breadcrumb {
  margin-bottom: 20px;
  padding: 15px 20px;
  background: white;
  border-radius: 8px;
  box-shadow: 0 1px 3px rgba(0,0,0,0.1);
}

.breadcrumb-list {
  list-style: none;
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px;
  margin: 0;
  padding: 0;
}

.breadcrumb-item {
  display: flex;
  align-items: center;
  gap: 8px;
}

.breadcrumb-separator {
  color: #999;
  font-size: 0.9em;
}

.breadcrumb-link {
  color: #0066CC;
  text-decoration: none;
  font-size: 0.95em;
  transition: color 0.3s;
  display: flex;
  align-items: center;
  gap: 6px;
}

.breadcrumb-link:hover {
  color: #E31E24;
  text-decoration: underline;
}

.breadcrumb-icon {
  font-size: 1.1em;
}

.breadcrumb-current {
  color: #333333;
  font-weight: 500;
  font-size: 0.95em;
}

@media (max-width: 768px) {
  .breadcrumb {
    padding: 12px 15px;
  }
  
  .breadcrumb-list {
    gap: 6px;
  }
  
  .breadcrumb-link,
  .breadcrumb-current {
    font-size: 0.9em;
  }
}
</style>