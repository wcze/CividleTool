<template>
  <div class="free-city-page">

    <!-- ==================== 查询卡片 ==================== -->
    <section class="calculator-card">

      <div class="calculator-header">
        <div class="calculator-title">
          {{ t('freeCity.title') }}
        </div>

        <div class="calculator-description">
          {{ t('freeCity.description') }}
        </div>
      </div>

      <div class="filter-grid">

        <!-- 国家 -->
        <div class="filter-group">
          <label>
            {{ t('freeCity.countryLabel') }}
          </label>

          <AppSelect
            v-model="selectedCity"
            :options="cityOptions"
            :placeholder="t('freeCity.countryPlaceholder')"
          />
        </div>

        <!-- 时区 -->
        <div class="filter-group">
          <label>
            {{ t('freeCity.timezoneLabel') }}
          </label>

          <AppSelect
            v-model="selectedTimezone"
            :options="timezoneOptions"
            :placeholder="t('freeCity.timezonePlaceholder')"
          />
        </div>

      </div>
    </section>


    <!-- ==================== 选择国家后的 10 次周免 ==================== -->
    <section
      v-if="selectedCity"
      class="section"
    >
      <div class="section-header">

        <div class="section-title-group">
          <h2>
            {{ t('freeCity.sectionTitle', { city: tGame(selectedCity) }) }}
          </h2>

          <p>
            {{ t('freeCity.sectionDesc') }}
          </p>
        </div>

        <span class="section-badge">
          {{ t('freeCity.futureCount') }}
        </span>

      </div>


      <div class="city-result-grid">

        <div
          v-for="(week, index) in selectedCityWeeks"
          :key="`${week.week}-${week.city?.id}`"
          class="city-week-card"
          :class="{
            current: week.isCurrent
          }"
        >

          <!-- 卡片顶部 -->
          <div class="week-card-top">

            <span class="week-number">
              #{{ index + 1 }}
            </span>

            <span
              v-if="week.isCurrent"
              class="current-badge"
            >
              {{ t('freeCity.currentBadge') }}
            </span>

          </div>


          <!-- 国家 -->
          <div class="week-city">
            {{ tGame(week.city.name) }}
          </div>


          <!-- 日期 -->
          <div class="week-date">
            {{ week.startDate }}
          </div>

          <div class="week-separator">
            {{ t('freeCity.to') }}
          </div>

          <div class="week-date end">
            {{ week.endDate }}
          </div>


          <!-- 周期 -->
          <div class="week-duration">
            {{ t('freeCity.days') }}
          </div>

        </div>

      </div>
    </section>


    <!-- ==================== 未来一年 ==================== -->
    <section class="section">

      <div class="section-header">

        <div class="section-title-group">
          <h2>
            {{ t('freeCity.yearlyTitle') }}
          </h2>

          <p>
            {{ t('freeCity.yearlyDesc') }}
          </p>
        </div>

        <span class="section-badge">
          {{ t('freeCity.weeksCount', { count: yearlyWeeks.length }) }}
        </span>

      </div>


      <!-- 表格 -->
      <div class="table-card">

        <div class="table-wrapper">

          <table>

            <thead>
              <tr>

                <th class="index-column">
                  {{ t('freeCity.thIndex') }}
                </th>

                <th>
                  {{ t('freeCity.thCity') }}
                </th>

                <th>
                  {{ t('freeCity.thStart') }}
                </th>

                <th>
                  {{ t('freeCity.thEnd') }}
                </th>

                <th>
                  {{ t('freeCity.thDuration') }}
                </th>

                <th class="status-column">
                  {{ t('freeCity.thStatus') }}
                </th>

              </tr>
            </thead>


            <tbody>

              <tr
                v-for="(week, index) in yearlyWeeks"
                :key="week.startTimestamp"
                :class="{
                  'current-row': week.isCurrent
                }"
              >

                <!-- 序号 -->
                <td class="index-cell">
                  {{ index + 1 }}
                </td>


                <!-- 国家 -->
                <td>
                  <span class="city-name-cell">
                    {{ week.city?.name ? tGame(week.city.name) : '-' }}
                  </span>
                </td>


                <!-- 开始日期 -->
                <td>
                  {{ week.startDate }}
                </td>


                <!-- 结束日期 -->
                <td>
                  {{ week.endDate }}
                </td>


                <!-- 周期 -->
                <td class="duration-cell">
                  {{ t('freeCity.days') }}
                </td>


                <!-- 状态 -->
                <td class="status-cell">

                  <span
                    v-if="week.isCurrent"
                    class="table-current-badge"
                  >
                    {{ t('freeCity.statusCurrent') }}
                  </span>

                  <span
                    v-else
                    class="table-future-badge"
                  >
                    {{ t('freeCity.statusUpcoming') }}
                  </span>

                </td>

              </tr>

            </tbody>

          </table>

        </div>

      </div>


      <!-- 移动端：方块式展示（桌面端隐藏） -->
      <div class="mobile-week-list">

        <div
          v-for="(week, index) in yearlyWeeks"
          :key="`m-${week.startTimestamp}`"
          class="mobile-week-card"
          :class="{
            current: week.isCurrent
          }"
        >

          <div class="mobile-week-top">

            <span class="mobile-week-index">
              #{{ index + 1 }}
            </span>

            <span
              v-if="week.isCurrent"
              class="table-current-badge"
            >
              {{ t('freeCity.statusCurrent') }}
            </span>

            <span
              v-else
              class="table-future-badge"
            >
              {{ t('freeCity.statusUpcoming') }}
            </span>

          </div>


          <div class="mobile-week-city">
            {{ week.city?.name ? tGame(week.city.name) : '-' }}
          </div>


          <div class="mobile-week-row">
            <span class="mobile-week-label">
              {{ t('freeCity.thStart') }}
            </span>

            <span class="mobile-week-value">
              {{ week.startDate }}
            </span>
          </div>


          <div class="mobile-week-row">
            <span class="mobile-week-label">
              {{ t('freeCity.thEnd') }}
            </span>

            <span class="mobile-week-value">
              {{ week.endDate }}
            </span>
          </div>


          <div class="mobile-week-row">
            <span class="mobile-week-label">
              {{ t('freeCity.thDuration') }}
            </span>

            <span class="mobile-week-value">
              {{ t('freeCity.days') }}
            </span>
          </div>

        </div>

      </div>

    </section>


    <!-- ==================== 空状态 ==================== -->
    <section
      v-if="!cities.length"
      class="empty-state"
    >

      <div class="empty-icon">

        <svg
          viewBox="0 0 24 24"
          fill="none"
          aria-hidden="true"
        >
          <circle
            cx="12"
            cy="12"
            r="8"
            stroke="currentColor"
            stroke-width="1.5"
          />

          <path
            d="M12 8V12L14.5 14"
            stroke="currentColor"
            stroke-width="1.5"
            stroke-linecap="round"
            stroke-linejoin="round"
          />
        </svg>

      </div>

      <h3>
        {{ t('freeCity.emptyTitle') }}
      </h3>

      <p>
        {{ t('freeCity.emptyDesc') }}
      </p>

    </section>

  </div>
</template>


<script setup>
import { computed, ref } from 'vue'
import AppSelect from '@/components/AppSelect.vue'
import cityData from '@/data/city.json'
import { t, tGame } from '@/i18n'


/* =========================================================
 * 国家数据
 * ========================================================= */

const cities = computed(() => {
  if (!Array.isArray(cityData)) {
    return []
  }

  return cityData.filter(city => {
    return city && city.name
  })
})


/*
 * 国家下拉选项（value 存原始 name，用于周免匹配；label 用 tGame 翻译）
 */

const cityOptions = computed(() => {
  return cities.value.map(city => ({
    value: city.name,
    label: tGame(city.name)
  }))
})


/* =========================================================
 * 当前选择的国家
 * ========================================================= */

const selectedCity = ref('')


/* =========================================================
 * 自动获取浏览器时区
 *
 * 例如：
 *
 * 中国：
 * Asia/Shanghai
 *
 * 新加坡：
 * Asia/Singapore
 *
 * 波兰：
 * Europe/Warsaw
 * ========================================================= */

const detectedTimezone =
  Intl.DateTimeFormat().resolvedOptions().timeZone ||
  'Asia/Shanghai'


/*
 * 当前使用的时区。
 *
 * 默认就是浏览器自动检测到的时区，
 * 用户可以通过下面的 select 手动修改。
 */

const selectedTimezone = ref(
  detectedTimezone
)


/* =========================================================
 * 时区列表
 * ========================================================= */

const timezones = [

  {
    value: 'UTC',
    key: 'utc'
  },

  {
    value: 'Asia/Shanghai',
    key: 'shanghai'
  },

  {
    value: 'Asia/Singapore',
    key: 'singapore'
  },

  {
    value: 'Asia/Tokyo',
    key: 'tokyo'
  },

  {
    value: 'Asia/Seoul',
    key: 'seoul'
  },

  {
    value: 'Asia/Kolkata',
    key: 'kolkata'
  },

  {
    value: 'Asia/Dubai',
    key: 'dubai'
  },

  {
    value: 'Europe/London',
    key: 'london'
  },

  {
    value: 'Europe/Paris',
    key: 'paris'
  },

  {
    value: 'Europe/Berlin',
    key: 'berlin'
  },

  {
    value: 'Europe/Warsaw',
    key: 'warsaw'
  },

  {
    value: 'America/New_York',
    key: 'newYork'
  },

  {
    value: 'America/Chicago',
    key: 'chicago'
  },

  {
    value: 'America/Denver',
    key: 'denver'
  },

  {
    value: 'America/Los_Angeles',
    key: 'losAngeles'
  },

  {
    value: 'Australia/Sydney',
    key: 'sydney'
  }

]


/*
 * 时区下拉选项（label 通过 i18n 翻译，跟随语言切换）
 */

const timezoneOptions = computed(() => {
  return timezones.map(tz => ({
    value: tz.value,
    label: t(`freeCity.timezones.${tz.key}`)
  }))
})


/* =========================================================
 * 周免计算
 * ========================================================= */

/*
 * 一周的毫秒数
 */

const WEEK =
  7 * 24 * 60 * 60 * 1000


/*
 * 已知：
 *
 * 2026-08-20 = Babylonian
 */

const REFERENCE_DATE =
  '2026-08-20'


/*
 * 你原来的 OFFSET
 *
 * index = (week + OFFSET) % cities.length
 */

const OFFSET = 2


/* =========================================================
 * 根据时间戳计算 Week
 * ========================================================= */

function getWeek(date) {

  return Math.floor(
    date.getTime() / WEEK
  )

}


/* =========================================================
 * 根据 Week 获取国家
 * ========================================================= */

function getCityByWeek(week) {

  if (!cities.value.length) {
    return null
  }


  /*
   * 防止 JS % 在负数情况下产生负数
   */

  const index =
    (
      (week + OFFSET) %
      cities.value.length +
      cities.value.length
    ) %
    cities.value.length


  return cities.value[index] || null

}


/* =========================================================
 * 根据日期获取国家
 * ========================================================= */

function getCityByDate(date) {

  const week =
    getWeek(date)

  return getCityByWeek(week)

}


/* =========================================================
 * 参考日期
 *
 * 保留你原本的基准：
 *
 * 2026-08-20 = Babylonian
 * ========================================================= */

const referenceWeek =
  getWeek(
    new Date(
      `${REFERENCE_DATE}T00:00:00Z`
    )
  )


/* =========================================================
 * 当前 Week
 * ========================================================= */

const currentWeek = computed(() => {

  return getWeek(
    new Date()
  )

})


/* =========================================================
 * 当前周免国家
 * ========================================================= */

const currentCity = computed(() => {

  return getCityByWeek(
    currentWeek.value
  )

})


/* =========================================================
 * 日期格式化
 * ========================================================= */

function formatDate(timestamp) {
  const date = new Date(timestamp)

  return new Intl.DateTimeFormat(
    'zh-CN',
    {
      timeZone: selectedTimezone.value,

      year: 'numeric',
      month: '2-digit',
      day: '2-digit',

      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',

      hour12: false
    }
  ).format(date)
}


/* =========================================================
 * 日期时间格式化
 * ========================================================= */

function formatDateTime(timestamp) {

  const date =
    new Date(timestamp)


  return new Intl.DateTimeFormat(
    'zh-CN',
    {
      timeZone:
        selectedTimezone.value,

      year: 'numeric',

      month: '2-digit',

      day: '2-digit',

      hour: '2-digit',

      minute: '2-digit',

      hour12: false
    }
  ).format(date)

}


/* =========================================================
 * 获取某一个 Week 的完整信息
 * ========================================================= */
function getWeekInfo(week) {

  // 周开始：UTC 周期开始
  const startTimestamp = week * WEEK

  // 周结束：下一周开始前 1 秒
  const endTimestamp =
    startTimestamp + WEEK - 1

  const city = getCityByWeek(week)

  const nowWeek = currentWeek.value

  return {
    week,

    city,

    startTimestamp,
    endTimestamp,

    // 现在会直接显示日期 + 时分秒
    startDate: formatDate(startTimestamp),
    endDate: formatDate(endTimestamp),

    isCurrent: week === nowWeek,
    isFuture: week > nowWeek,
    isPast: week < nowWeek
  }
}


/* =========================================================
 * 选择国家后的未来 10 次周免
 * ========================================================= */

const selectedCityWeeks =
  computed(() => {

    /*
     * 没有选择国家
     */

    if (!selectedCity.value) {
      return []
    }


    const result = []


    /*
     * 从当前周开始查
     */

    let week =
      currentWeek.value


    /*
     * 一直向未来搜索，
     * 直到找到 10 次。
     */

    while (
      result.length < 10
    ) {

      const city =
        getCityByWeek(week)


      if (
        city &&
        city.name ===
        selectedCity.value
      ) {

        result.push(
          getWeekInfo(week)
        )

      }


      week++

    }


    return result

  })


/* =========================================================
 * 未来一年周免表
 * =========================================================
 *
 * 当前周作为第一周
 *
 * 然后：
 *
 * 当前周
 * +1
 * +2
 * ...
 * +51
 *
 * 一共 52 周。
 * ========================================================= */

const yearlyWeeks =
  computed(() => {

    const result = []


    /*
     * 从当前周开始
     */

    const startWeek =
      currentWeek.value


    /*
     * 往后 51 周
     */

    const endWeek =
      currentWeek.value + 51


    for (
      let week = startWeek;
      week <= endWeek;
      week++
    ) {

      result.push(
        getWeekInfo(week)
      )

    }


    return result

  })
</script>


<style scoped>

/* =========================================================
 * 基础
 * ========================================================= */

.free-city-page {
  width: 100%;
  min-height: 100vh;

  background: #ffffff;

  color: #344054;

  font-family:
    -apple-system,
    BlinkMacSystemFont,
    "Segoe UI",
    "Microsoft YaHei",
    sans-serif;

  box-sizing: border-box;
}


.free-city-page *,
.free-city-page *::before,
.free-city-page *::after {
  box-sizing: border-box;
}


/* =========================================================
 * 查询卡片（与其他工具 calculator-card 风格一致）
 * ========================================================= */

.calculator-card {
  width: 100%;

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

  line-height: 1.6;
}

/* =========================================================
 * 查询 Grid
 * ========================================================= */

.filter-grid {
  display: grid;

  grid-template-columns:
    repeat(2, minmax(0, 1fr));

  gap: 18px;
}


/* =========================================================
 * Field
 * ========================================================= */

.filter-group {
  min-width: 0;
}


.filter-group label {
  display: block;

  margin-bottom: 8px;

  color: #6b7a8f;

  font-size: 13px;

  line-height: 1.4;

  font-weight: 500;
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
  margin:
    5px 0 0;

  color: #6b7a8f;

  font-size: 13px;

  line-height: 1.6;
}


.section-badge {
  flex-shrink: 0;

  display: inline-flex;

  align-items: center;

  height: 28px;

  padding:
    0 10px;

  border:
    1px solid #dce6f2;

  border-radius: 999px;

  background: #f7faff;

  color: #6b7a8f;

  font-size: 12px;

  font-weight: 500;
}


/* =========================================================
 * 国家周免 Grid
 * ========================================================= */

.city-result-grid {
  display: grid;

  grid-template-columns:
    repeat(
      auto-fill,
      minmax(220px, 1fr)
    );

  gap: 14px;
}


/* =========================================================
 * 国家周免 Card
 * ========================================================= */

.city-week-card {
  min-width: 0;

  padding: 17px;

  border:
    1px solid #e8edf4;

  border-radius: 12px;

  background: #ffffff;

  transition:
    border-color 180ms ease,
    box-shadow 180ms ease,
    transform 180ms ease;
}


.city-week-card:hover {
  border-color: #4a90d9;

  box-shadow:
    0 4px 16px
    rgba(74, 144, 217, 0.08);

  transform:
    translateY(-2px);
}


.city-week-card.current {
  border-color: #4a90d9;

  background: #f7faff;

  box-shadow:
    0 4px 16px
    rgba(74, 144, 217, 0.08);
}


/* =========================================================
 * 周免 Card 顶部
 * ========================================================= */

.week-card-top {
  display: flex;

  align-items: center;

  justify-content: space-between;

  gap: 8px;

  margin-bottom: 14px;
}


.week-number {
  color: #9aabbf;

  font-size: 12px;

  font-weight: 500;
}


.current-badge {
  display: inline-flex;

  align-items: center;

  height: 22px;

  padding:
    0 8px;

  border:
    1px solid #dce6f2;

  border-radius: 999px;

  background: #f0f5fe;

  color: #4a90d9;

  font-size: 11px;

  font-weight: 600;
}


/* =========================================================
 * 国家名称
 * ========================================================= */

.week-city {
  margin-bottom: 12px;

  overflow: hidden;

  color: #1a2332;

  font-size: 16px;

  line-height: 1.4;

  font-weight: 600;

  text-overflow: ellipsis;

  white-space: nowrap;
}


/* =========================================================
 * 日期
 * ========================================================= */

.week-date {
  color: #4a90d9;

  font-size: 14px;

  line-height: 1.6;

  font-weight: 600;
}


.week-date.end {
  color: #344054;

  font-weight: 500;
}


.week-separator {
  margin:
    2px 0;

  color: #9aabbf;

  font-size: 12px;
}


/* =========================================================
 * 周期
 * ========================================================= */

.week-duration {
  margin-top: 12px;

  padding-top: 10px;

  border-top:
    1px dashed #dce6f2;

  color: #9aabbf;

  font-size: 12px;
}


/* =========================================================
 * Table Card
 * ========================================================= */

.table-card {
  width: 100%;

  overflow: hidden;

  border:
    1px solid #e8edf4;

  border-radius: 12px;

  background: #ffffff;
}


.table-wrapper {
  width: 100%;

  overflow-x: auto;

  -webkit-overflow-scrolling: touch;
}


/* =========================================================
 * Table
 * ========================================================= */

table {
  width: 100%;

  min-width: 760px;

  border-collapse: collapse;

  font-size: 13px;
}


thead {
  background: #f5f8fc;
}


th {
  height: 44px;

  padding:
    0 16px;

  border-bottom:
    1px solid #eef2f6;

  color: #6b7a8f;

  font-size: 12px;

  line-height: 1.4;

  font-weight: 600;

  text-align: left;

  white-space: nowrap;
}


td {
  height: 50px;

  padding:
    0 16px;

  border-bottom:
    1px solid #eef2f6;

  color: #1a2332;

  white-space: nowrap;
}


tbody tr {
  transition:
    background 150ms ease;
}


tbody tr:hover {
  background: #f7faff;
}


tbody tr:last-child td {
  border-bottom: none;
}


/* =========================================================
 * Table Columns
 * ========================================================= */

.index-column {
  width: 70px;

  text-align: center;
}


.index-cell {
  color: #9aabbf;

  text-align: center;
}


.city-name-cell {
  color: #1a2332;

  font-weight: 600;
}


.duration-cell {
  color: #6b7a8f;
}


.status-column {
  width: 110px;
}


.status-cell {
  text-align: left;
}


/* =========================================================
 * 当前周
 * ========================================================= */

.current-row {
  background: #f7faff;
}


/* =========================================================
 * Table 状态
 * ========================================================= */

.table-current-badge,
.table-future-badge {
  display: inline-flex;

  align-items: center;

  height: 24px;

  padding:
    0 9px;

  border-radius: 999px;

  font-size: 11px;

  font-weight: 600;
}


.table-current-badge {
  border:
    1px solid #cfe6fa;

  background: #eef7ff;

  color: #4a90d9;
}


.table-future-badge {
  border:
    1px solid #dce6f2;

  background: #f5f8fc;

  color: #6b7a8f;
}


/* =========================================================
 * 移动端方块列表
 *
 * 桌面端隐藏，移动端显示。
 * 避免表格左右滑动，改为卡片式排版。
 * ========================================================= */

.mobile-week-list {
  display: none;
}


/* =========================================================
 * 移动端方块 Card
 * ========================================================= */

.mobile-week-card {
  min-width: 0;

  padding: 15px;

  border:
    1px solid #e8edf4;

  border-radius: 12px;

  background: #ffffff;
}


.mobile-week-card.current {
  border-color: #4a90d9;

  background: #f7faff;
}


.mobile-week-top {
  display: flex;

  align-items: center;

  justify-content: space-between;

  gap: 8px;

  margin-bottom: 10px;
}


.mobile-week-index {
  color: #9aabbf;

  font-size: 12px;

  font-weight: 500;
}


.mobile-week-city {
  margin-bottom: 10px;

  overflow: hidden;

  color: #1a2332;

  font-size: 15px;

  line-height: 1.4;

  font-weight: 600;

  text-overflow: ellipsis;

  white-space: nowrap;
}


.mobile-week-row {
  display: flex;

  align-items: center;

  justify-content: space-between;

  gap: 10px;

  padding: 4px 0;
}


.mobile-week-label {
  flex-shrink: 0;

  color: #9aabbf;

  font-size: 12px;
}


.mobile-week-value {
  min-width: 0;

  overflow: hidden;

  color: #344054;

  font-size: 12px;

  text-align: right;

  text-overflow: ellipsis;

  white-space: nowrap;
}


/* =========================================================
 * Empty State
 * ========================================================= */

.empty-state {
  display: flex;

  align-items: center;

  justify-content: center;

  flex-direction: column;

  min-height: 300px;

  margin-top: 28px;

  text-align: center;
}


.empty-icon {
  display: flex;

  align-items: center;

  justify-content: center;

  width: 44px;

  height: 44px;

  margin-bottom: 14px;

  border:
    1px solid #e8edf4;

  border-radius: 10px;

  background: #f7faff;

  color: #9aabbf;
}


.empty-icon svg {
  width: 22px;

  height: 22px;
}


.empty-state h3 {
  margin: 0;

  color: #344054;

  font-size: 15px;

  font-weight: 600;
}


.empty-state p {
  margin:
    6px 0 0;

  color: #9aabbf;

  font-size: 13px;
}


/* =========================================================
 * 992px
 * ========================================================= */

@media (max-width: 992px) {

  .city-result-grid {
    grid-template-columns:
      repeat(
        auto-fill,
        minmax(210px, 1fr)
      );
  }

}


/* =========================================================
 * 768px
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


  .city-result-grid {
    grid-template-columns:
      repeat(
        2,
        minmax(0, 1fr)
      );
  }


  /* 移动端切换为方块展示，隐藏表格 */
  .table-card {
    display: none;
  }


  .mobile-week-list {
    display: grid;

    grid-template-columns:
      repeat(
        2,
        minmax(0, 1fr)
      );

    gap: 14px;
  }

}


/* =========================================================
 * 600px
 * ========================================================= */

@media (max-width: 600px) {

  .calculator-card {
    padding: 16px 14px;

    border-radius: 12px;
  }


  .filter-grid {
    grid-template-columns: 1fr;

    gap: 14px;
  }


  .section-header h2 {
    font-size: 17px;
  }


  .city-result-grid {
    grid-template-columns: 1fr;
  }


  .city-week-card {
    padding: 15px;
  }


  /* 小屏下方块改单列 */
  .mobile-week-list {
    grid-template-columns: 1fr;
  }


  .table-card {
    border-radius: 10px;
  }


  .empty-state {
    min-height: 240px;
  }

}


/* =========================================================
 * 减少动画
 * ========================================================= */

@media (prefers-reduced-motion: reduce) {

  .city-week-card,
  tbody tr {
    transition: none;
  }

}

</style>