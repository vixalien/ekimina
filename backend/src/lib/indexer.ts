import { publicClient } from "./chain.js";
import { getFactoryContract, getIkiminaContract } from "@ekimina/contracts";
import { groupMeta } from "./store.js";
import type { ChainGroup as Group, GroupCycle, Address } from "@ekimina/types";

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
    const factory = getFactoryContract(factoryAddress, { public: publicClient });
    const length = await factory.read.allGroupsLength();

    for (let i = 0; i < Number(length); i++) {
      const addr = await factory.read.allGroups([BigInt(i)]) as Address;
      await refreshGroup(addr);
    }
  } catch (e) {
    console.error("[indexer] poll error:", e);
  }
  setTimeout(poll, 10000);
}

async function refreshGroup(address: Address) {
  try {
    const contract = getIkiminaContract(address, { public: publicClient });
    const config: any = await contract.read.config();

    groupCache.set(address, {
      contributionAmount: config.contributionAmount.toString() as Group["contributionAmount"],
      cycleLength: Number(config.cycleLength),
      payoutAmount: config.payoutAmount.toString() as Group["payoutAmount"],
      payoutPolicy: ["none", "rotating", "lump_sum_end"][Number(config.payoutPolicy)] as Group["payoutPolicy"],
      penaltyRateBps: Number(config.penaltyRateBps),
      approvalThresholdBps: Number(config.approvalThresholdBps),
      loansEnabled: config.loansEnabled,
      discretionaryEnabled: config.discretionaryEnabled,
      allMembersCommittee: config.allMembersCommittee,
    });

    const currentCycle = await contract.read.currentCycle() as bigint;
    const cycleStart = await contract.read.cycleStart() as bigint;
    const reserve = await contract.read.reserve() as bigint;
    const activeCount = await contract.read.activeCount() as bigint;
    const paid = await contract.read.paidCount([currentCycle]) as bigint;

    cycleCache.set(address, {
      currentCycle: Number(currentCycle),
      rotationLength: Number(activeCount),
      cycleStart: new Date(Number(cycleStart) * 1000).toISOString(),
      reserveBalance: reserve.toString() as GroupCycle["reserveBalance"],
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
