import { ref, watch } from 'vue'

const WIDTH_STORAGE_KEY = 'lifehelm-sidebar-width'
const COLLAPSED_STORAGE_KEY = 'lifehelm-sidebar-collapsed'

export const SIDEBAR_MIN_WIDTH = 180
export const SIDEBAR_MAX_WIDTH = 400
export const SIDEBAR_DEFAULT_WIDTH = 240
export const SIDEBAR_COLLAPSED_WIDTH = 64

function getInitialWidth(): number {
  const stored = Number(localStorage.getItem(WIDTH_STORAGE_KEY))
  if (stored >= SIDEBAR_MIN_WIDTH && stored <= SIDEBAR_MAX_WIDTH) return stored
  return SIDEBAR_DEFAULT_WIDTH
}

function getInitialCollapsed(): boolean {
  const stored = localStorage.getItem(COLLAPSED_STORAGE_KEY)
  if (stored === 'true') return true
  if (stored === 'false') return false
  return window.matchMedia('(max-width: 1023px)').matches
}

const width = ref(getInitialWidth())
const collapsed = ref(getInitialCollapsed())

watch(width, (value) => {
  localStorage.setItem(WIDTH_STORAGE_KEY, String(value))
})

watch(collapsed, (value) => {
  localStorage.setItem(COLLAPSED_STORAGE_KEY, String(value))
})

export function useSidebar() {
  function toggleCollapsed(): void {
    collapsed.value = !collapsed.value
  }

  function setWidth(value: number): void {
    width.value = Math.min(SIDEBAR_MAX_WIDTH, Math.max(SIDEBAR_MIN_WIDTH, value))
  }

  return { width, collapsed, toggleCollapsed, setWidth }
}
