<script setup>
import { ref } from 'vue'

const props = defineProps({
  folders: { type: Array, required: true },
  activeFolderId: { type: [Number, String], default: null },
})
const emit = defineEmits(['select', 'create', 'rename', 'remove'])

const creating = ref(false)
const newFolderName = ref('')
const editingId = ref(null)
const editingName = ref('')
const confirmingDeleteId = ref(null)
const errorMessage = ref('')

function isSelected(id) {
  return props.activeFolderId === id
}

function startCreating() {
  creating.value = true
  newFolderName.value = ''
  editingId.value = null
  confirmingDeleteId.value = null
  errorMessage.value = ''
}

function startEditing(folder) {
  editingId.value = folder.id
  editingName.value = folder.name
  creating.value = false
  confirmingDeleteId.value = null
  errorMessage.value = ''
}

function saveFolder() {
  const name = (creating.value ? newFolderName.value : editingName.value).trim()
  if (!name) {
    errorMessage.value = 'Nama folder tidak boleh kosong.'
    return
  }

  const duplicate = props.folders.some(
    (folder) =>
      folder.id !== editingId.value && folder.name.toLocaleLowerCase() === name.toLocaleLowerCase(),
  )
  if (duplicate) {
    errorMessage.value = 'Nama folder sudah digunakan.'
    return
  }

  if (creating.value) emit('create', name)
  else emit('rename', { id: editingId.value, name })

  creating.value = false
  editingId.value = null
  errorMessage.value = ''
}

function removeFolder(id) {
  emit('remove', id)
  confirmingDeleteId.value = null
}
</script>

<template>
  <section class="folder-manager" aria-label="Pengelompokan folder">
    <div class="folder-heading">
      <div>
        <p class="folder-eyebrow">RUANG KERJA</p>
        <h2>Folder tugas</h2>
      </div>
      <button type="button" class="new-folder-button" @click="startCreating">
        <span aria-hidden="true">＋</span> Folder baru
      </button>
    </div>

    <div class="folder-list" aria-label="Filter folder">
      <button
        type="button"
        class="folder-chip"
        :class="{ selected: isSelected(null) }"
        :aria-pressed="isSelected(null)"
        @click="emit('select', null)"
      >
        Semua tugas
      </button>
      <button
        type="button"
        class="folder-chip"
        :class="{ selected: isSelected('unassigned') }"
        :aria-pressed="isSelected('unassigned')"
        @click="emit('select', 'unassigned')"
      >
        Tanpa folder
      </button>

      <div v-for="folder in folders" :key="folder.id" class="folder-entry">
        <button
          type="button"
          class="folder-chip folder-name"
          :class="{ selected: isSelected(folder.id) }"
          :aria-pressed="isSelected(folder.id)"
          @click="emit('select', folder.id)"
        >
          <span class="folder-dot" aria-hidden="true"></span>
          {{ folder.name }}
        </button>
        <button
          type="button"
          class="folder-action"
          :aria-label="`Ubah nama folder ${folder.name}`"
          @click="startEditing(folder)"
        >
          ✎
        </button>
        <button
          type="button"
          class="folder-action delete-folder-action"
          :aria-label="`Hapus folder ${folder.name}`"
          @click="
            confirmingDeleteId = confirmingDeleteId === folder.id ? null : folder.id;
            editingId = null;
            creating = false;
            errorMessage = ''
          "
        >
          ×
        </button>
      </div>
    </div>

    <form v-if="creating || editingId !== null" class="folder-form" @submit.prevent="saveFolder">
      <label class="sr-only" for="folder-name">
        {{ creating ? 'Nama folder baru' : 'Nama folder' }}
      </label>
      <input
        v-if="creating"
        id="folder-name"
        v-model="newFolderName"
        type="text"
        placeholder="Contoh: Matematika"
        maxlength="40"
        required
      />
      <input
        v-else
        id="folder-name"
        v-model="editingName"
        type="text"
        placeholder="Nama folder"
        maxlength="40"
        required
      />
      <button type="submit" class="save-folder-button">Simpan</button>
      <button
        type="button"
        class="cancel-folder-button"
        @click="creating = false; editingId = null; errorMessage = ''"
      >
        Batal
      </button>
    </form>

    <div v-if="confirmingDeleteId !== null" class="delete-confirmation" role="group">
      <span>Hapus folder dan lampirannya? Tugas di dalamnya tetap tersimpan.</span>
      <button type="button" @click="removeFolder(confirmingDeleteId)">Hapus folder</button>
      <button type="button" @click="confirmingDeleteId = null">Batal</button>
    </div>

    <p v-if="errorMessage" class="folder-error" role="alert">{{ errorMessage }}</p>
  </section>
</template>

<style scoped>
.folder-manager {
  margin-bottom: 24px;
  padding: 18px 18px 16px;
  border: 1px solid #e8ede7;
  border-radius: 16px;
  background: #f8faf6;
}

.folder-heading {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 13px;
}

.folder-eyebrow {
  margin: 0 0 3px;
  color: #94a198;
  font-size: 9px;
  font-weight: 800;
  letter-spacing: 0.15em;
}

h2 {
  margin: 0;
  color: #2f4037;
  font-family: Georgia, 'Times New Roman', serif;
  font-size: 18px;
  font-weight: 600;
}

.new-folder-button,
.save-folder-button {
  border: 0;
  border-radius: 9px;
  background: #315a49;
  color: #fff;
  font-size: 11px;
  font-weight: 750;
}

.new-folder-button {
  min-height: 34px;
  padding: 0 11px;
}

.new-folder-button span {
  margin-right: 2px;
  font-size: 15px;
}

.folder-list {
  display: flex;
  flex-wrap: wrap;
  gap: 7px;
}

.folder-chip {
  min-height: 32px;
  padding: 0 11px;
  border: 1px solid #e1e8e0;
  border-radius: 999px;
  background: #fff;
  color: #77857c;
  font-size: 11px;
  font-weight: 700;
  white-space: nowrap;
}

.folder-chip:hover,
.folder-chip.selected {
  border-color: #cbd9ce;
  background: #eaf1ea;
  color: #3e6452;
}

.folder-entry {
  display: inline-flex;
  align-items: center;
  gap: 2px;
  padding: 2px;
  border: 1px solid #e1e8e0;
  border-radius: 999px;
  background: #fff;
}

.folder-name {
  min-height: 28px;
  padding-inline: 9px;
  border-color: transparent;
}

.folder-dot {
  width: 7px;
  height: 7px;
  display: inline-block;
  margin-right: 4px;
  border-radius: 2px;
  background: #93aa9a;
  vertical-align: 1px;
}

.folder-action {
  width: 25px;
  height: 25px;
  border: 0;
  border-radius: 50%;
  background: transparent;
  color: #97a39a;
  font-size: 14px;
  line-height: 1;
}

.folder-action:hover {
  background: #edf2ec;
  color: #456554;
}

.delete-folder-action:hover {
  background: #f5eaea;
  color: #a65353;
}

.folder-form {
  display: flex;
  gap: 7px;
  margin-top: 12px;
}

.folder-form input {
  min-width: 0;
  flex: 1;
  height: 36px;
  padding: 0 11px;
  border: 1px solid #dce3dc;
  border-radius: 9px;
  background: #fff;
  color: #27352f;
  font: inherit;
  font-size: 12px;
}

.save-folder-button,
.cancel-folder-button {
  padding: 0 12px;
}

.cancel-folder-button {
  border: 1px solid #e1e8e0;
  border-radius: 9px;
  background: #fff;
  color: #718078;
  font-size: 11px;
  font-weight: 700;
}

.delete-confirmation {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 12px;
  color: #8d5b55;
  font-size: 11px;
}

.delete-confirmation button {
  border: 0;
  background: transparent;
  color: #a65353;
  font: inherit;
  font-weight: 750;
  text-decoration: underline;
}

.folder-error {
  margin: 8px 0 0;
  color: #a65353;
  font-size: 11px;
}

.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  clip-path: inset(50%);
}

@media (max-width: 420px) {
  .folder-manager {
    padding: 15px 13px;
  }

  .folder-heading {
    align-items: flex-start;
  }
}
</style>
