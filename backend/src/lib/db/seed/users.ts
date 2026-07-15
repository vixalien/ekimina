// oxlint-disable-next-line no-restricted-imports
import { db } from "../index.js";
// oxlint-disable-next-line no-restricted-imports
import { users } from "../schema.js";

import { ACCOUNTS } from "./accounts.js";

export async function seedUsers() {
  const now = new Date().toISOString();
  for (const { name, phone, address } of ACCOUNTS) {
    await db
      .insert(users)
      .values({
        id: address,
        address,
        name,
        phone,
        custodial: false,
        notificationsEnabled: true,
        createdAt: now,
      })
      .onConflictDoNothing({ target: users.address });
  }
  console.log(`  ${ACCOUNTS.length} users seeded`);
}
