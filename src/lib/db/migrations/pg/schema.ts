import { pgTable, serial, timestamp, text, bigint, unique, varchar, json, doublePrecision } from "drizzle-orm/pg-core"
import { sql } from "drizzle-orm"



export const customerLogs = pgTable("customerLogs", {
	id: serial().primaryKey().notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow(),
	action: text().notNull(),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	user: bigint({ mode: "number" }).notNull(),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	customerId: bigint("customer_id", { mode: "number" }).notNull(),
});

export const customers = pgTable("customers", {
	id: serial().primaryKey().notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow(),
	name: text().notNull(),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	phone: bigint({ mode: "number" }).notNull(),
	aadhaar: varchar({ length: 12 }),
	address: varchar({ length: 255 }),
}, (table) => [
	unique("customers_aadhaar_unique").on(table.aadhaar),
]);

export const orderLogs = pgTable("orderLogs", {
	id: serial().primaryKey().notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow(),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	orderId: bigint("order_id", { mode: "number" }).notNull(),
	action: varchar(),
	comments: text(),
	documents: text(),
});

export const orders = pgTable("orders", {
	id: serial().primaryKey().notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow(),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	customerId: bigint("customer_id", { mode: "number" }).notNull(),
	customerName: text("customer_name").notNull(),
	items: json().notNull(),
	totalPrice: doublePrecision("total_price").notNull(),
	status: text().notNull(),
	paymentMethod: text("payment_method").notNull(),
	discountType: text("discount_type"),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	discountValue: bigint("discount_value", { mode: "number" }),
	remainingAmount: doublePrecision("remaining_amount"),
	paidAmount: doublePrecision("paid_amount"),
	remarks: text(),
	paymentStatus: text("payment_status"),
	totalPayable: doublePrecision("total_payable").notNull(),
	date: timestamp({ withTimezone: true, mode: 'string' }).notNull(),
	type: text(),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	vendorId: bigint("vendor_id", { mode: "number" }),
	vendorName: text("vendor_name"),
});

export const paymentLogs = pgTable("paymentLogs", {
	id: serial().primaryKey().notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow(),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	orderId: bigint("order_id", { mode: "number" }).notNull(),
	action: text().notNull(),
	comments: text(),
	documents: text(),
});

export const paymentMethods = pgTable("paymentMethods", {
	id: serial().primaryKey().notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow(),
	name: text().notNull(),
});

export const productLogs = pgTable("productLogs", {
	id: serial().primaryKey().notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow(),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	productId: bigint("product_id", { mode: "number" }).notNull(),
	action: text().notNull(),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	user: bigint({ mode: "number" }).notNull(),
});

export const products = pgTable("products", {
	id: serial().primaryKey().notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow(),
	name: text().notNull(),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	quantity: bigint({ mode: "number" }).notNull(),
	unit: text().notNull(),
	price: doublePrecision().notNull(),
});

export const units = pgTable("units", {
	id: serial().primaryKey().notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow(),
	name: text().notNull(),
});

export const users = pgTable("users", {
	id: serial().primaryKey().notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow(),
	name: text().notNull(),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	phone: bigint({ mode: "number" }).notNull(),
	password: text().notNull(),
	email: text().notNull(),
});

export const vendorLogs = pgTable("vendorLogs", {
	id: serial().primaryKey().notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow(),
	action: text().notNull(),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	user: bigint({ mode: "number" }).notNull(),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	vendorId: bigint("vendor_id", { mode: "number" }).notNull(),
});

export const vendors = pgTable("vendors", {
	id: serial().primaryKey().notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow(),
	name: text().notNull(),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	phone: bigint({ mode: "number" }).notNull(),
	products: json(),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	aadhaar: bigint({ mode: "number" }),
	address: text(),
});
