<script setup lang="ts">
defineProps<{ type: 'edit' | 'duplicate' | 'delete' | 'add' | 'settings' }>()
</script>

<template>
  <svg v-if="type === 'edit'" width="16" height="16" viewBox="0 0 16 16">
    <path d="M0 0h16v16H0z" fill="none" />
    <path
      fill="currentColor"
      d="M14.236 1.764a2.62 2.62 0 0 0-3.707 0L2.657 9.636a2.96 2.96 0 0 0-.772 1.354l-.87 3.386a.5.5 0 0 0 .61.608l3.385-.869a2.95 2.95 0 0 0 1.354-.772l7.872-7.872a2.62 2.62 0 0 0 0-3.707m-3 .707a1.621 1.621 0 1 1 2.293 2.293l-.779.779l-2.293-2.293zM9.75 3.957l2.293 2.293l-6.386 6.386a1.95 1.95 0 0 1-.896.51l-2.567.66l.66-2.567a1.94 1.94 0 0 1 .51-.896z"
    />
  </svg>
  <svg v-else-if="type === 'duplicate'" width="16" height="16" viewBox="0 0 512 512">
    <path d="M0 0h512v512H0z" fill="none" />
    <rect
      width="336"
      height="336"
      x="128"
      y="128"
      fill="none"
      stroke="currentColor"
      stroke-linejoin="round"
      stroke-width="32"
      rx="57"
      ry="57"
    />
    <path
      fill="none"
      stroke="currentColor"
      stroke-linecap="round"
      stroke-linejoin="round"
      stroke-width="32"
      d="m383.5 128l.5-24a56.16 56.16 0 0 0-56-56H112a64.19 64.19 0 0 0-64 64v216a56.16 56.16 0 0 0 56 56h24m168-168v160m80-80H216"
    />
  </svg>
  <svg v-else-if="type === 'delete'" width="16" height="16" viewBox="0 0 24 24">
    <path d="M0 0h24v24H0z" fill="none" />
    <path
      fill="currentColor"
      d="M7 21q-.825 0-1.412-.587T5 19V6H4V4h5V3h6v1h5v2h-1v13q0 .825-.587 1.413T17 21zM17 6H7v13h10zM9 17h2V8H9zm4 0h2V8h-2zM7 6v13z"
    />
  </svg>
  <svg v-else-if="type === 'settings'" width="16" height="16" viewBox="0 0 24 24">
    <path d="M0 0h24v24H0z" fill="none" />
    <path
      fill="currentColor"
      d="M19.14 12.94a7.14 7.14 0 0 0 .06-.94a7.14 7.14 0 0 0-.06-.94l2.03-1.58a.5.5 0 0 0 .12-.64l-1.92-3.32a.5.5 0 0 0-.6-.22l-2.39.96a7.03 7.03 0 0 0-1.63-.94l-.36-2.54a.5.5 0 0 0-.5-.42h-3.84a.5.5 0 0 0-.5.42l-.36 2.54a7.03 7.03 0 0 0-1.63.94l-2.39-.96a.5.5 0 0 0-.6.22L2.65 8.84a.5.5 0 0 0 .12.64L4.8 11.06a7.14 7.14 0 0 0 0 1.88L2.77 14.5a.5.5 0 0 0-.12.64l1.92 3.32a.5.5 0 0 0 .6.22l2.39-.96c.5.4 1.05.71 1.63.94l.36 2.54a.5.5 0 0 0 .5.42h3.84a.5.5 0 0 0 .5-.42l.36-2.54a7.03 7.03 0 0 0 1.63-.94l2.39.96a.5.5 0 0 0 .6-.22l1.92-3.32a.5.5 0 0 0-.12-.64zM12 15.5a3.5 3.5 0 1 1 0-7a3.5 3.5 0 0 1 0 7"
    />
  </svg>
  <svg v-else width="16" height="16" viewBox="0 0 24 24">
    <path d="M0 0h24v24H0z" fill="none" />
    <path
      fill="currentColor"
      d="M12 4a1 1 0 0 1 1 1v6h6a1 1 0 1 1 0 2h-6v6a1 1 0 1 1-2 0v-6H5a1 1 0 1 1 0-2h6V5a1 1 0 0 1 1-1"
    />
  </svg>
</template>
