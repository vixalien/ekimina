import { createPublicClient, createWalletClient, http } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { foundry } from "viem/chains";

const HARDHAT_RPC = process.env.EXPO_PUBLIC_HARDHAT_RPC ?? "http://localhost:8545";

export const publicClient = createPublicClient({
  chain: foundry,
  transport: http(HARDHAT_RPC),
});

export function createUserWalletClient(privateKey: `0x${string}`) {
  const account = privateKeyToAccount(privateKey);
  return createWalletClient({
    account,
    chain: foundry,
    transport: http(HARDHAT_RPC),
  });
}
