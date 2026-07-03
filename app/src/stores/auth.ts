import { atom } from "nanostores";
import { dataClient } from "../api";
import type { Address } from "@/api";

export interface AuthUser {
  phone: string;
  token: string;
  address: Address;
  name: string | null;
  custodial: boolean;
  id: string;
}

export const $auth = atom<AuthUser | null>(null);
export const $authLoading = atom(true);

export async function loginWithOtp(phone: string, code: string): Promise<AuthUser> {
  const result = await dataClient.auth.verifyOtp(phone, code);
  const user = result.user;
  const authUser: AuthUser = {
    phone: user.phone ?? phone,
    token: result.token,
    address: user.address,
    name: user.name,
    custodial: user.custodial,
    id: user.id,
  };
  $auth.set(authUser);
  return authUser;
}

export function clearAuth(): void {
  $auth.set(null);
}
