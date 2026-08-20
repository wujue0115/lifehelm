<script setup lang="ts">
import { computed } from 'vue'
import type { ViewTemplateType } from '@/types/view'

// `icon` is the user's explicit picker choice (ViewIconPicker) — falls back
// to a icon derived from templateType when unset, so a view keeps a
// sensible default until someone opens the picker and changes it. Must stay
// a computed, not a plain `const` snapshot — the same component instance
// re-renders with a new `icon` prop the moment the picker's v-model changes
// (ViewRenderer's draftIcon), and a one-shot const would freeze on
// whatever `icon` was at mount.
const props = defineProps<{ icon?: string; templateType: ViewTemplateType }>()
const resolved = computed(() => props.icon || props.templateType)
</script>

<template>
  <svg
    v-if="resolved === 'list'"
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
  <svg
    v-else-if="resolved === 'board'"
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
  <svg
    v-else-if="resolved === 'calendar'"
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
  <svg
    v-else-if="resolved === 'dashboard'"
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
  <svg
    v-else-if="resolved === 'star'"
    viewBox="0 0 20 20"
    width="18"
    height="18"
    fill="none"
    stroke="currentColor"
    stroke-width="1.4"
    stroke-linejoin="round"
  >
    <path d="M10 2.5l1.9 5.1 5.6.3-4.4 3.4 1.5 5.4L10 13.6l-4.6 3.1 1.5-5.4-4.4-3.4 5.6-.3z" />
  </svg>
  <svg
    v-else-if="resolved === 'flag'"
    viewBox="0 0 20 20"
    width="18"
    height="18"
    fill="none"
    stroke="currentColor"
    stroke-width="1.6"
    stroke-linecap="round"
    stroke-linejoin="round"
  >
    <line x1="4" y1="2.5" x2="4" y2="17.5" />
    <path d="M4 3h10l-2.5 3L14 9H4" />
  </svg>
  <svg
    v-else-if="resolved === 'folder'"
    viewBox="0 0 20 20"
    width="18"
    height="18"
    fill="none"
    stroke="currentColor"
    stroke-width="1.6"
    stroke-linejoin="round"
  >
    <path d="M2.5 6.5h5l1.5 2h8.5v8a1 1 0 0 1-1 1h-13a1 1 0 0 1-1-1v-9a1 1 0 0 1 1-1Z" />
  </svg>
  <svg
    v-else-if="resolved === 'tag'"
    viewBox="0 0 20 20"
    width="18"
    height="18"
    fill="none"
    stroke="currentColor"
    stroke-width="1.6"
    stroke-linejoin="round"
  >
    <path d="M11 3h4a2 2 0 0 1 2 2v4L8.5 17.5a1.5 1.5 0 0 1-2.1 0l-4-4a1.5 1.5 0 0 1 0-2.1L11 3Z" />
    <circle cx="14" cy="6.5" r="1" fill="currentColor" stroke="none" />
  </svg>
  <svg
    v-else-if="resolved === 'bolt'"
    viewBox="0 0 20 20"
    width="18"
    height="18"
    fill="none"
    stroke="currentColor"
    stroke-width="1.6"
    stroke-linejoin="round"
  >
    <path d="M11 2.5 4 11.5h5L9 17.5l7-9h-5Z" />
  </svg>
  <svg
    v-else-if="resolved === 'heart'"
    viewBox="0 0 20 20"
    width="18"
    height="18"
    fill="none"
    stroke="currentColor"
    stroke-width="1.6"
    stroke-linejoin="round"
  >
    <path
      d="M10 17s-6.5-4.2-8.2-8.3C.7 5.9 2.4 3 5.3 3c1.8 0 3.2 1 4.7 2.8C11.5 4 12.9 3 14.7 3c2.9 0 4.6 2.9 3.5 5.7C16.5 12.8 10 17 10 17Z"
    />
  </svg>
  <svg
    v-else-if="resolved === 'bookmark'"
    viewBox="0 0 20 20"
    width="18"
    height="18"
    fill="none"
    stroke="currentColor"
    stroke-width="1.6"
    stroke-linejoin="round"
  >
    <path d="M5.5 3h9a1 1 0 0 1 1 1v13l-5.5-3.5L4.5 17V4a1 1 0 0 1 1-1Z" />
  </svg>
  <svg
    v-else-if="resolved === 'target'"
    viewBox="0 0 20 20"
    width="18"
    height="18"
    fill="none"
    stroke="currentColor"
    stroke-width="1.6"
  >
    <circle cx="10" cy="10" r="7" />
    <circle cx="10" cy="10" r="3.6" />
    <circle cx="10" cy="10" r="0.8" fill="currentColor" stroke="none" />
  </svg>
  <svg
    v-else-if="resolved === 'clock'"
    viewBox="0 0 20 20"
    width="18"
    height="18"
    fill="none"
    stroke="currentColor"
    stroke-width="1.6"
    stroke-linecap="round"
    stroke-linejoin="round"
  >
    <circle cx="10" cy="10" r="7" />
    <path d="M10 6v4l3 2" />
  </svg>
  <svg
    v-else-if="resolved === 'inbox'"
    viewBox="0 0 20 20"
    width="18"
    height="18"
    fill="none"
    stroke="currentColor"
    stroke-width="1.6"
    stroke-linecap="round"
    stroke-linejoin="round"
  >
    <path d="M2.5 5a1 1 0 0 1 1-1h13a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1h-13a1 1 0 0 1-1-1V5Z" />
    <path d="M2.5 11h4l1.7 2.2h3.6L13.5 11h4" />
  </svg>
  <svg
    v-else-if="resolved === 'layers'"
    viewBox="0 0 20 20"
    width="18"
    height="18"
    fill="none"
    stroke="currentColor"
    stroke-width="1.6"
    stroke-linejoin="round"
  >
    <path d="M10 3 17 7.5 10 12 3 7.5Z" />
    <path d="M3 10.5 10 15 17 10.5" stroke-linecap="round" />
    <path d="M3 13.5 10 18 17 13.5" stroke-linecap="round" />
  </svg>
  <svg
    v-else-if="resolved === 'user'"
    viewBox="0 0 20 20"
    width="18"
    height="18"
    fill="none"
    stroke="currentColor"
    stroke-width="1.6"
    stroke-linecap="round"
    stroke-linejoin="round"
  >
    <circle cx="10" cy="6.5" r="3" />
    <path d="M3.5 17c0-3.6 3-6 6.5-6s6.5 2.4 6.5 6" />
  </svg>
  <svg
    v-else-if="resolved === 'lightbulb'"
    viewBox="0 0 20 20"
    width="18"
    height="18"
    fill="none"
    stroke="currentColor"
    stroke-width="1.6"
    stroke-linecap="round"
    stroke-linejoin="round"
  >
    <path
      d="M10 2.5a5 5 0 0 0-3 9c.6.5 1 1.1 1 1.9v.6h4v-.6c0-.8.4-1.4 1-1.9a5 5 0 0 0-3-9Z"
    />
    <line x1="8.3" y1="16.5" x2="11.7" y2="16.5" />
  </svg>
  <svg
    v-else-if="resolved === 'pin'"
    viewBox="0 0 20 20"
    width="18"
    height="18"
    fill="none"
    stroke="currentColor"
    stroke-width="1.6"
    stroke-linejoin="round"
  >
    <path
      d="M10 2.5c-3 0-5.5 2.4-5.5 5.5 0 4.1 5.5 9.5 5.5 9.5s5.5-5.4 5.5-9.5c0-3.1-2.5-5.5-5.5-5.5Z"
    />
    <circle cx="10" cy="8" r="1.8" fill="currentColor" stroke="none" />
  </svg>
  <svg
    v-else-if="resolved === 'clipboard'"
    viewBox="0 0 20 20"
    width="18"
    height="18"
    fill="none"
    stroke="currentColor"
    stroke-width="1.6"
    stroke-linecap="round"
    stroke-linejoin="round"
  >
    <rect x="4" y="3.5" width="12" height="14" rx="1.5" />
    <rect x="7.5" y="2" width="5" height="3" rx="1" />
    <line x1="6.5" y1="9" x2="13.5" y2="9" />
    <line x1="6.5" y1="12.5" x2="13.5" y2="12.5" />
  </svg>
  <svg
    v-else-if="resolved === 'globe'"
    viewBox="0 0 20 20"
    width="18"
    height="18"
    fill="none"
    stroke="currentColor"
    stroke-width="1.6"
  >
    <circle cx="10" cy="10" r="7" />
    <ellipse cx="10" cy="10" rx="3" ry="7" />
    <line x1="3" y1="10" x2="17" y2="10" />
  </svg>
</template>
