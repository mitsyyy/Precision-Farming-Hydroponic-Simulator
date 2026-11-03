<script setup lang="ts">
import automationRulesData from '@/data/automationRules.json'

interface RuleItem {
  condition: string
  action: string
  status: string
}

interface RuleCategory {
  category: string
  icon: string
  color: string
  items: RuleItem[]
}

interface HistoryRow {
  time: string
  rule: string
  action: string
  result: 'Resolved' | 'Active' | 'Warning'
}

const rules = automationRulesData.rules as RuleCategory[]
const history = automationRulesData.history as HistoryRow[]

function getResultBadgeStyle(result: string) {
  if (result === 'Resolved') {
    return {
      backgroundColor: '#22e53218',
      color: '#22e532',
      border: '1px solid #22e53240'
    }
  }
  if (result === 'Active') {
    return {
      backgroundColor: '#ff8c0018',
      color: '#ff8c00',
      border: '1px solid #ff8c0040'
    }
  }
  return {
    backgroundColor: '#ff444418',
    color: '#ff4444',
    border: '1px solid #ff444440'
  }
}
</script>

<template>
  <div class="automation-page">
    <div>
      <div class="section-heading">AUTOMATION RULES ENGINE</div>
      <div class="automation-sub">
        Preset IF -> THEN rules that govern how the simulator responds to virtual sensor changes
      </div>
    </div>

    <!-- Rule Category Cards Grid -->
    <div class="rules-grid">
      <div
        v-for="cat in rules"
        :key="cat.category"
        class="rule-category-card"
      >
        <div class="category-header">
          <span class="category-icon" :style="{ color: cat.color }">
            <!-- Droplet -->
            <svg v-if="cat.icon === 'droplet'" class="cat-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75">
              <path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z" stroke-linejoin="round" />
            </svg>
            <!-- Thermometer -->
            <svg v-else-if="cat.icon === 'thermometer'" class="cat-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75">
              <path d="M14 14.76V3.5a2.5 2.5 0 0 0-5 0v11.26a4.5 4.5 0 1 0 5 0z" stroke-linecap="round" stroke-linejoin="round" />
            </svg>
            <!-- Flask -->
            <svg v-else-if="cat.icon === 'flask'" class="cat-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75">
              <path d="M10 2v7.31L4.72 18.55A2 2 0 0 0 6.46 21.5h11.08a2 2 0 0 0 1.74-2.95L14 9.31V2" stroke-linecap="round" stroke-linejoin="round" />
              <line x1="8.5" y1="2" x2="15.5" y2="2" stroke-linecap="round" />
              <line x1="6.5" y1="15" x2="17.5" y2="15" stroke-linecap="round" />
            </svg>
            <!-- Beaker / Nutrients -->
            <svg v-else-if="cat.icon === 'beaker'" class="cat-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75">
              <path d="M4.5 3h15" stroke-linecap="round" />
              <path d="M6 3v16a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2V3" stroke-linecap="round" stroke-linejoin="round" />
              <path d="M6 14h12" stroke-linecap="round" />
            </svg>
            <!-- Sun -->
            <svg v-else class="cat-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75">
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
          <span class="category-title">{{ cat.category }}</span>
          <span
            class="category-badge"
            :style="{
              backgroundColor: cat.color + '18',
              color: cat.color,
              border: `1px solid ${cat.color}40`
            }"
          >
            ACTIVE
          </span>
        </div>

        <div class="rule-items-list">
          <div
            v-for="(item, idx) in cat.items"
            :key="idx"
            class="rule-item-box"
            :style="{
              border: `1px solid ${cat.color}30`,
              backgroundColor: cat.color + '08'
            }"
          >
            <div class="rule-if-row">
              <span
                class="if-pill"
                :style="{ backgroundColor: cat.color + '20', color: cat.color }"
              >
                IF
              </span>
              <span class="rule-condition">{{ item.condition }}</span>
            </div>
            <div class="rule-then-row" :style="{ color: cat.color }">
              <svg class="arrow-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75">
                <line x1="5" y1="12" x2="19" y2="12" stroke-linecap="round" />
                <polyline points="12 5 19 12 12 19" stroke-linecap="round" stroke-linejoin="round" />
              </svg>
              <span>{{ item.action }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Automation History Table -->
    <div class="history-card">
      <div class="section-heading history-heading">AUTOMATION HISTORY</div>
      <div class="table-wrap">
        <table class="history-table">
          <thead>
            <tr>
              <th>Time</th>
              <th>Condition</th>
              <th>Action</th>
              <th>Result</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(h, idx) in history" :key="idx">
              <td class="td-time">{{ h.time }}</td>
              <td class="td-rule">{{ h.rule }}</td>
              <td class="td-action">{{ h.action }}</td>
              <td>
                <span class="result-badge" :style="getResultBadgeStyle(h.result)">
                  {{ h.result }}
                </span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

<style scoped>
.automation-page {
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

.automation-sub {
  font-size: 0.76rem;
  color: var(--text-secondary);
  margin-top: 2px;
}

.rules-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 16px;
}

.rule-category-card {
  background-color: var(--bg-panel);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-lg);
  padding: 20px;
}

.category-header {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 16px;
}

.category-icon {
  width: 28px;
  height: 28px;
  border-radius: 6px;
  background-color: #112011;
  border: 1px solid var(--border-subtle);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.cat-svg {
  width: 16px;
  height: 16px;
}

.category-title {
  font-size: 0.9rem;
  font-weight: 600;
  color: var(--text-primary);
}

.category-badge {
  margin-left: auto;
  font-size: 0.65rem;
  font-family: var(--font-mono);
  padding: 2px 8px;
  border-radius: 4px;
}

.rule-items-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.rule-item-box {
  border-radius: var(--radius-md);
  padding: 12px;
}

.rule-if-row {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 4px;
}

.if-pill {
  font-size: 0.65rem;
  font-family: var(--font-mono);
  padding: 1px 6px;
  border-radius: 4px;
  font-weight: 600;
}

.rule-condition {
  font-size: 0.85rem;
  font-family: var(--font-mono);
  font-weight: 600;
  color: var(--text-primary);
}

.rule-then-row {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 0.76rem;
  font-weight: 500;
}

.arrow-svg {
  width: 14px;
  height: 14px;
  flex-shrink: 0;
}

/* History Card */
.history-card {
  background-color: var(--bg-panel);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-lg);
  padding: 20px;
}

.history-heading {
  margin-bottom: 16px;
}

.table-wrap {
  overflow-x: auto;
}

.history-table {
  width: 100%;
  border-collapse: collapse;
  text-align: left;
}

.history-table th {
  font-size: 0.66rem;
  font-family: var(--font-mono);
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: var(--text-muted);
  padding-bottom: 10px;
  border-bottom: 1px solid var(--border-subtle);
}

.history-table td {
  padding: 12px 16px 12px 0;
  border-bottom: 1px solid #132013;
  font-size: 0.76rem;
}

.td-time {
  font-family: var(--font-mono);
  color: var(--text-muted);
  white-space: nowrap;
}

.td-rule {
  font-family: var(--font-mono);
  color: #c8e6c8;
}

.td-action {
  color: var(--text-secondary);
}

.result-badge {
  font-size: 0.65rem;
  font-family: var(--font-mono);
  padding: 2px 8px;
  border-radius: 4px;
  display: inline-block;
}

@media (max-width: 1024px) {
  .rules-grid {
    grid-template-columns: 1fr;
  }
}
</style>
