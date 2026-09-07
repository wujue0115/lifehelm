import { onScopeDispose, ref, toValue, watch, type CSSProperties, type MaybeRefOrGetter } from 'vue'

// Shared placement logic for every "click a trigger, a small floating card
// appears" control in the app (SelectMenu, MultiSelectMenu, TagsInput,
// DatePicker, DateFilter). Each of those used to hardcode `top: rect.bottom
// + 4` — always opening straight down from the trigger, left-aligned — which
// clips off-screen for a trigger near the bottom of the viewport (the date
// field low in the "add item" form) or near its right edge (a filter at the
// end of a toolbar row). This measures the space actually available and:
//
//  - flips the card above the trigger when it doesn't fit below AND there's
//    more room above (never flips into an even tighter space);
//  - shifts it left/right so it never crosses the viewport's edge padding;
//  - re-runs on scroll, window resize, and any size change of the trigger or
//    the card itself (a ResizeObserver on both), so a resize that opens up
//    room below drops a flipped card back down, and vice versa.
//
// The card must be `position: fixed` and Teleported to <body> (so no
// ancestor's `overflow` clips it) — bind the returned `floatingStyles` to it
// and read `placement` if the card needs to know which way it opened.

export type PopoverPlacement = 'top' | 'bottom'

export interface UseAnchoredPopoverOptions {
  // The trigger element the card is positioned against. A template ref, a
  // getter, or a plain element — resolved with `toValue` on every
  // recalculation, so a ref that starts `null` and fills in later is fine.
  anchor: MaybeRefOrGetter<HTMLElement | null | undefined>
  // The floating card itself. Only present in the DOM while open (`v-if`),
  // so this is typically a ref that toggles between the element and `null`.
  popover: MaybeRefOrGetter<HTMLElement | null | undefined>
  // Positioning is active only while this is true; listeners/observers are
  // torn down when it flips false.
  open: MaybeRefOrGetter<boolean>
  // Which horizontal edge of the trigger the card lines up with before any
  // viewport clamping. 'start' = left edges align (default); 'end' = right
  // edges align (DateFilter, whose wide card would push off-screen if
  // left-aligned under a trigger mid-row).
  align?: 'start' | 'end'
  // Gap in px between the trigger and the card along the vertical axis.
  gap?: number
  // Minimum breathing room kept between the card and every viewport edge.
  viewportPadding?: number
  // How the card's width tracks the trigger's: 'min-anchor' sets
  // `min-width` to the trigger width (SelectMenu — the card can still grow
  // wider for long options), 'anchor' pins `width` to it exactly
  // (TagsInput's inline suggestion list), 'auto' leaves width to the card's
  // own CSS (DateFilter).
  width?: 'auto' | 'anchor' | 'min-anchor'
}

function clamp(value: number, min: number, max: number): number {
  // A card taller/wider than the space between the two bounds inverts them;
  // pin the top/left edge (keep the start of the content on-screen) rather
  // than letting `Math.min(max, ...)` win and pushing the top off-screen.
  if (max < min) return min
  return Math.min(Math.max(value, min), max)
}

export function useAnchoredPopover(options: UseAnchoredPopoverOptions) {
  const { align = 'start', gap = 4, viewportPadding = 8, width = 'auto' } = options

  const placement = ref<PopoverPlacement>('bottom')
  const floatingStyles = ref<CSSProperties>({ position: 'fixed', top: '0px', left: '0px' })

  function update(): void {
    const anchorEl = toValue(options.anchor)
    const popoverEl = toValue(options.popover)
    if (!anchorEl || !popoverEl) return

    const anchor = anchorEl.getBoundingClientRect()
    const popover = popoverEl.getBoundingClientRect()
    const viewportWidth = document.documentElement.clientWidth
    const viewportHeight = document.documentElement.clientHeight

    // Vertical: default to opening downward; flip up only when the card
    // doesn't fit in the space below the trigger and the space above is
    // genuinely larger.
    const spaceBelow = viewportHeight - anchor.bottom - gap - viewportPadding
    const spaceAbove = anchor.top - gap - viewportPadding
    const flip = popover.height > spaceBelow && spaceAbove > spaceBelow
    placement.value = flip ? 'top' : 'bottom'

    const top = clamp(
      flip ? anchor.top - gap - popover.height : anchor.bottom + gap,
      viewportPadding,
      viewportHeight - popover.height - viewportPadding,
    )

    // Horizontal: line up with the requested edge, then slide back inside
    // the viewport if that overflows.
    const left = clamp(
      align === 'end' ? anchor.right - popover.width : anchor.left,
      viewportPadding,
      viewportWidth - popover.width - viewportPadding,
    )

    const next: CSSProperties = {
      position: 'fixed',
      top: `${Math.round(top)}px`,
      left: `${Math.round(left)}px`,
    }
    if (width === 'anchor') next.width = `${Math.round(anchor.width)}px`
    else if (width === 'min-anchor') next.minWidth = `${Math.round(anchor.width)}px`
    floatingStyles.value = next
  }

  let anchorObserver: ResizeObserver | undefined
  let popoverObserver: ResizeObserver | undefined

  function start(): void {
    update()
    // Capture-phase scroll so a scroll in any ancestor container (not just
    // the window) keeps the card pinned to its trigger.
    window.addEventListener('scroll', update, true)
    window.addEventListener('resize', update)
    const anchorEl = toValue(options.anchor)
    const popoverEl = toValue(options.popover)
    if (anchorEl) {
      anchorObserver = new ResizeObserver(update)
      anchorObserver.observe(anchorEl)
    }
    if (popoverEl) {
      popoverObserver = new ResizeObserver(update)
      popoverObserver.observe(popoverEl)
    }
  }

  function stop(): void {
    window.removeEventListener('scroll', update, true)
    window.removeEventListener('resize', update)
    anchorObserver?.disconnect()
    anchorObserver = undefined
    popoverObserver?.disconnect()
    popoverObserver = undefined
  }

  // `flush: 'post'` so the card's `v-if` has already rendered it into the
  // DOM by the time `start()` measures it — otherwise the first open would
  // position against a zero-size (or missing) element and never flip. The
  // source also tracks the card element itself, so a card gated on more
  // than `open` (TagsInput hides its list when there are no matches) still
  // gets positioned the moment it appears.
  watch(
    () => toValue(options.open) && toValue(options.popover),
    (active) => {
      stop()
      if (active) start()
    },
    { flush: 'post' },
  )

  onScopeDispose(stop)

  return { floatingStyles, placement }
}
