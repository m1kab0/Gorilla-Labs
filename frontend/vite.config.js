import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon-32.png', 'favicon-96.png', 'apple-touch-icon.png'],
      manifest: {
        name: 'Gorilla — dziennik treningowy',
        short_name: 'Gorilla',
        description: 'Zliczanie serii, powtórzeń i ciężarów na siłowni',
        theme_color: '#1A1C1E',
        background_color: '#1A1C1E',
        display: 'standalone',
        start_url: '/',
        icons: [
          { src: 'icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icon-512.png', sizes: '512x512', type: 'image/png' },
          { src: 'icon-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
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
