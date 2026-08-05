# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project status

This is a freshly scaffolded Vue 3 + TypeScript project (`create-vue` template). No application
code has been written yet beyond the scaffold — `src/App.vue`, `src/router/index.ts` (empty route
list), and `src/stores/counter.ts` (the template's example Pinia store) are all placeholders.

## Design guideline

`DESIGN.md` is the source of truth for every screen and component built in this app — read it
before writing any UI, and use its design tokens (colors, typography, spacing, rounded, components)
instead of inventing new values. It defines a SpaceX-inspired system that is deliberately austere:

- **Black-and-white only** — no brand accent color. Photography (or, in-app, imagery) supplies the
  only non-monochrome color. Don't introduce accent colors when building components.
- **Uppercase display type** (D-DIN-Bold, falls back to Inter 700 + `letter-spacing`) with tight
  vertical leading and positive letter-spacing — this is the brand's signature and isn't optional
  for headline-tier text.
- **Ghost-outlined pill buttons** (`{rounded.pill}`, 32px radius) are the only CTA on dark/marketing
  surfaces — one per section, never filled, never paired with a second CTA. Filled buttons
  (`button-filled-cool`) are reserved for shop/light-surface product actions.
- **No shadows, blurs, or gradient overlays** — depth comes from imagery, not CSS elevation.
- Component specs (buttons, cards, inputs, nav, footer) are defined under `components:` in
  `DESIGN.md`'s frontmatter with references like `{colors.canvas-night}` — resolve those references
  against the same frontmatter rather than hardcoding hex/px values in `.vue` files.

When implementing a screen, check `DESIGN.md`'s "Do's and Don'ts" and "Responsive Behavior"
sections for the specific component you're building before styling it from scratch.

## Commands

Package manager is **pnpm** (see `pnpm-workspace.yaml`; do not use npm/yarn).

- `pnpm dev` — start the Vite dev server
- `pnpm build` — type-check (`vue-tsc --build`) and production-build in parallel via `run-p`
- `pnpm build-only` — production build without type-checking
- `pnpm preview` — preview the production build locally
- `pnpm lint` — runs both linters in sequence: `oxlint . --fix` then `eslint . --fix --cache`
- `pnpm format` — format `src/` with `oxfmt`

There is no test runner configured yet (no Vitest/Jest/Playwright in `package.json`). If tests are
added, update this section with how to run a single test.

## Tooling notes

- **Two linters run together**: `oxlint` (fast, Rust-based) runs first, then ESLint's flat config
  (`eslint.config.ts`) picks up rules oxlint doesn't cover and disables ESLint rules oxlint already
  handles via `eslint-plugin-oxlint`. When changing lint rules, `.oxlintrc.json` and
  `eslint.config.ts` need to stay in sync — see the `pluginOxlint.buildFromOxlintConfigFile` call in
  `eslint.config.ts`.
- **Formatting is oxfmt, not Prettier**: config is in `.oxfmtrc.json` (no semicolons, single quotes).
  `eslint-config-prettier` is included only to turn off ESLint formatting rules that would conflict.
  VS Code is configured (`.vscode/settings.json`) to format-on-save with the oxc formatter.
- `vue` and its compiler/runtime packages are pinned to the `rc` dist-tag in `pnpm-workspace.yaml`
  (Vue's Vapor-mode release line) — don't "fix" this to a stable tag without checking why it was
  set.
- Path alias `@/*` maps to `src/*` (configured in both `vite.config.ts` and
  `tsconfig.app.json`) — use it for imports instead of relative `../../` paths.
- `tsconfig.app.json` enables `noUncheckedIndexedAccess`; array/object index access is typed as
  possibly-undefined, so guard accordingly rather than asserting non-null.
- Node engine requirement: `^22.18.0 || >=24.12.0` (see `package.json` engines field).

## Architecture

Standard `create-vue` layout:

- `src/main.ts` — app entry point; installs Pinia and Vue Router onto the root `App` component.
- `src/router/index.ts` — Vue Router instance using `createWebHistory`. Route list is currently
  empty — add routes here as views are built.
- `src/stores/` — Pinia stores, defined with the composition-style `defineStore(id, () => {...})`
  setup-store syntax (see `counter.ts` for the pattern to follow for new stores).
- `src/App.vue` — root component, currently the template placeholder.

No `src/views/` or `src/components/` directories exist yet — they'll need to be created as the
application grows.
