export type DiscountType = 'flat' | 'percentage';

export function isDiscountType(value: any): value is DiscountType {
  return value === 'flat' || value === 'percentage';
}