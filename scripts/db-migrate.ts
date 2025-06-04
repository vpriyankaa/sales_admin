import { colorize } from "consola/utils";
import "load-env";

const promise = import("lib/db/pg/migrate.pg");
const seed = import("scripts/seed.pg");

await promise
  .then(async () => {
    console.info("🚀 DB Migration completed");
    await seed.then((mod) => mod.seedDatabase()); // 👈 run seeding
    console.info("🌱 Seed data inserted");
  })
  .catch((err) => {
    console.error(err);

    console.warn(
      `
      ${colorize("red", "🚨 Migration failed due to incompatible schema.")}
      
❗️DB Migration failed – incompatible schema detected.

This version introduces a complete rework of the database schema.
As a result, your existing database structure may no longer be compatible.

**To resolve this:**

1. Drop all existing tables in your database.
2. Then run the following command to apply the latest schema:


${colorize("green", "pnpm db:migrate")}

**Note:** This schema overhaul lays the foundation for more stable updates moving forward.
You shouldn’t have to do this kind of reset again in future releases.

Need help? Open an issue on GitHub 🙏
      `.trim(),
    );

    process.exit(1);
  });
