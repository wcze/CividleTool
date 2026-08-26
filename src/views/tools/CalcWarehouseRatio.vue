<template>
  <div class="warehouse-ratio-page">
    <section class="calculator-card">
      <div class="input-grid">
        <div class="input-group">
          <label for="wr_capB">{{ t('calcWarehouseRatio.capBLabel') }}</label>
          <input id="wr_capB" v-model.number="capB" type="number" step="0.01" />
        </div>

        <div class="input-group">
          <label for="wr_prodK">{{ t('calcWarehouseRatio.prodKLabel') }}</label>
          <input id="wr_prodK" v-model.number="prodK" type="number" />
        </div>

        <div class="input-group">
          <label for="wr_capK">{{ t('calcWarehouseRatio.capKLabel') }}</label>
          <input id="wr_capK" v-model.number="capK" type="number" />
        </div>

        <div class="input-group">
          <label>{{ t('calcWarehouseRatio.productLabel') }}</label>
          <ResourceSelect v-model="selectedProduct" class="wr-product-select" sort-order="desc" />
        </div>
      </div>
    </section>

    <div class="tab-bar">
      <button
        type="button"
        class="tab-btn"
        :class="{ active: activeTab === 'A' }"
        @click="activeTab = 'A'"
      >
        {{ t('calcWarehouseRatio.scenarioA') }}
      </button>
      <button
        type="button"
        class="tab-btn"
        :class="{ active: activeTab === 'B' }"
        @click="activeTab = 'B'"
      >
        {{ t('calcWarehouseRatio.scenarioB') }}
      </button>
      <button
        type="button"
        class="tab-btn"
        :class="{ active: activeTab === 'C' }"
        @click="activeTab = 'C'"
      >
        {{ t('calcWarehouseRatio.scenarioC') }}
      </button>
    </div>

    <section v-if="activeTab === 'A'" class="scenario-card tab-section">
      <div class="input-group">
        <label for="wr_happyA">{{ t('calcWarehouseRatio.happyLabel') }}</label>
        <input id="wr_happyA" v-model.number="happyA" type="number" />
      </div>

      <div class="stat-list">
        <div v-for="row in scenarioA.rows" :key="row.key" class="stat-row">
          <span class="stat-label">{{ row.label }}</span>
          <span class="stat-value" :class="row.cls">{{ row.value }}</span>
        </div>
      </div>
    </section>

    <section v-if="activeTab === 'B'" class="scenario-card tab-section">
      <div class="input-group">
        <label for="wr_bldB">{{ t('calcWarehouseRatio.bldLabel') }}</label>
        <input id="wr_bldB" v-model.number="bldB" type="number" />
      </div>

      <div class="stat-list">
        <div v-for="row in scenarioB.rows" :key="row.key" class="stat-row">
          <span class="stat-label">{{ row.label }}</span>
          <span class="stat-value" :class="row.cls">{{ row.value }}</span>
        </div>
      </div>
    </section>

    <section v-if="activeTab === 'C'" class="scenario-card tab-section">
      <div class="input-group">
        <label for="wr_whC">{{ t('calcWarehouseRatio.whLabel') }}</label>
        <input id="wr_whC" v-model.number="whC" type="number" />
      </div>

      <div class="stat-list">
        <div v-for="row in scenarioC.rows" :key="row.key" class="stat-row">
          <span class="stat-label">{{ row.label }}</span>
          <span class="stat-value" :class="row.cls">{{ row.value }}</span>
        </div>
      </div>
    </section>
  </div>
</template>

<script setup>
import { computed, ref, watch } from 'vue'
import ResourceSelect from '@/components/ResourceSelect.vue'
import prices from '@/data/prices.json'
import { t } from '@/i18n'
import { formatNumber, formatNumberDetail, FULL_SUFFIXES } from '@/utils/format'

/**
 * 仓库/产建基础参数持久化到 localStorage：
 * 这几个值取决于玩家当前的游戏内状态（科技/建筑等级/伟人加成等），
 * 换个产物或刷新页面后仍希望保留上次填写的数值。
 */
const STORAGE_KEY = 'cividle-warehouse-ratio-inputs'

function loadStoredInputs() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

const storedInputs = loadStoredInputs()

/**
 * ========================================
 * 产建 - 仓库配比计算器
 * ========================================
 *
 * 移植自 CivIdle 工具原型（产建-仓库数量配比计算器），公式保持一致：
 *
 * - 场景 A：给定幸福值，按 capK : (prodK + capK) 分配产建 / 仓库数量
 * - 场景 B：给定产建数量，仓库数量 = ceil(产建数 × prodK / capK)
 * - 场景 C：给定仓库数量，产建数量 = ceil(仓库数 × capK / prodK)
 */

const activeTab = ref('A')

const capB = ref(storedInputs?.capB ?? 16.95)
const prodK = ref(storedInputs?.prodK ?? 11910)
const capK = ref(storedInputs?.capK ?? 76950)
const selectedProduct = ref(storedInputs?.selectedProduct ?? 'Bitcoin')

watch([capB, prodK, capK, selectedProduct], ([capBVal, prodKVal, capKVal, selectedProductVal]) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({
      capB: capBVal,
      prodK: prodKVal,
      capK: capKVal,
      selectedProduct: selectedProductVal
    }))
  } catch {
    // localStorage 不可用（隐私模式等）时静默忽略
  }
})

const happyA = ref(1231)
const bldB = ref(974)
const whC = ref(1538)

const unitPrice = computed(() => prices[selectedProduct.value] || 0)

function buildPanel(bld, wh) {
  const cB = Number(capB.value) || 0
  const pK = Number(prodK.value) || 0
  const cK = Number(capK.value) || 0

  const totalProd = pK * bld
  const totalCap = cK * wh
  const balanced = totalProd <= totalCap
  const perSec = totalProd * unitPrice.value
  const warehouseCapacity = cB * wh * 1e9
  const perDay = pK * bld * 86400
  const fullTimeSec = perDay > 0 ? (warehouseCapacity / perDay) * 24 * 3600 : 0

  return {
    bld,
    wh,
    totalProd,
    totalCap,
    balanced,
    perSec,
    fullTimeSec,
    dailyCap: totalCap * 86400
  }
}

function formatDuration(sec) {
  if (!Number.isFinite(sec) || sec < 0) return '-'

  const d = Math.floor(sec / 86400)
  const h = Math.floor((sec % 86400) / 3600)
  const m = Math.floor((sec % 3600) / 60)
  const s = Math.floor(sec % 60)

  const parts = []
  if (d > 0) parts.push(t('calcWarehouseRatio.days', { count: d }))
  if (h > 0) parts.push(t('calcWarehouseRatio.hours', { count: h }))
  if (m > 0) parts.push(t('calcWarehouseRatio.minutes', { count: m }))
  if (s > 0 || parts.length === 0) parts.push(t('calcWarehouseRatio.seconds', { count: s }))

  return parts.join(' ')
}

function panelRows(panel, extraRow) {
  const rows = [
    { key: 'bld', label: t('calcWarehouseRatio.rowBuildings'), value: formatNumberDetail(panel.bld) },
    { key: 'wh', label: t('calcWarehouseRatio.rowWarehouses'), value: formatNumberDetail(panel.wh) },
    { key: 'totalProd', label: t('calcWarehouseRatio.rowTotalProd'), value: `${formatNumber(panel.totalProd, FULL_SUFFIXES)} K/s` },
    { key: 'totalCap', label: t('calcWarehouseRatio.rowTotalCap'), value: `${formatNumber(panel.totalCap, FULL_SUFFIXES)} K/s` },
    {
      key: 'balance',
      label: t('calcWarehouseRatio.rowBalance'),
      value: panel.balanced ? t('calcWarehouseRatio.balanced') : t('calcWarehouseRatio.overflow'),
      cls: panel.balanced ? 'ok' : 'bad'
    },
    { key: 'perSec', label: t('calcWarehouseRatio.rowPerSec'), value: formatNumber(panel.perSec, FULL_SUFFIXES) },
    { key: 'fullTime', label: t('calcWarehouseRatio.rowFullTime'), value: formatDuration(panel.fullTimeSec) },
    { key: 'dailyCap', label: t('calcWarehouseRatio.rowDailyCap'), value: formatNumber(panel.dailyCap, FULL_SUFFIXES) }
  ]

  if (extraRow) rows.push(extraRow)

  return rows
}

const scenarioA = computed(() => {
  const happy = Number(happyA.value) || 0
  const pK = Number(prodK.value) || 0
  const cK = Number(capK.value) || 0

  const bld = Math.round((happy * cK) / (pK + cK))
  const wh = happy - bld

  return { rows: panelRows(buildPanel(bld, wh)) }
})

const scenarioB = computed(() => {
  const bld = Number(bldB.value) || 0
  const pK = Number(prodK.value) || 0
  const cK = Number(capK.value) || 0

  const wh = Math.ceil((bld * pK) / cK)

  return {
    rows: panelRows(buildPanel(bld, wh), {
      key: 'needHappy',
      label: t('calcWarehouseRatio.rowNeedHappy'),
      value: formatNumberDetail(bld + wh)
    })
  }
})

const scenarioC = computed(() => {
  const wh = Number(whC.value) || 0
  const pK = Number(prodK.value) || 0
  const cK = Number(capK.value) || 0

  const bld = Math.ceil((wh * cK) / pK)

  return {
    rows: panelRows(buildPanel(bld, wh), {
      key: 'needHappy',
      label: t('calcWarehouseRatio.rowNeedHappy'),
      value: formatNumberDetail(bld + wh)
    })
  }
})
</script>

<style scoped>
.warehouse-ratio-page {
  width: 100%;
  min-width: 0;
  margin: 0;
  box-sizing: border-box;
  color: #344054;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", "Microsoft YaHei", sans-serif;
}

/* =========================================
   Calculator card（沿用工具集统一样式）
========================================= */

.calculator-card {
  width: 100%;
  margin-bottom: 24px;
  padding: 20px 24px 24px;
  box-sizing: border-box;
  background: #ffffff;
  border: 2px solid #4a90d9;
  border-radius: 16px;
  box-shadow: 0 4px 20px rgba(74, 144, 217, 0.08);
}

.input-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 16px;
}

.input-group {
  width: 100%;
}

.input-group label {
  display: block;
  margin-bottom: 8px;
  color: #6b7a8f;
  font-size: 13px;
  font-weight: 500;
}

.input-group input {
  display: block;
  width: 100%;
  height: 44px;
  padding: 0 13px;
  box-sizing: border-box;
  color: #1a2332;
  background: #fafcff;
  border: 1px solid #dce6f2;
  border-radius: 9px;
  outline: none;
  font-size: 15px;
  transition: border-color 180ms ease, background 180ms ease, box-shadow 180ms ease;
}

.input-group input:focus {
  background: #ffffff;
  border-color: #4a90d9;
  box-shadow: 0 0 0 3px rgba(74, 144, 217, 0.1);
}

.wr-product-select {
  width: 100%;
  min-width: 0;
}

/* =========================================
   Tab 切换（场景 A / B / C）
========================================= */

.tab-bar {
  display: flex;
  gap: 6px;
  width: 100%;
  margin-bottom: 20px;
  padding: 4px;
  background: #eef2f7;
  border-radius: 12px;
}

.tab-btn {
  flex: 1;
  height: 40px;
  border: none;
  border-radius: 9px;
  background: transparent;
  color: #6b7a8f;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: background 150ms ease, color 150ms ease;
}

.tab-btn:hover:not(.active) {
  color: #1a2332;
}

.tab-btn.active {
  background: #ffffff;
  color: #3d7fc4;
  box-shadow: 0 2px 8px rgba(74, 144, 217, 0.18);
}

/* =========================================
   Scenario card
========================================= */

.scenario-card {
  padding: 18px 20px 20px;
  box-sizing: border-box;
  background: #ffffff;
  border: 1px solid #e8edf4;
  border-radius: 14px;
}

.scenario-card .input-group {
  margin-bottom: 16px;
}

/* =========================================
   Result stat list
========================================= */

.stat-list {
  padding-top: 14px;
  border-top: 1px dashed #dce6f2;
}

.stat-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 8px 0;
  font-size: 15px;
}

.stat-row + .stat-row {
  border-top: 1px solid #f3f6fa;
}

.stat-label {
  color: #6b7a8f;
  flex-shrink: 0;
}

.stat-value {
  color: #1a2332;
  font-weight: 600;
  text-align: right;
  word-break: break-all;
}

.stat-value.ok {
  color: #2f9e74;
}

.stat-value.bad {
  color: #d24b4b;
}

/* =========================================
   Responsive
========================================= */

@media (max-width: 768px) {
  .calculator-card {
    padding: 18px;
  }

  .tab-btn {
    font-size: 13px;
  }
}
</style>
