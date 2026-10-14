import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

// The backend has no CORS middleware, so in development the browser talks to
// Vite only and Vite forwards /api/* to Express. The auth cookie therefore
// stays same-origin and no backend change is needed.
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  const target = env.DEV_PROXY_TARGET || "http://localhost:5110";

  return {
    plugins: [react(), tailwindcss()],
    // Required by @excalidraw/excalidraw when bundled with Vite.
    define: { "process.env.IS_PREACT": JSON.stringify("false") },
    build: {
      // Excalidraw (~1 MB) and BlockNote are lazy-loaded route chunks; the
      // initial bundle stays ~210 kB gzip, so the default 500 kB warning is noise.
      chunkSizeWarningLimit: 2000,
    },
    server: {
      port: 5173,
      proxy: {
        "/api": {
          target,
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/api/, ""),
        },
      },
    },
    preview: {
      proxy: {
        "/api": {
          target,
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/api/, ""),
        },
      },
    },
  };
});
