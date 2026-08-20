import { reactive, ref } from 'vue'
import { api } from '@/api/client'
import type { ExportConfig } from '@/types/export-config'

export const DEFAULT_EXPORT_CONFIG: ExportConfig = {
  groupBy: 'status',
  prefixStyle: 'number',
  prefixSuffix: '.',
  titlePrefix: '',
  titleSuffix: '',
  showDate: false,
  dateFormat: 'M/D',
  datePosition: 'after',
  dateSeparator: '-',
}

const config = reactive<ExportConfig>({ ...DEFAULT_EXPORT_CONFIG })
const saveError = ref<string | null>(null)

async function load(): Promise<void> {
  try {
    const fetched = await api.getExportConfig()
    Object.assign(config, fetched)
  } catch {
    // keep defaults if the config file can't be read yet
  }
}

// Unlike useThemeConfig's `update` (applies + persists on every change),
// ExportDialog only calls this from its explicit "Save format" button — the
// dialog's own fields are freely edited beforehand without touching disk.
export function useExportConfig() {
  async function save(next: ExportConfig): Promise<void> {
    Object.assign(config, next)
    saveError.value = null
    try {
      await api.updateExportConfig({ ...config })
    } catch (err) {
      saveError.value = (err as Error).message
    }
  }

  return { config, load, save, saveError }
}
