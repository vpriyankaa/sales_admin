// "use client"

// import React, { useState, useEffect } from "react"
// import { useSearchParams } from "next/navigation"
// import { Plus } from 'lucide-react'
// import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
// import { cn } from "@/lib/utils"
// import { Button } from "@/components/ui/button"
// import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
// import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog"
// import { Input } from "@/components/ui/input"
// import { Textarea } from "@/components/ui/textarea"
// import { useToast } from "@/hooks/use-toast"
// import { DateTimePicker } from "@mui/x-date-pickers/DateTimePicker"
// import { LocalizationProvider } from "@mui/x-date-pickers"
// import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns"
// import { OrderSummary } from "@/components/order-summary"
// import type { TextFieldProps } from "@mui/material/TextField"
// import { addCustomer, getCustomers, getProducts, addOrder, getUnits, updateOrder, getOrderById } from "@/app/actions"
// import { Loader2 } from 'lucide-react'
// import { useForm } from "react-hook-form"
// import { zodResolver } from "@hookform/resolvers/zod"
// import * as z from "zod"
// import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
// import { createTheme, ThemeProvider } from "@mui/material/styles";
// import TextField from "@mui/material/TextField";
// import { useTheme } from "@mui/material/styles";


// // Types
// interface Customer {
//   id: string
//   name: string
//   phone: string
//   aadhaar?: string
//   address?: string
// }

// interface Units {
//   id: string
//   name: string
// }

// interface Particular {
//   id: string
//   name: string
//   price: number
//   unit?: string
// }

// interface CartItem {
//   product_id: string
//   product_name: string
//   quantity: number
//   price: number
//   unit: string
// }

// interface Order {
//   id: string
//   customer_id: string
//   customer_name: string
//   date: Date
//   items: CartItem[]
//   total_price: number
//   discount_type: "flat" | "percentage"
//   remarks: string
//   total_payable: number
//   payment_method: string
//   paid_amount: number
//   remaining_amount: number
//   status: string
//   payment_status: string
// }

// export interface OrderInput {
//   customer_id: string
//   customer_name: string
//   vendor_id: string
//   vendor_name: string
//   date: Date
//   items: CartItem[]
//   total_price: number
//   discount_type: "flat" | "percentage"
//   remarks: string
//   total_payable: number
//   payment_method: string
//   discount_value: number
//   remaining_amount: number
//   status: string
//   paid_amount: number
//   payment_status: string
//   type: "sale" | "purchase"
// }

// interface Props {
//   id: string
// }

// // Customer form schema
// const customerFormSchema = z.object({
//   name: z
//     .string()
//     .min(2, "Name must be at least 2 characters")
//     .regex(/^[A-Za-z\s]+$/, "Name should contain only letters and spaces"),
//   phone: z
//     .string()
//     .min(10, "Phone must be a 10-digit number")
//     .max(10, "Phone must be a 10-digit number")
//     .regex(/^\d{10}$/, "Phone must contain only digits"),
//   aadhaar: z
//     .string()
//     .optional()
//     .refine((val) => {
//       if (!val || val.trim() === "") return true
//       const digits = val.replace(/\s+/g, "")
//       return /^\d{12}$/.test(digits)
//     }, "Aadhaar must be a 12-digit number"),
//   address: z.string().optional(),
// })

// type CustomerFormData = z.infer<typeof customerFormSchema>

// export default function Home({ id }: Props) {
//   const searchParams = useSearchParams()
//   const orderId = searchParams.get("id")
//   const isEditMode = !!id

//   const theme = useTheme()

//   // State
//   // const [date, setDate] = useState<Date | null>(null);
//   const [date, setDate] = React.useState<Date | null>(new Date());

//   const [open, setOpen] = useState(!isEditMode)
//   const [openEdit, setEditOpen] = useState(false)
//   const [customers, setCustomers] = useState<Customer[]>([])
//   const [units, setUnits] = useState<Units[]>([])
//   const [particulars, setParticulars] = useState<Particular[]>([])
//   const [selectedUser, setSelectedCustomer] = useState<string>("")
//   const [isAddingCustomer, setIsAddingCustomer] = useState(false)
//   const [isLoading, setIsLoading] = useState(false)
//   const [isLoadingOrder, setIsLoadingOrder] = useState(isEditMode)
//   const { toast } = useToast()




//   const darkTheme = createTheme({
//     palette: {
//       mode: "dark",
//       background: {
//         default: "#121212",
//         paper: "#1e1e1e",
//       },
//       text: {
//         primary: "#ffffff",
//         secondary: "#bbbbbb",
//       },
//     },
//     components: {
//       MuiOutlinedInput: {
//         styleOverrides: {
//           root: {
//             color: "#fff",
//             "& .MuiOutlinedInput-notchedOutline": {
//               borderColor: "#666",
//             },
//             "&:hover .MuiOutlinedInput-notchedOutline": {
//               borderColor: "#aaa",
//             },
//             "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
//               borderColor: "#fff",
//             },
//           },
//           input: {
//             color: "#fff",
//           },
//           adornedEnd: {
//             "& svg": {
//               color: "#fff",
//             },
//           },
//         },
//       },
//       MuiInputLabel: {
//         styleOverrides: {
//           root: {
//             color: "#bbb",
//             "&.Mui-focused": {
//               color: "#fff",
//             },
//           },
//         },
//       },
//       MuiSvgIcon: {
//         styleOverrides: {
//           root: {
//             color: "#fff",
//           },
//         },
//       },
//     },
//   });

//   const lightTheme = createTheme({
//     palette: {
//       mode: "light",
//       background: {
//         default: "#121212",
//         paper: "#1e1e1e",
//       },
//       text: {
//         primary: "#00000",
//         secondary: "#bbbbbb",
//       },
//     },
//     components: {
//       MuiOutlinedInput: {
//         styleOverrides: {
//           root: {
//             color: "#fff",
//             "& .MuiOutlinedInput-notchedOutline": {
//               borderColor: "#666",
//             },
//             "&:hover .MuiOutlinedInput-notchedOutline": {
//               borderColor: "#aaa",
//             },
//             "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
//               borderColor: "#fff",
//             },
//           },
//           input: {
//             color: "#00000",
//           },
//           adornedEnd: {
//             "& svg": {
//               color: "#00000",
//             },
//           },
//         },
//       },
//       MuiInputLabel: {
//         styleOverrides: {
//           root: {
//             color: "#bbb",
//             "&.Mui-focused": {
//               color: "#fff",
//             },
//           },
//         },
//       },
//       MuiSvgIcon: {
//         styleOverrides: {
//           root: {
//             color: "#fff",
//           },
//         },
//       },
//     },
//   });

//   // Customer form
//   const customerForm = useForm<CustomerFormData>({
//     resolver: zodResolver(customerFormSchema),
//     defaultValues: {
//       name: "",
//       phone: "",
//       aadhaar: "",
//       address: "",
//     },
//     mode: "onChange",
//   })

//   const [isOpen, setIsOpen] = useState(false)

//   const openDialog = () => setIsOpen(true)
//   const closeDialog = () => setIsOpen(false)

//   useEffect(() => {
//     setDate(new Date());
//   }, []);


//   const [cart, setCart] = useState<CartItem[]>([])
//   const [selectedParticular, setSelectedParticular] = useState<string>("")
//   const [currentQuantity, setCurrentQuantity] = useState<string>("1")
//   const [isSubmitting, setIsSubmitting] = useState(false)
//   const [orderValidation, setOrderValidation] = useState<{
//     customer?: string
//     cart?: string
//   }>({})

//   const [editOrderSummary, setEditOrderSummary] = useState<{
//     discountAmount: number
//     discountType: "flat" | "percentage"
//     remarks: string
//     totalAmount: number
//     totalPayable: number
//     paidAmount: number
//     paymentMethod: string
//   } | null>(null)

//   useEffect(() => {
//     const fetchData = async () => {
//       try {
//         const customersData = await getCustomers()
//         const productsData = await getProducts()
//         const unitsData = await getUnits()

//         setUnits(unitsData)
//         setCustomers(customersData)
//         setParticulars(productsData)

//         // If in edit mode, fetch order details
//         if (isEditMode && id) {
//           setIsLoadingOrder(true)
//           try {
//             const orderData = await getOrderById(Number.parseInt(id))

//             if (orderData) {
//               setSelectedCustomer(orderData.customer_id.toString())
//               setDate(new Date(orderData.date))
//               setCart(orderData.items || [])

//               setEditOrderSummary({
//                 discountAmount: orderData.discount_value || 0,
//                 discountType: orderData.discount_type,
//                 remarks: orderData.remarks || "",
//                 totalAmount: orderData.total_price || 0,
//                 totalPayable: orderData.total_payable || 0,
//                 paidAmount: orderData.paid_amount || 0,
//                 paymentMethod: orderData.payment_method || "",
//               })
//             }
//           } catch (error) {
//             console.error("Error fetching order:", error)
//             toast({
//               title: "Error",
//               description: "Failed to load order details",
//               variant: "destructive",
//             })
//           } finally {
//             setIsLoadingOrder(false)
//           }
//         }
//       } catch (error) {
//         console.error("Error fetching data:", error)
//         toast({
//           title: "Error",
//           description: "Failed to connect to the database. Please check your configuration.",
//           variant: "destructive",
//         })
//       }
//     }

//     fetchData()
//   }, [isEditMode, orderId, toast])

//   useEffect(() => {
//     const newValidation = { ...orderValidation }

//     if (selectedUser && newValidation.customer) {
//       delete newValidation.customer
//     }

//     if (cart.length > 0 && newValidation.cart) {
//       delete newValidation.cart
//     }

//     setOrderValidation(newValidation)
//   }, [selectedUser, cart])

//   const handleAddCustomer = async (data: CustomerFormData) => {
//     setIsLoading(true)

//     try {
//       const customerData = {
//         name: data.name,
//         phone: data.phone,
//         aadhaar: data.aadhaar || "",
//         address: data.address || "",
//       }

//       const newCustomerId = await addCustomer(customerData)

//       const addedCustomer = {
//         ...customerData,
//         id: newCustomerId.toString(),
//       }

//       setCustomers([...customers, addedCustomer])
//       setSelectedCustomer(newCustomerId.toString())

//       customerForm.reset()
//       setIsAddingCustomer(false)

//       toast({
//         title: "Success",
//         description: "Customer added successfully",
//       })
//     } catch (err) {
//       console.error(err)
//       customerForm.setError("phone", {
//         type: "manual",
//         message: "Phone number already exists",
//       })
//     } finally {
//       setIsLoading(false)
//     }
//   }

//   const validateOrder = (): { customer?: string; cart?: string } => {
//     const errors: { customer?: string; cart?: string } = {}

//     if (!selectedUser) {
//       errors.customer = "Please select a customer"
//     }

//     if (cart.length === 0) {
//       errors.cart = "Please add at least one product to the cart"
//     }

//     return errors
//   }

//   const handlePlaceOrder = async (
//     orderSummaryData: {
//       discountAmount: number
//       discountType: "flat" | "percentage"
//       remarks: string
//       totalAmount: number
//       totalPayable: number
//       paidAmount: number
//       paymentMethod: string
//     },
//     summaryErrors: { paymentMethod?: string; paidAmount?: string },
//   ) => {
//     const orderErrors = validateOrder()

//     setOrderValidation(orderErrors)

//     if (Object.keys(orderErrors).length > 0 || Object.keys(summaryErrors).length > 0) {
//       return
//     }

//     try {
//       setIsSubmitting(true)

//       const customer = customers.find((c) => c.id.toString() === selectedUser)
//       if (!customer) throw new Error("Customer not found")

//       const remaining = orderSummaryData.totalAmount - orderSummaryData.paidAmount - orderSummaryData.discountAmount
//       const paidAmount = orderSummaryData.paidAmount

//       const payment_status = remaining === 0 ? "paid" : paidAmount > 0 ? "partiallypaid" : "credit"

//       const orderInput: OrderInput = {
//         customer_id: customer.id.toString(),
//         customer_name: customer.name,
//         date: date || new Date(),
//         vendor_id: "",
//         vendor_name: "",
//         items: cart.map((item) => ({
//           product_id: item.product_id,
//           product_name: item.product_name,
//           quantity: item.quantity,
//           price: item.price,
//           unit: item.unit,
//         })),
//         total_price: orderSummaryData.totalAmount,
//         discount_type: orderSummaryData.discountType,
//         remarks: orderSummaryData?.remarks || "",
//         total_payable: orderSummaryData.totalPayable,
//         payment_method: orderSummaryData.paymentMethod,
//         discount_value: orderSummaryData.discountAmount,
//         remaining_amount: remaining,
//         status: remaining === 0 ? "completed" : "created",
//         type: "sale",
//         paid_amount: orderSummaryData.paidAmount,
//         payment_status: payment_status,
//       }

//       if (isEditMode && id) {
//         await updateOrder(Number.parseInt(id), orderInput)
//         toast({
//           title: "Success",
//           description: "Order updated successfully",
//         })
//         setEditOpen(true)
//       } else {
//         const newOrderId = await addOrder(orderInput)
//       }

//       if (!isEditMode) {
//         setCart([])
//         setSelectedParticular("")
//         setSelectedCustomer("")
//         setDate(new Date())
//         setIsOpen(true)
//       }
//     } catch (error) {
//       console.error("Order error:", error)
//       toast({
//         title: "Error",
//         description: "Failed to process order",
//         variant: "destructive",
//       })
//     } finally {
//       setIsSubmitting(false)
//     }
//   }

//   if (isLoadingOrder) {
//     return (
//       <div className="flex justify-center items-center h-64">
//         <Loader2 className="h-8 w-8 animate-spin text-primary" />
//       </div>
//     )
//   }

//   const handleDialogClose = () => {
//     setIsAddingCustomer(false)
//     customerForm.reset()
//   }




//   const isDarkMode = document.documentElement.classList.contains("dark");


//   const isDark = theme.palette.mode == "dark";


//   console.log("isDark", isDark);

//   return (
//     <>
//       <div className="rounded-[10px] shadow-1 dark:bg-gray-dark dark:shadow-card">
//         <div className="flex flex-col md:flex-row justify-evenly gap-4">
//           <div className="w-full md:w-2/3 rounded-[10px] bg-white dark:bg-gray-dark shadow-lg p-4">
//             <h2 className="text-2xl font-bold text-center text-black dark:!text-white mb-4">
//               {isEditMode ? "Edit Order" : "Create Order"}
//             </h2>
//             <div className="space-y-4">
//               <div className="grid grid-cols-4 gap-4 items-center">
//                 <h3 className="text-right text-lg font-semibold text-dark-2 dark:!text-white">Date:</h3>
//                 <div className="col-span-3 w-3/4 dark:!text-white">


//                   {/* <LocalizationProvider dateAdapter={AdapterDateFns}>
//                     <DateTimePicker
//                       value={date}
//                       onChange={(newValue: Date | null) => setDate(newValue)}
//                       views={["year", "month", "day", "hours", "minutes", "seconds"]}
//                       slotProps={{
//                         textField: {
//                           fullWidth: true,
//                           variant: "outlined",
//                           size: "small",
//                         } as TextFieldProps,
//                       }}

//                     />
//                   </LocalizationProvider> */}

//                   <ThemeProvider theme={isDark ? darkTheme : lightTheme}>
//                     <LocalizationProvider dateAdapter={AdapterDateFns}>
//                       <DateTimePicker
//                         label="Select date & time"
//                         value={date}
//                         onChange={(v) => setDate(v)}
//                         views={["year", "month", "day", "hours", "minutes", "seconds"]}
//                         slotProps={{
//                           /* ---------- pop‑up panel ---------- */
//                           popper: {
//                             sx: {
//                               "& .MuiPaper-root": {
//                                 minWidth: 400,          // widen calendar
//                                 bgcolor: isDark ? "#1e1e1e" : "#fff",
//                               },

//                               "& .MuiTypography-root, \
//                  & .MuiPickersDay-root, \
//                  & .MuiDayCalendar-weekDayLabel, \
//                  & .MuiPickersCalendarHeader-label": {
//                                 color: isDark ? "#fff" : "#000 !important",
//                               },
//                             },
//                           },

//                           /* ---------- text field ---------- */
//                           textField: {
//                             fullWidth: true,
//                             variant: "outlined",
//                             size: "small",
//                             sx: {
//                               /* Input text */
//                               "& .MuiInputBase-input, & .MuiOutlinedInput-input": {
//                                 color: isDark ? "#fff" : "#000", // Correct now
//                               },

//                               /* Calendar icon */
//                               "& .MuiSvgIcon-root": {
//                                 color: isDark ? "#fff" : "#000", // Also correct
//                               },

//                               /* Floating label */
//                               "& .MuiInputLabel-root": {
//                                 color: isDark ? "#bbb" : "#555",
//                               },
//                               "& .Mui-focused.MuiInputLabel-root": {
//                                 color: isDark ? "#fff" : "#000",
//                               },
//                             },

//                           } as TextFieldProps,
//                         }}
//                       />
//                     </LocalizationProvider>
//                   </ThemeProvider>

//                 </div>

//               </div>

//               <div className="grid grid-cols-4 gap-4 items-center">
//                 <h3 className="text-right text-lg font-semibold text-dark-2 dark:!text-white">Customer:</h3>
//                 <div className="col-span-2 relative">
//                   <div className="h-[60px]">
//                     <Select value={selectedUser} onValueChange={setSelectedCustomer}>
//                       <SelectTrigger
//                         id="customer"
//                         aria-label="Select customer"
//                         className={cn(
//                           "h-10",
//                           "hover:border-black mt-5",
//                           "font-semibold",
//                           orderValidation.customer ? "border-red-500" : "",
//                         )}
//                       >
//                         <SelectValue className="font-semibold" placeholder="Select customer" />
//                       </SelectTrigger>
//                       <SelectContent className="z-[999] w-full font-bold text-black bg-white shadow-md border rounded-md">
//                         {customers.map((customer) => (
//                           <SelectItem key={customer.id} value={customer.id.toString()}>
//                             {customer.name}
//                           </SelectItem>
//                         ))}
//                       </SelectContent>
//                     </Select>
//                     {orderValidation.customer && (
//                       <p className="text-md text-red-500 mt-1">{orderValidation.customer}</p>
//                     )}
//                   </div>
//                 </div>
//                 <div>
//                   <Dialog open={isAddingCustomer} onOpenChange={setIsAddingCustomer}>
//                     <DialogTrigger asChild>
//                       <Button className="text-white" size="icon" aria-label="Add new customer">
//                         <Plus className="h-4 w-4" />
//                         <span className="sr-only">Add new customer</span>
//                       </Button>
//                     </DialogTrigger>
//                     <DialogContent className="bg-white dark:bg-white max-w-2xl">
//                       <DialogHeader>
//                         <DialogTitle className="text-center text-dark font-bold">Add New Customer</DialogTitle>
//                       </DialogHeader>

//                       <Form {...customerForm}>
//                         <form onSubmit={customerForm.handleSubmit(handleAddCustomer)} className="space-y-6">
//                           <div className="grid gap-4 py-4">
//                             {/* NAME */}
//                             <FormField
//                               control={customerForm.control}
//                               name="name"
//                               render={({ field }) => (
//                                 <FormItem className="grid grid-cols-4 items-center gap-4">
//                                   <FormLabel className="text-right text-black">
//                                     Name <span className="text-red-500">*</span>
//                                   </FormLabel>
//                                   <div className="col-span-3">
//                                     <FormControl>
//                                       <Input {...field} maxLength={20} placeholder="Enter customer name" />
//                                     </FormControl>
//                                     <FormMessage />
//                                   </div>
//                                 </FormItem>
//                               )}
//                             />

//                             {/* PHONE */}
//                             <FormField
//                               control={customerForm.control}
//                               name="phone"
//                               render={({ field }) => (
//                                 <FormItem className="grid grid-cols-4 items-center gap-4">
//                                   <FormLabel className="text-right text-black">
//                                     Phone <span className="text-red-500">*</span>
//                                   </FormLabel>
//                                   <div className="col-span-3">
//                                     <FormControl>
//                                       <Input
//                                         {...field}
//                                         type="tel"
//                                         inputMode="numeric"
//                                         maxLength={10}
//                                         placeholder="Enter 10-digit phone number"
//                                         onChange={(e) => {
//                                           const value = e.target.value.replace(/\D/g, "")
//                                           field.onChange(value)
//                                         }}
//                                         onBlur={() => customerForm.trigger("phone")}
//                                       />
//                                     </FormControl>
//                                     <FormMessage />
//                                   </div>
//                                 </FormItem>
//                               )}
//                             />

//                             {/* AADHAAR */}
//                             <FormField
//                               control={customerForm.control}
//                               name="aadhaar"
//                               render={({ field }) => (
//                                 <FormItem className="grid grid-cols-4 items-center gap-4">
//                                   <FormLabel className="text-right text-black">Aadhaar</FormLabel>
//                                   <div className="col-span-3">
//                                     <FormControl>
//                                       <Input
//                                         {...field}
//                                         inputMode="numeric"
//                                         maxLength={14}
//                                         placeholder="Enter Aadhaar number"
//                                         onChange={(e) => {
//                                           const value = e.target.value.replace(/[^\d\s]/g, "")
//                                           field.onChange(value)
//                                         }}
//                                       />
//                                     </FormControl>
//                                     <FormMessage />
//                                   </div>
//                                 </FormItem>
//                               )}
//                             />

//                             {/* ADDRESS */}
//                             <FormField
//                               control={customerForm.control}
//                               name="address"
//                               render={({ field }) => (
//                                 <FormItem className="grid grid-cols-4 items-center gap-4">
//                                   <FormLabel className="text-right text-black">Address</FormLabel>
//                                   <div className="col-span-3">
//                                     <FormControl>
//                                       <Textarea {...field} rows={3} placeholder="Enter customer address" />
//                                     </FormControl>
//                                   </div>
//                                 </FormItem>
//                               )}
//                             />
//                           </div>

//                           <DialogFooter className="flex flex-col sm:flex-row-reverse sm:justify-center gap-2">
//                             <Button type="button" variant="outline" onClick={handleDialogClose} disabled={isLoading}>
//                               Cancel
//                             </Button>
//                             <Button type="submit" className="text-white" disabled={isLoading}>
//                               {isLoading ? (
//                                 <>
//                                   <Loader2 className="mr-2 h-4 w-4 animate-spin" />
//                                   Save
//                                 </>
//                               ) : (
//                                 "Save"
//                               )}
//                             </Button>
//                           </DialogFooter>
//                         </form>
//                       </Form>
//                     </DialogContent>
//                   </Dialog>
//                 </div>
//               </div>

//               <div className="grid grid-cols-4 gap-4 items-center">
//                 <h3 className="text-right text-lg font-semibold text-dark-2 dark:!text-white pb-4">Product:</h3>
//                 <div className="col-span-3 w-3/4 mt-2">
//                   <div className="h-[60px]">
//                     <Select
//                       value={selectedParticular}
//                       onValueChange={(value) => {
//                         // setSelectedParticular(value)

//                         const selected = particulars.find((p) => p.id === value)
//                         const unitNames = units.map((u) => u.name)
//                         const productUnit = selected?.unit && unitNames.includes(selected.unit) ? selected.unit : "pc"

//                         if (selected) {
//                           const exists = cart.find((item) => item.product_id === selected.id)

//                           if (!exists) {
//                             setCart((prev) => [
//                               ...prev,
//                               {
//                                 product_id: selected.id,
//                                 product_name: selected.name,
//                                 price: selected.price,
//                                 quantity: 1,
//                                 unit: productUnit,
//                               },
//                             ])
//                           }


//                         }
//                       }}
//                     >
//                       <SelectTrigger
//                         id="particulars"
//                         aria-label="Select product"
//                         className={cn(
//                           "h-10",

//                           "font-semibold",
//                           "hover:border-black",
//                           orderValidation.cart ? "border-red-500" : "",
//                         )}
//                       >
//                         <SelectValue className="font-semibold text-black" placeholder="Select product" />
//                       </SelectTrigger>
//                       <SelectContent className="z-[999] text-black font-semibold w-full bg-white shadow-md border rounded-md">
//                         {particulars.map((particular) => (
//                           <SelectItem key={particular.id} value={particular.id}>
//                             {particular.name}
//                           </SelectItem>
//                         ))}
//                       </SelectContent>
//                     </Select>
//                     {orderValidation.cart && <p className="text-md text-red-500 mt-1">{orderValidation.cart}</p>}
//                   </div>
//                 </div>
//               </div>
//             </div>

//             {/* Cart Table */}
//             {cart.length > 0 && (
//               <div
//                 className="mt-6 mb-6 border rounded-md overflow-hidden"
//                 style={{ maxHeight: "400px", overflowY: "auto" }}
//               >
//                 <Table>
//                   <TableHeader className="sticky top-0 bg-white dark:bg-gray-dark z-10">
//                     <TableRow className="border-none uppercase [&>th]:text-center">
//                       <TableHead className="!text-left min-w-[100px]">Product</TableHead>
//                       <TableHead className="min-w-[100px]">Quantity</TableHead>
//                       <TableHead className="min-w-[100px]">Unit</TableHead>
//                       <TableHead className="min-w-[100px]">Price</TableHead>
//                       <TableHead className="min-w-[100px]">Total</TableHead>
//                       <TableHead></TableHead>
//                     </TableRow>
//                   </TableHeader>

//                   <TableBody>
//                     {cart.map((item) => (
//                       <TableRow key={item.product_id} className="group text-center text-black font-medium">
//                         <TableCell className="!text-left text-black dark:!text-white">{item.product_name}</TableCell>

//                         <TableCell>
//                           <input
//                             type="number"
//                             min={1}
//                             value={item.quantity}
//                             onChange={(e) => {
//                               const value = Number.parseInt(e.target.value) || 1
//                               setCart((prev) =>
//                                 prev.map((i) =>
//                                   i.product_id === item.product_id ? { ...i, quantity: Math.max(1, value) } : i,
//                                 ),
//                               )
//                             }}
//                             className="h-8 w-16 text-black dark:!text-white text-center border rounded"
//                           />
//                         </TableCell>

//                         <TableCell className="text-black dark:!text-white">
//                           {item.unit.charAt(0).toUpperCase() + item.unit.slice(1)}
//                         </TableCell>

//                         <TableCell className="text-black dark:!text-white">₹{item.price}</TableCell>
//                         <TableCell className="text-black dark:!text-white">
//                           ₹
//                           {(item.price * item.quantity) % 1 === 0
//                             ? item.price * item.quantity
//                             : (item.price * item.quantity).toFixed(2)}
//                         </TableCell>

//                         <TableCell>
//                           <Button
//                             variant="ghost"
//                             size="sm"
//                             onClick={() => setCart((prev) => prev.filter((i) => i.product_id !== item.product_id))}
//                             className="h-8 w-8 p-0 mx-auto opacity-0 group-hover:opacity-100 text-red-600 transition-opacity duration-200"
//                           >
//                             <span className="sr-only">Remove</span>
//                             <svg
//                               xmlns="http://www.w3.org/2000/svg"
//                               width="16"
//                               height="16"
//                               viewBox="0 0 24 24"
//                               fill="none"
//                               stroke="currentColor"
//                               strokeWidth="2"
//                               strokeLinecap="round"
//                               strokeLinejoin="round"
//                               className="lucide lucide-x"
//                             >
//                               <path d="M18 6 6 18" />
//                               <path d="m6 6 12 12" />
//                             </svg>
//                           </Button>
//                         </TableCell>
//                       </TableRow>
//                     ))}
//                   </TableBody>
//                 </Table>
//               </div>
//             )}
//           </div>

//           {/* Gray background gap */}
//           <div className="hidden md:block w-2 bg-gray shadow-1 dark:bg-gray-dark dark:shadow-card"></div>

//           {/* Right side - Order Summary */}
//           <div className="w-full md:w-1/3 rounded-[10px] shadow-lg self-start">
//             <OrderSummary
//               cart={cart}
//               selectedUser={selectedUser}
//               isSubmitting={isSubmitting}
//               onPlaceOrder={handlePlaceOrder}
//               isEditMode={isEditMode}
//               editOrderSummary={editOrderSummary}
//             />
//           </div>
//         </div>
//       </div>

//       {isOpen && !isEditMode && (
//         <Dialog open={open} onOpenChange={setOpen}>
//           <DialogContent className="bg-white">
//             <DialogHeader>
//               <DialogTitle>Success</DialogTitle>
//             </DialogHeader>
//             <div>Order placed successfully!</div>
//             <DialogFooter>
//               <Button
//                 className="w-full md:w-auto text-white mb-5 mr-2"
//                 onClick={() => {
//                   setOpen(false)
//                   window.location.reload()
//                 }}
//               >
//                 Close
//               </Button>
//             </DialogFooter>
//           </DialogContent>
//         </Dialog>
//       )}

//       {openEdit && isEditMode && (
//         <Dialog open={openEdit} onOpenChange={setEditOpen}>
//           <DialogContent className="bg-white">
//             <DialogHeader>
//               <DialogTitle>Success</DialogTitle>
//             </DialogHeader>
//             <div>Order Updated successfully!</div>
//             <DialogFooter>
//               <Button
//                 className="w-full md:w-auto text-white mb-5 mr-2"
//                 onClick={() => {
//                   setEditOpen(false)
//                   window.location.reload()
//                 }}
//               >
//                 Close
//               </Button>
//             </DialogFooter>
//           </DialogContent>
//         </Dialog>
//       )}
//     </>
//   )
// }


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

// Types
interface Customer {
  id: string
  name: string
  phone: string
  aadhaar?: string
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
  payment_status: string
  type: "sale" | "purchase"
}

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
  const [customers, setCustomers] = useState<Customer[]>([])
  const [units, setUnits] = useState<Units[]>([])
  const [particulars, setParticulars] = useState<Particular[]>([])
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

  // Customer form
  const customerForm = useForm<CustomerFormData>({
    resolver: zodResolver(customerFormSchema),
    defaultValues: {
      name: "",
      phone: "",
      aadhaar: "",
      address: "",
    },
    mode: "onChange",
  })

  const [isOpen, setIsOpen] = useState(false)

  const openDialog = () => setIsOpen(true)
  const closeDialog = () => setIsOpen(false)

  useEffect(() => {
    setDate(new Date())
  }, [])

  const [cart, setCart] = useState<CartItem[]>([])
  const [selectedParticular, setSelectedParticular] = useState<string>("")
  const [currentQuantity, setCurrentQuantity] = useState<string>("1")
  const [isSubmitting, setIsSubmitting] = useState(false)
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
        const productsData = await getProducts()
        const unitsData = await getUnits()

        setUnits(unitsData)
        setCustomers(customersData)
        setParticulars(productsData)

        // If in edit mode, fetch order details
        if (isEditMode && id) {
          setIsLoadingOrder(true)
          try {
            const orderData = await getOrderById(Number.parseInt(id))

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
        ...customerData,
        id: newCustomerId.toString(),
      }

      setCustomers([...customers, addedCustomer])
      setSelectedCustomer(newCustomerId.toString())

      customerForm.reset()
      setIsAddingCustomer(false)

      toast({
        title: "Success",
        description: "Customer added successfully",
      })
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
        customer_id: customer.id.toString(),
        customer_name: customer.name,
        date: date || new Date(),
        vendor_id: "",
        vendor_name: "",
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

  const isDarkMode = document.documentElement.classList.contains("dark")

  const isDark = theme.palette.mode == "dark"

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
                  {/* <LocalizationProvider dateAdapter={AdapterDateFns}>
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
                  </LocalizationProvider> */}

                  <ThemeProvider theme={isDark ? darkTheme : lightTheme}>
                    <LocalizationProvider dateAdapter={AdapterDateFns}>
                      <DateTimePicker
                        label="Select date & time"
                        value={date}
                        onChange={(v) => setDate(v)}
                        views={["year", "month", "day", "hours", "minutes",]}
                        slotProps={{
                          /* ---------- pop‑up panel ---------- */
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
                        {customers.map((customer) => (
                          <SelectItem className="text-md" key={customer.id} value={customer.id.toString()}>
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
                                      <Input {...field} maxLength={20} placeholder="Enter customer name" />
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
                                        onBlur={() => customerForm.trigger("phone")}
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
                  {isEditMode ? "Product:" : "Product:"}
                </h3>
                <div className="col-span-3 w-3/4 mt-2">
                  <div className="h-[60px]">
                    <Select
                      value={selectedParticular}
                      onValueChange={(value) => {
                        // setSelectedParticular(value)

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
                        {particulars.map((particular) => (
                          <SelectItem className="text-md" key={particular.id} value={particular.id}>
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
                      <TableRow key={item.product_id} className="group text-center text-black dark:!text-white dark:bg-gray-dark  font-medium">
                        <TableCell className="!text-left text-black dark:!text-white">{item.product_name}</TableCell>

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
