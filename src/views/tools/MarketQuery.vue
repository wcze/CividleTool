<template>
  <div class="market-query-page">

    <!-- ==================== 上传存档卡片 ==================== -->
    <section
      class="calculator-card"
      :class="{ 'is-dragging': dragging }"
      @dragenter.prevent="onDragEnter"
      @dragover.prevent
      @dragleave="onDragLeave"
      @drop.prevent="onDrop"
    >
      <div v-if="dragging" class="drop-overlay">
        {{ t('marketQuery.dropHint') }}
      </div>

      <div class="calculator-header">
        <div class="calculator-title">
          {{ t('marketQuery.uploadTitle') }}
        </div>
      </div>

      <label class="drop-zone">
        <input
          type="file"
          accept="*/*"
          @change="onFileChange"
        />
        <div class="drop-zone-text">
          <span class="drop-zone-title">{{ t('marketQuery.dropZoneTitle') }}</span>
          <span class="drop-zone-hint">{{ t('marketQuery.dropZoneHint') }}</span>
        </div>
        <span class="drop-zone-btn">{{ t('marketQuery.uploadButton') }}</span>
      </label>

      <div class="upload-status-row">
        <span v-if="parsing" class="upload-status">
          {{ t('marketQuery.parsing') }}
        </span>
        <span v-else-if="saveLoaded" class="upload-status ok">
          {{ t('marketQuery.uploaded') }}
        </span>
      </div>

      <p v-if="lastUploadLabel" class="last-upload-hint">
        {{ t('marketQuery.lastUpload', { time: lastUploadLabel }) }}
      </p>

      <div class="privacy-note">
        <span class="privacy-note-title">{{ t('marketQuery.privacyTitle') }}</span>
        <p class="privacy-note-text">
          {{ t('marketQuery.privacyNoteBefore') }}
          <router-link class="privacy-link" to="/about">
            {{ t('marketQuery.privacyOpenSource') }}
          </router-link>
          {{ t('marketQuery.privacyNoteAfter') }}
        </p>
      </div>

      <p v-if="errorMsg" class="upload-error">
        {{ errorMsg }}
      </p>

      <div v-if="saveLoaded" class="summary-row">
        <span class="summary-item">
          {{ t('marketQuery.techsCount', { count: techCount }) }}
        </span>
        <span class="summary-item">
          {{ t('marketQuery.resourcesCount', { count: resources.length }) }}
        </span>
      </div>
    </section>


    <!-- ==================== 使用帮助 ==================== -->
    <section class="market-help">
      <div class="market-help-title">{{ t('marketQuery.helpTitle') }}</div>
      <ul class="market-help-list">
        <li>{{ t('marketQuery.helpSaveFolder') }}</li>
        <li>{{ t('marketQuery.helpTechNote') }}</li>
      </ul>
    </section>


    <!-- ==================== 切换：按时间 / 按资源 ==================== -->
    <div v-if="hasMarketData" class="tab-bar">
      <button
        type="button"
        class="tab-btn"
        :class="{ active: activeTab === 'time' }"
        @click="activeTab = 'time'"
      >
        {{ t('marketQuery.tabTime') }}
      </button>
      <button
        type="button"
        class="tab-btn"
        :class="{ active: activeTab === 'resource' }"
        @click="activeTab = 'resource'"
      >
        {{ t('marketQuery.tabResource') }}
      </button>
    </div>

    <!-- ==================== 按时间查询 ==================== -->
    <section v-if="hasMarketData && activeTab === 'time'" class="section tab-section">
      <div class="query-panel">
        <div class="query-field">
          <span class="query-field-label">{{ t('marketQuery.dateLabel') }}</span>
          <div class="date-nav">
            <button type="button" class="date-nav-btn" @click="shiftDate(-1)">
              ‹ {{ t('marketQuery.prevDay') }}
            </button>
            <span class="date-nav-value">{{ selectedDate }}</span>
            <button type="button" class="date-nav-btn" @click="shiftDate(1)">
              {{ t('marketQuery.nextDay') }} ›
            </button>
          </div>
        </div>
        <div class="query-field">
          <span class="query-field-label">{{ t('marketQuery.hourLabel') }}</span>
          <AppSelect v-model="selectedHour" :options="hourOptions" />
        </div>
        <div class="query-field">
          <span class="query-field-label">{{ t('marketQuery.filterResourceLabel') }}</span>
          <div class="query-resource-wrap">
            <ResourceSelect
              v-model="filterResource"
              :allow-keys="resources"
              :placeholder="t('marketQuery.resourcePlaceholder')"
            />
            <button
              v-if="filterResource"
              type="button"
              class="qt-clear"
              @click="filterResource = ''"
            >
              ✕ {{ t('marketQuery.clearFilter') }}
            </button>
          </div>
        </div>
        <button
          type="button"
          class="query-now"
          @click="goToNow"
        >
          {{ t('marketQuery.backToCurrent') }}
        </button>
      </div>

      <div v-if="filteredMarketEntries.length" class="table-card table-margin-top">
        <div class="table-wrapper">
          <table>
            <thead>
              <tr>
                <th class="index-column">{{ t('marketQuery.thIndex') }}</th>
                <th>{{ t('marketQuery.thSell') }}</th>
                <th>{{ t('marketQuery.thBuy') }}</th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="(entry, index) in filteredMarketEntries"
                :key="entry.sell"
                :class="{ 'filter-highlight': isFilteredEntry(entry) }"
              >
                <td class="index-cell">{{ index + 1 }}</td>
                <td class="res-cell">{{ tGame(entry.sell) }}</td>
                <td class="res-cell strong">{{ tGame(entry.buy) }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- 移动端：方块式展示（桌面端隐藏） -->
      <div v-if="filteredMarketEntries.length" class="mobile-market-list table-margin-top">
        <div
          v-for="(entry, index) in filteredMarketEntries"
          :key="`m-${entry.sell}`"
          class="mobile-market-card"
          :class="{ 'filter-highlight': isFilteredEntry(entry) }"
        >
          <span class="mobile-market-index">#{{ index + 1 }}</span>
          <div class="mobile-market-trade">
            <span class="res-cell">{{ tGame(entry.sell) }}</span>
            <span class="arrow">→</span>
            <span class="res-cell strong">{{ tGame(entry.buy) }}</span>
          </div>
        </div>
      </div>
    </section>


    <!-- ==================== 按资源名称查询 ==================== -->
    <section v-if="hasMarketData && activeTab === 'resource'" class="section tab-section">
      <div class="query-panel">
        <div class="query-field">
          <span class="query-field-label">{{ t('marketQuery.trackModeLabel') }}</span>
          <AppSelect v-model="trackMode" :options="modeOptions" />
        </div>
        <div class="query-field">
          <span class="query-field-label">{{ t('marketQuery.resourceLabel') }}</span>
          <ResourceSelect
            v-model="selectedResource"
            :allow-keys="resources"
            :placeholder="t('marketQuery.resourcePlaceholder')"
          />
        </div>
        <div v-if="pagedTrackRows.length" class="pagination">
          <button
            type="button"
            class="page-btn"
            @click="goTrackPage(-1)"
          >
            ‹ {{ t('marketQuery.prevPage') }}
          </button>
          <span class="page-info">
            {{ t('marketQuery.pageRange', { start: trackRangeStart, end: trackRangeEnd }) }}
          </span>
          <button
            type="button"
            class="page-btn"
            @click="goTrackPage(1)"
          >
            {{ t('marketQuery.nextPage') }} ›
          </button>
           <button
          type="button"
          class="query-now"
          @click="trackPage = 1"
        >
          {{ t('marketQuery.backToCurrent') }}
        </button>
        </div>
       
      </div>

      <div v-if="pagedTrackRows.length" class="table-card table-margin-top">
        <div class="table-wrapper">
          <table>
            <thead>
              <tr>
                <th class="hour-column">{{ t('marketQuery.thHour') }}</th>
                <th>{{ t('marketQuery.thTrade') }}</th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="row in pagedTrackRows"
                :key="row.priceId"
                :class="{ 'current-row': row.isCurrent }"
              >
                <td>
                  <span class="hour-cell">{{ row.timeLabel }}</span>
                  <span v-if="row.isCurrent" class="current-badge">
                    {{ t('marketQuery.currentBadge') }}
                  </span>
                </td>
                <td class="trade-cell">
                  <template v-if="row.partner">
                    <span v-if="trackMode === 'sell'">
                      {{ tGame(selectedResource) }} <span class="arrow">→</span> {{ tGame(row.partner) }}
                    </span>
                    <span v-else>
                      {{ tGame(row.partner) }} <span class="arrow">→</span> {{ tGame(selectedResource) }}
                    </span>
                  </template>
                  <span v-else>-</span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- 移动端：方块式展示（桌面端隐藏） -->
      <div v-if="pagedTrackRows.length" class="mobile-track-list table-margin-top">
        <div
          v-for="row in pagedTrackRows"
          :key="`m-${row.priceId}`"
          class="mobile-track-card"
          :class="{ 'current-row': row.isCurrent }"
        >
          <div class="mobile-track-top">
            <span class="hour-cell">{{ row.timeLabel }}</span>
            <span v-if="row.isCurrent" class="current-badge">
              {{ t('marketQuery.currentBadge') }}
            </span>
          </div>
          <div class="mobile-track-trade">
            <template v-if="row.partner">
              <span v-if="trackMode === 'sell'">
                {{ tGame(selectedResource) }} <span class="arrow">→</span> {{ tGame(row.partner) }}
              </span>
              <span v-else>
                {{ tGame(row.partner) }} <span class="arrow">→</span> {{ tGame(selectedResource) }}
              </span>
            </template>
            <span v-else>-</span>
          </div>
        </div>
      </div>

      <div v-else class="empty-state">
        <h3>
          {{ t('marketQuery.emptyTrackTitle') }}
        </h3>
        <p>
          {{ t('marketQuery.emptyTrackDesc') }}
        </p>
      </div>
    </section>


    <!-- ==================== 未上传存档 ==================== -->
    <section v-if="!hasMarketData && !parsing" class="empty-state">
      <h3>
        {{ t('marketQuery.noSaveTitle') }}
      </h3>
      <p>
        {{ t('marketQuery.noSaveDesc') }}
      </p>
    </section>

  </div>
</template>


<script setup>
import { ref, computed, watch } from 'vue'
import AppSelect from '@/components/AppSelect.vue'
import ResourceSelect from '@/components/ResourceSelect.vue'
import buildingsData from '@/data/buildings.json'
import marketData from '@/data/market.json'
import { t, tGame, locale } from '@/i18n'

const HOUR = 60 * 60 * 1000

/* =========================================================
 * 存档解析（复刻游戏导出的压缩存档）
 * ========================================================= */

const saveData = ref(null)
const saveLoaded = ref(false)
const parsing = ref(false)
const errorMsg = ref('')

/* =========================================================
 * localStorage 持久化：仅保存可用资源 + 上传时间（不存整个存档）
 * ========================================================= */

const STORAGE_RESOURCES_KEY = 'cividle-market-resources'
const STORAGE_TIME_KEY = 'cividle-market-upload-time'

function readStoredArray(key) {
  try {
    const raw = localStorage.getItem(key)
    if (!raw) return null
    const val = JSON.parse(raw)
    return Array.isArray(val) ? val : null
  } catch {
    return null
  }
}

const storedResources = ref(readStoredArray(STORAGE_RESOURCES_KEY))
const lastUploadTime = ref((() => {
  try {
    const raw = localStorage.getItem(STORAGE_TIME_KEY)
    return raw ? Number(raw) : null
  } catch {
    return null
  }
})())

const hasMarketData = computed(() => saveLoaded.value || resources.value.length > 0)

function persistResources() {
  const list = resources.value
  if (!list.length) return
  const now = Date.now()
  try {
    localStorage.setItem(STORAGE_RESOURCES_KEY, JSON.stringify(list))
    localStorage.setItem(STORAGE_TIME_KEY, String(now))
    lastUploadTime.value = now
  } catch {
    /* ignore */
  }
}

const lastUploadLabel = computed(() => {
  if (!lastUploadTime.value) return ''
  return new Date(lastUploadTime.value).toLocaleString(
    locale.value === 'zh' ? 'zh-CN' : 'en-US',
    { dateStyle: 'medium', timeStyle: 'medium' }
  )
})

// 反序列化：$type 标记的 Map / Set 还原
const reviver = (key, value) => {
  if (typeof value === 'object' && value !== null) {
    if (value.$type === 'Map') return new Map(value.value)
    if (value.$type === 'Set') return new Set(value.value)
  }
  return value
}

async function decompress(bytes, format) {
  const stream = new Blob([bytes]).stream().pipeThrough(new DecompressionStream(format))
  return await new Response(stream).text()
}

// 兼容 Map / 普通对象（unlockedTech / unlockedUpgrades 可能是其中一种）
function toPlainObject(obj) {
  if (!obj) return {}
  if (obj instanceof Map) return Object.fromEntries(obj)
  return obj
}

function onFileChange(e) {
  const file = e.target.files[0]
  if (!file) return
  handleFile(file)
}

/* =========================================================
 * 拖拽上传
 * ========================================================= */

const dragDepth = ref(0)
const dragging = computed(() => dragDepth.value > 0)

function onDragEnter() {
  dragDepth.value++
}

function onDragLeave() {
  dragDepth.value = Math.max(0, dragDepth.value - 1)
}

function onDrop(e) {
  dragDepth.value = 0
  const file = e.dataTransfer?.files?.[0]
  if (file) handleFile(file)
}

async function handleFile(file) {
  parsing.value = true
  errorMsg.value = ''

  try {
    if (typeof DecompressionStream === 'undefined') {
      throw new Error('当前浏览器不支持 DecompressionStream，请使用新版 Chrome/Edge/Safari/Firefox')
    }

    const bytes = new Uint8Array(await file.arrayBuffer())
    let jsonStr = ''

    // 嗅探 gzip 魔数，否则依次尝试 deflate-raw / deflate
    const isGzipped = bytes.length >= 2 && bytes[0] === 0x1f && bytes[1] === 0x8b
    if (isGzipped) {
      jsonStr = await decompress(bytes, 'gzip')
    } else {
      try {
        jsonStr = await decompress(bytes, 'deflate-raw')
      } catch {
        jsonStr = await decompress(bytes, 'deflate')
      }
    }

    const data = JSON.parse(jsonStr, reviver)
    applySave(data)
  } catch (err) {
    // 兜底：尝试当作未压缩的纯文本 JSON
    try {
      const text = new TextDecoder().decode(new Uint8Array(await file.arrayBuffer()))
      const data = JSON.parse(text, reviver)
      applySave(data)
    } catch {
      saveLoaded.value = false
      errorMsg.value = t('marketQuery.parseError') + ': ' + err.message
    }
  } finally {
    parsing.value = false
  }
}

function applySave(data) {
  saveData.value = data
  saveLoaded.value = true
  selectedDate.value = formatYMD(new Date())
  selectedHour.value = String(new Date().getHours())
  filterResource.value = ''
  selectedResource.value = ''
  trackMode.value = 'sell'
  activeTab.value = 'time'
  persistResources()
}

/* =========================================================
 * 随机算法（复刻游戏 utilities/Random + Helper）
 * ========================================================= */

function xmur3(str) {
  let h
  for (let i = 0, h2 = 1779033703 ^ str.length; i < str.length; i++) {
    h2 = Math.imul(h2 ^ str.charCodeAt(i), 3432918353)
    h2 = (h2 << 13) | (h2 >>> 19)
    h = h2
  }
  return function () {
    h = Math.imul(h ^ (h >>> 16), 2246822507)
    h = Math.imul(h ^ (h >>> 13), 3266489909)
    return (h ^= h >>> 16) >>> 0
  }
}

function sfc32(a, b, c, d) {
  return function () {
    a |= 0
    b |= 0
    c |= 0
    d |= 0
    const t2 = (((a + b) | 0) + d) | 0
    d = (d + 1) | 0
    a = b ^ (b >>> 9)
    b = (c + (c << 3)) | 0
    c = (c << 21) | (c >>> 11)
    c = (c + t2) | 0
    return (t2 >>> 0) / 4294967296
  }
}

function srand(str) {
  const seed = xmur3(str)
  return sfc32(seed(), seed(), seed(), seed())
}

function shuffle(array, rand) {
  rand = rand ?? Math.random
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1))
    ;[array[i], array[j]] = [array[j], array[i]]
  }
  return array
}

// 生成某个 priceId 的市场（sell -> buy）
function generateMarket(priceId, resources) {
  const seed = String(priceId)
  const buy = shuffle([...resources], srand(seed))
  const sell = shuffle([...resources], srand(seed))
  const result = {}
  let idx = 0
  for (const res of sell) {
    while (buy[idx % buy.length] === res) idx++
    result[res] = buy[idx % buy.length]
  }
  return result
}

/* =========================================================
 * 根据存档计算市场 resources（复刻游戏 IntraTickCache）
 * ========================================================= */

const resources = computed(() => {
  if (!saveData.value) return storedResources.value || []
  const current = saveData.value.current || {}
  const unlockedTech = toPlainObject(current.unlockedTech)
  const unlockedUpgrades = toPlainObject(current.unlockedUpgrades)

  const { techUnlock, upgradeUnlock, noPrice, noStorage } = marketData
  const noPriceSet = new Set(noPrice)
  const noStorageSet = new Set(noStorage)

  // 建筑 -> 产出资源名（保持 buildings.json 的 output key 顺序）
  const buildingOutput = {}
  for (const b of buildingsData) {
    if (b.output) buildingOutput[b.building] = Object.keys(b.output)
  }

  // 已解锁建筑（顺序 = 存档科技/升级顺序 × unlockBuilding 数组顺序）
  const unlockedBuildings = {}
  for (const tech of Object.keys(unlockedTech)) {
    ;(techUnlock[tech] || []).forEach((b) => {
      unlockedBuildings[b] = true
    })
  }
  for (const upgrade of Object.keys(unlockedUpgrades)) {
    ;(upgradeUnlock[upgrade] || []).forEach((b) => {
      unlockedBuildings[b] = true
    })
  }

  // 已解锁资源（顺序 = 建筑顺序 × output key 顺序）
  const unlockedResources = {}
  for (const b of Object.keys(unlockedBuildings)) {
    ;(buildingOutput[b] || []).forEach((res) => {
      unlockedResources[res] = true
    })
  }

  // 过滤 NoPrice / NoStorage
  return Object.keys(unlockedResources).filter(
    (res) => !noPriceSet.has(res) && !noStorageSet.has(res)
  )
})

const techCount = computed(() => {
  if (!saveData.value) return 0
  const current = saveData.value.current || {}
  return Object.keys(toPlainObject(current.unlockedTech)).length
})

/* =========================================================
 * 当前交易
 * ========================================================= */

// 当前激活的查询方式：'time' 按时间查询 / 'resource' 按资源名称查询
const activeTab = ref('time')

/* =========================================================
 * 特定时间查询
 * ========================================================= */

function formatYMD(d) {
  const pad = (n) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

function formatHourLabel(ts) {
  const d = new Date(ts)
  const pad = (n) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:00`
}

// 时间：24 小时
const hourOptions = computed(() => {
  const options = []
  for (let i = 0; i < 24; i++) {
    options.push({ value: String(i), label: `${String(i).padStart(2, '0')}:00` })
  }
  return options
})

const selectedDate = ref(formatYMD(new Date()))
const selectedHour = ref(String(new Date().getHours()))

function goToNow() {
  selectedDate.value = formatYMD(new Date())
  selectedHour.value = String(new Date().getHours())
}

function shiftDate(delta) {
  const [y, m, d] = selectedDate.value.split('-').map(Number)
  const dt = new Date(y, m - 1, d)
  dt.setDate(dt.getDate() + delta)
  selectedDate.value = formatYMD(dt)
}

// 所选 日期+时间 -> 该小时的市场
const selectedMarketEntries = computed(() => {
  if (!resources.value.length || !selectedDate.value || selectedHour.value == null) return []
  const [y, m, d] = selectedDate.value.split('-').map(Number)
  const ts = new Date(y, m - 1, d, Number(selectedHour.value), 0, 0).getTime()
  const market = generateMarket(Math.floor(ts / HOUR), resources.value)
  return Object.entries(market).map(([sell, buy]) => ({ sell, buy }))
})

// 资源筛选：选某个资源后，显示全部条目，但把它的出售与获得两条置顶
const filterResource = ref('')
const filteredMarketEntries = computed(() => {
  const all = selectedMarketEntries.value
  if (!filterResource.value) return all
  const res = filterResource.value
  const matched = all.filter((e) => e.sell === res || e.buy === res)
  const rest = all.filter((e) => e.sell !== res && e.buy !== res)
  return [...matched, ...rest]
})

function isFilteredEntry(entry) {
  const res = filterResource.value
  return !!res && (entry.sell === res || entry.buy === res)
}

/* =========================================================
 * 资源追踪：无限翻页（每页 10 条，前后可无限翻）
 * ========================================================= */

const TRACK_PAGE_SIZE = 10
const trackMode = ref('sell')
const selectedResource = ref('')
const trackPage = ref(1)

const modeOptions = computed(() => [
  { value: 'sell', label: t('marketQuery.trackModeSell') },
  { value: 'buy', label: t('marketQuery.trackModeBuy') }
])

// 第 1 页为“当前小时”页，offset 0 为当前整点，负值为过去、正值为未来
const pagedTrackRows = computed(() => {
  if (!resources.value.length || !selectedResource.value) return []
  const now = Math.floor(Date.now() / HOUR) * HOUR
  const start = (trackPage.value - 1) * TRACK_PAGE_SIZE
  const rows = []
  for (let i = 0; i < TRACK_PAGE_SIZE; i++) {
    const offset = start + i
    const ts = now + offset * HOUR
    const priceId = Math.floor(ts / HOUR)
    const market = generateMarket(priceId, resources.value)

    let partner = null
    if (trackMode.value === 'sell') {
      partner = market[selectedResource.value] || null
    } else {
      // 获得模式：找到「出售 X 能得到该资源」的 X
      for (const [sell, buy] of Object.entries(market)) {
        if (buy === selectedResource.value) {
          partner = sell
          break
        }
      }
    }

    rows.push({
      priceId,
      isCurrent: offset === 0,
      timeLabel: formatHourLabel(ts),
      partner
    })
  }
  return rows
})

// 当前页显示的时间区间
const trackRangeStart = computed(() => pagedTrackRows.value[0]?.timeLabel ?? '')
const trackRangeEnd = computed(() => pagedTrackRows.value[pagedTrackRows.value.length - 1]?.timeLabel ?? '')

function goTrackPage(delta) {
  trackPage.value += delta
}

// 切换资源 / 查看方式时回到当前小时页（第 1 页）
watch([selectedResource, trackMode], () => {
  trackPage.value = 1
})
</script>


<style scoped>
.market-query-page *,
.market-query-page *::before,
.market-query-page *::after {
  box-sizing: border-box;
}

.market-query-page {
  min-height: 100vh;
}

/* =========================================================
 * 查询卡片（与其他工具 calculator-card 风格一致）
 * ========================================================= */

.calculator-card {
  position: relative;
  width: 100%;
  padding: 20px 24px 24px;
  background: #ffffff;
  border: 2px solid #4a90d9;
  border-radius: 16px;
  box-shadow: 0 4px 20px rgba(74, 144, 217, 0.08);
}

.calculator-card.is-dragging {
  border-style: dashed;
  border-color: #2b6cb0;
  box-shadow: 0 0 0 3px rgba(74, 144, 217, 0.22);
}

.drop-overlay {
  position: absolute;
  inset: 0;
  z-index: 5;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 14px;
  background: rgba(74, 144, 217, 0.16);
  color: #1f3a5f;
  font-size: 16px;
  font-weight: 700;
  letter-spacing: 1px;
  pointer-events: none;
}

.calculator-header {
  margin-bottom: 20px;
}

.calculator-title {
  display: flex;
  align-items: center;
  gap: 8px;
  color: #1a2332;
  font-size: 17px;
  font-weight: 600;
}

.calculator-description {
  margin-top: 5px;
  color: #6b7a8f;
  font-size: 13px;
  line-height: 1.6;
}

/* =========================================================
 * 上传 / 拖拽区域
 * ========================================================= */

.drop-zone {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-top: 2px;
  padding: 20px 22px;
  background: #f7fafd;
  border: 2px dashed #b9d4ee;
  border-radius: 12px;
  cursor: pointer;
  transition: background 150ms ease, border-color 150ms ease;
}

.drop-zone:hover {
  background: #eef5fc;
  border-color: #7fb0e0;
}

.drop-zone input[type='file'] {
  display: none;
}

.drop-zone-text {
  display: flex;
  flex-direction: column;
  gap: 4px;
  flex: 1;
  min-width: 0;
}

.drop-zone-title {
  color: #1f3a5f;
  font-size: 15px;
  font-weight: 600;
}

.drop-zone-hint {
  color: #8296ad;
  font-size: 12.5px;
  line-height: 1.5;
}

.drop-zone-btn {
  flex-shrink: 0;
  padding: 9px 18px;
  border-radius: 8px;
  background: #4a90d9;
  color: #ffffff;
  font-size: 13px;
  font-weight: 600;
  transition: background 150ms ease;
}

.drop-zone:hover .drop-zone-btn {
  background: #3d7fc4;
}

.upload-status-row {
  margin-top: 10px;
}

.upload-status {
  color: #9aabbf;
  font-size: 13px;
}

.upload-status.ok {
  color: #2e9e6b;
}

.last-upload-hint {
  margin: 10px 0 0;
  color: #8296ad;
  font-size: 12.5px;
}

.upload-error {
  margin: 10px 0 0;
  color: #d9534f;
  font-size: 13px;
  line-height: 1.5;
}

.privacy-note {
  margin-top: 16px;
  padding: 12px 16px;
  background: #e8f1fb;
  border: 1px solid #aecdea;
  border-left: 4px solid #2b6cb0;
  border-radius: 8px;
}

.privacy-note-title {
  display: block;
  color: #1f3a5f;
  font-size: 14px;
  font-weight: 700;
}

.privacy-note-text {
  margin: 6px 0 0;
  color: #33475b;
  font-size: 13px;
  line-height: 1.7;
}

.privacy-link {
  color: #2b6cb0;
  font-weight: 600;
  text-decoration: underline;
  cursor: pointer;
}

.privacy-link:hover {
  color: #1a4f8a;
}

.summary-row {
  display: flex;
  flex-wrap: wrap;
  gap: 10px 18px;
  margin-top: 16px;
  padding-top: 14px;
  border-top: 1px dashed #dce6f2;
}

.summary-item {
  color: #6b7a8f;
  font-size: 13px;
}

/* =========================================================
 * 使用帮助
 * ========================================================= */

.market-help {
  margin-top: 20px;
  padding: 16px 20px;
  background: #ffffff;
  border: 1px solid #e0e8f2;
  border-radius: 12px;
}

.market-help-title {
  color: #1a2332;
  font-size: 14px;
  font-weight: 600;
  margin-bottom: 8px;
}

.market-help-list {
  margin: 0;
  padding: 0;
  list-style: none;
}

.market-help-list li {
  position: relative;
  padding-left: 14px;
  color: #6b7a8f;
  font-size: 13px;
  line-height: 1.7;
}

.market-help-list li + li {
  margin-top: 4px;
}

.market-help-list li::before {
  content: '';
  position: absolute;
  left: 0;
  top: 10px;
  width: 5px;
  height: 5px;
  border-radius: 50%;
  background: #4a90d9;
}

/* =========================================================
 * Tab 切换（按时间 / 按资源）
 * ========================================================= */

.tab-bar {
  display: flex;
  gap: 6px;
  width: 100%;
  margin-top: 28px;
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

/* 标签页内容区块（比普通 section 紧凑一些） */
.section.tab-section {
  margin-top: 24px;
}

/* =========================================================
 * 查询面板（标签在上、控件在下，整洁对齐）
 * ========================================================= */

.query-panel {
  display: flex;
  flex-wrap: wrap;
  align-items: flex-end;
  gap: 16px 24px;
  padding: 18px 20px;
  background: #f8fafc;
  border: 1px solid #e8edf4;
  border-radius: 12px;
}

.query-field {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.query-field-label {
  color: #6b7a8f;
  font-size: 12px;
  font-weight: 500;
  line-height: 1.4;
  white-space: nowrap;
}

.query-resource-wrap {
  display: flex;
  align-items: center;
  gap: 8px;
}

.date-nav {
  display: inline-flex;
  align-items: center;
  gap: 6px;
}

.date-nav-btn {
  height: 34px;
  padding: 0 12px;
  border: 1px solid #4a90d9;
  border-radius: 8px;
  background: #f0f6ff;
  color: #3d7fc4;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  white-space: nowrap;
  transition: background 150ms ease;
}

.date-nav-btn:hover {
  background: #e3efff;
}

.date-nav-value {
  min-width: 92px;
  text-align: center;
  color: #1a2332;
  font-size: 13px;
  font-weight: 600;
}

/* 压缩下拉组件高度与最小宽度 */
.query-panel :deep(.as-trigger),
.query-panel :deep(.rs-trigger) {
  height: 34px !important;
  min-height: 34px !important;
}

.query-panel :deep(.app-select),
.query-panel :deep(.resource-select) {
  min-width: 200px;
}

.query-now {
  margin-left: auto;
  height: 34px;
  padding: 0 14px;
  border: 1px solid #4a90d9;
  border-radius: 8px;
  background: #f0f6ff;
  color: #3d7fc4;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  white-space: nowrap;
  transition: background 150ms ease;
}

.query-now:hover {
  background: #e3efff;
}


/* =========================================================
 * 分页
 * ========================================================= */

.pagination {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-left: auto;
}

.page-btn {
  height: 32px;
  padding: 0 14px;
  border: 1px solid #4a90d9;
  border-radius: 8px;
  background: #f0f6ff;
  color: #3d7fc4;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  white-space: nowrap;
  transition: background 150ms ease, opacity 150ms ease;
}

.page-btn:hover:not(:disabled) {
  background: #e3efff;
}

.page-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.page-info {
  color: #6b7a8f;
  font-size: 12px;
}

.qt-clear {
  height: 34px;
  padding: 0 10px;
  border: none;
  border-radius: 8px;
  background: #f0f5fe;
  color: #4a90d9;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  white-space: nowrap;
  transition: background 150ms ease;
}

.qt-clear:hover {
  background: #e3efff;
}

/* =========================================================
 * Section
 * ========================================================= */

.section {
  width: 100%;
  margin-top: 34px;
}

.section-header {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 20px;
  margin-bottom: 16px;
}

.section-title-group {
  min-width: 0;
}

.section-header h2 {
  margin: 0;
  color: #1a2332;
  font-size: 18px;
  line-height: 1.45;
  font-weight: 600;
}

.section-header p {
  margin: 5px 0 0;
  color: #6b7a8f;
  font-size: 13px;
  line-height: 1.6;
}

.section-badge {
  flex-shrink: 0;
  display: inline-flex;
  align-items: center;
  height: 28px;
  padding: 0 10px;
  border: 1px solid #dce6f2;
  border-radius: 999px;
  background: #f7faff;
  color: #6b7a8f;
  font-size: 12px;
  font-weight: 500;
}

/* =========================================================
 * Table Card
 * ========================================================= */

.table-card {
  width: 100%;
  overflow: hidden;
  border: 1px solid #e8edf4;
  border-radius: 12px;
  background: #ffffff;
}

.table-margin-top {
  margin-top: 18px;
}

.table-wrapper {
  width: 100%;
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
}

table {
  width: 100%;
  min-width: 640px;
  border-collapse: collapse;
  font-size: 13px;
  table-layout: fixed;
}

thead {
  background: #f5f8fc;
}

th {
  height: 44px;
  padding: 0 16px;
  border-bottom: 1px solid #eef2f6;
  color: #6b7a8f;
  font-size: 12px;
  line-height: 1.4;
  font-weight: 600;
  text-align: left;
  white-space: nowrap;
}

td {
  height: 50px;
  padding: 0 16px;
  border-bottom: 1px solid #eef2f6;
  color: #1a2332;
  white-space: nowrap;
}

tbody tr {
  transition: background 150ms ease;
}

tbody tr:hover {
  background: #f7faff;
}

/* 筛选命中行：置顶并高亮背景 */
.filter-highlight,
.filter-highlight:hover {
  background: #fff3cd;
}

tbody tr:last-child td {
  border-bottom: none;
}

.index-column {
  width: 70px;
  text-align: center;
}

/* 资源追踪表：时间列固定宽度，避免切换页时列宽抖动 */
.hour-column {
  width: 200px;
}

.index-cell {
  color: #9aabbf;
  text-align: center;
}

.res-cell {
  color: #1a2332;
}

.res-cell.strong {
  font-weight: 600;
}

.hour-cell {
  color: #1a2332;
  font-weight: 500;
}

.trade-cell {
  color: #1a2332;
}

.trade-cell .arrow {
  margin: 0 6px;
  color: #4a90d9;
}

.current-badge {
  display: inline-flex;
  align-items: center;
  height: 20px;
  margin-left: 8px;
  padding: 0 7px;
  border-radius: 999px;
  background: #e3f2e8;
  color: #2e9e6b;
  font-size: 11px;
  font-weight: 600;
}

.current-row {
  background: #f7faff;
}

/* =========================================================
 * 空状态
 * ========================================================= */

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  width: 100%;
  min-height: 280px;
  margin-top: 34px;
  padding: 32px 20px;
  border: 1px dashed #dce6f2;
  border-radius: 14px;
  background: #fbfdff;
  text-align: center;
}

.empty-state h3 {
  margin: 0;
  color: #1a2332;
  font-size: 16px;
  font-weight: 600;
}

.empty-state p {
  margin: 8px 0 0;
  max-width: 460px;
  color: #6b7a8f;
  font-size: 13px;
  line-height: 1.6;
}

/* =========================================================
 * 移动端方块 Card（桌面端隐藏）
 * ========================================================= */

.mobile-market-list,
.mobile-track-list {
  display: none;
}

.mobile-market-card,
.mobile-track-card {
  min-width: 0;
  padding: 14px;
  border: 1px solid #e8edf4;
  border-radius: 12px;
  background: #ffffff;
}

.mobile-market-card.filter-highlight {
  border-color: #e6b800;
  background: #fff3cd;
}

.mobile-market-index {
  display: block;
  color: #9aabbf;
  font-size: 12px;
  font-weight: 500;
  margin-bottom: 6px;
}

.mobile-market-trade {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
}

.mobile-track-card.current-row {
  border-color: #4a90d9;
  background: #f7faff;
}

.mobile-track-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  margin-bottom: 6px;
}

.mobile-track-trade {
  font-size: 14px;
  color: #1a2332;
}

/* =========================================================
 * 响应式
 * ========================================================= */

@media (max-width: 768px) {
  .calculator-card {
    padding: 16px;
  }

  .section {
    margin-top: 30px;
  }

  .section-header {
    align-items: flex-start;
    flex-direction: column;
    gap: 10px;
  }

  /* 移动端切换为方块展示，隐藏表格 */
  .table-card {
    display: none;
  }

  .mobile-market-list,
  .mobile-track-list {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 12px;
  }
}

@media (max-width: 600px) {
  .calculator-card {
    padding: 16px 14px;
    border-radius: 12px;
  }

  .section-header h2 {
    font-size: 17px;
  }

  .table-card {
    border-radius: 10px;
  }

  .mobile-market-list,
  .mobile-track-list {
    grid-template-columns: 1fr;
  }

  .empty-state {
    min-height: 240px;
  }
}

@media (prefers-reduced-motion: reduce) {
  .query-now,
  tbody tr {
    transition: none;
  }
}
</style>
