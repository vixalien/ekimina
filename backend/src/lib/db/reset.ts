import "dotenv/config";

import { drizzle } from "drizzle-orm/postgres-js";
import { reset } from "drizzle-seed";
import postgres from "postgres";

import * as schema from "./schema.js";

async function main() {
  const client = postgres(
    process.env.DATABASE_URL ?? "postgres://ekimina:ekimina@localhost:5432/ekimina",
  );
  const db = drizzle({ client, schema });
  await reset(db, schema);
  console.log("Database reset complete");
  await client.end();
}

main().catch(console.error);
