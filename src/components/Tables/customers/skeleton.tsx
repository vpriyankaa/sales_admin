// import { Skeleton } from "@/components/ui/skeleton";
// import {
//   Table,
//   TableBody,
//   TableCell,
//   TableHead,
//   TableHeader,
//   TableRow,
// } from "@/components/ui/table";

// export function CustomersSkeleton() {
//   return (
//     <div className="rounded-[10px] bg-white shadow-1 dark:bg-gray-dark dark:shadow-card">
//       <h2 className="px-4 py-6 text-2xl font-bold text-dark dark:text-white md:px-6 xl:px-9">
//         Products
//       </h2>

//       <Table>
//         <TableHeader>
//           <TableRow className="border-none uppercase [&>th]:text-center">
//             <TableHead className="min-w-[120px]">Product Name</TableHead>
//             <TableHead>Quantity</TableHead>
//             <TableHead>Unit</TableHead>
//             <TableHead>Price</TableHead>      
//           </TableRow>
//         </TableHeader>

//           <TableBody>
//           {Array.from({ length: 5 }).map((_, i) => (
//             <TableRow key={i} className="border-b border-gray-200 dark:border-gray-700">
//               <TableCell className="text-center">
//                 <Skeleton className="h-4 w-4 mx-auto" />
//               </TableCell>
//               <TableCell className="text-center">
//                 <Skeleton className="h-4 w-8 mx-auto" />
//               </TableCell>
//               <TableCell>
//                 <Skeleton className="h-4 w-20" />
//               </TableCell>
//               <TableCell>
//                 <Skeleton className="h-4 w-24" />
//               </TableCell>
             
              
//             </TableRow>
//           ))}
//         </TableBody>
//       </Table>
//     </div>
//   );
// }


import { Skeleton } from "@/components/ui/skeleton"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

export function CustomersSkeleton() {
  return (
    <div className="rounded-[10px] bg-white shadow-1 dark:bg-gray-dark dark:shadow-card">
      <div className="px-6 py-4 sm:px-6 sm:py-5 xl:px-8.5">
        <h2 className="text-2xl font-bold text-dark dark:text-white">Customers</h2>
      </div>

      <div className="flex justify-end mb-5 mr-2">
        <Skeleton className="h-10 w-32" />
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
        
            </TableRow>
          ))}
        </TableBody>
      </Table>

     
    </div>
  )
}
