import fs from "fs";
import path from "path";
import hre from "hardhat";

const localJSON = path.join("..", "..", "local.json");

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

  fs.writeFileSync(localJSON, `{"FACTORY_ADDRESS":"${factoryAddress}"}`, "utf-8");
  console.log(`\nFACTORY_ADDRESS written to ${path.resolve(localJSON)}`);
}

main().catch(console.error);
