import path from "node:path"
import { defineConfig } from "vitest/config"

export default defineConfig({
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./test/setup.ts"],
    include: ["**/*.test.ts", "**/*.test.tsx"],
    exclude: ["node_modules/**", ".next/**"],
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./"),
      // `server-only` throws by design when it is imported outside a server
      // bundle. Vitest is neither, so it gets a no-op stand-in.
      "server-only": path.resolve(__dirname, "./test/stubs/server-only.ts"),
    },
  },
})
