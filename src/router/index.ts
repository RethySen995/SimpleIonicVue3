import { createRouter, createWebHistory } from '@ionic/vue-router';
import { RouteRecordRaw } from 'vue-router';

const routes: Array<RouteRecordRaw> = [
  { path: '/home',name: 'Home', component: ()=> import('@/views/home/HomePage.vue')},
  { path: '/login',name: 'Login',component: ()=> import('@/views/login/LoginPage.vue')},
  { path: '/mappage',name: 'map-page',component: ()=> import('@/views/map/map-page.vue')},
  { path: '/', redirect: '/home'}
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

export default router
