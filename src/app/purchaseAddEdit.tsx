"use client"

import { useState, useEffect } from "react"
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
import { addVendor, getVendors, getProducts, addOrder, getUnits, updateOrder, getOrderById } from "@/app/actions"
import { Loader2 } from "lucide-react"
import { Checkbox } from "@/components/ui/checkbox"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { createTheme, ThemeProvider } from "@mui/material/styles"
import { useTheme } from "@mui/material/styles"
import type { Product } from "app-types/product"
import type { Vendor } from "app-types/vendor"
import type { Unit } from "app-types/unit"
import type { OrderInput } from "app-types/order-input"
import type { OrderSummary as OrderSummaryData } from "app-types/order-summary"
import { isDiscountType } from "app-types/discount-type"

interface Props {
  id: string
}

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
          color: "#fff",
        },
        adornedEnd: {
          "& svg": {
            color: "#fff",
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

const vendorFormSchema = z.object({
  name: z
    .string()
    .min(2, "Name must be at least 2 characters")
    .regex(/^[A-Za-z\s]+$/, "Name should contain only letters and spaces"),
  phone: z
    .number({
      required_error: "Phone is required",
      invalid_type_error: "Phone must be a number",
    })
    .int("Phone must be a whole number")
    .positive("Phone must be a positive number")
    .min(1000000000, "Phone must be a 10-digit number")
    .max(9999999999, "Phone must be a 10-digit number"),
  aadhaar: z
    .string()
    .optional()
    .refine((val) => {
      if (!val || val.trim() === "") return true
      const digits = val.replace(/\s+/g, "")
      return /^\d{12}$/.test(digits)
    }, "Aadhaar must be a 12-digit number"),
  address: z.string().optional(),
  products: z
    .array(
      z.object({
        product_id: z.number(),
        product_name: z.string(),
      }),
    )
    .min(1, "Please select at least one product"),
})

type VendorFormData = z.infer<typeof vendorFormSchema>

export default function Home({ id }: Props) {
  const searchParams = useSearchParams()
  const orderId = searchParams.get("id")
  const isEditMode = !!id

  // State
  const [date, setDate] = useState<Date | null>(null)
  const [open, setOpen] = useState(!isEditMode)
  const [openEdit, setEditOpen] = useState(false)
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [units, setUnits] = useState<Unit[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [selectedUser, setSelectedVendor] = useState<string>("")
  const [isAddingVendor, setIsAddingVendor] = useState(false)
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([])

  // New state to track original cart items in edit mode
  const [originalCartItems, setOriginalCartItems] = useState<Product[]>([])

  const vendorForm = useForm<VendorFormData>({
    resolver: zodResolver(vendorFormSchema),
    defaultValues: {
      name: "",
      phone: undefined,
      aadhaar: "",
      address: "",
      products: [],
    },
    mode: "onChange",
  })

  const [isLoading, setIsLoading] = useState(false)
  const [isLoadingOrder, setIsLoadingOrder] = useState(isEditMode)
  const { toast } = useToast()

  const [isOpen, setIsOpen] = useState(false)

  const openDialog = () => setIsOpen(true)
  const closeDialog = () => setIsOpen(false)

  const theme = useTheme()

  const [cart, setCart] = useState<Product[]>([])
  const [selectedParticular, setSelectedParticular] = useState<string>("")
  const [currentQuantity, setCurrentQuantity] = useState<string>("1")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [orderValidation, setOrderValidation] = useState<{
    vendor?: string
    cart?: string
  }>({})

  const [productDetails, setProductDetails] = useState<{ [key: number]: { quantity: number; price: number } }>({})

  const [editOrderSummary, setEditOrderSummary] = useState<OrderSummaryData | null>(null)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const vendorsData = await getVendors()
        const productsData = await getProducts()
        const unitsData = await getUnits()

        setUnits(unitsData)
        setVendors(vendorsData)
        setProducts(productsData)

        // If in edit mode, fetch order details
        if (isEditMode && id) {
          setIsLoadingOrder(true)
          try {
            const orderData = await getOrderById(Number.parseInt(id))

            if (orderData) {
              setSelectedVendor(orderData.vendorId?.toString() || "")
              setDate(new Date(orderData.date))
              setCart(orderData.items || [])

              // Store original cart items for edit mode restrictions
              setOriginalCartItems(orderData.items || [])

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

    if (selectedUser && newValidation.vendor) {
      delete newValidation.vendor
    }

    if (cart.length > 0 && newValidation.cart) {
      delete newValidation.cart
    }

    setOrderValidation(newValidation)
  }, [selectedUser, cart])

  // Filter products based on selected vendor
  useEffect(() => {
    if (selectedUser && vendors.length > 0) {
      const selectedVendor = vendors.find((v) => v.id.toString() === selectedUser)

      if (selectedVendor && selectedVendor.products && selectedVendor.products.length > 0) {
        const vendorProductIds = selectedVendor.products.map((p) => p.id)
        const filtered = products.filter((product) => vendorProductIds.includes(product.id))
        setFilteredProducts(filtered)
      } else {
        setFilteredProducts([])
      }
    } else {
      // If no vendor selected, show all products
      setFilteredProducts(products)
    }
  }, [selectedUser, vendors, products])

  const handleProductSelection = (productId: number, checked: boolean) => {
    const currentProducts = vendorForm.getValues("products")

    if (checked) {
      const product = products.find((p) => p.id === productId)
      if (product) {
        const newProducts = [
          ...currentProducts,
          {
            product_id: productId,
            product_name: product.name,
          },
        ]
        vendorForm.setValue("products", newProducts)
        vendorForm.trigger("products")
      }
    } else {
      const newProducts = currentProducts.filter((p) => p.product_id !== productId)
      vendorForm.setValue("products", newProducts)
      vendorForm.trigger("products")
    }
  }

  useEffect(() => {
    setDate(new Date())
  }, [])

  const handleAddVendor = async (data: VendorFormData) => {
    setIsLoading(true)

    try {
      if (typeof data.phone !== "number" || isNaN(data.phone)) {
        vendorForm.setError("phone", {
          type: "manual",
          message: "Phone must be a valid 10-digit number",
        })
        setIsLoading(false)
        return
      }

      const vendorData = {
        name: data.name,
        phone: data.phone,
        aadhaar: data.aadhaar || "",
        address: data.address || "",
        products: data.products,
      }

      const newVendorId = await addVendor(vendorData)

      const addedVendor: Vendor = {
        id: newVendorId,
        createdAt: new Date(), // or `null` if you prefer
        name: data.name,
        phone: data.phone,
        aadhaar: data.aadhaar ? Number(data.aadhaar) : null,
        address: data.address || "",
        products: data.products.map((p) => ({
          id: p.product_id,
          name: p.product_name,
          createdAt: new Date(),
          quantity: 0, // Assuming quantity is not needed here
          unit: "", // Assuming unit is not needed here
          total_price: 0, // Assuming total_price is not needed here
          price: 0, // Assuming price is not needed here
        })),
      };

      setVendors([...vendors, addedVendor]);
      setSelectedVendor(newVendorId.toString())

      vendorForm.reset()
      setIsAddingVendor(false)

      toast({
        title: "Success",
        description: "Vendor added successfully",
      })
    } catch (err) {
      console.error(err)
      vendorForm.setError("phone", {
        type: "manual",
        message: "Phone number already exists",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const validateOrder = (): { vendor?: string; cart?: string } => {
    const errors: { vendor?: string; cart?: string } = {}

    if (!selectedUser) {
      errors.vendor = "Please select a vendor"
    }

    if (cart.length === 0) {
      errors.cart = "Please add at least one product to the cart"
    }

    return errors
  }

  const handlePlaceOrder = async (
    orderSummaryData: OrderSummaryData,
    summaryErrors: { paymentMethod?: string; paidAmount?: string },
  ) => {
    const orderErrors = validateOrder()
    setOrderValidation(orderErrors)

    if (Object.keys(orderErrors).length > 0 || Object.keys(summaryErrors).length > 0) {
      return
    }

    try {
      setIsSubmitting(true)

      const vendor = vendors.find((c) => c.id.toString() === selectedUser)
      if (!vendor) throw new Error("Vendor not found")

      const remaining = orderSummaryData.totalAmount - orderSummaryData.paidAmount - orderSummaryData.discountAmount
      const paidAmount = orderSummaryData.paidAmount

      const payment_status = remaining === 0 ? "paid" : paidAmount > 0 ? "partiallypaid" : "credit"

      const orderInput: OrderInput = {
        customer_id: -1,
        customer_name: "",
        vendor_id: vendor.id.toString(),
        vendor_name: vendor.name,
        date: date || new Date(),
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
        status: "created",
        type: "purchase",
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

      // Clear state after successful order (only for create mode)
      if (!isEditMode) {
        setCart([])
        setSelectedParticular("")
        setSelectedVendor("")
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

  const isDark = theme.palette.mode == "dark"

  return (
    <>
      <div className="rounded-[10px] shadow-1 dark:bg-gray-dark dark:shadow-card">
        <div className="flex flex-col md:flex-row justify-evenly gap-4">
          <div className="w-full md:w-2/3 rounded-[10px] bg-white dark:bg-gray-dark shadow-lg p-4">
            <h2 className="text-2xl font-bold text-center text-black dark:!text-white mb-4">
              {isEditMode ? "Edit Purchase" : "Purchase"}
            </h2>
            <div className="space-y-4">
              <div className="grid grid-cols-4 gap-4 items-center">
                <h3 className="text-right text-lg font-semibold text-dark-2 dark:!text-white">Date:</h3>
                <div className="col-span-3 w-3/4">
                  {/* <ThemeProvider theme={isDark ? darkTheme : lightTheme}>
                    <LocalizationProvider dateAdapter={AdapterDateFns}>
                      <DateTimePicker
                        label="Select date & time"
                        value={date}
                        onChange={(v) => setDate(v)}
                        views={["year", "month", "day", "hours", "minutes", "seconds"]}
                        slotProps={{
                          popper: {
                            sx: {
                              "& .MuiPaper-root": {
                                minWidth: 400,
                                bgcolor: isDark ? "#1e1e1e" : "#fff",
                              },
                              "& .MuiTypography-root, \
                                   & .MuiPickersDay-root, \
                                   & .MuiDayCalendar-weekDayLabel, \
                                   & .MuiPickersCalendarHeader-label": {
                                color: isDark ? "#fff" : "#000 !important",
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
                  </ThemeProvider> */}
                  <ThemeProvider theme={isDark ? darkTheme : lightTheme}>
                    <LocalizationProvider dateAdapter={AdapterDateFns}>
                      <DateTimePicker
                        label="Select date & time"
                        value={date}
                        onChange={(v) => setDate(v)}
                        views={["year", "month", "day", "hours", "minutes"]}
                        slotProps={{
                          /* ---------- pop‑up panel ---------- */
                          popper: {
                            sx: {
                              "& .MuiPaper-root": {
                                minWidth: 400, // widen calendar
                                bgcolor: isDark ? "#1e1e1e" : "#fff",
                              },

                              "& .MuiTypography-root, \
                                   & .MuiPickersDay-root, \
                                   & .MuiDayCalendar-weekDayLabel, \
                                   & .MuiPickersCalendarHeader-label": {
                                color: isDark ? "#fff" : "#000 !important",
                              },
                            },
                          },

                          /* ---------- text field ---------- */
                          textField: {
                            fullWidth: true,
                            variant: "outlined",
                            size: "small",
                            sx: {
                              /* Input text */
                              "& .MuiInputBase-input, & .MuiOutlinedInput-input": {
                                color: isDark ? "#fff" : "#000", // Correct now
                              },

                              /* Calendar icon */
                              "& .MuiSvgIcon-root": {
                                color: isDark ? "#fff" : "#000", // Also correct
                              },

                              /* Floating label */
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
                <h3 className="text-right text-lg font-semibold text-dark-2 dark:!text-white">Vendor:</h3>
                <div className="col-span-2 relative">
                  <div className="h-[60px]">
                    <Select
                      value={selectedUser}
                      onValueChange={setSelectedVendor}
                      disabled={isEditMode} // Disable vendor selection in edit mode
                    >
                      <SelectTrigger
                        id="vendor"
                        aria-label="Select vendor"
                        className={cn(
                          "h-10",
                          "mt-5",
                          "text-md",
                          isEditMode ? "opacity-60 cursor-not-allowed" : "",
                          orderValidation.vendor ? "border-red-500" : "",
                        )}
                      >
                        <SelectValue className="dark:!text-white dark:!bg-gray-dark text-md" placeholder="Select vendor" />
                      </SelectTrigger>
                      <SelectContent className="z-[999] w-full bg-white text-md dark:!bg-gray-dark dark:!text-white shadow-md border rounded-md">
                        {vendors.map((vendor) => (
                          <SelectItem className="text-md" key={vendor.id} value={vendor.id.toString()}>
                            {vendor.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {orderValidation.vendor && <p className="text-md text-red-500 mt-1">{orderValidation.vendor}</p>}
                  </div>
                </div>
                <div>
                  {!isEditMode && (
                    <Dialog open={isAddingVendor} onOpenChange={setIsAddingVendor}>
                      <DialogTrigger asChild>
                        <Button className="text-white" size="icon" aria-label="Add new vendor">
                          <Plus className="h-4 w-4" />
                          <span className="sr-only">Add new vendor</span>
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="bg-white dark:!text-white dark:!bg-gray-dark max-w-2xl max-h-[90vh] overflow-y-auto">
                        <DialogHeader>
                          <DialogTitle className="text-center text-black dark:!bg-gray-dark dark:!text-white">Add New Vendor</DialogTitle>
                        </DialogHeader>

                        <Form {...vendorForm}>
                          <form onSubmit={vendorForm.handleSubmit(handleAddVendor)} className="space-y-6">
                            <div className="grid gap-4 py-4">
                              <FormField
                                control={vendorForm.control}
                                name="name"
                                render={({ field }) => (
                                  <FormItem className="grid grid-cols-4 items-center gap-4">
                                    <FormLabel className="text-right text-black dark:!text-white">
                                      Name <span className="text-red-500">*</span>
                                    </FormLabel>
                                    <div className="col-span-3">
                                      <FormControl>
                                        <Input {...field} maxLength={20} placeholder="Enter vendor name" />
                                      </FormControl>
                                      <FormMessage />
                                    </div>
                                  </FormItem>
                                )}
                              />

                              <FormField
                                control={vendorForm.control}
                                name="phone"
                                render={({ field }) => (
                                  <FormItem className="grid grid-cols-4 items-center gap-4">
                                    <FormLabel className="text-right text-black dark:!text-white">
                                      Phone <span className="text-red-500">*</span>
                                    </FormLabel>
                                    <div className="col-span-3">
                                      <FormControl>
                                        <Input
                                          type="tel"
                                          inputMode="numeric"
                                          maxLength={10}
                                          placeholder="Enter 10-digit phone number"
                                          value={field.value || ""}
                                          onChange={(e) => {
                                            const value = e.target.value.replace(/\D/g, "")
                                            if (value) {
                                              field.onChange(Number(value))
                                            } else {
                                              field.onChange(undefined)
                                            }
                                          }}
                                          onBlur={() => {
                                            vendorForm.trigger("phone")
                                          }}
                                          className={vendorForm.formState.errors.phone ? "border-red-500" : ""}
                                        />
                                      </FormControl>
                                      <FormMessage />
                                    </div>
                                  </FormItem>
                                )}
                              />

                              <FormField
                                control={vendorForm.control}
                                name="aadhaar"
                                render={({ field }) => (
                                  <FormItem className="grid grid-cols-4 items-center gap-4">
                                    <FormLabel className="text-right text-black dark:!text-white ">Aadhaar</FormLabel>
                                    <div className="col-span-3">
                                      <FormControl>
                                        <Input
                                          {...field}
                                          inputMode="numeric"
                                          maxLength={14}
                                          placeholder="Enter a Aadhaar number"
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

                              <FormField
                                control={vendorForm.control}
                                name="address"
                                render={({ field }) => (
                                  <FormItem className="grid grid-cols-4 items-center gap-4">
                                    <FormLabel className="text-right text-black dark:!text-white">Address</FormLabel>
                                    <div className="col-span-3">
                                      <FormControl>
                                        <Textarea {...field} rows={3} placeholder="Enter vendor address" />
                                      </FormControl>
                                    </div>
                                  </FormItem>
                                )}
                              />

                              <FormField
                                control={vendorForm.control}
                                name="products"
                                render={({ field }) => (
                                  <FormItem className="grid grid-cols-4 items-start gap-4">
                                    <FormLabel className="text-right text-black dark:!text-white mt-2">
                                      Products <span className="text-red-500">*</span>
                                    </FormLabel>
                                    <div className="col-span-3 space-y-3">
                                      <div className="max-h-60 overflow-y-auto border rounded-md p-3 space-y-3">
                                        {products.map((product) => (
                                          <div key={product.id} className="space-y-2">
                                            <div className="flex items-center space-x-2">
                                              <Checkbox
                                                id={`product-${product.id}`}
                                                checked={field.value.some(
                                                  (p) => p.product_id === product.id,
                                                )}
                                                onCheckedChange={(checked) =>
                                                  handleProductSelection(product.id, checked as boolean)
                                                }
                                              />
                                              <Label
                                                htmlFor={`product-${product.id}`}
                                                className="text-dark dark:!text-white font-medium"
                                              >
                                                {product.name} ({product.unit})
                                              </Label>
                                            </div>
                                          </div>
                                        ))}
                                      </div>
                                      <FormMessage />
                                    </div>
                                  </FormItem>
                                )}
                              />
                            </div>

                            <DialogFooter className="flex flex-col sm:flex-row-reverse sm:justify-center gap-2">
                              <Button
                                type="button"
                                variant="outline"
                                onClick={() => {
                                  vendorForm.reset()
                                  setIsAddingVendor(false)
                                }}
                              >
                                Cancel
                              </Button>
                              <Button
                                type="submit"
                                className="text-white"
                                disabled={isLoading || vendorForm.formState.isSubmitting}
                              >
                                {isLoading || vendorForm.formState.isSubmitting ? (
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
                  )}
                </div>
              </div>

              {/* Product selection - only show in create mode */}

              <div className="grid grid-cols-4 gap-4 items-center">
                <h3 className="text-right text-lg font-semibold text-dark-2 dark:!text-white pb-4">Product:</h3>
                <div className="col-span-3 w-3/4 mt-2">
                  <div className="h-[60px]">
                    <Select
                      value={selectedParticular}
                      onValueChange={(value) => {
                        const selected = filteredProducts.find((p) => p.id === (value ? Number(value) : null))
                        const unitNames = units.map((u) => u.name)
                        const productUnit = selected?.unit && unitNames.includes(selected.unit) ? selected.unit : "pc"

                        if (selected) {
                          const exists = cart.find((item) => item.id === selected.id)

                          if (!exists) {
                            const vendor = vendors.find((v) => v.id.toString() === selectedUser)
                            const aadhaar = vendor?.aadhaar || ""
                            const address = vendor?.address || ""

                            setCart((prev) => [
                              ...prev,
                              {
                                id: selected.id,
                                name: selected.name,
                                price: selected.price,
                                quantity: 1,
                                unit: productUnit,
                                aadhaar: aadhaar || "",
                                address: address || "",
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
                          "text-text-dark-400",
                          "text-md",
                          // "hover:border-black",
                          orderValidation.cart ? "border-red-500" : "",
                        )}
                      >
                        <SelectValue className="text-text-dark-400" placeholder="Select product" />
                      </SelectTrigger>

                      <SelectContent className="z-[999] text-text-dark-400 w-full dark:!text-white bg-white dark:!bg-gray-dark shadow-md border rounded-md">
                        {filteredProducts.map((product) => (
                          <SelectItem className="text-md" key={product.id} value={product.id.toString()}>
                            {product.name}
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
                  <TableHeader className="sticky top-0 bg-white dark:bg-gray-dark z-10">
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
                        className="group text-center text-black dark:!text-white font-medium"
                      >
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
          <DialogContent className="bg-white dark:!text-white dark:!bg-gray-dark">
            <DialogHeader>
              <DialogTitle>Success</DialogTitle>
            </DialogHeader>
            <div>Products Purchased successfully!</div>
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
          <DialogContent className="bg-white dark:!bg-gray-dark">
            <DialogHeader>
              <DialogTitle>Success</DialogTitle>
            </DialogHeader>
            <div>Purchase Updated successfully!</div>
            <DialogFooter>
              <Button
                className="w-full md:w-auto text-white  dark:!text-white mb-5 mr-2"
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


