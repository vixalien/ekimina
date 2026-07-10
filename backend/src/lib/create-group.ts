import type { Address } from "@ekimina/types";

import { getFactoryContract, factoryABI } from "@ekimina/contracts";
import { keccak256, parseEventLogs, toHex } from "viem";

import { publicClient, walletClient } from "./chain.js";
import { upsertGroupMeta } from "./store.js";

export interface GroupDeployInput {
  factoryAddr: Address;
  name: string;
  inviteCode: string;
  creator?: Address;
  config?: [
    contributionAmount: bigint,
    cycleLength: bigint,
    payoutAmount: bigint,
    payoutPolicy: number,
    penaltyRateBps: number,
    approvalThresholdBps: number,
    loansEnabled: boolean,
    discretionaryEnabled: boolean,
    allMembersCommittee: boolean,
  ];
}

const DEFAULT_CONFIG: GroupDeployInput["config"] = [
  10000000000000000000n,
  2592000n,
  50000000000000000000n,
  1,
  500,
  6000,
  true,
  true,
  false,
];

export async function deployGroup(input: GroupDeployInput): Promise<Address> {
  const { factoryAddr, name, inviteCode, creator, config = DEFAULT_CONFIG } = input;

  const factory = getFactoryContract(factoryAddr, {
    public: publicClient,
    wallet: walletClient,
  });

  const inviteCodeHash = keccak256(toHex(inviteCode));

  // oxlint-disable-next-line typescript/no-explicit-any
  const hash = await (factory as any).write.createGroup([config, inviteCodeHash]);
  const receipt = await publicClient.waitForTransactionReceipt({ hash });

  const logs = parseEventLogs({
    abi: factoryABI,
    logs: receipt.logs,
    eventName: "GroupDeployed",
  });
  const groupAddr = logs[0]?.args.group as Address | undefined;
  if (!groupAddr) throw new Error("GroupDeployed event not found");

  await upsertGroupMeta({
    address: groupAddr,
    name,
    inviteCode,
    // oxlint-disable-next-line typescript/no-explicit-any
    creator: creator ?? ((walletClient as any).account.address as Address),
    createdAt: new Date().toISOString(),
  });

  return groupAddr;
}
