<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { useUIStore } from '@/stores/ui'
import { useAuth } from '@/composables/useAuth'
import { usePermissions } from '@/composables/usePermissions'
import Sidebar from './Sidebar.vue'
import TopBar from './TopBar.vue'

interface AppLayoutProps {
  sidebarCollapsed?: boolean
}

const props = withDefaults(defineProps<AppLayoutProps>(), {
  sidebarCollapsed: false
})

const emit = defineEmits<{
  'sidebar-toggle': []
}>()

const authStore = useAuthStore()
const uiStore = useUIStore()
const { isAuthenticated } = useAuth()
const { hasPermission } = usePermissions()

const sidebarVisible = ref(!props.sidebarCollapsed)

const containerClass = computed(() => ({
  'app-layout': true,
  'sidebar-collapsed': !sidebarVisible.value,
  'sidebar-expanded': sidebarVisible.value
}))

const handleSidebarToggle = () => {
  sidebarVisible.value = !sidebarVisible.value
  uiStore.setSidebarState(sidebarVisible.value)
  emit('sidebar-toggle')
}

onMounted(() => {
  sidebarVisible.value = uiStore.sidebarCollapsed === false
})
</script>

<template>
  <div :class="containerClass">
    <Sidebar
      :collapsed="!sidebarVisible"
      @toggle="handleSidebarToggle"
    />

    <div class="main-content">
      <TopBar @sidebar-toggle="handleSidebarToggle" />

      <div class="content-container">
        <RouterView v-slot="{ Component }">
          <Transition name="fade" mode="out-in">
            <component :is="Component" />
          </Transition>
        </RouterView>
      </div>
    </div>
  </div>
</template>

<style scoped>
.app-layout {
  display: flex;
  height: 100vh;
  overflow: hidden;
  background-color: var(--bg-primary);
}

.main-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  transition: margin-left 0.3s ease;
}

.sidebar-collapsed .main-content {
  margin-left: 0;
}

.content-container {
  flex: 1;
  overflow-y: auto;
  padding: 24px;
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
