import { reactive } from 'vue'
import type { ViewConfig } from '@/types/view'

// In-memory, tab-scoped overrides for a widget's config (a list's filters/
// sort, a panel's color settings) when they're changed in *normal view
// mode*. They exist only so those tweaks survive navigating away and back —
// opening "add item" and pressing back — without being written to
// views.json: a page reload starts each view from its saved config again.
//
// Only config set in template *edit* mode is persisted (see
// ViewRenderer.saveChanges). Keyed viewId -> instanceId -> config, since one
// view can hold several widgets with their own filter rows.
const sessionConfig = reactive<Record<string, Record<string, ViewConfig>>>({})

export function useViewSession() {
  function getConfig(viewId: string, instanceId: string): ViewConfig | undefined {
    return sessionConfig[viewId]?.[instanceId]
  }

  function setConfig(viewId: string, instanceId: string, config: ViewConfig): void {
    // Replace the whole per-view record rather than mutating it in place —
    // a top-level property set on the reactive object always triggers,
    // sidestepping the "freshly created nested container isn't the proxy"
    // reactivity trap.
    sessionConfig[viewId] = { ...sessionConfig[viewId], [instanceId]: config }
  }

  return { getConfig, setConfig }
}
