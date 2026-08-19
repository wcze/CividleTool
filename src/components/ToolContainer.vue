<template>
  <div class="tool-layout">
    <!-- 移动端菜单按钮 -->
    <button class="menu-btn" @click="drawerOpen = true" :aria-label="t('nav.openMenu')">
      <span></span>
      <span></span>
      <span></span>
    </button>

    <!-- 抽屉遮罩 -->
    <div v-if="drawerOpen" class="drawer-overlay" @click="drawerOpen = false"></div>

    <!-- 侧边栏：桌面常驻 / 移动端抽屉 -->
    <div class="sidebar-wrap" :class="{ 'drawer-open': drawerOpen }">
      <Sidebar
        :tools="tools"
        :currentToolId="currentToolId"
        @goHome="onGoHome"
        @switchTool="onSwitchTool"
      />
    </div>

    <main class="content-area">
      <slot />
    </main>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import Sidebar from './Sidebar.vue'
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

const emit = defineEmits(['goHome', 'switchTool'])

const drawerOpen = ref(false)

const onGoHome = () => {
  drawerOpen.value = false
  emit('goHome')
}

const onSwitchTool = (tool) => {
  drawerOpen.value = false
  emit('switchTool', tool)
}
</script>

<style scoped>
.tool-layout {
  position: relative;
  display: flex;
  height: 100%;
  width: 100%;
  overflow: hidden;
}

.sidebar-wrap {
  flex-shrink: 0;
}

.content-area {
  flex: 1;
  min-width: 0;
  padding: 40px 48px;
  overflow-y: auto;
  height: 100%;
  background: #fff;
}

.menu-btn {
  display: none;
}

.drawer-overlay {
  display: none;
}

@media (max-width: 768px) {
  .menu-btn {
    display: flex;
    flex-direction: column;
    justify-content: center;
    gap: 5px;
    position: fixed;
    top: 66px;
    left: 14px;
    z-index: 60;
    width: 40px;
    height: 40px;
    padding: 10px;
    background: #fff;
    border: 1px solid var(--border);
    border-radius: 10px;
    cursor: pointer;
  }

  .menu-btn span {
    display: block;
    height: 2px;
    width: 100%;
    background: var(--text-1);
    border-radius: 2px;
  }

  .sidebar-wrap {
    position: fixed;
    top: 0;
    left: 0;
    bottom: 0;
    z-index: 70;
    transform: translateX(-100%);
    transition: transform 0.28s ease;
  }

  .sidebar-wrap.drawer-open {
    transform: translateX(0);
  }

  .drawer-overlay {
    display: block;
    position: fixed;
    inset: 0;
    z-index: 65;
    background: rgba(0, 0, 0, 0.4);
  }

  .content-area {
    padding: 124px 20px 24px;
  }
}

@media (max-width: 600px) {
  .content-area {
    padding: 124px 16px 20px;
  }
}
</style>