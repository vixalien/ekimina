import { createRoute, OpenAPIHono, z } from "@hono/zod-openapi";
import { usersByAddress, groupMeta } from "../lib/store.js";
import {
  addressSchema,
  groupMetaSchema,
  lookupNamesResultSchema,
} from "../lib/schemas.js";
import type { Address } from "@ekimina/types";

const lookup = new OpenAPIHono();

const resolveNamesRoute = createRoute({
  method: "post",
  path: "/lookup/names",
  tags: ["Lookup"],
  request: {
    body: {
      content: {
        "application/json": {
          schema: z.object({ addresses: z.array(addressSchema) }),
        },
      },
    },
  },
  responses: {
    200: {
      content: { "application/json": { schema: lookupNamesResultSchema } },
      description: "Name resolution",
    },
  },
});

lookup.openapi(resolveNamesRoute, async (c) => {
  const { addresses } = c.req.valid("json");
  const result: Record<string, string | null> = {};
  for (const addr of addresses) {
    const user = usersByAddress.get(addr as Address);
    result[addr] = user?.name ?? addr.slice(0, 6);
  }
  return c.json(result);
});

const groupByInviteRoute = createRoute({
  method: "get",
  path: "/groups/by-invite/{code}",
  tags: ["Lookup"],
  request: { params: z.object({ code: z.string() }) },
  responses: {
    200: {
      content: { "application/json": { schema: groupMetaSchema } },
      description: "Group found",
    },
    404: {
      content: {
        "application/json": { schema: z.object({ error: z.string() }) },
      },
      description: "Not found",
    },
  },
});

lookup.openapi(groupByInviteRoute, async (c) => {
  const { code } = c.req.valid("param");
  const meta = Array.from(groupMeta.values()).find(
    (g) => g.inviteCode === code,
  );
  if (!meta) return c.json({ error: "not found" }, 404) as any;
  return c.json(meta, 200) as any;
});

export default lookup;
