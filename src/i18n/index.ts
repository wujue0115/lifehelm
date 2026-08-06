import { createI18n } from 'vue-i18n'
import zhTW from './locales/zh-TW'
import en from './locales/en'

const STORAGE_KEY = 'work-manager-locale'

function getInitialLocale(): 'en' | 'zh-TW' {
  const stored = localStorage.getItem(STORAGE_KEY)
  if (stored === 'en' || stored === 'zh-TW') return stored
  return navigator.language.toLowerCase().startsWith('zh') ? 'zh-TW' : 'en'
}

export const i18n = createI18n({
  legacy: false,
  globalInjection: true,
  locale: getInitialLocale(),
  fallbackLocale: 'en',
  messages: {
    'zh-TW': zhTW,
    en,
  },
})
