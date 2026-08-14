import type { TagColorKey } from '@/config/tagColors'

// The per-view color mapping wins over the global one stored on the
// status/priority/tag entity itself — see DESIGN.md "Status/Priority/Tag
// Color (opt-in, global + per-view override)".
export function resolveColor(
  name: string,
  registry: { name: string; color?: TagColorKey }[],
  viewColors?: Partial<Record<string, TagColorKey>>,
): TagColorKey | undefined {
  return viewColors?.[name] ?? registry.find((entry) => entry.name === name)?.color
}
