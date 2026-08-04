<!-- components/design/BatchDetailModal.vue -->
<template>
  <Teleport to="body">
    <div class="dd-modal-backdrop" :class="{ open: !!batch }" @click.self="$emit('close')">
      <div class="dd-modal dd-modal-lg" v-if="batch">
        <div class="dd-modal-head">
          <h3>{{ batch.label }}</h3>
          <button class="dd-modal-close" @click="$emit('close')">&times;</button>
        </div>
        <div class="dd-modal-body">
          <div class="dd-detail-meta">
            <div class="dd-dm-item"><span class="k">Batch Ref</span><span class="v dd-mono">{{ batch.reference }}</span></div>
            <div class="dd-dm-item"><span class="k">Status</span><span class="v"><span class="dd-stamp" :class="batch.status">{{ batch.status }}</span></span></div>
            <div class="dd-dm-item"><span class="k">Target Run Date</span><span class="v">{{ formatDate(batch.targetRunDate) }}</span></div>
            <div class="dd-dm-item"><span class="k">Designer</span><span class="v">{{ batch.designer?.name || '—' }}</span></div>
            <div class="dd-dm-item"><span class="k">Created</span><span class="v dd-mono" style="font-weight:400;">{{ formatDateTime(batch.createdAt) }}</span></div>
          </div>

          <div class="dd-detail-section">
            <h4>Ad Slots · {{ batch.fileGroupsCount }}</h4>

            <div v-for="group in batch.fileGroups" :key="group.id" class="dd-file-group-detail">
              <div class="dd-fgd-file" v-if="group.file">
                <span class="ficon" style="width:34px;height:34px;background:var(--dd-red);color:#fff;border-radius:2px;display:flex;align-items:center;justify-content:center;font-family:'IBM Plex Mono',monospace;font-size:10px;">
                  {{ fileExt(group.file.name) }}
                </span>
                <div style="flex:1;">
                  <div class="fn">{{ group.file.name }}</div>
                  <div class="fs">{{ group.file.sizeFormatted }}</div>
                </div>
                <span class="dd-view-link" @click="openUrl(group.file.url)">View &rarr;</span>
              </div>
              <p v-else style="font-size:12px;color:var(--dd-ink-soft);margin:0 0 10px;">No file uploaded to this ad slot yet.</p>

              <table class="dd-detail-table">
                <thead>
                  <tr><th>Ref</th><th>BC Order #</th><th>Ad Label</th><th>Client</th><th>Size</th><th>Attachment</th></tr>
                </thead>
                <tbody>
                  <tr v-for="a in group.adverts" :key="a.id">
                    <td class="ref">{{ a.reference }}</td>
                    <td class="dd-mono">{{ a.bcOrderNumber || '—' }}</td>
                    <td>{{ a.adLabel }}</td>
                    <td>{{ a.client }}</td>
                    <td>{{ a.adSize }}</td>
                    <td>
                      <span
                        v-if="a.attachments && a.attachments.length"
                        class="dd-view-link"
                        @click="openUrl(a.attachments[0].url)"
                      >📎 {{ a.attachments[0].name }}</span>
                      <span v-else class="dd-view-link muted">— none provided</span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <div class="dd-detail-section" style="margin-bottom:0;">
            <h4>Attached Schedules</h4>
            <div v-if="batch.dailySchedules && batch.dailySchedules.length">
              <div v-for="s in batch.dailySchedules" :key="s.id" class="dd-attach-line">
                <span>{{ formatDate(s.runDate) }} · {{ s.isPublished ? 'Published' : 'Not published' }}</span>
                <span class="dd-view-link" @click="$emit('view-schedule', s)">View schedule &rarr;</span>
              </div>
            </div>
            <p v-else style="font-size:12px;color:var(--dd-ink-soft);margin:0;">Not attached to any schedule yet.</p>
          </div>
        </div>
        <div class="dd-modal-foot">
          <button v-if="batch.status !== 'attached'" class="dd-btn danger-ghost" @click="$emit('delete', batch)">Delete</button>
          <button class="dd-btn ghost" @click="$emit('close')">Close</button>
          <button class="dd-btn primary" @click="$emit('edit', batch)">Edit on Layout Board</button>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup>
import { useDesignHouse } from '~/composables/useDesignHouse'

defineProps({
  batch: { type: Object, default: null }, // getBatchDetail shape
})
defineEmits(['close', 'edit', 'delete', 'view-schedule'])

const { resolveUrl } = useDesignHouse()

function openUrl(url) {
  if (url) window.open(resolveUrl(url), '_blank')
}
function fileExt(name) {
  if (!name || !name.includes('.')) return 'FILE'
  return name.split('.').pop().toUpperCase().slice(0, 4)
}
function formatDate(d) {
  if (!d) return '—'
  return new Date(d).toLocaleDateString('en-UG', { day: '2-digit', month: 'short', year: 'numeric' })
}
function formatDateTime(d) {
  if (!d) return '—'
  return new Date(d).toLocaleDateString('en-UG', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })
}
</script>

<style scoped>
.dd-modal-backdrop{
  position:fixed;inset:0;background:rgba(28,27,24,.45);display:none;
  align-items:center;justify-content:center;z-index:1000;padding:20px;
}
.dd-modal-backdrop.open{display:flex;}
.dd-modal{background:#f6f3ec;border:1px solid #b7ae97;border-radius:3px;max-width:560px;width:100%;max-height:88vh;display:flex;flex-direction:column;box-shadow:0 12px 40px rgba(0,0,0,.25);}
.dd-modal.dd-modal-lg{max-width:820px;}
.dd-modal-head{display:flex;justify-content:space-between;align-items:center;padding:16px 20px;border-bottom:1px solid #b7ae97;}
.dd-modal-head h3{margin:0;font-family:'Source Serif 4',serif;font-size:17px;font-weight:700;}
.dd-modal-close{cursor:pointer;font-size:20px;color:#6b6658;line-height:1;background:none;border:none;}
.dd-modal-body{padding:18px 20px;overflow-y:auto;}
.dd-modal-foot{display:flex;justify-content:flex-end;gap:8px;padding:14px 20px;border-top:1px solid #d9d3c3;}

.dd-btn{
  font-family:'Inter',sans-serif;font-size:12.5px;font-weight:600;padding:8px 14px;border-radius:2px;
  border:1px solid #1c1b18;background:#fffdf8;color:#1c1b18;cursor:pointer;
  display:inline-flex;align-items:center;gap:6px;
}
.dd-btn:disabled{opacity:.45;cursor:not-allowed;}
.dd-btn.primary{background:#1c3fa8;border-color:#1c3fa8;color:#fff;}
.dd-btn.ghost{background:transparent;}
.dd-mono{font-family:'IBM Plex Mono',monospace;}

.dd-btn.danger-ghost{border-color:#a8261e;color:#a8261e;background:transparent;}

.dd-stamp{font-family:'IBM Plex Mono',monospace;font-size:10.5px;font-weight:700;letter-spacing:.06em;text-transform:uppercase;padding:3px 9px;border-radius:2px;display:inline-block;}
.dd-stamp.attached{color:#2f6f4f;border:1.5px solid #2f6f4f;transform:rotate(-2deg);}
.dd-stamp.draft{color:#6b6658;border:1.5px dashed #b7ae97;}
.dd-stamp.ready{color:#1c3fa8;border:1.5px solid #1c3fa8;}
.dd-stamp.archived{color:#6b6658;border:1.5px solid #b7ae97;}

.dd-detail-meta{display:flex;flex-wrap:wrap;gap:18px;padding-bottom:14px;margin-bottom:14px;border-bottom:1px solid #d9d3c3;}
.dd-dm-item .k{display:block;font-size:10px;text-transform:uppercase;letter-spacing:.05em;color:#6b6658;margin-bottom:2px;}
.dd-dm-item .v{font-size:13px;font-weight:600;}
.dd-detail-section{margin-bottom:18px;}
.dd-detail-section h4{font-family:'Source Serif 4',serif;font-size:13px;text-transform:uppercase;letter-spacing:.05em;margin:0 0 10px;}
.dd-file-group-detail{border:1px solid #d9d3c3;border-radius:2px;padding:12px;margin-bottom:10px;}
.dd-fgd-file{display:flex;align-items:center;gap:10px;margin-bottom:10px;}
.dd-fgd-file .fn{font-size:12.5px;font-weight:600;}
.dd-fgd-file .fs{font-size:10.5px;color:#6b6658;}
.dd-view-link{color:#1c3fa8;font-size:12px;cursor:pointer;text-decoration:underline;margin-left:auto;white-space:nowrap;}
.dd-view-link.muted{color:#6b6658;cursor:default;text-decoration:none;}
.dd-detail-table{width:100%;border-collapse:collapse;font-size:12px;}
.dd-detail-table th{text-align:left;font-size:10px;text-transform:uppercase;letter-spacing:.04em;color:#6b6658;padding:5px 6px;border-bottom:1px solid #d9d3c3;}
.dd-detail-table td{padding:6px 6px;border-bottom:1px solid #d9d3c3;vertical-align:top;}
.dd-detail-table .ref{font-family:'IBM Plex Mono',monospace;font-size:11px;}
.dd-attach-line{display:flex;justify-content:space-between;align-items:center;font-size:12.5px;padding:6px 0;}
</style>