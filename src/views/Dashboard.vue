<script setup lang="ts">
import GrowPlots from '@/components/dashboard/GrowPlots.vue'
import ActivePlotBanner from '@/components/dashboard/ActivePlotBanner.vue'
import SensorGrid from '@/components/dashboard/SensorGrid.vue'
import NutrientDosing from '@/components/dashboard/NutrientDosing.vue'
import SystemControls from '@/components/dashboard/SystemControls.vue'
import SystemHealth from '@/components/dashboard/SystemHealth.vue'
</script>

<template>
  <div class="dashboard-bento">
    <!-- Left Column: Grow Plots (top compartment) & Light Schedule (bottom compartment) -->
    <aside class="bento-col col-left">
      <GrowPlots />
    </aside>

    <!-- Center Column: Active Plot Banner (top), 2x3 Sensor Grid (middle), Nutrient Dosing (bottom) -->
    <section class="bento-col col-center">
      <div class="center-top-pane">
        <ActivePlotBanner />
      </div>
      <div class="center-mid-pane">
        <SensorGrid />
      </div>
      <div class="center-bot-pane">
        <NutrientDosing />
      </div>
    </section>

    <!-- Right Column: System Controls + Flow Control + System Health -->
    <aside class="bento-col col-right">
      <div class="right-pane">
        <SystemControls />
        <SystemHealth />
      </div>
    </aside>
  </div>
</template>

<style scoped>
.dashboard-bento {
  display: grid;
  grid-template-columns: 268px minmax(0, 1fr) 288px;
  width: 100%;
  height: 100%;
  flex: 1;
  min-height: 0;
  background-color: var(--bg-darkest);
  overflow: hidden;
}

.bento-col {
  display: flex;
  flex-direction: column;
  height: 100%;
  min-width: 0;
  min-height: 0;
}

.col-left {
  border-right: 1px solid var(--border-subtle);
}

.col-center {
  border-right: 1px solid var(--border-subtle);
}

.center-top-pane {
  padding: 14px 20px;
  border-bottom: 1px solid var(--border-subtle);
  flex-shrink: 0;
}

.center-mid-pane {
  flex: 1;
  min-height: 0;
  padding: 16px 20px;
  border-bottom: 1px solid var(--border-subtle);
  display: flex;
  flex-direction: column;
}

.center-bot-pane {
  height: 142px;
  min-height: 142px;
  padding: 12px 20px 14px 20px;
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  justify-content: center;
}

.right-pane {
  flex: 1;
  min-height: 0;
  padding: 14px 18px;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  gap: 12px;
}

@media (max-width: 1360px) {
  .dashboard-bento {
    grid-template-columns: 240px minmax(0, 1fr) 260px;
  }
}

@media (max-width: 1024px) {
  .dashboard-bento {
    grid-template-columns: 1fr;
    overflow-y: auto;
  }
  .col-left,
  .col-center {
    border-right: none;
    border-bottom: 1px solid var(--border-subtle);
  }
}
</style>
