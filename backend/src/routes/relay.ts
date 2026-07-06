import { createRoute, OpenAPIHono, z } from "@hono/zod-openapi";
import { walletClient, publicClient } from "../lib/chain.js";
import { getIkiminaContract } from "@ekimina/contracts";
import { addressSchema, errorResponses } from "../lib/schemas.js";

const relay = new OpenAPIHono();

const contributeRoute = createRoute({
  method: "post",
  path: "/relay/groups/{group}/contribute",
  tags: ["Relay"],
  request: { params: z.object({ group: addressSchema }) },
  responses: {
    200: { content: { "application/json": { schema: z.object({ txId: z.string() }) } }, description: "Contribution submitted" },
    ...errorResponses,
  },
});

relay.openapi(contributeRoute, async (c) => {
  const { group } = c.req.valid("param");
  const contract = getIkiminaContract(group as `0x${string}`, { public: publicClient, wallet: walletClient });
  const hash = await (contract as any).write.contribute();
  const receipt = await publicClient.waitForTransactionReceipt({ hash });
  return c.json({ txId: receipt.transactionHash });
});

const joinRoute = createRoute({
  method: "post",
  path: "/relay/groups/{group}/join",
  tags: ["Relay"],
  request: {
    params: z.object({ group: addressSchema }),
    body: { content: { "application/json": { schema: z.object({ code: z.string() }) } } },
  },
  responses: {
    200: { content: { "application/json": { schema: z.object({ txId: z.string() }) } }, description: "Joined group" },
    ...errorResponses,
  },
});

relay.openapi(joinRoute, async (c) => {
  const { group } = c.req.valid("param");
  const { code } = c.req.valid("json");
  const contract = getIkiminaContract(group as `0x${string}`, { public: publicClient, wallet: walletClient });
  const hash = await (contract as any).write.join([code]);
  const receipt = await publicClient.waitForTransactionReceipt({ hash });
  return c.json({ txId: receipt.transactionHash });
});

const triggerPayoutRoute = createRoute({
  method: "post",
  path: "/relay/groups/{group}/trigger-payout",
  tags: ["Relay"],
  request: { params: z.object({ group: addressSchema }) },
  responses: {
    200: { content: { "application/json": { schema: z.object({ txId: z.string() }) } }, description: "Payout triggered" },
    ...errorResponses,
  },
});

relay.openapi(triggerPayoutRoute, async (c) => {
  const { group } = c.req.valid("param");
  const contract = getIkiminaContract(group as `0x${string}`, { public: publicClient, wallet: walletClient });
  const hash = await (contract as any).write.triggerPayout();
  const receipt = await publicClient.waitForTransactionReceipt({ hash });
  return c.json({ txId: receipt.transactionHash });
});

export default relay;
