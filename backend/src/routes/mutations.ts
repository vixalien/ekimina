import crypto from "crypto";

import type { Address } from "@ekimina/types";

import { createRoute, OpenAPIHono, z } from "@hono/zod-openapi";

import * as contract from "../lib/contract-data.js";
import { ACCOUNT_NAMES } from "../lib/deployed-state.js";
import {
  errorResponses,
  successOnlySchema,
  successWithIdSchema,
  thresholdResultSchema,
} from "../lib/schemas.js";
import {
  pendingRequests,
  settingsChanges,
  discretionaryReviews,
  joinRequestReviews,
  withdrawalReviews,
  loanReviews,
} from "../lib/store.js";

const mutations = new OpenAPIHono();

function nameEntry(key: string): { name: string; initials: string } {
  const name = ACCOUNT_NAMES[key.toLowerCase()] ?? key.slice(0, 6);
  const initials = name
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join("");
  return { name, initials };
}

const groupAndIdParams = z.object({ group: z.string(), id: z.string() });

// ── Loan sign / reject ──────────────────────────────────────────────────

const signLoanRoute = createRoute({
  method: "post",
  path: "/groups/{group}/loans/{id}/sign",
  tags: ["Mutations"],
  request: {
    params: groupAndIdParams,
    body: { content: { "application/json": { schema: z.object({ userId: z.string() }) } } },
  },
  responses: {
    200: {
      content: { "application/json": { schema: thresholdResultSchema } },
      description: "Signed",
    },
    ...errorResponses,
  },
});

mutations.openapi(signLoanRoute, async (c) => {
  const { group, id } = c.req.valid("param");
  const { userId } = c.req.valid("json");
  const loan = await contract.getLoanDetail(group as Address, id);
  if (!loan) return c.json({ error: "not found" }, 404) as any;

  const key = `loan:${id}`;
  let state = loanReviews.get(key) ?? { signed: new Set<string>() };
  state.signed.add(userId);
  loanReviews.set(key, state);

  return c.json({ success: true, thresholdMet: false });
});

const rejectLoanRoute = createRoute({
  method: "post",
  path: "/groups/{group}/loans/{id}/reject",
  tags: ["Mutations"],
  request: {
    params: groupAndIdParams,
    body: { content: { "application/json": { schema: z.object({ userId: z.string() }) } } },
  },
  responses: {
    200: {
      content: { "application/json": { schema: successOnlySchema } },
      description: "Rejected",
    },
    ...errorResponses,
  },
});

mutations.openapi(rejectLoanRoute, async (c) => {
  const { group, id } = c.req.valid("param");
  const loan = await contract.getLoanDetail(group as Address, id);
  if (!loan) return c.json({ error: "not found" }, 404) as any;
  return c.json({ success: true });
});

// ── Settings change ─────────────────────────────────────────────────────

const submitSettingsRoute = createRoute({
  method: "post",
  path: "/groups/{group}/settings/changes",
  tags: ["Mutations"],
  request: {
    params: z.object({ group: z.string() }),
    body: {
      content: {
        "application/json": {
          schema: z.object({ field: z.string(), proposedValue: z.string(), userId: z.string() }),
        },
      },
    },
  },
  responses: {
    200: {
      content: { "application/json": { schema: successOnlySchema } },
      description: "Submitted",
    },
    ...errorResponses,
  },
});

mutations.openapi(submitSettingsRoute, async (c) => {
  const { group } = c.req.valid("param");
  const { field, proposedValue, userId } = c.req.valid("json");
  const n = nameEntry(userId);
  const change = {
    id: crypto.randomUUID(),
    groupId: group,
    field,
    fieldLabel: field.replace(/_/g, " ").replace(/\b\w/g, (l: string) => l.toUpperCase()),
    currentValue: "",
    proposedValue,
    requesterName: n.name,
    requesterInitials: n.initials,
    requesterUserId: userId,
    signatureCount: 1,
    signatureThreshold: 2,
    signatures: [
      {
        userId,
        name: n.name,
        initials: n.initials,
        signed: true,
        signedAt: new Date().toISOString(),
      },
    ],
    currentUserAlreadySigned: true,
    currentUserSignedAt: new Date().toISOString(),
    createdAt: new Date().toISOString(),
  };
  settingsChanges.set(change.id, change);
  return c.json({ success: true });
});

const signSettingsRoute = createRoute({
  method: "post",
  path: "/groups/{group}/settings/changes/{id}/sign",
  tags: ["Mutations"],
  request: {
    params: groupAndIdParams,
    body: { content: { "application/json": { schema: z.object({ userId: z.string() }) } } },
  },
  responses: {
    200: {
      content: { "application/json": { schema: thresholdResultSchema } },
      description: "Signed",
    },
    ...errorResponses,
  },
});

mutations.openapi(signSettingsRoute, async (c) => {
  const { id } = c.req.valid("param");
  const { userId } = c.req.valid("json");
  const change = settingsChanges.get(id);
  if (!change) return c.json({ error: "not found" }, 404) as any;

  const key = `settings:${id}`;
  let state = pendingRequests.get(key) ?? { signed: new Set<string>() };
  state.signed.add(userId);
  pendingRequests.set(key, state);

  const thresholdMet = state.signed.size >= 2;
  return c.json({ success: true, thresholdMet });
});

const rejectSettingsRoute = createRoute({
  method: "post",
  path: "/groups/{group}/settings/changes/{id}/reject",
  tags: ["Mutations"],
  request: {
    params: groupAndIdParams,
    body: { content: { "application/json": { schema: z.object({ userId: z.string() }) } } },
  },
  responses: {
    200: {
      content: { "application/json": { schema: successOnlySchema } },
      description: "Rejected",
    },
    ...errorResponses,
  },
});

mutations.openapi(rejectSettingsRoute, async (c) => {
  return c.json({ success: true });
});

const getSettingsChangeRoute = createRoute({
  method: "get",
  path: "/groups/{group}/settings/changes/{id}",
  tags: ["Mutations"],
  request: { params: groupAndIdParams },
  responses: {
    200: { content: { "application/json": { schema: z.any() } }, description: "Settings change" },
    ...errorResponses,
  },
});

mutations.openapi(getSettingsChangeRoute, async (c) => {
  const { id } = c.req.valid("param");
  const change = settingsChanges.get(id);
  if (!change) return c.json({ error: "not found" }, 404) as any;
  return c.json(change);
});

// ── Discretionary fund ──────────────────────────────────────────────────

const submitDiscRoute = createRoute({
  method: "post",
  path: "/groups/{group}/discretionary",
  tags: ["Mutations"],
  request: {
    params: z.object({ group: z.string() }),
    body: { content: { "application/json": { schema: z.any() } } },
  },
  responses: {
    200: {
      content: { "application/json": { schema: successOnlySchema } },
      description: "Submitted",
    },
    ...errorResponses,
  },
});

mutations.openapi(submitDiscRoute, async (c) => {
  const { group } = c.req.valid("param");
  const body = c.req.valid("json");
  const n = body.userId ? nameEntry(body.userId) : { name: "Unknown", initials: "??" };
  const review = {
    id: crypto.randomUUID(),
    groupId: group,
    requesterName: n.name,
    requesterInitials: n.initials,
    requesterUserId: body.userId,
    direction: body.direction ?? "deposit",
    amount: body.amount ?? 0,
    category: body.category ?? "",
    paidTo: body.paidTo ?? "",
    reason: body.reason ?? "",
    requestedAt: new Date().toISOString(),
    signatureCount: 1,
    signatureThreshold: 2,
    signatures: [
      {
        userId: body.userId,
        name: n.name,
        initials: n.initials,
        signed: true,
        signedAt: new Date().toISOString(),
      },
    ],
    currentUserAlreadySigned: true,
    currentUserSignedAt: new Date().toISOString(),
  };
  discretionaryReviews.set(review.id, review);
  return c.json({ success: true });
});

const getDiscReviewRoute = createRoute({
  method: "get",
  path: "/groups/{group}/discretionary/{id}",
  tags: ["Mutations"],
  request: { params: groupAndIdParams },
  responses: {
    200: {
      content: { "application/json": { schema: z.any() } },
      description: "Discretionary review",
    },
    ...errorResponses,
  },
});

mutations.openapi(getDiscReviewRoute, async (c) => {
  const { id } = c.req.valid("param");
  const review = discretionaryReviews.get(id);
  if (!review) return c.json({ error: "not found" }, 404) as any;
  return c.json(review);
});

const signDiscRoute = createRoute({
  method: "post",
  path: "/groups/{group}/discretionary/{id}/sign",
  tags: ["Mutations"],
  request: {
    params: groupAndIdParams,
    body: { content: { "application/json": { schema: z.object({ userId: z.string() }) } } },
  },
  responses: {
    200: {
      content: { "application/json": { schema: thresholdResultSchema } },
      description: "Signed",
    },
    ...errorResponses,
  },
});

mutations.openapi(signDiscRoute, async (c) => {
  const { id } = c.req.valid("param");
  const { userId } = c.req.valid("json");
  const key = `disc:${id}`;
  let state = pendingRequests.get(key) ?? { signed: new Set<string>() };
  state.signed.add(userId);
  pendingRequests.set(key, state);
  return c.json({ success: true, thresholdMet: state.signed.size >= 2 });
});

const rejectDiscRoute = createRoute({
  method: "post",
  path: "/groups/{group}/discretionary/{id}/reject",
  tags: ["Mutations"],
  request: {
    params: groupAndIdParams,
    body: { content: { "application/json": { schema: z.object({ userId: z.string() }) } } },
  },
  responses: {
    200: {
      content: { "application/json": { schema: successOnlySchema } },
      description: "Rejected",
    },
    ...errorResponses,
  },
});

mutations.openapi(rejectDiscRoute, async (c) => {
  return c.json({ success: true });
});

// ── Withdrawals ─────────────────────────────────────────────────────────

const initiateWithdrawalRoute = createRoute({
  method: "post",
  path: "/groups/{group}/withdrawals",
  tags: ["Mutations"],
  request: {
    params: z.object({ group: z.string() }),
    body: {
      content: {
        "application/json": {
          schema: z.object({
            memberId: z.string(),
            userId: z.string(),
            reasonCategory: z.string(),
          }),
        },
      },
    },
  },
  responses: {
    200: {
      content: { "application/json": { schema: successWithIdSchema } },
      description: "Withdrawal initiated",
    },
    ...errorResponses,
  },
});

mutations.openapi(initiateWithdrawalRoute, async (c) => {
  const { group } = c.req.valid("param");
  const { memberId, userId: _userId, reasonCategory } = c.req.valid("json");
  const id = crypto.randomUUID();
  const n = nameEntry(memberId);
  const review = {
    id,
    groupId: group,
    memberName: n.name,
    memberInitials: n.initials,
    memberUserId: memberId,
    reasonCategory: reasonCategory ?? "Other",
    contributionRate: "N/A",
    penaltyCount: 0,
    outstandingLoanAmount: null,
    requestedAt: new Date().toISOString(),
    signatureCount: 1,
    signatureThreshold: 2,
    signatures: [],
    currentUserAlreadySigned: false,
  };
  withdrawalReviews.set(id, review);
  return c.json({ success: true, requestId: id });
});

const getWithdrawalReviewRoute = createRoute({
  method: "get",
  path: "/groups/{group}/withdrawals/{id}",
  tags: ["Mutations"],
  request: { params: groupAndIdParams },
  responses: {
    200: { content: { "application/json": { schema: z.any() } }, description: "Withdrawal review" },
    ...errorResponses,
  },
});

mutations.openapi(getWithdrawalReviewRoute, async (c) => {
  const { id } = c.req.valid("param");
  const review = withdrawalReviews.get(id);
  if (!review) return c.json({ error: "not found" }, 404) as any;
  return c.json(review);
});

const signWithdrawalRoute = createRoute({
  method: "post",
  path: "/groups/{group}/withdrawals/{id}/sign",
  tags: ["Mutations"],
  request: {
    params: groupAndIdParams,
    body: { content: { "application/json": { schema: z.object({ userId: z.string() }) } } },
  },
  responses: {
    200: {
      content: { "application/json": { schema: thresholdResultSchema } },
      description: "Signed",
    },
    ...errorResponses,
  },
});

mutations.openapi(signWithdrawalRoute, async (c) => {
  const { id } = c.req.valid("param");
  const { userId } = c.req.valid("json");
  const key = `withdrawal:${id}`;
  let state = pendingRequests.get(key) ?? { signed: new Set<string>() };
  state.signed.add(userId);
  pendingRequests.set(key, state);
  return c.json({ success: true, thresholdMet: state.signed.size >= 2 });
});

const rejectWithdrawalRoute = createRoute({
  method: "post",
  path: "/groups/{group}/withdrawals/{id}/reject",
  tags: ["Mutations"],
  request: {
    params: groupAndIdParams,
    body: { content: { "application/json": { schema: z.object({ userId: z.string() }) } } },
  },
  responses: {
    200: {
      content: { "application/json": { schema: successOnlySchema } },
      description: "Rejected",
    },
    ...errorResponses,
  },
});

mutations.openapi(rejectWithdrawalRoute, async (c) => {
  return c.json({ success: true });
});

// ── Leave / Notifications / Verify Pin ──────────────────────────────────

const leaveGroupRoute = createRoute({
  method: "post",
  path: "/groups/{group}/leave",
  tags: ["Mutations"],
  request: {
    params: z.object({ group: z.string() }),
    body: { content: { "application/json": { schema: z.object({ userId: z.string() }) } } },
  },
  responses: {
    200: {
      content: { "application/json": { schema: successOnlySchema } },
      description: "Left group",
    },
    ...errorResponses,
  },
});

mutations.openapi(leaveGroupRoute, async (c) => {
  return c.json({ success: true });
});

const updateNotificationsRoute = createRoute({
  method: "post",
  path: "/users/notifications",
  tags: ["Mutations"],
  request: {
    body: {
      content: {
        "application/json": { schema: z.object({ userId: z.string(), enabled: z.boolean() }) },
      },
    },
  },
  responses: {
    200: { content: { "application/json": { schema: successOnlySchema } }, description: "Updated" },
    ...errorResponses,
  },
});

mutations.openapi(updateNotificationsRoute, async (c) => {
  return c.json({ success: true });
});

const verifyPinRoute = createRoute({
  method: "post",
  path: "/users/verify-pin",
  tags: ["Mutations"],
  request: {
    body: {
      content: {
        "application/json": { schema: z.object({ userId: z.string(), pin: z.string() }) },
      },
    },
  },
  responses: {
    200: {
      content: { "application/json": { schema: successOnlySchema } },
      description: "Verified",
    },
    ...errorResponses,
  },
});

mutations.openapi(verifyPinRoute, async (c) => {
  return c.json({ success: true });
});

// ── Invite phone ────────────────────────────────────────────────────────

const sendPhoneInviteRoute = createRoute({
  method: "post",
  path: "/groups/{group}/invite/phone",
  tags: ["Mutations"],
  request: {
    params: z.object({ group: z.string() }),
    body: { content: { "application/json": { schema: z.object({ phone: z.string() }) } } },
  },
  responses: {
    200: {
      content: { "application/json": { schema: successOnlySchema } },
      description: "Invite sent",
    },
    ...errorResponses,
  },
});

mutations.openapi(sendPhoneInviteRoute, async (c) => {
  return c.json({ success: true });
});

// ── Join requests ───────────────────────────────────────────────────────

const requestToJoinRoute = createRoute({
  method: "post",
  path: "/groups/join-requests",
  tags: ["Mutations"],
  request: {
    body: {
      content: {
        "application/json": { schema: z.object({ groupId: z.string(), userId: z.string() }) },
      },
    },
  },
  responses: {
    200: { content: { "application/json": { schema: z.any() } }, description: "Request created" },
    ...errorResponses,
  },
});

mutations.openapi(requestToJoinRoute, async (c) => {
  const { groupId, userId } = c.req.valid("json");
  const id = crypto.randomUUID();
  const req = { id, groupId, userId, status: "pending", requestedAt: new Date().toISOString() };
  pendingRequests.set(id, req);
  return c.json(req);
});

const cancelJoinRequestRoute = createRoute({
  method: "delete",
  path: "/groups/join-requests/{id}",
  tags: ["Mutations"],
  request: { params: z.object({ id: z.string() }) },
  responses: {
    200: {
      content: { "application/json": { schema: successOnlySchema } },
      description: "Cancelled",
    },
    ...errorResponses,
  },
});

mutations.openapi(cancelJoinRequestRoute, async (c) => {
  const { id } = c.req.valid("param");
  pendingRequests.delete(id);
  return c.json({ success: true });
});

const getJoinReviewRoute = createRoute({
  method: "get",
  path: "/groups/{group}/join-requests/{id}",
  tags: ["Mutations"],
  request: { params: groupAndIdParams },
  responses: {
    200: {
      content: { "application/json": { schema: z.any() } },
      description: "Join request review",
    },
    ...errorResponses,
  },
});

mutations.openapi(getJoinReviewRoute, async (c) => {
  const { group, id } = c.req.valid("param");
  const review = joinRequestReviews.get(id);
  if (review) return c.json(review);
  return c.json({
    id,
    groupId: group,
    applicantName: "Applicant",
    applicantInitials: "AP",
    applicantPhone: "",
    joinMethod: "invite_code" as const,
    requestedAt: new Date().toISOString(),
    signatureCount: 0,
    signatureThreshold: 2,
    signatures: [],
    currentUserAlreadySigned: false,
  });
});

const signJoinRoute = createRoute({
  method: "post",
  path: "/groups/{group}/join-requests/{id}/sign",
  tags: ["Mutations"],
  request: {
    params: groupAndIdParams,
    body: { content: { "application/json": { schema: z.object({ userId: z.string() }) } } },
  },
  responses: {
    200: {
      content: { "application/json": { schema: thresholdResultSchema } },
      description: "Signed",
    },
    ...errorResponses,
  },
});

mutations.openapi(signJoinRoute, async (c) => {
  const { id } = c.req.valid("param");
  const { userId } = c.req.valid("json");
  const key = `join:${id}`;
  let state = pendingRequests.get(key) ?? { signed: new Set<string>() };
  state.signed.add(userId);
  pendingRequests.set(key, state);
  return c.json({ success: true, thresholdMet: state.signed.size >= 2 });
});

const rejectJoinRoute = createRoute({
  method: "post",
  path: "/groups/{group}/join-requests/{id}/reject",
  tags: ["Mutations"],
  request: {
    params: groupAndIdParams,
    body: { content: { "application/json": { schema: z.object({ userId: z.string() }) } } },
  },
  responses: {
    200: {
      content: { "application/json": { schema: successOnlySchema } },
      description: "Rejected",
    },
    ...errorResponses,
  },
});

mutations.openapi(rejectJoinRoute, async (c) => {
  return c.json({ success: true });
});

// ── Join by invite code ─────────────────────────────────────────────────

const joinByCodeRoute = createRoute({
  method: "post",
  path: "/groups/join-by-code",
  tags: ["Mutations"],
  request: {
    body: {
      content: {
        "application/json": { schema: z.object({ code: z.string(), userId: z.string() }) },
      },
    },
  },
  responses: {
    200: { content: { "application/json": { schema: z.any() } }, description: "Joined" },
    ...errorResponses,
  },
});

mutations.openapi(joinByCodeRoute, async (c) => {
  const { code } = c.req.valid("json");
  const { groupMeta } = await import("../lib/store.js");
  const meta = Array.from(groupMeta.values()).find((g: any) => g.inviteCode === code);
  if (!meta) return c.json({ error: "not found" }, 404) as any;
  return c.json({ group: meta.address, success: true });
});

// ── Create group ────────────────────────────────────────────────────────

const createGroupRoute = createRoute({
  method: "post",
  path: "/groups",
  tags: ["Mutations"],
  request: {
    body: { content: { "application/json": { schema: z.any() } } },
  },
  responses: {
    200: { content: { "application/json": { schema: successOnlySchema } }, description: "Created" },
    ...errorResponses,
  },
});

mutations.openapi(createGroupRoute, async (c) => {
  return c.json({ success: true });
});

// ── Retry transaction ───────────────────────────────────────────────────

const retryTxRoute = createRoute({
  method: "post",
  path: "/groups/{group}/transactions/{id}/retry",
  tags: ["Mutations"],
  request: { params: groupAndIdParams },
  responses: {
    200: { content: { "application/json": { schema: successOnlySchema } }, description: "Retried" },
    ...errorResponses,
  },
});

mutations.openapi(retryTxRoute, async (c) => {
  return c.json({ success: true });
});

export default mutations;
