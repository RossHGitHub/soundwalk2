import path from "path";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: "prompt",
      injectRegister: false,
      devOptions: {
        enabled: false,
      },
      includeAssets: ["pwa-192.png", "pwa-512.png"],
      manifest: {
        name: "Soundwalk",
        short_name: "Soundwalk",
        start_url: "/",
        scope: "/",
        display: "standalone",
        background_color: "#030712",
        theme_color: "#030712",
        icons: [
          {
            src: "pwa-192.png",
            sizes: "192x192",
            type: "image/png",
          },
          {
            src: "pwa-512.png",
            sizes: "512x512",
            type: "image/png",
          },
        ],
      },
      workbox: {
        cleanupOutdatedCaches: true,
        navigateFallbackDenylist: [/^\/api\//],
        runtimeCaching: [],
        importScripts: ["sw-push.js"],
        globPatterns: ["**/*.{js,css,ico,webmanifest}"],
      },
    }),
  ],
  resolve: {
    alias: { "@": path.resolve(__dirname, "./src") },
  },
  server: {
    proxy: {
      "/api": "http://localhost:3001"
    }
  }
});
