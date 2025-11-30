import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname;
  const token = request.cookies.get("access_token");
  
  // Allow auth API routes to pass through without middleware
  if (path.startsWith("/api/auth/")) {
    return NextResponse.next();
  }

  const protectedRoutes = ["/candidates", "/reports", "/dashboard", "/employees", "/projects"];
  const isProtectedRoute = protectedRoutes.some(
    (route) => path === route || path.startsWith(route + "/")
  );

  // Logic 1: If user DOESN'T have token and tries to access protected route, redirect to login
  if (!token && isProtectedRoute) {
    const loginUrl = new URL("/", request.url);
    // Preserve target path so login can send user back after auth
    loginUrl.searchParams.set("next", path);
    return NextResponse.redirect(loginUrl);
  }

  // Logic 2: If user HAS token and visits the login page, send them to their intended destination or candidates
  if (token && path === "/") {
    const nextParam = request.nextUrl.searchParams.get("next");
    const dest = nextParam ? nextParam : "/candidates";
    return NextResponse.redirect(new URL(dest, request.url));
  }

  // Logic 3: Allow all other requests
  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico|public).*)",
  ],
};