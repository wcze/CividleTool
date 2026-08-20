<template>
  <ToolContainer :tools="tools" :currentToolId="currentToolId" @goHome="goHome" @switchTool="switchTool">
    <div class="about-page">
      <header class="content-head">
        <h1>{{ t('about.title') }}</h1>
      </header>

      <div class="about-disclaimer">{{ t('about.disclaimer') }}</div>

      <div class="about-card">
        <div class="about-row">
          <span class="about-key">{{ t('about.developer') }}</span>
          <span class="about-value">cCheNgz</span>
        </div>

        <div class="about-row">
          <span class="about-key">{{ t('about.projectUrl') }}</span>
          <span class="about-value">
            <a href="https://github.com/wcze/CividleTool" target="_blank" rel="noopener noreferrer">
              https://github.com/wcze/CividleTool
            </a>
          </span>
        </div>

        <div class="about-row">
          <span class="about-key">{{ t('about.dataSource') }}</span>
          <span class="about-value">
            <a :href="dataSourceUrl" target="_blank" rel="noopener noreferrer">Cekay</a>
            <span class="about-sep">·</span>
            SourRat
            <span class="about-sep">·</span>
            NaiKeSiTe
          </span>
        </div>

        <div class="about-row">
          <span class="about-key">{{ t('about.translationSource') }}</span>
          <span class="about-value">
            <a href="https://github.com/fishpondstudio/CivIdle/tree/main/shared/languages" target="_blank" rel="noopener noreferrer">
              https://github.com/fishpondstudio/CivIdle/tree/main/shared/languages
            </a>
          </span>
        </div>
      </div>
    </div>
  </ToolContainer>
</template>

<script setup>
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import ToolContainer from '../components/ToolContainer.vue'
import { t } from '../i18n'

const router = useRouter()
const currentToolId = 'about'

// 侧边栏工具列表（与 ToolLayout 保持一致）
const tools = computed(() => [
  {
    id: 'CalcBuildingsUpgrade',
    name: t('tools.CalcBuildingsUpgrade.name'),
    description: t('tools.CalcBuildingsUpgrade.description')
  }
])

const goHome = () => router.push('/')
const switchTool = (tool) => router.push(`/tool/${tool.id}`)

const dataSourceUrl =
  'https://docs.google.com/spreadsheets/d/1ip9TaNErRSrtGuBMawM1P0KfnOVzi3Eiax7aMo4upxA/edit?usp=sharing'
</script>

<style scoped>
/* ——— 全局重置 & 动画 ——— */
.about-page {
  animation: fadeInUp 0.4s cubic-bezier(0.2, 0.9, 0.3, 1) both;
  max-width: 820px;
  margin: 0 auto;
  padding: 0 4px;
}

@keyframes fadeInUp {
  0% {
    opacity: 0;
    transform: translateY(18px);
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

/* ——— 免责声明 ——— */
.about-disclaimer {
  margin-bottom: 16px;
  padding: 14px 18px;
  border-radius: 12px;
  background: rgba(43, 108, 148, 0.06);
  border: 1px solid rgba(43, 108, 148, 0.18);
  color: var(--text-2, #3a3a3a);
  font-size: 0.9rem;
  line-height: 1.6;
}

/* ——— 卡片 ——— */
.about-card {
  background: #ffffff;
  border-radius: 20px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.03), 0 1px 4px rgba(0, 0, 0, 0.04);
  border: 1px solid var(--border, rgba(0, 0, 0, 0.05));
  overflow: hidden;
  transition: box-shadow 0.2s ease;
}

.about-card:hover {
  box-shadow: 0 12px 40px rgba(0, 0, 0, 0.04), 0 1px 6px rgba(0, 0, 0, 0.02);
}

/* ——— 行 ——— */
.about-row {
  display: flex;
  align-items: flex-start;
  gap: 24px;
  padding: 22px 28px;
  border-bottom: 1px solid var(--border, rgba(0, 0, 0, 0.04));
  transition: background 0.15s;
}

.about-row:last-child {
  border-bottom: none;
}

.about-row:hover {
  background: rgba(0, 0, 0, 0.005);
}

/* ——— 标签 ——— */
.about-key {
  flex-shrink: 0;
  width: 100px;
  font-size: 0.85rem;
  font-weight: 500;
  letter-spacing: 0.02em;
  text-transform: uppercase;
  color: var(--text-3, #6b6b6b);
  padding-top: 2px;
  opacity: 0.7;
}

/* ——— 值 ——— */
.about-value {
  flex: 1;
  font-size: 1rem;
  font-weight: 450;
  color: var(--text-1, #1a1a1a);
  line-height: 1.6;
  word-break: break-word;
}

/* ——— 链接 ——— */
.about-value a {
  color: var(--accent, #2b6c94);
  text-decoration: none;
  font-weight: 450;
  border-bottom: 1px solid transparent;
  transition: border-color 0.2s, color 0.2s;
}

.about-value a:hover {
  color: var(--accent-dark, #1b4b6b);
  border-bottom-color: currentColor;
}

/* ——— 分隔符 ——— */
.about-sep {
  margin: 0 8px;
  color: var(--text-4, #b0b0b0);
  font-weight: 300;
  opacity: 0.5;
}

/* ——— 📱 移动端适配 ——— */
@media (max-width: 600px) {
  .about-page {
    padding: 0 2px;
  }

  .content-head {
    margin-bottom: 24px;
    padding-bottom: 16px;
  }

  .content-head h1 {
    font-size: 1.6rem;
  }

  .about-card {
    border-radius: 16px;
    box-shadow: 0 2px 12px rgba(0, 0, 0, 0.02), 0 1px 3px rgba(0, 0, 0, 0.03);
  }

  .about-disclaimer {
    margin-bottom: 12px;
    padding: 12px 14px;
    font-size: 0.85rem;
    border-radius: 10px;
  }

  .about-row {
    flex-direction: column;
    gap: 6px;
    padding: 18px 20px;
  }

  .about-key {
    width: 100%;
    font-size: 0.75rem;
    letter-spacing: 0.04em;
    opacity: 0.6;
    padding-top: 0;
  }

  .about-value {
    font-size: 0.95rem;
    line-height: 1.5;
  }

  .about-sep {
    margin: 0 5px;
  }

  /* 移动端链接更易点触 */
  .about-value a {
    padding: 2px 0;
  }
}

/* 小屏手机（< 420px）进一步微调 */
@media (max-width: 420px) {
  .about-row {
    padding: 14px 16px;
  }

  .content-head h1 {
    font-size: 1.4rem;
  }

  .about-value {
    font-size: 0.9rem;
  }
}
</style>