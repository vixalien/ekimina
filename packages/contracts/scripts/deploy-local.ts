import { readFileSync, writeFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

import { createPublicClient, createWalletClient, http } from "viem";
import { privateKeyToAccount } from "viem/accounts";

const __dirname = dirname(fileURLToPath(import.meta.url));
const localJSON = resolve(__dirname, "..", "..", "local.json");

const HARDHAT_CHAIN_ID = 31337;
const anvil = {
  id: HARDHAT_CHAIN_ID,
  name: "Anvil",
  nativeCurrency: { name: "ETH", symbol: "ETH", decimals: 18 },
  rpcUrls: { default: { http: ["http://127.0.0.1:8545"] } },
} as const;

// Default Hardhat/Anvil account #0
const deployer = privateKeyToAccount(
  "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80",
);

const publicClient = createPublicClient({ chain: anvil, transport: http() });
const walletClient = createWalletClient({ chain: anvil, transport: http(), account: deployer });

async function main() {
  console.log("Deploying from:", deployer.address);

  const chainId = await publicClient.getChainId();
  console.log("Connected to chain:", chainId);

  // Deploy MockUSDm
  const mockArtifact = JSON.parse(
    readFileSync(resolve(__dirname, "..", "out", "MockUSDm.sol", "MockUSDm.json"), "utf-8"),
  );
  const mockHash = await walletClient.deployContract({
    abi: mockArtifact.abi,
    bytecode: mockArtifact.bytecode.object as `0x${string}`,
  });
  const mockReceipt = await publicClient.waitForTransactionReceipt({ hash: mockHash });
  const mockAddress = mockReceipt.contractAddress!;
  console.log("MockUSDm deployed to:", mockAddress);

  // Deploy IkiminaFactory with MockUSDm address
  const factoryArtifact = JSON.parse(
    readFileSync(resolve(__dirname, "..", "out", "Ikimina.sol", "IkiminaFactory.json"), "utf-8"),
  );
  const factoryHash = await walletClient.deployContract({
    abi: factoryArtifact.abi,
    bytecode: factoryArtifact.bytecode.object as `0x${string}`,
    args: [mockAddress],
  });
  const factoryReceipt = await publicClient.waitForTransactionReceipt({
    hash: factoryHash,
  });
  const factoryAddress = factoryReceipt.contractAddress!;
  console.log("IkiminaFactory deployed to:", factoryAddress);

  writeFileSync(localJSON, `{"FACTORY_ADDRESS":"${factoryAddress}"}`, "utf-8");
  console.log(`\nFACTORY_ADDRESS written to ${resolve(localJSON)}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
