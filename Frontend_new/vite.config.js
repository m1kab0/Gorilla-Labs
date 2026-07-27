import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['Gorilla.jpeg', 'Gorilla.jpeg'],
      manifest: {
        name: 'Gorilla — dziennik treningowy',
        short_name: 'Gorilla',
        description: 'Zliczanie serii, powtórzeń i ciężarów na siłowni',
        theme_color: '#2B2925',
        background_color: '#2B2925',
        display: 'standalone',
        start_url: '/',
        icons: [
          { src: 'Gorilla.jpeg', sizes: '192x192', type: 'image/jpeg' },
          { src: 'Gorilla.jpeg', sizes: '512x512', type: 'image/jpeg' },
          { src: 'Gorilla.jpeg', sizes: '512x512', type: 'image/jpeg', purpose: 'maskable' },
        ],
      },
      workbox: {
        navigateFallbackDenylist: [/^\/(auth|exercises|workouts|plans)\//],
      },
    }),
  ],
  server: {
    host: true,
    port: 5173,
  },
})
