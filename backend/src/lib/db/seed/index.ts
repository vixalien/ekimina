import { publicClient } from "../../chain.js";

import { setupMember, seedCycle } from "./cycles.js";
import { GROUPS } from "./groups.js";
import {
  resolveFactoryAddress,
  deployAllGroups,
  getTokenContract,
  advanceCycle,
  E18,
  LOAN_INTEREST_BPS,
} from "./helpers.js";
import {
  createLoanProposal,
  createDiscretionaryProposal,
  createSettingsProposal,
  createMemberExitProposal,
  createDissolveProposal,
  approveProposal,
  rejectProposal,
  seedProposalText,
} from "./proposals.js";
import { seedUsers } from "./users.js";

async function populateDemoData() {
  const chainId = await publicClient.getChainId();
  if (chainId !== 31337) {
    console.log("  Skipping chain data (not anvil)");
    return;
  }

  const factoryAddr = resolveFactoryAddress();
  const adminToken = await getTokenContract(factoryAddr);

  console.log("Deploying groups...");
  const created = await deployAllGroups(factoryAddr);

  // ---------- Group 0: Umugongo W'Abaturage ----------
  const g0 = GROUPS[0];
  const g0Addr = created[0];
  const g0Members = g0.memberAddresses;

  console.log(`\n  Populating "${g0.name}"...`);

  // Setup: join + first contribution for all members
  for (const addr of g0Members) {
    await setupMember(g0, g0Addr, adminToken, addr);
  }
  console.log("    Joined + contributed cycle 1");

  // Cycle 2: all contribute
  await advanceCycle(g0Addr);
  await seedCycle(g0, g0Addr, adminToken, 2);
  console.log("    Cycle 2 complete (all paid)");

  // Create Loan #1 (Eric borrows 20 USDm, due cycle+3)
  const loan1Id = await createLoanProposal(g0, g0Addr, 0, 4, 20n * E18, LOAN_INTEREST_BPS, 3);
  if (loan1Id) {
    for (const idx of [0, 1]) {
      await approveProposal(g0Addr, g0Members[idx], loan1Id);
    }
    console.log("    Loan #1 (Eric, 20 USDm) approved & disbursed");
    await seedProposalText(loan1Id, g0Addr, "Emergency medical expenses", "emergency", null, null);
  }

  // Advance to cycle 3
  await advanceCycle(g0Addr);
  console.log("    Advanced to cycle 3");

  // Cycle 3: 4 contribute (Diane skips — gets penalty)
  await seedCycle(g0, g0Addr, adminToken, 3, { skipMemberIndices: [3] });
  console.log("    Cycle 3: Diane missed");

  // Advance to cycle 4
  await advanceCycle(g0Addr);
  console.log("    Advanced to cycle 4");

  // Discretionary proposal (10 USDm to Marie) — approve & execute
  const discId = await createDiscretionaryProposal(g0, g0Addr, 0, 1, 10n * E18);
  if (discId) {
    for (const idx of [0, 1, 2]) {
      await approveProposal(g0Addr, g0Members[idx], discId);
    }
    console.log("    Discretionary (Marie, 10 USDm) approved & executed");
    await seedProposalText(
      discId,
      g0Addr,
      "Group transport for meeting",
      "transport",
      "Monthly travel costs",
      "operations",
    );
  }

  // Loan #2 (Patrick borrows 10 USDm) — pending (only 1 of 3 approvals)
  const loan2Id = await createLoanProposal(g0, g0Addr, 0, 2, 10n * E18, LOAN_INTEREST_BPS, 2);
  if (loan2Id) {
    await approveProposal(g0Addr, g0Members[0], loan2Id);
    console.log("    Loan #2 (Patrick, 10 USDm) — 1/3 approved, pending");
    await seedProposalText(
      loan2Id,
      g0Addr,
      "Small business stock",
      "business",
      "Restocking shop inventory",
      "business_loan",
    );
  }

  // Loan #3 (Marie borrows 8 USDm) — rejected
  const loan3Id = await createLoanProposal(g0, g0Addr, 1, 1, 8n * E18, 300, 2);
  if (loan3Id) {
    await approveProposal(g0Addr, g0Members[0], loan3Id);
    await rejectProposal(g0Addr, g0Members[2], loan3Id);
    console.log("    Loan #3 (Marie, 8 USDm) — rejected");
    await seedProposalText(loan3Id, g0Addr, "Personal expense", "personal", null, null);
  }

  // Settings proposal (increase penalty to 10%) — rejected
  const settingsId = await createSettingsProposal(g0, g0Addr, 1, 1000);
  if (settingsId) {
    await rejectProposal(g0Addr, g0Members[0], settingsId);
    console.log("    Settings (penalty 10%) — rejected");
    await seedProposalText(
      settingsId,
      g0Addr,
      "Increase penalty rate to 10%",
      "settings",
      "Deters late payments",
      "governance",
    );
  }

  // Member exit proposal (Diane) — pending
  const exitId = await createMemberExitProposal(g0, g0Addr, 0, 3, 15n * E18);
  if (exitId) {
    console.log("    Exit proposal (Diane) — pending");
    await seedProposalText(
      exitId,
      g0Addr,
      "Diane wishes to leave the group",
      "withdrawal",
      "Relocating to another province",
      "personal",
    );
  }

  // ---------- Group 1: Abahuza Savings Circle ----------
  if (GROUPS.length < 2) {
    console.log("\n  Skipping group 1 — only 1 group defined");
    return;
  }

  const g1 = GROUPS[1];
  const g1Addr = created[1];
  const g1Members = g1.memberAddresses;

  console.log(`\n  Populating "${g1.name}"...`);

  // Setup: all 6 members join + first contribution
  for (const addr of g1Members) {
    await setupMember(g1, g1Addr, adminToken, addr);
  }
  console.log("    Joined + contributed cycle 1");

  // Cycle 2: 5 contribute (Beatrice skips)
  await advanceCycle(g1Addr);
  await seedCycle(g1, g1Addr, adminToken, 2, { skipMemberIndices: [5] });
  console.log("    Cycle 2: Beatrice missed");

  // Cycle 3: all 6 contribute
  await advanceCycle(g1Addr);
  await seedCycle(g1, g1Addr, adminToken, 3);
  console.log("    Cycle 3: all paid");

  // Advance to cycle 4
  await advanceCycle(g1Addr);

  // Loan #1 (Alice borrows 15 USDm) — approved & disbursed
  const gl1Id = await createLoanProposal(g1, g1Addr, 0, 1, 15n * E18, LOAN_INTEREST_BPS, 2);
  if (gl1Id) {
    for (const idx of [0, 1, 2, 3]) {
      await approveProposal(g1Addr, g1Members[idx], gl1Id);
    }
    console.log("    Loan #1 (Alice, 15 USDm) approved & disbursed");
    await seedProposalText(
      gl1Id,
      g1Addr,
      "School fees",
      "education",
      "Term fees for children",
      "education",
    );
  }

  // Loan #2 (Grace borrows 25 USDm) — rejected
  const gl2Id = await createLoanProposal(g1, g1Addr, 2, 3, 25n * E18, LOAN_INTEREST_BPS, 3);
  if (gl2Id) {
    await approveProposal(g1Addr, g1Members[0], gl2Id);
    await rejectProposal(g1Addr, g1Members[2], gl2Id);
    await rejectProposal(g1Addr, g1Members[3], gl2Id);
    console.log("    Loan #2 (Grace, 25 USDm) — rejected");
    await seedProposalText(gl2Id, g1Addr, "Land purchase", "investment", null, null);
  }

  // Dissolve proposal — pending
  const dissolveId = await createDissolveProposal(g1, g1Addr, 4);
  if (dissolveId) {
    console.log("    Dissolve proposal — pending");
    await seedProposalText(
      dissolveId,
      g1Addr,
      "Proposal to dissolve the group",
      "governance",
      "Members want to close and share out",
      "governance",
    );
  }
}

async function seed() {
  const factoryAddr = resolveFactoryAddress();
  console.log(`Factory: ${factoryAddr}`);

  console.log("Seeding users...");
  await seedUsers();

  console.log("Populating demo data...");
  try {
    await populateDemoData();
    console.log("\n  Demo data complete");
  } catch (err) {
    console.log("\n  Demo data error:");
    console.error(err);
  }

  console.log("\nSeed complete");
}

seed()
  .catch(console.error)
  .finally(() => process.exit(0));
