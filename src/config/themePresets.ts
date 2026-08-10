import type { ThemeConfig } from '@/types/theme-config'

export interface FontOption {
  id: string
  stack: string
}

export const FONT_OPTIONS: FontOption[] = [
  {
    id: 'default',
    stack:
      "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, 'PingFang TC', 'Microsoft JhengHei', 'Noto Sans TC', sans-serif",
  },
  {
    id: 'rounded',
    stack:
      "ui-rounded, 'Hiragino Maru Gothic ProN', 'PingFang TC', 'Microsoft JhengHei', 'Segoe UI', sans-serif",
  },
  {
    id: 'serif',
    stack: "'Noto Serif TC', 'PMingLiU', Georgia, 'Times New Roman', serif",
  },
  {
    id: 'mono',
    stack: "'SFMono-Regular', Menlo, Consolas, 'Noto Sans Mono TC', monospace",
  },
]

export const ACCENT_SWATCHES: string[] = [
  '#4f46e5',
  '#2563eb',
  '#0891b2',
  '#059669',
  '#65a30d',
  '#d97706',
  '#dc2626',
  '#e11d48',
  '#7c3aed',
]

export interface ThemePreset {
  id: string
  config: ThemeConfig
}

export const PRESETS: ThemePreset[] = [
  {
    id: 'default',
    config: { accentColor: null, fontId: 'default', radiusScale: 1, spacingScale: 1 },
  },
  {
    id: 'indigo',
    config: { accentColor: '#4f46e5', fontId: 'default', radiusScale: 1, spacingScale: 1 },
  },
  {
    id: 'amber',
    config: { accentColor: '#d97706', fontId: 'rounded', radiusScale: 1.6, spacingScale: 1.15 },
  },
  {
    id: 'emerald',
    config: { accentColor: '#059669', fontId: 'default', radiusScale: 0.4, spacingScale: 0.85 },
  },
  {
    id: 'rose',
    config: { accentColor: '#e11d48', fontId: 'serif', radiusScale: 1, spacingScale: 1 },
  },
]

export const RADIUS_OPTIONS = [
  { value: 0.4, id: 'sharp' },
  { value: 1, id: 'default' },
  { value: 1.6, id: 'round' },
]

export const SPACING_OPTIONS = [
  { value: 0.85, id: 'compact' },
  { value: 1, id: 'default' },
  { value: 1.15, id: 'comfortable' },
]

export const DEFAULT_THEME_CONFIG: ThemeConfig = PRESETS[0]!.config

export function findMatchingPresetId(config: ThemeConfig): string | null {
  const match = PRESETS.find(
    (preset) =>
      preset.config.accentColor === config.accentColor &&
      preset.config.fontId === config.fontId &&
      preset.config.radiusScale === config.radiusScale &&
      preset.config.spacingScale === config.spacingScale,
  )
  return match?.id ?? null
}
