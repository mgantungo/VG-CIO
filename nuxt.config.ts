// https://nuxt.com/docs/api/configuration/nuxt-config
import tailwindcss from '@tailwindcss/vite'
export default defineNuxtConfig({
  devtools: { enabled: true },

  modules: [
    '@pinia/nuxt'
  ],
  devServer: {
    port: parseInt(process.env.PORT || '3130')
  },

  css: [
    '@/assets/css/main.css'
  ],

  vite: {
    plugins: [tailwindcss()],
    server: {
      allowedHosts: process.env.NODE_ENV === 'production' ? [] : true
    }
  },

  runtimeConfig: {
    public: {
      apiBase:  process.env.NUXT_PUBLIC_API_BASE,
      uploadBase: process.env.NUXT_PUBLIC_UPLOAD_BASE,
      // Workflow re-order feature flags ('on' / anything else = off)
      //   workspaceShell — new navy rail menu for every role (layouts/default.vue)
      //   copyDeskV2     — Copy Desk "Day's Layout" page in the rail + as home
      //   productionGate — 'cleared' once Strapi VGAMS_PRODUCTION_GATE=cleared
      workspaceShell: process.env.NUXT_PUBLIC_WORKSPACE_SHELL || 'off',
      copyDeskV2:     process.env.NUXT_PUBLIC_COPYDESK_V2 || 'off',
      productionGate: process.env.NUXT_PUBLIC_PRODUCTION_GATE || 'paid'
    }
  },

  app: {
    head: {
      title: 'Vision Group Advertising Management System',
      meta: [
        { charset: 'utf-8' },
        { name: 'viewport', content: 'width=device-width, initial-scale=1' },
        {
          key: 'description',
          name: 'description',
          content: 'Manage advertising across Vision Group platforms'
        }
      ],
      link: [
        { rel: 'icon', type: 'image/x-icon', href: '/favicon.ico' },
        { rel: 'preconnect', href: 'https://fonts.googleapis.com' },
        { rel: 'stylesheet', href: 'https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500;600&family=IBM+Plex+Sans:wght@400;500;600;700&display=swap' }
      ]
    }
  }
})