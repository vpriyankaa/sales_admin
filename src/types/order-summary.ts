import type { DiscountType } from './discount-type';

export type OrderSummary = {
    discountAmount: number
    discountType: DiscountType
    remarks: string
    totalAmount: number
    totalPayable: number
    paidAmount: number
    paymentMethod: string
}