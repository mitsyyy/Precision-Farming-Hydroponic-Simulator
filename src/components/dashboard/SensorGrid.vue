<script setup lang="ts">
import { useHydroponicsStore } from '@/stores/hydroponics'

const store = useHydroponicsStore()
</script>

<template>
  <div class="sensor-grid">
    <div
      v-for="card in store.metrics"
      :key="card.id"
      class="sensor-card"
      :class="{ warning: card.isWarning }"
    >
      <!-- Top Row: Metric Title & Circular Arc Gauge -->
      <div class="card-header">
        <span class="metric-title">{{ card.title }}</span>

        <div class="gauge-container">
          <svg class="circular-gauge" viewBox="0 0 36 36">
            <circle
              class="gauge-track"
              cx="18"
              cy="18"
              r="14"
              fill="none"
              stroke-width="2.5"
            />
            <circle
              class="gauge-arc"
              :class="{ 'warn-arc': card.isWarning }"
              cx="18"
              cy="18"
              r="14"
              fill="none"
              stroke-width="2.5"
              stroke-linecap="round"
              stroke-dasharray="87.96"
              :stroke-dashoffset="87.96 - (87.96 * card.percentage) / 100"
              transform="rotate(-90 18 18)"
            />
          </svg>
        </div>
      </div>

      <!-- Value Row: Large Number + Unit -->
      <div class="value-row">
        <span class="numeric-val" :class="{ 'warn-text': card.isWarning }">
          {{ card.value }}
        </span>
        <span class="unit-text" :class="{ 'warn-text': card.isWarning }">
          {{ card.unit }}
        </span>
      </div>

      <!-- Sparkline Graph -->
      <div class="sparkline-container">
        <svg class="sparkline-svg" viewBox="0 0 100 28" preserveAspectRatio="none">
          <path
            :d="card.sparkline || 'M 2 24 L 30 18 L 60 22 L 96 6'"
            fill="none"
            class="spark-stroke"
            :class="{ 'warn-stroke': card.isWarning }"
          />
        </svg>
      </div>

      <!-- Footer: Optimal range & Status badge -->
      <div class="card-footer">
        <span class="optimal-range">{{ card.optimal }}</span>
        <span class="status-badge" :class="card.isWarning ? 'badge-warn' : 'badge-ok'">
          {{ card.status }}
        </span>
      </div>
    </div>
  </div>
</template>

<style scoped>
.sensor-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  grid-template-rows: repeat(2, 1fr);
  gap: 14px;
  flex: 1;
  min-height: 0;
}

.sensor-card {
  background-color: var(--bg-card);
  border: 1px solid var(--border-subtle);
  border-radius: 6px;
  padding: 14px 16px;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  position: relative;
  transition: border-color 0.15s ease, background-color 0.15s ease;
}

.sensor-card:hover {
  background-color: var(--bg-card-hover);
  border-color: var(--border-dim);
}

.sensor-card.warning {
  border-color: var(--color-warn-border);
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
}

.metric-title {
  font-size: 0.7rem;
  letter-spacing: 0.1em;
  font-weight: 500;
  color: var(--text-muted);
  text-transform: uppercase;
}

.gauge-container {
  width: 34px;
  height: 34px;
}

.circular-gauge {
  width: 100%;
  height: 100%;
}

.gauge-track {
  stroke: #142614;
}

.gauge-arc {
  stroke: var(--text-neon);
  transition: stroke-dashoffset 0.5s ease;
}

.gauge-arc.warn-arc {
  stroke: var(--color-warn);
}

.value-row {
  display: flex;
  align-items: baseline;
  gap: 6px;
}

.numeric-val {
  font-size: 1.9rem;
  font-family: var(--font-mono);
  font-weight: 500;
  letter-spacing: -0.02em;
  color: var(--text-neon);
  line-height: 1.05;
}

.unit-text {
  font-size: 0.8rem;
  font-family: var(--font-mono);
  color: var(--text-muted);
}

.numeric-val.warn-text {
  color: var(--color-warn);
}

.unit-text.warn-text {
  color: var(--color-warn);
}

.sparkline-container {
  width: 55%;
  height: 26px;
  margin: 2px 0;
}

.sparkline-svg {
  width: 100%;
  height: 100%;
  overflow: visible;
}

.spark-stroke {
  stroke: var(--text-neon);
  stroke-width: 1.75;
  stroke-linecap: round;
  stroke-linejoin: round;
}

.warn-stroke {
  stroke: var(--color-warn);
}

.card-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-family: var(--font-mono);
  font-size: 0.68rem;
}

.optimal-range {
  color: var(--text-muted);
  letter-spacing: 0.04em;
}

.status-badge {
  font-size: 0.6rem;
  font-weight: 700;
  letter-spacing: 0.08em;
  padding: 2px 7px;
  border-radius: 3px;
  text-transform: uppercase;
}

.badge-ok {
  background-color: #0b1e0b;
  color: var(--text-neon);
  border: 1px solid #1a3a1a;
}

.badge-warn {
  background-color: var(--color-warn-bg);
  color: var(--color-warn);
  border: 1px solid var(--color-warn-border);
}
</style>
