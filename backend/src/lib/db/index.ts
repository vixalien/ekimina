import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

import * as schema from "./schema.js";

const client = postgres(
  process.env.DATABASE_URL ?? "postgres://ekimina:ekimina@localhost:5432/ekimina",
);

export const db = drizzle({ client, schema });
