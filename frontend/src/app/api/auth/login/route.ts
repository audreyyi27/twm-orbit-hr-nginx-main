import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

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

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    console.log('Login request received, forwarding to backend...');

    // Forward request to backend with absolute URL
    const backendUrl = getBackendUrl('/auth/login');
    console.log('Calling backend at:', backendUrl);
    
    const backendResponse = await fetch(backendUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });
    
    console.log('Backend response status:', backendResponse.status);

    // Check if response is JSON before parsing
    const contentType = backendResponse.headers.get('content-type');
    let data;
    
    if (contentType && contentType.includes('application/json')) {
      data = await backendResponse.json();
    } else {
      const text = await backendResponse.text();
      console.error('Backend returned non-JSON:', text);
      return NextResponse.json(
        { detail: 'Backend server error: Invalid response format' },
        { status: 500 }
      );
    }

    if (!backendResponse.ok) {
      return NextResponse.json(data, { status: backendResponse.status });
    }

    // Log the response structure for debugging
    console.log('Backend login response:', JSON.stringify(data, null, 2));

    // Return the response from backend (includes access_token, refresh_token, user, token_type)
    // The frontend Login component expects: access_token, refresh_token, user
    return NextResponse.json(data, { 
      status: backendResponse.status,
      headers: {
        'Content-Type': 'application/json',
      }
    });

  } catch (error) {
    console.error('Login proxy error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    
    // Check if it's a connection error
    if (errorMessage.includes('fetch failed') || errorMessage.includes('ECONNREFUSED')) {
      return NextResponse.json(
        { detail: 'Failed to connect to backend server. Please ensure the backend is running on port 8000.' },
        { status: 503 }
      );
    }
    
    return NextResponse.json(
      { detail: `Failed to process login request: ${errorMessage}` },
      { status: 500 }
    );
  }
}

