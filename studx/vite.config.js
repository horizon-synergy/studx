import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  base: '/',
  plugins: [react(), tailwindcss()],
  server: {
    headers: {
      'Cross-Origin-Opener-Policy':   'same-origin-allow-popups',
      'Cross-Origin-Embedder-Policy': 'unsafe-none',
    },
  },
})
