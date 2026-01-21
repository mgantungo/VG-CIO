<!--components/common/StatCard.vue-->
<template>
  <div class="stat-card">
    <div class="stat-icon" :class="colorClass">
      {{ icon }}
    </div>
    <div class="stat-info">
      <h5>{{ value }}</h5>
      <p>{{ label }}</p>
      <div v-if="trend" class="stat-trend" :class="trendClass">
        <span class="trend-icon">{{ trendIcon }}</span>
        <span class="trend-value">{{ trend }}</span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  icon: {
    type: String,
    default: '📊'
  },
  value: {
    type: [String, Number],
    required: true
  },
  label: {
    type: String,
    required: true
  },
  color: {
    type: String,
    default: 'blue'
  },
  trend: {
    type: String,
    default: ''
  },
  trendDirection: {
    type: String,
    default: 'up' // 'up', 'down', or 'neutral'
  }
})

const colorClass = computed(() => {
  const colors = {
    blue: 'stat-icon-blue',
    red: 'stat-icon-red',
    green: 'stat-icon-green',
    gold: 'stat-icon-gold',
    purple: 'stat-icon-purple',
    teal: 'stat-icon-teal'
  }
  return colors[props.color] || 'stat-icon-blue'
})

const trendClass = computed(() => {
  if (props.trendDirection === 'up') return 'trend-up'
  if (props.trendDirection === 'down') return 'trend-down'
  return 'trend-neutral'
})

const trendIcon = computed(() => {
  if (props.trendDirection === 'up') return '↗️'
  if (props.trendDirection === 'down') return '↘️'
  return '➡️'
})
</script>

<style scoped>
.stat-card {
  background: white;
  padding: 25px;
  border-radius: 10px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.08);
  display: flex;
  align-items: center;
  gap: 20px;
  transition: transform 0.3s, box-shadow 0.3s;
  height: 100%;
  min-height: 120px;
  overflow: hidden;
}

.stat-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0,0,0,0.12);
}

.stat-icon {
  width: 60px;
  height: 60px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.8em;
  flex-shrink: 0;
}

.stat-icon-blue {
  background: linear-gradient(135deg, #0066CC, #003366);
  color: white;
}

.stat-icon-red {
  background: linear-gradient(135deg, #E31E24, #c01820);
  color: white;
}

.stat-icon-green {
  background: linear-gradient(135deg, #28a745, #218838);
  color: white;
}

.stat-icon-gold {
  background: linear-gradient(135deg, #FFB612, #e6a410);
  color: #333333;
}

.stat-icon-purple {
  background: linear-gradient(135deg, #6f42c1, #5a2d9c);
  color: white;
}

.stat-icon-teal {
  background: linear-gradient(135deg, #20c997, #17a589);
  color: white;
}

.stat-info {
  flex: 1;
  min-width: 0; /* Prevent text overflow */
}

.stat-info h3 {
  color: #003366;
  font-size: 1.8em;
  margin-bottom: 5px;
  font-weight: 700;
  line-height: 1.2;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.stat-info p {
  color: #666;
  font-size: 0.9em;
  margin-bottom: 8px;
  line-height: 1.4;
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  white-space: normal;
}

.stat-trend {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 0.85em;
  font-weight: 500;
  margin-top: 5px;
}

.trend-up {
  color: #28a745;
}

.trend-down {
  color: #dc3545;
}

.trend-neutral {
  color: #6c757d;
}

.trend-icon {
  font-size: 1em;
}

.trend-value {
  font-weight: 600;
}

/* Responsive adjustments */
@media (max-width: 1200px) {
  .stat-card {
    padding: 20px;
    gap: 15px;
  }
  
  .stat-icon {
    width: 50px;
    height: 50px;
    font-size: 1.5em;
  }
  
  .stat-info h3 {
    font-size: 1.6em;
  }
}

@media (max-width: 768px) {
  .stat-card {
    padding: 15px;
    gap: 12px;
  }
  
  .stat-icon {
    width: 45px;
    height: 45px;
    font-size: 1.3em;
  }
  
  .stat-info h3 {
    font-size: 1.4em;
  }
  
  .stat-info p {
    font-size: 0.85em;
  }
}

@media (max-width: 480px) {
  .stat-card {
    flex-direction: column;
    text-align: center;
    gap: 15px;
    padding: 20px;
  }
  
  .stat-info {
    width: 100%;
  }
  
  .stat-trend {
    justify-content: center;
  }
}
</style>