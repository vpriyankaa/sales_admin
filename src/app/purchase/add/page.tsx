import Home from "@/app/purchaseAddEdit";
import { Suspense } from 'react';
import { Loader2 } from "lucide-react"

export default function PurchaseAdd() {
  return (
    <div className="space-y-10">
      <Suspense fallback={
        <div className="flex justify-center items-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
        </div>
      }>
        <Home id="" />
      </Suspense>

    </div>
  );
}



