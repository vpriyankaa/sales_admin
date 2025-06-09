"use client"

import React, { useState, useEffect } from "react"
import { useSearchParams } from "next/navigation"
import { Plus } from "lucide-react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/hooks/use-toast"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { format } from "date-fns"
import { CalendarIcon, Clock } from "lucide-react"
import { OrderSummary } from "@/components/order-summary"
import { addCustomer, getCustomers, getProducts, addOrder, getUnits, updateOrder, getOrderById } from "@/app/actions"
import { Loader2 } from "lucide-react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import type { Product } from "app-types/product"
import type { Customer } from "app-types/customer"
import type { Unit } from "app-types/unit"
import type { OrderInput } from "app-types/order-input"
import type { OrderSummary as OrderSummaryData } from "app-types/order-summary"
import { isDiscountType } from "app-types/discount-type"

interface Props {
  id: string
}

// Customer form schema
const customerFormSchema = z.object({
  name: z
    .string()
    .min(2, "Name must be at least 2 characters")
    .regex(/^[A-Za-z\s]+$/, "Name should contain only letters and spaces"),
  phone: z
    .string()
    .min(10, "Phone must be a 10-digit number")
    .max(10, "Phone must be a 10-digit number")
    .regex(/^\d{10}$/, "Phone must contain only digits"),
  aadhaar: z
    .string()
    .optional()
    .refine((val) => {
      if (!val || val.trim() === "") return true
      const digits = val.replace(/\s+/g, "")
      return /^\d{12}$/.test(digits)
    }, "Aadhaar must be a 12-digit number"),
  address: z.string().optional(),
})

type CustomerFormData = z.infer<typeof customerFormSchema>

export default function Home({ id }: Props) {
  const searchParams = useSearchParams()
  const orderId = searchParams.get("id")
  const isEditMode = !!id

  // State
  const [date, setDate] = React.useState<Date | null>(new Date())
  const [open, setOpen] = useState(!isEditMode)
  const [openEdit, setEditOpen] = useState(false)
  const [isCustomerLoad, setIsCustomerLoad] = useState(true)
  const [isProductLoad, setIsProductLoad] = useState(true)
  const [customers, setCustomers] = useState<Customer[]>([])
  const [units, setUnits] = useState<Unit[]>([])
  const [particulars, setParticulars] = useState<Product[]>([])
  const [selectedUser, setSelectedCustomer] = useState<string>("")
  const [isAddingCustomer, setIsAddingCustomer] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [isLoadingOrder, setIsLoadingOrder] = useState(isEditMode)
  const { toast } = useToast()

  // Customer form
  const customerForm = useForm<CustomerFormData>({
    resolver: zodResolver(customerFormSchema),
    defaultValues: {
      name: "",
      phone: "",
      aadhaar: "",
      address: "",
    },
    mode: "onSubmit",
  })

  const [isOpen, setIsOpen] = useState(false)

  useEffect(() => {
    setDate(new Date())
  }, [])

  const [cart, setCart] = useState<Product[]>([])
  const [selectedParticular, setSelectedParticular] = useState<string>("")
  const [currentQuantity, setCurrentQuantity] = useState<string>("1")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [orderValidation, setOrderValidation] = useState<{
    customer?: string
    cart?: string
  }>({})

  const [editOrderSummary, setEditOrderSummary] = useState<OrderSummaryData | null>(null)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const customersData = await getCustomers()
        const productsData = await getProducts()
        const unitsData = await getUnits()

        setUnits(unitsData)
        setCustomers(customersData)
        setIsCustomerLoad(false)
        setIsProductLoad(false)

        setParticulars(productsData)

        // If in edit mode, fetch order details
        if (isEditMode && id) {
          setIsLoadingOrder(true)
          try {
            const orderData = await getOrderById(Number.parseInt(id))

            if (orderData) {
              setSelectedCustomer(orderData.customerId.toString())
              setDate(new Date(orderData.date))
              setCart(orderData.items || [])

              setEditOrderSummary({
                discountAmount: orderData.discountValue || 0,
                discountType: isDiscountType(orderData.discountType) ? orderData.discountType : "flat",
                remarks: orderData.remarks || "",
                totalAmount: orderData.totalPrice || 0,
                totalPayable: orderData.totalPayable || 0,
                paidAmount: orderData.paidAmount || 0,
                paymentMethod: orderData.paymentMethod || "",
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

    if (selectedUser && newValidation.customer) {
      delete newValidation.customer
    }

    if (cart.length > 0 && newValidation.cart) {
      delete newValidation.cart
    }

    setOrderValidation(newValidation)
  }, [selectedUser, cart])

  const handleAddCustomer = async (data: CustomerFormData) => {
    setIsLoading(true)

    try {
      const customerData = {
        name: data.name,
        phone: data.phone,
        aadhaar: data.aadhaar || "",
        address: data.address || "",
      }

      const newCustomerId = await addCustomer(customerData)

      const addedCustomer = {
        id: newCustomerId,
        createdAt: new Date(), // or `null` if you prefer
        name: data.name,
        phone: Number(data.phone),
        aadhaar: data.aadhaar || null,
        address: data.address || "",
      }

      setCustomers([...customers, addedCustomer])
      setSelectedCustomer(newCustomerId.toString())

      customerForm.reset()
      setIsAddingCustomer(false)
    } catch (err) {
      console.error(err)
      customerForm.setError("phone", {
        type: "manual",
        message: "Phone number already exists",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const validateOrder = (): { customer?: string; cart?: string } => {
    const errors: { customer?: string; cart?: string } = {}

    if (!selectedUser) {
      errors.customer = "Please select a customer"
    }

    if (cart.length === 0) {
      errors.cart = "Please Select any Product"
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
    const orderErrors = validateOrder()

    setOrderValidation(orderErrors)

    if (Object.keys(orderErrors).length > 0 || Object.keys(summaryErrors).length > 0) {
      return
    }

    try {
      setIsSubmitting(true)

      const customer = customers.find((c) => c.id.toString() === selectedUser)
      if (!customer) throw new Error("Customer not found")

      const remaining = orderSummaryData.totalAmount - orderSummaryData.paidAmount - orderSummaryData.discountAmount
      const paidAmount = orderSummaryData.paidAmount

      const payment_status = remaining === 0 ? "paid" : paidAmount > 0 ? "partiallypaid" : "credit"

      const orderInput: OrderInput = {
        customer_id: customer.id,
        customer_name: customer.name,
        date: date || new Date(),
        vendor_id: "",
        vendor_name: "",
        items: cart.map((item) => ({
          id: item.id,
          name: item.name,
          quantity: item.quantity,
          price: item.price,
          unit: item.unit,
          aadhaar: "",
          createdAt: new Date(),
          total_price: item.total_price || 0,
        })),
        total_price: orderSummaryData.totalAmount,
        discount_type: orderSummaryData.discountType,
        remarks: orderSummaryData?.remarks || "",
        total_payable: orderSummaryData.totalPayable,
        payment_method: orderSummaryData.paymentMethod,
        discount_value: orderSummaryData.discountAmount,
        remaining_amount: remaining,
        status: remaining === 0 ? "completed" : "created",
        type: "sale",
        paid_amount: orderSummaryData.paidAmount,
        payment_status: payment_status,
      }

      if (isEditMode && id) {
        await updateOrder(Number.parseInt(id), orderInput)
        toast({
          title: "Success",
          description: "Order updated successfully",
        })
        setEditOpen(true)
      } else {
        const newOrderId = await addOrder(orderInput)
      }

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
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  const handleDialogClose = () => {
    setIsAddingCustomer(false)
    customerForm.reset()
  }

  const isDark = document.documentElement.classList.contains("dark")

  return (
    <>
      <div className="rounded-[10px] shadow-1 dark:bg-gray-dark dark:shadow-card">
        <div className="flex flex-col md:flex-row justify-evenly gap-4">
          <div className="w-full md:w-2/3 rounded-[10px] bg-white dark:bg-gray-dark  dark:!text-white shadow-lg p-4">
            <h2 className="text-2xl font-bold text-center  dark:!text-white mb-4">
              {isEditMode ? "Edit Order" : "Create Order"}
            </h2>
            <div className="space-y-4">
            
              <div className="grid grid-cols-4 gap-4 items-center">
                <h3 className="text-right text-lg font-semibold  dark:!text-white">
                  Date:
                </h3>
                <div className="col-span-3 w-3/4 dark:!text-white">
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full h-10 flex justify-between items-center text-left font-normal px-3", // Added px-3 for consistent padding, adjust as needed
                          !date && "text-muted-foreground"
                        )}
                      >
                        {/* Modified content within the button for better responsiveness */}
                        <span className="flex-grow min-w-0 truncate"> {/* Added flex-grow, min-w-0, and truncate */}
                          {date ? format(date, "dd-MM-yyyy hh:mm a") : "Select date & time"}
                        </span>
                        <CalendarIcon className="h-4 w-4 flex-shrink-0" /> {/* Added flex-shrink-0 */}
                      </Button>
                    </PopoverTrigger>

                    <PopoverContent
                      className="w-full sm:w-auto p-0 !z-[100] relative bg-white"
                      align="start"
                    >
                      <Calendar
                        mode="single"
                        selected={date || undefined}
                        onSelect={(day) => {
                          if (day) {
                            const currentTime = date || new Date();
                            day.setHours(currentTime.getHours());
                            day.setMinutes(currentTime.getMinutes());
                            day.setSeconds(currentTime.getSeconds());
                            setDate(day);
                          }
                        }}
                        initialFocus
                        classNames={{
                              day_selected: "bg-primary text-white hover:bg-blue-700 hover:text-white focus:bg-blue-700 focus:text-white",
                         }}
                      />

                      <div className="p-3 border-t border-border">
                        <div className="flex flex-wrap items-center justify-between gap-3">
                          {/* These inputs generally have fixed widths for time, which is usually acceptable */}
                          <div className="flex items-center space-x-2 w-full sm:w-auto">
                            <Input
                              type="number"
                              min={1}
                              max={12}
                              className="w-16 h-8 text-center" // Added text-center for better alignment
                              value={date ? (date.getHours() % 12 || 12) : 12}
                              onChange={(e) => {
                                const newDate = new Date(date || new Date());
                                const currentHours = newDate.getHours();
                                const isPM = currentHours >= 12;
                                const newHour = Number(e.target.value) % 12 || 12;
                                newDate.setHours(isPM ? newHour + 12 : newHour);
                                setDate(newDate);
                              }}
                            />
                            <span>:</span>
                            <Input
                              type="number"
                              min={0}
                              max={59}
                              className="w-16 h-8 text-center" // Added text-center
                              value={date ? date.getMinutes() : 0}
                              onChange={(e) => {
                                const newDate = new Date(date || new Date());
                                newDate.setMinutes(Number.parseInt(e.target.value) || 0);
                                setDate(newDate);
                              }}
                            />
                            <select
                              value={date ? (date.getHours() >= 12 ? "PM" : "AM") : "AM"}
                              onChange={(e) => {
                                const newDate = new Date(date || new Date());
                                const hours = newDate.getHours();
                                const isPM = hours >= 12;
                                if (e.target.value === "AM" && isPM) {
                                  newDate.setHours(hours - 12);
                                } else if (e.target.value === "PM" && !isPM) {
                                  newDate.setHours(hours + 12);
                                }
                                setDate(newDate);
                              }}
                              className="h-8 px-2 border rounded-md text-sm flex-shrink-0" // Added flex-shrink-0
                            >
                              <option value="AM">AM</option>
                              <option value="PM">PM</option>
                            </select>
                          </div>
                        </div>
                      </div>
                    </PopoverContent>
                  </Popover>
                </div>
              </div>

              <div className="grid grid-cols-4 gap-4 items-center">
                <h3 className="text-right text-lg font-semibold  dark:!text-white">Customer:</h3>
                <div className="col-span-2 relative">
                  <div className="h-[60px]">
                    <Select value={selectedUser} onValueChange={setSelectedCustomer} disabled={isEditMode}>
                      <SelectTrigger
                        id="customer"
                        aria-label="Select customer"
                        className={cn("h-10", "text-md", "mt-5", orderValidation.customer ? "border-red-500" : "")}
                      >
                        <SelectValue className="font-md" placeholder="Select customer" />
                      </SelectTrigger>
                      <SelectContent className="z-[999] w-full bg-white dark:bg-gray-dark dark:!text-white shadow-md border rounded-md">
                        {isCustomerLoad ? (
                          <div className="flex justify-center items-center h-20">
                            <Loader2 className="h-5 w-5 animate-spin text-primary" />
                          </div>
                        ) : customers.length > 0 ? (
                          customers.map((customer) => (
                            <SelectItem className="text-md" key={customer.id} value={customer.id.toString()}>
                              {customer.name}
                            </SelectItem>
                          ))
                        ) : (
                          <div className="text-center text-sm py-2 text-gray-500">No customers available</div>
                        )}
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
                    <DialogContent className="bg-white dark:!text-white dark:bg-gray-dark max-w-2xl">
                      <DialogHeader>
                        <DialogTitle className="text-center  dark:!text-white dark:bg-gray-dark font-bold">
                          Add New Customer
                        </DialogTitle>
                      </DialogHeader>

                      <Form {...customerForm}>
                        <form onSubmit={customerForm.handleSubmit(handleAddCustomer)} className="space-y-6">
                          <div className="grid gap-4 py-4">
                            {/* NAME */}
                            <FormField
                              control={customerForm.control}
                              name="name"
                              render={({ field }) => (
                                <FormItem className="grid grid-cols-4 items-center gap-4">
                                  <FormLabel className="text-right  dark:!text-white dark:bg-gray-dark">
                                    Name <span className="text-red-500">*</span>
                                  </FormLabel>
                                  <div className="col-span-3">
                                    <FormControl>
                                      <Input
                                        {...field}
                                        maxLength={30}
                                        placeholder="Enter customer name"
                                        onChange={(e) => {
                                          const value = e.target.value
                                          const capitalized = value.charAt(0).toUpperCase() + value.slice(1)
                                          field.onChange(capitalized)
                                        }}
                                      />
                                    </FormControl>
                                    <FormMessage />
                                  </div>
                                </FormItem>
                              )}
                            />

                            {/* PHONE */}
                            <FormField
                              control={customerForm.control}
                              name="phone"
                              render={({ field }) => (
                                <FormItem className="grid grid-cols-4 items-center gap-4">
                                  <FormLabel className="text-right  dark:!text-white dark:bg-gray-dark">
                                    Phone <span className="text-red-500">*</span>
                                  </FormLabel>
                                  <div className="col-span-3">
                                    <FormControl>
                                      <Input
                                        {...field}
                                        type="tel"
                                        inputMode="numeric"
                                        maxLength={10}
                                        placeholder="Enter 10-digit phone number"
                                        onChange={(e) => {
                                          const value = e.target.value.replace(/\D/g, "")
                                          field.onChange(value)
                                        }}
                                      />
                                    </FormControl>
                                    <FormMessage />
                                  </div>
                                </FormItem>
                              )}
                            />

                            {/* AADHAAR */}
                            <FormField
                              control={customerForm.control}
                              name="aadhaar"
                              render={({ field }) => (
                                <FormItem className="grid grid-cols-4 items-center gap-4">
                                  <FormLabel className="text-right  dark:!text-white dark:bg-gray-dark">
                                    Aadhaar
                                  </FormLabel>
                                  <div className="col-span-3">
                                    <FormControl>
                                      <Input
                                        {...field}
                                        inputMode="numeric"
                                        maxLength={14}
                                        placeholder="Enter Aadhaar number"
                                        onChange={(e) => {
                                          const value = e.target.value.replace(/[^\d\s]/g, "")
                                          field.onChange(value)
                                        }}
                                      />
                                    </FormControl>
                                    <FormMessage />
                                  </div>
                                </FormItem>
                              )}
                            />

                            {/* ADDRESS */}
                            <FormField
                              control={customerForm.control}
                              name="address"
                              render={({ field }) => (
                                <FormItem className="grid grid-cols-4 items-center gap-4">
                                  <FormLabel className="text-right  dark:!text-white dark:bg-gray-dark">
                                    Address
                                  </FormLabel>
                                  <div className="col-span-3">
                                    <FormControl>
                                      <Textarea {...field} rows={3} placeholder="Enter customer address" />
                                    </FormControl>
                                  </div>
                                </FormItem>
                              )}
                            />
                          </div>

                          <DialogFooter className="flex flex-col sm:flex-row-reverse sm:justify-center gap-2">
                            <Button type="button" variant="outline" onClick={handleDialogClose} disabled={isLoading}>
                              Cancel
                            </Button>
                            <Button type="submit" className="text-white" disabled={isLoading}>
                              {isLoading ? (
                                <>
                                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                  Save
                                </>
                              ) : (
                                "Save"
                              )}
                            </Button>
                          </DialogFooter>
                        </form>
                      </Form>
                    </DialogContent>
                  </Dialog>
                </div>
              </div>

              <div className="grid grid-cols-4 gap-4 items-center">
                <h3 className="text-right text-lg font-semibold dark:bg-gray-dark dark:!text-white pb-4">
                  Product:
                </h3>
                <div className="col-span-3 w-3/4 mt-2">
                  <div className="h-[60px]">
                    <Select
                      value={selectedParticular}
                      onValueChange={(value) => {
                        const selected = particulars.find((p) => p.id === (value ? Number(value) : null))
                        const unitNames = units.map((u) => u.name)
                        const productUnit = selected?.unit && unitNames.includes(selected.unit) ? selected.unit : "pc"

                        if (selected) {
                          const exists = cart.find((item) => item.id === selected.id)

                          if (!exists) {
                            setCart((prev) => [
                              ...prev,
                              {
                                id: selected.id,
                                name: selected.name,
                                price: selected.price,
                                quantity: 1,
                                unit: productUnit,
                                aadhaar: "",
                                address: "",
                                createdAt: new Date(),
                                total_price: selected.price,
                              },
                            ])
                          }
                        }
                      }}
                    >
                      <SelectTrigger
                        id="particulars"
                        aria-label="Select product"
                        className={cn("h-10", "text-md", orderValidation.cart ? "border-red-500" : "")}
                      >
                        <SelectValue className="font-md" placeholder="Select product" />
                      </SelectTrigger>
                      <SelectContent 
                      side="bottom"
                      className="z-[999] w-full bg-white dark:bg-gray-dark dark:!text-white shadow-md border rounded-md">
                        {isProductLoad ? (
                          <div className="flex justify-center items-center h-20">
                            <Loader2 className="h-5 w-5 animate-spin text-primary" />
                          </div>
                        ) : particulars.length > 0 ? (
                          particulars.map((particular) => (
                            <SelectItem className="text-md" key={particular.id} value={`${particular.id}`}>
                              {particular.name}
                            </SelectItem>
                          ))
                        ) : (
                          <SelectItem value="no-particulars" disabled>
                            No Products available
                          </SelectItem>
                        )}
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
                  <TableHeader className="sticky top-0 bg-white dark:bg-gray-dark dark:!text-white  z-10">
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
                        key={item.id}
                        className="text-center dark:!text-white dark:bg-gray-dark font-medium"
                      >
                        <TableCell className="!text-left  dark:!text-white">{item.name}</TableCell>

                        <TableCell>
                          <input
                            type="number"
                            min={1}
                            value={item.quantity}
                            onChange={(e) => {
                              const value = Number.parseInt(e.target.value) || 1
                              setCart((prev) =>
                                prev.map((i) => (i.id === item.id ? { ...i, quantity: Math.max(1, value) } : i)),
                              )
                            }}
                            className="h-8 w-16  dark:!text-white text-center border rounded"
                          />
                        </TableCell>

                        <TableCell className=" dark:!text-white">
                          {item.unit.charAt(0).toUpperCase() + item.unit.slice(1)}
                        </TableCell>

                        <TableCell className=" dark:!text-white">₹{item.price}</TableCell>
                        <TableCell className=" dark:!text-white">
                          ₹
                          {(item.price * item.quantity) % 1 === 0
                            ? item.price * item.quantity
                            : (item.price * item.quantity).toFixed(2)}
                        </TableCell>

                        <TableCell>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setCart((prev) => prev.filter((i) => i.id !== item.id))}
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
              selectedUser={selectedUser}
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
          <DialogContent className="bg-white dark:!text-white dark:bg-gray-dark">
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

      {openEdit && isEditMode && (
        <Dialog open={openEdit} onOpenChange={setEditOpen}>
          <DialogContent className="bg-white dark:!text-white dark:bg-gray-dark">
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
