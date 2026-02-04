import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'path'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      // Mock Next.js navigation imports that nextstepjs might try to access
      'next/navigation': path.resolve(__dirname, './src/mocks/next-navigation.ts'),
    },
  },
})
