import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/beacons': 'http://localhost:3011',
      '/history': 'http://localhost:3011',
      '/socket.io': {
        target: 'http://localhost:3011',
        ws: true
      }
    }
  },
  build: {
    outDir: process.env.VITE_BUILD_OUT_DIR || '../nodeapp/public',
    emptyOutDir: true,
  }
})
