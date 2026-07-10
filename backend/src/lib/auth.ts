import type { User, AuthResult } from "@ekimina/types";
import type { Context, Next } from "hono";

import { createMiddleware } from "hono/factory";
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
    address,
    name: null,
    phone,
    custodial: true,
    notificationsEnabled: true,
  };
  const created = (await createUser({ ...user, createdAt: new Date().toISOString() })) as User;
  const token = await sign({ sub: id, phone, type: "app" }, JWT_SECRET, "HS256");
  return { status: "created", token, user: created };
}

// oxlint-disable-next-line consistent-return
export const authMiddleware = createMiddleware(async (c: Context, next: Next) => {
  const authHeader = c.req.header("Authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return c.json({ error: "unauthorized" }, 401);
  }
  const token = authHeader.slice(7);
  try {
    const payload = await verify(token, JWT_SECRET, "HS256");
    c.set("userId", payload.sub);
    c.set("phone", payload.phone);
    await next();
  } catch {
    return c.json({ error: "unauthorized" }, 401);
  }
});
