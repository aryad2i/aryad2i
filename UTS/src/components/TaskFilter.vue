<script setup>
defineProps({
  modelValue: { type: String, required: true },
})
const emit = defineEmits(['update:modelValue'])

const options = [
  { value: 'all', label: 'Semua' },
  { value: 'active', label: 'Belum' },
  { value: 'done', label: 'Selesai' },
]
</script>

<template>
  <div class="filter">
    <button
      v-for="opt in options"
      :key="opt.value"
      :class="{ active: modelValue === opt.value }"
      @click="emit('update:modelValue', opt.value)"
    >
      {{ opt.label }}
    </button>
  </div>
</template>

<style scoped>
.filter {
  display: flex;
  gap: 6px;
  margin-bottom: 14px;
}

button {
  min-height: 36px;
  padding: 0 14px;
  border: 1px solid transparent;
  border-radius: 999px;
  background: transparent;
  color: #7d8983;
  font-size: 12px;
  font-weight: 750;
  transition: all 180ms ease;
}

button:hover {
  color: #42584d;
  background: #f1f4ef;
}

button.active {
  border-color: #dfe6df;
  background: #edf3ed;
  color: #3d6453;
  box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.55);
}
</style>
