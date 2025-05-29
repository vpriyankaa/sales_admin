import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export function VendorsSkeleton() {
  return (
    <div className="rounded-[10px] bg-white shadow-1 dark:bg-gray-dark dark:shadow-card">
      
       <div className="px-6 py-4 sm:px-6 sm:py-5 xl:px-8.5">
          <h2 className="text-2xl font-bold text-dark dark:text-white">
            Vendors
          </h2>
        </div>

      <Table>
         <TableHeader>
                   <TableRow className="border-none uppercase [&>th]:text-center">
                     <TableHead className="!text-left pl-6">
                       Vendor Name
                     </TableHead>
                     <TableHead className="!text-left">Phone</TableHead>
                     <TableHead className="!text-left">Products</TableHead>
                     
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
              <TableCell>
                <Skeleton className="h-4 w-20" />
              </TableCell>
           
        
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
