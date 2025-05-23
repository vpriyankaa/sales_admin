"use client"

import type React from "react"

import { Pencil, Eye } from "lucide-react"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

// import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { getReports, changeOrderStatus } from "@/app/(home)/actions"
import {
  Tooltip, TooltipTrigger, TooltipContent, TooltipProvider,
} from "@/components/ui/tooltip"

type OrderItem = {
  product_name: string;
  quantity: number;
};


interface Order {
  id: number;

}

export function Orders({ className }: { className?: string }) {


  const router = useRouter();


  const [data, setData] = useState<any[]>([])
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(5)
  const [itemsPerPageInput, setItemsPerPageInput] = useState("5")

  // State for status change modal
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedOrder, setSelectedOrder] = useState<any>(null)
  const [selectedStatus, setSelectedStatus] = useState("Cancel")

  useEffect(() => {
    async function fetchData() {
      const reports = await getReports()
      setData(reports)
    }
    fetchData()
  }, [])


  const totalPages = Math.ceil(data.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const currentData = data.slice(startIndex, startIndex + itemsPerPage)
  const [openOrderItems, setOpenOrderItems] = useState<null | any[]>(null)

  const [openAdd, setOpenAdd] = useState(false);

  const openStatusModal = (order: any) => {
    setSelectedOrder(order)
    setSelectedStatus(order.payment_status)
    setIsModalOpen(true)
  }



  const updateOrderStatus = async (
    selectedOrder: { id: number },
    selectedStatus: string,
    setData: React.Dispatch<React.SetStateAction<any[]>>,
    setIsModalOpen: React.Dispatch<React.SetStateAction<boolean>>
  ) => {
    if (!selectedOrder || !selectedStatus) return;




    console.log("selectedStatus", selectedStatus);


    const statusMap: Record<string, string> = {
      Cancel: "cancelled",
      Trash: "trashed",
    };


    const newStatus = statusMap[selectedStatus] ?? selectedStatus.toLowerCase();


    setData(prev =>
      prev.map(order =>
        order.id === selectedOrder.id ? { ...order, status: newStatus } : order
      )
    );

    const orderStatus = await changeOrderStatus(selectedOrder.id, newStatus);

    if (orderStatus) {
      setIsModalOpen(false);
      setOpenAdd(true);
    }



  };


  const [selectedOrderId, setSelectedOrderId] = useState<number | null>(null);


  const handleItemsPerPageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setItemsPerPageInput(e.target.value)
  }

  const handleItemsPerPageSubmit = () => {
    const newItemsPerPage = Number.parseInt(itemsPerPageInput)
    if (!isNaN(newItemsPerPage) && newItemsPerPage >= 1) {
      setItemsPerPage(newItemsPerPage)
      // Reset to page 1 when changing items per page
      setCurrentPage(1)
    } else {
      // Reset to current value if invalid
      setItemsPerPageInput(itemsPerPage.toString())
    }
  }

  const statusOptions = ["Cancel", "Trash"]

  return (
    <div className="rounded-[10px] bg-white shadow-1 dark:bg-gray-dark dark:shadow-card">
      <div className="px-2 py-4 sm:px-4 sm:py-5 xl:px-8.5 text-left">
        <h2 className="text-2xl font-bold text-dark dark:text-white">Reports</h2>
      </div>
      <Table>
        <TableHeader>
          <TableRow className="border-none uppercase [&>th]:text-center">
            <TableHead className="!text-left">Date</TableHead>
            <TableHead>Customer Name</TableHead>
            <TableHead>Products</TableHead>
            <TableHead>Quantity</TableHead>
            <TableHead>Price</TableHead>
            <TableHead>Payment Status</TableHead>
            <TableHead> Status</TableHead>
            <TableHead>Action</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {currentData.map((order) => (
            <TableRow className="text-center text-base font-medium text-dark dark:text-white" key={order.id}>
              <TableCell className="flex min-w-fit items-center gap-3">
                <div>
                  {new Date(order.created_at).toLocaleDateString("en-US", {
                    year: "numeric",
                    month: "short",
                    day: "numeric",
                  })}
                </div>
              </TableCell>
              <TableCell>
                <div className="pl-5 sm:pl-6 xl:pl-7.5">{order.customer_name}</div>
              </TableCell>
              <TableCell>
                {order.items.slice(0, 2).map((item: OrderItem, index: number) => (
                  <div key={index}>{item.product_name}</div>
                ))}


                {order.items.length > 2 && (
                  <button
                    onClick={() => setOpenOrderItems(order.items)}
                    className="text-blue-600 underline text-sm"
                  >
                    +{order.items.length - 2} more
                  </button>
                )}
              </TableCell>

              <TableCell>
                {order.items.slice(0, 2).map((item: OrderItem, index: number) => (
                  <div key={index}>{item.quantity}</div>
                ))}
                {order.items.length > 2 && (
                  <span className="invisible">+{order.items.length - 2} more</span>
                )}
              </TableCell>
              <TableCell>Rs.{order.total_price}</TableCell>
              <TableCell>

                {order.payment_status?.trim() ? (
                  <div
                    className={`py-1 px-2 rounded-full text-sm font-semibold
                    ${order.payment_status === "paid"
                        ? "bg-green-200 text-green-600"
                        : order.payment_status === "partiallypaid"
                          ? "bg-yellow-200 text-yellow-600"
                          : order.payment_status === "credit"
                            ? "bg-blue-200 text-blue-600"
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
                {order.status === "created"
                  ? "Created"
                  : order.status === "cancelled"
                    ? "Cancelled"
                    : order.status === "trashed"
                      ? "Trashed"
                      : "-"}

              </TableCell>
              <TableCell>

                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => openStatusModal(order)}
                        className="h-8 w-8"
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent className="bg-whitefont-medium text-blue-700">
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
                        onClick={() => router.push(`/info/${order.id}`)}
                        className="h-8 w-8"
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent className="bg-white font-medium text-blue-700">
                      View status
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>


      <div className="flex items-center justify-end p-4">

        <div className="flex items-center gap-4">

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

      {/* Status Change Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-md bg-white">
          <DialogHeader>
            <DialogTitle className="text-bold text-black">Change Order Status</DialogTitle>
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
            <Button className="text-white" onClick={() =>
              updateOrderStatus(selectedOrder, selectedStatus, setData, setIsModalOpen)
            }>Change Status</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!openOrderItems} onOpenChange={() => setOpenOrderItems(null)}>
        <DialogContent className="bg-white">
          <DialogHeader>
            <DialogTitle className="font-bold text-black">Ordered Items</DialogTitle>
          </DialogHeader>

          <div className="max-h-64 overflow-y-auto space-y-2 font-bold">
            {openOrderItems?.map((item: OrderItem, index: number) => (
              <div key={index} className="flex justify-between border-b pb-1">
                <div className="font-medium">{item.product_name}</div>
                <div className="text-sm text-gray-600"> {item.quantity}</div>
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
              <Button className="w-full md:w-auto text-white mb-5 mr-2" onClick={() => setOpenAdd(false)}>Close</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

    </div>
  )
}
