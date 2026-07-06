import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    coverage: {
      provider: "v8",
      include: [
        "packages/types/src/**",
        "packages/contracts/src/**",
        "backend/src/**",
        "app/src/stores/**",
        "app/src/lib/**",
      ],
    },
  },
});
