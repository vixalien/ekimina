import { atom, map } from "nanostores";
import type { GroupMembership } from "../api/types";

export const $openSwitcher = atom(false);

export function triggerSwitcher(): void {
  $openSwitcher.set(true);
}

export function clearOpenSwitcher(): void {
  $openSwitcher.set(false);
}

export interface ActiveGroupState {
  memberships: GroupMembership[];
  activeGroupId: string | null;
  showSwitcherOnMount: boolean;
}

export const $activeGroup = map<ActiveGroupState>({
  memberships: [],
  activeGroupId: null,
  showSwitcherOnMount: false,
});

export function setMemberships(memberships: GroupMembership[]): void {
  const state = $activeGroup.get();
  const hasActive =
    state.activeGroupId && memberships.some((m) => m.group.id === state.activeGroupId);
  $activeGroup.set({
    memberships,
    activeGroupId: hasActive ? state.activeGroupId : (memberships[0]?.group.id ?? null),
    showSwitcherOnMount: !hasActive && memberships.length > 1,
  });
}

export function switchGroup(groupId: string): void {
  $activeGroup.setKey("activeGroupId", groupId);
}

export function dismissSwitcherOnMount(): void {
  $activeGroup.setKey("showSwitcherOnMount", false);
}

export function addMembership(membership: GroupMembership): void {
  const state = $activeGroup.get();
  const exists = state.memberships.some((m) => m.group.id === membership.group.id);
  if (exists) return;
  $activeGroup.set({
    memberships: [...state.memberships, membership],
    activeGroupId: membership.group.id,
    showSwitcherOnMount: false,
  });
}
