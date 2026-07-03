import { Hono } from "hono";
import { publicClient } from "../lib/chain.js";
import { ikiminaABI } from "@ekimina/contracts";
import { getCachedGroup, getCachedCycle } from "../lib/indexer.js";
import { groupMeta } from "../lib/store.js";

const indexer = new Hono();

indexer.get("/users/:address/groups", async (c) => {
  const metas = Array.from(groupMeta.values());
  return c.json(metas);
});

indexer.get("/groups/:group", async (c) => {
  const group = c.req.param("group") as `0x${string}`;
  const cached = getCachedGroup(group);
  if (cached) return c.json(cached);

  const config = await publicClient.readContract({
    address: group,
    abi: ikiminaABI,
    functionName: "config",
  }) as any;
  return c.json({
    contributionAmount: config.contributionAmount.toString(),
    cycleLength: Number(config.cycleLength),
    payoutAmount: config.payoutAmount.toString(),
    payoutPolicy: ["none", "rotating", "lump_sum_end"][Number(config.payoutPolicy)],
    penaltyRateBps: Number(config.penaltyRateBps),
    approvalThresholdBps: Number(config.approvalThresholdBps),
    loansEnabled: config.loansEnabled,
    discretionaryEnabled: config.discretionaryEnabled,
    allMembersCommittee: config.allMembersCommittee,
  } as any);
});

indexer.get("/groups/:group/cycle", async (c) => {
  const group = c.req.param("group") as `0x${string}`;
  const cached = getCachedCycle(group);
  if (cached) return c.json(cached);

  const currentCycle = await publicClient.readContract({
    address: group, abi: ikiminaABI, functionName: "currentCycle",
  }) as bigint;
  const cycleStart = await publicClient.readContract({
    address: group, abi: ikiminaABI, functionName: "cycleStart",
  }) as bigint;
  return c.json({
    currentCycle: Number(currentCycle),
    rotationLength: 0,
    cycleStart: new Date(Number(cycleStart) * 1000).toISOString(),
    reserveBalance: "0",
    paidCount: 0,
    memberCount: 0,
  } as any);
});

indexer.get("/groups/:group/members", async (c) => {
  const group = c.req.param("group") as `0x${string}`;
  const members = await publicClient.readContract({
    address: group,
    abi: ikiminaABI,
    functionName: "memberList",
  }) as readonly `0x${string}`[];

  const result = [];
  for (const addr of members) {
    const active = await publicClient.readContract({
      address: group, abi: ikiminaABI, functionName: "isActive", args: [addr],
    }) as boolean;
    const joined = await publicClient.readContract({
      address: group, abi: ikiminaABI, functionName: "joinedCycle", args: [addr],
    }) as bigint;

    if (active) {
      const isCommittee = await publicClient.readContract({
        address: group, abi: ikiminaABI, functionName: "isCommittee", args: [addr],
      }) as boolean;

      result.push({
        address: addr,
        isCommitteeMember: isCommittee,
        joinedCycle: Number(joined),
        active: true,
      });
    }
  }
  return c.json(result);
});

export default indexer;
