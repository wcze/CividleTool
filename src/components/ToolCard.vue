<template>
  <button class="tool-card" @click="$emit('click')">
    <span class="tool-icon">{{ tool.icon }}</span>
    <span class="tool-name">{{ tool.name }}</span>
    <span class="tool-desc">{{ tool.description }}</span>
  </button>
</template>

<script setup>
defineProps({
  tool: {
    type: Object,
    required: true
  }
})

defineEmits(['click'])
</script>

<style scoped>
.tool-card {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 10px;
  padding: 30px 20px;
  background: #fff;
  border: 1px solid var(--border);
  border-radius: 12px;
  cursor: pointer;
  font-family: inherit;
  text-align: center;
  transition: border-color 0.25s, background 0.25s, transform 0.25s;
}

.tool-card:hover {
  border-color: var(--accent);
  background: var(--bg-soft);
  transform: translateY(-2px);
}

.tool-icon {
  font-size: 2.2rem;
  line-height: 1;
}

.tool-name {
  font-size: 1rem;
  font-weight: 500;
  color: var(--text-1);
}

.tool-desc {
  font-size: 0.85rem;
  color: var(--text-3);
  max-height: 0;
  opacity: 0;
  overflow: hidden;
  transition: max-height 0.3s ease, opacity 0.3s ease;
}

.tool-card:hover .tool-desc {
  max-height: 48px;
  opacity: 1;
}
</style>