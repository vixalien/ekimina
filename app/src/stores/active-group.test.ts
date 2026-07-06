import type { GroupMeta } from "@ekimina/types";

import { describe, expect, it, beforeEach } from "vitest";

import {
  $openSwitcher,
  $activeGroup,
  addMembership,
  clearOpenSwitcher,
  dismissSwitcherOnMount,
  setMemberships,
  switchGroup,
  triggerSwitcher,
} from "./active-group";

const MOCK_GROUPS: GroupMeta[] = [
  {
    address: "0xaaa" as const,
    name: "Savings Club",
    inviteCode: "ABC12",
    createdAt: "2026-01-01T00:00:00.000Z",
    creator: "0xaaa" as const,
  },
  {
    address: "0xbbb" as const,
    name: "Farmers Co-op",
    inviteCode: "DEF34",
    createdAt: "2026-02-01T00:00:00.000Z",
    creator: "0xbbb" as const,
  },
];

describe("switcher", () => {
  beforeEach(() => $openSwitcher.set(false));

  it("defaults to closed", () => {
    expect($openSwitcher.get()).toBe(false);
  });

  it("triggerSwitcher opens and clearOpenSwitcher closes", () => {
    triggerSwitcher();
    expect($openSwitcher.get()).toBe(true);
    clearOpenSwitcher();
    expect($openSwitcher.get()).toBe(false);
  });
});

describe("active group state", () => {
  beforeEach(() => {
    $activeGroup.set({ memberships: [], activeGroupId: null, showSwitcherOnMount: false });
  });

  it("starts empty", () => {
    const state = $activeGroup.get();
    expect(state.memberships).toEqual([]);
    expect(state.activeGroupId).toBeNull();
    expect(state.showSwitcherOnMount).toBe(false);
  });

  it("setMemberships sets first as active when no active group", () => {
    setMemberships(MOCK_GROUPS);
    const state = $activeGroup.get();
    expect(state.memberships).toHaveLength(2);
    expect(state.activeGroupId).toBe("0xaaa");
  });

  it("setMemberships preserves active group if it still exists", () => {
    $activeGroup.setKey("activeGroupId", "0xbbb");
    setMemberships(MOCK_GROUPS);
    expect($activeGroup.get().activeGroupId).toBe("0xbbb");
  });

  it("setMemberships resets active if current is gone", () => {
    $activeGroup.setKey("activeGroupId", "0xccc");
    setMemberships(MOCK_GROUPS);
    expect($activeGroup.get().activeGroupId).toBe("0xaaa");
  });

  it("setMemberships shows switcher when multiple and no active", () => {
    setMemberships(MOCK_GROUPS);
    expect($activeGroup.get().showSwitcherOnMount).toBe(true);
  });

  it("switchGroup changes active group", () => {
    switchGroup("0xbbb");
    expect($activeGroup.get().activeGroupId).toBe("0xbbb");
  });

  it("dismissSwitcherOnMount clears the flag", () => {
    $activeGroup.setKey("showSwitcherOnMount", true);
    dismissSwitcherOnMount();
    expect($activeGroup.get().showSwitcherOnMount).toBe(false);
  });

  it("addMembership appends and activates", () => {
    addMembership(MOCK_GROUPS[0]);
    expect($activeGroup.get().memberships).toHaveLength(1);
    expect($activeGroup.get().activeGroupId).toBe("0xaaa");
  });

  it("addMembership skips duplicates", () => {
    addMembership(MOCK_GROUPS[0]);
    addMembership(MOCK_GROUPS[0]);
    expect($activeGroup.get().memberships).toHaveLength(1);
  });

  it("setMemberships with empty array keeps activeGroupId null", () => {
    setMemberships([]);
    const state = $activeGroup.get();
    expect(state.memberships).toEqual([]);
    expect(state.activeGroupId).toBeNull();
  });

  it("setMemberships with empty array resets activeGroupId when membership removed", () => {
    setMemberships(MOCK_GROUPS);
    expect($activeGroup.get().activeGroupId).toBe("0xaaa");

    setMemberships([]);
    expect($activeGroup.get().activeGroupId).toBeNull();
  });
});
