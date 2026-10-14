<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useHydroponicsStore, type Plot } from '@/stores/hydroponics'

const store = useHydroponicsStore()

const searchQuery = ref<string>('')
const selectedZone = ref<string>('ALL')
const selectedStage = ref<string>('ALL')
const showFilterPopover = ref<boolean>(false)
const filterWrapRef = ref<HTMLElement | null>(null)

const stageOptions = [
  { key: 'ALL', label: 'All Stages' },
  { key: 'VEGE', label: 'Vegetative' },
  { key: 'FLOW', label: 'Flowering' },
  { key: 'SEED', label: 'Seedling' },
  { key: 'GERM', label: 'Germination' }
]

const zoneOptions = computed(() => {
  return [
    { key: 'ALL', label: 'All Zones' },
    ...store.availableZones.map((z) => ({
      key: z,
      label: z.replace('ZONE ', 'Zone ')
    }))
  ]
})

const hasActiveFilter = computed(() => {
  return selectedZone.value !== 'ALL' || selectedStage.value !== 'ALL'
})

const filteredPlots = computed<Plot[]>(() => {
  const q = searchQuery.value.trim().toLowerCase()
  const zFilter = selectedZone.value
  const sFilter = selectedStage.value

  return store.plots.filter((p) => {
    const matchesZone = zFilter === 'ALL' || p.zoneName.toUpperCase() === zFilter
    const matchesStage = sFilter === 'ALL' || p.stage.toUpperCase() === sFilter
    const matchesQuery =
      !q ||
      p.cropName.toLowerCase().includes(q) ||
      p.zoneName.toLowerCase().includes(q) ||
      `${p.zoneName} - ${p.cropName}`.toLowerCase().includes(q)
    return matchesZone && matchesStage && matchesQuery
  })
})

function selectZoneFilter(val: string) {
  selectedZone.value = val
  showFilterPopover.value = false
}

function selectStageFilter(val: string) {
  selectedStage.value = val
  showFilterPopover.value = false
}

function resetFilters() {
  selectedZone.value = 'ALL'
  selectedStage.value = 'ALL'
  searchQuery.value = ''
  showFilterPopover.value = false
}

function handleDocumentClick(e: MouseEvent) {
  if (!showFilterPopover.value) return
  if (filterWrapRef.value && !filterWrapRef.value.contains(e.target as Node)) {
    showFilterPopover.value = false
  }
}

onMounted(() => {
  document.addEventListener('mousedown', handleDocumentClick)
})

onUnmounted(() => {
  document.removeEventListener('mousedown', handleDocumentClick)
})
</script>

<template>
  <div class="grow-plots-col">
    <!-- Top Compartment: Grow Plots + Unified Search & Filter Icon Popover -->
    <div class="plots-compartment">
      <div class="col-header">
        <div class="header-top-row">
          <span class="section-title">GROW PLOTS</span>
          <span class="plots-count">{{ filteredPlots.length }}/{{ store.plots.length }}</span>
        </div>

        <!-- Unified Single-Line Search + Filter Icon Bar -->
        <div ref="filterWrapRef" class="unified-search-bar">
          <svg class="search-icon-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75">
            <circle cx="11" cy="11" r="7" />
            <line x1="20" y1="20" x2="16" y2="16" stroke-linecap="round" />
          </svg>

          <input
            v-model="searchQuery"
            type="text"
            placeholder="Search zone or crop..."
            class="plot-search-input"
          />

          <button
            type="button"
            class="filter-icon-btn"
            :class="{ active: showFilterPopover || hasActiveFilter }"
            aria-label="Filter grow plots"
            @click.stop="showFilterPopover = !showFilterPopover"
          >
            <!-- Monoline Funnel / Sliders Icon -->
            <svg class="funnel-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75">
              <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" stroke-linejoin="round" />
            </svg>
            <span v-if="hasActiveFilter" class="filter-dot-badge"></span>
          </button>

          <!-- Floating Filter Dropdown Menu -->
          <div v-if="showFilterPopover" class="filter-dropdown-popover" @click.stop>
            <div class="popover-section">
              <div class="popover-label">BY ZONE</div>
              <div class="popover-options-grid">
                <button
                  v-for="z in zoneOptions"
                  :key="z.key"
                  type="button"
                  class="popover-opt-btn"
                  :class="{ selected: selectedZone === z.key }"
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
                  :class="{ selected: selectedStage === s.key }"
                  @click="selectStageFilter(s.key)"
                >
                  <span>{{ s.label }}</span>
                  <svg
                    v-if="selectedStage === s.key"
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
              <button type="button" class="reset-filters-link" @click="resetFilters">
                Reset Filters
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Vertically Scrollable List with Hidden Scrollbar -->
      <div class="plots-list">
        <div
          v-for="plot in filteredPlots"
          :key="plot.id"
          class="plot-card"
          :class="{ active: store.activePlotId === plot.id }"
          @click="store.setActivePlot(plot.id)"
        >
          <div class="card-top">
            <span class="plot-key">{{ plot.zoneName }}</span>
            <span class="stage-badge" :class="plot.colorType ? `badge-${plot.colorType}` : ''">
              {{ plot.stage }}
            </span>
          </div>

          <div class="plant-name">{{ plot.cropName }}</div>

          <div class="day-progress-track">
            <div
              class="day-progress-bar"
              :class="plot.colorType ? `bar-${plot.colorType}` : ''"
              :style="{ width: `${Math.min(100, (plot.day / plot.totalDays) * 100)}%` }"
            >
              <span class="progress-dot"></span>
            </div>
          </div>

          <div class="card-bottom">
            <span class="day-count">Day {{ plot.day }}/{{ plot.totalDays }}</span>
            <span class="health-val">{{ plot.health }}% Health</span>
          </div>
        </div>

        <div v-if="filteredPlots.length === 0" class="plots-empty">
          No grow plots match filter.
        </div>
      </div>
    </div>

    <!-- Bottom Compartment: Light Schedule (Pinned at bottom) -->
    <div class="schedule-compartment">
      <div class="section-title">LIGHT SCHEDULE</div>

      <div class="light-schedule-box">
        <div class="schedule-row">
          <span class="schedule-time">{{ store.lightSchedule.scheduleText }}</span>
          <span class="photoperiod-badge">{{ store.lightSchedule.badgeText }}</span>
        </div>

        <div class="schedule-bar-track">
          <div
            class="schedule-bar-fill"
            :style="{ width: `${store.lightSchedule.progress}%` }"
          ></div>
        </div>

        <div class="schedule-labels">
          <span>{{ store.lightSchedule.startTime }}</span>
          <span>{{ store.lightSchedule.endTime }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.grow-plots-col {
  display: flex;
  flex-direction: column;
  width: 100%;
  height: 100%;
  min-height: 0;
}

.plots-compartment {
  flex: 1;
  min-height: 0;
  padding: 14px 16px 14px 16px;
  border-bottom: 1px solid var(--border-subtle);
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.col-header {
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.header-top-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.section-title {
  font-size: 0.7rem;
  letter-spacing: 0.12em;
  font-weight: 600;
  color: var(--text-muted);
  text-transform: uppercase;
}

.plots-count {
  font-size: 0.62rem;
  font-family: var(--font-mono);
  color: var(--text-neon);
  background-color: #0b190b;
  border: 1px solid var(--border-subtle);
  padding: 1px 6px;
  border-radius: 3px;
}

/* Unified Search + Filter Icon Bar */
.unified-search-bar {
  position: relative;
  display: flex;
  align-items: center;
  width: 100%;
}

.search-icon-svg {
  position: absolute;
  left: 9px;
  width: 13px;
  height: 13px;
  color: var(--text-muted);
  pointer-events: none;
}

.plot-search-input {
  width: 100%;
  height: 30px;
  padding: 0 34px 0 28px;
  border-radius: 5px;
  background-color: #070e07;
  border: 1px solid var(--border-subtle);
  color: var(--text-primary);
  font-family: var(--font-mono);
  font-size: 0.68rem;
  outline: none;
  transition: border-color 0.15s ease;
}

.plot-search-input:focus {
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
  transition: color 0.15s ease, background-color 0.15s ease, border-color 0.15s ease;
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

/* Floating Filter Dropdown Menu */
.filter-dropdown-popover {
  position: absolute;
  top: calc(100% + 6px);
  left: 0;
  right: 0;
  background-color: #081208;
  border: 1px solid #1e3a1e;
  border-radius: 6px;
  padding: 10px;
  z-index: 50;
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
  transition: border-color 0.15s ease, color 0.15s ease, background-color 0.15s ease;
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

/* Vertically Scrollable List with Hidden Scrollbar */
.plots-list {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 9px;
  scrollbar-width: none;
  -ms-overflow-style: none;
}

.plots-list::-webkit-scrollbar {
  display: none;
}

.plot-card {
  flex: 0 0 auto;
  min-height: 82px;
  background-color: var(--bg-card);
  border: 1px solid var(--border-subtle);
  border-radius: 6px;
  padding: 9px 12px;
  cursor: pointer;
  transition: border-color 0.15s ease, background-color 0.15s ease;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  user-select: none;
}

.plot-card:hover {
  border-color: var(--border-dim);
  background-color: var(--bg-card-hover);
}

.plot-card.active {
  border-color: var(--text-neon);
  background-color: var(--bg-active);
}

.plots-empty {
  padding: 16px 8px;
  text-align: center;
  font-family: var(--font-mono);
  font-size: 0.68rem;
  color: var(--text-muted);
}

.card-top {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.plot-key {
  font-size: 0.68rem;
  font-weight: 700;
  letter-spacing: 0.08em;
  color: var(--text-muted);
}

.plot-card.active .plot-key {
  color: var(--text-neon);
}

.stage-badge {
  font-size: 0.58rem;
  font-weight: 700;
  letter-spacing: 0.06em;
  padding: 2px 7px;
  border-radius: 3px;
  text-transform: uppercase;
  background-color: #0b1e0b;
  color: var(--text-neon);
  border: 1px solid #1a3a1a;
}

.stage-badge.badge-green {
  background-color: #0b1e0b;
  color: var(--text-neon);
  border-color: #1a3a1a;
}

.stage-badge.badge-blue {
  background-color: var(--color-blue-bg);
  color: var(--color-blue);
  border-color: var(--color-blue-border);
}

.stage-badge.badge-slate {
  background-color: var(--color-slate-bg);
  color: var(--color-slate);
  border-color: var(--color-slate-border);
}

.stage-badge.badge-purple {
  background-color: var(--color-purple-bg);
  color: var(--color-purple);
  border-color: var(--color-purple-border);
}

.plant-name {
  font-size: 0.9rem;
  font-weight: 500;
  color: var(--text-primary);
  letter-spacing: 0.01em;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.plot-card.active .plant-name {
  color: #ffffff;
}

/* Progress Bar matching System Health thickness (4px) */
.day-progress-track {
  width: 100%;
  height: 4px;
  background-color: #142614;
  border-radius: 2px;
  margin: 3px 0;
  position: relative;
}

.day-progress-bar {
  height: 100%;
  background-color: var(--text-neon);
  border-radius: 2px;
  position: relative;
}

.day-progress-bar.bar-blue {
  background-color: var(--color-blue);
}
.day-progress-bar.bar-blue .progress-dot {
  background-color: var(--color-blue);
}

.day-progress-bar.bar-slate {
  background-color: var(--color-slate);
}
.day-progress-bar.bar-slate .progress-dot {
  background-color: var(--color-slate);
}

.day-progress-bar.bar-purple {
  background-color: var(--color-purple);
}
.day-progress-bar.bar-purple .progress-dot {
  background-color: var(--color-purple);
}

.progress-dot {
  position: absolute;
  right: -1px;
  top: -1.5px;
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background-color: var(--text-neon);
}

.card-bottom {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 0.7rem;
  font-family: var(--font-mono);
}

.day-count {
  color: var(--text-muted);
}

.health-val {
  color: var(--text-neon);
  font-weight: 500;
}

/* Light Schedule Compartment */
.schedule-compartment {
  height: 136px;
  min-height: 136px;
  padding: 12px 16px 14px 16px;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  flex-shrink: 0;
}

.light-schedule-box {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.schedule-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.schedule-time {
  font-size: 0.82rem;
  font-family: var(--font-mono);
  font-weight: 500;
  color: var(--text-secondary);
  letter-spacing: 0.02em;
}

.photoperiod-badge {
  font-size: 0.58rem;
  font-weight: 700;
  letter-spacing: 0.08em;
  background-color: #0b1e0b;
  color: var(--text-neon);
  border: 1px solid #1a3a1a;
  padding: 2.5px 7px;
  border-radius: 3px;
}

.schedule-bar-track {
  width: 100%;
  height: 6px;
  background-color: #142614;
  border-radius: 3px;
  overflow: hidden;
}

.schedule-bar-fill {
  height: 100%;
  background-color: var(--text-neon);
  border-radius: 3px;
}

.schedule-labels {
  display: flex;
  justify-content: space-between;
  font-size: 0.7rem;
  font-family: var(--font-mono);
  color: var(--text-muted);
}
</style>
