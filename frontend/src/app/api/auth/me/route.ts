import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

// Get backend URL - must be absolute (not relative like /api)
// BACKEND_URL env var takes precedence, otherwise default to localhost:8000
const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:8000';

// Ensure the URL is absolute
function getBackendUrl(path: string): string {
  const baseUrl = BACKEND_URL.trim();
  // If it's already absolute, use it directly
  if (baseUrl.startsWith('http://') || baseUrl.startsWith('https://')) {
    return `${baseUrl}${path.startsWith('/') ? path : `/${path}`}`;
  }
  // Otherwise, prepend http:// (fallback, though BACKEND_URL should always be absolute)
  return `http://${baseUrl}${path.startsWith('/') ? path : `/${path}`}`;
}

export async function GET() {
  try {
    const cookieStore = await cookies();
    
    // Get the access token
    const tokenCookie = cookieStore.get('access_token');
    
    // Check if token exists - return 401 if missing
    if (!tokenCookie || !tokenCookie.value) {
      return NextResponse.json(
        { 
          authenticated: false,
          error: 'No authentication token found' 
        },
        { status: 401 }
      );
    }

    // Validate token with backend by calling /users/me endpoint
    // This ensures the token is actually valid and not expired
    try {
      const backendUrl = getBackendUrl('/users/me');
      const backendResponse = await fetch(backendUrl, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${tokenCookie.value}`,
          'Content-Type': 'application/json',
        },
      });

      if (!backendResponse.ok) {
        // Token is invalid or expired
        if (backendResponse.status === 401) {
          return NextResponse.json(
            { 
              authenticated: false,
              error: 'Invalid or expired token' 
            },
            { status: 401 }
          );
        }
        // Other backend errors
        return NextResponse.json(
          { 
            authenticated: false,
            error: 'Failed to validate token' 
          },
          { status: backendResponse.status }
        );
      }

      // Token is valid, get user data from backend
      const userData = await backendResponse.json();

      return NextResponse.json({
        authenticated: true,
        user: userData,
        hasToken: true,
        hasRefreshToken: !!cookieStore.get('refresh_token')
      });

    } catch (fetchError) {
      // Backend connection error
      console.error('Failed to validate token with backend:', fetchError);
      return NextResponse.json(
        { 
          authenticated: false,
          error: 'Failed to connect to backend server' 
        },
        { status: 503 }
      );
    }

  } catch (error) {
    console.error('Error getting auth status:', error);
    return NextResponse.json(
      { 
        authenticated: false,
        error: 'Internal server error' 
      },
      { status: 500 }
    );
  }
}