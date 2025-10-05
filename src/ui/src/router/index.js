import { createRouter, createWebHashHistory } from 'vue-router';
import Settings from '../views/Settings.vue';

const routes = [
  {
    path: '/',
    name: 'Settings',
    component: Settings
  }
];

const router = createRouter({
  history: createWebHashHistory(),
  routes
});

export default router;
