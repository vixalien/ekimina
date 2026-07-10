import type { Address } from "@ekimina/types";

import { createRoute, OpenAPIHono, z } from "@hono/zod-openapi";
import { verify } from "hono/jwt";

import { addressSchema, errorResponses, userSchema } from "../lib/schemas.js";
import { JWT_SECRET, getUserByAddress, updateUser } from "../lib/store.js";

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
    ...errorResponses,
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
    const authHeader = c.req.header("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return c.json({ error: "unauthorized" }, 401) as never;
    }
    let userId: string;
    try {
      const payload = await verify(authHeader.slice(7), JWT_SECRET, "HS256");
      userId = payload.sub as string;
    } catch {
      return c.json({ error: "unauthorized" }, 401) as never;
    }
    const { name } = c.req.valid("json");
    await updateUser(userId, { name: name ?? null });
    return c.json({ ok: true });
  });
