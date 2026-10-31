<script setup lang="ts">
import { ref, computed } from 'vue'
import { useHydroponicsStore } from '@/stores/hydroponics'
import analyticsConfig from '@/data/analyticsConfig.json'

interface ChartConfig {
  key: 'temp' | 'ph' | 'water' | 'nutrients' | 'growth'
  label: string
  unit: string
  color: string
  safe?: [number, number]
}

interface DataPoint {
  hour: string
  temp: number
  ph: number
  water: number
  nutrients: number
  growth: number
}

const store = useHydroponicsStore()
const ranges = (analyticsConfig.ranges || ['Last 24h', 'Last 7d', 'Last 30d']) as string[]
const charts = (analyticsConfig.charts || []) as ChartConfig[]

const selectedRange = ref('Last 24h')
const activeChartIdx = ref(0)

const FALLBACK_CHART: ChartConfig = {
  key: 'temp',
  label: 'Temperature (°C)',
  unit: '°C',
  color: '#22e532',
  safe: [18, 28]
}

const activeChart = computed<ChartConfig>(() => {
  return charts[activeChartIdx.value] ?? charts[0] ?? FALLBACK_CHART
})

const safeBounds = computed<[number, number]>(() => {
  const s = activeChart.value?.safe
  if (Array.isArray(s) && s.length >= 2) {
    return [Number(s[0]) || 0, Number(s[1]) || 100]
  }
  return [0, 100]
})

const dataPoints = computed<DataPoint[]>(() => {
  const currentGrowth = store.growth ?? 73
  return Array.from({ length: 24 }, (_, i) => ({
    hour: `${i}:00`,
    temp: +(21 + Math.sin(i * 0.4) * 2.5 + (i % 3) * 0.2).toFixed(1),
    ph: +(6.0 + Math.cos(i * 0.3) * 0.3).toFixed(2),
    water: Math.round(70 + Math.sin(i * 0.25) * 12),
    nutrients: Math.round(72 + Math.cos(i * 0.35) * 10),
    growth: Math.min(100, Math.round(currentGrowth - (23 - i) * 0.3))
  }))
})

const kpiCards = computed(() => {
  const s = store.sensors ?? {
    temperature: 22.4,
    ph: 6.29,
    waterLevel: 68,
    nutrientLevel: 73,
    lightIntensity: 627
  }
  return [
    {
      label: 'Avg Temperature',
      val: `${(s.temperature ?? 22.4).toFixed(1)}°C`,
      sub: 'Safe: 18–28°C',
      ok: s.temperature >= 18 && s.temperature <= 28
    },
    {
      label: 'Avg pH',
      val: (s.ph ?? 6.29).toFixed(2),
      sub: 'Safe: 5.5–6.5',
      ok: s.ph >= 5.5 && s.ph <= 6.5
    },
    {
      label: 'Avg Water Level',
      val: `${Math.round(s.waterLevel ?? 68)}%`,
      sub: 'Safe: 30–90%',
      ok: s.waterLevel >= 30
    },
    {
      label: 'Avg Nutrients',
      val: `${Math.round(s.nutrientLevel ?? 73)}%`,
      sub: 'Safe: 50–95%',
      ok: s.nutrientLevel >= 50
    },
    {
      label: 'Growth Rate',
      val: '+3.2% / day',
      sub: `Current: ${Math.round(store.growth ?? 73)}%`,
      ok: true
    }
  ]
})

// Single-line SVG Chart geometry (viewBox 800 x 220)
const svgW = 800
const svgH = 220
const padLeft = 44
const padRight = 18
const padTop = 16
const padBottom = 28
const plotW = svgW - padLeft - padRight
const plotH = svgH - padTop - padBottom

const singleDomain = computed<[number, number]>(() => {
  const key = activeChart.value?.key || 'temp'
  const pts = dataPoints.value || []
  const vals = pts.map((d) => Number(d?.[key] ?? 0))
  const [safeMin, safeMax] = safeBounds.value
  const minVal = vals.length ? Math.min(...vals, safeMin) : safeMin
  const maxVal = vals.length ? Math.max(...vals, safeMax) : safeMax
  const span = maxVal - minVal || 1
  return [+(minVal - span * 0.15).toFixed(2), +(maxVal + span * 0.15).toFixed(2)]
})

const singleYLabels = computed(() => {
  const [min, max] = singleDomain.value
  const step = (max - min) / 4
  const key = activeChart.value?.key || 'temp'
  return Array.from({ length: 5 }, (_, i) => {
    const val = max - step * i
    const y = padTop + (i / 4) * plotH
    return {
      y,
      text: key === 'ph' ? val.toFixed(2) : key === 'temp' ? val.toFixed(1) : String(Math.round(val))
    }
  })
})

function getX(idx: number): number {
  return padLeft + (idx / 23) * plotW
}

function getSingleY(val: number): number {
  const [min, max] = singleDomain.value
  return padTop + ((max - (val ?? 0)) / (max - min || 1)) * plotH
}

const singlePolyline = computed(() => {
  const key = activeChart.value?.key || 'temp'
  return (dataPoints.value || [])
    .map((d, i) => `${getX(i).toFixed(1)},${getSingleY(d?.[key] ?? 0).toFixed(1)}`)
    .join(' ')
})

const singleHoverIdx = ref<number | null>(null)
const multiHoverIdx = ref<number | null>(null)

const hoveredSinglePoint = computed(() => {
  if (singleHoverIdx.value === null) return null
  return dataPoints.value?.[singleHoverIdx.value] ?? null
})

// Multi-line Normalized SVG Chart geometry (0..100 domain)
const multiSeries = [
  { key: 'tempNorm', label: 'Temp (norm)', color: '#22e532' },
  { key: 'phNorm', label: 'pH (norm)', color: '#39dbd0' },
  { key: 'water', label: 'Water %', color: '#3b9eff' },
  { key: 'nutrients', label: 'Nutrients %', color: '#cc88ff' },
  { key: 'growth', label: 'Growth %', color: '#ff8c00' }
] as const

const normalizedPoints = computed(() => {
  return (dataPoints.value || []).map((d) => ({
    hour: d.hour,
    tempNorm: +((d.temp / 35) * 100).toFixed(1),
    phNorm: +((d.ph / 7.5) * 100).toFixed(1),
    water: d.water,
    nutrients: d.nutrients,
    growth: d.growth
  }))
})

const hoveredMultiPoint = computed(() => {
  if (multiHoverIdx.value === null) return null
  return normalizedPoints.value?.[multiHoverIdx.value] ?? null
})

function getMultiY(val: number): number {
  return padTop + ((100 - (val ?? 0)) / 100) * plotH
}

function getMultiPolyline(key: 'tempNorm' | 'phNorm' | 'water' | 'nutrients' | 'growth'): string {
  return (normalizedPoints.value || [])
    .map((d, i) => `${getX(i).toFixed(1)},${getMultiY(d?.[key] ?? 0).toFixed(1)}`)
    .join(' ')
}

const multiYLabels = [100, 75, 50, 25, 0].map((val, i) => ({
  y: padTop + (i / 4) * plotH,
  text: String(val)
}))
</script>

<template>
  <div class="analytics-page">
    <!-- Header Bar -->
    <div class="analytics-header">
      <div>
        <div class="section-heading">PERFORMANCE ANALYTICS</div>
        <div class="analytics-sub">Simulated sensor trends and plant growth progression over time</div>
      </div>

      <div class="range-btn-group">
        <button
          v-for="r in ranges"
          :key="r"
          type="button"
          class="range-btn"
          :class="{ active: selectedRange === r }"
          @click="selectedRange = r"
        >
          {{ r }}
        </button>
      </div>
    </div>

    <!-- Summary KPI Row -->
    <div class="kpi-grid">
      <div
        v-for="kpi in kpiCards"
        :key="kpi.label"
        class="kpi-card"
      >
        <div class="kpi-label">{{ kpi.label }}</div>
        <div class="kpi-val" :class="kpi.ok ? 'val-ok' : 'val-warn'">{{ kpi.val }}</div>
        <div class="kpi-sub">{{ kpi.sub }}</div>
      </div>
    </div>

    <!-- Single-Metric Line Chart Card -->
    <div class="chart-card">
      <div class="chart-card-header">
        <div class="metric-tabs">
          <button
            v-for="(c, i) in charts"
            :key="c.key"
            type="button"
            class="metric-tab-btn"
            :class="{ active: activeChartIdx === i }"
            :style="activeChartIdx === i ? { borderColor: c.color, color: c.color } : {}"
            @click="activeChartIdx = i"
          >
            {{ c.label }}
          </button>
        </div>

        <span class="safe-range-label">
          Safe range: {{ safeBounds[0] }}–{{ safeBounds[1] }}{{ activeChart.unit }}
        </span>
      </div>

      <div class="svg-chart-wrap" @mouseleave="singleHoverIdx = null">
        <svg :viewBox="`0 0 ${svgW} ${svgH}`" class="analytics-svg">
          <!-- Horizontal Dashed Gridlines & Y Labels -->
          <g v-for="yl in singleYLabels" :key="yl.y">
            <line
              :x1="padLeft"
              :y1="yl.y"
              :x2="svgW - padRight"
              :y2="yl.y"
              stroke="#1a2e1a"
              stroke-dasharray="3 3"
            />
            <text
              :x="padLeft - 8"
              :y="yl.y + 4"
              text-anchor="end"
              fill="#4b6b4b"
              font-size="10"
              font-family="DM Mono, monospace"
            >
              {{ yl.text }}
            </text>
          </g>

          <!-- X Axis Labels -->
          <g v-for="(d, idx) in dataPoints" :key="d.hour">
            <text
              v-if="idx % 3 === 0 || idx === 23"
              :x="getX(idx)"
              :y="svgH - 8"
              text-anchor="middle"
              fill="#4b6b4b"
              font-size="10"
              font-family="DM Mono, monospace"
            >
              {{ d.hour }}
            </text>
          </g>

          <!-- Metric Polyline -->
          <polyline
            fill="none"
            :stroke="activeChart.color"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
            :points="singlePolyline"
          />

          <!-- Hover Guide & Dot -->
          <g v-if="singleHoverIdx !== null && hoveredSinglePoint">
            <line
              :x1="getX(singleHoverIdx)"
              :y1="padTop"
              :x2="getX(singleHoverIdx)"
              :y2="svgH - padBottom"
              stroke="#243e24"
              stroke-dasharray="3 3"
            />
            <circle
              :cx="getX(singleHoverIdx)"
              :cy="getSingleY(hoveredSinglePoint[activeChart.key])"
              r="4.5"
              :fill="activeChart.color"
              stroke="#060c06"
              stroke-width="1.5"
            />
          </g>

          <!-- Interactive Hover Columns -->
          <rect
            v-for="(_, idx) in dataPoints"
            :key="idx"
            :x="getX(idx) - plotW / 48"
            :y="padTop"
            :width="plotW / 24"
            :height="plotH"
            fill="transparent"
            class="hover-col"
            @mouseenter="singleHoverIdx = idx"
          />
        </svg>

        <!-- Floating Tooltip -->
        <div
          v-if="singleHoverIdx !== null && hoveredSinglePoint"
          class="chart-tooltip"
          :style="{ left: `${Math.min(82, Math.max(8, (singleHoverIdx / 23) * 100))}%` }"
        >
          <div class="tooltip-hour">{{ hoveredSinglePoint.hour }}</div>
          <div class="tooltip-row" :style="{ color: activeChart.color }">
            {{ activeChart.label }}:
            <strong>{{ hoveredSinglePoint[activeChart.key] }}{{ activeChart.unit }}</strong>
          </div>
        </div>
      </div>
    </div>

    <!-- Multi-Metric Combined Chart -->
    <div class="chart-card">
      <div class="section-heading multi-heading">ALL METRICS OVERVIEW (NORMALIZED %)</div>

      <!-- Legend -->
      <div class="multi-legend">
        <div v-for="s in multiSeries" :key="s.key" class="legend-item">
          <span class="legend-swatch" :style="{ backgroundColor: s.color }"></span>
          <span class="legend-text" :style="{ color: s.color }">{{ s.label }}</span>
        </div>
      </div>

      <div class="svg-chart-wrap" @mouseleave="multiHoverIdx = null">
        <svg :viewBox="`0 0 ${svgW} ${svgH}`" class="analytics-svg">
          <!-- Gridlines & Y Labels -->
          <g v-for="yl in multiYLabels" :key="yl.y">
            <line
              :x1="padLeft"
              :y1="yl.y"
              :x2="svgW - padRight"
              :y2="yl.y"
              stroke="#1a2e1a"
              stroke-dasharray="3 3"
            />
            <text
              :x="padLeft - 8"
              :y="yl.y + 4"
              text-anchor="end"
              fill="#4b6b4b"
              font-size="10"
              font-family="DM Mono, monospace"
            >
              {{ yl.text }}
            </text>
          </g>

          <!-- X Labels -->
          <g v-for="(d, idx) in normalizedPoints" :key="d.hour">
            <text
              v-if="idx % 3 === 0 || idx === 23"
              :x="getX(idx)"
              :y="svgH - 8"
              text-anchor="middle"
              fill="#4b6b4b"
              font-size="10"
              font-family="DM Mono, monospace"
            >
              {{ d.hour }}
            </text>
          </g>

          <!-- 5 Polylines -->
          <polyline
            v-for="s in multiSeries"
            :key="s.key"
            fill="none"
            :stroke="s.color"
            stroke-width="1.6"
            stroke-linecap="round"
            stroke-linejoin="round"
            :points="getMultiPolyline(s.key)"
          />

          <!-- Hover Guide & Dots -->
          <g v-if="multiHoverIdx !== null && hoveredMultiPoint">
            <line
              :x1="getX(multiHoverIdx)"
              :y1="padTop"
              :x2="getX(multiHoverIdx)"
              :y2="svgH - padBottom"
              stroke="#243e24"
              stroke-dasharray="3 3"
            />
            <circle
              v-for="s in multiSeries"
              :key="s.key"
              :cx="getX(multiHoverIdx)"
              :cy="getMultiY(hoveredMultiPoint[s.key])"
              r="3.5"
              :fill="s.color"
            />
          </g>

          <!-- Interactive Hover Columns -->
          <rect
            v-for="(_, idx) in normalizedPoints"
            :key="idx"
            :x="getX(idx) - plotW / 48"
            :y="padTop"
            :width="plotW / 24"
            :height="plotH"
            fill="transparent"
            class="hover-col"
            @mouseenter="multiHoverIdx = idx"
          />
        </svg>

        <!-- Multi Tooltip -->
        <div
          v-if="multiHoverIdx !== null && hoveredMultiPoint"
          class="chart-tooltip multi-tooltip"
          :style="{ left: `${Math.min(78, Math.max(10, (multiHoverIdx / 23) * 100))}%` }"
        >
          <div class="tooltip-hour">{{ hoveredMultiPoint.hour }}</div>
          <div
            v-for="s in multiSeries"
            :key="s.key"
            class="tooltip-row"
            :style="{ color: s.color }"
          >
            {{ s.label }}: <strong>{{ hoveredMultiPoint[s.key] }}%</strong>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.analytics-page {
  display: flex;
  flex-direction: column;
  gap: 16px;
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

.analytics-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 12px;
}

.analytics-sub {
  font-size: 0.76rem;
  color: var(--text-secondary);
  margin-top: 2px;
}

.range-btn-group {
  display: flex;
  gap: 8px;
}

.range-btn {
  padding: 6px 12px;
  border-radius: var(--radius-md);
  font-size: 0.74rem;
  font-family: var(--font-mono);
  background-color: #112011;
  border: 1px solid var(--border-subtle);
  color: var(--text-muted);
  cursor: pointer;
  transition: all 0.2s ease;
}

.range-btn.active {
  background-color: #142814;
  border-color: var(--text-neon);
  color: var(--text-neon);
}

/* KPI Row */
.kpi-grid {
  display: grid;
  grid-template-columns: repeat(5, minmax(0, 1fr));
  gap: 12px;
}

.kpi-card {
  background-color: var(--bg-panel);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-lg);
  padding: 14px 16px;
}

.kpi-label {
  font-size: 0.66rem;
  font-family: var(--font-mono);
  letter-spacing: 0.1em;
  color: var(--text-muted);
  margin-bottom: 4px;
}

.kpi-val {
  font-size: 1.35rem;
  font-family: var(--font-mono);
  font-weight: 600;
}

.val-ok {
  color: var(--text-neon);
}

.val-warn {
  color: var(--color-warn);
}

.kpi-sub {
  font-size: 0.68rem;
  color: var(--text-muted);
  margin-top: 4px;
}

/* Chart Cards */
.chart-card {
  background-color: var(--bg-panel);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-lg);
  padding: 18px 20px;
}

.chart-card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 14px;
  flex-wrap: wrap;
  gap: 10px;
}

.metric-tabs {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.metric-tab-btn {
  padding: 6px 12px;
  border-radius: var(--radius-md);
  font-size: 0.74rem;
  font-family: var(--font-mono);
  background-color: #112011;
  border: 1px solid var(--border-subtle);
  color: var(--text-muted);
  cursor: pointer;
  transition: all 0.2s ease;
}

.metric-tab-btn.active {
  background-color: #142814;
}

.safe-range-label {
  font-size: 0.72rem;
  font-family: var(--font-mono);
  color: var(--text-muted);
}

.multi-heading {
  margin-bottom: 10px;
}

.multi-legend {
  display: flex;
  align-items: center;
  gap: 18px;
  flex-wrap: wrap;
  margin-bottom: 10px;
}

.legend-item {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 0.72rem;
  font-family: var(--font-mono);
}

.legend-swatch {
  width: 10px;
  height: 3px;
  border-radius: 2px;
}

.svg-chart-wrap {
  position: relative;
  width: 100%;
}

.analytics-svg {
  width: 100%;
  height: 210px;
  display: block;
}

.hover-col {
  cursor: crosshair;
}

.chart-tooltip {
  position: absolute;
  top: 12px;
  transform: translateX(-50%);
  background-color: #0b140b;
  border: 1px solid #243e24;
  border-radius: 6px;
  padding: 8px 12px;
  font-family: var(--font-mono);
  font-size: 0.72rem;
  pointer-events: none;
  z-index: 10;
  white-space: nowrap;
}

.tooltip-hour {
  color: var(--text-secondary);
  margin-bottom: 4px;
  font-weight: 600;
}

.tooltip-row {
  line-height: 1.45;
}

@media (max-width: 1024px) {
  .kpi-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}
</style>
