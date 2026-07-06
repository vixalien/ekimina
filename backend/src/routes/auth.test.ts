import type { AuthResult } from "@ekimina/types";

import { describe, it, expect, vi, beforeEach } from "vitest";

import auth from "./auth.js";

vi.mock("../lib/auth.js", () => ({
  sendOtp: vi.fn(),
  verifyOtp: vi.fn(),
}));

import * as authLib from "../lib/auth.js";

describe("POST /auth/otp/send", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns sent: true on valid phone", async () => {
    vi.mocked(authLib.sendOtp).mockResolvedValue({ sent: true });
    const res = await auth.request("/auth/otp/send", {
      method: "POST",
      body: JSON.stringify({ phone: "0788123456" }),
      headers: { "Content-Type": "application/json" },
    });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toEqual({ sent: true });
    expect(authLib.sendOtp).toHaveBeenCalledWith("0788123456");
  });

  it("rejects invalid phone format", async () => {
    const res = await auth.request("/auth/otp/send", {
      method: "POST",
      body: JSON.stringify({ phone: "abc" }),
      headers: { "Content-Type": "application/json" },
    });
    expect(res.status).toBe(400);
  });
});

describe("POST /auth/otp/verify", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns auth result on correct code", async () => {
    const mockResult: AuthResult = {
      status: "created",
      token: "jwt-token",
      user: {
        id: "u1",
        address: "0x1234567890123456789012345678901234567890" as const,
        name: null,
        phone: "0788123456",
        custodial: true,
        notificationsEnabled: true,
      },
    };
    vi.mocked(authLib.verifyOtp).mockResolvedValue(mockResult);

    const res = await auth.request("/auth/otp/verify", {
      method: "POST",
      body: JSON.stringify({ phone: "0788123456", code: "123456" }),
      headers: { "Content-Type": "application/json" },
    });
    expect(res.status).toBe(200);
    const body = (await res.json()) as AuthResult;
    expect(body.status).toBe("created");
    expect(body.token).toBeDefined();
  });

  it("returns 401 on wrong code", async () => {
    vi.mocked(authLib.verifyOtp).mockResolvedValue(null);
    const res = await auth.request("/auth/otp/verify", {
      method: "POST",
      body: JSON.stringify({ phone: "0788123456", code: "000000" }),
      headers: { "Content-Type": "application/json" },
    });
    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body).toEqual({ error: "invalid code" });
  });

  it("rejects missing fields", async () => {
    const res = await auth.request("/auth/otp/verify", {
      method: "POST",
      body: JSON.stringify({ phone: "0788123456" }),
      headers: { "Content-Type": "application/json" },
    });
    expect(res.status).toBe(400);
  });
});
