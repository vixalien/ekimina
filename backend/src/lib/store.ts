export const JWT_SECRET = process.env.JWT_SECRET ?? "dev-secret-ekimina-2026";

export {
  getAllUsers,
  getUserByAddress,
  getUserByPhone,
  createUser,
  updateUser,
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
  getSettingsChange,
  createSettingsChange,
  getReview,
  upsertReview,
} from "./db/queries.js";
