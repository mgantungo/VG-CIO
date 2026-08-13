<!-- components/design/FileGroupCard.vue -->
<template>
  <div
    class="dd-filegroup"
    :class="{ dragging: isDragging }"
    @dragenter.prevent="onDragEnter"
    @dragover.prevent="onDragEnter"
    @dragleave.prevent="onDragLeave"
    @drop.prevent="onDrop"
  >
    <div class="dd-filegroup-head">
      <span class="fg-label">{{ group.label || `Ad Slot ${group.id}` }}</span>
      <button class="dd-btn small danger-ghost" @click="$emit('remove-group')">Remove</button>
    </div>

    <div v-if="group.file" class="dd-proof">
      <span class="ficon">{{ fileExt }}</span>
      <div style="flex:1;">
        <div class="fn">{{ group.file.name }}</div>
        <div class="fs">{{ group.file.sizeFormatted || formatSize(group.file.size) }}</div>
      </div>
      <span class="dd-view-link" @click="openFile">View &rarr;</span>
      <label class="dd-btn small ghost" style="cursor:pointer;">
        Replace
        <input type="file" @change="onFileChange" />
      </label>
    </div>

    <label v-else class="dd-dropzone" :class="{ dragging: isDragging }">
      <span>📎</span>
      <span>{{ isDragging ? 'Drop it here' : 'Drop the designed PDF here (or drag an advert from the queue)' }}</span>
      <input type="file" accept=".pdf,image/*" @change="onFileChange" />
    </label>

    <div class="dd-pinned">
      <div v-for="a in group.adverts" :key="a.id" class="dd-pin">
        <span class="dd-mono" style="color:var(--dd-ink-soft);font-size:10.5px;">{{ a.reference || a.id }}</span>
        {{ a.adLabel }}
        <span class="x" @click="$emit('remove-advert', a.id)">&times;</span>
      </div>
      <div v-if="!group.adverts || group.adverts.length === 0" style="font-size:11.5px;color:var(--dd-ink-soft);">
        No adverts pinned yet — drag one here, or use "+ Add to Board" on a queue card.
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useDesignHouse } from '~/composables/useDesignHouse'

const props = defineProps({
  group: { type: Object, required: true }, // shape from getBatchDetail: { id, label, file, adverts }
})
const emit = defineEmits(['upload-file', 'remove-advert', 'remove-group', 'assign-advert'])

const { resolveUrl } = useDesignHouse()

const fileExt = computed(() => {
  // getBatchDetail's file object doesn't include `ext` — derive from the filename.
  const name = props.group.file?.name || ''
  const ext = name.includes('.') ? name.split('.').pop() : 'FILE'
  return ext.toUpperCase().slice(0, 4)
})

function formatSize(bytes) {
  if (!bytes) return ''
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`
}

function onFileChange(e) {
  const file = e.target.files?.[0]
  if (file) emit('upload-file', file)
  // Reset the input so choosing the same filename again still fires @change
  e.target.value = ''
}

function openFile() {
  if (props.group.file?.url) window.open(resolveUrl(props.group.file.url), '_blank')
}

// ── Drag and drop ──────────────────────────────────────────────────────────
// The whole card is the drop target, not just the empty-state dropzone, so
// dragging a replacement file onto a group that already has one also works.
const isDragging = ref(false)
let dragDepth = 0 // dragenter/dragleave fire per child element; only clear on the last leave

function onDragEnter() {
  dragDepth++
  isDragging.value = true
}

function onDragLeave() {
  dragDepth = Math.max(0, dragDepth - 1)
  if (dragDepth === 0) isDragging.value = false
}

function onDrop(e) {
  dragDepth = 0
  isDragging.value = false

  // A real OS file drop (existing behavior — the design proof upload) always
  // takes priority when both are somehow present.
  const file = e.dataTransfer?.files?.[0]
  if (file) {
    emit('upload-file', file)
    return
  }

  // Otherwise, this may be an advert row dragged from the queue table —
  // QueueSheetModal sets this via `e.dataTransfer.setData('text/plain', advertId)`
  // on its row's dragstart.
  const advertIdRaw = e.dataTransfer?.getData('text/plain')
  const advertId = advertIdRaw ? Number(advertIdRaw) : null
  if (advertId && !Number.isNaN(advertId)) {
    emit('assign-advert', advertId)
  }
}
</script>

<style scoped>
.dd-filegroup{background:#fffdf8;border:1px solid #b7ae97;border-radius:2px;padding:14px;margin-bottom:14px;transition:border-color .12s ease,background .12s ease;}
.dd-filegroup.dragging{border-color:#1c3fa8;border-style:dashed;background:#e7ebf8;}
.dd-filegroup-head{display:flex;justify-content:space-between;align-items:center;margin-bottom:10px;gap:8px;}
.dd-filegroup-head .fg-label{font-weight:600;font-size:12.5px;}
.dd-dropzone{
  border:1.5px dashed #b7ae97;border-radius:2px;padding:16px;text-align:center;
  color:#6b6658;font-size:12px;cursor:pointer;background:#efeade;
  display:flex;flex-direction:column;align-items:center;gap:4px;
}
.dd-dropzone:hover{border-color:#1c3fa8;color:#1c3fa8;}
.dd-dropzone.dragging{border-color:#1c3fa8;color:#1c3fa8;background:#e7ebf8;}
.dd-dropzone input[type="file"]{display:none;}
.dd-proof{display:flex;align-items:center;gap:10px;padding:8px 10px;background:#efeade;border-radius:2px;margin-top:8px;}
.dd-proof .ficon{width:28px;height:28px;border-radius:2px;background:#a8261e;color:#fff;font-size:9px;font-weight:700;display:flex;align-items:center;justify-content:center;font-family:'IBM Plex Mono',monospace;}
.dd-proof .fn{font-size:12px;font-weight:600;}
.dd-proof .fs{font-size:10.5px;color:#6b6658;}

.dd-pinned{display:flex;flex-direction:column;gap:6px;margin-top:10px;}
.dd-pin{
  display:flex;align-items:center;gap:6px;font-size:12px;background:#e7ebf8;color:#1c3fa8;
  padding:5px 9px;border-radius:2px;
}
.dd-pin .x{margin-left:auto;cursor:pointer;font-weight:700;}

.dd-view-link{color:#1c3fa8;font-size:12px;cursor:pointer;text-decoration:underline;margin-left:auto;white-space:nowrap;}

.dd-mono{font-family:'IBM Plex Mono',monospace;}

.dd-btn{
  font-family:'Inter',sans-serif;font-size:12.5px;font-weight:600;padding:8px 14px;border-radius:2px;
  border:1px solid #1c1b18;background:#fffdf8;color:#1c1b18;cursor:pointer;
  display:inline-flex;align-items:center;gap:6px;
}
.dd-btn:disabled{opacity:.45;cursor:not-allowed;}
.dd-btn.danger-ghost{border-color:#a8261e;color:#a8261e;background:transparent;}
.dd-btn.ghost{background:transparent;}
.dd-btn.small{padding:5px 9px;font-size:11.5px;}
</style>