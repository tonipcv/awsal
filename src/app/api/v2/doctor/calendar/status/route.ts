import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
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
        { success: false, message: 'Only doctors can access Google Calendar status' },
        { status: 403 }
      );
    }

    // Check if doctor has connected Google Calendar
    const credentials = await prisma.googleCalendarCredentials.findUnique({
      where: { doctorId: session.user.id },
    });

    const isConnected = !!credentials;
    const authUrl = isConnected ? null : getGoogleAuthUrl();

    return NextResponse.json({
      success: true,
      data: {
        isConnected,
        authUrl,
        calendarId: credentials?.calendarId || null,
      },
      message: isConnected 
        ? 'Google Calendar is connected' 
        : 'Google Calendar is not connected',
    });
  } catch (error: any) {
    console.error('Error checking Google Calendar status:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
