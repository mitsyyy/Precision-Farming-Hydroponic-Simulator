<script setup lang="ts">
import Sidebar from '@/components/Sidebar.vue';
import Header from '@/components/Header.vue';
</script>

<template>
    <div class="app-layout">
        <Sidebar />
        <main class="main-content">
            <Header />
            <RouterView />
        </main>
    </div>
</template>

<style scoped>
.app-layout {
    display: flex;
    min-height: 100vh
}

.main-content {
    flex: 1;
}
</style>
