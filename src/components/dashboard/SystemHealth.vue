<script setup lang="ts">
import { useHydroponicsStore } from '@/stores/hydroponics'

const store = useHydroponicsStore()
</script>

<template>
  <div class="health-col">
    <div class="health-section">
      <div class="section-title">SYSTEM HEALTH</div>

      <div class="health-card">
        <div
          v-for="item in store.systemHealth"
          :key="item.id"
          class="health-item"
        >
          <div class="health-row">
            <span class="metric-name">{{ item.name }}</span>
            <span class="metric-pct" :class="{ 'warn-text': item.isWarning }">
              {{ item.percentage }}%
            </span>
          </div>

          <div class="health-bar-track">
            <div
              class="health-bar-fill"
              :class="{ 'warn-fill': item.isWarning }"
              :style="{ width: `${item.percentage}%` }"
            ></div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.health-col {
  display: flex;
  flex-direction: column;
  flex-shrink: 0;
}

.section-title {
  font-size: 0.7rem;
  letter-spacing: 0.12em;
  font-weight: 600;
  color: var(--text-muted);
  text-transform: uppercase;
  margin-bottom: 8px;
}

.health-card {
  background-color: var(--bg-card);
  border: 1px solid var(--border-subtle);
  border-radius: 6px;
  padding: 12px 14px;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.health-item {
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.health-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 0.74rem;
}

.metric-name {
  color: var(--text-muted);
  font-weight: 500;
}

.metric-pct {
  font-family: var(--font-mono);
  color: var(--text-neon);
  font-weight: 500;
  font-size: 0.74rem;
}

.metric-pct.warn-text {
  color: var(--color-warn);
}

.health-bar-track {
  width: 100%;
  height: 4px;
  background-color: #142614;
  border-radius: 2px;
  overflow: hidden;
}

.health-bar-fill {
  height: 100%;
  background-color: var(--text-neon);
  border-radius: 2px;
  transition: width 0.4s ease;
}

.health-bar-fill.warn-fill {
  background-color: var(--color-warn);
}
</style>
