# lifehelm

**lifehelm** is a self-hosted, local-first work item tracker built with Vue 3, TypeScript, and
Vite. It follows the back-office admin dashboard design specified in [`DESIGN.md`](./DESIGN.md) —
dense, information-first layouts where clarity and speed matter more than decoration.

## Features

- **Work items** — title, description, status, priority, tags, start/due dates, comments,
  file attachments, and per-item time tracking (running timer or manual entries).
- **List, Board, Calendar & Dashboard views** — a filterable/sortable table, a drag-and-drop
  Kanban board (grouped by status, priority, or tag, with a configurable "done" column), a
  month calendar, and a metrics dashboard (totals, completion rate, overdue/due-today counts,
  tracked time, and status/priority/tag breakdowns).
- **Custom pages** — beyond the four built-in views, users can create additional pages, freely
  arrange widgets on a drag-to-resize grid, rename/duplicate/delete pages, and pin any of them
  to the sidebar via the template manager.
- **Persistent sidebar navigation** — a fixed, resizable/collapsible left rail lists pinned
  views so orientation never depends on scrolling back to a header.
- **Color customization** — per-status, per-priority, and per-tag color assignment, plus status
  badges for at-a-glance record state.
- **Confirmation dialogs** for destructive actions (deleting items, columns, comments,
  attachments, time entries, or views).
- **Appearance settings** — light/dark mode, an optional accent color (off by default for a
  pure grayscale look), font, corner radius, and spacing presets, all persisted and adjustable
  from a single settings panel.
- **Localization** — English and Traditional Chinese via `vue-i18n`.
- **Local-first storage** — a Vite dev-server plugin (`server/`) persists all data as JSON
  files under `.manager/data`, with no separate backend process to run.

## Tech Stack

- [Vue 3](https://vuejs.org/) (Vapor-mode release line) + TypeScript
- [Vite](https://vite.dev/) for dev server and build tooling, plus a custom Vite plugin
  (`server/localDataPlugin.ts`) that serves the app's REST API and persists data to local JSON
- [Pinia](https://pinia.vuejs.org/) for state management
- [Vue Router](https://router.vuejs.org/) for navigation
- [vue-i18n](https://vue-i18n.intlify.dev/) for English/Traditional Chinese localization
- [vue-draggable-plus](https://alfred-skyblue.github.io/vue-draggable-plus/) for drag-and-drop
  (board columns/cards, dashboard widget grid)
- [oxlint](https://oxc.rs/) + [ESLint](https://eslint.org/) for linting, [oxfmt](https://oxc.rs/)
  for formatting

## Getting Started

Requires Node.js `^22.18.0` or `>=24.12.0` and [pnpm](https://pnpm.io/) (this project's package
manager — please don't use npm/yarn).

```sh
pnpm install
pnpm dev
```

## Scripts

| Command             | Description                                          |
| -------------------- | ----------------------------------------------------- |
| `pnpm dev`          | Start the Vite dev server with hot-reload            |
| `pnpm build`        | Type-check (`vue-tsc`) and build for production      |
| `pnpm build-only`   | Build for production without type-checking           |
| `pnpm preview`      | Preview the production build locally                 |
| `pnpm lint`         | Run oxlint, then ESLint, both with autofix           |
| `pnpm format`       | Format `src/` with oxfmt                             |

## Recommended IDE Setup

[VS Code](https://code.visualstudio.com/) + [Vue (Official)](https://marketplace.visualstudio.com/items?itemName=Vue.volar)
(and disable Vetur).

## Recommended Browser Setup

- Chromium-based browsers (Chrome, Edge, Brave, etc.):
  - [Vue.js devtools](https://chromewebstore.google.com/detail/vuejs-devtools/nhdogjmejiglipccpnnnanhbledajbpd)
  - [Turn on Custom Object Formatter in Chrome DevTools](http://bit.ly/object-formatters)
- Firefox:
  - [Vue.js devtools](https://addons.mozilla.org/en-US/firefox/addon/vue-js-devtools/)
  - [Turn on Custom Object Formatter in Firefox DevTools](https://fxdx.dev/firefox-devtools-custom-object-formatters/)
