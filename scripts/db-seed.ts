// scripts/db-seed.ts
import "load-env";
import { seedDatabase } from "./seed.pg";

(async () => {
  try {
    console.info("🌱 Running seed script...");
    await seedDatabase();
    console.info("✅ Seed completed.");
  } catch (error) {
    console.error("❌ Seed failed:", error);
    process.exit(1);
  }
})();
