<script setup lang="ts">
import { useHydroponicsStore } from '@/stores/hydroponics'

const store = useHydroponicsStore()
</script>

<template>
  <div class="nutrient-dosing-section">
    <div class="section-header">
      <span class="header-title">NUTRIENT DOSING - TODAY</span>
    </div>

    <div class="dosing-grid">
      <div
        v-for="item in store.nutrientDosing"
        :key="item.id"
        class="dosing-card"
      >
        <div class="card-name">
          {{ item.name }}
        </div>

        <div class="card-body">
          <div class="dosage-info">
            <span class="dosage-amount">{{ item.amount }}</span>
            <span class="dosing-time">{{ item.time }}</span>
          </div>

          <span class="delivered-badge">{{ item.status }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.nutrient-dosing-section {
  display: flex;
  flex-direction: column;
  gap: 8px;
  flex: 1;
  justify-content: space-between;
}

.section-header {
  display: flex;
  align-items: center;
}

.header-title {
  font-size: 0.7rem;
  letter-spacing: 0.12em;
  font-weight: 600;
  color: var(--text-muted);
  text-transform: uppercase;
}

.dosing-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 14px;
  flex: 1;
}

.dosing-card {
  background-color: var(--bg-card);
  border: 1px solid var(--border-subtle);
  border-radius: 6px;
  padding: 10px 14px;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  transition: border-color 0.15s ease, background-color 0.15s ease;
}

.dosing-card:hover {
  background-color: var(--bg-card-hover);
  border-color: var(--border-dim);
}

.card-name {
  font-size: 0.74rem;
  color: var(--text-muted);
  font-weight: 500;
}

.card-body {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.dosage-info {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.dosage-amount {
  font-size: 0.92rem;
  font-weight: 500;
  color: var(--text-primary);
  font-family: var(--font-mono);
}

.dosing-time {
  font-size: 0.68rem;
  font-family: var(--font-mono);
  color: var(--text-muted);
}

.delivered-badge {
  font-size: 0.58rem;
  font-weight: 700;
  letter-spacing: 0.08em;
  background-color: #0b1e0b;
  color: var(--text-neon);
  border: 1px solid #1a3a1a;
  padding: 3px 8px;
  border-radius: 3px;
  text-transform: uppercase;
}
</style>
