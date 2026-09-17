import { createRouter, createWebHashHistory } from 'vue-router'

const routes = [
  {
    path: '/',
    component: () => import('../views/ToolLayout.vue')
  },
  {
    path: '/tool/:id?',
    component: () => import('../views/ToolLayout.vue')
  },
  {
    path: '/about',
    component: () => import('../views/About.vue')
  },
  {
    path: '/settings',
    component: () => import('../views/Settings.vue')
  },
  {
    path: '/source-files',
    component: () => import('../views/SourceFiles.vue')
  }
]

const router = createRouter({
  history: createWebHashHistory(),
  routes
})

export default router
