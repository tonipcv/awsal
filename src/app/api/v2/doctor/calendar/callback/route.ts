import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { handleGoogleAuthCallback } from '@/lib/googleCalendar';

export async function GET(req: NextRequest) {
  try {
    // Get session and verify doctor role
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      );
    }

    if (session.user.role !== 'DOCTOR') {
      return NextResponse.json(
        { success: false, message: 'Only doctors can connect Google Calendar' },
        { status: 403 }
      );
    }

    // Get authorization code from query parameters
    const searchParams = req.nextUrl.searchParams;
    const code = searchParams.get('code');
    
    if (!code) {
      return NextResponse.json(
        { success: false, message: 'Authorization code is missing' },
        { status: 400 }
      );
    }

    // Handle Google OAuth callback and save credentials
    await handleGoogleAuthCallback(code, session.user.id);

    // Redirect to calendar settings page
    return NextResponse.redirect(new URL('/doctor/calendar/settings', req.url));
  } catch (error: any) {
    console.error('Error handling Google Calendar callback:', error);
    
    // Redirect to error page
    const errorUrl = new URL('/doctor/calendar/error', req.url);
    errorUrl.searchParams.set('message', error.message || 'Failed to connect Google Calendar');
    
    return NextResponse.redirect(errorUrl);
  }
}
