import { readFileSync } from "fs";
import { join } from "path";
import { fileURLToPath } from "url";

import { groupMeta, users } from "./schema.js";

import { db } from "./index.js";

const __dirname = fileURLToPath(new URL(".", import.meta.url));

interface DeployedState {
  accounts: Record<string, string>;
  groups: Record<string, { name: string; inviteCode: string }>;
}

let state: DeployedState = { accounts: {}, groups: {} };

try {
  const jsonPath = join(__dirname, "..", "deployed-state.json");
  state = JSON.parse(readFileSync(jsonPath, "utf-8"));
} catch {
  console.warn("[seed] no deployed-state.json found, skipping seed data");
}

async function seed() {
  const now = new Date().toISOString();

  for (const [address, name] of Object.entries(state.accounts)) {
    await db
      .insert(users)
      .values({
        id: `seed-${address}`,
        address,
        name,
        phone: null,
        custodial: false,
        notificationsEnabled: true,
        createdAt: now,
      })
      .onConflictDoNothing({ target: users.address });
  }

  for (const [address, meta] of Object.entries(state.groups)) {
    await db
      .insert(groupMeta)
      .values({
        address,
        name: meta.name,
        inviteCode: meta.inviteCode,
        creator: address,
        createdAt: now,
      })
      .onConflictDoNothing({ target: groupMeta.address });
  }

  console.log("Seed complete");
}

seed()
  .catch(console.error)
  .finally(() => process.exit(0));
