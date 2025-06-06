"use server";

import { db } from "@/lib/db/pg/db.pg";
import {
  users,
  customers,
  products,
  vendors,
  vendorLogs,
  customerLogs,
  orders,
  paymentLogs,
  paymentMethods,
  productLogs,
  orderLogs,
  units,
} from "@/lib/db/pg/schema.pg";
import { eq, or, gt, desc, isNull } from "drizzle-orm";
import type { User } from "@/types/user";
import type { Order } from "app-types/order";
import type { Product } from "app-types/product";
import type { Vendor } from "app-types/vendor";
import type { OrderInput } from "app-types/order-input";
import { Unit } from "app-types/unit";
import { compare } from "bcrypt-ts";
import { formatStatus, formatChange } from "@/utils/formatStatus";

export async function changeProductQuantity(
  productId: number,
  quantity: number,
  type: "sale" | "purchase",
): Promise<boolean> {
  try {
    const adjustedDelta = type === "sale" ? -quantity : quantity;

    // console.log("productId",productId);
    // console.log("quantity",quantity);

    const [current] = await db
      .select({ quantity: products.quantity })
      .from(products)
      .where(eq(products.id, productId));

    // console.log("current",current);

    if (!current) {
      throw new Error(`Product with ID ${productId} not found.`);
    }

    const newQuantity = (current.quantity ?? 0) + adjustedDelta;

    await db
      .update(products)
      .set({ quantity: newQuantity })
      .where(eq(products.id, productId));

    return true;
  } catch (error) {
    console.error("Failed to change product quantity:", error);
    throw error;
  }
}

export async function getCustomers() {
  try {
    const result = await db
      .select()
      .from(customers)
      .orderBy(desc(customers.id));
    return result;
  } catch (err) {
    console.error("Error fetching customers:", err);
    return [];
  }
}

export async function getProducts(): Promise<Product[]> {
  try {
    const result = await db
      .select()
      .from(products)
      .where(gt(products.quantity, 0));

    return result.map((p) => ({
      ...p,
      total_price: p.quantity * p.price, // ✅ calculate it
    }));
  } catch (err) {
    console.error("Error fetching products:", err);
    return [];
  }
}

export async function getVendors(): Promise<Vendor[]> {
  try {
    const result = await db.select().from(vendors);

    const vendorsWithTypedProducts: Vendor[] = result.map((vendor) => ({
      ...vendor,
      products: vendor.products as Product[] | null, // cast explicitly
    }));

    return vendorsWithTypedProducts;
  } catch (err) {
    console.error("Error fetching vendors:", err);
    return [];
  }
}

export async function addCustomer(data: {
  name: string;
  phone: string;
  aadhaar?: string;
  address?: string;
}) {
  const { name, phone, aadhaar, address } = data;
  if (!name || !phone) throw new Error("Name and phone are required");

  try {
    const result = await db
      .insert(customers)
      .values({
        name,
        phone: Number(phone),
        aadhaar: aadhaar || null,
        address: address || null,
      })
      .returning({ id: customers.id });

    return result[0]?.id;
  } catch (err) {
    console.error("Error adding customer:", err);
    throw err;
  }
}

export async function editCustomer(customerData: {
  id: string | number;
  name: string;
  phone: number;
  aadhaar?: string;
  address?: string;
  user?: number;
}) {
  const { id, name, phone, aadhaar, address, user } = customerData;

  if (!id || !name || !phone) {
    throw new Error("Id, name and phone are required");
  }

  if (!user) {
    throw new Error("User ID is required for logging changes");
  }

  const sanitized = {
    name: name.trim(),
    phone: Number(phone),
    aadhaar: aadhaar?.trim() || null,
    address: address?.trim() || null,
  };

  try {
    const current = await db.query.customers.findFirst({
      columns: {
        name: true,
        phone: true,
        aadhaar: true,
        address: true,
      },
      where: eq(customers.id, Number(id)),
    });

    if (!current) throw new Error("Customer not found.");

    await db
      .update(customers)
      .set(sanitized)
      .where(eq(customers.id, Number(id)));

    const changes: string[] = [];

    const nameChange = formatChange("name", current.name, sanitized.name);
    if (nameChange) changes.push(nameChange);

    const phoneChange = formatChange("phone", current.phone, sanitized.phone);
    if (phoneChange) changes.push(phoneChange);

    const aadhaarChange = formatChange(
      "aadhaar",
      current.aadhaar,
      sanitized.aadhaar,
    );
    if (aadhaarChange) changes.push(aadhaarChange);

    const addressChange = formatChange(
      "address",
      current.address,
      sanitized.address,
    );
    if (addressChange) changes.push(addressChange);

    const actionText = changes.length
      ? changes.join(", ")
      : "No changes – update called but data identical.";

    await db.insert(customerLogs).values({
      customerId: Number(id),
      action: actionText,
      user: user,
    });

    return true;
  } catch (err) {
    console.error("Failed to edit customer", err);
    throw err;
  }
}

// place order
export type OrderItem = {
  product_id: string;
  product_name: string;
  quantity: number;
  price: number;
  unit: string;
};

export async function addOrder(order: OrderInput): Promise<string> {
  const reserved: typeof order.items = [];

  try {
    // Step 1: Reserve inventory
    for (const item of order.items) {
      await changeProductQuantity(+item.id, item.quantity, order.type);
      reserved.push(item);
    }

    // Step 2: Insert order
    const inserted = await db
      .insert(orders)
      .values({
        customerId: Number(order.customer_id),
        customerName: order.customer_name?.trim() || "",
        vendorId: Number(order.vendor_id),
        vendorName: order.vendor_name?.trim() || null,
        items: order.items,
        date: order.date,
        totalPrice: order.total_price,
        discountType: order.discount_type,
        discountValue: order.discount_value,
        totalPayable: order.total_payable,
        paidAmount: order.paid_amount,
        remainingAmount: order.remaining_amount,
        paymentMethod: order.payment_method,
        paymentStatus: order.payment_status,
        type: order.type,
        status: order.status,
        remarks: order.remarks,
      })
      .returning({ id: orders.id });

    const orderId = inserted[0]?.id;

    // Step 3: Log payment
    if (order.paid_amount > 0 && orderId) {
      await db.insert(paymentLogs).values({
        orderId: Number(orderId),
        action: `Payment of ₹${order.paid_amount} Received.`,
        comments: order.remarks ?? null,
      });
    }

    return orderId.toString();
  } catch (err) {
    const rollbackType = order.type === "sale" ? "purchase" : "sale";
    for (const item of reserved) {
      await changeProductQuantity(+item.id, item.quantity, rollbackType);
    }
    throw err;
  }
}

export interface OrderUpdateInput {
  customer_id?: string;
  customer_name?: string;
  items?: any;
  date?: string;
  total_price?: number;
  discount_type?: string;
  discount_value?: number;
  total_payable?: number;
  paid_amount?: number;
  remaining_amount?: number;
  payment_method?: string;
  payment_status?: string;
  status?: string;
  remarks?: string;
}

export async function updateOrder(
  orderId: number,
  order: OrderInput,
): Promise<void> {
  // console.log("orderId", orderId);
  // console.log("OrderInput", order);

  const current = (await db.query.orders.findFirst({
    columns: { items: true },
    where: eq(orders.id, orderId),
  })) as { items: OrderItem[] } | undefined;

  if (!current) throw new Error("Order not found");

  // Use correct ID field and key type
  const prevMap = new Map<number, number>(
    current.items.map((i: any) => [i.id, i.quantity]), // assuming i.id is the product/item ID
  );

  try {
    for (const item of order.items) {
      const oldQty = prevMap.get(item.id) ?? 0;

      if (item.quantity !== oldQty) {
        const delta = item.quantity - oldQty;

        // console.log(`Product ${item.id} quantity changed from ${oldQty} to ${item.quantity}`);

        await changeProductQuantity(
          item.id,
          Math.abs(delta),
          delta > 0 ? order.type : order.type === "sale" ? "purchase" : "sale",
        );
      }

      // Remove processed items
      prevMap.delete(item.id);
    }

    // Handle removed items
    for (const [removedProdId, removedQty] of prevMap.entries()) {
      // console.log(`Product ${removedProdId} was removed. Reverting ${removedQty}`);
      await changeProductQuantity(
        removedProdId,
        removedQty,
        order.type === "sale" ? "purchase" : "sale",
      );
    }
  } catch (err) {
    console.error("Stock update failed:", err);
    throw err;
  }

  // Update order in DB
  await db
    .update(orders)
    .set({
      ...order,
      customerId: Number(order.customer_id),
      vendorId: Number(order.vendor_id) || null,
      customerName: order.customer_name?.trim() || "",
      vendorName: order.vendor_name?.trim() || null,
      items: order?.items,
      totalPrice: order?.total_price,
      status: order?.status,
      paymentMethod: order?.payment_method,
      discountType: order?.discount_type,
      discountValue: order?.discount_value,
      remainingAmount: order?.remaining_amount,
      paidAmount: order?.paid_amount,
      remarks: order?.remarks,
      paymentStatus: order?.payment_status,
      totalPayable: order?.total_payable,
      date: order?.date,
      type: order?.type,
    })
    .where(eq(orders.id, orderId));
}

export async function addProduct(productData: {
  name: string;
  quantity: number;
  price: number;
  unit: string;
}): Promise<number> {
  const { name, quantity, price, unit } = productData;

  if (!name || !unit || quantity == null || price == null) {
    throw new Error("All product fields are required");
  }

  const inserted = await db
    .insert(products)
    .values({
      name,
      quantity,
      price,
      unit,
    })
    .returning({ id: products.id });

  return inserted[0]?.id;
}

export async function editProduct(productData: {
  id: string | number;
  name: string;
  quantity: number;
  price: number;
  unit: string;
  user: number;
}): Promise<boolean> {
  const { id, name, quantity, price, unit, user } = productData;

  if (id == null || !name || !unit || quantity == null || price == null) {
    throw new Error("All product fields (including id) are required");
  }

  const current = await db.query.products.findFirst({
    columns: {
      name: true,
      quantity: true,
      price: true,
      unit: true,
    },
    where: eq(products.id, Number(id)),
  });

  if (!current) throw new Error("Product not found.");

  await db
    .update(products)
    .set({
      name,
      quantity,
      price,
      unit,
    })
    .where(eq(products.id, Number(id)));

  const changes: string[] = [];
  if (current.name !== name)
    changes.push(`name: changed from ${current.name} to ${name}`);
  if (current.quantity !== quantity)
    changes.push(`quantity: changed from ${current.quantity} to ${quantity}`);
  if (current.price !== price)
    changes.push(`price: changed from ${current.price} to ${price}`);
  if (current.unit !== unit)
    changes.push(`unit: changed from ${current.unit} to ${unit}`);

  const actionText = changes.length
    ? changes.join(", ")
    : "No changes – update called but data identical.";

  await db.insert(productLogs).values({
    productId: Number(id),
    action: actionText,
    user,
  });

  return true;
}

export async function addVendor(vendorData: {
  name: string;
  phone: number;
  aadhaar?: string;
  address?: string;
  products: any[];
}): Promise<number> {
  const { name, phone, aadhaar, address, products } = vendorData;

  if (!name || !phone || products.length === 0) {
    throw new Error("All vendor fields are required");
  }

  const sanitizedVendor = {
    name: name.trim(),
    phone,
    aadhaar: aadhaar ? Number(aadhaar.trim()) : null,
    address: address?.trim() || null,
    products,
  };

  const inserted = await db
    .insert(vendors)
    .values(sanitizedVendor)
    .returning({ id: vendors.id });

  return inserted[0]?.id;
}

export async function editVendor(vendorData: any): Promise<boolean> {
  const { id, name, phone, aadhaar, address, products, user } = vendorData;

  if (!id || !name || !phone || products.length === 0) {
    throw new Error("All vendor fields (including id) are required");
  }

  const current = await db.query.vendors.findFirst({
    columns: {
      name: true,
      phone: true,
      aadhaar: true,
      address: true,
      products: true,
    },
    where: eq(vendors.id, Number(id)),
  });

  if (!current) throw new Error("Vendor not found.");

  const sanitizedVendor = {
    name: name.trim(),
    phone,
    aadhaar: aadhaar ? Number(aadhaar.trim()) : null,
    address: address?.trim() || null,
    products,
  };

  await db
    .update(vendors)
    .set(sanitizedVendor)
    .where(eq(vendors.id, Number(id)));

  // Compare changes
  const changes: string[] = [];

  if (current.name !== sanitizedVendor.name)
    changes.push(
      `name: changed from ${current.name} to ${sanitizedVendor.name}`,
    );
  if (current.phone !== sanitizedVendor.phone)
    changes.push(
      `phone: changed from ${current.phone} to ${sanitizedVendor.phone}`,
    );
  if (current.aadhaar !== sanitizedVendor.aadhaar)
    changes.push(
      `aadhaar: changed from ${current.aadhaar ?? "null"} to ${sanitizedVendor.aadhaar ?? "null"}`,
    );
  if (current.address !== sanitizedVendor.address)
    changes.push(
      `address: changed from ${current.address ?? "null"} to ${sanitizedVendor.address ?? "null"}`,
    );

  const productsChanged =
    JSON.stringify(current.products || []) !== JSON.stringify(products);
  // if (productsChanged) changes.push("products list updated");

  const currentProducts: Product[] = (current.products as Product[]) || [];
  const newProducts: Product[] = products as Product[];

  const oldProductIds = currentProducts.map((p) => p.id);
  const newProductIds = newProducts.map((p) => p.id);

  const addedProductIds = newProductIds.filter(
    (id) => !oldProductIds.includes(id),
  );
  const removedProductIds = oldProductIds.filter(
    (id) => !newProductIds.includes(id),
  );

  const addedNames = newProducts
    .filter((p) => addedProductIds.includes(p.id))
    .map((p) => p.name);

  const removedNames = currentProducts
    .filter((p) => removedProductIds.includes(p.id))
    .map((p) => p.name);

  let productChangeText = "";

  if (addedNames.length || removedNames.length) {
    const addedText = addedNames.length
      ? `${addedNames.join(", ")} added to`
      : "";
    const removedText = removedNames.length
      ? ` ${removedNames.join(", ")} removed from`
      : "";

    productChangeText += `${[addedText, removedText].filter(Boolean).join("; ")}   Products`;
  } else {
    productChangeText += " (order or non-ID fields may have changed)";
  }

  changes.push(productChangeText);

  const actionText =
    changes.length > 0
      ? changes.join(", ")
      : "No changes – update called but data identical.";

  await db.insert(vendorLogs).values({
    vendorId: Number(id),
    action: actionText,
    user: user!,
  });

  return true;
}

export async function getReports(): Promise<Order[]> {
  try {
    const data = await db
      .select()
      .from(orders)
      .where(or(isNull(orders.type), eq(orders.type, "sale")))
      .orderBy(desc(orders.id));

    return data.map((order) => ({
      ...order,
      items: Array.isArray(order.items) ? (order.items as Product[]) : [],
    }));
  } catch (error) {
    console.error("Failed to fetch reports", error);
    return [];
  }
}

export async function getPurchaseList(): Promise<Order[]> {
  try {
    const data = await db
      .select()
      .from(orders)
      .where(eq(orders.type, "purchase"))
      .orderBy(desc(orders.id));

    return data.map((order) => ({
      ...order,
      items: Array.isArray(order.items) ? (order.items as Product[]) : [],
    }));
  } catch (error) {
    console.error("Failed to fetch purchase orders", error);
    return [];
  }
}

export async function getOrderLogsById(orderId: number) {
  try {
    const logs = await db
      .select()
      .from(orderLogs)
      .where(eq(orderLogs.orderId, orderId))
      .orderBy(desc(orderLogs.id));

    return logs.length > 0 ? logs : null;
  } catch (error) {
    console.error("Error fetching order logs by ID:", error);
    return null;
  }
}

export async function getCustomerLogsById(customerId: number) {
  try {
    const logs = await db
      .select()
      .from(customerLogs)
      .where(eq(customerLogs.customerId, customerId))
      .orderBy(desc(customerLogs.id));

    return logs.length > 0 ? logs : null;
  } catch (error) {
    console.error("Error fetching customer logs by ID:", error);
    return null;
  }
}

export async function getProductLogsById(productId: number) {
  try {
    const logs = await db
      .select()
      .from(productLogs)
      .where(eq(productLogs.productId, productId))
      .orderBy(desc(productLogs.id));

    return logs.length > 0 ? logs : null;
  } catch (error) {
    console.error("Error fetching product logs by ID:", error);
    return null;
  }
}

export async function getUser(id: number) {
  try {
    const user = await db.select().from(users).where(eq(users.id, id)).limit(1);

    return user[0] || null;
  } catch (error) {
    console.error("Error fetching user by ID:", error);
    return null;
  }
}

export async function getVendorLogsById(vendorId: number) {
  try {
    const logs = await db
      .select()
      .from(vendorLogs)
      .where(eq(vendorLogs.vendorId, vendorId))
      .orderBy(desc(vendorLogs.id));

    return logs.length > 0 ? logs : null;
  } catch (error) {
    console.error("Error fetching vendor logs by ID:", error);
    return null;
  }
}

export async function getPaymentLogsById(orderId: number) {
  try {
    const logs = await db
      .select()
      .from(paymentLogs)
      .where(eq(paymentLogs.orderId, orderId))
      .orderBy(desc(paymentLogs.id));

    return logs.length > 0 ? logs : null;
  } catch (error) {
    console.error("Error fetching payment logs by ID:", error);
    return null;
  }
}

export async function getOrderById(orderId: number): Promise<Order | null> {
  try {
    const data = await db
      .select()
      .from(orders)
      .where(eq(orders.id, orderId))
      .limit(1);

    // console.log("order details",data);

    if (data.length === 0) return null;

    const order = data[0];

    return {
      ...order,
      items: Array.isArray(order.items) ? (order.items as Product[]) : [],
    };
  } catch (error) {
    console.error("Error fetching order by ID:", error);
    return null;
  }
}

export async function revertStockForCancelledOrder(orderId: number) {
  const orderResult = await db
    .select({
      type: orders.type,
      items: orders.items,
    })
    .from(orders)
    .where(eq(orders.id, orderId))
    .limit(1);

  const order = orderResult[0];

  // console.log("order",order);

  if (!order) throw new Error("Order not found while reverting stock.");

  const reverseType = "purchase";

  const items = order.items as { id: number; quantity: number }[];

  for (const { id, quantity } of items) {
    console.log(
      `Reverting stock for product ID ${id} with quantity ${quantity}`,
    );
    await changeProductQuantity(Number(id), quantity, reverseType);
  }
}

export async function changeOrderStatus(
  orderId: number,
  status: string,
  comments = "",
  documents = "",
): Promise<boolean> {
  try {
    // console.log("orderId",orderId);

    const existing = await db
      .select({ status: orders.status })
      .from(orders)
      .where(eq(orders.id, orderId))
      .limit(1);

    if (existing.length === 0) throw new Error("Order not found.");

    const oldStatus = existing[0].status;

    // 3. If changing to "cancelled", revert stock
    if (status.toLowerCase() === "cancelled" && oldStatus !== "cancelled") {
      await revertStockForCancelledOrder(orderId);
    }

    // 4. Update order status
    await db.update(orders).set({ status }).where(eq(orders.id, orderId));

    await db.insert(orderLogs).values({
      orderId: Number(orderId),
      action: `Status changed from ${formatStatus(oldStatus)} to ${formatStatus(status)}.`,
      comments,
    });

    return true;
  } catch (err) {
    console.error("Failed to update order status", err);
    return false;
  }
}

export async function changeOrderPaymentStatus(
  orderId: number,
  newStatus: string,
): Promise<boolean> {
  try {
    // 1. Fetch current order data
    const currentRows = await db
      .select({
        paymentStatus: orders.paymentStatus,
        totalPrice: orders.totalPrice,
        discountValue: orders.discountValue,
      })
      .from(orders)
      .where(eq(orders.id, orderId))
      .limit(1);

    const currentRow = currentRows[0];
    if (!currentRow) throw new Error("Order not found");

    const oldStatus = currentRow.paymentStatus ?? "";

    // 2. Prepare update payload
    const updatePayload: {
      paymentStatus: string;
      remainingAmount?: number;
      paidAmount?: number;
    } = {
      paymentStatus: newStatus,
    };

    if (newStatus === "paid") {
      const totalAfterDiscount =
        (currentRow.totalPrice ?? 0) - (currentRow.discountValue ?? 0);

      updatePayload.remainingAmount = 0;
      updatePayload.paidAmount = totalAfterDiscount;
    }

    // 3. Update orders table
    await db.update(orders).set(updatePayload).where(eq(orders.id, orderId));

    await db.insert(orderLogs).values({
      orderId,
      action: `Order payment status changed from ${formatStatus(oldStatus)} to ${formatStatus(newStatus)}.`,
    });

    return true;
  } catch (err) {
    console.error("Failed to update order payment status", err);
    return false;
  }
}

export async function changeOrderPayment(
  orderId: number,
  amount: number,
  comments: string,
  documents: string,
): Promise<boolean> {
  if (amount <= 0) {
    console.error("Amount must be greater than 0.");
    return false;
  }

  try {
    // 1. Fetch current order details
    const [row] = await db
      .select({
        paidAmount: orders.paidAmount,
        remainingAmount: orders.remainingAmount,
        totalPayable: orders.totalPayable,
        paymentStatus: orders.paymentStatus,
        status: orders.status,
      })
      .from(orders)
      .where(eq(orders.id, orderId))
      .limit(1);

    if (!row) throw new Error("Order not found.");

    const {
      paidAmount = 0,
      remainingAmount = 0,
      totalPayable = 0,
      paymentStatus: oldPaymentStatus,
      status: oldOrderStatus,
    } = row;

    // 2. Calculate new values
    const newPaidAmount = Math.min((paidAmount ?? 0) + amount, totalPayable);
    const newRemainingAmount = Math.max(totalPayable - newPaidAmount, 0);
    const newPaymentStatus =
      newRemainingAmount === 0 ? "paid" : "partiallypaid";
    const newOrderStatus =
      newRemainingAmount === 0 ? "completed" : oldOrderStatus;

    const updatePayload: {
      paidAmount: number;
      remainingAmount: number;
      paymentStatus: string;
      status?: string;
    } = {
      paidAmount: newPaidAmount,
      remainingAmount: newRemainingAmount,
      paymentStatus: newPaymentStatus,
    };

    if (newRemainingAmount === 0) {
      updatePayload.status = "completed";
    }

    // 3. Update orders table
    await db.update(orders).set(updatePayload).where(eq(orders.id, orderId));

    // 4. Construct status change log
    const changes: string[] = [];

    if (newPaymentStatus !== oldPaymentStatus) {
      changes.push(
        `Payment Status Changed from ${formatStatus(oldPaymentStatus)} to ${formatStatus(newPaymentStatus)}`,
      );
    }

    const actionText =
      `Payment of ₹${amount} received.` +
      (changes.length ? ` ${changes.join(", ")}.` : "");

    // 5. Insert into paymentLogs
    await db.insert(paymentLogs).values({
      orderId,
      action: actionText,
      comments,
      documents,
    });

    return true;
  } catch (err) {
    console.error("Failed to apply payment", err);
    return false;
  }
}

export async function getUnits(): Promise<Unit[]> {
  try {
    const data = await db.select().from(units);

    // console.log("unitss",data)
    return data ?? [];
  } catch (error) {
    console.error("Failed to fetch units:", error);
    return [];
  }
}

export async function getPaymentMethods() {
  try {
    const data = await db.select().from(paymentMethods);
    return data ?? [];
  } catch (error) {
    console.error("Failed to fetch payment methods:", error);
    return [];
  }
}

export async function checkUserCredentials(
  phoneOrEmail: string,
  password: string,
): Promise<Omit<User, "password"> | null> {
  try {
    let user;

    if (!isNaN(Number(phoneOrEmail))) {
      // login with phone number
      user = await db
        .select()
        .from(users)
        .where(eq(users.phone, Number(phoneOrEmail)))
        .limit(1)
        .then((res) => res[0]);
    } else {
      // login with email
      user = await db
        .select()
        .from(users)
        .where(eq(users.email, phoneOrEmail))
        .limit(1)
        .then((res) => res[0]);
    }

    if (!user) return null;

    const isPasswordValid = await compare(password, user.password);
    if (!isPasswordValid) return null;

    const { password: _, ...userWithoutPassword } = user;

    return {
      ...userWithoutPassword,
      phone: user.phone?.toString() ?? "",
      createdAt: user.createdAt?.toISOString() ?? "",
    };
  } catch (error) {
    console.error("Error checking credentials:", error);
    return null;
  }
}

export async function resetPassword(
  phone: string,
  newPassword: string,
): Promise<boolean> {
  try {
    const result = await db
      .update(users)
      .set({ password: newPassword })
      .where(eq(users.phone, Number(phone)));

    return (result.rowCount ?? 0) > 0; // true if update happened
  } catch (error) {
    console.error("Failed to reset password:", (error as Error).message);
    return false;
  }
}
