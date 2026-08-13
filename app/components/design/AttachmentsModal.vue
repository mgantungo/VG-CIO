<!-- components/design/AttachmentsModal.vue -->
<template>
  <Teleport to="body">
    <div class="dd-modal-backdrop" :class="{ open: !!advert }" @click.self="$emit('close')">
      <div class="dd-modal" v-if="advert">
        <div class="dd-modal-head">
          <h3>Attached Files — {{ advert.reference }}</h3>
          <button class="dd-modal-close" @click="$emit('close')">&times;</button>
        </div>

        <div class="dd-modal-body">
          <div v-if="!files.length" class="dd-att-empty">No files attached to this advert.</div>

          <table v-else class="dd-att-tbl">
            <thead>
              <tr>
                <th class="dd-att-tc-icon"></th>
                <th>File Name</th>
                <th class="dd-att-tc-size">Size</th>
                <th class="dd-att-tc-actions"></th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="f in files" :key="f.id">
                <td class="dd-att-tc-icon">{{ getFileIcon(f.name) }}</td>
                <td>
                  <div class="dd-att-fname">{{ f.name }}</div>
                </td>
                <td class="dd-att-tc-size mono">{{ f.size ? formatFileSize(f.size) : '—' }}</td>
                <td class="dd-att-tc-actions">
                  <a
                    v-if="f.url"
                    :href="viewUrl(f)"
                    target="_blank"
                    rel="noopener"
                    class="dd-btn small ghost"
                    :title="isOfficeDoc(f.name) ? 'Preview via Office Online' : 'Open in new tab'"
                  >
                    View
                  </a>
                  <a
                    v-if="f.url"
                    :href="resolveUrl(f.url)"
                    :download="f.name"
                    class="dd-btn small ghost"
                  >
                    Download
                  </a>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <div class="dd-modal-foot">
          <button class="dd-btn primary" @click="$emit('close')">Close</button>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup>
import { computed } from 'vue'
import { useRuntimeConfig } from '#imports'

const props = defineProps({
  advert: { type: Object, default: null },
})

defineEmits(['close'])

const config = useRuntimeConfig()
const UPLOAD_BASE = config.public.uploadBase

const files = computed(() => props.advert?.attachments || [])

function resolveUrl(url) {
  if (!url) return ''
  return /^https?:\/\//i.test(url) ? url : `${UPLOAD_BASE || ''}${url}`
}

// Word/Excel/PowerPoint files can't render inline in a browser tab — clicking
// a raw link just downloads them or shows "can't open this file type."
// Route those through Microsoft's Office Online viewer instead, which fetches
// the file itself and renders a real preview. Requires the file URL to be
// reachable from the public internet over HTTPS (works on cio.newvision.co.ug,
// will NOT work against a localhost/dev URL — Microsoft's servers can't reach it).
const OFFICE_EXTENSIONS = ['doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx']

function isOfficeDoc(filename) {
  if (!filename) return false
  const ext = filename.split('.').pop().toLowerCase()
  return OFFICE_EXTENSIONS.includes(ext)
}

function viewUrl(f) {
  const url = resolveUrl(f.url)
  if (isOfficeDoc(f.name)) {
    return `https://view.officeapps.live.com/op/view.aspx?src=${encodeURIComponent(url)}`
  }
  return url
}

function formatFileSize(bytes) {
  if (!bytes || bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i]
}

function getFileIcon(filename) {
  if (!filename) return '📎'
  const ext = filename.split('.').pop().toLowerCase()
  const iconMap = {
    pdf: '📕', jpg: '🖼️', jpeg: '🖼️', png: '🖼️', gif: '🖼️',
    psd: '🎨', ai: '🎨', eps: '🎨', svg: '🎨',
    mp4: '🎬', mov: '🎬', avi: '🎬', wmv: '🎬',
    doc: '📄', docx: '📄',
  }
  return iconMap[ext] || '📎'
}
</script>

<style scoped>
.dd-modal-backdrop {
  position: fixed; inset: 0; background: rgba(28, 27, 24, .45); display: none;
  align-items: center; justify-content: center; z-index: 1000; padding: 20px;
}
.dd-modal-backdrop.open { display: flex; }
.dd-modal {
  background: #f6f3ec; border: 1px solid #b7ae97; border-radius: 3px;
  max-width: 560px; width: 100%; max-height: 88vh; display: flex; flex-direction: column;
  box-shadow: 0 12px 40px rgba(0, 0, 0, .25);
}
.dd-modal-head { display: flex; justify-content: space-between; align-items: center; padding: 16px 20px; border-bottom: 1px solid #b7ae97; }
.dd-modal-head h3 { margin: 0; font-family: 'Source Serif 4', serif; font-size: 17px; font-weight: 700; }
.dd-modal-close { cursor: pointer; font-size: 20px; color: #6b6658; line-height: 1; background: none; border: none; }
.dd-modal-body { padding: 18px 20px; overflow-y: auto; }
.dd-modal-foot { display: flex; justify-content: flex-end; gap: 8px; padding: 14px 20px; border-top: 1px solid #d9d3c3; }

.dd-btn {
  font-family: 'Inter', sans-serif; font-size: 12.5px; font-weight: 600; padding: 8px 14px; border-radius: 2px;
  border: 1px solid #1c1b18; background: #fffdf8; color: #1c1b18; cursor: pointer;
  display: inline-flex; align-items: center; gap: 6px;
}
.dd-btn.primary { background: #1c3fa8; border-color: #1c3fa8; color: #fff; }
.dd-btn.ghost { background: transparent; text-decoration: none; }
.dd-btn.small { padding: 5px 9px; font-size: 11.5px; }

.dd-att-empty { font-size: 13px; color: #6b6658; font-style: italic; }

.dd-att-tbl { width: 100%; border-collapse: collapse; font-size: 12.5px; }
.dd-att-tbl th {
  text-align: left; font-size: 10px; text-transform: uppercase; letter-spacing: .05em;
  color: #6b6658; padding: 0 8px 8px; border-bottom: 1px solid #d9d3c3;
}
.dd-att-tbl td { padding: 8px; border-bottom: 1px solid #e8e3d5; vertical-align: middle; }
.dd-att-tbl tr:last-child td { border-bottom: none; }
.dd-att-tc-icon { width: 24px; font-size: 1.1em; text-align: center; }
.dd-att-tc-size { width: 80px; }
.dd-att-tc-actions { width: 140px; text-align: right; white-space: nowrap; }
.dd-att-tc-actions .dd-btn { margin-left: 6px; }
.dd-att-fname { word-break: break-word; }
.mono { font-family: 'IBM Plex Mono', monospace; }
</style>