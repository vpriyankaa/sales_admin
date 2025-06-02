"use client"

import { useEffect, useState } from "react"
import { compactFormat } from "@/lib/format-number"
import { DateRangePicker } from "@/components/date-range-picker"
import { getTodayDateRange } from "@/utils/timeframe-extractor"
import { getReports, getPurchaseList } from "@/app/actions"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import { ShoppingCart, ShoppingBag, CreditCard, Wallet, ArrowUpRight, ArrowDownRight } from "lucide-react"

interface FilterState {
  dateFrom: string
  dateTo: string
}

interface ReportData {
  id: number
  created_at: string
  customer_id?: number
  customer_name?: string
  vendor_id?: number
  vendor_name?: string
  items: {
    product_id: number
    product_name: string
    quantity: number
    price: number
    unit: string
  }[]
  total_price: number
  status: string
  payment_method: string
  discount_type: string
  discount_value: number
  remaining_amount: number
  paid_amount: number
  remarks: string
  payment_status: string
  total_payable: number
  date: string
  type: "sale" | "purchase"
}

interface DashboardMetrics {
  totalSales: number
  totalPurchases: number
  totalSalePayments: number
  totalPurchasePayments: number
  totalSalePending: number
  totalPurchasePending: number
  saleCount: number
  purchaseCount: number
  salePaymentPercentage: number
  purchasePaymentPercentage: number
}

export function OverviewCardsGroup() {
  const { dateFrom, dateTo } = getTodayDateRange()
  const [saleData, setSaleData] = useState<ReportData[]>([])
  const [purchaseData, setPurchaseData] = useState<ReportData[]>([])
  const [metrics, setMetrics] = useState<DashboardMetrics>({
    totalSales: 0,
    totalPurchases: 0,
    totalSalePayments: 0,
    totalPurchasePayments: 0,
    totalSalePending: 0,
    totalPurchasePending: 0,
    saleCount: 0,
    purchaseCount: 0,
    salePaymentPercentage: 0,
    purchasePaymentPercentage: 0,
  })

  const [filters, setFilters] = useState<FilterState>({
    dateFrom: dateFrom.toISOString(),
    dateTo: dateTo.toISOString(),
  })

  useEffect(() => {
    async function fetchData() {
      const reports = await getReports()
      const purchaseReports = await getPurchaseList()

      setSaleData(reports)
      setPurchaseData(purchaseReports)
    }
    fetchData()
  }, [])

  useEffect(() => {
    // Filter data based on date range
    const filterByDateRange = (data: ReportData[]) => {
      return data.filter((item) => {
        const itemDate = new Date(item.date)
        const fromDate = new Date(filters.dateFrom)
        const toDate = new Date(filters.dateTo)
        return itemDate >= fromDate && itemDate <= toDate
      })
    }

    const filteredSales = filterByDateRange(saleData)
    const filteredPurchases = filterByDateRange(purchaseData)

    // Calculate metrics
    const totalSales = filteredSales.reduce((sum, item) => sum + item.total_payable, 0)
    const totalPurchases = filteredPurchases.reduce((sum, item) => sum + item.total_payable, 0)

    const totalSalePayments = filteredSales.reduce((sum, item) => sum + item.paid_amount, 0)
    const totalPurchasePayments = filteredPurchases.reduce((sum, item) => sum + item.paid_amount, 0)

    const totalSalePending = filteredSales.reduce((sum, item) => sum + item.remaining_amount, 0)
    const totalPurchasePending = filteredPurchases.reduce((sum, item) => sum + item.remaining_amount, 0)

    const saleCount = filteredSales.length
    const purchaseCount = filteredPurchases.length

    const salePaymentPercentage = totalSales > 0 ? (totalSalePayments / totalSales) * 100 : 0
    const purchasePaymentPercentage = totalPurchases > 0 ? (totalPurchasePayments / totalPurchases) * 100 : 0

    setMetrics({
      totalSales,
      totalPurchases,
      totalSalePayments,
      totalPurchasePayments,
      totalSalePending,
      totalPurchasePending,
      saleCount,
      purchaseCount,
      salePaymentPercentage,
      purchasePaymentPercentage,
    })
  }, [saleData, purchaseData, filters.dateFrom, filters.dateTo])

  return (
    // <div className="-mt-8 no-scrollbar::-webkit-scrollbar">
        <div className="space-y-6">
      {/* Date Range Picker */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-2">
        <div>
          <h2 className="text-2xl font-bold text-black dark:!text-white tracking-tight">Financial Overview</h2>
          <p className="text-muted-foreground text-black dark:!text-white">Track your sales and purchase performance</p>
        </div>
        <div className="w-full dark:!text-white bg-white  dark:bg-gray-dark rounded-[10px] sm:w-auto">
          <label htmlFor="date-range" className="sr-only">
            Date Range
          </label>
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
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-3">
        <Card className="overflow-hidden  dark:bg-gray-dark border-0 shadow-lg bg-secondary">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center justify-between">
              <span className="text-lg font-semibold text-primary">Total Sales</span>
              <div className="p-2 bg-emerald-100 rounded-lg">
                <ShoppingCart className="h-5 w-5 text-emerald-600" />
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-center p-6">
              <div className="text-center">
                <p className="text-sm font-bold text-dark-3 dark:!text-white mt-2">Total transactions</p>
                <p className="text-4xl font-bold text-primary">{compactFormat(metrics.saleCount)}</p>
                
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Purchase Count Card */}
        <Card className="overflow-hidden dark:bg-gray-dark border-0 shadow-lg bg-secondary">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center justify-between">
              <span className="text-lg font-semibold text-primary">Total Purchases</span>
              <div className="p-2 bg-purple-100 rounded-lg">
                <ShoppingBag className="h-5 w-5 text-purple-600" />
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-center p-6">
              <div className="text-center">
                 <p className="text-sm font-bold text-dark-3 dark:!text-white mt-2">Total transactions</p>
                <p className="text-4xl font-bold text-primary">{compactFormat(metrics.purchaseCount)}</p>
               
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Second Row: Sale Payments and Purchase Payments */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Sale Payments Card */}
        <Card className="overflow-hidden dark:bg-gray-dark border-0 shadow-lg bg-secondary">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span className="text-lg font-semibold text-primary dark:!text-white">Sale Payments</span>
              <div className="p-2 bg-orange-200 rounded-lg">
                <CreditCard className="h-5 w-5 text-orange-400" />
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {/* Total Amount */}
            <div className="text-center p-4">
              <p className="text-sm font-bold text-dark-3 dark:!text-white mt-1">Total sale amount</p>
              <p className="text-3xl font-bold text-primary">₹{compactFormat(metrics.totalSales)}</p>
              
            </div>

            {/* Progress Bar */}
            {metrics.totalSales >0 && (
            <div className="space-y-2">
              <div className="w-full bg-purple-200 rounded-full h-3">
                <div
                  className={cn(
                    "h-3 rounded-full transition-all duration-500 ease-out",
                    metrics.salePaymentPercentage > 70
                      ? "bg-orange-200"
                      : metrics.salePaymentPercentage > 40
                        ? "bg-orange-500"
                        : "bg-red-500",
                  )}
                  style={{ width: `${Math.min(metrics.salePaymentPercentage, 100)}%` }}
                />
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs font-bold">{metrics.salePaymentPercentage.toFixed(1)}% collected</span>
              </div>
            </div>
            )}

            {/* Payment Details */}
            <div className="grid grid-cols-2 gap-4">
              <div className="p-3 bg-white/60 rounded-lg">
                <div className="flex items-center space-x-2">
                  <ArrowUpRight className="h-3 w-3 text-green-600" />
                  <span className="text-xs font-bold text-dark-3 dark:!text-white">Collected</span>
                </div>
                <p className="text-lg font-semibold text-green-600">₹{compactFormat(metrics.totalSalePayments)}</p>
              </div>
              <div className="p-3 bg-white/60 rounded-lg">
                <div className="flex items-center space-x-2">
                  <ArrowDownRight className="h-3 w-3 text-orange-600" />
                  <span className="text-xs font-bold text-dark-3 dark:!text-white">Pending</span>
                </div>
                <p className="text-lg font-semibold text-orange-600">₹{compactFormat(metrics.totalSalePending)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Purchase Payments Card */}
        <Card className="overflow-hidden border-0 dark:bg-gray-dark shadow-lg bg-secondary">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span className="text-lg font-semibold text-primary">Purchase Payments</span>
              <div className="p-2 bg-red-200 rounded-lg">
                <Wallet className="h-5 w-5 text-red-500" />
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Total Amount */}
            <div className="text-center p-4">
            
              <p className="text-sm font-bold text-dark-3 mt-1 dark:!text-white">Total purchase amount</p>
                <p className="text-3xl font-bold text-primary">₹{compactFormat(metrics.totalPurchases)}</p>
            </div>

            {/* Progress Bar */}

              {metrics.totalPurchases >0 && (
            <div className="space-y-2">
              <div className="w-full bg-purple-200 rounded-full h-3">
                <div
                  className={cn(
                    "h-3 rounded-full transition-all duration-500 ease-out",
                    metrics.purchasePaymentPercentage > 70
                      ? "bg-orange-500"
                      : metrics.purchasePaymentPercentage > 40
                        ? "bg-orange-500"
                        : "bg-red-500",
                  )}
                  style={{ width: `${Math.min(metrics.purchasePaymentPercentage, 100)}%` }}
                />
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs font-medium">{metrics.purchasePaymentPercentage.toFixed(1)}% paid</span>
              </div>
            </div>
              )}

            {/* Payment Details */}
            <div className="grid grid-cols-2 gap-4">
              <div className="p-3 bg-white/60 rounded-lg">
                <div className="flex items-center space-x-2">
                  <ArrowUpRight className="h-3 w-3 text-green-600" />
                  <span className="text-xs font-bold text-dark-3 dark:!text-white">Paid</span>
                </div>
                <p className="text-lg font-semibold text-green-600">₹{compactFormat(metrics.totalPurchasePayments)}</p>
              </div>
              <div className="p-3 bg-white/60 rounded-lg">
                <div className="flex items-center space-x-2">
                  <ArrowDownRight className="h-3 w-3 text-orange-600" />
                  <span className="text-xs font-bold text-dark-3 dark:!text-white">Outstanding</span>
                </div>
                <p className="text-lg font-semibold text-orange-600">₹{compactFormat(metrics.totalPurchasePending)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
