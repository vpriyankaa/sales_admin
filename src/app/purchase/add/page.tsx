import Home from "@/app/purchaseAddEdit";
import { Suspense } from 'react';

// For a regular page without dynamic params
export default function PurchaseAdd() {
  return (
    <div className="space-y-10">
      <Suspense fallback={<div>Loading...</div>}>
      <Home id="" />
      </Suspense>
      
    </div>
  );
}



