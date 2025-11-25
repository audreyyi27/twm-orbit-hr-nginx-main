import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function GET() {
  try {
    const cookieStore = await cookies(); // Add await here!
    
    // Get the access token
    const tokenCookie = cookieStore.get('access_token');
    
    // Get the user data
    const userCookie = cookieStore.get('user');

    // Check if token exists
    if (!tokenCookie || !tokenCookie.value) {
      return NextResponse.json(
        { 
          authenticated: false,
          error: 'No authentication token found' 
        },
        { status: 401 }
      );
    }

    // Parse user data if it exists
    let userData = null;
    if (userCookie && userCookie.value) {
      try {
        userData = JSON.parse(userCookie.value);
      } catch (error) {
        console.error('Failed to parse user cookie:', error);
      }
    }

    // Optional: Decode JWT to get user info if user cookie doesn't exist
    // This is a fallback - you might not need this if you always store user data
    if (!userData && tokenCookie.value) {
      try {
        // Basic JWT decode (without verification for now)
        // For production, you should verify the token signature
        const parts = tokenCookie.value.split('.');
        if (parts.length === 3) {
          const payload = JSON.parse(
            Buffer.from(parts[1], 'base64').toString('utf-8')
          );
          
          userData = {
            id: payload.sub,
            username: payload.username,
            role: payload.role
          };
        }
      } catch (error) {
        console.error('Failed to decode token:', error);
      }
    }

    return NextResponse.json({
      authenticated: true,
      user: userData,
      // Don't send the actual token value to the client
      hasToken: true,
      hasRefreshToken: !!cookieStore.get('refresh_token')
    });

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