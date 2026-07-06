import { describe, expect, it, beforeEach } from "vitest";

import { $auth, $authLoading, clearAuth, loginWithOtp } from "./auth";

describe("auth store", () => {
  beforeEach(() => {
    $auth.set(null);
    $authLoading.set(true);
  });

  it("starts with null auth and loading", () => {
    expect($auth.get()).toBeNull();
    expect($authLoading.get()).toBe(true);
  });

  it("loginWithOtp sets auth state", async () => {
    const phone = "0788123456";
    const result = {
      token: "jwt-token-abc",
      user: {
        id: "u1",
        address: "0x1234567890123456789012345678901234567890" as const,
        phone,
        name: "Alice",
        custodial: true,
      },
    };

    const authUser = await loginWithOtp(phone, result);
    expect(authUser.phone).toBe(phone);
    expect(authUser.token).toBe("jwt-token-abc");
    expect(authUser.name).toBe("Alice");
    expect(authUser.custodial).toBe(true);

    expect($auth.get()?.phone).toBe(phone);
  });

  it("loginWithOtp uses fallback phone when user.phone is null", async () => {
    const result = {
      token: "t",
      user: {
        id: "u2",
        address: "0x0000000000000000000000000000000000000001" as const,
        phone: null,
        name: null,
        custodial: false,
      },
    };

    const authUser = await loginWithOtp("0788999999", result);
    expect(authUser.phone).toBe("0788999999");
  });

  it("clearAuth resets state to null", () => {
    $auth.set({
      phone: "0788123456",
      token: "t",
      address: "0x0000000000000000000000000000000000000001" as const,
      name: null,
      custodial: true,
      id: "u1",
    });
    clearAuth();
    expect($auth.get()).toBeNull();
  });

  it("loading state can be toggled", () => {
    $authLoading.set(false);
    expect($authLoading.get()).toBe(false);
    $authLoading.set(true);
    expect($authLoading.get()).toBe(true);
  });
});
