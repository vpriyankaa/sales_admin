import { Purchase } from "@/components/Tables/purchase";
import { PurchaseSkeleton } from "@/components/Tables/purchase/skeleton";

import { Metadata } from "next";
import { Suspense } from "react";

export const metadata: Metadata = {
  title: "Tables",
};

const TablesPage = () => {
  return (
    <>
      

      <div className="space-y-10">
        
        <Suspense fallback={<PurchaseSkeleton />}>
          <Purchase />
        </Suspense>

      </div>
    </>
  );
};

export default TablesPage;
