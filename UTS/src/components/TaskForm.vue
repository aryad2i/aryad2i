<script setup>
import { ref, watch } from 'vue'

const props = defineProps({
  saving: { type: Boolean, default: false },
  resetKey: { type: Number, default: 0 },
  folders: { type: Array, default: () => [] },
  defaultFolderId: { type: Number, default: null },
})
const emit = defineEmits(['add', 'clear-error'])
const title = ref('')
const files = ref([])
const selectedFolderId = ref('')
const attachmentInput = ref(null)

function addFiles(event) {
  const selectedFiles = Array.from(event.target.files || [])
  for (const file of selectedFiles) {
    const alreadySelected = files.value.some(
      (selected) =>
        selected.name === file.name &&
        selected.size === file.size &&
        selected.lastModified === file.lastModified,
    )
    if (!alreadySelected) files.value.push(file)
  }
  event.target.value = ''
}

function removeFile(index) {
  files.value.splice(index, 1)
}

function formatFileSize(size) {
  if (size < 1024 * 1024) return `${Math.max(1, Math.round(size / 1024))} KB`
  return `${(size / (1024 * 1024)).toFixed(1)} MB`
}

function submit() {
  const text = title.value.trim()
  if (!text || props.saving) return
  emit('clear-error')
  emit('add', {
    title: text,
    files: [...files.value],
    folderId: selectedFolderId.value ? Number(selectedFolderId.value) : null,
  })
}

watch(
  () => props.resetKey,
  () => {
    title.value = ''
    files.value = []
    selectedFolderId.value = props.defaultFolderId === null ? '' : String(props.defaultFolderId)
  },
)

watch(
  () => props.defaultFolderId,
  (folderId) => {
    selectedFolderId.value = folderId === null ? '' : String(folderId)
  },
)
</script>

<template>
  <form class="form" @submit.prevent="submit">
    <label class="title-label" for="task-title">Nama tugas</label>
    <div class="task-title-row">
      <input
        id="task-title"
        v-model="title"
        type="text"
        placeholder="Contoh: Laporan praktikum..."
        required
        :disabled="saving"
        @input="emit('clear-error')"
      />
      <button
        type="button"
        class="attach-button"
        :disabled="saving"
        aria-label="Pilih foto atau file lampiran"
        @click="attachmentInput.click()"
      >
        <span aria-hidden="true">＋</span>
        {{ files.length ? `Lampiran (${files.length})` : 'Lampirkan' }}
      </button>
      <input
        ref="attachmentInput"
        class="file-input"
        type="file"
        multiple
        :disabled="saving"
        @change="addFiles"
      />
    </div>

    <label class="folder-label" for="task-folder">Masukkan ke folder</label>
    <select id="task-folder" v-model="selectedFolderId" class="folder-select" :disabled="saving">
      <option value="">Tanpa folder</option>
      <option v-for="folder in folders" :key="folder.id" :value="String(folder.id)">
        {{ folder.name }}
      </option>
    </select>

    <ul v-if="files.length" class="selected-files" aria-label="Lampiran terpilih">
      <li v-for="(file, index) in files" :key="`${file.name}-${file.lastModified}-${index}`">
        <span class="file-icon" aria-hidden="true">{{ file.type.startsWith('image/') ? 'IMG' : 'FILE' }}</span>
        <span class="file-details">
          <span class="file-name">{{ file.name }}</span>
          <span class="file-size">{{ formatFileSize(file.size) }}</span>
        </span>
        <button
          type="button"
          class="remove-file"
          :aria-label="`Hapus lampiran ${file.name}`"
          :disabled="saving"
          @click="removeFile(index)"
        >
          ×
        </button>
      </li>
    </ul>

    <button class="submit-button" type="submit" :disabled="saving || !title.trim()">
      {{ saving ? 'Menyimpan...' : 'Tambah Tugas' }}
    </button>
  </form>
</template>

<style scoped>
.form {
  display: grid;
  grid-template-columns: 1fr auto;
  gap: 9px 10px;
  margin-bottom: 18px;
}

.title-label {
  grid-column: 1 / -1;
  margin-bottom: -3px;
  color: #52635a;
  font-size: 12px;
  font-weight: 750;
  letter-spacing: 0.04em;
}

.task-title-row {
  grid-column: 1 / -1;
  min-width: 0;
  display: flex;
  gap: 8px;
}

.task-title-row input[type='text'] {
  flex: 1;
  min-width: 0;
  height: 48px;
  padding: 0 16px;
  border: 1px solid #dce3dc;
  border-radius: 12px;
  background: #fafbf8;
  color: #27352f;
  font-size: 14px;
  transition: border-color 180ms ease, box-shadow 180ms ease, background 180ms ease;
}

.task-title-row input[type='text']::placeholder {
  color: #9aa59f;
}

.task-title-row input[type='text']:focus {
  border-color: #719182;
  background: #fff;
  box-shadow: 0 0 0 4px rgba(113, 145, 130, 0.11);
}

.folder-label {
  grid-column: 1 / -1;
  margin-bottom: -3px;
  color: #52635a;
  font-size: 12px;
  font-weight: 750;
  letter-spacing: 0.04em;
}

.folder-select {
  grid-column: 1 / -1;
  width: 100%;
  height: 42px;
  padding: 0 12px;
  border: 1px solid #dce3dc;
  border-radius: 10px;
  background: #fafbf8;
  color: #52635a;
  font: inherit;
  font-size: 13px;
}

.folder-select:focus {
  border-color: #719182;
  box-shadow: 0 0 0 4px rgba(113, 145, 130, 0.11);
}

.folder-select:disabled,
.task-title-row input[type='text']:disabled,
.remove-file:disabled {
  cursor: wait;
  opacity: 0.6;
}

.attach-button {
  min-height: 48px;
  flex: 0 0 auto;
  padding: 0 14px;
  border: 1px solid #dfe6df;
  border-radius: 12px;
  background: #f7f9f5;
  color: #456554;
  font-size: 11px;
  font-weight: 700;
  transition: background 180ms ease, border-color 180ms ease;
}

.attach-button:hover {
  border-color: #c9d8cd;
  background: #edf3ed;
}

.attach-button span {
  margin-right: 3px;
  font-size: 15px;
  line-height: 0;
}

.attach-button:disabled {
  cursor: wait;
  opacity: 0.6;
}

.file-input {
  display: none;
}

.selected-files {
  grid-column: 1 / -1;
  display: grid;
  gap: 6px;
  margin: 0;
  padding: 0;
  list-style: none;
}

.selected-files li {
  min-width: 0;
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 9px 10px;
  border: 1px solid #edf0eb;
  border-radius: 10px;
  background: #fff;
}

.file-icon {
  flex: 0 0 auto;
  padding: 5px 6px;
  border-radius: 6px;
  background: #edf3ed;
  color: #547361;
  font-size: 9px;
  font-weight: 800;
}

.file-details {
  min-width: 0;
  flex: 1;
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 10px;
}

.file-name {
  overflow: hidden;
  color: #405048;
  font-size: 12px;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.file-size {
  flex: 0 0 auto;
  color: #9aa59f;
  font-size: 10px;
}

.remove-file {
  width: 26px;
  height: 26px;
  flex: 0 0 26px;
  border: 0;
  border-radius: 7px;
  background: transparent;
  color: #9aa59f;
  font-size: 18px;
}

.remove-file:hover {
  background: #f5eaea;
  color: #a65353;
}

.submit-button {
  grid-column: 1 / -1;
  height: 46px;
  margin-top: 3px;
  padding: 0 18px;
  border: 0;
  border-radius: 12px;
  background: #315a49;
  color: #fff;
  font-size: 13px;
  font-weight: 750;
  box-shadow: 0 8px 18px rgba(49, 90, 73, 0.16);
  transition: transform 180ms ease, background 180ms ease, box-shadow 180ms ease;
}

.submit-button:hover:not(:disabled) {
  background: #274938;
  transform: translateY(-1px);
  box-shadow: 0 10px 22px rgba(49, 90, 73, 0.22);
}

.submit-button:disabled {
  cursor: not-allowed;
  opacity: 0.6;
}

@media (max-width: 560px) {
  .task-title-row {
    gap: 6px;
  }

  .attach-button {
    padding-inline: 10px;
  }

  .task-title-row input[type='text'] {
    padding-inline: 12px;
  }

  .file-details {
    display: block;
  }

  .file-size {
    display: block;
    margin-top: 2px;
  }
}
</style>
