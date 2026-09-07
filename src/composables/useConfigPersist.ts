import { onBeforeUnmount } from 'vue'
import type { ViewConfig } from '@/types/view'

// The List/Board/Calendar widgets debounce their filter/sort/color changes
// before emitting `update:config` upward, so a burst of edits (dragging a
// color slider, retyping a search) settles into one write rather than
// dozens. Crucially the pending write is also flushed on unmount: a filter
// changed right before navigating away — opening "add item" and pressing
// back — would otherwise be lost with the cleared timer, and the view would
// look like it reset the filter on its own.
//
// `buildConfig` is called when the debounce actually fires (or is flushed),
// not when it's scheduled, so the newest values always win.
export function useConfigPersist(emitConfig: (config: ViewConfig) => void, delay = 400) {
  let timer: ReturnType<typeof setTimeout> | undefined
  let pending: (() => void) | undefined

  function schedule(buildConfig: () => ViewConfig): void {
    pending = () => {
      pending = undefined
      emitConfig(buildConfig())
    }
    clearTimeout(timer)
    timer = setTimeout(() => pending?.(), delay)
  }

  function flush(): void {
    clearTimeout(timer)
    pending?.()
  }

  onBeforeUnmount(flush)

  return { schedule, flush }
}
