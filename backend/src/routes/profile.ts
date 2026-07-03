import { Hono } from "hono";
import { usersByAddress } from "../lib/store.js";

const profile = new Hono();

profile.get("/users/:address", async (c) => {
  const address = c.req.param("address") as `0x${string}`;
  const user = usersByAddress.get(address);
  if (!user) return c.json({ error: "not found" }, 404);
  return c.json(user);
});

profile.patch("/users/me", async (c) => {
  const body = await c.req.json<{ name?: string; notificationsEnabled?: boolean }>();
  const userId = c.req.header("x-user-id");
  if (!userId) return c.json({ error: "unauthorized" }, 401);
  return c.json({ ok: true });
});

export default profile;
