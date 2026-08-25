/**
 * ========================================
 * 通用大数格式化工具
 * ========================================
 *
 * 供多个工具页面共用（如伟人获取成本、建筑升级等）。
 *
 * 默认基础单位是 M（放置文明的资源单位）：
 *
 * 1000M = 1B
 * 1000B = 1T
 * 1000T = 1Qa
 * ...
 *
 * 如需其他计数体系（如带 K 的普通计数），可传入自定义后缀列表，
 * 例如 formatNumber(num, ['', 'K', 'M', 'B', 'T', ...])。
 *
 * 展示格式（单位后缀 / 科学计数法）由用户在设置页选择，
 * 详见 store/settings.js 的 numberFormat。
 */

import { numberFormat } from '../store/settings'

// 默认数字后缀（基础单位 M，用于已经是"百万"起步的数值，如伟人成本）
const DEFAULT_SUFFIXES = ['M', 'B', 'T', 'Qa', 'Qt', 'Sx', 'Sp', 'Oc', 'No', 'Dc']

/**
 * 完整数字后缀（从个位起步），用于尚未折算成 M 的原始数量
 * （如折合资源数量、建筑资源消耗等）。
 */
export const FULL_SUFFIXES = ['', 'K', 'M', 'B', 'T', 'Qa', 'Qt', 'Sx', 'Sp', 'Oc', 'No', 'Dc']

/**
 * 格式化大数：按用户设置展示为「单位后缀」（按 1000 进位）或「科学计数法」。
 *
 * @param {number} value 数值
 * @param {string[]} [suffixes] 单位后缀列表（从最低位开始），默认 M/B/T/Qa...
 * @param {number} [baseMultiplier] value 对应的真实数量倍率，仅用于科学计数法，默认 1
 * @returns {string} 单位后缀模式：64 → "64M"，1728 → "1.73B"；科学计数法模式：真实数值 < 1000 时不转换（如 10 → "10.0"），
 *   避免出现 "1.00e1" 这类反而更难读的小数字；>= 1000 时使用指数形式，如 5000000 → "5.00e6"
 */
export function formatNumber(value, suffixes = DEFAULT_SUFFIXES, baseMultiplier = 1) {
  if (!Number.isFinite(value)) {
    return numberFormat.value === 'scientific' ? '0' : '0' + suffixes[0]
  }

  if (value === 0) {
    return numberFormat.value === 'scientific' ? '0' : '0' + suffixes[0]
  }

  if (value < 0) {
    return '-' + formatNumber(-value, suffixes, baseMultiplier)
  }

  if (numberFormat.value === 'scientific') {
    const realValue = value * baseMultiplier
    if (realValue < 1000) {
      return formatDecimal(realValue)
    }
    return realValue.toExponential(2).replace('e+', 'e')
  }

  let displayValue = value
  let tier = 0

  while (displayValue >= 1000 && tier < suffixes.length - 1) {
    displayValue /= 1000
    tier++
  }

  return formatDecimal(displayValue) + suffixes[tier]
}

/**
 * 小数格式：根据数值大小自适应位数。
 *
 * - >= 100：不保留小数
 * - >= 10：保留 1 位
 * - 其他：保留 2 位
 */
function formatDecimal(value) {
  if (value >= 100) {
    return value.toFixed(0)
  }

  if (value >= 10) {
    return value.toFixed(1)
  }

  return value.toFixed(2)
}

/**
 * 格式化带千分位分隔的完整数字。
 *
 * @param {number} value 数值
 * @returns {string} 例如 13824000 → "13,824,000"
 */
export function formatNumberDetail(value) {
  if (!Number.isFinite(value)) {
    return '0'
  }

  return Math.round(value).toLocaleString('en-US')
}

/**
 * 同时展示科学计数法（带后缀）与完整数字。
 *
 * 数值以基础单位（默认 M = 百万）传入，故详细数字需乘以基数倍率
 * 得到真实数值。例如传入 64（即 64M）：
 *
 * formatNumberWithDetail(64)
 *   → "64.0M (64,000,000)"
 *
 * @param {number} value 数值（基础单位）
 * @param {string[]} [suffixes] 后缀列表（从最低位开始），默认 M/B/T/Qa...
 * @param {number} [baseMultiplier] 基础单位对应的真实数量，默认 1e6（M = 百万）
 * @returns {string} 例如 64 → "64.0M (64,000,000)"
 */
export function formatNumberWithDetail(value, suffixes = DEFAULT_SUFFIXES, baseMultiplier = 1e6) {
  return `${formatNumber(value, suffixes, baseMultiplier)} (${formatNumberDetail(value * baseMultiplier)})`
}
