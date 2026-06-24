import type { Group, GroupMembership, PublicGroup } from "../types";

const GROUP_1: Group = {
  id: "group-1",
  name: "Umugongo W'Abaturage",
  description: "Monthly savings cooperative for residents of Kicukiro sector",
  memberCount: 24,
  isPublic: false,
  inviteCode: "KICUKIRO2025",
  avatarInitials: "UW",
  createdAt: "2024-08-01T00:00:00Z",
};

const GROUP_2: Group = {
  id: "group-2",
  name: "Abahuza Savings Circle",
  description: "Young professionals saving together for investment goals",
  memberCount: 12,
  isPublic: true,
  inviteCode: null,
  avatarInitials: "AS",
  createdAt: "2025-01-10T00:00:00Z",
};

const GROUP_3: Group = {
  id: "group-3",
  name: "Imena Cooperative",
  description: "Agricultural cooperative savings group in Huye district",
  memberCount: 48,
  isPublic: true,
  inviteCode: "IMENA2025",
  avatarInitials: "IC",
  createdAt: "2023-11-15T00:00:00Z",
};

const GROUP_4: Group = {
  id: "group-4",
  name: "Kigali Entrepreneurs IKIMINA",
  description: "Savings group for Kigali-based entrepreneurs and freelancers",
  memberCount: 31,
  isPublic: true,
  inviteCode: null,
  avatarInitials: "KE",
  createdAt: "2024-06-20T00:00:00Z",
};

const GROUP_5: Group = {
  id: "group-5",
  name: "Abanyeshuri Fund",
  description: "University students pooling savings for semester expenses",
  memberCount: 18,
  isPublic: true,
  inviteCode: null,
  avatarInitials: "AF",
  createdAt: "2025-02-01T00:00:00Z",
};

export const ALL_GROUPS: Group[] = [GROUP_1, GROUP_2, GROUP_3, GROUP_4, GROUP_5];

export const MOCK_MEMBERSHIPS: Record<string, GroupMembership[]> = {
  "+250788123456": [
    { group: GROUP_1, role: "admin", joinedAt: "2024-08-01T00:00:00Z" },
  ],
  "+250788654321": [
    { group: GROUP_1, role: "member", joinedAt: "2025-02-01T00:00:00Z" },
    { group: GROUP_2, role: "treasurer", joinedAt: "2025-01-15T00:00:00Z" },
  ],
};

export const INVITE_CODE_MAP: Record<string, string> = {
  KICUKIRO2025: "group-1",
  IMENA2025: "group-3",
};

export function toPublicGroup(group: Group): PublicGroup {
  return {
    id: group.id,
    name: group.name,
    description: group.description,
    memberCount: group.memberCount,
    avatarInitials: group.avatarInitials,
  };
}
