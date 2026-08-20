<template>
  <div ref="rootRef" class="resource-select">
    <!-- 触发按钮 -->
    <button
      type="button"
      class="rs-trigger"
      :class="{ 'rs-open': open }"
      @click="toggleOpen"
    >
      <span v-if="selected" class="rs-trigger-name">
        {{ selected.name }}
        <span class="rs-trigger-price">{{ formatPrice(selected.price) }}</span>
      </span>
      <span v-else class="rs-trigger-placeholder">
        {{ placeholderText }}
      </span>
      <span class="rs-chevron" :class="{ open }">▾</span>
    </button>

    <!-- 下拉面板 -->
    <div v-if="open" class="rs-dropdown">
      <div class="rs-search">
        <span class="rs-search-icon">🔍</span>
        <input
          v-model="keyword"
          type="text"
          :placeholder="searchPlaceholderText"
          @click.stop
        />
      </div>

      <ul class="rs-list">
        <li
          v-for="res in filteredResources"
          :key="res.key"
          class="rs-item"
          :class="{ selected: res.key === model }"
          @click="select(res.key)"
        >
          <span class="rs-name">{{ res.name }}</span>
          <span class="rs-price">{{ formatPrice(res.price) }}</span>
        </li>
        <li v-if="filteredResources.length === 0" class="rs-empty">
          {{ emptyText }}
        </li>
      </ul>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'
import prices from '@/data/prices.json'
import { t, tGame } from '@/i18n'

/**
 * 通用资源下拉选择组件（带搜索筛选）。
 *
 * 用法：
 * <ResourceSelect v-model="selectedResource" />
 * <ResourceSelect v-model="selectedResource" sort-order="desc" />
 *
 * 数据来源：src/data/prices.json（资源名用 tGame 翻译，显示价格）。
 * 可通过 props 覆盖内置文案（placeholder / searchPlaceholder / emptyText）。
 *
 * props：
 * - sortOrder: 'asc'（价格从小到大，默认）| 'desc'（价格从大到小）
 */

const props = defineProps({
  placeholder: { type: String, default: '' },
  searchPlaceholder: { type: String, default: '' },
  emptyText: { type: String, default: '' },
  sortOrder: { type: String, default: 'asc' }
})

// v-model 绑定选中的资源 key
const model = defineModel({ type: String, default: '' })

const open = ref(false)
const keyword = ref('')
const rootRef = ref(null)

// 内置文案，可通过 props 覆盖
const placeholderText = computed(() => props.placeholder || t('resourceSelect.placeholder'))
const searchPlaceholderText = computed(() => props.searchPlaceholder || t('resourceSelect.searchPlaceholder'))
const emptyText = computed(() => props.emptyText || t('resourceSelect.emptyText'))

// 全部资源：key / 翻译名 / 价格，按价格排序（asc 从小到大 / desc 从大到小）
const resources = computed(() =>
  Object.keys(prices)
    .map((key) => ({
      key,
      name: tGame(key),
      price: prices[key]
    }))
    .sort((a, b) =>
      props.sortOrder === 'desc' ? b.price - a.price : a.price - b.price
    )
)

// 按关键词过滤（匹配翻译名或原始 key）
const filteredResources = computed(() => {
  const kw = keyword.value.trim().toLowerCase()
  if (!kw) return resources.value
  return resources.value.filter(
    (r) =>
      r.name.toLowerCase().includes(kw) ||
      r.key.toLowerCase().includes(kw)
  )
})

// 当前选中项
const selected = computed(
  () => resources.value.find((r) => r.key === model.value) || null
)

function toggleOpen() {
  open.value = !open.value
  if (open.value) {
    keyword.value = ''
  }
}

function select(key) {
  model.value = key
  open.value = false
  keyword.value = ''
}

function formatPrice(value) {
  return Number(value).toLocaleString('en-US')
}

// 点击外部关闭
function onDocClick(event) {
  if (rootRef.value && !rootRef.value.contains(event.target)) {
    open.value = false
  }
}

onMounted(() => document.addEventListener('click', onDocClick))
onBeforeUnmount(() => document.removeEventListener('click', onDocClick))
</script>

<style scoped>
.resource-select {
  position: relative;
  display: inline-block;
  min-width: 180px;
}

.rs-trigger {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  width: 100%;
  height: 40px;
  padding: 0 14px;
  box-sizing: border-box;
  color: #1a2332;
  background: #fafcff;
  border: 1px solid #dce6f2;
  border-radius: 9px;
  cursor: pointer;
  font-size: 13px;
  transition:
    border-color 180ms ease,
    background 180ms ease,
    box-shadow 180ms ease;
}

.rs-trigger:hover {
  border-color: #bcd3ec;
}

.rs-trigger.rs-open,
.rs-trigger:focus-visible {
  background: #ffffff;
  border-color: #4a90d9;
  box-shadow: 0 0 0 3px rgba(74, 144, 217, 0.1);
  outline: none;
}

.rs-trigger-name {
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
  font-weight: 500;
}

.rs-trigger-price {
  color: #9aabbf;
  font-size: 12px;
  font-weight: 400;
}

.rs-trigger-placeholder {
  color: #9aabbf;
}

.rs-chevron {
  flex-shrink: 0;
  color: #9aabbf;
  font-size: 11px;
  transition: transform 0.18s ease;
}

.rs-chevron.open {
  transform: rotate(180deg);
}

/* ===== 下拉面板 ===== */
.rs-dropdown {
  position: absolute;
  top: calc(100% + 6px);
  left: 0;
  right: 0;
  z-index: 30;
  min-width: 100%;
  background: #ffffff;
  border: 1px solid #dce6f2;
  border-radius: 10px;
  box-shadow: 0 12px 32px rgba(15, 23, 42, 0.14);
  overflow: hidden;
}

.rs-search {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 12px;
  border-bottom: 1px solid #eef2f6;
}

.rs-search-icon {
  font-size: 12px;
  opacity: 0.5;
  flex-shrink: 0;
}

.rs-search input {
  flex: 1;
  min-width: 0;
  padding: 7px 10px;
  border: 1px solid #dce6f2;
  border-radius: 7px;
  background: #fafcff;
  color: #1a2332;
  font-size: 13px;
  outline: none;
  transition: all 0.18s ease;
}

.rs-search input:focus {
  border-color: #4a90d9;
  background: #ffffff;
  box-shadow: 0 0 0 3px rgba(74, 144, 217, 0.1);
}

.rs-search input::placeholder {
  color: #9aabbf;
}

.rs-list {
  list-style: none;
  margin: 0;
  padding: 6px;
  max-height: 300px;
  overflow-y: auto;
}

.rs-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  padding: 8px 10px;
  border-radius: 8px;
  cursor: pointer;
  font-size: 13px;
  color: #1a2332;
  transition: background 140ms ease;
}

.rs-item:hover {
  background: #f0f5fe;
}

.rs-item.selected {
  background: #f0f5fe;
  color: #4a90d9;
  font-weight: 600;
}

.rs-name {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.rs-price {
  flex-shrink: 0;
  color: #9aabbf;
  font-size: 12px;
}

.rs-item.selected .rs-price {
  color: #4a90d9;
}

.rs-empty {
  padding: 14px;
  text-align: center;
  color: #9aabbf;
  font-size: 13px;
}
</style>
