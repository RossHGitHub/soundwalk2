import path from "path"
import react from "@vitejs/plugin-react"
import { defineConfig } from "vite"
// If you want to use Tailwind, make sure you have a postcss.config.js with tailwindcss plugin

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
})