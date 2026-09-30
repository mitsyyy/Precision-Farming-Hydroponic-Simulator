<script setup lang="ts">
import { Icon } from '@iconify/vue'
import { RouterLink } from 'vue-router';
</script>

<template>
    <aside class="sidebar">
        <div class="logo">
            <Icon icon="dinkie-icons:potted-plant"></Icon>
            <p style="display: inline;">Earthling</p>
        </div>
        <nav class="navigation">
            <ul>
                <li>
                    <RouterLink to="/dashboard">
                        <Icon icon="boxicons:dashboard"></Icon>
                        Dashboard
                    </RouterLink>
                </li>
                <li>
                    <RouterLink to="">
                        <Icon icon="octicon:meter-16"></Icon>
                        Simulation
                    </RouterLink>
                </li>
                <li>
                    <RouterLink to="">
                        <Icon icon="ph:plant-bold"></Icon>
                        Plant Management
                    </RouterLink>
                </li>
                <li>
                    <RouterLink to="">
                        <Icon icon="ion:analytics-sharp"></Icon>
                        Analytics
                    </RouterLink>
                </li>
                <li>
                    <RouterLink to="">
                        <Icon icon="cuida:play-circle-outline"></Icon>
                        Automation
                    </RouterLink>
                </li>
                <li>
                    <RouterLink to="">
                        <Icon icon="boxicons:alert-triangle"></Icon>
                        Alerts
                    </RouterLink>
                </li>
                <li>
                    <RouterLink to="">
                        <Icon icon="ci:settings-future"></Icon>
                        Settings
                    </RouterLink>
                </li>
            </ul>
        </nav>
    </aside>
</template>

<style scoped>
.sidebar {
    background-color: #070E07;
    height: 100vh;
    width: 20%;
    font-size: 1.3rem;
    text-align: center;
}

.logo {
    color: #39FF14;
    border-bottom: 1px solid #233723;
    padding: 1em;
}

.navigation ul {
    list-style-type: none;
    padding-left: 0;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    height: calc(100vh - 110px);
    margin: 20px;
}

.navigation ul li {
    cursor: pointer;
}

.navigation ul li a {
    color: #3D633D;
    text-decoration: none;
    display: flex;
    align-items: center;
    gap: 0.5rem;
}

.navigation ul li a:hover {
    color: #39FF14;
}
</style>