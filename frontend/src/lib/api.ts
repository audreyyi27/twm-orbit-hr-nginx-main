export const API_BASE =
  // process.env.NEXT_PUBLIC_API_BASE || "http://localhost:8000";
  process.env.NEXT_PUBLIC_API_BASE || "/api";

  
export async function apiFetch(path: string, options: RequestInit = {}) {
  let token: string | undefined = undefined;

  // For client-side requests, we need to get the token from our API route
  // since httpOnly cookies can't be read by JavaScript
  if (typeof window !== "undefined") {
    try {
      // Get auth status from our API route (which can read httpOnly cookies)
      const authRes = await fetch("/api/auth/get-token", {
        credentials: "include",
      });

      if (authRes.ok) {
        const data = await authRes.json();
        token = data.token;
      }
    } catch (error) {
      console.error("Failed to get auth token:", error);
    }
  } else {
    // SSR: In server components, you need to pass cookies from the request
    // This would need to be handled differently in server components
    // You'd need to pass the cookies from the server component context
    token = undefined;
  }

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const res = await fetch(`${API_BASE}${path}`, {
    headers,
    ...options,
  });

  if (res.status === 401) {
    // On unauthorized, clear cookies via API route
    if (typeof window !== "undefined") {
      try {
        await fetch("/api/auth/clear-cookies", {
          method: "POST",
          credentials: "include",
        });
        // Redirect to login
        window.location.href = "/";
      } catch (error) {
        console.error("Failed to clear cookies:", error);
      }
    }
    throw new Error("Unauthorized");
  }

  const text = await res.text();
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}
