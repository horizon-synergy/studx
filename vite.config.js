import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  base:'/',
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      devOptions: {enabled: false},
      includeAssets: ['favicon.png'],
      manifest: {
        name: 'StudX | Trade. Connect. Grow.',
        short_name: 'StudX',
        description: 'Student Marketplace and campus food ordering - buy, sell, and connect with students near you.',
        theme_color: '#0f172a',
        background_color: '#ffffff',
        display: 'standalone',
        start_url: '/',
        scope: '/',
        icons: [
          {
            src: 'pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png'
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable'
          }
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,png,svg,ico,json}'],
        navigateFallbackDenylist: [/^\/api/,/^\/__/],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/(firestore|firebasestorage|identitytoolkit|securetoken)\.googleapis\.com\/.*/,
            handler: 'NetworkOnly',
          },

          {
            urlPattern: /^https:\/\/.*\.cloudfunctions\.net\/.*/,
            handler: 'NetworkOnly',
          },

          {
            urlPattern: /^https:\/\/api\.cloudinary\.com\/.*/,
            handler: 'NetworkOnly',
          },
          
        ],
      }
    })
  ],
  server: { headers: { 'Cross-Origin-Opener-Policy': 'same-origin', 'Cross-Origin-Embedder-Policy': 'unsafe-none' }},
})