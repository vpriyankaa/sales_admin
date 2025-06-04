import { db } from "@/lib/db/pg/db.pg";
import { users, units, paymentMethods } from "@/lib/db/pg/schema.pg";
import { generateHashedPassword } from "@/lib/db/utils";

export async function seedDatabase() {
    // Hash password
    const passwordHash = generateHashedPassword("123456");

    // Insert default user if not exists
    await db
        .insert(users)
        .values({
            name: "Tamilarasu M",
            phone: 9677545696,
            password: passwordHash,
            email: "admin@sammyagency.com",
        })
        .onConflictDoNothing(); // avoids duplicate insert

    // Insert default units
    await db
        .insert(units)
        .values([{ name: "PCs" }, { name: "Unit" }, { name: "NOs" }])
        .onConflictDoNothing(); // optional

    // Insert default payment methods
    await db
        .insert(paymentMethods)
        .values([
            { name: "Cash" },
            { name: "Card" },
            { name: "GPay" },
            { name: "Credit" }
        ])
        .onConflictDoNothing();
}