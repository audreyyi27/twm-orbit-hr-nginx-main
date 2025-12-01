import { NextResponse } from "next/server";
import { cookies } from "next/headers";

// BACKEND_URL env var takes precedence, otherwise default to localhost:8000
const BACKEND_URL = process.env.BACKEND_URL || "http://localhost:8000";

function getBackendUrl(path: string): string {
  const baseUrl = BACKEND_URL.trim();
  if (baseUrl.startsWith("http://") || baseUrl.startsWith("https://")) {
    return `${baseUrl}${path.startsWith("/") ? path : `/${path}`}`;
  }
  return `http://${baseUrl}${path.startsWith("/") ? path : `/${path}`}`;
}

// Stabilized /api/auth/me:
// - ALWAYS returns 200
// - authenticated: true + user from backend when token is valid
// - authenticated: false when token missing/invalid, but no 401 to avoid redirect loops
export async function GET() {
  try {
    const cookieStore = await cookies();
    const tokenCookie = cookieStore.get("access_token");

    // No token → unauthenticated, but not an error
    if (!tokenCookie || !tokenCookie.value) {
      return NextResponse.json(
        { authenticated: false, user: null, hasToken: false },
        { status: 200 }
      );
    }

    try {
      const backendUrl = getBackendUrl("/users/me");
      const backendResponse = await fetch(backendUrl, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${tokenCookie.value}`,
          "Content-Type": "application/json",
        },
      });

      if (!backendResponse.ok) {
        // Token invalid or backend error → treat as unauthenticated but keep 200.
        // We intentionally do NOT warn every time to avoid noisy logs in dev.
        return NextResponse.json(
          {
            authenticated: false,
            user: null,
            hasToken: true,
            error: "Token invalid or expired",
          },
          { status: 200 }
        );
      }

      const userData = await backendResponse.json();

      return NextResponse.json(
        {
          authenticated: true,
          user: userData,
          hasToken: true,
          hasRefreshToken: !!cookieStore.get("refresh_token"),
        },
        { status: 200 }
      );
    } catch (fetchError) {
      console.error("Failed to validate token with backend:", fetchError);
      return NextResponse.json(
        {
          authenticated: false,
          user: null,
          hasToken: true,
          error: "Failed to connect to backend",
        },
        { status: 200 }
      );
    }
  } catch (error) {
    console.error("Error getting auth status:", error);
    return NextResponse.json(
      {
        authenticated: false,
        user: null,
        hasToken: false,
        error: "Internal error",
      },
      { status: 200 }
    );
  }
}