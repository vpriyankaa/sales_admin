import Home from "@/app/salesAddEdit";
import { Suspense } from 'react';


export default function AddPage() {
  return (
    <div className="space-y-10">
      <Suspense fallback={<div>Loading...</div>}>
        <Home id="" />
      </Suspense>
    </div>
  );
}


