import { describe, it, expect } from "vitest";

import { sendOtp, verifyOtp } from "./auth.js";

describe("sendOtp", () => {
  it("returns sent: true for any phone", async () => {
    const result = await sendOtp("0788123456");
    expect(result).toEqual({ sent: true });
  });

  it("does not throw", async () => {
    await expect(sendOtp("+250788123456")).resolves.not.toThrow();
  });
});

describe("verifyOtp", () => {
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
