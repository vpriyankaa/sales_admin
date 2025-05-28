"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { getProducts, addVendor, getVendors } from "@/app/actions"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { VendorsSkeleton } from "./skeleton"
import { Badge } from "@/components/ui/badge"

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
  products: VendorProduct[]
}

export function Vendors() {
  const [vendors, setVendors] = useState<Vendor[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)

  const [open, setOpen] = useState(false)
  const [openAdd, setOpenAdd] = useState(false)

  const [newVendor, setNewVendor] = useState({
    name: "",
    phone: "",
    selectedProducts: [] as number[],
  })

  const [productDetails, setProductDetails] = useState<{ [key: number]: { quantity: number; price: number } }>({})

  const [formErrors, setFormErrors] = useState<{
    name?: string
    phone?: string
    products?: string
  }>({})

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



  console.log("vendors",vendors);

  const handleProductSelection = (productId: number, checked: boolean) => {
    if (checked) {
      setNewVendor((prev) => ({
        ...prev,
        selectedProducts: [...prev.selectedProducts, productId],
      }))
      // Initialize with default values
      setProductDetails((prev) => ({
        ...prev,
        [productId]: { quantity: 1, price: 0 },
      }))
    } else {
      setNewVendor((prev) => ({
        ...prev,
        selectedProducts: prev.selectedProducts.filter((id) => id !== productId),
      }))
      setProductDetails((prev) => {
        const newDetails = { ...prev }
        delete newDetails[productId]
        return newDetails
      })
    }
  }

  const handleProductDetailChange = (productId: number, field: "quantity" | "price", value: number) => {
    setProductDetails((prev) => ({
      ...prev,
      [productId]: {
        ...prev[productId],
        [field]: value,
      },
    }))
  }

  const handleAddVendor = async () => {
    const errors: typeof formErrors = {}

    if (!newVendor.name.trim()) {
      errors.name = "Vendor name is required"
    }

    if (!newVendor.phone.trim()) {
      errors.phone = "Phone number is required"
    }

    if (newVendor.selectedProducts.length === 0) {
      errors.products = "At least one product must be selected"
    }

    // Validate product details
    // for (const productId of newVendor.selectedProducts) {
    //   const details = productDetails[productId]
    //   if (!details || details.quantity <= 0 || details.price <= 0) {
    //     errors.products = "All selected products must have valid quantity and price"
    //     break
    //   }
    // }

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors)
      return
    }

    try {
      // Prepare products array
      const vendorProducts: VendorProduct[] = newVendor.selectedProducts.map((productId) => {
        const product = products.find((p) => p.id === productId)
        const details = productDetails[productId]
        return {
          product_id: productId,
          product_name: product?.name || "",
       
        }
      })

      

      const vendorData = {
      name: newVendor.name,
      phone: Number.parseInt(newVendor.phone),
      products: vendorProducts.map((product) => ({
        product_id: String(product.product_id),
        product_name: product.product_name,
       
      })),
    };

      await addVendor(vendorData)

      setOpen(false)
      setOpenAdd(true)

      // Reset form
      setFormErrors({})
      setNewVendor({
        name: "",
        phone: "",
        selectedProducts: [],
      })
      setProductDetails({})

      // Refresh vendors list
      const refreshedVendors = await getVendors()
      setVendors(refreshedVendors)
    } catch (err) {
      console.error("Error adding vendor:", err)
    }
  }

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
          <h2 className="text-2xl font-bold text-dark dark:text-white">Vendors</h2>
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
              <TableHead className="!text-left p-6">Products</TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            {paginatedData.map((vendor) => (
              <TableRow className="text-base font-medium text-dark dark:text-white" key={vendor.id}>
                <TableCell className="pl-5 sm:pl-6 xl:pl-7.5">{vendor.name}</TableCell>
                <TableCell>{vendor.phone}</TableCell>
                <TableCell>
                  <div className="flex justify-start flex-wrap gap-1">
                    {vendor.products?.map((product, index) => (
                      <Badge key={index} variant="secondary" className="text-md font-semibold">
                        {product.product_name}
                      </Badge>
                    ))}
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>

        {/* Add Vendor Dialog */}
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogContent className="bg-white dark:bg-white max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-dark font-bold text-center">Add New Vendor</DialogTitle>
            </DialogHeader>

            <div className="grid gap-4 py-4">
              {/* Vendor Name */}
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="vendor_name" className="text-right text-dark">
                  Name <span className="text-red-500">*</span>
                </Label>
                <div className="col-span-3 space-y-1 text-dark">
                  <Input
                    id="vendor_name"
                    value={newVendor.name}
                    onChange={(e) => {
                      setNewVendor({ ...newVendor, name: e.target.value })
                      if (formErrors.name) {
                        setFormErrors((prev) => ({ ...prev, name: undefined }))
                      }
                    }}
                    className={formErrors.name ? "border-red-500" : ""}
                  />
                  {formErrors.name && <p className="text-sm text-red-500">{formErrors.name}</p>}
                </div>
              </div>

              {/* Phone */}
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="vendor_phone" className="text-right text-dark">
                  Phone <span className="text-red-500">*</span>
                </Label>
                <div className="col-span-3 space-y-1 text-dark">
                  <Input
                    id="vendor_phone"
                    type="tel"
                    value={newVendor.phone}
                    onChange={(e) => {
                      setNewVendor({ ...newVendor, phone: e.target.value })
                      if (formErrors.phone) {
                        setFormErrors((prev) => ({ ...prev, phone: undefined }))
                      }
                    }}
                    className={formErrors.phone ? "border-red-500" : ""}
                  />
                  {formErrors.phone && <p className="text-sm text-red-500">{formErrors.phone}</p>}
                </div>
              </div>

              {/* Products Selection */}
              <div className="grid grid-cols-4 items-start gap-4">
                <Label className="text-right text-dark mt-2">
                  Products <span className="text-red-500">*</span>
                </Label>
                <div className="col-span-3 space-y-3">
                  <div className="max-h-60 overflow-y-auto border rounded-md p-3 space-y-3">
                    {products.map((product) => (
                      <div key={product.id} className="space-y-2">
                        <div className="flex items-center space-x-2">
                          <Checkbox
                            id={`product-${product.id}`}
                            checked={newVendor.selectedProducts.includes(product.id)}
                            onCheckedChange={(checked) => handleProductSelection(product.id, checked as boolean)}
                          />
                          <Label htmlFor={`product-${product.id}`} className="text-dark font-medium">
                            {product.name} ({product.unit})
                          </Label>
                        </div>

                        {/* {newVendor.selectedProducts.includes(product.id) && (
                          <div className="ml-6 grid grid-cols-2 gap-2">
                            <div>
                              <Label className="text-xs text-gray-600">Quantity</Label>
                              <Input
                                type="number"
                                min="1"
                                value={productDetails[product.id]?.quantity || 1}
                                onChange={(e) =>
                                  handleProductDetailChange(
                                    product.id,
                                    "quantity",
                                    Number.parseInt(e.target.value) || 1,
                                  )
                                }
                                className="h-8"
                              />
                            </div>
                            <div>
                              <Label className="text-xs text-gray-600">Price</Label>
                              <Input
                                type="number"
                                min="0"
                                step="0.01"
                                value={productDetails[product.id]?.price || 0}
                                onChange={(e) =>
                                  handleProductDetailChange(product.id, "price", Number.parseFloat(e.target.value) || 0)
                                }
                                className="h-8"
                              />
                            </div>
                          </div>
                        )} */}
                      </div>
                    ))}
                  </div>
                  {formErrors.products && <p className="text-sm text-red-500">{formErrors.products}</p>}
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button
                className="bg-gray-500 text-white"
                onClick={() => {
                  setOpen(false)
                  setFormErrors({})
                  setNewVendor({ name: "", phone: "", selectedProducts: [] })
                  setProductDetails({})
                }}
              >
                Cancel
              </Button>
              <Button onClick={handleAddVendor}>
                Save
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Pagination */}
        <div className="flex items-center justify-end gap-4 p-4">
          <span className="text-sm font-bold text-gray-700 dark:text-gray-300">Items per page:</span>
          <Input
            type="number"
            min={1}
            value={itemsPerPageInput}
            onChange={handleItemsPerPageChange}
            onBlur={handleItemsPerPageSubmit}
            onKeyDown={(e) => e.key === "Enter" && handleItemsPerPageSubmit()}
            className="h-8 w-16 font-bold text-center"
          />
          <button
            onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
            disabled={currentPage === 1}
            className="px-3 py-1 rounded text-lg font-bold bg-gray-200 dark:bg-gray-700 disabled:opacity-50"
          >
            &lt;
          </button>

          <span className="text-sm font-bold text-gray-700 dark:text-gray-300">
            Page {currentPage} of {totalPages}
          </span>

          <button
            onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
            disabled={currentPage === totalPages}
            className="px-3 py-1 rounded text-lg font-bold bg-gray-200 dark:bg-gray-700 disabled:opacity-50"
          >
            &gt;
          </button>
        </div>
      </div>

      {/* Success Dialog */}
      {openAdd && (
        <Dialog open={openAdd} onOpenChange={setOpenAdd}>
          <DialogContent className="bg-white">
            <DialogHeader>
              <DialogTitle>Success</DialogTitle>
            </DialogHeader>
            <div>Vendor added successfully!</div>
            <DialogFooter>
              <Button className="w-full md:w-auto text-white mb-5 mr-2" onClick={() => setOpenAdd(false)}>
                Close
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </>
  )
}
