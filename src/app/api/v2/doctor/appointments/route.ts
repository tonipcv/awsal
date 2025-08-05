import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { createCalendarEvent } from '@/lib/googleCalendar';

// GET - List appointments for a doctor
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
        { success: false, message: 'Only doctors can access appointments' },
        { status: 403 }
      );
    }

    // Parse query parameters
    const searchParams = req.nextUrl.searchParams;
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const patientId = searchParams.get('patientId');
    const status = searchParams.get('status');

    // Build query filters
    const filters: any = {
      doctorId: session.user.id,
    };

    if (startDate && endDate) {
      filters.startTime = {
        gte: new Date(startDate),
      };
      filters.endTime = {
        lte: new Date(endDate),
      };
    }

    if (patientId) {
      filters.patientId = patientId;
    }

    if (status) {
      filters.status = status;
    }

    // Get appointments
    const appointments = await prisma.appointment.findMany({
      where: filters,
      include: {
        patient: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
          },
        },
      },
      orderBy: {
        startTime: 'asc',
      },
    });

    return NextResponse.json({
      success: true,
      data: appointments,
      message: 'Appointments retrieved successfully',
    });
  } catch (error: any) {
    console.error('Error retrieving appointments:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST - Create a new appointment
export async function POST(req: NextRequest) {
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
        { success: false, message: 'Only doctors can create appointments' },
        { status: 403 }
      );
    }

    // Parse request body
    const body = await req.json();
    const { patientId, startTime, endTime, title, notes } = body;

    // Validate required fields
    if (!patientId || !startTime || !endTime || !title) {
      return NextResponse.json(
        { success: false, message: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Check if patient exists
    const patient = await prisma.user.findUnique({
      where: { id: patientId },
    });

    if (!patient) {
      return NextResponse.json(
        { success: false, message: 'Patient not found' },
        { status: 404 }
      );
    }

    // Create appointment
    const appointment = await prisma.appointment.create({
      data: {
        patientId,
        doctorId: session.user.id,
        startTime: new Date(startTime),
        endTime: new Date(endTime),
        status: 'SCHEDULED',
        title,
        notes,
      },
    });

    // Try to create Google Calendar event
    try {
      const googleCalendarConnected = await prisma.googleCalendarCredentials.findUnique({
        where: { doctorId: session.user.id },
      });

      if (googleCalendarConnected) {
        const eventId = await createCalendarEvent(session.user.id, appointment);
        
        // Update appointment with Google Event ID
        await prisma.appointment.update({
          where: { id: appointment.id },
          data: { googleEventId: eventId },
        });
      }
    } catch (calendarError) {
      console.error('Error creating Google Calendar event:', calendarError);
      // Continue without Google Calendar integration
    }

    return NextResponse.json({
      success: true,
      data: appointment,
      message: 'Appointment created successfully',
    });
  } catch (error: any) {
    console.error('Error creating appointment:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
