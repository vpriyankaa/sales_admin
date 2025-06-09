
"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { getPaymentMethods } from "@/app/actions"
import type { Product } from "app-types/product"
import type { PaymentMethod } from "app-types/payment-method"
import type { OrderSummary } from "app-types/order-summary"
import { isDiscountType, type DiscountType } from "app-types/discount-type"

interface OrderSummaryProps {
  cart: Product[]
  selectedUser: string
  isSubmitting: boolean
  isEditMode: boolean
  editOrderSummary: OrderSummary | null
  onPlaceOrder: (
    orderData: OrderSummary,
    errors: { paymentMethod?: string; paidAmount?: string },
  ) => void | Promise<void>
}

export function OrderSummary({
  cart,
  selectedUser,
  isSubmitting,
  isEditMode,
  editOrderSummary,
  onPlaceOrder,
}: OrderSummaryProps) {
  const [discount, setDiscount] = useState<number>(0)
  const [discountType, setDiscountType] = useState<DiscountType>("flat")
  const [errors, setErrors] = useState<{
    paymentMethod?: string
    paidAmount?: string
    remarks?: string
  }>({})
  const [paymentMethod, setPaymentMethod] = useState<string>("")
  const [remarks, setRemarks] = useState<string>("")
  const [paidAmount, setPaidAmount] = useState<number>(0)
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([])

  // Initialize with edit data if in edit mode
  useEffect(() => {
    if (isEditMode && editOrderSummary) {
      setDiscount(editOrderSummary.discountAmount)
      setDiscountType(editOrderSummary.discountType)
      setRemarks(editOrderSummary.remarks)
      setPaidAmount(editOrderSummary.paidAmount)
      setPaymentMethod(editOrderSummary.paymentMethod)
    }
  }, [isEditMode, editOrderSummary])

  const rawTotalPrice = cart.reduce((sum, item) => sum + item.price * item.quantity, 0)
  const totalPriceDisplay = rawTotalPrice % 1 === 0 ? rawTotalPrice.toString() : rawTotalPrice.toFixed(2)

  // Calculate discount
  const discountAmount =
    discountType === "percentage"
      ? rawTotalPrice * (Math.min(discount, 100) / 100) // clamp 0-100 %
      : discount

  const rawTotalAfterDiscount = Math.max(rawTotalPrice - discountAmount, 0)

  // Subtract paidAmount
  const remainingAmount = Math.max(rawTotalAfterDiscount - paidAmount, 0)

  const totalAmount =
    rawTotalAfterDiscount % 1 === 0 ? rawTotalAfterDiscount.toString() : rawTotalAfterDiscount.toFixed(2)

  // Optional: formatted display
  const remainingAmountDisplay = remainingAmount % 1 === 0 ? remainingAmount.toString() : remainingAmount.toFixed(2)

  // When total changes, pre-fill paidAmount with full payable (only for new orders)
  useEffect(() => {
    if (!isEditMode) {
      setPaidAmount(rawTotalAfterDiscount)
    }
  }, [rawTotalAfterDiscount, isEditMode])

  useEffect(() => {
    const fetchData = async () => {
      try {
        const paymentMethodsData = await getPaymentMethods()

        // console.log('paymentMethodsData',paymentMethodsData);

        setPaymentMethods(paymentMethodsData)
      } catch (error) {
        console.error("Error fetching data:", error)
        alert("Failed to connect to the database. Please check your configuration.")
      }
    }

    fetchData()
  }, [])





   console.log('paymentMethod',paymentMethod);



  const handlePlaceOrder = () => {
    const newErrors: { paymentMethod?: string; paidAmount?: string } = {}

    // Validate payment method (required)
    if (!paymentMethod.trim()) {
      newErrors.paymentMethod = "Payment method is required"
    }

    // Validate paid amount (required and must be valid)
    if (paidAmount < 0) {
      newErrors.paidAmount = "Paid amount cannot be negative"
    } else if (paidAmount > rawTotalAfterDiscount) {
      newErrors.paidAmount = "Paid amount cannot exceed total amount"
    } else if (isNaN(paidAmount)) {
      newErrors.paidAmount = "Please enter a valid paid amount"
    }

    setErrors(newErrors)

    // Create clean errors object with only actual errors (no undefined values)
    const cleanErrors: { paymentMethod?: string; paidAmount?: string } = {}
    if (newErrors.paymentMethod) cleanErrors.paymentMethod = newErrors.paymentMethod
    if (newErrors.paidAmount) cleanErrors.paidAmount = newErrors.paidAmount


   
    // Call the parent function with data and clean errors
    onPlaceOrder(
      {
        discountAmount,
        discountType,
        remarks: remarks.trim(),
        totalAmount: rawTotalPrice,
        totalPayable: rawTotalAfterDiscount,
        paidAmount,
        paymentMethod: paymentMethod.trim(),
      },
      cleanErrors,
    )
  }

  return (
    <div className="rounded-[10px] p-4 space-y-1 bg-white shadow-1 dark:bg-gray-dark dark:shadow-card">
      <h3 className="font-bold text-lg  dark:!text-white border-b pb-2 sticky top-0 z-10">Order Summary</h3>

      <div className="flex justify-between items-center">
        <span className="font-semibold text-primary dark:!text-white">Price</span>
        <span className="text-lg  dark:!text-white first-letter:font-bold">₹{cart.length ? totalPriceDisplay : "0"}</span>
      </div>

      {/* Discount section */}
      <div className="space-y-2">
        <div className="flex justify-between items-center">
          <label className="font-semibold text-primary dark:!text-white">Discount Type</label>
          <Select value={discountType} onValueChange={(v) => setDiscountType(v as "flat" | "percentage")}>
            <SelectTrigger className="w-36 h-9 dark:!text-white text-md border">
              <SelectValue placeholder="Type" />
            </SelectTrigger>
            <SelectContent className="bg-white text-md dark:!bg-gray-dark dark:!text-white">
              <SelectItem className="text-md" value="flat">Flat (₹)</SelectItem>
              <SelectItem className="text-md" value="percentage">Percentage (%)</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex justify-between items-center">
          <label className="font-semibold text-primary dark:!text-white">
            {discountType === "percentage" ? "Discount (%)" : "Discount (₹)"}
          </label>
          <input
            id="discount"
            type="number"
            min={0}
            max={discountType === "percentage" ? 100 : rawTotalPrice}
            value={discount}
            onChange={(e) => {
              const value = Number(e.target.value) || 0
              if (discountType === "flat") {
                setDiscount(Math.min(value, rawTotalPrice))
              } else {
                setDiscount(Math.min(value, 100))
              }
            }}
            className="border rounded  dark:!text-white dark:!bg-gray-dark px-2 py-1 w-24 text-right"
          />
        </div>
      </div>

      {/* Discounted amount */}
      <div className="flex justify-between items-center">
        <span className="font-semibold text-primary dark:!text-white">Discount Amount</span>
        <span className="text-lg font-bold text-red-600">
          -₹{discountAmount % 1 === 0 ? discountAmount : discountAmount.toFixed(2)}
        </span>
      </div>

      {/* Total payment after discount */}
      <div className="flex justify-between items-center border-b pb-2">
        <span className="font-semibold text-primary dark:!text-white">Total</span>
        <span className="text-lg text-text-gray-400 dark:!text-white font-bold">₹{cart.length ? totalAmount : "0"}</span>
      </div>

      {/* Payment method */}
      <div className="space-y-1">
        <div className="flex justify-between items-center">
          <label className="font-semibold text-primary dark:!text-white">Payment Method:</label>
          <Select
            value={paymentMethod}
            onValueChange={(v) => {
              setPaymentMethod(v)
              // Clear error when user selects a value
              if (errors.paymentMethod) {
                setErrors((prev) => {
                  const newErrors = { ...prev }
                  delete newErrors.paymentMethod
                  return newErrors
                })
              }
            }}
          >
            <SelectTrigger
              className={`w-36 h-9 dark:!text-white border text-md ${errors.paymentMethod ? "border-red-500" : ""}`}
            >
              <SelectValue className="text-md" placeholder="Select"/>
            </SelectTrigger>
            <SelectContent className="bg-white text-md text-base dark:!text-white dark:!bg-gray-dark">
              {paymentMethods.map((method) => (
                <SelectItem className="text-md" key={method.id} value={method.name}>
                  {method.name.charAt(0).toUpperCase() + method.name.slice(1).toLowerCase()}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        {errors.paymentMethod && <p className="text-md text-red-500 mt-1 text-right">{errors.paymentMethod}</p>}
      </div>

      {/* Paid amount */}
      <div className="space-y-1">
        <div className="flex justify-between items-center">
          <label className="font-semibold text-primary dark:!text-white">Paid Amount (₹):</label>
          <input
            type="number"
            min={0}
            max={rawTotalAfterDiscount}
            value={paidAmount}
            onChange={(e) => {
              const value = Number(e.target.value) || 0
              setPaidAmount(value)
              // Clear error when user types
              if (errors.paidAmount) {
                setErrors((prev) => {
                  const newErrors = { ...prev }
                  delete newErrors.paidAmount
                  return newErrors
                })
              }
            }}
            className={`border rounded  dark:!text-white dark:!bg-gray-dark font-bold px-2 py-1 w-32 text-right ${errors.paidAmount ? "border-red-500" : ""}`}
          />
        </div>
        {errors.paidAmount && <p className="text-sm text-red-500 mt-1 text-right">{errors.paidAmount}</p>}
      </div>

      <div className="flex justify-between items-center">
        <span className="font-semibold text-primary dark:!text-white">Remaining Amount:</span>
        <span className="text-lg font-bold dark:!text-white">₹{cart.length ? remainingAmountDisplay : "0"}</span>
      </div>

      <div className="space-y-2 border-t pt-2">
        <Label className="text-md font-semibold text-primary dark:!text-white">Remarks:</Label>
        <Textarea
          value={remarks}
          onChange={(e) => setRemarks(e.target.value)}
          placeholder="Add any special instructions or notes here"
          className="w-full  dark:!text-white border rounded"
          rows={3}
        />
      </div>

      {/* Submit button */}
      <Button
        type="button"
        size="lg"
        className="w-full mt-5"
        onClick={handlePlaceOrder}
        disabled={isSubmitting}
      >
        {isSubmitting ? "Processing..." : isEditMode ? "Update Order" : "Place Order"}
      </Button>
      
    </div>
  )
}
