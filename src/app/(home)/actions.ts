"use server"

import { createClient } from "@supabase/supabase-js"

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
    const { data, error } = await supabase.from("customers").select("id, name, phone, adhaar, address").order("name")

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
export async function getParticulars() {
  if (!supabase) {
    console.warn("Supabase client not initialized. Returning mock data.")
    return []
  }

  try {
     const { data, error } = await supabase.from("products").select("*");
     
    // console.log("products data" ,data );


    if (error) {
      // console.error("Error fetching particulars:", error)
      throw error
    }

    return data || []
  } catch (error) {
    // console.error("Error in getParticulars:", error)
    return []
  }
}

// Add a new customer
export async function addCustomer(customerData: {
  name: string
  phone: string
  adhaar?: string
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
    adhaar: customerData.adhaar?.trim() || null,
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
  customer_id: string;
  customer_name: string;
  items: OrderItem[];
  total_price: number;             
  discount_type: 'flat' | 'percentage';
  discount_value: number;         
  paid_amount: number;
  remaining_amount: number;        // auto-calculated (total_payable - paid_amount)
  payment_method: string;
  status: string;                  // e.g. 'pending'
  remarks: string;
  payment_status:string;
  total_amount: number;
  total_payable: number;
  discount_amount?: number;
};

export async function addOrder(order: OrderInput): Promise<string> {
  if (!supabase) throw new Error('Supabase client not initialized');

  const { data, error } = await supabase
    .from('orders')
    .insert([
      {
        customer_id: order.customer_id,
        customer_name: order.customer_name,
        items: order.items,

        total_price:     order.total_price,
        discount_type:   order.discount_type,
        discount_value:  order.discount_value,

        paid_amount:     order.paid_amount,
        remaining_amount: order.remaining_amount,
        payment_method:  order.payment_method,
        payment_status:order.payment_status,  
        status:          order.status,
        remarks:         order.remarks,
      },
    ])
    .select('id')
    .single();

  if (error) throw error;
  return data.id;
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


export async function getReports(){
  if (!supabase) {
    console.warn("Supabase client not initialized. Returning mock data.")
    return []
  }

  try {
     const { data, error } = await supabase.from("orders").select("*");
     
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


export async function getOrderById(orderId: number) {
  if (!supabase) {
    console.warn("Supabase client not initialized. Returning mock data.");
    return null;
  }

  console.log("orderId",orderId);
  
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


export async function changeOrderStatus(orderId: number, status: string) {

   if (!supabase) {
    console.warn("Supabase client not initialized. Returning mock data.")
    return []
  }

  try {
    const { error } = await supabase
      .from("orders")
      .update({ status })
      .eq("id", orderId);

    if (error) throw error;

    return true;
  } catch (error) {
    console.error("Failed to update order status", error);
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
    /* -------------------------------------------------------------
     * 1️⃣  Get the current status (so we can write a meaningful log)
     * ----------------------------------------------------------- */
    const { data: currentRow, error: fetchErr } = await supabase
      .from("orders")
      .select("payment_status")
      .eq("id", orderId)
      .single();

    if (fetchErr) throw fetchErr;
    const oldStatus = currentRow?.payment_status ?? "";

    /* -------------------------------------------------------------
     * 2️⃣  Update the order
     * ----------------------------------------------------------- */
    const { error: updateErr } = await supabase
      .from("orders")
      .update({ payment_status: newStatus })
      .eq("id", orderId);

    if (updateErr) throw updateErr;

    const actionText = `Order payment status changed from "${oldStatus}" to "${newStatus}".`;

    const { error: insertErr } = await supabase
      .from("orderLogs") // ⬅️  <-- replace with your table name
      .insert({
        order_id: orderId,
        action: actionText,
        // created_at will auto-fill if the column has a default of now()
      });

    if (insertErr) throw insertErr;

    return true;
  } catch (err) {
    console.error("Failed to update order status", err);
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