import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Public route list (login page only)
const publicRoutes = ["/auth/sign-in"];

export function middleware(request: NextRequest) {


  console.log("Middleware called for path:", request.nextUrl.pathname); 
  console.log("Middleware running. Cookie auth:", request.cookies.get("auth")?.value);

  const isAuth = request.cookies.get("auth")?.value; 
  const currentPath = request.nextUrl.pathname;      // User ippo enga poraan-nu check

  // ❌ Login illa, but protected route ponna → redirect to sign-in
  if (!isAuth && !publicRoutes.includes(currentPath)) {
    return NextResponse.redirect(new URL("/auth/sign-in", request.url));
  }

  // ✅ Login irundhu, sign-in page ponna try pannuna → redirect to dashboard
  if (isAuth && currentPath === "/auth/sign-in") {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  return NextResponse.next(); // All OK → page render aagattum
}

export const config = {
  matcher: [
    "/dashboard",
    "/sales/:path*",
    "/purchase/:path*",
    "/products",
    "/vendors",
    "/customers",
    "/reports",
    "/purchase-reports",
  ],
};



