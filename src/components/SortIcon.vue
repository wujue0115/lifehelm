<script setup lang="ts">
defineProps<{ direction: 'asc' | 'desc' | 'none' }>()
</script>

<template>
  <svg width="1em" height="1em" viewBox="0 0 48 48" class="sort-icon">
    <path d="M0 0h48v48H0z" fill="none" />
    <path
      class="arrow"
      :class="{ active: direction === 'asc' }"
      fill="currentColor"
      stroke="currentColor"
      stroke-linejoin="round"
      stroke-width="4"
      d="m24 6l-9 13h18z"
    />
    <path
      class="arrow"
      :class="{ active: direction === 'desc' }"
      fill="currentColor"
      stroke="currentColor"
      stroke-linejoin="round"
      stroke-width="4"
      d="m24 42l-9-13h18z"
    />
  </svg>
</template>

<style scoped>
.sort-icon {
  flex-shrink: 0;
}

.arrow {
  opacity: 0.35;
}

.arrow.active {
  opacity: 1;
}
</style>
