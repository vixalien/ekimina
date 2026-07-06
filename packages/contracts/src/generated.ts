import { getContract } from "viem";
import type { Address, PublicClient, WalletClient } from "viem";
import IkiminaAbi from "./abi/Ikimina.json" with { type: "json" };
import FactoryAbi from "./abi/IkiminaFactory.json" with { type: "json" };
import MockERC20Abi from "./abi/MockUSDm.json" with { type: "json" };

export const ikiminaABI = IkiminaAbi;
export const factoryABI = FactoryAbi;
export const mockERC20ABI = MockERC20Abi;

export function getIkiminaContract(
  address: Address,
  client: { public: PublicClient; wallet?: WalletClient },
) {
  return getContract({ address, abi: ikiminaABI, client });
}

export function getFactoryContract(
  address: Address,
  client: { public: PublicClient; wallet?: WalletClient },
) {
  return getContract({ address, abi: factoryABI, client });
}
