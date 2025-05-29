"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { getCustomers, addCustomer } from "@/app/actions"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { CustomersSkeleton } from "./skeleton"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Loader2 } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface Customer {
  id: string
  name: string
  phone: string
  adhaar?: string
  address?: string
}

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
  const [isLoading, setIsLoading] = useState(false)
  const [itemsPerPage, setItemsPerPage] = useState(10)
  const [itemsPerPageInput, setItemsPerPageInput] = useState("10")
  const [isAddingCustomer, setIsAddingCustomer] = useState(false)
  const [openAdd, setOpenAdd] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)

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

  useEffect(() => {
    const fetchData = async () => {
      const res = await getCustomers()
      setData(res)
    }
    fetchData()
  }, [])

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
        adhaar: formData.aadhaar?.trim() || "",
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

  const handleDialogClose = () => {
    setIsAddingCustomer(false)
    customerForm.reset()
  }

  return (
    <>
      {paginatedData.length === 0 && data.length === 0 ? (
        <CustomersSkeleton />
      ) : (
        <>
          <div className="rounded-[10px] bg-white shadow-1 dark:bg-gray-dark dark:shadow-card">
            <div className="px-6 py-4 sm:px-6 sm:py-5 xl:px-8.5">
              <h2 className="text-2xl font-bold text-dark dark:text-white">Customers</h2>
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
                </TableRow>
              </TableHeader>

              <TableBody>
                {paginatedData.map((customer) => (
                  <TableRow className="text-base font-medium text-dark dark:text-white" key={customer.id}>
                    <TableCell className="pl-5 sm:pl-6 xl:pl-7.5">{customer.name}</TableCell>
                    <TableCell>{customer.phone}</TableCell>
                    <TableCell>{customer.adhaar || "-"}</TableCell>
                    <TableCell className="max-w-xs truncate">{customer.address || "-"}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>

          <div className="flex items-center text-gray-700 justify-end p-4">
            <div className="flex items-center text-gray-700 gap-4">
              <span className="text-md text-gray-700 dark:text-gray-300">Items per page:</span>
              <Select
                value={itemsPerPage.toString()}
                onValueChange={(value) => {
                  const num = parseInt(value)
                  setItemsPerPage(num)
                  setCurrentPage(1)
                }}

              >
                <SelectTrigger className="w-24 h-8 text-gray-700 text-center">
                  <SelectValue className="text-gray-700" />
                </SelectTrigger>
                <SelectContent className="text-gray-700 font-semibold bg-white shadow-md border rounded-md">
                  {[10, 20, 30, 40, 50].map((n) => (
                    <SelectItem key={n} value={n.toString()}>{n}</SelectItem>
                  ))}
                </SelectContent>
              </Select>



              <span className="text-md text-gray-700 dark:text-gray-300">
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

          {/* Add Customer Dialog */}
          <Dialog open={isAddingCustomer} onOpenChange={handleDialogClose}>
            <DialogContent className="bg-white dark:bg-white max-w-2xl">
              <DialogHeader>
                <DialogTitle className="text-center text-dark font-bold">Add New Customer</DialogTitle>
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
                          <FormLabel className="text-right text-black">
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
                          <FormLabel className="text-right text-black">
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
                      control={customerForm.control}
                      name="address"
                      render={({ field }) => (
                        <FormItem className="grid grid-cols-4 items-center gap-4">
                          <FormLabel className="text-right text-black">Address</FormLabel>
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

          {/* Success Dialog */}
          <Dialog open={openAdd} onOpenChange={setOpenAdd}>
            <DialogContent className="bg-white text-black">
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
        </>
      )}
    </>
  )
}
