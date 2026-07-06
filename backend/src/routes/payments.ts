import { createRoute, OpenAPIHono, z } from "@hono/zod-openapi";
import { errorResponses, paymentIntentSchema } from "../lib/schemas.js";
import { paymentIntents } from "../lib/store.js";
import crypto from "crypto";
import type { Address, BaseUnit } from "@ekimina/types";

const payments = new OpenAPIHono();

const createIntentRoute = createRoute({
  method: "post",
  path: "/payments/intents",
  tags: ["Payments"],
  request: {
    body: {
      content: {
        "application/json": {
          schema: z.object({
            amount: z.number(),
            currency: z.string().optional(),
          }),
        },
      },
    },
  },
  responses: {
    200: {
      content: { "application/json": { schema: paymentIntentSchema } },
      description: "Intent created",
    },
    ...errorResponses,
  },
});

payments.openapi(createIntentRoute, async (c) => {
  const { amount, currency = "RWF" } = c.req.valid("json");
  const id = crypto.randomUUID();
  const intent = {
    id,
    userAddress: "0x0000000000000000000000000000000000000000" as Address,
    groupAddress: "0x0000000000000000000000000000000000000000" as Address,
    purpose: "contribution" as const,
    amount: String(amount) as BaseUnit,
    status: "pending" as const,
    failureReason: null,
    retryable: true,
    createdAt: new Date().toISOString(),
    resultingTxId: null,
  };
  paymentIntents.set(id, intent);
  return c.json(intent);
});

const getIntentRoute = createRoute({
  method: "get",
  path: "/payments/intents/{id}",
  tags: ["Payments"],
  request: { params: z.object({ id: z.string() }) },
  responses: {
    200: {
      content: { "application/json": { schema: paymentIntentSchema } },
      description: "Intent found",
    },
    ...errorResponses,
  },
});

payments.openapi(getIntentRoute, async (c) => {
  const { id } = c.req.valid("param");
  const intent = paymentIntents.get(id);
  if (!intent) return c.json({ error: "not found" }, 404) as any;
  return c.json(intent);
});

const retryIntentRoute = createRoute({
  method: "post",
  path: "/payments/intents/{id}/retry",
  tags: ["Payments"],
  request: { params: z.object({ id: z.string() }) },
  responses: {
    200: {
      content: { "application/json": { schema: paymentIntentSchema } },
      description: "Intent retried",
    },
    ...errorResponses,
  },
});

payments.openapi(retryIntentRoute, async (c) => {
  const { id } = c.req.valid("param");
  const intent = paymentIntents.get(id);
  if (!intent) return c.json({ error: "not found" }, 404) as any;
  intent.status = "pending";
  return c.json(intent);
});

export default payments;
