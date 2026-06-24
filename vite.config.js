import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";

// PWA offline-first: o app de campo funciona sem sinal no imóvel e
// sincroniza quando a conexão volta (fila em IndexedDB — ver src/lib/sync.js)
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: ["favicon.ico"],
      manifest: {
        name: "Vistoria Acontece",
        short_name: "Vistorias",
        description: "Vistoria de imóveis — Acontece",
        theme_color: "#2B5C2B",
        background_color: "#1E401E",
        display: "standalone",
        orientation: "portrait",
        icons: [
          { src: "icon-192.png", sizes: "192x192", type: "image/png" },
          { src: "icon-512.png", sizes: "512x512", type: "image/png" }
        ]
      },
      workbox: {
        // cacheia o app shell; fotos/dados ficam na fila offline da app
        globPatterns: ["**/*.{js,css,html,ico,png,svg,woff2}"],
        runtimeCaching: [{
          urlPattern: ({ url }) => url.pathname.startsWith("/rest/") || url.pathname.startsWith("/storage/"),
          handler: "NetworkFirst",
          options: { cacheName: "supabase", networkTimeoutSeconds: 5 }
        }]
      }
    })
  ]
});
