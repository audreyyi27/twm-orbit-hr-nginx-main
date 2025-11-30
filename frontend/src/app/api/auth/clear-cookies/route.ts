import { NextResponse } from "next/server";
import { cookies } from "next/headers";

export const dynamic = "force-dynamic";

// Shared cookie deletion logic
async function clearCookies() {
  const cookieStore = await cookies();

  const del = (
    name: string,
    opts?: {
      path?: string;
      domain?: string;
      secure?: boolean;
      sameSite?: "lax" | "strict" | "none";
    }
  ) => {
    // Delete cookie with various configurations to ensure it's cleared
    cookieStore.delete(name);
    cookieStore.set({
      name,
      value: "",
      httpOnly: name !== "user",
      secure: false, // Match the secure setting used when setting the cookie
      sameSite: "lax",
      path: "/",
      maxAge: 0,
      expires: new Date(0),
      ...opts,
    });
  };

  del("access_token");
  del("refresh_token");
  del("user");
}

// GET handler - clears cookies and redirects to login
export async function GET(request: Request) {
  await clearCookies();

  // Redirect to login page after clearing cookies
  const url = new URL("/", request.url);
  const res = NextResponse.redirect(url);
  res.headers.set(
    "Cache-Control",
    "no-store, no-cache, must-revalidate, private"
  );
  return res;
}

// POST handler - returns JSON
export async function POST() {
  await clearCookies();

  const res = NextResponse.json({ success: true });
  res.headers.set(
    "Cache-Control",
    "no-store, no-cache, must-revalidate, private"
  );
  return res;
}