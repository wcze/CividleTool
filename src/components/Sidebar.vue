<template>
  <aside class="sidebar">
    <div class="sidebar-head">
      <span class="title">{{ t('sidebar.title') }}</span>
    </div>

    <!-- 主导航：首页 / 关于 -->
    <nav class="side-nav">
      <router-link to="/" class="side-nav-item" exact-active-class="active">{{ t('nav.home') }}</router-link>
      <router-link to="/settings" class="side-nav-item" active-class="active">{{ t('nav.settings') }}</router-link>
      <router-link to="/about" class="side-nav-item" active-class="active">{{ t('nav.about') }}</router-link>
    </nav>

    <div class="side-divider"></div>

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

defineEmits(['switchTool'])
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

.side-nav {
  display: none;
  padding: 0 10px 10px;
  flex-direction: column;
  gap: 2px;
}

.side-nav-item {
  display: flex;
  align-items: center;
  padding: 11px 12px;
  border-radius: 8px;
  color: var(--text-1);
  text-decoration: none;
  font-size: 0.92rem;
  transition: background 0.15s, color 0.15s;
}

.side-nav-item:hover {
  background: var(--bg-soft);
}

.side-nav-item.active {
  background: var(--accent-soft);
  color: var(--accent);
  font-weight: 500;
}

.side-divider {
  display: none;
  height: 1px;
  background: var(--border);
  margin: 2px 14px 10px;
}

/* 移动端：首页/关于收进侧边栏菜单 */
@media (max-width: 768px) {
  .side-nav {
    display: flex;
  }

  .side-divider {
    display: block;
  }
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

</style>