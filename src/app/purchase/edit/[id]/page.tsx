import Home from "@/app/purchaseAddEdit";


// For purchase edit with dynamic params - use Next.js 15 compatible types
interface PurchaseEditPageProps {
  params: Promise<{ id: string }>
}

export default async function PurchaseEdit({ params }: PurchaseEditPageProps) {
  const { id } = await params;
  
  return (
    <div className="space-y-10">
      <Home id={id} />
    </div>
  );
}

