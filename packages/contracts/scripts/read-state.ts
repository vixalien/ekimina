/**
 * read-state.ts
 * Reads live on-chain state from the deployed Ikimina contract on Celo Sepolia.
 * Run with: pnpm hardhat run scripts/read-state.ts --network celoSepolia
 */

import { createPublicClient, http, formatUnits, parseAbiItem } from "viem";

// ── Config ─────────────────────────────────────────────────────────────────

const CONTRACT_ADDRESS = "0xf19Ac821098228064d81fe3Bd09e30fa132Ea803" as const;
const EXPLORER = "https://celo-sepolia.blockscout.com";

const celoSepolia = {
  id: 11142220,
  name: "Celo Sepolia",
  nativeCurrency: { name: "CELO", symbol: "CELO", decimals: 18 },
  rpcUrls: { default: { http: ["https://forno.celo-sepolia.celo-testnet.org/"] } },
} as const;

const client = createPublicClient({
  chain: celoSepolia,
  transport: http(),
});

// ── Minimal ABI ────────────────────────────────────────────────────────────

const abi = [
  {
    name: "admin",
    type: "function",
    stateMutability: "view",
    inputs: [],
    outputs: [{ type: "address" }],
  },
  {
    name: "currentRound",
    type: "function",
    stateMutability: "view",
    inputs: [],
    outputs: [{ type: "uint256" }],
  },
  {
    name: "contributionAmount",
    type: "function",
    stateMutability: "view",
    inputs: [],
    outputs: [{ type: "uint256" }],
  },
  {
    name: "roundDuration",
    type: "function",
    stateMutability: "view",
    inputs: [],
    outputs: [{ type: "uint256" }],
  },
  {
    name: "roundStartTime",
    type: "function",
    stateMutability: "view",
    inputs: [],
    outputs: [{ type: "uint256" }],
  },
  {
    name: "getMemberCount",
    type: "function",
    stateMutability: "view",
    inputs: [],
    outputs: [{ type: "uint256" }],
  },
  {
    name: "getBalance",
    type: "function",
    stateMutability: "view",
    inputs: [],
    outputs: [{ type: "uint256" }],
  },
  {
    name: "reputationScore",
    type: "function",
    stateMutability: "view",
    inputs: [{ type: "address" }],
    outputs: [{ type: "uint256" }],
  },
  {
    name: "roundRecipient",
    type: "function",
    stateMutability: "view",
    inputs: [{ type: "uint256" }],
    outputs: [{ type: "address" }],
  },
  {
    name: "members",
    type: "function",
    stateMutability: "view",
    inputs: [{ type: "uint256" }],
    outputs: [{ type: "address" }],
  },
] as const;

// ── Event signatures ───────────────────────────────────────────────────────

const evMemberRegistered = parseAbiItem("event MemberRegistered(address indexed member)");
const evContributionMade = parseAbiItem(
  "event ContributionMade(address indexed member, uint256 round, uint256 amount)",
);
const evPayoutReleased = parseAbiItem(
  "event PayoutReleased(address indexed recipient, uint256 round, uint256 amount)",
);
const evDefaultRecorded = parseAbiItem(
  "event DefaultRecorded(address indexed member, uint256 round)",
);

// ── Helpers ────────────────────────────────────────────────────────────────

const read = <T>(fn: string, args: unknown[] = []) =>
  client.readContract({
    address: CONTRACT_ADDRESS,
    abi,
    functionName: fn as never,
    args,
  }) as Promise<T>;

const short = (addr: string) => `${addr.slice(0, 6)}…${addr.slice(-4)}`;
const cUSD = (wei: bigint) => `${formatUnits(wei, 18)} cUSD`;
const days = (secs: bigint) => `${Number(secs) / 86400} day(s)`;
const line = (char = "─", n = 60) => char.repeat(n);

async function getLogs(event: ReturnType<typeof parseAbiItem>) {
  try {
    return (await client.getLogs({
      address: CONTRACT_ADDRESS,
      event: event as any,
      fromBlock: 0n,
      toBlock: "latest",
    })) as any[];
  } catch {
    return [];
  }
}

// ── Main ───────────────────────────────────────────────────────────────────

const [
  admin,
  currentRound,
  contributionAmount,
  roundDuration,
  roundStartTime,
  memberCount,
  balance,
] = await Promise.all([
  read<`0x${string}`>("admin"),
  read<bigint>("currentRound"),
  read<bigint>("contributionAmount"),
  read<bigint>("roundDuration"),
  read<bigint>("roundStartTime"),
  read<bigint>("getMemberCount"),
  read<bigint>("getBalance"),
]);

// Read per-member reputation for registered members
const memberAddresses: `0x${string}`[] = [];
for (let i = 0n; i < memberCount; i++) {
  memberAddresses.push(await read<`0x${string}`>("members", [i]));
}
const reputations = await Promise.all(
  memberAddresses.map((addr) => read<bigint>("reputationScore", [addr])),
);

// Read events
const [regLogs, contribLogs, payoutLogs, defaultLogs] = await Promise.all([
  getLogs(evMemberRegistered),
  getLogs(evContributionMade),
  getLogs(evPayoutReleased),
  getLogs(evDefaultRecorded),
]);

const roundEnd = new Date(Number(roundStartTime + roundDuration) * 1000);

// ── Output ─────────────────────────────────────────────────────────────────

console.log();
console.log(line("━"));
console.log("  e-Kimina Contract State  │  Celo Sepolia (chainId 11142220)");
console.log(line("━"));
console.log(`  Address   ${CONTRACT_ADDRESS}`);
console.log(`  Admin     ${admin}`);
console.log(`  Explorer  ${EXPLORER}/address/${CONTRACT_ADDRESS}`);
console.log();

console.log(line());
console.log("  Round & Parameters");
console.log(line());
console.log(`  Current round      ${currentRound}`);
console.log(`  Round duration     ${days(roundDuration)}`);
console.log(`  Round started      ${new Date(Number(roundStartTime) * 1000).toISOString()}`);
console.log(`  Round ends         ${roundEnd.toISOString()}`);
console.log(`  Contribution       ${cUSD(contributionAmount)}`);
console.log(`  Pool balance       ${cUSD(balance)}`);
console.log(`  Members            ${memberCount}`);
console.log();

if (memberAddresses.length > 0) {
  console.log(line());
  console.log("  Members & Reputation");
  console.log(line());
  memberAddresses.forEach((addr, i) => {
    const rep = reputations[i];
    const bar = "█".repeat(Number(rep) / 10) + "░".repeat(10 - Number(rep) / 10);
    console.log(`  ${short(addr)}  ${String(rep).padStart(3)}/100  ${bar}`);
  });
  console.log();
}

console.log(line());
console.log("  Event Log");
console.log(line());

console.log(`  MemberRegistered   ${regLogs.length} event(s)`);
for (const log of regLogs.slice(-5)) {
  console.log(`    block ${log.blockNumber}  member=${short(log.args.member)}`);
}

console.log(`  ContributionMade   ${contribLogs.length} event(s)`);
for (const log of contribLogs.slice(-5)) {
  const { member, round, amount } = log.args;
  console.log(`    block ${log.blockNumber}  round=${round}  ${short(member)}  ${cUSD(amount)}`);
}

console.log(`  PayoutReleased     ${payoutLogs.length} event(s)`);
for (const log of payoutLogs.slice(-5)) {
  const { recipient, round, amount } = log.args;
  console.log(`    block ${log.blockNumber}  round=${round}  ${short(recipient)}  ${cUSD(amount)}`);
}

console.log(`  DefaultRecorded    ${defaultLogs.length} event(s)`);
for (const log of defaultLogs.slice(-5)) {
  console.log(
    `    block ${log.blockNumber}  round=${log.args.round}  member=${short(log.args.member)}`,
  );
}

console.log();
console.log(line("━"));
