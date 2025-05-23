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
          </TableRow>
        </TableHeader>

         <TableBody>
          {/* {Array.from({ length: 5 }).map((_, i) => ( */}
            <TableRow>
              <TableCell><Skeleton className="bg-gray-300 h-4 w-3/4" /></TableCell>
              <TableCell><Skeleton className="bg-gray-300 h-4 w-5/6" /></TableCell>
              <TableCell><Skeleton className="bg-gray-300 h-4 w-full" /></TableCell>
              <TableCell className="!text-right"><Skeleton className="bg-gray-300 h-4 w-1/2 ml-auto" /></TableCell>
              <TableCell><Skeleton className="bg-gray-300 h-4 w-2/3" /></TableCell>
              <TableCell><Skeleton className=" bg-gray-300 h-4 w-4/5" /></TableCell>
            </TableRow>
          {/* ))} */}
        </TableBody>
      </Table>
    </div>
  );
}
