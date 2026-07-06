import { createRoute, OpenAPIHono, z } from "@hono/zod-openapi";

import { sendOtp, verifyOtp } from "../lib/auth.js";
import { authResultSchema, errorResponses, phoneSchema, otpCodeSchema } from "../lib/schemas.js";

const auth = new OpenAPIHono();

const sendOtpRoute = createRoute({
  method: "post",
  path: "/auth/otp/send",
  tags: ["Auth"],
  request: {
    body: { content: { "application/json": { schema: z.object({ phone: phoneSchema }) } } },
  },
  responses: {
    200: {
      content: { "application/json": { schema: z.object({ sent: z.boolean() }) } },
      description: "OTP sent",
    },
  },
});

auth.openapi(sendOtpRoute, async (c) => {
  const { phone } = c.req.valid("json");
  const result = await sendOtp(phone);
  return c.json(result);
});

const verifyOtpRoute = createRoute({
  method: "post",
  path: "/auth/otp/verify",
  tags: ["Auth"],
  request: {
    body: {
      content: {
        "application/json": { schema: z.object({ phone: phoneSchema, code: otpCodeSchema }) },
      },
    },
  },
  responses: {
    200: {
      content: { "application/json": { schema: authResultSchema } },
      description: "Verification result",
    },
    401: {
      content: { "application/json": { schema: z.object({ error: z.string() }) } },
      description: "Invalid code",
    },
  },
});

auth.openapi(verifyOtpRoute, async (c) => {
  const { phone, code } = c.req.valid("json");
  const result = await verifyOtp(phone, code);
  if (!result) return c.json({ error: "invalid code" }, 401);
  return c.json(result, 200);
});

const setPinRoute = createRoute({
  method: "post",
  path: "/auth/pin",
  tags: ["Auth"],
  responses: {
    200: {
      content: { "application/json": { schema: z.object({ ok: z.boolean() }) } },
      description: "PIN set",
    },
    ...errorResponses,
  },
});

auth.openapi(setPinRoute, async (c) => {
  return c.json({ ok: true });
});

const verifyPinRoute = createRoute({
  method: "post",
  path: "/auth/pin/verify",
  tags: ["Auth"],
  responses: {
    200: {
      content: { "application/json": { schema: z.object({ ok: z.boolean() }) } },
      description: "PIN verified",
    },
    ...errorResponses,
  },
});

auth.openapi(verifyPinRoute, async (c) => {
  return c.json({ ok: true });
});

export default auth;
