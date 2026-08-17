---
version: beta
name: Admin-Dashboard-System
description: A functional back-office admin dashboard system — fixed left sidebar navigation, dense information-first layouts, flat bordered cards and tables, and a strictly monochrome grayscale palette by default. Hierarchy comes from typographic weight, size, and grayscale contrast, not photography. A single user-configurable accent color exists as an explicit opt-in (see "Accent (user-configurable)"), off by default so a fresh install is pure grayscale. Text is primarily Traditional Chinese, so the system deliberately avoids uppercase display type and wide letter-spacing (both are Latin-only conventions with no visual effect on CJK glyphs).

colors:
  ink: '#09090b'
  ink-secondary: '#52525b'
  ink-muted: '#a1a1aa'
  canvas-app: '#f4f4f5'
  canvas-surface: '#ffffff'
  canvas-sidebar: '#ffffff'
  on-sidebar: '#09090b'
  on-sidebar-muted: '#52525b'
  sidebar-hover: '#ececef'
  sidebar-active: '#e4e4e7'
  border-subtle: '#e4e4e7'
  border-strong: '#d4d4d8'
  surface-hover: '#ececef'
  accent: '{colors.ink}' # user-configurable override, see "Accent (user-configurable)"
  accent-contrast: '{colors.canvas-surface}'
  danger: '#dc2626' # see "Danger (destructive actions)" — delete icons only, not a general accent

tag-palette:
  red: '#ef4444'
  orange: '#f97316'
  amber: '#eab308'
  green: '#22c55e'
  teal: '#14b8a6'
  blue: '#3b82f6'
  purple: '#a855f7'
  pink: '#ec4899'

colors-dark:
  ink: '#f4f4f5'
  ink-secondary: '#a1a1aa'
  ink-muted: '#71717a'
  canvas-app: '#0a0a0b'
  canvas-surface: '#18181b'
  canvas-sidebar: '#18181b'
  on-sidebar: '#f4f4f5'
  on-sidebar-muted: '#a1a1aa'
  sidebar-hover: '#1f1f23'
  sidebar-active: '#27272a'
  border-subtle: '#27272a'
  border-strong: '#3f3f46'
  surface-hover: '#1f1f23'
  accent: '{colors.ink}'
  accent-contrast: '{colors.canvas-surface}'
  danger: '#f87171'

fonts:
  sans: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, 'PingFang TC', 'Microsoft JhengHei', 'Noto Sans TC', sans-serif"

typography:
  page-title:
    fontFamily: '{fonts.sans}'
    fontSize: 24px
    fontWeight: 700
    lineHeight: 1.3
    letterSpacing: 0
  section-title:
    fontFamily: '{fonts.sans}'
    fontSize: 15px
    fontWeight: 700
    lineHeight: 1.4
    letterSpacing: 0
  body:
    fontFamily: '{fonts.sans}'
    fontSize: 14px
    fontWeight: 400
    lineHeight: 1.6
    letterSpacing: 0
  body-sm:
    fontFamily: '{fonts.sans}'
    fontSize: 13px
    fontWeight: 400
    lineHeight: 1.5
    letterSpacing: 0
  caption:
    fontFamily: '{fonts.sans}'
    fontSize: 12px
    fontWeight: 400
    lineHeight: 1.4
    letterSpacing: 0
  label:
    fontFamily: '{fonts.sans}'
    fontSize: 11px
    fontWeight: 600
    lineHeight: 1.3
    letterSpacing: 0.2px
  nav-item:
    fontFamily: '{fonts.sans}'
    fontSize: 14px
    fontWeight: 500
    lineHeight: 1.4
    letterSpacing: 0

rounded:
  xs: 4px
  sm: 6px
  md: 10px
  lg: 14px
  full: 9999px

spacing:
  xxs: 4px
  xs: 8px
  sm: 12px
  md: 16px
  lg: 18px
  xl: 24px
  xxl: 32px
  huge: 48px

components:
  sidebar:
    backgroundColor: '{colors.canvas-sidebar}'
    textColor: '{colors.on-sidebar}'
    width: 240px
    padding: 16px 12px
  sidebar-nav-item:
    backgroundColor: 'transparent'
    textColor: '{colors.on-sidebar-muted}'
    typography: '{typography.nav-item}'
    rounded: '{rounded.sm}'
    padding: 8px 12px
  topbar:
    backgroundColor: '{colors.canvas-surface}'
    textColor: '{colors.ink}'
    typography: '{typography.page-title}'
    padding: 0px 24px
  btn-primary:
    backgroundColor: '{colors.ink}'
    textColor: '{colors.canvas-surface}'
    typography: '{typography.body-sm}'
    rounded: '{rounded.sm}'
    padding: 8px 16px
  btn-secondary:
    backgroundColor: '{colors.canvas-surface}'
    textColor: '{colors.ink}'
    typography: '{typography.body-sm}'
    rounded: '{rounded.sm}'
    padding: 8px 16px
  btn-ghost:
    backgroundColor: 'transparent'
    textColor: '{colors.ink-secondary}'
    typography: '{typography.body-sm}'
    rounded: '{rounded.sm}'
    padding: 8px 16px
  text-input:
    backgroundColor: '{colors.canvas-surface}'
    textColor: '{colors.ink}'
    typography: '{typography.body}'
    rounded: '{rounded.xs}'
    padding: 8px 12px
  date-picker-trigger:
    # Same visual spec as text-input — a button styled to read as a field,
    # not a text box you type into.
    backgroundColor: '{colors.canvas-surface}'
    textColor: '{colors.ink}'
    typography: '{typography.body}'
    rounded: '{rounded.xs}'
    padding: 8px 12px
  date-picker-popover:
    backgroundColor: '{colors.canvas-surface}'
    textColor: '{colors.ink}'
    typography: '{typography.body-sm}'
    rounded: '{rounded.md}'
    padding: 12px
  card:
    backgroundColor: '{colors.canvas-surface}'
    textColor: '{colors.ink}'
    typography: '{typography.body}'
    rounded: '{rounded.md}'
    padding: 16px
  data-table:
    backgroundColor: '{colors.canvas-surface}'
    textColor: '{colors.ink}'
    typography: '{typography.body-sm}'
    rounded: '{rounded.md}'
    padding: 0px
  status-badge:
    backgroundColor: '{colors.canvas-surface}'
    textColor: '{colors.ink}'
    typography: '{typography.label}'
    rounded: '{rounded.full}'
    padding: 2px 10px
  status-badge-colored:
    backgroundColor: 'color-mix(in srgb, {tag-color} 16%, {colors.canvas-surface})'
    borderColor: 'color-mix(in srgb, {tag-color} 55%, {colors.border-strong})'
    textColor: '{colors.ink}'
    typography: '{typography.label}'
    rounded: '{rounded.full}'
    padding: 2px 10px
---

## Overview

This is a functional back-office admin dashboard, not a marketing site: the job is to let one person scan, filter, and edit a list of work items as fast as possible. There is no hero imagery, no full-bleed photography, no single-CTA-per-band composition. Instead the system borrows the layout grammar of tools like Linear, Vercel's dashboard, and classic admin templates — a fixed dark sidebar for wayfinding, a light content canvas for data, flat 1px-bordered cards and tables for structure, and typographic weight/size (not color) for hierarchy.

The palette's base state is strictly monochrome — black, white, and a grayscale ramp in between — the same "no accent color" discipline as before, just repurposed: grayscale does the job that used to belong to photography, building surface hierarchy (`{colors.canvas-app}` page background vs `{colors.canvas-surface}` card/table white) and interactive state (`{colors.surface-hover}`, `{colors.sidebar-hover}`) instead of chromatic branding. This is the _system default_ a fresh install ships with; see "Accent (user-configurable)" below for the opt-in theming layer that lets a user override it.

**Why no uppercase / wide tracking:** the previous iteration of this system used uppercase D-DIN-Bold with positive letter-spacing as its typographic signature. That convention is Latin-script-only — `text-transform: uppercase` has no effect on Chinese characters, and wide positive letter-spacing between CJK glyphs reads as broken, not premium. Since this app's UI text is primarily Traditional Chinese, the system now defaults every tier to normal case and zero-to-minimal letter-spacing, reserving weight and size as the only signals.

**Key Characteristics:**

- Fixed 240px dark left sidebar (`{colors.canvas-sidebar}`) for navigation; everything else lives in a light content column.
- Strictly monochrome grayscale by default — no brand accent color baked into the base system, same discipline as the previous iteration, now expressed as tonal steps instead of photography. A user-configurable accent color exists as an opt-in override (see "Accent (user-configurable)" under Colors) but ships off.
- Normal-case typography throughout — no forced uppercase, no wide letter-spacing (CJK-appropriate).
- Small-radius rectangular buttons (`{rounded.sm}` 6px) for actions; full-pill radius (`{rounded.full}`) reserved for status badges/chips, not buttons.
- Flat 1px-bordered cards and tables — no shadows, no blurs, no gradients. Depth is a border and a shade of gray, never elevation.
- Dense spacing — 14px default body text, 36px control height, built for scanning rows of data, not for a single hero message.

## Colors

### Surface

- **Canvas App** (`{colors.canvas-app}` — `#f4f4f5`): The page background behind cards/tables — a barely-off-white that separates content blocks from their container without a border.
- **Canvas Surface** (`{colors.canvas-surface}` — `#ffffff`): Card, table, topbar, and form panel background. Pure white, always paired with a `{colors.border-subtle}` or `{colors.border-strong}` border since there's no shadow to separate it from `{colors.canvas-app}`.
- **Canvas Sidebar** (`{colors.canvas-sidebar}` — `#0a0a0a`): The one dark surface in the system — the fixed left navigation rail.
- **Sidebar Hover / Active** (`{colors.sidebar-hover}` — `#18181b`, `{colors.sidebar-active}` — `#27272a`): Two tonal steps up from the sidebar canvas for hover and selected nav items — never a color change, just lightness.
- **Surface Hover** (`{colors.surface-hover}` — `#ececef`): Table row / menu item hover on light surfaces.
- **Border Subtle** (`{colors.border-subtle}` — `#e4e4e7`): Default 1px border on cards and table row dividers.
- **Border Strong** (`{colors.border-strong}` — `#d4d4d8`): Table header underline, input borders — anywhere a border needs to read slightly more structural.

### Text

- **Ink** (`{colors.ink}` — `#09090b`): Primary text on light surfaces (near-black, not pure black — softer on dense text).
- **Ink Secondary** (`{colors.ink-secondary}` — `#52525b`): Secondary text — labels, metadata, table header text.
- **Ink Muted** (`{colors.ink-muted}` — `#a1a1aa`): Placeholder, disabled, and lowest-priority text.
- **On Sidebar** (`{colors.on-sidebar}` — `#ffffff`): Active nav item text on the dark sidebar.
- **On Sidebar Muted** (`{colors.on-sidebar-muted}` — `#a1a1aa`): Inactive nav item text.

### Dark Mode

The system ships both a light palette (`colors:`) and a dark palette (`colors-dark:`) in the frontmatter, and **every** surface token flips between them, sidebar included — `ink`/`ink-secondary`/`ink-muted`, `canvas-app`/`canvas-surface`, `canvas-sidebar`/`on-sidebar`/`on-sidebar-muted`/`sidebar-hover`/`sidebar-active`, `border-subtle`/`border-strong`, and `surface-hover`. The sidebar always takes the same value as `canvas-surface` in whichever mode is active (white in light mode, `#18181b` in dark mode) — it's a "surface," not a permanently-dark brand element, so it needs to contrast against `canvas-app` in both modes rather than going muddy (in dark mode, a permanently-`#0a0a0a` sidebar next to a `#0a0a0b` page background would be visually indistinguishable). In code this is implemented as CSS custom properties overridden under a `:root[data-theme="dark"]` selector (`src/assets/design-tokens.css`), toggled by `useTheme()` (`src/composables/useTheme.ts`), which persists the explicit choice to `localStorage` and otherwise defaults to the OS `prefers-color-scheme`. Components never branch on theme in script — they just reference the same `var(--color-*)` custom properties in both modes.

### Accent (user-configurable)

The base system ships with no brand accent color, but the app exposes a user-facing "tweak" panel (`src/components/ThemeSettingsPanel.vue`, opened from a trigger in the sidebar) that lets a person opt into one, along with font, corner radius, and spacing adjustments — plus a handful of built-in presets bundling all four together (`src/config/themePresets.ts`). This is a per-installation preference, not a redesign of the component specs below: every spec in this document (buttons, badges, cards) still describes the grayscale default, and accenting only touches the places explicitly wired to `{colors.accent}`/`{colors.accent-contrast}`. Everything else (cards, tables, borders, secondary/ghost buttons) stays grayscale regardless of the chosen accent, so the monochrome discipline still governs structure. Status/priority/tag color-coding is a separate, narrower mechanism — see "Status/Priority/Tag Color (opt-in, global + per-view override)" below — and the two are never mixed: `{colors.accent}` never colors a badge, and `{tag-palette.*}` never colors a button.

**The rule for whether something reaches for `{colors.accent}`**: accent marks the single primary action, the current location, or a live/in-progress selection — never a static committed value, and never charts or status (that's `{tag-palette.*}`'s job). Concretely, three shapes:

1. **The one primary action in a given context** — `btn-primary` (background/text), and `SwitchToggle`'s "on" state (background/border) — both are literally "the thing accent marks as the primary/active choice here."
2. **Current location / the thing currently selected in a set of peers** — the sidebar's active-nav-item (left-edge indicator bar + a 16% tint mixed into `{colors.sidebar-active}`), `ThemeSettingsPanel`'s own preset-chip/radius-segment/spacing-segment "active" border, and `SelectMenu`'s selected option (solid fill) — all mark "which one of these several equivalent options is in effect right now," a list of interchangeable peers rather than a point picked on a timeline.
3. **A selection still in progress, not yet committed** — `DatePicker`'s range mode (solid start/end caps, 16% tint in-range band — see "Inputs & Forms") and `DateFilter`'s staged/active preset button. `DatePicker`'s own single-mode `.selected` is the one exception that drops to `{colors.ink}` instead: a picked calendar day isn't "one of several peer options" the way a dropdown's options or a segmented control's choices are, so it reads as a committed value (`bar-segment.overdue`/`.filled`'s territory) rather than a current-location pick.

Plus the global `:focus-visible` outline (`design-tokens.css`), which isn't really a fourth category — it's "current location" at the level of keyboard focus rather than app navigation. When adding a new component, that's the test: is this marking the primary action, the current location among peers, or a pick that's still being decided? If none of those, it stays grayscale.

Mechanically, `{colors.accent}` defaults to `{colors.ink}` and `{colors.accent-contrast}` defaults to `{colors.canvas-surface}` (`src/assets/design-tokens.css`) — so an unconfigured install is pixel-identical to the pure-grayscale system. Picking a color in the settings panel sets `--color-accent`/`--color-accent-contrast` as an inline override on `:root` (`src/composables/useThemeConfig.ts`), which wins over the stylesheet default without any component branching on theme. Radius and spacing tweaks work the same way via `--radius-scale`/`--space-scale` multipliers baked into the `{rounded.*}`/`{spacing.*}` token formulas. The resolved config persists to `.lifehelm/config/appearance.json` (dev-only `/api/theme-config` route in `server/localDataPlugin.ts`), machine-local and gitignored, alongside `.lifehelm/config/views.json` (templates) — mirroring how `.lifehelm/data/` stores work-item data (`items.json`, `status.json`, `tags.json`, `priorities.json`, `attachments/`).

### Status/Priority/Tag Color (opt-in, global + per-view override)

A second, narrower color mechanism exists alongside the accent, for one purpose only: letting a person visually distinguish their own statuses/priorities/tags from each other. It is **not** a general-purpose color system and doesn't extend to anything else in the app (the item detail page stays pure grayscale regardless — see below).

- **Fixed palette, not free-form hex.** `{tag-palette.*}` in the frontmatter (`red`/`orange`/`amber`/`green`/`teal`/`blue`/`purple`/`pink`) is the entire set. A person picks one of these eight per status/priority/tag — never a raw color picker — so the app can never end up with an unreadable or clashing combination.
- **Tint, not a solid fill — for badges.** `status-badge-colored` mixes the chosen `{tag-color}` into the badge's own `{colors.canvas-surface}`/`{colors.border-strong}` tokens (`color-mix(in srgb, {tag-color} 16%, {colors.canvas-surface})` for the background, 55% for the border) rather than painting a solid chip. Text stays `{colors.ink}` always — because the mix leans so heavily toward the theme's own surface color, `{colors.ink}` stays legible against it in both light and dark mode without a second per-color text-contrast check. This is a deliberate, bounded exception to "grayscale intensity signals state": the _default_, unconfigured badge is still exactly the grayscale `status-badge` spec above; color only appears where a person has explicitly opted a specific status/priority/tag into one of the eight swatches. The same tint formula is what colors a Board card's badges and a Calendar bar-segment when a color applies to it.
- **Two layers: global default, optional per-view override.** The color-settings dialog — opened from a settings button on every panel that carries this mechanism (List, Board, Calendar, and the three dashboard breakdown widgets) — has a scope toggle at the top, **Global** (the default) or **This view**. Global assignments are the swatch stored directly on the status/priority/tag entity itself (`StatusOption.color`/`PriorityOption.color`/`TagOption.color`, persisted in `.lifehelm/data/status.json`/`priorities.json`/`tags.json`) and apply everywhere. Switching the toggle to "This view" edits that one widget instance's own override instead (`ListViewConfig`/`BoardViewConfig`/`CalendarViewConfig`/`BreakdownViewConfig`'s `statusColors`/`priorityColors`/`tagColors`, `src/types/view.ts`), which is scoped to that single widget and **wins over the global color** wherever both are set for the same status/priority/tag. The item detail page never resolves either layer and stays pure grayscale unconditionally.
- **Dashboard breakdown bars: solid fill, not a tint.** `BreakdownStatus`/`BreakdownPriority`/`BreakdownTag` (`src/widgets/`) resolve the same two-layer color as everywhere else, but unlike a badge, the bar paints the resolved swatch as a **solid** `{tag-palette.*}` fill (not the 16%/55% tint mix) — a chart segment needs to read clearly at a glance, and there's no separate text/background pair here to keep the tint rule protecting. Falls back to the plain grayscale `{colors.ink}` fill when that status/priority/tag has no color assigned (globally or in this view).

### Danger (destructive actions)

A third, single-purpose color: `{colors.danger}` marks the delete-trash icon (`ActionIcon` `type="delete"`) everywhere it appears in the app, and nothing else. It is not a general destructive-button color — `btn-secondary` (cancel/back and every other non-delete destructive action) stays grayscale exactly as specced under Buttons below; only the trash-can glyph itself turns `{colors.danger}` red, always, unconditionally, in every one of its usages (`fill` baked directly into the icon in `ActionIcon.vue`, not left to each call site to remember). The reasoning for carving out this one exception where accent/tag-color don't apply: delete is irreversible and benefits from a universally-recognized, always-on warning color that doesn't depend on a per-installation accent choice or a per-view opt-in — unlike `{colors.accent}` (user-configurable, off by default) and `{tag-palette.*}` (opt-in per view), `{colors.danger}` is neither configurable nor optional. Every delete action, regardless of icon, must also confirm through `ConfirmDialog` before it takes effect — the red icon is a visual warning, not a substitute for the confirmation step.

## Typography

### Font Family

One system-native stack (`{fonts.sans}`) for every tier — no D-DIN, no separate "bold cut." Titles get their weight from `fontWeight: 700` on the same family, not a different font file. The stack is `-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial` for Latin text, with `"PingFang TC", "Microsoft JhengHei", "Noto Sans TC"` appended for Traditional Chinese, falling back to generic `sans-serif`.

**Why the switch from D-DIN:** the previous iteration declared `D-DIN-Bold, Arial Narrow, Arial, Verdana` as its stack, but D-DIN itself was never actually installed on any real device (there's no `@font-face` loading it), and `Arial Narrow` — the first real fallback — doesn't exist on macOS or most Linux systems either. In practice this meant headings silently fell back to a _different_ font than body text depending on OS (condensed Arial Narrow on Windows, plain Arial on Mac/Linux), which is the opposite of a unified type system. The system-native stack renders as each OS's own UI font (San Francisco on Mac, Segoe UI on Windows, Roboto on Android/Chrome OS) — always installed, always consistent between weights, and it's what every peer admin-dashboard product (GitHub, Linear, Vercel) already does instead of shipping a custom display face.

### Hierarchy

| Token                        | Size | Weight | Line Height | Use                                                 |
| ---------------------------- | ---- | ------ | ----------- | --------------------------------------------------- |
| `{typography.page-title}`    | 24px | 700    | 1.3         | Page `<h1>` (e.g. "清單檢視") — normal case         |
| `{typography.section-title}` | 15px | 700    | 1.4         | Card/section headers (e.g. "各狀態數量")            |
| `{typography.body}`          | 14px | 400    | 1.6         | Default UI text, form inputs                        |
| `{typography.body-sm}`       | 13px | 400    | 1.5         | Table cell text, secondary copy                     |
| `{typography.caption}`       | 12px | 400    | 1.4         | Timestamps, helper text                             |
| `{typography.label}`         | 11px | 600    | 1.3         | Table column headers, form field labels, badge text |
| `{typography.nav-item}`      | 14px | 500    | 1.4         | Sidebar navigation item text                        |

### Principles

- **Normal case everywhere.** No forced uppercase on any tier — CJK text has no case to transform.
- **Weight and size carry hierarchy, not tracking.** Letter-spacing stays at 0 (or a barely-there 0.2px on `{typography.label}` for the handful of Latin/numeral labels) instead of the previous system's wide positive tracking.
- **Dense by default.** 14px body instead of 16px — admin surfaces prioritize fitting more rows on screen over marketing-style generous type.
- **No mono.** Still not part of this system's typographic palette.

## Layout

### Spacing System

Unchanged from the previous iteration: `{spacing.xxs}` 4px · `{spacing.xs}` 8px · `{spacing.sm}` 12px · `{spacing.md}` 16px · `{spacing.lg}` 18px · `{spacing.xl}` 24px · `{spacing.xxl}` 32px · `{spacing.huge}` 48px. In code these are `--space-*` custom properties (`src/assets/design-tokens.css`), each `calc(Npx * var(--space-scale))` — the Appearance panel's spacing preset (`src/components/ThemeSettingsPanel.vue`, `SPACING_OPTIONS` in `src/config/themePresets.ts`: Compact 0.85x / Default 1x / Comfortable 1.15x) sets `--space-scale`.

**What `--space-scale` scales, and what it deliberately doesn't:** it governs the *room a layout gives its own content* — gaps between sibling list/grid items (nav items, preset buttons, badges in a row, tag chips), margins between sections, and a card/panel/popover's own outer padding. It does **not** touch a single control's own internal padding or `min-height` — a button, input, chip, or icon-button's size stays fixed regardless of the spacing preset. This mirrors the app's own global `.btn`/`.input` classes (`design-tokens.css`), which hardcode their padding (`8px 16px` / `8px 12px`) and `min-height: 36px` as literal values, never `var(--space-*)` — deliberately, since 36px is this system's documented minimum touch target (see "Touch Targets" below) and must not shrink at the Compact preset or drift at Comfortable. Where a component spec elsewhere in this document writes a control's padding as `{spacing.xs} {spacing.md}}`-style notation (`btn-primary`, `text-input`, `sidebar-nav-item`, …), read that as naming the *default pixel value* the token happens to equal, not a live binding — the control's own padding is intentionally exempt from the scale. A quick test for which side of the line something falls on: would resizing it change the *shape of one control*, or the *breathing room between separate things*? The former stays fixed; the latter scales.

### Shell Structure

The app shell is two columns: a fixed 240px `{component.sidebar}` on the left, and a flexible right column containing a 56px `{component.topbar}` and a scrollable content area (`{colors.canvas-app}` background). There is no full-viewport hero band anymore — every screen lives inside the content column with `{spacing.xl}` (24px) padding.

### Grid & Container

- Content column has no max-width constraint beyond the viewport minus the sidebar — dashboards use available width for tables and multi-column card grids.
- Card grids (dashboard summary cards) stair-step via `repeat(auto-fit, minmax(160px, 1fr))` — as many columns as fit, no fixed breakpoint count.

## Elevation & Depth

| Level | Treatment                                                         | Use                                                                       |
| ----- | ----------------------------------------------------------------- | ------------------------------------------------------------------------- |
| 0     | Flat                                                              | Default — the only level in this system                                   |
| 1     | 1px border (`{colors.border-subtle}` or `{colors.border-strong}`) | The sole separation technique between a card/table and the app background |

No drop shadows, blurs, glows, or gradients — same discipline as the previous iteration, just without photography to justify it. Here the reasoning is simpler: admin surfaces should look calm and flat, and a border reads as structural while a shadow reads as decorative.

## Shapes

### Border Radius Scale

| Token            | Value  | Use                                                         |
| ---------------- | ------ | ----------------------------------------------------------- |
| `{rounded.xs}`   | 4px    | Form inputs                                                 |
| `{rounded.sm}`   | 6px    | Buttons — the default interactive-element radius            |
| `{rounded.md}`   | 10px   | Cards, tables, panels                                       |
| `{rounded.lg}`   | 14px   | Modals/dialogs                                              |
| `{rounded.full}` | 9999px | Status badges/chips and avatar circles only — never buttons |

The previous system's signature 32px pill button is gone. Admin dashboards use small-radius rectangular buttons; pill/full radius is reserved for status chips, which is where it reads as "state," not "action."

## Components

### Buttons

**`btn-primary`** — the primary action in any given context (save, create).

- Background `{colors.accent}`, text `{colors.accent-contrast}`, type `{typography.body-sm}`, padding `{spacing.xs} {spacing.md}` (8px 16px), rounded `{rounded.sm}` 6px, min-height 36px. `{colors.accent}` defaults to `{colors.ink}` (white-on-near-black, same as the previous unaccented spec) unless the user has picked a custom accent — see "Accent (user-configurable)" under Colors.

**`btn-secondary`** — secondary actions (cancel, back, confirming a destructive action).

- Background `{colors.canvas-surface}`, 1px `{colors.border-strong}` border, text `{colors.ink}`, otherwise identical geometry to `btn-primary`. Stays grayscale even inside a delete-confirmation dialog — `{colors.danger}` (see "Danger (destructive actions)" under Colors) is reserved for the trash icon itself, never the button chrome around it.

**`btn-ghost`** — lowest-emphasis inline actions (row-level edit/delete links).

- Transparent background, text `{colors.ink-secondary}`, background lifts to `{colors.surface-hover}` on hover, no border.

### Cards & Containers

**`card`** — the default content container.

- Background `{colors.canvas-surface}`, 1px `{colors.border-subtle}` border, rounded `{rounded.md}` 10px, padding `{spacing.md}` 16px. Used for dashboard summary tiles, form panels, and detail sections.

**`data-table`** — tabular list views.

- Background `{colors.canvas-surface}`, rounded `{rounded.md}` 10px. Header row uses `{typography.label}` text in `{colors.ink-secondary}` with a `{colors.border-strong}` bottom border; body rows use `{typography.body-sm}`, `{colors.border-subtle}` row dividers, and `{colors.surface-hover}` on hover.

### Inputs & Forms

**`text-input`** — form input.

- Background `{colors.canvas-surface}`, text `{colors.ink}`, type `{typography.body}`, padding `{spacing.xs} {spacing.sm}` (8px 12px), rounded `{rounded.xs}` 4px, 1px `{colors.border-strong}` border, min-height 36px.

**`select-menu`** (`src/components/SelectMenu.vue`) — a drop-in replacement for a native `<select>`, used everywhere a single value is picked from a list (status/priority/tag/sort filters, Board's group-by, the item form's status/priority fields, the Appearance panel's font picker): every one of these across the whole app is this component now, never a bare `<select>`. Same v-model contract as a native select (`modelValue`/`options: {value, label}[]`), but styled consistently with the rest of this system instead of OS-native chrome, which can't be made to match.

- **Trigger is `text-input`-spec** (identical padding/border/radius/min-height), plus a small `currentColor` chevron on the right so it still reads as "opens a list" the way a native select's own arrow did.
- **Popover is `date-picker-popover`-spec** — same bordered card (`1px {colors.border-strong}`, `{rounded.md}`, no shadow) as `DatePicker`'s, positioned directly under the trigger, `max-height: 260px` with its own scroll for long lists (tag filters especially). Its `min-width` matches the trigger's own width — tracked in JS via `getBoundingClientRect()` alongside its `top`/`left`, not CSS `min-width: 100%`: percentage widths on a `position: fixed` box resolve against the viewport, not the trigger, so that read as "100% of the viewport" (and silently beat `max-width: 280px` too, since a min-width bigger than max-width always wins) — the popover rendered nearly viewport-wide before this was caught.
- **Each option is a fixed 36px tall** (`.input`/`.btn`'s own fixed height, not `{spacing.*}`-driven padding) — every row is exactly this tall regardless of its label, rather than each row sizing independently off its own content/font metrics, which read as inconsistent and visibly shallower than the trigger. The list as a whole is what scrolls past `.popover`'s `max-height`, never an individual row.
- **No stage-then-Confirm** — unlike `DatePicker`/`DateFilter`, clicking an option commits immediately and closes, same as a native select firing `change`. There's nothing to preview, so there's nothing to gate behind an extra step.
- **Current value gets the solid `{colors.accent}` fill**, the same "current selection among peer options" territory the sidebar's active-nav-item and `ThemeSettingsPanel`'s own active preset/segment already use accent for (see "Accent (user-configurable)") — a dropdown's selected option is one of several interchangeable peers, not a point picked on a calendar, so this is a different case from `DatePicker`'s single-mode `.selected` (which stays ink).
- **`Teleport`ed to `<body>`**, same reasoning and mechanism as `DateFilter`'s popover (every widget's `.widget-body` clips overflow on every side) — but at `z-index: 110`, above `ModalOverlay`'s own backdrop (`z-index: 100`), not `DatePicker`/`DateFilter`'s `20`. This component is also used inside modal dialogs (the Appearance panel's font picker lives in a `ModalOverlay`), and since the backdrop is Teleported to `<body>` too, a lower z-index would let the backdrop paint on top and make the options unclickable.
- **Arrow-key navigation**, matching a native select: Up/Down move a highlighted option (opening the popover on the first press if it's closed), Enter/Space commits the highlighted option, Escape closes without committing. The highlight is tracked in component state rather than real DOM focus — focus stays pinned on the trigger throughout, the same `@mousedown.prevent`-everywhere pattern `DatePicker`/`DateFilter` use.

**Date picker** (`src/components/DatePicker.vue`) — a `date-picker-trigger` button (identical spec to `text-input`, so it sits in a form exactly like any other field) that opens a `date-picker-popover` calendar underneath it on click. Supports two modes: single date (`v-model`) or a date range (`v-model:start`/`v-model:end`, e.g. a work item's start/due dates) — same component, same popover, the range mode just tracks two dates and auto-orders them if the second pick lands before the first.

- **Day cells are small rounded squares, not circles.** Consistent with "small-radius rectangular buttons, `{rounded.full}` reserved for badges/chips" — a day cell is a button, so it gets `{rounded.sm}` like every other button, not the circular treatment typical of calendar widgets elsewhere.
- **Single-mode selected state is a solid ink fill**, mirroring `bar-segment.overdue`/`.filled` badges elsewhere: the picked day gets `{colors.ink}` background and `{colors.canvas-surface}` text — the strongest, most legible state, not a tinted accent.
- **Range mode uses `{colors.accent}`, not ink.** The range's start/end caps are a solid `{colors.accent}`/`{colors.accent-contrast}` fill, and the days between them (plus the live hover preview before the second pick) are a flat `{colors.accent}` tint at 16% opacity, square-cornered (rounded only at the start/end caps) with no gap between cells so the band reads as one continuous stretch. This is the same "current selection in progress" territory `btn-primary`/the sidebar's active-nav-item already use accent for (see "Accent (user-configurable)") — not the status/priority/tag color mechanism (`{tag-palette.*}` never appears here), and not the single-mode ink fill either, since a range is inherently two-ended rather than one committed value.
- **A Confirm button, bottom-right of the popover footer, in both modes.** The footer splits left (`Today`, `Clear`, both plain `link-btn` text buttons) from right (`Confirm`, a compact `btn-primary`) via `justify-content: space-between`. Both modes only preview the pending pick — single mode's clicked day, range mode's start/end — without committing until Confirm is pressed; closing the popover any other way (outside click, Escape) discards the pending pick instead of saving it. In range mode, Confirm stays disabled only until a start is picked — confirming with just a start (no end yet) is a valid one-day range, committing the same date as both start and end, not an incomplete pick that needs blocking.
- **Month and year are independently clickable in the day grid's header** (`{typography.body-sm}`, bold, each its own button) — click the month label to jump straight to a 12-cell month grid (current year), or the year label to jump straight to a 12-cell year grid (the current 12-year block), without drilling through the other level first. From the month grid, only the year label remains (click it to reach the year grid). Both grids reuse `.grid`'s no-gap layout at 3 columns instead of 7. Picking a month/year drills back down one level (year pick → month grid of that year; month pick → day grid of that month) rather than jumping straight to days, so a distant year still lands on its month grid first. The prev/next chevrons operate one drill level at a time (month/year/12-year-block) instead of always meaning "month." The currently-displayed month/year in these grids (`.current`, the drill context) is marked bold, not filled — a fill is reserved for an actually committed/pending value (see next bullet), and being "the month/year currently in view" isn't one.
- **The month/year containing the pending pick(s) is filled**, the same `.selected`/`.range-start`/`.range-end`/`.in-range` fill language the day grid uses (solid `{colors.ink}` for a single-mode pick, `{colors.accent}` caps with a 16% `{colors.accent}` tint between them for a range) — so drilling up from the day grid doesn't lose track of what's picked. Unlike the day grid, cells here don't flatten a corner to fuse into a band: a 3-column wrapped grid has no linear adjacency to fuse across, so every filled cell stays a fully rounded chip regardless of whether it's a start/end cap or a spanned month/year in between.
- **Today/this-month/this-year share one marker**, distinct from the "currently in view" bold above (a grid can show both at once — e.g. the viewed month bold as `.current`, and a past/future month plain — since one is drill context and the other is the real calendar date). All three use the same treatment — bold text plus a small dot below it — so day/month/year read as one convention rather than three different ones. The dot is drawn in `currentColor`, not a fixed color, specifically so it survives being layered under any other state: it automatically becomes `{colors.canvas-surface}` on a single-mode `.selected` ink fill, `{colors.accent-contrast}` on a range `.range-start`/`.range-end` accent fill, or stays `{colors.ink}` unselected — never a same-color-as-fill ring that would disappear. None of this uses `{colors.accent}` on its own — the accent is reserved for actual selections (see "Range mode" above and "Accent (user-configurable)"), not a locator.
- **A lone range-start pick (no end, no hover-preview band yet) is fully rounded on all four corners**, not flattened — the flat "open" edge on `range-start`/`range-end` signals a band continuing in that direction, and with no end picked and no hover forming a preview yet, there's no band to connect to. The corner flattens back in as soon as either a hover starts previewing a band or an end is picked.
- **No shadow, no backdrop.** The popover is a bordered card (`1px {colors.border-strong}`, `{rounded.md}`) positioned directly under the trigger, same visual weight as `TagsInput`'s suggestion dropdown — not a `ModalOverlay`-style dialog, since picking a date isn't a focused task that needs to block the rest of the page.

**Date filter** (`src/components/DateFilter.vue`) — an advanced date-range filter for the same List/Board/Calendar filters row as the status/priority/tag `select-menu`s (`src/types/view.ts`'s `FilterConfig`), styled as the same `date-picker-trigger`-spec button opening a popover under it.

- **The popover is `Teleport`ed to `<body>`**, not a CSS-anchored absolute child of the trigger like `DatePicker`'s own — every widget's `.widget-body` is `overflow-y: auto`, which per the CSS overflow spec also forces `overflow-x` to `auto`, clipping/scrolling any absolutely-positioned descendant that overflows it. This popover (two columns plus an embedded calendar) is wide enough to hit that routinely, so it escapes to `<body>` and positions itself with `position: fixed` + inline `top`/`right` pixel coordinates computed from the trigger's own `getBoundingClientRect()`, recomputed on open, window resize, and scroll (capture-phase, so it also tracks a *specific* scrolling ancestor like `.widget-body`, not just the window). Anchored via `right`, not `left`, growing leftward from the trigger's right edge, for the same reason as before teleporting: this popover is wide enough that left-aligning under a trigger anywhere but the row's left edge would push it off the viewport.
- Because the trigger and the (teleported) popover now live in two separate DOM subtrees, the "focus left the widget" outside-click detection checks containment against *both* trees, not just one.

- **Two columns: presets on the left, the calendar itself on the right.** The left column stacks two preset groups — "current period" (today/this week/this fortnight/this month/this year — the calendar period containing today) and "past period" (last week/last two weeks/last month/last year — the period immediately before the current one, never including today) — as full-width small rectangular buttons, `{rounded.sm}` like every other button. The right column embeds `DatePicker` itself in `inline` mode (see Date Picker's `inline` prop below): no trigger/popover/footer chrome of its own, just the nav+grid, always visible, separated from the presets by a `1px {colors.border-subtle}` divider instead of a second nested border. It's a bit wider than `DatePicker`'s own standalone-popover width (300px vs. 260px) — since day cells are `aspect-ratio: 1`, the extra width grows the cells themselves (bigger day-cell click targets), not just empty padding.
- **The trigger has a fixed flex-basis (190px), not just a min-width.** Its text otherwise drives the button's own width (a flex item with no other constraint sizes to content), which would make the field visibly widen the moment a range is picked instead of already having room for one — sized up front for a full custom range ("8/3/2026 – 8/10/2026"-ish) so nothing shifts. Overflow text-ellipsis-truncates rather than growing further.
- **The calendar column sets the popover's height; the presets column is capped to match and scrolls internally** rather than stretching the popover taller than the (usually shorter) calendar next to it — tracked via a `ResizeObserver` on the calendar column rather than a fixed pixel guess, since its own height already varies (a 5- vs. 6-week month in the day grid, or the drilled-up month/year grids, which are shorter still).
- **Solid `{colors.accent}` fill for the active preset**, not ink — a *staged* preset is a live, in-progress choice (closer to `DatePicker`'s range-mode start/end caps than its single-mode `.selected`), and this filter is range-shaped underneath regardless of which preset is picked.
- **The footer's `Clear` is `btn-secondary` (bordered), not a plain text link** — same visual weight as `Confirm` (`btn-primary`) next to it, both compact (reduced padding/min-height), since the two are equally-weighted terminal actions for this popover.
- **Picking a preset previews its resolved range on the calendar** — clicking "This week" highlights that actual week's days on the grid, without requiring a day click. Clicking a day directly always switches the staged choice to a custom range starting from that day, same as `DatePicker`'s own range picking.
- **Everything is staged until one shared Confirm, at the very bottom** — picking a preset or a day on the calendar only stages the choice (highlighted preset button / highlighted grid days); nothing reaches the caller's `v-model` until the footer's Confirm is pressed. The footer stacks the staged selection's label above a row of `Clear` (left) and `Confirm` (right, `btn-primary`) — same "preview, then explicit commit" contract as `DatePicker`'s own footer, just one level up: closing any other way (outside click, Escape) discards the staged pick.

**`inline` prop** (on `DatePicker`, used by Date filter above) — drops the trigger button, the floating-popover positioning/border/background, and the Today/Clear/Confirm footer, rendering just the nav+grid as a plain always-visible block. Every pick emits immediately instead of staging behind its own Confirm, since in this mode a *different* component already owns that gate — the calendar becomes a live-bound input, not its own pending transaction.

### Navigation

**`sidebar`** — fixed left navigation rail.

- Background `{colors.canvas-sidebar}`, default width 240px (user-resizable, see below), padding `{spacing.md} {spacing.sm}`. Holds a top row (app name + collapse toggle), a vertical list of `sidebar-nav-item` entries (each pairing a small inline-SVG glyph with `{typography.nav-item}` text), and a theme toggle pinned to the bottom via `margin-top: auto`.
- **Resizable**: the sidebar's right edge is a permanently-visible 1px `{colors.border-strong}` divider (thickening and darkening to `{colors.ink-secondary}` on hover) that doubles as the drag handle — `cursor: ew-resize`, drag to set any width between 180px and 400px. The divider stays visible (but non-interactive) when collapsed. The choice persists to `localStorage` (`src/composables/useSidebar.ts`). Because the sidebar now shares `canvas-surface`'s color with the content cards, this divider is what actually separates sidebar from content — don't rely on a color difference alone.
- **Collapsible**: a chevron toggle next to the app name collapses the sidebar to a fixed 64px icon-only rail (labels hidden, nav items center their icon) — independent of viewport width, and also persisted. On first load with no stored preference, it defaults collapsed if the viewport is under 1024px.

**`sidebar-nav-item`** — a single navigation entry.

- Default: transparent background, text `{colors.on-sidebar-muted}`. Hover: background `{colors.sidebar-hover}`. Active (current route): background `{colors.sidebar-active}`, text `{colors.on-sidebar}`, plus a 3px `{colors.on-sidebar}` left-edge indicator bar. Rounded `{rounded.sm}`, padding `{spacing.xs} {spacing.sm}`.

**`topbar`** — top bar in the content column.

- Background `{colors.canvas-surface}`, 1px `{colors.border-subtle}` bottom border, height 56px, padding `0 {spacing.xl}` (0 24px), holds the current page's `{typography.page-title}`.

### Signature Components

**`status-badge`** — used for work-item status/priority/tag chips.

- Rounded `{rounded.full}` (the one place pill radius survives), padding 2px 10px, type `{typography.label}`. Default: `{colors.canvas-surface}` background with a `{colors.ink}` (or `{colors.border-strong}` for lower-emphasis variants) border. "Completed"/highest-emphasis states invert to solid `{colors.ink}` background with `{colors.canvas-surface}` text — grayscale intensity signals state by default.
- **`status-badge-colored`** — same geometry, opt-in. See "Status/Priority/Tag Color (opt-in, global + per-view override)" under Colors: background/border tint from one of the eight `{tag-palette.*}` swatches, text stays `{colors.ink}`. Only appears where a person has explicitly assigned a swatch to that status/priority/tag, globally or in that specific view's settings — never a default state.

## Do's and Don'ts

### Do

- Keep the sidebar fixed and dark on every screen — it's the one constant piece of chrome.
- Use weight and size (not color, not letter-spacing) to build hierarchy in Chinese UI text.
- Border every card/table against `{colors.canvas-app}` — there's no shadow to do that job.
- Reserve `{rounded.full}` for status chips; every button and input stays rectangular with `{rounded.sm}`/`{rounded.xs}`.
- Keep the palette to ink/canvas/border grayscale steps by default — accent (`{colors.accent}`) is an explicit, user-opted-in override (see "Accent (user-configurable)"), not something a component reaches for on its own.

### Don't

- Don't force `uppercase` on any text tier — it has no effect on CJK and reads as broken when it does apply to the rare Latin string.
- Don't bring back the 32px pill button for primary/secondary actions — that shape is a status-badge signal only now.
- Don't add drop shadows or gradients to lift cards off the background — use a border instead.
- Don't introduce a _new_ hardcoded brand color anywhere, and don't use `{colors.accent}` for charts or status — grayscale intensity (outline vs. filled `{colors.ink}`) is still the default status signal. The one user-configurable accent lives entirely behind `{colors.accent}`/`{colors.accent-contrast}`, not scattered hex values. The two sanctioned exceptions are `status-badge-colored`/the dashboard breakdown bar fill (see "Status/Priority/Tag Color (opt-in, global + per-view override)") — stick to the fixed eight `{tag-palette.*}` swatches, never a free hex value, and never on the item detail page — and the delete-trash icon's `{colors.danger}` (see "Danger (destructive actions)"), which never spreads to button chrome, borders, or any other element.
- Don't widen letter-spacing on body or label text to "match the old brand feel" — it actively hurts CJK legibility.

## Responsive Behavior

### Breakpoints

| Name    | Width    | Key Changes                                                         |
| ------- | -------- | ------------------------------------------------------------------- |
| Desktop | ≥ 1024px | Sidebar defaults expanded (user-resizable 180–400px, icon + label)  |
| Compact | < 1024px | Sidebar defaults collapsed to an icon-only rail (64px); labels hide |

The sidebar's expanded/collapsed state and width are user-controlled and persisted (`localStorage`) once touched — the breakpoint above only decides the _first-load default_ when no preference is stored yet, it doesn't force a state on every resize.

### Touch Targets

- Buttons and inputs hold a 36px minimum height — dense but still comfortably clickable for a desktop-first admin tool (this system is not optimized for a 44–50px marketing touch target).
- Every widget's `.widget-body` (`src/widgets/WidgetChrome.vue`) carries a 4px padding for exactly one reason: its `overflow-y: auto` also computes `overflow-x` as `auto` per the CSS overflow spec, making it a clipping box on every side — and a panel's own root (List/Board/Calendar, …) has no padding of its own, so its first row of controls routinely sits flush against that edge. `:focus-visible`'s `outline: 2px` + `outline-offset: 2px` (`design-tokens.css`) extends 4px beyond a control's own box; without this padding that ring gets clipped on whichever side touches the widget edge. This 4px is a literal value, not `var(--space-*)` — see "Appearance spacing: what scales" under Layout — because it exists to fit a fixed-size rendering effect, not a spacing preference.

### Collapsing Strategy

- The sidebar is the only piece of chrome that collapses, and it collapses to icons via an explicit toggle rather than hiding behind a hamburger menu or a viewport-only media query — admin tools keep primary navigation reachable and under the user's control at every width.
- Dashboard card grids reflow via `auto-fit` rather than stepping through named breakpoints.
- Data tables scroll horizontally on narrow viewports rather than reflowing into cards.

## Iteration Guide

1. Focus on ONE component at a time.
2. Reference component names and tokens directly (`{colors.ink}`, `{btn-primary}`, `{rounded.sm}`).
3. Add new variants as separate entries rather than overloading an existing one.
4. Default body to `{typography.body}`; reserve `{typography.body-sm}` for table cells and secondary copy.
5. The monochrome-by-default rule is still load-bearing — don't hardcode a new brand color into a component. The only sanctioned colors are the single user-configurable `{colors.accent}` token (see "Accent (user-configurable)"), used only in the few places it's already wired up; the fixed eight-swatch `{tag-palette.*}` used only by `status-badge-colored` (see "Status/Priority/Tag Color (opt-in, global + per-view override)"); and `{colors.danger}`, used only by the delete-trash icon (see "Danger (destructive actions)").
6. `{rounded.full}` is reserved for status badges — don't apply it to buttons or inputs.
