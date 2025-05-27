"use client"

import { use,useState, useEffect } from "react"
import { useSearchParams } from "next/navigation"
import { Plus } from "lucide-react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/hooks/use-toast"
import { DateTimePicker } from "@mui/x-date-pickers/DateTimePicker"
import { LocalizationProvider } from "@mui/x-date-pickers"
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns"
import { OrderSummary } from "@/components/order-summary"
import type { TextFieldProps } from "@mui/material/TextField"
import { addCustomer, getCustomers, getParticulars, addOrder, getUnits ,updateOrder ,getOrderById} from "@/app/sales/actions"
import { Loader2 } from "lucide-react"

// Types
interface Customer {
  id: string
  name: string
  phone: string
  adhaar?: string
  address?: string
}

interface Units {
  id: string
  name: string
}

interface Particular {
  id: string
  name: string
  price: number
  unit?: string
}

interface CartItem {
  product_id: string
  product_name: string
  quantity: number
  price: number
  unit: string
}

interface Order {
  id: string
  customer_id: string
  customer_name: string
  date: Date
  items: CartItem[]
  total_price: number
  discount_type: "flat" | "percentage"
  remarks: string
  total_payable: number
  payment_method: string
  paid_amount: number
  remaining_amount: number
  status: string
  payment_status: string
}

export interface OrderInput {
  customer_id: string
  customer_name: string
  date: Date
  items: CartItem[]
  total_price: number
  discount_type: "flat" | "percentage"
  remarks: string
  total_payable: number
  payment_method: string
  discount_value: number
  remaining_amount: number
  status: string
  paid_amount: number
  payment_status: string
}


interface OrderDetailPageProps {
  params: { id?: string[] };
}


export default function Home({ params }: { params: Promise<{ id?: string[] }> }) {

  const resolvedParams = use(params);
    const idArray = resolvedParams.id;
    const id = Array.isArray(idArray) ? parseInt(idArray[0]) : undefined;

    console.log("id", id);



  const searchParams = useSearchParams()
  const orderId = searchParams.get("id")
  const isEditMode = !!id

  // State
  const [date, setDate] = useState<Date | null>(new Date())
  const [open, setOpen] = useState(!isEditMode) 
  const [openEdit, setEditOpen] = useState(false) 
  const [customers, setCustomers] = useState<Customer[]>([])
  const [units, setUnits] = useState<Units[]>([])
  const [particulars, setParticulars] = useState<Particular[]>([])
  const [selectedCustomer, setSelectedCustomer] = useState<string>("")
  const [isAddingCustomer, setIsAddingCustomer] = useState(false)
  const [newCustomer, setNewCustomer] = useState({
    name: "",
    phone: "",
    adhaar: "",
    address: "",
  })
  const [isLoading, setIsLoading] = useState(false)
  const [isLoadingOrder, setIsLoadingOrder] = useState(isEditMode)
  const { toast } = useToast()

  const [isOpen, setIsOpen] = useState(false)

  const openDialog = () => setIsOpen(true)
  const closeDialog = () => setIsOpen(false)

  const [cart, setCart] = useState<CartItem[]>([])
  const [selectedParticular, setSelectedParticular] = useState<string>("")
  const [currentQuantity, setCurrentQuantity] = useState<string>("1")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formErrors, setFormErrors] = useState<{
    name?: string
    phone?: string
    adhaar?: string
  }>({})
  const [orderValidation, setOrderValidation] = useState<{
    customer?: string
    cart?: string
  }>({})

  const [editOrderSummary, setEditOrderSummary] = useState<{
    discountAmount: number
    discountType: "flat" | "percentage"
    remarks: string
    totalAmount: number
    totalPayable: number
    paidAmount: number
    paymentMethod: string
  } | null>(null)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const customersData = await getCustomers()
        const particularsData = await getParticulars()
        const unitsData = await getUnits()


        // console.log("isEditMode",isEditMode);
        // console.log("orderId",orderId);
     
        setUnits(unitsData)
        setCustomers(customersData)
        setParticulars(particularsData)

        // If in edit mode, fetch order details
        if (isEditMode && id) {
          setIsLoadingOrder(true)
          try {
            const orderData = await getOrderById(id)

            
            console.log("orderData",orderData);

            if (orderData) {
       
              setSelectedCustomer(orderData.customer_id.toString())
              setDate(new Date(orderData.date))
              setCart(orderData.items || [])

              setEditOrderSummary({
                discountAmount: orderData.discount_value || 0,
                discountType: orderData.discount_type,
                remarks: orderData.remarks || "",
                totalAmount: orderData.total_price || 0,
                totalPayable: orderData.total_payable || 0,
                paidAmount: orderData.paid_amount || 0,
                paymentMethod: orderData.payment_method || "",
              })
            }
          } catch (error) {
            console.error("Error fetching order:", error)
            toast({
              title: "Error",
              description: "Failed to load order details",
              variant: "destructive",
            })
          } finally {
            setIsLoadingOrder(false)
          }
        }
      } catch (error) {
        console.error("Error fetching data:", error)
        toast({
          title: "Error",
          description: "Failed to connect to the database. Please check your configuration.",
          variant: "destructive",
        })
      }
    }

    fetchData()
  }, [isEditMode, orderId, toast])

  
  useEffect(() => {
    const newValidation = { ...orderValidation }

    if (selectedCustomer && newValidation.customer) {
      delete newValidation.customer
    }

    if (cart.length > 0 && newValidation.cart) {
      delete newValidation.cart
    }

    setOrderValidation(newValidation)
  }, [selectedCustomer, cart])

  const handleAddCustomer = async () => {
    const errors: { name?: string; phone?: string; adhaar?: string } = {}

    // Name validation: only letters & spaces, at least 2 chars
    if (!newCustomer.name.trim()) {
      errors.name = "Name is required"
    } else if (!/^[A-Za-z\s]{2,}$/.test(newCustomer.name.trim())) {
      errors.name = "Name should contain only letters & spaces"
    }

    // Phone validation: exactly 10 digits
    if (!newCustomer.phone.trim()) {
      errors.phone = "Phone is required"
    } else if (!/^\d{10}$/.test(newCustomer.phone.trim())) {
      errors.phone = "Phone must be a 10‑digit number"
    }

    // Aadhaar validation: optional, but if given must be 12 digits
    if (newCustomer.adhaar.trim()) {
      const digits = newCustomer.adhaar.replace(/\s+/g, "")
      if (!/^\d{12}$/.test(digits)) {
        errors.adhaar = "Aadhaar must be a 12‑digit number"
      }
    }

    // Stop if any error
    if (Object.keys(errors).length !== 0) {
      setFormErrors(errors)
      return
    }

    setFormErrors({})
    setIsLoading(true)

    try {
      const newCustomerId = await addCustomer(newCustomer)

      const addedCustomer = {
        ...newCustomer,
        id: newCustomerId.toString(),
      }

      setCustomers([...customers, addedCustomer])
      setSelectedCustomer(newCustomerId.toString())

      setNewCustomer({ name: "", phone: "", adhaar: "", address: "" })
      setIsAddingCustomer(false)

      toast({
        title: "Success",
        description: "Customer added successfully",
      })
    } catch (err) {
      console.error(err)
      setFormErrors({ phone: "Phone Number already exists" })
    } finally {
      setIsLoading(false)
    }
  }

  const validateOrder = (): { customer?: string; cart?: string } => {
    const errors: { customer?: string; cart?: string } = {}

    if (!selectedCustomer) {
      errors.customer = "Please select a customer"
    }

    if (cart.length === 0) {
      errors.cart = "Please add at least one product to the cart"
    }

    return errors
  }

  const handlePlaceOrder = async (
    orderSummaryData: {
      discountAmount: number
      discountType: "flat" | "percentage"
      remarks: string
      totalAmount: number
      totalPayable: number
      paidAmount: number
      paymentMethod: string
    },
    summaryErrors: { paymentMethod?: string; paidAmount?: string },
  ) => {
    // Validate main order requirements first
    const orderErrors = validateOrder()

    // Set all errors at once
    setOrderValidation(orderErrors)

    // console.log("orderErrors", orderErrors)
    // console.log("summaryErrors", summaryErrors)

    // If there are any validation errors, don't proceed
    if (Object.keys(orderErrors).length > 0 || Object.keys(summaryErrors).length > 0) {
      return
    }

    try {
      setIsSubmitting(true)

      const customer = customers.find((c) => c.id.toString() === selectedCustomer)
      if (!customer) throw new Error("Customer not found")

      const remaining = orderSummaryData.totalAmount - orderSummaryData.paidAmount - orderSummaryData.discountAmount
      const paidAmount = orderSummaryData.paidAmount

      const payment_status = remaining === 0 ? "paid" : paidAmount > 0 ? "partiallypaid" : "credit"

      const orderInput: OrderInput = {
        customer_id: customer.id.toString(),
        customer_name: customer.name,
        date: date || new Date(),
        items: cart.map((item) => ({
          product_id: item.product_id,
          product_name: item.product_name,
          quantity: item.quantity,
          price: item.price,
          unit: item.unit,
        })),
        total_price: orderSummaryData.totalAmount,
        discount_type: orderSummaryData.discountType,
        remarks: orderSummaryData?.remarks || "",
        total_payable: orderSummaryData.totalPayable,
        payment_method: orderSummaryData.paymentMethod,
        discount_value: orderSummaryData.discountAmount,
        remaining_amount: remaining,
        status: "created",
        paid_amount: orderSummaryData.paidAmount,
        payment_status: payment_status,
      }

      if (isEditMode && id) {
    
        await updateOrder( id, orderInput)
        toast({
          title: "Success",
          description: "Order updated successfully",
        })
        setEditOpen(true)
      } else {
       
        const newOrderId = await addOrder(orderInput)
        
      }

      // Clear state after successful order (only for create mode)
      if (!isEditMode) {
        setCart([])
        setSelectedParticular("")
        setSelectedCustomer("")
        setDate(new Date())
        setIsOpen(true)
      }
    } catch (error) {
      console.error("Order error:", error)
      toast({
        title: "Error",
        description: "Failed to process order",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

 

   if (isLoadingOrder) {
      return (
        <div className="flex justify-center items-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
        </div>
      )
    }

  return (
    <>
      <div className="rounded-[10px] shadow-1 dark:bg-gray-dark dark:shadow-card">
        <div className="flex flex-col md:flex-row justify-evenly gap-4">
          <div className="w-full md:w-2/3 rounded-[10px] bg-white dark:bg-gray-dark shadow-lg p-4">
            <h2 className="text-2xl font-bold text-center text-black mb-4">
              {isEditMode ? "Edit Order" : "Create Order"}
            </h2>
            <div className="space-y-4">
              <div className="grid grid-cols-4 gap-4 items-center">
                <h3 className="text-right text-lg font-semibold text-dark-2">Date:</h3>
                <div className="col-span-3 w-3/4">
                  <LocalizationProvider dateAdapter={AdapterDateFns}>
                    <DateTimePicker
                      value={date}
                      onChange={(newValue: Date | null) => setDate(newValue)}
                      views={["year", "month", "day", "hours", "minutes", "seconds"]}
                      slotProps={{
                        textField: {
                          fullWidth: true,
                          variant: "outlined",
                          size: "small",
                        } as TextFieldProps,
                      }}
                    />
                  </LocalizationProvider>
                </div>
              </div>

              <div className="grid grid-cols-4 gap-4 items-center">
                <h3 className="text-right text-lg font-semibold text-dark-2">Customer:</h3>
                <div className="col-span-2 relative">
                  <div className="h-[60px]">
                    <Select value={selectedCustomer} onValueChange={setSelectedCustomer}>
                      <SelectTrigger
                        id="customer"
                        aria-label="Select customer"
                        className={cn(
                          "h-10",
                          "hover:border-black mt-5",
                          "font-semibold",
                          "text-black",
                          orderValidation.customer ? "border-red-500" : "",
                        )}
                      >
                        <SelectValue className="text-black font-semibold" placeholder="Select customer" />
                      </SelectTrigger>
                      <SelectContent className="z-[999] w-full font-bold text-black bg-white shadow-md border rounded-md">
                        {customers.map((customer) => (
                          <SelectItem key={customer.id} value={customer.id.toString()}>
                            {customer.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {orderValidation.customer && (
                      <p className="text-md text-red-500 mt-1">{orderValidation.customer}</p>
                    )}
                  </div>
                </div>
                <div>
                  <Dialog open={isAddingCustomer} onOpenChange={setIsAddingCustomer}>
                    <DialogTrigger asChild>
                      <Button className="text-white" size="icon" aria-label="Add new customer">
                        <Plus className="h-4 w-4" />
                        <span className="sr-only">Add new customer</span>
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="bg-white">
                      <DialogHeader>
                        <DialogTitle className="text-center text-black">Add New Customer</DialogTitle>
                      </DialogHeader>
                      <div className="grid gap-4 py-4">
                        {/* NAME */}
                        <div className="grid grid-cols-4 items-center gap-4">
                          <Label htmlFor="name" className="text-right text-black">
                            Name <span className="text-red-500">*</span>
                          </Label>
                          <div className="col-span-3 space-y-1">
                            <Input
                              id="name"
                              value={newCustomer.name}
                              onChange={(e) => {
                                const value = e.target.value
                                setNewCustomer({ ...newCustomer, name: value })
                                if (formErrors.name) {
                                  setFormErrors({ ...formErrors, name: undefined })
                                }
                              }}
                              className={formErrors.name ? "border-red-500" : ""}
                              maxLength={20}
                              required
                            />
                            {formErrors.name && <p className="text-md text-red-500">{formErrors.name}</p>}
                          </div>
                        </div>

                        {/* PHONE */}
                        <div className="grid grid-cols-4 items-center gap-4">
                          <Label htmlFor="phone" className="text-right text-black">
                            Phone <span className="text-red-500">*</span>
                          </Label>
                          <div className="col-span-3 space-y-1">
                            <Input
                              id="phone"
                              type="tel"
                              inputMode="numeric"
                              pattern="\d{10}"
                              maxLength={10}
                              value={newCustomer.phone}
                              onChange={(e) => {
                                const value = e.target.value.replace(/\D/g, "")
                                setNewCustomer({ ...newCustomer, phone: value })
                                if (formErrors.phone) {
                                  setFormErrors({ ...formErrors, phone: undefined })
                                }
                              }}
                              className={formErrors.phone ? "border-red-500" : ""}
                              required
                            />
                            {formErrors.phone && <p className="text-md text-red-500">{formErrors.phone}</p>}
                          </div>
                        </div>

                        {/* AADHAAR */}
                        <div className="grid grid-cols-4 items-center gap-4">
                          <Label htmlFor="adhaar" className="text-right text-black">
                            Aadhaar
                          </Label>
                          <div className="col-span-3 space-y-1">
                            <Input
                              id="adhaar"
                              inputMode="numeric"
                              maxLength={14}
                              value={newCustomer.adhaar}
                              onChange={(e) => {
                                const value = e.target.value.replace(/[^\d\s]/g, "")
                                setNewCustomer({ ...newCustomer, adhaar: value })
                                if (formErrors.adhaar) {
                                  setFormErrors({ ...formErrors, adhaar: undefined })
                                }
                              }}
                              className={formErrors.adhaar ? "border-red-500" : ""}
                            />
                            {formErrors.adhaar && <p className="text-md text-red-500">{formErrors.adhaar}</p>}
                          </div>
                        </div>

                        <div className="grid grid-cols-4 items-center gap-4">
                          <Label htmlFor="address" className="text-right text-black">
                            Address
                          </Label>
                          <Textarea
                            id="address"
                            value={newCustomer.address}
                            onChange={(e) => setNewCustomer({ ...newCustomer, address: e.target.value })}
                            className="col-span-3"
                            rows={3}
                          />
                        </div>
                      </div>
                      <DialogFooter className="flex flex-col sm:flex-row-reverse sm:justify-center gap-2">
                        <Button variant="outline" onClick={() => setIsAddingCustomer(false)}>
                          Cancel
                        </Button>
                        <Button className="text-white" onClick={handleAddCustomer} disabled={isLoading}>
                          Save
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </div>
              </div>

              <div className="grid grid-cols-4 gap-4 items-center">
                <h3 className="text-right text-lg font-semibold text-dark-2 pb-4">Product:</h3>
                <div className="col-span-3 w-3/4 mt-2">
                  <div className="h-[60px]">
                    <Select
                      value={selectedParticular}
                      onValueChange={(value) => {
                        setSelectedParticular(value)

                        const selected = particulars.find((p) => p.id === value)
                        const unitNames = units.map((u) => u.name)
                        const productUnit = selected?.unit && unitNames.includes(selected.unit) ? selected.unit : "pc"

                        if (selected) {
                          const exists = cart.find((item) => item.product_id === selected.id)
                          if (!exists) {
                            setCart((prev) => [
                              ...prev,
                              {
                                product_id: selected.id,
                                product_name: selected.name,
                                price: selected.price,
                                quantity: 1,
                                unit: productUnit,
                              },
                            ])
                          }
                        }
                      }}
                    >
                      <SelectTrigger
                        id="particulars"
                        aria-label="Select product"
                        className={cn("h-10","text-black","font-semibold","hover:border-black", orderValidation.cart ? "border-red-500" : "")}
                      >
                        <SelectValue className="font-semibold text-black" placeholder="Select product" />
                      </SelectTrigger>
                      <SelectContent className="z-[999] text-black font-semibold w-full bg-white shadow-md border rounded-md">
                        {particulars.map((particular) => (
                          <SelectItem key={particular.id} value={particular.id}>
                            {particular.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {orderValidation.cart && <p className="text-md text-red-500 mt-1">{orderValidation.cart}</p>}
                  </div>
                </div>
              </div>
            </div>

            {/* Cart Table */}
            {cart.length > 0 && (
              <div
                className="mt-6 mb-6 border rounded-md overflow-hidden"
                style={{ maxHeight: "400px", overflowY: "auto" }}
              >
                <Table>
                  <TableHeader className="sticky top-0 bg-white z-10">
                    <TableRow className="border-none uppercase [&>th]:text-center">
                      <TableHead className="!text-left min-w-[100px]">Product</TableHead>
                      <TableHead className="min-w-[100px]">Quantity</TableHead>
                      <TableHead className="min-w-[100px]">Unit</TableHead>
                      <TableHead className="min-w-[100px]">Price</TableHead>
                      <TableHead className="min-w-[100px]">Total</TableHead>
                      <TableHead></TableHead>
                    </TableRow>
                  </TableHeader>

                  <TableBody>
                    {cart.map((item) => (
                      <TableRow key={item.product_id} className="group text-center text-black font-medium">
                        <TableCell className="!text-left text-black">{item.product_name}</TableCell>

                        <TableCell>
                          <input
                            type="number"
                            min={1}
                            value={item.quantity}
                            onChange={(e) => {
                              const value = Number.parseInt(e.target.value) || 1
                              setCart((prev) =>
                                prev.map((i) =>
                                  i.product_id === item.product_id ? { ...i, quantity: Math.max(1, value) } : i,
                                ),
                              )
                            }}
                            className="h-8 w-16 text-black text-center border rounded"
                          />
                        </TableCell>

                        <TableCell className="text-black">
                          <Select
                            value={units.map((u) => u.name).includes(item.unit) ? item.unit : "pc"}
                            onValueChange={(value) =>
                              setCart((prev) =>
                                prev.map((i) => (i.product_id === item.product_id ? { ...i, unit: value } : i)),
                              )
                            }
                          >
                            <SelectTrigger className="h-8 w-24 text-black font-bold min-w-0 mx-auto">
                              <SelectValue className="text-black" placeholder="Unit" />
                            </SelectTrigger>
                            <SelectContent className="z-[999s] text-black font-semibold w-full bg-white shadow-md border rounded-md">
                              {units.map((unit) => (
                                <SelectItem key={unit.id} value={unit.name}>
                                  {unit.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </TableCell>

                        <TableCell className="text-black">₹{item.price}</TableCell>
                        <TableCell className="text-black">
                          ₹
                          {(item.price * item.quantity) % 1 === 0
                            ? item.price * item.quantity
                            : (item.price * item.quantity).toFixed(2)}
                        </TableCell>

                        <TableCell>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setCart((prev) => prev.filter((i) => i.product_id !== item.product_id))}
                            className="h-8 w-8 p-0 mx-auto opacity-0 group-hover:opacity-100 text-red-600 transition-opacity duration-200"
                          >
                            <span className="sr-only">Remove</span>
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              width="16"
                              height="16"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              className="lucide lucide-x"
                            >
                              <path d="M18 6 6 18" />
                              <path d="m6 6 12 12" />
                            </svg>
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </div>

          {/* Gray background gap */}
          <div className="hidden md:block w-2 bg-gray shadow-1 dark:bg-gray-dark dark:shadow-card"></div>

          {/* Right side - Order Summary */}
          <div className="w-full md:w-1/3 rounded-[10px] shadow-lg self-start">
            <OrderSummary
              cart={cart}
              selectedCustomer={selectedCustomer}
              isSubmitting={isSubmitting}
              onPlaceOrder={handlePlaceOrder}
              isEditMode={isEditMode}
              editOrderSummary={editOrderSummary}
            />
          </div>
        </div>
      </div>

      {isOpen && !isEditMode && (
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogContent className="bg-white">
            <DialogHeader>
              <DialogTitle>Success</DialogTitle>
            </DialogHeader>
            <div>Order placed successfully!</div>
            <DialogFooter>
              <Button
                className="w-full md:w-auto text-white mb-5 mr-2"
                onClick={() => {
                  setOpen(false)
                  window.location.reload()
                }}
              >
                Close
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

        { openEdit && isEditMode && (
        <Dialog open={openEdit} onOpenChange={setEditOpen}>
          <DialogContent className="bg-white">
            <DialogHeader>
              <DialogTitle>Success</DialogTitle>
            </DialogHeader>
            <div>Order Updated successfully!</div>
            <DialogFooter>
              <Button
                className="w-full md:w-auto text-white mb-5 mr-2"
                onClick={() => {
                  setEditOpen(false)
                  window.location.reload()
                }}
              >
                Close
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

    </>
  )
}
