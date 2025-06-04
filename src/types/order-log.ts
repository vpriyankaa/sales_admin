export type OrderLog = {
  id: number;
  createdAt: Date | null;
  orderId: number;
  action?: string | null;
  comments?: string | null;
  documents?: string | null;
};
