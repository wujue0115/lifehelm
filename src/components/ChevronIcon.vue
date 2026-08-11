<script setup lang="ts">
defineProps<{ direction: 'prev' | 'next' | 'back' }>()
</script>

<template>
  <svg
    width="7"
    height="16"
    viewBox="0 0 7 16"
    class="chevron-icon"
    :class="{ next: direction === 'next' }"
  >
    <path d="M0 0h7v16H0z" fill="none" />
    <path
      fill="currentColor"
      d="M5.5 13a.47.47 0 0 1-.35-.15l-4.5-4.5c-.2-.2-.2-.51 0-.71l4.5-4.49c.2-.2.51-.2.71 0s.2.51 0 .71L1.71 8l4.15 4.15c.2.2.2.51 0 .71c-.1.1-.23.15-.35.15Z"
    />
  </svg>
</template>

<style scoped>
.chevron-icon.next {
  transform: scaleX(-1);
}
</style>
