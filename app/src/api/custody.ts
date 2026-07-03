import AsyncStorage from "@react-native-async-storage/async-storage";
import { generatePrivateKey, privateKeyToAccount } from "viem/accounts";
import type { Address, CustodyApi } from "@ekimina/types";

const KEY_STORE = "ekimina_private_key";
const ADDRESS_STORE = "ekimina_address";

export const custody: CustodyApi = {
  async importAccount(secret: string, pin: string): Promise<{ address: Address }> {
    const account = privateKeyToAccount(secret as `0x${string}`);
    await AsyncStorage.setItem(KEY_STORE, secret);
    await AsyncStorage.setItem(ADDRESS_STORE, account.address);
    return { address: account.address as Address };
  },

  async createAccount() {
    const privateKey = generatePrivateKey();
    const account = privateKeyToAccount(privateKey);
    await AsyncStorage.setItem(KEY_STORE, privateKey);
    await AsyncStorage.setItem(ADDRESS_STORE, account.address);
    return { address: account.address as Address };
  },

  async unlock(pin: string): Promise<{ address: Address }> {
    const privateKey = await AsyncStorage.getItem(KEY_STORE);
    if (!privateKey) throw new Error("no key");
    const account = privateKeyToAccount(privateKey as `0x${string}`);
    return { address: account.address as Address };
  },

  async currentAddress(): Promise<Address | null> {
    const address = await AsyncStorage.getItem(ADDRESS_STORE);
    return address as Address | null;
  },
};
