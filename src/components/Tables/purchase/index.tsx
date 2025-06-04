"use client"

import type React from "react"

import { Edit, Eye } from "lucide-react"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { getPurchaseList, changeOrderStatus, getVendors, getProducts } from "@/app/actions"
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from "@/components/ui/tooltip"
import { PurchaseSkeleton } from "./skeleton"
import { TextField } from '@mui/material';
import { getTodayDateRange, formatForDateTimeLocal } from '@/utils/timeframe-extractor'
import { DateRangePicker } from "@/components/date-range-picker"
import { ChevronRight, ChevronLeft } from "lucide-react";

type OrderItem = {
  product_name: string
  quantity: number
}

interface Order {
  id: number
  date: string
  customer_name: string
  items: OrderItem[]
  total_price: number
  payment_status: string
  status: string
}

interface FilterState {
  dateFrom: string
  dateTo: string
  vendor: string
  product: string
}

export function Purchase({ className }: { className?: string }) {
  const router = useRouter()

  const [data, setData] = useState<any[]>([])
  const [filteredData, setFilteredData] = useState<any[]>([])
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(10)
  const [vendors, setVendors] = useState<any[]>([])
  const [products, setProducts] = useState<any[]>([])


  const { dateFrom, dateTo } = getTodayDateRange();



  // Filter states
  const [filters, setFilters] = useState<FilterState>({

    dateFrom: dateFrom.toISOString(), // or dateFrom.toLocaleDateString(), etc.
    dateTo: dateTo.toISOString(),
    vendor: "",
    product: "",
  })


  // console.log("filters", filters);
  // const [showFilters, setShowFilters] = useState(false)

  // State for status change modal
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedOrder, setSelectedOrder] = useState<any>(null)
  const [selectedStatus, setSelectedStatus] = useState("Cancel")

  useEffect(() => {
    async function fetchData() {
      const reports = await getPurchaseList()

      const uniqueCustomers = await getVendors()
      const uniqueProducts = await getProducts()

      // console.log("uniqueCustomers", uniqueCustomers);
      // console.log("uniqueProducts", uniqueProducts);

      setVendors(uniqueCustomers)
      setProducts(uniqueProducts)
      setData(reports)
      setFilteredData(reports)

    }
    fetchData()
  }, [])

  // Filter logic
  useEffect(() => {
    let filtered = [...data]

    // Date filter
    if (filters.dateFrom) {
      filtered = filtered.filter((order) => new Date(order.date) >= new Date(filters.dateFrom))
    }
    if (filters.dateTo) {
      filtered = filtered.filter((order) => new Date(order.date) <= new Date(filters.dateTo))
    }

    // vendor filter
    if (filters.vendor && filters.vendor !== "all") {
      filtered = filtered.filter((order) => order.vendor_name.includes(filters.vendor))
    }

    // Product filter
    if (filters.product && filters.product !== "all") {
      filtered = filtered.filter((order) =>
        order.items.some((item: OrderItem) => item.product_name.includes(filters.product)),
      )
    }

    setFilteredData(filtered)
    setCurrentPage(1)
  }, [filters, data])

  const totalPages = Math.ceil(filteredData.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage

  const currentData = filteredData.slice(startIndex, startIndex + itemsPerPage)

  const [openOrderItems, setOpenOrderItems] = useState<null | any[]>(null)

  const [openAdd, setOpenAdd] = useState(false)


  // console.log("currentData", currentData);

  const openStatusModal = (order: any) => {
    setSelectedOrder(order)
    setSelectedStatus(order.payment_status)
    setIsModalOpen(true)
  }

  const updateOrderStatus = async (
    selectedOrder: { id: number },
    selectedStatus: string,
    setData: React.Dispatch<React.SetStateAction<any[]>>,
    setIsModalOpen: React.Dispatch<React.SetStateAction<boolean>>,
  ) => {
    if (!selectedOrder || !selectedStatus) return

    const statusMap: Record<string, string> = {
      Cancel: "cancelled",
      Trash: "trashed",
    }

    const newStatus = statusMap[selectedStatus] ?? selectedStatus.toLowerCase()

    setData((prev) => prev.map((order) => (order.id === selectedOrder.id ? { ...order, status: newStatus } : order)))

    const orderStatus = await changeOrderStatus(selectedOrder.id, newStatus)

    if (orderStatus) {
      setIsModalOpen(false)
      setOpenAdd(true)
    }
  }

  const handleFilterChange = (key: keyof FilterState, value: string) => {
    setFilters((prev) => ({
      ...prev,
      [key]: value,
    }))
  }

  const clearFilters = () => {
    setFilters({
      dateFrom: dateFrom.toISOString(),
      dateTo: dateTo.toISOString(),
      vendor: "",
      product: "",
    })
  }



  const hasActiveFilters = Object.values(filters).some((value) => value !== "")

  const uniqueCustomers = [...new Set(data.map((order) => order.customer_name))].sort()
  const uniqueProducts = [
    ...new Set(data.flatMap((order) => order.items.map((item: OrderItem) => item.product_name))),
  ].sort()

  const statusOptions = ["Cancel", "Trash"]

  return (
    <>
      {data.length === 0 ? (
        <PurchaseSkeleton />
      ) : (
        <div className="rounded-[10px] bg-white shadow-1 dark:bg-gray-dark dark:shadow-card">
          <div className="px-2 py-4 sm:px-4 sm:py-5 xl:px-8.5 text-left">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold text-dark dark:!text-white">Purchase Reports</h2>
            </div>
          </div>



          <div className="mt-6 dark:!text-white">
            <Card className="mb-4 mx-2 sm:mx-4 xl:mx-8.5">
              <CardContent className="pt-6 pb-4">
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
                  {/* Date Range Picker */}
                  <div className="flex-2 min-w-0">
                    <DateRangePicker
                      initialDateFrom={filters.dateFrom}
                      initialDateTo={filters.dateTo}
                      onChange={(range) => {
                        if (range.dateFrom !== filters.dateFrom || range.dateTo !== filters.dateTo) {
                          setFilters((prev) => ({
                            ...prev,
                            dateFrom: range.dateFrom,
                            dateTo: range.dateTo,
                          }))
                        }
                      }}
                    />
                  </div>

                  {/* Vendor Filter */}
                  <div className="flex-1 min-w-0">
                    <Select value={filters.vendor} onValueChange={(value) => handleFilterChange("vendor", value)}>
                      <SelectTrigger className="w-full h-[40px] font-medium border rounded-md px-3">
                        <SelectValue placeholder="Select Vendor" />
                      </SelectTrigger>
                      <SelectContent className="z-[999] text-gray-700 text-md font-semibold dark:!text-white dark:bg-gray-dark bg-white shadow-md border rounded-md">
                        {vendors.map((c) => (
                          <SelectItem className="text-md" key={c.id} value={c.name}>
                            {c.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Product Filter */}
                  <div className="flex-1 min-w-0">
                    <Select value={filters.product} onValueChange={(value) => handleFilterChange("product", value)}>
                      <SelectTrigger className="w-full h-[40px] text-sm font-medium border rounded-md px-3">
                        <SelectValue placeholder="Select Product" />
                      </SelectTrigger>
                      <SelectContent className="z-[999] text-gray-700 font-semibold dark:!text-white dark:bg-gray-dark bg-white shadow-md border rounded-md">
                        {products.map((p) => (
                          <SelectItem key={p.id} value={p.name}>
                            {p.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>




                  {/* Clear Filters Button */}
                  <div className="flex-shrink-0">
                    {hasActiveFilters && (
                      <Button
                        variant="outline"
                        onClick={clearFilters}
                        className="w-full sm:w-auto h-[40px] px-6 bg-blue-500 hover:bg-blue-600 text-white border-blue-500 hover:border-blue-600 whitespace-nowrap"
                      >
                        Clear Filters
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
          <Table>
            <TableHeader>
              <TableRow className="border-none uppercase [&>th]:text-center">
                <TableHead className="!text-left">Date</TableHead>
                <TableHead>Vendor Name</TableHead>
                <TableHead>Products</TableHead>
                <TableHead>Quantity</TableHead>
                <TableHead>Price</TableHead>
                <TableHead>Payment Status</TableHead>
                <TableHead>Status</TableHead>
                {/* <TableHead>Action</TableHead> */}
              </TableRow>
            </TableHeader>
            <TableBody>
              {currentData.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center text-lg py-8 text-gray-700  dark:!text-white">
                    {hasActiveFilters ? "No orders found" : "No orders found"}
                  </TableCell>
                </TableRow>
              ) : (
                currentData.map((order) => (
                  <TableRow className="text-center text-base font-medium text-dark dark:!text-white group hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors" key={order.id}>
                    <TableCell className="!text-left">
                      <div>
                        {new Date(order.date).toLocaleDateString("en-US", {
                          year: "numeric",
                          month: "short",
                          day: "numeric",
                        })}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="pl-5 sm:pl-6 xl:pl-7.5">{order.vendor_name}</div>
                    </TableCell>
                    <TableCell>
                      {order.items.slice(0, 2).map((item: OrderItem, index: number) => (
                        <div key={index}>{item.product_name}</div>
                      ))}

                      {order.items.length > 2 && (
                        <button
                          onClick={() => setOpenOrderItems(order.items)}
                          className="text-primary underline text-sm"
                        >
                          +{order.items.length - 2} more
                        </button>
                      )}
                    </TableCell>

                    <TableCell>
                      {order.items.slice(0, 2).map((item: OrderItem, index: number) => (
                        <div key={index}>{item.quantity}</div>
                      ))}
                      {order.items.length > 2 && <span className="invisible">+{order.items.length - 2} more</span>}
                    </TableCell>
                    <TableCell>Rs.{order.total_price}</TableCell>
                    <TableCell>
                      {order.payment_status?.trim() ? (
                        <div
                          className={`py-1 rounded-md text-sm font-semibold
                          ${order.payment_status === "paid"
                              ? "bg-green-200 text-green-600"
                              : order.payment_status === "partiallypaid"
                                ? "bg-yellow-200 text-yellow-900"
                                : order.payment_status === "credit"
                                  ? "bg-blue-200 text-primary"
                                  : "bg-gray-300 text-gray-700"
                            }`}
                        >
                          {order.payment_status === "paid"
                            ? "Paid"
                            : order.payment_status === "partiallypaid"
                              ? "Partially Paid"
                              : order.payment_status === "credit"
                                ? "Credit"
                                : order.payment_status}
                        </div>
                      ) : (
                        <span>-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {order.status?.trim() ? (
                        <div
                          className={`py-1 px-2 rounded-full text-sm font-semibold dark:!text-white
                          ${order.status === "created" || order.status === "completed"
                              ? "text-green-900 "
                              : order.status === "cancelled"
                                ? "text-orange-600"
                                : order.status === "trashed"
                                  ? "text-red-600"
                                  : "text-gray-700"
                            }`}
                        >
                          {order.status === "created"
                            ? "Created"
                            : order.status === "cancelled"
                              ? "Cancelled"
                              : order.status === "trashed"
                                ? "Trashed"
                                : order.status === "completed"
                                  ? "Completed"
                                  : order.status}
                        </div>
                      ) : (
                        <span>-</span>
                      )}
                    </TableCell>
                    {/* <TableCell>
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            {order.status !== "completed" && (
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => router.push(`/purchase/edit/${order.id}`)}
                                className="h-8 w-8"
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                            )}
                          </TooltipTrigger>
                          <TooltipContent className="bg-white font-medium text-secondary">
                            Edit order status
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>

                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => router.push(`/detail/${order.id}`)}
                              className="h-8 w-8"
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent className="bg-white font-medium text-secondary">View status</TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </TableCell> */}
                    <TableCell>
                      <div className="flex items-center justify-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              {order.status !== "completed" && (
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => router.push(`/purchase/edit/${order.id}`)}
                                  className="h-8 w-8 hover:bg-blue-200"
                                >
                                  <Edit className="h-4 w-4" />
                                </Button>
                              )}
                            </TooltipTrigger>
                            <TooltipContent className="bg-white font-medium text-secondary">
                              Edit purchase
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>

                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => router.push(`/detail/${order.id}`)}
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
                  const num = parseInt(value)
                  setItemsPerPage(num)
                  setCurrentPage(1)
                }}

              >
                <SelectTrigger className="w-24 h-8 text-gray-700 dark:!text-white text-center">
                  <SelectValue className="text-gray-700" />
                </SelectTrigger>
                <SelectContent className="text-gray-700 font-semibold bg-white dark:!text-white dark:bg-gray-dark shadow-md border rounded-md">
                  {[10, 20, 30, 40, 50].map((n) => (
                    <SelectItem key={n} value={n.toString()}>{n}</SelectItem>
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

          {/* Status Change Modal */}
          <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
            <DialogContent className="sm:max-w-md bg-white">
              <DialogHeader>
                <DialogTitle className="text-bold text-gray-700 dark:!text-white">Change Order Status</DialogTitle>
              </DialogHeader>

              <div className="py-4">
                <div className="space-y-4">
                  <Label htmlFor="status-select">Select Status</Label>
                  <select
                    id="status-select"
                    value={selectedStatus}
                    onChange={(e) => setSelectedStatus(e.target.value)}
                    className="block w-full rounded border px-3 py-2 focus:outline-none focus:ring focus:ring-blue-400"
                  >
                    {statusOptions.map((status) => (
                      <option key={status} value={status}>
                        {status}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <DialogFooter>
                <Button variant="outline" onClick={() => setIsModalOpen(false)}>
                  Cancel
                </Button>
                <Button
                  className="text-white"
                  onClick={() => updateOrderStatus(selectedOrder, selectedStatus, setData, setIsModalOpen)}
                >
                  Change Status
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          <Dialog open={!!openOrderItems} onOpenChange={() => setOpenOrderItems(null)}>
            <DialogContent className="bg-white">
              <DialogHeader>
                <DialogTitle className="font-bold text-gray-700">Ordered Items</DialogTitle>
              </DialogHeader>

              <div className="max-h-64 overflow-y-auto space-y-2 font-bold">
                {openOrderItems?.map((item: OrderItem, index: number) => (
                  <div key={index} className="flex justify-between border-b pb-1">
                    <div className="font-medium">{item.product_name}</div>
                    <div className="text-sm text-gray-600 dark:!text-white"> {item.quantity}</div>
                  </div>
                ))}
              </div>

              <DialogFooter>
                <button
                  onClick={() => setOpenOrderItems(null)}
                  className="px-4 py-2 rounded bg-blue-600 text-white hover:bg-blue-700"
                >
                  Close
                </button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {openAdd && (
            <Dialog open={openAdd} onOpenChange={setOpenAdd}>
              <DialogContent className="bg-white">
                <DialogHeader>
                  <DialogTitle>Success</DialogTitle>
                </DialogHeader>
                <div>Order Status Changed!</div>
                <DialogFooter>
                  <Button className="w-full md:w-auto text-white mb-5 mr-2" onClick={() => setOpenAdd(false)}>
                    Close
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          )}
        </div>
      )}
    </>
  )
}
