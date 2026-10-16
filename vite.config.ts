import { defineConfig, loadEnv, type UserConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig(({ mode }) => {
  const env = { ...loadEnv(mode, process.cwd(), ["PORT", "REACT_APP"]), ...process.env };
  const port = Number(env.PORT) || 3105;
  return {
    plugins: [react()],
    optimizeDeps: { include: ["@churchapps/helpers", "react-dnd", "react-dnd-html5-backend"] },
    build: { chunkSizeWarningLimit: 2000, minify: "esbuild", sourcemap: false },
    resolve: { dedupe: ["react", "react-dom"] },
    server: { host: "0.0.0.0", port, strictPort: true, open: false },
    preview: { port, strictPort: true },
    define: {
      "process.env.REACT_APP_STAGE": JSON.stringify(env.REACT_APP_STAGE),
      "process.env.REACT_APP_API_BASE": JSON.stringify(env.REACT_APP_API_BASE),
      "process.env.REACT_APP_MESSAGING_API_SOCKET": JSON.stringify(env.REACT_APP_MESSAGING_API_SOCKET),
      "process.env.REACT_APP_CONTENT_ROOT": JSON.stringify(env.REACT_APP_CONTENT_ROOT),
      "process.env.REACT_APP_B1ADMIN_ROOT": JSON.stringify(env.REACT_APP_B1ADMIN_ROOT),
      "process.env.NEXT_PUBLIC_STAGE": JSON.stringify(env.REACT_APP_STAGE),
      "process.env.NEXT_PUBLIC_API_BASE": JSON.stringify(env.REACT_APP_API_BASE),
      "process.env.NEXT_PUBLIC_MESSAGING_API_SOCKET": JSON.stringify(env.REACT_APP_MESSAGING_API_SOCKET),
      "process.env.NEXT_PUBLIC_CONTENT_ROOT": JSON.stringify(env.REACT_APP_CONTENT_ROOT),
      "process.env.NEXT_PUBLIC_B1ADMIN_ROOT": JSON.stringify(env.REACT_APP_B1ADMIN_ROOT)
    }
  } satisfies UserConfig;
});
