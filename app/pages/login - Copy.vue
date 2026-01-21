<template>
  <div class="login-page">
    <div class="login-container">
      <!-- Left Panel - Brand/Info -->
      <div class="login-brand">
        <div class="hero-logo">
          <img src="/favicon_VG-1-75x75.png" alt="Vision Group Logo">
        </div>
        <h1>Vision Group</h1>
        <h2>Advertising Management System</h2>
        <p class="brand-tagline">Streamline your advertising operations across all platforms</p>
      </div>

      <!-- Right Panel - Login Form -->
      <div class="login-form-container">
        <div class="form-header">
          <h3>Sign In</h3>
          <p>Enter your credentials to continue</p>
        </div>

        <form @submit.prevent="handleLogin" class="login-form">
          <div class="form-group">
            <label for="email">Email Address</label>
            <input 
              v-model="email"
              type="email" 
              id="email" 
              placeholder="email@visiongroup.co.ug" 
              required
              class="form-input"
            >
          </div>

          <div class="form-group">
            <label for="password">Password</label>
            <input 
              v-model="password"
              type="password" 
              id="password" 
              placeholder="••••••••" 
              required
              class="form-input"
            >
          </div>

          <div class="form-group">
            <label for="userRole">Role</label>
            <select v-model="role" id="userRole" required class="form-input">
              <option value="">Select your role</option>
              <option value="clerk">Booking Clerk</option>
              <option value="editor">Sub-Editor</option>
              <option value="manager">Advertising Manager</option>
              <option value="design">Design House</option>
              <option value="finance">Finance Team</option>
              <option value="admin">Administrator</option>
            </select>
          </div>

          <button type="submit" class="login-button" :disabled="loading">
            {{ loading ? 'Signing in...' : 'Sign In →' }}
          </button>

          <p class="forgot-password">
            <a href="#" @click.prevent="handleForgotPassword">Forgot password?</a>
          </p>
        </form>

        <div class="login-footer">
          <p>© 2024 Vision Group. All rights reserved.</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount } from 'vue'
import { useAuth } from '~/composables/useAuth'

const email = ref('')
const password = ref('')
const role = ref('')
const loading = ref(false)

definePageMeta({
  layout: 'auth'
})

const { login } = useAuth()
const router = useRouter()

const handleLogin = async () => {
  try {
    loading.value = true
    await login({
      email: email.value,
      password: password.value,
      role: role.value
    })
    router.push('/dashboard')
  } catch (error) {
    console.error('Login failed:', error)
    alert('Login failed. Please check your credentials.')
  } finally {
    loading.value = false
  }
}

const handleForgotPassword = () => {
  alert('Password reset feature coming soon!')
}

// Disable right-click
const disableRightClick = (e) => {
  e.preventDefault()
  return false
}

// Disable scroll
const disableScroll = () => {
  // Prevent keyboard scrolling
  const preventDefault = (e) => {
    if (e.key === 'ArrowUp' || e.key === 'ArrowDown' || 
        e.key === ' ' || e.key === 'PageUp' || e.key === 'PageDown' ||
        e.key === 'Home' || e.key === 'End') {
      e.preventDefault()
      return false
    }
  }

  // Prevent wheel/touchpad scrolling
  const preventWheel = (e) => {
    e.preventDefault()
    return false
  }

  // Add event listeners
  window.addEventListener('keydown', preventDefault, { passive: false })
  window.addEventListener('wheel', preventWheel, { passive: false })
  window.addEventListener('touchmove', preventWheel, { passive: false })
  window.addEventListener('contextmenu', disableRightClick)

  // Save references to remove them later
  return {
    preventDefault,
    preventWheel,
    disableRightClick
  }
}

// Enable scroll (cleanup function)
const enableScroll = (listeners) => {
  if (listeners) {
    window.removeEventListener('keydown', listeners.preventDefault)
    window.removeEventListener('wheel', listeners.preventWheel)
    window.removeEventListener('touchmove', listeners.preventWheel)
    window.removeEventListener('contextmenu', listeners.disableRightClick)
  }
}

let scrollListeners = null

onMounted(() => {
  // Disable scrolling on mount
  scrollListeners = disableScroll()
  
  // Apply CSS to prevent body scroll
  document.body.style.overflow = 'hidden'
  
  // Also add to html element for extra safety
  document.documentElement.style.overflow = 'hidden'
})

onBeforeUnmount(() => {
  // Re-enable scrolling when component unmounts
  if (scrollListeners) {
    enableScroll(scrollListeners)
  }
  
  // Restore body styles
  document.body.style.overflow = ''
  
  // Restore html styles
  document.documentElement.style.overflow = ''
})
</script>

<style scoped>
.login-page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
  /*background: #f8f9fa;*/
  overflow: hidden;
  width: 100%;
}

.hero-logo {
  width: 30px;
  height: 30px;
  margin: 0 auto 30px;
  background: white;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 2em;
  font-weight: bold;
  color: #E31E24;
}

.login-container {
  display: flex;
  max-width: 900px;
  width: 95%;
  height: 500px;
  background: white;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 8px 30px rgba(0, 0, 0, 0.12);
}

/* Left Panel */
.login-brand {
  flex: 1;
  background: linear-gradient(135deg, #003366 0%, #004488 100%);
  color: white;
  padding: 5px;
  display: flex;
  flex-direction: column;
  justify-content: center;
}

.brand-logo {
  width: 60px;
  height: 60px;
  background: #E31E24;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.8em;
  font-weight: bold;
  margin-bottom: 20px;
}

.login-brand h1 {
  font-size: 2em;
  margin-bottom: 8px;
  font-weight: 700;
}

.login-brand h2 {
  font-size: 1.2em;
  margin-bottom: 20px;
  font-weight: 400;
  opacity: 0.9;
}

.brand-tagline {
  font-size: 0.95em;
  opacity: 0.8;
  line-height: 1.5;
}

/* Right Panel */
.login-form-container {
  flex: 1;
  padding-top: 10px;
  padding-top: 10px;
  padding-left: 20px;
  padding-right: 20px;
  display: flex;
  flex-direction: column;
  justify-content: center;
}

.form-header {
  margin-bottom: 10px;
}

.form-header h3 {
  color: #003366;
  font-size: 1.8em;
  margin-bottom: 8px;
  font-weight: 600;
}

.form-header p {
  color: #666;
  font-size: 0.95em;
}

.login-form {
  width: 100%;
}

.form-group {
  margin-bottom: 18px;
}

.form-group label {
  display: block;
  margin-bottom: 6px;
  color: #333;
  font-size: 0.9em;
  font-weight: 500;
}

.form-input {
  width: 100%;
  padding: 10px 12px;
  border: 1px solid #ddd;
  border-radius: 6px;
  font-size: 0.95em;
  transition: all 0.3s;
  background: #f8f9fa;
}

.form-input:focus {
  outline: none;
  border-color: #0066CC;
  background: white;
  box-shadow: 0 0 0 3px rgba(0, 102, 204, 0.1);
}

.login-button {
  width: 100%;
  background: #E31E24;
  color: white;
  padding: 12px;
  border: none;
  border-radius: 6px;
  font-size: 1em;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s;
  margin-top: 10px;
}

.login-button:hover:not(:disabled) {
  background: #c01820;
  transform: translateY(-1px);
}

.login-button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.forgot-password {
  text-align: center;
  margin-top: 8px;
}

.forgot-password a {
  color: #666;
  text-decoration: none;
  font-size: 0.9em;
  transition: color 0.3s;
}

.forgot-password a:hover {
  color: #E31E24;
}

.login-footer {
  margin-top: 10px;
  text-align: center;
  color: #999;
  font-size: 0.8em;
  padding-top: 20px;
  border-top: 1px solid #eee;
}

/* Responsive Design */
@media (max-width: 768px) {
  .login-page {
    padding: 20px;
    min-height: 100vh;
    display: flex;
    align-items: center;
    justify-content: center;
    background: #f8f9fa;
  }
  
  .login-container {
    flex-direction: column;
    height: auto;
    max-width: 400px;
  }
  
  .login-brand {
    padding: 30px;
    text-align: center;
  }
  
  .brand-logo {
    margin: 0 auto 20px;
  }
  
  .login-form-container {
    padding: 30px;
  }
  
  .login-brand h1 {
    font-size: 1.8em;
  }
  
  .login-brand h2 {
    font-size: 1.1em;
  }
}

@media (max-width: 480px) {
  .login-page {
    padding: 10px;
    background: #f8f9fa;
  }
  
  .login-brand,
  .login-form-container {
    padding: 25px;
  }
  
  .brand-logo {
    width: 50px;
    height: 50px;
    font-size: 1.5em;
  }
}
</style>