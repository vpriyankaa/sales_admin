"use client"

import type React from "react"


import { useEffect, useState } from "react"
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Label } from "@/components/ui/label"
import { Card, CardContent } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { getTodayDateRange, formatForDateTimeLocal } from '@/utils/timeframe-extractor'
import { TextField } from '@mui/material';
import { getPurchaseList, changeOrderStatus, getVendors, getProducts } from "@/app/actions"
import { Button } from "@/components/ui/button"
import { DateRangePicker } from "@/components/date-range-picker"

interface FilterState {
  dateFrom: string
  dateTo: string
  vendor: string
  product: string
}

export function PurchaseSkeleton() {



  const { dateFrom, dateTo } = getTodayDateRange();

  const [vendors, setVendors] = useState<any[]>([])
  const [products, setProducts] = useState<any[]>([])



  const [data, setData] = useState<any[]>([])
  const [filteredData, setFilteredData] = useState<any[]>([])
  // Filter states
  const [filters, setFilters] = useState<FilterState>({

    dateFrom: dateFrom.toISOString(), // or dateFrom.toLocaleDateString(), etc.
    dateTo: dateTo.toISOString(),
    vendor: "",
    product: "",
  })


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

  const hasActiveFilters = Object.values(filters).some((value) => value !== "")
  const clearFilters = () => {
    setFilters({
      dateFrom: dateFrom.toISOString(),
      dateTo: dateTo.toISOString(),
      vendor: "",
      product: "",
    })
  }


  const handleFilterChange = (key: keyof FilterState, value: string) => {
    setFilters((prev) => ({
      ...prev,
      [key]: value,
    }))
  }

  return (
    <div className="rounded-[10px] bg-white text-#3b82f6 px-7.5 pb-4 pt-7.5 shadow-1 dark:bg-gray-dark dark:shadow-card">
      <div className="px-2 py-4 sm:px-4 sm:py-5 xl:px-8.5 text-left">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold text-dark dark:text-white">Purchase Reports</h2>
        </div>
      </div>


      <div className="mt-6">
        <Card className="mb-4 mx-2 sm:mx-4 xl:mx-8.5">


          <CardContent className="pt-6 pb-4">
            <div className="flex flex-wrap items-center gap-4">
              {/* Date Range Picker - Fixed width to match the screenshot */}
              <div className="w-full sm:w-[250px]">
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

              {/* Customer Filter - Fixed width to match the screenshot */}
              <div className="w-full sm:w-[200px]">
                <Select value={filters.vendor} onValueChange={(value) => handleFilterChange("vendor", value)}>
                  <SelectTrigger className="w-full h-[40px] text-sm font-medium border rounded px-3">
                    <SelectValue placeholder="Select Vendor" />
                  </SelectTrigger>
                  <SelectContent className="z-[999] text-gray-700 font-semibold bg-white shadow-md border rounded-md">
                    {vendors.map((c) => (
                      <SelectItem key={c.id} value={c.name}>
                        {c.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Product Filter - Fixed width to match the screenshot */}
              <div className="w-full sm:w-[200px]">
                <Select value={filters.product} onValueChange={(value) => handleFilterChange("product", value)}>
                  <SelectTrigger className="w-full h-[40px] text-sm font-medium border rounded px-3">
                    <SelectValue placeholder="Select Product" />
                  </SelectTrigger>
                  <SelectContent className="z-[999] text-gray-700 font-semibold bg-white shadow-md border rounded-md">
                    {products.map((p) => (
                      <SelectItem key={p.id} value={p.name}>
                        {p.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Clear Filters Button - Fixed width to match the screenshot */}
              <div className="w-full sm:w-auto sm:ml-auto">
                {hasActiveFilters && (
                  <Button
                    variant="outline"
                    onClick={clearFilters}
                    className="w-full sm:w-[150px] h-[40px] bg-blue-500 hover:bg-blue-600 text-white border-blue-500 hover:border-blue-600"
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
            <TableHead className="min-w-[120px] !text-left">Date</TableHead>
            <TableHead className="!text-left">Vendor Name</TableHead>
            <TableHead>Products</TableHead>
            <TableHead className="!text-right">Quantity</TableHead>
            <TableHead>Price</TableHead>
            <TableHead>Payment Status</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Action</TableHead>
          </TableRow>
        </TableHeader>

        <TableBody>
          {Array.from({ length: 10 }).map((_, i) => (
            <TableRow key={i} className="border-b border-gray-200 dark:border-gray-700">
              <TableCell className="!text-left">
                <Skeleton className="h-4 w-24" />
              </TableCell>
              <TableCell className="text-center">
                <Skeleton className="h-4 w-20" />
              </TableCell>
              <TableCell className="!text-right">
                <Skeleton className="h-4 w-20" />
              </TableCell>
              <TableCell className="!text-right">
                <Skeleton className="h-4 w-24" />
              </TableCell>
              <TableCell className="!text-right">
                <Skeleton className="h-4 w-24" />
              </TableCell>
              <TableCell className="!text-right">
                <Skeleton className="h-4 w-24" />
              </TableCell>
              <TableCell className="!text-right">
                <Skeleton className="h-4 w-24" />
              </TableCell >
              <TableCell className="!text-right">
                <Skeleton className="h-4 w-24" />
              </TableCell>

            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
