<script setup>
import { onBeforeUnmount, onMounted, ref } from 'vue'
import { getTaskAttachment } from '../attachments'

const props = defineProps({
  task: { type: Object, required: true },
  folders: { type: Array, default: () => [] },
})
const emit = defineEmits(['toggle', 'remove', 'move'])

const attachments = ref([])
const attachmentError = ref(false)
const objectUrls = []

onMounted(async () => {
  try {
    const taskAttachments = []
    for (const attachment of props.task.attachments || []) {
      const file = await getTaskAttachment(attachment.id)
      if (!file) continue
      const url = URL.createObjectURL(file)
      objectUrls.push(url)
      taskAttachments.push({ ...attachment, url, isImage: file.type.startsWith('image/') })
    }
    attachments.value = taskAttachments
  } catch (error) {
    console.error('Gagal memuat lampiran tugas.', error)
    attachmentError.value = true
  }
})

onBeforeUnmount(() => {
  for (const url of objectUrls) URL.revokeObjectURL(url)
})
</script>

<template>
  <li class="item">
    <div class="task-main">
      <label>
        <input type="checkbox" :checked="task.done" @change="emit('toggle', task.id)" />
        <span :class="{ done: task.done }">{{ task.title }}</span>
      </label>
      <div v-if="attachments.length" class="attachments" aria-label="Lampiran tugas">
        <a
          v-for="attachment in attachments"
          :key="attachment.id"
          class="attachment"
          :href="attachment.url"
          :download="attachment.isImage ? null : attachment.name"
          :target="attachment.isImage ? '_blank' : null"
          :rel="attachment.isImage ? 'noreferrer' : null"
        >
          <img v-if="attachment.isImage" :src="attachment.url" :alt="attachment.name" />
          <span>{{ attachment.name }}</span>
        </a>
      </div>
      <p v-if="attachmentError" class="attachment-error" role="alert">
        Lampiran tidak dapat dimuat.
      </p>
      <label v-if="folders.length" class="task-folder">
        Folder
        <select
          :value="task.folderId ?? ''"
          :aria-label="`Folder untuk ${task.title}`"
          @change="
            emit('move', {
              id: task.id,
              folderId: $event.target.value ? Number($event.target.value) : null,
            })
          "
        >
          <option value="">Tanpa folder</option>
          <option v-for="folder in folders" :key="folder.id" :value="String(folder.id)">
            {{ folder.name }}
          </option>
        </select>
      </label>
    </div>
    <button class="delete" :aria-label="`Hapus tugas ${task.title}`" @click="emit('remove', task.id)">
      Hapus
    </button>
  </li>
</template>

<style scoped>
.item {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  min-height: 64px;
  gap: 12px;
  padding: 10px 10px 10px 14px;
  margin-bottom: 8px;
  border: 1px solid #edf0eb;
  border-radius: 14px;
  background: #fff;
  transition: border-color 180ms ease, box-shadow 180ms ease, transform 180ms ease;
}

.item:hover {
  border-color: #dde5dc;
  box-shadow: 0 8px 24px rgba(54, 75, 65, 0.07);
  transform: translateY(-1px);
}

.task-main {
  min-width: 0;
  flex: 1;
}

label {
  min-width: 0;
  display: flex;
  align-items: center;
  gap: 11px;
  cursor: pointer;
}

label input {
  width: 18px;
  height: 18px;
  flex: 0 0 18px;
  accent-color: #527563;
  cursor: pointer;
}

label span {
  overflow-wrap: anywhere;
  color: #34443d;
  font-size: 14px;
  line-height: 1.45;
}

.done {
  text-decoration: line-through;
  color: #9ca69f;
}

.attachments {
  display: flex;
  flex-wrap: wrap;
  gap: 7px;
  margin: 10px 0 2px 29px;
}

.attachment {
  max-width: 100%;
  display: flex;
  align-items: center;
  gap: 7px;
  padding: 4px 8px 4px 4px;
  border: 1px solid #e8ede7;
  border-radius: 9px;
  background: #fafbf8;
  color: #5e7468;
  font-size: 11px;
  text-decoration: none;
}

.attachment:hover {
  border-color: #c9d8cd;
  color: #315a49;
}

.attachment span {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.attachment img {
  width: 30px;
  height: 30px;
  flex: 0 0 30px;
  border-radius: 6px;
  object-fit: cover;
}

.attachment-error {
  margin: 8px 0 0 29px;
  color: #a65353;
  font-size: 12px;
}

.task-folder {
  display: flex;
  align-items: center;
  gap: 7px;
  margin: 9px 0 0 29px;
  color: #8a968f;
  font-size: 10px;
  font-weight: 700;
}

.task-folder select {
  max-width: 180px;
  height: 27px;
  padding: 0 8px;
  border: 1px solid #e8ede7;
  border-radius: 7px;
  background: #fafbf8;
  color: #5e7468;
  font: inherit;
  font-weight: 600;
}

.delete {
  width: 36px;
  height: 36px;
  flex: 0 0 36px;
  padding: 0;
  border: 0;
  border-radius: 10px;
  background: #f4f5f2;
  color: #8c9891;
  font-size: 0;
  transition: all 180ms ease;
}

.delete::before {
  content: '×';
  font-size: 20px;
  line-height: 1;
}

.delete:hover {
  background: #f5eaea;
  color: #a65353;
}

@media (max-width: 560px) {
  .attachments {
    margin-left: 29px;
  }
}
</style>
