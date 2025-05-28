"use server"

import { createClient } from "@supabase/supabase-js"
import {changeProductQuantity} from "@/utils/inventory"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL environment variable")
}

if (!supabaseServiceKey) {
  console.error("Missing SUPABASE_SERVICE_ROLE_KEY or NEXT_PUBLIC_SUPABASE_ANON_KEY environment variable")
}

const supabase = supabaseUrl && supabaseServiceKey ? createClient(supabaseUrl, supabaseServiceKey) : null



// console.log("supabase" ,supabase);


// Get all customers
export async function getCustomers() {
  if (!supabase) {
    console.warn("Supabase client not initialized. Returning mock data.")
    return [{ id: "1", name: "Sample Customer", phone: "123-456-7890" }]
  }

  try {
    const { data, error } = await supabase.from("customers").select('*').order("id", { ascending: false })

    if (error) {
      // console.error("Error fetching customers:", error)
      throw error
    }

    return data || []
  } catch (error) {
    // console.error("Error in getCustomers:", error)
    return []
  }
}

// Get all products
export async function getProducts() {
  if (!supabase) {
    console.warn("Supabase client not initialized. Returning mock data.")
    return []
  }

  try {
     const { data, error } = await supabase.from("products").select("*").gt("quantity", 0);
     
    // console.log("products data" ,data );


    if (error) {
      // console.error("Error fetching particulars:", error)
      throw error
    }

    return data || []
  } catch (error) {
    // console.error("Error in getProducts:", error)
    return []
  }
}

export async function getVendors() {
  if (!supabase) {
    console.warn("Supabase client not initialized. Returning mock data.")
    return []
  }

  try {
     const { data, error } = await supabase.from("vendors").select("*");
     
    // console.log("products data" ,data );


    if (error) {
      // console.error("Error fetching particulars:", error)
      throw error
    }

    return data || []
  } catch (error) {
    // console.error("Error in getProducts:", error)
    return []
  }
}

// Add a new customer
export async function addCustomer(customerData: {
  name: string
  phone: string
  aadhaar?: string
  address?: string
}) {
  if (!customerData.name || !customerData.phone) {
    throw new Error("Name and phone are required")
  }

  if (!supabase) {
    console.warn("Supabase client not initialized. Cannot add customer.")
    throw new Error("Database connection not available. Please set up Supabase environment variables.")
  }

  // Convert undefined to empty string for optional fields
  const sanitizedCustomer = {
    ...customerData,
    aadhaar: customerData.aadhaar?.trim() || null,
    address: customerData.address?.trim() || null,
  }

  try {
    const { data, error } = await supabase
      .from("customers")
      .insert([sanitizedCustomer])
      .select("id")
      .single()

    if (error) {
      // console.error("Error adding customer:", error)
      throw error
    }

    return data.id
  } catch (error) {
    // console.error("Error in addCustomer:", error)
    throw error
  }
}


// place order
export type OrderItem = {
  product_id: string
  product_name: string
  quantity: number
  price: number
  unit:string
}

export type OrderInput = {     
  
  id?: number;

  customer_id: string;
  customer_name: string;
  vendor_id: string;
  vendor_name: string;
  items: OrderItem[];
  total_price: number;   
  date : Date;          
  discount_type: 'flat' | 'percentage';
  discount_value: number;         
  paid_amount: number;
  remaining_amount: number;        // auto-calculated (total_payable - paid_amount)
  payment_method: string;
  status: string;                  // e.g. 'pending'
  remarks: string;
  type: "sale" | "purchase"; 
  payment_status:string;
  total_payable: number;
  
};


// export async function addOrder(order: OrderInput): Promise<string> {
//   if (!supabase) throw new Error('Supabase client not initialized');

//   const { data, error } = await supabase
//     .from('orders')
//     .insert([
//       {
//         customer_id: order.customer_id,
//         customer_name: order.customer_name,
//         items: order.items,
//         date:order.date,
//         total_price:     order.total_price,
//         discount_type:   order.discount_type,
//         discount_value:  order.discount_value,
//         total_payable:order.total_payable,
//         paid_amount:     order.paid_amount,
//         remaining_amount: order.remaining_amount,
//         payment_method:  order.payment_method,
//         payment_status:order.payment_status,  
//         status:          order.status,
//         remarks:         order.remarks,
//       },
//     ])
//     .select('id')
//     .single();

//   if (error) throw error;
//   return data.id;
// }

// export async function addOrder(order: OrderInput): Promise<string> {
//   if (!supabase) throw new Error("Supabase client not initialized");

 
//   const reserved: typeof order.items = [];

//   try {
 
//     for (const item of order.items) {
//       await changeProductQuantity(+item.product_id, -item.quantity,);
//       reserved.push(item);                     
//     }

//     const { data, error } = await supabase
//       .from("orders")
//       .insert([
//         {
//           customer_id: order.customer_id,
//           customer_name: order.customer_name,
//           items: order.items,
//           date: order.date,
//           total_price: order.total_price,
//           discount_type: order.discount_type,
//           discount_value: order.discount_value,
//           total_payable: order.total_payable,
//           paid_amount: order.paid_amount,
//           remaining_amount: order.remaining_amount,
//           payment_method: order.payment_method,
//           payment_status: order.payment_status,
//           type:order.discount_type,
//           status: order.status,
//           remarks: order.remarks,
//           type:order.type
//         },
//       ])
//       .select("id")
//       .single();

//     if (error) throw error;
//     return data!.id;                         
//   } catch (err) {
   
//     for (const item of reserved) {
//       await changeProductQuantity(+item.product_id, item.quantity,'purchase');
//     }
//     throw err;                              
//   }
// }


export async function addOrder(order: OrderInput): Promise<string> {
  if (!supabase) throw new Error("Supabase client not initialized");

  const reserved: typeof order.items = [];

  try {
    // Decrease/increase inventory for each item
    for (const item of order.items) {
      await changeProductQuantity(+item.product_id, item.quantity, order.type);
      reserved.push(item);
    }


    // Insert the order record
    const { data, error } = await supabase
      .from("orders")
      .insert([
        {
          customer_id: order.customer_id?.trim() || null,
          customer_name: order.customer_name?.trim() || null,
          vendor_id: order.vendor_id?.trim() || null,
          vendor_name: order.vendor_name?.trim() || null,
          items: order.items,
          date: order.date,
          total_price: order.total_price,
          discount_type: order.discount_type,
          discount_value: order.discount_value,
          total_payable: order.total_payable,
          paid_amount: order.paid_amount,
          remaining_amount: order.remaining_amount,
          payment_method: order.payment_method,
          payment_status: order.payment_status,
          type: order.type,
          status: order.status,
          remarks: order.remarks,
        },
      ])
      .select("id")
      .single();

    if (error) throw error;
    return data!.id;

  } catch (err) {
    // Rollback inventory changes with **opposite type**
    const rollbackType = order.type === 'sale' ? 'purchase' : 'sale';

    for (const item of reserved) {
      await changeProductQuantity(+item.product_id, item.quantity, rollbackType);
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

// export async function updateOrder(orderId : number , order: Partial<OrderInput>): Promise<void> {
//   if (!supabase) throw new Error('Supabase client not initialized');

//   const {...fieldsToUpdate } = order;

//   const { error } = await supabase
//     .from('orders')
//     .update(fieldsToUpdate)
//     .eq('id', orderId);

//   if (error) throw error;
// }


// export async function updateOrder(
//   orderId: number,
//   newOrder: OrderInput          // full payload for simplicity
// ): Promise<void> {
//   if (!supabase) throw new Error('Supabase client not initialized');

//   // 1) fetch existing items
//   const { data: old, error: fetchErr } = await supabase
//     .from('orders')
//     .select('items')
//     .eq('id', orderId)
//     .single();
//   if (fetchErr) throw fetchErr;

//   const prevMap = new Map<string, number>(
//     old.items.map((i: any) => [i.product_id, i.quantity])
//   );

//   // 2) apply stock deltas
//   try {
//     // A) adjust for items that remain / changed
//     for (const item of newOrder.items) {
//       const oldQty = prevMap.get(item.product_id) ?? 0;
//       const delta  = item.quantity - oldQty;   // +ve means need more stock
//       if (delta !== 0) await changeProductQuantity(parseInt(item.product_id), -delta ,order.type);
//       prevMap.delete(item.product_id);
//     }
//     // B) any products removed from order → return stock
//     for (const [prodId, qty] of prevMap) {
//       await changeProductQuantity(parseInt(prodId), qty ,order.type);
//     }
//   } catch (stockErr) {
//     throw stockErr;   // insufficient stock rolls the whole update
//   }

//   // 3) finally update the order row
//   const { error: updErr } = await supabase
//     .from('orders')
//     .update(newOrder)
//     .eq('id', orderId);
//   if (updErr) throw updErr;
// }


export async function updateOrder(
  orderId: number,
  newOrder: OrderInput // assumed to be strictly typed
): Promise<void> {
  if (!supabase) throw new Error("Supabase client not initialized");

  // 1) Fetch existing order items
  const { data: old, error: fetchErr } = await supabase
    .from("orders")
    .select("items")
    .eq("id", orderId)
    .single();

  if (fetchErr) throw fetchErr;

  const prevMap = new Map<string, number>(
    old.items.map((i: any) => [i.product_id, i.quantity])
  );

  try {
    // A) Handle updated or unchanged items
    for (const item of newOrder.items) {
      const oldQty = prevMap.get(item.product_id) ?? 0;
      const delta = item.quantity - oldQty; // positive = added more items

      if (delta !== 0) {
        const direction = newOrder.type === "sale" ? -delta : delta;
        await changeProductQuantity(parseInt(item.product_id), direction, newOrder.type);
      }

      prevMap.delete(item.product_id); // mark as handled
    }

    // B) Handle removed items (restore their stock)
    for (const [prodId, qty] of prevMap) {
      const direction = newOrder.type === "sale" ? qty : -qty;
      await changeProductQuantity(parseInt(prodId), direction, newOrder.type);
    }
  } catch (stockErr) {
    throw stockErr; // short-circuit if any stock change fails
  }

  // 3) Update the order
  const { error: updErr } = await supabase
    .from("orders")
    .update(newOrder)
    .eq("id", orderId);

  if (updErr) throw updErr;
}



export async function addProduct(productData: {
  name: string;
  quantity: number;
  price: number;
  unit: string;
}) {
  const { name, quantity, price, unit } = productData;

  if (!name || !unit || quantity == null || price == null) {
    throw new Error("All product fields are required");
  }

  if (!supabase) {
    console.warn("Supabase client not initialized. Cannot add product.");
    throw new Error("Database connection not available. Please set up Supabase environment variables.");
  }

  try {
    const { data, error } = await supabase
      .from("products")
      .insert([productData]) // no "id"
      .select("id")
      .single();

    if (error) {
      // console.error("Error adding product:", error);
      throw error
    }

    return data.id;
  } catch (error) {
    // console.error("Error in addProduct:", error);
    throw error
  }
}

export type productItem = {
  product_id: number
  product_name: string
}



export async function addVendor(vendorData: {
  name: string;
  phone: number;
  aadhaar?: string
  address?: string
  products: productItem[];
  
}) {
  const { name,phone,aadhaar,address, products } = vendorData;

  // console.log("vendorData",vendorData);

   const sanitizedCustomer = {
    ...vendorData,
    aadhaar: vendorData.aadhaar?.trim() || null,
    address: vendorData.address?.trim() || null,
  }

  if (!name || !phone || products.length == 0 ) {
    throw new Error("All product fields are required");
  }

  if (!supabase) {
    console.warn("Supabase client not initialized. Cannot add product.");
    throw new Error("Database connection not available. Please set up Supabase environment variables.");
  }

  try {
    const { data, error } = await supabase
      .from("vendors")
      .insert([sanitizedCustomer])
      .select("id")
      .single();

      // console.log("data",data);
      // console.log("error",error);


    if (error) {
      // console.error("Error adding product:", error);
      throw error
    }

    return data.id;
  } catch (error) {
    // console.error("Error in addProduct:", error);
    throw error
  }
}


export async function getReports(){
  if (!supabase) {
    console.warn("Supabase client not initialized. Returning mock data.")
    return []
  }

  try {
     const { data, error } = await supabase.from("orders").select("*").order("id", { ascending: false });
     
    // console.log("products data" ,data );


    if (error) {
      // console.error("Error fetching orders", error)
      throw new Error("Failed to fetch orders");
    }

    return data || []
  } catch (error) {
    // console.error("Error in orders" ,error)
    return []
  }
}

export async function getOrderLogsById(orderId: number) {
  if (!supabase) {
    console.warn("Supabase client not initialized. Returning mock data.");
    return null;
  }

  //  console.log("orderId",orderId);
  
  try {
    const { data, error } = await supabase
      .from("orderLogs")
      .select("*")
      .eq("order_id", orderId)
      .order("id", { ascending: false });

      // console.log("data",data);

    if (error) {
      throw new Error("Failed to fetch order by ID");
    }

    return data || null;
  } catch (error) {
    console.error("Error fetching order by ID:", error);
    return null;
  }
}

export async function getPaymentLogsById(orderId: number) {
  if (!supabase) {
    console.warn("Supabase client not initialized. Returning mock data.");
    return null;
  }

  //  console.log("orderId",orderId);
  
  try {
    const { data, error } = await supabase
      .from("paymentLogs")
      .select("*")
      .eq("order_id", orderId)
      .order("id", { ascending: false });

      // console.log("data",data);

    if (error) {
      throw new Error("Failed to fetch order by ID");
    }

    return data || null;
  } catch (error) {
    console.error("Error fetching order by ID:", error);
    return null;
  }
}

export async function getOrderById(orderId: number) {
  if (!supabase) {
    console.warn("Supabase client not initialized. Returning mock data.");
    return null;
  }

  // console.log("orderId",orderId);
  
  try {
    const { data, error } = await supabase
      .from("orders")
      .select("*")
      .eq("id", orderId)
      .single();

    if (error) {
      throw new Error("Failed to fetch order by ID");
    }

    return data || null;
  } catch (error) {
    console.error("Error fetching order by ID:", error);
    return null;
  }
}


export async function changeOrderStatus(
  orderId: number,
  status: string,
  comments = "",         
  documents = ""
): Promise<boolean> {
  if (!supabase) {
    console.warn("Supabase client not initialized. Returning mock data.");
    return false;
  }

  try {
    const { data: row, error: fetchErr } = await supabase
      .from("orders")
      .select("status")
      .eq("id", orderId)
      .single();

    if (fetchErr) throw fetchErr;
    if (!row) throw new Error("Order not found.");

    const oldStatus: string = row.status;


    if (oldStatus === status) {
      console.info("Status unchanged – still logging the action for traceability.");

      await supabase
        .from("orderLogs")
        .insert({
          order_id: orderId,
          action: `Status unchanged: remains ${oldStatus}.`,
          comments,
          documents,
        });

      return true;
    }

    const { error: updateErr } = await supabase
      .from("orders")
      .update({ status })
      .eq("id", orderId);

    if (updateErr) throw updateErr;

    const actionText =
      `Status changed from ${oldStatus} → ${status}.`;

    const { error: logErr } = await supabase
      .from("orderLogs")
      .insert({
        order_id: orderId,
        action: actionText,
        comments,
        documents,
      });

    if (logErr) throw logErr;

    return true;
  } catch (err) {
    console.error("Failed to update order status", err);
    return false;
  }
}

export async function changeOrderPaymentStatus(
  orderId: number,
  newStatus: string
): Promise<boolean> {
  if (!supabase) {
    console.warn("Supabase client not initialized. Returning mock data.");
    return false;
  }

  try {
   
    const { data: currentRow, error: fetchErr } = await supabase
      .from("orders")
      .select("payment_status, total_price, discount_value")
      .eq("id", orderId)
      .single();

    if (fetchErr) throw fetchErr;

    const oldStatus = currentRow?.payment_status ?? "";

    const updatePayload: Record<string, unknown> = {
      payment_status: newStatus,
    };

    if (newStatus === "paid") {
      // total after discount = total_price – discount_value (with safe fallbacks)
      const totalAfterDiscount =
        (currentRow?.total_price ?? 0) - (currentRow?.discount_value ?? 0);

      updatePayload.remaining_amount = 0;
      updatePayload.paid_amount = totalAfterDiscount;
    }

    
    const { error: updateErr } = await supabase
      .from("orders")
      .update(updatePayload)
      .eq("id", orderId);

    if (updateErr) throw updateErr;

   
    const actionText = `Order payment status changed from ${oldStatus} to ${newStatus}.`;

    const { error: insertErr } = await supabase
      .from("orderLogs")
      .insert({
        order_id: orderId,
        action: actionText,
      });

    if (insertErr) throw insertErr;

    return true;
  } catch (err) {
    console.error("Failed to update order status", err);
    return false;
  }
}

export async function changeOrderPayment(
  orderId: number,
  amount: number,
  comments:string, 
  documents :string
): Promise<boolean> {
  if (!supabase) {
    console.warn("Supabase client not initialized. Returning mock data.");
    return false;
  }

  if (amount <= 0) {
    console.error("Amount must be greater than 0.");
    return false;
  }

  try {
    const { data: row, error: fetchErr } = await supabase
      .from("orders")
      .select("paid_amount, remaining_amount, total_payable, payment_status")
      .eq("id", orderId)
      .single();

    if (fetchErr) throw fetchErr;
    if (!row) throw new Error("Order not found.");

    const {
      paid_amount = 0,
      remaining_amount = 0,
      total_payable = 0,
      payment_status: oldStatus,
    } = row;

    const newPaidAmount = Math.min(paid_amount + amount, total_payable);
    const newRemainingAmount = Math.max(total_payable - newPaidAmount, 0);

    const newStatus = newRemainingAmount === 0 ? "paid" : "partiallypaid";

    const { error: updateErr } = await supabase
      .from("orders")
      .update({
        paid_amount: newPaidAmount,
        remaining_amount: newRemainingAmount,
        payment_status: newStatus,
      })
      .eq("id", orderId);

    if (updateErr) throw updateErr;

    // ✅ Only log if the status actually changed
    if (newStatus !== oldStatus) {
      const actionText = `Payment of ₹${amount.toFixed(2)} received. `
        + `Status changed from ${oldStatus} to ${newStatus}. `


        // console.log("comments",comments);
        // console.log("documents",documents);

      const { error: logErr } = await supabase
        .from("paymentLogs")
        .insert({ order_id: orderId, action: actionText ,comments:comments ,documents:documents});

      if (logErr) throw logErr;
    }else{
      if (newStatus === oldStatus) {
      const actionText = `Payment of ₹${amount} received. `
        
      const { error: logErr } = await supabase
        .from("paymentLogs")
        .insert({ order_id: orderId, action: actionText,comments:comments ,documents:documents });

      if (logErr) throw logErr;
    }
    }

    return true;
  } catch (err) {
    console.error("Failed to apply payment", err);
    return false;
  }
}


export async function getUnits(){
  if (!supabase) {
    console.warn("Supabase client not initialized. Returning mock data.")
    return []
  }

  try {
     const { data, error } = await supabase.from("units").select("*");
     
    // console.log("products data" ,data );

    if (error) {
      // console.error("Error fetching orders", error)
      throw new Error("Failed to fetch units");
    }

    return data || []
  } catch (error) {
    // console.error("Error in orders" ,error)
    return []
  }
}

export async function getPaymentMethods(){
  if (!supabase) {
    console.warn("Supabase client not initialized. Returning mock data.")
    return []
  }

  try {
     const { data, error } = await supabase.from("paymentMethods").select("*");
     
    // console.log("products data" ,data );

    if (error) {
      // console.error("Error fetching payment Methods", error)
      throw new Error("Failed to fetch payment Methods");
    }

    return data || []
  } catch (error) {
    // console.error("Error in paymentMethods" ,error)
    return []
  }
}