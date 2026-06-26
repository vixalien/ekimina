import { atom } from "nanostores";

export type AccountType = "new" | "existing";

export interface AuthUser {
  phone: string;
  token: string;
  accountType: AccountType;
  name?: string | null;
  userId?: string;
}

export const $auth = atom<AuthUser | null>(null);
export const $authLoading = atom(true);

export function setAuth(user: AuthUser): void {
  $auth.set(user);
}
export function clearAuth(): void {
  $auth.set(null);
}
