<template>
  <div class="trade-tile-page">
    <section class="calculator-card">
      <div class="input-grid">
        <div class="input-group">
          <div class="label-with-help">
            <label for="trade-account-level">{{ t('calcTradeTilePoints.accountLevel') }}</label>
            <button type="button" class="help-icon" :aria-label="t('calcTradeTilePoints.helpTitle')" @click="showHelpDialog = true">?</button>
          </div>
          <input id="trade-account-level" :value="accountLevel" type="text" inputmode="numeric" maxlength="1" @input="onAccountInput" @blur="normalizeAccount" />
        </div>
        <div class="input-group">
          <span>{{ t('calcTradeTilePoints.tileValue') }}</span>
          <input id="trade-tile-value" :value="tileValue" type="text" inputmode="decimal" maxlength="5" @input="onTileInput" @blur="normalizeTile" />
        </div>
      </div>
    </section>

    <section class="result-card">
      <div class="result-row"><span>{{ t('calcTradeTilePoints.totalPoints') }}</span><strong>{{ result.valid ? format3(result.total) : dash }}</strong></div>
      <div class="result-row"><span>{{ t('calcTradeTilePoints.usedPoints') }}</span><strong>{{ result.valid ? result.used : dash }}</strong></div>
      <div class="result-row"><span>{{ t('calcTradeTilePoints.availablePoints') }}</span><strong>{{ result.valid ? format3(result.available) : dash }}</strong></div>
      <div class="result-row"><span>{{ t('calcTradeTilePoints.growthLabel') }}</span><strong>{{ t('calcTradeTilePoints.growthDetail', { rate: result.valid ? format3(result.hourlyGain) : '0' }) }}</strong></div>
      <div class="result-row highlight"><span>{{ t('calcTradeTilePoints.estimatedTime') }}</span><strong>{{ result.time }}</strong></div>
    </section>

    <AppDialog v-model="showHelpDialog" :title="t('calcTradeTilePoints.helpTitle')">
      <img :src="tilePointHelpImage" :alt="t('calcTradeTilePoints.helpTitle')" class="help-image" />
    </AppDialog>
  </div>
</template>

<script setup>
import { computed, ref, watch } from 'vue'
import { t, locale } from '@/i18n'
import AppDialog from '@/components/AppDialog.vue'
import tilePointHelpImage from '@/assets/How-to-view-Tile-Point.png'

const STORAGE_KEY = 'cividle-trade-tile-points-inputs'
function loadInputs() {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null') } catch { return null }
}
const storedInputs = loadInputs()
const accountLevel = ref(storedInputs?.accountLevel ?? '5')
const tileValue = ref(storedInputs?.tileValue ?? '3.696')
const dash = '—'
const RATE = 0.005
const showHelpDialog = ref(false)

watch([accountLevel, tileValue], ([accountLevelValue, tileValueValue]) => {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify({ accountLevel: accountLevelValue, tileValue: tileValueValue })) } catch { /* storage unavailable */ }
})

function onAccountInput(event) {
  const digits = event.target.value.replace(/[^0-9]/g, '')
  accountLevel.value = digits ? String(Math.min(5, Math.max(1, Number(digits)))) : ''
  event.target.value = accountLevel.value
}

function normalizeAccount() {
  if (!accountLevel.value) accountLevel.value = '1'
}

function onTileInput(event) {
  let value = event.target.value.replace(/[^0-9.]/g, '')
  const dot = value.indexOf('.')
  if (dot >= 0) value = `${value.slice(0, dot + 1)}${value.slice(dot + 1).replace(/\./g, '').slice(0, 3)}`
  const number = Number.parseFloat(value)
  if (Number.isFinite(number) && number > 5) value = '5'
  tileValue.value = value
  event.target.value = value
}

function normalizeTile() {
  if (!tileValue.value || !Number.isFinite(Number.parseFloat(tileValue.value))) tileValue.value = '0'
}

function format3(value) {
  if (!Number.isFinite(value)) return dash
  return value.toFixed(3).replace(/\.?(0+)$/, '')
}

function formatDateTime(date) {
  const language = locale.value === 'en' ? 'en-US' : undefined
  const options = {
    year: 'numeric', month: locale.value === 'en' ? 'short' : '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false
  }
  return new Intl.DateTimeFormat(language, options).format(date)
}

const result = computed(() => {
  const a = Number.parseFloat(String(accountLevel.value).replace(',', '.'))
  const b = Number.parseFloat(String(tileValue.value).replace(',', '.'))
  if (!Number.isFinite(a) || !Number.isFinite(b)) return { valid: false, time: dash }

  const total = a + b
  const used = Math.floor(total)
  const available = Number((b - Math.floor(b)).toFixed(10))
  const hourlyGain = used * RATE
  let time = dash

  if (available >= 1) {
    time = t('calcTradeTilePoints.alreadyEnough', { time: formatDateTime(new Date()) })
  } else if (hourlyGain <= 0) {
    time = t('calcTradeTilePoints.noGrowth')
  } else {
    const hours = (1 - available) / hourlyGain
    const totalMinutes = Math.max(1, Math.round(hours * 60))
    const wholeHours = Math.floor(totalMinutes / 60)
    const minutes = totalMinutes % 60
    const future = new Date(Date.now() + totalMinutes * 60 * 1000)
    time = t('calcTradeTilePoints.estimatedAt', { time: formatDateTime(future), hours: wholeHours, minutes })
  }
  return { valid: true, total, used, available, hourlyGain, time }
})
</script>

<style scoped>
.trade-tile-page { width: 100%; max-width: 100%; margin: 0; color: #1a2332; }
.calculator-card { width: 100%; margin-bottom: 24px; padding: 20px 24px 24px; box-sizing: border-box; background: #fff; border: 2px solid #4a90d9; border-radius: 16px; box-shadow: 0 4px 20px rgba(74, 144, 217, .08); }
.input-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 16px; }
.input-group { display: flex; flex-direction: column; gap: 6px; font-size: .8rem; font-weight: 500; color: #6b7a8f; }
.input-group label { font-size: 0.8rem; font-weight: 500; color: #6b7a8f; }
.label-with-help { display: inline-flex; align-items: center; gap: 5px; }
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
.help-icon:hover { background: #4a90d9; color: #ffffff; }
.input-group input { display: block; width: 100%; height: 44px; padding: 0 13px; box-sizing: border-box; color: #1a2332; background: #fafcff; border: 1px solid #dce6f2; border-radius: 9px; outline: none; font: inherit; font-size: 15px; transition: border-color 180ms ease, box-shadow 180ms ease; }
.input-group input:focus { background: #fff; border-color: #4a90d9; box-shadow: 0 0 0 3px rgba(74, 144, 217, .1); }
.result-card { width: 100%; padding: 18px 20px 20px; box-sizing: border-box; background: #fff; border: 1px solid #e8edf4; border-radius: 14px; }
.result-row { display: flex; justify-content: space-between; align-items: center; gap: 12px; padding: 10px 0; font-size: 15px; }
.result-row + .result-row { border-top: 1px solid #f3f6fa; }
.result-row span { color: #6b7a8f; }
.result-row strong { color: #1a2332; font-weight: 600; font-variant-numeric: tabular-nums; text-align: right; }
.result-row.highlight strong { color: #2b6cb0; }
.help-image { display: block; max-width: 100%; height: auto; }
@media (max-width: 768px) { .calculator-card { padding: 18px; } }
@media (max-width: 600px) { .input-grid { grid-template-columns: 1fr; gap: 10px; } .result-card { padding: 16px 14px 18px; } .result-row { align-items: flex-start; flex-wrap: wrap; } .result-row strong { margin-left: auto; } }
</style>
