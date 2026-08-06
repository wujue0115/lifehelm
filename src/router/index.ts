import { createRouter, createWebHistory } from 'vue-router'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'list',
      component: () => import('@/views/ListView.vue'),
      meta: { title: '清單檢視' },
    },
    {
      path: '/board',
      name: 'board',
      component: () => import('@/views/BoardView.vue'),
      meta: { title: '看板檢視' },
    },
    {
      path: '/calendar',
      name: 'calendar',
      component: () => import('@/views/CalendarView.vue'),
      meta: { title: '行事曆檢視' },
    },
    {
      path: '/dashboard',
      name: 'dashboard',
      component: () => import('@/views/DashboardView.vue'),
      meta: { title: '統計儀表板' },
    },
    {
      path: '/items/new',
      name: 'item-new',
      component: () => import('@/views/ItemDetailView.vue'),
      meta: { title: '新增工作項目' },
    },
    {
      path: '/items/:id',
      name: 'item-detail',
      component: () => import('@/views/ItemDetailView.vue'),
      meta: { title: '編輯工作項目' },
    },
  ],
})

export default router
