import { serve } from "@hono/node-server";
import { Hono } from "hono";
import { logger } from "hono/logger";
import { prettyJSON } from "hono/pretty-json";
import members from "./routes/members.js";
import groups from "./routes/groups.js";
import ussd from "./routes/ussd.js";

const app = new Hono();

app.use("*", logger());
app.use("*", prettyJSON());

app.get("/", (c) =>
  c.json({
    service: "e-Kimina API",
    version: "0.1.0",
    status: "running",
  }),
);

app.route("/members", members);
app.route("/groups", groups);
app.route("/ussd", ussd);

serve({ fetch: app.fetch, port: 3000 }, () => {
  console.log("e-Kimina backend running on http://localhost:3000");
});
