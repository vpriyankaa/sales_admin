export type Customer = {
  id: number;
  createdAt: Date | null;
  name: string;
  phone: number;
  aadhaar?: string | null;
  address?: string | null;
};
