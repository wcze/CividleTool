<template>
  <div ref="buildingViewerRef" class="building-viewer" :class="{ 'building-viewer-page-mode': !calculatorFullscreen }">
    <!-- ===== 升级计算器（置顶） ===== -->
    <AppDialog
      v-model="showCalculatorDialog"
      v-model:fullscreen="calculatorFullscreen"
      :title="t('calcBuildings.calculatorTitle')"
      :large="true"
      :fullscreen-toggle="!isMobileViewport"
      :teleport="calculatorFullscreen"
      :origin="calculatorDialogOrigin"
      :page-bounds="calculatorPageBounds"
      :animate-from-origin="true"
    >
      <div v-if="selectedBuilding" class="calculator-panel">
      <div class="calculator-header">
        <p v-if="selectedBuilding.desc" class="building-desc">
          {{ tGame(selectedBuilding.desc) }}
        </p>
        <div class="calc-title">
          <span class="building-icon calc-icon">
            <span v-if="selectedBuilding.spriteStyle" class="sprite" :style="selectedBuilding.spriteStyle"></span>
            <span v-else class="icon-fallback">🏗️</span>
          </span>
          <h2>{{ selectedBuilding.building }}</h2>
          <span v-if="getWonderTypeKey(selectedBuilding)" class="wonder-badge-lg">
            {{ t(`calcBuildings.${getWonderTypeKey(selectedBuilding)}`) }}
          </span>
          <span class="mult-badge-lg">{{ getBuildingMultiplierLabel(selectedBuilding) }}</span>
        </div>
      </div>

      <!-- 建筑信息：解锁时代 / 解锁科技 / 文明 / 建造者能力 -->
      <div class="building-meta" v-if="selectedBuilding">
        <span class="meta-item" v-if="selectedBuilding.city">
          <span class="meta-label">{{ t('calcBuildings.unlockCity') }}</span>
          <span class="meta-value">{{ tGame(selectedBuilding.city) }}</span>
        </span>
        <span class="meta-item" v-if="selectedBuilding.age">
          <span class="meta-label">{{ t('calcBuildings.unlockAge') }}</span>
          <span class="meta-value">{{ tGame(selectedBuilding.age) }}</span>
        </span>
        <span class="meta-item" v-if="selectedBuilding.tech">
          <span class="meta-label">{{ t('calcBuildings.unlockTech') }}</span>
          <span class="meta-value">{{ tGame(selectedBuilding.tech) }}</span>
        </span>
        <span class="meta-item" v-if="exclusiveCivilizationNames.length > 0">
          <span class="meta-label">{{ t('calcBuildings.exclusiveCivilization') }}</span>
          <span class="meta-value">{{ exclusiveCivilizationNames.join(locale === 'zh' ? '、' : ', ') }}</span>
        </span>
        <span class="meta-item" v-if="selectedBuilding.builder_init != null">
          <span class="meta-label">{{ t('calcBuildings.builderInit') }}</span>
          <span class="meta-value">{{ formatNumber(selectedBuilding.builder_init) }}</span>
        </span>
        <span v-if="!isNaturalWonder(selectedBuilding)" class="meta-item meta-power">
          <span class="meta-label">{{ t('calcBuildings.builderPower') }}</span>
          <span class="meta-value">{{ formatNumber(builderPower) }}</span>
        </span>
      </div>

      <div v-if="!isNaturalWonder(selectedBuilding)" class="calculator-body">
        <!-- 输入区 -->
        <div class="input-row">
          <div class="input-group">
            <label>{{ t('calcBuildings.currentLevel') }}</label>
            <input v-model.number="currentLevel" type="number" min="0" max="150"
              :disabled="isNonUpgradableWonder(selectedBuilding)" class="num-input"
              @input="onLevelInput('currentLevel')" />
          </div>
          <div class="input-group">
            <label>{{ t('calcBuildings.targetLevel') }}</label>
            <input v-model.number="targetLevel" type="number" min="0" :max="maxTargetLevel"
              :disabled="isNonUpgradableWonder(selectedBuilding)" class="num-input"
              @input="onLevelInput('targetLevel')" />
            <!-- 目标等级快速按钮 -->
            <div v-if="!isNonUpgradableWonder(selectedBuilding)" class="level-presets">
              <button v-for="lvl in [25, 30, 35, 40, 45, 50]" :key="lvl" class="preset-btn"
                @click="setTargetLevel(lvl)">
                {{ lvl }}
              </button>
            </div>
          </div>
          <div class="input-group">
            <label>{{ t('calcBuildings.buildingCount') }}</label>
            <input v-model.number="buildingCount" type="number" min="0" :max="maxBuildingCount"
              :disabled="maxBuildingCount === 1" class="num-input"
              @input="onBuildingCountInput('buildingCount')" />
          </div>
          <div class="input-group">
            <div class="label-with-help">
              <label>{{ t('calcBuildings.builderCapacity') }}</label>
              <button type="button" class="help-icon" :aria-label="t('calcBuildings.builderCapacityHelpAlt')"
                @click="showHelpDialog = true">
                ?
              </button>
            </div>
            <input v-model.number="builderMultiplier" type="number" min="0" step="0.1" class="num-input"
              @input="calculate" />
          </div>
        </div>

        <!-- 结果区 -->
        <div v-if="isLevelRangeInvalid" class="empty-result">
          {{ t('calcBuildings.emptyResult') }}
        </div>
        <div class="result-area" v-else-if="totalResources.length > 0 && levelDiff > 0">
          <div class="result-header">
            <div class="result-header-left">
              <span class="result-title">{{ t('calcBuildings.upgradeResources') }}</span>
              <button type="button" class="detail-btn"
                v-if="!isNonUpgradableWonder(selectedBuilding) && upgradeDetails.length > 0"
                @click="showDetails = !showDetails">
                <span>{{ showDetails ? t('calcBuildings.hideDetails') : t('calcBuildings.viewDetails') }}</span>
                <span class="chevron" :class="{ open: showDetails }">▾</span>
              </button>
            </div>
            <div class="result-header-right">
              <span class="level-range">
                {{ t('calcBuildings.levelRange', { current: currentLevel, target: targetLevel }) }}
                <span class="level-count">{{ t('calcBuildings.levelCount', { count: levelDiff }) }}</span>
              </span>
            </div>
          </div>

          <!-- 每个资源单独显示 -->
          <div class="result-list">
            <div v-for="res in totalResources" :key="res.resource" class="result-item">
              <span class="result-name">{{ res.resource }}</span>
              <span class="result-count">
                <strong>{{ formatNumber(res.total * buildingCount) }}</strong>
                <span class="result-detail" v-if="buildingCount > 1">
                  ({{ formatNumber(res.total) }} × {{ buildingCount }})
                </span>
              </span>
            </div>
          </div>
          <div class="time-result" v-if="totalBuildTime > 0">
            <span class="time-label">{{ t('calcBuildings.buildTime') }}</span>
            <strong class="time-value">{{ formatTime(totalBuildTime) }}</strong>
            <span class="time-detail">{{ t('calcBuildings.buildTimeDetail', { count: levelDiff }) }}</span>
          </div>
          <div class="detail-table-wrap" v-if="showDetails && upgradeDetails.length > 0">
            <table class="detail-table">
              <thead>
                <tr>
                  <th>{{ t('calcBuildings.detailCurrent') }}</th>
                  <th>{{ t('calcBuildings.detailTarget') }}</th>
                  <th v-for="res in detailResources" :key="res">{{ res }}</th>
                  <th>{{ t('calcBuildings.detailTime') }}</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="d in upgradeDetails" :key="d.from">
                  <td>{{ d.from }}</td>
                  <td>{{ d.to }}</td>
                  <td v-for="res in detailResources" :key="res">{{ resCount(d, res) }}</td>
                  <td>{{ formatTime(d.time) }}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <div v-if="hasConsumptionInputs" class="calculator-body consumption-calculator-body">
        <div class="result-header consumption-header">
          <div class="result-header-left">
            <span class="result-title">{{ t('calcBuildings.consumptionTitle') }}</span>
            <button type="button" class="detail-btn" @click="showConsumptionDetails = !showConsumptionDetails">
              <span>{{ showConsumptionDetails ? t('calcBuildings.hideDetails') : t('calcBuildings.viewDetails') }}</span>
              <span class="chevron" :class="{ open: showConsumptionDetails }">▾</span>
            </button>
          </div>
        </div>

        <template v-if="showConsumptionDetails">
          <div class="input-row consumption-input-row">
            <div class="input-group">
              <label>{{ t('calcBuildings.actualLevel') }}</label>
              <input v-model.number="actualLevel" type="number" min="0" max="150" class="num-input"
                @input="onLevelInput('actualLevel')" />
            </div>
            <div class="input-group">
              <label>{{ t('calcBuildings.buildingCount') }}</label>
              <input v-model.number="consumptionBuildingCount" type="number" min="0" :max="maxBuildingCount"
                :disabled="maxBuildingCount === 1" class="num-input"
                @input="onBuildingCountInput('consumptionBuildingCount')" />
            </div>
          </div>

          <div class="result-header consumption-formula-row">
            <span class="level-range">
              {{ t('calcBuildings.consumptionFormula', { level: actualLevel, count: consumptionBuildingCount }) }}
            </span>
          </div>
          <div class="detail-table-wrap">
            <table class="detail-table consumption-table">
              <colgroup>
                <col class="consumption-period-column" />
                <col v-for="resource in consumptionStats" :key="`column-${resource.key}`"
                  class="consumption-resource-column" />
              </colgroup>
              <thead>
                <tr>
                  <th>{{ t('calcBuildings.consumptionPeriod') }}</th>
                  <th v-for="resource in consumptionStats" :key="resource.key">{{ resource.resource }}</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="period in consumptionPeriods" :key="period.key">
                  <th>{{ period.label }}</th>
                  <td v-for="resource in consumptionStats" :key="resource.key">
                    {{ formatNumber(resource.values[period.key]) }}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </template>
      </div>

      <div v-if="productionGraph" class="calculator-body production-calculator-body">
        <div class="result-header production-header">
          <div class="result-header-left">
            <span class="result-title">{{ t('calcBuildings.productionRoute') }}</span>
            <button type="button" class="detail-btn" @click="showProductionDetails = !showProductionDetails">
              <span>{{ showProductionDetails ? t('calcBuildings.hideDetails') : t('calcBuildings.viewDetails') }}</span>
              <span class="chevron" :class="{ open: showProductionDetails }">▼</span>
            </button>
          </div>
        </div>

        <div v-if="showProductionDetails" class="production-chart-wrap">
          <svg class="production-chart" :viewBox="`0 0 ${productionGraph.width} ${productionGraph.height}`"
            :width="productionGraph.width" :height="productionGraph.height" role="img">
            <defs>
              <marker v-for="(color, index) in productionPalette" :key="`production-arrow-${index}`"
                :id="`production-arrow-${index}`" viewBox="0 0 6 6" markerWidth="5" markerHeight="5"
                refX="5" refY="3" orient="auto">
                <path d="M0,0L6,3L0,6z" :fill="color" />
              </marker>
            </defs>
            <g class="production-edge-layer">
              <path v-for="edge in productionGraph.edges.filter(edge => !productionHoverId || !productionRelated(edge))"
                :key="edge.key" class="production-edge"
                :class="{ dim: productionHoverId && !productionRelated(edge) }"
                :d="edge.path" :stroke="productionPalette[edge.colorIndex]"
                :marker-end="`url(#production-arrow-${edge.colorIndex})`" />
            </g>
            <g v-for="node in productionGraph.nodes" :key="node.id" class="production-node"
              :class="{ building: node.kind === 'building', resource: node.kind === 'resource', highlight: productionRelatedNode(node), hovered: productionHoverId === node.id }"
              @mouseenter="productionHoverId = node.id" @mouseleave="productionHoverId = null">
              <rect :x="node.x" :y="node.y" :width="node.width" :height="node.totalHeight || node.height" rx="6"
                :style="productionNodeBorderColor(node) ? { '--node-stroke': productionNodeBorderColor(node) } : null"
                @mouseenter.stop="productionHoverId = node.id" />
              <foreignObject v-if="node.kind === 'building' && node.frame" :x="node.x + 8" :y="node.y + 8"
                width="48" height="48">
                <div xmlns="http://www.w3.org/1999/xhtml" class="building-icon production-icon-box">
                  <span class="sprite" :style="node.spriteStyle"></span>
                </div>
              </foreignObject>
              <text :x="node.kind === 'building' ? node.x + 68 : node.x + node.width / 2"
                :y="node.y + 22" :text-anchor="node.kind === 'building' ? 'start' : 'middle'">{{ node.label }}</text>
              <text v-for="(line, index) in node.detailLines" :key="`${node.id}-${index}`" class="production-detail"
                :x="node.kind === 'building' ? node.x + 68 : node.x + node.width / 2"
                :y="node.y + 42 + index * 18" :text-anchor="node.kind === 'building' ? 'start' : 'middle'">{{ line }}</text>
              <g v-for="switcher in node.switchers" :key="`${node.id}-switch-${switcher.resource}`"
                class="production-switch" @mouseenter.stop="productionHoverId = null">
                <rect class="switch-prev" :rx="5" :x="node.x + 1" :y="node.y + node.height - 1" :width="node.width / 2 - 2" height="30" rx="0"
                  @click.stop="toggleProductionChoice(switcher.resource, -1)" />
                <rect class="switch-next" :rx="5" :x="node.x + node.width / 2 + 1" :y="node.y + node.height - 1" :width="node.width / 2 - 2" height="30" rx="0"
                  @click.stop="toggleProductionChoice(switcher.resource, 1)" />
                <line :x1="node.x" :y1="node.y + node.height" :x2="node.x + node.width" :y2="node.y + node.height" />
                <line :x1="node.x + node.width / 2" :y1="node.y + node.height" :x2="node.x + node.width / 2" :y2="node.y + node.totalHeight" />
                <text :x="node.x + node.width / 4" :y="node.y + node.height + 19" text-anchor="middle"><</text>
                <text :x="node.x + node.width * 0.75" :y="node.y + node.height + 19" text-anchor="middle">></text>
              </g>
            </g>
            <g v-if="productionHoverId" class="production-edge-overlay">
              <path v-for="edge in productionGraph.edges.filter(edge => productionRelated(edge))" :key="`active-${edge.key}`"
                class="production-edge highlight"
                :d="edge.path" :stroke="productionPalette[edge.colorIndex]"
                :marker-end="`url(#production-arrow-${edge.colorIndex})`" />
            </g>
          </svg>
        </div>
      </div>
      </div>
    </AppDialog>

    <!-- ===== 顶部搜索区 ===== -->
    <div class="search-section">
      <div class="subtitle-row">
        <p class="subtitle">{{ t('calcBuildings.subtitle') }}</p>
        <span class="badge">{{ t('calcBuildings.totalBuildings', { count: buildings.length }) }}</span>
      </div>

      <div class="search-wrapper">
        <div class="search-input-container">
          <input v-model="keyword" type="text" :placeholder="t('calcBuildings.searchPlaceholder')"
            class="search-input" />
          <button v-if="keyword" class="clear-btn" @click="keyword = ''">
            ✕
          </button>
        </div>

        <div class="search-stats" v-if="keyword">
          <span v-html="t('calcBuildings.foundCount', { count: filteredBuildings.length })"></span>
        </div>
      </div>

      <div class="building-filters">
          <div class="filter-button-group building-type-filter-group" role="group"
            :aria-label="t('calcBuildings.buildingTypeFilter')">
            <button type="button" class="filter-btn" :class="{ active: buildingTypeFilter === 'all' }"
              @click="setBuildingTypeFilter('all')">
              {{ t('calcBuildings.allTypes') }}
            </button>
            <button type="button" class="filter-btn" :class="{ active: buildingTypeFilter === 'building' }"
              @click="setBuildingTypeFilter('building')">
              {{ t('calcBuildings.ordinaryBuilding') }}
            </button>
            <button type="button" class="filter-btn" :class="{ active: buildingTypeFilter === 'worldWonder' }"
              @click="setBuildingTypeFilter('worldWonder')">
              {{ t('calcBuildings.worldWonder') }}
            </button>
            <button type="button" class="filter-btn" :class="{ active: buildingTypeFilter === 'naturalWonder' }"
              @click="setBuildingTypeFilter('naturalWonder')">
              {{ t('calcBuildings.naturalWonder') }}
            </button>
        </div>

        <div v-if="buildingTypeFilter !== 'naturalWonder'" class="filter-button-group age-filter-group" role="group"
          :aria-label="t('calcBuildings.ageFilter')">
          <button type="button" class="filter-btn" :class="{ active: buildingAgeFilter === 'all' }"
            @click="buildingAgeFilter = 'all'">
            {{ t('calcBuildings.allAges') }}
          </button>
          <button v-for="age in availableAges" :key="age.key" type="button" class="filter-btn"
            :class="{ active: buildingAgeFilter === age.key }" @click="buildingAgeFilter = age.key">
            {{ age.label }}
          </button>
        </div>
      </div>
    </div>

    <!-- ===== 建造者能力乘数说明弹窗 ===== -->
    <AppDialog v-model="showHelpDialog" :title="t('calcBuildings.builderCapacityHelpAlt')">
      <img :src="builderCapacityImage" :alt="t('calcBuildings.builderCapacityHelpAlt')" />
    </AppDialog>

    <!-- ===== 建筑卡片列表 ===== -->
    <div class="building-grid" v-if="filteredBuildings.length > 0">
      <div v-for="item in filteredBuildings" :key="item.building" class="building-card"
        :class="{ active: activeBuildingKey === item.buildingKey }"
        @click="selectBuilding(item, $event)">
        <div class="card-header" :class="{ 'natural-wonder-card-header': isNaturalWonder(item) }">
          <div class="building-title">
            <span class="building-icon">
              <span v-if="item.spriteStyle" class="sprite" :style="item.spriteStyle"></span>
              <span v-else class="icon-fallback">🏗️</span>
            </span>
            <span class="building-name">{{ item.building }}</span>
          </div>
          <span v-if="!isNonUpgradableWonder(item)" class="mult-badge">×{{ item.mult }}</span>
        </div>

        <div v-if="!isNaturalWonder(item)" class="resources">
          <span class="resource-label">{{ t('calcBuildings.buildResources') }}</span>
          <div class="resource-list">
            <span v-for="res in item.build_resources" :key="res.resource" class="resource-tag">
              {{ res.resource }}
              <span class="count">{{ res.count }}</span>
            </span>
          </div>
        </div>

        <div v-if="item.output.length > 0 && !isNaturalWonder(item)" class="resources">
          <span class="resource-label">{{ t('calcBuildings.buildingOutput') }}</span>
          <div class="resource-list">
            <span v-for="res in item.output" :key="res.resource" class="resource-tag">
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
import { ref, computed, watch, nextTick, onMounted, onBeforeUnmount } from 'vue'
import buildingsData from '@/data/buildings.json'
import civilizationData from '@/data/civilization.json'
import texturesData from '@/data/textures_building.json'
import spriteImage from '@/assets/textures_building.png'
import builderCapacityImage from '@/assets/How-to-view-Builder-Capacity-Multiplier.png'
import AppDialog from '@/components/AppDialog.vue'
import { t, tGame, locale } from '@/i18n'
import { formatNumber as formatNumberShared, FULL_SUFFIXES } from '@/utils/format'

// ===== 建筑贴图（雪碧图） =====
// textures_building.json 中的键名形如 Building_StoneQuarry，
// buildings.json 中是 StoneQuarry，需要自己补上 Building_ 前缀。
// 个别建筑名与贴图键名不一致，通过别名映射修正。
const BUILDING_FRAME_ALIASES = {
  StatisticsOffice: 'Statistics',
  YearOfTheSnakeV2: 'YearOfTheSnake'
}

const BUILDING_NAME_ALIASES = {
  TheMet: 'ThePentagon',
  YearOfTheSnake: 'YearOfTheSnakeV2',
  Statistics: 'StatisticsOffice',
  Shenandoah: 'GrandCanyon'
}

const getWonderTypeKey = (building) => {
  if (building?.special === 'WorldWonder') return 'worldWonder'
  if (building?.special === 'NaturalWonder') return 'naturalWonder'
  return null
}

const isNaturalWonder = (building) => building?.special === 'NaturalWonder'

const exclusiveCivilizationNames = computed(() => {
  const buildingKey = selectedBuilding.value?.buildingKey
  if (!buildingKey || !isNaturalWonder(selectedBuilding.value)) return []
  return civilizationData
    .filter(civilization => civilization.naturalWonders?.includes(buildingKey))
    .map(civilization => tGame(civilization.name))
})

const isNonUpgradableWonder = (building) =>
  getWonderTypeKey(building) != null && !building.upgradable

const getBuildingMultiplierLabel = (building) =>
  isNonUpgradableWonder(building)
    ? t('calcBuildings.notUpgradable')
    : `${t('calcBuildings.multiplier')} ×${building.mult}`

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
  const scale = Math.min(ICON_SIZE / frame.w, ICON_SIZE / frame.h) - 0.05;
  return {
    width: `${frame.w}px`,
    height: `${frame.h}px`,
    transform: `translate(-50%, -50%) scale(${scale})`,
    // 通过 CSS 变量传递雪碧图遮罩参数（供 .sprite 及其伪元素加粗层使用）
    '--mask-image': `url(${spriteImage})`,
    '--mask-position': `-${frame.x}px -${frame.y}px`
  }
}

const getBuildingCategoryRank = (building) => {
  if (building.special === 'WorldWonder') return 1
  if (building.special === 'NaturalWonder') return 2
  return 0
}

const STARTING_BUILDING_ORDER = ['Hut', 'StoneQuarry', 'LoggingCamp', 'Aqueduct']
const getStartingBuildingRank = (building) => {
  const rank = STARTING_BUILDING_ORDER.indexOf(building.buildingKey)
  return rank === -1 ? Number.MAX_SAFE_INTEGER : rank
}

const getBuildingCountryName = (building) => {
  if (building.city) return tGame(building.city)
  if (building.special !== 'NaturalWonder') return ''
  return civilizationData
    .filter(civilization => civilization.naturalWonders?.includes(building.building))
    .map(civilization => tGame(civilization.name))
    .join(', ')
}

// 建筑数据：建筑名 / 资源名按当前语言翻译（中文使用游戏内本地化数据）
const buildings = computed(() => {
  const translatedBuildings = buildingsData
    .filter(building => building.building !== 'Headquarter')
    .map((b) => {
    const item = {
      ...b,
      buildingKey: b.building,
      building: tGame(BUILDING_NAME_ALIASES[b.building] || b.building),
      build_resources: b.build_resources.map((r) => ({
        ...r,
        resource: tGame(r.resource)
      })),
      output: Object.entries(b.output || {}).map(([resource, count]) => ({
        resource: tGame(resource),
        count
      }))
    }
    // 预计算贴图样式，模板中直接使用
    item.spriteStyle = getSpriteStyle(item.buildingKey)
    return item
    })
  return translatedBuildings
    .map((building, index) => ({ building, index }))
    .sort((a, b) => {
      const startingDiff = getStartingBuildingRank(a.building) - getStartingBuildingRank(b.building)
      if (startingDiff !== 0) return startingDiff

      const categoryDiff = getBuildingCategoryRank(a.building) - getBuildingCategoryRank(b.building)
      if (categoryDiff !== 0) return categoryDiff

      const ageA = Number.isFinite(Number(a.building.age_index)) ? Number(a.building.age_index) : Number.MAX_SAFE_INTEGER
      const ageB = Number.isFinite(Number(b.building.age_index)) ? Number(b.building.age_index) : Number.MAX_SAFE_INTEGER
      if (ageA !== ageB) return ageA - ageB

      const countryDiff = getBuildingCountryName(a.building).localeCompare(
        getBuildingCountryName(b.building),
        locale.value === 'zh' ? 'zh-CN' : 'en'
      )
      return countryDiff !== 0 ? countryDiff : a.index - b.index
    })
    .map(({ building }) => building)
})
const keyword = ref('')
const selectedBuilding = ref(null)
const showCalculatorDialog = ref(false)
const activeBuildingKey = ref(null)
const calculatorDialogOrigin = ref(null)
const calculatorPageBounds = ref(null)
let activeBuildingTimer = null
const CALCULATOR_DIALOG_MODE_KEY = 'cividle-calc-buildings-dialog-mode'
const storedCalculatorDialogMode = localStorage.getItem(CALCULATOR_DIALOG_MODE_KEY)
const mobileMediaQuery = window.matchMedia('(max-width: 768px)')
const isMobileViewport = ref(mobileMediaQuery.matches)
const calculatorFullscreen = ref(isMobileViewport.value ? false : storedCalculatorDialogMode === 'fullscreen')
watch(calculatorFullscreen, (isFullscreen) => {
  if (isMobileViewport.value) return
  localStorage.setItem(CALCULATOR_DIALOG_MODE_KEY, isFullscreen ? 'fullscreen' : 'page')
}, { immediate: true })

const syncCalculatorViewportMode = (event) => {
  isMobileViewport.value = event.matches
  calculatorFullscreen.value = event.matches
    ? false
    : localStorage.getItem(CALCULATOR_DIALOG_MODE_KEY) !== 'page'
}

const updateCalculatorPageBounds = () => {
  if (!showCalculatorDialog.value || calculatorFullscreen.value) return
  const contentArea = buildingViewerRef.value?.closest('.content-area')
  if (!contentArea) return
  const { top, left, width, height } = contentArea.getBoundingClientRect()
  calculatorPageBounds.value = { top, left, width, height }
}

onMounted(() => {
  mobileMediaQuery.addEventListener('change', syncCalculatorViewportMode)
  window.addEventListener('resize', updateCalculatorPageBounds)
})
const buildingViewerRef = ref(null)
let lockedContentArea = null
let lockedContentAreaOverflow = ''
let lockedContentAreaScrollTop = 0

const updateCalculatorScrollLock = async () => {
  await nextTick()
  const contentArea = buildingViewerRef.value?.closest('.content-area')
  if (showCalculatorDialog.value && !calculatorFullscreen.value) {
    if (lockedContentArea && lockedContentArea !== contentArea) {
      lockedContentArea.style.overflowY = lockedContentAreaOverflow
    }
    if (!lockedContentArea && contentArea) {
      lockedContentArea = contentArea
      lockedContentAreaOverflow = lockedContentArea.style.overflowY
      lockedContentAreaScrollTop = lockedContentArea.scrollTop
      const { top, left, width, height } = lockedContentArea.getBoundingClientRect()
      calculatorPageBounds.value = { top, left, width, height }
      lockedContentArea.style.overflowY = 'hidden'
    }
  } else if (lockedContentArea) {
    const contentAreaToRestore = lockedContentArea
    const scrollTopToRestore = lockedContentAreaScrollTop
    contentAreaToRestore.style.overflowY = lockedContentAreaOverflow
    lockedContentArea = null
    lockedContentAreaOverflow = ''
    lockedContentAreaScrollTop = 0
    calculatorPageBounds.value = null
    await nextTick()
    contentAreaToRestore.scrollTop = scrollTopToRestore
  }
}

watch([showCalculatorDialog, calculatorFullscreen], updateCalculatorScrollLock)
watch(showCalculatorDialog, (isVisible) => {
  if (isVisible) {
    if (activeBuildingTimer) clearTimeout(activeBuildingTimer)
    return
  }
  activeBuildingTimer = setTimeout(() => {
    activeBuildingKey.value = null
    activeBuildingTimer = null
  }, 500)
})
onBeforeUnmount(() => {
  mobileMediaQuery.removeEventListener('change', syncCalculatorViewportMode)
  window.removeEventListener('resize', updateCalculatorPageBounds)
  if (activeBuildingTimer) clearTimeout(activeBuildingTimer)
  if (lockedContentArea) {
    lockedContentArea.style.overflowY = lockedContentAreaOverflow
    lockedContentArea.scrollTop = lockedContentAreaScrollTop
  }
  calculatorPageBounds.value = null
})
const buildingTypeFilter = ref('all')
const buildingAgeFilter = ref('all')

const setBuildingTypeFilter = (type) => {
  buildingTypeFilter.value = type === 'all' || buildingTypeFilter.value === type ? 'all' : type
  if (buildingTypeFilter.value === 'naturalWonder') {
    buildingAgeFilter.value = 'all'
  }
}

const availableAges = computed(() => {
  const ages = new Map()
  buildingsData.forEach(building => {
    if (!building.age || ages.has(building.age)) return
    ages.set(building.age, {
      key: building.age,
      label: tGame(building.age),
      index: Number.isFinite(Number(building.age_index)) ? Number(building.age_index) : Number.MAX_SAFE_INTEGER
    })
  })
  return [...ages.values()].sort((a, b) => a.index - b.index)
})

// 语言切换后，重新使用当前语言构建的建筑对象，更新名称和资源翻译
watch(locale, () => {
  const buildingKey = selectedBuilding.value?.buildingKey
  if (!buildingKey) return
  selectedBuilding.value = buildings.value.find(item => item.buildingKey === buildingKey) || null
})

// 计算器输入
const currentLevel = ref(0)
const targetLevel = ref(1)
const actualLevel = ref(1)
const buildingCount = ref(1)
const consumptionBuildingCount = ref(1)

const isWonder = computed(() => getWonderTypeKey(selectedBuilding.value) != null)
const maxBuildingCount = computed(() => {
  if (!isWonder.value) return 5000
  const max = Number(selectedBuilding.value.max)
  return Number.isFinite(max) ? Math.max(0, max) : 5000
})
const maxTargetLevel = computed(() => {
  if (isWonder.value && !selectedBuilding.value.upgradable) {
    return Math.min(150, currentLevel.value + 1)
  }
  return 150
})

const setTargetLevel = (level) => {
  targetLevel.value = Math.min(level, maxTargetLevel.value)
  calculate()
}

// 等级输入限制：0 <= 等级 <= 150，超出自动钳制
const onLevelInput = (key) => {
  const raw = key === 'currentLevel'
    ? currentLevel.value
    : key === 'targetLevel'
      ? targetLevel.value
      : actualLevel.value
  const max = key === 'targetLevel' ? maxTargetLevel.value : 150
  const clamped = Math.max(0, Math.min(max, Number.isFinite(Number(raw)) ? Number(raw) : 0))
  if (key === 'currentLevel') currentLevel.value = clamped
  else if (key === 'targetLevel') targetLevel.value = clamped
  else actualLevel.value = clamped
  if (key === 'currentLevel' && targetLevel.value > maxTargetLevel.value) {
    targetLevel.value = maxTargetLevel.value
  }
  calculate()
}

const onBuildingCountInput = (key) => {
  const raw = key === 'buildingCount' ? buildingCount.value : consumptionBuildingCount.value
  const max = maxBuildingCount.value
  const clamped = Math.max(0, Math.min(max, Number.isFinite(Number(raw)) ? Number(raw) : 0))
  if (key === 'buildingCount') buildingCount.value = clamped
  else consumptionBuildingCount.value = clamped
  calculate()
}

// 是否展开“查看详情”（每一级升级明细）
const showDetails = ref(false)
const showConsumptionDetails = ref(false)
const showProductionDetails = ref(false)
const productionHoverId = ref(null)
const productionChoices = ref({})
const productionColors = ['#e45756', '#3a86ff', '#2a9d8f', '#f4a261', '#8e5bd9', '#d1495b', '#118ab2', '#6a994e']
const productionPalette = computed(() => productionColors.flatMap(color => {
  const value = Number.parseInt(color.slice(1), 16)
  const r = value >> 16, g = (value >> 8) & 255, b = value & 255
  const adjust = (amount) => {
    const mix = amount < 0 ? 0 : 255
    const ratio = Math.abs(amount) / 100
    return `#${[r, g, b].map(channel => Math.round(channel + (mix - channel) * ratio).toString(16).padStart(2, '0')).join('')}`
  }
  return [adjust(0), adjust(12), adjust(-12), adjust(22)]
}))

const toggleProductionChoice = (resource, direction) => {
  const current = productionChoices.value[resource] || 0
  const candidates = buildingsData.filter(building => Object.prototype.hasOwnProperty.call(building.output || {}, resource))
  if (candidates.length < 2) return
  productionChoices.value = {
    ...productionChoices.value,
    [resource]: (current + direction + candidates.length) % candidates.length
  }
}

const buildProductionGraph = (buildingKey, choices) => {
  locale.value
  const target = buildingsData.find(b => b.building === buildingKey)
  if (!target) return null
  const producer = new Map()
  const producerCandidates = new Map()
  buildingsData.forEach(b => Object.keys(b.output || {}).forEach(resource => {
    if (!producerCandidates.has(resource)) producerCandidates.set(resource, [])
    producerCandidates.get(resource).push(b)
  }))
  producerCandidates.forEach((candidates, resource) => {
    producer.set(resource, candidates[(choices?.[resource] || 0) % candidates.length])
  })
  const nodes = new Map(), edges = new Map(), seen = new Set()
  const routeResources = new Map()
  const visit = (building, depth) => {
    if (!building) return
    if (seen.has(building.building)) {
      const old = nodes.get(`b:${building.building}`)
      if (old) old.depth = Math.min(old.depth, depth)
      return
    }
    seen.add(building.building)
    const id = `b:${building.building}`
    nodes.set(id, {
      id,
      kind: 'building',
      frame: getFrame(building.building),
      spriteStyle: getSpriteStyle(building.building),
      label: tGame(building.building),
      detailLines: Object.keys(building.output || {}).map(tGame),
      switchers: [],
      depth
    })
    Object.entries(building.input || {}).forEach(([resource, count]) => {
      const parent = producer.get(resource)
      if (parent && parent !== building) {
        if (!routeResources.has(`b:${parent.building}`)) routeResources.set(`b:${parent.building}`, resource)
        edges.set(`${parent.building}>${id}`, { from: `b:${parent.building}`, to: id })
        visit(parent, depth - 2)
      } else {
        const resourceId = `r:${resource}`
        nodes.set(resourceId, { id: resourceId, kind: 'resource', label: tGame(resource), detailLines: [String(count)], depth: depth - 1 })
        edges.set(`${resourceId}>${id}`, { from: resourceId, to: id })
      }
    })
  }
  visit(target, 0)

  const buildingNodes = [...nodes.values()].filter(node => node.kind === 'building')
  buildingNodes.forEach(node => {
    const data = buildingsData.find(b => b.building === node.id.slice(2))
    const routeResource = routeResources.get(node.id)
    node.switchers = routeResource ? [routeResource].flatMap(resource => {
      const candidates = producerCandidates.get(resource) || []
      return candidates.length > 1
        ? [{ resource, index: (choices?.[resource] || 0) % candidates.length, total: candidates.length }]
        : []
    }) : []
  })
  buildingNodes.forEach(node => {
    const data = buildingsData.find(b => b.building === node.id.slice(2))
    if (!data || Object.keys(data.input || {}).length) return
    const consumers = buildingNodes.filter(other => {
      const otherData = buildingsData.find(b => b.building === other.id.slice(2))
      return other !== node && Object.keys(otherData?.input || {}).some(resource => Object.prototype.hasOwnProperty.call(data.output || {}, resource))
    })
    if (consumers.length) node.depth = Math.min(...consumers.map(consumer => consumer.depth)) - 2
  })

  const min = Math.min(...[...nodes.values()].map(node => node.depth))
  const columns = new Map()
  nodes.forEach(node => {
    const column = node.depth - min
    if (!columns.has(column)) columns.set(column, [])
    columns.get(column).push(node)
  })
  const keys = [...columns.keys()].sort((a, b) => a - b)
  const gap = 72, rowGap = 40, positions = new Map()
  const columnWidths = keys.map(column => Math.max(120, ...columns.get(column).map(node =>
    Math.max(node.kind === 'building' ? 220 : 120, node.label.length * 8 + 28, ...node.detailLines.map(line => line.length * 7 + 28)))))
  keys.forEach((column, columnIndex) => {
    let y = 24
    columns.get(column).forEach((node, rowIndex) => {
      node.width = columnWidths[columnIndex]
      node.height = node.kind === 'building'
        ? Math.max(64, 24 + Math.max(1, node.detailLines.length) * 18)
        : 58
      node.x = 24 + columnWidths.slice(0, columnIndex).reduce((sum, width) => sum + width + gap, 0)
      node.y = y
      node.columnIndex = columnIndex
      node.rowIndex = rowIndex
      node.totalHeight = node.height + (node.switchers.length ? 30 : 0)
      y += node.totalHeight + rowGap
      positions.set(node.id, node)
    })
  })
  const rowEdgeCounts = new Map()
  const sameRowArcCounts = new Map()
  edges.forEach(edge => {
    const from = positions.get(edge.from), to = positions.get(edge.to)
    if (!from || !to) return
    edge.rowIndex = from.rowIndex || 0
    edge.colorIndex = (edge.rowIndex % productionColors.length) * 4 + (rowEdgeCounts.get(edge.rowIndex) || 0) % 4
    rowEdgeCounts.set(edge.rowIndex, (rowEdgeCounts.get(edge.rowIndex) || 0) + 1)
    const y1 = from.y + from.height / 2, y2 = to.y + to.height / 2
    if (from.x === to.x) {
      const bend = from.x - 42
      edge.path = `M${from.x},${y1} C${bend},${y1} ${bend},${y2} ${from.x},${y2}`
      return
    }
    const x1 = from.x + from.width, x2 = to.x
    const sameRow = Math.abs(y1 - y2) < 0.5
    if (sameRow && to.columnIndex - from.columnIndex > 1) {
      const arcLane = sameRowArcCounts.get(from.rowIndex) || 0
      sameRowArcCounts.set(from.rowIndex, arcLane + 1)
      const arcY = Math.max(8, y1 - 28 - arcLane * 12)
      const horizontal = Math.max(1, x2 - x1), dx = Math.min(42, horizontal * 0.42)
      edge.path = `M${x1},${y1} C${x1 + dx},${arcY} ${x2 - dx},${arcY} ${x2},${y2}`
      return
    }
    if (to.columnIndex - from.columnIndex === 1 && sameRow) {
      edge.path = `M${x1},${y1} L${x2},${y2}`
      return
    }
    const horizontal = Math.max(1, x2 - x1), dx = Math.min(42, horizontal * 0.42)
    const curve = Math.min(80, Math.max(10, Math.abs(y2 - y1) * 0.18)), direction = y2 >= y1 ? 1 : -1
    edge.path = `M${x1},${y1} C${x1 + dx},${y1 + direction * curve} ${x2 - dx},${y2 - direction * curve} ${x2},${y2}`
  })
  const nodeList = [...nodes.values()], edgeList = [...edges.values()].filter(edge => edge.path)
  if (edgeList.length === 0) return null
  return {
    nodes: nodeList,
    edges: edgeList.map((edge, index) => ({ ...edge, key: `${edge.from}>${edge.to}-${index}` })),
    width: Math.max(760, ...nodeList.map(node => node.x + node.width + 24)),
    height: Math.max(150, ...keys.map(column => columns.get(column).reduce((sum, node) => sum + node.totalHeight + rowGap, 24)))
  }
}

const productionGraph = computed(() => buildProductionGraph(selectedBuilding.value?.buildingKey, productionChoices.value))
const productionRelated = (edge) => {
  if (!productionHoverId.value) return false
  return edge.from === productionHoverId.value || edge.to === productionHoverId.value
}
const productionRelatedNode = (node) => {
  if (!productionHoverId.value) return false
  if (node.id === productionHoverId.value) return true
  return productionGraph.value?.edges.some(edge => productionRelated(edge) && (edge.from === node.id || edge.to === node.id))
}

const productionNodeBorderColor = (node) => {
  if (!productionHoverId.value) return null

  const relatedEdge = productionGraph.value?.edges.find(edge =>
    (edge.from === productionHoverId.value && edge.to === node.id) ||
    (edge.to === productionHoverId.value && edge.from === node.id)
  )

  if (!relatedEdge) return null
  return productionPalette.value[relatedEdge.colorIndex]
}

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
// 消耗统计：实际等级 * 建筑数量，再换算到小时 / 4小时 / 天
const hasConsumptionInputs = computed(() =>
  Object.keys(selectedBuilding.value?.input || {}).length > 0
)

// 消耗统计：input * 实际等级 * 建筑数量，再换算到不同时间周期。
const consumptionStats = computed(() => {
  locale.value
  if (!hasConsumptionInputs.value) return []
  const level = Math.max(0, Number(actualLevel.value) || 0)
  const count = Math.max(0, Number(consumptionBuildingCount.value) || 0)
  return Object.entries(selectedBuilding.value.input).map(([resource, input]) => {
    const perSec = (Number(input) || 0) * level * count
    const perHour = perSec * 3600
    return {
      key: resource,
      resource: tGame(resource),
      values: {
        perSec,
        perHour,
        per4Hours: perHour * 4,
        per12Hours: perHour * 12,
        perDay: perHour * 24,
        per2Days: perHour * 24 * 2,
        per3Days: perHour * 24 * 3
      }
    }
  })
})

const consumptionPeriods = computed(() => {
  locale.value
  return [
    { key: 'perSec', label: t('calcBuildings.consumptionPerSec') },
    { key: 'perHour', label: t('calcBuildings.consumptionPerHour') },
    { key: 'per4Hours', label: t('calcBuildings.consumptionPer4Hours') },
    { key: 'per12Hours', label: t('calcBuildings.consumptionPer12Hours') },
    { key: 'perDay', label: t('calcBuildings.consumptionPerDay') },
    { key: 'per2Days', label: t('calcBuildings.consumptionPer2Days') },
    { key: 'per3Days', label: t('calcBuildings.consumptionPer3Days') }
  ]
})

// 建造者能力乘数说明弹窗是否显示
const showHelpDialog = ref(false)

// 搜索过滤
const filteredBuildings = computed(() => {
  const kw = keyword.value.trim().toLowerCase()
  return buildings.value.filter(item => {
    const typeMatches = buildingTypeFilter.value === 'all'
      ? true
      : buildingTypeFilter.value === 'building'
        ? !item.special
        : item.special === (buildingTypeFilter.value === 'worldWonder' ? 'WorldWonder' : 'NaturalWonder')
    const ageMatches = buildingAgeFilter.value === 'all' || item.age === buildingAgeFilter.value
    if (!typeMatches || !ageMatches) return false
    if (!kw) return true
    const resourceNames = [
      ...item.build_resources.map(resource => resource.resource),
      ...item.output.map(resource => resource.resource),
      ...Object.keys(item.input || {}).map(tGame)
    ]
    return [item.building, ...resourceNames].some(name =>
      name.toLowerCase().includes(kw)
    )
  })
})

// 选择建筑
const selectBuilding = (item, event) => {
  const rect = event.currentTarget.getBoundingClientRect()
  calculatorDialogOrigin.value = {
    x: rect.left + rect.width / 2,
    y: rect.top + rect.height / 2
  }
  activeBuildingKey.value = item.buildingKey
  if (activeBuildingTimer) {
    clearTimeout(activeBuildingTimer)
    activeBuildingTimer = null
  }
  selectedBuilding.value = item
  currentLevel.value = 0
  targetLevel.value = 1
  actualLevel.value = 1
  buildingCount.value = Math.min(1, maxBuildingCount.value)
  consumptionBuildingCount.value = Math.min(1, maxBuildingCount.value)
  showDetails.value = false
  showConsumptionDetails.value = false
  showProductionDetails.value = false
  productionHoverId.value = null
  productionChoices.value = {}
  showCalculatorDialog.value = true
  calculate()
}

// 每个等级升级的明细：材料 / 每秒运输量 / 耗时
const upgradeDetails = computed(() => {
  if (!selectedBuilding.value) return []
  if (targetLevel.value <= currentLevel.value) return []

  const mult = parseFloat(selectedBuilding.value.mult)
  const baseResources = selectedBuilding.value.build_resources
  const effectiveTargetLevel = Math.min(targetLevel.value, maxTargetLevel.value)
  const diff = effectiveTargetLevel - currentLevel.value
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

// 明细中出现的所有资源列（用于表格表头）
const detailResources = computed(() => {
  const set = new Set()
  upgradeDetails.value.forEach((d) => {
    d.perRes.forEach((r) => set.add(r.resource))
  })
  return [...set]
})

// 获取某一级某一资源的数量（已格式化）
const resCount = (detail, res) => {
  const found = detail.perRes.find((r) => r.resource === res)
  return found ? formatNumber(found.count) : '0'
}

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
  return Math.max(0, Math.min(targetLevel.value, maxTargetLevel.value) - currentLevel.value)
})

const isLevelRangeInvalid = computed(() => targetLevel.value < currentLevel.value)

// 计算函数（触发响应式更新）
const calculate = () => {
  // 由 computed 自动触发
}

// 格式化数字：按 1000 进位，自动选择合适后缀，避免出现 2174603.02B 这类大数字
const formatNumber = (num) => formatNumberShared(num, FULL_SUFFIXES)

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
  let result
  if (total < 60) {
    result = `${total}${s}`
  } else {
    const mins = Math.floor(total / 60)
    const secs = round1(total - mins * 60)
    if (mins < 60) {
      result = `${mins}${m} ${secs}${s}`
    } else {
      const hrs = Math.floor(mins / 60)
      const remMins = mins - hrs * 60
      if (hrs < 24) {
        result = `${hrs}${h} ${remMins}${m} ${secs}${s}`
      } else {
        const days = Math.floor(hrs / 24)
        const remHrs = hrs - days * 24
        if (days < 30) {
          result = `${days}${d} ${remHrs}${h} ${remMins}${m} ${secs}${s}`
        } else {
          const months = Math.floor(days / 30)
          const remDays = days - months * 30
          if (months < 12) {
            result = `${months}${mo} ${remDays}${d} ${remHrs}${h} ${remMins}${m} ${secs}${s}`
          } else {
            const years = Math.floor(months / 12)
            const remMonths = months - years * 12
            result = `${years}${y} ${remMonths}${mo} ${remDays}${d} ${remHrs}${h} ${remMins}${m} ${secs}${s}`
          }
        }
      }
    }
  }
  // 数值过大（结果含科学计数法 e）时，提示时间过大并附上原值
  if (result.includes('e')) {
    return `${isZh ? '时间过大' : 'Time too large'}（${result}）`
  }
  return result
}
</script>

<style scoped>
.building-viewer {
  max-width: 100%;
  padding: 0 0 20px;
}

.building-viewer-page-mode {
  position: relative;
  min-height: 100%;
}

/* ===== 顶部搜索区 ===== */
.search-section {
  padding: 20px 24px 24px;
  border: 2px solid #4a90d9;
  border-radius: 14px;
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
  margin: 0;
}

.subtitle-row {
  display: flex;
  align-items: center;
  gap: 12px;
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

.building-filters {
  display: flex;
  flex-direction: column;
  gap: 14px;
  margin-top: 14px;
}

.filter-button-group {
  display: flex;
  width: 100%;
  min-width: 0;
  min-height: 48px;
  box-sizing: border-box;
  flex-wrap: nowrap;
  gap: 0;
  padding: 4px;
  background: #eef2f7;
  border-radius: 12px;
}

.age-filter-group {
  overflow: visible;
  flex-wrap: wrap;
}

.age-filter-group .filter-btn {
  flex: 1 1 88px;
}

.building-type-filter-group {
  overflow: hidden;
}

.filter-btn {
  flex: 1 1 0;
  min-width: 0;
  min-height: 36px;
  padding: 0 14px;
  border: none;
  border-radius: 9px;
  background: transparent;
  color: #6b7a8f;
  font-size: 0.82rem;
  font-weight: 600;
  cursor: pointer;
  transition: background 150ms ease, color 150ms ease, box-shadow 150ms ease;
  white-space: nowrap;
}

.filter-btn:hover:not(.active) {
  color: #1a2332;
}

.filter-btn.active {
  background: #ffffff;
  color: #3d7fc4;
  box-shadow: 0 2px 8px rgba(74, 144, 217, 0.18);
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
  flex-wrap: wrap;
  gap: 10px;
  margin-bottom: 16px;
  padding-bottom: 14px;
  border-bottom: 1px solid #f0f4fa;
}

.building-desc {
  order: 3;
  flex: 0 0 100%;
  margin: 0;
  color: #5f7187;
  font-size: 0.9rem;
  line-height: 1.5;
  white-space: pre-line;
}

.calc-title {
  order: 1;
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

.wonder-badge-lg,
.wonder-badge {
  font-size: 0.75rem;
  color: #2b6cb0;
  background: #eef7ff;
  border: 1px solid #cfe6fa;
  padding: 2px 10px;
  border-radius: 12px;
  font-weight: 600;
  white-space: nowrap;
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

.calculator-body + .calculator-body {
  margin-top: 20px;
  padding-top: 20px;
  border-top: 1px solid #e8edf4;
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

.num-input:disabled {
  color: #6b7a8f;
  background: #eef1f5;
  border-color: #d5dce5;
  cursor: not-allowed;
  opacity: 0.9;
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

.preset-btn:hover,
.preset-btn:active {
  background: #4a90d9;
  color: #ffffff;
  border-color: #4a90d9;
}

/* ===== 结果区 ===== */
.empty-result {
  padding: 14px 16px;
  border: 1px solid #f1c7c7;
  border-radius: 10px;
  background: #fff6f6;
  color: #b54848;
  font-size: 0.9rem;
}

.result-area {
  background: #f7faff;
  border-radius: 12px;
  padding: 16px 20px 18px;
  border: 1px solid #e8edf4;
}

.consumption-input-row {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 16px;
  max-width: 576px;
}

.result-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
  flex-wrap: wrap;
  gap: 8px;
}

.result-header-left {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
}

.result-title {
  font-weight: 600;
  color: #1a2332;
  font-size: 0.95rem;
}

.level-range {
  font-weight: 400;
  color: #6b7a8f;
  font-size: 0.85rem;
}

.result-header-right {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
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

/* ===== 查看详情（每一级升级明细） ===== */
.detail-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  background: #eef4ff;
  border: 1px solid #cfe0fa;
  border-radius: 8px;
  padding: 5px 12px;
  font-size: 0.8rem;
  font-weight: 600;
  color: #4a90d9;
  cursor: pointer;
  transition: all 0.2s;
  white-space: nowrap;
}

.detail-btn:hover {
  background: #4a90d9;
  color: #ffffff;
  border-color: #4a90d9;
}

.chevron {
  display: inline-block;
  transition: transform 0.2s ease;
  font-size: 0.7rem;
}

.chevron.open {
  transform: rotate(180deg);
}

.detail-table-wrap {
  margin-top: 14px;
  overflow-x: auto;
  border: 1px solid #e8edf4;
  border-radius: 10px;
  background: #ffffff;
}

.detail-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.82rem;
  white-space: nowrap;
}

.detail-table th,
.detail-table td {
  padding: 8px 14px;
  text-align: right;
  border-bottom: 1px solid #eef2f6;
}

.detail-table th:first-child,
.detail-table td:first-child,
.detail-table th:nth-child(2),
.detail-table td:nth-child(2) {
  text-align: center;
}

.detail-table thead th {
  background: #f5f8fc;
  color: #6b7a8f;
  font-weight: 600;
  position: sticky;
  top: 0;
}

.detail-table tbody tr:last-child td {
  border-bottom: none;
}

.detail-table tbody tr:hover {
  background: #f7faff;
}

.detail-table td {
  color: #1a2332;
}

.detail-table td:last-child {
  color: #4a90d9;
  font-weight: 600;
}

.consumption-calculator-body .detail-table td:last-child {
  color: #1a2332;
  font-weight: 400;
}

.consumption-table {
  table-layout: fixed;
  width: 100%;
  min-width: 720px;
}

.consumption-table th,
.consumption-table td {
  text-align: center;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* ===== 建筑卡片网格 ===== */
.production-chart-wrap {
  overflow-x: auto;
  border: 1px solid #e8edf4;
  border-radius: 10px;
  background: #ffffff;
  user-select: none;
}

.production-chart {
  display: block;
  min-width: 760px;
  isolation: isolate;
}

.production-edge {
  fill: none;
  stroke-width: 2;
  transition: opacity 0.15s ease;
  pointer-events: none;
}

.production-edge.dim { opacity: 0.14; }
.production-edge.highlight {
  opacity: 1;
  stroke-width: 3;
}

.production-node {
  pointer-events: auto;
}

.production-node rect {
  stroke-width: 1.5;
  fill-opacity: 0.72;
  transition: all 0.15s ease;
  stroke: var(--node-stroke, #4a90d9);
}

.production-node.building rect { fill: #ffffff; stroke: var(--node-stroke, #4a90d9); }
.production-node.resource rect { fill: #ffffff; stroke: var(--node-stroke, #9bb8d8); }
.production-node.highlight rect { stroke: var(--node-stroke, #4a90d9); stroke-width: 3; fill: #f7fbff; fill-opacity: 1; }
.production-node.hovered rect { stroke: var(--node-stroke, #2563a8); stroke-width: 3; fill: #eef6ff; fill-opacity: 1; }
.production-node text { font-size: 13px; dominant-baseline: middle; pointer-events: none; }
.production-node .production-detail { font-size: 11px; fill: #66758a; }
.production-node .production-switch rect { fill: #00000000; stroke: none; stroke-width: 0; }
.production-switch .switch-prev, .production-switch .switch-next { cursor: pointer; }
.production-switch text { fill: #3978c8; font-size: 16px; font-weight: 600; cursor: pointer; }
.production-switch .switch-prev:hover,
.production-switch .switch-next:hover { fill: #e5f0ff; stroke: #4a90d9; }
.production-switch line { stroke: #9bb8d8; stroke-width: 1; pointer-events: none; }

.building-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
  gap: 14px;
  align-items: start;
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

.natural-wonder-card-header {
  border-bottom: none;
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

.resources + .resources {
  margin-top: 14px;
  padding-top: 12px;
  border-top: 1px solid #f0f4fa;
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
  .search-section {
    padding: 14px;
  }

  .subtitle-row {
    align-items: flex-start;
    flex-wrap: wrap;
    gap: 6px 10px;
  }

  .building-filters {
    width: 100%;
  }

  .filter-button-group {
    width: 100%;
  }

  .building-type-filter-group {
    overflow: visible;
  }

  .age-filter-group {
    overflow: visible;
    flex-wrap: wrap;
  }

  .filter-btn {
    min-width: 0;
    padding: 0 10px;
    font-size: 0.78rem;
  }

  .building-grid {
    grid-template-columns: 1fr;
  }

  .building-card {
    padding: 16px;
  }

  .input-row {
    grid-template-columns: 1fr 1fr;
  }

  .calc-title {
    flex-wrap: wrap;
  }
}

@media (max-width: 600px) {
  .section-header h1 {
    font-size: 1.3rem;
  }

  .badge {
    font-size: 0.7rem;
    padding: 1px 10px;
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

  .consumption-input-row {
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
