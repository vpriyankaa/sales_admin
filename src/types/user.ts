export type User = {
  id: number;
  createdAt: string | null;
  name: string;
  phone: string;
  password?: string | null; 
  email: string;
}