import { Customers } from "@/components/Tables/customers";
import { CustomersSkeleton } from "@/components/Tables/customers/skeleton";

import { Metadata } from "next";
import { Suspense } from "react";

export const metadata: Metadata = {
  title: "Tables",
};

const TablesPage = () => {
  return (
    <>
      <div className="space-y-10">
        <Customers />
      </div>
    </>
  );
};

export default TablesPage;
