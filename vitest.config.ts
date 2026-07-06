import { defineConfig, mergeConfig } from "vitest/config";

import shared from "./vitest.shared.js";

export default defineConfig(
  mergeConfig(
    shared,
    defineConfig({
      test: {
        projects: ["packages/types", "packages/contracts", "backend", "app"],
      },
    }),
  ),
);
