<script setup>
import { onBeforeUnmount, ref, watch } from 'vue'
import {
  deleteFolderAttachment,
  getFolderAttachment,
  saveFolderAttachments,
} from '../attachments'

const props = defineProps({
  folder: { type: Object, required: true },
})

const emit = defineEmits(['add', 'remove'])
const selectedFiles = ref([])
const attachments = ref([])
const saving = ref(false)
const errorMessage = ref('')
const attachmentInput = ref(null)
const objectUrls = []
let loadRequest = 0

function addFiles(event) {
  for (const file of Array.from(event.target.files || [])) {
    const alreadySelected = selectedFiles.value.some(
      (selected) =>
        selected.name === file.name &&
        selected.size === file.size &&
        selected.lastModified === file.lastModified,
    )
    if (!alreadySelected) selectedFiles.value.push(file)
  }
  event.target.value = ''
}

function removeSelectedFile(index) {
  selectedFiles.value.splice(index, 1)
}

function formatFileSize(size) {
  if (size < 1024 * 1024) return `${Math.max(1, Math.round(size / 1024))} KB`
  return `${(size / (1024 * 1024)).toFixed(1)} MB`
}

async function saveFiles() {
  if (!selectedFiles.value.length || saving.value) return

  saving.value = true
  errorMessage.value = ''
  try {
    const savedFiles = await saveFolderAttachments(props.folder.id, selectedFiles.value)
    emit('add', { folderId: props.folder.id, attachments: savedFiles })
    selectedFiles.value = []
  } catch (error) {
    console.error('Gagal menyimpan lampiran ke folder.', error)
    errorMessage.value = 'Lampiran gagal disimpan. Coba lagi, ya.'
  } finally {
    saving.value = false
  }
}

async function removeAttachment(id) {
  errorMessage.value = ''
  try {
    await deleteFolderAttachment(id)
    emit('remove', { folderId: props.folder.id, id })
  } catch (error) {
    console.error('Gagal menghapus lampiran dari folder.', error)
    errorMessage.value = 'Lampiran gagal dihapus. Coba lagi, ya.'
  }
}

watch(
  () => props.folder.attachments,
  async (folderAttachments) => {
    const requestId = ++loadRequest
    for (const url of objectUrls.splice(0)) URL.revokeObjectURL(url)
    const loadedAttachments = []
    const newUrls = []

    try {
      for (const attachment of folderAttachments || []) {
        const file = await getFolderAttachment(attachment.id)
        if (!file) continue
        const url = URL.createObjectURL(file)
        newUrls.push(url)
        loadedAttachments.push({
          ...attachment,
          url,
          isImage: file.type.startsWith('image/'),
        })
      }

      if (requestId !== loadRequest) {
        for (const url of newUrls) URL.revokeObjectURL(url)
        return
      }

      objectUrls.push(...newUrls)
      attachments.value = loadedAttachments
    } catch (error) {
      for (const url of newUrls) URL.revokeObjectURL(url)
      if (requestId !== loadRequest) return
      console.error('Gagal memuat lampiran folder.', error)
      errorMessage.value = 'Beberapa lampiran folder tidak dapat dimuat.'
    }
  },
  { immediate: true, deep: true },
)

onBeforeUnmount(() => {
  loadRequest += 1
  for (const url of objectUrls) URL.revokeObjectURL(url)
})
</script>

<template>
  <section class="folder-files" :aria-label="`Lampiran folder ${folder.name}`">
    <div class="folder-files-heading">
      <div>
        <p class="files-eyebrow">ISI FOLDER</p>
        <h2>{{ folder.name }}</h2>
      </div>
      <div class="upload-actions">
        <button
          type="button"
          class="upload-button"
          :disabled="saving"
          @click="attachmentInput.click()"
        >
          ＋ Tambah lampiran
        </button>
      </div>
      <input
        ref="attachmentInput"
        class="file-input"
        type="file"
        multiple
        :disabled="saving"
        @change="addFiles"
      />
    </div>

    <ul v-if="selectedFiles.length" class="selected-files" aria-label="File yang akan ditambahkan">
      <li v-for="(file, index) in selectedFiles" :key="`${file.name}-${file.lastModified}-${index}`">
        <span>{{ file.name }}</span>
        <small>{{ formatFileSize(file.size) }}</small>
        <button
          type="button"
          :aria-label="`Batalkan ${file.name}`"
          :disabled="saving"
          @click="removeSelectedFile(index)"
        >
          ×
        </button>
      </li>
    </ul>

    <button
      v-if="selectedFiles.length"
      type="button"
      class="save-files-button"
      :disabled="saving"
      @click="saveFiles"
    >
      {{ saving ? 'Menyimpan...' : `Simpan ${selectedFiles.length} lampiran ke folder` }}
    </button>

    <div v-if="attachments.length" class="folder-file-list">
      <div v-for="attachment in attachments" :key="attachment.id" class="folder-file">
        <a
          class="folder-file-link"
          :href="attachment.url"
          :download="attachment.isImage ? null : attachment.name"
          :target="attachment.isImage ? '_blank' : null"
          :rel="attachment.isImage ? 'noreferrer' : null"
        >
          <img v-if="attachment.isImage" :src="attachment.url" :alt="attachment.name" />
          <span class="file-type" aria-hidden="true">
            {{ attachment.isImage ? 'IMG' : 'FILE' }}
          </span>
          <span class="file-name">{{ attachment.name }}</span>
        </a>
        <button
          type="button"
          class="remove-attachment"
          :aria-label="`Hapus ${attachment.name} dari folder`"
          @click="removeAttachment(attachment.id)"
        >
          ×
        </button>
      </div>
    </div>
    <p v-else-if="!selectedFiles.length" class="empty-files">
      Belum ada lampiran di folder ini. Tambahkan foto atau file di atas.
    </p>
    <p v-if="errorMessage" class="folder-files-error" role="alert">{{ errorMessage }}</p>
  </section>
</template>

<style scoped>
.folder-files {
  margin: -10px 0 22px;
  padding: 16px;
  border: 1px solid #e8ede7;
  border-radius: 14px;
  background: #fff;
}

.folder-files-heading {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.files-eyebrow {
  margin: 0 0 3px;
  color: #94a198;
  font-size: 9px;
  font-weight: 800;
  letter-spacing: 0.15em;
}

h2 {
  margin: 0;
  color: #34443d;
  font-family: Georgia, 'Times New Roman', serif;
  font-size: 16px;
  font-weight: 600;
}

.upload-actions {
  display: flex;
  gap: 6px;
}

.upload-button {
  min-height: 32px;
  padding: 0 10px;
  border: 1px solid #dfe6df;
  border-radius: 9px;
  background: #f7f9f5;
  color: #456554;
  font-size: 11px;
  font-weight: 700;
}

.upload-button:hover {
  border-color: #c9d8cd;
  background: #edf3ed;
}

.upload-button:disabled,
.selected-files button:disabled {
  cursor: wait;
  opacity: 0.6;
}

.file-input {
  display: none;
}

.selected-files,
.folder-file-list {
  display: grid;
  gap: 6px;
  margin: 12px 0 0;
  padding: 0;
  list-style: none;
}

.selected-files li,
.folder-file {
  min-width: 0;
  min-height: 42px;
  display: flex;
  align-items: center;
  gap: 9px;
  padding: 5px 8px;
  border: 1px solid #edf0eb;
  border-radius: 9px;
  background: #fafbf8;
  color: #405048;
  font-size: 12px;
}

.selected-files li > span,
.file-name {
  min-width: 0;
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.selected-files small {
  color: #9aa59f;
  font-size: 10px;
}

.selected-files button,
.remove-attachment {
  width: 25px;
  height: 25px;
  flex: 0 0 25px;
  border: 0;
  border-radius: 7px;
  background: transparent;
  color: #9aa59f;
  font-size: 17px;
}

.selected-files button:hover,
.remove-attachment:hover {
  background: #f5eaea;
  color: #a65353;
}

.save-files-button {
  min-height: 34px;
  margin-top: 9px;
  padding: 0 11px;
  border: 0;
  border-radius: 9px;
  background: #315a49;
  color: #fff;
  font-size: 11px;
  font-weight: 750;
}

.save-files-button:disabled {
  cursor: wait;
  opacity: 0.65;
}

.folder-file {
  min-width: 0;
  display: flex;
  align-items: center;
  gap: 9px;
  text-decoration: none;
}

.folder-file-link {
  min-width: 0;
  flex: 1;
  display: flex;
  align-items: center;
  gap: 9px;
  color: inherit;
  text-decoration: none;
}

.folder-file:hover {
  border-color: #c9d8cd;
}

.folder-file img {
  width: 30px;
  height: 30px;
  flex: 0 0 30px;
  border-radius: 6px;
  object-fit: cover;
}

.file-type {
  flex: 0 0 auto;
  padding: 5px 6px;
  border-radius: 6px;
  background: #edf3ed;
  color: #547361;
  font-size: 9px;
  font-weight: 800;
}

.empty-files {
  margin: 12px 0 0;
  color: #97a39d;
  font-size: 12px;
}

.folder-files-error {
  margin: 10px 0 0;
  color: #a65353;
  font-size: 12px;
}

@media (max-width: 420px) {
  .folder-files {
    padding: 13px;
  }

  .folder-files-heading {
    align-items: flex-start;
  }

  .upload-actions {
    flex-wrap: wrap;
    justify-content: flex-end;
  }
}
</style>
