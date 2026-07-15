import type { Address } from "@ekimina/types";

import type { SeedGroup } from "./groups.js";

import { getContract } from "viem";

import { publicClient } from "../../chain.js";

import { getIkimina, makeWallet, advanceCycle, MINT_AMOUNT, APPROVE_AMOUNT } from "./helpers.js";

export interface CyclePlan {
  skipMemberIndices: number[];
}

async function setupMember(
  g: SeedGroup,
  groupAddr: Address,
  adminToken: ReturnType<typeof getContract>,
  addr: string,
) {
  const userWallet = makeWallet(addr);
  const userToken = getContract({
    address: adminToken.address,
    abi: adminToken.abi,
    client: { public: publicClient, wallet: userWallet },
  });
  const ikimina = getIkimina(groupAddr, userWallet);

  // oxlint-disable-next-line typescript/no-explicit-any
  await (adminToken as any).write.mint([addr, MINT_AMOUNT]);
  // oxlint-disable-next-line typescript/no-explicit-any
  await (userToken as any).write.approve([groupAddr, APPROVE_AMOUNT]);

  const reader = getIkimina(groupAddr);
  const alreadyMember = await reader.read.isMember([addr as Address]);
  if (!alreadyMember) {
    // oxlint-disable-next-line typescript/no-explicit-any
    await (ikimina as any).write.join([g.inviteCode]);
  }

  // oxlint-disable-next-line typescript/no-explicit-any
  await (ikimina as any).write.contribute();
}

export async function seedCycle(
  g: SeedGroup,
  groupAddr: Address,
  adminToken: ReturnType<typeof getContract>,
  cycle: number,
  plan?: CyclePlan,
) {
  const skip = new Set(plan?.skipMemberIndices ?? []);
  for (let i = 0; i < g.memberAddresses.length; i++) {
    if (skip.has(i)) {
      console.log(`    Cycle ${cycle}: ${g.memberAddresses[i].slice(0, 6)} skipped`);
      continue;
    }
    const addr = g.memberAddresses[i];
    try {
      const userWallet = makeWallet(addr);
      const userToken = getContract({
        address: adminToken.address,
        abi: adminToken.abi,
        client: { public: publicClient, wallet: userWallet },
      });
      const ikimina = getIkimina(groupAddr, userWallet);

      // oxlint-disable-next-line typescript/no-explicit-any
      await (userToken as any).write.approve([groupAddr, APPROVE_AMOUNT]);
      // oxlint-disable-next-line typescript/no-explicit-any
      await (ikimina as any).write.contribute();
    } catch (e) {
      const reason = (e as Error).message.slice(0, 200).replace(/\n.*/s, "");
      console.warn(`    Cycle ${cycle}: ${addr.slice(0, 6)} contribute failed — ${reason}`);
    }
  }
}

export async function seedContributionCycles(
  g: SeedGroup,
  groupAddr: Address,
  adminToken: ReturnType<typeof getContract>,
  totalCycles: number,
  cyclePlans: CyclePlan[],
) {
  for (let i = 0; i < totalCycles; i++) {
    const plan = cyclePlans[i];
    await seedCycle(g, groupAddr, adminToken, i + 1, plan);
    await advanceCycle(groupAddr);
    console.log(`    Cycle ${i + 1} complete`);
  }
}

export { setupMember };
