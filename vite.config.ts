import { defineConfig } from "@lovable.dev/vite-tanstack-config";

export default defineConfig({
  tanstackStart: {
    server: { entry: "server" },
  },
  vite: {
    ssr: {
      optimizeDeps: {
        include: [
          "@tanstack/react-start",
          "@tanstack/start-client-core",
        ],
      },
    },
  },
});
