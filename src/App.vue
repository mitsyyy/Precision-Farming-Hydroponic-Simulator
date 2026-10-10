<script setup lang="ts">
import { computed, onMounted, onUnmounted } from 'vue'
import { useRoute, RouterView } from 'vue-router'
import Sidebar from '@/components/Sidebar.vue'
import Header from '@/components/Header.vue'
import { useHydroponicsStore } from '@/stores/hydroponics'

const store = useHydroponicsStore()
const route = useRoute()

const isLoginRoute = computed(() => route.path === '/login')

onMounted(() => {
  store.startSimulationLoop()
})

onUnmounted(() => {
  store.stopSimulationLoop()
})
</script>

<template>
  <div v-if="isLoginRoute" class="auth-layout">
    <RouterView />
  </div>
  <div v-else class="app-layout">
    <Sidebar />
    <div class="app-body">
      <Header />
      <main class="main-content">
        <RouterView />
      </main>
    </div>
  </div>
</template>

<style scoped>
.auth-layout {
  height: 100vh;
  width: 100vw;
  background-color: var(--bg-darkest);
  overflow: hidden;
}

.app-layout {
  display: flex;
  height: 100vh;
  width: 100vw;
  background-color: var(--bg-darkest);
  overflow: hidden;
}

.app-body {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-width: 0;
  height: 100vh;
  overflow: hidden;
}

.main-content {
  flex: 1;
  min-height: 0;
  overflow: hidden;
  padding: 0;
  background-color: var(--bg-darkest);
  display: flex;
  flex-direction: column;
}
</style>
