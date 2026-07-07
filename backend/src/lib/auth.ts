import type { User, AuthResult } from "@ekimina/types";

import { sign, verify } from "hono/jwt";

import { JWT_SECRET, getUserByPhone, createUser } from "./store.js";

const MOCK_OTP = "123456";
const otpStore = new Map<string, string>();

export async function sendOtp(phone: string): Promise<{ sent: boolean }> {
  otpStore.set(phone, MOCK_OTP);
  return { sent: true };
}

export async function verifyOtp(phone: string, code: string): Promise<AuthResult | null> {
  const stored = otpStore.get(phone);
  if (!stored || stored !== code) return null;

  const existing = (await getUserByPhone(phone)) as User | undefined;
  if (existing) {
    const token = await sign({ sub: existing.id, phone, type: "app" }, JWT_SECRET, "HS256");
    return { status: "existing", token, user: existing };
  }

  const id = `user-${Date.now()}`;
  const address = `0x${crypto.randomUUID().replace(/-/g, "").slice(0, 40)}` as const;
  const user: User = {
    id,
    address: address,
    name: null,
    phone,
    custodial: true,
    notificationsEnabled: true,
  };
  const created = (await createUser({ ...user, createdAt: new Date().toISOString() })) as User;
  const token = await sign({ sub: id, phone, type: "app" }, JWT_SECRET, "HS256");
  return { status: "created", token, user: created };
}

export async function verifyJwt(token: string): Promise<{ sub: string; phone: string } | null> {
  try {
    const payload = await verify(token, JWT_SECRET, "HS256");
    return { sub: payload.sub as string, phone: payload.phone as string };
  } catch {
    return null;
  }
}
