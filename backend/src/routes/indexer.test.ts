import type { GroupMeta } from "@ekimina/types";

import { describe, it, expect, vi, beforeEach } from "vitest";

import { groupMeta } from "../lib/store.js";

vi.mock("@ekimina/contracts", () => ({
  getIkiminaContract: vi.fn(),
  getFactoryContract: vi.fn(),
}));

vi.mock("../lib/chain.js", () => ({
  publicClient: {},
}));

vi.mock("../lib/indexer.js", () => ({
  getCachedGroup: vi.fn(),
  getCachedCycle: vi.fn(),
}));

describe("GET /users/{address}/groups", () => {
  beforeEach(() => groupMeta.clear());

  it("returns groups from groupMeta store", async () => {
    const addr = "0xcafac3dd18ac6c6e92c921884f9e4176737c052c" as const;
    const creator = "0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266" as const;
    const meta: GroupMeta = {
      address: addr,
      name: "Umugongo W'Abaturage",
      inviteCode: "AB3K9F",
      createdAt: "2026-01-15T00:00:00.000Z",
      creator,
    };
    groupMeta.set(meta.address, meta);

    const { default: indexer } = await import("./indexer.js");
    const res = await indexer.request(`/users/${creator}/groups`);
    expect(res.status).toBe(200);
    const body = (await res.json()) as GroupMeta[];
    expect(body).toHaveLength(1);
    expect(body[0]?.name).toBe("Umugongo W'Abaturage");
    expect(body[0]?.address).toBe(addr);
  });

  it("returns empty array when groupMeta is empty", async () => {
    const { default: indexer } = await import("./indexer.js");
    const res = await indexer.request("/users/0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266/groups");
    expect(res.status).toBe(200);
    const body = (await res.json()) as GroupMeta[];
    expect(body).toEqual([]);
  });
});
