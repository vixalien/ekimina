import type { Address } from "@ekimina/types";

import { getIkiminaContract } from "@ekimina/contracts";
import { createRoute, OpenAPIHono, z } from "@hono/zod-openapi";

import { publicClient } from "../lib/chain.js";
import { getCachedGroup, getCachedCycle } from "../lib/indexer.js";
import {
  addressSchema,
  errorResponses,
  groupMetaSchema,
  groupConfigSchema,
  groupCycleSchema,
} from "../lib/schemas.js";
import { getAllGroupMeta } from "../lib/store.js";

const myGroupsRoute = createRoute({
  method: "get",
  path: "/users/{address}/groups",
  tags: ["Indexer"],
  request: { params: z.object({ address: addressSchema }) },
  responses: {
    200: {
      content: { "application/json": { schema: z.array(groupMetaSchema) } },
      description: "User's groups",
    },
    ...errorResponses,
  },
});

const getGroupRoute = createRoute({
  method: "get",
  path: "/groups/{group}",
  tags: ["Indexer"],
  request: { params: z.object({ group: addressSchema }) },
  responses: {
    200: {
      content: { "application/json": { schema: groupConfigSchema } },
      description: "Group config",
    },
    ...errorResponses,
  },
});

const getCycleRoute = createRoute({
  method: "get",
  path: "/groups/{group}/cycle",
  tags: ["Indexer"],
  request: { params: z.object({ group: addressSchema }) },
  responses: {
    200: {
      content: { "application/json": { schema: groupCycleSchema } },
      description: "Cycle state",
    },
    ...errorResponses,
  },
});

export default new OpenAPIHono()
  .openapi(myGroupsRoute, async (c) => {
    const metas = await getAllGroupMeta();
    return c.json(metas);
  })
  .openapi(getGroupRoute, async (c) => {
    const { group } = c.req.valid("param");
    const groupAddr = group as Address;
    const cached = getCachedGroup(groupAddr);
    if (cached) return c.json(cached);

    const contract = getIkiminaContract(groupAddr, { public: publicClient });
    const [
      contributionAmount,
      cycleLength,
      payoutAmount,
      payoutPolicy,
      penaltyRateBps,
      approvalThresholdBps,
      loansEnabled,
      discretionaryEnabled,
      allMembersCommittee,
    ] = await contract.read.config();

    return c.json({
      contributionAmount: contributionAmount.toString(),
      cycleLength: Number(cycleLength),
      payoutAmount: payoutAmount.toString(),
      payoutPolicy: ["none", "rotating", "lump_sum_end"][payoutPolicy] as
        | "none"
        | "rotating"
        | "lump_sum_end",
      penaltyRateBps,
      approvalThresholdBps,
      loansEnabled,
      discretionaryEnabled,
      allMembersCommittee,
    });
  })
  .openapi(getCycleRoute, async (c) => {
    const { group } = c.req.valid("param");
    const groupAddr = group as Address;
    const cached = getCachedCycle(groupAddr);
    if (cached) return c.json(cached);

    const contract = getIkiminaContract(groupAddr, { public: publicClient });
    const [currentCycle, cycleStart, activeCount] = await Promise.all([
      contract.read.currentCycle(),
      contract.read.cycleStart(),
      contract.read.activeCount(),
    ]);

    return c.json({
      currentCycle: Number(currentCycle),
      rotationLength: 0,
      cycleStart: new Date(Number(cycleStart) * 1000).toISOString(),
      reserveBalance: "0",
      paidCount: 0,
      memberCount: Number(activeCount),
    });
  });
