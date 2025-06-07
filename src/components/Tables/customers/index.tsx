"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { getCustomers, addCustomer, editCustomer } from "@/app/actions"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { CustomersSkeleton } from "./skeleton"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Loader2, Edit, Eye } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useRouter } from "next/navigation"
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from "@/components/ui/tooltip"
import { ChevronRight, ChevronLeft } from "lucide-react";
import { Customer } from "@/types/customer"

const customerFormSchema = z.object({
  name: z
    .string()
    .min(2, "Name must be at least 2 characters")
    .regex(/^[A-Za-z\s]+$/, "Name should contain only letters and spaces"),
  phone: z
    .string()
    .min(1, "Phone is required")
    .regex(/^\d{10}$/, "Phone must be a 10-digit number"),
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

export function Customers() {
  const [data, setData] = useState<Customer[]>([])
  const [loading, setLoading] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [itemsPerPageInput, setItemsPerPageInput] = useState("10")
  const [isAddingCustomer, setIsAddingCustomer] = useState(false)
  const [openAdd, setOpenAdd] = useState(false)
  const [openEdit, setOpenEdit] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const [isEditingCustomer, setIsEditingCustomer] = useState(false)
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null)
  const router = useRouter()


  const userStr = sessionStorage.getItem("user");

  const user = userStr ? JSON.parse(userStr) : null;


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

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true)
      try {
        const res = await getCustomers();
        console.log("hiTamil Fetched customers:", res)
        setData(res)
      } catch (error) {
        console.error("hiTamil Failed to fetch customers:", error)
      } finally {
        setLoading(false)
      }
    }
    fetchData();
  }, []);

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

  const totalPages = Math.ceil(data.length / itemsPerPage)
  const paginatedData = data.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)

  const handleAddCustomer = async (formData: CustomerFormData) => {
    setIsLoading(true)

    try {
      const customerData = {
        name: formData.name,
        phone: formData.phone,
        aadhaar: formData.aadhaar?.trim() || "",
        address: formData.address?.trim() || "",
      }

      const newCustomerId = await addCustomer(customerData)

      if (newCustomerId) {
        setOpenAdd(true)
        setIsAddingCustomer(false)

        // Reset form
        customerForm.reset()

        // Refresh customers list
        const res = await getCustomers()
        setData(res)
      }
    } catch (err) {
      console.error(err)
      // Set form error for phone field if it already exists
      customerForm.setError("phone", {
        type: "manual",
        message: "Phone number already exists",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleeditCustomer = async (formData: CustomerFormData) => {
    if (!editingCustomer) return

    setIsLoading(true)

    try {
      const customerData = {
        id: editingCustomer.id,
        name: formData.name,
        phone: Number(formData.phone),
        aadhaar: formData.aadhaar?.trim() || "",
        address: formData.address?.trim() || "",
        user: user?.id
      }


      const edit = await editCustomer(customerData)
      if (edit) {
        setOpenEdit(true);

      }
      setIsEditingCustomer(false)
      setEditingCustomer(null)

      // Reset form
      customerForm.reset()

      // Refresh customers list
      const res = await getCustomers()
      setData(res)
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

  const handleEditCustomer = (customer: Customer) => {
    setEditingCustomer(customer)
    setIsEditingCustomer(true)

    // Pre-populate form with customer data
    customerForm.reset({
      name: customer.name,
      phone: customer.phone?.toString() || "",
      aadhaar: customer.aadhaar || "",
      address: customer.address || "",
    })
  }

  const handleDialogClose = () => {
    setIsAddingCustomer(false)
    setIsEditingCustomer(false)
    setEditingCustomer(null)
    customerForm.reset()
  }

  if (loading) {
    return <CustomersSkeleton />
  }

  return (
    <>
      {/* {paginatedData.length === 0 && data.length === 0 ? (
        <div className="flex items-center justify-center h-full">
          <div className="text-gray-500 dark:text-gray-400 text-lg">No customers found</div>
          <Button type="button" className="ml-4 text-white" onClick={() => setIsAddingCustomer(true)}>
            Add Customer
          </Button>
        </div>
      ) : ( */}
        <>
          <div className="rounded-[10px] bg-white shadow-1 dark:bg-gray-dark dark:shadow-card">
            <div className="px-6 py-4 sm:px-6 sm:py-5 xl:px-8.5">
              <h2 className="text-2xl font-bold text-dark dark:!text-white">Customers</h2>
            </div>

            <div className="flex justify-end mb-5 mr-2">
              <Button type="button" className="text-white" onClick={() => setIsAddingCustomer(true)}>
                Add Customer
              </Button>
            </div>

            <Table>
              <TableHeader>
                <TableRow className="border-none uppercase [&>th]:text-center">
                  <TableHead className="!text-left pl-6">Customer Name</TableHead>
                  <TableHead className="!text-left">Phone</TableHead>
                  <TableHead className="!text-left">Aadhaar</TableHead>
                  <TableHead className="!text-left">Address</TableHead>
                  {/* <TableHead className="!text-center">Actions</TableHead> */}
                </TableRow>
              </TableHeader>

              <TableBody>

                {paginatedData.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-7 text-md font-semibold text-dark-2 dark:text-white">
                      No Customers found
                    </TableCell>
                  </TableRow>
                ) : (
                  paginatedData.map((customer) => (
                    <TableRow className="text-left text-base font-medium text-dark dark:!text-white group hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors" key={customer.id}>
                      <TableCell className="pl-5 sm:pl-6 xl:pl-7.5">{customer.name}</TableCell>
                      <TableCell>{customer.phone}</TableCell>
                      <TableCell>{customer.aadhaar || "-"}</TableCell>
                      <TableCell className="max-w-xs truncate">{customer.address || "-"}</TableCell>

                      <TableCell>
                        <div className="flex items-center justify-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>

                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => handleEditCustomer(customer)}
                                  className="h-8 w-8 hover:bg-blue-200"
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
                                  onClick={() => router.push(`/customer-log/${customer.id}`)}
                                  className="h-8 w-8 hover:bg-blue-200"
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

            <div className="flex items-center text-gray-700 dark:!text-white justify-end p-4">
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
                  <SelectTrigger className="w-24 h-8 text-gray-700 dark:!text-white  text-center">
                    <SelectValue className="text-gray-700" />
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

          {/* Add Customer Dialog */}
          <Dialog open={isAddingCustomer || isEditingCustomer} onOpenChange={handleDialogClose}>
            <DialogContent className="bg-white dark:!text-white dark:bg-gray-dark max-w-2xl">
              <DialogHeader>
                <DialogTitle className="text-center text-dark dark:!text-white dark:bg-gray-dark font-bold">
                  {isEditingCustomer ? "Edit Customer" : "Add New Customer"}
                </DialogTitle>
              </DialogHeader>

              <Form {...customerForm}>
                <form
                  onSubmit={customerForm.handleSubmit(isEditingCustomer ? handleeditCustomer : handleAddCustomer)}
                  className="space-y-6"
                >
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
                                maxLength={20}
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
                          {isEditingCustomer ? "Update" : "Save"}
                        </>
                      ) : isEditingCustomer ? (
                        "Update"
                      ) : (
                        "Save"
                      )}
                    </Button>
                  </DialogFooter>
                </form>
              </Form>
            </DialogContent>
          </Dialog>

          {/* Success Dialog */}
          <Dialog open={openAdd} onOpenChange={setOpenAdd}>
            <DialogContent className="bg-white text-black dark:!text-white dark:bg-gray-dark">
              <DialogHeader>
                <DialogTitle>Success</DialogTitle>
              </DialogHeader>
              <div>Customer added successfully!</div>
              <DialogFooter>
                <Button className="w-full md:w-auto text-white mb-5 mr-2" onClick={() => setOpenAdd(false)}>
                  Close
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          <Dialog open={openEdit} onOpenChange={setOpenEdit}>
            <DialogContent className="bg-white text-black dark:!text-white dark:bg-gray-dark">
              <DialogHeader>
                <DialogTitle>Success</DialogTitle>
              </DialogHeader>
              <div>Customer Edited successfully!</div>
              <DialogFooter>
                <Button className="w-full md:w-auto text-white mb-5 mr-2" onClick={() => setOpenEdit(false)}>
                  Close
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

        </>
      {/* )} */}
    </>
  )
}
