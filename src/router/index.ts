import { createRouter, createWebHistory } from 'vue-router'
import Dashboard from '@/views/Dashboard.vue'

const router = createRouter({
    history: createWebHistory(),
    routes: [
        {
            path: '/dashboard',
            name: 'dashboard',
            component: Dashboard
        }
    ]
})

export default router;