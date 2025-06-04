import type { Product } from './product';
import type { DiscountType } from './discount-type';

export type OrderInput = {
  id?: number;
  customer_id: number;
  customer_name: string;
  vendor_id: string;
  vendor_name: string;
  items: Product[];
  total_price: number;
  date: Date;
  discount_type: DiscountType;
  discount_value: number;
  paid_amount: number;
  remaining_amount: number;        // auto-calculated (total_payable - paid_amount)
  payment_method: string;
  status: string;                  // e.g. 'pending'
  remarks: string;
  type: "sale" | "purchase";
  payment_status: string;
  total_payable: number;

};