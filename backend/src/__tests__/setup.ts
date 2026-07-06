import { beforeEach } from "vitest";

import {
  users,
  usersByAddress,
  groupMeta,
  proposalTexts,
  paymentIntents,
  pendingRequests,
  settingsChanges,
} from "../lib/store.js";

beforeEach(() => {
  users.clear();
  usersByAddress.clear();
  groupMeta.clear();
  proposalTexts.clear();
  paymentIntents.clear();
  pendingRequests.clear();
  settingsChanges.clear();
});
