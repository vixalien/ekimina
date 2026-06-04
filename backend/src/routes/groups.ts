import { Hono } from "hono";
import { dummyGroup, dummyMembers, dummyRotation } from "../data/dummy.js";

const groups = new Hono();

groups.get("/:id", (c) => {
  const id = c.req.param("id");
  if (id !== dummyGroup.id) {
    return c.json({ error: "Group not found" }, 404);
  }
  return c.json({ group: dummyGroup });
});

groups.get("/:id/members", (c) => {
  const id = c.req.param("id");
  if (id !== dummyGroup.id) {
    return c.json({ error: "Group not found" }, 404);
  }
  return c.json({ groupId: id, members: dummyMembers });
});

groups.get("/:id/rotation", (c) => {
  const id = c.req.param("id");
  if (id !== dummyGroup.id) {
    return c.json({ error: "Group not found" }, 404);
  }
  return c.json({ groupId: id, rotation: dummyRotation });
});

export default groups;