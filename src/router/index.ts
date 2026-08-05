import { createRouter, createWebHistory } from 'vue-router'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'list',
      component: () => import('@/views/ListView.vue'),
    },
    {
      path: '/board',
      name: 'board',
      component: () => import('@/views/BoardView.vue'),
    },
    {
      path: '/calendar',
      name: 'calendar',
      component: () => import('@/views/CalendarView.vue'),
    },
    {
      path: '/items/new',
      name: 'item-new',
      component: () => import('@/views/ItemDetailView.vue'),
    },
    {
      path: '/items/:id',
      name: 'item-detail',
      component: () => import('@/views/ItemDetailView.vue'),
    },
  ],
})

export default router
