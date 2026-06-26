import { createMockAuth } from "./auth";
import { createMockGroups } from "./groups";
import type { ApiClient } from "./types";

export const api: ApiClient = {
  auth: createMockAuth(),
  groups: createMockGroups(),
};

export type { ApiClient, AuthApi, GroupsApi } from "./types";
export type {
  User,
  Group,
  GroupMembership,
  PublicGroup,
  JoinRequest,
  OtpVerificationResult,
  StatusResult,
  GroupSettings,
  CreateGroupPayload,
  CreateGroupResult,
} from "./types";
