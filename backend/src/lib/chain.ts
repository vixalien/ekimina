import { createPublicClient, createWalletClient, http, defineChain } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { foundry, celoSepolia } from "viem/chains";

function resolveChain(chainId: number) {
  if (chainId === 31337) {
    return { ...foundry, id: 31337, name: "localhost" } as const;
  }
  if (chainId === 11142220) return celoSepolia;
  return defineChain({
    id: chainId,
    name: `Chain ${chainId}`,
    nativeCurrency: { name: "Ether", symbol: "ETH", decimals: 18 },
    rpcUrls: { default: { http: [] } },
  });
}

const RPC_URL = process.env.RPC_URL ?? "http://127.0.0.1:8545";
const CHAIN_ID = Number(process.env.CHAIN_ID ?? "31337");
const PRIVATE_KEY = (process.env.PRIVATE_KEY ??
  "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80") as `0x${string}`;

const chain = resolveChain(CHAIN_ID);

export const publicClient = createPublicClient({
  chain,
  transport: http(RPC_URL),
});

const backendAccount = privateKeyToAccount(PRIVATE_KEY);

export const walletClient = createWalletClient({
  account: backendAccount,
  chain,
  transport: http(RPC_URL),
});

export function getChainConfig() {
  return { rpcUrl: RPC_URL, chainId: CHAIN_ID };
}
