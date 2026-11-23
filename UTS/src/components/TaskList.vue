<script setup>
import TaskItem from './TaskItem.vue'

defineProps({
  tasks: { type: Array, required: true },
  folders: { type: Array, default: () => [] },
})
const emit = defineEmits(['toggle', 'remove', 'move'])
</script>

<template>
  <p v-if="tasks.length === 0" class="empty">Belum ada tugas.</p>
  <ul v-else class="list">
    <TaskItem
      v-for="task in tasks"
      :key="task.id"
      :task="task"
      :folders="folders"
      @toggle="emit('toggle', $event)"
      @remove="emit('remove', $event)"
      @move="emit('move', $event)"
    />
  </ul>
</template>

<style scoped>
.list {
  list-style: none;
  padding: 0;
  margin: 0;
}
.empty {
  min-height: 150px;
  display: grid;
  place-items: center;
  margin: 0;
  border: 1px dashed #dde4dc;
  border-radius: 14px;
  background: #fafbf8;
  text-align: center;
  color: #97a39d;
  font-family: Georgia, 'Times New Roman', serif;
  font-size: 15px;
}
</style>
