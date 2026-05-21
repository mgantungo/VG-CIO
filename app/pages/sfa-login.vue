<!-- pages/sfa-login.vue -->
<template>
  <div class="login-page">
    <div class="login-container">

      <!-- Left Panel -->
      <div class="login-brand">
        <div class="hero-logo">
          <img src="/favicon_VG-1-75x75.png" alt="Vision Group Logo">
        </div>
        <h1>Vision Group</h1>
        <h2>Sales Force Automation</h2>
        <p class="brand-tagline">Manage opportunities, quotations and orders from a single pipeline.</p>
        <div class="brand-note">
          <span class="brand-note-icon">🔒</span>
          Access restricted to authorised sales persons
        </div>
      </div>

      <!-- Right Panel -->
      <div class="login-form-container">
        <div class="form-header">
          <h3>SFA Sign In</h3>
          <p>Enter your company credentials to continue</p>
        </div>

        <div v-if="loginError" class="error-alert">
          {{ loginError }}
        </div>

        <form class="login-form" @submit.prevent="handleLogin">

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
            />
            <p v-if="emailError" class="error-message">{{ emailError }}</p>
            <p v-else class="form-hint">Use your @newvision.co.ug email</p>
          </div>

          <div class="form-group">
            <label for="password">Password</label>
            <div class="password-wrap">
              <input
                v-model="password"
                :type="showPassword ? 'text' : 'password'"
                id="password"
                placeholder="••••••••"
                required
                class="form-input"
              />
              <button type="button" class="pw-toggle" @click="showPassword = !showPassword">
                {{ showPassword ? '🙈' : '👁' }}
              </button>
            </div>
          </div>

          <button
            type="submit"
            class="login-button"
            :disabled="loading || !isFormValid"
          >
            {{ loading ? 'Signing in…' : 'Access Sales Force →' }}
          </button>

          <p class="forgot-password">
            <a href="#" @click.prevent="() => alert('Contact Admin for password reset!')">
              Forgot password?
            </a>
          </p>

        </form>

        <div class="login-footer">
          <p>© 2026 Vision Group. All rights reserved.</p>
          <p class="footer-sub">Sales Force Automation Module</p>
        </div>
      </div>

    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useSfaAuth } from '~/composables/useSfaAuth'

definePageMeta({ layout: 'auth' })

const router = useRouter()
const { login, loading, loginError } = useSfaAuth()

const email        = ref('')
const password     = ref('')
const showPassword = ref(false)
const emailError   = ref('')

function validateEmailFormat() {
  if (!email.value) {
    emailError.value = 'Email is required'
    return false
  }
  if (!email.value.toLowerCase().endsWith('@newvision.co.ug')) {
    emailError.value = 'Email must end with @newvision.co.ug'
    return false
  }
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailRegex.test(email.value)) {
    emailError.value = 'Invalid email format'
    return false
  }
  emailError.value = ''
  return true
}

const isFormValid = computed(() => email.value && password.value && !emailError.value)

async function handleLogin() {
  if (!validateEmailFormat()) return

  const result = await login(email.value, password.value)

  if (result.success) {
    router.push('/dashboard/sfa')
  }
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
}

.login-container {
  display: flex;
  max-width: 900px;
  width: 95%;
  height: 540px;
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
  padding: 40px;
  display: flex;
  flex-direction: column;
  justify-content: center;
}
.login-brand h1    { font-size: 2em; margin-bottom: 8px; font-weight: 700; }
.login-brand h2    { font-size: 1.2em; margin-bottom: 20px; font-weight: 400; opacity: 0.9; }
.brand-tagline     { font-size: 0.95em; opacity: 0.8; line-height: 1.5; margin-bottom: 24px; }
.brand-note {
  display: flex; align-items: center; gap: 8px;
  background: rgba(255,255,255,0.1); border-radius: 6px;
  padding: 10px 14px; font-size: 0.85em; opacity: 0.85; margin-top: auto;
}
.brand-note-icon { font-size: 14px; }

/* Right Panel */
.login-form-container {
  flex: 1; padding: 40px;
  display: flex; flex-direction: column; justify-content: center;
}
.form-header           { margin-bottom: 20px; }
.form-header h3        { color: #003366; font-size: 1.8em; margin-bottom: 8px; font-weight: 600; }
.form-header p         { color: #666; font-size: 0.95em; }
.login-form            { width: 100%; }
.form-group            { margin-bottom: 18px; }
.form-group label      { display: block; margin-bottom: 6px; color: #333; font-size: 0.9em; font-weight: 500; }

.form-input {
  width: 100%; padding: 10px 12px;
  border: 1px solid #ddd; border-radius: 6px;
  font-size: 0.95em; transition: all 0.3s;
  background: #f8f9fa; box-sizing: border-box;
}
.form-input:focus {
  outline: none; border-color: #0066CC;
  background: white; box-shadow: 0 0 0 3px rgba(0,102,204,0.1);
}
.form-input.error-input { border-color: #E31E24; background-color: #fff5f5; }
.error-message  { color: #E31E24; font-size: 0.85em; margin-top: 4px; margin-bottom: 0; }
.form-hint      { color: #666; font-size: 0.8em; margin-top: 4px; font-style: italic; }

.password-wrap              { position: relative; }
.password-wrap .form-input  { padding-right: 44px; }
.pw-toggle {
  position: absolute; right: 10px; top: 50%; transform: translateY(-50%);
  background: none; border: none; cursor: pointer; font-size: 16px; color: #8094B8;
}

.login-button {
  width: 100%; background: #003366; color: white;
  padding: 12px; border: none; border-radius: 6px;
  font-size: 1em; font-weight: 500; cursor: pointer;
  transition: all 0.3s; margin-top: 10px;
}
.login-button:hover:not(:disabled) { background: #002244; transform: translateY(-1px); }
.login-button:disabled             { opacity: 0.6; cursor: not-allowed; background: #cccccc; }

.error-alert {
  background-color: #fff5f5; border: 1px solid #fed7d7;
  border-radius: 6px; color: #e53e3e;
  padding: 10px 12px; margin-bottom: 16px;
  font-size: 0.9em; line-height: 1.5;
}

.forgot-password     { text-align: center; margin-top: 15px; }
.forgot-password a   { color: #666; text-decoration: none; font-size: 0.9em; }
.forgot-password a:hover { color: #003366; }

.login-footer    { margin-top: 20px; text-align: center; color: #999; font-size: 0.8em; padding-top: 20px; border-top: 1px solid #eee; }
.footer-sub      { font-size: 0.75em; color: #bbb; margin-top: 3px; }

@media (max-width: 768px) {
  .login-container      { flex-direction: column; height: auto; max-width: 400px; }
  .login-brand          { padding: 30px; text-align: center; }
  .login-form-container { padding: 30px; }
}
@media (max-width: 480px) {
  .login-brand, .login-form-container { padding: 25px; }
}
</style>