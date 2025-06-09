


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
import type { Product } from "app-types/product"
import type { Vendor } from "app-types/vendor"
import type { Unit } from "app-types/unit"
import type { OrderInput } from "app-types/order-input"
import type { OrderSummary as OrderSummaryData } from "app-types/order-summary"
import { isDiscountType } from "app-types/discount-type"
import { addVendor, getVendors, getProducts, addOrder, getUnits, updateOrder, getOrderById } from "@/app/actions"
import { Loader2 } from "lucide-react"
import { Checkbox } from "@/components/ui/checkbox"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { format } from "date-fns"
import { CalendarIcon, Clock } from "lucide-react"
import { OrderSummary } from "@/components/order-summary"

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
        id: z.number(),
        name: z.string(),
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
  const [vendors, setVendors] = useState<Vendor[]>([])
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
    mode: "onSubmit",
  })

  const [isLoading, setIsLoading] = useState(false)
  const [isLoadingOrder, setIsLoadingOrder] = useState(isEditMode)
  const { toast } = useToast()

  const [isOpen, setIsOpen] = useState(false)

  const openDialog = () => setIsOpen(true)
  const closeDialog = () => setIsOpen(false)

  const [cart, setCart] = useState<Product[]>([])
  const [isVendorLoad, setIsVendorLoad] = useState(true)
  const [isProductLoad, setIsProductLoad] = useState(true)

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

        setIsVendorLoad(false)
        setIsProductLoad(false)
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
            id: productId,
            name: product.name,
          },
        ]
        vendorForm.setValue("products", newProducts)
        vendorForm.trigger("products")
      }
    } else {
      const newProducts = currentProducts.filter((p) => p.id !== productId)
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

      // console.log("vendorData",vendorData);

      const newVendorId = await addVendor(vendorData)

      const addedVendor: Vendor = {
        id: newVendorId,
        createdAt: new Date(), // or `null` if you prefer
        name: data.name,
        phone: data.phone,
        aadhaar: data.aadhaar ? Number(data.aadhaar) : null,
        address: data.address || "",
        products: data.products.map((p) => ({
          id: p.id,
          name: p.name,
          createdAt: new Date(),
          quantity: 0, // Assuming quantity is not needed here
          unit: "", // Assuming unit is not needed here
          total_price: 0, // Assuming total_price is not needed here
          price: 0, // Assuming price is not needed here
        })),
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

  const isDark = document.documentElement.classList.contains("dark")

  return (
    <>
      <div className="rounded-[10px] shadow-1 dark:bg-gray-dark dark:shadow-card">
        <div className="flex flex-col md:flex-row justify-evenly gap-4">
          <div className="w-full md:w-2/3 rounded-[10px] bg-white dark:bg-gray-dark shadow-lg p-4">
            <h2 className="text-2xl font-bold text-center  dark:!text-white mb-4">
              {isEditMode ? "Edit Purchase" : "Purchase"}
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
                <h3 className="text-right text-lg font-semibold  dark:!text-white">Vendor:</h3>
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
                          "dark:!text-white",
                          isEditMode ? "opacity-60 cursor-not-allowed" : "",
                          orderValidation.vendor ? "border-red-500" : "",
                        )}
                      >
                        <SelectValue
                          className="dark:!text-white dark:!bg-gray-dark text-md"
                          placeholder="Select vendor"
                        />
                      </SelectTrigger>

                      <SelectContent className="z-[999] w-full bg-white text-md dark:!bg-gray-dark dark:!text-white shadow-md border rounded-md">
                        {isVendorLoad ? (
                          <div className="flex justify-center items-center h-20">
                            <Loader2 className="h-5 w-5 animate-spin text-primary" />
                          </div>
                        ) : vendors.length > 0 ? (
                          vendors.map((vendor) => (
                            <SelectItem className="text-md" key={vendor.id} value={vendor.id.toString()}>
                              {vendor.name}
                            </SelectItem>
                          ))
                        ) : (
                          <div className="text-center text-sm py-2 text-gray-500">No vendors available</div>
                        )}
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
                          <DialogTitle className="text-center  dark:!bg-gray-dark dark:!text-white">
                            Add New Vendor
                          </DialogTitle>
                        </DialogHeader>

                        <Form {...vendorForm}>
                          <form onSubmit={vendorForm.handleSubmit(handleAddVendor)} className="space-y-6">
                            <div className="grid gap-4 py-4">
                              <FormField
                                control={vendorForm.control}
                                name="name"
                                render={({ field }) => (
                                  <FormItem className="grid grid-cols-4 items-center gap-4">
                                    <FormLabel className="text-right  dark:!text-white">
                                      Name <span className="text-red-500">*</span>
                                    </FormLabel>
                                    <div className="col-span-3">
                                      <FormControl>
                                        <Input
                                          {...field}
                                          maxLength={30}
                                          placeholder="Enter vendor name"
                                          onChange={(e) => {
                                            const rawValue = e.target.value
                                            const correctedValue = rawValue.charAt(0).toUpperCase() + rawValue.slice(1)
                                            field.onChange(correctedValue)
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
                                name="phone"
                                render={({ field }) => (
                                  <FormItem className="grid grid-cols-4 items-center gap-4">
                                    <FormLabel className="text-right  dark:!text-white">
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
                                    <FormLabel className="text-right  dark:!text-white ">Aadhaar</FormLabel>
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
                                    <FormLabel className="text-right  dark:!text-white">Address</FormLabel>
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
                                    <FormLabel className="text-right  dark:!text-white mt-2">
                                      Products <span className="text-red-500">*</span>
                                    </FormLabel>
                                    <div className="col-span-3 space-y-3">
                                      <div className="max-h-60 overflow-y-auto border rounded-md p-3 space-y-3">
                                        {products.map((product) => (
                                          <div key={product.id} className="space-y-2">
                                            <div className="flex items-center space-x-2">
                                              <Checkbox
                                                id={`product-${product.id}`}
                                                checked={field.value.some((p) => p.id === product.id)}
                                                onCheckedChange={(checked) =>
                                                  handleProductSelection(product.id, checked as boolean)
                                                }
                                              />
                                              <Label
                                                htmlFor={`product-${product.id}`}
                                                className=" dark:!text-white font-medium"
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
                <h3 className="text-right text-lg font-semibold  dark:!text-white pb-4">Product:</h3>
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
                          "text--400",
                          "text-md",
                          // "hover:border-black",
                          "dark:!text-white",
                          orderValidation.cart ? "border-red-500" : "",
                        )}
                      >
                        <SelectValue className="text--400" placeholder="Select product" />
                      </SelectTrigger>
                      <SelectContent className="z-[999] text--400 w-full dark:!text-white bg-white dark:!bg-gray-dark shadow-md border rounded-md">
                        {isProductLoad ? (
                          <div className="flex justify-center items-center h-20">
                            <Loader2 className="h-5 w-5 animate-spin text-primary" />
                          </div>
                        ) : filteredProducts.length > 0 ? (
                          filteredProducts.map((product) => (
                            <SelectItem className="text-md" key={product.id} value={product.id.toString()}>
                              {product.name}
                            </SelectItem>
                          ))
                        ) : (
                          <div className="text-center text-sm py-2 text-gray-500">No products found</div>
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
                  <TableHeader className="sticky top-0 bg-white dark:bg-gray-dark z-10">
                    <TableRow className="border-none uppercase text-secondary [&>th]:text-center">
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
                      <TableRow key={item.id} className="group text-center dark:!text-white font-medium">
                        <TableCell className="!text-left dark:!text-white">{item.name}</TableCell>

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
                            className="h-8 w-16 dark:!text-white text-center border rounded"
                          />
                        </TableCell>

                        <TableCell className="dark:!text-white">
                          {item.unit.charAt(0).toUpperCase() + item.unit.slice(1)}
                        </TableCell>

                        <TableCell className="dark:!text-white">₹{item.price}</TableCell>
                        <TableCell className="dark:!text-white">
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
