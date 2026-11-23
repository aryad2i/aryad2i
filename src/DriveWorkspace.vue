<script setup>
import { computed, onBeforeUnmount, ref, watch } from 'vue'
import {
  deleteFolderAttachment,
  deleteFolderAttachmentsInFolders,
  getFolderAttachment,
  moveFolderAttachment,
  ROOT_FOLDER_ID,
  saveFolderAttachments,
} from './attachments'

const FOLDERS_KEY = 'todo-kuliah-folders'
const ROOT_FILES_KEY = 'todo-kuliah-root-files'

function readList(key) {
  try {
    const value = JSON.parse(localStorage.getItem(key))
    return Array.isArray(value) ? value : []
  } catch {
    return []
  }
}

const folders = ref(
  readList(FOLDERS_KEY).map((folder) => {
    const existingFiles = Array.isArray(folder.files) ? folder.files : folder.attachments || []
    return {
      ...folder,
      parentId: folder.parentId ?? null,
      files: existingFiles.map((file) => ({ ...file, folderId: folder.id })),
    }
  }),
)
const rootFiles = ref(readList(ROOT_FILES_KEY).map((file) => ({ ...file, folderId: null })))
const currentFolderId = ref(null)
const searchQuery = ref('')
const errorMessage = ref('')
const uploading = ref(false)
const uploadInput = ref(null)
const activeMenu = ref('')
const dialog = ref(null)
const dialogName = ref('')
const dialogDestination = ref(ROOT_FOLDER_ID)
const dialogBusy = ref(false)
const preview = ref(null)
const previewUrl = ref('')

function formatFileSize(size = 0) {
  if (size < 1024) return `${size} B`
  if (size < 1024 * 1024) return `${Math.round(size / 1024)} KB`
  if (size < 1024 * 1024 * 1024) return `${(size / (1024 * 1024)).toFixed(1)} MB`
  return `${(size / (1024 * 1024 * 1024)).toFixed(1)} GB`
}

const currentFolder = computed(
  () => folders.value.find((folder) => folder.id === currentFolderId.value) || null,
)

const allFiles = computed(() => [
  ...rootFiles.value,
  ...folders.value.flatMap((folder) => folder.files),
])

const totalFileCount = computed(() => allFiles.value.length)

const breadcrumbs = computed(() => {
  const path = []
  let folder = currentFolder.value
  while (folder) {
    path.unshift(folder)
    folder = folders.value.find((item) => item.id === folder.parentId) || null
  }
  return path
})

const folderTree = computed(() => {
  function collect(parentId, depth, ancestors) {
    return folders.value
      .filter((folder) => folder.parentId === parentId && !ancestors.has(folder.id))
      .flatMap((folder) => [
        { ...folder, depth },
        ...collect(folder.id, depth + 1, new Set([...ancestors, folder.id])),
      ])
  }
  return collect(null, 0, new Set())
})

const isSearching = computed(() => searchQuery.value.trim().length > 0)

const visibleFolders = computed(() => {
  if (isSearching.value) {
    const query = searchQuery.value.trim().toLocaleLowerCase()
    return folders.value.filter((folder) => folder.name.toLocaleLowerCase().includes(query))
  }
  return folders.value.filter((folder) => folder.parentId === currentFolderId.value)
})

const visibleFiles = computed(() => {
  if (isSearching.value) {
    const query = searchQuery.value.trim().toLocaleLowerCase()
    return allFiles.value.filter((file) => file.name.toLocaleLowerCase().includes(query))
  }
  return currentFolder.value?.files || rootFiles.value
})

const dialogFolders = computed(() => {
  if (dialog.value?.type !== 'move-folder') return folderTree.value
  const excludedIds = new Set(getFolderSubtreeIds(dialog.value.item.id))
  return folderTree.value.filter((folder) => !excludedIds.has(folder.id))
})

const dialogTitle = computed(() => {
  if (!dialog.value) return ''
  const { type, item } = dialog.value
  if (type === 'new-folder') return 'Buat folder baru'
  if (type === 'rename-folder' || type === 'rename-file') {
    return type === 'rename-folder' ? 'Ubah nama folder' : 'Ubah nama file'
  }
  if (type === 'move-folder' || type === 'move-file') return 'Pindahkan ke'
  return type === 'delete-folder'
    ? `Hapus folder "${item.name}"?`
    : `Hapus file "${item.name}"?`
})

watch(
  folders,
  (value) => localStorage.setItem(FOLDERS_KEY, JSON.stringify(value)),
  { deep: true },
)
watch(
  rootFiles,
  (value) => localStorage.setItem(ROOT_FILES_KEY, JSON.stringify(value)),
  { deep: true },
)

function getFolderSubtreeIds(folderId) {
  const descendants = [folderId]
  for (const child of folders.value.filter((folder) => folder.parentId === folderId)) {
    descendants.push(...getFolderSubtreeIds(child.id))
  }
  return descendants
}

function getFolderPath(folderId) {
  const path = []
  let folder = folders.value.find((item) => item.id === folderId) || null
  while (folder) {
    path.unshift(folder)
    folder = folders.value.find((item) => item.id === folder.parentId) || null
  }
  return path
}

function folderLocation(folderId) {
  const path = getFolderPath(folderId)
  return path.length ? `Drive Kuliah / ${path.map((folder) => folder.name).join(' / ')}` : 'Drive Kuliah'
}

function openFolder(folderId) {
  currentFolderId.value = folderId
  searchQuery.value = ''
  activeMenu.value = ''
}

function openNewFolder() {
  dialog.value = { type: 'new-folder' }
  dialogName.value = ''
  activeMenu.value = ''
}

function openRenameFolder(folder) {
  dialog.value = { type: 'rename-folder', item: folder }
  dialogName.value = folder.name
  activeMenu.value = ''
}

function openRenameFile(file) {
  dialog.value = { type: 'rename-file', item: file }
  dialogName.value = file.name
  activeMenu.value = ''
}

function openMove(item, type) {
  const currentParentId = type === 'folder' ? item.parentId : item.folderId
  dialog.value = { type: `move-${type}`, item }
  dialogDestination.value = currentParentId || ROOT_FOLDER_ID
  activeMenu.value = ''
}

function openDelete(item, type) {
  dialog.value = { type: `delete-${type}`, item }
  activeMenu.value = ''
}

function closeDialog() {
  if (dialogBusy.value) return
  dialog.value = null
  dialogName.value = ''
}

function getFileList(folderId) {
  if (folderId === null) return rootFiles.value
  return folders.value.find((folder) => folder.id === folderId)?.files || null
}

function removeFileMetadata(file) {
  const files = getFileList(file.folderId)
  if (!files) return
  const index = files.findIndex((item) => item.id === file.id)
  if (index >= 0) files.splice(index, 1)
}

async function uploadFiles(event) {
  const files = Array.from(event.target.files || [])
  event.target.value = ''
  if (!files.length) return

  uploading.value = true
  errorMessage.value = ''
  const destinationId = currentFolderId.value
  try {
    const storedFiles = await saveFolderAttachments(destinationId ?? ROOT_FOLDER_ID, files)
    const metadata = storedFiles.map((file) => ({ ...file, folderId: destinationId }))
    const target = getFileList(destinationId)
    if (!target) {
      await Promise.all(storedFiles.map((file) => deleteFolderAttachment(file.id)))
      throw new Error('Folder tujuan tidak tersedia.')
    }
    target.push(...metadata)
  } catch (error) {
    console.error('Gagal mengunggah file.', error)
    errorMessage.value = 'Upload gagal. Coba pilih file kembali.'
  } finally {
    uploading.value = false
  }
}

function openUploadPicker() {
  uploadInput.value?.click()
}

async function openFile(file) {
  errorMessage.value = ''
  try {
    const blob = await getFolderAttachment(file.id)
    if (!blob) throw new Error('File tidak ditemukan di penyimpanan browser.')
    if (previewUrl.value) URL.revokeObjectURL(previewUrl.value)
    previewUrl.value = URL.createObjectURL(blob)
    preview.value = {
      ...file,
      url: previewUrl.value,
      isImage: blob.type.startsWith('image/'),
      isPdf: blob.type === 'application/pdf',
    }
  } catch (error) {
    console.error('Gagal membuka file.', error)
    errorMessage.value = 'File tidak dapat dibuka. Coba unduh kembali atau unggah ulang.'
  }
}

function closePreview() {
  if (previewUrl.value) URL.revokeObjectURL(previewUrl.value)
  previewUrl.value = ''
  preview.value = null
}

async function submitDialog() {
  if (!dialog.value || dialogBusy.value) return
  const { type, item } = dialog.value
  const name = dialogName.value.trim()

  if (type === 'new-folder' || type === 'rename-folder' || type === 'rename-file') {
    if (!name) return
    if (type === 'new-folder') {
      folders.value.push({
        id: crypto.randomUUID(),
        name,
        parentId: currentFolderId.value,
        files: [],
      })
    } else if (type === 'rename-folder') {
      item.name = name
    } else {
      const file = allFiles.value.find((entry) => entry.id === item.id)
      if (file) file.name = name
    }
    closeDialog()
    return
  }

  if (type === 'move-folder') {
    const destinationId = dialogDestination.value === ROOT_FOLDER_ID ? null : dialogDestination.value
    item.parentId = destinationId
    closeDialog()
    return
  }

  if (type === 'move-file') {
    const destinationId =
      dialogDestination.value === ROOT_FOLDER_ID ? null : dialogDestination.value
    if (destinationId === item.folderId) {
      closeDialog()
      return
    }
    dialogBusy.value = true
    errorMessage.value = ''
    try {
      await moveFolderAttachment(item.id, destinationId ?? ROOT_FOLDER_ID)
      removeFileMetadata(item)
      const destination = getFileList(destinationId)
      if (!destination) throw new Error('Folder tujuan tidak tersedia.')
      destination.push({ ...item, folderId: destinationId })
      dialog.value = null
    } catch (error) {
      console.error('Gagal memindahkan file.', error)
      errorMessage.value = 'File gagal dipindahkan. Coba lagi.'
    } finally {
      dialogBusy.value = false
    }
    return
  }

  if (type === 'delete-file') {
    dialogBusy.value = true
    errorMessage.value = ''
    try {
      await deleteFolderAttachment(item.id)
      removeFileMetadata(item)
      dialog.value = null
    } catch (error) {
      console.error('Gagal menghapus file.', error)
      errorMessage.value = 'File gagal dihapus. Coba lagi.'
    } finally {
      dialogBusy.value = false
    }
    return
  }

  if (type === 'delete-folder') {
    dialogBusy.value = true
    errorMessage.value = ''
    const folderIds = getFolderSubtreeIds(item.id)
    try {
      await deleteFolderAttachmentsInFolders(folderIds)
      folders.value = folders.value.filter((folder) => !folderIds.includes(folder.id))
      if (folderIds.includes(currentFolderId.value)) {
        currentFolderId.value = item.parentId
      }
      dialog.value = null
    } catch (error) {
      console.error('Gagal menghapus folder dan isinya.', error)
      errorMessage.value = 'Folder gagal dihapus. Coba lagi.'
    } finally {
      dialogBusy.value = false
    }
  }
}

onBeforeUnmount(() => {
  if (previewUrl.value) URL.revokeObjectURL(previewUrl.value)
})
</script>

<template>
  <main class="drive-app">
    <aside class="sidebar">
      <a class="brand" href="#" @click.prevent="openFolder(null)">
        <span class="brand-mark" aria-hidden="true">D</span>
        <span>Drive Kuliah</span>
      </a>

      <button class="create-button" type="button" @click="openNewFolder">
        <span aria-hidden="true">＋</span> Baru
      </button>

      <nav class="navigation" aria-label="Navigasi drive">
        <button
          type="button"
          class="navigation-item"
          :class="{ active: currentFolderId === null && !isSearching }"
          @click="openFolder(null)"
        >
          <span aria-hidden="true">▦</span> Drive saya
        </button>
      </nav>

      <div class="sidebar-heading">Folder</div>
      <nav class="folder-tree" aria-label="Daftar folder">
        <button
          v-for="folder in folderTree"
          :key="folder.id"
          type="button"
          class="tree-item"
          :class="{ active: currentFolderId === folder.id }"
          :style="{ paddingLeft: `${14 + folder.depth * 15}px` }"
          :title="folder.name"
          @click="openFolder(folder.id)"
        >
          <span aria-hidden="true">▰</span>
          <span>{{ folder.name }}</span>
        </button>
        <p v-if="!folderTree.length" class="no-folders">Folder yang dibuat akan tampil di sini.</p>
      </nav>

      <div class="sidebar-storage">
        <span class="storage-icon" aria-hidden="true">◉</span>
        <div>
          <strong>{{ totalFileCount }} file</strong>
          <small>Tersimpan di browser ini</small>
        </div>
      </div>
    </aside>

    <section class="workspace">
      <header class="topbar">
        <label class="search-box">
          <span aria-hidden="true">⌕</span>
          <input v-model="searchQuery" type="search" placeholder="Cari file dan folder" />
          <button
            v-if="searchQuery"
            type="button"
            aria-label="Hapus pencarian"
            @click="searchQuery = ''"
          >
            ×
          </button>
        </label>
        <div class="profile-badge" title="Penyimpanan lokal">AK</div>
      </header>

      <div class="content">
        <div class="content-toolbar">
          <nav class="breadcrumbs" aria-label="Lokasi folder">
            <button type="button" @click="openFolder(null)">Drive saya</button>
            <template v-for="folder in breadcrumbs" :key="folder.id">
              <span aria-hidden="true">›</span>
              <button type="button" @click="openFolder(folder.id)">{{ folder.name }}</button>
            </template>
          </nav>
          <div class="toolbar-actions">
            <button type="button" class="toolbar-button" @click="openNewFolder">
              <span aria-hidden="true">▰</span> Folder baru
            </button>
            <button
              type="button"
              class="toolbar-button primary"
              :disabled="uploading"
              @click="openUploadPicker"
            >
              <span aria-hidden="true">↑</span> {{ uploading ? 'Mengunggah...' : 'Upload file' }}
            </button>
            <input
              ref="uploadInput"
              class="hidden-input"
              type="file"
              multiple
              @change="uploadFiles"
            />
          </div>
        </div>

        <div class="heading-row">
          <div>
            <h1>{{ isSearching ? 'Hasil pencarian' : currentFolder?.name || 'Drive saya' }}</h1>
            <p>
              {{ isSearching ? `Pencarian untuk “${searchQuery}”` : 'Kelola folder, foto, dan file kuliah' }}
            </p>
          </div>
          <span class="item-count">{{ visibleFolders.length + visibleFiles.length }} item</span>
        </div>

        <p v-if="errorMessage" class="error-banner" role="alert">{{ errorMessage }}</p>

        <section v-if="visibleFolders.length" class="items-section">
          <h2>Folder</h2>
          <div class="item-grid">
            <article v-for="folder in visibleFolders" :key="folder.id" class="drive-card">
              <button class="card-main" type="button" @click="openFolder(folder.id)">
                <span class="item-icon folder-icon" aria-hidden="true">▰</span>
                <span class="item-copy">
                  <strong>{{ folder.name }}</strong>
                  <small v-if="isSearching">{{ folderLocation(folder.parentId) }}</small>
                  <small v-else>{{ folder.files.length }} file · {{ folders.filter((child) => child.parentId === folder.id).length }} folder</small>
                </span>
              </button>
              <button
                type="button"
                class="more-button"
                :aria-label="`Opsi folder ${folder.name}`"
                @click="activeMenu = activeMenu === `folder:${folder.id}` ? '' : `folder:${folder.id}`"
              >
                ⋮
              </button>
              <div v-if="activeMenu === `folder:${folder.id}`" class="item-menu">
                <button type="button" @click="openRenameFolder(folder)">Ubah nama</button>
                <button type="button" @click="openMove(folder, 'folder')">Pindahkan</button>
                <button type="button" class="danger" @click="openDelete(folder, 'folder')">
                  Hapus folder
                </button>
              </div>
            </article>
          </div>
        </section>

        <section v-if="visibleFiles.length" class="items-section">
          <h2>File</h2>
          <div class="item-grid">
            <article v-for="file in visibleFiles" :key="file.id" class="drive-card">
              <button class="card-main" type="button" @click="openFile(file)">
                <span class="item-icon file-icon" :class="{ image: file.type?.startsWith('image/') }">
                  {{ file.type?.startsWith('image/') ? '▧' : file.type === 'application/pdf' ? 'PDF' : 'FILE' }}
                </span>
                <span class="item-copy">
                  <strong>{{ file.name }}</strong>
                  <small v-if="isSearching">{{ folderLocation(file.folderId) }}</small>
                  <small v-else>{{ formatFileSize(file.size) }}</small>
                </span>
              </button>
              <button
                type="button"
                class="more-button"
                :aria-label="`Opsi file ${file.name}`"
                @click="activeMenu = activeMenu === `file:${file.id}` ? '' : `file:${file.id}`"
              >
                ⋮
              </button>
              <div v-if="activeMenu === `file:${file.id}`" class="item-menu">
                <button type="button" @click="openRenameFile(file)">Ubah nama</button>
                <button type="button" @click="openMove(file, 'file')">Pindahkan</button>
                <button type="button" class="danger" @click="openDelete(file, 'file')">
                  Hapus file
                </button>
              </div>
            </article>
          </div>
        </section>

        <div v-if="!visibleFolders.length && !visibleFiles.length" class="empty-state">
          <div class="empty-icon" aria-hidden="true">{{ isSearching ? '⌕' : '▱' }}</div>
          <h2>{{ isSearching ? 'Tidak ada hasil' : 'Folder ini masih kosong' }}</h2>
          <p>
            {{
              isSearching
                ? 'Coba kata kunci lain.'
                : 'Buat folder baru atau upload foto dan file untuk mulai mengatur materi kuliah.'
            }}
          </p>
          <div v-if="!isSearching" class="empty-actions">
            <button type="button" @click="openNewFolder">Buat folder</button>
            <button type="button" class="primary" @click="openUploadPicker">Upload file</button>
          </div>
        </div>
      </div>
    </section>

    <div v-if="dialog" class="modal-backdrop" @click.self="closeDialog">
      <section
        class="dialog"
        role="dialog"
        aria-modal="true"
        :aria-label="dialogTitle"
        @keydown.esc="closeDialog"
      >
        <template v-if="['new-folder', 'rename-folder', 'rename-file'].includes(dialog.type)">
          <form @submit.prevent="submitDialog">
            <div class="dialog-heading">
              <h2>{{ dialogTitle }}</h2>
              <button type="button" aria-label="Tutup" @click="closeDialog">×</button>
            </div>
            <label for="dialog-name">{{ dialog.type === 'new-folder' ? 'Nama folder' : 'Nama' }}</label>
            <input
              id="dialog-name"
              v-model="dialogName"
              type="text"
              maxlength="120"
              required
              autofocus
            />
            <div class="dialog-actions">
              <button type="button" class="secondary" @click="closeDialog">Batal</button>
              <button type="submit" class="primary">Simpan</button>
            </div>
          </form>
        </template>

        <template v-else-if="dialog.type === 'move-folder' || dialog.type === 'move-file'">
          <form @submit.prevent="submitDialog">
            <div class="dialog-heading">
              <h2>{{ dialogTitle }}</h2>
              <button type="button" aria-label="Tutup" @click="closeDialog">×</button>
            </div>
            <label for="destination">Pilih folder tujuan</label>
            <select id="destination" v-model="dialogDestination">
              <option :value="ROOT_FOLDER_ID">Drive saya</option>
              <option v-for="folder in dialogFolders" :key="folder.id" :value="folder.id">
                {{ '　'.repeat(folder.depth) }}{{ folder.name }}
              </option>
            </select>
            <div class="dialog-actions">
              <button type="button" class="secondary" :disabled="dialogBusy" @click="closeDialog">
                Batal
              </button>
              <button type="submit" class="primary" :disabled="dialogBusy">
                {{ dialogBusy ? 'Memindahkan...' : 'Pindahkan' }}
              </button>
            </div>
          </form>
        </template>

        <template v-else>
          <div class="dialog-heading">
            <h2>{{ dialogTitle }}</h2>
            <button type="button" aria-label="Tutup" @click="closeDialog">×</button>
          </div>
          <p class="delete-warning">
            {{
              dialog.type === 'delete-folder'
                ? 'Folder, subfolder, dan seluruh file di dalamnya akan dihapus permanen.'
                : 'File ini akan dihapus permanen dari penyimpanan browser.'
            }}
          </p>
          <div class="dialog-actions">
            <button type="button" class="secondary" :disabled="dialogBusy" @click="closeDialog">
              Batal
            </button>
            <button type="button" class="danger-button" :disabled="dialogBusy" @click="submitDialog">
              {{ dialogBusy ? 'Menghapus...' : 'Hapus permanen' }}
            </button>
          </div>
        </template>
      </section>
    </div>

    <div v-if="preview" class="modal-backdrop preview-backdrop" @click.self="closePreview">
      <section class="preview-dialog" role="dialog" aria-modal="true" :aria-label="preview.name">
        <header class="preview-header">
          <strong>{{ preview.name }}</strong>
          <div>
            <a :href="preview.url" :download="preview.name">Unduh</a>
            <button type="button" aria-label="Tutup pratinjau" @click="closePreview">×</button>
          </div>
        </header>
        <img v-if="preview.isImage" class="preview-image" :src="preview.url" :alt="preview.name" />
        <iframe v-else-if="preview.isPdf" class="preview-pdf" :src="preview.url" :title="preview.name" />
        <div v-else class="preview-other">
          <span class="item-icon file-icon" aria-hidden="true">FILE</span>
          <p>Pratinjau tidak tersedia untuk tipe file ini.</p>
          <a :href="preview.url" :download="preview.name">Unduh file</a>
        </div>
      </section>
    </div>
  </main>
</template>

<style scoped>
.drive-app {
  min-height: 100vh;
  display: flex;
  background: #f7f8fa;
  color: #29352f;
  font-family: Inter, "Segoe UI", system-ui, sans-serif;
}

.sidebar {
  width: 250px;
  min-width: 250px;
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  padding: 18px 12px 14px;
  border-right: 1px solid #e8ece8;
  background: #fbfcfa;
}

.brand {
  height: 45px;
  display: flex;
  align-items: center;
  gap: 11px;
  padding: 0 11px;
  color: #31483b;
  font-family: Georgia, 'Times New Roman', serif;
  font-size: 19px;
  font-weight: 700;
  text-decoration: none;
}

.brand-mark {
  width: 31px;
  height: 31px;
  display: grid;
  place-items: center;
  border-radius: 10px;
  background: #315a49;
  color: #fff;
  font-family: Inter, "Segoe UI", sans-serif;
  font-size: 16px;
}

.create-button {
  width: max-content;
  min-height: 46px;
  display: flex;
  align-items: center;
  gap: 8px;
  margin: 20px 0 23px 4px;
  padding: 0 17px;
  border: 1px solid #e5e9e4;
  border-radius: 14px;
  background: #fff;
  color: #395c4a;
  font-size: 13px;
  font-weight: 750;
  box-shadow: 0 2px 6px rgba(34, 55, 43, 0.08);
}

.create-button span {
  font-size: 20px;
  font-weight: 400;
}

.navigation {
  display: grid;
  gap: 4px;
}

.navigation-item,
.tree-item {
  min-height: 38px;
  width: 100%;
  display: flex;
  align-items: center;
  gap: 11px;
  overflow: hidden;
  padding: 0 14px;
  border: 0;
  border-radius: 999px;
  background: transparent;
  color: #64736a;
  font-size: 12px;
  text-align: left;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.navigation-item span {
  font-size: 16px;
}

.navigation-item.active,
.tree-item.active {
  background: #e9f1eb;
  color: #315a49;
  font-weight: 750;
}

.sidebar-heading {
  margin: 24px 12px 8px;
  color: #94a198;
  font-size: 10px;
  font-weight: 800;
  letter-spacing: 0.12em;
  text-transform: uppercase;
}

.folder-tree {
  display: grid;
  align-content: start;
  gap: 2px;
  overflow-y: auto;
}

.tree-item {
  gap: 9px;
  border-radius: 8px;
  padding-right: 10px;
}

.tree-item span:first-child {
  flex: 0 0 auto;
  color: #81968a;
}

.tree-item span:last-child {
  overflow: hidden;
  text-overflow: ellipsis;
}

.no-folders {
  margin: 2px 12px;
  color: #a0aaa3;
  font-size: 11px;
  line-height: 1.5;
}

.sidebar-storage {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-top: auto;
  padding: 14px 8px 0;
  border-top: 1px solid #e8ece8;
}

.storage-icon {
  color: #719182;
  font-size: 18px;
}

.sidebar-storage strong,
.sidebar-storage small {
  display: block;
}

.sidebar-storage strong {
  color: #53645a;
  font-size: 11px;
}

.sidebar-storage small {
  margin-top: 3px;
  color: #a0aaa3;
  font-size: 9px;
}

.workspace {
  min-width: 0;
  flex: 1;
}

.topbar {
  height: 74px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 18px;
  padding: 0 34px;
  border-bottom: 1px solid #e9ece9;
  background: rgba(255, 255, 255, 0.72);
}

.search-box {
  width: min(620px, 100%);
  height: 43px;
  display: flex;
  align-items: center;
  gap: 11px;
  padding: 0 14px;
  border: 1px solid transparent;
  border-radius: 13px;
  background: #eff2ef;
  color: #758279;
  transition: background 160ms ease, box-shadow 160ms ease;
}

.search-box:focus-within {
  background: #fff;
  box-shadow: 0 0 0 2px #cddbd1;
}

.search-box > span {
  font-size: 23px;
}

.search-box input {
  min-width: 0;
  flex: 1;
  border: 0;
  outline: 0;
  background: transparent;
  color: #34443d;
  font: inherit;
  font-size: 13px;
}

.search-box button {
  border: 0;
  background: transparent;
  color: #718078;
  font-size: 19px;
}

.profile-badge {
  width: 34px;
  height: 34px;
  display: grid;
  place-items: center;
  border: 2px solid #dfe9e1;
  border-radius: 50%;
  background: #719182;
  color: #fff;
  font-size: 10px;
  font-weight: 800;
}

.content {
  max-width: 1240px;
  margin: 0 auto;
  padding: 25px 34px 50px;
}

.content-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 27px;
}

.breadcrumbs {
  min-width: 0;
  display: flex;
  align-items: center;
  gap: 8px;
  overflow: hidden;
  color: #a0aaa3;
  font-size: 12px;
  white-space: nowrap;
}

.breadcrumbs button {
  max-width: 190px;
  overflow: hidden;
  padding: 4px 0;
  border: 0;
  background: transparent;
  color: #66776c;
  font: inherit;
  text-overflow: ellipsis;
}

.breadcrumbs button:last-child {
  color: #34443d;
  font-weight: 750;
}

.toolbar-actions {
  display: flex;
  flex: 0 0 auto;
  gap: 8px;
}

.toolbar-button {
  min-height: 37px;
  display: flex;
  align-items: center;
  gap: 7px;
  padding: 0 12px;
  border: 1px solid #e0e6e1;
  border-radius: 9px;
  background: #fff;
  color: #54645a;
  font-size: 11px;
  font-weight: 700;
}

.toolbar-button:hover,
.toolbar-button.primary {
  border-color: #315a49;
  background: #315a49;
  color: #fff;
}

.toolbar-button:disabled {
  cursor: wait;
  opacity: 0.65;
}

.hidden-input {
  display: none;
}

.heading-row {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 25px;
}

.heading-row h1 {
  margin: 0;
  color: #293a31;
  font-family: Georgia, 'Times New Roman', serif;
  font-size: 29px;
  font-weight: 600;
  letter-spacing: -0.035em;
}

.heading-row p {
  margin: 7px 0 0;
  color: #94a198;
  font-size: 11px;
}

.item-count {
  padding-bottom: 3px;
  color: #96a198;
  font-size: 11px;
}

.items-section {
  margin-bottom: 28px;
}

.items-section h2 {
  margin: 0 0 11px 2px;
  color: #6b796f;
  font-size: 11px;
  font-weight: 800;
  letter-spacing: 0.1em;
  text-transform: uppercase;
}

.item-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(205px, 1fr));
  gap: 10px;
}

.drive-card {
  min-width: 0;
  min-height: 68px;
  position: relative;
  display: flex;
  align-items: center;
  gap: 3px;
  padding: 7px 7px 7px 12px;
  border: 1px solid #e6eae6;
  border-radius: 12px;
  background: #fff;
  transition: border-color 150ms ease, box-shadow 150ms ease, transform 150ms ease;
}

.drive-card:hover {
  border-color: #cbd9ce;
  box-shadow: 0 5px 16px rgba(44, 68, 52, 0.07);
  transform: translateY(-1px);
}

.card-main {
  min-width: 0;
  flex: 1;
  display: flex;
  align-items: center;
  gap: 11px;
  overflow: hidden;
  padding: 5px 0;
  border: 0;
  background: transparent;
  color: inherit;
  text-align: left;
}

.item-icon {
  width: 36px;
  height: 36px;
  flex: 0 0 36px;
  display: grid;
  place-items: center;
  border-radius: 10px;
}

.folder-icon {
  background: #edf2e8;
  color: #789267;
  font-size: 18px;
}

.file-icon {
  background: #edf1f7;
  color: #6d82a2;
  font-size: 9px;
  font-weight: 850;
}

.file-icon.image {
  background: #f5eee6;
  color: #b0804d;
  font-size: 19px;
}

.item-copy {
  min-width: 0;
  display: grid;
  gap: 4px;
}

.item-copy strong {
  overflow: hidden;
  color: #43544a;
  font-size: 11px;
  font-weight: 700;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.item-copy small {
  overflow: hidden;
  color: #a0aaa3;
  font-size: 9px;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.more-button {
  width: 30px;
  height: 30px;
  flex: 0 0 30px;
  border: 0;
  border-radius: 50%;
  background: transparent;
  color: #8d9991;
  font-size: 17px;
}

.more-button:hover {
  background: #f0f3ef;
}

.item-menu {
  min-width: 148px;
  position: absolute;
  z-index: 3;
  top: 54px;
  right: 7px;
  display: grid;
  padding: 5px;
  border: 1px solid #e4e9e4;
  border-radius: 10px;
  background: #fff;
  box-shadow: 0 10px 28px rgba(31, 47, 37, 0.14);
}

.item-menu button {
  padding: 9px 10px;
  border: 0;
  border-radius: 6px;
  background: transparent;
  color: #56665c;
  font-size: 11px;
  text-align: left;
}

.item-menu button:hover {
  background: #f2f5f1;
}

.item-menu button.danger {
  color: #ae5b56;
}

.empty-state {
  min-height: 360px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 30px;
  border: 1px dashed #dfe6df;
  border-radius: 17px;
  background: rgba(255, 255, 255, 0.58);
  text-align: center;
}

.empty-icon {
  width: 64px;
  height: 64px;
  display: grid;
  place-items: center;
  margin-bottom: 15px;
  border-radius: 22px;
  background: #eaf1ea;
  color: #688473;
  font-size: 32px;
}

.empty-state h2 {
  margin: 0;
  color: #46574d;
  font-family: Georgia, 'Times New Roman', serif;
  font-size: 20px;
  font-weight: 600;
}

.empty-state p {
  max-width: 370px;
  margin: 8px 0 0;
  color: #99a49d;
  font-size: 12px;
  line-height: 1.6;
}

.empty-actions {
  display: flex;
  gap: 8px;
  margin-top: 17px;
}

.empty-actions button,
.empty-actions .primary {
  min-height: 36px;
  padding: 0 13px;
  border: 1px solid #dfe6df;
  border-radius: 9px;
  background: #fff;
  color: #506257;
  font-size: 11px;
  font-weight: 700;
}

.empty-actions .primary {
  border-color: #315a49;
  background: #315a49;
  color: #fff;
}

.error-banner {
  padding: 11px 13px;
  border: 1px solid #f0d7d3;
  border-radius: 9px;
  background: #fff5f3;
  color: #a65353;
  font-size: 12px;
}

.modal-backdrop {
  position: fixed;
  z-index: 10;
  inset: 0;
  display: grid;
  place-items: center;
  padding: 18px;
  background: rgba(29, 42, 34, 0.38);
  backdrop-filter: blur(3px);
}

.dialog {
  width: min(420px, 100%);
  padding: 23px;
  border: 1px solid #e6ebe6;
  border-radius: 17px;
  background: #fff;
  box-shadow: 0 20px 60px rgba(23, 38, 29, 0.2);
}

.dialog-heading {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 21px;
}

.dialog-heading h2 {
  margin: 0;
  color: #34443d;
  font-family: Georgia, 'Times New Roman', serif;
  font-size: 20px;
  font-weight: 600;
}

.dialog-heading > button,
.preview-header button {
  width: 31px;
  height: 31px;
  border: 0;
  border-radius: 50%;
  background: transparent;
  color: #7e8a82;
  font-size: 22px;
}

.dialog-heading > button:hover,
.preview-header button:hover {
  background: #f1f4f0;
}

.dialog label {
  display: block;
  margin-bottom: 7px;
  color: #6f7c73;
  font-size: 11px;
  font-weight: 700;
}

.dialog input,
.dialog select {
  width: 100%;
  height: 42px;
  padding: 0 11px;
  border: 1px solid #dce4dc;
  border-radius: 9px;
  outline: none;
  background: #fbfcfa;
  color: #35463c;
  font: inherit;
  font-size: 12px;
}

.dialog input:focus,
.dialog select:focus {
  border-color: #719182;
  box-shadow: 0 0 0 3px rgba(113, 145, 130, 0.12);
}

.dialog-actions {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  margin-top: 22px;
}

.dialog-actions button {
  min-height: 36px;
  padding: 0 14px;
  border: 1px solid #dfe6df;
  border-radius: 9px;
  background: #fff;
  color: #5b6b61;
  font-size: 11px;
  font-weight: 750;
}

.dialog-actions button.primary {
  border-color: #315a49;
  background: #315a49;
  color: #fff;
}

.dialog-actions button.danger-button {
  border-color: #ad514b;
  background: #ad514b;
  color: #fff;
}

.dialog-actions button:disabled {
  cursor: wait;
  opacity: 0.6;
}

.delete-warning {
  margin: 0;
  color: #7f8982;
  font-size: 12px;
  line-height: 1.6;
}

.preview-dialog {
  width: min(1000px, 100%);
  height: min(82vh, 760px);
  display: flex;
  flex-direction: column;
  overflow: hidden;
  border-radius: 14px;
  background: #fff;
}

.preview-header {
  min-height: 54px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 0 16px;
  border-bottom: 1px solid #e7ebe7;
}

.preview-header strong {
  overflow: hidden;
  color: #405048;
  font-size: 12px;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.preview-header > div {
  display: flex;
  align-items: center;
  gap: 10px;
}

.preview-header a,
.preview-other a {
  color: #426853;
  font-size: 11px;
  font-weight: 750;
  text-decoration: none;
}

.preview-image {
  min-height: 0;
  flex: 1;
  object-fit: contain;
  background: #f3f5f2;
}

.preview-pdf {
  min-height: 0;
  flex: 1;
  border: 0;
}

.preview-other {
  flex: 1;
  display: grid;
  place-content: center;
  justify-items: center;
  gap: 8px;
  color: #7c8980;
  font-size: 12px;
}

@media (max-width: 760px) {
  .sidebar {
    width: 66px;
    min-width: 66px;
    padding-inline: 8px;
  }

  .brand {
    justify-content: center;
    padding: 0;
  }

  .brand > span:last-child,
  .sidebar-heading,
  .folder-tree,
  .sidebar-storage > div {
    display: none;
  }

  .create-button {
    width: 44px;
    justify-content: center;
    padding: 0;
    margin-inline: auto;
    font-size: 0;
  }

  .create-button span {
    font-size: 21px;
  }

  .navigation-item {
    justify-content: center;
    padding: 0;
    font-size: 0;
  }

  .navigation-item span {
    font-size: 18px;
  }

  .sidebar-storage {
    justify-content: center;
    padding-inline: 0;
  }

  .topbar {
    height: 64px;
    padding-inline: 16px;
  }

  .content {
    padding: 20px 16px 35px;
  }
}

@media (max-width: 560px) {
  .content-toolbar {
    align-items: flex-start;
    flex-direction: column;
    gap: 12px;
    margin-bottom: 21px;
  }

  .toolbar-actions {
    width: 100%;
  }

  .toolbar-button {
    flex: 1;
    justify-content: center;
  }

  .heading-row h1 {
    font-size: 25px;
  }

  .item-grid {
    grid-template-columns: 1fr;
  }

  .empty-state {
    min-height: 300px;
  }
}

.drive-app {
  --violet: #7453df;
  --violet-deep: #5438b8;
  --coral: #ff765e;
  --plum: #34204e;
  --ink: #322847;
  --muted: #827995;
  --line: #e8e1f1;
  background:
    radial-gradient(circle at 93% 5%, rgba(255, 197, 117, 0.26), transparent 25%),
    radial-gradient(circle at 45% 88%, rgba(199, 178, 255, 0.24), transparent 32%),
    #f6f2fb;
  color: var(--ink);
}

.sidebar {
  border-right-color: #3b2b59;
  background: linear-gradient(165deg, #281b43 0%, #382253 55%, #41234e 100%);
  color: #fff;
}

.brand {
  color: #fff9f3;
  font-family: Inter, "Segoe UI", system-ui, sans-serif;
  font-size: 17px;
  letter-spacing: -0.02em;
}

.brand-mark {
  background: linear-gradient(140deg, #ff8069 5%, #ffb84f 100%);
  box-shadow: 0 5px 16px rgba(255, 123, 94, 0.3);
}

.create-button {
  border-color: rgba(255, 255, 255, 0.18);
  background: linear-gradient(120deg, #fff8f1, #fff);
  color: #583b99;
  box-shadow: 0 7px 20px rgba(18, 12, 31, 0.2);
}

.create-button:hover {
  background: linear-gradient(120deg, #ffe9dd, #f8edff);
}

.navigation-item,
.tree-item {
  color: #d3cae4;
}

.navigation-item:hover,
.tree-item:hover {
  background: rgba(255, 255, 255, 0.09);
  color: #fff;
}

.navigation-item.active,
.tree-item.active {
  background: linear-gradient(100deg, rgba(174, 143, 255, 0.3), rgba(255, 128, 156, 0.18));
  color: #fff;
}

.tree-item span:first-child,
.sidebar-heading {
  color: #b6a7d1;
}

.no-folders,
.sidebar-storage small {
  color: #bcafce;
}

.sidebar-storage {
  border-top-color: rgba(255, 255, 255, 0.16);
}

.sidebar-storage strong {
  color: #fff6fb;
}

.storage-icon {
  color: #ffbc70;
}

.topbar {
  border-bottom-color: #e8e0f0;
  background: rgba(255, 253, 255, 0.86);
}

.search-box {
  background: #eee9f8;
  color: #785f9f;
}

.search-box:focus-within {
  box-shadow: 0 0 0 2px rgba(116, 83, 223, 0.3);
}

.search-box input {
  color: #3b2d53;
}

.profile-badge {
  border-color: #f3d9d4;
  background: linear-gradient(145deg, #ff8068, #e85da2);
  box-shadow: 0 4px 12px rgba(226, 89, 143, 0.22);
}

.breadcrumbs {
  color: #ae9dbd;
}

.breadcrumbs button {
  color: #837396;
}

.breadcrumbs button:last-child {
  color: #38294f;
}

.toolbar-button {
  border-color: #e5dcf1;
  color: #675482;
}

.toolbar-button:hover {
  border-color: #d2c4ed;
  background: #f2ecff;
  color: #6146c3;
}

.toolbar-button.primary,
.toolbar-button.primary:hover {
  border-color: transparent;
  background: linear-gradient(105deg, #7554e4, #a34fc4);
  color: #fff;
  box-shadow: 0 5px 14px rgba(116, 83, 223, 0.22);
}

.heading-row h1 {
  color: #342449;
}

.heading-row p,
.item-count {
  color: #9589a4;
}

.item-count {
  padding: 6px 10px;
  border-radius: 999px;
  background: #eee8fb;
  color: #7359b4;
}

.items-section h2 {
  color: #897a9f;
}

.drive-card {
  border-color: #e9e2f0;
  background: rgba(255, 255, 255, 0.9);
  box-shadow: 0 2px 6px rgba(55, 37, 83, 0.025);
}

.drive-card:hover {
  border-color: #cbb8f4;
  box-shadow: 0 8px 20px rgba(87, 58, 143, 0.1);
}

.folder-icon {
  background: #fff1cd;
  color: #d7962e;
}

.drive-card:nth-child(3n + 2) .folder-icon {
  background: #ffe6ef;
  color: #d35f91;
}

.drive-card:nth-child(3n) .folder-icon {
  background: #e9e3ff;
  color: #7658d4;
}

.file-icon {
  background: #e9e5ff;
  color: #7458d1;
}

.file-icon.image {
  background: #ffe5ee;
  color: #d45d91;
}

.item-copy strong {
  color: #403150;
}

.item-copy small {
  color: #9e91aa;
}

.more-button {
  color: #8d7ba6;
}

.more-button:hover,
.item-menu button:hover {
  background: #f2edfa;
  color: #6747bd;
}

.item-menu {
  border-color: #e8def2;
  box-shadow: 0 12px 30px rgba(44, 27, 70, 0.17);
}

.item-menu button {
  color: #5d4c73;
}

.item-menu button.danger {
  color: #ca5662;
}

.empty-state {
  border-color: #ded4ee;
  background:
    radial-gradient(circle at 50% 20%, rgba(255, 223, 194, 0.2), transparent 40%),
    rgba(255, 255, 255, 0.62);
}

.empty-icon {
  background: linear-gradient(145deg, #ffe0bd, #f4d8ff 68%, #e1ddff);
  color: #7952bd;
  box-shadow: 0 8px 22px rgba(133, 95, 188, 0.12);
}

.empty-state h2 {
  color: #48365f;
}

.empty-state p {
  color: #9589a4;
}

.empty-actions button {
  border-color: #e4dbee;
  color: #684f89;
}

.empty-actions .primary {
  border-color: transparent;
  background: linear-gradient(105deg, #7554e4, #a34fc4);
  color: #fff;
}

.error-banner {
  border-color: #f4cbd0;
  background: #fff0f1;
  color: #bd4d60;
}

.dialog {
  border-color: #e9def1;
  box-shadow: 0 22px 65px rgba(39, 23, 60, 0.23);
}

.dialog-heading h2 {
  color: #3d2c55;
}

.dialog input,
.dialog select {
  border-color: #e2d9ed;
  background: #fcfaff;
  color: #49395f;
}

.dialog input:focus,
.dialog select:focus {
  border-color: #9474e5;
  box-shadow: 0 0 0 3px rgba(116, 83, 223, 0.13);
}

.dialog-actions button {
  border-color: #e6deed;
  color: #6b5b7d;
}

.dialog-actions button.primary {
  border-color: transparent;
  background: linear-gradient(105deg, #7554e4, #a34fc4);
  color: #fff;
}

.dialog-actions button.danger-button {
  border-color: transparent;
  background: linear-gradient(105deg, #ef6c67, #d74e78);
  color: #fff;
}

.delete-warning {
  color: #857991;
}

.preview-header {
  border-bottom-color: #eadff0;
}

.preview-header strong {
  color: #403150;
}

.preview-header a,
.preview-other a {
  color: #7050d0;
}

.preview-image {
  background: #f5f0fa;
}

button:focus-visible,
a:focus-visible,
input:focus-visible,
select:focus-visible {
  outline: 3px solid rgba(255, 126, 106, 0.65);
  outline-offset: 2px;
}
</style>
