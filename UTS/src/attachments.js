const DATABASE_NAME = 'todo-kuliah-attachments'
const STORE_NAME = 'attachments'
const FOLDER_STORE_NAME = 'folder-attachments'
export const ROOT_FOLDER_ID = '__root__'

function openDatabase() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DATABASE_NAME, 2)

    request.onupgradeneeded = () => {
      const database = request.result
      if (!database.objectStoreNames.contains(STORE_NAME)) {
        const store = database.createObjectStore(STORE_NAME, { keyPath: 'id' })
        store.createIndex('taskId', 'taskId')
      }
      if (!database.objectStoreNames.contains(FOLDER_STORE_NAME)) {
        const store = database.createObjectStore(FOLDER_STORE_NAME, { keyPath: 'id' })
        store.createIndex('folderId', 'folderId')
      }
    }

    request.onsuccess = () => {
      request.result.onversionchange = () => request.result.close()
      resolve(request.result)
    }
    request.onerror = () => reject(request.error || new Error('Database lampiran gagal dibuka.'))
  })
}

export async function saveTaskAttachments(taskId, files) {
  if (files.length === 0) return []

  const database = await openDatabase()

  return new Promise((resolve, reject) => {
    const transaction = database.transaction(STORE_NAME, 'readwrite')
    const store = transaction.objectStore(STORE_NAME)
    const attachments = files.map((file, index) => {
      const id = `${taskId}:${index}`
      store.put({ id, taskId, file })
      return { id, name: file.name, type: file.type, size: file.size }
    })

    transaction.oncomplete = () => resolve(attachments)
    transaction.onerror = () =>
      reject(transaction.error || new Error('Lampiran gagal disimpan.'))
    transaction.onabort = () =>
      reject(transaction.error || new Error('Penyimpanan lampiran dibatalkan.'))
  })
}

export async function getTaskAttachment(id) {
  const database = await openDatabase()

  return new Promise((resolve, reject) => {
    const request = database.transaction(STORE_NAME, 'readonly').objectStore(STORE_NAME).get(id)
    request.onsuccess = () => resolve(request.result?.file)
    request.onerror = () => reject(request.error || new Error('Lampiran gagal dibuka.'))
  })
}

export async function deleteTaskAttachments(taskId) {
  const database = await openDatabase()

  return new Promise((resolve, reject) => {
    const transaction = database.transaction(STORE_NAME, 'readwrite')
    const cursorRequest = transaction
      .objectStore(STORE_NAME)
      .index('taskId')
      .openCursor(IDBKeyRange.only(taskId))

    cursorRequest.onsuccess = () => {
      const cursor = cursorRequest.result
      if (cursor) {
        cursor.delete()
        cursor.continue()
      }
    }

    transaction.oncomplete = resolve
    transaction.onerror = () =>
      reject(transaction.error || new Error('Lampiran gagal dihapus.'))
    transaction.onabort = () =>
      reject(transaction.error || new Error('Penghapusan lampiran dibatalkan.'))
  })
}

export async function saveFolderAttachments(folderId, files) {
  if (files.length === 0) return []

  const database = await openDatabase()

  return new Promise((resolve, reject) => {
    const transaction = database.transaction(FOLDER_STORE_NAME, 'readwrite')
    const store = transaction.objectStore(FOLDER_STORE_NAME)
    const attachments = files.map((file) => {
      const id = `${folderId}:${Date.now()}:${crypto.randomUUID()}`
      store.put({ id, folderId, file })
      return { id, name: file.name, type: file.type, size: file.size }
    })

    transaction.oncomplete = () => resolve(attachments)
    transaction.onerror = () =>
      reject(transaction.error || new Error('Lampiran folder gagal disimpan.'))
    transaction.onabort = () =>
      reject(transaction.error || new Error('Penyimpanan lampiran folder dibatalkan.'))
  })
}

export async function getFolderAttachment(id) {
  const database = await openDatabase()

  return new Promise((resolve, reject) => {
    const request = database
      .transaction(FOLDER_STORE_NAME, 'readonly')
      .objectStore(FOLDER_STORE_NAME)
      .get(id)
    request.onsuccess = () => resolve(request.result?.file)
    request.onerror = () => reject(request.error || new Error('Lampiran folder gagal dibuka.'))
  })
}

export async function deleteFolderAttachment(id) {
  const database = await openDatabase()

  return new Promise((resolve, reject) => {
    const transaction = database.transaction(FOLDER_STORE_NAME, 'readwrite')
    transaction.objectStore(FOLDER_STORE_NAME).delete(id)
    transaction.oncomplete = resolve
    transaction.onerror = () =>
      reject(transaction.error || new Error('Lampiran folder gagal dihapus.'))
    transaction.onabort = () =>
      reject(transaction.error || new Error('Penghapusan lampiran folder dibatalkan.'))
  })
}

export async function deleteFolderAttachments(folderId) {
  const database = await openDatabase()

  return new Promise((resolve, reject) => {
    const transaction = database.transaction(FOLDER_STORE_NAME, 'readwrite')
    const cursorRequest = transaction
      .objectStore(FOLDER_STORE_NAME)
      .index('folderId')
      .openCursor(IDBKeyRange.only(folderId))

    cursorRequest.onsuccess = () => {
      const cursor = cursorRequest.result
      if (cursor) {
        cursor.delete()
        cursor.continue()
      }
    }

    transaction.oncomplete = resolve
    transaction.onerror = () =>
      reject(transaction.error || new Error('Lampiran folder gagal dihapus.'))
    transaction.onabort = () =>
      reject(transaction.error || new Error('Penghapusan lampiran folder dibatalkan.'))
  })
}

export async function moveFolderAttachment(id, folderId) {
  const database = await openDatabase()

  return new Promise((resolve, reject) => {
    const transaction = database.transaction(FOLDER_STORE_NAME, 'readwrite')
    const store = transaction.objectStore(FOLDER_STORE_NAME)
    const request = store.get(id)

    request.onsuccess = () => {
      if (!request.result) {
        transaction.abort()
        return
      }
      request.result.folderId = folderId
      store.put(request.result)
    }

    transaction.oncomplete = resolve
    transaction.onerror = () =>
      reject(transaction.error || new Error('Lampiran gagal dipindahkan.'))
    transaction.onabort = () =>
      reject(transaction.error || new Error('Pemindahan lampiran dibatalkan.'))
  })
}

export async function deleteFolderAttachmentsInFolders(folderIds) {
  if (folderIds.length === 0) return

  const database = await openDatabase()

  return new Promise((resolve, reject) => {
    const transaction = database.transaction(FOLDER_STORE_NAME, 'readwrite')
    const store = transaction.objectStore(FOLDER_STORE_NAME)
    const folderIdSet = new Set(folderIds)
    const request = store.openCursor()

    request.onsuccess = () => {
      const cursor = request.result
      if (!cursor) return
      if (folderIdSet.has(cursor.value.folderId)) cursor.delete()
      cursor.continue()
    }

    transaction.oncomplete = resolve
    transaction.onerror = () =>
      reject(transaction.error || new Error('Isi folder gagal dihapus.'))
    transaction.onabort = () =>
      reject(transaction.error || new Error('Penghapusan isi folder dibatalkan.'))
  })
}
