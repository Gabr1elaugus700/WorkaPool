import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from "path"
// import { VitePWA } from "vite-plugin-pwa";

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    // VitePWA({
    //   registerType: "autoUpdate", // Atualiza o service worker automaticamente
    //   includeAssets: ["favicon.svg", "robots.txt", "apple-touch-icon.png"],
    //   manifest: {
    //     name: "Workapool PWA",
    //     short_name: "Workapool",
    //     description: "Aplicativo PWA do Workapool",
    //     theme_color: "#ffffff",
    //     icons: [
    //       {
    //         src: "pwa-192x192.png",
    //         sizes: "192x192",
    //         type: "image/png"
    //       },
    //       {
    //         src: "pwa-512x512.png",
    //         sizes: "512x512",
    //         type: "image/png"
    //       },
    //       {
    //         src: "pwa-512x512.png",
    //         sizes: "512x512",
    //         type: "image/png",
    //         purpose: "any maskable"
    //       }
    //     ]
    //   }
    // })
   ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  server: {
    host: true,
    port: 5858, // opcional, pode mudar a porta se quiser
    
  },
  preview: {
    port: 5858,
  }
})
