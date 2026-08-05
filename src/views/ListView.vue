<script setup lang="ts">
import { onMounted } from 'vue'
import { useWorkItemsStore } from '@/stores/workItems'

const store = useWorkItemsStore()

onMounted(() => {
  store.fetchAll()
})
</script>

<template>
  <main class="list-view">
    <h1>清單檢視</h1>
    <p v-if="store.loading">載入中…</p>
    <p v-else-if="store.error" class="error">錯誤：{{ store.error }}</p>
    <template v-else>
      <p class="count">共 {{ store.items.length }} 筆工作項目</p>
      <ul>
        <li v-for="item in store.items" :key="item.id">{{ item.title }}</li>
      </ul>
    </template>
  </main>
</template>

<style scoped>
.list-view {
  padding: 32px;
  font-family: 'D-DIN', Arial, Verdana, sans-serif;
  color: #000000;
}

h1 {
  font-family: 'D-DIN-Bold', 'Arial Narrow', Arial, Verdana, sans-serif;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.96px;
  font-size: 48px;
  line-height: 1.25;
  margin-bottom: 24px;
}

.error {
  color: #000000;
  font-weight: 700;
}

.count {
  margin-bottom: 12px;
}
</style>
