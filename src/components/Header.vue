<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRoute } from 'vue-router'
import systemData from '@/data/system.json'
import { useHydroponicsStore } from '@/stores/hydroponics'

const store = useHydroponicsStore()
const route = useRoute()
const isSimulationRoute = computed(() => route.path === '/simulation' || route.name === 'simulation')
const appTitle = ref(`FARMSIM | ${systemData.title}`)

const currentTime = ref(systemData.initialTime || '22:07:23')
const uptimeString = ref(systemData.initialUptime || '00d 00h 00m')

let timer: number | null = null
const startTime = Date.now()

function updateClock() {
  const now = new Date()
  const hours = String(now.getHours()).padStart(2, '0')
  const minutes = String(now.getMinutes()).padStart(2, '0')
  const seconds = String(now.getSeconds()).padStart(2, '0')
  currentTime.value = `${hours}:${minutes}:${seconds}`

  const elapsedSec = Math.floor((Date.now() - startTime) / 1000)
  const d = Math.floor(elapsedSec / 86400)
  const h = Math.floor((elapsedSec % 86400) / 3600)
  const m = Math.floor((elapsedSec % 3600) / 60)
  uptimeString.value = `${String(d).padStart(2, '0')}d ${String(h).padStart(2, '0')}h ${String(m).padStart(2, '0')}m`
}

onMounted(() => {
  updateClock()
  timer = window.setInterval(updateClock, 1000)
})

onUnmounted(() => {
  if (timer) clearInterval(timer)
})
</script>

<template>
  <header class="app-header">
    <div class="header-left">
      <h1 class="title">{{ appTitle }}</h1>
    </div>

    <!-- Interactive Simulation Time & Speed Controller (Hidden on Simulation Page to avoid duplication) -->
    <div v-if="!isSimulationRoute" class="sim-controller-bar">
      <!-- Pause / Resume Button -->
      <button
        type="button"
        class="ctrl-btn"
        :class="store.simRunning ? 'btn-running' : 'btn-paused'"
        :title="store.simRunning ? 'Pause Simulation' : 'Resume Simulation'"
        @click="store.setSimRunning(!store.simRunning)"
      >
        <svg v-if="store.simRunning" class="ctrl-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75">
          <rect x="6" y="4" width="4" height="16" rx="1" />
          <rect x="14" y="4" width="4" height="16" rx="1" />
        </svg>
        <svg v-else class="ctrl-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75">
          <polygon points="5 3 19 12 5 21 5 3" stroke-linejoin="round" />
        </svg>
        <span>{{ store.simRunning ? 'PAUSE' : 'RESUME' }}</span>
      </button>

      <!-- Speed Selector (1x, 5x, 10x) -->
      <div class="speed-group" title="Simulation Speed Multiplier">
        <button
          v-for="spd in ([1, 5, 10] as const)"
          :key="spd"
          type="button"
          class="speed-btn"
          :class="{ active: store.simSpeed === spd }"
          @click="store.setSimSpeed(spd)"
        >
          {{ spd }}x
        </button>
      </div>

      <!-- +1 Day (Advance Growth Stage) Button -->
      <button
        type="button"
        class="ctrl-btn btn-advance-day"
        title="Advance Active Grow Zone +1 Day & Progress Growth Stage"
        @click="store.advanceDay()"
      >
        <svg class="ctrl-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75">
          <polyline points="13 17 18 12 13 7" stroke-linecap="round" stroke-linejoin="round" />
          <polyline points="6 17 11 12 6 7" stroke-linecap="round" stroke-linejoin="round" />
        </svg>
        <span>+1 DAY (STAGE)</span>
      </button>
    </div>

    <div class="header-right">
      <div class="status-item">
        <span class="label">SYSTEM:</span>
        <span class="online-indicator" :class="{ paused: !store.simRunning }">
          <span class="pulse-dot" :class="{ paused: !store.simRunning }"></span>
          {{ store.simRunning ? 'ONLINE' : 'PAUSED' }}
        </span>
      </div>

      <span class="divider">|</span>

      <div class="status-item">
        <span class="label">UPTIME:</span>
        <span class="uptime-val">{{ uptimeString }}</span>
      </div>

      <span class="divider">|</span>

      <div class="clock-display">
        {{ currentTime }}
      </div>
    </div>
  </header>
</template>

<style scoped>
.app-header {
  height: 48px;
  min-height: 48px;
  background-color: var(--bg-darkest);
  border-bottom: 1px solid var(--border-subtle);
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 20px;
  user-select: none;
  width: 100%;
  flex-shrink: 0;
  gap: 12px;
}

.title {
  font-size: 0.76rem;
  letter-spacing: 0.12em;
  font-weight: 500;
  color: var(--text-muted);
  text-transform: uppercase;
  white-space: nowrap;
}

/* Simulation Controller Bar */
.sim-controller-bar {
  display: flex;
  align-items: center;
  gap: 8px;
}

.ctrl-btn {
  height: 28px;
  padding: 0 10px;
  border-radius: 4px;
  font-family: var(--font-mono);
  font-size: 0.68rem;
  font-weight: 600;
  letter-spacing: 0.05em;
  display: inline-flex;
  align-items: center;
  gap: 5px;
  cursor: pointer;
  transition: border-color 0.15s ease, background-color 0.15s ease, color 0.15s ease;
}

.ctrl-svg {
  width: 13px;
  height: 13px;
}

.btn-running {
  background-color: #0e1c0e;
  border: 1px solid var(--border-subtle);
  color: var(--text-secondary);
}

.btn-running:hover {
  border-color: var(--color-warn);
  color: var(--color-warn);
}

.btn-paused {
  background-color: rgba(255, 140, 0, 0.12);
  border: 1px solid var(--color-warn);
  color: var(--color-warn);
}

.speed-group {
  display: inline-flex;
  border: 1px solid var(--border-subtle);
  border-radius: 4px;
  overflow: hidden;
  background-color: #091209;
}

.speed-btn {
  height: 26px;
  padding: 0 8px;
  background: transparent;
  border: none;
  border-right: 1px solid var(--border-subtle);
  color: var(--text-muted);
  font-family: var(--font-mono);
  font-size: 0.68rem;
  font-weight: 600;
  cursor: pointer;
  transition: background-color 0.15s ease, color 0.15s ease;
}

.speed-btn:last-child {
  border-right: none;
}

.speed-btn:hover {
  color: var(--text-primary);
}

.speed-btn.active {
  background-color: #142b14;
  color: var(--text-neon);
}

.btn-advance-day {
  background-color: #102210;
  border: 1px solid #214521;
  color: var(--text-neon);
}

.btn-advance-day:hover {
  background-color: #163016;
  border-color: var(--text-neon);
}

.header-right {
  display: flex;
  align-items: center;
  gap: 14px;
  font-family: var(--font-mono);
  font-size: 0.78rem;
  white-space: nowrap;
}

.status-item {
  display: flex;
  align-items: center;
  gap: 6px;
}

.label {
  color: var(--text-muted);
  font-size: 0.74rem;
}

.online-indicator {
  display: flex;
  align-items: center;
  gap: 6px;
  color: var(--text-neon);
  font-weight: 600;
  letter-spacing: 0.06em;
}

.online-indicator.paused {
  color: var(--color-warn);
}

.pulse-dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background-color: var(--text-neon);
  display: inline-block;
}

.pulse-dot.paused {
  background-color: var(--color-warn);
}

.uptime-val {
  color: var(--text-secondary);
  letter-spacing: 0.04em;
}

.divider {
  color: var(--border-subtle);
  font-weight: 300;
}

.clock-display {
  color: var(--text-neon);
  font-weight: 600;
  letter-spacing: 0.08em;
  font-size: 0.84rem;
}

@media (max-width: 1180px) {
  .title {
    display: none;
  }
}
</style>
