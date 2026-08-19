import { ref } from 'vue'
import zh from './locales/zh'
import en from './locales/en'
import zhGame from './data/zh'

const messages = { zh, en }
const DEFAULT_LOCALE = 'zh'
const STORAGE_KEY = 'cividle-locale'

// 语言对应的 <html lang> 值（让浏览器翻译提示跟随语言按钮）
const HTML_LANG_MAP = { zh: 'zh-CN', en: 'en' }

// 当前语言，初始读取本地存储，默认中文
const locale = ref(localStorage.getItem(STORAGE_KEY) || DEFAULT_LOCALE)

// 同步 <html lang> 属性
function applyHtmlLang() {
  if (typeof document !== 'undefined') {
    document.documentElement.lang = HTML_LANG_MAP[locale.value] || locale.value
  }
}

// 初始化时应用一次，保证刷新后 lang 与当前语言一致
applyHtmlLang()

function setLocale(lang) {
  if (!messages[lang]) return
  locale.value = lang
  localStorage.setItem(STORAGE_KEY, lang)
  applyHtmlLang()
}

function resolvePath(obj, path) {
  return path.split('.').reduce((acc, key) => (acc ? acc[key] : undefined), obj)
}

// 翻译函数：t('a.b.c', { count: 3 })
// 模板中使用时会自动追踪 locale 的响应式依赖
function t(key, params) {
  let str = resolvePath(messages[locale.value] || messages[DEFAULT_LOCALE], key)
  if (str === undefined) {
    str = resolvePath(messages[DEFAULT_LOCALE], key)
  }
  if (str === undefined) return key

  if (params) {
    Object.keys(params).forEach((k) => {
      str = String(str).replace(new RegExp(`\\{${k}\\}`, 'g'), String(params[k]))
    })
  }
  return str
}

// 游戏内翻译：中文使用游戏本地化数据，其它语言保留原键（游戏内英文名）
function tGame(key) {
  if (!key) return key
  if (locale.value !== 'zh') return key
  return zhGame[key] || key
}

export { locale, setLocale, t, tGame }
