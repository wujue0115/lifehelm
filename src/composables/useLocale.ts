import { watch } from 'vue'
import { i18n } from '@/i18n'

const STORAGE_KEY = 'lifehelm-locale'

watch(i18n.global.locale, (value) => {
  localStorage.setItem(STORAGE_KEY, value)
})

export function useLocale() {
  const locale = i18n.global.locale

  function toggleLocale(): void {
    locale.value = locale.value === 'zh-TW' ? 'en' : 'zh-TW'
  }

  return { locale, toggleLocale }
}
