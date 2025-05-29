import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export function PurchaseSkeleton() {
  return (
    <div className="rounded-[10px] bg-white text-#3b82f6 px-7.5 pb-4 pt-7.5 shadow-1 dark:bg-gray-dark dark:shadow-card">
        <div className="px-2 py-4 sm:px-4 sm:py-5 xl:px-8.5 text-left">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold text-dark dark:text-white">Purchase Reports</h2>
            </div>
          </div>

      <Table>
        <TableHeader>
          <TableRow className="border-none uppercase [&>th]:text-center">
            <TableHead className="min-w-[120px]">Date</TableHead>
            <TableHead >Vendor Name</TableHead>
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
              <TableCell className="text-center">
                <Skeleton className="h-4 w-4 mx-auto" />
              </TableCell>
              <TableCell className="text-center">
                <Skeleton className="h-4 w-8 mx-auto" />
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
