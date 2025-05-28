import  Home from "@/app/purchaseAddEdit";



const Sales = ({ params }: { params: { id: string } }) => {
  return (
    <>
      <div className="space-y-10">
          <Home id={params.id}/>
      </div>
    </>
  );
};

export default Sales;
