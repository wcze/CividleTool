<template>
  <div id="app">
    <!-- 顶部导航栏 -->
    <nav class="navbar">
      <div class="nav-inner">
        <div class="logo">
          <img :src="iconUrl" alt="" class="nav-logo" />
          <span>CivIdle</span><span class="logo-dot"> Tool</span>
        </div>
        <div class="nav-right">
          <div class="nav-links">
            <router-link to="/" class="nav-link">{{ t('nav.home') }}</router-link>
            <router-link to="/settings" class="nav-link">{{ t('nav.settings') }}</router-link>
            <router-link to="/about" class="nav-link">{{ t('nav.about') }}</router-link>
          </div>

          <!-- 移动端菜单按钮 -->
          <button
            class="menu-btn"
            :class="{ open: drawerOpen }"
            :aria-label="t('nav.openMenu')"
            aria-haspopup="true"
            :aria-expanded="drawerOpen"
            @click="drawerOpen = !drawerOpen"
          >
            <span></span>
            <span></span>
            <span></span>
          </button>

          <!-- 自定义语言下拉 -->
          <div class="lang-select" ref="langSelectRef">
            <button
              class="lang-trigger"
              :class="{ open: langOpen }"
              :aria-label="t('nav.openMenu')"
              aria-haspopup="listbox"
              :aria-expanded="langOpen"
              @click="langOpen = !langOpen"
            >
              <span class="lang-icon">🌐</span>
              <span class="lang-label">{{ currentLangLabel }}</span>
              <span class="lang-arrow" :class="{ rotate: langOpen }">▾</span>
            </button>

            <transition name="dropdown">
              <div v-if="langOpen" class="lang-menu" role="listbox">
                <button
                  v-for="opt in langOptions"
                  :key="opt.value"
                  class="lang-option"
                  :class="{ active: locale === opt.value }"
                  role="option"
                  :aria-selected="locale === opt.value"
                  @click="selectLocale(opt.value)"
                >
                  <span class="lang-option-check">{{ locale === opt.value ? '✓' : '' }}</span>
                  <span class="lang-option-label">{{ opt.label }}</span>
                </button>
              </div>
            </transition>
          </div>
        </div>
      </div>
    </nav>

    <div class="app-body">
      <router-view />
    </div>
  </div>
</template>

<script setup>
import iconUrl from '@/assets/icon.webp'
import { ref, computed, watch, onMounted, onBeforeUnmount } from 'vue'
import { useRoute } from 'vue-router'
import { locale, setLocale, t } from './i18n'
import { drawerOpen } from './store/ui'

// 语言选项
const langOptions = [
  { value: 'zh', label: '简体中文' },
  { value: 'en', label: 'English' }
]

const langOpen = ref(false)
const langSelectRef = ref(null)

// 当前语言显示名
const currentLangLabel = computed(() => {
  const opt = langOptions.find((o) => o.value === locale.value)
  return opt ? opt.label : langOptions[0].label
})

// 选择语言
const selectLocale = (value) => {
  setLocale(value)
  langOpen.value = false
}

const route = useRoute()

// 路由变化时关闭移动端抽屉（点击首页/关于等链接后自动收起侧边栏）
// 放在根组件，避免路由切换导致 ToolContainer 卸载时监听失效
watch(
  () => route.path,
  () => {
    drawerOpen.value = false
  }
)

// 点击外部关闭下拉
const onOutsideClick = (e) => {
  if (langSelectRef.value && !langSelectRef.value.contains(e.target)) {
    langOpen.value = false
  }
}

// 按 Esc 关闭
const onKeydown = (e) => {
  if (e.key === 'Escape') {
    langOpen.value = false
  }
}

onMounted(() => {
  document.addEventListener('click', onOutsideClick)
  document.addEventListener('keydown', onKeydown)
})

onBeforeUnmount(() => {
  document.removeEventListener('click', onOutsideClick)
  document.removeEventListener('keydown', onKeydown)
})
</script>

<style scoped>
#app {
  display: flex;
  flex-direction: column;
  width: 100%;
  height: 100vh;
  overflow: hidden;
  background: var(--bg);
  color: var(--text-1);
}

.navbar {
  flex-shrink: 0;
  background: rgba(255, 255, 255, 0.9);
  -webkit-backdrop-filter: blur(8px);
  backdrop-filter: blur(8px);
  border-bottom: 1px solid var(--border);
  z-index: 50;
}

.nav-inner {
  max-width: 1100px;
  margin: 0 auto;
  height: 60px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 24px;
}

.logo {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 1.1rem;
  font-weight: 700;
  letter-spacing: -0.02em;
  color: var(--text-1);
}

.nav-logo {
  width: 30px;
  height: 30px;
  border-radius: 8px;
}

.logo-dot {
  color: var(--accent);
}

.nav-links {
  display: flex;
  gap: 24px;
}

.nav-right {
  display: flex;
  align-items: center;
  gap: 18px;
}

/* ===== 自定义语言下拉 ===== */
.lang-select {
  position: relative;
}

.lang-trigger {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  background: var(--bg-soft);
  border: 1px solid var(--border);
  border-radius: 999px;
  cursor: pointer;
  font-family: inherit;
  font-size: 0.82rem;
  font-weight: 500;
  color: var(--text-1);
  transition: border-color 0.2s, color 0.2s, background 0.2s;
}

.lang-trigger:hover,
.lang-trigger.open {
  border-color: var(--accent);
  color: var(--accent);
  background: var(--accent-soft);
}

.lang-icon {
  font-size: 0.9rem;
  line-height: 1;
}

.lang-arrow {
  font-size: 0.7rem;
  opacity: 0.6;
  transition: transform 0.2s;
}

.lang-arrow.rotate {
  transform: rotate(180deg);
}

.lang-menu {
  position: absolute;
  top: calc(100% + 6px);
  right: 0;
  min-width: 150px;
  background: #fff;
  border: 1px solid var(--border);
  border-radius: 10px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
  padding: 6px;
  z-index: 100;
}

.lang-option {
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;
  padding: 8px 10px;
  border: none;
  border-radius: 8px;
  background: none;
  font-family: inherit;
  font-size: 0.88rem;
  color: var(--text-1);
  cursor: pointer;
  text-align: left;
  transition: background 0.15s, color 0.15s;
}

.lang-option:hover {
  background: var(--bg-soft);
}

.lang-option.active {
  color: var(--accent);
  font-weight: 600;
}

.lang-option-check {
  width: 16px;
  flex-shrink: 0;
  color: var(--accent);
  font-size: 0.8rem;
}

.lang-option-label {
  flex: 1;
  white-space: nowrap;
}

/* 下拉展开/收起动画 */
.dropdown-enter-active,
.dropdown-leave-active {
  transition: opacity 0.15s ease, transform 0.15s ease;
}

.dropdown-enter-from,
.dropdown-leave-to {
  opacity: 0;
  transform: translateY(-4px);
}

.nav-link {
  color: var(--text-2);
  text-decoration: none;
  font-size: 0.92rem;
  transition: color 0.2s;
}

.nav-link:hover {
  color: var(--accent);
}

/* 移动端菜单按钮：默认隐藏，仅移动端显示 */
.menu-btn {
  display: none;
  flex-direction: column;
  justify-content: center;
  gap: 5px;
  width: 38px;
  height: 38px;
  padding: 10px;
  background: var(--bg-soft);
  border: 1px solid var(--border);
  border-radius: 10px;
  cursor: pointer;
  transition: border-color 0.2s, background 0.2s;
}

.menu-btn span {
  display: block;
  height: 2px;
  width: 100%;
  background: var(--text-1);
  border-radius: 2px;
}

.menu-btn:hover,
.menu-btn.open {
  border-color: var(--accent);
  background: var(--accent-soft);
}

/* 移动端：导航链接收进侧边栏菜单，显示汉堡按钮 */
@media (max-width: 768px) {
  .nav-links {
    display: none;
  }

  .menu-btn {
    display: flex;
  }

  /* 语言按钮只显示图标，与菜单按钮同尺寸 */
  .lang-trigger {
    width: 38px;
    height: 38px;
    padding: 0;
    justify-content: center;
  }

  .lang-label,
  .lang-arrow {
    display: none;
  }
}

.app-body {
  flex: 1;
  min-height: 0;
}
</style>