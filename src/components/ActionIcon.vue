<script setup lang="ts">
import { useId } from 'vue'

defineProps<{ type: 'edit' | 'duplicate' | 'delete' }>()

// SVG <mask> ids must be unique per document — this icon can render many times
// on one page (e.g. once per row in the templates table), so a hardcoded id
// would collide across instances.
const maskId = useId()
</script>

<template>
  <svg v-if="type === 'edit'" width="16" height="16" viewBox="0 0 24 24">
    <path d="M0 0h24v24H0z" fill="none" />
    <mask :id="maskId" width="15" height="15" x="4" y="5" fill="#000" maskUnits="userSpaceOnUse">
      <path fill="#fff" d="M4 5h15v15H4z" />
      <path
        d="m13.586 7.414l-7.194 7.194c-.195.195-.292.292-.36.41c-.066.119-.1.252-.166.52l-.664 2.654c-.09.36-.135.541-.035.641s.28.055.641-.035l2.655-.664c.267-.066.4-.1.518-.167c.119-.067.216-.164.41-.359l7.195-7.194c.667-.666 1-1 1-1.414s-.333-.748-1-1.414l-.172-.172c-.667-.666-1-1-1.414-1s-.748.334-1.414 1"
      />
    </mask>
    <g fill="none">
      <path
        stroke="currentColor"
        stroke-width="2"
        d="m13.586 7.414l-7.194 7.194c-.195.195-.292.292-.36.41c-.066.119-.1.252-.166.52l-.664 2.654c-.09.36-.135.541-.035.641s.28.055.641-.035l2.655-.664c.267-.066.4-.1.518-.167c.119-.067.216-.164.41-.359l7.195-7.194c.667-.666 1-1 1-1.414s-.333-.748-1-1.414l-.172-.172c-.667-.666-1-1-1.414-1s-.748.334-1.414 1Z"
        :mask="`url(#${maskId})`"
      />
      <path fill="currentColor" d="m12.5 7.5l3-2l3 3l-2 3z" />
    </g>
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
  <svg v-else width="16" height="16" viewBox="0 0 24 24">
    <path d="M0 0h24v24H0z" fill="none" />
    <path
      fill="currentColor"
      d="M7 21q-.825 0-1.412-.587T5 19V6H4V4h5V3h6v1h5v2h-1v13q0 .825-.587 1.413T17 21zM17 6H7v13h10zM9 17h2V8H9zm4 0h2V8h-2zM7 6v13z"
    />
  </svg>
</template>
