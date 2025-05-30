"use client"

import type React from "react"

import { use, useState, useEffect, useCallback } from "react"
import { Button } from "@/components/ui/button"
import {
  getOrderById,
  changeOrderPaymentStatus,
  changeOrderPayment,
  getOrderLogsById,
  changeOrderStatus,
  getPaymentLogsById
} from "@/app/actions"
import { Loader2, ArrowLeft, AlertCircle, CheckCircle, X } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { formatDate } from "@/utils/timeframe-extractor"

// Types
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
  vendor_name?:string
  discount_type?: string
  discount_value?: number
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
  status: string
}

interface OrderLog {
  id: number
  created_at?: string
  order_id?: number
  action: string
  comments: string
  documents?: string
}

type PaymentStatus = "paid" | "partiallypaid" | "credit"

interface OrderDetailPageProps {
  params: Promise<{ id: number }>
}

export default function OrderDetailPage({ params }: OrderDetailPageProps) {
  const { id } = use(params)

  const [data, setData] = useState<Order | null>(null)

  const [orderLogData, setOrderLogData] = useState<OrderLog[] | null>(null)
  const [paymentLogData, setPaymentLogData] = useState<OrderLog[] | null>(null)

  const [loading, setLoading] = useState(true)

  // Dialog states
  const [statusDialogOpen, setStatusDialogOpen] = useState(false)
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false)
  const [successDialogOpen, setSuccessDialogOpen] = useState(false)
  const [successMessage, setSuccessMessage] = useState("")
  const [successTitle, setSuccessTitle] = useState("")

  const [type, setType] = useState("")


  const [imageDialogOpen, setImageDialogOpen] = useState(false)
  const [selectedImage, setSelectedImage] = useState<string>("")
  const [imageLoading, setImageLoading] = useState(false)

  const [selectedStatus, setSelectedStatus] = useState<PaymentStatus>("credit")
  const [selectedOrderStatus, setSelectedOrderStatus] = useState<string>("")

  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedOrder, setSelectedOrder] = useState<any>(null)
  const [paymentAmount, setPaymentAmount] = useState<number>(0)
  const [paymentError, setPaymentError] = useState<string>("")
  const [statusLoading, setStatusLoading] = useState(false)
  const [paymentLoading, setPaymentLoading] = useState(false)
  const [comments, setComments] = useState<string>("")
  const [statusChangeComments, setStatusChangeComments] = useState<string>("")
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [uploadedFileName, setUploadedFileName] = useState<string>("")
  const [commentsError, setCommentsError] = useState<string>("")
  const [fileUploadError, setFileUploadError] = useState<string>("")
  const [isUploading, setIsUploading] = useState<boolean>(false)
  const [openId, setOpenId] = useState<number | null>(null)
  const [openAdd, setOpenAdd] = useState(false)
  const [error, setError] = useState<string | null>(null);

  const toggle = (id: number) => setOpenId((prev) => (prev === id ? null : id))

  const formatAmount = useCallback((amount: number | undefined | null): string => {
    if (typeof amount !== "number") return "0"
    const formatted = amount.toFixed(2)
    return formatted.endsWith(".00") ? Number.parseInt(formatted).toString() : formatted
  }, [])

  const getImageUrl = (filename: string): string => {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ""
    const bucketName = "uploads"
    return `${supabaseUrl}/storage/v1/object/public/${bucketName}/documents/${filename}`
  }

  const handleImageClick = (filename: string) => {
    setSelectedImage(getImageUrl(filename))
    setImageDialogOpen(true)
  }

  const handleFileUpload = async (file: File): Promise<string> => {
    const formData = new FormData()
    formData.append("file", file)
    formData.append("orderId", id.toString())

    const response = await fetch("/api/upload-document", {
      method: "POST",
      body: formData,
    })

    if (!response.ok) {
      throw new Error("File upload failed")
    }

    const result = await response.json()
    return result.filename
  }

  const updateOrderStatus = async (
    selectedOrder: { id: number },
    selectedStatus: string,
    setData: React.Dispatch<React.SetStateAction<Order | null>>,
    setIsModalOpen: React.Dispatch<React.SetStateAction<boolean>>,
    statusChangeComments:string
  ) => {
    if (!selectedOrder || !selectedStatus) return

    // console.log("selectedStatus", selectedStatus)

    const statusMap: Record<string, string> = {
      Cancel: "cancelled",
      Trash: "trashed",
    }

    if (statusChangeComments.trim() === "") {
      setCommentsError("Comments are required to change order status.");
      return;
    }

    setCommentsError("");

    const newStatus = statusMap[selectedStatus] ?? selectedStatus.toLowerCase()

    // Update the single order data
    setData((prev) => (prev ? { ...prev, status: newStatus } : null))

    const orderStatus = await changeOrderStatus(selectedOrder.id, newStatus,statusChangeComments)

    if (orderStatus) {
      setIsModalOpen(false)
      setOpenAdd(true)
    }
  }




  // Handle file selection
  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    // Validate file type (optional - you can restrict to certain types)
    const allowedTypes = [
      "image/jpeg",
      "image/png",
      "image/gif",
      "application/pdf",
      "text/plain",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ]
    if (!allowedTypes.includes(file.type)) {
      setFileUploadError("Please select a valid file type (JPEG, PNG, GIF, PDF, TXT, DOC, DOCX)")
      return
    }

    // Validate file size (5MB limit)
    if (file.size > 5 * 1024 * 1024) {
      setFileUploadError("File size must be less than 5MB")
      return
    }

    setSelectedFile(file)
    setFileUploadError("")
    setIsUploading(true)

    try {
      const filename = await handleFileUpload(file)
      setUploadedFileName(filename)
    } catch (error) {
      console.error("File upload error:", error)
      setFileUploadError("Failed to upload file. Please try again.")
      setSelectedFile(null)
    } finally {
      setIsUploading(false)
    }
  }

  // Remove uploaded file
  const handleRemoveFile = () => {
    setSelectedFile(null)
    setUploadedFileName("")
    setFileUploadError("")
    // Reset the file input
    const fileInput = document.getElementById("documents") as HTMLInputElement
    if (fileInput) {
      fileInput.value = ""
    }
  }

  // Data fetching
  const fetchOrderData = useCallback(async () => {
    try {
      const [orderDetails, orderLogs, paymentLogs] = await Promise.all([getOrderById(id), getOrderLogsById(id), getPaymentLogsById(id)])
      setData(orderDetails)
      setType(orderDetails?.type);
      setOrderLogData(orderLogs)
      setPaymentLogData(paymentLogs)
      if (orderDetails?.payment_status) {
        setSelectedStatus(orderDetails.payment_status as PaymentStatus)
      }
    } catch (error) {
      console.error("Error fetching order data:", error)
    } finally {
      setLoading(false)
    }
  }, [id])

  useEffect(() => {
    fetchOrderData()
  }, [fetchOrderData])

  // Products Table Component
  const ProductsTable = ({ items }: { items?: ProductItem[] }) => (
    <div>
      <h3 className="text-lg font-semibold mb-4 text-blue-700 dark:text-blue-400">Products</h3>
      <div className="overflow-x-auto border rounded-md">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead className="bg-gray-50 dark:bg-gray-800">
            <tr>
              <th className="px-3 py-2 text-left text-xs font-bold text-black uppercase tracking-wider">Product</th>
              <th className="px-3 py-2 text-center text-xs font-bold text-black uppercase tracking-wider">Quantity</th>
              <th className="px-3 py-2 text-center text-xs font-bold text-black uppercase tracking-wider">Unit</th>
              <th className="px-2 py-5 text-right text-xs font-bold text-black uppercase tracking-wider">
                Price / unit
              </th>
              <th className="px-3 py-2 text-right text-xs font-bold text-black uppercase tracking-wider">Total</th>
            </tr>
          </thead>
          <tbody className="bg-white font-bold dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
            {items && items.length > 0 ? (
              items.map((item, index) => (
                <tr key={index} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                  <td className="px-3 py-2 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                    {item.product_name}
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap text-sm text-center text-gray-700 dark:text-gray-300">
                    {item.quantity}
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap text-sm text-center text-gray-700 dark:text-gray-300">
                    {item.unit || "-"}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-right text-gray-700 dark:text-gray-300">
                    ₹{formatAmount(item.price) || item.total_price / item.quantity}
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap text-sm text-right font-medium text-gray-900 dark:text-white">
                    ₹{formatAmount(item.price * item.quantity)}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={5} className="px-4 py-4 text-center text-sm text-black">
                  No products found in this order.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )

  // Event handlers
  const handleStatusChange = async () => {
    if (!data) return

    setStatusLoading(true)
    try {
      const success = await changeOrderPaymentStatus(data.id, selectedStatus)
      if (success) {
        setStatusDialogOpen(false)
        await fetchOrderData()
        setSuccessTitle("Success")
        setSuccessMessage("Payment status updated successfully!")
        setSuccessDialogOpen(true)
      } else {
        alert("Failed to update status")
      }
    } catch (error) {
      console.error("Error updating payment status:", error)
      alert("Failed to update status")
    } finally {
      setStatusLoading(false)
    }
  }

  const handlePaymentSubmit = async () => {
    if (!data) return

    // Reset all errors
    setPaymentError("")
    setCommentsError("")

    let hasErrors = false

    // Validate payment amount (required)
    if (!paymentAmount || paymentAmount <= 0) {
      setPaymentError("Payment amount is required")
      hasErrors = true
    } else {
      const maxPayableAmount = Math.min(data.remaining_amount || 0, data.total_payable || 0)
      if (paymentAmount > maxPayableAmount) {
        setPaymentError(`Payment amount cannot exceed ₹${formatAmount(maxPayableAmount)}`)
        hasErrors = true
      }
    }

    // Validate comments (required)
    if (!comments.trim()) {
      setCommentsError("Comments are required")
      hasErrors = true
    }

    // If there are validation errors, don't proceed
    if (hasErrors) {
      return
    }

    setPaymentLoading(true)

    try {
      // Pass the uploaded filename to changeOrderPayment

      console.log("comments----", comments)
      console.log("documents-----------", uploadedFileName)

      const success = await changeOrderPayment(id, paymentAmount, comments.trim(), uploadedFileName)
      if (success) {
        setPaymentDialogOpen(false)
        setPaymentAmount(0)
        setComments("")
        setSelectedFile(null)
        setUploadedFileName("")

        setSuccessTitle("Payment Successful")
        setSuccessMessage(`Payment of ₹${formatAmount(paymentAmount)} has been processed successfully!`)
        setSuccessDialogOpen(true)
        await fetchOrderData()
      } else {
        setPaymentError("Payment failed. Please try again.")
      }
    } catch (error) {
      console.error("Error processing payment:", error)
      setPaymentError("Payment failed. Please try again.")
    } finally {
      setPaymentLoading(false)
    }
  }

  // Computed values
  const totalBeforeDiscount = data?.items?.reduce((sum, item) => sum + item.price * item.quantity, 0) || 0

  const getPaymentMethodDisplay = (method?: string) => {
    switch (method) {
      case "gpay":
        return "GPay"
      case "cash":
        return "Cash"
      case "credit":
        return "Credit"
      default:
        return "-"
    }
  }

  const getDiscountTypeDisplay = (type?: string) => {
    switch (type) {
      case "flat":
        return "Flat"
      case "percentage":
        return "Percentage"
      default:
        return "-"
    }
  }

  // Loading state
  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    )
  }

  // Error state
  if (!data) {
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
  }

  const PaymentStatusBadge = ({ status }: { status: string }) => {
    switch (status?.toLowerCase()) {
      case "paid":
        return <span className="text-black font-bold">Paid</span>
      case "partiallypaid":
        return <span className="text-black font-bold">Partially Paid</span>
      case "credit":
        return <span className="text-black font-bold">Credit</span>
      default:
        return <span className="text-black">Credit</span>
    }
  }

  const maxPayableAmount = Math.min(data.remaining_amount || 0, data.total_payable || 0)

  const statusOptions = ["Cancel", "Trash"]

  return (
    <>
      <div className="max-w-6xl mx-auto p-4 print:p-0 print:shadow-none">
        <Card className="shadow-lg border-t-4 border-b-4 border-b-blue-500 border-t-blue-500 print:shadow-none print:border">
          <CardHeader className="bg-gray-50 dark:bg-gray-800 border-b">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-2">
              <div>
                <p className="text-sm font-bold text-black">Order ID</p>
                <CardTitle className="text-xl font-bold">#{data.order_id || id}</CardTitle>
              </div>
              <div className="flex flex-col items-end">
                <p className="text-sm font-bold text-black">Order Date</p>
                <p className="font-medium">{formatDate(data.order_date || new Date())}</p>
              </div>
              <div className="flex flex-col items-end">
                <button
                  onClick={() => {
                    setSelectedOrder(data)
                    setSelectedOrderStatus(statusOptions[0]) // Set to first option "Cancel"
                    setIsModalOpen(true)
                  }}
                  className="text-blue-600 hover:text-blue-800 font-medium"
                >
                  Change status
                </button>
              </div>
            </div>
          </CardHeader>

          <CardContent className="p-2">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              {/* Left Side - Customer Information and Products */}
              <div className="lg:col-span-2 space-y-4">
                {/* Customer Information */}
                <div>

                  {
                    type === "sale" ? (
                      <h3 className="text-lg font-semibold mb-4 text-blue-700 dark:text-blue-400">Customer Information</h3>
                    ) :(
                      <h3 className="text-lg font-semibold mb-4 text-blue-700 dark:text-blue-400">Vendor Information</h3>
                    )
                  }
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {
                    type === "sale" ? (
                    <div className="bg-white dark:bg-gray-800 font-bold p-3 rounded-md border">
                      <p className="text-sm text-black">Customer Name</p>
                      <p className="font-medium text-lg">{data.customer_name || "-"}</p>
                    </div>
                    ):(
                      <div className="bg-white dark:bg-gray-800 font-bold p-3 rounded-md border">
                      <p className="text-sm text-black">Vendor Name</p>
                      <p className="font-medium text-lg">{data.vendor_name || "-"}</p>
                    </div>

                    )}
                    {data.remarks && (
                      <div className="bg-white dark:bg-gray-800 font-bold p-3 rounded-md border">
                        <p className="text-sm text-black">Remarks</p>
                        <p className="font-medium">{data.remarks}</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Products */}
                <ProductsTable items={data.items} />

                {/* Order Logs - Only show if there are logs */}
                {paymentLogData && paymentLogData.length > 0 && (
                  <div>
                    <h3 className="text-lg font-bold mb-4 text-blue-700 dark:text-blue-400">Payment Logs</h3>
                    <div className="bg-white dark:bg-gray-800 border rounded-md p-3 space-y-2">
                      {paymentLogData.map((log) => {
                        const isOpen = openId === log.id

                        return (
                          <div key={log.id} className="border border-gray-300 dark:border-gray-600 rounded-md">
                            {/* header */}
                            <button
                              type="button"
                              onClick={() => toggle(log.id)}
                              className="flex w-full items-center justify-between p-3
                                bg-gray-50 dark:bg-gray-700 hover:bg-gray-100
                                dark:hover:bg-gray-600 rounded-md transition"
                            >
                              <span className="text-sm font-medium text-gray-900 dark:text-white truncate">
                                {log.action}
                              </span>
                              {/* chevron */}
                              <svg
                                className={`w-4 h-4 transform transition-transform ${isOpen ? "rotate-180" : ""}`}
                                fill="none"
                                stroke="currentColor"
                                strokeWidth={2}
                                viewBox="0 0 24 24"
                              >
                                <path d="M19 9l-7 7-7-7" />
                              </svg>
                            </button>

                            {/* body */}
                            {isOpen && (
                              <div className="pl-3 dark:bg-gray-800 text-sm space-y-3">
                                <p className="text-gray-800 dark:text-gray-300">
                                  <span className="font-semibold">Comments:</span> {log.comments || "No comments."}
                                </p>

                                <p className="text-gray-600 dark:text-gray-400">
                                  {log.created_at
                                    ? new Date(log.created_at).toLocaleString("en-US", {
                                      year: "numeric",
                                      month: "short",
                                      day: "numeric",
                                      hour: "2-digit",
                                      minute: "2-digit",
                                    })
                                    : "Date N/A"}
                                </p>

                                {log.documents && (
                                  <div
                                    className="inline-block cursor-pointer group"
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      handleImageClick(log.documents!)
                                    }}
                                  >
                                    <img
                                      src={getImageUrl(log.documents) || "/placeholder.svg"}
                                      alt="Order document"
                                      className="w-24 h-24 object-cover rounded-md border-2
                                        border-gray-200 hover:border-blue-400 transition"
                                      onError={(e) => {
                                        const t = e.target as HTMLImageElement
                                        t.style.display = "none"
                                      }}
                                    />
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )}

                {orderLogData && orderLogData.length > 0 && (
                  <div>
                    <h3 className="text-lg font-bold mb-4 text-blue-700 dark:text-blue-400">Order Logs</h3>
                    <div className="bg-white dark:bg-gray-800 border rounded-md p-3 space-y-2">
                      {orderLogData.map((log) => {
                        const isOpen = openId === log.id

                        return (
                          <div key={log.id} className="border border-gray-300 dark:border-gray-600 rounded-md">
                            {/* header */}
                            <button
                              type="button"
                              onClick={() => toggle(log.id)}
                              className="flex w-full items-center justify-between p-3
                                bg-gray-50 dark:bg-gray-700 hover:bg-gray-100
                                dark:hover:bg-gray-600 rounded-md transition"
                            >
                              <span className="text-sm font-medium text-gray-900 dark:text-white truncate">
                                {log.action}
                              </span>
                              {/* chevron */}
                              <svg
                                className={`w-4 h-4 transform transition-transform ${isOpen ? "rotate-180" : ""}`}
                                fill="none"
                                stroke="currentColor"
                                strokeWidth={2}
                                viewBox="0 0 24 24"
                              >
                                <path d="M19 9l-7 7-7-7" />
                              </svg>
                            </button>

                            {/* body */}
                            {isOpen && (
                              <div className="pl-3 dark:bg-gray-800 text-sm space-y-3">
                                <p className="text-gray-800 dark:text-gray-300">
                                  <span className="font-semibold">Comments:</span> {log.comments || "No comments."}
                                </p>

                                <p className="text-gray-600 dark:text-gray-400">
                                  {log.created_at
                                    ? new Date(log.created_at).toLocaleString("en-US", {
                                      year: "numeric",
                                      month: "short",
                                      day: "numeric",
                                      hour: "2-digit",
                                      minute: "2-digit",
                                    })
                                    : "Date N/A"}
                                </p>


                              </div>
                            )}
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )}
              </div>

              {/* Right Side - Payment Summary */}

              <div className="lg:col-span-1">
                <div className="sticky top-4 rounded-[10px] bg-white dark:bg-gray-dark">
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-lg font-semibold text-blue-700 dark:text-blue-400">
                        Payment Summary
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <div className="space-y-3">
                        <div className="flex justify-between items-center">
                          <span className="text-black font-semibold text-sm">Subtotal</span>
                          <span className="font-medium text-black">₹{formatAmount(totalBeforeDiscount)}</span>
                        </div>

                        <div className="flex justify-between items-center">
                          <span className="text-black font-semibold text-sm">Payment Status</span>
                          <PaymentStatusBadge status={data.payment_status} />
                        </div>

                       {
                        data?.discount_type && data?.discount_value && data.discount_value !== 0 &&(
                       
                        <div className="flex justify-between items-center">
                          <span className="text-black font-semibold text-sm">
                            Discount ({" "}
                            {data?.discount_type && data?.discount_value && data.discount_value !== 0
                              ? getDiscountTypeDisplay(data.discount_type)
                              : "-"}{" "}
                            )
                          </span>
                          <span className="text-red-600 dark:text-red-400">
                            - ₹
                            {data?.discount_value && data.discount_value !== 0
                              ? formatAmount(data.discount_value)
                              : "0"}
                          </span>
                        </div>
                        )}

                        <div className="flex text-black justify-between items-center border-t pt-2">
                          <span className="text-black font-semibold text-sm">Total After Discount</span>
                          <span className="text-black font-medium">
                            ₹{formatAmount((data.total_price || 0) - (data.discount_value || 0))}
                          </span>
                        </div>

                        <div className="flex justify-between items-center">
                          <span className="text-black font-semibold text-sm">Amount Paid</span>
                          <span className="font-medium text-black">₹{formatAmount(data.paid_amount || 0)}</span>
                        </div>

                        {data.remaining_amount > 0 && (
                          <div className="flex justify-between items-center">
                            <span className="font-semibold text-black text-sm">Remaining Amount</span>
                            <span className="font-medium text-red-600">₹{formatAmount(data.remaining_amount)}</span>
                          </div>
                        )}

                        <div className="flex text-black justify-between items-center text-lg font-bold pt-3 border-t-2 border-blue-200">
                          <span>Total Payable</span>
                          <span className="text-blue-700">₹{formatAmount(data.total_payable)}</span>
                        </div>

                        {data.paid_amount !== data.total_payable && data.remaining_amount > 0 && (
                          <div className="pt-3">
                            <Button
                              className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                              onClick={() => setPaymentDialogOpen(true)}
                            >
                              Pay Remaining Amount
                            </Button>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>

            </div>
          </CardContent>

          <CardFooter className="bg-gray-50 dark:bg-gray-800 border-t p-4 print:hidden">
            <div className="flex justify-end w-full">
              <Button className="bg-blue-600 text-white" variant="outline" onClick={() => window.history.back()}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Button>
            </div>
          </CardFooter>
        </Card>
      </div>

      {/* Payment Dialog */}
      <Dialog open={paymentDialogOpen} onOpenChange={setPaymentDialogOpen}>
        <DialogContent className="bg-white text-dark-2 max-w-md">
          <DialogHeader>
            <DialogTitle>Pay Remaining Amount</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="flex justify-between grid-cols-1 gap-4 text-sm">

              <span className="font-bold text-dark-2">Remaining Amount:</span>
              <p className="font-bold text-dark-2">₹{formatAmount(data.remaining_amount)}</p>

            </div>

            <div className="space-y-2 text-dark-2">
              <Label htmlFor="paymentAmount">Enter Amount (₹) *</Label>
              <Input
                id="paymentAmount"
                type="number"
                min={0.01}
                max={maxPayableAmount}
                step="0.01"
                value={paymentAmount || ""}
                onChange={(e) => {
                  const value = Number(e.target.value)
                  setPaymentAmount(value)
                  // Clear error when user types a valid amount
                  if (value > 0) {
                    setPaymentError("")
                  }
                }}
                placeholder="Enter amount to pay"
                className={paymentError ? "border-red-500" : ""}
                required
              />
              {paymentError && <p className="text-sm text-red-500">{paymentError}</p>}
            </div>

            <div className="space-y-2 text-dark-2">
              <Label htmlFor="comments">Comments *</Label>
              <Textarea
                id="comments"
                value={comments}
                onChange={(e) => {
                  setComments(e.target.value)
                  // Clear error when user types
                  if (e.target.value.trim()) {
                    setCommentsError("")
                  }
                }}
                placeholder="Add payment comments"
                className={`${commentsError ? "border-red-500" : ""}`}
                rows={3}
                required
              />
              {commentsError && <p className="text-sm text-red-500">{commentsError}</p>}
            </div>

            <div className="space-y-2 text-dark-2">
              <Label htmlFor="documents">Upload Document (Optional)</Label>
              <div className="space-y-2">
                <Input
                  id="documents"
                  type="file"
                  onChange={handleFileChange}
                  accept=".jpg,.jpeg,.png,.gif,.pdf,.txt,.doc,.docx"
                  className={fileUploadError ? "border-red-500" : ""}
                  disabled={isUploading}
                />
                {isUploading && (
                  <div className="flex items-center gap-2 text-sm text-blue-600">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Uploading...
                  </div>
                )}
                {selectedFile && uploadedFileName && (
                  <div className="flex items-center justify-between p-2 border border-blue-200 rounded">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-blue-600" />
                      <span className="text-sm text-blue-700">{selectedFile.name}</span>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={handleRemoveFile}
                      className="h-6 w-6 p-0 text-red-500 hover:text-red-700"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                )}
                {fileUploadError && <p className="text-sm text-red-500">{fileUploadError}</p>}
                <p className="text-xs text-gray-500">
                  Supported formats: JPEG, PNG, GIF, PDF, TXT, DOC, DOCX (Max 5MB)
                </p>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setPaymentDialogOpen(false)}>
              Cancel
            </Button>
            <Button className="text-white" onClick={handlePaymentSubmit} disabled={paymentLoading || isUploading}>
              {paymentLoading ? "Processing..." : "Pay"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Success Dialog */}
      <Dialog open={successDialogOpen} onOpenChange={setSuccessDialogOpen}>
        <DialogContent className="bg-white">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-dark-2">
              <CheckCircle className="h-5 w-5 text-black" />
              {successTitle}
            </DialogTitle>
          </DialogHeader>
          <div className="py-4 text-dark-2">
            <p>{successMessage}</p>
          </div>
          <DialogFooter>
            <Button className="text-white" onClick={() => setSuccessDialogOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={imageDialogOpen} onOpenChange={setImageDialogOpen}>
        <DialogContent className="bg-white max-w-4xl max-h-[90vh] p-0 overflow-hidden">
          <DialogHeader className="p-4 pb-2">
            <DialogTitle className="text-dark-2"></DialogTitle>
          </DialogHeader>
          <div className="relative flex items-center justify-center p-4 min-h-[400px] max-h-[70vh] overflow-auto">
            {selectedImage && (
              <img
                src={selectedImage || "/placeholder.svg"}
                alt="Document preview"
                className="max-w-full max-h-full object-contain rounded-md"
                style={{
                  maxHeight: "calc(70vh - 100px)",
                  width: "auto",
                  height: "auto",
                }}
                onLoad={() => setImageLoading(false)}
                onLoadStart={() => setImageLoading(true)}
              />
            )}
            {imageLoading && (
              <div className="absolute inset-0 flex items-center justify-center bg-gray-50">
                <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
              </div>
            )}
          </div>
          <div className="p-4 pt-2 border-t">
            <div className="flex justify-end items-center">
              <Button className="text-white" onClick={() => setImageDialogOpen(false)}>
                Close
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>


      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-md bg-white">
          <DialogHeader>
            <DialogTitle className="font-bold text-black">Change Order Status</DialogTitle>
          </DialogHeader>

          <div className="py-4 space-y-6">
            {/* Status selector */}
            <div className="space-y-2">
              <Label htmlFor="status-select">Select Status</Label>
              <select
                id="status-select"
                value={selectedOrderStatus}
                onChange={(e) => setSelectedOrderStatus(e.target.value)}
                className="block w-full rounded border px-3 py-2 focus:outline-none focus:ring focus:ring-blue-400"
              >
                {statusOptions.map((status) => (
                  <option key={status} value={status}>
                    {status}
                  </option>
                ))}
              </select>
            </div>

            {/* Comments textarea */}
            <div className="space-y-2">
              <Label htmlFor="comments">Comments *</Label>
              <Textarea
                id="comments"
                value={statusChangeComments}
                onChange={(e) => {
                  setStatusChangeComments(e.target.value);
                  if (e.target.value.trim()) setError("");
                }}
                placeholder="Add comments"
                rows={3}
                required
              />
              {error && <p className="text-sm text-red-500">{error}</p>}
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>

            <Button
              className="text-white"
              onClick={() =>
                updateOrderStatus(
                  selectedOrder,
                  selectedOrderStatus,
                  setData,
                  setIsModalOpen,
                  statusChangeComments // ✅ pass comments here
                )
              }
              disabled={!statusChangeComments.trim()} // Disable if comments are empty
            >
              Change Status
            </Button>
          </DialogFooter>

        </DialogContent>
      </Dialog>

      {openAdd && (
        <Dialog open={openAdd} onOpenChange={setOpenAdd}>
          <DialogContent className="bg-white">
            <DialogHeader>
              <DialogTitle>Success</DialogTitle>
            </DialogHeader>
            <div>Order Status Changed!</div>
            <DialogFooter>
              <Button className="w-full md:w-auto text-white mb-5 mr-2" onClick={() => setOpenAdd(false)}>
                Close
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </>
  )
}
