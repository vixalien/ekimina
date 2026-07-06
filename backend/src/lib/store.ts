export const JWT_SECRET = process.env.JWT_SECRET ?? "dev-secret-ekimina-2026";

export {
  getUserByAddress,
  getUserByPhone,
  createUser,
  getAllGroupMeta,
  getGroupMetaByAddress,
  getGroupMetaByInviteCode,
  upsertGroupMeta,
  getPaymentIntent,
  createPaymentIntent,
  updatePaymentIntent,
  getSigningState,
  upsertSigningState,
  deleteSigningState,
  createJoinRequest,
  deleteJoinRequest,
  getSettingsChange,
  createSettingsChange,
  getReview,
  upsertReview,
} from "./db/queries.js";
