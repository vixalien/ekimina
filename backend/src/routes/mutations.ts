import crypto from "crypto";

import type { Address, GroupSettingField } from "@ekimina/types";

import { getFactoryContract, factoryABI } from "@ekimina/contracts";
import { createRoute, OpenAPIHono, z } from "@hono/zod-openapi";
import { verify } from "hono/jwt";
import { keccak256, parseEventLogs, toHex } from "viem";

import { publicClient, walletClient } from "../lib/chain.js";
import * as contract from "../lib/contract-data.js";
import { getFactoryAddress } from "../lib/indexer.js";
import { nameOf } from "../lib/name-resolver.js";
import {
  errorResponses,
  successOnlySchema,
  successWithIdSchema,
  thresholdResultSchema,
} from "../lib/schemas.js";
import {
  upsertSigningState,
  getSettingsChange,
  createSettingsChange,
  upsertReview,
  getReview,
  createJoinRequest,
  deleteJoinRequest,
  getGroupMetaByInviteCode,
  upsertGroupMeta,
  JWT_SECRET,
} from "../lib/store.js";

function nameEntry(key: string): { name: string; initials: string } {
  return nameOf(key);
}

function generateInviteCode(): string {
  return crypto.randomBytes(4).toString("hex").toUpperCase().slice(0, 6);
}

const groupAndIdParams = z.object({ group: z.string(), id: z.string() });

// ── Loan sign / reject ──────────────────────────────────────────────────

const signLoanRoute = createRoute({
  method: "post",
  path: "/groups/{group}/loans/{id}/sign",
  tags: ["Mutations"],
  request: {
    params: groupAndIdParams,
    body: {
      content: {
        "application/json": { schema: z.object({ userId: z.string() }) },
      },
    },
  },
  responses: {
    200: {
      content: { "application/json": { schema: thresholdResultSchema } },
      description: "Signed",
    },
    ...errorResponses,
  },
});

const rejectLoanRoute = createRoute({
  method: "post",
  path: "/groups/{group}/loans/{id}/reject",
  tags: ["Mutations"],
  request: {
    params: groupAndIdParams,
    body: {
      content: {
        "application/json": { schema: z.object({ userId: z.string() }) },
      },
    },
  },
  responses: {
    200: {
      content: { "application/json": { schema: successOnlySchema } },
      description: "Rejected",
    },
    ...errorResponses,
  },
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
          schema: z.object({
            field: z.string(),
            proposedValue: z.string(),
            userId: z.string(),
          }),
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

const signSettingsRoute = createRoute({
  method: "post",
  path: "/groups/{group}/settings/changes/{id}/sign",
  tags: ["Mutations"],
  request: {
    params: groupAndIdParams,
    body: {
      content: {
        "application/json": { schema: z.object({ userId: z.string() }) },
      },
    },
  },
  responses: {
    200: {
      content: { "application/json": { schema: thresholdResultSchema } },
      description: "Signed",
    },
    ...errorResponses,
  },
});

const rejectSettingsRoute = createRoute({
  method: "post",
  path: "/groups/{group}/settings/changes/{id}/reject",
  tags: ["Mutations"],
  request: {
    params: groupAndIdParams,
    body: {
      content: {
        "application/json": { schema: z.object({ userId: z.string() }) },
      },
    },
  },
  responses: {
    200: {
      content: { "application/json": { schema: successOnlySchema } },
      description: "Rejected",
    },
    ...errorResponses,
  },
});

const getSettingsChangeRoute = createRoute({
  method: "get",
  path: "/groups/{group}/settings/changes/{id}",
  tags: ["Mutations"],
  request: { params: groupAndIdParams },
  responses: {
    200: {
      content: { "application/json": { schema: z.any() } },
      description: "Settings change",
    },
    ...errorResponses,
  },
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

const signDiscRoute = createRoute({
  method: "post",
  path: "/groups/{group}/discretionary/{id}/sign",
  tags: ["Mutations"],
  request: {
    params: groupAndIdParams,
    body: {
      content: {
        "application/json": { schema: z.object({ userId: z.string() }) },
      },
    },
  },
  responses: {
    200: {
      content: { "application/json": { schema: thresholdResultSchema } },
      description: "Signed",
    },
    ...errorResponses,
  },
});

const rejectDiscRoute = createRoute({
  method: "post",
  path: "/groups/{group}/discretionary/{id}/reject",
  tags: ["Mutations"],
  request: {
    params: groupAndIdParams,
    body: {
      content: {
        "application/json": { schema: z.object({ userId: z.string() }) },
      },
    },
  },
  responses: {
    200: {
      content: { "application/json": { schema: successOnlySchema } },
      description: "Rejected",
    },
    ...errorResponses,
  },
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

const getWithdrawalReviewRoute = createRoute({
  method: "get",
  path: "/groups/{group}/withdrawals/{id}",
  tags: ["Mutations"],
  request: { params: groupAndIdParams },
  responses: {
    200: {
      content: { "application/json": { schema: z.any() } },
      description: "Withdrawal review",
    },
    ...errorResponses,
  },
});

const signWithdrawalRoute = createRoute({
  method: "post",
  path: "/groups/{group}/withdrawals/{id}/sign",
  tags: ["Mutations"],
  request: {
    params: groupAndIdParams,
    body: {
      content: {
        "application/json": { schema: z.object({ userId: z.string() }) },
      },
    },
  },
  responses: {
    200: {
      content: { "application/json": { schema: thresholdResultSchema } },
      description: "Signed",
    },
    ...errorResponses,
  },
});

const rejectWithdrawalRoute = createRoute({
  method: "post",
  path: "/groups/{group}/withdrawals/{id}/reject",
  tags: ["Mutations"],
  request: {
    params: groupAndIdParams,
    body: {
      content: {
        "application/json": { schema: z.object({ userId: z.string() }) },
      },
    },
  },
  responses: {
    200: {
      content: { "application/json": { schema: successOnlySchema } },
      description: "Rejected",
    },
    ...errorResponses,
  },
});

// ── Leave / Notifications / Verify Pin ──────────────────────────────────

const leaveGroupRoute = createRoute({
  method: "post",
  path: "/groups/{group}/leave",
  tags: ["Mutations"],
  request: {
    params: z.object({ group: z.string() }),
    body: {
      content: {
        "application/json": { schema: z.object({ userId: z.string() }) },
      },
    },
  },
  responses: {
    200: {
      content: { "application/json": { schema: successOnlySchema } },
      description: "Left group",
    },
    ...errorResponses,
  },
});

const updateNotificationsRoute = createRoute({
  method: "post",
  path: "/users/notifications",
  tags: ["Mutations"],
  request: {
    body: {
      content: {
        "application/json": {
          schema: z.object({ userId: z.string(), enabled: z.boolean() }),
        },
      },
    },
  },
  responses: {
    200: {
      content: { "application/json": { schema: successOnlySchema } },
      description: "Updated",
    },
    ...errorResponses,
  },
});

// ── Invite phone ────────────────────────────────────────────────────────

const sendPhoneInviteRoute = createRoute({
  method: "post",
  path: "/groups/{group}/invite/phone",
  tags: ["Mutations"],
  request: {
    params: z.object({ group: z.string() }),
    body: {
      content: {
        "application/json": { schema: z.object({ phone: z.string() }) },
      },
    },
  },
  responses: {
    200: {
      content: { "application/json": { schema: successOnlySchema } },
      description: "Invite sent",
    },
    ...errorResponses,
  },
});

// ── Join requests ───────────────────────────────────────────────────────

const requestToJoinRoute = createRoute({
  method: "post",
  path: "/groups/join-requests",
  tags: ["Mutations"],
  request: {
    body: {
      content: {
        "application/json": {
          schema: z.object({ groupId: z.string(), userId: z.string() }),
        },
      },
    },
  },
  responses: {
    200: {
      content: { "application/json": { schema: z.any() } },
      description: "Request created",
    },
    ...errorResponses,
  },
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

const signJoinRoute = createRoute({
  method: "post",
  path: "/groups/{group}/join-requests/{id}/sign",
  tags: ["Mutations"],
  request: {
    params: groupAndIdParams,
    body: {
      content: {
        "application/json": { schema: z.object({ userId: z.string() }) },
      },
    },
  },
  responses: {
    200: {
      content: { "application/json": { schema: thresholdResultSchema } },
      description: "Signed",
    },
    ...errorResponses,
  },
});

const rejectJoinRoute = createRoute({
  method: "post",
  path: "/groups/{group}/join-requests/{id}/reject",
  tags: ["Mutations"],
  request: {
    params: groupAndIdParams,
    body: {
      content: {
        "application/json": { schema: z.object({ userId: z.string() }) },
      },
    },
  },
  responses: {
    200: {
      content: { "application/json": { schema: successOnlySchema } },
      description: "Rejected",
    },
    ...errorResponses,
  },
});

// ── Join by invite code ─────────────────────────────────────────────────

const joinByCodeRoute = createRoute({
  method: "post",
  path: "/groups/join-by-code",
  tags: ["Mutations"],
  request: {
    body: {
      content: {
        "application/json": {
          schema: z.object({ code: z.string(), userId: z.string() }),
        },
      },
    },
  },
  responses: {
    200: {
      content: { "application/json": { schema: z.any() } },
      description: "Joined",
    },
    ...errorResponses,
  },
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
    200: {
      content: { "application/json": { schema: successOnlySchema } },
      description: "Created",
    },
    ...errorResponses,
  },
});

// ── Retry transaction ───────────────────────────────────────────────────

const retryTxRoute = createRoute({
  method: "post",
  path: "/groups/{group}/transactions/{id}/retry",
  tags: ["Mutations"],
  request: { params: groupAndIdParams },
  responses: {
    200: {
      content: { "application/json": { schema: successOnlySchema } },
      description: "Retried",
    },
    ...errorResponses,
  },
});

export default new OpenAPIHono()
  .openapi(signLoanRoute, async (c) => {
    const { group, id } = c.req.valid("param");
    const { userId } = c.req.valid("json");
    const loan = await contract.getLoanDetail(group as Address, id);
    // oxlint-disable-next-line typescript/no-explicit-any
    if (!loan) return c.json({ error: "not found" }, 404);

    const key = `loan:${id}`;
    const state = await upsertSigningState(key, userId);

    return c.json({ success: true, thresholdMet: state.signedBy.length >= 2 });
  })
  .openapi(rejectLoanRoute, async (c) => {
    const { group, id } = c.req.valid("param");
    const loan = await contract.getLoanDetail(group as Address, id);
    // oxlint-disable-next-line typescript/no-explicit-any
    if (!loan) return c.json({ error: "not found" }, 404);
    return c.json({ success: true });
  })
  .openapi(submitSettingsRoute, async (c) => {
    const { group } = c.req.valid("param");
    const { field, proposedValue, userId } = c.req.valid("json");
    const n = nameEntry(userId);
    const change = {
      id: crypto.randomUUID(),
      groupId: group,
      field: field as GroupSettingField,
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
    await createSettingsChange(change);
    return c.json({ success: true });
  })
  .openapi(signSettingsRoute, async (c) => {
    const { id } = c.req.valid("param");
    const { userId } = c.req.valid("json");
    const change = await getSettingsChange(id);
    // oxlint-disable-next-line typescript/no-explicit-any
    if (!change) return c.json({ error: "not found" }, 404);

    const key = `settings:${id}`;
    const state = await upsertSigningState(key, userId);

    const thresholdMet = state.signedBy.length >= 2;
    return c.json({ success: true, thresholdMet });
  })
  .openapi(rejectSettingsRoute, async (c) => {
    return c.json({ success: true });
  })
  .openapi(getSettingsChangeRoute, async (c) => {
    const { id } = c.req.valid("param");
    const change = await getSettingsChange(id);
    // oxlint-disable-next-line typescript/no-explicit-any
    if (!change) return c.json({ error: "not found" }, 404);
    return c.json(change);
  })
  .openapi(submitDiscRoute, async (c) => {
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
    await upsertReview({
      id: review.id,
      type: "discretionary",
      groupId: group,
      data: review,
      createdAt: new Date().toISOString(),
    });
    return c.json({ success: true });
  })
  .openapi(getDiscReviewRoute, async (c) => {
    const { id } = c.req.valid("param");
    const review = await getReview(id);
    // oxlint-disable-next-line typescript/no-explicit-any
    if (!review) return c.json({ error: "not found" }, 404);
    return c.json(review.data);
  })
  .openapi(signDiscRoute, async (c) => {
    const { id } = c.req.valid("param");
    const { userId } = c.req.valid("json");
    const key = `disc:${id}`;
    const state = await upsertSigningState(key, userId);
    return c.json({ success: true, thresholdMet: state.signedBy.length >= 2 });
  })
  .openapi(rejectDiscRoute, async (c) => {
    return c.json({ success: true });
  })
  .openapi(initiateWithdrawalRoute, async (c) => {
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
    await upsertReview({
      id: review.id,
      type: "withdrawal",
      groupId: group,
      data: review,
      createdAt: new Date().toISOString(),
    });
    return c.json({ success: true, requestId: id });
  })
  .openapi(getWithdrawalReviewRoute, async (c) => {
    const { id } = c.req.valid("param");
    const review = await getReview(id);
    // oxlint-disable-next-line typescript/no-explicit-any
    if (!review) return c.json({ error: "not found" }, 404);
    return c.json(review.data);
  })
  .openapi(signWithdrawalRoute, async (c) => {
    const { id } = c.req.valid("param");
    const { userId } = c.req.valid("json");
    const key = `withdrawal:${id}`;
    const state = await upsertSigningState(key, userId);
    return c.json({ success: true, thresholdMet: state.signedBy.length >= 2 });
  })
  .openapi(rejectWithdrawalRoute, async (c) => {
    return c.json({ success: true });
  })
  .openapi(leaveGroupRoute, async (_c) => {
    // oxlint-disable-next-line typescript/no-explicit-any
    return c.json({ error: "not implemented" }, 501);
  })
  .openapi(updateNotificationsRoute, async (c) => {
    return c.json({ success: true });
  })
  .openapi(sendPhoneInviteRoute, async (_c) => {
    // oxlint-disable-next-line typescript/no-explicit-any
    return c.json({ error: "not implemented" }, 501);
  })
  .openapi(requestToJoinRoute, async (c) => {
    const { groupId, userId } = c.req.valid("json");
    const id = crypto.randomUUID();
    const req = {
      id,
      groupId,
      userId,
      status: "pending" as const,
      requestedAt: new Date().toISOString(),
    };
    await createJoinRequest(req);
    return c.json(req);
  })
  .openapi(cancelJoinRequestRoute, async (c) => {
    const { id } = c.req.valid("param");
    await deleteJoinRequest(id);
    return c.json({ success: true });
  })
  .openapi(getJoinReviewRoute, async (c) => {
    const { group, id } = c.req.valid("param");
    const review = await getReview(id);
    if (review) return c.json(review.data);
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
  })
  .openapi(signJoinRoute, async (c) => {
    const { id } = c.req.valid("param");
    const { userId } = c.req.valid("json");
    const key = `join:${id}`;
    const state = await upsertSigningState(key, userId);
    return c.json({ success: true, thresholdMet: state.signedBy.length >= 2 });
  })
  .openapi(rejectJoinRoute, async (c) => {
    return c.json({ success: true });
  })
  .openapi(joinByCodeRoute, async (c) => {
    const { code } = c.req.valid("json");
    const meta = await getGroupMetaByInviteCode(code);
    // oxlint-disable-next-line typescript/no-explicit-any
    if (!meta) return c.json({ error: "not found" }, 404);
    return c.json({ group: meta.address, success: true });
  })
  .openapi(createGroupRoute, async (c) => {
    const authHeader = c.req.header("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return c.json({ error: "unauthorized" }, 401);
    }
    try {
      await verify(authHeader.slice(7), JWT_SECRET, "HS256");
    } catch {
      return c.json({ error: "unauthorized" }, 401);
    }

    const body = c.req.valid("json") as { name?: string };
    const name = body?.name ?? "My Group";
    const factoryAddr = getFactoryAddress();
    if (!factoryAddr) return c.json({ error: "factory not available" }, 500);

    const factory = getFactoryContract(factoryAddr, {
      public: publicClient,
      wallet: walletClient,
    });

    const inviteCode = generateInviteCode();
    const inviteCodeHash = keccak256(toHex(inviteCode));

    const config = [
      10000000000000000000n,
      2592000n,
      50000000000000000000n,
      1,
      500,
      6000,
      true,
      true,
      false,
    ];

    try {
      // oxlint-disable-next-line typescript/no-explicit-any
      const hash = await (factory as any).write.createGroup([config, inviteCodeHash]);
      const receipt = await publicClient.waitForTransactionReceipt({ hash });

      const logs = parseEventLogs({
        abi: factoryABI,
        logs: receipt.logs,
        eventName: "GroupDeployed",
      });
      const groupAddr = logs[0]?.args.group as Address | undefined;
      if (!groupAddr) return c.json({ error: "failed to get group address" }, 500);

      await upsertGroupMeta({
        address: groupAddr,
        name,
        inviteCode,
        // oxlint-disable-next-line typescript/no-explicit-any
        creator: (walletClient as any).account.address as Address,
        createdAt: new Date().toISOString(),
      });

      return c.json({ success: true, group: groupAddr });
    } catch (e) {
      console.error("[createGroup]", e);
      return c.json({ error: "failed to create group" }, 500);
    }
  })
  .openapi(retryTxRoute, async (c) => {
    return c.json({ success: true });
  });
