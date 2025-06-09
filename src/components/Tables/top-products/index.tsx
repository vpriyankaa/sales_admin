"use client"

import type React from "react"
import { useEffect, useState } from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { getProducts, addProduct, getUnits, editProduct } from "@/app/actions"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { TopProductsSkeleton } from "./skeleton"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Loader2, Edit, Eye } from "lucide-react"
import { useRouter } from "next/navigation"
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from "@/components/ui/tooltip"
import { ChevronRight, ChevronLeft } from "lucide-react";

type Unit = {
  id: number
  name: string
}

type Product = {
  id: number
  name: string
  quantity: number
  price: number
  unit: string
}

const productFormSchema = z.object({
  product_name: z.string().min(1, "Product name is required").min(2, "Product name must be at least 2 characters"),
  quantity: z
    .number({
      required_error: "Quantity is required",
      invalid_type_error: "Quantity must be a number",
    })
    .int("Quantity must be a whole number")
    .positive("Quantity must be greater than 0"),
  price: z
    .number({
      required_error: "Price is required",
      invalid_type_error: "Price must be a number",
    })
    .positive("Price must be greater than 0"),
  unit: z.string().min(1, "Unit is required"),
})

type ProductFormData = z.infer<typeof productFormSchema>

export function TopProducts() {

  const router = useRouter()

  const [data, setData] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [units, setUnits] = useState<Unit[]>([])
  const [open, setOpen] = useState(false)
  const [openAdd, setOpenAdd] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [itemsPerPage, setItemsPerPage] = useState(10)
  const [itemsPerPageInput, setItemsPerPageInput] = useState("10")
  const [currentPage, setCurrentPage] = useState(1)

  const [editingProduct, setEditingProduct] = useState<Product | null>(null)
  const [openEdit, setOpenEdit] = useState(false)
  const [openEditSuccess, setOpenEditSuccess] = useState(false)

  const userStr = localStorage.getItem("user");

  const user = userStr ? JSON.parse(userStr) : null;

  const productForm = useForm<ProductFormData>({
    resolver: zodResolver(productFormSchema),
    defaultValues: {
      product_name: "",
      quantity: undefined,
      price: undefined,
      unit: "",
    },
    mode: "onSubmit",
  })

  const editProductForm = useForm<ProductFormData>({
    resolver: zodResolver(productFormSchema),
    defaultValues: {
      product_name: "",
      quantity: undefined,
      price: undefined,
      unit: "",
    },
    mode: "onSubmit",
  })

  useEffect(() => {
    const fetchUnits = async () => {
      const data = await getUnits()
      setUnits(data)
    }
    fetchUnits()
  }, [])

  useEffect(() => {
    const fetchData = async () => {
      const res = await getProducts()
      setData(res)
      setLoading(false)
    }
    fetchData()
  }, [])

  const handleAddProduct = async (formData: ProductFormData) => {
    setIsLoading(true)

    try {
      const productData = {
        name: formData.product_name,
        quantity: formData.quantity,
        price: formData.price,
        unit: formData.unit,
      }

      await addProduct(productData)

      setOpen(false)
      setOpenAdd(true)

      // Reset form
      productForm.reset()

      // Refresh products list
      const refreshed = await getProducts()
      setData(refreshed)
    } catch (err) {
      console.error(err)
      // You can add specific error handling here if needed
    } finally {
      setIsLoading(false)
    }
  }

  const handleDialogClose = () => {
    setOpen(false)
    productForm.reset()
  }

  const handleEditProduct = (product: Product) => {
    setEditingProduct(product)
    editProductForm.reset({
      product_name: product.name,
      quantity: product.quantity,
      price: product.price,
      unit: product.unit,

    })
    setOpenEdit(true)
  }

  const handleUpdateProduct = async (formData: ProductFormData) => {
    if (!editingProduct) return

    setIsLoading(true)

    try {
      const productData = {
        id: editingProduct.id,
        name: formData.product_name,
        quantity: formData.quantity,
        price: formData.price,
        unit: formData.unit,
        user: user?.id
      }

      // You'll need to create an updateProduct action

      console.log("productData",productData);

      const edit = await editProduct(productData)

      if (edit) {
        setOpenEditSuccess(true);
      }
      setOpenEdit(false)
      editProductForm.reset()
      setEditingProduct(null)

      // Refresh products list
      const refreshed = await getProducts()
      setData(refreshed)
    } catch (err) {
      console.error(err)
    } finally {
      setIsLoading(false)


    }
  }

  const handleEditDialogClose = () => {
    setOpenEdit(false)
    editProductForm.reset()
    setEditingProduct(null)
  }

  const totalPages = Math.ceil(data.length / itemsPerPage)
  const paginatedData = data.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)


  if (loading) {
    return <TopProductsSkeleton />
  }

  return (
    <>

      <div className="rounded-[10px] bg-white shadow-1 dark:bg-gray-dark dark:shadow-card">
        <div className="px-6 py-4 sm:px-6 sm:py-5 xl:px-8.5">
          <h2 className="text-2xl font-bold text-dark dark:!text-white">Products</h2>
        </div>

        <div className="flex justify-end mb-5 mr-2">
          <Button type="button" className="text-white" onClick={() => setOpen(true)}>
            Add Product
          </Button>
        </div>

        <Table>
          <TableHeader>
            <TableRow className="text-center text-base uppercase font-medium text-dark dark:!text-white">
              <TableHead className="!text-left pl-6">Product Name</TableHead>
              <TableHead className="!text-left">Quantity</TableHead>
              <TableHead className="!text-left">Unit</TableHead>
              <TableHead className="!text-left">Price</TableHead>
              {/* <TableHead className="!text-center">Action</TableHead> */}
            </TableRow>
          </TableHeader>

          <TableBody>

            {paginatedData.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-7 text-md font-semibold  dark:text-white">
                  No Products found
                </TableCell>
              </TableRow>
            ) : (
              paginatedData.map((product) => (
                <TableRow className="text-left text-base font-medium text-dark dark:!text-white group hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors" key={product.id}>
                  <TableCell className="pl-5 sm:pl-6 xl:pl-7.5">{product.name}</TableCell>
                  <TableCell>{product.quantity}</TableCell>
                  <TableCell>{product.unit.charAt(0).toUpperCase() + product.unit.slice(1)}</TableCell>
                  <TableCell>₹{product.price}</TableCell>

                  <TableCell>
                    <div className="flex items-center justify-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>

                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleEditProduct(product)}
                              className="h-8 w-8 hover:bg-blue-200 dark:hover:bg-gray-700"
                            >
                              <Edit className="h-4 w-4" />
                            </Button>

                          </TooltipTrigger>
                          <TooltipContent className="bg-white font-medium text-secondary">
                            Edit
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>

                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => router.push(`/product-log/${product.id}`)}
                              className="h-8 w-8 hover:bg-blue-200 dark:hover:bg-gray-700"
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent className="bg-white font-medium text-secondary">View</TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>

        {/* Add Product Dialog */}
        <Dialog open={open} onOpenChange={handleDialogClose}>
          <DialogContent className="bg-white dark:!text-white dark:bg-gray-dark max-w-2xl">
            <DialogHeader>
              <DialogTitle className="text-dark font-bold text-center dark:!text-white dark:bg-gray-dark">Add New Product</DialogTitle>
            </DialogHeader>

            <Form {...productForm}>
              <form onSubmit={productForm.handleSubmit(handleAddProduct)} className="space-y-6">
                <div className="grid gap-4 py-4">
                  {/* PRODUCT NAME */}
                  <FormField
                    control={productForm.control}
                    name="product_name"
                    render={({ field }) => (
                      <FormItem className="grid grid-cols-4 items-center gap-4">
                        <FormLabel className="text-right  dark:!text-white dark:bg-gray-dark ">
                          Name <span className="text-red-500">*</span>
                        </FormLabel>
                        <div className="col-span-3">
                          <FormControl>
                            <Input
                              {...field}
                              placeholder="Enter product name"
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

                  {/* UNIT */}
                  <FormField
                    control={productForm.control}
                    name="unit"
                    render={({ field }) => (
                      <FormItem className="grid grid-cols-4 items-center gap-4">
                        <FormLabel className="text-right  dark:!text-white dark:bg-gray-dark">
                          Unit <span className="text-red-500">*</span>
                        </FormLabel>
                        <div className="col-span-3">
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger className="text-gray-400 dark:!text-white">
                                <SelectValue className="text-gray-300" placeholder="Select unit" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent className="bg-white text-md dark:!text-white dark:bg-gray-dark">
                              {units.map((unit) => (
                                <SelectItem key={unit.id} value={unit.name}>
                                  {unit.name.charAt(0).toUpperCase() + unit.name.slice(1)}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </div>
                      </FormItem>
                    )}
                  />

                  {/* PRICE */}
                  <FormField
                    control={productForm.control}
                    name="price"
                    render={({ field }) => (
                      <FormItem className="grid grid-cols-4 items-center gap-4">
                        <FormLabel className="text-right  dark:!text-white dark:bg-gray-dark">
                          Price <span className="text-red-500">*</span>
                        </FormLabel>
                        <div className="col-span-3">
                          <FormControl>
                            <Input
                              type="number"
                              step="0.01"
                              min="0"
                              placeholder="Enter price"
                              value={field.value || ""}
                              onChange={(e) => {
                                const value = e.target.value
                                if (value === "") {
                                  field.onChange(undefined)
                                } else {
                                  const parsed = Number.parseFloat(value)
                                  if (!isNaN(parsed)) {
                                    field.onChange(parsed)
                                  }
                                }
                              }}

                            />
                          </FormControl>
                          <FormMessage />
                        </div>
                      </FormItem>
                    )}
                  />

                  {/* QUANTITY */}
                  <FormField
                    control={productForm.control}
                    name="quantity"
                    render={({ field }) => (
                      <FormItem className="grid grid-cols-4 items-center gap-4">
                        <FormLabel className="text-right  dark:!text-white dark:bg-gray-dark">
                          Quantity <span className="text-red-500">*</span>
                        </FormLabel>
                        <div className="col-span-3">
                          <FormControl>
                            <Input
                              type="number"
                              min="1"
                              placeholder="Enter quantity"
                              value={field.value || ""}
                              onChange={(e) => {
                                const value = e.target.value
                                if (value === "") {
                                  field.onChange(undefined)
                                } else {
                                  const parsed = Number.parseInt(value)
                                  if (!isNaN(parsed)) {
                                    field.onChange(parsed)
                                  }
                                }
                              }}

                            />
                          </FormControl>
                          <FormMessage />
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

        {/* Edit Product Dialog */}
        <Dialog open={openEdit} onOpenChange={handleEditDialogClose}>
          <DialogContent className="bg-white dark:!text-white dark:bg-gray-dark max-w-2xl">
            <DialogHeader>
              <DialogTitle className="text-dark font-bold text-center">Edit Product</DialogTitle>
            </DialogHeader>

            <Form {...editProductForm}>
              <form onSubmit={editProductForm.handleSubmit(handleUpdateProduct)} className="space-y-6">
                <div className="grid gap-4 py-4">
                  {/* PRODUCT NAME */}
                  <FormField
                    control={editProductForm.control}
                    name="product_name"
                    render={({ field }) => (
                      <FormItem className="grid grid-cols-4 items-center gap-4">
                        <FormLabel className="text-right ">
                          Name <span className="text-red-500">*</span>
                        </FormLabel>
                        <div className="col-span-3">
                          <FormControl>
                            <FormControl>
                              <Input
                                {...field}
                                placeholder="Enter product name"
                                onChange={(e) => {
                                  const value = e.target.value;
                                  const capitalized =
                                    value.charAt(0).toUpperCase() + value.slice(1);
                                  field.onChange(capitalized);
                                }}
                              />
                            </FormControl>

                          </FormControl>
                          <FormMessage />
                        </div>
                      </FormItem>
                    )}
                  />

                  {/* UNIT */}
                  <FormField
                    control={editProductForm.control}
                    name="unit"
                    render={({ field }) => (
                      <FormItem className="grid grid-cols-4 items-center gap-4">
                        <FormLabel className="text-right ">
                          Unit <span className="text-red-500">*</span>
                        </FormLabel>
                        <div className="col-span-3">
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger className="text-dark">
                                <SelectValue placeholder="Select unit" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent className="bg-white text-dark">
                              {units.map((unit) => (
                                <SelectItem key={unit.id} value={unit.name}>
                                  {unit.name.charAt(0).toUpperCase() + unit.name.slice(1)}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </div>
                      </FormItem>
                    )}
                  />

                  {/* PRICE */}
                  <FormField
                    control={editProductForm.control}
                    name="price"
                    render={({ field }) => (
                      <FormItem className="grid grid-cols-4 items-center gap-4">
                        <FormLabel className="text-right ">
                          Price <span className="text-red-500">*</span>
                        </FormLabel>
                        <div className="col-span-3">
                          <FormControl>
                            <Input
                              type="number"
                              step="0.01"
                              min="0"
                              placeholder="Enter price"
                              value={field.value || ""}
                              onChange={(e) => {
                                const value = e.target.value
                                if (value === "") {
                                  field.onChange(undefined)
                                } else {
                                  const parsed = Number.parseFloat(value)
                                  if (!isNaN(parsed)) {
                                    field.onChange(parsed)
                                  }
                                }
                              }}

                            />
                          </FormControl>
                          <FormMessage />
                        </div>
                      </FormItem>
                    )}
                  />

                  {/* QUANTITY */}
                  <FormField
                    control={editProductForm.control}
                    name="quantity"
                    render={({ field }) => (
                      <FormItem className="grid grid-cols-4 items-center gap-4">
                        <FormLabel className="text-right ">
                          Quantity <span className="text-red-500">*</span>
                        </FormLabel>
                        <div className="col-span-3">
                          <FormControl>
                            <Input
                              type="number"
                              min="1"
                              placeholder="Enter quantity"
                              value={field.value || ""}
                              onChange={(e) => {
                                const value = e.target.value
                                if (value === "") {
                                  field.onChange(undefined)
                                } else {
                                  const parsed = Number.parseInt(value)
                                  if (!isNaN(parsed)) {
                                    field.onChange(parsed)
                                  }
                                }
                              }}

                            />
                          </FormControl>
                          <FormMessage />
                        </div>
                      </FormItem>
                    )}
                  />
                </div>

                <DialogFooter className="flex flex-col sm:flex-row-reverse sm:justify-center gap-2">
                  <Button type="button" variant="outline" onClick={handleEditDialogClose} disabled={isLoading}>
                    Cancel
                  </Button>
                  <Button type="submit" className="text-white" disabled={isLoading}>
                    {isLoading ? (
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
        <div className="flex items-center text-gray-700 dark:!text-white justify-end p-4">
          <div className="flex items-center text-gray-700 dark:!text-white gap-4">
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
                <SelectValue className="text-gray-700 dark:!text-white" />
              </SelectTrigger>
              <SelectContent className="text-gray-700 font-semibold dark:!text-white dark:bg-gray-dark bg-white shadow-md border rounded-md">
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
              className="font-bold dark:!text-white"
            >
              <ChevronLeft />
            </button>

            <button
              onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
              disabled={currentPage === totalPages}
              className="font-bold dark:!text-white"
            >
              <ChevronRight />
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
          <div>Product added successfully!</div>
          <DialogFooter>
            <Button className="w-full md:w-auto text-white mb-5 mr-2" onClick={() => setOpenAdd(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={openEditSuccess} onOpenChange={setOpenEditSuccess}>
        <DialogContent className="bg-white  dark:!text-white dark:bg-gray-dark">
          <DialogHeader>
            <DialogTitle>Success</DialogTitle>
          </DialogHeader>
          <div>Product Edited successfully!</div>
          <DialogFooter>
            <Button className="w-full md:w-auto text-white mb-5 mr-2" onClick={() => setOpenEditSuccess(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
