<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import navigationData from '@/data/navigation.json'
import { useHydroponicsStore } from '@/stores/hydroponics'

interface NavItem {
  id: string
  label: string
  icon: string
  path: string
  badge?: number
}

const router = useRouter()
const route = useRoute()
const store = useHydroponicsStore()

const navItems = ref<NavItem[]>(navigationData)
const isHovered = ref(false)

const currentPath = computed(() => route.path)

function navigateTo(item: NavItem) {
  router.push(item.path)
}

function getBadgeCount(item: NavItem): number {
  if (item.id === 'alerts') {
    return store.warningCount
  }
  return item.badge || 0
}

function handleLogout() {
  store.logout()
  router.push('/login')
}
</script>

<template>
  <aside
    class="sidebar-rail"
    :class="{ expanded: isHovered }"
    @mouseenter="isHovered = true"
    @mouseleave="isHovered = false"
  >
    <!-- Top Logo Slot -->
    <div class="logo-slot" title="FARMSIM | Precision Farming & Automated Hydroponic Simulator" @click="router.push('/dashboard')">
      <div class="logo-icon-wrap">
        <svg class="plant-logo" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75">
          <path d="M7 21h10" stroke-linecap="round" />
          <path d="M6 15h12l-1.5 6h-9z" stroke-linejoin="round" />
          <path d="M12 15V7" stroke-linecap="round" />
          <path d="M12 10c-3 0-5-2-5-5 3 0 5 2 5 5z" stroke-linejoin="round" />
          <path d="M12 8c3 0 5-2 5-5-3 0-5 2-5 5z" stroke-linejoin="round" />
          <circle cx="12" cy="3" r="1.5" fill="currentColor" stroke="none" />
        </svg>
      </div>
      <div class="logo-text-wrap">
        <span class="logo-title">FARMSIM</span>
        <span class="logo-version">v2.4.1</span>
      </div>
    </div>

    <!-- Navigation Items -->
    <nav class="nav-list">
      <button
        v-for="item in navItems"
        :key="item.id"
        type="button"
        class="nav-btn"
        :class="{ active: currentPath === item.path }"
        :title="item.label"
        @click="navigateTo(item)"
      >
        <span class="btn-icon">
          <!-- Grid / Dashboard (Icon 1) -->
          <svg v-if="item.icon === 'grid'" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75">
            <rect x="3" y="3" width="7" height="7" rx="1.5" />
            <rect x="14" y="3" width="7" height="7" rx="1.5" />
            <rect x="14" y="14" width="7" height="7" rx="1.5" />
            <rect x="3" y="14" width="7" height="7" rx="1.5" />
          </svg>

          <!-- Gauge / Simulation (Icon 2) -->
          <svg v-else-if="item.icon === 'gauge'" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75">
            <path d="M12 14l3-3" stroke-linecap="round" />
            <path d="M3.34 17a10 10 0 1 1 17.32 0" stroke-linecap="round" />
            <circle cx="12" cy="14" r="2" fill="currentColor" stroke="none" />
          </svg>

          <!-- Plant Mgmt (Icon 3) -->
          <svg v-else-if="item.icon === 'plant'" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75">
            <path d="M11 20A7 7 0 0 1 4 13V9a5 5 0 0 1 5-5h2a7 7 0 0 1 7 7v4a5 5 0 0 1-5 5h-2z" stroke-linecap="round" stroke-linejoin="round" />
            <path d="M9 13c1.5 1.5 3 2 5 2" stroke-linecap="round" />
            <path d="M11 20v-7" stroke-linecap="round" />
          </svg>

          <!-- Analytics (Icon 4) -->
          <svg v-else-if="item.icon === 'analytics'" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75">
            <polyline points="22 7 13.5 15.5 8.5 10.5 2 17" stroke-linecap="round" stroke-linejoin="round" />
            <circle cx="22" cy="7" r="1.5" fill="currentColor" stroke="none" />
            <circle cx="13.5" cy="15.5" r="1.5" fill="currentColor" stroke="none" />
            <circle cx="8.5" cy="10.5" r="1.5" fill="currentColor" stroke="none" />
            <circle cx="2" cy="17" r="1.5" fill="currentColor" stroke="none" />
          </svg>

          <!-- Automation (Icon 5) -->
          <svg v-else-if="item.icon === 'automation'" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75">
            <circle cx="12" cy="12" r="10" />
            <polygon points="10 8 16 12 10 16 10 8" fill="currentColor" stroke="none" />
          </svg>

          <!-- Alerts (Icon 6) -->
          <svg v-else-if="item.icon === 'alerts'" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75">
            <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" stroke-linejoin="round" />
            <line x1="12" y1="9" x2="12" y2="13" stroke-linecap="round" />
            <line x1="12" y1="17" x2="12.01" y2="17" stroke-linecap="round" />
          </svg>

          <!-- Settings (Icon 7) -->
          <svg v-else-if="item.icon === 'settings'" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75">
            <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" stroke-linejoin="round" />
            <circle cx="12" cy="12" r="3" />
          </svg>
        </span>

        <span class="btn-label">
          {{ item.label }}
        </span>

        <span v-if="getBadgeCount(item) > 0" class="nav-badge">
          {{ getBadgeCount(item) }}
        </span>
      </button>
    </nav>

    <!-- User Profile Slot with Functional Logout Button -->
    <div class="user-profile-slot">
      <div class="user-avatar">A</div>
      <div class="user-details">
        <div class="user-name">ADMIN</div>
        <div class="user-role">System Administrator</div>
      </div>
      <button
        type="button"
        class="logout-btn"
        title="Logout Admin Session"
        @click="handleLogout"
      >
        <svg class="logout-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75">
          <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" stroke-linecap="round" stroke-linejoin="round" />
          <polyline points="16 17 21 12 16 7" stroke-linecap="round" stroke-linejoin="round" />
          <line x1="21" y1="12" x2="9" y2="12" stroke-linecap="round" stroke-linejoin="round" />
        </svg>
      </button>
    </div>
  </aside>
</template>

<style scoped>
.sidebar-rail {
  width: 62px;
  background-color: var(--bg-darkest);
  border-right: 1px solid var(--border-subtle);
  display: flex;
  flex-direction: column;
  height: 100vh;
  user-select: none;
  z-index: 50;
  transition: width 0.32s cubic-bezier(0.4, 0, 0.2, 1);
  overflow: hidden;
  white-space: nowrap;
  flex-shrink: 0;
  will-change: width;
}

.sidebar-rail:hover,
.sidebar-rail.expanded {
  width: 225px;
}

/* Logo Slot */
.logo-slot {
  width: 100%;
  height: 48px;
  min-height: 48px;
  display: flex;
  align-items: center;
  border-bottom: 1px solid var(--border-subtle);
  color: var(--text-neon);
  cursor: pointer;
  padding: 0 18px;
  gap: 12px;
  overflow: hidden;
  flex-shrink: 0;
}

.logo-icon-wrap {
  width: 26px;
  height: 26px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.plant-logo {
  width: 24px;
  height: 24px;
}

.logo-text-wrap {
  display: flex;
  flex-direction: column;
  justify-content: center;
  overflow: hidden;
  opacity: 0;
  transform: translateX(-10px);
  transition: opacity 0.25s cubic-bezier(0.4, 0, 0.2, 1), transform 0.25s cubic-bezier(0.4, 0, 0.2, 1);
  white-space: nowrap;
}

.sidebar-rail:hover .logo-text-wrap,
.sidebar-rail.expanded .logo-text-wrap {
  opacity: 1;
  transform: translateX(0);
}

.logo-title {
  font-size: 0.78rem;
  font-weight: 700;
  letter-spacing: 0.14em;
  color: var(--text-primary);
  line-height: 1.1;
}

.logo-version {
  font-size: 0.64rem;
  font-family: var(--font-mono);
  color: var(--text-muted);
  line-height: 1.2;
}

/* Navigation List */
.nav-list {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  padding: 20px 0;
  width: 100%;
  flex: 1;
  overflow-y: auto;
  overflow-x: hidden;
}

.nav-btn {
  width: calc(100% - 20px);
  margin: 0 10px;
  height: 42px;
  display: flex;
  align-items: center;
  justify-content: flex-start;
  padding: 0 10px;
  background: transparent;
  border: 1px solid transparent;
  border-radius: 6px;
  cursor: pointer;
  color: var(--text-muted);
  transition: background-color 0.2s ease, border-color 0.2s ease, color 0.2s ease;
  overflow: hidden;
  flex-shrink: 0;
  gap: 12px;
}

.btn-icon {
  width: 22px;
  height: 22px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  transition: color 0.2s ease;
}

.btn-icon svg {
  width: 21px;
  height: 21px;
}

.btn-label {
  font-size: 0.82rem;
  font-weight: 500;
  letter-spacing: 0.03em;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  opacity: 0;
  transform: translateX(-10px);
  transition: opacity 0.25s cubic-bezier(0.4, 0, 0.2, 1), transform 0.25s cubic-bezier(0.4, 0, 0.2, 1);
  color: var(--text-secondary);
  pointer-events: none;
}

.sidebar-rail:hover .btn-label,
.sidebar-rail.expanded .btn-label {
  opacity: 1;
  transform: translateX(0);
  pointer-events: auto;
}

.nav-badge {
  margin-left: auto;
  background-color: var(--color-warn);
  color: #060c06;
  font-size: 0.65rem;
  font-weight: 700;
  width: 17px;
  height: 17px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0;
  transform: scale(0.7);
  transition: opacity 0.25s cubic-bezier(0.4, 0, 0.2, 1), transform 0.25s cubic-bezier(0.4, 0, 0.2, 1);
  flex-shrink: 0;
}

.sidebar-rail:hover .nav-badge,
.sidebar-rail.expanded .nav-badge {
  opacity: 1;
  transform: scale(1);
}

/* Hover & Active States */
.nav-btn:hover {
  color: var(--text-neon);
  background-color: #0d1a0d;
  border-color: var(--border-subtle);
}

.nav-btn:hover .btn-label {
  color: var(--text-neon);
}

.nav-btn.active {
  color: var(--text-neon);
  background-color: #0f200f;
  border-color: #1f421f;
}

.nav-btn.active .btn-label {
  color: var(--text-neon);
  font-weight: 600;
}

/* User Profile Slot */
.user-profile-slot {
  width: 100%;
  border-top: 1px solid var(--border-subtle);
  padding: 12px 16px;
  display: flex;
  align-items: center;
  gap: 10px;
  flex-shrink: 0;
  overflow: hidden;
}

.user-avatar {
  width: 28px;
  height: 28px;
  border-radius: 6px;
  background-color: #122412;
  border: 1px solid #243e24;
  color: var(--text-neon);
  font-size: 0.74rem;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.user-details {
  display: flex;
  flex-direction: column;
  flex: 1;
  min-width: 0;
  overflow: hidden;
  opacity: 0;
  transform: translateX(-10px);
  transition: opacity 0.25s cubic-bezier(0.4, 0, 0.2, 1), transform 0.25s cubic-bezier(0.4, 0, 0.2, 1);
}

.sidebar-rail:hover .user-details,
.sidebar-rail.expanded .user-details {
  opacity: 1;
  transform: translateX(0);
}

.user-name {
  font-size: 0.72rem;
  font-weight: 600;
  color: #c8e6c8;
  letter-spacing: 0.06em;
  line-height: 1.2;
}

.user-role {
  font-size: 0.62rem;
  color: var(--text-muted);
  line-height: 1.2;
  overflow: hidden;
  text-overflow: ellipsis;
}

.logout-btn {
  width: 28px;
  height: 28px;
  border-radius: 5px;
  background-color: #0e1c0e;
  border: 1px solid var(--border-subtle);
  color: var(--text-secondary);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  flex-shrink: 0;
  opacity: 0;
  transform: scale(0.8);
  transition: opacity 0.22s ease, transform 0.22s ease, border-color 0.15s ease, color 0.15s ease;
}

.sidebar-rail:hover .logout-btn,
.sidebar-rail.expanded .logout-btn {
  opacity: 1;
  transform: scale(1);
}

.logout-btn:hover {
  border-color: var(--color-warn);
  color: var(--color-warn);
  background-color: rgba(255, 140, 0, 0.08);
}

.logout-svg {
  width: 15px;
  height: 15px;
}
</style>
