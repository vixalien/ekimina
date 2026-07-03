import { Hono } from "hono";
import { sendOtp, verifyOtp } from "../lib/auth.js";

const auth = new Hono();

auth.post("/auth/otp/send", async (c) => {
  const { phone } = await c.req.json<{ phone: string }>();
  const result = await sendOtp(phone);
  return c.json(result);
});

auth.post("/auth/otp/verify", async (c) => {
  const { phone, code } = await c.req.json<{ phone: string; code: string }>();
  const result = await verifyOtp(phone, code);
  if (!result) return c.json({ error: "invalid code" }, 401);
  return c.json(result);
});

auth.post("/auth/pin", async () => {
  return Response.json({ ok: true });
});

auth.post("/auth/pin/verify", async () => {
  return Response.json({ ok: true });
});

export default auth;
