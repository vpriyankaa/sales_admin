"use client"

import { use, useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { getOrderById, changeOrderPaymentStatus } from "@/app/(home)/actions"
import { Loader2, Printer, ArrowLeft, CheckCircle, Clock, AlertCircle } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Pencil } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog"


interface ProductItem {
  product_name: string
  quantity: number
  price: number
  total_price: number
  unit: string

}

interface Order {
  id: number
  customer_name?: string
  discount_type?: string
  discount_value?: number
  total_before_discount?: number
  total_after_discount?: number
  payment_method?: string
  paid_amount?: number
  remarks?: string
  items?: ProductItem[]
  total_payable?: number
  total_price: number
  payment_status: string
  remaining_amount: number
  order_date?: string
  order_id?: string
}

export default function Info({ params }: { params: Promise<{ id: number }> }) {
  const { id } = use(params)

  const [data, setData] = useState<Order | null>(null)
  const [loading, setLoading] = useState(true)
  const [isOpen, setIsOpen] = useState(false)

  useEffect(() => {
    async function fetchOrder() {
      setLoading(true)
      const orderDetails = await getOrderById(id)
      setData(orderDetails)
      setStatus(orderDetails?.payment_status || "");
      setLoading(false)
    }

    fetchOrder()
  }, [id])



  const [status, setStatus] = useState(""); // Set initial empty string
  const [open, setOpen] = useState(false);


  const handleSave = async () => {
    if (!data) return; // Early exit if data is still null
    const success = await changeOrderPaymentStatus(data.id, status);
    if (success) {
      setOpen(false);
      setIsOpen(true)
      await getOrderById(id)
      // Optionally refetch or update UI
    } else {
      alert("Failed to update status");
    }
  };

  const handlePrint = () => {
    window.print()
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    )
  }

  if (!data)
    return (
      <div className="flex flex-col items-center justify-center h-64 space-y-4">
        <AlertCircle className="h-16 w-16 text-amber-500" />
        <p className="text-xl font-medium">No order found with ID {id}</p>
        <Button variant="outline" onClick={() => window.history.back()} className="flex items-center gap-2">
          <ArrowLeft className="h-4 w-4" />
          Go Back
        </Button>
      </div>
    )

  const totalBeforeDiscount = data.items?.reduce(
  (sum, item) => sum + item.price * item.quantity,
  0
) || 0;


  const getPaymentStatusBadge = (status: string) => {
    switch (status?.toLowerCase()) {
      case "paid":
        return (
          <Badge className="bg-blue-500 text-white  hover:bg-blue-600 flex items-center gap-1">
            <CheckCircle className="h-3 w-3" /> Paid
          </Badge>
        )
      case "partiallypaid":
        return (
          <Badge className="bg-amber-500 text-white  hover:bg-amber-600 flex items-center gap-1">
            <Clock className="h-3 w-3" /> Partially Paid
          </Badge>
        )
      case "credit":
        return (
          <Badge className="bg-blue-500 text-white hover:bg-blue-600 flex items-center gap-1">
            <Clock className="h-3 w-3" /> Credit
          </Badge>
        )
      default:
        return (
          <Badge className="bg-blue-500 text-white hover:bg-blue-600 flex items-center gap-1">
            <Clock className="h-3 w-3" /> Credit
          </Badge>
        )
    }
  }

  return (
    <>
      <div className="max-w-6xl mx-auto p-4 print:p-0 print:shadow-none">
        {/* <div className="flex justify-between items-center mb-6 print:hidden">
        <Button variant="outline" onClick={() => window.history.back()} className="flex items-center gap-2">
          <ArrowLeft className="h-4 w-4" />
          Back
        </Button>
        <Button
          onClick={handlePrint}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white"
        >
          <Printer className="h-4 w-4" />
          Print Invoice
        </Button>
      </div> */}

        <Card className="shadow-lg border-t-4 border-t-blue-500 print:shadow-none print:border">
          <CardHeader className="bg-gray-50 dark:bg-gray-800 border-b">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div>
                <p className="text-sm text-black ">Order ID</p>
                <CardTitle className="text-xl font-bold">#{data.order_id || id}</CardTitle>
              </div>
              <div className="flex flex-col items-end">
                <p className="text-sm text-black ">Order Date</p>
                <p className="font-medium">{data.order_date || new Date().toLocaleDateString()}</p>
              </div>
            </div>
          </CardHeader>

          <CardContent className="p-6 space-y-8">
            {/* Customer Information */}
            <div>
              <h3 className="text-lg font-semibold mb-4 text-blue-700 dark:text-blue-400 flex items-center gap-2">
                Customer Information
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-white dark:bg-gray-800 font-bold p-4 rounded-md border">
                  <p className="text-sm text-black ">Customer Name</p>
                  <p className="font-medium text-lg">{data.customer_name || "-"}</p>
                </div>

                {data.remarks && (
                  <div className="bg-white dark:bg-gray-800 font-bold p-4 rounded-md border">
                    <p className="text-sm text-black ">Remarks</p>
                    <p className="font-medium">{data.remarks}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Products Section */}
            <div>
              <h3 className="text-lg font-semibold mb-4 text-blue-700 dark:text-blue-400 flex items-center gap-2">
                Products
              </h3>
              <div className="overflow-x-auto border rounded-md">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                  <thead className="bg-gray-50 dark:bg-gray-800">
                    <tr>
                      <th
                        scope="col"
                        className="px-4 py-3 text-left text-xs font-bold text-black  uppercase tracking-wider"
                      >
                        Product
                      </th>
                      <th
                        scope="col"
                        className="px-4 py-3 text-center text-xs font-bold text-black  uppercase tracking-wider"
                      >
                        Quantity
                      </th>
                      <th
                        scope="col"
                        className="px-4 py-3 text-center text-xs font-bold  text-black  uppercase tracking-wider"
                      >
                        Unit
                      </th>
                      <th
                        scope="col"
                        className="px-4 py-3 text-right text-xs font-bold  text-black  uppercase tracking-wider"
                      >
                        Price
                      </th>
                      <th
                        scope="col"
                        className="px-4 py-3 text-right text-xs font-bold  text-black  uppercase tracking-wider"
                      >
                        Total
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white font-bold  dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
                    {data.items && data.items.length > 0 ? (
                      data.items.map((item, index) => (
                        <tr key={index} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                          <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                            {item.product_name}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-center text-gray-700 dark:text-gray-300">
                            {item.quantity}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-center text-gray-700 dark:text-gray-300">
                            {item.unit || "-"}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-right text-gray-700 dark:text-gray-300">
                            ₹{item.price?.toFixed(2) || item.total_price / item.quantity}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-right font-medium text-gray-900 dark:text-white">
                            ₹{(item.price * item.quantity).toFixed(2)}
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={5} className="px-4 py-4 text-center text-sm text-black ">
                          No products found in this order.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Payment Summary */}
            <div>
              <h3 className="text-lg font-bold mb-4 text-blue-700 dark:text-blue-400 flex items-center gap-2">
                Payment Summary
              </h3>
              <div className="bg-white dark:bg-gray-800 border rounded-md p-4">
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-black ">Subtotal (before discount)</span>
                    <span className="font-medium text-black">₹{totalBeforeDiscount.toFixed(2)}</span>
                  </div>

                  {data.discount_type && data.discount_value  && data.discount_value >  0 && (
                    <div className="flex justify-between items-center">
                      <span className="text-black ">Discount Type</span>
                      <span className="text-black">{data.discount_type}</span>
                    </div>
                  )}

                  {data.discount_value && data.discount_value > 0 && (
                    <div className="flex justify-between items-center">
                      <span className="text-black ">Discount Amount</span>
                      <span className="text-red-600 dark:text-red-400">- ₹{data.discount_value.toFixed(2)}</span>
                    </div>
                  )}

                  {/* <Separator className="my-2" /> */}

                  <div className="flex  text-black justify-between items-center font-medium">
                    <span>Total After Discount</span>
                    <span className="text-black">₹{data.total_price?.toFixed(2) ?? "0.00"}</span>
                  </div>

                  <Separator className="my-2" />

                  <div className="flex justify-between items-center">
                    <span className="text-black">Payment Method</span>
                    <span className="text-black" >{data.payment_method || "-"}</span>
                  </div>

                  {data.payment_status !== '' && (
                    <div className="flex justify-between items-center">
                      <span className="text-black dark:text-white">Payment Status</span>
                      <div className="flex items-center gap-2">
                        <span>{getPaymentStatusBadge(data.payment_status)}</span>
                        <Dialog open={open} onOpenChange={setOpen}>
                          <DialogTrigger asChild>
                            <button className="text-gray-500 hover:text-black dark:hover:text-white">
                              <Pencil className="w-4 h-4" />
                            </button>
                          </DialogTrigger>
                          <DialogContent className="bg-white dark:bg-gray-900 p-6 rounded-md">
                            <DialogHeader>
                              <DialogTitle>Edit Payment Status</DialogTitle>
                            </DialogHeader>
                            <div className="mt-4">
                              <select
                                value={status}
                                onChange={(e) => setStatus(e.target.value)}
                                className="w-full border p-2 rounded"
                              >
                                <option value="paid">Paid</option>
                                <option value="partiallypaid">Partially Paid</option>
                                <option value="credit">Credit</option>
                              </select>
                            </div>
                            <DialogFooter className="mt-4">
                              <Button className="text-white" onClick={handleSave}>Save</Button>
                            </DialogFooter>
                          </DialogContent>
                        </Dialog>
                      </div>
                    </div>

                  )}


                  <div className="flex justify-between items-center">
                    <span className="text-black ">Amount Paid</span>
                    <span className="font-medium text-black">
                      ₹{data.paid_amount?.toFixed(2) ?? "0.00"}
                    </span>
                  </div>

                  {data.remaining_amount > 0 && (
                    <div className="flex justify-between items-center">
                      <span className="text-black ">Remaining Amount</span>
                      <span className="font-medium text-black">
                        ₹{data.remaining_amount?.toFixed(2) ?? "0.00"}
                      </span>
                    </div>
                  )}

                  {/* <Separator className="my-2" /> */}

                  <div className="flex text-black justify-between items-center text-lg font-bold pt-2">
                    <span>Total Payable</span>
                    <span className="text-black">
                      ₹{data.total_price?.toFixed(2) ?? "0.00"}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>

          <CardFooter className="bg-gray-50 dark:bg-gray-800 border-t p-4 print:hidden">
            <div className="flex justify-end w-full">
              <Button className="bg-blue-600 text-white mr-3" variant="outline" onClick={() => window.history.back()}>
                Back
              </Button>
              {/* <Button onClick={handlePrint} className="bg-blue-600 hover:bg-blue-700 text-white">
              <Printer className="h-4 w-4 mr-2" />
              Print Invoice
            </Button> */}
            </div>
          </CardFooter>
        </Card>





      </div>



      {isOpen && (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogContent className="bg-white">
            <DialogHeader>
              <DialogTitle>Success</DialogTitle>
            </DialogHeader>
            <div>Order Status Changed successfully!</div>
            <DialogFooter>
              <Button className="w-full md:w-auto text-white mb-5 mr-2" onClick={() => setIsOpen(false)}>
                Close
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </>
  )
}
