<!--pages/login.vue-->
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
              placeholder="name@newvision.co.ug" 
              required
              class="form-input"
              :class="{ 'error-input': emailError }"
              @blur="validateEmailFormat"
            >
            <p v-if="emailError" class="error-message">{{ emailError }}</p>
            <p v-else class="form-hint">Use your @newvision.co.ug email</p>
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

          <button type="submit" class="login-button" :disabled="loading || !isFormValid">
            {{ loading ? 'Signing in...' : 'Sign In →' }}
          </button>
        <!----
          <div v-if="loginError" class="error-alert">
            {{ loginError }}
          </div>
        -->

          <p class="forgot-password">
            <a href="#" @click.prevent="handleForgotPassword">Forgot password?</a>
          </p>
        </form>

        <div class="login-footer">
          <p>© 2026 Vision Group. All rights reserved.</p>
          <!----<p v-if="isDevMode" class="dev-info">API: {{ apiUrl }}/vgams-users/login</p>-->
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'

const email = ref('')
const password = ref('')
const loading = ref(false)
const emailError = ref('')
const loginError = ref('')

definePageMeta({
  layout: 'auth'
})

const { login, getApiUrl } = useAuth()
const router = useRouter()
const config = useRuntimeConfig()

const apiUrl = getApiUrl()
const isDevMode = computed(() => process.dev)

// Validate email format
const validateEmailFormat = () => {
  if (!email.value) {
    emailError.value = 'Email is required'
    return false
  }
  
  // Use the composable's validation
  const { validateEmail } = useAuth()
  if (!validateEmail(email.value)) {
    emailError.value = 'Email must end with @newvision.co.ug'
    return false
  }
  
  emailError.value = ''
  return true
}

// Form validation
const isFormValid = computed(() => {
  return email.value && password.value && !emailError.value
})

const handleLogin = async () => {
  // Validate email before submission
  if (!validateEmailFormat()) {
    return
  }
  
  // Clear previous errors
  loginError.value = ''
  loading.value = true
  
  try {
    const result = await login({
      email: email.value,
      password: password.value
    })
    
    // Show success message with role
    alert(`✅ Login successful! Welcome ${result.user.name}`);//displayRole

    //alert(`✅ Login Details - redirect to:  ${result.redirectTo}`);
    
    // Redirect to dashboard
    router.push(result.redirectTo || '/dashboard')
    
  } catch (error) {
    console.error('❌ Login error:', error)
    loginError.value = error.message
    
    // Show alert for network errors
    if (error.message.includes('Network') || error.message.includes('Failed to fetch')) {
      alert('Could not log you in. Check Your Credentials.')
    }
  } finally {
    loading.value = false
  }
}

const handleForgotPassword = () => {
  alert('Contact Admin for password reset!')
}

// Auto-fill test credentials for development
if (process.dev) {
  email.value = 'test@newvision.co.ug'
  password.value = 'password123'
}
</script>

<style scoped>
.login-page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
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
  padding: 20px;
  display: flex;
  flex-direction: column;
  justify-content: center;
}

.form-header {
  margin-bottom: 20px;
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

.form-input.error-input {
  border-color: #E31E24;
  background-color: #fff5f5;
}

.error-message {
  color: #E31E24;
  font-size: 0.85em;
  margin-top: 4px;
  margin-bottom: 0;
}

.form-hint {
  color: #666;
  font-size: 0.8em;
  margin-top: 4px;
  font-style: italic;
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
  background: #cccccc;
}

.error-alert {
  background-color: #fff5f5;
  border: 1px solid #fed7d7;
  border-radius: 6px;
  color: #e53e3e;
  padding: 10px 12px;
  margin-top: 15px;
  font-size: 0.9em;
}

.forgot-password {
  text-align: center;
  margin-top: 15px;
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
  margin-top: 20px;
  text-align: center;
  color: #999;
  font-size: 0.8em;
  padding-top: 20px;
  border-top: 1px solid #eee;
}

.dev-info {
  font-size: 0.7em;
  color: #ccc;
  margin-top: 5px;
  font-family: monospace;
}

/* Responsive Design */
@media (max-width: 768px) {
  .login-page {
    padding: 20px;
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
  }
  
  .login-brand,
  .login-form-container {
    padding: 25px;
  }
}
</style>