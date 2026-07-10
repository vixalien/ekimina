import { readFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

import type { Address } from "@ekimina/types";

import type { SeedGroup } from "./groups.js";

import {
  getFactoryContract,
  getIkiminaContract,
  ikiminaABI,
  mockERC20ABI,
} from "@ekimina/contracts";
import { parseEventLogs, getContract, createWalletClient, http } from "viem";
import { privateKeyToAccount } from "viem/accounts";

import { publicClient, walletClient, chain } from "../../chain.js";
import { deployGroup } from "../../create-group.js";
// oxlint-disable-next-line no-restricted-imports
import { db } from "../index.js";
// oxlint-disable-next-line no-restricted-imports
import { users } from "../schema.js";

import { ACCOUNTS, addressKey } from "./accounts.js";
import { GROUPS } from "./groups.js";

const __dirname = dirname(fileURLToPath(import.meta.url));

function resolveFactoryAddress(): Address {
  if (process.env.FACTORY_ADDRESS) return process.env.FACTORY_ADDRESS as Address;
  const root = resolve(__dirname, "../../../../..");
  const candidates = [resolve(root, "local.json"), resolve(root, "packages/contracts/local.json")];
  for (const p of candidates) {
    try {
      return JSON.parse(readFileSync(p, "utf-8")).FACTORY_ADDRESS;
    } catch {}
  }
  throw new Error("FACTORY_ADDRESS not set and local.json not found. Run `pnpm dev:deploy` first.");
}

const RPC_URL = process.env.RPC_URL ?? "http://127.0.0.1:8545";

const E18 = 10n ** 18n;
const MINT_AMOUNT = 1000n * E18;
const APPROVE_AMOUNT = 100n * E18;
const LOAN_AMOUNT = 20n * E18;
const LOAN_INTEREST_BPS = 500;

function makeWallet(addr: string) {
  const pk = addressKey(addr);
  if (!pk) throw new Error(`No private key for ${addr}`);
  return createWalletClient({
    account: privateKeyToAccount(pk),
    chain,
    transport: http(RPC_URL),
  });
}

async function seedUsers() {
  const now = new Date().toISOString();
  for (const { name, phone, address } of ACCOUNTS) {
    await db
      .insert(users)
      .values({
        id: `seed-${address}`,
        address,
        name,
        phone,
        custodial: false,
        notificationsEnabled: true,
        createdAt: now,
      })
      .onConflictDoNothing({ target: users.address });
  }
  console.log(`  ${ACCOUNTS.length} users seeded`);
}

async function deployAllGroups(factoryAddr: Address): Promise<Address[]> {
  const created: Address[] = [];
  for (const g of GROUPS) {
    const addr = await deployGroup({ factoryAddr, name: g.name, inviteCode: g.inviteCode });
    created.push(addr);
    console.log(`  Deployed "${g.name}" → ${addr}`);
  }
  return created;
}

async function populateGroup(
  g: SeedGroup,
  groupAddr: Address,
  adminToken: ReturnType<typeof getContract>,
) {
  const reader = getIkiminaContract(groupAddr, { public: publicClient });

  for (const addr of g.memberAddresses) {
    const pk = addressKey(addr);
    if (!pk) continue;

    const userWallet = makeWallet(addr);
    const userToken = getContract({
      address: adminToken.address,
      abi: mockERC20ABI,
      client: { public: publicClient, wallet: userWallet },
    });
    const ikimina = getIkiminaContract(groupAddr, {
      public: publicClient,
      wallet: userWallet,
    });

    // oxlint-disable-next-line typescript/no-explicit-any
    await (adminToken as any).write.mint([addr, MINT_AMOUNT]);
    // oxlint-disable-next-line typescript/no-explicit-any
    await (userToken as any).write.approve([groupAddr, APPROVE_AMOUNT]);

    const alreadyMember = await reader.read.isMember([addr as Address]);
    if (!alreadyMember) {
      // oxlint-disable-next-line typescript/no-explicit-any
      await (ikimina as any).write.join([g.inviteCode]);
    }

    // oxlint-disable-next-line typescript/no-explicit-any
    await (ikimina as any).write.contribute();
  }
}

async function createSampleLoan(g: SeedGroup, groupAddr: Address) {
  const borrower = g.memberAddresses[g.memberAddresses.length - 1] as Address;
  const adminIkimina = getIkiminaContract(groupAddr, {
    public: publicClient,
    wallet: walletClient,
  });

  const curCycle = await adminIkimina.read.currentCycle();

  // oxlint-disable-next-line typescript/no-explicit-any
  const hash = await (adminIkimina as any).write.proposeLoan([
    borrower,
    LOAN_AMOUNT,
    LOAN_INTEREST_BPS,
    curCycle + 3n,
  ]);

  const receipt = await publicClient.waitForTransactionReceipt({ hash });
  const logs = parseEventLogs({
    abi: ikiminaABI,
    logs: receipt.logs,
    eventName: "ProposalCreated",
  });
  const proposalId = logs[0]?.args.id;
  if (proposalId) {
    // oxlint-disable-next-line typescript/no-explicit-any
    await (adminIkimina as any).write.approveProposal([proposalId]);
    console.log(`  Loan of ${Number(LOAN_AMOUNT) / 1e18} tokens → ${borrower.slice(0, 6)}`);
  }
}

async function populateDemoData(factoryAddr: Address, created: Address[]) {
  const chainId = await publicClient.getChainId();
  if (chainId !== 31337) {
    console.log("  Skipping (not anvil)");
    return;
  }

  const factory = getFactoryContract(factoryAddr, { public: publicClient });
  const tokenAddr = await factory.read.token();
  const adminToken = getContract({
    address: tokenAddr,
    abi: mockERC20ABI,
    client: { public: publicClient, wallet: walletClient },
  });

  for (let i = 0; i < GROUPS.length; i++) {
    const g = GROUPS[i];
    const groupAddr = created[i];
    console.log(`  Populating "${g.name}"...`);
    await populateGroup(g, groupAddr, adminToken);
    if (i === 0) await createSampleLoan(g, groupAddr);
  }
}

async function seed() {
  const factoryAddr = resolveFactoryAddress();
  console.log(`Factory: ${factoryAddr}`);

  console.log("Seeding users...");
  await seedUsers();

  console.log("Deploying groups...");
  const created = await deployAllGroups(factoryAddr);

  console.log("Populating demo data...");
  try {
    await populateDemoData(factoryAddr, created);
    console.log("  Demo data complete");
  } catch (err) {
    console.log("  Demo data skipped");
    console.error(err);
  }

  console.log("Seed complete");
}

seed()
  .catch(console.error)
  .finally(() => process.exit(0));
