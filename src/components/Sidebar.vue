<template>
  <aside class="sidebar">
    <div class="sidebar-head">
      <span class="title">{{ t('sidebar.title') }}</span>
    </div>

    <nav class="tool-list">
      <button
        v-for="tool in tools"
        :key="tool.id"
        class="tool-item"
        :class="{ active: currentToolId === tool.id }"
        @click="$emit('switchTool', tool)"
      >
        <span class="tool-name">{{ tool.name }}</span>
      </button>
    </nav>

    <div class="sidebar-foot">
      <button class="back" @click="$emit('goHome')">← {{ t('sidebar.backHome') }}</button>
    </div>
  </aside>
</template>

<script setup>
import { t } from '@/i18n'

defineProps({
  tools: {
    type: Array,
    required: true
  },
  currentToolId: {
    type: String,
    required: true
  }
})

defineEmits(['goHome', 'switchTool'])
</script>

<style scoped>
.sidebar {
  width: 240px;
  height: 100vh;
  background: #fff;
  border-right: 1px solid var(--border);
  display: flex;
  flex-direction: column;
  overflow-y: auto;
}

.sidebar-head {
  padding: 20px 20px 12px;
}

.sidebar-head .title {
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: var(--text-3);
}

.tool-list {
  flex: 1;
  padding: 4px 10px;
}

.tool-item {
  width: 100%;
  display: flex;
  align-items: center;
  padding: 11px 12px;
  background: none;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-family: inherit;
  font-size: 0.92rem;
  color: var(--text-1);
  text-align: left;
  margin-bottom: 2px;
  transition: background 0.15s, color 0.15s;
}

.tool-item:hover {
  background: var(--bg-soft);
}

.tool-item.active {
  background: var(--accent-soft);
  color: var(--accent);
  font-weight: 500;
}

.tool-name {
  flex: 1;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.sidebar-foot {
  padding: 12px 14px 16px;
  border-top: 1px solid var(--border);
}

.back {
  width: 100%;
  padding: 8px;
  background: none;
  border: none;
  font-family: inherit;
  font-size: 0.88rem;
  color: var(--text-2);
  cursor: pointer;
  text-align: center;
  border-radius: 8px;
  transition: color 0.2s, background 0.2s;
}

.back:hover {
  color: var(--accent);
  background: var(--bg-soft);
}
</style>