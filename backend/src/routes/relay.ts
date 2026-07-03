import { Hono } from "hono";
import { walletClient, publicClient } from "../lib/chain.js";
import { ikiminaABI } from "@ekimina/contracts";

const relay = new Hono();

relay.post("/relay/groups/:group/contribute", async (c) => {
  const group = c.req.param("group") as `0x${string}`;
  const hash = await walletClient.writeContract({
    address: group,
    abi: ikiminaABI,
    functionName: "contribute",
  });
  const receipt = await publicClient.waitForTransactionReceipt({ hash });
  return c.json({ txId: receipt.transactionHash });
});

relay.post("/relay/groups/:group/join", async (c) => {
  const group = c.req.param("group") as `0x${string}`;
  const { code } = await c.req.json<{ code: string }>();
  const hash = await walletClient.writeContract({
    address: group,
    abi: ikiminaABI,
    functionName: "join",
    args: [code],
  });
  const receipt = await publicClient.waitForTransactionReceipt({ hash });
  return c.json({ txId: receipt.transactionHash });
});

relay.post("/relay/groups/:group/trigger-payout", async (c) => {
  const group = c.req.param("group") as `0x${string}`;
  const hash = await walletClient.writeContract({
    address: group,
    abi: ikiminaABI,
    functionName: "triggerPayout",
  });
  const receipt = await publicClient.waitForTransactionReceipt({ hash });
  return c.json({ txId: receipt.transactionHash });
});

export default relay;
