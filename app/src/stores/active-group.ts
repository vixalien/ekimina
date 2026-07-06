import type { Address, GroupMeta } from "@/api";

import { atom, map } from "nanostores";

export const $openSwitcher = atom(false);

export function triggerSwitcher(): void {
  $openSwitcher.set(true);
}

export function clearOpenSwitcher(): void {
  $openSwitcher.set(false);
}

export interface ActiveGroupState {
  memberships: GroupMeta[];
  activeGroupId: Address | null;
  showSwitcherOnMount: boolean;
}

export const $activeGroup = map<ActiveGroupState>({
  memberships: [],
  activeGroupId: null,
  showSwitcherOnMount: false,
});

export function setMemberships(memberships: GroupMeta[]): void {
  const state = $activeGroup.get();
  const hasActive =
    state.activeGroupId && memberships.some((m) => m.address === state.activeGroupId);
  $activeGroup.set({
    memberships,
    activeGroupId: hasActive ? state.activeGroupId : (memberships[0]?.address ?? null),
    showSwitcherOnMount: !hasActive && memberships.length > 1,
  });
}

export function switchGroup(groupId: Address): void {
  $activeGroup.setKey("activeGroupId", groupId);
}

export function dismissSwitcherOnMount(): void {
  $activeGroup.setKey("showSwitcherOnMount", false);
}

export function addMembership(membership: GroupMeta): void {
  const state = $activeGroup.get();
  const exists = state.memberships.some((m) => m.address === membership.address);
  if (exists) return;
  $activeGroup.set({
    memberships: [...state.memberships, membership],
    activeGroupId: membership.address,
    showSwitcherOnMount: false,
  });
}
