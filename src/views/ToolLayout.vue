<template>
    <ToolContainer :tools="tools" :currentToolId="currentToolId" @goHome="goHome" @switchTool="switchTool">
        <transition name="fade-in-up" mode="out-in" appear>
        <div class="tool-content" :key="route.path">
            <!-- 选中工具时显示 -->
            <template v-if="currentTool">
                <header class="content-head">
                    <h1>{{ currentTool.name }}</h1>
                    <p>{{ currentTool.description }}</p>
                </header>

                <component :is="currentComponent" />
            </template>

            <!-- 未选中工具时显示首页 -->
            <template v-else>
                <div class="home-page">
                    <div class="home-hero">
                        <div class="home-icon">
                            <img :src="iconUrl" alt="CivIdle" />
                        </div>
                        <h1>CivIdle <span>Tools</span></h1>
                        <p class="home-subtitle">{{ t('home.subtitle') }}</p>
                    </div>

                    <!-- ===== 使用引导（单行提示） ===== -->
                    <p class="home-hint">
                        <span class="hint-desktop">{{ t('home.hintDesktop') }}</span>
                        <span class="hint-mobile">{{ t('home.hintMobile') }}</span>
                    </p>

                    <!-- ===== 快捷工具 ===== -->
                    <div class="home-tools-preview">
                        <div class="home-tools-title">{{ t('home.quickStart') }}</div>
                        <div v-for="tool in tools" :key="tool.id" class="home-tool-card" @click="switchTool(tool)">
                            <div class="home-tool-info">
                                <h3>{{ tool.name }}</h3>
                                <p>{{ tool.description }}</p>
                            </div>
                            <span class="home-tool-arrow">→</span>
                        </div>
                    </div>

                    <!-- ===== 游戏信息 ===== -->
                    <div class="steam-section">
                        <div class="steam-section-title">{{ t('home.steamSectionTitle') }}</div>
                        <div class="steam-card">
                            <div class="steam-card-inner">
                                <!-- 左侧：封面图 -->
                                <div class="steam-cover">
                                    <img v-if="gameCover" :src="gameCover" alt="CivIdle" class="cover-image" />
                                    <div v-else class="cover-placeholder">
                                        <span>🎮</span>
                                    </div>
                                </div>

                                <!-- 右侧：游戏信息 -->
                                <div class="steam-info">
                                    <div class="steam-title-row">
                                        <h2 class="steam-title">CivIdle</h2>
                                        <span class="steam-tag">{{ t('home.freeToPlay') }}</span>
                                    </div>

                                    <p class="steam-desc">
                                        {{ t('home.developer') }}
                                    </p>

                                    <div class="steam-rating-row">
                                        <span class="steam-price">{{ t('home.free') }}</span>
                                    </div>

                                    <div class="steam-actions">
                                        <a :href="gameUrl" target="_blank" rel="noopener noreferrer"
                                            class="steam-btn primary">
                                            {{ t('home.visitSteam') }}
                                        </a>
                                    </div>
                                </div>
                            </div>

                            <!-- Steam 底部信息 -->
                            <div class="steam-footer">
                                <span>{{ t('home.releaseDate') }}</span>
                                <span>{{ t('home.tags') }}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </template>
        </div>
        </transition>
    </ToolContainer>
</template>

<script setup>
import iconUrl from '@/assets/icon.webp'
import gameCover from '@/assets/background.jpg'
import { computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import ToolContainer from '../components/ToolContainer.vue'
import CalcBuildingsUpgrade from './tools/CalcBuildingsUpgrade.vue'
import CalcExtraGreatPerson from './tools/CalcExtraGreatPerson.vue'
import CalcWarehouseRatio from './tools/CalcWarehouseRatio.vue'
import FreeCivilization from './tools/FreeCivilization.vue'
import MarketQuery from './tools/MarketQuery.vue'
import { getTools } from '../data/tools'
import { t } from '../i18n'

const router = useRouter()
const route = useRoute()

// 工具列表唯一数据源（随语言变化）
const tools = computed(() => getTools())

const componentsMap = {
    'CalcBuildingsUpgrade': CalcBuildingsUpgrade,
    'CalcExtraGreatPerson': CalcExtraGreatPerson,
    'CalcWarehouseRatio': CalcWarehouseRatio,
    'FreeCivilization': FreeCivilization,
    'MarketQuery': MarketQuery
}

const currentToolId = computed(() => route.params.id)
const currentTool = computed(() => tools.value.find((tool) => tool.id === route.params.id) || null)
const currentComponent = computed(() => componentsMap[route.params.id] || null)

const goHome = () => router.push('/')
const switchTool = (tool) => router.push(`/tool/${tool.id}`)

// ===== Steam 卡片配置 =====
const gameUrl = 'https://store.steampowered.com/app/2181940/_/'
</script>

<style scoped>
.tool-content {
    will-change: transform, opacity;
}

/* ===== 内容切换过渡（工具/首页之间） ===== */
.fade-in-up-enter-active {
    transition: opacity 0.35s ease, transform 0.35s ease;
}

.fade-in-up-leave-active {
    transition: none;
}

.fade-in-up-enter-from {
    opacity: 0;
    transform: translateY(12px);
}

.fade-in-up-leave-to {
    opacity: 0;
    transform: translateY(-8px);
}

.content-head {
    margin-bottom: 28px;
    padding-bottom: 20px;
    border-bottom: 1px solid var(--border);
}

.content-head h1 {
    font-size: 1.6rem;
    font-weight: 600;
    letter-spacing: -0.01em;
    margin-bottom: 6px;
}

.content-head p {
    font-size: 0.95rem;
    color: var(--text-3);
}

/* ===== 首页样式 ===== */
.home-page {
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 48px 20px;
}

.home-hero {
    text-align: center;
    margin-bottom: 32px;
    width: 100%;
}

.home-icon {
    font-size: 4rem;
    margin-bottom: 12px;
}

.home-icon img {
    width: 80px;
    height: 80px;
    border-radius: 16px;
    object-fit: contain;
}

.home-hero h1 {
    font-size: 2.8rem;
    font-weight: 700;
    letter-spacing: -0.02em;
    color: var(--text-1);
    background-clip: text;
    margin-bottom: 4px;
}

.home-hero h1>span {
    color: var(--accent);
}

.home-subtitle {
    font-size: 1.1rem;
    color: var(--text-3);
    margin-bottom: 4px;
    font-weight: bold;
}

.home-subtitle>span {
    color: var(--accent);
}

/* ============================================================
   Steam 风格卡片（完全仿照 Steam 商店设计）
   ============================================================ */

.steam-card {
    width: 100%;
    max-width: 700px;
    background: var(--bg-2);
    border: 1px solid var(--border);
    border-radius: 12px;
    overflow: hidden;
}

.steam-card-inner {
    display: flex;
    gap: 0;
    padding: 12px;
}

/* ===== 封面图（Steam 风格） ===== */
.steam-cover {
    flex-shrink: 0;
    width: 200px;
    height: 113px;
    border-radius: 8px;
    overflow: hidden;
    position: relative;
    background: var(--bg-soft);
    cursor: pointer;
}

.cover-image {
    width: 100%;
    height: 100%;
    object-fit: cover;
}

.cover-placeholder {
    width: 100%;
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    background: var(--bg-soft);
    font-size: 2.5rem;
}


/* ===== 游戏信息 ===== */
.steam-info {
    flex: 1;
    padding: 4px 14px 4px 16px;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    min-width: 0;
}

.steam-title-row {
    display: flex;
    align-items: center;
    gap: 10px;
    flex-wrap: wrap;
}

.steam-title {
    font-size: 1.15rem;
    font-weight: 600;
    color: var(--text-1);
    letter-spacing: 0.5px;
}

.steam-tag {
    font-size: 0.72rem;
    font-weight: 500;
    color: var(--success);
    background: rgba(48, 164, 108, 0.08);
    padding: 2px 10px;
    border-radius: 999px;
    border: 1px solid rgba(48, 164, 108, 0.2);
    letter-spacing: 0.5px;
}

.steam-desc {
    font-size: 0.85rem;
    color: var(--text-2);
    margin: 6px 0 8px;
    line-height: 1.4;
}

.steam-price {
    font-size: 0.85rem;
    font-weight: 700;
    color: var(--text-1);
    margin-left: 6px;
}

/* ===== 按钮（Steam 风格） ===== */
.steam-actions {
    display: flex;
    gap: 8px;
    flex-wrap: wrap;
}

.steam-btn {
    padding: 7px 18px;
    border-radius: 8px;
    font-size: 0.82rem;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.15s ease;
    border: none;
    text-decoration: none;
    display: inline-flex;
    align-items: center;
    gap: 6px;
    letter-spacing: 0.3px;
}

.steam-btn.primary {
    background: var(--accent);
    color: #fff;
    box-shadow: 0 1px 0 rgba(255, 255, 255, 0.1);
}

.steam-btn.primary:hover {
    background: var(--accent-strong);
}

.steam-btn.primary:active {
    background: var(--accent-strong);
}

.steam-btn.secondary {
    background: #fff;
    color: var(--text-1);
    border: 1px solid var(--border);
}

.steam-btn.secondary:hover {
    background: var(--bg-soft);
    border-color: var(--text-3);
}

/* ===== Steam 底部信息 ===== */
.steam-footer {
    display: flex;
    gap: 24px;
    padding: 10px 16px 12px;
    border-top: 1px solid var(--border);
    font-size: 0.72rem;
    color: var(--text-3);
    flex-wrap: wrap;
}

.steam-footer span {
    display: flex;
    align-items: center;
    gap: 4px;
}

/* ===== 游戏信息区 ===== */
.steam-section {
    width: 100%;
    max-width: 700px;
    margin-bottom: 32px;
    margin-top: 48px;
}

.steam-section .steam-card {
    margin-bottom: 0;
}

.steam-section-title {
    font-size: 1rem;
    font-weight: 700;
    color: var(--text-1);
    margin-bottom: 10px;
    text-align: left;
}

/* ===== 使用引导（单行提示） ===== */
.home-hint {
    width: 100%;
    max-width: 700px;
    margin: 0 0 24px;
    font-size: 0.85rem;
    color: var(--text-3);
    text-align: left;
}

.hint-mobile {
    display: none;
}

/* 移动端：侧边栏变为顶部按钮打开，引导文案同步切换 */
@media (max-width: 768px) {
    .hint-mobile {
        display: inline;
    }

    .hint-desktop {
        display: none;
    }
}

/* ===== 工具列表 ===== */
.home-tools-preview {
    display: flex;
    flex-direction: column;
    gap: 12px;
    width: 100%;
    max-width: 700px;
}

.home-tools-title {
    font-size: 1rem;
    font-weight: 700;
    color: var(--text-1);
    margin-bottom: 2px;
}

.home-tool-card {
    display: flex;
    align-items: center;
    gap: 16px;
    padding: 16px 20px;
    background: var(--bg-2);
    border-radius: 12px;
    border: 1px solid var(--border);
    cursor: pointer;
    transition: all 0.25s ease;
}

.home-tool-card:hover {
    border-color: #4a90d9;
    box-shadow: 0 4px 16px rgba(74, 144, 217, 0.08);
    transform: translateX(4px);
}

.home-tool-info {
    flex: 1;
}

.home-tool-info h3 {
    font-size: 1rem;
    font-weight: 600;
    color: var(--text-1);
}

.home-tool-info p {
    font-size: 0.85rem;
    color: var(--text-3);
}

.home-tool-arrow {
    font-size: 1.2rem;
    color: var(--text-4);
    transition: all 0.25s ease;
}

.home-tool-card:hover .home-tool-arrow {
    color: #4a90d9;
    transform: translateX(4px);
}

.steam-rating-row {
    margin-bottom: 6px;
}

/* ============================================================
   响应式
   ============================================================ */

@media (max-width: 640px) {
    .steam-card-inner {
        flex-direction: column;
        align-items: stretch;
        padding: 10px;
    }

    .steam-cover {
        width: 100%;
        height: auto;
        aspect-ratio: 16 / 9;
    }

    .steam-info {
        padding: 10px 4px 4px 4px;
    }

    .steam-title {
        font-size: 1rem;
    }

    .steam-actions {
        justify-content: stretch;
    }

    .steam-btn {
        flex: 1;
        justify-content: center;
    }

    .steam-footer {
        gap: 12px;
        padding: 6px 12px 8px;
        font-size: 0.6rem;
    }

    .home-hero h1 {
        font-size: 2rem;
    }

    .home-icon img {
        width: 60px;
        height: 60px;
    }

    .home-page {
        padding: 24px 12px;
    }

    .home-tools-preview {
        max-width: 100%;
    }

    .steam-section {
        margin-bottom: 24px;
    }

    .steam-section .steam-card {
        margin-bottom: 0;
    }
}

@media (max-width: 400px) {
    .steam-title-row {
        flex-direction: column;
        align-items: flex-start;
        gap: 4px;
    }

    .steam-rating-row {
        flex-wrap: wrap;
    }
}
</style>