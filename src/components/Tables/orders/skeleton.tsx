import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export function OrdersSkeleton() {
  return (
    <div className="rounded-[10px] bg-white text-#3b82f6 px-7.5 pb-4 pt-7.5 shadow-1 dark:bg-gray-dark dark:shadow-card">
      <h2 className="mb-5.5 text-body-2xlg font-bold text-dark dark:text-white">
       Orders Placed
      </h2>

      <Table>
        <TableHeader>
          <TableRow className="border-none uppercase [&>th]:text-center">
            <TableHead className="min-w-[120px]">Date</TableHead>
            <TableHead >Customer Name</TableHead>
            <TableHead>Products</TableHead>
            <TableHead className="!text-right">Quantity</TableHead>
            <TableHead>Price</TableHead>
            <TableHead>Payment Status</TableHead>
            <TableHead> Status</TableHead>
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
