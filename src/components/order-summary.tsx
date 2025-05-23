"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

/* ------------------------------------------------------------------ */
/* Types ------------------------------------------------------------ */
interface CartItem {
  product_id: string;
  product_name: string;
  quantity: number;
  price: number;
  unit: string;
}

export interface OrderSummaryData {
  discountAmount: number;
  discountType: "flat" | "percentage";
  remarks: string;
  totalAmount: number;
  totalPayable: number;
  paidAmount: number;
  paymentMethod: string;
}

interface OrderSummaryProps {
  cart: CartItem[];
  selectedCustomer: string;
  isSubmitting: boolean;
  onPlaceOrder: (orderData: OrderSummaryData) => void | Promise<void>;
}

/* ------------------------------------------------------------------ */
/* Component -------------------------------------------------------- */
export function OrderSummary({
  cart,
  selectedCustomer,
  isSubmitting,
  onPlaceOrder,
}: OrderSummaryProps) {
  /* -------------------- local state -------------------- */
  const [discount, setDiscount] = useState<number>(0);
  const [discountType, setDiscountType] = useState<"flat" | "percentage">(
    "flat",
  );
  const [paymentMethod, setPaymentMethod] = useState<string>("");
  const [remarks, setRemarks] = useState<string>("");
  const [paidAmount, setPaidAmount] = useState<number>(0);

  /* -------------------- totals -------------------------- */
  const rawTotalPrice = cart.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0,
  );
  const totalPriceDisplay =
    rawTotalPrice % 1 === 0
      ? rawTotalPrice.toString()
      : rawTotalPrice.toFixed(2);

  /* discount */
  const discountAmount =
    discountType === "percentage"
      ? rawTotalPrice * (Math.min(discount, 100) / 100) // clamp 0-100 %
      : discount;


  const rawTotalAfterDiscount = Math.max(rawTotalPrice - discountAmount, 0);

  // Subtract paidAmount
  const remainingAmount = Math.max(rawTotalAfterDiscount - paidAmount, 0);


  const totalAmount = 
    rawTotalAfterDiscount % 1 === 0
      ? rawTotalAfterDiscount.toString()
      : rawTotalAfterDiscount.toFixed(2);


  // Optional: formatted display
  const remainingAmountDisplay =
    remainingAmount % 1 === 0
      ? remainingAmount.toString()
      : remainingAmount.toFixed(2);

  /* when total changes, pre-fill paidAmount with full payable */
  useEffect(() => {
    setPaidAmount(rawTotalAfterDiscount);
  }, [rawTotalAfterDiscount]);

  /* -------------------- submit -------------------------- */
  const handlePlaceOrder = () => {
    if (!selectedCustomer || cart.length === 0) return;

    onPlaceOrder({
      discountAmount,
      discountType,
      remarks,
      totalAmount: rawTotalPrice,
      totalPayable: rawTotalAfterDiscount,
      paidAmount,
      paymentMethod,
    });
  };

  /* -------------------- UI ------------------------------ */
  return (
    <div className="border rounded-md p-6 space-y-6 bg-gray-50 dark:bg-gray-800 max-h-[calc(100vh-120px)] overflow-y-auto">
      <h3 className="font-bold text-lg border-b pb-2 sticky top-0 bg-gray-50 dark:bg-gray-800 z-10">
        Order Summary
      </h3>

      {/* total price */}
      <div className="flex justify-between items-center">
        <span className="font-semibold text-blue-600">Price</span>
        <span className="text-lg font-bold">
          ₹{cart.length ? totalPriceDisplay : "0"}
        </span>
      </div>

      {/* discount section */}
      <div className="space-y-2">
        <div className="flex justify-between items-center">
          <label className="font-semibold text-blue-600">Discount Type </label>
          <Select
            value={discountType}
            onValueChange={(v) => setDiscountType(v as "flat" | "percentage")}
          >
            <SelectTrigger className="w-36 h-9 border font-bold">
              <SelectValue placeholder="Type" />
            </SelectTrigger>
            <SelectContent className="bg-white font-bold">
              <SelectItem value="flat">Flat (₹)</SelectItem>
              <SelectItem value="percentage">Percentage (%)</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex justify-between items-center">
          <label className="font-semibold text-blue-600">
            {discountType === "percentage" ? "Discount (%) " : "Discount (₹) "}
          </label>
          <input
            id="discount"
            type="number"
            min={0}
            max={discountType === "percentage" ? 100 : undefined}
            value={discount}
            onChange={(e) => setDiscount(Number(e.target.value) || 0)}
            className="border rounded font-bold px-2 py-1 w-24 text-right"
          />
        </div>
      </div>

      {/* discounted amount */}
      <div className="flex justify-between items-center">
        <span className="font-semibold text-blue-600">Discount Amount</span>
        <span className="text-lg font-bold text-red-500">
          -₹
          {discountAmount % 1 === 0
            ? discountAmount
            : discountAmount.toFixed(2)}
        </span>
      </div>


      {/* total payment after discount */}
      <div className="flex justify-between items-center mb-2 border-b">
        <span className="font-semibold text-blue-600">Total</span>
        <span className="text-lg font-bold">
          ₹{cart.length ? totalAmount : "0"}
        </span>
      </div>

      {/* payment method */}
      <div className="flex justify-between items-center ">
        <label className="font-semibold text-blue-600">Payment Method:</label>
        <Select value={paymentMethod} onValueChange={setPaymentMethod}>
          <SelectTrigger className="w-36 h-9 border font-bold">
            <SelectValue placeholder="Select" />
          </SelectTrigger>
          <SelectContent className="bg-white font-bold">
            <SelectItem value="gpay">GPay</SelectItem>
            <SelectItem value="credit">Credit</SelectItem>
            <SelectItem value="cash">Cash</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* paid amount */}
      <div className="flex justify-between items-center">
        <label className="font-semibold text-blue-600">Paid Amount (₹):</label>
        <input
          type="number"
          min={0}
          max={rawTotalAfterDiscount}
          value={paidAmount}
          onChange={(e) => setPaidAmount(Number(e.target.value) || 0)}
          className="border rounded font-bold px-2 py-1 w-32 text-right"
        />
      </div>

      {/* remarks */}
     
      {/* total payable */}
      <div className="flex justify-between items-center pt-2">
        <span className="font-semibold text-blue-600">Total Payable:</span>
        <span className="text-lg font-bold">
          ₹{cart.length ? remainingAmountDisplay : "0"}
        </span>
      </div>

       <div className="space-y-2 border-t">
        <Label className="text-md font-semibold text-blue-600">Remarks:</Label>
        <Textarea
          value={remarks}
          onChange={(e) => setRemarks(e.target.value)}
          placeholder="Add any special instructions or notes here"
          className="w-full border rounded"
          rows={3}
        />
      </div>


      {/* submit */}
      <Button
        type="button"
        size="lg"
        className="w-full bg-blue-600 hover:bg-blue-700 text-white mt-4"
        onClick={handlePlaceOrder}
        disabled={
          !selectedCustomer ||
          cart.length === 0 ||
          !paymentMethod ||
          isSubmitting
        }
      >
        {isSubmitting ? "Processing..." : "Place Order"}
      </Button>
    </div>
  );
}
