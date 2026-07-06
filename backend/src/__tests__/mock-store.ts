export const mockUsers = new Map<string, Record<string, unknown>>();
export const mockUsersByAddress = new Map<string, Record<string, unknown>>();
export const mockGroupMeta = new Map<string, Record<string, unknown>>();
export const mockPaymentIntents = new Map<string, Record<string, unknown>>();
export const mockSigningStates = new Map<string, Record<string, unknown>>();
export const mockJoinRequests = new Map<string, Record<string, unknown>>();
export const mockSettingsChanges = new Map<string, Record<string, unknown>>();
export const mockReviews = new Map<string, Record<string, unknown>>();

export function clearAll() {
  mockUsers.clear();
  mockUsersByAddress.clear();
  mockGroupMeta.clear();
  mockPaymentIntents.clear();
  mockSigningStates.clear();
  mockJoinRequests.clear();
  mockSettingsChanges.clear();
  mockReviews.clear();
}
