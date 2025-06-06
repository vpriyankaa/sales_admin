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
import { DateTimePicker } from "@mui/x-date-pickers/DateTimePicker"
import { LocalizationProvider } from "@mui/x-date-pickers"
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns"
import { OrderSummary } from "@/components/order-summary"
import type { TextFieldProps } from "@mui/material/TextField"
import { addCustomer, getCustomers, getProducts, addOrder, getUnits, updateOrder, getOrderById } from "@/app/actions"
import { Loader2 } from "lucide-react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { createTheme, ThemeProvider } from "@mui/material/styles"
import { useTheme } from "@mui/material/styles"
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

  const theme = useTheme()

  // State
  // const [date, setDate] = useState<Date | null>(null);
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

  const darkTheme = createTheme({
    palette: {
      mode: "dark",
      background: {
        default: "#121212",
        paper: "#1e1e1e",
      },
      text: {
        primary: "#ffffff",
        secondary: "#bbbbbb",
      },
    },
    components: {
      MuiOutlinedInput: {
        styleOverrides: {
          root: {
            color: "#fff !important",
            "& .MuiOutlinedInput-notchedOutline": {
              borderColor: "#666",
            },
            "&:hover .MuiOutlinedInput-notchedOutline": {
              borderColor: "#aaa",
            },
            "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
              borderColor: "#fff",
            },
          },
          input: {
            color: "#fff",
          },
          adornedEnd: {
            "& svg": {
              color: "#fff !important",
            },
          },
        },
      },
      MuiInputLabel: {
        styleOverrides: {
          root: {
            color: "#bbb",
            "&.Mui-focused": {
              color: "#fff !important",
            },
          },
        },
      },
      MuiSvgIcon: {
        styleOverrides: {
          root: {
            color: "#fff !important",
          },
        },
      },
    },
  })

  const lightTheme = createTheme({
    palette: {
      mode: "light",
      background: {
        default: "#121212",
        paper: "#1e1e1e",
      },
      text: {
        primary: "#00000",
        secondary: "#bbbbbb",
      },
    },
    components: {
      MuiOutlinedInput: {
        styleOverrides: {
          root: {
            color: "#fff",
            "& .MuiOutlinedInput-notchedOutline": {
              borderColor: "#666",
            },
            "&:hover .MuiOutlinedInput-notchedOutline": {
              borderColor: "#aaa",
            },
            "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
              borderColor: "#fff",
            },
          },
          input: {
            color: "#00000",
          },
          adornedEnd: {
            "& svg": {
              color: "#00000",
            },
          },
        },
      },
      MuiInputLabel: {
        styleOverrides: {
          root: {
            color: "#bbb",
            "&.Mui-focused": {
              color: "#fff",
            },
          },
        },
      },
      MuiSvgIcon: {
        styleOverrides: {
          root: {
            color: "#fff",
          },
        },
      },
    },
  })

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
        setIsCustomerLoad(false);
        setIsProductLoad(false);
       
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
                discountType: isDiscountType(orderData.discountType) ? orderData.discountType : 'flat',
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
        address: data.address || ""
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
      errors.cart = "Please Select anny Product"
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

  // const isDark = theme.palette.mode == "dark"

  // console.log("isDark", isDark)

  return (
    <>
      <div className="rounded-[10px] shadow-1 dark:bg-gray-dark dark:shadow-card">
        <div className="flex flex-col md:flex-row justify-evenly gap-4">
          <div className="w-full md:w-2/3 rounded-[10px] bg-white dark:bg-gray-dark  dark:!text-white shadow-lg p-4">
            <h2 className="text-2xl font-bold text-center text-black dark:!text-white mb-4">
              {isEditMode ? "Edit Order" : "Create Order"}
            </h2>
            <div className="space-y-4">
              <div className="grid grid-cols-4 gap-4 items-center">
                <h3 className="text-right text-lg font-semibold text-dark-2 dark:!text-white">Date:</h3>
                <div className="col-span-3 w-3/4 dark:!text-white">
                  <ThemeProvider theme={isDark ? darkTheme : lightTheme}>
                    <LocalizationProvider dateAdapter={AdapterDateFns}>
                      <DateTimePicker
                        label="Select date & time"
                        value={date}
                        onChange={(v) => setDate(v)}
                        views={["year", "month", "day", "hours", "minutes",]}
                        slotProps={{
                          popper: {
                            sx: {
                              "& .MuiPaper-root": {
                                minWidth: 400,
                                bgcolor: isDark ? "#1e1e1e" : "#fff",
                              },

                              // 🌙 Dark mode text
                              "& .MuiTypography-root, \
                              & .MuiPickersDay-root, \
                              & .MuiDayCalendar-weekDayLabel, \
                              & .MuiPickersCalendarHeader-label": {
                                color: isDark ? "#fff" : "#000 !important",
                              },

                              // ✅ FORCE AM/PM column to show both values, remove scroll
                              "& .MuiMultiSectionDigitalClockSection-root:last-of-type": {
                                maxHeight: "none",
                                height: "auto !important",
                                overflow: "visible !important",
                                justifyContent: "flex-start",
                                "& .MuiMultiSectionDigitalClockSection-item": {
                                  display: "flex",
                                  justifyContent: "center",
                                  height: "40px",
                                  fontWeight: "bold",
                                },
                              },
                            },
                          },

                          textField: {
                            fullWidth: true,
                            variant: "outlined",
                            size: "small",
                            sx: {
                              "& .MuiInputBase-input, & .MuiOutlinedInput-input": {
                                color: isDark ? "#fff" : "#000",
                              },
                              "& .MuiSvgIcon-root": {
                                color: isDark ? "#fff" : "#000",
                              },
                              "& .MuiInputAdornment-root svg": {
                                color: isDark ? "#fff !important" : "#000",
                              },
                              "& .MuiInputLabel-root": {
                                color: isDark ? "#bbb" : "#555",
                              },
                              "& .Mui-focused.MuiInputLabel-root": {
                                color: isDark ? "#fff" : "#000",
                              },
                            },
                          } as TextFieldProps,
                        }}

                      />
                    </LocalizationProvider>
                  </ThemeProvider>
                </div>
              </div>

              <div className="grid grid-cols-4 gap-4 items-center">
                <h3 className="text-right text-lg font-semibold text-dark-2 dark:!text-white">Customer:</h3>
                <div className="col-span-2 relative">
                  <div className="h-[60px]">
                    <Select value={selectedUser} onValueChange={setSelectedCustomer} disabled={isEditMode}>
                      <SelectTrigger
                        id="customer"
                        aria-label="Select customer"
                        className={cn(
                          "h-10",
                          "text-md",
                          "mt-5",
                          orderValidation.customer ? "border-red-500" : "",
                        )}
                      >
                        <SelectValue className="font-semibold" placeholder="Select customer" />
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
                          <div className="text-center text-sm py-2 text-gray-500">
                            No customers available
                          </div>
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
                        <DialogTitle className="text-center text-dark dark:!text-white dark:bg-gray-dark font-bold">Add New Customer</DialogTitle>
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
                                  <FormLabel className="text-right text-black dark:!text-white dark:bg-gray-dark">
                                    Name <span className="text-red-500">*</span>
                                  </FormLabel>
                                  <div className="col-span-3">
                                    <FormControl>
                                      <Input
                                        {...field}
                                        maxLength={30}
                                        placeholder="Enter customer name"
                                        onChange={(e) => {
                                          const value = e.target.value;
                                          const capitalized =
                                            value.charAt(0).toUpperCase() + value.slice(1);
                                          field.onChange(capitalized);
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
                                  <FormLabel className="text-right text-black dark:!text-white dark:bg-gray-dark">
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
                                  <FormLabel className="text-right text-black dark:!text-white dark:bg-gray-dark">Aadhaar</FormLabel>
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
                                  <FormLabel className="text-right text-black dark:!text-white dark:bg-gray-dark">Address</FormLabel>
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
                <h3 className="text-right text-lg font-semibold text-dark-2 dark:bg-gray-dark dark:!text-white pb-4">
                  Product:
                </h3>
                <div className="col-span-3 w-3/4 mt-2">
                  <div className="h-[60px]">
                    <Select
                      value={selectedParticular}
                      onValueChange={(value) => {
                        // setSelectedParticular(value)

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
                    // disabled={isEditMode}
                    >
                      <SelectTrigger
                        id="particulars"
                        aria-label="Select product"
                        className={cn(
                          "h-10",
                          "text-md",
                          // "hover:border-black",
                          orderValidation.cart ? "border-red-500" : "",
                        )}
                      >
                        <SelectValue placeholder="Select product" />
                      </SelectTrigger>
                      <SelectContent className="z-[999] w-full bg-white dark:bg-gray-dark dark:!text-white shadow-md border rounded-md">
                        { isProductLoad ? (
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
                      <TableRow key={item.id} className="group text-center text-black dark:!text-white dark:bg-gray-dark  font-medium">
                        <TableCell className="!text-left text-black dark:!text-white">{item.name}</TableCell>

                        <TableCell>
                          <input
                            type="number"
                            min={1}
                            value={item.quantity}
                            onChange={(e) => {
                              const value = Number.parseInt(e.target.value) || 1
                              setCart((prev) =>
                                prev.map((i) =>
                                  i.id === item.id ? { ...i, quantity: Math.max(1, value) } : i,
                                ),
                              )
                            }}
                            className="h-8 w-16 text-black dark:!text-white text-center border rounded"
                          />
                        </TableCell>

                        <TableCell className="text-black dark:!text-white">
                          {item.unit.charAt(0).toUpperCase() + item.unit.slice(1)}
                        </TableCell>

                        <TableCell className="text-black dark:!text-white">₹{item.price}</TableCell>
                        <TableCell className="text-black dark:!text-white">
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
