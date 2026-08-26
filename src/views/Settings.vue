<template>
  <ToolContainer :tools="tools" :currentToolId="currentToolId" @goHome="goHome" @switchTool="switchTool">
    <div class="settings-page">
      <header class="content-head">
        <h1>{{ t('settings.title') }}</h1>
      </header>

      <div class="settings-card">
        <div class="settings-row">
          <span class="settings-key">{{ t('settings.language') }}</span>
          <div class="settings-value">
            <AppSelect v-model="localeModel" :options="langOptions" />
          </div>
        </div>

        <div class="settings-row">
          <span class="settings-key">{{ t('settings.numberFormat') }}</span>
          <div class="settings-value">
            <div class="seg-group" role="radiogroup">
              <button
                type="button"
                class="seg-btn"
                :class="{ active: numberFormat === 'suffix' }"
                role="radio"
                :aria-checked="numberFormat === 'suffix'"
                @click="setNumberFormat('suffix')"
              >
                {{ t('settings.numberFormatSuffix') }}
              </button>
              <button
                type="button"
                class="seg-btn"
                :class="{ active: numberFormat === 'scientific' }"
                role="radio"
                :aria-checked="numberFormat === 'scientific'"
                @click="setNumberFormat('scientific')"
              >
                {{ t('settings.numberFormatScientific') }}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </ToolContainer>
</template>

<script setup>
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import ToolContainer from '../components/ToolContainer.vue'
import AppSelect from '../components/AppSelect.vue'
import { getTools } from '../data/tools'
import { t, locale, setLocale } from '../i18n'
import { numberFormat, setNumberFormat } from '../store/settings'

const router = useRouter()
const currentToolId = 'settings'

// 侧边栏工具列表（与 ToolLayout 共用同一数据源）
const tools = computed(() => getTools())

const goHome = () => router.push('/')
const switchTool = (tool) => router.push(`/tool/${tool.id}`)

// 语言选项（与标题栏语言下拉一致）
const langOptions = [
  { value: 'zh', label: '简体中文' },
  { value: 'en', label: 'English' }
]

// 复用全局 locale，写入时走 setLocale 以保持本地存储 / <html lang> 同步
const localeModel = computed({
  get: () => locale.value,
  set: (value) => setLocale(value)
})
</script>

<style scoped>
/* ——— 全局重置 & 动画 ——— */
.settings-page {
  animation: fadeInUp 0.35s ease both;
  max-width: 820px;
  margin: 0 auto;
  padding: 0 4px;
}

@keyframes fadeInUp {
  0% {
    opacity: 0;
    transform: translateY(12px);
  }

  100% {
    opacity: 1;
    transform: translateY(0);
  }
}

/* ——— 头部 ——— */
.content-head {
  margin-bottom: 32px;
  padding-bottom: 20px;
  border-bottom: 1px solid var(--border, rgba(0, 0, 0, 0.06));
}

.content-head h1 {
  font-size: 2rem;
  font-weight: 500;
  letter-spacing: -0.02em;
  margin: 0;
  color: var(--text-1, #1a1a1a);
  line-height: 1.2;
}

/* ——— 卡片 ——— */
.settings-card {
  background: #ffffff;
  border-radius: 20px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.03), 0 1px 4px rgba(0, 0, 0, 0.04);
  border: 1px solid var(--border, rgba(0, 0, 0, 0.05));
  overflow: hidden;
}

/* ——— 行 ——— */
.settings-row {
  display: flex;
  align-items: center;
  gap: 24px;
  padding: 22px 28px;
  border-bottom: 1px solid var(--border, rgba(0, 0, 0, 0.04));
  transition: background 0.15s;
}

.settings-row:last-child {
  border-bottom: none;
}

.settings-row:hover {
  background: rgba(0, 0, 0, 0.005);
}

/* ——— 标签 ——— */
.settings-key {
  flex-shrink: 0;
  width: 140px;
  font-size: 0.85rem;
  font-weight: 500;
  letter-spacing: 0.02em;
  text-transform: uppercase;
  color: var(--text-2, #6b6b6b);
  opacity: 0.7;
}

/* ——— 值 ——— */
.settings-value {
  flex: 1;
  min-width: 0;
  display: flex;
  justify-content: flex-end;
}

.settings-value .app-select {
  max-width: 220px;
}

/* ——— 分段选择器（科学计数法 / 单位后缀） ——— */
.seg-group {
  display: inline-flex;
  gap: 4px;
  padding: 4px;
  background: var(--bg-soft, #f3f5f8);
  border: 1px solid var(--border, rgba(0, 0, 0, 0.06));
  border-radius: 11px;
}

.seg-btn {
  padding: 9px 14px;
  border: none;
  border-radius: 8px;
  background: transparent;
  font-family: inherit;
  font-size: 0.85rem;
  font-weight: 500;
  color: var(--text-2, #3a3a3a);
  cursor: pointer;
  white-space: nowrap;
  transition: background 0.15s, color 0.15s, box-shadow 0.15s;
}

.seg-btn:hover {
  color: var(--accent, #2b6c94);
}

.seg-btn.active {
  background: #ffffff;
  color: var(--accent, #2b6c94);
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.08);
}

/* ——— 📱 移动端适配 ——— */
@media (max-width: 600px) {
  .settings-page {
    padding: 0 2px;
  }

  .content-head {
    margin-bottom: 24px;
    padding-bottom: 16px;
  }

  .content-head h1 {
    font-size: 1.6rem;
  }

  .settings-card {
    border-radius: 16px;
    box-shadow: 0 2px 12px rgba(0, 0, 0, 0.02), 0 1px 3px rgba(0, 0, 0, 0.03);
  }

  .settings-row {
    flex-direction: column;
    align-items: flex-start;
    gap: 10px;
    padding: 18px 20px;
  }

  .settings-key {
    width: 100%;
    font-size: 0.75rem;
    letter-spacing: 0.04em;
    opacity: 0.6;
  }

  .settings-value {
    width: 100%;
    justify-content: flex-start;
  }

  .settings-value .app-select {
    max-width: none;
    width: 100%;
  }

  .seg-group {
    width: 100%;
  }

  .seg-btn {
    flex: 1;
    text-align: center;
  }
}

/* 小屏手机（< 420px）进一步微调 */
@media (max-width: 420px) {
  .settings-row {
    padding: 14px 16px;
  }

  .content-head h1 {
    font-size: 1.4rem;
  }

  .seg-btn {
    padding: 9px 8px;
    font-size: 0.78rem;
  }
}
</style>
