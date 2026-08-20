<template>
  <div class="building-viewer">
    <!-- ===== 顶部搜索区 ===== -->
    <div class="search-section">
      <div class="section-header">
        <h1>{{ t('calcBuildings.title') }}</h1>
        <span class="badge">{{ t('calcBuildings.totalBuildings', { count: buildings.length }) }}</span>
      </div>
      <p class="subtitle">{{ t('calcBuildings.subtitle') }}</p>

      <div class="search-wrapper">
        <div class="search-input-container">
          <span class="search-icon">🔍</span>
          <input
            v-model="keyword"
            type="text"
            :placeholder="t('calcBuildings.searchPlaceholder')"
            class="search-input"
          />
          <button 
            v-if="keyword" 
            class="clear-btn" 
            @click="keyword = ''"
          >
            ✕
          </button>
        </div>

        <div class="search-stats" v-if="keyword">
          <span v-html="t('calcBuildings.foundCount', { count: filteredBuildings.length })"></span>
        </div>
      </div>
    </div>

    <!-- ===== 升级计算器（置顶） ===== -->
    <div v-if="selectedBuilding" class="calculator-panel">
      <div class="calculator-header">
        <div class="calc-title">
          <span class="building-icon calc-icon">
            <span v-if="selectedBuilding.spriteStyle" class="sprite" :style="selectedBuilding.spriteStyle"></span>
            <span v-else class="icon-fallback">🏗️</span>
          </span>
          <h2>{{ selectedBuilding.building }}</h2>
          <span class="mult-badge-lg">{{ t('calcBuildings.multiplier') }} ×{{ selectedBuilding.mult }}</span>
        </div>
        <button class="close-btn" @click="closeCalculator">✕ {{ t('calcBuildings.close') }}</button>
      </div>

      <!-- 建筑信息：解锁时代 / 解锁科技 / 建造者能力 -->
      <div class="building-meta" v-if="selectedBuilding">
        <span class="meta-item" v-if="selectedBuilding.age">
          <span class="meta-label">{{ t('calcBuildings.unlockAge') }}</span>
          <span class="meta-value">{{ tGame(selectedBuilding.age) }}</span>
        </span>
        <span class="meta-item" v-if="selectedBuilding.tech">
          <span class="meta-label">{{ t('calcBuildings.unlockTech') }}</span>
          <span class="meta-value">{{ tGame(selectedBuilding.tech) }}</span>
        </span>
        <span class="meta-item">
          <span class="meta-label">{{ t('calcBuildings.builderInit') }}</span>
          <span class="meta-value">{{ formatNumber(selectedBuilding.builder_init ?? 1) }}</span>
        </span>
        <span class="meta-item meta-power">
          <span class="meta-label">{{ t('calcBuildings.builderPower') }}</span>
          <span class="meta-value">{{ formatNumber(builderPower) }}</span>
        </span>
      </div>

      <div class="calculator-body">
        <!-- 输入区 -->
        <div class="input-row">
          <div class="input-group">
            <label>{{ t('calcBuildings.currentLevel') }}</label>
            <input 
              v-model.number="currentLevel" 
              type="number" 
              min="0"
              class="num-input"
              @input="calculate"
            />
          </div>
          <div class="input-group">
            <label>{{ t('calcBuildings.targetLevel') }}</label>
            <input 
              v-model.number="targetLevel" 
              type="number" 
              min="0"
              class="num-input"
              @input="calculate"
            />
            <!-- 目标等级快速按钮 -->
            <div class="level-presets">
              <button 
                v-for="lvl in [20, 25, 35, 40, 45, 50]" 
                :key="lvl" 
                class="preset-btn"
                @click="targetLevel = lvl; calculate()"
              >
                {{ lvl }}
              </button>
            </div>
          </div>
          <div class="input-group">
            <label>{{ t('calcBuildings.buildingCount') }}</label>
            <input 
              v-model.number="buildingCount" 
              type="number" 
              min="1"
              class="num-input"
              @input="calculate"
            />
          </div>
          <div class="input-group">
            <div class="label-with-help">
              <label>{{ t('calcBuildings.builderCapacity') }}</label>
              <button 
                type="button" 
                class="help-icon" 
                :aria-label="t('calcBuildings.builderCapacityHelpAlt')" 
                @click="showHelpDialog = true"
              >
                ?
              </button>
            </div>
            <input 
              v-model.number="builderMultiplier" 
              type="number" 
              min="0"
              step="0.1"
              class="num-input"
              @input="calculate"
            />
          </div>
        </div>

        <!-- 结果区 -->
        <div class="result-area" v-if="totalResources.length > 0 && targetLevel > currentLevel">
          <div class="result-header">
            <span>{{ t('calcBuildings.upgradeResources') }}</span>
            <span class="level-range">
              {{ t('calcBuildings.levelRange', { current: currentLevel, target: targetLevel }) }}
              <span class="level-count">{{ t('calcBuildings.levelCount', { count: levelDiff }) }}</span>
            </span>
          </div>

          <!-- 每个资源单独显示 -->
          <div class="result-list">
            <div 
              v-for="res in totalResources" 
              :key="res.resource"
              class="result-item"
            >
              <span class="result-name">{{ res.resource }}</span>
              <span class="result-count">
                <strong>{{ formatNumber(res.total * buildingCount) }}</strong>
                <span class="result-detail" v-if="buildingCount > 1">
                  ({{ formatNumber(res.total) }} × {{ buildingCount }})
                </span>
              </span>
            </div>
          </div>

          <!-- 建造所需时间 -->
          <div class="time-result" v-if="totalBuildTime > 0">
            <span class="time-label">⏱️ {{ t('calcBuildings.buildTime') }}</span>
            <strong class="time-value">{{ formatTime(totalBuildTime) }}</strong>
            <span class="time-detail">{{ t('calcBuildings.buildTimeDetail', { count: levelDiff }) }}</span>
          </div>
        </div>

        <div v-else class="result-empty">
          {{ t('calcBuildings.emptyResult') }}
        </div>
      </div>
    </div>

    <!-- ===== 建造者能力乘数说明弹窗（Teleport 到 body，避免被父级 transform 影响） ===== -->
    <Teleport to="body">
      <div 
        v-if="showHelpDialog" 
        class="dialog-overlay" 
        @click.self="showHelpDialog = false"
      >
        <div class="dialog-panel" role="dialog" aria-modal="true" :aria-label="t('calcBuildings.builderCapacityHelpAlt')">
          <div class="dialog-header">
            <h3>{{ t('calcBuildings.builderCapacityHelpAlt') }}</h3>
            <button type="button" class="dialog-close" @click="showHelpDialog = false">✕</button>
          </div>
          <div class="dialog-body">
            <img :src="builderCapacityImage" :alt="t('calcBuildings.builderCapacityHelpAlt')" />
          </div>
        </div>
      </div>
    </Teleport>

    <!-- ===== 建筑卡片列表 ===== -->
    <div class="building-grid" v-if="filteredBuildings.length > 0">
      <div 
        v-for="item in filteredBuildings" 
        :key="item.building"
        class="building-card"
        :class="{ active: selectedBuilding && selectedBuilding.building === item.building }"
        @click="selectBuilding(item)"
      >
        <div class="card-header">
          <div class="building-title">
            <span class="building-icon">
              <span v-if="item.spriteStyle" class="sprite" :style="item.spriteStyle"></span>
              <span v-else class="icon-fallback">🏗️</span>
            </span>
            <span class="building-name">{{ item.building }}</span>
          </div>
          <span class="mult-badge">×{{ item.mult }}</span>
        </div>

        <div class="resources">
          <span class="resource-label">{{ t('calcBuildings.buildResources') }}</span>
          <div class="resource-list">
            <span 
              v-for="res in item.build_resources" 
              :key="res.resource"
              class="resource-tag"
            >
              {{ res.resource }}
              <span class="count">{{ res.count }}</span>
            </span>
          </div>
        </div>
      </div>
    </div>

    <!-- ===== 空状态 ===== -->
    <div v-else class="empty-state">
      <span class="empty-icon">🔍</span>
      <p v-html="t('calcBuildings.noResults', { keyword })"></p>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, nextTick } from 'vue'
import buildingsData from '@/data/buildings.json'
import texturesData from '@/data/textures_building.json'
import spriteImage from '@/assets/textures_building.png'
import builderCapacityImage from '@/assets/How-to-view-Builder-Capacity-Multiplier.png'
import { t, tGame, locale } from '@/i18n'

// ===== 建筑贴图（雪碧图） =====
// textures_building.json 中的键名形如 Building_StoneQuarry，
// buildings.json 中是 StoneQuarry，需要自己补上 Building_ 前缀。
// 个别建筑名与贴图键名不一致，通过别名映射修正。
const BUILDING_FRAME_ALIASES = {
  StatisticsOffice: 'Statistics',
  YearOfTheSnakeV2: 'YearOfTheSnake'
}

// 图标显示尺寸（px）
const ICON_SIZE = 48

// 根据建筑名获取贴图 frame（{ x, y, w, h }），找不到返回 null
function getFrame(buildingKey) {
  const key = BUILDING_FRAME_ALIASES[buildingKey] || buildingKey
  return texturesData.frames[`Building_${key}`]?.frame || null
}

// 生成雪碧图遮罩样式：把 PNG 作为 mask，再填充颜色实现单色图标
function getSpriteStyle(buildingKey) {
  const frame = getFrame(buildingKey)
  if (!frame) return null
  const scale = Math.min(ICON_SIZE / frame.w, ICON_SIZE / frame.h)
  return {
    width: `${frame.w}px`,
    height: `${frame.h}px`,
    transform: `translate(-50%, -50%) scale(${scale})`,
    // 通过 CSS 变量传递雪碧图遮罩参数（供 .sprite 及其伪元素加粗层使用）
    '--mask-image': `url(${spriteImage})`,
    '--mask-position': `-${frame.x}px -${frame.y}px`
  }
}

// 建筑数据：建筑名 / 资源名按当前语言翻译（中文使用游戏内本地化数据）
const buildings = computed(() =>
  buildingsData.map((b) => {
    const item = {
      ...b,
      buildingKey: b.building,
      building: tGame(b.building),
      build_resources: b.build_resources.map((r) => ({
        ...r,
        resource: tGame(r.resource)
      }))
    }
    // 预计算贴图样式，模板中直接使用
    item.spriteStyle = getSpriteStyle(item.buildingKey)
    return item
  })
)
const keyword = ref('')
const selectedBuilding = ref(null)

// 计算器输入
const currentLevel = ref(0)
const targetLevel = ref(1)
const buildingCount = ref(1)

// 建造者能力乘数：从 localStorage 自动读取，变化时自动保存
const BUILDER_MULTIPLIER_KEY = 'cividle-builder-multiplier'
const storedMultiplier = parseFloat(localStorage.getItem(BUILDER_MULTIPLIER_KEY))
const builderMultiplier = ref(Number.isFinite(storedMultiplier) ? storedMultiplier : 1)
watch(builderMultiplier, (val) => {
  if (val === undefined || val === null || val === '' || !Number.isFinite(Number(val))) {
    localStorage.removeItem(BUILDER_MULTIPLIER_KEY)
    return
  }
  localStorage.setItem(BUILDER_MULTIPLIER_KEY, String(val))
})

// 建造者能力 = 基础建造者能力 × 建造者能力乘数
// 普通建筑基础能力 = 1；奇观基础能力 = builder_init（时代/科技列计算）
const builderPower = computed(() => {
  if (!selectedBuilding.value) return 0
  const init = selectedBuilding.value.builder_init ?? 1
  const bm = Math.max(0, builderMultiplier.value || 1)
  return init * bm
})

// 建造者能力乘数说明弹窗是否显示
const showHelpDialog = ref(false)

// 搜索过滤
const filteredBuildings = computed(() => {
  if (!keyword.value.trim()) {
    return buildings.value
  }
  const kw = keyword.value.trim().toLowerCase()
  return buildings.value.filter(item => 
    item.building.toLowerCase().includes(kw)
  )
})

// 选择建筑
const selectBuilding = (item) => {
  selectedBuilding.value = item
  currentLevel.value = 0
  targetLevel.value = 1
  buildingCount.value = 1
  calculate()
  
  // 滚动到顶部
  nextTick(() => {
    const calculator = document.querySelector('.calculator-panel')
    if (calculator) {
      calculator.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  })
}

// 关闭计算器
const closeCalculator = () => {
  selectedBuilding.value = null
}

// 每个等级升级的明细：材料 / 每秒运输量 / 耗时
const upgradeDetails = computed(() => {
  if (!selectedBuilding.value) return []
  if (targetLevel.value <= currentLevel.value) return []

  const mult = parseFloat(selectedBuilding.value.mult)
  const baseResources = selectedBuilding.value.build_resources
  const diff = targetLevel.value - currentLevel.value
  const bm = Math.max(0, builderMultiplier.value || 1)
  // 基础建造者能力：普通建筑 = 1，奇观 = builder_init（时代/科技列计算）
  const builderInit = selectedBuilding.value.builder_init ?? 1

  const details = []
  for (let i = 0; i < diff; i++) {
    const level = currentLevel.value + i
    const resourceMultiplier = Math.pow(mult, level)
    const perRes = baseResources.map((res) => ({
      resource: res.resource,
      count: parseFloat(res.count) * resourceMultiplier
    }))
    const materials = perRes.reduce((sum, r) => sum + r.count, 0)
    // 每秒运输量 = max(1, 当前等级) × 基础建造者能力 × 建造者能力乘数
    const rate = Math.max(1, level) * builderInit * bm
    details.push({
      from: level,
      to: level + 1,
      materials,
      rate,
      time: rate > 0 ? materials / rate : 0,
      perRes
    })
  }
  return details
})

// 计算从 currentLevel 到 targetLevel 的总资源
const totalResources = computed(() => {
  const result = {}
  upgradeDetails.value.forEach((d) => {
    d.perRes.forEach((r) => {
      result[r.resource] = (result[r.resource] || 0) + r.count
    })
  })
  return Object.keys(result).map((key) => ({
    resource: key,
    total: result[key]
  }))
})

// 建造所需总时间 = 各等级升级耗时之和
const totalBuildTime = computed(() =>
  upgradeDetails.value.reduce((sum, d) => sum + d.time, 0)
)

// 等级差
const levelDiff = computed(() => {
  return Math.max(0, targetLevel.value - currentLevel.value)
})

// 计算函数（触发响应式更新）
const calculate = () => {
  // 由 computed 自动触发
}

// 格式化数字
const formatNumber = (num) => {
  if (num >= 1e9) return (num / 1e9).toFixed(2) + 'B'
  if (num >= 1e6) return (num / 1e6).toFixed(2) + 'M'
  if (num >= 1e3) return (num / 1e3).toFixed(2) + 'K'
  return Math.round(num * 100) / 100
}

// 格式化时长（秒 → 年月日时分秒），随语言切换
// 月按 30 天、年按 365 天近似，避免巨大数字（如 1 亿小时）难以阅读
const formatTime = (seconds) => {
  const isZh = locale.value === 'zh'
  const y = isZh ? '年' : 'y'
  const mo = isZh ? '月' : 'mo'
  const d = isZh ? '天' : 'd'
  const h = isZh ? '小时' : 'h'
  const m = isZh ? '分' : 'm'
  const s = isZh ? '秒' : 's'
  if (!isFinite(seconds) || seconds <= 0) return '0' + s
  const round1 = (n) => Math.round(n * 10) / 10
  const total = round1(seconds)
  if (total < 60) return `${total}${s}`
  const mins = Math.floor(total / 60)
  const secs = round1(total - mins * 60)
  if (mins < 60) return `${mins}${m} ${secs}${s}`
  const hrs = Math.floor(mins / 60)
  const remMins = mins - hrs * 60
  if (hrs < 24) return `${hrs}${h} ${remMins}${m} ${secs}${s}`
  const days = Math.floor(hrs / 24)
  const remHrs = hrs - days * 24
  if (days < 30) return `${days}${d} ${remHrs}${h} ${remMins}${m} ${secs}${s}`
  const months = Math.floor(days / 30)
  const remDays = days - months * 30
  if (months < 12) return `${months}${mo} ${remDays}${d} ${remHrs}${h} ${remMins}${m} ${secs}${s}`
  const years = Math.floor(months / 12)
  const remMonths = months - years * 12
  return `${years}${y} ${remMonths}${mo} ${remDays}${d} ${remHrs}${h} ${remMins}${m} ${secs}${s}`
}
</script>

<style scoped>
.building-viewer {
  max-width: 100%;
  padding: 0 0 20px;
}

/* ===== 顶部搜索区 ===== */
.search-section {
  padding: 28px 0 24px;
  border-bottom: 1px solid #eef2f6;
  margin-bottom: 24px;
}

.section-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 2px;
}

.section-header h1 {
  font-size: 1.6rem;
  font-weight: 600;
  color: #1a2332;
}

.badge {
  font-size: 0.75rem;
  color: #fff;
  background: #4a90d9;
  padding: 2px 12px;
  border-radius: 20px;
  font-weight: 500;
}

.subtitle {
  font-size: 0.95rem;
  color: #6b7a8f;
  margin-bottom: 18px;
}

.search-wrapper {
  width: 100%;
}

.search-input-container {
  position: relative;
  display: flex;
  align-items: center;
  background: #f2f5f9;
  border-radius: 12px;
  transition: all 0.2s ease;
  border: 2px solid transparent;
  width: 100%;
}

.search-input-container:focus-within {
  background: #ffffff;
  border-color: #4a90d9;
  box-shadow: 0 0 0 4px rgba(74, 144, 217, 0.12);
}

.search-icon {
  padding: 0 0 0 16px;
  font-size: 0.95rem;
  opacity: 0.5;
  flex-shrink: 0;
}

.search-input {
  flex: 1;
  padding: 13px 12px;
  background: transparent;
  border: none;
  font-size: 0.95rem;
  color: #1a2332;
  outline: none;
  min-width: 0;
  width: 100%;
}

.search-input::placeholder {
  color: #9aabbf;
}

.clear-btn {
  background: none;
  border: none;
  color: #9aabbf;
  width: 30px;
  height: 30px;
  border-radius: 50%;
  cursor: pointer;
  font-size: 0.75rem;
  margin-right: 8px;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.clear-btn:hover {
  background: #e4e9f0;
  color: #1a2332;
}

.search-stats {
  margin-top: 10px;
  font-size: 0.85rem;
  color: #6b7a8f;
}

.search-stats strong {
  color: #1a2332;
  font-weight: 600;
}

/* ===== 升级计算器（置顶） ===== */
.calculator-panel {
  background: #ffffff;
  border-radius: 16px;
  padding: 20px 24px 24px;
  border: 2px solid #4a90d9;
  box-shadow: 0 4px 20px rgba(74, 144, 217, 0.08);
  margin-bottom: 24px;
}

.calculator-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
  padding-bottom: 14px;
  border-bottom: 1px solid #f0f4fa;
}

.calc-title {
  display: flex;
  align-items: center;
  gap: 12px;
}

.calc-icon {
  width: 56px;
  height: 56px;
}

.calculator-header h2 {
  font-size: 1.2rem;
  font-weight: 600;
  color: #1a2332;
}

.mult-badge-lg {
  font-size: 0.8rem;
  color: #e8824a;
  background: #fef3ed;
  padding: 2px 14px;
  border-radius: 12px;
  font-weight: 600;
}

.close-btn {
  background: none;
  border: none;
  font-size: 0.85rem;
  color: #9aabbf;
  cursor: pointer;
  padding: 4px 12px;
  border-radius: 8px;
  transition: all 0.2s;
}

.close-btn:hover {
  background: #f0f4fa;
  color: #1a2332;
}

/* 建筑信息：解锁时代 / 解锁科技 / 建造者能力 */
.building-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 16px;
}

.meta-item {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  background: #f5f8fc;
  border: 1px solid #e8eef6;
  border-radius: 8px;
  padding: 4px 12px;
  font-size: 0.8rem;
}

.meta-label {
  color: #8a9ab0;
}

.meta-value {
  font-weight: 600;
  color: #1a2332;
}

.meta-power {
  background: #eef7ff;
  border-color: #cfe6fa;
}

.meta-power .meta-value {
  color: #2b6cb0;
}

.input-row {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
  margin-bottom: 16px;
}

.input-group {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.input-group label {
  font-size: 0.8rem;
  font-weight: 500;
  color: #6b7a8f;
}

/* 带 ? 帮助提示的标签 */
.label-with-help {
  display: inline-flex;
  align-items: center;
  gap: 5px;
}

.help-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 18px;
  height: 18px;
  border-radius: 50%;
  background: #dce6f2;
  color: #4a90d9;
  font-size: 0.72rem;
  font-weight: 700;
  border: none;
  padding: 0;
  line-height: 1;
  cursor: pointer;
  flex-shrink: 0;
  user-select: none;
  transition: all 0.2s;
}

.help-icon:hover {
  background: #4a90d9;
  color: #ffffff;
}

/* ===== 说明弹窗（Dialog） ===== */
.dialog-overlay {
  position: fixed;
  inset: 0;
  z-index: 200;
  background: rgba(15, 23, 42, 0.55);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
  animation: dialog-fade 0.18s ease;
}

.dialog-panel {
  background: #ffffff;
  border-radius: 16px;
  max-width: min(760px, 100%);
  width: 100%;
  max-height: 85vh;
  display: flex;
  flex-direction: column;
  box-shadow: 0 24px 60px rgba(15, 23, 42, 0.35);
  overflow: hidden;
  animation: dialog-pop 0.2s ease;
}

.dialog-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 14px 18px;
  border-bottom: 1px solid #eef2f6;
}

.dialog-header h3 {
  font-size: 1rem;
  font-weight: 600;
  color: #1a2332;
  margin: 0;
}

.dialog-close {
  flex-shrink: 0;
  width: 32px;
  height: 32px;
  border-radius: 8px;
  background: #f0f5fe;
  border: 1px solid #dce6f2;
  color: #6b7a8f;
  font-size: 0.9rem;
  line-height: 1;
  cursor: pointer;
  transition: all 0.2s;
}

.dialog-close:hover {
  background: #e4e9f0;
  color: #1a2332;
}

.dialog-body {
  padding: 16px 18px 20px;
  overflow: auto;
}

.dialog-body img {
  display: block;
  width: 100%;
  height: auto;
  border-radius: 8px;
}

@keyframes dialog-fade {
  from { opacity: 0; }
  to { opacity: 1; }
}

@keyframes dialog-pop {
  from { opacity: 0; transform: translateY(12px) scale(0.98); }
  to { opacity: 1; transform: translateY(0) scale(1); }
}

/* 移动端适配：弹窗改为底部弹出 */
@media (max-width: 600px) {
  .dialog-overlay {
    padding: 12px;
    align-items: flex-end;
  }
  .dialog-panel {
    max-height: 88vh;
    border-radius: 16px 16px 0 0;
  }
}

.num-input {
  padding: 10px 14px;
  border: 1px solid #dce6f2;
  border-radius: 10px;
  font-size: 1rem;
  font-weight: 500;
  color: #1a2332;
  background: #fafcff;
  transition: all 0.2s;
  width: 100%;
}

.num-input:focus {
  outline: none;
  border-color: #4a90d9;
  box-shadow: 0 0 0 3px rgba(74, 144, 217, 0.1);
  background: #ffffff;
}

.num-input[type="number"]::-webkit-inner-spin-button,
.num-input[type="number"]::-webkit-outer-spin-button {
  -webkit-appearance: none;
  margin: 0;
}

.num-input[type="number"] {
  -moz-appearance: textfield;
  appearance: textfield;
}

/* 快速等级按钮样式（移动端适配优化） */
.level-presets {
  display: flex;
  gap: 6px;
  margin-top: 8px;
  flex-wrap: wrap;
}

.preset-btn {
  background: #f0f5fe;
  border: 1px solid #dce6f2;
  border-radius: 8px;
  padding: 6px 10px;
  font-size: 0.8rem;
  color: #4a90d9;
  cursor: pointer;
  transition: all 0.2s;
  font-weight: 600;
  flex: 1;
  min-width: 32px;
  text-align: center;
}

.preset-btn:hover, .preset-btn:active {
  background: #4a90d9;
  color: #ffffff;
  border-color: #4a90d9;
}

/* ===== 结果区 ===== */
.result-area {
  background: #f7faff;
  border-radius: 12px;
  padding: 16px 20px 18px;
  border: 1px solid #e8edf4;
}

.result-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
  flex-wrap: wrap;
  gap: 8px;
}

.result-header > span {
  font-weight: 600;
  color: #1a2332;
  font-size: 0.95rem;
}

.level-range {
  font-weight: 400;
  color: #6b7a8f;
  font-size: 0.85rem;
}

.level-count {
  color: #4a90d9;
  font-weight: 500;
}

.result-list {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.result-item {
  background: #ffffff;
  padding: 8px 18px 8px 14px;
  border-radius: 20px;
  border: 1px solid #dce6f2;
  display: flex;
  align-items: center;
  gap: 10px;
  flex: 0 1 auto;
}

.result-name {
  color: #6b7a8f;
  font-size: 0.85rem;
}

.result-count {
  font-weight: 400;
  color: #1a2332;
  font-size: 0.95rem;
  display: flex;
  align-items: center;
  gap: 4px;
}

.result-count strong {
  font-weight: 700;
  color: #1a2332;
  font-size: 1.05rem;
}

.result-detail {
  font-weight: 400;
  color: #9aabbf;
  font-size: 0.8rem;
}

.result-empty {
  padding: 14px;
  text-align: center;
  color: #9aabbf;
  font-size: 0.9rem;
}

/* 建造所需时间 */
.time-result {
  display: flex;
  align-items: baseline;
  gap: 10px;
  flex-wrap: wrap;
  margin-top: 14px;
  padding-top: 14px;
  border-top: 1px dashed #dce6f2;
}

.time-label {
  font-weight: 600;
  color: #1a2332;
  font-size: 0.95rem;
}

.time-value {
  font-weight: 700;
  color: #4a90d9;
  font-size: 1.15rem;
}

.time-detail {
  font-weight: 400;
  color: #9aabbf;
  font-size: 0.8rem;
}

/* ===== 建筑卡片网格 ===== */
.building-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
  gap: 14px;
}

.building-card {
  background: #ffffff;
  border-radius: 14px;
  padding: 18px 20px 20px;
  border: 1px solid #e8edf4;
  transition: all 0.25s ease;
  cursor: pointer;
}

.building-card:hover {
  border-color: #4a90d9;
  box-shadow: 0 4px 16px rgba(74, 144, 217, 0.08);
  transform: translateY(-2px);
}

.building-card.active {
  border-color: #4a90d9;
  background: #f7faff;
  box-shadow: 0 4px 16px rgba(74, 144, 217, 0.12);
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
  padding-bottom: 10px;
  border-bottom: 1px solid #f0f4fa;
  gap: 12px;
}

.building-title {
  display: flex;
  align-items: center;
  gap: 10px;
  min-width: 0;
}

.building-icon {
  width: 48px;
  height: 48px;
  flex-shrink: 0;
  border-radius: 8px;
  background: #f0f5fe;
  border: 1px solid #dce6f2;
  overflow: hidden;
  position: relative;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  /* 图标颜色：在此处统一修改即可 */
  --icon-color: #102122;
}

/* 使用 mask 把雪碧图作为遮罩，再填充颜色，实现单色图标 */
.building-icon .sprite {
  display: block;
  position: absolute;
  left: 50%;
  top: 50%;
  transform-origin: center center;
  background-color: var(--icon-color);
  -webkit-mask-image: var(--mask-image);
  mask-image: var(--mask-image);
  -webkit-mask-position: var(--mask-position);
  mask-position: var(--mask-position);
  -webkit-mask-repeat: no-repeat;
  mask-repeat: no-repeat;
  -webkit-mask-size: auto;
  mask-size: auto;
  image-rendering: pixelated;
}

/* 伪元素作为“加粗层”：轻微偏移制造厚度 */
.building-icon .sprite::before {
  content: '';
  position: absolute;
  inset: 0;
  -webkit-mask-image: var(--mask-image);
  mask-image: var(--mask-image);
  -webkit-mask-position: var(--mask-position);
  mask-position: var(--mask-position);
  -webkit-mask-repeat: no-repeat;
  mask-repeat: no-repeat;
  -webkit-mask-size: auto;
  mask-size: auto;
  background-color: var(--icon-color);
  transform: translate(1px, 1px);
  z-index: -1;
}

.icon-fallback {
  font-size: 1.5rem;
  line-height: 1;
}

.building-name {
  font-size: 1.05rem;
  font-weight: 600;
  color: #1a2332;
}

.mult-badge {
  font-size: 0.8rem;
  color: #e8824a;
  background: #fef3ed;
  padding: 1px 12px;
  border-radius: 12px;
  font-weight: 600;
}

.resource-label {
  font-size: 0.75rem;
  color: #6b7a8f;
  font-weight: 500;
  display: block;
  margin-bottom: 6px;
}

.resource-list {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.resource-tag {
  background: #f0f5fe;
  padding: 4px 12px 4px 14px;
  border-radius: 16px;
  font-size: 0.85rem;
  color: #1a2332;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  border: 1px solid #dce6f2;
}

.resource-tag .count {
  font-weight: 600;
  color: #4a90d9;
  font-size: 0.8rem;
}

/* ===== 空状态 ===== */
.empty-state {
  text-align: center;
  padding: 60px 20px;
}

.empty-icon {
  font-size: 2.8rem;
  display: block;
  margin-bottom: 10px;
}

.empty-state p {
  color: #6b7a8f;
  font-size: 0.95rem;
}

.empty-state strong {
  color: #1a2332;
}

/* ===== 响应式 ===== */
@media (max-width: 992px) {
  .input-row {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 768px) {
  .input-row {
    grid-template-columns: 1fr 1fr;
  }

  .calc-title {
    flex-wrap: wrap;
  }
}

@media (max-width: 600px) {
  .search-section {
    padding: 18px 0 16px;
  }

  .section-header h1 {
    font-size: 1.3rem;
  }

  .badge {
    font-size: 0.7rem;
    padding: 1px 10px;
  }

  .building-grid {
    grid-template-columns: 1fr;
  }

  .building-card {
    padding: 16px;
  }

  .search-input {
    padding: 11px 10px;
    font-size: 0.9rem;
  }

  .calculator-panel {
    padding: 16px 14px 18px;
  }

  .input-row {
    grid-template-columns: 1fr;
    gap: 10px;
  }

  .calculator-header {
    flex-wrap: wrap;
    gap: 8px;
  }

  .calc-title {
    flex-wrap: wrap;
  }

  .calculator-header h2 {
    font-size: 1rem;
  }

  .result-header {
    flex-direction: column;
    align-items: flex-start;
  }

  .result-list {
    flex-direction: column;
  }

  .result-item {
    justify-content: space-between;
    width: 100%;
  }

  .result-count {
    flex-wrap: wrap;
    justify-content: flex-end;
  }
}
</style>