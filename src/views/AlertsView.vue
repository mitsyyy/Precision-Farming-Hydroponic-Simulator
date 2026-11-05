<script setup lang="ts">
import { ref, computed } from 'vue'
import { useHydroponicsStore, type AlertItem } from '@/stores/hydroponics'

const store = useHydroponicsStore()

const filter = ref<'all' | 'warning' | 'info' | 'resolved'>('all')

const filteredAlerts = computed<AlertItem[]>(() => {
  if (filter.value === 'all') return store.alerts
  return store.alerts.filter((a) => a.type === filter.value)
})

const counts = computed(() => ({
  warning: store.alerts.filter((a) => a.type === 'warning').length,
  info: store.alerts.filter((a) => a.type === 'info').length,
  resolved: store.alerts.filter((a) => a.type === 'resolved').length
}))

const summaryCards = computed(() => [
  { label: 'Warnings', count: counts.value.warning, color: '#ff8c00' },
  { label: 'Resolved', count: counts.value.resolved, color: '#22e532' },
  { label: 'Information', count: counts.value.info, color: '#3b9eff' }
])

function getTypeStyle(type: AlertItem['type']) {
  if (type === 'warning') {
    return {
      color: '#ff8c00',
      bg: '#ff8c0010',
      border: '#ff8c0040',
      label: 'WARNING'
    }
  }
  if (type === 'resolved') {
    return {
      color: '#22e532',
      bg: '#22e53210',
      border: '#22e53240',
      label: 'RESOLVED'
    }
  }
  return {
    color: '#3b9eff',
    bg: '#3b9eff10',
    border: '#3b9eff40',
    label: 'INFO'
  }
}
</script>

<template>
  <div class="alerts-page">
    <!-- Top Bar -->
    <div class="alerts-header">
      <div>
        <div class="section-heading">SYSTEM ALERTS & NOTIFICATIONS</div>
        <div class="alerts-sub">Automatic alerts generated when virtual sensors cross safe thresholds</div>
      </div>

      <!-- Filter Buttons -->
      <div class="filter-group">
        <button
          v-for="f in (['all', 'warning', 'info', 'resolved'] as const)"
          :key="f"
          type="button"
          class="filter-btn"
          :class="{ active: filter === f }"
          @click="filter = f"
        >
          {{ f === 'all' ? `All (${store.alerts.length})` : `${f} (${counts[f]})` }}
        </button>
      </div>
    </div>

    <!-- Summary Cards -->
    <div class="summary-grid">
      <div
        v-for="s in summaryCards"
        :key="s.label"
        class="summary-card"
      >
        <div class="summary-label">{{ s.label }}</div>
        <div class="summary-val" :style="{ color: s.color }">{{ s.count }}</div>
      </div>
    </div>

    <!-- Alert Cards List -->
    <div class="alerts-list">
      <div
        v-for="alert in filteredAlerts"
        :key="alert.id"
        class="alert-card"
        :style="{
          backgroundColor: getTypeStyle(alert.type).bg,
          border: `1px solid ${getTypeStyle(alert.type).border}`
        }"
      >
        <div
          class="alert-icon-box"
          :style="{
            backgroundColor: getTypeStyle(alert.type).color + '18',
            border: `1px solid ${getTypeStyle(alert.type).color}`,
            color: getTypeStyle(alert.type).color
          }"
        >
          <!-- Warning SVG -->
          <svg v-if="alert.type === 'warning'" class="alert-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75">
            <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" stroke-linejoin="round" />
            <line x1="12" y1="9" x2="12" y2="13" stroke-linecap="round" />
            <line x1="12" y1="17" x2="12.01" y2="17" stroke-linecap="round" />
          </svg>
          <!-- Resolved SVG -->
          <svg v-else-if="alert.type === 'resolved'" class="alert-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polyline points="20 6 9 17 4 12" stroke-linecap="round" stroke-linejoin="round" />
          </svg>
          <!-- Info SVG -->
          <svg v-else class="alert-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75">
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="16" x2="12" y2="12" stroke-linecap="round" />
            <line x1="12" y1="8" x2="12.01" y2="8" stroke-linecap="round" />
          </svg>
        </div>

        <div class="alert-body">
          <div class="alert-title-row">
            <span class="alert-title">{{ alert.title }}</span>
            <span
              class="alert-badge"
              :style="{
                backgroundColor: getTypeStyle(alert.type).color + '20',
                color: getTypeStyle(alert.type).color
              }"
            >
              {{ getTypeStyle(alert.type).label }}
            </span>
          </div>
          <div class="alert-desc">{{ alert.description }}</div>
        </div>

        <div class="alert-time">{{ alert.time }}</div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.alerts-page {
  display: flex;
  flex-direction: column;
  gap: 20px;
  padding: 18px 22px;
  height: 100%;
  overflow-y: auto;
}

.section-heading {
  font-size: 0.68rem;
  letter-spacing: 0.14em;
  color: var(--text-muted);
  text-transform: uppercase;
}

.alerts-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 12px;
}

.alerts-sub {
  font-size: 0.76rem;
  color: var(--text-secondary);
  margin-top: 2px;
}

.filter-group {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.filter-btn {
  padding: 6px 12px;
  border-radius: var(--radius-md);
  font-size: 0.74rem;
  font-family: var(--font-mono);
  text-transform: capitalize;
  background-color: #112011;
  border: 1px solid var(--border-subtle);
  color: var(--text-muted);
  cursor: pointer;
  transition: all 0.2s ease;
}

.filter-btn.active {
  background-color: #142814;
  border-color: var(--text-neon);
  color: var(--text-neon);
}

/* Summary Row */
.summary-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 12px;
}

.summary-card {
  background-color: var(--bg-panel);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-lg);
  padding: 16px;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.summary-label {
  font-size: 0.85rem;
  color: var(--text-secondary);
}

.summary-val {
  font-size: 1.5rem;
  font-family: var(--font-mono);
  font-weight: 700;
}

/* Alerts List */
.alerts-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.alert-card {
  border-radius: var(--radius-lg);
  padding: 16px 20px;
  display: flex;
  align-items: flex-start;
  gap: 16px;
}

.alert-icon-box {
  width: 32px;
  height: 32px;
  border-radius: var(--radius-md);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  margin-top: 2px;
}

.alert-svg {
  width: 17px;
  height: 17px;
}

.alert-body {
  flex: 1;
  min-width: 0;
}

.alert-title-row {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 4px;
  flex-wrap: wrap;
}

.alert-title {
  font-size: 0.88rem;
  font-weight: 600;
  color: var(--text-primary);
}

.alert-badge {
  font-size: 0.64rem;
  font-family: var(--font-mono);
  padding: 2px 6px;
  border-radius: 4px;
  font-weight: 600;
}

.alert-desc {
  font-size: 0.76rem;
  color: var(--text-secondary);
}

.alert-time {
  font-size: 0.72rem;
  font-family: var(--font-mono);
  color: var(--text-muted);
  flex-shrink: 0;
}

@media (max-width: 900px) {
  .summary-grid {
    grid-template-columns: 1fr;
  }
}
</style>
