import { serve } from "@hono/node-server";
import { OpenAPIHono } from "@hono/zod-openapi";
import { logger } from "hono/logger";
import authRoutes from "./routes/auth.js";
import profileRoutes from "./routes/profile.js";
import lookupRoutes from "./routes/lookup.js";
import indexerRoutes from "./routes/indexer.js";
import relayRoutes from "./routes/relay.js";
import ussdRoutes from "./routes/ussd.js";
import { setFactoryAddress, startIndexer } from "./lib/indexer.js";

const app = new OpenAPIHono();

app.use("*", logger());

app.get("/", (c) => c.json({ service: "e-Kimina API", version: "0.2.0", status: "running" }));

app.route("/", authRoutes);
app.route("/", profileRoutes);
app.route("/", lookupRoutes);
app.route("/", indexerRoutes);
app.route("/", relayRoutes);
app.route("/ussd", ussdRoutes);

app.doc("/openapi.json", {
  openapi: "3.0.0",
  info: { title: "e-Kimina API", version: "0.2.0" },
  servers: [
    { url: "http://localhost:3000", description: "Development" },
  ],
});

app.get("/scalar", (c) => {
  return c.html(`<!doctype html>
<html>
  <head>
    <title>e-Kimina API Reference</title>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
  </head>
  <body>
    <div id="app"></div>
    <script src="https://cdn.jsdelivr.net/npm/@scalar/api-reference"></script>
    <script>
      Scalar.createApiReference("#app", {
        url: "/openapi.json",
        theme: "purple",
        hideClientButton: true,
        telemetry: false,
        showDeveloperTools: "never",
      });
    </script>
  </body>
</html>`);
});

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
    console.log("    cd packages/contracts && pnpm hardhat run scripts/deploy-local.ts --network localhost");
  }
});
