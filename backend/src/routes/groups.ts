import type { Address } from "@ekimina/types";

import { createRoute, OpenAPIHono, z } from "@hono/zod-openapi";

import * as contract from "../lib/contract-data.js";
import { errorResponses } from "../lib/schemas.js";

const groups = new OpenAPIHono();

const dashboardRoute = createRoute({
  method: "get",
  path: "/groups/{group}/dashboard",
  tags: ["Groups"],
  request: { params: z.object({ group: z.string() }) },
  responses: {
    200: { content: { "application/json": { schema: z.any() } }, description: "Dashboard" },
    ...errorResponses,
  },
});

groups.openapi(dashboardRoute, async (c) => {
  const { group } = c.req.valid("param");
  const data = await contract.getDashboard(group as Address);
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
    200: { content: { "application/json": { schema: z.any() } }, description: "Members" },
    ...errorResponses,
  },
});

groups.openapi(membersRoute, async (c) => {
  const { group } = c.req.valid("param");
  const { q } = c.req.valid("query");
  const data = await contract.getMembers(group as Address, q);
  return c.json(data ?? []);
});

const memberDetailRoute = createRoute({
  method: "get",
  path: "/groups/{group}/members/{userId}",
  tags: ["Groups"],
  request: { params: z.object({ group: z.string(), userId: z.string() }) },
  responses: {
    200: { content: { "application/json": { schema: z.any() } }, description: "Member detail" },
    ...errorResponses,
  },
});

groups.openapi(memberDetailRoute, async (c) => {
  const { group, userId } = c.req.valid("param");
  const data = await contract.getMemberDetail(group as Address, userId);
  if (!data) return c.json({ error: "not found" }, 404) as any;
  return c.json(data);
});

const pendingRoute = createRoute({
  method: "get",
  path: "/groups/{group}/pending",
  tags: ["Groups"],
  request: { params: z.object({ group: z.string() }) },
  responses: {
    200: { content: { "application/json": { schema: z.any() } }, description: "Pending requests" },
    ...errorResponses,
  },
});

groups.openapi(pendingRoute, async (c) => {
  const { group } = c.req.valid("param");
  const data = await contract.getPendingRequests(group as Address);
  return c.json(data);
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
    200: { content: { "application/json": { schema: z.any() } }, description: "Transactions" },
    ...errorResponses,
  },
});

groups.openapi(transactionsRoute, async (c) => {
  return c.json([]);
});

const transactionDetailRoute = createRoute({
  method: "get",
  path: "/groups/{group}/transactions/{id}",
  tags: ["Groups"],
  request: { params: z.object({ group: z.string(), id: z.string() }) },
  responses: {
    200: {
      content: { "application/json": { schema: z.any() } },
      description: "Transaction detail",
    },
    ...errorResponses,
  },
});

groups.openapi(transactionDetailRoute, async (c) => {
  return c.json({});
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
  const data = await contract.getLoans(group as Address);
  return c.json(data);
});

const loanDetailRoute = createRoute({
  method: "get",
  path: "/groups/{group}/loans/{id}",
  tags: ["Groups"],
  request: { params: z.object({ group: z.string(), id: z.string() }) },
  responses: {
    200: { content: { "application/json": { schema: z.any() } }, description: "Loan detail" },
    ...errorResponses,
  },
});

groups.openapi(loanDetailRoute, async (c) => {
  const { group, id } = c.req.valid("param");
  const data = await contract.getLoanDetail(group as Address, id);
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
    200: { content: { "application/json": { schema: z.any() } }, description: "Loan review" },
    ...errorResponses,
  },
});

groups.openapi(loanReviewRoute, async (c) => {
  const { group, id } = c.req.valid("param");
  const { userId } = c.req.valid("query");
  const data = await contract.getLoanReview(group as Address, id, userId);
  if (!data) return c.json({ error: "not found" }, 404) as any;
  return c.json(data);
});

const committeeRoute = createRoute({
  method: "get",
  path: "/groups/{group}/committee",
  tags: ["Groups"],
  request: { params: z.object({ group: z.string() }) },
  responses: {
    200: { content: { "application/json": { schema: z.any() } }, description: "Committee" },
    ...errorResponses,
  },
});

groups.openapi(committeeRoute, async (c) => {
  const { group } = c.req.valid("param");
  return c.json(await contract.getCommittee(group as Address));
});

const userProfileRoute = createRoute({
  method: "get",
  path: "/groups/{group}/users/{userId}",
  tags: ["Groups"],
  request: { params: z.object({ group: z.string(), userId: z.string() }) },
  responses: {
    200: { content: { "application/json": { schema: z.any() } }, description: "User profile" },
    ...errorResponses,
  },
});

groups.openapi(userProfileRoute, async (c) => {
  const { group, userId } = c.req.valid("param");
  const data = await contract.getUserProfile(group as Address, userId);
  if (!data) return c.json({ error: "not found" }, 404) as any;
  return c.json(data);
});

const settingsRoute = createRoute({
  method: "get",
  path: "/groups/{group}/settings",
  tags: ["Groups"],
  request: { params: z.object({ group: z.string() }) },
  responses: {
    200: { content: { "application/json": { schema: z.any() } }, description: "Group settings" },
    ...errorResponses,
  },
});

groups.openapi(settingsRoute, async (c) => {
  const { group } = c.req.valid("param");
  return c.json(await contract.getSettings(group as Address));
});

const inviteRoute = createRoute({
  method: "get",
  path: "/groups/{group}/invite",
  tags: ["Groups"],
  request: { params: z.object({ group: z.string() }) },
  responses: {
    200: { content: { "application/json": { schema: z.any() } }, description: "Invite data" },
    ...errorResponses,
  },
});

groups.openapi(inviteRoute, async (c) => {
  const { group } = c.req.valid("param");
  return c.json(contract.getInviteData(group as Address));
});

const reserveRoute = createRoute({
  method: "get",
  path: "/groups/{group}/reserve",
  tags: ["Groups"],
  request: { params: z.object({ group: z.string() }) },
  responses: {
    200: { content: { "application/json": { schema: z.any() } }, description: "Reserve detail" },
    ...errorResponses,
  },
});

groups.openapi(reserveRoute, async (c) => {
  const { group } = c.req.valid("param");
  return c.json(await contract.getReserveDetail(group as Address));
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
    200: { content: { "application/json": { schema: z.any() } }, description: "Leave info" },
    ...errorResponses,
  },
});

groups.openapi(leaveInfoRoute, async (c) => {
  const { group } = c.req.valid("param");
  const { userId } = c.req.valid("query");
  return c.json(await contract.getLeaveInfo(group as Address, userId));
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
    200: { content: { "application/json": { schema: z.any() } }, description: "Proposals" },
    ...errorResponses,
  },
});

groups.openapi(proposalsRoute, async (c) => {
  const { group } = c.req.valid("param");
  return c.json(await contract.getProposals(group as Address));
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
  const { group, id } = c.req.valid("param");
  const data = await contract.getProposalDetail(group as Address, id);
  if (!data) return c.json({ error: "not found" }, 404) as any;
  return c.json(data);
});

const publicGroupsRoute = createRoute({
  method: "get",
  path: "/groups/public",
  tags: ["Groups"],
  request: { query: z.object({ q: z.string().optional() }) },
  responses: {
    200: { content: { "application/json": { schema: z.any() } }, description: "Public groups" },
  },
});

groups.openapi(publicGroupsRoute, async (c) => {
  const publicGroups = await contract.getPublicGroups();
  return c.json(publicGroups);
});

export default groups;
