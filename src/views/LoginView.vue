<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { useHydroponicsStore } from '@/stores/hydroponics'

const router = useRouter()
const store = useHydroponicsStore()

const username = ref('')
const password = ref('')
const showPassword = ref(false)
const errorMessage = ref('')
const isSubmitting = ref(false)

const bgCanvas = ref<HTMLCanvasElement | null>(null)
let animFrameId: number | null = null

interface Particle {
  x: number
  y: number
  radius: number
  vy: number
  vx: number
  alpha: number
  isNode: boolean
}

function initCanvas() {
  const canvas = bgCanvas.value
  if (!canvas) return
  const ctx = canvas.getContext('2d')
  if (!ctx) return

  let width = (canvas.width = window.innerWidth)
  let height = (canvas.height = window.innerHeight)

  const handleResize = () => {
    if (!canvas) return
    width = canvas.width = window.innerWidth
    height = canvas.height = window.innerHeight
  }
  window.addEventListener('resize', handleResize)

  const particleCount = 48
  const particles: Particle[] = Array.from({ length: particleCount }, (_, i) => ({
    x: Math.random() * width,
    y: Math.random() * height,
    radius: i % 4 === 0 ? 2.4 : 1.4 + Math.random() * 1.4,
    vy: -(0.22 + Math.random() * 0.45),
    vx: (Math.random() - 0.5) * 0.25,
    alpha: 0.15 + Math.random() * 0.25,
    isNode: i % 3 === 0
  }))

  const render = () => {
    ctx.clearRect(0, 0, width, height)

    // Draw subtle background grid
    ctx.strokeStyle = 'rgba(26, 46, 26, 0.32)'
    ctx.lineWidth = 1
    const gridSize = 52
    for (let x = 0; x < width; x += gridSize) {
      ctx.beginPath()
      ctx.moveTo(x, 0)
      ctx.lineTo(x, height)
      ctx.stroke()
    }
    for (let y = 0; y < height; y += gridSize) {
      ctx.beginPath()
      ctx.moveTo(0, y)
      ctx.lineTo(width, y)
      ctx.stroke()
    }

    // Update & draw floating spores / micro-bubbles & geometric data links
    for (let i = 0; i < particles.length; i++) {
      const p = particles[i]!
      p.y += p.vy
      p.x += p.vx

      if (p.y < -12) {
        p.y = height + 12
        p.x = Math.random() * width
      }
      if (p.x < -12) p.x = width + 12
      if (p.x > width + 12) p.x = -12

      // Faint geometric connection lines between nearby data nodes
      if (p.isNode) {
        for (let j = i + 1; j < particles.length; j++) {
          const p2 = particles[j]!
          if (!p2.isNode) continue
          const dx = p.x - p2.x
          const dy = p.y - p2.y
          const dist = Math.sqrt(dx * dx + dy * dy)
          if (dist < 145) {
            const lineAlpha = (1 - dist / 145) * 0.16
            ctx.strokeStyle = `rgba(34, 197, 94, ${lineAlpha.toFixed(3)})`
            ctx.lineWidth = 1
            ctx.beginPath()
            ctx.moveTo(p.x, p.y)
            ctx.lineTo(p2.x, p2.y)
            ctx.stroke()
          }
        }
      }

      // Draw spore / micro-bubble or geometric node
      ctx.beginPath()
      if (p.isNode) {
        ctx.strokeStyle = `rgba(34, 197, 94, ${p.alpha})`
        ctx.lineWidth = 1.2
        ctx.strokeRect(p.x - p.radius, p.y - p.radius, p.radius * 2, p.radius * 2)
      } else {
        ctx.fillStyle = `rgba(34, 197, 94, ${p.alpha})`
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2)
        ctx.fill()
      }
    }

    animFrameId = window.requestAnimationFrame(render)
  }

  render()

  onUnmounted(() => {
    window.removeEventListener('resize', handleResize)
    if (animFrameId !== null) {
      window.cancelAnimationFrame(animFrameId)
    }
  })
}

onMounted(() => {
  initCanvas()
})

function handleLogin() {
  errorMessage.value = ''

  if (!username.value.trim() || !password.value) {
    errorMessage.value = 'Please enter both username and password.'
    return
  }

  isSubmitting.value = true
  window.setTimeout(() => {
    const ok = store.login(username.value, password.value)
    isSubmitting.value = false
    if (ok) {
      router.push('/dashboard')
    } else {
      errorMessage.value = 'Invalid username or password.'
    }
  }, 150)
}
</script>

<template>
  <div class="login-viewport">
    <!-- Atmospheric Floating Spores & Geometric Nodes Canvas -->
    <canvas ref="bgCanvas" class="bg-canvas"></canvas>

    <!-- Minimalist Centered Login Card -->
    <div class="login-card">
      <div class="brand-header">
        <div class="logo-box">
          <svg class="plant-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75">
            <path d="M7 21h10" stroke-linecap="round" />
            <path d="M6 15h12l-1.5 6h-9z" stroke-linejoin="round" />
            <path d="M12 15V7" stroke-linecap="round" />
            <path d="M12 10c-3 0-5-2-5-5 3 0 5 2 5 5z" stroke-linejoin="round" />
            <path d="M12 8c3 0 5-2 5-5-3 0-5 2-5 5z" stroke-linejoin="round" />
            <circle cx="12" cy="3" r="1.5" fill="currentColor" stroke="none" />
          </svg>
        </div>
        <h1 class="brand-title">FARMSIM</h1>
        <p class="brand-subtitle">Precision Farming &amp; Hydroponic Simulator</p>
      </div>

      <form class="login-form" @submit.prevent="handleLogin">
        <!-- Username Input -->
        <div class="field-group">
          <label for="login-user" class="field-label">Username</label>
          <div class="input-wrap">
            <svg class="field-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" stroke-linecap="round" />
              <circle cx="12" cy="7" r="4" />
            </svg>
            <input
              id="login-user"
              v-model="username"
              type="text"
              autocomplete="username"
              placeholder="Username"
              class="field-input"
            />
          </div>
        </div>

        <!-- Password Input with Show/Hide Eye Toggle -->
        <div class="field-group">
          <label for="login-pass" class="field-label">Password</label>
          <div class="input-wrap">
            <svg class="field-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
              <path d="M7 11V7a5 5 0 0 1 10 0v4" stroke-linecap="round" />
            </svg>
            <input
              id="login-pass"
              v-model="password"
              :type="showPassword ? 'text' : 'password'"
              autocomplete="current-password"
              placeholder="Password"
              class="field-input"
            />
            <button
              type="button"
              class="eye-toggle-btn"
              :aria-label="showPassword ? 'Hide password' : 'Show password'"
              @click="showPassword = !showPassword"
            >
              <!-- Eye Off Icon -->
              <svg v-if="showPassword" class="eye-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75">
                <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" stroke-linecap="round" stroke-linejoin="round" />
                <line x1="1" y1="1" x2="23" y2="23" stroke-linecap="round" />
              </svg>
              <!-- Eye Icon -->
              <svg v-else class="eye-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75">
                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" stroke-linejoin="round" />
                <circle cx="12" cy="12" r="3" />
              </svg>
            </button>
          </div>
        </div>

        <!-- Clean Inline Error Message -->
        <div v-if="errorMessage" class="error-banner">
          <svg class="err-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75">
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" stroke-linecap="round" />
            <line x1="12" y1="16" x2="12.01" y2="16" stroke-linecap="round" />
          </svg>
          <span>{{ errorMessage }}</span>
        </div>

        <button type="submit" class="signin-btn" :disabled="isSubmitting">
          {{ isSubmitting ? 'SIGNING IN...' : 'SIGN IN' }}
        </button>
      </form>
    </div>
  </div>
</template>

<style scoped>
.login-viewport {
  position: relative;
  width: 100vw;
  height: 100vh;
  background-color: #060c06;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  padding: 20px;
}

.bg-canvas {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  z-index: 1;
}

.login-card {
  position: relative;
  z-index: 2;
  width: 100%;
  max-width: 380px;
  background-color: #0b140b;
  border: 1px solid var(--border-subtle);
  border-radius: 8px;
  padding: 32px 28px 28px 28px;
}

.brand-header {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  margin-bottom: 26px;
}

.logo-box {
  width: 46px;
  height: 46px;
  border-radius: 8px;
  background-color: #102010;
  border: 1px solid #22c55e;
  color: var(--text-neon);
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 12px;
}

.plant-svg {
  width: 24px;
  height: 24px;
}

.brand-title {
  font-size: 1.35rem;
  font-weight: 700;
  letter-spacing: 0.14em;
  color: var(--text-primary);
  line-height: 1.2;
}

.brand-subtitle {
  font-size: 0.76rem;
  color: var(--text-muted);
  margin-top: 4px;
}

.login-form {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.field-group {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.field-label {
  font-size: 0.72rem;
  font-weight: 500;
  color: var(--text-secondary);
}

.input-wrap {
  display: flex;
  align-items: center;
  gap: 10px;
  background-color: #060c06;
  border: 1px solid var(--border-subtle);
  border-radius: 6px;
  padding: 0 12px;
  height: 42px;
  transition: border-color 0.15s ease;
}

.input-wrap:focus-within {
  border-color: var(--text-neon);
}

.field-svg {
  width: 17px;
  height: 17px;
  color: var(--text-muted);
  flex-shrink: 0;
}

.field-input {
  flex: 1;
  min-width: 0;
  background: transparent;
  border: none;
  outline: none;
  color: var(--text-primary);
  font-family: var(--font-mono);
  font-size: 0.84rem;
}

.field-input::placeholder {
  color: #365036;
}

.eye-toggle-btn {
  background: transparent;
  border: none;
  color: var(--text-muted);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 4px;
  transition: color 0.15s ease;
}

.eye-toggle-btn:hover {
  color: var(--text-neon);
}

.eye-svg {
  width: 17px;
  height: 17px;
}

.error-banner {
  background-color: rgba(255, 140, 0, 0.08);
  border: 1px solid rgba(255, 140, 0, 0.45);
  border-radius: 6px;
  padding: 9px 12px;
  display: flex;
  align-items: center;
  gap: 8px;
  color: var(--color-warn);
  font-size: 0.74rem;
  font-family: var(--font-mono);
}

.err-svg {
  width: 15px;
  height: 15px;
  flex-shrink: 0;
}

.signin-btn {
  margin-top: 4px;
  height: 42px;
  background-color: var(--text-neon);
  border: 1px solid var(--text-neon);
  border-radius: 6px;
  color: #060c06;
  font-family: var(--font-mono);
  font-size: 0.8rem;
  font-weight: 700;
  letter-spacing: 0.1em;
  cursor: pointer;
  transition: background-color 0.15s ease;
}

.signin-btn:hover {
  background-color: #1ed12d;
}

.signin-btn:disabled {
  opacity: 0.65;
  cursor: not-allowed;
}
</style>
