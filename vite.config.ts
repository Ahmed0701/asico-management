import { defineConfig, loadEnv } from "vite"
import react from "@vitejs/plugin-react"
import tailwindcss from "@tailwindcss/vite"
import path from "node:path"
import type { ProxyOptions } from "vite"

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "")
  const apiTarget = env.DEV_API_PROXY_TARGET || "http://localhost:8080"

  const apiProxy: Record<string, ProxyOptions> = {
    "/api": {
      target: apiTarget,
      changeOrigin: true,
      cookieDomainRewrite: false,
    },
  }

  const allowedHosts = [".trycloudflare.com"]

  return {
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
    },
    server: {
      allowedHosts,
      proxy: apiProxy,
    },
    preview: {
      allowedHosts,
      proxy: apiProxy,
    },
  }
})
