import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      'dotenv': path.resolve(__dirname, 'src/shims/empty.ts'),
      'dotenv/config': path.resolve(__dirname, 'src/shims/empty.ts'),
    },
  },
  optimizeDeps: {
    exclude: ['dotenv', 'dotenv/config'],
  },
})
