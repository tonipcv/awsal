import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getGoogleAuthUrl } from '@/lib/googleCalendar';

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

    // Generate Google OAuth URL
    const authUrl = getGoogleAuthUrl();

    return NextResponse.json({
      success: true,
      data: { authUrl },
      message: 'Google Calendar auth URL generated successfully',
    });
  } catch (error: any) {
    console.error('Error generating Google Calendar auth URL:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
