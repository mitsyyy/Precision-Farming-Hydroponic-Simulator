<script setup lang="ts">
import { computed } from 'vue'
import { useHydroponicsStore } from '@/stores/hydroponics'

const store = useHydroponicsStore()
const active = computed(() => store.activePlot)

const stages = [
  { key: 'GERM', label: 'GERM' },
  { key: 'SEED', label: 'SEED' },
  { key: 'VEGE', label: 'VEGE' },
  { key: 'FLOW', label: 'FLOW' },
  { key: 'HARV', label: 'HARV' }
]

const stageOrder = ['GERM', 'SEED', 'VEGE', 'FLOW', 'HARV']

function isCurrentStage(stageKey: string) {
  return active.value?.stage === stageKey
}

function isPastStage(stageKey: string) {
  if (!active.value) return false
  const currentIndex = stageOrder.indexOf(active.value.stage)
  const stageIndex = stageOrder.indexOf(stageKey)
  return stageIndex >= 0 && stageIndex < currentIndex
}
</script>

<template>
  <div class="active-plot-banner">
    <!-- Left Info: Zone identification, Plant name, Stage progress -->
    <div class="banner-left">
      <div class="plot-indicator">{{ active.plotKey }} - ACTIVE</div>
      <h2 class="plant-heading">{{ active.name }}</h2>
      <div class="stage-info">
        Stage progress <span class="days-highlight">Day {{ active.day }} of {{ active.totalDays }}</span>
      </div>
    </div>

    <!-- Right: Current growth stage badge + Stage progress stepper directly underneath -->
    <div class="banner-right">
      <div class="stage-badge">
        {{ active.stageFullName }}
      </div>

      <div class="stage-pipeline">
        <template v-for="(stage, idx) in stages" :key="stage.key">
          <div
            class="stage-step"
            :class="{
              current: isCurrentStage(stage.key),
              completed: isPastStage(stage.key)
            }"
          >
            <span class="step-dot"></span>
            <span class="step-label">{{ stage.label }}</span>
          </div>
          <div
            v-if="idx < stages.length - 1"
            class="step-connector"
            :class="{
              filled: isPastStage(stages[idx + 1]?.key || '') || isCurrentStage(stages[idx + 1]?.key || '')
            }"
          ></div>
        </template>
      </div>
    </div>
  </div>
</template>

<style scoped>
.active-plot-banner {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  user-select: none;
}

.banner-left {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.plot-indicator {
  font-size: 0.7rem;
  letter-spacing: 0.12em;
  font-weight: 600;
  color: var(--text-muted);
  text-transform: uppercase;
}

.plant-heading {
  font-size: 1.65rem;
  font-weight: 500;
  letter-spacing: 0.01em;
  color: var(--text-primary);
  margin: 0;
  line-height: 1.2;
}

.stage-info {
  font-size: 0.76rem;
  font-family: var(--font-mono);
  color: var(--text-muted);
  letter-spacing: 0.02em;
  margin-top: 2px;
}

.days-highlight {
  color: var(--text-secondary);
  font-family: var(--font-mono);
  font-size: 0.78rem;
  margin-left: 6px;
}

.banner-right {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 8px;
}

.stage-badge {
  background-color: var(--text-neon);
  color: #060c06;
  font-size: 0.7rem;
  font-weight: 700;
  letter-spacing: 0.08em;
  padding: 4px 12px;
  border-radius: 4px;
  text-transform: uppercase;
  flex-shrink: 0;
}

.stage-pipeline {
  display: flex;
  align-items: center;
  gap: 4px;
}

.stage-step {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 3px;
}

.step-dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  border: 1.5px solid #1a3c1a;
  background-color: transparent;
}

.stage-step.completed .step-dot {
  border-color: var(--text-neon);
  background-color: transparent;
}

.stage-step.current .step-dot {
  background-color: var(--text-neon);
  border-color: var(--text-neon);
}

.step-label {
  font-size: 0.56rem;
  font-family: var(--font-mono);
  letter-spacing: 0.06em;
  color: #284428;
}

.stage-step.completed .step-label {
  color: #4a754a;
}

.stage-step.current .step-label {
  color: var(--text-neon);
  font-weight: 700;
}

.step-connector {
  width: 18px;
  height: 1.5px;
  background-color: #142814;
  margin-bottom: 13px;
}

.step-connector.filled {
  background-color: #1a9e29;
}
</style>
