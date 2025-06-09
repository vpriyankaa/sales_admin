"use client"

import type React from "react"
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useEffect, useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { getTodayDateRange, formatForDateTimeLocal } from '@/utils/timeframe-extractor'
import { getReports, changeOrderStatus, getCustomers, getProducts } from "@/app/actions"
import { Button } from "@/components/ui/button"
import { DateRangePicker } from "@/components/date-range-picker"

interface FilterState {
  dateFrom: string
  dateTo: string
  customer: string
  product: string
}

export function OrdersSkeleton() {

  const { dateFrom, dateTo } = getTodayDateRange();
  const [data, setData] = useState<any[]>([])
  // Filter states
  const [filters, setFilters] = useState<FilterState>({
    dateFrom: dateFrom.toISOString(), // or dateFrom.toLocaleDateString(), etc.
    dateTo: dateTo.toISOString(),
    customer: "",
    product: "",
  })
  const [showFilters, setShowFilters] = useState(false)
  const [customers, setCustomers] = useState<any[]>([])
  const [products, setProducts] = useState<any[]>([])
  const [filteredData, setFilteredData] = useState<any[]>([])

  useEffect(() => {
    async function fetchData() {
      const reports = await getReports()
      const uniqueCustomers = await getCustomers()
      const uniqueProducts = await getProducts()

      // console.log("uniqueCustomers", uniqueCustomers);
      // console.log("uniqueProducts", uniqueProducts);



      setCustomers(uniqueCustomers)
      setData(reports)
      setProducts(uniqueProducts)
      setFilteredData(reports)
    }
    fetchData()
  }, [])
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
      customer: "",
      product: "",
    })
  }

  const hasActiveFilters = Object.values(filters).some((value) => value !== "")

  return (
    <div className="rounded-[10px] bg-white text-#3b82f6 px-7.5 pb-4 pt-7.5 shadow-1 dark:bg-gray-dark dark:shadow-card">
      <div className="px-2 py-4 sm:px-4 sm:py-5 xl:px-8.5 text-left">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold text-dark dark:!text-white">Sales Reports</h2>
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
     
                       {/* Customer Filter */}
                       <div className="flex-1 min-w-0">
                         <Select value={filters.customer} onValueChange={(value) => handleFilterChange("customer", value)}>
                           <SelectTrigger className="w-full h-[40px] font-medium border rounded-md px-3">
                             <SelectValue placeholder="Select Customer" />
                           </SelectTrigger>
                           <SelectContent className="z-[999] text-gray-700 text-md font-semibold bg-white dark:!text-white dark:bg-gray-dark shadow-md border rounded-md">
                             {customers.map((c) => (
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
                           <SelectContent className="z-[999] text-gray-700 font-semibold bg-white dark:!text-white dark:bg-gray-dark shadow-md border rounded-md">
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
                           className="w-full sm:w-auto h-10 px-6 bg-primary text-white hover:bg-primary"
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
            <TableHead className="!text-left min-w-[120px]">Date</TableHead>
            <TableHead className="!text-left">Customer Name</TableHead>
            <TableHead>Products</TableHead>
            <TableHead>Quantity</TableHead>
            <TableHead>Price</TableHead>
            <TableHead>Payment Status</TableHead>
            <TableHead>Status</TableHead>
           
          </TableRow>
        </TableHeader>

        <TableBody>
          {Array.from({ length: 10 }).map((_, i) => (
            <TableRow key={i} className="border-b border-gray-200 dark:border-gray-700">
              <TableCell className="!text-left">
                <Skeleton className="h-4 w-20" />
              </TableCell>
              <TableCell className="!text-left">
                <Skeleton className="h-4 w-20" />
              </TableCell>
              <TableCell className="!text-right">
                <Skeleton className="h-4 w-20" />
              </TableCell>
              <TableCell className="!text-right">
                <Skeleton className="h-4 w-24" />
              </TableCell>
              <TableCell>
                <Skeleton className="h-4 w-24" />
              </TableCell>
              <TableCell className="!text-right">
                <Skeleton className="h-4 w-24" />
              </TableCell>
              <TableCell className="!text-right">
                <Skeleton className="h-4 w-24" />
              </TableCell >
             
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
