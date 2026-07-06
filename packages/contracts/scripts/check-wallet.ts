import hre from "hardhat";
import { formatEther } from "viem";

// oxlint-disable-next-line typescript/no-explicit-any
const { viem } = await (hre.network.create("celoSepolia") as any);
const [wallet] = await viem.getWalletClients();
const publicClient = await viem.getPublicClient();

const balance = await publicClient.getBalance({
  address: wallet.account.address,
});

console.log("Address:", wallet.account.address);
console.log("Balance:", formatEther(balance), "CELO");
