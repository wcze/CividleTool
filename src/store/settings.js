import { ref } from 'vue'

const STORAGE_KEY = 'cividle-number-format'
const DEFAULT_FORMAT = 'suffix' // 'suffix'（如 1Qa） | 'scientific'（如 1e15）

// 大数展示格式，全局共享，供 utils/format.js 读取
export const numberFormat = ref(localStorage.getItem(STORAGE_KEY) || DEFAULT_FORMAT)

export function setNumberFormat(mode) {
  if (mode !== 'suffix' && mode !== 'scientific') return
  numberFormat.value = mode
  localStorage.setItem(STORAGE_KEY, mode)
}
