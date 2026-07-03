import { createPublicClient, createWalletClient, http } from "viem";
import { foundry } from "viem/chains";
import IkiminaAbi from "./abi/Ikimina.json";
import FactoryAbi from "./abi/IkiminaFactory.json";
import MockERC20Abi from "./abi/MockUSDm.json";

export const ikiminaABI = IkiminaAbi as unknown as readonly any[];
export const factoryABI = FactoryAbi as unknown as readonly any[];
export const mockERC20ABI = MockERC20Abi as unknown as readonly any[];

export const publicClient = createPublicClient({
  chain: foundry,
  transport: http("http://127.0.0.1:8545"),
});

export function getIkiminaContract(address: `0x${string}`) {
  return {
    address,
    abi: ikiminaABI,
    publicClient,
  };
}
