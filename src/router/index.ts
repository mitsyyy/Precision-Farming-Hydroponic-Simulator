import { createRouter, createWebHistory } from 'vue-router'
import Dashboard from '../views/Dashboard.vue'
import SimulationView from '../views/SimulationView.vue'
import PlantManagementView from '../views/PlantManagementView.vue'
import AnalyticsView from '../views/AnalyticsView.vue'
import AutomationView from '../views/AutomationView.vue'
import AlertsView from '../views/AlertsView.vue'
import SettingsView from '../views/SettingsView.vue'
import LoginView from '../views/LoginView.vue'
import { useHydroponicsStore } from '../stores/hydroponics'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/login',
      name: 'login',
      component: LoginView,
      meta: { public: true }
    },
    {
      path: '/',
      redirect: '/dashboard'
    },
    {
      path: '/dashboard',
      name: 'dashboard',
      component: Dashboard
    },
    {
      path: '/simulation',
      name: 'simulation',
      component: SimulationView
    },
    {
      path: '/plants',
      name: 'plants',
      component: PlantManagementView
    },
    {
      path: '/analytics',
      name: 'analytics',
      component: AnalyticsView
    },
    {
      path: '/automation',
      name: 'automation',
      component: AutomationView
    },
    {
      path: '/alerts',
      name: 'alerts',
      component: AlertsView
    },
    {
      path: '/settings',
      name: 'settings',
      component: SettingsView
    }
  ]
})

router.beforeEach((to) => {
  const store = useHydroponicsStore()
  if (!to.meta.public && !store.isAuthenticated) {
    return { path: '/login' }
  }
  if (to.path === '/login' && store.isAuthenticated) {
    return { path: '/dashboard' }
  }
  return true
})

export default router
