import { createRoute, OpenAPIHono, z } from "@hono/zod-openapi";
import { addressSchema, errorResponses, groupMetaSchema } from "../lib/schemas.js";
import {
  dashboardSchema,
  memberListItemSchema,
  memberDetailSchema,
  pendingRequestSchema,
  outstandingLoanSchema,
  transactionSchema,
  loanDetailSchema,
  loanReviewSchema,
  groupSettingsSchema,
  committeeMemberSchema,
  userProfileSchema,
  settingsChangeSchema,
  inviteDataSchema,
  reserveDetailSchema,
  leaveGroupInfoSchema,
} from "../lib/schemas.js";
import {
  getMockData,
  getGroupDashboard,
  getGroupMembers,
  getMemberDetail,
  getTransactionDetailMock,
  getLoanDetailMock,
  getLoanReviewMock,
  getCommittee,
  getUserProfile,
  getInviteDataMock,
  getReserveDetailMock,
  getLeaveGroupInfoMock,
} from "../lib/mock-data.js";
import { groupMeta } from "../lib/store.js";

const groups = new OpenAPIHono();

const dashboardRoute = createRoute({
  method: "get",
  path: "/groups/{group}/dashboard",
  tags: ["Groups"],
  request: { params: z.object({ group: z.string() }) },
  responses: {
    200: { content: { "application/json": { schema: dashboardSchema } }, description: "Dashboard" },
    ...errorResponses,
  },
});

groups.openapi(dashboardRoute, async (c) => {
  const { group } = c.req.valid("param");
  const data = getGroupDashboard(group);
  if (!data) return c.json({ error: "not found" }, 404) as any;
  return c.json(data);
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
    200: { content: { "application/json": { schema: z.array(memberListItemSchema) } }, description: "Members" },
    ...errorResponses,
  },
});

groups.openapi(membersRoute, async (c) => {
  const { group } = c.req.valid("param");
  const { q } = c.req.valid("query");
  const data = getGroupMembers(group, q);
  if (!data) return c.json({ error: "not found" }, 404) as any;
  return c.json(data);
});

const memberDetailRoute = createRoute({
  method: "get",
  path: "/groups/{group}/members/{userId}",
  tags: ["Groups"],
  request: { params: z.object({ group: z.string(), userId: z.string() }) },
  responses: {
    200: { content: { "application/json": { schema: memberDetailSchema } }, description: "Member detail" },
    ...errorResponses,
  },
});

groups.openapi(memberDetailRoute, async (c) => {
  const { group, userId } = c.req.valid("param");
  const data = getMemberDetail(group, userId);
  if (!data) return c.json({ error: "not found" }, 404) as any;
  return c.json(data);
});

const pendingRoute = createRoute({
  method: "get",
  path: "/groups/{group}/pending",
  tags: ["Groups"],
  request: { params: z.object({ group: z.string() }) },
  responses: {
    200: { content: { "application/json": { schema: z.array(pendingRequestSchema) } }, description: "Pending requests" },
    ...errorResponses,
  },
});

groups.openapi(pendingRoute, async (c) => {
  const { group } = c.req.valid("param");
  const data = getMockData(group);
  if (!data) return c.json({ error: "not found" }, 404) as any;
  return c.json(data.pending ?? []);
});

const transactionsRoute = createRoute({
  method: "get",
  path: "/groups/{group}/transactions",
  tags: ["Groups"],
  request: {
    params: z.object({ group: z.string() }),
    query: z.object({
      type: z.string().optional(),
      member: z.string().optional(),
      cycle: z.string().optional(),
      preset: z.string().optional(),
      limit: z.string().optional(),
    }),
  },
  responses: {
    200: { content: { "application/json": { schema: z.array(transactionSchema) } }, description: "Transactions" },
    ...errorResponses,
  },
});

groups.openapi(transactionsRoute, async (c) => {
  const { group } = c.req.valid("param");
  const q = c.req.valid("query");
  const data = getMockData(group);
  if (!data) return c.json({ error: "not found" }, 404) as any;
  let txs = [...(data.transactions ?? [])];
  if (q.type) txs = txs.filter((t: any) => t.type === q.type);
  if (q.member) txs = txs.filter((t: any) => t.memberId === q.member);
  if (q.cycle) txs = txs.filter((t: any) => t.cycle === Number(q.cycle));
  if (q.preset === "this_week") {
    const weekAgo = new Date(Date.now() - 7 * 86400000).toISOString();
    txs = txs.filter((t: any) => t.timestamp >= weekAgo);
  } else if (q.preset === "this_month") {
    const monthAgo = new Date(Date.now() - 30 * 86400000).toISOString();
    txs = txs.filter((t: any) => t.timestamp >= monthAgo);
  } else if (q.preset === "last_30") {
    const monthAgo = new Date(Date.now() - 30 * 86400000).toISOString();
    txs = txs.filter((t: any) => t.timestamp >= monthAgo);
  }
  if (q.limit) txs = txs.slice(0, Number(q.limit));
  return c.json(txs);
});

const transactionDetailRoute = createRoute({
  method: "get",
  path: "/groups/{group}/transactions/{id}",
  tags: ["Groups"],
  request: { params: z.object({ group: z.string(), id: z.string() }) },
  responses: {
    200: { content: { "application/json": { schema: z.any() } }, description: "Transaction detail" },
    ...errorResponses,
  },
});

groups.openapi(transactionDetailRoute, async (c) => {
  const { group, id } = c.req.valid("param");
  const data = getTransactionDetailMock(group, id);
  if (!data) return c.json({ error: "not found" }, 404) as any;
  return c.json(data);
});

const loansRoute = createRoute({
  method: "get",
  path: "/groups/{group}/loans",
  tags: ["Groups"],
  request: {
    params: z.object({ group: z.string() }),
    query: z.object({ state: z.string().optional(), borrower: z.string().optional() }),
  },
  responses: {
    200: { content: { "application/json": { schema: z.any() } }, description: "Loans" },
    ...errorResponses,
  },
});

groups.openapi(loansRoute, async (c) => {
  const { group } = c.req.valid("param");
  const q = c.req.valid("query");
  const data = getMockData(group);
  if (!data) return c.json({ error: "not found" }, 404) as any;
  return c.json(data.outstandingLoans ?? []);
});

const loanDetailRoute = createRoute({
  method: "get",
  path: "/groups/{group}/loans/{id}",
  tags: ["Groups"],
  request: { params: z.object({ group: z.string(), id: z.string() }) },
  responses: {
    200: { content: { "application/json": { schema: loanDetailSchema } }, description: "Loan detail" },
    ...errorResponses,
  },
});

groups.openapi(loanDetailRoute, async (c) => {
  const { id } = c.req.valid("param");
  const data = getLoanDetailMock(id);
  if (!data) return c.json({ error: "not found" }, 404) as any;
  return c.json(data);
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
    200: { content: { "application/json": { schema: loanReviewSchema } }, description: "Loan review" },
    ...errorResponses,
  },
});

groups.openapi(loanReviewRoute, async (c) => {
  const { group, id } = c.req.valid("param");
  const { userId } = c.req.valid("query");
  const data = getLoanReviewMock(id, userId ?? "");
  if (!data) return c.json({ error: "not found" }, 404) as any;
  return c.json(data);
});

const committeeRoute = createRoute({
  method: "get",
  path: "/groups/{group}/committee",
  tags: ["Groups"],
  request: { params: z.object({ group: z.string() }) },
  responses: {
    200: { content: { "application/json": { schema: z.array(committeeMemberSchema) } }, description: "Committee" },
    ...errorResponses,
  },
});

groups.openapi(committeeRoute, async (c) => {
  const { group } = c.req.valid("param");
  return c.json(getCommittee(group));
});

const userProfileRoute = createRoute({
  method: "get",
  path: "/groups/{group}/users/{userId}",
  tags: ["Groups"],
  request: { params: z.object({ group: z.string(), userId: z.string() }) },
  responses: {
    200: { content: { "application/json": { schema: userProfileSchema } }, description: "User profile" },
    ...errorResponses,
  },
});

groups.openapi(userProfileRoute, async (c) => {
  const { userId } = c.req.valid("param");
  const data = getUserProfile(userId);
  if (!data) return c.json({ error: "not found" }, 404) as any;
  return c.json(data);
});

const settingsRoute = createRoute({
  method: "get",
  path: "/groups/{group}/settings",
  tags: ["Groups"],
  request: { params: z.object({ group: z.string() }) },
  responses: {
    200: { content: { "application/json": { schema: groupSettingsSchema } }, description: "Group settings" },
    ...errorResponses,
  },
});

groups.openapi(settingsRoute, async (c) => {
  const { group } = c.req.valid("param");
  const data = getMockData(group);
  if (!data) return c.json({ error: "not found" }, 404) as any;
  return c.json(data.settings);
});

const inviteRoute = createRoute({
  method: "get",
  path: "/groups/{group}/invite",
  tags: ["Groups"],
  request: { params: z.object({ group: z.string() }) },
  responses: {
    200: { content: { "application/json": { schema: inviteDataSchema } }, description: "Invite data" },
    ...errorResponses,
  },
});

groups.openapi(inviteRoute, async (c) => {
  const { group } = c.req.valid("param");
  return c.json(getInviteDataMock(group));
});

const reserveRoute = createRoute({
  method: "get",
  path: "/groups/{group}/reserve",
  tags: ["Groups"],
  request: { params: z.object({ group: z.string() }) },
  responses: {
    200: { content: { "application/json": { schema: reserveDetailSchema } }, description: "Reserve detail" },
    ...errorResponses,
  },
});

groups.openapi(reserveRoute, async (c) => {
  const { group } = c.req.valid("param");
  const data = getReserveDetailMock(group);
  if (!data) return c.json({ error: "not found" }, 404) as any;
  return c.json(data);
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
    200: { content: { "application/json": { schema: leaveGroupInfoSchema } }, description: "Leave info" },
    ...errorResponses,
  },
});

groups.openapi(leaveInfoRoute, async (c) => {
  const { group } = c.req.valid("param");
  const { userId } = c.req.valid("query");
  const data = getLeaveGroupInfoMock(group, userId);
  if (!data) return c.json({ error: "not found" }, 404) as any;
  return c.json(data);
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
    200: { content: { "application/json": { schema: z.array(z.any()) } }, description: "Proposals" },
    ...errorResponses,
  },
});

groups.openapi(proposalsRoute, async (c) => {
  return c.json([]);
});

const proposalDetailRoute = createRoute({
  method: "get",
  path: "/groups/{group}/proposals/{id}",
  tags: ["Groups"],
  request: { params: z.object({ group: z.string(), id: z.string() }) },
  responses: {
    200: { content: { "application/json": { schema: z.any() } }, description: "Proposal detail" },
    ...errorResponses,
  },
});

groups.openapi(proposalDetailRoute, async (c) => {
  const { id } = c.req.valid("param");
  return c.json({ id, state: "pending" });
});

const publicGroupsRoute = createRoute({
  method: "get",
  path: "/groups/public",
  tags: ["Groups"],
  request: { query: z.object({ q: z.string().optional() }) },
  responses: {
    200: { content: { "application/json": { schema: z.array(z.any()) } }, description: "Public groups" },
  },
});

groups.openapi(publicGroupsRoute, async (c) => {
  const { q } = c.req.valid("query");
  const { PUBLIC_GROUPS } = await import("../lib/mock-data.js");
  let list = PUBLIC_GROUPS;
  if (q) {
    const query = q.toLowerCase();
    list = list.filter((g) => g.name.toLowerCase().includes(query));
  }
  return c.json(list);
});

export default groups;
