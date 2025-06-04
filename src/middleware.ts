import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const auth = request.cookies.get("auth")?.value;
  const path = request.nextUrl.pathname;

  // console.log("🔥 Middleware HIT:", path);
  // console.log("✅ Auth cookie value:", auth);

  // List of public routes
  const publicRoutes = ["/auth/sign-in"];

  // If not authenticated AND not visiting a public route
  if (!auth && !publicRoutes.includes(path)) {
    return NextResponse.redirect(new URL("/auth/sign-in", request.url));
  }

  // If authenticated but trying to visit login again
  if (auth && path === "/auth/sign-in") {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  return NextResponse.next();
}


export const config = {
    matcher: [
      '/',
    '/dashboard/:path*',
    '/dashboard',
    '/sales/:path*',
    '/sales',
    '/purchase/:path*',
    '/purchase',
    '/products/:path*',
    '/products',
    '/vendors/:path*',
    '/vendors',
    '/customers/:path*',
    '/customers',
    '/reports/:path*',
    '/reports',
    '/purchase-reports/:path*',
    '/purchase-reports',
  ],
};

