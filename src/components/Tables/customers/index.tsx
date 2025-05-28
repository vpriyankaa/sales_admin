"use client";



import { useEffect, useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { getCustomers ,addCustomer } from "@/app/actions";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea"
import { CustomersSkeleton} from "./skeleton";


interface Customer {
  id: string
  name: string
  phone: string
  adhaar?: string
  address?: string
}


export function Customers() {
  const [data, setData] = useState<any[]>([]);


  const [isLoading, setIsLoading] = useState(false)

  const UNIT_OPTIONS = ["pcs", "kg", "ltr", "dozen", "pack", "box"];
  const [itemsPerPage, setItemsPerPage] = useState(10)
  const [itemsPerPageInput, setItemsPerPageInput] = useState("10");
  const [formErrors, setFormErrors] = useState<{
    name?: string
    phone?: string
    adhaar?: string
  }>({})

  const [isAddingCustomer, setIsAddingCustomer] = useState(false);

  

  const [openAdd, setOpenAdd] = useState(false);
const [customers, setCustomers] = useState<Customer[]>([])


  useEffect(() => {
    const fetchData = async () => {
      const res = await getCustomers();
      setData(res);
    };
    fetchData();
  }, []);

  const handleItemsPerPageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setItemsPerPageInput(e.target.value)
  }

   const [newCustomer, setNewCustomer] = useState({
    name: "",
    phone: "",
    adhaar: "",
    address: "",
  })

  // Handle items per page input submission
  const handleItemsPerPageSubmit = () => {
    const newItemsPerPage = Number.parseInt(itemsPerPageInput)
    if (!isNaN(newItemsPerPage) && newItemsPerPage >= 1) {
      setItemsPerPage(newItemsPerPage)
      // Reset to page 1 when changing items per page
      setCurrentPage(1)
    } else {
      // Reset to current value if invalid
      setItemsPerPageInput(itemsPerPage.toString())
    }
  }



  const [currentPage, setCurrentPage] = useState(1);

  const totalPages = Math.ceil(data.length / itemsPerPage);
  const paginatedData = data.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );


    const handleAddCustomer = async () => {
      const errors: { name?: string; phone?: string; adhaar?: string } = {}
  
      // ── Name: only letters & spaces, at least 2 chars
      if (!newCustomer.name.trim()) {
        errors.name = "Name is required"
      } else if (!/^[A-Za-z\s]{2,}$/.test(newCustomer.name.trim())) {
        errors.name = "Name should contain only letters & spaces"
      }
  
      // ── Phone: exactly 10 digits
      if (!newCustomer.phone.trim()) {
        errors.phone = "Phone is required"
      } else if (!/^\d{10}$/.test(newCustomer.phone.trim())) {
        errors.phone = "Phone must be a 10‑digit number"
      }
  
      // ── Aadhaar: optional, but if given must be 12 digits
      if (newCustomer.adhaar.trim()) {
        const digits = newCustomer.adhaar.replace(/\s+/g, "")
        if (!/^\d{12}$/.test(digits)) {
          errors.adhaar = "Aadhaar must be a 12‑digit number"
        }
      }
  
      // stop if any error
      if (Object.keys(errors).length !== 0) {
        setFormErrors(errors)
        return
      }
  
      setFormErrors({})
      setIsLoading(true)
  
      try {
        const newCustomerId = await addCustomer(newCustomer)
  
        //  console.log("newCustomerId",newCustomerId);
  
        const addedCustomer = {
          ...newCustomer,
          id: newCustomerId.toString(),
        }
  

        if(newCustomerId){
          setOpenAdd(true);
          const res = await getCustomers();
          setData(res);
        }
        // console.log("addedCustomer",addedCustomer);
  
        setCustomers([...customers, addedCustomer])
        
  
        setNewCustomer({ name: "", phone: "", adhaar: "", address: "" })
        setIsAddingCustomer(false)
      } catch (err) {
        console.error(err)
        setFormErrors({ phone: "Phone Number already exists" })
      } finally {
        setIsLoading(false)
      }
    }


  return (

  <>
  {paginatedData.length === 0 ? (
    <CustomersSkeleton />
  ) : (
    <>
      <div className="rounded-[10px] bg-white shadow-1 dark:bg-gray-dark dark:shadow-card">
        <div className="px-6 py-4 sm:px-6 sm:py-5 xl:px-8.5">
          <h2 className="text-2xl font-bold text-dark dark:text-white">Customers</h2>
        </div>

        <div className="flex justify-end mb-5 mr-2">
          <Button type="button" className="text-white" onClick={() => setIsAddingCustomer(true)}>
            Add Customer
          </Button>
        </div>

        <Table>
          <TableHeader>
            <TableRow className="border-none uppercase [&>th]:text-center">
              <TableHead className="!text-left pl-6">Customer Name</TableHead>
              <TableHead className="!text-left">Phone</TableHead>
              <TableHead className="!text-left">Aadhaar</TableHead>
              <TableHead className="!text-left">Address</TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            {paginatedData.map((customer) => (
              <TableRow className="text-base font-medium text-dark dark:text-white" key={customer.id}>
                <TableCell className="pl-5 sm:pl-6 xl:pl-7.5">{customer.name}</TableCell>
                <TableCell>{customer.phone}</TableCell>
                <TableCell>{customer.adhaar || "-"}</TableCell>
                <TableCell>{customer.address || "-"}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>

        <div className="flex items-center justify-end gap-4 p-4">
          <span className="text-sm font-bold text-gray-700 dark:text-gray-300">Items per page:</span>
          <Input
            type="number"
            min={1}
            value={itemsPerPageInput}
            onChange={handleItemsPerPageChange}
            onBlur={handleItemsPerPageSubmit}
            onKeyDown={(e) => e.key === "Enter" && handleItemsPerPageSubmit()}
            className="h-8 w-16 font-bold text-center"
          />
          <button
            onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
            disabled={currentPage === 1}
            className="px-3 py-1 rounded text-lg font-bold bg-gray-200 dark:bg-gray-700 disabled:opacity-50"
          >
            &lt;
          </button>
          <span className="text-sm font-bold text-gray-700 dark:text-gray-300">
            Page {currentPage} of {totalPages}
          </span>
          <button
            onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
            disabled={currentPage === totalPages}
            className="px-3 py-1 rounded text-lg font-bold bg-gray-200 dark:bg-gray-700 disabled:opacity-50"
          >
            &gt;
          </button>
        </div>
      </div>

      {/* Add Customer Dialog */}
      <Dialog open={isAddingCustomer} onOpenChange={setIsAddingCustomer}>
        <DialogContent className="bg-white dark:bg-white">
          <DialogHeader>
            <DialogTitle className="text-center text-dark">Add New Customer</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            {/* NAME */}
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="name" className="text-right text-dark">
                Name <span className="text-red-500">*</span>
              </Label>
              <div className="col-span-3 space-y-1 text-dark">
                <Input
                  id="name"
                  value={newCustomer.name}
                  onChange={(e) => {
                    const value = e.target.value;
                    setNewCustomer({ ...newCustomer, name: value });
                    if (formErrors.name) setFormErrors({ ...formErrors, name: undefined });
                  }}
                  className={formErrors.name ? "border-red-500" : ""}
                  maxLength={20}
                  required
                />
                {formErrors.name && <p className="text-sm text-red-500">{formErrors.name}</p>}
              </div>
            </div>

            {/* PHONE */}
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="phone" className="text-right text-dark">
                Phone <span className="text-red-500">*</span>
              </Label>
              <div className="col-span-3 space-y-1 text-dark">
                <Input
                  id="phone"
                  type="tel"
                  inputMode="numeric"
                  pattern="\d{10}"
                  maxLength={10}
                  value={newCustomer.phone}
                  onChange={(e) => {
                    const value = e.target.value.replace(/\D/g, "");
                    setNewCustomer({ ...newCustomer, phone: value });
                    if (formErrors.phone) setFormErrors({ ...formErrors, phone: undefined });
                  }}
                  className={formErrors.phone ? "border-red-500" : ""}
                  required
                />
                {formErrors.phone && <p className="text-sm text-red-500">{formErrors.phone}</p>}
              </div>
            </div>

            {/* AADHAAR */}
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="adhaar" className="text-right text-dark">Aadhaar</Label>
              <div className="col-span-3 space-y-1 text-dark">
                <Input
                  id="adhaar"
                  inputMode="numeric"
                  maxLength={14}
                  value={newCustomer.adhaar}
                  onChange={(e) => {
                    const value = e.target.value.replace(/[^\d\s]/g, "");
                    setNewCustomer({ ...newCustomer, adhaar: value });
                    if (formErrors.adhaar) setFormErrors({ ...formErrors, adhaar: undefined });
                  }}
                  className={formErrors.adhaar ? "border-red-500" : ""}
                />
                {formErrors.adhaar && <p className="text-sm text-red-500">{formErrors.adhaar}</p>}
              </div>
            </div>

            {/* ADDRESS */}
            <div className="grid grid-cols-4 items-center gap-4 text-dark">
              <Label htmlFor="address" className="text-right text-dark">Address</Label>
              <Textarea
                id="address"
                value={newCustomer.address}
                onChange={(e) => setNewCustomer({ ...newCustomer, address: e.target.value })}
                className="col-span-3"
                rows={3}
              />
            </div>
          </div>
          <DialogFooter className="flex flex-col sm:flex-row-reverse sm:justify-center gap-2">
            <Button className="bg-green-600 text-white" onClick={() => setIsAddingCustomer(false)}>
              Cancel
            </Button>
            <Button className="text-white" onClick={handleAddCustomer} disabled={isLoading}>
              {isLoading ? "Saving..." : "Save"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Success Dialog */}
      {openAdd && (
        <Dialog open={openAdd} onOpenChange={setOpenAdd}>
          <DialogContent className="bg-white text-black">
            <DialogHeader>
              <DialogTitle>Success</DialogTitle>
            </DialogHeader>
            <div>Customer Added successfully!</div>
            <DialogFooter>
              <Button className="w-full md:w-auto text-white mb-5 mr-2" onClick={() => setOpenAdd(false)}>
                Close
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </>
  )}
</>


  );
}
