<template>
  <div ref="rootRef" class="app-select" :class="{ 'is-disabled': disabled }">
    <!-- 触发按钮（非原生 select，无默认样式） -->
    <button
      type="button"
      class="as-trigger"
      :class="{ 'is-open': open }"
      :disabled="disabled"
      :aria-haspopup="'listbox'"
      :aria-expanded="open"
      @click="toggle"
    >
      <span v-if="selected" class="as-value">{{ selected[labelKey] }}</span>
      <span v-else class="as-placeholder">{{ placeholder }}</span>

      <svg
        class="as-chevron"
        :class="{ 'is-open': open }"
        viewBox="0 0 20 20"
        fill="none"
        aria-hidden="true"
      >
        <path
          d="M5 7.5L10 12.5L15 7.5"
          stroke="currentColor"
          stroke-width="1.7"
          stroke-linecap="round"
          stroke-linejoin="round"
        />
      </svg>
    </button>

    <!-- 下拉面板 -->
    <div v-if="open" class="as-dropdown">
      <ul class="as-list" role="listbox">
        <li
          v-for="opt in options"
          :key="opt[valueKey]"
          class="as-item"
          :class="{ 'is-selected': opt[valueKey] === model }"
          role="option"
          :aria-selected="opt[valueKey] === model"
          @click="select(opt[valueKey])"
        >
          {{ opt[labelKey] }}
        </li>

        <li v-if="!options.length" class="as-empty">
          {{ emptyText }}
        </li>
      </ul>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'

/**
 * 通用下拉选择组件（自定义样式，非原生 select）。
 *
 * 用法：
 * <AppSelect v-model="selected" :options="[{ value, label }, ...]" placeholder="请选择" />
 *
 * 特点：
 * - v-model 绑定选中项的 value（defineModel）
 * - options 支持对象数组，通过 valueKey / labelKey 指定取值字段，便于跨项目复用
 * - 自定义下拉面板，无浏览器默认 select 样式
 * - 点击外部关闭、键盘可用、移动端友好（触控目标 ≥ 44px）
 * - 不依赖本项目 i18n，placeholder / emptyText 由父级传入，方便复用到其他项目
 *
 * props：
 * - options:     选项数组，默认 [{ value, label }]
 * - placeholder: 未选中时的占位文案
 * - emptyText:   空选项时的提示
 * - disabled:    是否禁用
 * - valueKey:    取值字段，默认 'value'
 * - labelKey:    取显示文本字段，默认 'label'
 */

const props = defineProps({
  options: { type: Array, default: () => [] },
  placeholder: { type: String, default: '' },
  emptyText: { type: String, default: '' },
  disabled: { type: Boolean, default: false },
  valueKey: { type: String, default: 'value' },
  labelKey: { type: String, default: 'label' }
})

// v-model 绑定选中的 value
const model = defineModel({ type: [String, Number], default: '' })

const open = ref(false)
const rootRef = ref(null)

// 当前选中项
const selected = computed(
  () => props.options.find((o) => o[props.valueKey] === model.value) || null
)

function toggle() {
  if (props.disabled) return
  open.value = !open.value
}

function select(value) {
  model.value = value
  open.value = false
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
/* =========================================
   容器
========================================= */
.app-select {
  position: relative;
  display: block;
  width: 100%;
  min-width: 0;
}

.app-select.is-disabled {
  cursor: not-allowed;
  opacity: 0.6;
}

/* =========================================
   触发按钮
========================================= */
.as-trigger {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;

  width: 100%;
  height: 44px;

  padding: 0 14px;
  box-sizing: border-box;

  color: #1a2332;
  background: #fafcff;

  border: 1px solid #dce6f2;
  border-radius: 9px;

  font-family: inherit;
  font-size: 14px;
  text-align: left;

  cursor: pointer;

  transition:
    border-color 180ms ease,
    background 180ms ease,
    box-shadow 180ms ease;
}

.as-trigger:hover:not(:disabled) {
  border-color: #bcd3ec;
}

.as-trigger.is-open,
.as-trigger:focus-visible {
  background: #ffffff;
  border-color: #4a90d9;
  box-shadow: 0 0 0 3px rgba(74, 144, 217, 0.1);
  outline: none;
}

.as-trigger:disabled {
  cursor: not-allowed;
}

.as-value {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-weight: 500;
}

.as-placeholder {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  color: #9aabbf;
}

.as-chevron {
  flex-shrink: 0;
  width: 18px;
  height: 18px;
  color: #8a9ab0;
  transition: transform 0.18s ease;
}

.as-chevron.is-open {
  transform: rotate(180deg);
}

/* =========================================
   下拉面板
========================================= */
.as-dropdown {
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

.as-list {
  list-style: none;
  margin: 0;
  padding: 6px;
  max-height: 300px;
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
}

.as-item {
  display: flex;
  align-items: center;
  min-height: 40px;
  padding: 8px 10px;
  box-sizing: border-box;
  border-radius: 8px;

  color: #1a2332;
  font-size: 13px;

  cursor: pointer;
  transition: background 140ms ease;
}

.as-item:hover {
  background: #f0f5fe;
}

.as-item.is-selected {
  background: #f0f5fe;
  color: #4a90d9;
  font-weight: 600;
}

.as-empty {
  padding: 14px;
  text-align: center;
  color: #9aabbf;
  font-size: 13px;
}
</style>
