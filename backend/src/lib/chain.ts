import { createPublicClient, createWalletClient, http } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { foundry } from "viem/chains";

const HARDHAT_RPC = "http://127.0.0.1:8545";
const HARDHAT_CHAIN_ID = 31337;

const localChain = { ...foundry, id: HARDHAT_CHAIN_ID, name: "localhost" } as const;

export const publicClient = createPublicClient({
  chain: localChain,
  transport: http(HARDHAT_RPC),
});

const backendAccount = privateKeyToAccount(
  "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80",
);

export const walletClient = createWalletClient({
  account: backendAccount,
  chain: localChain,
  transport: http(HARDHAT_RPC),
});
