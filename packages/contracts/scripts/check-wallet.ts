import { createPublicClient, http, formatEther } from "viem";
import { privateKeyToAccount } from "viem/accounts";

const celoSepolia = {
  id: 11142220,
  name: "Celo Sepolia",
  nativeCurrency: { name: "CELO", symbol: "CELO", decimals: 18 },
  rpcUrls: { default: { http: ["https://forno.celo-sepolia.celo-testnet.org/"] } },
} as const;

const deployer = privateKeyToAccount(process.env.CELO_SEPOLIA_PRIVATE_KEY! as `0x${string}`);

const publicClient = createPublicClient({ chain: celoSepolia, transport: http() });

const balance = await publicClient.getBalance({ address: deployer.address });

console.log("Address:", deployer.address);
console.log("Balance:", formatEther(balance), "CELO");
