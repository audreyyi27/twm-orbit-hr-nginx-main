import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { access_token, refresh_token, user } = body;

    // Validate required fields
    if (!access_token) {
      return NextResponse.json(
        { error: 'Access token is required' },
        { status: 400 }
      );
    }

    const cookieStore = await cookies();

    // Set access token as httpOnly cookie
    cookieStore.set({
      name: 'access_token',
      value: access_token,
      httpOnly: true, // Prevents JavaScript access (XSS protection)
      // secure: process.env.NODE_ENV === 'production', // HTTPS only in production
      secure: false, // Set to false for HTTP (external IP without SSL)
      sameSite: 'lax', // CSRF protection - 'lax' works better for external IPs
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: '/', // Available to all routes
      // Don't set domain - allows cookies to work with IP addresses
    });

    // Set refresh token if provided
    if (refresh_token) {
      cookieStore.set({
        name: 'refresh_token',
        value: refresh_token,
        httpOnly: true,
        // secure: process.env.NODE_ENV === 'production',
        secure: false, // Set to false for HTTP (external IP without SSL)
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 30, // 30 days
        path: '/',
        // Don't set domain - allows cookies to work with IP addresses
      });
    }

    // Set user data (not httpOnly so client can read it if needed)
    if (user) {
      cookieStore.set({
        name: 'user',
        value: JSON.stringify(user),
        httpOnly: false, // Client can read this
        // secure: process.env.NODE_ENV === 'production',
        secure: false, // Set to false for HTTP (external IP without SSL)
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 7, // 7 days
        path: '/',
        // Don't set domain - allows cookies to work with IP addresses
      });
    }

    return NextResponse.json({ 
      success: true,
      message: 'Cookies set successfully'
    });

  } catch (error) {
    console.error('Error setting cookies:', error);
    return NextResponse.json(
      { error: 'Failed to set cookies' },
      { status: 500 }
    );
  }
}