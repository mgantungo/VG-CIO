// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  devtools: { enabled: true },
  
  modules: [
    '@pinia/nuxt'
  ],

  css: [
    '@/assets/css/main.css'
  ],

  runtimeConfig: {
    public: {
      apiBase:  process.env.NUXT_PUBLIC_API_BASE,
      uploadBase: process.env.NUXT_PUBLIC_UPLOAD_BASE
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
        { rel: 'icon', type: 'image/x-icon', href: '/favicon.ico' }
      ]
    }
  }
})