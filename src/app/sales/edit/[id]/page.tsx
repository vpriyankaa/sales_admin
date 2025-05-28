import Home from "@/app/salesAddEdit";

export default function Edit({ params }: { params: { id: string } }) {
  return (
    <div className="space-y-10">
      <Home id={params.id}/>
    </div>
  );
}