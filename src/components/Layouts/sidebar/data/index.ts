import * as Icons from "../icons";

export const NAV_DATA = [
  {
    label: "",
    items: [
      {
        id:"1",
        title: "Sales",
        icon: Icons.Sale,
        url: "/sales/add",
        items: [
         
        ],
      },
      {
        id:"2",
        title: "Purchase",
        url: "/purchase/add",
        icon: Icons.Purchase,
        items: [],
      },
      {
        id:"3",
        title: "Products",
        url: "/products",
        icon: Icons.Products,
        items: [],
      },

       {
        id:"4",
        title: "Vendors",
        url: "/vendors",
        icon: Icons.Vendor,
        items: [],
      },
      {
        id:"5",
        title: "Customers",
        url: "/customers",
        icon: Icons.User,
        items: [],
      },
      {
        id:"6",
        title: "Reports",
        icon: Icons.Reports,
        url: "/reports",
        items: [
         
        ],
      },
    
    ],
  },
 
];
