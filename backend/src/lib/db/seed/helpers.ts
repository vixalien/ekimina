import { readFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

import type { Address } from "@ekimina/types";

import type { SeedGroup } from "./groups.js";

import { getIkiminaContract, getFactoryContract, mockERC20ABI } from "@ekimina/contracts";
import { getContract, createWalletClient, http } from "viem";
import { privateKeyToAccount } from "viem/accounts";

import { publicClient, walletClient, chain } from "../../chain.js";
import { deployGroup } from "../../create-group.js";

import { addressKey } from "./accounts.js";
import { GROUPS } from "./groups.js";

const __dirname = dirname(fileURLToPath(import.meta.url));

export const RPC_URL = process.env.RPC_URL ?? "http://127.0.0.1:8545";

export const E18 = 10n ** 18n;
export const MINT_AMOUNT = 1000n * E18;
export const APPROVE_AMOUNT = 100n * E18;
export const LOAN_AMOUNT = 20n * E18;
export const SMALL_LOAN_AMOUNT = 10n * E18;
export const LOAN_INTEREST_BPS = 500;

export const DEV_CYCLE_LENGTH = 60n;

export const DEV_CONFIG: [
  contributionAmount: bigint,
  cycleLength: bigint,
  payoutAmount: bigint,
  payoutPolicy: number,
  penaltyRateBps: number,
  approvalThresholdBps: number,
  loansEnabled: boolean,
  discretionaryEnabled: boolean,
  allMembersCommittee: boolean,
] = [
  10000000000000000000n,
  DEV_CYCLE_LENGTH,
  50000000000000000000n,
  1,
  500,
  6000,
  true,
  true,
  true,
];

export function resolveFactoryAddress(): Address {
  if (process.env.FACTORY_ADDRESS) return process.env.FACTORY_ADDRESS as Address;
  const p = resolve(__dirname, "../../../../..", "local.json");
  try {
    return JSON.parse(readFileSync(p, "utf-8")).FACTORY_ADDRESS;
  } catch {
    throw new Error(
      "FACTORY_ADDRESS not set and local.json not found. Run `pnpm dev:deploy` first.",
    );
  }
}

export function makeWallet(addr: string) {
  const pk = addressKey(addr);
  if (!pk) throw new Error(`No private key for ${addr}`);
  return createWalletClient({
    account: privateKeyToAccount(pk),
    chain,
    transport: http(RPC_URL),
  });
}

export async function deployAllGroups(factoryAddr: Address): Promise<Address[]> {
  const created: Address[] = [];
  for (const g of GROUPS) {
    const addr = await deployGroup({
      factoryAddr,
      name: g.name,
      inviteCode: g.inviteCode,
      config: DEV_CONFIG,
    });
    created.push(addr);
    console.log(`  Deployed "${g.name}" → ${addr}`);
  }
  return created;
}

export async function getTokenContract(factoryAddr: Address) {
  const factory = getFactoryContract(factoryAddr, { public: publicClient });
  const tokenAddr = await factory.read.token();
  return getContract({
    address: tokenAddr,
    abi: mockERC20ABI,
    client: { public: publicClient, wallet: walletClient },
  });
}

export function getIkimina(groupAddr: Address, wallet?: ReturnType<typeof makeWallet>) {
  return getIkiminaContract(groupAddr, {
    public: publicClient,
    ...(wallet ? { wallet } : {}),
  });
}

export async function advanceCycle(groupAddr: Address) {
  const reader = getIkimina(groupAddr);
  const ikimina = getIkimina(groupAddr, walletClient);
  const [cycleStart, config] = await Promise.all([reader.read.cycleStart(), reader.read.config()]);
  const target = Number(cycleStart + config[1]) + 1;
  try {
    // oxlint-disable-next-line typescript/no-explicit-any
    await (publicClient as any).request({
      method: "evm_setNextBlockTimestamp",
      params: [target],
    });
    // oxlint-disable-next-line typescript/no-explicit-any
    await (publicClient as any).request({ method: "evm_mine", params: [] });
  } catch {
    // fallback for non-anvil chains
    // oxlint-disable-next-line typescript/no-explicit-any
    await (publicClient as any).request({
      method: "evm_increaseTime",
      params: [Number(DEV_CYCLE_LENGTH)],
    });
    // oxlint-disable-next-line typescript/no-explicit-any
    await (publicClient as any).request({ method: "evm_mine", params: [] });
  }
  try {
    // oxlint-disable-next-line typescript/no-explicit-any
    await (ikimina as any).write.triggerPayout();
    return true;
  } catch (e) {
    console.warn(`    triggerPayout failed: ${(e as Error).message.slice(0, 120)}`);
    return false;
  }
}

export function findGroupIndex(g: SeedGroup): number {
  return GROUPS.indexOf(g);
}
