<!-- components/pager/PagerInitModal.vue -->
<template>
  <div class="pim">
    <div class="pim__section">
      <h3 class="pim__h">Open an existing publication</h3>
      <div v-if="publications.length === 0" class="pim__empty">No publications yet.</div>
      <div v-else class="pim__list">
        <button
          v-for="p in publications"
          :key="p.id"
          class="pim__item"
          @click="$emit('open', p.id)"
        >
          <span class="mono pim__code">{{ p.publication_code }}</span>
          <span class="pim__meta">{{ p.total_pages }} pages · {{ p.status }}</span>
        </button>
      </div>
    </div>

    <div class="pim__divider">or</div>

    <div class="pim__section">
      <h3 class="pim__h">Initialize a new publication</h3>
      <form class="pim__form" @submit.prevent="submit">
        <label class="pim__label">Masthead</label>
        <select v-model="form.masthead" class="pim__input" required>
          <option value="" disabled>Select…</option>
          <option value="NV">New Vision (NV)</option>
          <option value="BK">Bukedde (BK)</option>
        </select>

        <label class="pim__label">Publication date</label>
        <input v-model="form.publicationDate" type="date" class="pim__input" required>

        <label class="pim__label">Total pages (min 24, multiple of 4)</label>
        <input v-model.number="form.totalPages" type="number" min="24" step="4" class="pim__input" required>

        <label class="pim__label">Notes (optional)</label>
        <textarea v-model="form.notes" class="pim__input pim__textarea" rows="2"></textarea>

        <div v-if="formError" class="pim__error">{{ formError }}</div>

        <button type="submit" class="pim__submit" :disabled="submitting">
          {{ submitting ? 'Creating…' : 'Create Publication' }}
        </button>
      </form>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'

const props = defineProps({
  publications: { type: Array, default: () => [] },
})
const emit = defineEmits(['open', 'create'])

const form = ref({ masthead: '', publicationDate: '', totalPages: 24, notes: '' })
const formError = ref('')
const submitting = ref(false)

const submit = async () => {
  formError.value = ''
  if (form.value.totalPages < 24 || form.value.totalPages % 4 !== 0) {
    formError.value = 'Total pages must be at least 24 and divisible by 4'
    return
  }
  submitting.value = true
  try {
    await new Promise((resolve, reject) => {
      emit('create', { ...form.value }, resolve, reject)
    })
  } catch (e) {
    formError.value = e?.message || 'Failed to create publication'
  } finally {
    submitting.value = false
  }
}
</script>

<style scoped>
.pim { font-family: 'IBM Plex Sans', sans-serif; padding: 20px; max-width: 480px; margin: 0 auto; }
.pim__h { font-size: 13px; font-weight: 700; color: #003366; margin-bottom: 10px; }
.pim__empty { font-size: 12px; color: #999; }

.pim__list { display: flex; flex-direction: column; gap: 6px; }
.pim__item {
  display: flex; justify-content: space-between; align-items: center;
  border: 1.5px solid #D1D9E0; border-radius: 2px; background: #fff;
  padding: 8px 12px; cursor: pointer; font-family: inherit; text-align: left;
}
.pim__item:hover { background: #F0F4F8; border-color: #0066CC; }
.pim__code { font-family: 'IBM Plex Mono', monospace; font-weight: 700; color: #003366; font-size: 12px; }
.pim__meta { font-size: 11px; color: #888; }

.pim__divider { text-align: center; font-size: 11px; color: #bbb; margin: 20px 0; text-transform: uppercase; letter-spacing: 1px; }

.pim__form { display: flex; flex-direction: column; gap: 4px; }
.pim__label { font-size: 10px; font-weight: 700; text-transform: uppercase; color: #888; margin-top: 8px; }
.pim__input {
  border: 1.5px solid #D1D9E0; border-radius: 2px; padding: 7px 10px; font-size: 12px;
  font-family: inherit; background: #fff; color: #222;
}
.pim__input:focus { outline: none; border-color: #0066CC; }
.pim__textarea { resize: vertical; }

.pim__error {
  background: #FCE4D6; border: 1px solid #E31E24; color: #9C0006;
  font-size: 11px; padding: 6px 10px; margin-top: 10px; border-radius: 2px;
}
.pim__submit {
  margin-top: 14px; background: #003366; color: #fff; border: none; border-radius: 2px;
  padding: 9px; font-size: 12px; font-weight: 700; cursor: pointer; font-family: inherit;
}
.pim__submit:hover { background: #0066CC; }
.pim__submit:disabled { opacity: .6; cursor: not-allowed; }
</style>
