"use client"

import { useState, useEffect } from "react"
import { Plus } from "lucide-react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/components/ui/use-toast"
import { DateTimePicker } from "@mui/x-date-pickers/DateTimePicker"
import { LocalizationProvider } from "@mui/x-date-pickers"
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns"
import { addCustomer, getCustomers, getParticulars, addOrder, getUnits } from "./actions"
import type { TextFieldProps } from "@mui/material/TextField"
import { OrderSummary } from "@/components/order-summary"
import type { OrderInput } from "@/app/(home)/actions"

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


export default function Home() {
  // State
  const [date, setDate] = useState<Date | null>(new Date())
  const [open, setOpen] = useState(true)
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

  useEffect(() => {
    const fetchData = async () => {
      try {
        const customersData = await getCustomers()
        const particularsData = await getParticulars()
        const units = await getUnits()




        setUnits(units);
        setCustomers(customersData)
        setParticulars(particularsData)
      } catch (error) {
        console.error("Error fetching data:", error)
        alert("Failed to connect to the database. Please check your Supabase configuration.")
      }
    }

    fetchData()
  }, [])

  // Clear validation errors when customer or cart changes
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

    // ── Name: only letters & spaces, at least 2 chars
    if (!newCustomer.name.trim()) {
      errors.name = "Name is required"
    } else if (!/^[A-Za-z\s]{2,}$/.test(newCustomer.name.trim())) {
      errors.name = "Name should contain only letters & spaces"
    }

    // ── Phone: exactly 10 digits
    if (!newCustomer.phone.trim()) {
      errors.phone = "Phone is required"
    } else if (!/^\d{10}$/.test(newCustomer.phone.trim())) {
      errors.phone = "Phone must be a 10‑digit number"
    }

    // ── Aadhaar: optional, but if given must be 12 digits
    if (newCustomer.adhaar.trim()) {
      const digits = newCustomer.adhaar.replace(/\s+/g, "")
      if (!/^\d{12}$/.test(digits)) {
        errors.adhaar = "Aadhaar must be a 12‑digit number"
      }
    }

    // stop if any error
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
    } catch (err) {
      console.error(err)
      setFormErrors({ phone: "Phone Number already exists" })
    } finally {
      setIsLoading(false)
    }
  }

  type Validation = { customer?: string; cart?: string }

  const validateOrder = (): { customer?: string; cart?: string } => {
    const errors: { customer?: string; cart?: string } = {}

    if (!selectedCustomer) {
      errors.customer = "Please select a customer"
    }

    if (cart.length === 0) {
      errors.cart = "Please select any product"
    }

    return errors
  }

  const handlePlaceOrder = async (orderSummaryData: {
    discountAmount: number
    discountType: "flat" | "percentage"
    remarks: string
    totalAmount: number
    totalPayable: number
    paidAmount: number
    paymentMethod: string
  }) => {
    const errors = validateOrder()

    setOrderValidation(errors)

    if (Object.keys(errors).length > 0) {
      return
    }

    try {
      setIsSubmitting(true)

      const customer = customers.find((c) => c.id.toString() === selectedCustomer)
      if (!customer) throw new Error("Customer not found")

      const remaining = orderSummaryData.totalPayable - orderSummaryData.paidAmount
      const paidAmount = orderSummaryData.paidAmount

      const payment_status = remaining === 0 ? "paid" : paidAmount > 0 ? "partiallypaid" : "credit"

      const orderInput: OrderInput = {
        customer_id: customer.id.toString(),
        customer_name: customer.name,
        items: cart.map((item) => ({
          product_id: item.product_id,
          product_name: item.product_name,
          quantity: item.quantity,
          price: item.price,
          unit: item.unit,
        })),
        total_price: orderSummaryData.totalPayable,
        discount_amount: orderSummaryData.discountAmount,
        discount_type: orderSummaryData.discountType,
        remarks: orderSummaryData?.remarks !== "" ? orderSummaryData?.remarks : "",
        total_amount: orderSummaryData.totalAmount,
        total_payable: orderSummaryData.totalPayable,
        payment_method: orderSummaryData.paymentMethod,
        discount_value: orderSummaryData.discountAmount,
        remaining_amount: remaining,
        status: "created",
        paid_amount: orderSummaryData.paidAmount,
        payment_status: payment_status,
      }

      const orderId = await addOrder(orderInput)

      // Clear state after successful order
      setCart([])
      setSelectedParticular("")
      setSelectedCustomer("")
      setDate(new Date())
      setIsOpen(true)
    } catch (error) {
      console.error("Order error:", error)
      toast.error("Failed to place order")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <>


      {cart.length === 0 ? (
        <>
        <div>
        <div className="w-full max-w-4xl mx-auto bg-white rounded-lg shadow-lg p-4 sm:p-6">
      <h2 className="text-xl sm:text-2xl font-bold text-center text-black mb-4 sm:mb-6">Create Order</h2>

      <div className="space-y-4 sm:space-y-6">
        {/* Date Field - Mobile Responsive */}
        <div className="space-y-2 sm:grid sm:grid-cols-[150px_1fr] sm:gap-4 sm:items-center sm:space-y-0">
          <Label className="text-sm sm:text-right font-bold text-gray-700">Date:</Label>
          <div className="w-full sm:w-3/4">
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

        {/* Customer Field - Mobile Responsive */}
        <div className="space-y-2 sm:grid sm:grid-cols-[150px_1fr] sm:gap-4 sm:items-start sm:space-y-0">
          <Label className="text-sm sm:text-right font-bold text-gray-700 sm:mt-2">Customer:</Label>
          <div className="space-y-2 sm:w-3/4">
            <div className="flex gap-2">
              <div className="flex-1">
                <Select value={selectedCustomer} onValueChange={setSelectedCustomer}>
                  <SelectTrigger
                    className={cn(
                      "h-10 w-full",
                      "hover:border-black",
                      orderValidation.customer ? "border-red-500" : "",
                    )}
                  >
                    <SelectValue placeholder="Select customer" />
                  </SelectTrigger>
                  <SelectContent className="z-[999] w-full bg-white shadow-md border rounded-md">
                    {customers.map((customer) => (
                      <SelectItem key={customer.id} value={customer.id.toString()}>
                        {customer.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <Dialog open={isAddingCustomer} onOpenChange={setIsAddingCustomer}>
                <DialogTrigger asChild>
                  <Button size="icon" className="shrink-0" aria-label="Add new customer">
                    <Plus className="h-4 w-4" />
                  </Button>
                </DialogTrigger>
                <DialogContent className="bg-white w-[95vw] max-w-md max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle className="text-center text-gray-900">Add New Customer</DialogTitle>
                  </DialogHeader>

                  <div className="space-y-4 py-4">
                    {/* NAME - Mobile Responsive */}
                    <div className="space-y-2">
                      <Label htmlFor="name" className="text-sm font-medium text-gray-700">
                        Name <span className="text-red-500">*</span>
                      </Label>
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
                      {formErrors.name && <p className="text-sm text-red-500">{formErrors.name}</p>}
                    </div>

                    {/* PHONE - Mobile Responsive */}
                    <div className="space-y-2">
                      <Label htmlFor="phone" className="text-sm font-medium text-gray-700">
                        Phone <span className="text-red-500">*</span>
                      </Label>
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
                      {formErrors.phone && <p className="text-sm text-red-500">{formErrors.phone}</p>}
                    </div>

                    {/* AADHAAR - Mobile Responsive */}
                    <div className="space-y-2">
                      <Label htmlFor="adhaar" className="text-sm font-medium text-gray-700">
                        Aadhaar
                      </Label>
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
                      {formErrors.adhaar && <p className="text-sm text-red-500">{formErrors.adhaar}</p>}
                    </div>

                    {/* ADDRESS - Mobile Responsive */}
                    <div className="space-y-2">
                      <Label htmlFor="address" className="text-sm font-medium text-gray-700">
                        Address
                      </Label>
                      <Textarea
                        id="address"
                        value={newCustomer.address}
                        onChange={(e) => setNewCustomer({ ...newCustomer, address: e.target.value })}
                        rows={3}
                        className="resize-none"
                      />
                    </div>
                  </div>

                  <DialogFooter className="flex flex-col-reverse sm:flex-row gap-2">
                    <Button variant="outline" onClick={() => setIsAddingCustomer(false)} className="w-full sm:w-auto">
                      Cancel
                    </Button>
                    <Button onClick={handleAddCustomer} disabled={isLoading} className="w-full sm:w-auto">
                      {isLoading ? "Saving..." : "Save"}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>

            {orderValidation.customer && <p className="text-sm text-red-500">{orderValidation.customer}</p>}
          </div>
        </div>

        {/* Product Field - Mobile Responsive */}
        <div className="space-y-2 sm:grid sm:grid-cols-[150px_1fr] sm:gap-4 sm:items-start sm:space-y-0">
          <Label className="text-sm sm:text-right font-bold text-gray-700 sm:mt-2">Product:</Label>
          <div className="space-y-2 sm:w-3/4">
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
                className={cn("h-10 w-full", "hover:border-black", orderValidation.cart ? "border-red-500" : "")}
              >
                <SelectValue placeholder="Select product" />
              </SelectTrigger>
              <SelectContent className="z-[999] w-full bg-white shadow-md border rounded-md">
                {particulars.map((particular) => (
                  <SelectItem key={particular.id} value={particular.id}>
                    {particular.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {orderValidation.cart && <p className="text-sm text-red-500">{orderValidation.cart}</p>}
          </div>
        </div>

        {/* Submit Button - Mobile Responsive */}
        <div className="flex justify-end pt-4">
          <Button
            type="submit"
            className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white"
            onClick={() => {
              if (!selectedCustomer) {
                setOrderValidation({ customer: "Please select a customer" })
                return
              }
              if (!selectedParticular) {
                setOrderValidation({ cart: "Please select any product" })
                return
              }

              const selected = particulars.find((p) => p.id === selectedParticular)
              if (selected) {
                const unitNames = units.map((u) => u.name)
                const productUnit = selected.unit && unitNames.includes(selected.unit) ? selected.unit : "pc"

                setCart([
                  {
                    product_id: selected.id,
                    product_name: selected.name,
                    price: selected.price,
                    quantity: 1,
                    unit: productUnit,
                  },
                ])
              }
            }}
          >
            {isSubmitting ? "Processing..." : "Place Order"}
          </Button>
        </div>
      </div>
    </div>
        </div>
        </>
      ) : (

        <>
        <div>
        <div className="flex flex-col md:flex-row w-full gap-4">

          <div className="w-full md:w-2/3 bg-white rounded-[10px] shadow-1 p-4" >
            <h2 className="text-2xl font-bold text-center text-black mb-4">Create Order</h2>
            <div className="space-y-4">
              <div className="grid grid-cols-4 gap-4 items-center">
                <h3 className="text-right text-heading-5 font-bold text-dark-4 dark:text-dark-600 dark:text-white">
                  Date:
                </h3>
                <div className="col-span-3 text-heading-6 font-medium text-dark-4 w-3/4">
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
                <h3 className="text-right text-heading-5 font-bold text-dark-4 dark:text-dark-600 dark:text-white">
                  Customer:
                </h3>
                <div className="col-span-2 text-heading-6 font-medium text-dark-4 relative">
                  <div className="h-[60px]">
                    <Select value={selectedCustomer} onValueChange={setSelectedCustomer}>
                      <SelectTrigger
                        id="customer"
                        aria-label="Select customer"
                        className={cn(
                          "h-10",
                          "hover:border-black mt-5",
                          orderValidation.customer ? "border-red-500" : "",
                        )}
                      >
                        <SelectValue placeholder="Select customer" />
                      </SelectTrigger>
                      <SelectContent className="z-[999] w-full bg-white shadow-md border rounded-md text-heading-6 font-bold text-dark">
                        {customers.map((customer) => (
                          <SelectItem key={customer.id} value={customer.id.toString()}>
                            {customer.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {orderValidation.customer && (
                      <p className="text-sm text-red-500 mt-1">{orderValidation.customer}</p>
                    )}
                  </div>
                </div>
                <div>
                  <Dialog open={isAddingCustomer} onOpenChange={setIsAddingCustomer}>
                    <DialogTrigger asChild>
                      <Button className="text-white" size="icon" aria-label="Add new customer">
                        <Plus className="h-4 w-4" />
                        <span className="sr-only items-center text-center">Add new customer</span>
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="bg-white dark:bg-white">
                      <DialogHeader>
                        <DialogTitle className="text-center text-dark">Add New Customer</DialogTitle>
                      </DialogHeader>
                      <div className="grid gap-4 py-4">
                        {/* NAME */}
                        <div className="grid grid-cols-4 items-center gap-4">
                          <Label htmlFor="name" className="text-right text-dark">
                            Name <span className="text-red-500">*</span>
                          </Label>

                          <div className="col-span-3 space-y-1 text-dark">
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
                            {formErrors.name && <p className="text-sm text-red-500">{formErrors.name}</p>}
                          </div>
                        </div>

                        {/* PHONE */}
                        <div className="grid grid-cols-4 items-center gap-4">
                          <Label htmlFor="phone" className="text-right text-dark">
                            Phone <span className="text-red-500">*</span>
                          </Label>
                          <div className="col-span-3 space-y-1 text-dark">
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
                            {formErrors.phone && <p className="text-sm text-red-500">{formErrors.phone}</p>}
                          </div>
                        </div>

                        {/* AADHAAR */}
                        <div className="grid grid-cols-4 items-center gap-4">
                          <Label htmlFor="adhaar" className="text-right text-dark">
                            Aadhaar
                          </Label>
                          <div className="col-span-3 space-y-1 text-dark">
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
                            {formErrors.adhaar && <p className="text-sm text-red-500">{formErrors.adhaar}</p>}
                          </div>
                        </div>

                        <div className="grid grid-cols-4 items-center gap-4 text-dark">
                          <Label htmlFor="address" className="text-right text-dark">
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
                        <Button className="color:  bg-green-600 text-white" onClick={() => setIsAddingCustomer(false)}>
                          Cancel
                        </Button>
                        <Button className="text-white " onClick={handleAddCustomer} disabled={isLoading}>
                          {isLoading ? "Saving..." : "Save"}
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </div>
              </div>

              <div className="grid grid-cols-4 gap-4 items-center">
                <h3 className="text-right text-heading-5 font-bold text-dark-4 dark:text-dark-600 dark:text-white pb-4">
                  Product:
                </h3>
                <div className="col-span-3 text-heading-6 font-medium text-dark-4 w-3/4 mt-2">
                  <div className="h-[60px]">
                    <Select
                      value={selectedParticular}
                      onValueChange={(value) => {
                        setSelectedParticular(value);

                        const selected = particulars.find((p) => p.id === value);

                        const unitNames = units.map((u) => u.name); // Extract unit names from the units array
                        const productUnit =
                          selected?.unit && unitNames.includes(selected.unit) ? selected.unit : "pc";

                        if (selected) {
                          const exists = cart.find((item) => item.product_id === selected.id);
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
                            ]);
                          }
                        }
                      }}
                    >
                      <SelectTrigger
                        id="particulars"
                        aria-label="Select product"
                        className={cn("h-10", "hover:border-black", orderValidation.cart ? "border-red-500" : "")}
                      >
                        <span className="text-muted-foreground">Select product</span>
                      </SelectTrigger>

                      <SelectContent className="z-[999] w-full bg-white shadow-md border rounded-md text-heading-6 font-medium text-dark-">
                        {particulars.map((particular) => (
                          <SelectItem key={particular.id} value={particular.id}>
                            {particular.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {orderValidation.cart && <p className="text-sm text-red-500 mt-1">{orderValidation.cart}</p>}
                  </div>
                </div>
              </div>
            </div>

            {/* Cart Table - Within the left column */}
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
                    <TableRow
                      key={item.product_id}
                      className="group text-center text-base font-medium text-dark dark:text-white"
                    >
                      <TableCell className="!text-left">{item.product_name}</TableCell>

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
                          className="h-8 w-16 text-center border rounded"
                        />
                      </TableCell>

                      <TableCell>
                        <Select
                          value={units.map((u) => u.name).includes(item.unit) ? item.unit : "pc"}
                          onValueChange={(value) =>
                            setCart((prev) =>
                              prev.map((i) =>
                                i.product_id === item.product_id ? { ...i, unit: value } : i
                              )
                            )
                          }
                        >
                          <SelectTrigger className="h-8 w-24 min-w-0 mx-auto">
                            <SelectValue placeholder="Unit" />
                          </SelectTrigger>
                          <SelectContent>
                            {units.map((unit) => (
                              <SelectItem key={unit.id} value={unit.name}>
                                {unit.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>

                      </TableCell>

                      <TableCell>{item.price}</TableCell>
                      <TableCell>
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
          </div>

          {/* Gray background gap */}
          <div className="hidden md:block w-4 bg-gray-100"></div>

          {/* Right side - Order Summary */}
          <div className="w-full md:w-1/3 bg-white rounded-[10px] shadow-1 p-6 md:sticky md:top-6 self-start">
            <OrderSummary
              cart={cart}
              selectedCustomer={selectedCustomer}
              isSubmitting={isSubmitting}
              onPlaceOrder={handlePlaceOrder}
            />
          </div>
        </div>
        </div>
        </>
      )}


      {isOpen && (
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogContent className="bg-white">
            <DialogHeader>
              <DialogTitle>Success</DialogTitle>
            </DialogHeader>
            <div>Order placed successfully!</div>
            <DialogFooter>
              <Button className="w-full md:w-auto text-white mb-5 mr-2" onClick={() => setOpen(false)}>
                Close
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </>
  )
}
