<!--pages/index.vue-->
<template>
  <div class="landing-page">
    <div class="hero-section">
      <div class="hero-content">
        <div class="hero-logo">
          <img src="/favicon_VG-1-150x150.png" alt="Vision Group Logo">
        </div>
        <h1>Vision Group Adverts Management System</h1>
        <p>Streamlining advertising operations across Print, TV, Radio, Digital, and more. From booking to billing, manage everything in one powerful platform.</p>
        <button class="cta-button" @click="navigateTo('/login')">Get Started →</button>
      </div>
    </div>

    <div class="features-section">
      <h2>What You Can Do</h2>
      <p>A comprehensive solution for managing advertising across all Vision Group platforms</p>

      <div class="features-grid">
        <div v-for="feature in features" :key="feature.title" class="feature-card">
          <div class="feature-icon">{{ feature.icon }}</div>
          <h3>{{ feature.title }}</h3>
          <p>{{ feature.description }}</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount } from 'vue'
const navigateTo = useRouter().push

// Specify layout for this page
definePageMeta({
  layout: 'auth' // Use the auth layout which doesn't have AppHeader/SideMenu
})

const features = ref([
  {
    icon: '📝',
    title: 'Advert Booking',
    description: 'Clerks can create and book adverts across multiple platforms (New Vision, Bukedde, TV, Radio, Digital). Upload supporting documents, images, videos, and PDFs. Real-time pricing calculation based on comprehensive rate cards.'
  },
  {
    icon: '✓',
    title: 'Editorial Review',
    description: 'Sub-editors review submitted adverts for compliance and quality. Approve or reject with comments. Assign adverts to specific platforms and time slots.'
  },
  {
    icon: '👨‍💼',
    title: 'Manager Approval',
    description: 'Advertising managers review revenue projections vs costs. Financial oversight and final approval. Download advert attachments for review.'
  },
  {
    icon: '🎨',
    title: 'Design House',
    description: 'Access approved adverts and download all attachments. Upload newly developed creative materials. Version control for design iterations.'
  },
  {
    icon: '💰',
    title: 'Finance & Billing',
    description: 'Track payments against bookings. Multiple payment methods (Cash, Credit, PDC). Revenue reporting and analytics. Payment collection workflow.'
  },
  {
    icon: '📊',
    title: 'Analytics Dashboard',
    description: 'Real-time revenue tracking across all platforms. Performance metrics by product category. Client activity and payment status monitoring.'
  },
  {
    icon: '🔐',
    title: 'Role-Based Access',
    description: 'Secure login for different user types. Clerks, Editors, Managers, Design Team, Finance. Customized dashboards per role.'
  },
  {
    icon: '📱',
    title: 'Multi-Platform Support',
    description: 'Manage adverts for Print (New Vision, Bukedde, supplements). Broadcast (UBC TV, Bukedde TV, Radio stations). Digital (Websites, Apps, Social Media).'
  },
  {
    icon: '📄',
    title: 'Document Management',
    description: 'Centralized storage for all advert materials. Support for Word documents, PDFs, images, videos. Easy retrieval and reference system.'
  }
])

// Disable right-click
const disableRightClick = (e) => {
  e.preventDefault()
  return false
}

// Prevent horizontal scrolling
const preventHorizontalScroll = (e) => {
  if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
    e.preventDefault()
    return false
  }
}

// Add event listeners
onMounted(() => {
  window.addEventListener('contextmenu', disableRightClick)
  window.addEventListener('keydown', preventHorizontalScroll)
  
  // Also prevent wheel/touchpad horizontal scrolling
  window.addEventListener('wheel', (e) => {
    if (Math.abs(e.deltaX) > Math.abs(e.deltaY)) {
      e.preventDefault()
      return false
    }
  }, { passive: false })
})

onBeforeUnmount(() => {
  window.removeEventListener('contextmenu', disableRightClick)
  window.removeEventListener('keydown', preventHorizontalScroll)
})
</script>

<style scoped>
.landing-page {
  width: 100%;
  max-width: 100vw;
  overflow-x: hidden; /* Prevent horizontal scrolling */
  position: relative;
}

/* Apply to body as well through component */
:global(body) {
  overflow-x: hidden !important;
  max-width: 100vw !important;
  position: relative !important;
}

/* Hero Section with vertical centering */
.hero-section {
  background: linear-gradient(135deg, #003366 0%, #0066CC 100%);
  color: white;
  padding: 20px;
  text-align: center;
  width: 100%;
  max-width: 100vw;
  box-sizing: border-box;
  height: 97vh !important;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  position: relative;
}

.hero-content {
  max-width: 900px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  flex: 1;
  padding: 20px;
}

.hero-section h1 {
  font-size: clamp(2em, 5vw, 3em);
  margin-bottom: 20px;
  font-weight: 700;
  line-height: 1.2;
  padding: 0 10px;
}

.hero-section p {
  font-size: clamp(1em, 2vw, 1.3em);
  margin-bottom: 30px;
  max-width: 800px;
  margin-left: auto;
  margin-right: auto;
  padding: 0 15px;
  line-height: 1.6;
}

.hero-logo {
  width: clamp(60px, 15vw, 80px);
  height: clamp(60px, 15vw, 80px);
  margin: 0 auto 30px;
  background: white;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 2em;
  font-weight: bold;
  color: #E31E24;
  box-sizing: border-box;
}

.hero-logo img {
  width: 100%;
  height: 100%;
  object-fit: contain;
  border-radius: 50%;
}

.cta-button {
  background: #E31E24;
  color: white;
  padding: clamp(12px, 3vw, 15px) clamp(30px, 5vw, 40px);
  border: none;
  border-radius: 5px;
  font-size: clamp(1em, 2vw, 1.1em);
  cursor: pointer;
  text-decoration: none;
  display: inline-block;
  transition: background 0.3s;
  font-weight: 600;
  margin-top: 10px;
}

.cta-button:hover {
  background: #c01820;
}

.features-section {
  padding: clamp(40px, 8vw, 80px) clamp(15px, 3vw, 20px);
  max-width: 1200px;
  margin: 0 auto;
  background: white;
  width: 100%;
  box-sizing: border-box;
}

.features-section h2 {
  text-align: center;
  color: #003366;
  font-size: clamp(1.8em, 4vw, 2.5em);
  margin-bottom: 20px;
  font-weight: 700;
  padding: 0 10px;
}

.features-section > p {
  text-align: center;
  color: #666;
  max-width: 800px;
  margin: 0 auto clamp(30px, 5vw, 50px);
  font-size: clamp(0.95em, 2vw, 1.1em);
  padding: 0 15px;
  line-height: 1.6;
}

.features-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: clamp(20px, 3vw, 30px);
  margin-top: clamp(30px, 5vw, 50px);
  width: 100%;
  box-sizing: border-box;
  padding: 0 clamp(10px, 2vw, 15px);
}

.feature-card {
  background: white;
  padding: clamp(20px, 3vw, 30px);
  border-radius: 10px;
  box-shadow: 0 4px 6px rgba(0,0,0,0.1);
  border-left: 4px solid #E31E24;
  transition: transform 0.3s;
  width: 100%;
  box-sizing: border-box;
  overflow-wrap: break-word;
  word-wrap: break-word;
}

.feature-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 6px 12px rgba(0,0,0,0.15);
}

.feature-icon {
  width: 60px;
  height: 60px;
  background: #0066CC;
  color: white;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.5em;
  margin-bottom: 20px;
}

.feature-card h3 {
  color: #003366;
  margin-bottom: 15px;
  font-size: clamp(1.1em, 2vw, 1.3em);
  line-height: 1.3;
  overflow-wrap: break-word;
}

.feature-card p {
  color: #666;
  line-height: 1.8;
  font-size: clamp(0.9em, 1.8vw, 1em);
  overflow-wrap: break-word;
}

/* Prevent any element from causing horizontal overflow */
* {
  max-width: 100%;
}

/* Media query for very small screens */
@media (max-width: 320px) {
  .features-grid {
    grid-template-columns: 1fr;
  }
  
  .feature-card {
    padding: 15px;
  }
}
</style>