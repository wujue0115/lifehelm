<script setup lang="ts">
import { ref } from 'vue'

const open = ref(false)

const navItems = [
  { path: '/', label: '清單' },
  { path: '/board', label: '看板' },
  { path: '/calendar', label: '行事曆' },
]
</script>

<template>
  <nav class="nav">
    <RouterLink to="/" class="logo type-button-cap">WORK MANAGER</RouterLink>
    <button class="hamburger" type="button" aria-label="選單" @click="open = !open">☰</button>
    <div class="links" :class="{ open }">
      <RouterLink
        v-for="item in navItems"
        :key="item.path"
        :to="item.path"
        class="link type-button-cap"
        @click="open = false"
      >
        {{ item.label }}
      </RouterLink>
    </div>
  </nav>
</template>

<style scoped>
.nav {
  position: sticky;
  top: 0;
  z-index: 10;
  background: var(--color-canvas-night);
  color: var(--color-on-primary);
  padding: 24px 32px;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.logo {
  color: var(--color-on-primary);
  text-decoration: none;
}

.links {
  display: flex;
  gap: 32px;
}

.link {
  color: var(--color-on-primary);
  text-decoration: none;
  opacity: 0.7;
}

.link.router-link-active {
  opacity: 1;
  text-decoration: underline;
}

.hamburger {
  display: none;
  background: none;
  border: none;
  color: var(--color-on-primary);
  font-size: 24px;
  cursor: pointer;
}

@media (max-width: 768px) {
  .hamburger {
    display: block;
  }

  .links {
    display: none;
    position: absolute;
    top: 100%;
    left: 0;
    right: 0;
    flex-direction: column;
    gap: 16px;
    background: var(--color-canvas-night);
    padding: 24px 32px;
  }

  .links.open {
    display: flex;
  }
}
</style>
