import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function GET() {
  try {
    const cookieStore = await cookies();
    const tokenCookie = cookieStore.get('access_token');

    if (!tokenCookie || !tokenCookie.value) {
      return NextResponse.json(
        { error: 'No token found' },
        { status: 401 }
      );
    }

    // Return the token so the client can use it
    return NextResponse.json({ 
      token: tokenCookie.value 
    });

  } catch (error) {
    console.error('Error getting token:', error);
    return NextResponse.json(
      { error: 'Failed to get token' },
      { status: 500 }
    );
  }
}