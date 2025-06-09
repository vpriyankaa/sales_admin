export type Product = {
  id: number;
  createdAt: Date | null;
  name: string;
  quantity: number;
  unit: string;
  total_price: number;
  actual_price: number;
  price: number;
};
