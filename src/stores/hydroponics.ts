import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

import plotsData from '@/data/plots.json'
import controlsData from '@/data/controls.json'
import scheduleData from '@/data/schedule.json'
import systemData from '@/data/system.json'
import alertsData from '@/data/alerts.json'
import cropsData from '@/data/crops.json'

export type PageId =
  | 'dashboard'
  | 'simulation'
  | 'plants'
  | 'analytics'
  | 'automation'
  | 'alerts'
  | 'settings'

export type CropCategory = 'Leafy Greens' | 'Herbs' | 'Fruiting Crops' | 'Root / Specialty'

export interface SensorState {
  temperature: number
  ph: number
  waterLevel: number
  nutrientLevel: number
  lightIntensity: number
}

export interface AutomationState {
  waterPump: boolean
  nutrientPump: boolean
  growLight: boolean
  coolingSystem: boolean
}

export interface SimEvent {
  time: string
  message: string
  type: 'info' | 'warning' | 'success'
}

export interface AlertItem {
  id: number
  type: 'warning' | 'info' | 'resolved'
  title: string
  description: string
  time: string
}

export interface Plot {
  id: string
  zoneName: string
  cropName: string
  plotKey: string
  name: string
  stage: string
  stageFullName: string
  day: number
  totalDays: number
  health: number
  colorType?: string
}

export interface CropInfo {
  name: string
  icon: string
  stage: string
  temp: string
  ph: string
  nutrients: string
  light: string
  days: number
  desc: string
  category?: CropCategory
  phMin?: number
  phMax?: number
  ecMin?: number
  ecMax?: number
  targetTemp?: number
  photoperiodHours?: number
}

export interface MetricCard {
  id: string
  title: string
  value: string | number
  unit: string
  percentage: number
  optimal: string
  status: string
  isWarning?: boolean
  sparkline?: string
  history?: number[]
}

export interface NutrientItem {
  id: string
  name: string
  amount: string
  time: string
  status: string
  delivered?: boolean
}

export interface SystemControlItem {
  id: string
  name: string
  active: boolean
  activeText: string
  inactiveText: string
  automationKey?: keyof AutomationState
}

export interface FlowControlConfig {
  rate: number
  min: number
  max: number
  step: number
  unit: string
}

export interface HealthMetric {
  id: string
  name: string
  percentage: number
  isWarning?: boolean
}

export interface LightSchedule {
  scheduleText: string
  badgeText: string
  progress: number
  startTime: string
  endTime: string
}

export interface SystemInfo {
  title: string
  status: string
  initialUptime: string
  initialTime: string
}

export interface ZoneTelemetryState {
  sensors: SensorState
  humidity: number
  automation: AutomationState
  flowRate: number
  userOverridden: Record<keyof AutomationState, boolean>
  sensorHistory: Record<string, number[]>
  phMin: number
  phMax: number
  ecMin: number
  ecMax: number
  targetTemp: number
  photoperiodHours: number
}

export interface AgronomicPreset {
  category: CropCategory
  days: number
  targetTemp: number
  photoperiodHours: number
  phMin: number
  phMax: number
  ecMin: number
  ecMax: number
  icon: string
}

export const CROP_CATEGORY_PRESETS: Record<CropCategory, AgronomicPreset> = {
  'Leafy Greens': {
    category: 'Leafy Greens',
    days: 21,
    targetTemp: 20,
    photoperiodHours: 16,
    phMin: 5.8,
    phMax: 6.4,
    ecMin: 1.4,
    ecMax: 2.0,
    icon: 'lettuce'
  },
  Herbs: {
    category: 'Herbs',
    days: 28,
    targetTemp: 23,
    photoperiodHours: 18,
    phMin: 5.5,
    phMax: 6.5,
    ecMin: 1.8,
    ecMax: 2.4,
    icon: 'basil'
  },
  'Fruiting Crops': {
    category: 'Fruiting Crops',
    days: 55,
    targetTemp: 24,
    photoperiodHours: 18,
    phMin: 5.6,
    phMax: 6.3,
    ecMin: 2.0,
    ecMax: 2.8,
    icon: 'tomato'
  },
  'Root / Specialty': {
    category: 'Root / Specialty',
    days: 35,
    targetTemp: 19,
    photoperiodHours: 14,
    phMin: 6.0,
    phMax: 6.6,
    ecMin: 1.6,
    ecMax: 2.2,
    icon: 'kale'
  }
}

export function inferAgronomicPreset(cropName: string, fallbackCategory?: CropCategory): AgronomicPreset {
  const lower = cropName.trim().toLowerCase()
  if (
    lower.includes('basil') ||
    lower.includes('mint') ||
    lower.includes('cilantro') ||
    lower.includes('parsley') ||
    lower.includes('oregano') ||
    lower.includes('thyme') ||
    lower.includes('rosemary') ||
    lower.includes('dill') ||
    lower.includes('chive')
  ) {
    return { ...CROP_CATEGORY_PRESETS['Herbs'] }
  }
  if (
    lower.includes('tomato') ||
    lower.includes('strawberry') ||
    lower.includes('cucumber') ||
    lower.includes('pepper') ||
    lower.includes('chili') ||
    lower.includes('eggplant') ||
    lower.includes('melon') ||
    lower.includes('zucchini')
  ) {
    const base = { ...CROP_CATEGORY_PRESETS['Fruiting Crops'] }
    if (lower.includes('strawberry')) {
      base.days = 45
      base.targetTemp = 21.5
      base.phMin = 5.5
      base.phMax = 6.2
      base.ecMin = 1.6
      base.ecMax = 2.2
      base.icon = 'strawberry'
    } else if (lower.includes('cucumber')) {
      base.days = 42
      base.targetTemp = 24
    }
    return base
  }
  if (
    lower.includes('carrot') ||
    lower.includes('radish') ||
    lower.includes('beet') ||
    lower.includes('turnip') ||
    lower.includes('wasabi') ||
    lower.includes('ginger') ||
    lower.includes('microgreen')
  ) {
    return { ...CROP_CATEGORY_PRESETS['Root / Specialty'] }
  }
  if (
    lower.includes('lettuce') ||
    lower.includes('spinach') ||
    lower.includes('bok choy') ||
    lower.includes('pak choi') ||
    lower.includes('kale') ||
    lower.includes('chard') ||
    lower.includes('arugula') ||
    lower.includes('cabbage') ||
    lower.includes('watercress') ||
    lower.includes('mustard')
  ) {
    const base = { ...CROP_CATEGORY_PRESETS['Leafy Greens'] }
    if (lower.includes('kale')) {
      base.days = 35
      base.icon = 'kale'
    } else if (lower.includes('spinach')) {
      base.days = 24
      base.targetTemp = 19
    } else if (lower.includes('bok choy') || lower.includes('cabbage')) {
      base.days = 28
      base.targetTemp = 21
    }
    return base
  }
  return { ...CROP_CATEGORY_PRESETS[fallbackCategory || 'Leafy Greens'] }
}

function clamp(val: number, min: number, max: number) {
  return Math.min(max, Math.max(min, val))
}

function pointsToSvgPath(data: number[], w = 100, h = 28): string {
  if (!data || data.length < 2) return 'M 2 20 L 98 20'
  const min = Math.min(...data)
  const max = Math.max(...data)
  const range = max - min || 1
  return data
    .map((v, i) => {
      const x = (i / (data.length - 1)) * (w - 4) + 2
      const y = h - ((v - min) / range) * (h - 6) - 3
      return `${i === 0 ? 'M' : 'L'} ${x.toFixed(1)} ${y.toFixed(1)}`
    })
    .join(' ')
}

function buildInitialPlotStates(): Record<string, ZoneTelemetryState> {
  return {
    'plot-1': {
      sensors: {
        temperature: 22.4,
        ph: 6.29,
        waterLevel: 68,
        nutrientLevel: 73,
        lightIntensity: 26.2
      },
      humidity: 72,
      automation: {
        waterPump: true,
        nutrientPump: true,
        growLight: true,
        coolingSystem: false
      },
      flowRate: 2.4,
      userOverridden: {
        waterPump: false,
        nutrientPump: false,
        growLight: false,
        coolingSystem: false
      },
      sensorHistory: {
        ph: [6.21, 6.25, 6.19, 6.24, 6.17, 6.26, 6.15, 6.29],
        cond: [1.95, 1.92, 1.9, 1.88, 1.86, 1.85, 1.83, 1.82],
        temp: [22.2, 22.5, 22.6, 22.5, 22.6, 22.5, 22.4, 22.4],
        water: [74, 73, 72, 71, 70, 69, 68.5, 68],
        humid: [76, 75, 74.5, 74, 73.5, 73, 72.5, 72],
        light: [25.8, 25.4, 26.8, 26.1, 26.5, 25.6, 26.7, 26.2]
      },
      phMin: 5.5,
      phMax: 6.5,
      ecMin: 1.8,
      ecMax: 2.4,
      targetTemp: 23,
      photoperiodHours: 18
    },
    'plot-2': {
      sensors: {
        temperature: 19.8,
        ph: 6.08,
        waterLevel: 82,
        nutrientLevel: 68,
        lightIntensity: 24.5
      },
      humidity: 66,
      automation: {
        waterPump: true,
        nutrientPump: true,
        growLight: true,
        coolingSystem: true
      },
      flowRate: 2.0,
      userOverridden: {
        waterPump: false,
        nutrientPump: false,
        growLight: false,
        coolingSystem: false
      },
      sensorHistory: {
        ph: [6.04, 6.06, 6.05, 6.09, 6.07, 6.08, 6.07, 6.08],
        cond: [1.72, 1.71, 1.7, 1.69, 1.71, 1.7, 1.7, 1.7],
        temp: [20.1, 20.0, 19.9, 19.9, 19.8, 19.8, 19.9, 19.8],
        water: [85, 84.5, 84, 83.5, 83, 82.8, 82.4, 82],
        humid: [68, 67.5, 67, 67, 66.5, 66.5, 66, 66],
        light: [24.1, 24.4, 24.2, 24.6, 24.3, 24.5, 24.4, 24.5]
      },
      phMin: 5.8,
      phMax: 6.4,
      ecMin: 1.4,
      ecMax: 2.0,
      targetTemp: 20,
      photoperiodHours: 16
    },
    'plot-3': {
      sensors: {
        temperature: 18.9,
        ph: 6.18,
        waterLevel: 88,
        nutrientLevel: 64,
        lightIntensity: 22.8
      },
      humidity: 64,
      automation: {
        waterPump: true,
        nutrientPump: true,
        growLight: true,
        coolingSystem: false
      },
      flowRate: 1.8,
      userOverridden: {
        waterPump: false,
        nutrientPump: false,
        growLight: false,
        coolingSystem: false
      },
      sensorHistory: {
        ph: [6.15, 6.16, 6.17, 6.16, 6.18, 6.17, 6.19, 6.18],
        cond: [1.62, 1.61, 1.6, 1.61, 1.6, 1.59, 1.6, 1.6],
        temp: [18.8, 18.9, 19.0, 18.9, 18.8, 18.9, 18.9, 18.9],
        water: [90, 89.6, 89.2, 89.0, 88.7, 88.4, 88.2, 88],
        humid: [65, 65, 64.5, 64.5, 64, 64, 64, 64],
        light: [22.4, 22.6, 22.5, 22.9, 22.7, 22.8, 22.6, 22.8]
      },
      phMin: 5.8,
      phMax: 6.5,
      ecMin: 1.4,
      ecMax: 2.0,
      targetTemp: 19,
      photoperiodHours: 16
    },
    'plot-4': {
      sensors: {
        temperature: 24.2,
        ph: 5.95,
        waterLevel: 76,
        nutrientLevel: 88,
        lightIntensity: 31.4
      },
      humidity: 69,
      automation: {
        waterPump: true,
        nutrientPump: true,
        growLight: true,
        coolingSystem: false
      },
      flowRate: 3.0,
      userOverridden: {
        waterPump: false,
        nutrientPump: false,
        growLight: false,
        coolingSystem: false
      },
      sensorHistory: {
        ph: [5.92, 5.94, 5.93, 5.96, 5.94, 5.95, 5.96, 5.95],
        cond: [2.18, 2.19, 2.2, 2.21, 2.19, 2.2, 2.2, 2.2],
        temp: [24.0, 24.1, 24.2, 24.1, 24.3, 24.2, 24.2, 24.2],
        water: [79, 78.5, 78, 77.5, 77, 76.6, 76.3, 76],
        humid: [70, 70, 69.5, 69.5, 69, 69, 69, 69],
        light: [30.8, 31.1, 31.5, 31.2, 31.6, 31.3, 31.5, 31.4]
      },
      phMin: 5.6,
      phMax: 6.3,
      ecMin: 2.0,
      ecMax: 2.8,
      targetTemp: 24,
      photoperiodHours: 18
    }
  }
}

function createPlotTelemetryFromPreset(preset: {
  phMin: number
  phMax: number
  ecMin: number
  ecMax: number
  targetTemp: number
  photoperiodHours: number
}): ZoneTelemetryState {
  const midPh = +((preset.phMin + preset.phMax) / 2).toFixed(2)
  const midEc = +((preset.ecMin + preset.ecMax) / 2).toFixed(2)
  const nutLevel = clamp(Math.round((midEc / 2.5) * 100), 40, 96)
  const temp = +preset.targetTemp.toFixed(1)
  const light = 27.5
  return {
    sensors: {
      temperature: temp,
      ph: midPh,
      waterLevel: 82,
      nutrientLevel: nutLevel,
      lightIntensity: light
    },
    humidity: 68,
    automation: {
      waterPump: true,
      nutrientPump: true,
      growLight: true,
      coolingSystem: false
    },
    flowRate: 2.4,
    userOverridden: {
      waterPump: false,
      nutrientPump: false,
      growLight: false,
      coolingSystem: false
    },
    sensorHistory: {
      ph: Array.from({ length: 8 }, (_, i) => +(midPh + (i % 2 === 0 ? -0.02 : 0.02)).toFixed(2)),
      cond: Array.from({ length: 8 }, () => midEc),
      temp: Array.from({ length: 8 }, (_, i) => +(temp + (i % 2 === 0 ? -0.1 : 0.1)).toFixed(1)),
      water: [84, 83.8, 83.5, 83.2, 82.9, 82.6, 82.3, 82],
      humid: [69, 69, 68.5, 68.5, 68, 68, 68, 68],
      light: [27.1, 27.4, 27.2, 27.6, 27.3, 27.5, 27.4, 27.5]
    },
    phMin: preset.phMin,
    phMax: preset.phMax,
    ecMin: preset.ecMin,
    ecMax: preset.ecMax,
    targetTemp: preset.targetTemp,
    photoperiodHours: preset.photoperiodHours
  }
}

const AUTH_STORAGE_KEY = 'farmsim_auth'

export const useHydroponicsStore = defineStore('hydroponics', () => {
  // ── Admin Authentication State ──
  const isAuthenticated = ref<boolean>(
    typeof window !== 'undefined' && localStorage.getItem(AUTH_STORAGE_KEY) === 'true'
  )
  const adminUser = ref({
    username: 'ADMIN',
    role: 'System Administrator',
    avatar: 'A'
  })

  function login(username: string, password: string): boolean {
    const cleanUser = username.trim().toLowerCase()
    if ((cleanUser === 'admin' || cleanUser === 'administrator') && password === 'admin123') {
      isAuthenticated.value = true
      if (typeof window !== 'undefined') {
        localStorage.setItem(AUTH_STORAGE_KEY, 'true')
      }
      addEvent('System Administrator authenticated via Auth Gateway', 'info')
      return true
    }
    return false
  }

  function logout() {
    isAuthenticated.value = false
    if (typeof window !== 'undefined') {
      localStorage.removeItem(AUTH_STORAGE_KEY)
    }
  }

  // ── Core Simulator State ──
  const simRunning = ref<boolean>(true)
  const manualMode = ref<boolean>(false)
  const simSpeed = ref<1 | 5 | 10>(1)
  const simDay = ref<number>(11)
  const growth = ref<number>(73)
  const selectedCrop = ref<string>('Basil')

  const crops = ref<CropInfo[]>([...(cropsData.crops as CropInfo[])])
  const events = ref<SimEvent[]>([...(alertsData.initialEvents as SimEvent[])])
  const alerts = ref<AlertItem[]>([...(alertsData.initialAlerts as AlertItem[])])
  let nextAlertId = 5
  let nextPlotNum = 5

  // ── Grow Plots State (Supports Multiple Crops Per Zone, each with Unique Plot ID) ──
  const plots = ref<Plot[]>(
    (plotsData.plots as Plot[]).map((p, idx) => ({
      ...p,
      id: p.id || `plot-${idx + 1}`,
      zoneName: p.zoneName || p.plotKey || `ZONE ${String.fromCharCode(65 + idx)}`,
      cropName: p.cropName || p.name,
      plotKey: p.zoneName || p.plotKey || `ZONE ${String.fromCharCode(65 + idx)}`,
      name: p.cropName || p.name
    }))
  )
  const activePlotId = ref<string>(plotsData.activePlotId || 'plot-1')
  const zoneStates = ref<Record<string, ZoneTelemetryState>>(buildInitialPlotStates())

  function getPlotState(plotId?: string): ZoneTelemetryState {
    const id = plotId || activePlotId.value || 'plot-1'
    if (!zoneStates.value[id]) {
      zoneStates.value[id] = createPlotTelemetryFromPreset(CROP_CATEGORY_PRESETS['Herbs'])
    }
    return zoneStates.value[id]!
  }

  const activeZoneState = computed<ZoneTelemetryState>(() => getPlotState(activePlotId.value))

  // Distinct Zone Names (ZONE A, ZONE B, ZONE C, ZONE D, ...)
  const availableZones = computed<string[]>(() => {
    const base = ['ZONE A', 'ZONE B', 'ZONE C', 'ZONE D']
    const set = new Set<string>(base)
    plots.value.forEach((p) => {
      if (p.zoneName) set.add(p.zoneName.toUpperCase())
    })
    return Array.from(set)
  })

  // Next available new zone name (ZONE E, ZONE F, ...)
  const nextZoneKey = computed<string>(() => {
    const count = availableZones.value.length
    const letter = String.fromCharCode(65 + (count % 26))
    const suffix = count >= 26 ? String(Math.floor(count / 26)) : ''
    return `ZONE ${letter}${suffix}`
  })

  // Computed / Proxied Active Plot Telemetry
  const sensors = computed<SensorState>({
    get: () => activeZoneState.value.sensors,
    set: (val) => {
      activeZoneState.value.sensors = val
    }
  })

  const humidity = computed<number>({
    get: () => activeZoneState.value.humidity,
    set: (val) => {
      activeZoneState.value.humidity = val
    }
  })

  const automation = computed<AutomationState>({
    get: () => activeZoneState.value.automation,
    set: (val) => {
      activeZoneState.value.automation = val
    }
  })

  const sensorHistory = computed<Record<string, number[]>>({
    get: () => activeZoneState.value.sensorHistory,
    set: (val) => {
      activeZoneState.value.sensorHistory = val
    }
  })

  const flowControlConfig = ref<FlowControlConfig>(controlsData.flowControl)
  const flowRate = computed<number>({
    get: () => activeZoneState.value.flowRate,
    set: (val) => {
      activeZoneState.value.flowRate = val
    }
  })

  function computeStageFromDay(day: number, totalDays: number): {
    stage: string
    stageFullName: string
    colorType: string
  } {
    const ratio = totalDays > 0 ? day / totalDays : 0
    if (ratio < 0.18) {
      return { stage: 'GERM', stageFullName: 'GERMINATION', colorType: 'purple' }
    }
    if (ratio < 0.36) {
      return { stage: 'SEED', stageFullName: 'SEEDLING', colorType: 'slate' }
    }
    if (ratio < 0.68) {
      return { stage: 'VEGE', stageFullName: 'VEGETATIVE', colorType: 'green' }
    }
    if (ratio < 0.9) {
      return { stage: 'FLOW', stageFullName: 'FLOWERING', colorType: 'blue' }
    }
    return { stage: 'HARV', stageFullName: 'HARVEST', colorType: 'green' }
  }

  const activePlot = computed<Plot>(() => {
    const found = plots.value.find(p => p.id === activePlotId.value)
    return (
      found ||
      plots.value[0] || {
        id: 'plot-1',
        zoneName: 'ZONE A',
        cropName: 'Basil (Genovese)',
        plotKey: 'ZONE A',
        name: 'Basil (Genovese)',
        stage: 'VEGE',
        stageFullName: 'VEGETATIVE',
        day: 11,
        totalDays: 28,
        health: 73,
        colorType: 'green'
      }
    )
  })

  function setActivePlot(id: string) {
    activePlotId.value = id
    const found = plots.value.find(p => p.id === id)
    if (found) {
      simDay.value = found.day
      growth.value = clamp(found.health || Math.round((found.day / found.totalDays) * 100), 10, 100)
      const matchingCrop = crops.value.find(
        c =>
          found.cropName.toLowerCase().includes(c.name.toLowerCase()) ||
          c.name.toLowerCase().includes(found.cropName.toLowerCase())
      )
      if (matchingCrop) {
        selectedCrop.value = matchingCrop.name
      }
    }
  }

  // Selecting a crop in Plant Management never overwrites an existing plot's crop
  function setSelectedCrop(cropName: string) {
    selectedCrop.value = cropName
    const existingPlot = plots.value.find(
      p =>
        p.cropName.toLowerCase() === cropName.toLowerCase() ||
        p.cropName.toLowerCase().startsWith(cropName.toLowerCase() + ' ')
    )
    if (existingPlot) {
      setActivePlot(existingPlot.id)
    }
  }

  function setSimRunning(val: boolean) {
    simRunning.value = val
    addEvent(`Simulation ${val ? 'resumed' : 'paused'}`, 'info')
  }

  function setManualMode(val: boolean) {
    manualMode.value = val
    addEvent(`Control mode switched to ${val ? 'MANUAL' : 'AUTO'}`, 'info')
  }

  function setSimSpeed(speed: 1 | 5 | 10) {
    simSpeed.value = speed
    restartSimulationLoop()
    addEvent(`Simulation speed set to ${speed}x`, 'info')
  }

  // ── +1 Day (Advance Growth Stage for Active Plot) ──
  function advanceDay() {
    const plot = plots.value.find(p => p.id === activePlotId.value) || plots.value[0]
    if (!plot) return

    if (plot.day >= plot.totalDays) {
      plot.day = 1
    } else {
      plot.day += 1
    }
    simDay.value = plot.day

    const prevStage = plot.stageFullName
    const nextStage = computeStageFromDay(plot.day, plot.totalDays)
    plot.stage = nextStage.stage
    plot.stageFullName = nextStage.stageFullName
    plot.colorType = nextStage.colorType

    growth.value = clamp(Math.round((plot.day / plot.totalDays) * 100), 8, 100)
    plot.health = clamp(Math.max(75, Math.round(growth.value)), 70, 100)

    if (prevStage !== nextStage.stageFullName) {
      addEvent(
        `${plot.zoneName} — ${plot.cropName} advanced to ${nextStage.stageFullName} stage (Day ${plot.day}/${plot.totalDays})`,
        'success'
      )
      addAlert(
        `Growth Stage Transition: ${nextStage.stageFullName}`,
        `${plot.zoneName} (${plot.cropName}) progressed from ${prevStage} to ${nextStage.stageFullName} on Day ${plot.day}.`,
        'info'
      )
    } else {
      addEvent(
        `Advanced +1 Day -> ${plot.zoneName} (${plot.cropName}) Day ${plot.day} of ${plot.totalDays} (${plot.stageFullName})`,
        'info'
      )
    }
  }

  // ── Add / Configure Crop Preset & Grow Plot (Appends New Plot to Zone without Overwriting Existing Zone Plants) ──
  function saveCropAndZoneConfig(payload: {
    zoneId: string
    cropName: string
    category?: CropCategory
    days: number
    phMin: number
    phMax: number
    ecMin: number
    ecMax: number
    targetTemp: number
    photoperiodHours: number
    desc?: string
    editPlotId?: string
  }) {
    const cleanName = payload.cropName.trim()
    const preset = inferAgronomicPreset(cleanName, payload.category)
    const phStr = `${payload.phMin.toFixed(1)}–${payload.phMax.toFixed(1)}`
    const tempStr = `${Math.max(12, Math.round(payload.targetTemp - 3))}–${Math.round(payload.targetTemp + 3)}°C`
    const nutPctMin = Math.round((payload.ecMin / 2.5) * 100)
    const nutPctMax = Math.min(100, Math.round((payload.ecMax / 2.5) * 100))
    const nutStr = `${nutPctMin}–${nutPctMax}% (${payload.ecMin.toFixed(1)}–${payload.ecMax.toFixed(1)} mS/cm)`
    const lightStr = `${payload.photoperiodHours}h On / ${24 - payload.photoperiodHours}h Off`

    // 1. Update or append Crop Preset in Plant Management
    const existingCrop = crops.value.find(
      c => c.name.toLowerCase() === cleanName.toLowerCase()
    )

    if (existingCrop) {
      existingCrop.days = payload.days
      existingCrop.temp = tempStr
      existingCrop.ph = phStr
      existingCrop.nutrients = nutStr
      existingCrop.light = lightStr
      existingCrop.category = payload.category ?? preset.category
      existingCrop.phMin = payload.phMin
      existingCrop.phMax = payload.phMax
      existingCrop.ecMin = payload.ecMin
      existingCrop.ecMax = payload.ecMax
      existingCrop.targetTemp = payload.targetTemp
      existingCrop.photoperiodHours = payload.photoperiodHours
      if (payload.desc) existingCrop.desc = payload.desc
      selectedCrop.value = existingCrop.name
    } else {
      const newCrop: CropInfo = {
        name: cleanName,
        icon: preset.icon,
        stage: 'Vegetative',
        temp: tempStr,
        ph: phStr,
        nutrients: nutStr,
        light: lightStr,
        days: payload.days,
        desc:
          payload.desc ||
          `${payload.category || preset.category} hydroponic profile (${phStr} pH, ${payload.ecMin.toFixed(1)}–${payload.ecMax.toFixed(1)} mS/cm EC, ${payload.photoperiodHours}h light).`,
        category: payload.category ?? preset.category,
        phMin: payload.phMin,
        phMax: payload.phMax,
        ecMin: payload.ecMin,
        ecMax: payload.ecMax,
        targetTemp: payload.targetTemp,
        photoperiodHours: payload.photoperiodHours
      }
      crops.value.push(newCrop)
      selectedCrop.value = newCrop.name
    }

    // 2. Resolve Target Zone Name ('ZONE A', 'ZONE B', ..., or new 'ZONE E')
    const resolvedZoneName =
      payload.zoneId === '__NEW__'
        ? nextZoneKey.value
        : payload.zoneId.toUpperCase().startsWith('ZONE ')
          ? payload.zoneId.toUpperCase()
          : plots.value.find(p => p.id === payload.zoneId)?.zoneName || 'ZONE A'

    // Check if user is explicitly editing an existing plot with the exact same zone & crop name
    const existingEditablePlot = payload.editPlotId
      ? plots.value.find(
          p =>
            p.id === payload.editPlotId &&
            p.zoneName.toUpperCase() === resolvedZoneName &&
            p.cropName.toLowerCase() === cleanName.toLowerCase()
        )
      : undefined

    let targetPlot: Plot
    if (existingEditablePlot) {
      existingEditablePlot.totalDays = payload.days
      existingEditablePlot.day = Math.min(existingEditablePlot.day, payload.days)
      const st = computeStageFromDay(existingEditablePlot.day, existingEditablePlot.totalDays)
      existingEditablePlot.stage = st.stage
      existingEditablePlot.stageFullName = st.stageFullName
      existingEditablePlot.colorType = st.colorType

      const zs = getPlotState(existingEditablePlot.id)
      zs.phMin = payload.phMin
      zs.phMax = payload.phMax
      zs.ecMin = payload.ecMin
      zs.ecMax = payload.ecMax
      zs.targetTemp = payload.targetTemp
      zs.photoperiodHours = payload.photoperiodHours
      targetPlot = existingEditablePlot
      setActivePlot(existingEditablePlot.id)
    } else {
      // Append as a new Grow Plot instance in that zone so existing plants in the zone are preserved!
      const newPlotId = `plot-${nextPlotNum++}`
      const initDay = Math.min(7, Math.max(1, Math.round(payload.days * 0.28)))
      const st = computeStageFromDay(initDay, payload.days)
      const createdPlot: Plot = {
        id: newPlotId,
        zoneName: resolvedZoneName,
        cropName: cleanName,
        plotKey: resolvedZoneName,
        name: cleanName,
        stage: st.stage,
        stageFullName: st.stageFullName,
        day: initDay,
        totalDays: payload.days,
        health: 92,
        colorType: st.colorType
      }
      plots.value.push(createdPlot)
      zoneStates.value[newPlotId] = createPlotTelemetryFromPreset({
        phMin: payload.phMin,
        phMax: payload.phMax,
        ecMin: payload.ecMin,
        ecMax: payload.ecMax,
        targetTemp: payload.targetTemp,
        photoperiodHours: payload.photoperiodHours
      })
      targetPlot = createdPlot
      setActivePlot(createdPlot.id)
    }

    addEvent(
      `Added/Configured ${targetPlot.zoneName} — ${targetPlot.cropName} (${payload.days}d cycle, pH ${phStr}, Photoperiod ${payload.photoperiodHours}h)`,
      'success'
    )
    addAlert(
      'Grow Plot Configured',
      `${targetPlot.zoneName} — ${targetPlot.cropName} active (Target pH ${phStr}, EC ${payload.ecMin.toFixed(1)}–${payload.ecMax.toFixed(1)} mS/cm, Temp ${payload.targetTemp}°C).`,
      'info'
    )
  }

  // ── Event & Alert Helpers ──
  function addEvent(message: string, type: SimEvent['type']) {
    const now = new Date()
    const time = now.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      second: '2-digit',
      hour12: true
    })
    events.value = [{ time, message, type }, ...events.value].slice(0, 50)
  }

  function clearEvents() {
    events.value = []
  }

  function addAlert(title: string, description: string, type: AlertItem['type']) {
    const now = new Date()
    const time = now.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    })
    alerts.value = [
      { id: nextAlertId++, type, title, description, time },
      ...alerts.value
    ].slice(0, 30)
  }

  const warningCount = computed(() => alerts.value.filter(a => a.type === 'warning').length)

  // ── Per-Plot System Controls (Reactive to Active Plot) ──
  const systemControls = computed<SystemControlItem[]>(() => {
    const zs = activeZoneState.value
    return [
      {
        id: 'pump',
        name: 'Circulation Pump',
        active: zs.automation.waterPump,
        activeText: `${zs.flowRate.toFixed(1)} L/min`,
        inactiveText: 'Inactive',
        automationKey: 'waterPump'
      },
      {
        id: 'lights',
        name: 'Grow Lights',
        active: zs.automation.growLight,
        activeText: `${zs.sensors.lightIntensity.toFixed(1)} klux`,
        inactiveText: 'Off',
        automationKey: 'growLight'
      },
      {
        id: 'fan',
        name: 'Ventilation Fan',
        active: zs.automation.coolingSystem,
        activeText: '1400 RPM',
        inactiveText: 'Off',
        automationKey: 'coolingSystem'
      },
      {
        id: 'dosing',
        name: 'Auto Dosing',
        active: zs.automation.nutrientPump,
        activeText: 'Active',
        inactiveText: 'Off',
        automationKey: 'nutrientPump'
      }
    ]
  })

  // Sync Flow Rate Slider -> Circulation Pump state for Active Plot
  function setFlowRate(rate: number) {
    const zs = activeZoneState.value
    const clampedRate = +clamp(rate, flowControlConfig.value.min, flowControlConfig.value.max).toFixed(1)
    zs.flowRate = clampedRate
    zs.userOverridden.waterPump = true

    const plotTag = `${activePlot.value.zoneName} • ${activePlot.value.cropName}`
    if (clampedRate > 0 && !zs.automation.waterPump) {
      zs.automation.waterPump = true
      addEvent(
        `[${plotTag}] Circulation Pump activated via Flow Rate (${clampedRate.toFixed(1)} L/min)`,
        'info'
      )
    } else if (clampedRate === 0 && zs.automation.waterPump) {
      zs.automation.waterPump = false
      addEvent(`[${plotTag}] Circulation Pump turned OFF (Flow Rate 0.0 L/min)`, 'info')
    }
  }

  function toggleAutomation(key: keyof AutomationState) {
    const zs = activeZoneState.value
    zs.userOverridden[key] = true
    const nextState = !zs.automation[key]
    zs.automation[key] = nextState

    if (key === 'waterPump') {
      zs.flowRate = nextState ? 2.4 : 0.0
    }

    if (key === 'growLight') {
      if (!nextState) {
        zs.sensors = { ...zs.sensors, lightIntensity: 0.0 }
      } else if (zs.sensors.lightIntensity < 18) {
        zs.sensors = { ...zs.sensors, lightIntensity: 26.2 }
      }
      recordZoneSensorHistory(zs)
    }

    const labelMap: Record<keyof AutomationState, string> = {
      waterPump: 'Circulation Pump',
      growLight: 'Grow Lights',
      coolingSystem: 'Ventilation Fan',
      nutrientPump: 'Auto Dosing'
    }
    addEvent(
      `[${activePlot.value.zoneName} • ${activePlot.value.cropName}] ${labelMap[key]} turned ${nextState ? 'ON' : 'OFF'}`,
      'info'
    )
  }

  function toggleControl(id: string) {
    const item = systemControls.value.find(c => c.id === id)
    if (item && item.automationKey) {
      toggleAutomation(item.automationKey)
    }
  }

  // ── Extreme-Threshold Safety Evaluation per Plot ──
  function evaluateSafetyThresholdsForZone(zs: ZoneTelemetryState, plotLabel: string) {
    if (manualMode.value) return
    const s = zs.sensors
    const ecVal = (s.nutrientLevel / 100) * 2.5

    if (s.temperature > 30 && !zs.automation.coolingSystem && !zs.userOverridden.coolingSystem) {
      zs.automation.coolingSystem = true
      addEvent(
        `[${plotLabel}] Extreme temperature (${s.temperature.toFixed(1)}°C) — Ventilation Fan auto-activated`,
        'warning'
      )
      addAlert(
        `${plotLabel}: High Temperature (> 30°C)`,
        `Canopy temperature in ${plotLabel} reached ${s.temperature.toFixed(1)}°C. Ventilation fan activated.`,
        'warning'
      )
    }

    if (
      (s.ph < zs.phMin - 0.3 || s.ph > zs.phMax + 0.3 || ecVal < zs.ecMin - 0.3) &&
      !zs.automation.nutrientPump &&
      !zs.userOverridden.nutrientPump
    ) {
      zs.automation.nutrientPump = true
      addEvent(`[${plotLabel}] Extreme pH / EC drift detected — Auto Dosing engaged`, 'warning')
      addAlert(
        `${plotLabel}: Auto Dosing Engaged`,
        `pH (${s.ph.toFixed(2)}) or EC (${ecVal.toFixed(2)} mS/cm) in ${plotLabel} drifted outside safe limits. Auto Dosing activated.`,
        'warning'
      )
    }
  }

  function recordZoneSensorHistory(zs: ZoneTelemetryState) {
    const s = zs.sensors
    if (!s) return
    const cond = ((s.nutrientLevel ?? 73) / 100) * 2.5
    const humid = zs.humidity ?? 72
    const lightK = s.lightIntensity ?? 26.2

    const vals: Record<string, number> = {
      ph: s.ph ?? 6.29,
      cond,
      temp: s.temperature ?? 22.4,
      water: s.waterLevel ?? 68,
      humid,
      light: lightK
    }

    if (!zs.sensorHistory) {
      zs.sensorHistory = {}
    }

    Object.entries(vals).forEach(([k, v]) => {
      const existing = Array.isArray(zs.sensorHistory[k]) ? [...zs.sensorHistory[k]!] : []
      existing.push(v)
      if (existing.length > 22) existing.shift()
      zs.sensorHistory[k] = existing
    })
  }

  // ── Computed Dashboard Sensor Cards (reactive to Active Plot sensors & thresholds) ──
  const metrics = computed<MetricCard[]>(() => {
    const zs = activeZoneState.value
    const s = zs.sensors
    const cond = (s.nutrientLevel / 100) * 2.5
    const humid = zs.humidity
    const lightK = s.lightIntensity
    const h = zs.sensorHistory

    const tempMin = Math.round(zs.targetTemp - 3)
    const tempMax = Math.round(zs.targetTemp + 3)

    const phWarn = s.ph < zs.phMin || s.ph > zs.phMax
    const condWarn = cond < zs.ecMin || cond > zs.ecMax
    const tempWarn = s.temperature < tempMin || s.temperature > tempMax
    const waterWarn = s.waterLevel < 60
    const humidWarn = humid < 55 || humid > 75
    const lightWarn = !zs.automation.growLight || lightK < 20 || lightK > 55

    return [
      {
        id: 'sensor-ph',
        title: 'PH LEVEL',
        value: s.ph.toFixed(2),
        unit: 'pH',
        percentage: clamp(((s.ph - 4.5) / 3) * 100, 0, 100),
        optimal: `OPT: ${zs.phMin.toFixed(1)}-${zs.phMax.toFixed(1)}`,
        status: phWarn ? 'WARN' : 'OK',
        isWarning: phWarn,
        sparkline: pointsToSvgPath(h.ph || []),
        history: h.ph
      },
      {
        id: 'sensor-ec',
        title: 'CONDUCTIVITY',
        value: cond.toFixed(2),
        unit: 'mS/cm',
        percentage: clamp((cond / 3) * 100, 0, 100),
        optimal: `OPT: ${zs.ecMin.toFixed(1)}-${zs.ecMax.toFixed(1)}`,
        status: condWarn ? 'WARN' : 'OK',
        isWarning: condWarn,
        sparkline: pointsToSvgPath(h.cond || []),
        history: h.cond
      },
      {
        id: 'sensor-temp',
        title: 'TEMPERATURE',
        value: s.temperature.toFixed(1),
        unit: '°C',
        percentage: clamp(((s.temperature - 15) / 20) * 100, 0, 100),
        optimal: `OPT: ${tempMin}-${tempMax}`,
        status: tempWarn ? 'WARN' : 'OK',
        isWarning: tempWarn,
        sparkline: pointsToSvgPath(h.temp || []),
        history: h.temp
      },
      {
        id: 'sensor-water',
        title: 'WATER LEVEL',
        value: s.waterLevel.toFixed(0),
        unit: '%',
        percentage: clamp(s.waterLevel, 0, 100),
        optimal: 'OPT: 60-90',
        status: waterWarn ? 'WARN' : 'OK',
        isWarning: waterWarn,
        sparkline: pointsToSvgPath(h.water || []),
        history: h.water
      },
      {
        id: 'sensor-humidity',
        title: 'HUMIDITY',
        value: humid.toFixed(0),
        unit: '%RH',
        percentage: clamp(((humid - 40) / 50) * 100, 0, 100),
        optimal: 'OPT: 55-75',
        status: humidWarn ? 'WARN' : 'OK',
        isWarning: humidWarn,
        sparkline: pointsToSvgPath(h.humid || []),
        history: h.humid
      },
      {
        id: 'sensor-light',
        title: 'LIGHT INTENSITY',
        value: lightK.toFixed(1),
        unit: 'klux',
        percentage: clamp((lightK / 40) * 100, 0, 100),
        optimal: 'OPT: 20-55k',
        status: lightWarn ? 'WARN' : 'OK',
        isWarning: lightWarn,
        sparkline: pointsToSvgPath(h.light || []),
        history: h.light
      }
    ]
  })

  // ── Computed Nutrient Dosing (reactive to Active Plot) ──
  const nutrientDosing = computed<NutrientItem[]>(() => {
    const zs = activeZoneState.value
    const nl = zs.sensors.nutrientLevel
    const dosingActive = zs.automation.nutrientPump
    return [
      {
        id: 'nutrient-n',
        name: 'Nitrogen (N)',
        amount: `${((nl / 100) * 0.7).toFixed(1)} mL/L`,
        time: '@ 06:00',
        status: dosingActive ? 'DELIVERED' : 'PAUSED',
        delivered: dosingActive
      },
      {
        id: 'nutrient-p',
        name: 'Phosphorus (P)',
        amount: `${((nl / 100) * 4.2).toFixed(1)} mL/L`,
        time: '@ 06:00',
        status: dosingActive ? 'DELIVERED' : 'PAUSED',
        delivered: dosingActive
      },
      {
        id: 'nutrient-k',
        name: 'Potassium (K)',
        amount: `${((nl / 100) * 2.1).toFixed(1)} mL/L`,
        time: '@ 12:00',
        status: dosingActive ? 'DELIVERED' : 'PAUSED',
        delivered: dosingActive
      }
    ]
  })

  // ── System Health (reactive to Active Plot) ──
  const systemHealth = computed<HealthMetric[]>(() => {
    const zs = activeZoneState.value
    const nl = zs.sensors.nutrientLevel
    const wl = zs.sensors.waterLevel
    return [
      {
        id: 'solution',
        name: 'Nutrient Solution',
        percentage: Math.round(nl * 0.88),
        isWarning: nl < 50
      },
      {
        id: 'reservoir',
        name: 'Reservoir A',
        percentage: Math.round(wl),
        isWarning: wl < 60
      },
      {
        id: 'filter',
        name: 'Filter B',
        percentage: 48,
        isWarning: true
      },
      {
        id: 'uv',
        name: 'UV Sterilizer',
        percentage: 91,
        isWarning: false
      }
    ]
  })

  // ── Manual Sensor Change & Reset (for Active Plot) ──
  function handleSensorChange(key: keyof SensorState, value: number) {
    const zs = activeZoneState.value
    const next = { ...zs.sensors, [key]: value }
    if (key === 'lightIntensity') {
      zs.userOverridden.growLight = true
      zs.automation.growLight = value > 0
    }
    zs.sensors = next
    recordZoneSensorHistory(zs)
    evaluateSafetyThresholdsForZone(zs, `${activePlot.value.zoneName} • ${activePlot.value.cropName}`)
  }

  function resetSim() {
    const id = activePlotId.value
    const defaults = buildInitialPlotStates()
    if (defaults[id]) {
      zoneStates.value[id] = defaults[id]!
    } else {
      const zs = activeZoneState.value
      zoneStates.value[id] = createPlotTelemetryFromPreset({
        phMin: zs.phMin,
        phMax: zs.phMax,
        ecMin: zs.ecMin,
        ecMax: zs.ecMax,
        targetTemp: zs.targetTemp,
        photoperiodHours: zs.photoperiodHours
      })
    }
    addEvent(
      `[${activePlot.value.zoneName} • ${activePlot.value.cropName}] Simulation reset to optimal baseline conditions`,
      'success'
    )
  }

  // ── Real-Time Control-to-Sensor Physics Loop (Runs independently for each Plot) ──
  let simInterval: ReturnType<typeof setInterval> | null = null

  function tickSinglePlot(plot: Plot) {
    const zs = getPlotState(plot.id)
    const prev = zs.sensors
    const ctrl = zs.automation
    const currentFlow = ctrl.waterPump ? Math.max(0.2, zs.flowRate) : 0
    const flowFactor = currentFlow / 2.4

    // 1. GROW LIGHTS PHYSICS:
    let nextLight = prev.lightIntensity
    let tempDelta = (Math.random() - 0.5) * 0.04
    if (ctrl.growLight) {
      const targetLight = 28.5 + (Math.random() - 0.5) * 3.0
      if (nextLight < 25) {
        nextLight = Math.min(35, nextLight + 4.5)
      } else {
        nextLight = clamp(nextLight + (targetLight - nextLight) * 0.25 + (Math.random() - 0.5) * 0.6, 25, 35)
      }
      tempDelta += 0.1
    } else {
      nextLight = 0.0
      tempDelta -= 0.05
    }

    // 2. VENTILATION FAN PHYSICS:
    let nextHumid = zs.humidity
    if (ctrl.coolingSystem) {
      tempDelta -= 0.15
      nextHumid = clamp(nextHumid - 0.5 + (Math.random() - 0.5) * 0.1, 40, 90)
    } else {
      tempDelta += 0.03
      nextHumid = clamp(nextHumid + 0.25 + (Math.random() - 0.5) * 0.1, 40, 90)
    }
    const nextTemp = clamp(+(prev.temperature + tempDelta).toFixed(2), 15, 35)
    zs.humidity = +nextHumid.toFixed(1)

    // 3. CIRCULATION PUMP & FLOW RATE PHYSICS:
    let nextWater = prev.waterLevel
    if (ctrl.waterPump && currentFlow > 0) {
      const waterConsumption = 0.06 * flowFactor
      nextWater = clamp(prev.waterLevel - waterConsumption, 0, 100)
    } else {
      nextWater = clamp(prev.waterLevel - 0.01, 0, 100)
    }

    // 4. AUTO DOSING & FLOW STABILIZATION PHYSICS:
    const targetPh = +((zs.phMin + zs.phMax) / 2).toFixed(2)
    const targetEc = +((zs.ecMin + zs.ecMax) / 2).toFixed(2)
    const targetNutrientLevel = clamp((targetEc / 2.5) * 100, 35, 96)

    let nextPh = prev.ph
    let nextNutrient = prev.nutrientLevel
    const mixingBoost = 0.65 + 0.55 * flowFactor

    if (ctrl.nutrientPump) {
      const phDiff = targetPh - prev.ph
      if (Math.abs(phDiff) > 0.02) {
        const phStep = Math.sign(phDiff) * Math.min(Math.abs(phDiff), 0.08 * mixingBoost)
        nextPh = prev.ph + phStep + (Math.random() - 0.5) * 0.01
      } else {
        nextPh = prev.ph + (Math.random() - 0.5) * 0.015
      }

      const nutDiff = targetNutrientLevel - prev.nutrientLevel
      if (Math.abs(nutDiff) > 0.3) {
        const nutStep = Math.sign(nutDiff) * Math.min(Math.abs(nutDiff), 1.8 * mixingBoost)
        nextNutrient = prev.nutrientLevel + nutStep
      } else {
        nextNutrient = prev.nutrientLevel + (Math.random() - 0.5) * 0.2
      }
    } else {
      nextNutrient = clamp(prev.nutrientLevel - 0.22, 0, 100)
      if (ctrl.waterPump && currentFlow > 0) {
        nextPh = prev.ph + (targetPh - prev.ph) * (0.02 * flowFactor) + (Math.random() - 0.5) * 0.03
      } else {
        nextPh = prev.ph + 0.02 + (Math.random() - 0.5) * 0.03
      }
    }

    const next: SensorState = {
      temperature: nextTemp,
      ph: clamp(+nextPh.toFixed(2), 4.5, 7.5),
      waterLevel: +nextWater.toFixed(1),
      nutrientLevel: clamp(+nextNutrient.toFixed(1), 0, 100),
      lightIntensity: +nextLight.toFixed(1)
    }

    zs.sensors = next
    recordZoneSensorHistory(zs)
    evaluateSafetyThresholdsForZone(zs, `${plot.zoneName} • ${plot.cropName}`)

    if (plot.id === activePlotId.value) {
      growth.value = Math.min(100, +(growth.value + 0.03).toFixed(2))
    }
  }

  function tickSimulation() {
    if (!simRunning.value) return
    plots.value.forEach(plot => {
      tickSinglePlot(plot)
    })
  }

  function startSimulationLoop() {
    if (simInterval) clearInterval(simInterval)
    const intervalMs = Math.max(200, Math.round(2000 / simSpeed.value))
    simInterval = setInterval(tickSimulation, intervalMs)
  }

  function restartSimulationLoop() {
    startSimulationLoop()
  }

  function stopSimulationLoop() {
    if (simInterval) {
      clearInterval(simInterval)
      simInterval = null
    }
  }

  // Light Schedule (reactive to Active Plot's photoperiod) & System Info
  const baseSchedule = scheduleData as LightSchedule
  const lightSchedule = computed<LightSchedule>(() => {
    const hoursOn = activeZoneState.value.photoperiodHours || 18
    const hoursOff = Math.max(0, 24 - hoursOn)
    return {
      scheduleText: `${hoursOn}h On / ${hoursOff}h Off`,
      badgeText: baseSchedule.badgeText || 'PHOTOPERIOD',
      progress: Math.round((hoursOn / 24) * 100),
      startTime: baseSchedule.startTime || '00:00',
      endTime: baseSchedule.endTime || '24:00'
    }
  })

  const systemInfo = ref<SystemInfo>(systemData as SystemInfo)

  return {
    // Auth
    isAuthenticated,
    adminUser,
    login,
    logout,
    // Simulator Core
    simRunning,
    manualMode,
    simSpeed,
    simDay,
    growth,
    selectedCrop,
    crops,
    sensors,
    humidity,
    automation,
    events,
    alerts,
    warningCount,
    sensorHistory,
    zoneStates,
    activeZoneState,
    availableZones,
    nextZoneKey,
    setSimRunning,
    setManualMode,
    setSimSpeed,
    advanceDay,
    saveCropAndZoneConfig,
    setSelectedCrop,
    handleSensorChange,
    toggleAutomation,
    setFlowRate,
    resetSim,
    addEvent,
    clearEvents,
    addAlert,
    startSimulationLoop,
    stopSimulationLoop,
    // Dashboard & Layout
    plots,
    activePlotId,
    activePlot,
    setActivePlot,
    metrics,
    nutrientDosing,
    flowControlConfig,
    flowRate,
    systemControls,
    toggleControl,
    systemHealth,
    lightSchedule,
    systemInfo
  }
})
