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

// Types to match your backend
export type productItem = {
  product_id: number
  product_name: string
}

interface Vendor {
  id: string
  name: string
  phone: number
  aadhaar?: string
  address?: string
  products?: productItem[] // Add this line
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
  aadhaar?: string
  address?: string
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
  vendor_id: string
  vendor_name: string
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
  type: "sale" | "purchase"
  payment_status: string
}

interface Props {
  id: string
}

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

interface Props {
  id: string
}

export default function Home({ id }: Props) {
  // console.log("id", id);
  const searchParams = useSearchParams()
  const orderId = searchParams.get("id")
  const isEditMode = !!id

  // State
  const [date, setDate] = useState<Date | null>(null);
  const [open, setOpen] = useState(!isEditMode)
  const [openEdit, setEditOpen] = useState(false)
  const [vendors, setVendors] = useState<Vendor[]>([])
  const [units, setUnits] = useState<Units[]>([])
  const [products, setProducts] = useState<Particular[]>([])
  const [selectedUser, setSelectedVendor] = useState<string>("")
  const [isAddingVendor, setIsAddingVendor] = useState(false)
  const [filteredProducts, setFilteredProducts] = useState<Particular[]>([])

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

  const [cart, setCart] = useState<CartItem[]>([])
  const [selectedParticular, setSelectedParticular] = useState<string>("")
  const [currentQuantity, setCurrentQuantity] = useState<string>("1")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [orderValidation, setOrderValidation] = useState<{
    vendor?: string
    cart?: string
  }>({})

  const [productDetails, setProductDetails] = useState<{ [key: number]: { quantity: number; price: number } }>({})

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
        const vendorsData = await getVendors()
        const productsData = await getProducts()
        const unitsData = await getUnits()

        // console.log("isEditMode",isEditMode);
        // console.log("orderId",orderId);

        setUnits(unitsData)
        setVendors(vendorsData)
        setProducts(productsData)

        // If in edit mode, fetch order details
        if (isEditMode && id) {
          setIsLoadingOrder(true)
          try {
            const orderData = await getOrderById(Number.parseInt(id))

            // console.log("orderData",orderData);

            if (orderData) {
              setSelectedVendor(orderData.vendor_id.toString())
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
    console.log("selectedUser", selectedUser)

    if (selectedUser && vendors.length > 0) {
      const selectedVendor = vendors.find((v) => v.id.toString() === selectedUser)

      // console.log("selectedVendor", selectedVendor)

      if (selectedVendor && selectedVendor.products && selectedVendor.products.length > 0) {
        const vendorProductIds = selectedVendor.products.map((p) => p.product_id)

        // console.log("vendorProductIds", vendorProductIds)

        const filtered = products.filter((product) => vendorProductIds.includes(Number.parseInt(product.id)))

        // console.log("filtered products", filtered)

        setFilteredProducts(filtered)
      } else {
        setFilteredProducts([])
      }
    } else {
      // If no vendor selected, show all products
      setFilteredProducts(products)
    }
  }, [selectedUser, vendors, products])

  const handleProductSelection = (productId: string, checked: boolean) => {
    const currentProducts = vendorForm.getValues("products")

    if (checked) {
      const product = products.find((p) => p.id === productId)
      if (product) {
        const newProducts = [
          ...currentProducts,
          {
            product_id: Number.parseInt(productId),
            product_name: product.name,
          },
        ]
        vendorForm.setValue("products", newProducts)
        vendorForm.trigger("products") // Trigger validation
      }
    } else {
      const newProducts = currentProducts.filter((p) => p.product_id !== Number.parseInt(productId))
      vendorForm.setValue("products", newProducts)
      vendorForm.trigger("products") // Trigger validation
    }
  }


    useEffect(() => {
    setDate(new Date());
  }, []);


  const handleAddVendor = async (data: VendorFormData) => {
    setIsLoading(true)

    try {
      // Ensure phone is a valid number
      if (typeof data.phone !== "number" || isNaN(data.phone)) {
        vendorForm.setError("phone", {
          type: "manual",
          message: "Phone must be a valid 10-digit number",
        })
        setIsLoading(false)
        return
      }

      // Transform data to match your backend expectations
      const vendorData = {
        name: data.name,
        phone: data.phone,
        aadhaar: data.aadhaar || "",
        address: data.address || "",
        products: data.products, // Already in correct format: productItem[]
      }

      const newVendorId = await addVendor(vendorData)

      const addedVendor = {
        ...vendorData,
        id: newVendorId.toString(),
      }

      setVendors([...vendors, addedVendor])
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
      setIsLoading(false) // This ensures loading state is always reset
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

    // console.log("orderErrors", orderErrors)
    // console.log("summaryErrors", summaryErrors)

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
        customer_id: "",
        customer_name: "",
        vendor_id: vendor.id.toString(),
        vendor_name: vendor.name,
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

  return (
    <>
      <div className="rounded-[10px] shadow-1 dark:bg-gray-dark dark:shadow-card">
        <div className="flex flex-col md:flex-row justify-evenly gap-4">
          <div className="w-full md:w-2/3 rounded-[10px] bg-white dark:bg-gray-dark shadow-lg p-4">
            <h2 className="text-2xl font-bold text-center text-black mb-4">
              {isEditMode ? "Edit Purchase" : "Purchase"}
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
                <h3 className="text-right text-lg font-semibold text-dark-2">Vendor:</h3>
                <div className="col-span-2 relative">
                  <div className="h-[60px]">
                    <Select value={selectedUser} onValueChange={setSelectedVendor}>
                      <SelectTrigger
                        id="vendor"
                        aria-label="Select vendor"
                        className={cn(
                          "h-10",
                          "hover:border-black mt-5",
                          "font-semibold",
                          "text-black",
                          orderValidation.vendor ? "border-red-500" : "",
                        )}
                      >
                        <SelectValue className="text-black font-semibold" placeholder="Select vendor" />
                      </SelectTrigger>
                      <SelectContent className="z-[999] w-full font-bold text-black bg-white shadow-md border rounded-md">
                        {vendors.map((vendor) => (
                          <SelectItem key={vendor.id} value={vendor.id.toString()}>
                            {vendor.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {orderValidation.vendor && <p className="text-md text-red-500 mt-1">{orderValidation.vendor}</p>}
                  </div>
                </div>
                <div>
                  <Dialog open={isAddingVendor} onOpenChange={setIsAddingVendor}>
                    <DialogTrigger asChild>
                      <Button className="text-white" size="icon" aria-label="Add new vendor">
                        <Plus className="h-4 w-4" />
                        <span className="sr-only">Add new vendor</span>
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="bg-white max-w-2xl max-h-[90vh] overflow-y-auto">
                      <DialogHeader>
                        <DialogTitle className="text-center text-black">Add New Vendor</DialogTitle>
                      </DialogHeader>

                      <Form {...vendorForm}>
                        <form onSubmit={vendorForm.handleSubmit(handleAddVendor)} className="space-y-6">
                          <div className="grid gap-4 py-4">
                            {/* NAME */}
                            <FormField
                              control={vendorForm.control}
                              name="name"
                              render={({ field }) => (
                                <FormItem className="grid grid-cols-4 items-center gap-4">
                                  <FormLabel className="text-right text-black">
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

                            {/* PHONE */}
                            <FormField
                              control={vendorForm.control}
                              name="phone"
                              render={({ field }) => (
                                <FormItem className="grid grid-cols-4 items-center gap-4">
                                  <FormLabel className="text-right text-black">
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
                                          // Only set if we have a value
                                          if (value) {
                                            field.onChange(Number(value))
                                          } else {
                                            // If empty, set to undefined to trigger required validation
                                            field.onChange(undefined)
                                          }
                                        }}
                                        onBlur={() => {
                                          // Validate on blur for better UX
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

                            {/* AADHAAR */}
                            <FormField
                              control={vendorForm.control}
                              name="aadhaar"
                              render={({ field }) => (
                                <FormItem className="grid grid-cols-4 items-center gap-4">
                                  <FormLabel className="text-right text-black">Aadhaar</FormLabel>
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

                            {/* ADDRESS */}
                            <FormField
                              control={vendorForm.control}
                              name="address"
                              render={({ field }) => (
                                <FormItem className="grid grid-cols-4 items-center gap-4">
                                  <FormLabel className="text-right text-black">Address</FormLabel>
                                  <div className="col-span-3">
                                    <FormControl>
                                      <Textarea {...field} rows={3} placeholder="Enter vendor address" />
                                    </FormControl>
                                  </div>
                                </FormItem>
                              )}
                            />

                            {/* PRODUCTS */}
                            <FormField
                              control={vendorForm.control}
                              name="products"
                              render={({ field }) => (
                                <FormItem className="grid grid-cols-4 items-start gap-4">
                                  <FormLabel className="text-right text-black mt-2">
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
                                                (p) => p.product_id === Number.parseInt(product.id),
                                              )}
                                              onCheckedChange={(checked) =>
                                                handleProductSelection(product.id, checked as boolean)
                                              }
                                            />
                                            <Label htmlFor={`product-${product.id}`} className="text-dark font-medium">
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
                </div>
              </div>

              <div className="grid grid-cols-4 gap-4 items-center">
                <h3 className="text-right text-lg font-semibold text-dark-2 pb-4">Product:</h3>
                <div className="col-span-3 w-3/4 mt-2">
                  <div className="h-[60px]">
                    <Select
                      value={selectedParticular}
                      onValueChange={(value) => {
                        // setSelectedParticular(value)

                        const selected = filteredProducts.find((p) => p.id === value)
                        const unitNames = units.map((u) => u.name)
                        const productUnit = selected?.unit && unitNames.includes(selected.unit) ? selected.unit : "pc"

                        if (selected) {
                          const exists = cart.find((item) => item.product_id === selected.id)
                         
                            // Find vendor to get aadhaar and address
                            const vendor = vendors.find((v) => v.id.toString() === selectedUser)
                            const aadhaar = vendor?.aadhaar || ""
                            const address = vendor?.address || ""

                            setCart((prev) => [
                              ...prev,
                              {
                                product_id: selected.id,
                                product_name: selected.name,
                                price: selected.price,
                                quantity: 1,
                                unit: productUnit,
                                aadhaar,
                                address,
                              },
                            ])

                          
                        }
                      }}
                    >
                      <SelectTrigger
                        id="particulars"
                        aria-label="Select product"
                        className={cn(
                          "h-10",
                          "text-black",
                          "font-semibold",
                          "hover:border-black",
                          orderValidation.cart ? "border-red-500" : "",
                        )}
                      >
                        <SelectValue className="font-semibold text-black" placeholder="Select product" />
                      </SelectTrigger>

                      <SelectContent className="z-[999] text-black font-semibold w-full bg-white shadow-md border rounded-md">
                        {filteredProducts.map((product) => (
                          <SelectItem key={product.id} value={product.id}>
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
                          {item.unit.charAt(0).toUpperCase() + item.unit.slice(1)}
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
          <DialogContent className="bg-white">
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
          <DialogContent className="bg-white">
            <DialogHeader>
              <DialogTitle>Success</DialogTitle>
            </DialogHeader>
            <div>Purchase Updated successfully!</div>
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
