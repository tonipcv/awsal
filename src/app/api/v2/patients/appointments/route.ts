import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { createCalendarEvent } from '@/lib/googleCalendar';

// GET - List appointments for a patient
export async function GET(req: NextRequest) {
  try {
    // Get session and verify patient role
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      );
    }

    if (session.user.role !== 'PATIENT') {
      return NextResponse.json(
        { success: false, message: 'Only patients can access this endpoint' },
        { status: 403 }
      );
    }

    // Parse query parameters
    const searchParams = req.nextUrl.searchParams;
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const doctorId = searchParams.get('doctorId');
    const status = searchParams.get('status');

    // Build query filters
    const filters: any = {
      patientId: session.user.id,
    };

    if (startDate && endDate) {
      filters.startTime = {
        gte: new Date(startDate),
      };
      filters.endTime = {
        lte: new Date(endDate),
      };
    }

    if (doctorId) {
      filters.doctorId = doctorId;
    }

    if (status) {
      filters.status = status;
    }

    // Get appointments
    const appointments = await prisma.appointment.findMany({
      where: filters,
      include: {
        doctor: {
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
    // Get session and verify patient role
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      );
    }

    if (session.user.role !== 'PATIENT') {
      return NextResponse.json(
        { success: false, message: 'Only patients can create appointments' },
        { status: 403 }
      );
    }

    // Parse request body
    const body = await req.json();
    const { doctorId, startTime, endTime, title, notes } = body;

    // Validate required fields
    if (!doctorId || !startTime || !endTime || !title) {
      return NextResponse.json(
        { success: false, message: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Check if doctor exists
    const doctor = await prisma.user.findUnique({
      where: { id: doctorId, role: 'DOCTOR' },
    });

    if (!doctor) {
      return NextResponse.json(
        { success: false, message: 'Doctor not found' },
        { status: 404 }
      );
    }

    // Check if patient has a relationship with this doctor
    const relationship = await prisma.doctorPatientRelationship.findFirst({
      where: {
        doctorId,
        patientId: session.user.id,
      },
    });

    if (!relationship) {
      return NextResponse.json(
        { success: false, message: 'You are not a patient of this doctor' },
        { status: 403 }
      );
    }

    // Check if the slot is available
    const startDateTime = new Date(startTime);
    const endDateTime = new Date(endTime);
    
    const conflictingAppointment = await prisma.appointment.findFirst({
      where: {
        doctorId,
        status: { notIn: ['CANCELLED', 'NO_SHOW'] },
        OR: [
          {
            startTime: { lte: startDateTime },
            endTime: { gt: startDateTime },
          },
          {
            startTime: { lt: endDateTime },
            endTime: { gte: endDateTime },
          },
          {
            startTime: { gte: startDateTime },
            endTime: { lte: endDateTime },
          },
        ],
      },
    });

    if (conflictingAppointment) {
      return NextResponse.json(
        { success: false, message: 'This time slot is no longer available' },
        { status: 409 }
      );
    }

    // Create appointment
    const appointment = await prisma.appointment.create({
      data: {
        patientId: session.user.id,
        doctorId,
        startTime: startDateTime,
        endTime: endDateTime,
        status: 'SCHEDULED',
        title,
        notes,
      },
    });

    // Try to create Google Calendar event
    try {
      const googleCalendarConnected = await prisma.googleCalendarCredentials.findUnique({
        where: { doctorId },
      });

      if (googleCalendarConnected) {
        const eventId = await createCalendarEvent(doctorId, appointment);
        
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
