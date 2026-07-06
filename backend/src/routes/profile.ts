import { createRoute, OpenAPIHono, z } from "@hono/zod-openapi";
import { usersByAddress } from "../lib/store.js";
import { addressSchema, userSchema } from "../lib/schemas.js";

const profile = new OpenAPIHono();

const getUserRoute = createRoute({
  method: "get",
  path: "/users/{address}",
  tags: ["Profile"],
  request: { params: z.object({ address: addressSchema }) },
  responses: {
    200: { content: { "application/json": { schema: userSchema } }, description: "User found" },
    404: { content: { "application/json": { schema: z.object({ error: z.string() }) } }, description: "Not found" },
  },
});

profile.openapi(getUserRoute, async (c) => {
  const { address } = c.req.valid("param");
  const user = usersByAddress.get(address as `0x${string}`);
  if (!user) return c.json({ error: "not found" }, 404) as any;
  return c.json(user, 200) as any;
});

const updateMeRoute = createRoute({
  method: "patch",
  path: "/users/me",
  tags: ["Profile"],
  request: {
    body: { content: { "application/json": { schema: z.object({ name: z.string().optional() }) } } },
  },
  responses: {
    200: { content: { "application/json": { schema: z.object({ ok: z.boolean() }) } }, description: "Updated" },
    401: { content: { "application/json": { schema: z.object({ error: z.string() }) } }, description: "Unauthorized" },
  },
});

profile.openapi(updateMeRoute, async (c) => {
  const userId = c.req.header("x-user-id");
  if (!userId) return c.json({ error: "unauthorized" }, 401) as any;
  return c.json({ ok: true }) as any;
});

export default profile;
