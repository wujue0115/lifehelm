<script setup lang="ts">
import { ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useTheme } from '@/composables/useTheme'
import { useSidebar, SIDEBAR_COLLAPSED_WIDTH } from '@/composables/useSidebar'
import { useLocale } from '@/composables/useLocale'
import ThemeSettingsPanel from '@/components/ThemeSettingsPanel.vue'

const { t } = useI18n()
const { theme, toggleTheme } = useTheme()
const { width, collapsed, toggleCollapsed, setWidth } = useSidebar()
const { locale, toggleLocale } = useLocale()

const showSettings = ref(false)

function startResize(event: MouseEvent): void {
  if (collapsed.value) return
  const startX = event.clientX
  const startWidth = width.value

  function onMouseMove(moveEvent: MouseEvent): void {
    setWidth(startWidth + (moveEvent.clientX - startX))
  }

  function onMouseUp(): void {
    window.removeEventListener('mousemove', onMouseMove)
    window.removeEventListener('mouseup', onMouseUp)
  }

  window.addEventListener('mousemove', onMouseMove)
  window.addEventListener('mouseup', onMouseUp)
}
</script>

<template>
  <aside
    class="sidebar"
    :class="{ collapsed }"
    :style="{ width: `${collapsed ? SIDEBAR_COLLAPSED_WIDTH : width}px` }"
  >
    <div class="brand">
      <span class="type-section-title brand-name">{{ t('brand') }}</span>
      <button
        type="button"
        class="collapse-toggle"
        :title="collapsed ? t('sidebar.expand') : t('sidebar.collapse')"
        @click="toggleCollapsed"
      >
        <svg
          v-if="collapsed"
          viewBox="0 0 20 20"
          width="16"
          height="16"
          fill="none"
          stroke="currentColor"
          stroke-width="1.6"
          stroke-linecap="round"
          stroke-linejoin="round"
        >
          <polyline points="8 4 14 10 8 16" />
        </svg>
        <svg
          v-else
          viewBox="0 0 20 20"
          width="16"
          height="16"
          fill="none"
          stroke="currentColor"
          stroke-width="1.6"
          stroke-linecap="round"
          stroke-linejoin="round"
        >
          <polyline points="12 4 6 10 12 16" />
        </svg>
      </button>
    </div>

    <nav class="nav">
      <RouterLink to="/" class="nav-item type-nav-item" exact-active-class="active">
        <svg
          class="icon"
          viewBox="0 0 20 20"
          width="18"
          height="18"
          fill="none"
          stroke="currentColor"
          stroke-width="1.6"
          stroke-linecap="round"
        >
          <line x1="3" y1="5" x2="17" y2="5" />
          <line x1="3" y1="10" x2="17" y2="10" />
          <line x1="3" y1="15" x2="17" y2="15" />
        </svg>
        <span class="label">{{ t('nav.list') }}</span>
      </RouterLink>

      <RouterLink to="/board" class="nav-item type-nav-item" active-class="active">
        <svg
          class="icon"
          viewBox="0 0 20 20"
          width="18"
          height="18"
          fill="none"
          stroke="currentColor"
          stroke-width="1.6"
          stroke-linecap="round"
          stroke-linejoin="round"
        >
          <rect x="2.5" y="3.5" width="4" height="13" rx="1" />
          <rect x="8" y="3.5" width="4" height="9" rx="1" />
          <rect x="13.5" y="3.5" width="4" height="11" rx="1" />
        </svg>
        <span class="label">{{ t('nav.board') }}</span>
      </RouterLink>

      <RouterLink to="/calendar" class="nav-item type-nav-item" active-class="active">
        <svg
          class="icon"
          viewBox="0 0 20 20"
          width="18"
          height="18"
          fill="none"
          stroke="currentColor"
          stroke-width="1.6"
          stroke-linecap="round"
          stroke-linejoin="round"
        >
          <rect x="2.5" y="4" width="15" height="13" rx="1.5" />
          <line x1="2.5" y1="8" x2="17.5" y2="8" />
          <line x1="6" y1="2.5" x2="6" y2="5.5" />
          <line x1="14" y1="2.5" x2="14" y2="5.5" />
        </svg>
        <span class="label">{{ t('nav.calendar') }}</span>
      </RouterLink>

      <RouterLink to="/dashboard" class="nav-item type-nav-item" active-class="active">
        <svg
          class="icon"
          viewBox="0 0 20 20"
          width="18"
          height="18"
          fill="none"
          stroke="currentColor"
          stroke-width="1.6"
          stroke-linecap="round"
          stroke-linejoin="round"
        >
          <line x1="4" y1="16" x2="4" y2="10" />
          <line x1="10" y1="16" x2="10" y2="5" />
          <line x1="16" y1="16" x2="16" y2="12" />
        </svg>
        <span class="label">{{ t('nav.dashboard') }}</span>
      </RouterLink>
    </nav>

    <div class="footer-nav">
      <button
        type="button"
        class="nav-item type-nav-item locale-toggle"
        :title="t('locale.switch')"
        @click="toggleLocale"
      >
        <svg
          class="icon"
          viewBox="0 0 20 20"
          width="18"
          height="18"
          fill="none"
          stroke="currentColor"
          stroke-width="1.6"
          stroke-linecap="round"
          stroke-linejoin="round"
        >
          <circle cx="10" cy="10" r="7.5" />
          <path d="M2.5 10h15" />
          <path d="M10 2.5c2.2 2.2 2.2 13 0 15c-2.2-2-2.2-13 0-15z" />
        </svg>
        <span class="label">{{ locale === 'zh-TW' ? 'English' : '繁體中文' }}</span>
      </button>

      <button
        type="button"
        class="nav-item type-nav-item theme-toggle"
        :title="theme === 'dark' ? t('theme.toLight') : t('theme.toDark')"
        @click="toggleTheme"
      >
        <svg
          v-if="theme === 'dark'"
          class="icon"
          viewBox="0 0 20 20"
          width="18"
          height="18"
          fill="none"
          stroke="currentColor"
          stroke-width="1.6"
          stroke-linecap="round"
        >
          <circle cx="10" cy="10" r="3.5" />
          <line x1="10" y1="2" x2="10" y2="4" />
          <line x1="10" y1="16" x2="10" y2="18" />
          <line x1="2" y1="10" x2="4" y2="10" />
          <line x1="16" y1="10" x2="18" y2="10" />
          <line x1="4.2" y1="4.2" x2="5.6" y2="5.6" />
          <line x1="14.4" y1="14.4" x2="15.8" y2="15.8" />
          <line x1="4.2" y1="15.8" x2="5.6" y2="14.4" />
          <line x1="14.4" y1="5.6" x2="15.8" y2="4.2" />
        </svg>
        <svg
          v-else
          class="icon"
          viewBox="0 0 20 20"
          width="18"
          height="18"
          fill="none"
          stroke="currentColor"
          stroke-width="1.6"
          stroke-linecap="round"
          stroke-linejoin="round"
        >
          <path d="M15.5 12.5A6.5 6.5 0 0 1 7.5 4.5a6.5 6.5 0 1 0 8 8z" />
        </svg>
        <span class="label">{{ theme === 'dark' ? t('theme.light') : t('theme.dark') }}</span>
      </button>

      <button
        type="button"
        class="nav-item type-nav-item settings-toggle"
        :title="t('settings.title')"
        @click="showSettings = !showSettings"
      >
        <svg class="icon" width="18" height="18" viewBox="0 0 16 16">
          <path d="M0 0h16v16H0z" fill="none" />
          <path
            fill="currentColor"
            fill-rule="evenodd"
            d="m14.489 8.388l-.001.006a.1.1 0 0 1-.027.028a.43.43 0 0 1-.264.082h-3.186c-3.118 0-4.68 3.77-2.476 5.974a6.5 6.5 0 1 1 5.953-6.09Zm-.292 1.616c.913 0 1.736-.618 1.79-1.529a8 8 0 1 0-7.032 7.468c1.243-.147 1.527-1.639.641-2.525c-1.26-1.26-.367-3.414 1.415-3.414zM10 5a1 1 0 1 1-2 0a1 1 0 0 1 2 0M6 7a1 1 0 1 0 0-2a1 1 0 0 0 0 2m0 2a1 1 0 1 1-2 0a1 1 0 0 1 2 0"
            clip-rule="evenodd"
          />
        </svg>
        <span class="label">{{ t('settings.title') }}</span>
      </button>
      <ThemeSettingsPanel v-if="showSettings" @close="showSettings = false" />
    </div>

    <div
      class="resize-handle"
      :class="{ disabled: collapsed }"
      :title="t('sidebar.resize')"
      @mousedown="startResize"
    ></div>
  </aside>
</template>

<style scoped>
.sidebar {
  flex-shrink: 0;
  background: var(--color-canvas-sidebar);
  color: var(--color-on-sidebar);
  padding: var(--space-md) var(--space-sm);
  position: sticky;
  top: 0;
  height: 100vh;
  display: flex;
  flex-direction: column;
  gap: var(--space-lg);
}

.brand {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--space-xs) var(--space-sm);
}

.brand-name {
  color: var(--color-on-sidebar);
  white-space: nowrap;
  overflow: hidden;
}

.collapse-toggle {
  flex-shrink: 0;
  background: none;
  border: none;
  cursor: pointer;
  color: var(--color-on-sidebar-muted);
  padding: 4px;
  border-radius: var(--rounded-xs);
}

.collapse-toggle:hover {
  background: var(--color-sidebar-hover);
  color: var(--color-on-sidebar);
}

.nav {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.nav-item {
  display: flex;
  align-items: center;
  gap: var(--space-sm);
  padding: var(--space-xs) var(--space-sm);
  border-radius: var(--rounded-sm);
  color: var(--color-on-sidebar-muted);
  text-decoration: none;
  position: relative;
}

.nav-item:hover {
  background: var(--color-sidebar-hover);
}

.nav-item.active {
  background: color-mix(in srgb, var(--color-accent) 16%, var(--color-sidebar-active));
  color: var(--color-on-sidebar);
}

.nav-item.active::before {
  content: '';
  position: absolute;
  left: -12px;
  top: 6px;
  bottom: 6px;
  width: 3px;
  border-radius: var(--rounded-full);
  background: var(--color-accent);
}

.icon {
  flex-shrink: 0;
}

.footer-nav {
  display: flex;
  flex-direction: column;
  gap: 2px;
  margin-top: auto;
}

.locale-toggle,
.theme-toggle,
.settings-toggle {
  background: none;
  border: none;
  width: 100%;
  cursor: pointer;
}

.resize-handle {
  position: absolute;
  top: 0;
  right: -3px;
  bottom: 0;
  width: 6px;
  cursor: ew-resize;
  z-index: 10;
}

.resize-handle::after {
  content: '';
  position: absolute;
  top: 0;
  bottom: 0;
  left: 2.5px;
  width: 1px;
  background: var(--color-border-strong);
}

.resize-handle:hover::after,
.resize-handle:active::after {
  left: 2px;
  width: 2px;
  background: var(--color-ink-secondary);
}

.resize-handle.disabled {
  cursor: default;
}

.resize-handle.disabled::after {
  background: var(--color-border-subtle);
}

.sidebar.collapsed {
  align-items: center;
}

.sidebar.collapsed .brand {
  justify-content: center;
}

.sidebar.collapsed .brand-name,
.sidebar.collapsed .label {
  display: none;
}

.sidebar.collapsed .nav,
.sidebar.collapsed .footer-nav {
  width: 100%;
}

.sidebar.collapsed .nav-item {
  justify-content: center;
}

.sidebar.collapsed .nav-item.active::before {
  left: 0;
}

.sidebar.collapsed .locale-toggle,
.sidebar.collapsed .theme-toggle,
.sidebar.collapsed .settings-toggle {
  display: flex;
  justify-content: center;
}
</style>
