<template>
  <div class="great-people-page">


    <section class="calculator-card">
      <div class="calculator-header">
        <div>
          <div class="calculator-title">
            {{ t('calcExtraGreatPerson.title') }}
          </div>

          <div class="calculator-description">
            {{ t('calcExtraGreatPerson.description') }}
          </div>
        </div>
      </div>

      <div class="input-section">
        <div class="input-group">
          <label for="greatPeopleCount">
            {{ t('calcExtraGreatPerson.countLabel') }}
          </label>

          <input
            id="greatPeopleCount"
            v-model="greatPeopleCount"
            type="text"
            inputmode="numeric"
            pattern="[0-9]*"
            autocomplete="off"
            :placeholder="t('calcExtraGreatPerson.countPlaceholder')"
            @input="handleCountInput"
          />

          <div class="input-help">
            {{ t('calcExtraGreatPerson.countHelp') }}
          </div>
        </div>
      </div>

      <div class="result-section">
        <div class="result-header">
          <div class="result-title">
            {{ t('calcExtraGreatPerson.resultTitle') }}
          </div>
        </div>

        <div class="result-main">
          <div class="result-label">
            {{ t('calcExtraGreatPerson.resultLabel', { count: displayCount }) }}
          </div>

          <div class="result-value">
            {{ formatNumberWithDetail(resultCost) }}
          </div>

          <div class="result-equivalent">
            <span class="eq-text">
              {{ t('calcExtraGreatPerson.equivalent', { amount: formatEquivalent(equivalentAmount), resource: selectedResourceName }) }}
            </span>
            <ResourceSelect
              v-model="selectedResource"
              class="eq-select"
              sort-order="desc"
              :placeholder="t('calcExtraGreatPerson.selectResource')"
            />
          </div>
        </div>
      </div>
    </section>

    <section class="table-card">
      <div class="table-header">
        <div>
          <h2>{{ t('calcExtraGreatPerson.tableTitle') }}</h2>
        </div>

        <div class="table-page-info">
          {{ t('calcExtraGreatPerson.pageInfo', { page: currentPage }) }}
        </div>
      </div>

      <div class="table-wrapper">
        <table>
          <thead>
            <tr>
              <th class="index-column">
                {{ t('calcExtraGreatPerson.thCount') }}
              </th>

              <th>
                {{ t('calcExtraGreatPerson.thFormula') }}
              </th>

              <th class="cost-column">
                {{ t('calcExtraGreatPerson.thCost') }}
              </th>
            </tr>
          </thead>

          <tbody>
            <tr
              v-for="item in currentPageItems"
              :key="item.index"
            >
              <td class="index-cell">
                {{ item.index }}
              </td>

              <td class="formula-cell">
                {{ t('calcExtraGreatPerson.formulaCell', { index: item.index }) }}
              </td>

              <td class="cost-cell">
                {{ formatNumberWithDetail(item.cost) }}
              </td>
            </tr>
          </tbody>
        </table>
      </div>


      <!-- 移动端：方块式展示（桌面端隐藏） -->
      <div class="mobile-week-list">

        <div
          v-for="item in currentPageItems"
          :key="`m-${item.index}`"
          class="mobile-week-card"
        >

          <div class="mobile-week-top">

            <span class="mobile-week-index">
              #{{ item.index }}
            </span>

            <span class="mobile-week-cost">
              {{ formatNumberWithDetail(item.cost) }}
            </span>

          </div>


          <div class="mobile-week-formula">
            {{ t('calcExtraGreatPerson.formulaCell', { index: item.index }) }}
          </div>

        </div>

      </div>


      <div class="pagination">
        <div class="pagination-info">
          {{ pageStart }} - {{ pageEnd }}
        </div>

        <div class="pagination-controls">
          <button
            type="button"
            class="pagination-button"
            :disabled="currentPage <= 1"
            @click="previousPage"
          >
            {{ t('calcExtraGreatPerson.prevPage') }}
          </button>

          <span class="current-page">
            {{ currentPage }}
          </span>

          <button
            type="button"
            class="pagination-button"
            @click="nextPage"
          >
            {{ t('calcExtraGreatPerson.nextPage') }}
          </button>
        </div>
      </div>
    </section>
  </div>
</template>

<script setup>
import { computed, ref } from 'vue'
import ResourceSelect from '@/components/ResourceSelect.vue'
import prices from '@/data/prices.json'
import { t, tGame } from '@/i18n'
import { formatNumberWithDetail, formatNumber, FULL_SUFFIXES } from '@/utils/format'

/**
 * 每页显示数量
 */
const PAGE_SIZE = 10

/**
 * ========================================
 * 伟人数量输入
 * ========================================
 *
 * 使用字符串：
 *
 * - 可以删除
 * - 可以清空
 * - 不显示上下箭头
 * - 只允许数字
 */
const greatPeopleCount = ref('1')

/**
 * 当前页
 */
const currentPage = ref(1)

/**
 * ========================================
 * 输入处理
 * ========================================
 */
function handleCountInput(event) {
  const value = event.target.value

  greatPeopleCount.value =
    value.replace(/\D/g, '')

  currentPage.value = 1
}

/**
 * ========================================
 * 当前伟人数量
 * ========================================
 */
const displayCount = computed(() => {
  const value = parseInt(
    greatPeopleCount.value,
    10
  )

  if (
    !Number.isFinite(value) ||
    value < 1
  ) {
    return 1
  }

  return value
})

/**
 * ========================================
 * 第 N 个伟人的获取成本
 * ========================================
 *
 * 公式：
 *
 * 64 × N³ M
 *
 * 例如：
 *
 * 第 1 个：
 * 64 × 1³ = 64M
 *
 * 第 2 个：
 * 64 × 2³ = 512M
 *
 * 第 3 个：
 * 64 × 3³ = 1728M
 *
 * 第 4 个：
 * 64 × 4³ = 4096M
 */
function calculateCost(index) {
  return 64 * Math.pow(index, 3)
}

/**
 * ========================================
 * 最终结果
 * ========================================
 *
 * 注意：
 *
 * 这里不是累计成本。
 *
 * 输入 3：
 * 只显示第 3 个伟人的成本
 *
 * = 1728M
 * = 1.73B
 */
const resultCost = computed(() => {
  return calculateCost(
    displayCount.value
  )
})

/**
 * ========================================
 * 折合资源换算
 * ========================================
 *
 * 把帝国价值（M 为单位）折合成所选资源的数量：
 *
 * 实际帝国价值 = resultCost × 1000000
 * 折合数量     = 实际帝国价值 / 资源单价
 *
 * 例如：1 个伟人 → 64M → 64,000,000 / 10,000,000 (Koti) = 6.4
 */
const selectedResource = ref('Koti')

/**
 * 所选资源单价
 */
const selectedResourcePrice = computed(() => {
  return prices[selectedResource.value] || 0
})

/**
 * 所选资源名称（按语言翻译）
 */
const selectedResourceName = computed(() => {
  return tGame(selectedResource.value)
})

/**
 * 折合数量
 */
const equivalentAmount = computed(() => {
  const price = selectedResourcePrice.value
  if (!price) return 0
  return (resultCost.value * 1000000) / price
})

/**
 * 折合数量格式化：科学计数法（带后缀），不带括号内完整数字
 * （equivalentAmount 已是实际数量，非 M 起步，故用 FULL_SUFFIXES）
 */
function formatEquivalent(value) {
  return formatNumber(value, FULL_SUFFIXES)
}

/**
 * ========================================
 * 当前页开始序号
 * ========================================
 */
const pageStart = computed(() => {
  return (
    (currentPage.value - 1) *
      PAGE_SIZE +
    1
  )
})

/**
 * ========================================
 * 当前页结束序号
 * ========================================
 */
const pageEnd = computed(() => {
  return (
    pageStart.value +
    PAGE_SIZE -
    1
  )
})

/**
 * ========================================
 * 当前页数据
 * ========================================
 *
 * 每次只生成 10 行。
 *
 * 可以无限翻页。
 */
const currentPageItems = computed(() => {
  const start = pageStart.value
  const end = pageEnd.value

  const items = []

  for (
    let index = start;
    index <= end;
    index++
  ) {
    items.push({
      index,
      cost: calculateCost(index)
    })
  }

  return items
})

/**
 * ========================================
 * 上一页
 * ========================================
 */
function previousPage() {
  if (currentPage.value > 1) {
    currentPage.value--
  }
}

/**
 * ========================================
 * 下一页
 * ========================================
 *
 * 没有最大页数限制。
 */
function nextPage() {
  currentPage.value++
}
</script>

<style scoped>
/* =========================================
   Page
========================================= */

.great-people-page {
  width: 100%;
  min-width: 0;

  margin: 0;

  box-sizing: border-box;

  color: #344054;

  font-family:
    -apple-system,
    BlinkMacSystemFont,
    "Segoe UI",
    "Microsoft YaHei",
    sans-serif;
}

/* =========================================
   Header
========================================= */

.page-header {
  width: 100%;
  margin-bottom: 24px;
}

.title-row {
  display: flex;

  align-items: center;

  gap: 10px;

  flex-wrap: wrap;
}

.title-row h1 {
  margin: 0;

  color: #1a2332;

  font-size: 26px;
  line-height: 1.3;

  font-weight: 600;

  letter-spacing: -0.3px;
}

.title-badge {
  display: inline-flex;

  align-items: center;
  justify-content: center;

  height: 24px;

  padding: 0 9px;

  color: #4a90d9;

  background: #f0f5fe;

  border: 1px solid #dce6f2;

  border-radius: 18px;

  font-size: 12px;

  font-weight: 600;
}

.page-description {
  margin: 8px 0 0;

  color: #6b7a8f;

  font-size: 14px;

  line-height: 1.6;
}

/* =========================================
   Calculator
========================================= */

.calculator-card {
  width: 100%;

  margin-bottom: 24px;

  padding: 20px 24px 24px;

  box-sizing: border-box;

  background: #ffffff;

  border: 2px solid #4a90d9;

  border-radius: 16px;

  box-shadow:
    0 4px 20px rgba(74, 144, 217, 0.08);
}

.calculator-header {
  margin-bottom: 20px;
}

.calculator-title {
  color: #1a2332;

  font-size: 17px;

  font-weight: 600;
}

.calculator-description {
  margin-top: 5px;

  color: #6b7a8f;

  font-size: 13px;
}

/* =========================================
   Input
========================================= */

.input-section {
  width: 100%;
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

  transition:
    border-color 180ms ease,
    background 180ms ease,
    box-shadow 180ms ease;
}

.input-group input::placeholder {
  color: #9aabbf;
}

.input-group input:focus {
  background: #ffffff;

  border-color: #4a90d9;

  box-shadow:
    0 0 0 3px rgba(74, 144, 217, 0.1);
}

.input-help {
  margin-top: 7px;

  color: #9aabbf;

  font-size: 12px;
}

/* =========================================
   Result
========================================= */

.result-section {
  margin-top: 22px;

  padding: 18px;

  background: #f7faff;

  border: 1px solid #e8edf4;

  border-radius: 12px;
}

.result-header {
  display: flex;

  align-items: center;

  justify-content: space-between;

  gap: 16px;
}

.result-title {
  color: #1a2332;

  font-size: 15px;

  font-weight: 600;
}

.result-main {
  margin-top: 16px;

  padding-top: 16px;

  border-top: 1px dashed #dce6f2;
}

.result-label {
  margin-bottom: 6px;

  color: #6b7a8f;

  font-size: 12px;
}

.result-value {
  color: #4a90d9;

  font-size: 30px;

  line-height: 1.2;

  font-weight: 600;

  letter-spacing: -0.5px;

  word-break: break-all;
}

/* =========================================
   Equivalent（折合资源）
========================================= */

.result-equivalent {
  display: flex;

  align-items: center;

  justify-content: space-between;

  gap: 16px;

  flex-wrap: wrap;

  margin-top: 16px;

  padding-top: 14px;

  border-top: 1px dashed #dce6f2;
}

.eq-text {
  color: #414a56;

  font-size: 16px;
}

.eq-text .eq-amount {
  color: #1a2332;

  font-weight: 600;
}

.eq-select {
  min-width: 200px;
}

/* =========================================
   Table
========================================= */

.table-card {
  width: 100%;

  min-width: 0;

  overflow: hidden;

  background: #ffffff;

  border: 1px solid #e8edf4;

  border-radius: 14px;
}

.table-header {
  display: flex;

  align-items: center;

  justify-content: space-between;

  gap: 16px;

  padding: 20px;
}

.table-header h2 {
  margin: 0;

  color: #1a2332;

  font-size: 17px;

  font-weight: 600;
}

.table-header p {
  margin: 5px 0 0;

  color: #6b7a8f;

  font-size: 12px;
}

.table-page-info {
  flex-shrink: 0;

  padding: 5px 10px;

  color: #4a90d9;

  background: #f0f5fe;

  border: 1px solid #dce6f2;

  border-radius: 16px;

  font-size: 12px;
}

/* =========================================
   Table Wrapper
========================================= */

.table-wrapper {
  width: 100%;

  min-width: 0;

  overflow-x: auto;
}

table {
  width: 100%;

  min-width: 560px;

  border-collapse: collapse;

  font-size: 13px;
}

thead {
  background: #f5f8fc;
}

th {
  height: 42px;

  padding: 0 18px;

  color: #6b7a8f;

  border-bottom: 1px solid #eef2f6;

  font-size: 12px;

  font-weight: 500;

  text-align: left;

  white-space: nowrap;
}

td {
  height: 46px;

  padding: 0 18px;

  color: #1a2332;

  border-bottom: 1px solid #eef2f6;

  white-space: nowrap;
}

tbody tr {
  transition: background 160ms ease;
}

tbody tr:hover {
  background: #f7faff;
}

tbody tr:last-child td {
  border-bottom: 0;
}

/* =========================================
   Table Columns
========================================= */

.index-column {
  width: 180px;
}

.index-cell {
  color: #1a2332;

  font-weight: 600;

  text-align: center;
}

.formula-cell {
  color: #6b7a8f;
}

.cost-column {
  text-align: right;
}

.cost-cell {
  color: #4a90d9;

  font-size: 13px;

  font-weight: 600;

  text-align: right;
}


/* =========================================
   移动端方块列表
   桌面端隐藏，移动端显示。
========================================= */

.mobile-week-list {
  display: none;
}


.mobile-week-card {
  min-width: 0;

  padding: 12px 14px;

  border: 1px solid #e8edf4;

  border-radius: 10px;

  background: #ffffff;
}


.mobile-week-top {
  display: flex;

  align-items: center;

  justify-content: space-between;

  gap: 10px;

  margin-bottom: 6px;
}


.mobile-week-index {
  color: #1a2332;

  font-size: 13px;

  font-weight: 600;
}


.mobile-week-cost {
  color: #4a90d9;

  font-size: 14px;

  font-weight: 600;

  text-align: right;

  word-break: break-all;
}


.mobile-week-formula {
  color: #6b7a8f;

  font-size: 12px;

  line-height: 1.5;
}


/* =========================================
   Pagination
========================================= */

.pagination {
  display: flex;

  align-items: center;

  justify-content: space-between;

  gap: 16px;

  padding: 14px 18px;

  border-top: 1px solid #eef2f6;
}

.pagination-info {
  color: #9aabbf;

  font-size: 12px;
}

.pagination-controls {
  display: flex;

  align-items: center;

  gap: 6px;
}

.pagination-button {
  height: 34px;

  padding: 0 13px;

  color: #4a90d9;

  background: #ffffff;

  border: 1px solid #dce6f2;

  border-radius: 8px;

  cursor: pointer;

  font-size: 12px;

  transition:
    color 180ms ease,
    background 180ms ease,
    border-color 180ms ease;
}

.pagination-button:hover {
  color: #ffffff;

  background: #4a90d9;

  border-color: #4a90d9;
}

.pagination-button:disabled {
  color: #c4ceda;

  background: #fafcff;

  border-color: #e8edf4;

  cursor: not-allowed;
}

.pagination-button:disabled:hover {
  color: #c4ceda;

  background: #fafcff;

  border-color: #e8edf4;
}

.current-page {
  display: inline-flex;

  align-items: center;

  justify-content: center;

  min-width: 34px;

  height: 34px;

  padding: 0 8px;

  color: #ffffff;

  background: #4a90d9;

  border: 1px solid #4a90d9;

  border-radius: 8px;

  box-sizing: border-box;

  font-size: 12px;

  font-weight: 600;
}

/* =========================================
   Responsive
========================================= */

@media (max-width: 768px) {
  .great-people-page {
    padding: 26px 20px 48px;
  }

  .title-row h1 {
    font-size: 24px;
  }

  .calculator-card {
    padding: 18px;
  }

  .result-value {
    font-size: 26px;
  }

  .table-header {
    padding: 17px;
  }

  .pagination {
    padding: 13px 17px;
  }


  /* 移动端切换为方块展示，隐藏表格 */
  .table-wrapper {
    display: none;
  }


  .mobile-week-list {
    display: grid;

    grid-template-columns: 1fr;

    gap: 10px;

    padding: 0 17px 17px;
  }
}

@media (max-width: 600px) {
  .great-people-page {
    padding: 22px 14px 40px;
  }

  .title-row h1 {
    font-size: 22px;
  }

  .page-description {
    font-size: 13px;
  }

  .calculator-card {
    padding: 15px;

    border-radius: 14px;
  }

  .calculator-title {
    font-size: 16px;
  }

  .result-section {
    padding: 14px;
  }

  .result-value {
    font-size: 24px;
  }

  .table-header {
    align-items: flex-start;

    flex-direction: column;

    padding: 16px 15px;
  }

  .pagination {
    align-items: flex-start;

    flex-direction: column;

    padding: 13px 14px;
  }

  .pagination-controls {
    width: 100%;
  }

  .pagination-button {
    flex: 1;
  }


  .mobile-week-list {
    padding: 0 14px 14px;
  }
}
</style>