<script setup lang="ts">
defineProps<{ type: 'list' | 'board' | 'calendar' | 'dashboard' }>()
</script>

<template>
  <svg
    v-if="type === 'list'"
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
    v-else-if="type === 'board'"
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
    v-else-if="type === 'calendar'"
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
    v-else
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
</template>
