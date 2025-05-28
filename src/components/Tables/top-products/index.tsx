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
import { getProducts, addProduct, getUnits } from "@/app/actions";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { TopProductsSkeleton } from './skeleton'

type Unit = {
  id: number;
  name: string;
};


export function TopProducts() {
  const [data, setData] = useState<any[]>([]);


  const [units, setUnits] = useState<Unit[]>([]);

  useEffect(() => {
    const fetchUnits = async () => {
      const data = await getUnits();
      setUnits(data);
    };

    fetchUnits();
  }, []);




  const [open, setOpen] = useState(false);

  const [openAdd, setOpenAdd] = useState(false);

  const [newProduct, setNewProduct] = useState({
    product_id: "",
    product_name: "",
    quantity: 0,
    price: 0,
    unit: "",
  });
  const [formErrors, setFormErrors] = useState<{
    product_name?: string;
    quantity?: string;
    price?: string;
    unit?: string;
  }>({});

  useEffect(() => {
    const fetchData = async () => {
      const res = await getProducts();
      setData(res);
    };
    fetchData();
  }, []);

  const handleAddProduct = async () => {
    const errors: typeof formErrors = {};

    if (!newProduct.product_name.trim()) {
      errors.product_name = "Product name is required";
    }

    if (!newProduct.quantity || newProduct.quantity <= 0) {
      errors.quantity = "Quantity must be greater than 0";
    }

    if (!newProduct.unit.trim()) {
      errors.unit = "Unit is required";
    }

    if (!newProduct.price || newProduct.price <= 0) {
      errors.price = "Price must be greater than 0";
    }

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    try {
      const id = await addProduct({
        name: newProduct.product_name,
        quantity: newProduct.quantity,
        price: newProduct.price,
        unit: newProduct.unit,
      });

      setOpen(false);

      setOpenAdd(true);

      setFormErrors({});
      setNewProduct({
        product_id: "",
        product_name: "",
        quantity: 0,
        price: 0,
        unit: "",
      });

      const refreshed = await getProducts();
      setData(refreshed);
    } catch (err) {
      console.error(err);
    }
  };



  const [itemsPerPage, setItemsPerPage] = useState(10)
  const [itemsPerPageInput, setItemsPerPageInput] = useState("10")

  const [currentPage, setCurrentPage] = useState(1);

  const totalPages = Math.ceil(data.length / itemsPerPage);
  const paginatedData = data.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );



  const handleItemsPerPageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setItemsPerPageInput(e.target.value)
  }


  const handleItemsPerPageSubmit = () => {
    const newItemsPerPage = Number.parseInt(itemsPerPageInput)
    if (!isNaN(newItemsPerPage) && newItemsPerPage >= 1) {
      setItemsPerPage(newItemsPerPage)

      setCurrentPage(1)
    } else {
      setItemsPerPageInput(itemsPerPage.toString())
    }
  }

  return (

    <>

      {paginatedData.length === 0 && (
        <TopProductsSkeleton />
      )}

      <div className="rounded-[10px] bg-white shadow-1 dark:bg-gray-dark dark:shadow-card">
        <div className="px-6 py-4 sm:px-6 sm:py-5 xl:px-8.5">
          <h2 className="text-2xl font-bold text-dark dark:text-white">
            Products
          </h2>
        </div>

        <div className="flex justify-end mb-5 mr-2">
          <Button
            type="button"
            className="text-white"
            onClick={() => setOpen(true)}
          >
            Add Product
          </Button>
        </div>

        <Table>
          <TableHeader>
            <TableRow className="border-none uppercase [&>th]:text-center">
              <TableHead className="!text-left pl-6">
                Product Name
              </TableHead>
              <TableHead className="!text-left">Quantity</TableHead>
              <TableHead className="!text-left">Unit</TableHead>
              <TableHead className="!text-left">Price</TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            {paginatedData.map((product) => (
              <TableRow
                className="text-base font-medium text-dark dark:text-white"
                key={product.id}
              >
                <TableCell className="pl-5 sm:pl-6 xl:pl-7.5">
                  {product.name}
                </TableCell>
                <TableCell>{product.quantity}</TableCell>
                <TableCell>{product.unit}</TableCell>
                <TableCell>{product.price}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>

        {/* Dialog code here (unchanged) */}
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogContent className="bg-white dark:bg-white">
            <DialogHeader>
              <DialogTitle className="text-dark font-bold text-center">Add New Product</DialogTitle>
            </DialogHeader>

            <div className="grid gap-4 py-4">
              {/* Product Name */}
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="product_name" className="text-right text-dark">
                  Name <span className="text-red-500">*</span>
                </Label>
                <div className="col-span-3 space-y-1 text-dark">
                  <Input
                    id="product_name"
                    value={newProduct.product_name}
                    onChange={(e) => {
                      setNewProduct({ ...newProduct, product_name: e.target.value });
                      if (formErrors.product_name) {
                        setFormErrors((prev) => ({ ...prev, product_name: undefined }));
                      }
                    }}
                    className={formErrors.product_name ? "border-red-500" : ""}
                  />

                  {formErrors.product_name && (
                    <p className="text-sm text-red-500">
                      {formErrors.product_name}
                    </p>
                  )}
                </div>
              </div>

              {/* Unit */}
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="unit" className="text-right text-dark">
                  Unit <span className="text-red-500">*</span>
                </Label>
                <div className="col-span-3 space-y-1 text-dark">
                  <Select
                    value={newProduct.unit}

                    onValueChange={(value) => {
                      setNewProduct({ ...newProduct, unit: value });
                      if (formErrors.unit) {
                        setFormErrors((prev) => ({ ...prev, unit: undefined }));
                      }
                    }}
                  >
                    <SelectTrigger className={formErrors.unit ? "border-red-500" : "text-dark"}>
                      <SelectValue placeholder="Select unit" />
                    </SelectTrigger>
                    <SelectContent className="bg-white text-dark">
                      {units.map((unit) => (
                        <SelectItem key={unit.id} value={unit.name}>
                          {unit.name.charAt(0).toUpperCase() + unit.name.slice(1)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {formErrors.unit && (
                    <p className="text-sm text-red-500">{formErrors.unit}</p>
                  )}

                </div>
              </div>

              {/* Price */}
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="price" className="text-right text-dark">
                  Price <span className="text-red-500">*</span>
                </Label>
                <div className="col-span-3 space-y-1 text-dark">
                  <Input
                    id="price"
                    type="number"
                    min={1}
                    value={Number.isNaN(newProduct.price) ? "" : newProduct.price}
                    onChange={(e) => {
                      const val = e.target.value;
                      const parsed = parseFloat(val);
                      setNewProduct({
                        ...newProduct,
                        price: val === "" ? NaN : parsed
                      });

                      if (formErrors.price) {
                        setFormErrors((prev) => ({ ...prev, price: undefined }));
                      }
                    }}
                    className={formErrors.price ? "border-red-500" : "text-dark"}
                  />


                  {formErrors.price && (
                    <p className="text-sm text-red-500">{formErrors.price}</p>
                  )}
                </div>
              </div>

              {/* Quantity */}
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="quantity" className="text-right text-dark">
                  Quantity <span className="text-red-500">*</span>
                </Label>
                <div className="col-span-3 space-y-1 text-dark">
                  <Input
                    id="quantity"
                    type="number"
                    min={1}
                    value={newProduct.quantity}
                    onChange={(e) => {
                      setNewProduct({ ...newProduct, quantity: parseInt(e.target.value) });
                      if (formErrors.quantity) {
                        setFormErrors((prev) => ({ ...prev, quantity: undefined }));
                      }
                    }}
                    className={formErrors.quantity ? "border-red-500" : ""}
                  />


                  {formErrors.quantity && (
                    <p className="text-sm text-red-500">{formErrors.quantity}</p>
                  )}
                </div>
              </div>


            </div>

            <DialogFooter>
              <Button className="color: bg-green-600 text-white"
                onClick={() => {
                  setOpen(false);
                  setFormErrors({});
                }}
              >
                Cancel
              </Button>
              <Button className="w-full md:w-auto text-white mb-5 mr-2"
                onClick={handleAddProduct}>
                Save
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

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


      {openAdd && (
        <Dialog open={openAdd} onOpenChange={setOpenAdd}>
          <DialogContent className="bg-white">
            <DialogHeader>
              <DialogTitle>Success</DialogTitle>
            </DialogHeader>
            <div>Product Added successfully!</div>
            <DialogFooter>
              <Button className="w-full md:w-auto text-white mb-5 mr-2" onClick={() => setOpenAdd(false)}>Close</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}




    </>

  );
}
