export interface User {
  id: string;
  phone: string;
  name: string | null;
  createdAt: string;
}

export interface Group {
  id: string;
  name: string;
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
  | { status: "new_user"; user: User; token: string }
  | { status: "no_groups"; user: User; token: string }
  | { status: "one_group"; user: User; token: string; membership: GroupMembership }
  | { status: "multiple_groups"; user: User; token: string; memberships: GroupMembership[] }
  | { status: "invitation_pending"; user: User; token: string; request: JoinRequest };

export interface StatusResult {
  user: User;
  groupStatus: "one_group" | "multiple_groups" | "no_groups" | "invitation_pending";
  pendingRequest?: { requestId: string; groupName: string; requestedAt: string };
}

export interface AuthApi {
  sendOtp(phone: string): Promise<{ success: boolean }>;
  resendOtp(phone: string): Promise<{ success: boolean }>;
  verifyOtp(phone: string, code: string): Promise<OtpVerificationResult>;
  getStatus(token: string): Promise<StatusResult>;
  updateProfile(token: string, name: string): Promise<User>;
}

export interface GroupsApi {
  myGroups(userId: string): Promise<GroupMembership[]>;
  joinByInviteCode(userId: string, code: string): Promise<JoinRequest>;
  searchPublicGroups(query: string): Promise<PublicGroup[]>;
  getGroupDetails(groupId: string): Promise<PublicGroup>;
  requestToJoinGroup(userId: string, groupId: string): Promise<JoinRequest>;
  getJoinRequestStatus(requestId: string): Promise<JoinRequest>;
  cancelJoinRequest(requestId: string): Promise<{ success: boolean }>;
  createGroup(payload: CreateGroupPayload): Promise<CreateGroupResult>;
}

export interface GroupSettings {
  name: string;
  isPublic: boolean;
  contributionAmount: number;
  cycleLength: number;
  payoutAmount: number;
  penaltyRate: number;
  approvalThreshold: number;
  allMembersAreCommittee: boolean;
  committeeSize: number;
  loansEnabled: boolean;
  loanInterestRate: number;
  discretionaryFundEnabled: boolean;
}

export interface CreateGroupPayload {
  settings: GroupSettings;
  founderId: string;
}

export interface CreateGroupResult {
  group: Group;
  inviteCode: string;
}

export interface ApiClient {
  auth: AuthApi;
  groups: GroupsApi;
}
