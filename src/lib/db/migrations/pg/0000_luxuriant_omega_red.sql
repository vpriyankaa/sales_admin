CREATE TABLE "customerLogs" (
	"id" serial PRIMARY KEY NOT NULL,
	"created_at" timestamp with time zone DEFAULT now(),
	"action" text NOT NULL,
	"user" bigint NOT NULL,
	"customer_id" bigint NOT NULL
);
--> statement-breakpoint
CREATE TABLE "customers" (
	"id" serial PRIMARY KEY NOT NULL,
	"created_at" timestamp with time zone DEFAULT now(),
	"name" text NOT NULL,
	"phone" bigint NOT NULL,
	"aadhaar" varchar(12),
	"address" varchar(255),
	CONSTRAINT "customers_aadhaar_unique" UNIQUE("aadhaar")
);
--> statement-breakpoint
CREATE TABLE "orderLogs" (
	"id" serial PRIMARY KEY NOT NULL,
	"created_at" timestamp with time zone DEFAULT now(),
	"order_id" bigint NOT NULL,
	"action" varchar,
	"comments" text
);
--> statement-breakpoint
CREATE TABLE "orders" (
	"id" serial PRIMARY KEY NOT NULL,
	"created_at" timestamp with time zone DEFAULT now(),
	"customer_id" bigint NOT NULL,
	"customer_name" text NOT NULL,
	"items" json NOT NULL,
	"total_price" double precision NOT NULL,
	"status" text NOT NULL,
	"payment_method" text NOT NULL,
	"discount_type" text,
	"discount_value" bigint,
	"remaining_amount" double precision,
	"paid_amount" double precision,
	"remarks" text,
	"payment_status" text,
	"total_payable" double precision NOT NULL,
	"date" timestamp with time zone NOT NULL,
	"type" text,
	"vendor_id" bigint,
	"vendor_name" text
);
--> statement-breakpoint
CREATE TABLE "paymentLogs" (
	"id" serial PRIMARY KEY NOT NULL,
	"created_at" timestamp with time zone DEFAULT now(),
	"order_id" bigint NOT NULL,
	"action" text NOT NULL,
	"comments" text,
	"documents" text
);
--> statement-breakpoint
CREATE TABLE "productLogs" (
	"id" serial PRIMARY KEY NOT NULL,
	"created_at" timestamp with time zone DEFAULT now(),
	"product_id" bigint NOT NULL,
	"action" text NOT NULL,
	"user" bigint NOT NULL
);
--> statement-breakpoint
CREATE TABLE "products" (
	"id" serial PRIMARY KEY NOT NULL,
	"created_at" timestamp with time zone DEFAULT now(),
	"name" text NOT NULL,
	"quantity" bigint NOT NULL,
	"unit" text NOT NULL,
	"price" double precision NOT NULL
);
--> statement-breakpoint
CREATE TABLE "units" (
	"id" serial PRIMARY KEY NOT NULL,
	"created_at" timestamp with time zone DEFAULT now(),
	"name" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" serial PRIMARY KEY NOT NULL,
	"created_at" timestamp with time zone DEFAULT now(),
	"name" text NOT NULL,
	"phone" bigint NOT NULL,
	"password" text NOT NULL,
	"email" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "vendorLogs" (
	"id" serial PRIMARY KEY NOT NULL,
	"created_at" timestamp with time zone DEFAULT now(),
	"action" text NOT NULL,
	"user" bigint NOT NULL,
	"vendor_id" bigint NOT NULL
);
--> statement-breakpoint
CREATE TABLE "vendors" (
	"id" serial PRIMARY KEY NOT NULL,
	"created_at" timestamp with time zone DEFAULT now(),
	"name" text NOT NULL,
	"phone" bigint NOT NULL,
	"products" json,
	"aadhaar" bigint,
	"address" text
);
