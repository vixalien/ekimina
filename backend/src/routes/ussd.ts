import { Hono } from "hono";
import type { ScreenFn, USSDContext } from "../types.js";
import { entryMenu } from "../ussd/screens.js";
import { cors } from "hono/cors";

function resolve(
  next: Map<string | RegExp, ScreenFn>,
  key: string,
): ScreenFn | undefined {
  if (next.has(key)) return next.get(key);
  for (const [pattern, fn] of next) {
    if (pattern instanceof RegExp && pattern.test(key)) return fn;
  }
  return undefined;
}

const invalidScreen: ScreenFn = () => ({
  response: "END Invalid option.\nPlease dial again.",
});

function route(input: string[], ctx: USSDContext): string {
  let screen = entryMenu(ctx);
  for (const key of input) {
    ctx = { ...ctx, params: { ...ctx.params, ...screen.params } };
    if (!screen.next) return screen.response;
    const nextFn = resolve(screen.next, key) ?? invalidScreen;
    screen = nextFn(ctx, key);
  }
  return screen.response;
}

const ussd = new Hono();

ussd.use(cors({ exposeHeaders: ["freeflow"] }));
ussd.post("/", async (c) => {
  const body = await c.req.parseBody();
  const phone = (body["phoneNumber"] as string) ?? "";
  const text = (body["text"] as string) ?? "";
  const ctx: USSDContext = { phone, params: {} };

  let input = text === "" ? [] : text.split("*");
  // sometimes the input starts with 950
  if (input[0] === "950") input = input.toSpliced(0, 1);

  console.log("input", input);

  const [decision, response] = route(input, ctx).split(/\s+([\s\S]+)/);
  return c.text(response, {
    headers: { freeflow: decision === "CON" ? "FC" : "FB" },
  });
});

export default ussd;
