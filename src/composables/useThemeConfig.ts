import { reactive, ref } from 'vue'
import { api } from '@/api/client'
import { DEFAULT_THEME_CONFIG, FONT_OPTIONS } from '@/config/themePresets'
import type { ThemeConfig } from '@/types/theme-config'

const config = reactive<ThemeConfig>({ ...DEFAULT_THEME_CONFIG })
const saveError = ref<string | null>(null)

function fontStack(fontId: string): string {
  return FONT_OPTIONS.find((option) => option.id === fontId)?.stack ?? FONT_OPTIONS[0]!.stack
}

function applyToDocument(value: ThemeConfig): void {
  const root = document.documentElement.style
  if (value.accentColor) {
    root.setProperty('--color-accent', value.accentColor)
    root.setProperty('--color-accent-contrast', '#ffffff')
  } else {
    root.removeProperty('--color-accent')
    root.removeProperty('--color-accent-contrast')
  }
  root.setProperty('--font-sans', fontStack(value.fontId))
  root.setProperty('--radius-scale', String(value.radiusScale))
  root.setProperty('--space-scale', String(value.spacingScale))
}

applyToDocument(config)

async function load(): Promise<void> {
  try {
    const fetched = await api.getThemeConfig()
    Object.assign(config, fetched)
    applyToDocument(config)
  } catch {
    // keep defaults if the config file can't be read yet
  }
}

export function useThemeConfig() {
  function update(patch: Partial<ThemeConfig>): void {
    Object.assign(config, patch)
    applyToDocument(config)
    saveError.value = null
    api
      .updateThemeConfig({ ...config })
      .catch((err: Error) => {
        saveError.value = err.message
      })
  }

  return { config, load, update, saveError }
}
