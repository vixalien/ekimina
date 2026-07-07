import { defineConfig } from "tsdown";

export default defineConfig({
  deps: {
    alwaysBundle: ["@ekimina/contracts"],
  },
  dts: false,
});
