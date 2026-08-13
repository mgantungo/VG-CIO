<!-- components/design/ext/AssignBar.vue -->
<!--
  Extracted as-is from the inline "Assign bar" markup that used to live directly
  in DesignDeskWorkspace.vue. Same look, same behavior — just reusable so it can
  also render inside QueueSheetModal.vue without duplicating markup.
-->
<template>
  <div
    v-if="advert"
    class="dd-note-box"
    style="margin:0 28px;display:flex;align-items:center;gap:10px;flex-wrap:wrap;"
  >
    <span>Assign <b>{{ advert.advertTitle }}</b> to:</span>
    <button
      v-for="g in groups"
      :key="g.id"
      class="dd-btn small ghost"
      @click="$emit('assign', g.id)"
    >{{ g.label || `Group ${g.id}` }}</button>
    <button class="dd-btn small primary" @click="$emit('assign-new')">+ New Group</button>
    <button class="dd-btn small ghost" @click="$emit('cancel')">Cancel</button>
  </div>
</template>

<script setup>
defineProps({
  advert: { type: Object, default: null }, // pendingAssignAdvert
  groups: { type: Array, default: () => [] }, // activeBatch?.fileGroups
})
defineEmits(['assign', 'assign-new', 'cancel'])
</script>