import { defineProject } from "vitest/config";

export default defineProject({
  test: {
    name: "backend",
    environment: "node",
    setupFiles: ["./src/__tests__/setup.ts"],
  },
});
