import hre from "hardhat";

async function main() {
  const client = await hre.network.connect();
  const [deployer] = await client.viem.getWalletClients();
  console.log("Deploying from:", deployer.account.address);

  // Deploy MockUSDm
  const mockContract = await client.viem.deployContract("MockUSDm", []);
  const mockAddress = mockContract.address;
  console.log("MockUSDm deployed to:", mockAddress);

  // Deploy IkiminaFactory
  const factoryContract = await client.viem.deployContract("IkiminaFactory", [mockAddress]);
  const factoryAddress = factoryContract.address;
  console.log("IkiminaFactory deployed to:", factoryAddress);

  // Mint tokens to deployer for contributions
  const mintTx = await mockContract.write.mint([deployer.account.address, BigInt("1000000000000000000000")]);
  await client.viem.waitForTransactionReceipt({ hash: mintTx });
  console.log("Minted 1000 USDm to deployer");

  // Create group 1: "Umugongo W'Abaturage"
  const groupConfig1 = {
    contributionAmount: BigInt("10000000000000000"), // 0.01 USDm
    cycleLength: BigInt(2592000), // 30 days
    payoutAmount: BigInt("60000000000000000"), // 0.06 USDm
    payoutPolicy: BigInt(1), // rotating
    penaltyRateBps: BigInt(500), // 5%
    approvalThresholdBps: BigInt(5000), // 50%
    loansEnabled: true,
    discretionaryEnabled: true,
    allMembersCommittee: true,
  };

  const inviteCode1 = "KICUKIRO2025";
  const inviteHash1 = await client.viem.utils.keccak256(client.viem.utils.toHex(inviteCode1));

  const createTx1 = await factoryContract.write.createGroup([groupConfig1, inviteHash1]);
  const receipt1 = await client.viem.waitForTransactionReceipt({ hash: createTx1 });

  // Find group address from logs
  const group1CreatedLog = receipt1.logs.find(
    (log: any) => log.topics[0] === client.viem.utils.keccak256(client.viem.utils.toHex("GroupCreated(address,address)")),
  );
  const group1Address = `0x${group1CreatedLog?.topics?.[1]?.slice(26)}` as `0x${string}`;
  console.log("Group 1 created at:", group1Address);
  console.log("Invite code:", inviteCode1);

  // Create group 2: "Imena Cooperative"
  const groupConfig2 = {
    contributionAmount: BigInt("20000000000000000"), // 0.02 USDm
    cycleLength: BigInt(2592000),
    payoutAmount: BigInt("120000000000000000"), // 0.12 USDm
    payoutPolicy: BigInt(1),
    penaltyRateBps: BigInt(500),
    approvalThresholdBps: BigInt(5000),
    loansEnabled: true,
    discretionaryEnabled: true,
    allMembersCommittee: true,
  };

  const inviteCode2 = "IMENA2025";
  const inviteHash2 = await client.viem.utils.keccak256(client.viem.utils.toHex(inviteCode2));

  const createTx2 = await factoryContract.write.createGroup([groupConfig2, inviteHash2]);
  const receipt2 = await client.viem.waitForTransactionReceipt({ hash: createTx2 });

  const group2CreatedLog = receipt2.logs.find(
    (log: any) => log.topics[0] === client.viem.utils.keccak256(client.viem.utils.toHex("GroupCreated(address,address)")),
  );
  const group2Address = `0x${group2CreatedLog?.topics?.[1]?.slice(26)}` as `0x${string}`;
  console.log("Group 2 created at:", group2Address);
  console.log("Invite code:", inviteCode2);

  // Contribute to group 1 from deployer
  const approveTx = await mockContract.write.approve([
    group1Address,
    BigInt("100000000000000000000"),
  ]);
  await client.viem.waitForTransactionReceipt({ hash: approveTx });

  const contributeTx1 = await client.viem.writeContract(
    client.viem.parseAbi("function contribute()"),
    { address: group1Address, functionName: "contribute" },
  );
  await client.viem.waitForTransactionReceipt({ hash: contributeTx1 });
  console.log("Contributed to group 1");

  console.log("\n=== NEXT STEPS ===");
  console.log(`Set this env var when starting the backend:`);
  console.log(`FACTORY_ADDRESS=${factoryAddress}`);
  console.log(`\nGroup addresses:`);
  console.log(`  Group 1 (Umugongo W'Abaturage): ${group1Address}`);
  console.log(`  Group 2 (Imena Cooperative): ${group2Address}`);
}

main().catch(console.error);
