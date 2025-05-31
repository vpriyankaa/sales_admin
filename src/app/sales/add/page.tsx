// import Home from "@/app/salesAddEdit";
// import { Suspense } from 'react';
// import { Loader2 } from "lucide-react"


// export default function AddPage() {
//   return (
//     <div className="space-y-10">
//       <Suspense fallback={

//          <div className="flex justify-center items-center h-64">
//                 <Loader2 className="h-8 w-8 animate-spin text-primary" />
//               </div>
//         }>
//         <Home id="" />
//       </Suspense>
//     </div>
//   );
// }


import Home from "@/app/salesAddEdit";
import { Suspense } from "react";
import { Loader2 } from "lucide-react";
import ProtectedLayout from "@/components/Auth/ProtectedLayout";

export default function AddPage() {
  return (
    <ProtectedLayout>
      <div className="space-y-10">
        <Suspense
          fallback={
            <div className="flex justify-center items-center h-64">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          }
        >
          <Home id="" />
        </Suspense>
      </div>
    </ProtectedLayout>
  );
}


