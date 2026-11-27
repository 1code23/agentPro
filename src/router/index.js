import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '../views/HomeView.vue'

const routes = [
  { path: '/', name: 'home', component: HomeView },
  {
    path: '/agent',
    name: 'agent',
    // 懒加载：进入 Agent Demo 页时才加载
    component: () => import('../views/AgentDemoView.vue')
  }
]

export default createRouter({
  history: createWebHistory(),
  routes
})
