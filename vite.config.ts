import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import tailwindcss from '@tailwindcss/vite'

// Vercel 部署用 '/'，GitHub Pages 用 '/scrolling-games/'
const basePath = process.env.VERCEL ? '/' : (process.env.BASE_PATH || '/scrolling-games/')

export default defineConfig({
  plugins: [vue(), tailwindcss()],
  base: basePath,
})
