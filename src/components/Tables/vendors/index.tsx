"use client"

import type React from "react"
import { useEffect, useState } from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { getProducts, addVendor, getVendors, editVendor } from "@/app/actions"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Textarea } from "@/components/ui/textarea"
import { VendorsSkeleton } from "./skeleton"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Loader2, Edit ,Eye} from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useRouter } from "next/navigation"

type Product = {
  id: number
  name: string
  quantity: number
  price: number
  unit: string
}

type VendorProduct = {
  product_id: number
  product_name: string
}

type Vendor = {
  id: number
  name: string
  phone: string
  aadhaar?: string
  address?: string
  products: VendorProduct[]
}

const vendorFormSchema = z.object({
  name: z
    .string()
    .min(2, "Name is Required")
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
    .min(1, "Please select any product"),
})

type VendorFormData = z.infer<typeof vendorFormSchema>

export function Vendors() {
  const [vendors, setVendors] = useState<Vendor[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [open, setOpen] = useState(false)
  const [openAdd, setOpenAdd] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [editingVendor, setEditingVendor] = useState<Vendor | null>(null)
  const [openEdit, setOpenEdit] = useState(false)

  const router = useRouter()

  const userStr = sessionStorage.getItem("user");

  const user = userStr ? JSON.parse(userStr) : null;

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

  // Fetch vendors and products
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [vendorsData, productsData] = await Promise.all([getVendors(), getProducts()])
        setVendors(vendorsData)
        setProducts(productsData)
      } catch (error) {
        console.error("Error fetching data:", error)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

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
      }
    } else {
      const newProducts = currentProducts.filter((p) => p.product_id !== productId)
      vendorForm.setValue("products", newProducts)
    }

    // Trigger validation for products field
    vendorForm.trigger("products")
  }

  const handleAddVendor = async (data: VendorFormData) => {
    setIsSubmitting(true)

    try {
      const vendorData = {
        name: data.name,
        phone: data.phone,
        aadhaar: data.aadhaar?.trim() || undefined,
        address: data.address?.trim() || undefined,
        products: data.products.map((product) => ({
          product_id: product.product_id,
          product_name: product.product_name,
        })),
      }

      await addVendor(vendorData)

      // Close dialog and show success
      setOpen(false)
      setOpenAdd(true)

      // Reset form
      vendorForm.reset()

      // Refresh vendors list
      const refreshedVendors = await getVendors()
      setVendors(refreshedVendors)
    } catch (err) {
      console.error("Error adding vendor:", err)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleEditVendor = (vendor: Vendor) => {
    setEditingVendor(vendor)

    // Pre-populate the form with vendor data
    vendorForm.reset({
      name: vendor.name,
      phone: Number(vendor.phone),
      aadhaar: vendor.aadhaar || "",
      address: vendor.address || "",
      products: vendor.products || [],
    })

    setOpenEdit(true)
  }

  const handleUpdateVendor = async (data: VendorFormData) => {
    if (!editingVendor) return

    setIsSubmitting(true)

    try {
      const vendorData = {
        id: editingVendor.id,
        name: data.name,
        phone: data.phone,
        aadhaar: data.aadhaar?.trim() || undefined,
        address: data.address?.trim() || undefined,
        products: data.products.map((product) => ({
          product_id: product.product_id,
          product_name: product.product_name,
        })),
        user: user?.id

      }

      // You'll need to create this action
      await editVendor(vendorData)

      // Close dialog and show success
      setOpenEdit(false)
      setOpenAdd(true)

      // Reset form and editing state
      vendorForm.reset()
      setEditingVendor(null)

      // Refresh vendors list
      const refreshedVendors = await getVendors()
      setVendors(refreshedVendors)
    } catch (err) {
      console.error("Error updating vendor:", err)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDialogClose = () => {
    setOpen(false)
    vendorForm.reset()
  }

  const handleEditDialogClose = () => {
    setOpenEdit(false)
    setEditingVendor(null)
    vendorForm.reset()
  }

  // Pagination state
  const [itemsPerPage, setItemsPerPage] = useState(10)
  const [itemsPerPageInput, setItemsPerPageInput] = useState("10")
  const [currentPage, setCurrentPage] = useState(1)

  const totalPages = Math.ceil(vendors.length / itemsPerPage)
  const paginatedData = vendors.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)

  const handleItemsPerPageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setItemsPerPageInput(e.target.value)
  }

  const handleItemsPerPageSubmit = () => {
    const newItemsPerPage = Number.parseInt(itemsPerPageInput)
    if (!isNaN(newItemsPerPage) && newItemsPerPage >= 1) {
      setItemsPerPage(newItemsPerPage)
      setCurrentPage(1)
    } else {
      setItemsPerPageInput(itemsPerPage.toString())
    }
  }

  if (loading) {
    return <VendorsSkeleton />
  }

  return (
    <>
      <div className="rounded-[10px] bg-white shadow-1 dark:bg-gray-dark dark:shadow-card">
        <div className="px-6 py-4 sm:px-6 sm:py-5 xl:px-8.5">
          <h2 className="text-2xl font-bold text-dark dark:!text-white">Vendors</h2>
        </div>

        <div className="flex justify-end mb-5 mr-2">
          <Button type="button" className="text-white" onClick={() => setOpen(true)}>
            Add Vendor
          </Button>
        </div>

        <Table>
          <TableHeader>
            <TableRow className="border-none uppercase [&>th]:text-center">
              <TableHead className="!text-left pl-6">Vendor Name</TableHead>
              <TableHead className="!text-left">Phone</TableHead>
              <TableHead className="!text-left">Aadhaar</TableHead>
              <TableHead className="!text-left">Address</TableHead>
              <TableHead className="!text-left p-6">Products</TableHead>
              <TableHead className="!text-center">Actions</TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            {paginatedData.map((vendor) => (
              <TableRow className="text-base font-medium text-dark dark:!text-white" key={vendor.id}>
                <TableCell className="pl-5 sm:pl-6 xl:pl-7.5">{vendor.name}</TableCell>
                <TableCell>{vendor.phone}</TableCell>
                <TableCell>{vendor.aadhaar || "-"}</TableCell>
                <TableCell className="max-w-xs truncate">{vendor.address || "-"}</TableCell>
                <TableCell>
                  <div className="text-md font-semibold text-gray-800 dark:!text-white">
                    {vendor.products?.map((product, index) => (
                      <span key={index}>
                        {product.product_name}
                        {index !== vendor.products.length - 1 && ", "}
                      </span>
                    ))}
                  </div>
                </TableCell>
                <TableCell className="text-center">
                  <Button variant="ghost" size="sm" onClick={() => handleEditVendor(vendor)} className="h-8 w-8 p-0">
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => router.push(`/vendor-log/${vendor.id}`)}
                    className="h-8 w-8"
                  >
                    <Eye className="h-4 w-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>

        {/* Add Vendor Dialog */}
        <Dialog open={open} onOpenChange={handleDialogClose}>
          <DialogContent className="bg-white dark:bg-white max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-dark font-bold text-center">Add New Vendor</DialogTitle>
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
                                if (value) {
                                  field.onChange(Number(value))
                                } else {
                                  field.onChange(undefined)
                                }
                              }}
                              onBlur={() => vendorForm.trigger("phone")}
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
                                    checked={field.value.some((p) => p.product_id === product.id)}
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
                  <Button type="button" variant="outline" onClick={handleDialogClose} disabled={isSubmitting}>
                    Cancel
                  </Button>
                  <Button type="submit" className="text-white" disabled={isSubmitting}>
                    {isSubmitting ? (
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

        {/* Edit Vendor Dialog */}
        <Dialog open={openEdit} onOpenChange={handleEditDialogClose}>
          <DialogContent className="bg-white dark:bg-white max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-dark font-bold text-center">Edit Vendor</DialogTitle>
            </DialogHeader>

            <Form {...vendorForm}>
              <form onSubmit={vendorForm.handleSubmit(handleUpdateVendor)} className="space-y-6">
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
                                if (value) {
                                  field.onChange(Number(value))
                                } else {
                                  field.onChange(undefined)
                                }
                              }}
                              onBlur={() => vendorForm.trigger("phone")}
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
                                    id={`edit-product-${product.id}`}
                                    checked={field.value.some((p) => p.product_id === product.id)}
                                    onCheckedChange={(checked) =>
                                      handleProductSelection(product.id, checked as boolean)
                                    }
                                  />
                                  <Label htmlFor={`edit-product-${product.id}`} className="text-dark font-medium">
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
                  <Button type="button" variant="outline" onClick={handleEditDialogClose} disabled={isSubmitting}>
                    Cancel
                  </Button>
                  <Button type="submit" className="text-white" disabled={isSubmitting}>
                    {isSubmitting ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Update
                      </>
                    ) : (
                      "Update"
                    )}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>

        {/* Pagination */}

        <div className="flex items-center text-gray-700 justify-end p-4">
          <div className="flex items-center text-gray-700 gap-4">
            <span className="text-md text-gray-700 dark:!text-white">Items per page:</span>
            <Select
              value={itemsPerPage.toString()}
              onValueChange={(value) => {
                const num = Number.parseInt(value)
                setItemsPerPage(num)
                setCurrentPage(1)
              }}
            >
              <SelectTrigger className="w-24 h-8 text-gray-700 dark:!text-white text-center">
                <SelectValue className="text-gray-700" />
              </SelectTrigger>
              <SelectContent className="text-gray-700 font-semibold bg-white shadow-md border rounded-md">
                {[10, 20, 30, 40, 50].map((n) => (
                  <SelectItem key={n} value={n.toString()}>
                    {n}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <span className="text-md text-gray-700 dark:!text-white">
              Page {currentPage} of {totalPages}
            </span>

            <button
              onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
              className="font-bold"
            >
              &lt;
            </button>

            <button
              onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
              disabled={currentPage === totalPages}
              className="font-bold"
            >
              &gt;
            </button>
          </div>
        </div>
      </div>

      {/* Success Dialog */}
      <Dialog open={openAdd} onOpenChange={setOpenAdd}>
        <DialogContent className="bg-white">
          <DialogHeader>
            <DialogTitle>Success</DialogTitle>
          </DialogHeader>
          <div>{editingVendor ? "Vendor updated successfully!" : "Vendor added successfully!"}</div>
          <DialogFooter>
            <Button className="w-full md:w-auto text-white mb-5 mr-2" onClick={() => setOpenAdd(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
