import { createRoute, OpenAPIHono, z } from "@hono/zod-openapi";
import { publicClient } from "../lib/chain.js";
import { getIkiminaContract } from "@ekimina/contracts";
import { getCachedGroup, getCachedCycle } from "../lib/indexer.js";
import { groupMeta } from "../lib/store.js";
import {
  addressSchema,
  errorResponses,
  groupMetaSchema,
  groupConfigSchema,
  groupCycleSchema,
  memberSchema,
} from "../lib/schemas.js";
import type { Address } from "@ekimina/types";

const indexer = new OpenAPIHono();

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

indexer.openapi(myGroupsRoute, async (c) => {
  const metas = Array.from(groupMeta.values());
  return c.json(metas);
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

indexer.openapi(getGroupRoute, async (c) => {
  const { group } = c.req.valid("param");
  const groupAddr = group as Address;
  const cached = getCachedGroup(groupAddr);
  if (cached) return c.json(cached);

  const contract = getIkiminaContract(groupAddr, { public: publicClient });
  const config = (await contract.read.config()) as any;

  return c.json({
    contributionAmount: config.contributionAmount.toString(),
    cycleLength: Number(config.cycleLength),
    payoutAmount: config.payoutAmount.toString(),
    payoutPolicy: ["none", "rotating", "lump_sum_end"][
      Number(config.payoutPolicy)
    ] as "none" | "rotating" | "lump_sum_end",
    penaltyRateBps: Number(config.penaltyRateBps),
    approvalThresholdBps: Number(config.approvalThresholdBps),
    loansEnabled: config.loansEnabled,
    discretionaryEnabled: config.discretionaryEnabled,
    allMembersCommittee: config.allMembersCommittee,
  } as any);
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

indexer.openapi(getCycleRoute, async (c) => {
  const { group } = c.req.valid("param");
  const groupAddr = group as Address;
  const cached = getCachedCycle(groupAddr);
  if (cached) return c.json(cached);

  const contract = getIkiminaContract(groupAddr, { public: publicClient });
  const currentCycle = (await contract.read.currentCycle()) as bigint;
  const cycleStart = (await contract.read.cycleStart()) as bigint;

  return c.json({
    currentCycle: Number(currentCycle),
    rotationLength: 0,
    cycleStart: new Date(Number(cycleStart) * 1000).toISOString(),
    reserveBalance: "0",
    paidCount: 0,
    memberCount: 0,
  });
});

const getMembersRoute = createRoute({
  method: "get",
  path: "/groups/{group}/members",
  tags: ["Indexer"],
  request: { params: z.object({ group: addressSchema }) },
  responses: {
    200: {
      content: { "application/json": { schema: z.array(memberSchema) } },
      description: "Member list",
    },
    ...errorResponses,
  },
});

indexer.openapi(getMembersRoute, async (c) => {
  const { group } = c.req.valid("param");
  const groupAddr = group as Address;
  const contract = getIkiminaContract(groupAddr, { public: publicClient });
  const members = (await contract.read.memberList()) as readonly Address[];

  const result = [];
  for (const addr of members) {
    const active = (await contract.read.isActive([addr])) as boolean;
    if (!active) continue;

    const isCommittee = (await contract.read.isCommittee([addr])) as boolean;
    const joined = (await contract.read.joinedCycle([addr])) as bigint;

    result.push({
      address: addr,
      isCommitteeMember: isCommittee,
      joinedCycle: Number(joined),
      active: true,
    });
  }
  return c.json(result);
});

export default indexer;
