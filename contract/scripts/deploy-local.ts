import hre from "hardhat";

async function main() {
  const client = await hre.network.connect();
  const [deployer] = await client.viem.getWalletClients();
  console.log("Deploying from:", deployer.account.address);

  const mockContract = await client.viem.deployContract("MockUSDm", []);
  const mockAddress = mockContract.address;
  console.log("MockUSDm deployed to:", mockAddress);

  const factoryContract = await client.viem.deployContract("IkiminaFactory", [mockAddress]);
  const factoryAddress = factoryContract.address;
  console.log("IkiminaFactory deployed to:", factoryAddress);

  console.log("\nSet this env var when starting the backend:");
  console.log(`FACTORY_ADDRESS=${factoryAddress}`);
}

main().catch(console.error);
