<script setup lang="ts">
import { ref } from 'vue'
import settingsData from '@/data/settings.json'

interface SettingItem {
  label: string
  desc: string
  type: 'select' | 'toggle'
  val: string | boolean
  options?: string[]
}

interface SettingSection {
  section: string
  items: SettingItem[]
}

const sections = ref<SettingSection[]>(
  JSON.parse(JSON.stringify(settingsData.sections)) as SettingSection[]
)
const aboutInfo = settingsData.about

function toggleSetting(item: SettingItem) {
  if (typeof item.val === 'boolean') {
    item.val = !item.val
  }
}
</script>

<template>
  <div class="settings-page">
    <div>
      <div class="section-heading">SYSTEM SETTINGS</div>
      <div class="settings-sub">Configure simulator behavior, alerts, and display preferences</div>
    </div>

    <div class="settings-grid">
      <div
        v-for="sec in sections"
        :key="sec.section"
        class="settings-card"
      >
        <div class="section-heading card-heading">{{ sec.section }}</div>

        <div class="settings-items">
          <div
            v-for="item in sec.items"
            :key="item.label"
            class="setting-row"
          >
            <div class="setting-info">
              <div class="setting-label">{{ item.label }}</div>
              <div class="setting-desc">{{ item.desc }}</div>
            </div>

            <!-- Toggle Switch -->
            <button
              v-if="item.type === 'toggle'"
              type="button"
              class="toggle-switch"
              :class="{ on: item.val === true }"
              @click="toggleSetting(item)"
            >
              <span class="toggle-knob" :class="{ on: item.val === true }"></span>
            </button>

            <!-- Select Dropdown -->
            <select
              v-else
              v-model="item.val"
              class="setting-select"
            >
              <option v-for="opt in item.options" :key="opt" :value="opt">
                {{ opt }}
              </option>
            </select>
          </div>
        </div>
      </div>

      <!-- About Card -->
      <div class="settings-card">
        <div class="section-heading card-heading">About</div>

        <div class="about-list">
          <div class="about-brand-row">
            <div class="brand-badge">{{ aboutInfo.code }}</div>
            <div>
              <div class="brand-title">{{ aboutInfo.name }}</div>
              <div class="brand-sub">{{ aboutInfo.subtitle }}</div>
            </div>
          </div>

          <div
            v-for="row in aboutInfo.metadata"
            :key="row.label"
            class="about-meta-row"
          >
            <span class="meta-label">{{ row.label }}</span>
            <span class="meta-val">{{ row.val }}</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.settings-page {
  display: flex;
  flex-direction: column;
  gap: 20px;
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

.settings-sub {
  font-size: 0.76rem;
  color: var(--text-secondary);
  margin-top: 2px;
}

.settings-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 16px;
}

.settings-card {
  background-color: var(--bg-panel);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-lg);
  padding: 20px;
}

.card-heading {
  margin-bottom: 16px;
}

.settings-items {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.setting-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
}

.setting-label {
  font-size: 0.85rem;
  font-weight: 500;
  color: #c8e6c8;
}

.setting-desc {
  font-size: 0.74rem;
  color: var(--text-muted);
}

/* Toggle Switch */
.toggle-switch {
  width: 44px;
  height: 24px;
  border-radius: 999px;
  background-color: #142614;
  border: 1px solid #243e24;
  position: relative;
  cursor: pointer;
  flex-shrink: 0;
  transition: all 0.2s ease;
}

.toggle-switch.on {
  background-color: var(--text-neon);
  border-color: var(--text-neon);
}

.toggle-knob {
  position: absolute;
  top: 2px;
  left: 3px;
  width: 18px;
  height: 18px;
  border-radius: 50%;
  background-color: #4b6b4b;
  transition: all 0.2s ease;
}

.toggle-knob.on {
  left: 22px;
  background-color: #060c06;
}

/* Select Dropdown */
.setting-select {
  padding: 6px 10px;
  border-radius: var(--radius-md);
  font-size: 0.75rem;
  font-family: var(--font-mono);
  background-color: #112011;
  border: 1px solid var(--border-card);
  color: var(--text-neon);
  outline: none;
  cursor: pointer;
}

/* About Section */
.about-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.about-brand-row {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 12px;
}

.brand-badge {
  width: 40px;
  height: 40px;
  border-radius: var(--radius-md);
  background-color: var(--text-neon);
  color: #060c06;
  font-weight: 700;
  font-size: 0.85rem;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.brand-title {
  font-size: 0.9rem;
  font-weight: 700;
  color: var(--text-primary);
}

.brand-sub {
  font-size: 0.72rem;
  color: var(--text-muted);
}

.about-meta-row {
  display: flex;
  justify-content: space-between;
  padding: 6px 0;
  border-bottom: 1px solid #132013;
  font-size: 0.75rem;
}

.meta-label {
  color: var(--text-muted);
}

.meta-val {
  font-family: var(--font-mono);
  color: #c8e6c8;
}

@media (max-width: 1024px) {
  .settings-grid {
    grid-template-columns: 1fr;
  }
}
</style>
