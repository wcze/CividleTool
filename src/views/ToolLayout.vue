<template>
    <ToolContainer :tools="tools" :currentToolId="currentToolId" @goHome="goHome" @switchTool="switchTool">
        <div class="tool-content">
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
                        <h1>CivIdle <span>Tool</span></h1>
                        <p class="home-subtitle">
                            <span>{{ t('home.subtitle') }}</span>{{ t('home.toolset') }}
                        </p>
                    </div>

                    <!-- ===== Steam 风格游戏卡片 ===== -->
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
                                    Fish Pond Studio
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
            </template>
        </div>
    </ToolContainer>
</template>

<script setup>
import iconUrl from '@/assets/icon.webp'
import gameCover from '@/assets/background.jpg'
import { computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import ToolContainer from '../components/ToolContainer.vue'
import CalcBuildingsUpgrade from './tools/CalcBuildingsUpgrade.vue'
import { t } from '../i18n'

const router = useRouter()
const route = useRoute()

// 工具列表随语言变化
const tools = computed(() => [
    {
        id: 'CalcBuildingsUpgrade',
        name: t('tools.CalcBuildingsUpgrade.name'),
        description: t('tools.CalcBuildingsUpgrade.description')
    }
])

const componentsMap = {
    'CalcBuildingsUpgrade': CalcBuildingsUpgrade
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
    animation: fadeInUp 0.35s ease both;
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
    justify-content: center;
    min-height: 60vh;
    padding: 40px 20px;
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
    background: #1a1a2e;
    /* Steam 深色背景 */
    border-radius: 4px;
    overflow: hidden;
    margin-bottom: 32px;
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.5);
    font-family: 'Motiva Sans', 'Segoe UI', Arial, sans-serif;
}

.steam-card-inner {
    display: flex;
    gap: 0;
    padding: 12px;
    background: #1a1a2e;
}

/* ===== 封面图（Steam 风格） ===== */
.steam-cover {
    flex-shrink: 0;
    width: 200px;
    height: 113px;
    border-radius: 2px;
    overflow: hidden;
    position: relative;
    background: #0d0d1a;
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
    background: linear-gradient(135deg, #1a1a2e 0%, #2a2a4e 100%);
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
    font-weight: 500;
    color: #fff;
    letter-spacing: 0.5px;
}

.steam-tag {
    font-size: 0.6rem;
    font-weight: 400;
    color: #a4d007;
    background: rgba(164, 208, 7, 0.12);
    padding: 1px 10px;
    border-radius: 2px;
    border: 1px solid rgba(164, 208, 7, 0.2);
    text-transform: uppercase;
    letter-spacing: 0.5px;
}

.steam-desc {
    font-size: 0.85rem;
    color: #8f98a0;
    margin: 6px 0 8px;
    line-height: 1.4;
}

.steam-price {
    font-size: 0.85rem;
    font-weight: 700;
    color: #a4d007;
    margin-left: 6px;
}

/* ===== 按钮（Steam 风格） ===== */
.steam-actions {
    display: flex;
    gap: 8px;
    flex-wrap: wrap;
}

.steam-btn {
    padding: 6px 18px;
    border-radius: 2px;
    font-size: 0.8rem;
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
    background: linear-gradient(to bottom, #75b022 5%, #5c8e1b 95%);
    color: #fff;
    box-shadow: 0 1px 0 rgba(255, 255, 255, 0.1);
}

.steam-btn.primary:hover {
    background: linear-gradient(to bottom, #8cc43a 5%, #6ca02a 95%);
}

.steam-btn.primary:active {
    background: linear-gradient(to bottom, #4f7a17 5%, #5c8e1b 95%);
}

.steam-btn.secondary {
    background: rgba(255, 255, 255, 0.08);
    color: #fff;
    border: 1px solid rgba(255, 255, 255, 0.15);
}

.steam-btn.secondary:hover {
    background: rgba(255, 255, 255, 0.14);
    border-color: rgba(255, 255, 255, 0.25);
}

/* ===== Steam 底部信息 ===== */
.steam-footer {
    display: flex;
    gap: 24px;
    padding: 8px 16px 10px 16px;
    background: #131320;
    border-top: 1px solid #1f1f3a;
    font-size: 0.7rem;
    color: #6b7a8f;
    flex-wrap: wrap;
}

.steam-footer span {
    display: flex;
    align-items: center;
    gap: 4px;
}

/* ===== 工具列表 ===== */
.home-tools-preview {
    display: flex;
    flex-direction: column;
    gap: 12px;
    width: 100%;
    max-width: 480px;
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

.home-tool-icon {
    font-size: 1.5rem;
    flex-shrink: 0;
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

.steam-rating-row{
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

    .steam-card {
        margin-bottom: 24px;
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

/* ===== 动画 ===== */
@keyframes fadeInUp {
    from {
        opacity: 0;
        transform: translateY(12px);
    }

    to {
        opacity: 1;
        transform: translateY(0);
    }
}
</style>