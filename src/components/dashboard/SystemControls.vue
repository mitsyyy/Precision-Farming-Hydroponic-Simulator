<script setup lang="ts">
import { useHydroponicsStore } from '@/stores/hydroponics'

const store = useHydroponicsStore()

function getStatusText(item: typeof store.systemControls[0]) {
  if (item.active) {
    if (item.id === 'pump' || item.name.toLowerCase().includes('pump')) {
      return `${store.flowRate.toFixed(1)} L/min`
    }
    return item.activeText
  }
  return item.inactiveText
}

function onFlowSliderInput(event: Event) {
  const target = event.target as HTMLInputElement
  const val = Number(target.value)
  if (!Number.isNaN(val)) {
    store.setFlowRate(val)
  }
}
</script>

<template>
  <div class="controls-col">
    <!-- SYSTEM CONTROLS -->
    <div class="control-section">
      <div class="section-title">SYSTEM CONTROLS</div>

      <div class="controls-list">
        <div
          v-for="item in store.systemControls"
          :key="item.id"
          class="control-card"
          @click="store.toggleControl(item.id)"
        >
          <div class="control-info">
            <span class="control-name">{{ item.name }}</span>
            <span class="control-status" :class="{ active: item.active }">
              {{ getStatusText(item) }}
            </span>
          </div>

          <button
            type="button"
            class="toggle-switch"
            :class="{ on: item.active }"
            :aria-label="`Toggle ${item.name}`"
            @click.stop="store.toggleControl(item.id)"
          >
            <span class="toggle-knob"></span>
          </button>
        </div>
      </div>
    </div>

    <!-- FLOW CONTROL -->
    <div class="flow-section">
      <div class="section-title">FLOW CONTROL</div>

      <div class="flow-card">
        <div class="flow-header">
          <span class="flow-label">Flow Rate</span>
          <span class="flow-value" :class="{ active: store.flowRate > 0 }">
            {{ store.flowRate.toFixed(1) }} {{ store.flowControlConfig.unit }}
          </span>
        </div>

        <div class="slider-container">
          <input
            :value="store.flowRate"
            type="range"
            :min="store.flowControlConfig.min"
            :max="store.flowControlConfig.max"
            :step="store.flowControlConfig.step"
            class="flow-slider"
            :style="{
              background: `linear-gradient(to right, var(--text-neon) 0%, var(--text-neon) ${((store.flowRate - store.flowControlConfig.min) / (store.flowControlConfig.max - store.flowControlConfig.min)) * 100}%, #142614 ${((store.flowRate - store.flowControlConfig.min) / (store.flowControlConfig.max - store.flowControlConfig.min)) * 100}%, #142614 100%)`
            }"
            @input="onFlowSliderInput"
          />
        </div>

        <div class="flow-limits">
          <span>{{ store.flowControlConfig.min.toFixed(1) }}</span>
          <span>{{ store.flowControlConfig.max.toFixed(1) }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.controls-col {
  display: flex;
  flex-direction: column;
  gap: 14px;
  flex: 1;
  min-height: 0;
}

.control-section {
  display: flex;
  flex-direction: column;
  flex: 1;
  min-height: 0;
}

.section-title {
  font-size: 0.7rem;
  letter-spacing: 0.12em;
  font-weight: 600;
  color: var(--text-muted);
  text-transform: uppercase;
  margin-bottom: 10px;
}

.controls-list {
  display: grid;
  grid-template-rows: repeat(4, 1fr);
  gap: 10px;
  flex: 1;
}

.control-card {
  background-color: var(--bg-card);
  border: 1px solid var(--border-subtle);
  border-radius: 6px;
  padding: 10px 14px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  cursor: pointer;
  transition: border-color 0.15s ease, background-color 0.15s ease;
  user-select: none;
}

.control-card:hover {
  background-color: var(--bg-card-hover);
  border-color: var(--border-dim);
}

.control-info {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.control-name {
  font-size: 0.88rem;
  font-weight: 500;
  color: var(--text-primary);
}

.control-status {
  font-size: 0.7rem;
  font-family: var(--font-mono);
  color: var(--text-muted);
  letter-spacing: 0.02em;
}

.control-status.active {
  color: var(--text-neon);
}

.toggle-switch {
  width: 36px;
  height: 19px;
  border-radius: 10px;
  background-color: #162616;
  border: 1px solid #243e24;
  position: relative;
  cursor: pointer;
  padding: 0;
  transition: background-color 0.2s ease, border-color 0.2s ease;
  outline: none;
  flex-shrink: 0;
}

.toggle-knob {
  position: absolute;
  top: 2px;
  left: 2px;
  width: 13px;
  height: 13px;
  border-radius: 50%;
  background-color: #4b6b4b;
  transition: transform 0.2s cubic-bezier(0.4, 0, 0.2, 1), background-color 0.2s ease;
}

.toggle-switch.on {
  background-color: var(--text-neon);
  border-color: var(--text-neon);
}

.toggle-switch.on .toggle-knob {
  transform: translateX(17px);
  background-color: #060c06;
}

/* Flow Control */
.flow-section {
  flex-shrink: 0;
}

.flow-card {
  background-color: var(--bg-card);
  border: 1px solid var(--border-subtle);
  border-radius: 6px;
  padding: 12px 14px;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.flow-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.flow-label {
  font-size: 0.86rem;
  font-weight: 500;
  color: var(--text-primary);
}

.flow-value {
  font-size: 0.82rem;
  font-family: var(--font-mono);
  font-weight: 500;
  color: var(--text-muted);
}

.flow-value.active {
  color: var(--text-neon);
}

.slider-container {
  width: 100%;
  display: flex;
  align-items: center;
}

.flow-slider {
  -webkit-appearance: none;
  appearance: none;
  width: 100%;
  height: 4px;
  border-radius: 2px;
  outline: none;
  cursor: pointer;
}

.flow-slider::-webkit-slider-thumb {
  -webkit-appearance: none;
  appearance: none;
  width: 14px;
  height: 14px;
  border-radius: 50%;
  background-color: var(--text-neon);
  cursor: pointer;
  border: none;
}

.flow-slider::-moz-range-thumb {
  width: 14px;
  height: 14px;
  border-radius: 50%;
  background-color: var(--text-neon);
  cursor: pointer;
  border: none;
}

.flow-limits {
  display: flex;
  justify-content: space-between;
  font-size: 0.68rem;
  font-family: var(--font-mono);
  color: var(--text-muted);
}
</style>
