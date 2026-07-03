import { serve } from "@hono/node-server";
import { Hono } from "hono";
import { logger } from "hono/logger";
import authRoutes from "./routes/auth.js";
import profileRoutes from "./routes/profile.js";
import lookupRoutes from "./routes/lookup.js";
import indexerRoutes from "./routes/indexer.js";
import relayRoutes from "./routes/relay.js";
import { setFactoryAddress, startIndexer } from "./lib/indexer.js";

const app = new Hono();

app.use("*", logger());

app.get("/", (c) => c.json({ service: "e-Kimina API", version: "0.2.0", status: "running" }));

app.route("/", authRoutes);
app.route("/", profileRoutes);
app.route("/", lookupRoutes);
app.route("/", indexerRoutes);
app.route("/", relayRoutes);

export type AppType = typeof app;

serve({ fetch: app.fetch, port: 3000 }, () => {
  console.log("e-Kimina backend running on http://localhost:3000");

  const factoryAddress = process.env.FACTORY_ADDRESS;
  if (factoryAddress) {
    setFactoryAddress(factoryAddress as `0x${string}`);
    startIndexer().catch(console.error);
  } else {
    console.log("[bootstrap] No FACTORY_ADDRESS set. Indexer not started.");
    console.log("  Deploy the contract first:");
    console.log("    cd contract && pnpm hardhat run scripts/deploy-local.ts --network localhost");
  }
});
