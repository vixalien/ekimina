import { Hono } from "hono";
import { usersByAddress, groupMeta } from "../lib/store.js";

const lookup = new Hono();

lookup.post("/lookup/names", async (c) => {
  const { addresses } = await c.req.json<{ addresses: string[] }>();
  const result: Record<string, string | null> = {};
  for (const addr of addresses) {
    const user = usersByAddress.get(addr as `0x${string}`);
    result[addr] = user?.name ?? addr.slice(0, 6);
  }
  return c.json(result);
});

lookup.get("/groups/by-invite/:code", async (c) => {
  const code = c.req.param("code");
  const meta = Array.from(groupMeta.values()).find(g => g.inviteCode === code);
  if (!meta) return c.json({ error: "not found" }, 404);
  return c.json(meta);
});

export default lookup;
