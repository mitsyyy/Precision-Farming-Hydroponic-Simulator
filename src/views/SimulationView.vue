<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import {
  useHydroponicsStore,
  type SensorState,
  type AutomationState,
  type Plot
} from '@/stores/hydroponics'
import simulationConfig from '@/data/simulationConfig.json'

interface SensorCfg {
  key: keyof SensorState
  label: string
  unit: string
  min: number
  max: number
  step: number
  safe: [number, number]
}

interface SimDevice {
  key: keyof AutomationState
  label: string
  desc: string
}

const store = useHydroponicsStore()

const baseSensorConfigs = simulationConfig.sensorConfig as SensorCfg[]
const simulatedDevices = simulationConfig.simulatedDevices as SimDevice[]

// ── Custom Plot Dropdown Selector + Built-In Search & Filter Popover State ──
const showPlotDropdown = ref<boolean>(false)
const showFilterSubmenu = ref<boolean>(false)
const plotSearchQuery = ref<string>('')
const selectedZoneFilter = ref<string>('ALL')
const selectedStageFilter = ref<string>('ALL')
const dropdownWrapRef = ref<HTMLElement | null>(null)

const zoneOptions = computed(() => {
  return [
    { key: 'ALL', label: 'All Zones' },
    ...store.availableZones.map((z) => ({
      key: z,
      label: z.replace('ZONE ', 'Zone ')
    }))
  ]
})

const stageOptions = [
  { key: 'ALL', label: 'All Stages' },
  { key: 'VEGE', label: 'Vegetative' },
  { key: 'FLOW', label: 'Flowering' },
  { key: 'SEED', label: 'Seedling' },
  { key: 'GERM', label: 'Germination' }
]

const hasActiveFilter = computed(() => {
  return selectedZoneFilter.value !== 'ALL' || selectedStageFilter.value !== 'ALL'
})

const filteredPlots = computed<Plot[]>(() => {
  const q = plotSearchQuery.value.trim().toLowerCase()
  const zFilter = selectedZoneFilter.value
  const sFilter = selectedStageFilter.value

  return store.plots.filter((p) => {
    const matchesZone = zFilter === 'ALL' || p.zoneName.toUpperCase() === zFilter
    const matchesStage = sFilter === 'ALL' || p.stage.toUpperCase() === sFilter
    const matchesQuery =
      !q ||
      p.cropName.toLowerCase().includes(q) ||
      p.zoneName.toLowerCase().includes(q) ||
      `${p.zoneName} — ${p.cropName}`.toLowerCase().includes(q)
    return matchesZone && matchesStage && matchesQuery
  })
})

function selectTargetPlot(plotId: string) {
  store.setActivePlot(plotId)
  showPlotDropdown.value = false
  showFilterSubmenu.value = false
}

function selectZoneFilter(val: string) {
  selectedZoneFilter.value = val
  showFilterSubmenu.value = false
}

function selectStageFilter(val: string) {
  selectedStageFilter.value = val
  showFilterSubmenu.value = false
}

function resetPlotFilters() {
  selectedZoneFilter.value = 'ALL'
  selectedStageFilter.value = 'ALL'
  plotSearchQuery.value = ''
  showFilterSubmenu.value = false
}

function handleDocumentClick(e: MouseEvent) {
  if (!showPlotDropdown.value) return
  if (dropdownWrapRef.value && !dropdownWrapRef.value.contains(e.target as Node)) {
    showPlotDropdown.value = false
    showFilterSubmenu.value = false
  }
}

onMounted(() => {
  document.addEventListener('mousedown', handleDocumentClick)
})

// Dynamic per-plot sensor configs (4 environmental sliders: Temperature, pH Level, Water Level, Nutrient Level)
const sensorConfigs = computed<SensorCfg[]>(() => {
  const zs = store.activeZoneState
  const tempMin = Math.round(zs.targetTemp - 3)
  const tempMax = Math.round(zs.targetTemp + 3)
  const nutMin = Math.round((zs.ecMin / 2.5) * 100)
  const nutMax = Math.min(100, Math.round((zs.ecMax / 2.5) * 100))

  return baseSensorConfigs.map((cfg) => {
    if (cfg.key === 'ph') {
      return { ...cfg, safe: [zs.phMin, zs.phMax] }
    }
    if (cfg.key === 'temperature') {
      return { ...cfg, safe: [tempMin, tempMax] }
    }
    if (cfg.key === 'nutrientLevel') {
      return { ...cfg, safe: [nutMin, nutMax] }
    }
    return cfg
  })
})

function handleSliderInput(key: keyof SensorState, rawValue: string) {
  const num = Number(rawValue)
  if (Number.isNaN(num)) return
  store.handleSensorChange(key, num)
}

function formatVal(cfg: SensorCfg): string {
  const val = store.sensors[cfg.key]
  return cfg.step < 1 ? val.toFixed(cfg.step === 0.05 ? 2 : 1) : String(Math.round(val))
}

function isInRange(cfg: SensorCfg): boolean {
  const val = store.sensors[cfg.key]
  return val >= cfg.safe[0] && val <= cfg.safe[1]
}

function getSafeLeft(cfg: SensorCfg): string {
  return `${((cfg.safe[0] - cfg.min) / (cfg.max - cfg.min)) * 100}%`
}

function getSafeWidth(cfg: SensorCfg): string {
  return `${((cfg.safe[1] - cfg.safe[0]) / (cfg.max - cfg.min)) * 100}%`
}

function getSliderFillPct(cfg: SensorCfg): number {
  const val = store.sensors[cfg.key]
  const pct = ((val - cfg.min) / (cfg.max - cfg.min)) * 100
  return Math.min(100, Math.max(0, pct))
}

const flowFillPct = computed(() => {
  const cfg = store.flowControlConfig
  const pct = ((store.flowRate - cfg.min) / (cfg.max - cfg.min)) * 100
  return Math.min(100, Math.max(0, pct))
})

function handleFlowRateInput(e: Event) {
  const val = Number((e.target as HTMLInputElement).value)
  if (!Number.isNaN(val)) {
    store.setFlowRate(val)
  }
}

function handleReset() {
  store.resetSim()
}

function getEventDotColor(type: 'info' | 'warning' | 'success'): string {
  if (type === 'success') return '#22e532'
  if (type === 'warning') return '#ff8c00'
  return '#3b9eff'
}

onUnmounted(() => {
  document.removeEventListener('mousedown', handleDocumentClick)
})
</script>

<template>
  <div class="sim-page">
    <!-- Single, Compact One-Line Control Bar (Target Plot Selector Left + Playback Controls Right) -->
    <div class="sim-topbar">
      <!-- Left: TARGET PLOT + Sleek Custom Dropdown Selector with Built-In Search/Filter -->
      <div class="sim-topbar-left">
        <span class="target-plot-label">TARGET PLOT:</span>

        <div ref="dropdownWrapRef" class="custom-plot-dropdown-wrap">
          <button
            type="button"
            class="plot-selector-trigger"
            :class="{ open: showPlotDropdown }"
            @click.stop="showPlotDropdown = !showPlotDropdown"
          >
            <span class="trigger-zone">{{ store.activePlot.zoneName }}</span>
            <span class="trigger-sep">—</span>
            <span class="trigger-crop">{{ store.activePlot.cropName }}</span>
            <span
              class="trigger-stage-badge"
              :class="store.activePlot.colorType ? `badge-${store.activePlot.colorType}` : ''"
            >
              {{ store.activePlot.stage }}
            </span>
            <svg
              class="trigger-chevron"
              :class="{ rotated: showPlotDropdown }"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
            >
              <polyline points="6 9 12 15 18 9" stroke-linecap="round" stroke-linejoin="round" />
            </svg>
          </button>

          <!-- Floating Plot Selector Dropdown Menu -->
          <div v-if="showPlotDropdown" class="plot-dropdown-menu" @click.stop>
            <!-- Built-in Unified Search + Filter Icon Bar inside Dropdown -->
            <div class="dropdown-search-row">
              <div class="unified-search-bar">
                <svg class="search-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75">
                  <circle cx="11" cy="11" r="7" />
                  <line x1="20" y1="20" x2="16" y2="16" stroke-linecap="round" />
                </svg>

                <input
                  v-model="plotSearchQuery"
                  type="text"
                  placeholder="Search zone or crop..."
                  class="dropdown-search-input"
                />

                <button
                  type="button"
                  class="filter-icon-btn"
                  :class="{ active: showFilterSubmenu || hasActiveFilter }"
                  aria-label="Filter plots"
                  @click.stop="showFilterSubmenu = !showFilterSubmenu"
                >
                  <svg class="funnel-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75">
                    <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" stroke-linejoin="round" />
                  </svg>
                  <span v-if="hasActiveFilter" class="filter-dot-badge"></span>
                </button>

                <!-- Floating Filter Popover inside Plot Dropdown -->
                <div v-if="showFilterSubmenu" class="filter-dropdown-popover" @click.stop>
                  <div class="popover-section">
                    <div class="popover-label">BY ZONE</div>
                    <div class="popover-options-grid">
                      <button
                        v-for="z in zoneOptions"
                        :key="z.key"
                        type="button"
                        class="popover-opt-btn"
                        :class="{ selected: selectedZoneFilter === z.key }"
                        @click="selectZoneFilter(z.key)"
                      >
                        {{ z.label }}
                      </button>
                    </div>
                  </div>

                  <div class="popover-divider"></div>

                  <div class="popover-section">
                    <div class="popover-label">BY STAGE</div>
                    <div class="popover-options-list">
                      <button
                        v-for="s in stageOptions"
                        :key="s.key"
                        type="button"
                        class="popover-opt-row"
                        :class="{ selected: selectedStageFilter === s.key }"
                        @click="selectStageFilter(s.key)"
                      >
                        <span>{{ s.label }}</span>
                        <svg
                          v-if="selectedStageFilter === s.key"
                          class="opt-check-svg"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          stroke-width="2"
                        >
                          <polyline points="20 6 9 17 4 12" stroke-linecap="round" stroke-linejoin="round" />
                        </svg>
                      </button>
                    </div>
                  </div>

                  <div class="popover-footer">
                    <button type="button" class="reset-filters-link" @click="resetPlotFilters">
                      Reset Filters
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <!-- Scrollable List of Plot Options -->
            <div class="dropdown-plot-list">
              <button
                v-for="p in filteredPlots"
                :key="p.id"
                type="button"
                class="dropdown-plot-item"
                :class="{ active: store.activePlotId === p.id }"
                @click="selectTargetPlot(p.id)"
              >
                <div class="plot-item-left">
                  <span class="item-zone">{{ p.zoneName }}</span>
                  <span class="item-sep">—</span>
                  <span class="item-crop">{{ p.cropName }}</span>
                </div>
                <div class="plot-item-right">
                  <span class="item-days">Day {{ p.day }}/{{ p.totalDays }}</span>
                  <span
                    class="trigger-stage-badge"
                    :class="p.colorType ? `badge-${p.colorType}` : ''"
                  >
                    {{ p.stage }}
                  </span>
                </div>
              </button>

              <div v-if="filteredPlots.length === 0" class="dropdown-empty">
                No plots match filter.
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Right: Compact Simulation Playback Controls -->
      <div class="sim-topbar-right">
        <button
          type="button"
          class="sim-btn"
          :class="store.simRunning ? 'btn-pause' : 'btn-start'"
          @click="store.setSimRunning(!store.simRunning)"
        >
          <svg v-if="store.simRunning" class="btn-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75">
            <rect x="6" y="4" width="4" height="16" rx="1" />
            <rect x="14" y="4" width="4" height="16" rx="1" />
          </svg>
          <svg v-else class="btn-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75">
            <polygon points="5 3 19 12 5 21 5 3" stroke-linejoin="round" />
          </svg>
          <span>{{ store.simRunning ? 'PAUSE' : 'RESUME' }}</span>
        </button>

        <!-- Speed Multiplier -->
        <div class="speed-pills">
          <button
            v-for="spd in ([1, 5, 10] as const)"
            :key="spd"
            type="button"
            class="spd-pill"
            :class="{ active: store.simSpeed === spd }"
            @click="store.setSimSpeed(spd)"
          >
            {{ spd }}x
          </button>
        </div>

        <button type="button" class="sim-btn btn-advance" @click="store.advanceDay()">
          <svg class="btn-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75">
            <polyline points="13 17 18 12 13 7" stroke-linecap="round" stroke-linejoin="round" />
            <polyline points="6 17 11 12 6 7" stroke-linecap="round" stroke-linejoin="round" />
          </svg>
          <span>+1 DAY</span>
        </button>

        <button type="button" class="sim-btn btn-reset" @click="handleReset">
          <svg class="btn-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75">
            <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" stroke-linecap="round" stroke-linejoin="round" />
            <path d="M3 3v5h5" stroke-linecap="round" stroke-linejoin="round" />
          </svg>
          <span>RESET</span>
        </button>

        <div class="mode-switch">
          <span class="mode-label">MODE:</span>
          <button
            type="button"
            class="mode-btn"
            :class="{ active: store.manualMode }"
            @click="store.setManualMode(!store.manualMode)"
          >
            {{ store.manualMode ? 'MANUAL' : 'AUTO' }}
          </button>
        </div>
      </div>
    </div>

    <!-- Main 2-Column Split Workspace -->
    <div class="sim-grid">
      <!-- Left Column: Stacked VIRTUAL SENSOR INPUTS (Top) + SYSTEM CONTROLS (Bottom Row) -->
      <div class="sim-left-col">
        <!-- Top Panel: VIRTUAL SENSOR INPUTS -->
        <div class="sim-boxed-panel sensor-inputs-panel">
          <div class="panel-header-row">
            <div class="section-heading">
              VIRTUAL SENSOR INPUTS — {{ store.activePlot.zoneName }} ({{ store.activePlot.cropName }})
            </div>
            <span class="panel-sub-tag">DRAG SLIDER OR ENTER EXACT VALUE</span>
          </div>

          <div class="sliders-stack">
            <div
              v-for="cfg in sensorConfigs"
              :key="cfg.key"
              class="sensor-slider-card"
              :class="isInRange(cfg) ? 'card-normal' : 'card-warn'"
            >
              <div class="slider-header">
                <div class="slider-title-wrap">
                  <span class="slider-title">{{ cfg.label }}</span>
                  <span v-if="!isInRange(cfg)" class="inline-warn-pill">
                    <svg class="warn-inline-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75">
                      <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" stroke-linejoin="round" />
                      <line x1="12" y1="9" x2="12" y2="13" stroke-linecap="round" />
                      <line x1="12" y1="17" x2="12.01" y2="17" stroke-linecap="round" />
                    </svg>
                    Outside optimal range — active controls adjusting
                  </span>
                </div>

                <div class="numeric-input-group">
                  <input
                    type="number"
                    :min="cfg.min"
                    :max="cfg.max"
                    :step="cfg.step"
                    :value="formatVal(cfg)"
                    class="sensor-num-input"
                    :class="isInRange(cfg) ? 'val-ok' : 'val-warn'"
                    @change="handleSliderInput(cfg.key, ($event.target as HTMLInputElement).value)"
                  />
                  <span class="unit-tag">{{ cfg.unit }}</span>
                </div>
              </div>

              <input
                type="range"
                :min="cfg.min"
                :max="cfg.max"
                :step="cfg.step"
                :value="store.sensors[cfg.key]"
                class="range-input"
                :style="{
                  background: `linear-gradient(to right, var(--text-neon) 0%, var(--text-neon) ${getSliderFillPct(cfg)}%, #142614 ${getSliderFillPct(cfg)}%, #142614 100%)`
                }"
                @input="handleSliderInput(cfg.key, ($event.target as HTMLInputElement).value)"
              />

              <div class="slider-bounds">
                <span>Min: {{ cfg.min }}{{ cfg.unit }}</span>
                <span class="safe-text">Safe: {{ cfg.safe[0] }}–{{ cfg.safe[1] }}{{ cfg.unit }}</span>
                <span>Max: {{ cfg.max }}{{ cfg.unit }}</span>
              </div>

              <!-- Safe range visual bar -->
              <div class="safe-bar-track">
                <div
                  class="safe-bar-fill"
                  :style="{ left: getSafeLeft(cfg), width: getSafeWidth(cfg) }"
                ></div>
              </div>
            </div>
          </div>
        </div>

        <!-- Bottom Panel: SYSTEM CONTROLS / SIMULATED DEVICES (Pinned directly below Virtual Sensor Inputs) -->
        <div class="sim-boxed-panel devices-panel">
          <div class="devices-panel-header">
            <div class="section-heading">
              SYSTEM CONTROLS — {{ store.activePlot.zoneName }} • {{ store.activePlot.cropName }}
            </div>

            <!-- Sleek Compact Inline Flow Rate Bar -->
            <div class="inline-flow-control">
              <span class="flow-label">FLOW RATE:</span>
              <input
                type="range"
                :min="store.flowControlConfig.min"
                :max="store.flowControlConfig.max"
                :step="store.flowControlConfig.step"
                :value="store.flowRate"
                class="range-input flow-range-input"
                :style="{
                  background: `linear-gradient(to right, var(--text-neon) 0%, var(--text-neon) ${flowFillPct}%, #142614 ${flowFillPct}%, #142614 100%)`
                }"
                @input="handleFlowRateInput"
              />
              <span class="flow-val-readout">{{ store.flowRate.toFixed(1) }} {{ store.flowControlConfig.unit }}</span>
            </div>
          </div>

          <!-- Horizontal 4-Column Row of Rectangular Device Toggle Cards -->
          <div class="devices-row-grid">
            <button
              v-for="dev in simulatedDevices"
              :key="dev.key"
              type="button"
              class="device-toggle-card"
              :class="{ 'device-on': store.automation[dev.key] }"
              @click="store.toggleAutomation(dev.key)"
            >
              <!-- Top: Status Indicator Icon + Dot -->
              <div class="device-card-top">
                <!-- Circulation Pump Icon -->
                <svg
                  v-if="dev.key === 'waterPump'"
                  class="device-icon-svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="1.75"
                >
                  <path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z" stroke-linejoin="round" />
                </svg>

                <!-- Grow Lights Icon -->
                <svg
                  v-else-if="dev.key === 'growLight'"
                  class="device-icon-svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="1.75"
                >
                  <circle cx="12" cy="12" r="4" />
                  <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41" stroke-linecap="round" />
                </svg>

                <!-- Ventilation Fan Icon -->
                <svg
                  v-else-if="dev.key === 'coolingSystem'"
                  class="device-icon-svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="1.75"
                >
                  <path d="M9.59 4.59A2 2 0 1 1 11 8H2m10.59 11.41A2 2 0 1 0 14 16H2m15.73-8.27A2.5 2.5 0 1 1 19.5 12H2" stroke-linecap="round" stroke-linejoin="round" />
                </svg>

                <!-- Auto Dosing Icon -->
                <svg
                  v-else
                  class="device-icon-svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="1.75"
                >
                  <path d="M10 2v7.31L6.12 16.9A2 2 0 0 0 7.9 19.8h8.2a2 2 0 0 0 1.78-2.9L14 9.31V2" stroke-linecap="round" stroke-linejoin="round" />
                  <line x1="8.5" y1="2" x2="15.5" y2="2" stroke-linecap="round" />
                </svg>

                <span class="status-dot" :class="{ on: store.automation[dev.key] }"></span>
              </div>

              <!-- Center: Device Name & Brief Telemetry -->
              <div class="device-card-center">
                <div class="device-name">{{ dev.label }}</div>
                <div class="device-sub">{{ dev.desc }}</div>
              </div>

              <!-- Bottom: ON / OFF Status Text -->
              <div class="device-card-bottom">
                <span class="device-status-text" :class="{ on: store.automation[dev.key] }">
                  {{ store.automation[dev.key] ? 'ON' : 'OFF' }}
                </span>
              </div>
            </button>
          </div>
        </div>
      </div>

      <!-- Right Column: Full-Height, Wider SIMULATION EVENT LOG -->
      <div class="sim-right-col">
        <div class="event-log-panel">
          <div class="event-log-header">
            <div class="event-log-titles">
              <div class="section-heading">SIMULATION EVENT LOG</div>
              <span class="event-log-sub">REAL-TIME SYSTEM RESPONSES</span>
            </div>

            <div class="event-log-actions">
              <span class="event-count">{{ store.events.length }} events</span>
              <button
                v-if="store.events.length > 0"
                type="button"
                class="clear-log-btn"
                @click="store.clearEvents()"
              >
                Clear Log
              </button>
            </div>
          </div>

          <div class="event-log-scroll">
            <div
              v-for="(ev, idx) in store.events"
              :key="idx"
              class="event-item"
            >
              <div class="event-item-top">
                <span
                  class="event-dot"
                  :style="{ backgroundColor: getEventDotColor(ev.type) }"
                ></span>
                <span class="event-time">{{ ev.time }}</span>
              </div>
              <div class="event-msg">{{ ev.message }}</div>
            </div>

            <div v-if="store.events.length === 0" class="event-empty-state">
              No simulation events recorded. Adjust sliders or toggle devices to observe real-time system responses.
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.sim-page {
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding: 16px 22px 28px;
  height: 100%;
  overflow-y: auto;
}

/* Single, Compact One-Line Control Bar */
.sim-topbar {
  background-color: var(--bg-panel);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-lg);
  padding: 8px 14px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 12px;
  flex-shrink: 0;
}

.sim-topbar-left {
  display: flex;
  align-items: center;
  gap: 10px;
}

.target-plot-label {
  font-size: 0.7rem;
  font-family: var(--font-mono);
  font-weight: 600;
  letter-spacing: 0.12em;
  color: var(--text-muted);
  text-transform: uppercase;
}

/* Sleek Custom Plot Dropdown Selector */
.custom-plot-dropdown-wrap {
  position: relative;
}

.plot-selector-trigger {
  height: 30px;
  min-width: 265px;
  padding: 0 12px;
  border-radius: 5px;
  background-color: #081208;
  border: 1px solid #1e3a1e;
  color: var(--text-primary);
  font-family: var(--font-mono);
  font-size: 0.74rem;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  transition: border-color 0.15s ease, background-color 0.15s ease;
}

.plot-selector-trigger:hover,
.plot-selector-trigger.open {
  border-color: var(--text-neon);
  background-color: #0d1c0d;
}

.trigger-zone {
  color: var(--text-neon);
  font-weight: 700;
  letter-spacing: 0.04em;
}

.trigger-sep {
  color: var(--text-muted);
}

.trigger-crop {
  font-weight: 500;
  color: #ffffff;
}

.trigger-stage-badge {
  margin-left: auto;
  font-size: 0.58rem;
  font-weight: 700;
  letter-spacing: 0.06em;
  padding: 2px 6px;
  border-radius: 3px;
  text-transform: uppercase;
  background-color: #0b1e0b;
  color: var(--text-neon);
  border: 1px solid #1a3a1a;
}

.trigger-stage-badge.badge-blue {
  background-color: var(--color-blue-bg);
  color: var(--color-blue);
  border-color: var(--color-blue-border);
}

.trigger-stage-badge.badge-slate {
  background-color: var(--color-slate-bg);
  color: var(--color-slate);
  border-color: var(--color-slate-border);
}

.trigger-stage-badge.badge-purple {
  background-color: var(--color-purple-bg);
  color: var(--color-purple);
  border-color: var(--color-purple-border);
}

.trigger-chevron {
  width: 14px;
  height: 14px;
  color: var(--text-muted);
  transition: transform 0.18s ease;
  flex-shrink: 0;
}

.trigger-chevron.rotated {
  transform: rotate(180deg);
  color: var(--text-neon);
}

/* Plot Dropdown Menu */
.plot-dropdown-menu {
  position: absolute;
  top: calc(100% + 6px);
  left: 0;
  width: 340px;
  background-color: #081208;
  border: 1px solid #1e3a1e;
  border-radius: 6px;
  padding: 10px;
  z-index: 60;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.dropdown-search-row {
  position: relative;
}

.unified-search-bar {
  position: relative;
  display: flex;
  align-items: center;
  width: 100%;
}

.search-svg {
  position: absolute;
  left: 9px;
  width: 13px;
  height: 13px;
  color: var(--text-muted);
  pointer-events: none;
}

.dropdown-search-input {
  width: 100%;
  height: 30px;
  padding: 0 34px 0 28px;
  border-radius: 5px;
  background-color: #050b05;
  border: 1px solid var(--border-subtle);
  color: var(--text-primary);
  font-family: var(--font-mono);
  font-size: 0.7rem;
  outline: none;
}

.dropdown-search-input:focus {
  border-color: var(--text-neon);
}

.filter-icon-btn {
  position: absolute;
  right: 4px;
  width: 24px;
  height: 22px;
  border-radius: 4px;
  background-color: transparent;
  border: 1px solid transparent;
  color: var(--text-muted);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
}

.filter-icon-btn:hover,
.filter-icon-btn.active {
  color: var(--text-neon);
  background-color: #102210;
  border-color: #1e3a1e;
}

.funnel-svg {
  width: 13px;
  height: 13px;
}

.filter-dot-badge {
  position: absolute;
  top: 2px;
  right: 2px;
  width: 5px;
  height: 5px;
  border-radius: 50%;
  background-color: var(--text-neon);
}

/* Filter Sub-Popover inside Plot Dropdown */
.filter-dropdown-popover {
  position: absolute;
  top: calc(100% + 6px);
  right: 0;
  width: 230px;
  background-color: #081208;
  border: 1px solid #1e3a1e;
  border-radius: 6px;
  padding: 10px;
  z-index: 70;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.popover-section {
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.popover-label {
  font-size: 0.58rem;
  font-family: var(--font-mono);
  letter-spacing: 0.1em;
  color: var(--text-muted);
  font-weight: 600;
}

.popover-options-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 4px;
}

.popover-opt-btn {
  height: 24px;
  padding: 0 6px;
  border-radius: 4px;
  background-color: #0c1a0c;
  border: 1px solid var(--border-subtle);
  color: var(--text-secondary);
  font-family: var(--font-mono);
  font-size: 0.64rem;
  text-align: left;
  cursor: pointer;
}

.popover-opt-btn:hover {
  border-color: #244624;
  color: var(--text-primary);
}

.popover-opt-btn.selected {
  background-color: #132a13;
  border-color: var(--text-neon);
  color: var(--text-neon);
  font-weight: 600;
}

.popover-divider {
  height: 1px;
  background-color: #142814;
}

.popover-options-list {
  display: flex;
  flex-direction: column;
  gap: 3px;
}

.popover-opt-row {
  height: 24px;
  padding: 0 8px;
  border-radius: 4px;
  background-color: transparent;
  border: 1px solid transparent;
  color: var(--text-secondary);
  font-family: var(--font-mono);
  font-size: 0.65rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
  cursor: pointer;
}

.popover-opt-row:hover {
  background-color: #0e1e0e;
  color: var(--text-primary);
}

.popover-opt-row.selected {
  background-color: #122612;
  border-color: #1e3e1e;
  color: var(--text-neon);
  font-weight: 600;
}

.opt-check-svg {
  width: 12px;
  height: 12px;
}

.popover-footer {
  padding-top: 6px;
  border-top: 1px solid #142814;
  display: flex;
  justify-content: flex-end;
}

.reset-filters-link {
  background: transparent;
  border: none;
  color: var(--text-neon);
  font-family: var(--font-mono);
  font-size: 0.64rem;
  cursor: pointer;
  padding: 0;
}

.reset-filters-link:hover {
  text-decoration: underline;
}

.dropdown-plot-list {
  max-height: 220px;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 4px;
  scrollbar-width: none;
  -ms-overflow-style: none;
}

.dropdown-plot-list::-webkit-scrollbar {
  display: none;
}

.dropdown-plot-item {
  height: 32px;
  padding: 0 10px;
  border-radius: 4px;
  background-color: #0b160b;
  border: 1px solid transparent;
  color: var(--text-secondary);
  font-family: var(--font-mono);
  font-size: 0.72rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
  cursor: pointer;
  transition: background-color 0.15s ease, border-color 0.15s ease, color 0.15s ease;
}

.dropdown-plot-item:hover {
  background-color: #102010;
  border-color: #1e3a1e;
  color: var(--text-primary);
}

.dropdown-plot-item.active {
  background-color: #132813;
  border-color: var(--text-neon);
  color: #ffffff;
}

.plot-item-left {
  display: flex;
  align-items: center;
  gap: 6px;
  min-width: 0;
}

.item-zone {
  color: var(--text-neon);
  font-weight: 700;
}

.item-sep {
  color: var(--text-muted);
}

.item-crop {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.plot-item-right {
  display: flex;
  align-items: center;
  gap: 6px;
  flex-shrink: 0;
}

.item-days {
  font-size: 0.64rem;
  color: var(--text-muted);
}

.dropdown-empty {
  padding: 10px;
  text-align: center;
  font-family: var(--font-mono);
  font-size: 0.68rem;
  color: var(--text-muted);
}

/* Playback Controls Right */
.sim-topbar-right {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.sim-btn {
  padding: 5px 10px;
  border-radius: var(--radius-md);
  font-size: 0.7rem;
  font-family: var(--font-mono);
  font-weight: 500;
  cursor: pointer;
  transition: all 0.15s ease;
  display: inline-flex;
  align-items: center;
  gap: 5px;
}

.btn-svg {
  width: 13px;
  height: 13px;
}

.btn-pause {
  background-color: rgba(255, 140, 0, 0.12);
  border: 1px solid var(--color-warn);
  color: var(--color-warn);
}

.btn-start {
  background-color: #122412;
  border: 1px solid var(--text-neon);
  color: var(--text-neon);
}

.btn-advance {
  background-color: #102210;
  border: 1px solid #214521;
  color: var(--text-neon);
}

.btn-advance:hover {
  border-color: var(--text-neon);
  background-color: #152d15;
}

.btn-reset {
  background-color: #112011;
  border: 1px solid var(--border-card);
  color: var(--text-secondary);
}

.btn-reset:hover {
  color: var(--text-primary);
  border-color: var(--text-neon);
}

.speed-pills {
  display: inline-flex;
  border: 1px solid var(--border-card);
  border-radius: 5px;
  overflow: hidden;
}

.spd-pill {
  padding: 4px 9px;
  font-family: var(--font-mono);
  font-size: 0.7rem;
  background-color: #091209;
  border: none;
  border-right: 1px solid var(--border-subtle);
  color: var(--text-muted);
  cursor: pointer;
}

.spd-pill:last-child {
  border-right: none;
}

.spd-pill.active {
  background-color: #152e15;
  color: var(--text-neon);
  font-weight: 600;
}

.mode-switch {
  display: flex;
  align-items: center;
  gap: 6px;
}

.mode-label {
  font-size: 0.7rem;
  color: var(--text-muted);
}

.mode-btn {
  padding: 4px 9px;
  border-radius: var(--radius-sm);
  font-size: 0.7rem;
  font-family: var(--font-mono);
  background-color: #112011;
  border: 1px solid var(--border-card);
  color: var(--text-neon);
  cursor: pointer;
}

.mode-btn.active {
  background-color: rgba(255, 140, 0, 0.12);
  border-color: var(--color-warn);
  color: var(--color-warn);
}

/* 2-Column Split Layout */
.sim-grid {
  display: grid;
  grid-template-columns: 1.45fr 1fr;
  gap: 16px;
  align-items: stretch;
}

/* Left Column: Stacked VIRTUAL SENSOR INPUTS (Top) + SYSTEM CONTROLS (Bottom) */
.sim-left-col {
  display: flex;
  flex-direction: column;
  gap: 16px;
  min-width: 0;
}

.sim-boxed-panel {
  background-color: var(--bg-panel);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-lg);
  padding: 16px 18px;
}

.sensor-inputs-panel {
  display: flex;
  flex-direction: column;
}

.panel-header-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  margin-bottom: 12px;
  flex-shrink: 0;
}

.section-heading {
  font-size: 0.68rem;
  font-family: var(--font-mono);
  font-weight: 600;
  letter-spacing: 0.14em;
  color: var(--text-muted);
  text-transform: uppercase;
}

.panel-sub-tag {
  font-size: 0.6rem;
  font-family: var(--font-mono);
  letter-spacing: 0.08em;
  color: #2e6e2e;
}

.sliders-stack {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

/* Sensor Slider Cards inside Top Left Panel */
.sensor-slider-card {
  background-color: var(--bg-darkest);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-md);
  padding: 13px 16px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  transition: border-color 0.2s ease;
}

.sensor-slider-card.card-warn {
  border-color: rgba(255, 140, 0, 0.5);
}

.slider-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  margin-bottom: 6px;
}

.slider-title-wrap {
  display: flex;
  align-items: center;
  gap: 10px;
  min-width: 0;
}

.slider-title {
  font-size: 0.82rem;
  font-weight: 500;
  color: #c8e6c8;
  white-space: nowrap;
}

.inline-warn-pill {
  font-size: 0.65rem;
  font-family: var(--font-mono);
  color: var(--color-warn);
  display: inline-flex;
  align-items: center;
  gap: 5px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.warn-inline-svg {
  width: 12px;
  height: 12px;
  flex-shrink: 0;
}

.numeric-input-group {
  display: flex;
  align-items: center;
  gap: 4px;
  flex-shrink: 0;
}

.sensor-num-input {
  width: 64px;
  padding: 2px 6px;
  border-radius: 4px;
  background-color: #060d06;
  border: 1px solid var(--border-subtle);
  font-family: var(--font-mono);
  font-size: 0.8rem;
  font-weight: 600;
  text-align: right;
  outline: none;
}

.sensor-num-input:focus {
  border-color: var(--text-neon);
}

.unit-tag {
  font-family: var(--font-mono);
  font-size: 0.7rem;
  color: var(--text-muted);
}

.val-ok {
  color: var(--text-neon);
}

.val-warn {
  color: var(--color-warn);
}

.range-input {
  -webkit-appearance: none;
  appearance: none;
  width: 100%;
  height: 7px;
  border-radius: 999px;
  background-color: #142614;
  border: none;
  outline: none;
  cursor: pointer;
  margin-bottom: 6px;
}

.range-input::-webkit-slider-thumb {
  -webkit-appearance: none;
  appearance: none;
  width: 14px;
  height: 14px;
  border-radius: 50%;
  background-color: var(--text-neon);
  border: none;
  cursor: pointer;
}

.range-input::-moz-range-thumb {
  width: 14px;
  height: 14px;
  border-radius: 50%;
  background-color: var(--text-neon);
  border: none;
  cursor: pointer;
}

.slider-bounds {
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 0.65rem;
  font-family: var(--font-mono);
  color: var(--text-muted);
}

.safe-text {
  color: #2e6e2e;
}

.safe-bar-track {
  margin-top: 5px;
  height: 3px;
  border-radius: 999px;
  background-color: #142614;
  position: relative;
  overflow: hidden;
}

.safe-bar-fill {
  position: absolute;
  top: 0;
  height: 100%;
  border-radius: 999px;
  background-color: rgba(34, 229, 50, 0.28);
}

/* Bottom Panel: SYSTEM CONTROLS / SIMULATED DEVICES */
.devices-panel {
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.devices-panel-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  flex-wrap: wrap;
}

.inline-flow-control {
  display: flex;
  align-items: center;
  gap: 8px;
  background-color: var(--bg-darkest);
  border: 1px solid var(--border-subtle);
  border-radius: 5px;
  padding: 4px 10px;
}

.flow-label {
  font-size: 0.62rem;
  font-family: var(--font-mono);
  letter-spacing: 0.08em;
  color: var(--text-muted);
  white-space: nowrap;
}

.flow-range-input {
  width: 110px;
  height: 6px;
  margin-bottom: 0;
}

.flow-val-readout {
  font-size: 0.7rem;
  font-family: var(--font-mono);
  font-weight: 600;
  color: var(--text-neon);
  min-width: 58px;
  text-align: right;
}

/* 4-Column Horizontal Row of Device Toggle Cards */
.devices-row-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 12px;
}

.device-toggle-card {
  background-color: var(--bg-darkest);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-md);
  padding: 10px 12px;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  gap: 8px;
  text-align: left;
  cursor: pointer;
  transition: border-color 0.18s ease, background-color 0.18s ease;
}

.device-toggle-card:hover {
  border-color: var(--border-dim);
}

.device-toggle-card.device-on {
  background-color: #0e1f0e;
  border-color: #22c55e;
}

.device-card-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
}

.device-icon-svg {
  width: 16px;
  height: 16px;
  color: var(--text-muted);
}

.device-toggle-card.device-on .device-icon-svg {
  color: var(--text-neon);
}

.status-dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  border: 1px solid var(--text-muted);
  background-color: transparent;
}

.status-dot.on {
  background-color: var(--text-neon);
  border-color: var(--text-neon);
}

.device-card-center {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.device-name {
  font-size: 0.76rem;
  font-weight: 600;
  color: #c8e6c8;
}

.device-toggle-card.device-on .device-name {
  color: #ffffff;
}

.device-sub {
  font-size: 0.62rem;
  font-family: var(--font-mono);
  color: var(--text-muted);
  line-height: 1.25;
}

.device-card-bottom {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding-top: 4px;
  border-top: 1px solid #122212;
}

.device-status-text {
  font-size: 0.66rem;
  font-family: var(--font-mono);
  font-weight: 700;
  letter-spacing: 0.08em;
  color: var(--text-muted);
}

.device-status-text.on {
  color: var(--text-neon);
}

/* Right Column: Full-Height SIMULATION EVENT LOG */
.sim-right-col {
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.event-log-panel {
  background-color: var(--bg-panel);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-lg);
  padding: 16px 18px;
  flex: 1;
  display: flex;
  flex-direction: column;
  min-height: 0;
}

.event-log-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 10px;
  margin-bottom: 12px;
  flex-shrink: 0;
}

.event-log-titles {
  display: flex;
  flex-direction: column;
  gap: 3px;
}

.event-log-sub {
  font-size: 0.64rem;
  font-family: var(--font-mono);
  color: #2e6e2e;
  letter-spacing: 0.08em;
}

.event-log-actions {
  display: flex;
  align-items: center;
  gap: 8px;
}

.event-count {
  font-size: 0.65rem;
  font-family: var(--font-mono);
  padding: 2px 7px;
  border-radius: 4px;
  background-color: #112011;
  color: var(--text-neon);
  border: 1px solid #1b361b;
}

.clear-log-btn {
  padding: 2px 8px;
  border-radius: 4px;
  background-color: #0b160b;
  border: 1px solid var(--border-subtle);
  color: var(--text-secondary);
  font-family: var(--font-mono);
  font-size: 0.65rem;
  cursor: pointer;
  transition: border-color 0.15s ease, color 0.15s ease;
}

.clear-log-btn:hover {
  border-color: var(--text-neon);
  color: var(--text-neon);
}

.event-log-scroll {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 8px;
  max-height: 760px;
  overflow-y: auto;
  min-height: 0;
  scrollbar-width: none;
  -ms-overflow-style: none;
}

.event-log-scroll::-webkit-scrollbar {
  display: none;
}

.event-item {
  background-color: var(--bg-darkest);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-md);
  padding: 10px 12px;
  flex-shrink: 0;
}

.event-item-top {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-bottom: 4px;
}

.event-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  flex-shrink: 0;
}

.event-time {
  font-size: 0.66rem;
  font-family: var(--font-mono);
  color: var(--text-muted);
}

.event-msg {
  font-size: 0.75rem;
  color: var(--text-secondary);
  line-height: 1.4;
}

.event-empty-state {
  padding: 24px 12px;
  text-align: center;
  font-family: var(--font-mono);
  font-size: 0.72rem;
  color: var(--text-muted);
}

@media (max-width: 1150px) {
  .sim-page {
    overflow-y: auto;
  }

  .sim-grid {
    grid-template-columns: 1fr;
    height: auto;
  }

  .devices-row-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}
</style>
