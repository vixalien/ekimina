import type { Address } from "@ekimina/types";

import { createRoute, OpenAPIHono, z } from "@hono/zod-openapi";

import * as contract from "../lib/contract-data.js";
import * as eventIndexer from "../lib/event-indexer.js";
import {
  committeeMemberSchema,
  dashboardSchema,
  errorResponses,
  groupSettingsSchema,
  inviteDataSchema,
  leaveGroupInfoSchema,
  loanReviewSchema,
  memberDetailSchema,
  memberListItemSchema,
  pendingRequestSchema,
  reserveDetailSchema,
  transactionSchema,
  userProfileSchema,
} from "../lib/schemas.js";

const dashboardRoute = createRoute({
  method: "get",
  path: "/groups/{group}/dashboard",
  tags: ["Groups"],
  request: { params: z.object({ group: z.string() }) },
  responses: {
    200: {
      content: { "application/json": { schema: dashboardSchema } },
      description: "Dashboard",
    },
    ...errorResponses,
  },
});

const membersRoute = createRoute({
  method: "get",
  path: "/groups/{group}/members",
  tags: ["Groups"],
  request: {
    params: z.object({ group: z.string() }),
    query: z.object({ q: z.string().optional() }),
  },
  responses: {
    200: {
      content: { "application/json": { schema: z.array(memberListItemSchema) } },
      description: "Members",
    },
    ...errorResponses,
  },
});

const memberDetailRoute = createRoute({
  method: "get",
  path: "/groups/{group}/members/{userId}",
  tags: ["Groups"],
  request: { params: z.object({ group: z.string(), userId: z.string() }) },
  responses: {
    200: {
      content: { "application/json": { schema: memberDetailSchema } },
      description: "Member detail",
    },
    ...errorResponses,
  },
});

const pendingRoute = createRoute({
  method: "get",
  path: "/groups/{group}/pending",
  tags: ["Groups"],
  request: { params: z.object({ group: z.string() }) },
  responses: {
    200: {
      content: { "application/json": { schema: z.array(pendingRequestSchema) } },
      description: "Pending requests",
    },
    ...errorResponses,
  },
});

const transactionsRoute = createRoute({
  method: "get",
  path: "/groups/{group}/transactions",
  tags: ["Groups"],
  request: {
    params: z.object({ group: z.string() }),
    query: z.object({
      limit: z.string().optional(),
      type: z.string().optional(),
      member: z.string().optional(),
      cycle: z.string().optional(),
      preset: z.string().optional(),
    }),
  },
  responses: {
    200: {
      content: { "application/json": { schema: z.array(transactionSchema) } },
      description: "Transactions",
    },
    ...errorResponses,
  },
});

const transactionDetailRoute = createRoute({
  method: "get",
  path: "/groups/{group}/transactions/{id}",
  tags: ["Groups"],
  request: { params: z.object({ group: z.string(), id: z.string() }) },
  responses: {
    200: {
      content: { "application/json": { schema: transactionSchema } },
      description: "Transaction detail",
    },
    ...errorResponses,
  },
});

const loansRoute = createRoute({
  method: "get",
  path: "/groups/{group}/loans",
  tags: ["Groups"],
  request: {
    params: z.object({ group: z.string() }),
    query: z.object({
      state: z.string().optional(),
      borrower: z.string().optional(),
    }),
  },
  responses: {
    200: {
      content: { "application/json": { schema: z.any() } },
      description: "Loans",
    },
    ...errorResponses,
  },
});

const loanDetailRoute = createRoute({
  method: "get",
  path: "/groups/{group}/loans/{id}",
  tags: ["Groups"],
  request: { params: z.object({ group: z.string(), id: z.string() }) },
  responses: {
    200: {
      content: { "application/json": { schema: z.any() } },
      description: "Loan detail",
    },
    ...errorResponses,
  },
});

const loanReviewRoute = createRoute({
  method: "get",
  path: "/groups/{group}/loans/{id}/review",
  tags: ["Groups"],
  request: {
    params: z.object({ group: z.string(), id: z.string() }),
    query: z.object({ userId: z.string().optional() }),
  },
  responses: {
    200: {
      content: { "application/json": { schema: loanReviewSchema } },
      description: "Loan review",
    },
    ...errorResponses,
  },
});

const committeeRoute = createRoute({
  method: "get",
  path: "/groups/{group}/committee",
  tags: ["Groups"],
  request: { params: z.object({ group: z.string() }) },
  responses: {
    200: {
      content: { "application/json": { schema: z.array(committeeMemberSchema) } },
      description: "Committee",
    },
    ...errorResponses,
  },
});

const userProfileRoute = createRoute({
  method: "get",
  path: "/groups/{group}/users/{userId}",
  tags: ["Groups"],
  request: { params: z.object({ group: z.string(), userId: z.string() }) },
  responses: {
    200: {
      content: { "application/json": { schema: userProfileSchema } },
      description: "User profile",
    },
    ...errorResponses,
  },
});

const settingsRoute = createRoute({
  method: "get",
  path: "/groups/{group}/settings",
  tags: ["Groups"],
  request: { params: z.object({ group: z.string() }) },
  responses: {
    200: {
      content: { "application/json": { schema: groupSettingsSchema } },
      description: "Group settings",
    },
    ...errorResponses,
  },
});

const inviteRoute = createRoute({
  method: "get",
  path: "/groups/{group}/invite",
  tags: ["Groups"],
  request: { params: z.object({ group: z.string() }) },
  responses: {
    200: {
      content: { "application/json": { schema: inviteDataSchema } },
      description: "Invite data",
    },
    ...errorResponses,
  },
});

const reserveRoute = createRoute({
  method: "get",
  path: "/groups/{group}/reserve",
  tags: ["Groups"],
  request: { params: z.object({ group: z.string() }) },
  responses: {
    200: {
      content: { "application/json": { schema: reserveDetailSchema } },
      description: "Reserve detail",
    },
    ...errorResponses,
  },
});

const leaveInfoRoute = createRoute({
  method: "get",
  path: "/groups/{group}/leave-info",
  tags: ["Groups"],
  request: {
    params: z.object({ group: z.string() }),
    query: z.object({ userId: z.string() }),
  },
  responses: {
    200: {
      content: { "application/json": { schema: leaveGroupInfoSchema } },
      description: "Leave info",
    },
    ...errorResponses,
  },
});

const proposalsRoute = createRoute({
  method: "get",
  path: "/groups/{group}/proposals",
  tags: ["Groups"],
  request: {
    params: z.object({ group: z.string() }),
    query: z.object({ state: z.string().optional() }),
  },
  responses: {
    200: {
      content: { "application/json": { schema: z.any() } },
      description: "Proposals",
    },
    ...errorResponses,
  },
});

const proposalDetailRoute = createRoute({
  method: "get",
  path: "/groups/{group}/proposals/{id}",
  tags: ["Groups"],
  request: { params: z.object({ group: z.string(), id: z.string() }) },
  responses: {
    200: {
      content: { "application/json": { schema: z.any() } },
      description: "Proposal detail",
    },
    ...errorResponses,
  },
});

const publicGroupsRoute = createRoute({
  method: "get",
  path: "/groups/public",
  tags: ["Groups"],
  request: { query: z.object({ q: z.string().optional() }) },
  responses: {
    200: {
      content: { "application/json": { schema: z.any() } },
      description: "Public groups",
    },
  },
});

export default new OpenAPIHono()
  .openapi(dashboardRoute, async (c) => {
    const { group } = c.req.valid("param");
    const data = await contract.getDashboard(group as Address);
    if (!data) return c.json({ error: "not found" }, 404) as never;
    return c.json(data);
  })
  .openapi(membersRoute, async (c) => {
    const { group } = c.req.valid("param");
    const { q } = c.req.valid("query");
    const data = await contract.getMembers(group as Address, q);
    return c.json(data ?? []);
  })
  .openapi(memberDetailRoute, async (c) => {
    const { group, userId } = c.req.valid("param");
    const data = await contract.getMemberDetail(group as Address, userId);
    if (!data) return c.json({ error: "not found" }, 404) as never;
    return c.json(data);
  })
  .openapi(pendingRoute, async (c) => {
    const { group } = c.req.valid("param");
    const data = await contract.getPendingRequests(group as Address);
    return c.json(data);
  })
  .openapi(transactionsRoute, async (c) => {
    const { group } = c.req.valid("param");
    const data = await eventIndexer.getTransactions(group as Address);
    return c.json(data);
  })
  .openapi(transactionDetailRoute, async (c) => {
    const { group, id } = c.req.valid("param");
    const data = await eventIndexer.getTransactionDetail(group as Address, id);
    if (!data) return c.json({ error: "not found" }, 404) as never;
    return c.json(data);
  })
  .openapi(loansRoute, async (c) => {
    const { group } = c.req.valid("param");
    const data = await contract.getLoans(group as Address);
    return c.json(data);
  })
  .openapi(loanDetailRoute, async (c) => {
    const { group, id } = c.req.valid("param");
    const data = await contract.getLoanDetail(group as Address, id);
    if (!data) return c.json({ error: "not found" }, 404) as never;
    return c.json(data);
  })
  .openapi(loanReviewRoute, async (c) => {
    const { group, id } = c.req.valid("param");
    const { userId } = c.req.valid("query");
    const data = await contract.getLoanReview(group as Address, id, userId);
    if (!data) return c.json({ error: "not found" }, 404) as never;
    return c.json(data);
  })
  .openapi(committeeRoute, async (c) => {
    const { group } = c.req.valid("param");
    return c.json(await contract.getCommittee(group as Address));
  })
  .openapi(userProfileRoute, async (c) => {
    const { group, userId } = c.req.valid("param");
    const data = await contract.getUserProfile(group as Address, userId);
    if (!data) return c.json({ error: "not found" }, 404) as never;
    return c.json(data);
  })
  .openapi(settingsRoute, async (c) => {
    const { group } = c.req.valid("param");
    return c.json(await contract.getSettings(group as Address));
  })
  .openapi(inviteRoute, async (c) => {
    const { group } = c.req.valid("param");
    return c.json(await contract.getInviteData(group as Address));
  })
  .openapi(reserveRoute, async (c) => {
    const { group } = c.req.valid("param");
    return c.json(await contract.getReserveDetail(group as Address));
  })
  .openapi(leaveInfoRoute, async (c) => {
    const { group } = c.req.valid("param");
    const { userId } = c.req.valid("query");
    return c.json(await contract.getLeaveInfo(group as Address, userId));
  })
  .openapi(proposalsRoute, async (c) => {
    const { group } = c.req.valid("param");
    return c.json(await contract.getProposals(group as Address));
  })
  .openapi(proposalDetailRoute, async (c) => {
    const { group, id } = c.req.valid("param");
    const data = await contract.getProposalDetail(group as Address, id);
    if (!data) return c.json({ error: "not found" }, 404) as never;
    return c.json(data);
  })
  .openapi(publicGroupsRoute, async (c) => {
    const publicGroups = await contract.getPublicGroups();
    return c.json(publicGroups);
  });
