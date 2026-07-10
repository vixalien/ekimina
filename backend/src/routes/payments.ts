import crypto from "crypto";

import type { Address, BaseUnit } from "@ekimina/types";

import { createRoute, OpenAPIHono, z } from "@hono/zod-openapi";

import { errorResponses, paymentIntentSchema } from "../lib/schemas.js";
import { createPaymentIntent, getPaymentIntent, updatePaymentIntent } from "../lib/store.js";

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

export default new OpenAPIHono()
  .openapi(createIntentRoute, async (c) => {
    const { amount, currency: _currency = "RWF" } = c.req.valid("json");
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
    const created = await createPaymentIntent(intent);
    return c.json(created);
  })
  .openapi(getIntentRoute, async (c) => {
    const { id } = c.req.valid("param");
    const intent = await getPaymentIntent(id);
    if (!intent) return c.json({ error: "not found" }, 404);
    return c.json(intent);
  })
  .openapi(retryIntentRoute, async (c) => {
    const { id } = c.req.valid("param");
    const intent = await getPaymentIntent(id);
    if (!intent) return c.json({ error: "not found" }, 404);
    const updated = await updatePaymentIntent(id, { status: "pending" });
    return c.json(updated);
  });
