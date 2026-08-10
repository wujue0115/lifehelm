import { createRouter, createWebHistory } from 'vue-router'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    { path: '/', redirect: '/views/default-list' },
    { path: '/board', redirect: '/views/default-board' },
    { path: '/calendar', redirect: '/views/default-calendar' },
    { path: '/dashboard', redirect: '/views/default-dashboard' },
    {
      path: '/views/:viewId',
      name: 'saved-view',
      component: () => import('@/views/SavedViewRenderer.vue'),
    },
    {
      path: '/views/:viewId/edit',
      name: 'saved-view-edit',
      component: () => import('@/views/SavedViewRenderer.vue'),
    },
    {
      path: '/templates',
      name: 'templates',
      component: () => import('@/views/TemplateManagerView.vue'),
      meta: { titleKey: 'routes.templates' },
    },
    {
      path: '/items/new',
      name: 'item-new',
      component: () => import('@/views/ItemDetailView.vue'),
      meta: { titleKey: 'routes.itemNew' },
    },
    {
      path: '/items/:id',
      name: 'item-detail',
      component: () => import('@/views/ItemDetailView.vue'),
      meta: { titleKey: 'routes.itemDetail' },
    },
  ],
})

export default router
