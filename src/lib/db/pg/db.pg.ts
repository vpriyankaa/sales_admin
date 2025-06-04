import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from "./schema.pg"; // adjust if path differs

const pool = new Pool({
  connectionString: process.env.POSTGRES_URL!,
});

// ✅ Add schema typing
export const db = drizzle<typeof schema>(pool, { schema });
