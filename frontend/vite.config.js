import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: true,
    port: 5173,
    strictPort: true,
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
        secure: false,
      }
    }
  },
  build: {
    // Raise warning threshold so the html2pdf library (which is huge but unavoidable) doesn't fail CI
    chunkSizeWarningLimit: 1000,
    rollupOptions: {
      output: {
        manualChunks(id) {
          // Vendor: React core — loaded first, cached forever
          if (id.includes('node_modules/react/') || id.includes('node_modules/react-dom/')) {
            return 'vendor-react';
          }
          // Vendor: Router
          if (id.includes('node_modules/react-router')) {
            return 'vendor-router';
          }
          // Vendor: Framer Motion — heavy, only needed on animated pages
          if (id.includes('node_modules/framer-motion')) {
            return 'vendor-motion';
          }
          // Vendor: Chart.js + React-Chartjs — only used in Dashboard
          if (id.includes('node_modules/chart.js') || id.includes('node_modules/react-chartjs')) {
            return 'vendor-charts';
          }
          // Vendor: html2pdf — only loaded on UserDashboard and SmartNutrition
          if (id.includes('node_modules/html2pdf') || id.includes('node_modules/jspdf') || id.includes('node_modules/html2canvas')) {
            return 'vendor-pdf';
          }
          // Vendor: lucide icons — split into its own cache bucket
          if (id.includes('node_modules/lucide-react')) {
            return 'vendor-icons';
          }
          // Vendor: everything else (axios, socket.io, etc.)
          if (id.includes('node_modules/')) {
            return 'vendor-misc';
          }
        }
      }
    }
  }
})
