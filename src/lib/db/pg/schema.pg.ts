import {
  pgTable,
  serial,
  bigint,
  text,
  varchar,
  timestamp,
  json,
  doublePrecision
} from 'drizzle-orm/pg-core';

export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  name: text('name').notNull(),
  phone: bigint('phone', { mode: 'number' }).notNull(),
  password: text('password').notNull(),
  email: text('email').notNull(),
});

export const customers = pgTable('customers', {
  id: serial('id').primaryKey(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  name: text('name').notNull(),
  phone: bigint('phone', { mode: 'number' }).notNull(),
  aadhaar: varchar('aadhaar', { length: 12 }).unique(),
  address: varchar('address', { length: 255 }),
});

export const customerLogs = pgTable('customerLogs', {
  id: serial('id').primaryKey(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  action: text('action').notNull(),
  user: bigint('user', { mode: 'number' }).notNull(),
  customerId: bigint('customer_id', { mode: 'number' }).notNull(),
});

export const orders = pgTable('orders', {
  id: serial('id').primaryKey(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  customerId: bigint('customer_id', { mode: 'number' }).notNull(),
  customerName: text('customer_name').notNull(),
  items: json('items').notNull(),
  totalPrice: doublePrecision('total_price').notNull(),
  status: text('status').notNull(),
  paymentMethod: text('payment_method').notNull(),
  discountType: text('discount_type'),
  discountValue: bigint('discount_value', { mode: 'number' }),
  remainingAmount: doublePrecision('remaining_amount'),
  paidAmount: doublePrecision('paid_amount'),
  remarks: text('remarks'),
  paymentStatus: text('payment_status'),
  totalPayable: doublePrecision('total_payable').notNull(),
  date: timestamp('date', { withTimezone: true }).notNull(),
  type: text('type'),
  vendorId: bigint('vendor_id', { mode: 'number' }),
  vendorName: text('vendor_name'),
});

export const orderLogs = pgTable('orderLogs', {
  id: serial('id').primaryKey(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  orderId: bigint('order_id', { mode: 'number' }).notNull(),
  action: varchar('action'),
  comments: text('comments'),
  documents: text('documents'),
});

export const paymentLogs = pgTable('paymentLogs', {
  id: serial('id').primaryKey(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  orderId: bigint('order_id', { mode: 'number' }).notNull(),
  action: text('action').notNull(),
  comments: text('comments'),
  documents: text('documents'),
});

export const products = pgTable('products', {
  id: serial('id').primaryKey(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  name: text('name').notNull(),
  quantity: bigint('quantity', { mode: 'number' }).notNull(),
  unit: text('unit').notNull(),
  price: doublePrecision('price').notNull(),
});

export const productLogs = pgTable('productLogs', {
  id: serial('id').primaryKey(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  productId: bigint('product_id', { mode: 'number' }).notNull(),
  action: text('action').notNull(),
  user: bigint('user', { mode: 'number' }).notNull(),
});

export const units = pgTable('units', {
  id: serial('id').primaryKey(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  name: text('name').notNull(),
});

export const vendors = pgTable('vendors', {
  id: serial('id').primaryKey(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  name: text('name').notNull(),
  phone: bigint('phone', { mode: 'number' }).notNull(),
  products: json('products'),
  aadhaar: bigint('aadhaar', { mode: 'number' }),
  address: text('address'),
});

export const vendorLogs = pgTable('vendorLogs', {
  id: serial('id').primaryKey(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  action: text('action').notNull(),
  user: bigint('user', { mode: 'number' }).notNull(),
  vendorId: bigint('vendor_id', { mode: 'number' }).notNull(),
});


export const paymentMethods = pgTable('paymentMethods', {
  id: serial('id').primaryKey(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  name: text('name').notNull(),
});