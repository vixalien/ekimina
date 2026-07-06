import type { Address } from "@ekimina/types";

import { serve } from "@hono/node-server";
import { OpenAPIHono } from "@hono/zod-openapi";
import { logger } from "hono/logger";

import { setFactoryAddress, startIndexer } from "./lib/indexer.js";
import authRoutes from "./routes/auth.js";
import groupsRoutes from "./routes/groups.js";
import indexerRoutes from "./routes/indexer.js";
import lookupRoutes from "./routes/lookup.js";
import mutationsRoutes from "./routes/mutations.js";
import paymentsRoutes from "./routes/payments.js";
import profileRoutes from "./routes/profile.js";
import relayRoutes from "./routes/relay.js";
import ussdRoutes from "./routes/ussd.js";

const app = new OpenAPIHono();

app.use("*", logger());

app.doc("/openapi.json", {
  openapi: "3.0.0",
  info: { title: "e-Kimina API", version: "0.2.0" },
  servers: [{ url: "http://localhost:3000", description: "Development" }],
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
        agent: {
          disabled: true,
        },
        mcp: {
          disabled: true,
        },
        url: "./openapi.json",
        persistAuth: true,
        withDefaultFonts: false,
        servers: [
          {
            url: "http://localhost:{port}",
            description: "Development",
            variables: {
              port: {
                default: "3000",
              },
            },
          },
          {
            url: "{customUrl}",
            description: "Custom",
            variables: {
              customUrl: {
                default: "http://localhost:3000",
              },
            },
          },
        ],
        hideClientButton: true,
        expandAllModelSections: true,
        telemetry: false,
        showDeveloperTools: "never",
        // defaultOpenAllTags: true,
      });
    </script>
  </body>
</html>`);
});

const routes = app
  .get("/", (c) => c.json({ service: "e-Kimina API", version: "0.2.0", status: "running" }))
  .route("/", authRoutes)
  .route("/", profileRoutes)
  .route("/", lookupRoutes)
  .route("/", groupsRoutes)
  .route("/", indexerRoutes)
  .route("/", relayRoutes)
  .route("/ussd", ussdRoutes)
  .route("/", mutationsRoutes)
  .route("/", paymentsRoutes);

export type AppType = typeof routes;

serve({ fetch: app.fetch, port: 3000 }, async () => {
  console.log("e-Kimina backend running on http://localhost:3000");
  console.log("API Reference available at http://localhost:3000/scalar");

  let FACTORY_ADDRESS: Address = process.env.FACTORY_ADDRESS as Address;
  if (FACTORY_ADDRESS) {
    setFactoryAddress(FACTORY_ADDRESS);
    startIndexer().catch(console.error);
  } else {
    console.log("[bootstrap] No FACTORY_ADDRESS env var. Using local.json.");

    const mod = await import("../../local.json");
    FACTORY_ADDRESS = mod.default.FACTORY_ADDRESS as Address;

    const tryRead = () => {
      try {
        setFactoryAddress(FACTORY_ADDRESS);
        startIndexer().catch(console.error);
        console.log(`[bootstrap] Indexer started with factory: ${FACTORY_ADDRESS}`);
        return true;
      } catch (error) {
        console.error("here", error);
        return false;
      }
    };

    if (!tryRead()) {
      const interval = setInterval(() => {
        if (tryRead()) clearInterval(interval);
      }, 2000);
    }
  }
});
