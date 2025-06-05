import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const auth = request.cookies.get("auth")?.value;
  const path = request.nextUrl.pathname;

  if (pathname.startsWith("/ping")) {
    return new Response("pong", { status: 200 });
  }

  if (pathname.startsWith("/images")) {
  return NextResponse.next(); // skip auth check for images
}
  // console.log("✅ Auth cookie value:", auth);

  // List of public routes
  const publicRoutes = ["/auth/sign-in", "/auth/forgot-password"];

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
    "/((?!_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt|api/auth|sign-in|sign-up).*)",
  ],
};

