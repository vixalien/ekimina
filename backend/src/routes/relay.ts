import type { Address } from "@ekimina/types";

import { getIkiminaContract } from "@ekimina/contracts";
import { createRoute, OpenAPIHono, z } from "@hono/zod-openapi";

import { walletClient, publicClient } from "../lib/chain.js";
import { addressSchema, errorResponses } from "../lib/schemas.js";

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

export default new OpenAPIHono()
  .openapi(contributeRoute, async (c) => {
    const { group } = c.req.valid("param");
    const contract = getIkiminaContract(group as Address, {
      public: publicClient,
      wallet: walletClient,
    });
    // oxlint-disable-next-line typescript/no-explicit-any
    const hash = await (contract as any).write.contribute();
    const receipt = await publicClient.waitForTransactionReceipt({ hash });
    return c.json({ txId: receipt.transactionHash });
  })
  .openapi(joinRoute, async (c) => {
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
  })
  .openapi(triggerPayoutRoute, async (c) => {
    const { group } = c.req.valid("param");
    const contract = getIkiminaContract(group as Address, {
      public: publicClient,
      wallet: walletClient,
    });
    // oxlint-disable-next-line typescript/no-explicit-any
    const hash = await (contract as any).write.triggerPayout();
    const receipt = await publicClient.waitForTransactionReceipt({ hash });
    return c.json({ txId: receipt.transactionHash });
  })
  .openapi(rotateRoute, async (c) => {
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
  })
  .openapi(repayLoanRoute, async (c) => {
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
  })
  .openapi(shareOutRoute, async (c) => {
    const { group } = c.req.valid("param");
    const contract = getIkiminaContract(group as Address, {
      public: publicClient,
      wallet: walletClient,
    });
    // oxlint-disable-next-line typescript/no-explicit-any
    const hash = await (contract as any).write.shareOut();
    const receipt = await publicClient.waitForTransactionReceipt({ hash });
    return c.json({ txId: receipt.transactionHash });
  })
  .openapi(createProposalRoute, async (c) => {
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
  })
  .openapi(approveProposalRoute, async (c) => {
    const { group, id } = c.req.valid("param");
    const contract = getIkiminaContract(group as Address, {
      public: publicClient,
      wallet: walletClient,
    });
    // oxlint-disable-next-line typescript/no-explicit-any
    const hash = await (contract as any).write.approveProposal([id]);
    const receipt = await publicClient.waitForTransactionReceipt({ hash });
    return c.json({ txId: receipt.transactionHash });
  })
  .openapi(rejectProposalRoute, async (c) => {
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
