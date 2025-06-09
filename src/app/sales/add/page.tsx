import Home from "@/components/sales/home";
import { Suspense } from "react";
import { Loader2 } from "lucide-react";
import ProtectedLayout from "@/components/Auth/ProtectedLayout";

export default function AddPage() {
  return (
    <ProtectedLayout>
      <div className="space-y-8">
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


