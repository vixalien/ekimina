import { publicClient } from "./chain.js";
import { factoryABI, ikiminaABI } from "@ekimina/contracts";
import { groupMeta } from "./store.js";
import type { Group, GroupCycle, Address } from "@ekimina/types";

const groupCache = new Map<Address, Group>();
const cycleCache = new Map<Address, GroupCycle>();

let factoryAddress: Address | null = null;
let isPolling = false;

export function setFactoryAddress(addr: Address) {
  factoryAddress = addr;
}

export async function startIndexer() {
  if (isPolling || !factoryAddress) return;
  isPolling = true;
  await poll();
}

async function poll() {
  if (!factoryAddress) return;
  try {
    const length = await publicClient.readContract({
      address: factoryAddress,
      abi: factoryABI,
      functionName: "allGroupsLength",
    });

    for (let i = 0; i < Number(length); i++) {
      const addr = await publicClient.readContract({
        address: factoryAddress,
        abi: factoryABI,
        functionName: "allGroups",
        args: [BigInt(i)],
      }) as Address;
      await refreshGroup(addr);
    }
  } catch (e) {
    console.error("[indexer] poll error:", e);
  }
  setTimeout(poll, 10000);
}

async function refreshGroup(address: Address) {
  try {
    const config = await publicClient.readContract({
      address,
      abi: ikiminaABI,
      functionName: "config",
    }) as any;

    groupCache.set(address, {
      contributionAmount: config.contributionAmount.toString() as any,
      cycleLength: Number(config.cycleLength),
      payoutAmount: config.payoutAmount.toString() as any,
      payoutPolicy: ["none", "rotating", "lump_sum_end"][Number(config.payoutPolicy)] as Group["payoutPolicy"],
      penaltyRateBps: Number(config.penaltyRateBps),
      approvalThresholdBps: Number(config.approvalThresholdBps),
      loansEnabled: config.loansEnabled,
      discretionaryEnabled: config.discretionaryEnabled,
      allMembersCommittee: config.allMembersCommittee,
    });

    const currentCycle = await publicClient.readContract({
      address, abi: ikiminaABI, functionName: "currentCycle",
    }) as bigint;
    const cycleStart = await publicClient.readContract({
      address, abi: ikiminaABI, functionName: "cycleStart",
    }) as bigint;
    const reserve = await publicClient.readContract({
      address, abi: ikiminaABI, functionName: "reserve",
    }) as bigint;
    const activeCount = await publicClient.readContract({
      address, abi: ikiminaABI, functionName: "activeCount",
    }) as bigint;
    const paid = await publicClient.readContract({
      address, abi: ikiminaABI, functionName: "paidCount",
      args: [currentCycle],
    }) as bigint;

    cycleCache.set(address, {
      currentCycle: Number(currentCycle),
      rotationLength: Number(activeCount),
      cycleStart: new Date(Number(cycleStart) * 1000).toISOString(),
      reserveBalance: reserve.toString() as any,
      paidCount: Number(paid),
      memberCount: Number(activeCount),
    });
  } catch (e) {
    console.error(`[indexer] refresh error for ${address}:`, e);
  }
}

export function getCachedGroup(address: Address): Group | undefined {
  return groupCache.get(address);
}

export function getCachedCycle(address: Address): GroupCycle | undefined {
  return cycleCache.get(address);
}
