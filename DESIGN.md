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

The base system ships with no brand accent color, but the app exposes a user-facing "tweak" panel (`src/components/ThemeSettingsPanel.vue`, opened from a trigger in the sidebar) that lets a person opt into one, along with font, corner radius, and spacing adjustments — plus a handful of built-in presets bundling all four together (`src/config/themePresets.ts`). This is a per-installation preference, not a redesign of the component specs below: every spec in this document (buttons, badges, cards) still describes the grayscale default, and accenting only touches the places explicitly wired to `{colors.accent}`/`{colors.accent-contrast}` — currently `btn-primary`, the sidebar's active-nav-item indicator/tint, and the global focus ring. Everything else (cards, tables, borders, secondary/ghost buttons) stays grayscale regardless of the chosen accent, so the monochrome discipline still governs structure; accent is limited to marking the single primary action and current location, never used for charts or status. Status/priority/tag color-coding is a separate, narrower mechanism — see "Status/Priority/Tag Color (opt-in, per view)" below — and the two are never mixed: `{colors.accent}` never colors a badge, and `{tag-palette.*}` never colors a button.

Mechanically, `{colors.accent}` defaults to `{colors.ink}` and `{colors.accent-contrast}` defaults to `{colors.canvas-surface}` (`src/assets/design-tokens.css`) — so an unconfigured install is pixel-identical to the pure-grayscale system. Picking a color in the settings panel sets `--color-accent`/`--color-accent-contrast` as an inline override on `:root` (`src/composables/useThemeConfig.ts`), which wins over the stylesheet default without any component branching on theme. Radius and spacing tweaks work the same way via `--radius-scale`/`--space-scale` multipliers baked into the `{rounded.*}`/`{spacing.*}` token formulas. The resolved config persists to `.lifehelm/config/appearance.json` (dev-only `/api/theme-config` route in `server/localDataPlugin.ts`), machine-local and gitignored, alongside `.lifehelm/config/views.json` (templates) — mirroring how `.lifehelm/data/` stores work-item data (`items.json`, `status.json`, `tags.json`, `priorities.json`, `attachments/`).

### Status/Priority/Tag Color (opt-in, per view)

A second, narrower color mechanism exists alongside the accent, for one purpose only: letting a person visually distinguish their own statuses/priorities/tags from each other in a specific List view. It is **not** a general-purpose color system and doesn't extend to anything else in the app.

- **Fixed palette, not free-form hex.** `{tag-palette.*}` in the frontmatter (`red`/`orange`/`amber`/`green`/`teal`/`blue`/`purple`/`pink`) is the entire set. A person picks one of these eight per status/priority/tag — never a raw color picker — so the app can never end up with an unreadable or clashing combination.
- **Tint, not a solid fill.** `status-badge-colored` mixes the chosen `{tag-color}` into the badge's own `{colors.canvas-surface}`/`{colors.border-strong}` tokens (`color-mix(in srgb, {tag-color} 16%, {colors.canvas-surface})` for the background, 55% for the border) rather than painting a solid chip. Text stays `{colors.ink}` always — because the mix leans so heavily toward the theme's own surface color, `{colors.ink}` stays legible against it in both light and dark mode without a second per-color text-contrast check. This is a deliberate, bounded exception to "grayscale intensity signals state": the _default_, unconfigured badge is still exactly the grayscale `status-badge` spec above; color only appears where a person has explicitly opted a specific status/priority/tag into one of the eight swatches.
- **Scoped to one view, not global.** The mapping (which swatch a given status/priority/tag uses) is stored per-view — inside that List widget's own config in the view's saved layout (`ListViewConfig.statusColors`/`priorityColors`/`tagColors`, `src/types/view.ts`) — configured via a settings button on the List panel. It does not repaint board cards, the item detail page, or dashboard breakdown charts; those stay pure grayscale, unaffected by any view's color choices. Charts and dashboard breakdowns in particular must never pick up `{tag-palette.*}` colors — that's still exactly the "never used for charts" rule.

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

Unchanged from the previous iteration: `{spacing.xxs}` 4px · `{spacing.xs}` 8px · `{spacing.sm}` 12px · `{spacing.md}` 16px · `{spacing.lg}` 18px · `{spacing.xl}` 24px · `{spacing.xxl}` 32px · `{spacing.huge}` 48px.

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
- **`status-badge-colored`** — same geometry, opt-in per view. See "Status/Priority/Tag Color (opt-in, per view)" under Colors: background/border tint from one of the eight `{tag-palette.*}` swatches, text stays `{colors.ink}`. Only appears where a person has explicitly assigned a swatch to that status/priority/tag in that view's settings — never a default state.

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
- Don't introduce a _new_ hardcoded brand color anywhere, and don't use `{colors.accent}` for charts or status — grayscale intensity (outline vs. filled `{colors.ink}`) is still the default status signal. The one user-configurable accent lives entirely behind `{colors.accent}`/`{colors.accent-contrast}`, not scattered hex values. The two sanctioned exceptions are `status-badge-colored` (see "Status/Priority/Tag Color (opt-in, per view)") — stick to the fixed eight `{tag-palette.*}` swatches, never a free hex value, and never on a chart/breakdown — and the delete-trash icon's `{colors.danger}` (see "Danger (destructive actions)"), which never spreads to button chrome, borders, or any other element.
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

### Collapsing Strategy

- The sidebar is the only piece of chrome that collapses, and it collapses to icons via an explicit toggle rather than hiding behind a hamburger menu or a viewport-only media query — admin tools keep primary navigation reachable and under the user's control at every width.
- Dashboard card grids reflow via `auto-fit` rather than stepping through named breakpoints.
- Data tables scroll horizontally on narrow viewports rather than reflowing into cards.

## Iteration Guide

1. Focus on ONE component at a time.
2. Reference component names and tokens directly (`{colors.ink}`, `{btn-primary}`, `{rounded.sm}`).
3. Add new variants as separate entries rather than overloading an existing one.
4. Default body to `{typography.body}`; reserve `{typography.body-sm}` for table cells and secondary copy.
5. The monochrome-by-default rule is still load-bearing — don't hardcode a new brand color into a component. The only sanctioned colors are the single user-configurable `{colors.accent}` token (see "Accent (user-configurable)"), used only in the few places it's already wired up; the fixed eight-swatch `{tag-palette.*}` used only by `status-badge-colored` (see "Status/Priority/Tag Color (opt-in, per view)"); and `{colors.danger}`, used only by the delete-trash icon (see "Danger (destructive actions)").
6. `{rounded.full}` is reserved for status badges — don't apply it to buttons or inputs.
