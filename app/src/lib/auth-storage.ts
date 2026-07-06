import type { AuthUser } from "../stores/auth";

import AsyncStorage from "@react-native-async-storage/async-storage";

const AUTH_KEY = "ekimina_auth";

export async function loadAuth(): Promise<AuthUser | null> {
  try {
    const raw = await AsyncStorage.getItem(AUTH_KEY);
    return raw ? (JSON.parse(raw) as AuthUser) : null;
  } catch {
    return null;
  }
}

export async function saveAuth(user: AuthUser): Promise<void> {
  await AsyncStorage.setItem(AUTH_KEY, JSON.stringify(user));
}

export async function clearAuthStorage(): Promise<void> {
  await AsyncStorage.removeItem(AUTH_KEY);
}
