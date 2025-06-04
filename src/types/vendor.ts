import type { Product } from './product';

export type Vendor = {
  id: number;
  createdAt: Date | null;
  name: string;
  phone: number;
  products?: Product[] | null;
  aadhaar?: number | null;
  address?: string | null;
};