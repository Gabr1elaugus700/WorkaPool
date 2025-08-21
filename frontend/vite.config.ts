import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from "path"

// https://vite.dev/config/
export default defineConfig(({ mode }) => {

  const port = mode === 'development' ? 5858 : 5173
  return {
    plugins: [react()],
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
  },
  server: {
    host: true,
    port: port,
    strictPort: true,
    hmr: {
      port: port
    },
    allowedHosts: ['pooltecnica.no-ip.biz'],
  },
  build: {
    outDir: 'dist',
  }
}})

