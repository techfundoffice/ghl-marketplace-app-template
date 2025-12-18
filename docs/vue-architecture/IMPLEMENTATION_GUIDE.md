# GoHighLevel Clone - Implementation Guide

## Getting Started

### 1. Project Setup

```bash
# Create Vue 3 project with TypeScript
npm create vue@latest gohighlevel-clone

# Select the following options:
# ✓ TypeScript
# ✓ Vue Router
# ✓ Pinia
# ✓ ESLint
# ✓ Prettier

cd gohighlevel-clone
npm install
```

### 2. Install Additional Dependencies

```bash
# UI Libraries
npm install @headlessui/vue @heroicons/vue

# Drag and Drop
npm install @vueuse/core @vueuse/gesture

# Charts
npm install chart.js vue-chartjs

# Rich Text Editor
npm install @tiptap/vue-3 @tiptap/starter-kit

# Date/Time
npm install date-fns

# HTTP Client
npm install axios

# State Persistence
npm install pinia-plugin-persistedstate

# WebSocket
npm install socket.io-client

# Form Validation
npm install vee-validate yup

# Icons
npm install lucide-vue-next
```

### 3. Project Structure Setup

```bash
# Create directory structure
mkdir -p src/{components,composables,stores,types,services,utils,layouts,views}
mkdir -p src/components/{layout,dashboard,contacts,conversations,opportunities,calendar,workflows,email-builder,forms-funnels,settings}
mkdir -p src/services/{api,websocket,auth}
```

## Configuration Files

### 1. Vite Config (vite.config.ts)

```typescript
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import path from 'path'

export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src')
    }
  },
  server: {
    port: 3000,
    proxy: {
      '/api': {
        target: 'http://localhost:8000',
        changeOrigin: true
      }
    }
  }
})
```

### 2. TypeScript Config (tsconfig.json)

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "useDefineForClassFields": true,
    "module": "ESNext",
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "skipLibCheck": true,
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "jsx": "preserve",
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true,
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"]
    }
  },
  "include": ["src/**/*.ts", "src/**/*.tsx", "src/**/*.vue"],
  "references": [{ "path": "./tsconfig.node.json" }]
}
```

### 3. Router Setup (src/router/index.ts)

```typescript
import { createRouter, createWebHistory } from 'vue-router'
import type { RouteRecordRaw } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const routes: RouteRecordRaw[] = [
  {
    path: '/login',
    name: 'login',
    component: () => import('@/views/auth/LoginView.vue'),
    meta: { requiresAuth: false }
  },
  {
    path: '/',
    component: () => import('@/layouts/MainLayout.vue'),
    meta: { requiresAuth: true },
    children: [
      {
        path: '',
        name: 'dashboard',
        component: () => import('@/views/DashboardView.vue')
      },
      {
        path: 'contacts',
        name: 'contacts',
        component: () => import('@/views/contacts/ContactsView.vue')
      },
      {
        path: 'contacts/:id',
        name: 'contact-detail',
        component: () => import('@/views/contacts/ContactDetailView.vue')
      },
      {
        path: 'conversations',
        name: 'conversations',
        component: () => import('@/views/conversations/ConversationsView.vue')
      },
      {
        path: 'opportunities',
        name: 'opportunities',
        component: () => import('@/views/opportunities/OpportunitiesView.vue')
      },
      {
        path: 'calendar',
        name: 'calendar',
        component: () => import('@/views/calendar/CalendarView.vue')
      },
      {
        path: 'workflows',
        name: 'workflows',
        component: () => import('@/views/workflows/WorkflowsView.vue')
      },
      {
        path: 'workflows/:id',
        name: 'workflow-builder',
        component: () => import('@/views/workflows/WorkflowBuilderView.vue')
      },
      {
        path: 'email-builder',
        name: 'email-builder',
        component: () => import('@/views/email/EmailBuilderView.vue')
      },
      {
        path: 'forms',
        name: 'forms',
        component: () => import('@/views/forms/FormsView.vue')
      },
      {
        path: 'forms/:id',
        name: 'form-builder',
        component: () => import('@/views/forms/FormBuilderView.vue')
      },
      {
        path: 'settings',
        component: () => import('@/views/settings/SettingsLayout.vue'),
        children: [
          {
            path: '',
            redirect: '/settings/profile'
          },
          {
            path: 'profile',
            name: 'settings-profile',
            component: () => import('@/views/settings/ProfileSettings.vue')
          },
          {
            path: 'locations',
            name: 'settings-locations',
            component: () => import('@/views/settings/LocationsSettings.vue')
          },
          {
            path: 'integrations',
            name: 'settings-integrations',
            component: () => import('@/views/settings/IntegrationsSettings.vue')
          },
          {
            path: 'users',
            name: 'settings-users',
            component: () => import('@/views/settings/UsersSettings.vue')
          }
        ]
      }
    ]
  },
  {
    path: '/:pathMatch(.*)*',
    name: 'not-found',
    component: () => import('@/views/NotFoundView.vue')
  }
]

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes
})

// Navigation guards
router.beforeEach((to, from, next) => {
  const authStore = useAuthStore()
  const requiresAuth = to.matched.some(record => record.meta.requiresAuth !== false)

  if (requiresAuth && !authStore.isAuthenticated) {
    next({ name: 'login', query: { redirect: to.fullPath } })
  } else if (to.name === 'login' && authStore.isAuthenticated) {
    next({ name: 'dashboard' })
  } else {
    next()
  }
})

export default router
```

### 4. Pinia Setup (src/stores/index.ts)

```typescript
import { createPinia } from 'pinia'
import piniaPluginPersistedstate from 'pinia-plugin-persistedstate'

const pinia = createPinia()
pinia.use(piniaPluginPersistedstate)

export default pinia
```

### 5. Main App Entry (src/main.ts)

```typescript
import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import pinia from './stores'
import './assets/main.css'

const app = createApp(App)

app.use(pinia)
app.use(router)

app.mount('#app')
```

## Services Setup

### 1. API Service (src/services/api/index.ts)

```typescript
import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios'
import { useAuthStore } from '@/stores/auth'

class ApiService {
  private client: AxiosInstance

  constructor() {
    this.client = axios.create({
      baseURL: import.meta.env.VITE_API_BASE_URL || '/api',
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json'
      }
    })

    this.setupInterceptors()
  }

  private setupInterceptors() {
    // Request interceptor
    this.client.interceptors.request.use(
      (config) => {
        const authStore = useAuthStore()
        if (authStore.token) {
          config.headers.Authorization = `Bearer ${authStore.token}`
        }
        return config
      },
      (error) => {
        return Promise.reject(error)
      }
    )

    // Response interceptor
    this.client.interceptors.response.use(
      (response) => response,
      async (error) => {
        const originalRequest = error.config

        // Handle 401 errors
        if (error.response?.status === 401 && !originalRequest._retry) {
          originalRequest._retry = true

          try {
            const authStore = useAuthStore()
            await authStore.refreshToken()
            return this.client(originalRequest)
          } catch (refreshError) {
            const authStore = useAuthStore()
            authStore.logout()
            return Promise.reject(refreshError)
          }
        }

        return Promise.reject(error)
      }
    )
  }

  public async get<T>(url: string, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> {
    return this.client.get<T>(url, config)
  }

  public async post<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> {
    return this.client.post<T>(url, data, config)
  }

  public async put<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> {
    return this.client.put<T>(url, data, config)
  }

  public async patch<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> {
    return this.client.patch<T>(url, data, config)
  }

  public async delete<T>(url: string, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> {
    return this.client.delete<T>(url, config)
  }
}

export default new ApiService()
```

### 2. WebSocket Service (src/services/websocket/index.ts)

```typescript
import { io, Socket } from 'socket.io-client'
import { useAuthStore } from '@/stores/auth'

class WebSocketService {
  private socket: Socket | null = null
  private reconnectAttempts = 0
  private maxReconnectAttempts = 5

  connect() {
    const authStore = useAuthStore()

    this.socket = io(import.meta.env.VITE_WS_URL || 'ws://localhost:8000', {
      auth: {
        token: authStore.token
      },
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: this.maxReconnectAttempts
    })

    this.setupEventHandlers()
  }

  private setupEventHandlers() {
    if (!this.socket) return

    this.socket.on('connect', () => {
      console.log('WebSocket connected')
      this.reconnectAttempts = 0
    })

    this.socket.on('disconnect', (reason) => {
      console.log('WebSocket disconnected:', reason)
    })

    this.socket.on('error', (error) => {
      console.error('WebSocket error:', error)
    })

    this.socket.on('reconnect_attempt', () => {
      this.reconnectAttempts++
      console.log(`Reconnect attempt ${this.reconnectAttempts}`)
    })
  }

  on(event: string, callback: (...args: any[]) => void) {
    this.socket?.on(event, callback)
  }

  off(event: string, callback?: (...args: any[]) => void) {
    this.socket?.off(event, callback)
  }

  emit(event: string, ...args: any[]) {
    this.socket?.emit(event, ...args)
  }

  disconnect() {
    this.socket?.disconnect()
    this.socket = null
  }

  get connected(): boolean {
    return this.socket?.connected || false
  }
}

export default new WebSocketService()
```

## CSS Variables Setup (src/assets/main.css)

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

:root {
  /* Colors */
  --primary-color: #3b82f6;
  --primary-color-hover: #2563eb;
  --secondary-color: #64748b;
  --success-color: #10b981;
  --warning-color: #f59e0b;
  --error-color: #ef4444;
  --info-color: #06b6d4;

  /* Background */
  --bg-primary: #ffffff;
  --bg-secondary: #f8fafc;
  --bg-tertiary: #f1f5f9;
  --bg-hover: #e2e8f0;
  --bg-canvas: #fafafa;

  /* Text */
  --text-primary: #1e293b;
  --text-secondary: #64748b;
  --text-tertiary: #94a3b8;

  /* Borders */
  --border-color: #e2e8f0;
  --border-color-hover: #cbd5e1;

  /* Tags */
  --tag-bg: #e0e7ff;
  --tag-text: #3730a3;

  /* Grid */
  --grid-color: #e5e7eb;

  /* Shadows */
  --shadow-sm: 0 1px 2px 0 rgb(0 0 0 / 0.05);
  --shadow-md: 0 4px 6px -1px rgb(0 0 0 / 0.1);
  --shadow-lg: 0 10px 15px -3px rgb(0 0 0 / 0.1);
}

[data-theme='dark'] {
  /* Colors */
  --primary-color: #3b82f6;
  --primary-color-hover: #60a5fa;

  /* Background */
  --bg-primary: #0f172a;
  --bg-secondary: #1e293b;
  --bg-tertiary: #334155;
  --bg-hover: #475569;
  --bg-canvas: #020617;

  /* Text */
  --text-primary: #f1f5f9;
  --text-secondary: #cbd5e1;
  --text-tertiary: #94a3b8;

  /* Borders */
  --border-color: #334155;
  --border-color-hover: #475569;

  /* Tags */
  --tag-bg: #1e3a8a;
  --tag-text: #93c5fd;

  /* Grid */
  --grid-color: #1e293b;
}

* {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
  background-color: var(--bg-primary);
  color: var(--text-primary);
  line-height: 1.5;
}

/* Scrollbar Styles */
::-webkit-scrollbar {
  width: 8px;
  height: 8px;
}

::-webkit-scrollbar-track {
  background: var(--bg-secondary);
}

::-webkit-scrollbar-thumb {
  background: var(--border-color);
  border-radius: 4px;
}

::-webkit-scrollbar-thumb:hover {
  background: var(--border-color-hover);
}
```

## Environment Variables (.env)

```env
VITE_API_BASE_URL=http://localhost:8000/api
VITE_WS_URL=ws://localhost:8000
VITE_APP_NAME=GoHighLevel Clone
VITE_APP_VERSION=1.0.0
```

## Development Workflow

### 1. Start Development Server

```bash
npm run dev
```

### 2. Build for Production

```bash
npm run build
```

### 3. Preview Production Build

```bash
npm run preview
```

### 4. Type Check

```bash
npm run type-check
```

### 5. Lint and Format

```bash
npm run lint
npm run format
```

## Component Development Workflow

### 1. Create New Component

```bash
# Example: Creating a new widget component
touch src/components/dashboard/NewWidget.vue
```

### 2. Component Template

```vue
<script setup lang="ts">
import { ref, computed } from 'vue'

interface NewWidgetProps {
  // Define props
}

const props = defineProps<NewWidgetProps>()

const emit = defineEmits<{
  // Define emits
}>()

// Component logic
</script>

<template>
  <div class="new-widget">
    <!-- Template -->
  </div>
</template>

<style scoped>
/* Component styles */
</style>
```

### 3. Register in Parent Component

```vue
<script setup lang="ts">
import NewWidget from '@/components/dashboard/NewWidget.vue'
</script>

<template>
  <NewWidget />
</template>
```

## Testing Strategy

### 1. Unit Tests (Vitest)

```bash
npm install -D vitest @vue/test-utils
```

### 2. Component Test Example

```typescript
import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import ContactsList from '@/components/contacts/ContactsList.vue'

describe('ContactsList', () => {
  it('renders contacts correctly', () => {
    const wrapper = mount(ContactsList, {
      props: {
        contacts: [
          { id: '1', firstName: 'John', lastName: 'Doe' }
        ]
      }
    })

    expect(wrapper.text()).toContain('John Doe')
  })
})
```

### 3. E2E Tests (Playwright)

```bash
npm install -D @playwright/test
```

## Performance Optimization

### 1. Code Splitting

```typescript
// Use dynamic imports for routes
const Dashboard = () => import('@/views/DashboardView.vue')
```

### 2. Lazy Loading Components

```vue
<script setup lang="ts">
import { defineAsyncComponent } from 'vue'

const HeavyComponent = defineAsyncComponent(() =>
  import('@/components/HeavyComponent.vue')
)
</script>
```

### 3. Virtual Scrolling

```bash
npm install vue-virtual-scroller
```

## Deployment

### 1. Docker

```dockerfile
FROM node:18-alpine as build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/nginx.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

### 2. Vercel/Netlify

```bash
npm run build
# Deploy dist folder
```

## Best Practices

1. Always use TypeScript for type safety
2. Keep components small and focused
3. Use composables for reusable logic
4. Implement proper error handling
5. Add loading states for async operations
6. Use semantic HTML
7. Ensure accessibility (ARIA labels, keyboard navigation)
8. Optimize images and assets
9. Implement proper caching strategies
10. Monitor performance metrics

## Resources

- Vue 3 Documentation: https://vuejs.org/
- Pinia Documentation: https://pinia.vuejs.org/
- Vue Router Documentation: https://router.vuejs.org/
- TypeScript Documentation: https://www.typescriptlang.org/
- Vite Documentation: https://vitejs.dev/
