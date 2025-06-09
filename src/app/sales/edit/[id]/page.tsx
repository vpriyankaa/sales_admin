import Home from "@/components/sales/home";


// For sales edit with dynamic params - use Next.js 15 compatible types
interface SalesEditPageProps {
  params: Promise<{ id: string }>
}

export default async function SalesEdit({ params }: SalesEditPageProps) {
  const { id } = await params;
  
  return (
    <div className="space-y-10">
      
      <Home id={id} />
    </div>
  );
}
