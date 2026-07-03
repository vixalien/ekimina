import hre from "hardhat";

async function main() {
  const [deployer] = await hre.viem.getWalletClients();
  console.log("Deploying from:", deployer.account.address);

  const mockUsdm = await hre.viem.deployContract("MockUSDm", []);
  console.log("MockUSDm deployed to:", mockUsdm.address);

  const factory = await hre.viem.deployContract("IkiminaFactory", [mockUsdm.address]);
  console.log("IkiminaFactory deployed to:", factory.address);

  console.log("\nSet this env var when starting the backend:");
  console.log(`FACTORY_ADDRESS=${factory.address}`);
}

main().catch(console.error);
