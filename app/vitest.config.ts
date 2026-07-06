import { resolve } from "node:path";

import { defineProject } from "vitest/config";

export default defineProject({
  resolve: {
    alias: {
      "@": resolve(__dirname, "./src"),
      "@/assets": resolve(__dirname, "./assets"),
    },
  },
  test: {
    environment: "node",
    include: ["src/stores/**/*.test.ts"],
  },
});
