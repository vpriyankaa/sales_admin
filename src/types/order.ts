import type { Product } from './product';

export type Order = {
  id: number;
  createdAt: Date | null;
  customerId: number;
  customerName: string;
  items: Product[]; // Updated here
  totalPrice: number;
  status: string;
  paymentMethod: string;
  discountType?: string | null;
  discountValue?: number | null;
  remainingAmount?: number | null;  // ✅ allow null
  paidAmount?: number | null;
  remarks?: string | null;
  paymentStatus?: string | null;
  totalPayable: number;
  date: Date;
  type?: string | null;
  vendorId?: number | null;
  vendorName?: string | null;
};

