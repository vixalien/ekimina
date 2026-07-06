import type { Address, User } from "@ekimina/types";

import { describe, it, expect, beforeEach } from "vitest";

import { usersByAddress, users } from "../lib/store.js";

const ADDRESS = "0x1234567890123456789012345678901234567890" as Address;

function addUser(overrides: Partial<User> = {}): User {
  const user: User = {
    id: "user-1",
    address: ADDRESS,
    name: null,
    phone: "0788123456",
    custodial: true,
    notificationsEnabled: true,
    ...overrides,
  };
  users.set(user.id, user);
  usersByAddress.set(user.address, user);
  return user;
}

describe("GET /users/{address}", () => {
  beforeEach(() => {
    // stores cleared by setup.ts
  });

  it("returns user when address exists", async () => {
    const user = addUser({ name: "Alice" });

    const { default: profile } = await import("./profile.js");
    const res = await profile.request(`/users/${user.address}`);
    expect(res.status).toBe(200);

    const body = (await res.json()) as User;
    expect(body.id).toBe(user.id);
    expect(body.name).toBe("Alice");
    expect(body.address).toBe(user.address);
  });

  it("returns 404 for unknown address", async () => {
    const { default: profile } = await import("./profile.js");
    const res = await profile.request("/users/0x0000000000000000000000000000000000000000");
    expect(res.status).toBe(404);
    expect(await res.json()).toEqual({ error: "not found" });
  });

  it("returns 400 for invalid address format", async () => {
    const { default: profile } = await import("./profile.js");
    const res = await profile.request("/users/not-an-address");
    expect(res.status).toBe(400);
  });
});
