export interface User {
  id: string;
  phone: string;
  name: string | null;
  createdAt: string;
}

export interface Group {
  id: string;
  name: string;
  description: string;
  memberCount: number;
  isPublic: boolean;
  inviteCode: string | null;
  avatarInitials: string;
  createdAt: string;
}

export interface GroupMembership {
  group: Group;
  role: "admin" | "treasurer" | "secretary" | "member";
  joinedAt: string;
}

export interface PublicGroup {
  id: string;
  name: string;
  description: string;
  memberCount: number;
  avatarInitials: string;
}

export interface JoinRequest {
  id: string;
  groupId: string;
  groupName: string;
  status: "pending" | "approved" | "rejected" | "cancelled";
  requestedAt: string;
}

export type OtpVerificationResult =
  | { status: "no_groups"; user: User }
  | { status: "one_group"; user: User; membership: GroupMembership }
  | { status: "multiple_groups"; user: User; memberships: GroupMembership[] };

export interface AuthApi {
  sendOtp(phone: string): Promise<{ success: boolean }>;
  resendOtp(phone: string): Promise<{ success: boolean }>;
  verifyOtp(phone: string, code: string): Promise<OtpVerificationResult>;
}

export interface GroupsApi {
  myGroups(userId: string): Promise<GroupMembership[]>;
  joinByInviteCode(userId: string, code: string): Promise<JoinRequest>;
  searchPublicGroups(query: string): Promise<PublicGroup[]>;
  getGroupDetails(groupId: string): Promise<PublicGroup>;
  requestToJoinGroup(userId: string, groupId: string): Promise<JoinRequest>;
  getJoinRequestStatus(requestId: string): Promise<JoinRequest>;
  cancelJoinRequest(requestId: string): Promise<{ success: boolean }>;
}

export interface ApiClient {
  auth: AuthApi;
  groups: GroupsApi;
}
