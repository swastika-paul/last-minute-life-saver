import { defineConfig } from "@lovable.dev/vite-tanstack-config";

export default defineConfig({
  tanstackStart: {
    server: { entry: "server" },
  },
  vite: {
    server: {
      allowedHosts: ["last-minute-life-saver-4tl6.onrender.com"],
    },
    preview: {
      allowedHosts: ["last-minute-life-saver-4tl6.onrender.com"],
    },
  },
});