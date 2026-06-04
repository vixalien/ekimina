import { Hono } from "hono";
import { dummyMembers, dummyContributions } from "../data/dummy.js";

const members = new Hono();

members.get("/:phone", (c) => {
  const phone = c.req.param("phone");
  const member = dummyMembers.find((m) => m.phone === phone);
  if (!member) {
    return c.json({ error: "Member not found" }, 404);
  }
  return c.json({ member });
});

members.get("/:phone/contributions", (c) => {
  const phone = c.req.param("phone");
  const member = dummyMembers.find((m) => m.phone === phone);
  if (!member) {
    return c.json({ error: "Member not found" }, 404);
  }
  const contributions = dummyContributions.filter(
    (c) => c.memberId === member.id
  );
  return c.json({ phone, contributions });
});

export default members;