<template>
  <NuxtLayout>
    <NuxtPage />
  </NuxtLayout>
</template>

<script setup>
useHead({
  title: 'Vision Group Advertising Management System',
  meta: [
    { charset: 'utf-8' },
    { name: 'viewport', content: 'width=device-width, initial-scale=1' },
    { 
      key: 'description', 
      name: 'description', 
      content: 'Manage advertising across Vision Group platforms' 
    }
  ],
  link: [
    { rel: 'icon', type: 'image/x-icon', href: '/favicon.ico' }
  ]
})
</script>

<style>
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

:root {
  --vg-red: #E31E24;
  --vg-dark-blue: #003366;
  --vg-light-blue: #0066CC;
  --vg-gold: #FFB612;
  --vg-gray: #F5F5F5;
  --vg-dark-gray: #333333;
  --vg-border: #DDDDDD;
  --success: #28a745;
  --warning: #ffc107;
  --danger: #dc3545;
  --info: #17a2b8;
}

body {
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
  line-height: 1.6;
  color: var(--vg-dark-gray);
  background-color: #ffffff;
}

/* Common styles */
.btn {
  padding: 10px 20px;
  border: none;
  border-radius: 5px;
  cursor: pointer;
  font-size: 1em;
  transition: all 0.3s;
  text-decoration: none;
  display: inline-block;
}

.btn-primary {
  background: var(--vg-red);
  color: white;
}

.btn-primary:hover {
  background: #c01820;
}

.btn-secondary {
  background: var(--vg-light-blue);
  color: white;
}

.btn-secondary:hover {
  background: #0052a3;
}

.btn-success {
  background: var(--success);
  color: white;
}

.btn-success:hover {
  background: #218838;
}

.btn-warning {
  background: var(--warning);
  color: var(--vg-dark-gray);
}

.btn-warning:hover {
  background: #e0a800;
}

.btn-danger {
  background: var(--danger);
  color: white;
}

.btn-danger:hover {
  background: #c82333;
}

.btn-info {
  background: var(--info);
  color: white;
}

.btn-sm {
  padding: 6px 12px;
  font-size: 0.9em;
}

.status-badge {
  padding: 5px 12px;
  border-radius: 20px;
  font-size: 0.85em;
  font-weight: 600;
  display: inline-block;
}

.status-draft {
  background: #ffeaa7;
  color: #636e72;
}

.status-pending {
  background: #74b9ff;
  color: #0984e3;
}

.status-approved {
  background: #55efc4;
  color: #00b894;
}

.status-rejected {
  background: #ff7675;
  color: #d63031;
}

.status-paid {
  background: #55efc4;
  color: #00b894;
}

.status-unpaid {
  background: #fab1a0;
  color: #e17055;
}

.action-buttons {
  display: flex;
  gap: 10px;
}
</style>