<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import {
  useHydroponicsStore,
  type CropInfo,
  type CropCategory,
  CROP_CATEGORY_PRESETS,
  inferAgronomicPreset
} from '@/stores/hydroponics'
import cropsData from '@/data/crops.json'

interface GrowthStageItem {
  name: string
  days: string
  desc: string
  pct: number
}

const store = useHydroponicsStore()
const stages = cropsData.stages as GrowthStageItem[]

const activeCrop = computed<CropInfo>(() => {
  return store.crops.find((c) => c.name === store.selectedCrop) ?? store.crops[0]!
})

const currentStageIdx = computed(() => {
  if (store.growth >= 85) return 3
  if (store.growth >= 50) return 2
  if (store.growth >= 25) return 1
  return 0
})

const dayProgressPct = computed(() => {
  return Math.min(100, (store.simDay / activeCrop.value.days) * 100)
})

const conditionCards = computed(() => [
  { label: 'Temperature', val: activeCrop.value.temp, icon: 'thermometer', color: '#22e532' },
  { label: 'pH Level', val: activeCrop.value.ph, icon: 'flask', color: '#39dbd0' },
  { label: 'Nutrients / EC', val: activeCrop.value.nutrients, icon: 'droplet', color: '#3b9eff' },
  { label: 'Light / Photoperiod', val: activeCrop.value.light, icon: 'sun', color: '#ff8c00' }
])

// ── Horizontal Crop Carousel + Unified Search & Filter Icon Popover State ──
const cropSearchQuery = ref('')
const selectedZoneFilter = ref<string>('ALL')
const selectedStageFilter = ref<string>('ALL')
const showFilterPopover = ref<boolean>(false)
const filterWrapRef = ref<HTMLElement | null>(null)
const carouselRef = ref<HTMLElement | null>(null)

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

function matchesCropStage(crop: CropInfo, stageKey: string): boolean {
  if (stageKey === 'ALL') return true
  const s = crop.stage.trim().toUpperCase()
  // Also check if any plot growing this crop is in that stage
  const plotMatch = store.plots.some(
    (p) =>
      (p.cropName.toLowerCase().includes(crop.name.toLowerCase()) ||
        crop.name.toLowerCase().includes(p.cropName.toLowerCase())) &&
      p.stage.toUpperCase() === stageKey
  )
  if (plotMatch) return true
  if (stageKey === 'VEGE') return s.includes('VEG') || s.includes('EARLY')
  if (stageKey === 'FLOW') return s.includes('FLOW') || s.includes('MATURE')
  if (stageKey === 'SEED') return s.includes('SEED')
  if (stageKey === 'GERM') return s.includes('GERM') || s.includes('SEED')
  return false
}

const filteredCrops = computed<CropInfo[]>(() => {
  const q = cropSearchQuery.value.trim().toLowerCase()
  const zFilter = selectedZoneFilter.value
  const sFilter = selectedStageFilter.value

  return store.crops.filter((c) => {
    const matchesSearch = !q || c.name.toLowerCase().includes(q)
    const matchesZone =
      zFilter === 'ALL' ||
      store.plots.some(
        (p) =>
          p.zoneName.toUpperCase() === zFilter &&
          (p.cropName.toLowerCase().includes(c.name.toLowerCase()) ||
            c.name.toLowerCase().includes(p.cropName.toLowerCase()))
      )
    const matchesStage = matchesCropStage(c, sFilter)
    return matchesSearch && matchesZone && matchesStage
  })
})

function selectZoneFilter(val: string) {
  selectedZoneFilter.value = val
  showFilterPopover.value = false
}

function selectStageFilter(val: string) {
  selectedStageFilter.value = val
  showFilterPopover.value = false
}

function resetCropFilters() {
  selectedZoneFilter.value = 'ALL'
  selectedStageFilter.value = 'ALL'
  cropSearchQuery.value = ''
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

function scrollCarousel(dir: 'left' | 'right') {
  if (!carouselRef.value) return
  const amount = 340
  carouselRef.value.scrollBy({
    left: dir === 'left' ? -amount : amount,
    behavior: 'smooth'
  })
}

function onCarouselWheel(event: WheelEvent) {
  if (!carouselRef.value) return
  if (Math.abs(event.deltaY) > Math.abs(event.deltaX)) {
    carouselRef.value.scrollLeft += event.deltaY
  }
}

// ── Simplified Smart Configure Grow Zone & Crop Preset Modal State ──
const showConfigModal = ref(false)
const showAdvancedThresholds = ref(false)
const editingPlotId = ref<string | undefined>(undefined)
const categoryOptions: CropCategory[] = [
  'Leafy Greens',
  'Herbs',
  'Fruiting Crops',
  'Root / Specialty'
]

const formZoneName = ref('ZONE A')
const formCropName = ref('Basil (Genovese)')
const formCategory = ref<CropCategory>('Herbs')
const formDays = ref(28)
const formPhMin = ref(5.5)
const formPhMax = ref(6.5)
const formEcMin = ref(1.8)
const formEcMax = ref(2.4)
const formTargetTemp = ref(23)
const formPhotoperiod = ref(18)
const formError = ref('')

function applyPresetValues(preset: {
  category: CropCategory
  days: number
  targetTemp: number
  photoperiodHours: number
  phMin: number
  phMax: number
  ecMin: number
  ecMax: number
}) {
  formCategory.value = preset.category
  formDays.value = preset.days
  formTargetTemp.value = preset.targetTemp
  formPhotoperiod.value = preset.photoperiodHours
  formPhMin.value = preset.phMin
  formPhMax.value = preset.phMax
  formEcMin.value = preset.ecMin
  formEcMax.value = preset.ecMax
}

function selectCategoryPill(cat: CropCategory) {
  formCategory.value = cat
  const preset = CROP_CATEGORY_PRESETS[cat]
  applyPresetValues(preset)
}

function onCropNameInput() {
  const name = formCropName.value.trim()
  if (!name) return
  const inferred = inferAgronomicPreset(name, formCategory.value)
  applyPresetValues(inferred)
}

function openConfigModal(isNewPreset = false) {
  formError.value = ''
  showAdvancedThresholds.value = false
  if (isNewPreset) {
    editingPlotId.value = undefined
    formZoneName.value = store.activePlot.zoneName || 'ZONE A'
    formCropName.value = ''
    selectCategoryPill('Leafy Greens')
  } else {
    editingPlotId.value = store.activePlot.id
    formZoneName.value = store.activePlot.zoneName || 'ZONE A'
    const c = activeCrop.value
    const inferred = inferAgronomicPreset(c.name, c.category)
    formCropName.value = store.activePlot.cropName || c.name
    formCategory.value = c.category ?? inferred.category
    formDays.value = c.days ?? inferred.days
    formPhMin.value = c.phMin ?? inferred.phMin
    formPhMax.value = c.phMax ?? inferred.phMax
    formEcMin.value = c.ecMin ?? inferred.ecMin
    formEcMax.value = c.ecMax ?? inferred.ecMax
    formTargetTemp.value = c.targetTemp ?? inferred.targetTemp
    formPhotoperiod.value = c.photoperiodHours ?? inferred.photoperiodHours
  }
  showConfigModal.value = true
}

function submitCropConfig() {
  formError.value = ''
  if (!formCropName.value.trim()) {
    formError.value = 'Please enter a valid Crop Name / Cultivar.'
    return
  }
  if (formDays.value < 5 || formDays.value > 180) {
    formError.value = 'Cycle duration must be between 5 and 180 days.'
    return
  }
  if (formPhMin.value >= formPhMax.value) {
    formError.value = 'Target pH Min must be lower than Target pH Max.'
    return
  }
  if (formEcMin.value >= formEcMax.value) {
    formError.value = 'Target EC Min must be lower than Target EC Max.'
    return
  }

  store.saveCropAndZoneConfig({
    zoneId: formZoneName.value,
    cropName: formCropName.value,
    category: formCategory.value,
    days: Number(formDays.value),
    phMin: Number(formPhMin.value),
    phMax: Number(formPhMax.value),
    ecMin: Number(formEcMin.value),
    ecMax: Number(formEcMax.value),
    targetTemp: Number(formTargetTemp.value),
    photoperiodHours: Number(formPhotoperiod.value),
    editPlotId: editingPlotId.value
  })
  showConfigModal.value = false
}
</script>

<template>
  <div class="plants-page">
    <!-- Top Header & Action Buttons -->
    <div class="plants-topbar">
      <div>
        <div class="section-heading">PLANT MANAGEMENT &amp; CROP PRESETS</div>
        <div class="plants-sub">Select an active crop profile or configure custom hydroponic zone parameters</div>
      </div>

      <div class="topbar-actions">
        <button type="button" class="action-btn secondary" @click="openConfigModal(false)">
          <svg class="btn-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75">
            <path d="M12 20h9" stroke-linecap="round" />
            <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" stroke-linejoin="round" />
          </svg>
          <span>Edit Active Plot / Crop</span>
        </button>

        <button type="button" class="action-btn primary" @click="openConfigModal(true)">
          <svg class="btn-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75">
            <line x1="12" y1="5" x2="12" y2="19" stroke-linecap="round" />
            <line x1="5" y1="12" x2="19" y2="12" stroke-linecap="round" />
          </svg>
          <span>+ Add Crop to Zone</span>
        </button>
      </div>
    </div>

    <!-- Horizontal Single-Row Crop Carousel + Unified Search & Filter Icon Bar -->
    <div class="section-block">
      <div class="crop-filter-header">
        <div class="crop-header-left">
          <span class="section-heading no-mb">SELECT CROP TO GROW</span>
          <span class="crop-count-badge">{{ filteredCrops.length }} / {{ store.crops.length }}</span>
        </div>

        <div class="crop-filter-controls">
          <!-- Unified Search + Filter Icon Bar -->
          <div ref="filterWrapRef" class="unified-search-bar">
            <svg class="search-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75">
              <circle cx="11" cy="11" r="7" />
              <line x1="20" y1="20" x2="16" y2="16" stroke-linecap="round" />
            </svg>

            <input
              v-model="cropSearchQuery"
              type="text"
              placeholder="Search zone or crop..."
              class="search-input"
            />

            <button
              type="button"
              class="filter-icon-btn"
              :class="{ active: showFilterPopover || hasActiveFilter }"
              aria-label="Filter crops"
              @click.stop="showFilterPopover = !showFilterPopover"
            >
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
                <button type="button" class="reset-filters-link" @click="resetCropFilters">
                  Reset Filters
                </button>
              </div>
            </div>
          </div>

          <!-- Carousel Scroll Arrow Buttons -->
          <div class="carousel-arrows">
            <button
              type="button"
              class="arrow-btn"
              aria-label="Scroll crops left"
              @click="scrollCarousel('left')"
            >
              <svg class="arrow-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
                <polyline points="15 18 9 12 15 6" stroke-linecap="round" stroke-linejoin="round" />
              </svg>
            </button>
            <button
              type="button"
              class="arrow-btn"
              aria-label="Scroll crops right"
              @click="scrollCarousel('right')"
            >
              <svg class="arrow-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
                <polyline points="9 18 15 12 9 6" stroke-linecap="round" stroke-linejoin="round" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      <div
        ref="carouselRef"
        class="crop-selector-carousel"
        @wheel.prevent="onCarouselWheel"
      >
        <button
          v-for="c in filteredCrops"
          :key="c.name"
          type="button"
          class="crop-select-card"
          :class="{ selected: store.selectedCrop === c.name }"
          @click="store.setSelectedCrop(c.name)"
        >
          <div class="crop-icon-wrap" :class="{ active: store.selectedCrop === c.name }">
            <!-- Basil -->
            <svg v-if="c.icon === 'basil'" class="crop-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75">
              <path d="M11 20A7 7 0 0 1 4 13V9a5 5 0 0 1 5-5h2a7 7 0 0 1 7 7v4a5 5 0 0 1-5 5h-2z" stroke-linecap="round" stroke-linejoin="round" />
              <path d="M9 13c1.5 1.5 3 2 5 2" stroke-linecap="round" />
              <path d="M11 20v-7" stroke-linecap="round" />
            </svg>
            <!-- Lettuce -->
            <svg v-else-if="c.icon === 'lettuce'" class="crop-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75">
              <path d="M12 22c4.97 0 9-4.03 9-9-4.97 0-9 4.03-9 9z" stroke-linejoin="round" />
              <path d="M12 22c-4.97 0-9-4.03-9-9 4.97 0 9 4.03 9 9z" stroke-linejoin="round" />
              <path d="M12 22V8" stroke-linecap="round" />
              <path d="M12 13c3-3 5-7 0-11-5 4-3 8 0 11z" stroke-linejoin="round" />
            </svg>
            <!-- Kale -->
            <svg v-else-if="c.icon === 'kale'" class="crop-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75">
              <path d="M12 2v20" stroke-linecap="round" />
              <path d="M17 5c-2 0-5 2-5 5 0-3-3-5-5-5-2.5 0-4 2-4 4.5S5 14 8 15c-2 1-3 3-2 5s3.5 2 6 0c2.5 2 5 2 6 0s0-4-2-5c3-1 5-3 5-5.5S19.5 5 17 5z" stroke-linejoin="round" />
            </svg>
            <!-- Tomato -->
            <svg v-else-if="c.icon === 'tomato'" class="crop-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75">
              <circle cx="12" cy="14" r="7" />
              <path d="M12 7V3" stroke-linecap="round" />
              <path d="M9 6c1.5 1 4.5 1 6 0" stroke-linecap="round" />
              <path d="M7 8c2-1 8-1 10 0" stroke-linecap="round" />
            </svg>
            <!-- Strawberry -->
            <svg v-else class="crop-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75">
              <path d="M12 21c-4.5 0-7-5.5-7-10 0-2.8 2.2-5 5-5h4c2.8 0 5 2.2 5 5 0 4.5-2.5 10-7 10z" stroke-linejoin="round" />
              <path d="M12 6V3" stroke-linecap="round" />
              <path d="M9 5l3 1 3-1" stroke-linecap="round" stroke-linejoin="round" />
              <circle cx="10" cy="11" r="0.6" fill="currentColor" />
              <circle cx="14" cy="11" r="0.6" fill="currentColor" />
              <circle cx="12" cy="15" r="0.6" fill="currentColor" />
            </svg>
          </div>

          <div class="crop-card-name" :class="{ active: store.selectedCrop === c.name }">
            {{ c.name }}
          </div>
          <div class="crop-card-days">{{ c.days }} days cycle</div>
          <div class="crop-card-stage">
            <span class="stage-pill" :class="{ active: store.selectedCrop === c.name }">
              {{ c.stage }}
            </span>
          </div>
        </button>

        <div v-if="filteredCrops.length === 0" class="empty-crops-msg">
          No crops match the active filter criteria.
        </div>
      </div>
    </div>

    <!-- Active Crop Details + Recommended Conditions -->
    <div class="crop-detail-grid">
      <!-- Crop Info & Growth Timeline -->
      <div class="crop-main-panel">
        <div class="crop-banner-top">
          <div class="crop-banner-left">
            <div class="crop-icon-box">
              <svg v-if="activeCrop.icon === 'basil'" class="crop-banner-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75">
                <path d="M11 20A7 7 0 0 1 4 13V9a5 5 0 0 1 5-5h2a7 7 0 0 1 7 7v4a5 5 0 0 1-5 5h-2z" stroke-linecap="round" stroke-linejoin="round" />
                <path d="M9 13c1.5 1.5 3 2 5 2" stroke-linecap="round" />
                <path d="M11 20v-7" stroke-linecap="round" />
              </svg>
              <svg v-else-if="activeCrop.icon === 'lettuce'" class="crop-banner-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75">
                <path d="M12 22c4.97 0 9-4.03 9-9-4.97 0-9 4.03-9 9z" stroke-linejoin="round" />
                <path d="M12 22c-4.97 0-9-4.03-9-9 4.97 0 9 4.03 9 9z" stroke-linejoin="round" />
                <path d="M12 22V8" stroke-linecap="round" />
                <path d="M12 13c3-3 5-7 0-11-5 4-3 8 0 11z" stroke-linejoin="round" />
              </svg>
              <svg v-else-if="activeCrop.icon === 'kale'" class="crop-banner-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75">
                <path d="M12 2v20" stroke-linecap="round" />
                <path d="M17 5c-2 0-5 2-5 5 0-3-3-5-5-5-2.5 0-4 2-4 4.5S5 14 8 15c-2 1-3 3-2 5s3.5 2 6 0c2.5 2 5 2 6 0s0-4-2-5c3-1 5-3 5-5.5S19.5 5 17 5z" stroke-linejoin="round" />
              </svg>
              <svg v-else-if="activeCrop.icon === 'tomato'" class="crop-banner-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75">
                <circle cx="12" cy="14" r="7" />
                <path d="M12 7V3" stroke-linecap="round" />
                <path d="M9 6c1.5 1 4.5 1 6 0" stroke-linecap="round" />
                <path d="M7 8c2-1 8-1 10 0" stroke-linecap="round" />
              </svg>
              <svg v-else class="crop-banner-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75">
                <path d="M12 21c-4.5 0-7-5.5-7-10 0-2.8 2.2-5 5-5h4c2.8 0 5 2.2 5 5 0 4.5-2.5 10-7 10z" stroke-linejoin="round" />
                <path d="M12 6V3" stroke-linecap="round" />
                <path d="M9 5l3 1 3-1" stroke-linecap="round" stroke-linejoin="round" />
              </svg>
            </div>
            <div>
              <div class="active-tag">ACTIVE PLOT — {{ store.activePlot.zoneName }}</div>
              <div class="active-crop-title">{{ activeCrop.name }}</div>
              <div class="active-crop-desc">{{ activeCrop.desc }}</div>
            </div>
          </div>

          <div class="crop-stats-row">
            <div class="stat-col">
              <div class="stat-label">STAGE</div>
              <div class="stat-value neon">{{ stages[currentStageIdx]?.name }}</div>
            </div>
            <div class="stat-col">
              <div class="stat-label">DAY</div>
              <div class="stat-value white">{{ store.simDay }} / {{ activeCrop.days }}</div>
            </div>
            <div class="stat-col">
              <div class="stat-label">GROWTH</div>
              <div class="stat-value neon">{{ Math.round(store.growth) }}%</div>
            </div>
          </div>
        </div>

        <!-- Day Progress Bar -->
        <div class="day-progress-section">
          <div class="day-progress-labels">
            <span>Day {{ store.simDay }} of {{ activeCrop.days }}</span>
            <span class="neon-text">{{ Math.round(store.growth) }}% complete</span>
          </div>
          <div class="day-progress-track">
            <div class="day-progress-fill" :style="{ width: `${dayProgressPct}%` }"></div>
          </div>
        </div>

        <!-- Growth Stages Timeline -->
        <div class="section-heading timeline-heading">GROWTH TIMELINE</div>
        <div class="timeline-grid">
          <div
            v-for="(s, i) in stages"
            :key="s.name"
            class="timeline-step-card"
            :class="{
              'step-current': i === currentStageIdx,
              'step-done': i < currentStageIdx
            }"
          >
            <div class="timeline-step-top">
              <span
                class="timeline-step-num"
                :class="{
                  'num-current': i === currentStageIdx,
                  'num-done': i < currentStageIdx
                }"
              >
                <svg v-if="i < currentStageIdx" class="check-mini-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                  <polyline points="20 6 9 17 4 12" stroke-linecap="round" stroke-linejoin="round" />
                </svg>
                <template v-else>{{ i + 1 }}</template>
              </span>
              <span class="timeline-step-name" :class="{ active: i === currentStageIdx }">
                {{ s.name }}
              </span>
            </div>
            <div class="timeline-step-days">{{ s.days }}</div>
            <div class="timeline-step-desc">{{ s.desc }}</div>
          </div>
        </div>
      </div>

      <!-- Recommended Conditions -->
      <div class="conditions-panel">
        <div class="section-heading">RECOMMENDED CONDITIONS</div>
        <div class="conditions-list">
          <div
            v-for="item in conditionCards"
            :key="item.label"
            class="condition-item"
          >
            <span class="condition-icon" :style="{ color: item.color }">
              <svg v-if="item.icon === 'thermometer'" class="cond-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75">
                <path d="M14 14.76V3.5a2.5 2.5 0 0 0-5 0v11.26a4.5 4.5 0 1 0 5 0z" stroke-linecap="round" stroke-linejoin="round" />
              </svg>
              <svg v-else-if="item.icon === 'flask'" class="cond-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75">
                <path d="M10 2v7.31L4.72 18.55A2 2 0 0 0 6.46 21.5h11.08a2 2 0 0 0 1.74-2.95L14 9.31V2" stroke-linecap="round" stroke-linejoin="round" />
                <line x1="8.5" y1="2" x2="15.5" y2="2" stroke-linecap="round" />
                <line x1="6.5" y1="15" x2="17.5" y2="15" stroke-linecap="round" />
              </svg>
              <svg v-else-if="item.icon === 'droplet'" class="cond-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75">
                <path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z" stroke-linejoin="round" />
              </svg>
              <svg v-else class="cond-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75">
                <circle cx="12" cy="12" r="4" />
                <line x1="12" y1="2" x2="12" y2="4" stroke-linecap="round" />
                <line x1="12" y1="20" x2="12" y2="22" stroke-linecap="round" />
                <line x1="4.93" y1="4.93" x2="6.34" y2="6.34" stroke-linecap="round" />
                <line x1="17.66" y1="17.66" x2="19.07" y2="19.07" stroke-linecap="round" />
                <line x1="2" y1="12" x2="4" y2="12" stroke-linecap="round" />
                <line x1="20" y1="12" x2="22" y2="12" stroke-linecap="round" />
                <line x1="4.93" y1="19.07" x2="6.34" y2="17.66" stroke-linecap="round" />
                <line x1="17.66" y1="6.34" x2="19.07" y2="4.93" stroke-linecap="round" />
              </svg>
            </span>
            <div class="condition-info">
              <div class="condition-label">{{ item.label }}</div>
              <div class="condition-val" :style="{ color: item.color }">{{ item.val }}</div>
            </div>
          </div>
        </div>

        <div class="sensor-ref-box">
          <div class="sensor-ref-title">VIRTUAL SENSOR REFERENCE</div>
          <div class="sensor-ref-desc">
            FARMSIM uses these targets to automatically control pumps, fans, lights, and nutrient dosing during closed-loop simulation.
          </div>
        </div>
      </div>
    </div>

    <!-- Simplified Smart Configure Grow Zone & Crop Preset Modal -->
    <div v-if="showConfigModal" class="modal-backdrop" @click.self="showConfigModal = false">
      <div class="modal-card">
        <div class="modal-header">
          <div>
            <div class="modal-tag">ADMIN CONFIGURATION FORM</div>
            <h3 class="modal-title">CONFIGURE GROW ZONE &amp; CROP PRESET</h3>
          </div>
          <button type="button" class="close-btn" @click="showConfigModal = false">
            <svg class="close-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75">
              <line x1="18" y1="6" x2="6" y2="18" stroke-linecap="round" />
              <line x1="6" y1="6" x2="18" y2="18" stroke-linecap="round" />
            </svg>
          </button>
        </div>

        <form class="modal-form" @submit.prevent="submitCropConfig">
          <!-- 1. Target Grow Zone & 2. Crop Name / Cultivar -->
          <div class="form-row-2">
            <div class="form-field">
              <label class="form-label">TARGET GROW ZONE</label>
              <select v-model="formZoneName" class="form-input">
                <option v-for="zName in store.availableZones" :key="zName" :value="zName">
                  {{ zName }}
                </option>
                <option value="__NEW__">+ CREATE NEW ZONE ({{ store.nextZoneKey }})</option>
              </select>
            </div>

            <div class="form-field">
              <label class="form-label">CROP NAME / CULTIVAR</label>
              <input
                v-model="formCropName"
                type="text"
                placeholder="e.g. Bok Choy"
                class="form-input"
                @input="onCropNameInput"
              />
            </div>
          </div>

          <!-- 3. Crop Category Selector (4 Clickable Preset Pills) -->
          <div class="form-field">
            <label class="form-label">CROP CATEGORY (AUTO-CALCULATES OPTIMAL TELEMETRY)</label>
            <div class="category-pills-grid">
              <button
                v-for="cat in categoryOptions"
                :key="cat"
                type="button"
                class="category-pill-btn"
                :class="{ active: formCategory === cat }"
                @click="selectCategoryPill(cat)"
              >
                <span>{{ cat }}</span>
              </button>
            </div>
          </div>

          <!-- Auto-Configured Telemetry Preview Badge Row -->
          <div class="telemetry-preview-box">
            <div class="preview-header">
              <span class="preview-title">AUTO-CONFIGURED TELEMETRY PREVIEW</span>
              <button
                type="button"
                class="customize-toggle-btn"
                @click="showAdvancedThresholds = !showAdvancedThresholds"
              >
                <span>{{ showAdvancedThresholds ? 'Hide Advanced Thresholds' : 'Customize Advanced Thresholds' }}</span>
                <svg
                  class="chevron-svg"
                  :class="{ open: showAdvancedThresholds }"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                >
                  <polyline points="6 9 12 15 18 9" stroke-linecap="round" stroke-linejoin="round" />
                </svg>
              </button>
            </div>

            <div class="preview-badges-row">
              <div class="preview-badge">
                <span class="p-label">CYCLE</span>
                <span class="p-val">{{ formDays }} Days</span>
              </div>
              <div class="preview-badge">
                <span class="p-label">TARGET TEMP</span>
                <span class="p-val">{{ formTargetTemp }}°C</span>
              </div>
              <div class="preview-badge">
                <span class="p-label">PHOTOPERIOD</span>
                <span class="p-val">{{ formPhotoperiod }}h On</span>
              </div>
              <div class="preview-badge">
                <span class="p-label">pH RANGE</span>
                <span class="p-val">{{ formPhMin.toFixed(1) }}–{{ formPhMax.toFixed(1) }}</span>
              </div>
              <div class="preview-badge">
                <span class="p-label">EC RANGE</span>
                <span class="p-val">{{ formEcMin.toFixed(1) }}–{{ formEcMax.toFixed(1) }} mS/cm</span>
              </div>
            </div>
          </div>

          <!-- Collapsible Advanced Thresholds Section -->
          <div v-if="showAdvancedThresholds" class="advanced-thresholds-panel">
            <div class="form-row-3">
              <div class="form-field">
                <label class="form-label">CYCLE DURATION (DAYS)</label>
                <input v-model.number="formDays" type="number" min="5" max="180" class="form-input" />
              </div>

              <div class="form-field">
                <label class="form-label">TARGET TEMP (°C)</label>
                <input v-model.number="formTargetTemp" type="number" step="0.5" min="12" max="35" class="form-input" />
              </div>

              <div class="form-field">
                <label class="form-label">PHOTOPERIOD (HOURS ON)</label>
                <input v-model.number="formPhotoperiod" type="number" min="6" max="24" class="form-input" />
              </div>
            </div>

            <div class="form-row-2">
              <div class="form-field">
                <label class="form-label">TARGET pH RANGE (MIN / MAX)</label>
                <div class="dual-inputs">
                  <input v-model.number="formPhMin" type="number" step="0.1" min="4.0" max="7.5" class="form-input" />
                  <span class="range-to">to</span>
                  <input v-model.number="formPhMax" type="number" step="0.1" min="4.5" max="8.0" class="form-input" />
                </div>
              </div>

              <div class="form-field">
                <label class="form-label">TARGET EC RANGE (mS/cm MIN / MAX)</label>
                <div class="dual-inputs">
                  <input v-model.number="formEcMin" type="number" step="0.1" min="0.5" max="3.5" class="form-input" />
                  <span class="range-to">to</span>
                  <input v-model.number="formEcMax" type="number" step="0.1" min="0.8" max="4.0" class="form-input" />
                </div>
              </div>
            </div>
          </div>

          <div v-if="formError" class="form-error">{{ formError }}</div>

          <div class="modal-actions">
            <button type="button" class="action-btn secondary" @click="showConfigModal = false">
              Cancel
            </button>
            <button type="submit" class="action-btn primary">
              <svg class="btn-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75">
                <polyline points="20 6 9 17 4 12" stroke-linecap="round" stroke-linejoin="round" />
              </svg>
              <span>Save &amp; Apply to Grow Zone</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<style scoped>
.plants-page {
  display: flex;
  flex-direction: column;
  gap: 18px;
  padding: 18px 22px;
  height: 100%;
  overflow-y: auto;
}

.plants-topbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  flex-wrap: wrap;
}

.plants-sub {
  font-size: 0.76rem;
  color: var(--text-secondary);
  margin-top: 2px;
}

.topbar-actions {
  display: flex;
  align-items: center;
  gap: 10px;
}

.action-btn {
  height: 34px;
  padding: 0 14px;
  border-radius: 5px;
  font-family: var(--font-mono);
  font-size: 0.72rem;
  font-weight: 600;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  transition: border-color 0.15s ease, background-color 0.15s ease, color 0.15s ease;
}

.action-btn.primary {
  background-color: var(--text-neon);
  border: 1px solid var(--text-neon);
  color: #060c06;
}

.action-btn.primary:hover {
  background-color: #1ed12d;
}

.action-btn.secondary {
  background-color: #102010;
  border: 1px solid var(--border-card);
  color: var(--text-secondary);
}

.action-btn.secondary:hover {
  border-color: var(--text-neon);
  color: var(--text-neon);
}

.btn-svg {
  width: 15px;
  height: 15px;
}

.section-heading {
  font-size: 0.68rem;
  letter-spacing: 0.14em;
  color: var(--text-muted);
  text-transform: uppercase;
  margin-bottom: 10px;
}

.section-heading.no-mb {
  margin-bottom: 0;
}

/* Unified Search + Filter Icon Header + Carousel Arrows */
.crop-filter-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  flex-wrap: wrap;
  margin-bottom: 10px;
}

.crop-header-left {
  display: flex;
  align-items: center;
  gap: 8px;
}

.crop-count-badge {
  font-size: 0.64rem;
  font-family: var(--font-mono);
  padding: 1px 7px;
  border-radius: 3px;
  background-color: #0e1d0e;
  border: 1px solid var(--border-subtle);
  color: var(--text-neon);
}

.crop-filter-controls {
  display: flex;
  align-items: center;
  gap: 8px;
}

.unified-search-bar {
  position: relative;
  display: flex;
  align-items: center;
  width: 240px;
}

.search-svg {
  position: absolute;
  left: 9px;
  width: 13px;
  height: 13px;
  color: var(--text-muted);
  pointer-events: none;
}

.search-input {
  height: 30px;
  width: 100%;
  padding: 0 34px 0 28px;
  border-radius: 5px;
  background-color: #070e07;
  border: 1px solid var(--border-subtle);
  color: var(--text-primary);
  font-family: var(--font-mono);
  font-size: 0.7rem;
  outline: none;
  transition: border-color 0.15s ease;
}

.search-input:focus {
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
  right: 0;
  width: 230px;
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

.carousel-arrows {
  display: inline-flex;
  align-items: center;
  gap: 4px;
}

.arrow-btn {
  width: 30px;
  height: 30px;
  border-radius: 5px;
  background-color: #0a140a;
  border: 1px solid var(--border-subtle);
  color: var(--text-secondary);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: border-color 0.15s ease, color 0.15s ease;
}

.arrow-btn:hover {
  border-color: var(--text-neon);
  color: var(--text-neon);
}

.arrow-svg {
  width: 14px;
  height: 14px;
}

/* Single-Row Horizontal Crop Carousel (Hidden Scrollbar) */
.crop-selector-carousel {
  display: flex;
  flex-wrap: nowrap;
  overflow-x: auto;
  gap: 16px;
  scroll-behavior: smooth;
  scrollbar-width: none;
  -ms-overflow-style: none;
  padding-bottom: 2px;
}

.crop-selector-carousel::-webkit-scrollbar {
  display: none;
}

.crop-select-card {
  flex: 0 0 195px;
  min-width: 195px;
  background-color: var(--bg-panel);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-lg);
  padding: 14px 16px;
  text-align: left;
  cursor: pointer;
  transition: border-color 0.2s ease, background-color 0.2s ease;
}

.crop-select-card:hover {
  border-color: var(--border-card);
}

.crop-select-card.selected {
  background-color: #102010;
  border-color: var(--text-neon);
}

.empty-crops-msg {
  padding: 18px;
  font-family: var(--font-mono);
  font-size: 0.74rem;
  color: var(--text-muted);
}

.crop-icon-wrap {
  width: 34px;
  height: 34px;
  border-radius: 6px;
  background-color: #112011;
  border: 1px solid var(--border-subtle);
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--text-secondary);
  margin-bottom: 10px;
}

.crop-icon-wrap.active {
  color: var(--text-neon);
  border-color: #1f421f;
}

.crop-svg {
  width: 20px;
  height: 20px;
}

.crop-card-name {
  font-size: 0.9rem;
  font-weight: 600;
  color: #c8e6c8;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.crop-card-name.active {
  color: var(--text-neon);
}

.crop-card-days {
  font-size: 0.72rem;
  color: var(--text-muted);
  margin-top: 2px;
}

.crop-card-stage {
  margin-top: 8px;
}

.stage-pill {
  display: inline-block;
  font-size: 0.65rem;
  font-family: var(--font-mono);
  padding: 2px 6px;
  border-radius: 4px;
  background-color: #112011;
  color: var(--text-muted);
}

.stage-pill.active {
  background-color: rgba(34, 229, 50, 0.13);
  color: var(--text-neon);
}

/* Main Detail Grid */
.crop-detail-grid {
  display: grid;
  grid-template-columns: 2fr 1fr;
  gap: 16px;
}

.crop-main-panel,
.conditions-panel {
  background-color: var(--bg-panel);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-lg);
  padding: 20px;
}

.crop-banner-top {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 16px;
  flex-wrap: wrap;
}

.crop-banner-left {
  display: flex;
  align-items: center;
  gap: 12px;
}

.crop-icon-box {
  width: 48px;
  height: 48px;
  border-radius: var(--radius-lg);
  background-color: #112011;
  border: 1px solid var(--border-card);
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--text-neon);
  flex-shrink: 0;
}

.crop-banner-svg {
  width: 26px;
  height: 26px;
}

.active-tag {
  font-size: 0.68rem;
  font-family: var(--font-mono);
  letter-spacing: 0.12em;
  color: var(--text-muted);
}

.active-crop-title {
  font-size: 1.35rem;
  font-weight: 700;
  color: var(--text-primary);
}

.active-crop-desc {
  font-size: 0.76rem;
  color: var(--text-secondary);
  margin-top: 2px;
}

.crop-stats-row {
  display: flex;
  gap: 20px;
  text-align: right;
}

.stat-label {
  font-size: 0.68rem;
  font-family: var(--font-mono);
  color: var(--text-muted);
}

.stat-value {
  font-size: 0.9rem;
  font-family: var(--font-mono);
  font-weight: 600;
}

.stat-value.neon {
  color: var(--text-neon);
}

.stat-value.white {
  color: var(--text-primary);
}

/* Day Progress */
.day-progress-section {
  margin-bottom: 20px;
}

.day-progress-labels {
  display: flex;
  justify-content: space-between;
  font-size: 0.72rem;
  font-family: var(--font-mono);
  color: var(--text-muted);
  margin-bottom: 6px;
}

.neon-text {
  color: var(--text-neon);
}

.day-progress-track {
  height: 8px;
  border-radius: 999px;
  background-color: #142614;
  overflow: hidden;
}

.day-progress-fill {
  height: 100%;
  border-radius: 999px;
  background-color: var(--text-neon);
  transition: width 0.5s ease;
}

/* Growth Timeline */
.timeline-heading {
  margin-bottom: 12px;
}

.timeline-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 12px;
}

.timeline-step-card {
  background-color: var(--bg-darkest);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-md);
  padding: 12px;
}

.timeline-step-card.step-current {
  background-color: #102010;
  border-color: var(--text-neon);
}

.timeline-step-card.step-done {
  background-color: #0d180d;
  border-color: #244224;
}

.timeline-step-top {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 6px;
}

.timeline-step-num {
  width: 20px;
  height: 20px;
  border-radius: 50%;
  background-color: #142614;
  color: var(--text-muted);
  font-size: 0.68rem;
  font-family: var(--font-mono);
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.timeline-step-num.num-current,
.timeline-step-num.num-done {
  background-color: var(--text-neon);
  color: #060c06;
}

.check-mini-svg {
  width: 12px;
  height: 12px;
}

.timeline-step-name {
  font-size: 0.76rem;
  font-weight: 600;
  color: var(--text-secondary);
}

.timeline-step-name.active {
  color: var(--text-neon);
}

.timeline-step-days {
  font-size: 0.66rem;
  font-family: var(--font-mono);
  color: var(--text-muted);
  margin-bottom: 4px;
}

.timeline-step-desc {
  font-size: 0.68rem;
  color: var(--text-muted);
  line-height: 1.35;
}

/* Conditions Panel */
.conditions-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.condition-item {
  background-color: var(--bg-darkest);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-md);
  padding: 12px;
  display: flex;
  align-items: center;
  gap: 12px;
}

.condition-icon {
  width: 32px;
  height: 32px;
  border-radius: 6px;
  background-color: #112011;
  border: 1px solid var(--border-subtle);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.cond-svg {
  width: 18px;
  height: 18px;
}

.condition-label {
  font-size: 0.74rem;
  color: var(--text-muted);
}

.condition-val {
  font-size: 0.88rem;
  font-family: var(--font-mono);
  font-weight: 600;
}

.sensor-ref-box {
  margin-top: 16px;
  background-color: var(--bg-darkest);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-md);
  padding: 12px;
}

.sensor-ref-title {
  font-size: 0.68rem;
  font-family: var(--font-mono);
  color: var(--text-muted);
  margin-bottom: 4px;
}

.sensor-ref-desc {
  font-size: 0.74rem;
  color: var(--text-secondary);
  line-height: 1.45;
}

/* Simplified Modal Styles */
.modal-backdrop {
  position: fixed;
  inset: 0;
  background-color: rgba(4, 9, 4, 0.84);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 200;
  padding: 20px;
}

.modal-card {
  width: 100%;
  max-width: 580px;
  background-color: #0b140b;
  border: 1px solid var(--text-neon);
  border-radius: 6px;
  overflow: hidden;
}

.modal-header {
  padding: 16px 20px;
  border-bottom: 1px solid var(--border-subtle);
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.modal-tag {
  font-size: 0.62rem;
  font-family: var(--font-mono);
  letter-spacing: 0.12em;
  color: var(--text-neon);
}

.modal-title {
  font-size: 1.05rem;
  font-weight: 600;
  color: var(--text-primary);
}

.close-btn {
  width: 30px;
  height: 30px;
  border-radius: 4px;
  background-color: #060d06;
  border: 1px solid var(--border-subtle);
  color: var(--text-muted);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
}

.close-btn:hover {
  color: var(--text-primary);
  border-color: var(--text-neon);
}

.close-svg {
  width: 16px;
  height: 16px;
}

.modal-form {
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.form-row-2 {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
}

.form-row-3 {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 12px;
}

.form-field {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.form-label {
  font-size: 0.64rem;
  font-family: var(--font-mono);
  letter-spacing: 0.1em;
  color: var(--text-muted);
}

.form-input {
  height: 36px;
  padding: 0 10px;
  border-radius: 4px;
  background-color: #060d06;
  border: 1px solid var(--border-subtle);
  color: var(--text-primary);
  font-family: var(--font-mono);
  font-size: 0.78rem;
  outline: none;
  width: 100%;
}

.form-input:focus {
  border-color: var(--text-neon);
}

/* 4 Category Preset Pills */
.category-pills-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 8px;
}

.category-pill-btn {
  height: 34px;
  padding: 0 8px;
  border-radius: 4px;
  background-color: #070e07;
  border: 1px solid var(--border-subtle);
  color: var(--text-secondary);
  font-family: var(--font-mono);
  font-size: 0.7rem;
  font-weight: 600;
  cursor: pointer;
  transition: border-color 0.15s ease, background-color 0.15s ease, color 0.15s ease;
}

.category-pill-btn:hover {
  border-color: var(--border-card);
  color: var(--text-primary);
}

.category-pill-btn.active {
  background-color: #122612;
  border-color: var(--text-neon);
  color: var(--text-neon);
}

/* Auto-Configured Telemetry Preview Row */
.telemetry-preview-box {
  background-color: #070f07;
  border: 1px solid var(--border-subtle);
  border-radius: 5px;
  padding: 12px;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.preview-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}

.preview-title {
  font-size: 0.62rem;
  font-family: var(--font-mono);
  letter-spacing: 0.1em;
  color: var(--text-muted);
}

.customize-toggle-btn {
  background: transparent;
  border: none;
  color: var(--text-neon);
  font-family: var(--font-mono);
  font-size: 0.66rem;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 0;
}

.customize-toggle-btn:hover {
  text-decoration: underline;
}

.chevron-svg {
  width: 13px;
  height: 13px;
  transition: transform 0.18s ease;
}

.chevron-svg.open {
  transform: rotate(180deg);
}

.preview-badges-row {
  display: grid;
  grid-template-columns: repeat(5, minmax(0, 1fr));
  gap: 8px;
}

.preview-badge {
  background-color: #0c180c;
  border: 1px solid #193119;
  border-radius: 4px;
  padding: 6px 8px;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.p-label {
  font-size: 0.56rem;
  font-family: var(--font-mono);
  letter-spacing: 0.08em;
  color: var(--text-muted);
}

.p-val {
  font-size: 0.72rem;
  font-family: var(--font-mono);
  font-weight: 600;
  color: var(--text-neon);
}

.advanced-thresholds-panel {
  background-color: #070e07;
  border: 1px solid var(--border-subtle);
  border-radius: 5px;
  padding: 12px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.dual-inputs {
  display: flex;
  align-items: center;
  gap: 6px;
}

.range-to {
  font-size: 0.7rem;
  font-family: var(--font-mono);
  color: var(--text-muted);
}

.form-error {
  padding: 8px 12px;
  border-radius: 4px;
  background-color: rgba(255, 140, 0, 0.1);
  border: 1px solid var(--color-warn);
  color: var(--color-warn);
  font-family: var(--font-mono);
  font-size: 0.74rem;
}

.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  padding-top: 8px;
  border-top: 1px solid var(--border-subtle);
}

@media (max-width: 1100px) {
  .crop-detail-grid {
    grid-template-columns: 1fr;
  }
  .timeline-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
  .preview-badges-row {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }
}
</style>
