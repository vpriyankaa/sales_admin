import { Vendors } from "@/components/Tables/vendors";

import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Tables",
};

const TablesPage = () => {
  return (
    <>
      

      <div className="space-y-10">
        
       
          <Vendors />
       

      </div>
    </>
  );
};

export default TablesPage;
