import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { resolve } from 'path'

// https://vite.dev/config/
export default defineConfig({
  plugins: [vue()],
  build: {
      manifest: true,
      outDir: '../static',
      rollupOptions: {
        input: {
            main: resolve(__dirname, 'src/main.ts')
        }
      }
  }
})
