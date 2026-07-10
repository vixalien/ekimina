import { Hono } from "hono";
import { describe, it, expect, vi, beforeEach } from "vitest";

import { clearAll } from "../__tests__/mock-store.js";

vi.mock("hono/jwt", async (importOriginal) => {
  // oxlint-disable-next-line typescript/no-explicit-any
  const actual = await importOriginal<any>();
  return {
    ...actual,
    verify: vi.fn(),
  };
});

vi.mock("./db/queries.js", async () => {
  const m = await import("../__tests__/mock-store.js");
  return {
    getUserByAddress: vi.fn(() => null),
    getUserByPhone: vi.fn((phone: string) => {
      for (const u of m.mockUsers.values()) {
        if (u.phone === phone) return u;
      }
      return null;
    }),
    createUser: vi.fn((user: Record<string, unknown>) => {
      m.mockUsers.set(user.id as string, user);
      m.mockUsersByAddress.set(user.address as string, user);
      return user;
    }),
    getAllGroupMeta: vi.fn(() => []),
    getGroupMetaByAddress: vi.fn(() => null),
    getGroupMetaByInviteCode: vi.fn(() => null),
    upsertGroupMeta: vi.fn((meta: Record<string, unknown>) => meta),
    getPaymentIntent: vi.fn(() => null),
    createPaymentIntent: vi.fn((i: Record<string, unknown>) => i),
    updatePaymentIntent: vi.fn(() => null),
    getSigningState: vi.fn(() => null),
    upsertSigningState: vi.fn((id: string, userId: string) => ({
      id,
      signedBy: [userId],
      createdAt: new Date(),
      updatedAt: new Date(),
    })),
    deleteSigningState: vi.fn(),
    getSettingsChange: vi.fn(() => null),
    createSettingsChange: vi.fn((c: Record<string, unknown>) => c),
    getReview: vi.fn(() => null),
    upsertReview: vi.fn((r: Record<string, unknown>) => r),
  };
});

import { verify } from "hono/jwt";

import { sendOtp, verifyOtp, authMiddleware } from "./auth.js";

describe("sendOtp", () => {
  beforeEach(() => clearAll());

  it("returns sent: true for any phone", async () => {
    const result = await sendOtp("0788123456");
    expect(result).toEqual({ sent: true });
  });

  it("does not throw", async () => {
    await expect(sendOtp("+250788123456")).resolves.not.toThrow();
  });
});

describe("verifyOtp", () => {
  beforeEach(() => clearAll());

  it("returns auth result for correct mock OTP", async () => {
    await sendOtp("0788123456");
    const result = await verifyOtp("0788123456", "123456");
    expect(result).not.toBeNull();
    expect(result!.status).toBe("created");
    expect(result!.token).toBeTruthy();
    expect(result!.user.phone).toBe("0788123456");
  });

  it("returns null for wrong OTP", async () => {
    await sendOtp("0788123456");
    const result = await verifyOtp("0788123456", "000000");
    expect(result).toBeNull();
  });

  it("returns null for unsent phone", async () => {
    const result = await verifyOtp("0788999999", "123456");
    expect(result).toBeNull();
  });

  it("returns existing user on re-login", async () => {
    await sendOtp("0788123456");
    await verifyOtp("0788123456", "123456"); // first login, creates user
    const result = await verifyOtp("0788123456", "123456"); // second, existing
    expect(result).not.toBeNull();
    expect(result!.status).toBe("existing");
  });
});

function createTestApp() {
  const app = new Hono();
  app.use("/protected", authMiddleware);
  app.get("/protected", (c) => c.json({ ok: true }));
  return app;
}

describe("authMiddleware", () => {
  beforeEach(() => {
    clearAll();
    vi.clearAllMocks();
  });

  it("returns 401 without Authorization header", async () => {
    const app = createTestApp();
    const res = await app.request("/protected");
    expect(res.status).toBe(401);
    expect(await res.json()).toEqual({ error: "unauthorized" });
  });

  it("returns 401 with invalid token", async () => {
    vi.mocked(verify).mockRejectedValue(new Error("bad token"));

    const app = createTestApp();
    const res = await app.request("/protected", {
      headers: { Authorization: "Bearer bad-token" },
    });
    expect(res.status).toBe(401);
    expect(await res.json()).toEqual({ error: "unauthorized" });
  });

  it("passes through with valid token and sets userId", async () => {
    vi.mocked(verify).mockResolvedValue({ sub: "user-1", phone: "0788123456" });

    const app = createTestApp();
    const res = await app.request("/protected", {
      headers: { Authorization: "Bearer good-token" },
    });
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ ok: true });
  });
});
