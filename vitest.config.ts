import { defineConfig } from "vitest/config"

export default defineConfig({
  test: {
    globals: true,
    environment: "node",
    setupFiles: ["./server/test-setup.ts"],
    fileParallelism: false,
  },
})
