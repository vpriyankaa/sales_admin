"use server"

import { createClient } from "@supabase/supabase-js"
import {changeProductQuantity} from "@/utils/inventory"
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { NextResponse } from 'next/server';


const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL environment variable")
}

if (!supabaseServiceKey) {
  console.error("Missing SUPABASE_SERVICE_ROLE_KEY or NEXT_PUBLIC_SUPABASE_ANON_KEY environment variable")
}

const supabase = supabaseUrl && supabaseServiceKey ? createClient(supabaseUrl, supabaseServiceKey) : null


interface User {
  id: number;
  created_at: string;
  name: string;
  phone: string;
  password: string; 
  email: string;
}



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

// Add customer
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

// export async function editCustomer(customerData: {
//   id: string | number; 
//   name: string;
//   phone: number;
//   aadhaar?: string;
//   address?: string;
// }) {
//   const { id, name, phone, aadhaar, address } = customerData;

//   if (!id || !name || !phone) {
//     throw new Error("Id, name and phone are required");
//   }

//   if (!supabase) {
//     console.warn("Supabase client not initialized. Cannot edit customer.");
//     throw new Error(
//       "Database connection not available. Please set up Supabase environment variables."
//     );
//   }

//   const sanitizedCustomer = {
//     name,
//     phone,
//     aadhaar: aadhaar?.trim() || null,
//     address: address?.trim() || null,
//   };

//   try {
//     const { data, error } = await supabase
//       .from("customers")
//       .update(sanitizedCustomer)
//       .eq("id", id)        
//       .select("id")        
//       .single();

//     if (error) throw error;

//     return data.id;       
//   } catch (error) {
//     throw error;
//   }
// }


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

  if (!supabase) {
    console.warn("Supabase client not initialized. Cannot edit customer.");
    throw new Error(
      "Database connection not available. Please set up Supabase environment variables."
    );
  }

  // 1. Normalize incoming data
  const sanitizedCustomer = {
    name: name.trim(),
    phone,
    aadhaar: aadhaar?.trim() || null,
    address: address?.trim() || null,
  };

  try {
    // 2. Fetch current row for diffing
    const { data: current, error: fetchErr } = await supabase
      .from("customers")
      .select("name, phone, aadhaar, address")
      .eq("id", id)
      .single();

    if (fetchErr) throw fetchErr;
    if (!current) throw new Error("Customer not found.");

    // 3. Update the customer
    const { error: updateErr } = await supabase
      .from("customers")
      .update(sanitizedCustomer)
      .eq("id", id);

    if (updateErr) throw updateErr;

    // 4. Build a descriptive change log
    const changes: string[] = [];
    if (current.name !== sanitizedCustomer.name)
      changes.push(`name: changed from "${current.name}" to "${sanitizedCustomer.name}"`);
    if (current.phone !== sanitizedCustomer.phone)
      changes.push(`phone: changed from ${current.phone} to ${sanitizedCustomer.phone}`);
    if (current.aadhaar !== sanitizedCustomer.aadhaar)
      changes.push(
        `aadhaar: changed from "${current.aadhaar ?? "null"}" to "${sanitizedCustomer.aadhaar ?? "null"}"`
      );
    if (current.address !== sanitizedCustomer.address)
      changes.push(
        `address: changed from "${current.address ?? "null"}" to "${sanitizedCustomer.address ?? "null"}"`
      );

    const actionText = changes.length
      ? changes.join(", ")
      : "No changes – update called but data identical.";


    const { error: logErr } = await supabase.from("customerLogs").insert({
      customer_id: id,
      action: actionText,
      user: user,
    });

    if (logErr) throw logErr;

    return true;
  } catch (error) {
    console.error("Failed to edit customer", error);
    throw error;
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


// export async function addOrder(order: OrderInput): Promise<string> {
//   if (!supabase) throw new Error("Supabase client not initialized");

//   const reserved: typeof order.items = [];

//   try {

//     for (const item of order.items) {
//       await changeProductQuantity(+item.product_id, item.quantity, order.type);
//       reserved.push(item);
//     }


//     // Insert the order record
//     const { data, error } = await supabase
//       .from("orders")
//       .insert([
//         {
//           customer_id: order.customer_id?.trim() || null,
//           customer_name: order.customer_name?.trim() || null,
//           vendor_id: order.vendor_id?.trim() || null,
//           vendor_name: order.vendor_name?.trim() || null,
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
//           type: order.type,
//           status: order.status,
//           remarks: order.remarks,
//         },
//       ])
//       .select("id")
//       .single();

//     if (error) throw error;
//     return data!.id;

//   } catch (err) {
//     // Rollback inventory changes with **opposite type**
//     const rollbackType = order.type === 'sale' ? 'purchase' : 'sale';

//     for (const item of reserved) {
//       await changeProductQuantity(+item.product_id, item.quantity, rollbackType);
//     }

//     throw err;
//   }
// }


export async function addOrder(order: OrderInput): Promise<string> {
  if (!supabase) throw new Error("Supabase client not initialized");

  const reserved: typeof order.items = [];

  try {
    /* ░░ 1. Reserve / rollback‑safe inventory handling ░░ */
    for (const item of order.items) {
      await changeProductQuantity(+item.product_id, item.quantity, order.type);
      reserved.push(item);
    }

    /* ░░ 2. Insert the order ░░ */
    const { data: inserted, error: insertErr } = await supabase
      .from("orders")
      .insert([
        {
          customer_id:   order.customer_id?.trim() || null,
          customer_name: order.customer_name?.trim() || null,
          vendor_id:     order.vendor_id?.trim() || null,
          vendor_name:   order.vendor_name?.trim() || null,
          items:         order.items,
          date:          order.date,
          total_price:   order.total_price,
          discount_type: order.discount_type,
          discount_value:order.discount_value,
          total_payable: order.total_payable,
          paid_amount:   order.paid_amount,
          remaining_amount: order.remaining_amount,
          payment_method:   order.payment_method,
          payment_status:   order.payment_status,
          type:             order.type,
          status:           order.status,
          remarks:          order.remarks,
        },
      ])
      .select("id")           // we only need the id back
      .single();

    if (insertErr) throw insertErr;

    const orderId = inserted!.id;

    /* ░░ 3.  ➜  NEW: Write the initial payment log ░░ */
    if (order.paid_amount > 0) {
      const actionText = [
        `Payment of ₹${order.paid_amount.toFixed(2)} Received.`,
        
      ].join(" ");

      const { error: logErr } = await supabase
        .from("paymentLogs")
        .insert({
          order_id:  orderId,
          action:    actionText,
          comments:  order.remarks ?? null,
                   // or populate if you have docs at creation time
        });

      if (logErr) throw logErr;
    }

    /* ░░ 4. Done ░░ */
    return orderId;
  } catch (err) {
    /* ░░ 5. Roll back inventory if anything failed ░░ */
    const rollbackType = order.type === "sale" ? "purchase" : "sale";
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


export async function updateOrder(
  orderId: number,
  order: OrderInput
): Promise<void> {
  if (!supabase) throw new Error("Supabase client not initialized");

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
    for (const item of order.items) {
      const oldQty = prevMap.get(item.product_id) ?? 0;
      const delta = item.quantity - oldQty;

      if (delta !== 0) {
        // Always pass positive quantity
        await changeProductQuantity(
          parseInt(item.product_id),
          Math.abs(delta),
          delta > 0 ? order.type : order.type === "sale" ? "purchase" : "sale" // reverse the type if reducing quantity
        );
      }

      prevMap.delete(item.product_id);
    }

    for (const [prodId, qty] of prevMap) {
     
      await changeProductQuantity(
        parseInt(prodId),
        qty,
        order.type === "sale" ? "purchase" : "sale" 
      );
    }
  } catch (stockErr) {
    throw stockErr;
  }

  const cleanedOrder = {
    ...order,
    customer_id: order.customer_id?.trim() || null,
    customer_name: order.customer_name?.trim() || null,
    vendor_id: order.vendor_id?.trim() || null,
    vendor_name: order.vendor_name?.trim() || null,
  };

  const { error: updErr } = await supabase
    .from("orders")
    .update(cleanedOrder)
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


// export async function editProduct(productData: {
//   id: string | number;          
//   name: string;
//   quantity: number;
//   price: number;
//   unit: string;
// }) {
//   const { id, name, quantity, price, unit } = productData;

//   if (
//     id == null ||
//     !name ||
//     !unit ||
//     quantity == null ||
//     price == null
//   ) {
//     throw new Error("All product fields (including id) are required");
//   }

//   if (!supabase) {
//     console.warn("Supabase client not initialized. Cannot edit product.");
//     throw new Error(
//       "Database connection not available. Please set up Supabase environment variables."
//     );
//   }

//   try {
//     const { data, error } = await supabase
//       .from("products")
//       .update({
//         name,
//         quantity,
//         price,
//         unit,
//       })
//       .eq("id", id)     
//       .select("id")     
//       .single();

//     if (error) throw error;

//     return data.id;     
//   } catch (error) {
    
//     throw error;
//   }
// }


// utils/db/products.ts


export async function editProduct(productData: {
  id: string | number;
  name: string;
  quantity: number;
  price: number;
  unit: string;
  user: number;
}) {
  const { id, name, quantity, price, unit, user } = productData;

  if (id == null || !name || !unit || quantity == null || price == null) {
    throw new Error("All product fields (including id) are required");
  }

  if (!supabase) {
    console.warn("Supabase client not initialized. Cannot edit product.");
    throw new Error("Database connection not available.");
  }

  try {
    // 1. Fetch the current product
    const { data: current, error: fetchErr } = await supabase
      .from("products")
      .select("name, quantity, price, unit")
      .eq("id", id)
      .single();

    if (fetchErr) throw fetchErr;
    if (!current) throw new Error("Product not found.");

    // 2. Update the product
    const { error: updateErr } = await supabase
      .from("products")
      .update({ name, quantity, price, unit })
      .eq("id", id);

    if (updateErr) throw updateErr;

    // 3. Create the log message with clear "changed from → to" format
    const changes: string[] = [];
    if (current.name !== name)
      changes.push(`name: changed from "${current.name}" to "${name}"`);
    if (current.quantity !== quantity)
      changes.push(`quantity: changed from ${current.quantity} to ${quantity}`);
    if (current.price !== price)
      changes.push(`price: changed from ${current.price} to ${price}`);
    if (current.unit !== unit)
      changes.push(`unit: changed from "${current.unit}" to "${unit}"`);

    const actionText = changes.length
      ? changes.join(", ")
      : "No changes – update called but data identical.";

    // 4. Log the product update
    const { error: logErr } = await supabase
      .from("productLogs")
      .insert({
        product_id: id,
        action: actionText,
        user: user,
      });

    if (logErr) throw logErr;

    return true;
  } catch (error) {
    console.error("Failed to edit product", error);
    throw error;
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


// export async function editVendor(vendorData: {
//   id: string | number;        
//   name: string;
//   phone: number;
//   aadhaar?: string;
//   address?: string;
//   products: productItem[];
// }) {
//   const { id, name, phone, aadhaar, address, products } = vendorData;

//   if (
//     id == null ||
//     !name ||
//     !phone ||
//     products.length === 0
//   ) {
//     throw new Error("All vendor fields (including id) are required");
//   }

//   if (!supabase) {
//     console.warn("Supabase client not initialized. Cannot edit vendor.");
//     throw new Error(
//       "Database connection not available. Please set up Supabase environment variables."
//     );
//   }
//   const sanitizedVendor = {
//     name,
//     phone,
//     aadhaar: aadhaar?.trim() || null,
//     address: address?.trim() || null,
//     products,
//   };

 
//   try {
//     const { data, error } = await supabase
//       .from("vendors")
//       .update(sanitizedVendor)
//       .eq("id", id)         
//       .select("id")          
//       .single();

//     if (error) throw error;

//     return data.id;          
//   } catch (error) {
//     throw error;
//   }
// }

export async function editVendor(vendorData: {
  id: string | number;
  name: string;
  phone: number;
  aadhaar?: string;
  address?: string;
  products: productItem[];
  user?: number;
}) {
  const { id, name, phone, aadhaar, address, products, user } = vendorData;

  if (!id || !name || !phone || products.length === 0) {
    throw new Error("All vendor fields (including id) are required");
  }

  if (!supabase) {
    console.warn("Supabase client not initialized. Cannot edit vendor.");
    throw new Error("Database connection not available.");
  }

  const sanitizedVendor = {
    name: name.trim(),
    phone,
    aadhaar: aadhaar?.trim() || null,
    address: address?.trim() || null,
    products,
  };

  try {
    // 1. Fetch existing vendor
    const { data: current, error: fetchErr } = await supabase
      .from("vendors")
      .select("name, phone, aadhaar, address, products")
      .eq("id", id)
      .single();

    if (fetchErr) throw fetchErr;
    if (!current) throw new Error("Vendor not found.");

    // 2. Update vendor
    const { error: updateErr } = await supabase
      .from("vendors")
      .update(sanitizedVendor)
      .eq("id", id);

    if (updateErr) throw updateErr;

    // 3. Build change log
    const changes: string[] = [];

    if (current.name !== sanitizedVendor.name)
      changes.push(`name: changed from ${current.name} to ${sanitizedVendor.name}`);
    if (current.phone !== sanitizedVendor.phone)
      changes.push(`phone: changed from ${current.phone} to ${sanitizedVendor.phone}`);
    if (current.aadhaar !== sanitizedVendor.aadhaar)
      changes.push(
        `aadhaar: changed from ${current.aadhaar ?? "null"} to ${sanitizedVendor.aadhaar ?? "null"}`
      );
    if (current.address !== sanitizedVendor.address)
      changes.push(
        `address: changed from ${current.address ?? "null"} to ${sanitizedVendor.address ?? "null"}`
      );

    const productsChanged =
      JSON.stringify(current.products || []) !== JSON.stringify(products);

    if (productsChanged) {
      changes.push(`products list updated`);
    }

    const actionText =
      changes.length > 0
        ? changes.join(", ")
        : "No changes – update called but data identical.";

    // 4. Insert into vendorLogs
    const { error: logErr } = await supabase.from("vendorLogs").insert({
      vendor_id: id,
      action: actionText,
      user: user ?? null,
    });

    if (logErr) throw logErr;

    return true;
  } catch (error) {
    console.error("Failed to edit vendor", error);
    throw error;
  }
}




export async function getReports() {
  if (!supabase) {
    console.warn("Supabase client not initialized. Returning mock data.")
    return []
  }

  try {
    const { data, error } = await supabase
      .from("orders")
      .select("*")
      .or("type.is.null,type.eq.sale")
      .order("id", { ascending: false })

    if (error) {
      throw new Error("Failed to fetch orders")
    }

    return data || []
  } catch (error) {
    return []
  }
}

export async function getPurchaseList() {
  if (!supabase) {
    console.warn("Supabase client not initialized. Returning mock data.")
    return []
  }

  try {
    const { data, error } = await supabase
      .from("orders")
      .select("*")
      .eq("type", "purchase")
      .order("id", { ascending: false })

      // console.log("data",data);

    if (error) {
      throw new Error("Failed to fetch orders")
    }

    return data || []
  } catch (error) {
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

export async function getCustomerLogsById(orderId: number) {
  if (!supabase) {
    console.warn("Supabase client not initialized. Returning mock data.");
    return null;
  }

  //  console.log("orderId",orderId);
  
  try {
    const { data, error } = await supabase
      .from("customerLogs")
      .select("*")
      .eq("customer_id", orderId)
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

export async function getProductLogsById(orderId: number) {
  if (!supabase) {
    console.warn("Supabase client not initialized. Returning mock data.");
    return null;
  }

  //  console.log("orderId",orderId);
  
  try {
    const { data, error } = await supabase
      .from("productLogs")
      .select("*")
      .eq("product_id", orderId)
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

export async function getuser(id: number) {
  if (!supabase) {
    console.warn("Supabase client not initialized. Returning null.");
    return null;
  }

  try {
    const { data, error } = await supabase
      .from("user") 
      .select("*")
      .eq("id", id)
      .single(); 

    if (error) {
      throw new Error("Failed to fetch user by ID");
    }

    return data || null;
  } catch (error) {
    console.error("Error fetching user by ID:", error);
    return null;
  }
}


export async function getVendorLogsById(orderId: number) {
  if (!supabase) {
    console.warn("Supabase client not initialized. Returning mock data.");
    return null;
  }

  //  console.log("orderId",orderId);
  
  try {
    const { data, error } = await supabase
      .from("vendorLogs")
      .select("*")
      .eq("vendor_id", orderId)
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


// export async function changeOrderStatus(
//   orderId: number,
//   status: string,
//   comments = "",         
//   documents = ""
// ): Promise<boolean> {
//   if (!supabase) {
//     console.warn("Supabase client not initialized. Returning mock data.");
//     return false;
//   }

//   try {
//     const { data: row, error: fetchErr } = await supabase
//       .from("orders")
//       .select("status")
//       .eq("id", orderId)
//       .single();

//     if (fetchErr) throw fetchErr;
//     if (!row) throw new Error("Order not found.");

//     const oldStatus: string = row.status;


//     if (oldStatus === status) {
//       console.info("Status unchanged – still logging the action for traceability.");

//       await supabase
//         .from("orderLogs")
//         .insert({
//           order_id: orderId,
//           action: `Status unchanged: remains ${oldStatus}.`,
//           comments,
//           documents,
//         });

//       return true;
//     }

//     const { error: updateErr } = await supabase
//       .from("orders")
//       .update({ status })
//       .eq("id", orderId);

//     if (updateErr) throw updateErr;

//     const actionText =
//       `Status changed from ${oldStatus} → ${status}.`;

//     const { error: logErr } = await supabase
//       .from("orderLogs")
//       .insert({
//         order_id: orderId,
//         action: actionText,
//         comments,
//         documents,
//       });

//     if (logErr) throw logErr;

//     return true;
//   } catch (err) {
//     console.error("Failed to update order status", err);
//     return false;
//   }
// }

async function revertStockForCancelledOrder(orderId: number) {

   if (!supabase) {
    console.warn("Supabase client not initialized. Returning mock data.");
    return null;
  }

  //  console.log("orderId",orderId);
  
  const { data: order, error } = await supabase
    .from("orders")
    .select("type, items")
    .eq("id", orderId)
    .single();

  if (error) throw error;
  if (!order) throw new Error("Order not found while reverting stock.");

  const reverseType = "purchase" ;

  const items: { product_id: number; quantity: number }[] = order.items;

  for (const item of items) {
    const { product_id, quantity } = item;

    // Only pass product_id and quantity to your inventory function
    await changeProductQuantity(
      product_id,
      quantity,
      reverseType
    );
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

  const trx = supabase; 

  try {
    const { data: row, error: fetchErr } = await trx
      .from("orders")
      .select("status")
      .eq("id", orderId)
      .single();

    if (fetchErr) throw fetchErr;
    if (!row) throw new Error("Order not found.");

    const oldStatus: string = row.status;

    /* 2. If status unchanged just write a log */
    if (oldStatus === status) {
      await trx.from("orderLogs").insert({
        order_id: orderId,
        action: `Status unchanged: remains ${oldStatus}.`,
        comments,
        documents,
      });
      return true;
    }

    /* 3. If moving to “cancelled”, revert inventory first */
    if (status.toLowerCase() === "cancelled" && oldStatus.toLowerCase() !== "cancelled") {
      await revertStockForCancelledOrder(orderId);
    }

    /* 4. Update status */
    const { error: updateErr } = await trx
      .from("orders")
      .update({ status })
      .eq("id", orderId);

    if (updateErr) throw updateErr;

    /* 5. Log the transition */
    const { error: logErr } = await trx.from("orderLogs").insert({
      order_id: orderId,
      action: `Status changed from ${oldStatus} → ${status}.`,
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

// export async function changeOrderPayment(
//   orderId: number,
//   amount: number,
//   comments:string, 
//   documents :string
// ): Promise<boolean> {
//   if (!supabase) {
//     console.warn("Supabase client not initialized. Returning mock data.");
//     return false;
//   }

//   if (amount <= 0) {
//     console.error("Amount must be greater than 0.");
//     return false;
//   }

//   try {
//     const { data: row, error: fetchErr } = await supabase
//       .from("orders")
//       .select("paid_amount, remaining_amount, total_payable, payment_status")
//       .eq("id", orderId)
//       .single();

//     if (fetchErr) throw fetchErr;
//     if (!row) throw new Error("Order not found.");

//     const {
//       paid_amount = 0,
//       remaining_amount = 0,
//       total_payable = 0,
//       payment_status: oldStatus,
//     } = row;

//     const newPaidAmount = Math.min(paid_amount + amount, total_payable);
//     const newRemainingAmount = Math.max(total_payable - newPaidAmount, 0);

//     const newStatus = newRemainingAmount === 0 ? "paid" : "partiallypaid";

//     const { error: updateErr } = await supabase
//       .from("orders")
//       .update({
//         paid_amount: newPaidAmount,
//         remaining_amount: newRemainingAmount,
//         payment_status: newStatus,
//       })
//       .eq("id", orderId);

//     if (updateErr) throw updateErr;

//     // ✅ Only log if the status actually changed
//     if (newStatus !== oldStatus) {
//       const actionText = `Payment of ₹${amount.toFixed(2)} received. `
//         + `Status changed from ${oldStatus} to ${newStatus}. `


//         // console.log("comments",comments);
//         // console.log("documents",documents);

//       const { error: logErr } = await supabase
//         .from("paymentLogs")
//         .insert({ order_id: orderId, action: actionText ,comments:comments ,documents:documents});

//       if (logErr) throw logErr;
//     }else{
//       if (newStatus === oldStatus) {
//       const actionText = `Payment of ₹${amount} received. `
        
//       const { error: logErr } = await supabase
//         .from("paymentLogs")
//         .insert({ order_id: orderId, action: actionText,comments:comments ,documents:documents });

//       if (logErr) throw logErr;
//     }
//     }

//     return true;
//   } catch (err) {
//     console.error("Failed to apply payment", err);
//     return false;
//   }
// }

export async function changeOrderPayment(
  orderId: number,
  amount: number,
  comments: string,
  documents: string
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
      .select("paid_amount, remaining_amount, total_payable, payment_status, status")
      .eq("id", orderId)
      .single();

    if (fetchErr) throw fetchErr;
    if (!row) throw new Error("Order not found.");

    const {
      paid_amount = 0,
      remaining_amount = 0,
      total_payable = 0,
      payment_status: oldPaymentStatus,
      status: oldOrderStatus,
    } = row;

    const newPaidAmount      = Math.min(paid_amount + amount, total_payable);
    const newRemainingAmount = Math.max(total_payable - newPaidAmount, 0);

    const newPaymentStatus = newRemainingAmount === 0 ? "paid" : "partiallypaid";
    const newOrderStatus   = newRemainingAmount === 0 ? "completed" : oldOrderStatus;

   
    const updatePayload: Record<string, any> = {
      paid_amount:      newPaidAmount,
      remaining_amount: newRemainingAmount,
      payment_status:   newPaymentStatus,
    };

    if (newRemainingAmount === 0) {
      updatePayload.status = "completed";
    }

    
    const { error: updateErr } = await supabase
      .from("orders")
      .update(updatePayload)
      .eq("id", orderId);

    if (updateErr) throw updateErr;

    
    const changes: string[] = [];
    if (newPaymentStatus !== oldPaymentStatus) {
      changes.push(`payment_status: ${oldPaymentStatus} → ${newPaymentStatus}`);
    }
    if (updatePayload.status && updatePayload.status !== oldOrderStatus) {
      changes.push(`status: ${oldOrderStatus} → ${updatePayload.status}`);
    }

    const actionText =
      `Payment of ₹${amount.toFixed(2)} received.` +
      (changes.length ? ` Status changed (${changes.join(", ")}).` : "");

    const { error: logErr } = await supabase
      .from("paymentLogs")
      .insert({
        order_id: orderId,
        action: actionText,
        comments,
        documents,
      });

    if (logErr) throw logErr;

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


export async function checkUserCredentials(phoneOrEmail: string, password: string): Promise<User | null> {
  if (!supabase) {
    console.warn("Supabase client not initialized.");
    return null;
  }

  const { data, error } = await supabase
    .from<'user', User>('user')
    .select('*')
    .or(`phone.eq.${phoneOrEmail},email.eq.${phoneOrEmail}`)
    .limit(1)
    .single();

  if (error || !data || data.password !== password) {
    return null;
  }

  const { password: _, ...userWithoutPassword } = data;
  return userWithoutPassword;
}
