import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname;
  const token = request.cookies.get("access_token");
  
  // ✅ DEBUG LOGGING (optional - remove in production)
  // console.log(`[Middleware] Path: ${path}, Has Token: ${!!token}`);

  const protectedRoutes = ["/candidates", "/reports", "/dashboard"];
  const isProtectedRoute = protectedRoutes.some(
    (route) => path === route || path.startsWith(route + "/")
  );

  // Logic 1: If user DOESN'T have token and tries to access protected route, redirect to login
  if (!token && isProtectedRoute) {
    // console.log("❌ No token found, redirecting to login");
    return NextResponse.redirect(new URL("/", request.url));
  }

  // Logic 2: If user HAS token and tries to access login page, redirect to candidates
  // IMPORTANT: Only redirect if explicitly on "/" to avoid redirect loops
  if (token && path === "/" && !isProtectedRoute) {
    // console.log("✅ User has token, redirecting from login to /candidates");
    return NextResponse.redirect(new URL("/candidates", request.url));
  }

  // Logic 3: Allow all other requests
  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico|public).*)",
  ],
};