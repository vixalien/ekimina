import type { Address } from "@ekimina/types";

import { createRoute, OpenAPIHono, z } from "@hono/zod-openapi";

import { addressSchema, userSchema } from "../lib/schemas.js";
import { getUserByAddress } from "../lib/store.js";

const getUserRoute = createRoute({
  method: "get",
  path: "/users/{address}",
  tags: ["Profile"],
  request: { params: z.object({ address: addressSchema }) },
  responses: {
    200: {
      content: { "application/json": { schema: userSchema } },
      description: "User found",
    },
    404: {
      content: {
        "application/json": { schema: z.object({ error: z.string() }) },
      },
      description: "Not found",
    },
  },
});

const updateMeRoute = createRoute({
  method: "patch",
  path: "/users/me",
  tags: ["Profile"],
  request: {
    body: {
      content: {
        "application/json": {
          schema: z.object({ name: z.string().optional() }),
        },
      },
    },
  },
  responses: {
    200: {
      content: {
        "application/json": { schema: z.object({ ok: z.boolean() }) },
      },
      description: "Updated",
    },
    401: {
      content: {
        "application/json": { schema: z.object({ error: z.string() }) },
      },
      description: "Unauthorized",
    },
  },
});

export default new OpenAPIHono()
  .openapi(getUserRoute, async (c) => {
    const { address } = c.req.valid("param");
    const user = await getUserByAddress(address as Address);
    if (!user) return c.json({ error: "not found" }, 404);
    return c.json(user, 200);
  })
  .openapi(updateMeRoute, async (c) => {
    const userId = c.req.header("x-user-id");
    if (!userId) return c.json({ error: "unauthorized" }, 401);
    return c.json({ ok: true }) as any;
  });
