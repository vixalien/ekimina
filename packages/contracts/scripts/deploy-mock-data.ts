import fs from "fs";
import path from "path";

import type { Address } from "@ekimina/types";

import hre from "hardhat";
import { decodeEventLog, keccak256, toBytes } from "viem";

function toAmount(usdm: number): bigint {
  return BigInt(usdm) * BigInt("1000000000000000000"); // 18 decimals
}

async function main() {
  // oxlint-disable-next-line typescript/no-explicit-any
  const client = await (hre.network.connect() as any);
  const wallets = await client.viem.getWalletClients();
  const publicClient = await client.viem.getPublicClient();
  console.log("Deploying from:", wallets[0].account.address);

  const mockArtifact = await hre.artifacts.readArtifact("MockUSDm");
  const factoryArtifact = await hre.artifacts.readArtifact("IkiminaFactory");
  const ikiminaArtifact = await hre.artifacts.readArtifact("Ikimina");

  const mockContract = await client.viem.deployContract("MockUSDm", []);
  const mockAddress = mockContract.address;

  const factoryContract = await client.viem.deployContract("IkiminaFactory", [mockAddress]);
  const factoryAddress = factoryContract.address;
  console.log("Factory:", factoryAddress);

  for (let i = 0; i < 10; i++) {
    const tx = await wallets[0].writeContract({
      address: mockAddress,
      abi: mockArtifact.abi,
      functionName: "mint",
      args: [wallets[i].account.address, toAmount(1000000)],
    });
    await publicClient.waitForTransactionReceipt({ hash: tx });
  }
  console.log("Minted USDm to 10 accounts");

  // oxlint-disable-next-line typescript/no-explicit-any
  async function decodeGroupDeployed(receipt: any): Promise<Address> {
    // oxlint-disable-next-line typescript/no-explicit-any
    const log = receipt.logs.find((l: any) => {
      try {
        const d = decodeEventLog({
          abi: factoryArtifact.abi,
          data: l.data,
          topics: l.topics,
          // oxlint-disable-next-line typescript/no-explicit-any
        } as any);
        return d.eventName === "GroupDeployed";
      } catch {
        return false;
      }
    });
    const decoded = decodeEventLog({
      abi: factoryArtifact.abi,
      data: log!.data,
      topics: log!.topics,
      // oxlint-disable-next-line typescript/no-explicit-any
    } as any);
    // oxlint-disable-next-line typescript/no-explicit-any
    return (decoded.args as any).group as Address;
  }

  const invite1 = "AB3K9F";
  const inviteHash1 = keccak256(toBytes(invite1));
  const createTx1 = await wallets[0].writeContract({
    address: factoryAddress,
    abi: factoryArtifact.abi,
    functionName: "createGroup",
    args: [
      {
        contributionAmount: toAmount(5000),
        cycleLength: BigInt(2592000),
        payoutAmount: toAmount(21000),
        payoutPolicy: BigInt(1),
        penaltyRateBps: BigInt(1500),
        approvalThresholdBps: BigInt(6600),
        loansEnabled: true,
        discretionaryEnabled: true,
        allMembersCommittee: false,
      },
      inviteHash1,
    ],
  });
  const receipt1 = await publicClient.waitForTransactionReceipt({ hash: createTx1 });
  const group1Addr = await decodeGroupDeployed(receipt1);
  console.log("Group 1 (Umugongo W'Abaturage):", group1Addr, "invite:", invite1);

  const invite2 = "SAVE2025";
  const inviteHash2 = keccak256(toBytes(invite2));
  const createTx2 = await wallets[0].writeContract({
    address: factoryAddress,
    abi: factoryArtifact.abi,
    functionName: "createGroup",
    args: [
      {
        contributionAmount: toAmount(10000),
        cycleLength: BigInt(1209600),
        payoutAmount: toAmount(42000),
        payoutPolicy: BigInt(1),
        penaltyRateBps: BigInt(1000),
        approvalThresholdBps: BigInt(5000),
        loansEnabled: true,
        discretionaryEnabled: false,
        allMembersCommittee: false,
      },
      inviteHash2,
    ],
  });
  const receipt2 = await publicClient.waitForTransactionReceipt({ hash: createTx2 });
  const group2Addr = await decodeGroupDeployed(receipt2);
  console.log("Group 2 (Abahuza Savings Circle):", group2Addr, "invite:", invite2);

  async function joinAndFund(groupAddr: Address, walletIdx: number, invite: string) {
    const w = wallets[walletIdx];
    const approveTx = await w.writeContract({
      address: mockAddress,
      abi: mockArtifact.abi,
      functionName: "approve",
      args: [groupAddr, toAmount(100000)],
    });
    await publicClient.waitForTransactionReceipt({ hash: approveTx });

    const joinTx = await w.writeContract({
      address: groupAddr,
      abi: ikiminaArtifact.abi,
      functionName: "join",
      args: [invite],
    });
    await publicClient.waitForTransactionReceipt({ hash: joinTx });

    const contTx = await w.writeContract({
      address: groupAddr,
      abi: ikiminaArtifact.abi,
      functionName: "contribute",
      args: [],
    });
    await publicClient.waitForTransactionReceipt({ hash: contTx });
  }

  // wallets[0] is already a member (from constructor). Needs approve + contribute.
  await wallets[0].writeContract({
    address: mockAddress,
    abi: mockArtifact.abi,
    functionName: "approve",
    args: [group1Addr, toAmount(100000)],
  });
  await publicClient.waitForTransactionReceipt({
    hash: await wallets[0].writeContract({
      address: group1Addr,
      abi: ikiminaArtifact.abi,
      functionName: "contribute",
      args: [],
    }),
  });

  for (let i = 1; i < 5; i++) {
    await joinAndFund(group1Addr, i, invite1);
  }
  console.log("Group 1: 5 members");

  // Advance group 1 through 6 more cycles
  for (let c = 2; c <= 7; c++) {
    // oxlint-disable-next-line typescript/no-explicit-any
    await publicClient.request({ method: "evm_increaseTime", params: [2592000] } as any);
    // oxlint-disable-next-line typescript/no-explicit-any
    await publicClient.request({ method: "evm_mine", params: [] } as any);

    await wallets[0].writeContract({
      address: group1Addr,
      abi: ikiminaArtifact.abi,
      functionName: "triggerPayout",
      args: [],
    });

    for (const idx of [0, 1, 2, 3, 4]) {
      await wallets[idx].writeContract({
        address: group1Addr,
        abi: ikiminaArtifact.abi,
        functionName: "contribute",
        args: [],
      });
    }
  }
  console.log("Group 1: cycle 7");

  // Create a loan proposal
  const propTx = await wallets[0].writeContract({
    address: group1Addr,
    abi: ikiminaArtifact.abi,
    functionName: "proposeLoan",
    args: [wallets[3].account.address, toAmount(25000), BigInt(500), BigInt(9)],
  });
  await publicClient.waitForTransactionReceipt({ hash: propTx });
  console.log("Group 1: loan proposal created");

  // Group 2
  await wallets[0].writeContract({
    address: mockAddress,
    abi: mockArtifact.abi,
    functionName: "approve",
    args: [group2Addr, toAmount(100000)],
  });
  await publicClient.waitForTransactionReceipt({
    hash: await wallets[0].writeContract({
      address: group2Addr,
      abi: ikiminaArtifact.abi,
      functionName: "contribute",
      args: [],
    }),
  });

  for (let i = 5; i <= 9; i++) {
    await joinAndFund(group2Addr, i, invite2);
  }
  console.log("Group 2: 6 members");

  for (let c = 2; c <= 3; c++) {
    // oxlint-disable-next-line typescript/no-explicit-any
    await publicClient.request({ method: "evm_increaseTime", params: [1209600] } as any);
    // oxlint-disable-next-line typescript/no-explicit-any
    await publicClient.request({ method: "evm_mine", params: [] } as any);

    await wallets[0].writeContract({
      address: group2Addr,
      abi: ikiminaArtifact.abi,
      functionName: "triggerPayout",
      args: [],
    });

    for (const idx of [0, 5, 6, 7, 8, 9]) {
      await wallets[idx].writeContract({
        address: group2Addr,
        abi: ikiminaArtifact.abi,
        functionName: "contribute",
        args: [],
      });
    }
  }
  console.log("Group 2: cycle 3");

  fs.writeFileSync(
    path.join("..", "..", "local.json"),
    `{"FACTORY_ADDRESS":"${factoryAddress}"}`,
    "utf-8",
  );
  console.log("\nFACTORY_ADDRESS written");

  // Write deployed-state.json for the backend
  const map = [
    [0, "Jean Mugabo"],
    [1, "Marie Uwimana"],
    [2, "Patrick Kabera"],
    [3, "Diane Mukamana"],
    [4, "Eric Bakunda"],
    [5, "Alice Niyonzima"],
    [6, "Grace Niyonsaba"],
    [7, "David Bizimana"],
    [8, "Fiston Mugisha"],
    [9, "Beatrice Zawadi"],
  ] as const;

  const accountNames: Record<string, string> = {};
  for (const [i, name] of map) {
    accountNames[wallets[i].account.address.toLowerCase()] = name;
  }

  const groupMeta: Record<string, { name: string; inviteCode: string }> = {
    [group1Addr.toLowerCase()]: { name: "Umugongo W'Abaturage", inviteCode: invite1 },
    [group2Addr.toLowerCase()]: { name: "Abahuza Savings Circle", inviteCode: invite2 },
  };

  const state = { accounts: accountNames, groups: groupMeta };
  const statePath = path.join("..", "..", "backend", "src", "lib", "deployed-state.json");
  fs.writeFileSync(statePath, JSON.stringify(state, null, 2), "utf-8");
  console.log("\ndeed-state written to", path.resolve(statePath));
}

main().catch(console.error);
