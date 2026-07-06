import type { Address } from "@ekimina/types";

import { getIkiminaContract } from "@ekimina/contracts";
import { createRoute, OpenAPIHono, z } from "@hono/zod-openapi";

import { walletClient, publicClient } from "../lib/chain.js";
import { addressSchema, errorResponses } from "../lib/schemas.js";

const relay = new OpenAPIHono();

const contributeRoute = createRoute({
  method: "post",
  path: "/relay/groups/{group}/contribute",
  tags: ["Relay"],
  request: { params: z.object({ group: addressSchema }) },
  responses: {
    200: {
      content: {
        "application/json": { schema: z.object({ txId: z.string() }) },
      },
      description: "Contribution submitted",
    },
    ...errorResponses,
  },
});

relay.openapi(contributeRoute, async (c) => {
  const { group } = c.req.valid("param");
  const contract = getIkiminaContract(group as Address, {
    public: publicClient,
    wallet: walletClient,
  });
  // oxlint-disable-next-line typescript/no-explicit-any
  const hash = await (contract as any).write.contribute();
  const receipt = await publicClient.waitForTransactionReceipt({ hash });
  return c.json({ txId: receipt.transactionHash });
});

const joinRoute = createRoute({
  method: "post",
  path: "/relay/groups/{group}/join",
  tags: ["Relay"],
  request: {
    params: z.object({ group: addressSchema }),
    body: {
      content: {
        "application/json": { schema: z.object({ code: z.string() }) },
      },
    },
  },
  responses: {
    200: {
      content: {
        "application/json": { schema: z.object({ txId: z.string() }) },
      },
      description: "Joined group",
    },
    ...errorResponses,
  },
});

relay.openapi(joinRoute, async (c) => {
  const { group } = c.req.valid("param");
  const { code } = c.req.valid("json");
  const contract = getIkiminaContract(group as Address, {
    public: publicClient,
    wallet: walletClient,
  });
  // oxlint-disable-next-line typescript/no-explicit-any
  const hash = await (contract as any).write.join([code]);
  const receipt = await publicClient.waitForTransactionReceipt({ hash });
  return c.json({ txId: receipt.transactionHash });
});

const triggerPayoutRoute = createRoute({
  method: "post",
  path: "/relay/groups/{group}/trigger-payout",
  tags: ["Relay"],
  request: { params: z.object({ group: addressSchema }) },
  responses: {
    200: {
      content: {
        "application/json": { schema: z.object({ txId: z.string() }) },
      },
      description: "Payout triggered",
    },
    ...errorResponses,
  },
});

relay.openapi(triggerPayoutRoute, async (c) => {
  const { group } = c.req.valid("param");
  const contract = getIkiminaContract(group as Address, {
    public: publicClient,
    wallet: walletClient,
  });
  // oxlint-disable-next-line typescript/no-explicit-any
  const hash = await (contract as any).write.triggerPayout();
  const receipt = await publicClient.waitForTransactionReceipt({ hash });
  return c.json({ txId: receipt.transactionHash });
});

const rotateRoute = createRoute({
  method: "post",
  path: "/relay/groups/{group}/rotate",
  tags: ["Relay"],
  request: {
    params: z.object({ group: addressSchema }),
    body: {
      content: {
        "application/json": {
          schema: z.object({ order: z.array(addressSchema) }),
        },
      },
    },
  },
  responses: {
    200: {
      content: {
        "application/json": { schema: z.object({ txId: z.string() }) },
      },
      description: "Rotation started",
    },
    ...errorResponses,
  },
});

relay.openapi(rotateRoute, async (c) => {
  const { group } = c.req.valid("param");
  const { order } = c.req.valid("json");
  const contract = getIkiminaContract(group as Address, {
    public: publicClient,
    wallet: walletClient,
  });
  // oxlint-disable-next-line typescript/no-explicit-any
  const hash = await (contract as any).write.setRotation([order]);
  const receipt = await publicClient.waitForTransactionReceipt({ hash });
  return c.json({ txId: receipt.transactionHash });
});

const repayLoanRoute = createRoute({
  method: "post",
  path: "/relay/groups/{group}/repay-loan",
  tags: ["Relay"],
  request: {
    params: z.object({ group: addressSchema }),
    body: {
      content: {
        "application/json": { schema: z.object({ loanId: z.string() }) },
      },
    },
  },
  responses: {
    200: {
      content: {
        "application/json": { schema: z.object({ txId: z.string() }) },
      },
      description: "Loan repaid",
    },
    ...errorResponses,
  },
});

relay.openapi(repayLoanRoute, async (c) => {
  const { group } = c.req.valid("param");
  const { loanId } = c.req.valid("json");
  const contract = getIkiminaContract(group as Address, {
    public: publicClient,
    wallet: walletClient,
  });
  // oxlint-disable-next-line typescript/no-explicit-any
  const hash = await (contract as any).write.repayLoan([loanId]);
  const receipt = await publicClient.waitForTransactionReceipt({ hash });
  return c.json({ txId: receipt.transactionHash });
});

const shareOutRoute = createRoute({
  method: "post",
  path: "/relay/groups/{group}/share-out",
  tags: ["Relay"],
  request: { params: z.object({ group: addressSchema }) },
  responses: {
    200: {
      content: {
        "application/json": { schema: z.object({ txId: z.string() }) },
      },
      description: "Share out executed",
    },
    ...errorResponses,
  },
});

relay.openapi(shareOutRoute, async (c) => {
  const { group } = c.req.valid("param");
  const contract = getIkiminaContract(group as Address, {
    public: publicClient,
    wallet: walletClient,
  });
  // oxlint-disable-next-line typescript/no-explicit-any
  const hash = await (contract as any).write.shareOut();
  const receipt = await publicClient.waitForTransactionReceipt({ hash });
  return c.json({ txId: receipt.transactionHash });
});

const createProposalRoute = createRoute({
  method: "post",
  path: "/relay/groups/{group}/proposals",
  tags: ["Relay"],
  request: {
    params: z.object({ group: addressSchema }),
    body: { content: { "application/json": { schema: z.any() } } },
  },
  responses: {
    200: {
      content: {
        "application/json": { schema: z.object({ txId: z.string() }) },
      },
      description: "Proposal created",
    },
    ...errorResponses,
  },
});

relay.openapi(createProposalRoute, async (c) => {
  const { group } = c.req.valid("param");
  const draft = c.req.valid("json");
  const contract = getIkiminaContract(group as Address, {
    public: publicClient,
    wallet: walletClient,
  });
  // oxlint-disable-next-line typescript/no-explicit-any
  const hash = await (contract as any).write.createProposal([draft]);
  const receipt = await publicClient.waitForTransactionReceipt({ hash });
  return c.json({ txId: receipt.transactionHash });
});

const approveProposalRoute = createRoute({
  method: "post",
  path: "/relay/groups/{group}/proposals/{id}/approve",
  tags: ["Relay"],
  request: { params: z.object({ group: addressSchema, id: z.string() }) },
  responses: {
    200: {
      content: {
        "application/json": { schema: z.object({ txId: z.string() }) },
      },
      description: "Proposal approved",
    },
    ...errorResponses,
  },
});

relay.openapi(approveProposalRoute, async (c) => {
  const { group, id } = c.req.valid("param");
  const contract = getIkiminaContract(group as Address, {
    public: publicClient,
    wallet: walletClient,
  });
  // oxlint-disable-next-line typescript/no-explicit-any
  const hash = await (contract as any).write.approveProposal([id]);
  const receipt = await publicClient.waitForTransactionReceipt({ hash });
  return c.json({ txId: receipt.transactionHash });
});

const rejectProposalRoute = createRoute({
  method: "post",
  path: "/relay/groups/{group}/proposals/{id}/reject",
  tags: ["Relay"],
  request: { params: z.object({ group: addressSchema, id: z.string() }) },
  responses: {
    200: {
      content: {
        "application/json": { schema: z.object({ txId: z.string() }) },
      },
      description: "Proposal rejected",
    },
    ...errorResponses,
  },
});

relay.openapi(rejectProposalRoute, async (c) => {
  const { group, id } = c.req.valid("param");
  const contract = getIkiminaContract(group as Address, {
    public: publicClient,
    wallet: walletClient,
  });
  // oxlint-disable-next-line typescript/no-explicit-any
  const hash = await (contract as any).write.rejectProposal([id]);
  const receipt = await publicClient.waitForTransactionReceipt({ hash });
  return c.json({ txId: receipt.transactionHash });
});

export default relay;
