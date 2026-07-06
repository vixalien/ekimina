import type { Address } from "@/api";

import { atom } from "nanostores";

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

export async function loginWithOtp(
  phone: string,
  result: {
    token: string;
    user: {
      address: Address;
      phone: string | null;
      name: string | null;
      custodial: boolean;
      id: string;
    };
  },
): Promise<AuthUser> {
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
